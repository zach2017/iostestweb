# iOS ITP Cookie Storage Demo

This Express app demonstrates how Safari's **Intelligent Tracking Prevention (ITP)** blocks cookies and localStorage in cross-site (third-party) contexts, causing content to fail to load on iOS devices.

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
| Main App | 3000 | First-party context (works everywhere) |
| Third-Party | 7372 | Cross-origin iframe (blocked by ITP) |

## Quick Start

```bash
# Install dependencies
npm install

# Start the servers
npm start
```

Then open http://localhost:3000 in your browser.

## Testing on iOS

To test on a real iOS device:

1. Find your computer's local IP address:
   - Mac: `ipconfig getifaddr en0`
   - Windows: `ipconfig`
   - Linux: `hostname -I`

2. Update the iframe URL in server.js to use your IP instead of localhost

3. Open `http://YOUR_IP:3000` on your iOS device

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

1. **Storage Access API**: Request explicit storage access
   ```javascript
   document.requestStorageAccess().then(() => {
     // Now have access
   });
   ```

2. **First-party redirects**: Authenticate via redirect instead of iframe

3. **Token-based auth**: Pass tokens via URL/postMessage instead of cookies

4. **Partitioned cookies (CHIPS)**: Use `Partitioned` attribute for cookies

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
