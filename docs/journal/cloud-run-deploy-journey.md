# Cloud Run + GitHub Actions deploy journal — where the YAML cuts

Eight commits over two days took vibi-bff from a `./gradlew run` localhost script to a Cloud Run service redeployed on every `main` push, with no service-account JSON anywhere in GitHub. Each item below is something that was *not visible at the design step* and only surfaced when running `gcloud` or `gh workflow run` against the live cloud.

The route I went is: bake `Dockerfile` + a bootstrap script first (`9468245`), wire up GitHub Actions with WIF (`772005a`), then absorb the surprises one at a time.

## Pitfall 1 — `cloud-run.sh` set up SA + secrets, but not the WIF pool

**Visible symptom**: the first `gh workflow run deploy` failed at the auth step with `invalid_target — pool or provider 'projects/.../locations/global/workloadIdentityPools/github-pool/providers/github-provider' doesn't exist`. The bootstrap script had finished without errors. The service account existed. Secret Manager was populated. `gcloud run deploy` worked from my laptop. Yet GitHub Actions couldn't authenticate.

**Cause**: `deploy/cloud-run.sh` enables APIs, creates the runtime service account, seeds Secret Manager, and runs the first `gcloud run deploy`. That's everything Cloud Run needs to *run*. But to let GitHub Actions deploy *without a JSON key*, a separate Workload Identity Federation pool + OIDC provider has to exist, and the runtime SA needs a `roles/iam.workloadIdentityUser` binding scoped to your specific GitHub repo. Those are pre-conditions for GitHub's OIDC token, not Cloud Run's; the bootstrap script doesn't touch them.

**Fix**: split the setup into two parts and documented them apart. `cloud-run.sh` keeps Cloud Run concerns; `deploy/GITHUB_ACTIONS_SETUP.md` (`6f6c2db`) walks through `workload-identity-pools create` + `providers create-oidc` + the `principalSet://.../attribute.repository/<owner>/<repo>` binding. The hand-off between the two is exactly one variable: `GCP_WIF_PROVIDER` (a resource path string of the form `projects/<number>/locations/global/workloadIdentityPools/<pool>/providers/<provider>`) goes into GitHub Secrets, and the WIF action picks it up at deploy time.

**Observation**: it's a clean illustration of the *runtime SA vs. deploy-time identity* distinction. The runtime SA only needs Cloud Run, Secret Manager, and Vertex AI access. The deploy-time identity (the same SA, in our case, but via federated principal) needs *additionally* `roles/run.admin`, `roles/cloudbuild.builds.builder`, `roles/artifactregistry.writer`, `roles/storage.admin`, `roles/logging.logWriter`. Bundling them feels natural; teasing them apart is the work.

## Pitfall 2 — `attribute-condition` rejected my own org

**Visible symptom**: WIF pool and provider both created cleanly. The deploy step then failed with `unauthorized_client — repository not allowed`.

**Cause**: the OIDC provider was created with `--attribute-condition="assertion.repository_owner=='perso-devrel'"`, but my initial guide had a placeholder example that read `dubcast-ai` (the project's previous codename). I'd copy-pasted from the example. The condition gates *which GitHub org's token can be exchanged at all* — a wrong owner string blocks every deploy regardless of the SA bindings.

**Fix**: replace the placeholder with the actual org (`4d7e13f`). One commit, one string. The trigger for catching it was `9319003 — trigger deploy after WIF attribute condition fix` — i.e. a no-op commit whose only purpose was to fire the workflow once the underlying GCP config had been corrected.

**Observation**: GitHub's OIDC system has two filters in series — the *provider's* `attribute-condition` (which org), and the *SA's* `principalSet` binding (which repo). Both must pass. The error messages don't tell you which one rejected you, so the diagnosis order is "check the provider condition first, then the SA binding."

## Pitfall 3 — commas in env values broke `--set-env-vars`

**Visible symptom**: after switching `CORS_ALLOWED_ORIGINS` from a single origin to `https://vibi.fm,https://www.vibi.fm`, every deploy failed with `argument --set-env-vars: Bad syntax for dict arg: [https://www.vibi.fm]`. `gcloud` was parsing the second comma as a new `KEY=VALUE` entry and trying to read `https://www.vibi.fm` as a key.

**Cause**: `gcloud run deploy --set-env-vars` defaults to `,` as both the entry separator and the comma-in-value separator. There's no escape sequence; you have to swap the separator entirely.

**Fix** (`3500203`): use `gcloud`'s alternative-delimiter syntax — prefix the value with `^<char>^` to designate `<char>` as the new separator. We picked `@`:

```yaml
--set-env-vars "^@^GEMINI_PROJECT_ID=${GEMINI_PROJECT_ID}@GEMINI_LOCATION=${GEMINI_LOCATION}@..."
```

The same pattern is applied to `--update-env-vars` (for the post-deploy `BFF_BASE_URL` wire-up) and to `cloud-run.sh`'s bootstrap call.

**Observation**: this is the kind of pitfall that *only triggers when the data shape changes*. Single-origin CORS worked for weeks. The moment we needed two origins, the workflow regressed in a way that has nothing to do with the workflow's logic. The fix is to *always use the alternative delimiter, even when the values don't currently need it* — so the workflow is robust to future comma values without anyone having to remember the rule.

## Pitfall 4 — `GCP_PROJECT_ID` was being asked to mean two different things

**Visible symptom**: not an error — a design smell. The GitHub secret `GCP_PROJECT_ID` was being read by both the WIF auth step (telling Cloud Run *which project to deploy to*) and the application's `application.conf` (telling Vertex AI *which project hosts Gemini*). They happened to be the same value in early dev, but we wanted to host the BFF in one GCP project and call Gemini from a different one where Vertex AI was already enabled with a separate quota.

**Cause**: a single `GCP_*` namespace served two unrelated purposes. Anyone reading the workflow couldn't tell which `GCP_PROJECT_ID` reference meant which thing without chasing the call site.

**Fix** (`d17e2a7`): rename the *Vertex AI* side to `GEMINI_PROJECT_ID` / `GEMINI_LOCATION`. The Cloud Run deploy-time `GCP_PROJECT_ID` stayed put. The two are now textually distinguishable everywhere they appear:

```hocon
gemini {
    projectId = ${?GEMINI_PROJECT_ID}        # Vertex AI project (separable)
    location  = ${?GEMINI_LOCATION}
}
```

The workflow declares `GEMINI_PROJECT_ID` as a literal in `env:` (since it's not a secret), and the runtime falls back to ADC via the Cloud Run attached SA — see pitfall 5.

**Observation**: env var names are a small piece of the API contract between the workflow and the app. Conflating two meanings under a generic name *worked* until we needed to separate them, then it took a coordinated rename across `application.conf`, `cloud-run.sh`, `.env.example`, and `AppConfig` validation messages. Picking semantic names (`GEMINI_*` for Vertex, `GCP_*` for deploy target) upfront would have saved the rename.

## Pitfall 5 — `GeminiClient` had no path for "no service account JSON"

**Visible symptom**: first Cloud Run revision booted, served `/api/v2/languages` (Perso) fine, then 500'd on the first `/api/v2/chat` call with `Could not load credentials: file path not specified`.

**Cause**: `GeminiClient` was originally written for local dev — it required `GOOGLE_APPLICATION_CREDENTIALS` to point at a service-account JSON. On Cloud Run, you intentionally don't ship a JSON key — the runtime gets credentials from the attached SA via the metadata server, which `GoogleCredentials.getApplicationDefault()` discovers automatically. Our code never reached that branch.

**Fix** (`9468245`): when `credentialsPath` is blank, fall back to `GoogleCredentials.getApplicationDefault()`. The same call resolves to the metadata-server credential on Cloud Run, the `gcloud auth application-default login` cache locally, or `$GOOGLE_APPLICATION_CREDENTIALS` if that env var is set — three environments, one resolver.

```kotlin
val credentials = if (credentialsPath.isNotBlank()) {
    GoogleCredentials.fromStream(File(credentialsPath).inputStream())
} else {
    GoogleCredentials.getApplicationDefault()
}
```

`GeminiConfig`'s validation is also deferred until first call, so a dev environment without Vertex AI configured can still boot.

**Observation**: ADC is the "convention" path — once you take it, the same client code runs on a laptop, on a CI runner, and on Cloud Run with no per-env branching. The non-obvious part is that it's *opt-in by writing less code*, not by writing more. The temptation when adding Cloud Run support was to add an `if (onCloudRun) ...` branch; the fix is the opposite — collapse the branch.

## Pitfall 6 — `.env.example` accumulated noise faster than it got read

**Visible symptom**: the initial cleanup pass (`369945f`) grouped `.env.example` into sections (Server / Auth / Perso / Gemini / Separation), marked required values, and added every optional knob with sensible defaults. Result: 35 lines of mostly defaults. The next day (`9931223`), I had to trim it back to 7 lines.

**Cause**: an `.env.example` does two jobs at once — it's a *list of values you must set* and a *reference for what's tunable*. Treating it as the reference pulls in 25+ rarely-touched vars and buries the seven that fail-fast at boot. New contributors copy the whole file, fill the obvious ones, miss the buried ones, and crash at startup.

**Fix** (`9931223`): keep only the values that crash boot if missing (`PERSO_API_KEY`, `PERSO_SPACE_SEQ`, `AUTH_JWT_SECRET`, `SEPARATION_SIGNING_SECRET`, `GOOGLE_OAUTH_CLIENT_IDS`) plus the *optional* `GOOGLE_APPLICATION_CREDENTIALS` (intentional, with a comment that blank means ADC). The full reference lives in [`../reference/environment.md`](../reference/environment.md). The `.env.example` is now a *boot prerequisites checklist*, not a configuration manual.

**Observation**: two artifacts, two purposes. The boot prerequisites checklist should be short enough that a missing line is conspicuous. The configuration manual should be exhaustive enough that any tunable can be found. Letting one file try to be both makes both jobs worse.

## Pitfall 7 — every deploy redid env wiring, except when it didn't

**Visible symptom**: an early Cloud Run revision was missing `STORAGE_PATH` because the bootstrap script had set it but a later deploy from CI hadn't. Looking at the workflow, only the secrets were being re-wired; plain env vars were assumed to persist across revisions.

**Cause**: `gcloud run deploy` *does* persist `--set-env-vars` across revisions when you don't pass the flag, *unless* a different revision tool — `gcloud run services update`, the console UI, or an unrelated `--set-env-vars` call elsewhere — has overwritten them. With two paths writing env (bootstrap and workflow), it's easy for them to drift, and the drift only surfaces when something missing is finally read.

**Fix** (`e2a561c`): make the workflow *declaratively own* every runtime knob it cares about. Each `deploy.yml` deploy step explicitly passes the runtime SA, the full env-vars set (`GEMINI_*`, `PERSO_*`, `STORAGE_PATH`, `GOOGLE_OAUTH_CLIENT_IDS`, `CORS_ALLOWED_ORIGINS`, `GCS_BUCKET`), the full secrets set, the execution environment (`gen2`), CPU/memory/timeout/concurrency/min-max instances, and session affinity. The bootstrap script's first-time wiring still works, but every subsequent deploy *re-asserts* everything regardless of what the previous revision was.

**Observation**: the question "is this revision configured the same way as the last one?" turns from "look at the deployment history and reason about deltas" into "look at the workflow file." For a team with a single CI workflow, that's a meaningful drop in the cost of auditing a production change.

## Pitfall 8 — `BFF_BASE_URL` self-referenced *after* deploy

**Visible symptom**: in the early Cloud Run revisions, `BFF_BASE_URL` was still `http://localhost:8080` (the application.conf default), so download URLs handed back to mobile clients were invalid. Setting `BFF_BASE_URL` in `cloud-run.sh` worked the first time, but a fresh service deployed in a different project would need someone to compute the Cloud Run URL by hand and feed it back.

**Cause**: there are two valid sources for `BFF_BASE_URL`:
1. A custom domain you own (`https://api.example.com`) — known at config time.
2. The Cloud Run-issued URL (`https://vibi-bff-XXXX-uc.a.run.app`) — only known *after* the first deploy.

Either should work, and switching between them shouldn't require code changes.

**Fix** (`e0aa15e`): the workflow has an explicit post-deploy `Wire BFF_BASE_URL` step. It first checks `vars.BFF_BASE_URL` (a GitHub Variable, set when you own a custom domain). If empty, it queries the freshly-deployed service for its Cloud Run URL via `gcloud run services describe` and uses *that*. Either way, the value is then applied with `--update-env-vars` so the *current* revision sees it.

```yaml
- name: Wire BFF_BASE_URL
  run: |
    VAR_URL="${{ vars.BFF_BASE_URL }}"
    if [ -n "$VAR_URL" ]; then
      URL="$VAR_URL"
    else
      URL=$(gcloud run services describe "$SERVICE_NAME" ... --format='value(status.url)')
    fi
```

**Observation**: this is the same shape as the ADC fallback in pitfall 5 — *one variable, one resolver, three sources*. The custom-domain path is for production; the self-reference fallback is for everything else. New contributors don't have to decide; they just leave the variable blank and the workflow does the right thing.

## What the cumulative shape looks like

```
.github/workflows/deploy.yml       (declarative — owns every runtime knob)
├── Auth via WIF (secrets: GCP_WIF_PROVIDER, GCP_SA_EMAIL, GCP_PROJECT_ID)
├── --set-env-vars "^@^KEY=val@KEY=val..."   (^@^ delimiter, comma-safe)
│     ├── GEMINI_PROJECT_ID (literal env: block — cross-project capable)
│     ├── GOOGLE_OAUTH_CLIENT_IDS (secret, comma-bearing)
│     ├── CORS_ALLOWED_ORIGINS (vars, comma-bearing)
│     └── GCS_BUCKET (vars, optional — toggles signed-URL redirect)
├── --set-secrets PERSO_API_KEY, PERSO_SPACE_SEQ, AUTH_JWT_SECRET,
│                 SEPARATION_SIGNING_SECRET   (Secret Manager refs)
└── Post-deploy: Wire BFF_BASE_URL (vars first, Cloud Run URL fallback)

vibi-bff/
├── Dockerfile                     (multi-stage JDK21→JRE21+ffmpeg, MaxRAMPercentage=75)
├── deploy/cloud-run.sh            (one-shot bootstrap: APIs, SA, secrets, first deploy)
├── deploy/GITHUB_ACTIONS_SETUP.md (WIF pool + provider + repo-scoped SA binding)
├── .env.example                   (boot prerequisites only — 7 lines)
└── application.conf               (GEMINI_* separate from any GCP_* secret)
```

## Lessons that generalize beyond Cloud Run

- **Bootstrap and the workflow do not overlap.** Decide which one owns each piece of state. The bootstrap is for things that need to exist *before the workflow can run at all* (SA, Secret Manager seeds, the first deploy that pins service identity). Everything else lives in the workflow so a single file is the source of truth.
- **`gcloud --set-env-vars` always uses `^@^`.** Even when the values currently have no commas. The future "we needed two origins" pitfall takes ~20 minutes to diagnose; the up-front cost is one extra character.
- **ADC is the convention path.** When code branches on "are we on Cloud Run?", look first for a way to delete the branch. The credential/URL/region resolvers usually have a "do the right thing per-env" mode that's strictly less code to write.
- **Two artifacts, two purposes.** A `.env.example` is a checklist of what blocks boot. A `reference/environment.md` is the exhaustive tunable list. Mixing them makes both jobs worse.
- **Declarative deploy wiring beats incremental wiring.** Once a workflow declares all runtime knobs, "is this revision configured the same way?" turns into a file diff.

## Related reading

- [`../reference/environment.md`](../reference/environment.md) — the exhaustive env-var table this journal pares back from
- [`../how-to/deploy-your-own-bff.md`](../how-to/deploy-your-own-bff.md) — the step-by-step deploy guide, end-state version
- [`ios-pitfalls-with-kmp.md`](./ios-pitfalls-with-kmp.md) — the same shape on the iOS side
- [`operating-rules.md`](./operating-rules.md) — the "known-bug logging policy" this journal is an instance of
