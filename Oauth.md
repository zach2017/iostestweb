This is a **very common Safari / iOS issue** caused by **ITP (Intelligent Tracking Prevention)** blocking **third-party cookies**. In OAuth setups like yours, it usually breaks login or API calls **only in Safari**, while Chrome/Firefox work.

---

## Your architecture (problematic for ITP)

```
React SPA (OAuth Client)  --->  OAuth Authorization Server
        |
        --->  Spring API (OAuth Resource Server)
```

Typical setup problems:

* OAuth server is on a **different domain** than the React app
* Authentication relies on **cookies** (session or refresh token)
* API calls require cookies to be sent cross-site

➡️ **Safari blocks those cookies by default**

---

## Root cause (important)

Safari ITP **blocks or partitions cookies** when:

* Cookies are set by a **different domain** than the current site
* Cookies are used for **cross-site tracking**
* Cookies are `SameSite=None` but still considered third-party

OAuth **Authorization Code + cookies** is the most affected flow.

---

## Solutions (choose one – ranked best → worst)

---

# ✅ **BEST PRACTICE: Token-based auth (no cookies)**

### Use **Authorization Code Flow + PKCE**

* Store **access token in memory**
* Send token via `Authorization: Bearer <token>`
* **DO NOT rely on cookies**

### React

```js
fetch('/api/data', {
  headers: {
    Authorization: `Bearer ${accessToken}`
  }
})
```

### Spring Resource Server

```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: https://auth.example.com
```

✔ Works in Safari
✔ Secure
✔ Recommended by OAuth 2.1

---

# ✅ **VERY GOOD: Same-site cookies (same domain)**

Make **all apps share the same top-level domain**:

```
auth.example.com
api.example.com
app.example.com
```

Set cookies:

```http
Set-Cookie: SESSION=xyz;
  Secure;
  HttpOnly;
  SameSite=None
```

⚠️ Still unreliable in Safari if considered third-party
⚠️ Requires HTTPS everywhere

---

# ⚠️ **Safari workaround: Redirect-based login (no iframe / ajax)**

Safari allows cookies **only after user interaction**.

✔ Works:

* Full page redirect to OAuth server
* Redirect back to React app

❌ Breaks:

* Silent refresh
* iframe token refresh

---

# ❌ **NOT RECOMMENDED hacks**

| Hack                | Why bad           |
| ------------------- | ----------------- |
| Disable ITP         | Impossible        |
| localStorage tokens | XSS risk          |
| Hidden iframe login | Blocked by Safari |
| `document.cookie`   | Blocked           |

---

## Recommended final architecture (Safari-safe)

```
React SPA
  └── OAuth Authorization Code + PKCE
        └── JWT Access Token (memory only)
              └── Spring Resource Server validates JWT
```

---

## Spring Security example (JWT)

```java
@Bean
SecurityFilterChain security(HttpSecurity http) throws Exception {
    http
      .authorizeHttpRequests(auth -> auth
        .requestMatchers("/public/**").permitAll()
        .anyRequest().authenticated()
      )
      .oauth2ResourceServer(oauth2 -> oauth2.jwt());

    return http.build();
}
```

---

## React OAuth libraries that handle Safari correctly

* `@auth0/auth0-react`
* `oidc-client-ts`
* `react-oauth2-code-pkce`

---

## Summary

**ITP is not a bug — it’s Safari enforcing privacy.**

### ✔ Fix checklist

* ❌ Stop using cookies for auth
* ✅ Use OAuth **Authorization Code + PKCE**
* ✅ Pass tokens via `Authorization` header
* ✅ Keep tokens in memory
* ✅ Validate JWT in Spring Resource Server

---


Great — **Keycloak + Safari ITP** is a *known* combination with clear fixes. Below is the **Safari-safe, production-ready setup** for:

**Keycloak (OAuth Server) + React SPA + Spring Boot Resource Server**

---

## The real problem with Keycloak + Safari ITP

Keycloak **defaults to cookies**:

* `KEYCLOAK_SESSION`
* `KEYCLOAK_IDENTITY`
* `AUTH_SESSION_ID`

Safari **blocks them** when:

* Keycloak is on a different domain
* Silent refresh / iframe login is used
* `check-sso` or refresh tokens rely on cookies

➡️ Result:

* Login works once, then breaks
* API calls fail
* Silent refresh fails
* Happens only in Safari/iOS

---

# ✅ **CORRECT ARCHITECTURE (Safari-proof)**

```
React SPA
   └── Authorization Code + PKCE
         └── Access Token (JWT, memory only)
               └── Spring Resource Server
```

❌ No cookies
❌ No iframe silent refresh
❌ No `check-sso`

---

## 1️⃣ Keycloak configuration (IMPORTANT)

### Client settings (React SPA)

| Setting              | Value                       |
| -------------------- | --------------------------- |
| Client Type          | **Public**                  |
| Standard Flow        | ✅ ON                        |
| Implicit Flow        | ❌ OFF                       |
| Direct Access Grants | ❌ OFF                       |
| Service Accounts     | ❌ OFF                       |
| PKCE                 | **Required (S256)**         |
| Root URL             | `https://app.example.com`   |
| Valid Redirect URIs  | `https://app.example.com/*` |
| Web Origins          | `https://app.example.com`   |

⚠️ **Do NOT enable**:

* `check-sso`
* Silent refresh
* iframe login

---

## 2️⃣ React SPA (NO cookies)

### Use a modern OIDC client

Recommended:

```bash
npm install oidc-client-ts
```

### OIDC config

```ts
const oidcConfig = {
  authority: "https://keycloak.example.com/realms/myrealm",
  client_id: "react-client",
  redirect_uri: window.location.origin + "/callback",
  response_type: "code",
  scope: "openid profile email",
  automaticSilentRenew: false,   // 🔥 critical
  loadUserInfo: false
};
```

### Login

```ts
userManager.signinRedirect();
```

### API call

```ts
fetch("https://api.example.com/data", {
  headers: {
    Authorization: `Bearer ${accessToken}`
  }
});
```

✔ Safari safe
✔ No ITP issues

---

## 3️⃣ Spring Boot Resource Server (JWT)

### Dependencies

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-oauth2-resource-server</artifactId>
</dependency>
```

### `application.yml`

```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: https://keycloak.example.com/realms/myrealm
```

### Security config

```java
@Bean
SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
      .csrf(csrf -> csrf.disable())
      .authorizeHttpRequests(auth -> auth
        .requestMatchers("/public/**").permitAll()
        .anyRequest().authenticated()
      )
      .oauth2ResourceServer(oauth -> oauth.jwt());

    return http.build();
}
```

---

## 4️⃣ Token refresh (Safari-compatible)

### ❌ Do NOT use:

* iframe silent refresh
* refresh token in browser
* cookie-based refresh

### ✅ Use:

* Short access tokens (5–10 min)
* Full redirect to Keycloak when expired

```ts
if (tokenExpired) {
  userManager.signinRedirect();
}
```

✔ Works in Safari
✔ Secure

---

## 5️⃣ OPTIONAL: Same-domain cookie workaround (not recommended)

If you **must** use cookies:

```
auth.example.com
api.example.com
app.example.com
```

Keycloak cookies:

```http
SameSite=None; Secure
```

⚠️ Safari may STILL break this
⚠️ Not future-proof

---

## 6️⃣ Debug checklist (Safari)

Enable:

* Safari → Develop → Web Inspector
* Storage → Cookies → check blocking

Look for:

* Missing `KEYCLOAK_SESSION`
* Blocked third-party cookies

---

## Final verdict

| Approach                 | Safari        |
| ------------------------ | ------------- |
| Cookies + silent refresh | ❌ Broken      |
| iframe check-sso         | ❌ Broken      |
| Token in memory + PKCE   | ✅ Works       |
| Same-domain cookies      | ⚠️ Unreliable |

---

## TL;DR

**Safari ITP breaks Keycloak cookie-based auth.**
**You fix it by not using cookies at all.**

> **Authorization Code + PKCE + Bearer tokens**

---

If you want, tell me:

* Keycloak version
* Are you using `keycloak-js`?
* SPA or mobile WebView?

Perfect — **react-oidc-context + Keycloak + Safari ITP** is absolutely fixable 👍
The key is to **turn OFF everything that relies on cookies or iframes**.

Below is the **exact, Safari-safe configuration**.

---

# ✅ **Correct setup: react-oidc-context + Keycloak**

## 🔥 Core rule (do not skip)

**Safari ITP breaks:**

* silent renew
* iframe login
* cookie-based refresh

➡️ We use **Authorization Code + PKCE + redirect-only refresh**

---

## 1️⃣ Keycloak client configuration

**Client type:** `Public`

| Setting              | Value                       |
| -------------------- | --------------------------- |
| Standard Flow        | ✅ ON                        |
| PKCE                 | **Required (S256)**         |
| Implicit Flow        | ❌ OFF                       |
| Direct Access Grants | ❌ OFF                       |
| Root URL             | `https://app.example.com`   |
| Valid Redirect URIs  | `https://app.example.com/*` |
| Web Origins          | `https://app.example.com`   |

❌ Do **NOT** enable:

* `check-sso`
* silent SSO
* iframe

---

## 2️⃣ react-oidc-context config (CRITICAL)

### ✅ Safari-safe config

```ts
import { AuthProvider } from "react-oidc-context";

const oidcConfig = {
  authority: "https://keycloak.example.com/realms/myrealm",
  client_id: "react-client",
  redirect_uri: window.location.origin + "/callback",
  response_type: "code",
  scope: "openid profile email",

  // 🔥 MUST be false for Safari
  automaticSilentRenew: false,

  // 🔥 Prevent iframe usage
  monitorSession: false,

  // Optional but recommended
  loadUserInfo: false,

  // Store tokens only in memory
  userStore: undefined
};
```

```tsx
<AuthProvider {...oidcConfig}>
  <App />
</AuthProvider>
```

---

## 3️⃣ Login / Logout

### Login

```ts
auth.signinRedirect();
```

### Logout (IMPORTANT)

```ts
auth.signoutRedirect({
  post_logout_redirect_uri: window.location.origin
});
```

✔ Uses full-page redirect
✔ Safari allows cookies during redirect

---

## 4️⃣ API calls (Spring Resource Server)

```ts
fetch("https://api.example.com/data", {
  headers: {
    Authorization: `Bearer ${auth.user?.access_token}`
  }
});
```

✔ No cookies
✔ No ITP issues

---

## 5️⃣ Token expiration handling (Safari-safe)

### ❌ Do NOT use

* `automaticSilentRenew`
* refresh tokens in browser
* hidden iframes

### ✅ Use redirect-based refresh

```ts
useEffect(() => {
  if (auth.user?.expired) {
    auth.signinRedirect();
  }
}, [auth.user]);
```

✔ Works in Safari
✔ Secure

---

## 6️⃣ Spring Boot Resource Server (Keycloak JWT)

```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: https://keycloak.example.com/realms/myrealm
```

```java
@Bean
SecurityFilterChain security(HttpSecurity http) throws Exception {
    http
      .authorizeHttpRequests(auth -> auth
        .requestMatchers("/public/**").permitAll()
        .anyRequest().authenticated()
      )
      .oauth2ResourceServer(oauth -> oauth.jwt());

    return http.build();
}
```

---

## 7️⃣ Common mistakes (❌ causes Safari failure)

| Mistake                     | Why               |
| --------------------------- | ----------------- |
| `automaticSilentRenew=true` | iframe → blocked  |
| `monitorSession=true`       | relies on cookies |
| Using refresh tokens        | cookie-based      |
| `keycloak-js` adapter       | cookie dependent  |
| Third-party domain cookies  | blocked           |

---

## 8️⃣ Optional (Same-domain improvement)

If possible:

```
auth.example.com
api.example.com
app.example.com
```

Still use **Bearer tokens**, not cookies.

---

## ✅ Summary (TL;DR)

**react-oidc-context works with Safari ONLY IF:**

* Authorization Code + PKCE
* No silent renew
* No iframe
* No cookies
* Redirect-based refresh

---

If you want, tell me:

* Keycloak version (e.g. 21, 22, 24)
* Are you behind a reverse proxy?
* Access token lifetime you use


