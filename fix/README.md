# iOS ITP Cookie Storage Demo (with Fixes!)

This Express app demonstrates how Safari's **Intelligent Tracking Prevention (ITP)** blocks cookies and localStorage in cross-site (third-party) contexts, and shows **4 working solutions**.

## What is ITP?

Intelligent Tracking Prevention is Apple's privacy feature in Safari that:

- **Blocks third-party cookies** completely in cross-site contexts
- **Blocks localStorage/sessionStorage** access in iframes from different origins
- **Caps JavaScript-set cookie expiration** to 7 days (or 24 hours with link decoration)
- **Partitions storage** so third-party contexts can't access first-party data

## The Problem

Many web applications rely on:
- Embedded widgets that use cookies for authentication
- Third-party analytics scripts
- Cross-origin iframes that store user preferences
- Single Sign-On (SSO) flows using cookies

On iOS Safari (and all iOS browsers, since they all use WebKit), these features break silently, often showing blank content or failing authentication.

## Demo Structure

This demo runs **two servers** to simulate cross-origin behavior:

| Server | Port | Purpose |
|--------|------|---------|
| Main App | 7371 | First-party context (works everywhere) |
| Third-Party | 3001 | Cross-origin iframe (blocked by ITP) |

## Quick Start

```bash
# Install dependencies
npm install

# Start the servers
npm start
```

Then open http://localhost:7371 in your browser.

## Testing on iOS

To test on a real iOS device:

1. Find your computer's local IP address:
   - Mac: `ipconfig getifaddr en0`
   - Windows: `ipconfig`
   - Linux: `hostname -I`

2. Update the iframe URL in server.js to use your IP instead of localhost

3. Open `http://YOUR_IP:7371` on your iOS device

## Expected Results

### Desktop Browsers (Chrome, Firefox, Edge)
- ✅ Third-party iframe shows green checkmark
- ✅ All storage tests pass
- ✅ Cross-origin postMessage works

### iOS Safari (and all iOS browsers)
- ❌ Third-party iframe is **BLANK** or shows error
- ❌ No postMessage received from iframe
- ⚠️ First-party storage still works
- ⚠️ JS-set cookies capped to 7 days

### macOS Safari
- Similar restrictions but slightly less aggressive
- May work in some configurations

## ITP Versions & Restrictions

| ITP Version | Key Changes |
|-------------|-------------|
| ITP 1.0 | Third-party cookie restrictions |
| ITP 2.0 | Immediate third-party cookie blocking |
| ITP 2.1 | JS cookies capped to 7 days |
| ITP 2.2 | Link decoration → 24-hour cookie cap |
| ITP 2.3 | localStorage partitioned |

## Workarounds

### ✅ Fix 1: Storage Access API
Request explicit storage access with user interaction:
```javascript
// Inside iframe, after user clicks button:
document.requestStorageAccess().then(() => {
  // Now have cookie access!
  document.cookie = 'my_cookie=value';
});
```
**Limitation:** Requires user gesture and prior first-party visit.

### ✅ Fix 2: postMessage Communication
Pass data between parent and iframe without cookies:
```javascript
// Parent sends token
iframe.contentWindow.postMessage({
  type: 'AUTH_TOKEN',
  token: 'abc123'
}, 'http://third-party.com');

// Iframe receives and stores in JS variable (not localStorage)
window.addEventListener('message', (e) => {
  authToken = e.data.token;
});
```
**Works on iOS!** No cookies needed.

### ✅ Fix 3: First-Party Proxy
Route third-party API calls through your server:
```javascript
// Instead of: fetch('https://api.third-party.com/data')
// Use:
fetch('/api/proxy/data')  // Your server fetches from third-party
```
**Works on iOS!** Cookies stay first-party.

### ✅ Fix 4: Redirect-Based Auth (OAuth-style)
```javascript
// 1. Redirect to third-party
window.location = 'http://third-party.com/auth?redirect=http://mysite.com';

// 2. Third-party authenticates and redirects back with token
// http://mysite.com?token=abc123

// 3. Save as FIRST-PARTY cookie
document.cookie = `auth=${token}`;
```
**Works on iOS!** Token becomes first-party.

## Files

```
itp-demo/
├── server.js       # Express server with both apps
├── package.json    # Dependencies
└── README.md       # This file
```

## Learn More

- [WebKit ITP Documentation](https://webkit.org/tracking-prevention/)
- [Storage Access API](https://developer.mozilla.org/en-US/docs/Web/API/Storage_Access_API)
- [SameSite Cookies Explained](https://web.dev/samesite-cookies-explained/)
