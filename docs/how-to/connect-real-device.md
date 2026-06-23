# Connecting the BFF from a physical device

If the emulator/simulator talks to the BFF fine but a physical device hits a connect timeout, it's usually one of four things — **BFF bind address / Mac LAN IP / firewall / platform network policy**.

Walk through them in order and it's usually resolved within 5 minutes.

---

## 1. Is the BFF bound to 0.0.0.0?

It boots that way by default. Look for this line in the startup log:

```
Responding at http://0.0.0.0:8080
```

If you see `127.0.0.1:8080`, the BFF is only listening on loopback and nothing on the LAN can reach it. Switch Ktor's host setting to `0.0.0.0`, or check `ktor.deployment.host = "0.0.0.0"` in `application.conf`.

## 2. Check the Mac LAN IP

```bash
ipconfig getifaddr en0      # Wi-Fi (macOS)
# or list IPs across all interfaces
ifconfig | grep "inet "
```

From a phone on the same Wi-Fi, check that the Mac's IP is pingable:

```bash
ping <mac_IP>
```

If you get `Request timeout` → either you're not on the same LAN (guest Wi-Fi, different SSID), or the Mac firewall is blocking ICMP. If it's the former, move onto the same SSID.

## 3. Check the Mac firewall

System Settings → Network → Firewall.

If the firewall is on:
- Temporarily turn it off → on the phone, check `http://<mac_IP>:8080/healthz` returns `200` in the browser
- If it opens, the firewall is the cause. Add an allow rule for Java (or `gradle` / `wrapper`) in Firewall Options

If you're on a corporate network where you can't turn off the firewall, or router-side client isolation is on → use ngrok as a workaround (see Option B in [`deploy-your-own-bff.md`](./deploy-your-own-bff.md)).

## 4. iOS physical device — ATS (App Transport Security)

iOS defaults to https only. Cleartext like `http://192.168.x.x:8080` is rejected by NSURLSession.

Two options:

### 4-A. Use ngrok https (recommended — zero code changes)

Follow Option B in [`deploy-your-own-bff.md`](./deploy-your-own-bff.md). Cleanest path.

### 4-B. Add an ATS exception (dev builds only)

In `vibi-mobile/iosApp/iosApp/Info.plist` (or `info.plist` in `project.yml`) add an exception:

```xml
<key>NSAppTransportSecurity</key>
<dict>
  <key>NSAllowsArbitraryLoadsInWebContent</key><false/>
  <key>NSExceptionDomains</key>
  <dict>
    <key>192.168.1.42</key>
    <dict>
      <key>NSExceptionAllowsInsecureHTTPLoads</key><true/>
      <key>NSIncludesSubdomains</key><true/>
    </dict>
  </dict>
</dict>
```

The `192.168.1.42` `<key>` is your Mac IP. Be careful **not to ship this in a release build** — if you can, ngrok is the safer route.

If you edited `project.yml`, run `cd vibi-mobile/iosApp && xcodegen generate` and then Xcode Clean Build.

## 5. Android physical device — allow cleartext

From Android 9 (API 28)+ the default is https only. If cleartext is blocked you'll see `java.net.UnknownServiceException: CLEARTEXT communication ... not permitted by network security policy`.

In the `<application>` tag of `vibi-mobile/cmp/src/androidMain/AndroidManifest.xml`:

```xml
<application
    android:networkSecurityConfig="@xml/network_security_config"
    ... >
```

`vibi-mobile/cmp/src/androidMain/res/xml/network_security_config.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <domain-config cleartextTrafficPermitted="true">
    <domain includeSubdomains="true">192.168.1.42</domain>
  </domain-config>
</network-security-config>
```

Replace `192.168.1.42` with your Mac IP. This should not be present in release.

If you use ngrok https, this step is unnecessary.

## 6. Rebuild after updating `local.properties`

`BFF_BASE_URL` is baked in as BuildConfig at compile time. If you changed the value:

```bash
cd vibi-mobile
./gradlew :cmp:assembleDebug --no-configuration-cache    # Android
```

For iOS, Xcode Clean Build Folder (`⌘ ⇧ K`) and Run.

---

## Diagnostic checklist

Go in order — once the answer is yes, move on:

- [ ] BFF console: `Responding at http://0.0.0.0:8080`
- [ ] Browser on the same machine: `http://localhost:8080/healthz` returns 200
- [ ] `ping` from the phone to the Mac IP works
- [ ] Phone browser hits `http://<mac_IP>:8080/healthz` and gets 200
  - If not: firewall / router client isolation
- [ ] On iOS, ATS exception or ngrok https
- [ ] On Android, networkSecurityConfig or ngrok https
- [ ] `BFF_BASE_URL` in `local.properties` updated and rebuilt

If all of the above are yes and you still time out, check that `BFF_BASE_URL` in the BFF `.env` matches the same external address — that value is baked into download URL signatures, so if a request comes in from a different host, stem/dub downloads alone end up broken.
