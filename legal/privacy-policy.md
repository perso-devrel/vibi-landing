# Privacy Policy

**Effective date:** June 8, 2026
**Last updated:** June 27, 2026

This Privacy Policy explains how **vibi** ("**vibi**", "**we**", "**us**", or "**our**") collects, uses, shares, and protects information when you use the **vibi** mobile application (the "**App**"; iOS bundle `com.vibi.ios`, Android package `com.vibi.app`), the **vibi panel for Adobe Premiere Pro** (the "**Plugin**"), and our related backend services (together, the "**Service**"). The App and the Plugin share the same vibi account and backend.

By using the Service, you agree to the practices described here. If you do not agree, please do not use the Service.

---

## 1. Who we are (Data Controller)

| | |
|---|---|
| **Service** | vibi |
| **Operator** | Park Jungeun (박정은) |
| **Country of establishment** | Republic of Korea |
| **Privacy contact** | jepark2934@gmail.com |

If you are in the EU/EEA or UK and have questions about how we handle your data, contact us at the address above and we will respond.

---

## 2. The data we collect

We only collect what the App needs to function. The App shows **optional, user-initiated rewarded ads** through Google AdMob (see **§2.6**); apart from AdMob we use **no analytics or other third-party tracking SDKs**, and we do not use your uploaded media or account content to target ads.

### 2.1 Information you provide
- **Account information** — when you sign in with Google or Apple, we receive your **email address**, **display name**, and a provider **user identifier**. With Sign in with Apple you may choose to hide your email (Apple relay address).
- **Media you upload for editing** — the **video and audio files** you select to process (e.g., for voice/music separation and rendering). In the Plugin this is the audio from a local file or from a clip in your Premiere Pro project/timeline. We also receive the project settings you create (segment timings, audio levels, language/speaker selection).

### 2.2 Information created when you use the Service
- **Processed media** — derived audio stems, **timecoded transcripts / diarized scripts (which include the words spoken in your audio and the speaker labels assigned to them)**, and rendered videos produced from your uploads.
- **Account identifiers** — an internal user ID and authentication token (JWT) issued by our backend.
- **Credit balance and usage** — how many credits you hold and consume. New accounts receive a small number of free credits.
- **Purchase records** — if and when paid credits become available, the app store sends us a **receipt / purchase token**, **product ID**, **platform** (Apple or Google), and **transaction ID**. We never receive or store your full payment card details — payment is handled by Apple or Google.

### 2.3 Information collected automatically
- **Crash data** — if the App crashes, the operating system (Apple / Google) may provide us diagnostic crash logs. We do **not** embed a third-party crash-reporting SDK.
- **Technical data needed to deliver content** — e.g., IP address and request metadata that our backend necessarily processes to route and secure network requests.
- **Advertising data** — only if you choose to watch a rewarded ad, Google AdMob collects advertising identifiers and related device / ad-interaction data; see **§2.6**.

### 2.4 Device permissions
The App requests these permissions only for the stated purpose, and only when needed:

| Permission | Platform | Why |
|---|---|---|
| Microphone | iOS / Android | Record audio to insert into your timeline |
| Photo library (read) | iOS / Android | Let you pick a video to edit |
| Save to photo library | iOS / Android | Save the finished video to your device |

The **Plugin** does not use mobile device permissions. It reads only the audio you choose — a local file, or a clip from your Premiere Pro project/timeline — and writes results back to the location you select, using the local file access Adobe Premiere Pro grants it.

We do **not** collect location, contacts, or health data.

### 2.5 Children
The Service is **not directed to children under 14**. We do not knowingly collect data from children below that age (or below the higher minimum required in your country — e.g., consent ages of up to 16 in parts of the EU). If you believe a child has provided us data, contact us at jepark2934@gmail.com and we will delete it.

### 2.6 Advertising (Google AdMob)
The App offers **optional rewarded ads**: you may choose to watch a short video ad to receive a free credit. This feature is **user-initiated** — we do not show ads unless you tap to watch one, and the Premiere Pro Plugin shows no ads. Rewarded ads are served by **Google AdMob**.

To serve these ads, Google AdMob collects and processes:
- **Advertising identifiers** — Apple's Identifier for Advertisers (IDFA) where available, and the Android Advertising ID (AAID);
- **Device and connection data** — device model, OS version, IP address, and coarse location inferred from IP;
- **Ad-interaction data** — that an ad was requested, shown, or completed.

We do **not** use the audio or video you upload for advertising. Credits you earn from ads are granted through Google's **server-side verification**, from which we receive only your vibi user ID and the reward confirmation — not your payment details.

Depending on your region and settings, ads may be **personalized** or **non-personalized**. In the **EEA, UK, and Switzerland** we ask for your consent, where required, before showing personalized ads. You can opt out of ad personalization and reset your advertising identifier at any time in your device settings (iOS: *Settings → Privacy & Security → Apple Advertising*, and *Tracking*; Android: *Settings → Google → Ads*). On iOS, if an ad would track you across other companies' apps and sites, the system **App Tracking Transparency** prompt lets you allow or deny it.

Google's processing of this data is governed by Google's own policies (see **§12**).

---

## 3. How we use your data

| Purpose | Examples | Legal basis (GDPR) |
|---|---|---|
| Provide the core Service | Authenticate you; upload, separate, and render your media | Performance of a contract (Art. 6(1)(b)) |
| Process purchases | Validate store receipts; grant credits | Performance of a contract |
| Keep the Service secure and working | Prevent abuse, debug crashes | Legitimate interests (Art. 6(1)(f)) |
| Comply with law | Tax, accounting, responding to lawful requests | Legal obligation (Art. 6(1)(c)) |
| Communicate with you | Service or account notices | Contract / legitimate interests |
| Show optional rewarded ads | Serve a rewarded video ad when you choose to watch one, and grant the earned credit | Consent (Art. 6(1)(a)) for personalized ads; legitimate interests (Art. 6(1)(f)) for non-personalized ads |

We do **not** sell your personal data, and we do **not** use your uploaded media or account content for advertising or to train third-party models. The App does show **optional, user-initiated rewarded ads** via Google AdMob, which uses the advertising data described in **§2.6**.

---

## 4. How your media is processed

When you process media (in the App or the Plugin), we upload it to our backend, to our AI processing provider **Perso** (perso.ai) — which performs the audio separation and speech transcription — and to **Cloudflare R2** object storage. Processing is automated. Your uploaded source files and the derived results are retained only as described in **§7**.

---

## 5. Who we share data with

We share data only with the service providers ("processors") needed to run the Service:

| Recipient | Purpose | Data shared |
|---|---|---|
| **Google** (Sign-In) | Authentication | OAuth token, profile basics |
| **Apple** (Sign in with Apple) | Authentication | OAuth token, profile basics |
| **Apple App Store / Google Play** | Process in-app purchases | Purchase receipt / token |
| **Perso** (perso.ai) | AI audio separation & speech transcription | Uploaded audio; derived stems and transcript |
| **Cloudflare** (R2 object storage) | Store and transfer your media | Uploaded media, rendered output |
| **Paddle** | Process web/desktop credit purchases, where offered (e.g. via the Plugin) | Purchase / transaction details (no card data) |
| **Google** (AdMob) | Serve optional rewarded ads (App only) | Advertising identifier, device / connection data, ad-interaction data (see §2.6) |

We may also disclose data when **required by law**, to **enforce our Terms**, or in connection with a **merger, acquisition, or sale of assets** (you will be notified of any such change).

Apart from the advertising identifiers shared with **Google AdMob** to serve the optional rewarded ads described in **§2.6**, we do **not** share your data with advertisers or data brokers, and we do not sell your data.

---

## 6. International data transfers

We are based in the **Republic of Korea**, and our service providers (including Cloudflare) may process and store data on servers located outside your country, in the regions where those providers operate their global infrastructure. Where we transfer personal data out of the EEA/UK, we rely on appropriate safeguards such as the **EU Standard Contractual Clauses** (and the UK Addendum). Cross-border transfers affecting Korean users are handled in accordance with **PIPA Art. 28-8**. Contact us for a copy of the relevant safeguards.

---

## 7. How long we keep data

| Data | Retention |
|---|---|
| Account data (email, name, user ID) | Until you delete your account, then removed within **30 days** |
| Uploaded source media | Deleted within **72 hours** of job completion |
| Separation results you keep as history (stems + transcript) | Until you delete them, or up to **90 days** |
| Rendered output | Until you delete it, or up to **30 days** |
| Purchase records | As required by tax/accounting law (typically **5 years**) |
| Crash logs | **90 days** |
| Advertising identifiers & ad-interaction data | Collected and retained by **Google AdMob** under Google's policies; we do not store them ourselves |

---

## 8. Your rights

Depending on where you live, you have some or all of the following rights. To exercise any of them, contact **jepark2934@gmail.com**. We will respond within the time the law requires (e.g., 30 days under GDPR, 45 days under CCPA). You can also **delete your account in the mobile App** (Settings → Account), or **request deletion by emailing us** at the address above (including if you only use the Premiere Pro Plugin) — either removes your account data.

### 8.1 EU / EEA & UK (GDPR / UK GDPR)
Access, rectification, erasure, restriction, portability, objection, and the right to withdraw consent. You may also lodge a complaint with your local supervisory authority.

### 8.2 California (CCPA/CPRA)
The right to know, delete, correct, and to opt out of the "sale" or "sharing" of personal information. We do **not sell** your personal information. If we show **personalized** ads, the sharing of advertising identifiers with Google for cross-context behavioral advertising may count as **"sharing"** under the CPRA — you can opt out at any time using your device's ad settings (see **§2.6**), and we honor opt-out preference signals where required. We do not "sell" or "share" any other personal information, and we will not discriminate against you for exercising your rights.

### 8.3 Korea (PIPA / 개인정보 보호법)
The right to access, correct, delete, suspend processing of, and withdraw consent for your personal information. You may contact us using the details in §1 and may also file a report with the Personal Information Protection Commission (개인정보분쟁조정위원회 / privacy.go.kr).

### 8.4 Other regions
We extend equivalent rights to users elsewhere on request, to the extent applicable law allows.

---

## 9. Security

We protect your data with encryption in transit (HTTPS/TLS), access controls, token-based authentication (your sign-in token is kept in the device's secure storage — the **iOS Keychain** or **Android private app storage**, excluded from device backups), and presigned, time-limited URLs for media transfer. No method of transmission or storage is 100% secure, but we work to protect your information and will notify you and regulators of a breach where the law requires.

---

## 10. Account deletion

You can delete your account at any time from within the mobile App (Settings → Account), or by emailing **jepark2934@gmail.com** from any platform (including the Premiere Pro Plugin, which does not have an in-panel deletion control). Deletion removes your account data per **§7**. Some records may be retained where the law requires (e.g., purchase/tax records).

---

## 11. Do Not Track

Apart from the optional rewarded-ad advertising described in **§2.6**, the App contains no third-party tracking. To control ad tracking, use your device's ad settings (and, on iOS, the App Tracking Transparency prompt) as described in **§2.6**. We do not respond to browser "Do Not Track" signals because the App is not a website.

---

## 12. Third-party services

Signing in with Google or Apple, purchasing through the App Store or Google Play, and the ads served by Google AdMob are governed by **their** privacy policies in addition to ours:
- Google (Sign-In and AdMob ads): https://policies.google.com/privacy
- How Google uses data from apps that use its services: https://policies.google.com/technologies/partner-sites
- Apple: https://www.apple.com/legal/privacy/

---

## 13. Changes to this policy

We may update this policy. If we make material changes, we will notify you in the App or by email and update the "Last updated" date. Continued use after changes means you accept the updated policy.

---

## 14. Contact us

Questions or requests: **jepark2934@gmail.com**

See also our [Terms of Service](/terms).
