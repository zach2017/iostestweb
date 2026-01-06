const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');

// Main app (port 7371) - simulates the first-party domain
const mainApp = express();
mainApp.use(cookieParser());
mainApp.use(express.json());

// Third-party app (port 7372) - simulates a third-party domain
const thirdPartyApp = express();
thirdPartyApp.use(cookieParser());
thirdPartyApp.use(express.json());

// ============================================
// MAIN APP ROUTES (First-party context)
// ============================================

mainApp.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>iOS ITP Fixes Demo</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      min-height: 100vh;
      color: #fff;
      padding: 20px;
    }
    .container { max-width: 1000px; margin: 0 auto; }
    h1 { text-align: center; margin-bottom: 10px; font-size: 1.8rem; }
    .subtitle { text-align: center; color: #8892b0; margin-bottom: 20px; }
    
    .tabs {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    .tab {
      padding: 12px 20px;
      background: rgba(255,255,255,0.1);
      border: none;
      border-radius: 8px;
      color: #fff;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s;
    }
    .tab:hover { background: rgba(255,255,255,0.2); }
    .tab.active {
      background: #64ffda;
      color: #1a1a2e;
      font-weight: 600;
    }
    
    .panel { display: none; }
    .panel.active { display: block; }
    
    .demo-box {
      background: rgba(0,0,0,0.3);
      border-radius: 12px;
      padding: 20px;
      border: 1px solid rgba(255,255,255,0.1);
      margin-bottom: 20px;
    }
    .demo-box h3 {
      color: #64ffda;
      margin-bottom: 15px;
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .code-block {
      background: #0d1117;
      border-radius: 8px;
      padding: 15px;
      overflow-x: auto;
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 13px;
      line-height: 1.5;
      margin: 15px 0;
      white-space: pre;
    }
    .code-block .comment { color: #8b949e; }
    .code-block .keyword { color: #ff7b72; }
    .code-block .string { color: #a5d6ff; }
    .code-block .function { color: #d2a8ff; }
    
    .iframe-container {
      background: #fff;
      border-radius: 8px;
      overflow: hidden;
      margin: 15px 0;
    }
    .iframe-container iframe {
      width: 100%;
      height: 250px;
      border: none;
    }
    
    .btn {
      padding: 12px 24px;
      background: #64ffda;
      color: #1a1a2e;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      font-size: 14px;
      transition: all 0.2s;
    }
    .btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(100,255,218,0.3); }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
    
    .result-box {
      background: rgba(0,0,0,0.5);
      border-radius: 8px;
      padding: 15px;
      font-family: monospace;
      font-size: 14px;
      min-height: 60px;
      margin-top: 15px;
      white-space: pre-wrap;
    }
    .success { color: #00ff88; }
    .error { color: #ff4444; }
    
    .browser-info {
      text-align: center;
      padding: 10px;
      background: rgba(100, 255, 218, 0.1);
      border-radius: 8px;
      margin-bottom: 20px;
    }
    
    .fix-tag {
      display: inline-block;
      padding: 4px 8px;
      background: #00ff88;
      color: #000;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      margin-left: 10px;
    }
    .fix-tag.partial { background: #ffa500; }
    
    .comparison {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-top: 15px;
    }
    @media (max-width: 768px) {
      .comparison { grid-template-columns: 1fr; }
      .tabs { flex-direction: column; }
      .tab { text-align: center; }
    }
    .comparison-box {
      padding: 15px;
      border-radius: 8px;
    }
    .comparison-box.broken {
      background: rgba(255,68,68,0.2);
      border: 1px solid #ff4444;
    }
    .comparison-box.fixed {
      background: rgba(0,255,136,0.2);
      border: 1px solid #00ff88;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔧 iOS ITP Fixes Demo</h1>
    <p class="subtitle">Solutions for Intelligent Tracking Prevention issues</p>
    
    <div class="browser-info" id="browserInfo">Detecting browser...</div>
    
    <div class="tabs">
      <button class="tab active" data-panel="problem">❌ The Problem</button>
      <button class="tab" data-panel="fix1">Fix 1: Storage Access API</button>
      <button class="tab" data-panel="fix2">Fix 2: postMessage</button>
      <button class="tab" data-panel="fix3">Fix 3: First-Party Proxy</button>
      <button class="tab" data-panel="fix4">Fix 4: Redirect Flow</button>
    </div>
    
    <!-- PROBLEM PANEL -->
    <div class="panel active" id="problem">
      <div class="demo-box">
        <h3>🚫 The Problem: Third-Party Iframe Storage Blocked</h3>
        <p>On iOS Safari, this iframe from port 7372 cannot access cookies or localStorage:</p>
        <div class="iframe-container">
          <iframe src="http://localhost:7372/embed-broken" id="brokenFrame"></iframe>
        </div>
        <div class="result-box" id="problemResult">Waiting for iframe response...</div>
      </div>
    </div>
    
    <!-- FIX 1: Storage Access API -->
    <div class="panel" id="fix1">
      <div class="demo-box">
        <h3>✅ Fix 1: Storage Access API <span class="fix-tag partial">Requires User Gesture</span></h3>
        <p>The Storage Access API lets iframes request storage access with user interaction.</p>
        
        <div class="code-block"><span class="comment">// Inside the iframe, after user clicks a button:</span>
<span class="keyword">document</span>.<span class="function">requestStorageAccess</span>().<span class="function">then</span>(() =&gt; {
  <span class="comment">// Now we have access to cookies!</span>
  <span class="keyword">document</span>.cookie = <span class="string">'my_cookie=value'</span>;
}).<span class="function">catch</span>(err =&gt; {
  console.<span class="function">log</span>(<span class="string">'Access denied'</span>, err);
});</div>
        
        <p style="margin: 15px 0; color: #8892b0;">
          <strong>Requirements:</strong> User must interact with iframe first. The third-party domain 
          must have been visited as a first-party before.
        </p>
        
        <div class="iframe-container">
          <iframe src="http://localhost:7372/embed-storage-access" id="storageAccessFrame"></iframe>
        </div>
        <div class="result-box" id="fix1Result">Click the button inside the iframe to request storage access.</div>
      </div>
    </div>
    
    <!-- FIX 2: postMessage -->
    <div class="panel" id="fix2">
      <div class="demo-box">
        <h3>✅ Fix 2: postMessage Communication <span class="fix-tag">Works on iOS!</span></h3>
        <p>Instead of cookies, pass data between parent and iframe using postMessage.</p>
        
        <div class="code-block"><span class="comment">// Parent page sends token to iframe</span>
<span class="keyword">const</span> iframe = <span class="keyword">document</span>.<span class="function">getElementById</span>(<span class="string">'myFrame'</span>);
iframe.contentWindow.<span class="function">postMessage</span>({
  type: <span class="string">'AUTH_TOKEN'</span>,
  token: <span class="string">'user-session-abc123'</span>
}, <span class="string">'http://third-party.com'</span>);

<span class="comment">// Iframe receives and stores in memory (not localStorage)</span>
<span class="keyword">window</span>.<span class="function">addEventListener</span>(<span class="string">'message'</span>, (e) =&gt; {
  <span class="keyword">if</span> (e.data.type === <span class="string">'AUTH_TOKEN'</span>) {
    sessionToken = e.data.token; <span class="comment">// Store in JS variable</span>
  }
});</div>
        
        <div style="margin: 20px 0;">
          <button class="btn" onclick="sendTokenToIframe()">Send Token to Iframe</button>
        </div>
        
        <div class="iframe-container">
          <iframe src="http://localhost:7372/embed-postmessage" id="postMessageFrame"></iframe>
        </div>
        <div class="result-box" id="fix2Result">Click the button to send auth token to iframe via postMessage.</div>
      </div>
    </div>
    
    <!-- FIX 3: First-Party Proxy -->
    <div class="panel" id="fix3">
      <div class="demo-box">
        <h3>✅ Fix 3: First-Party Proxy <span class="fix-tag">Works on iOS!</span></h3>
        <p>Route third-party API calls through your own server. Cookies stay first-party!</p>
        
        <div class="code-block"><span class="comment">// Instead of calling third-party API directly:</span>
<span class="comment">// fetch('https://api.third-party.com/data')</span>

<span class="comment">// Route through your own server:</span>
<span class="function">fetch</span>(<span class="string">'/api/proxy/third-party-data'</span>)
  .<span class="function">then</span>(res =&gt; res.<span class="function">json</span>())
  .<span class="function">then</span>(data =&gt; <span class="function">console.log</span>(data));

<span class="comment">// Server-side (Express):</span>
app.<span class="function">get</span>(<span class="string">'/api/proxy/third-party-data'</span>, <span class="keyword">async</span> (req, res) =&gt; {
  <span class="keyword">const</span> data = <span class="keyword">await</span> <span class="function">fetch</span>(<span class="string">'https://api.third-party.com/data'</span>);
  res.<span class="function">json</span>(<span class="keyword">await</span> data.<span class="function">json</span>());
});</div>
        
        <div class="comparison">
          <div class="comparison-box broken">
            <h4 style="color: #ff4444; margin-bottom: 10px;">❌ Direct Third-Party Call</h4>
            <button class="btn" style="background: #ff4444;" onclick="testDirectCall()">Call Port 7372 Directly</button>
            <div class="result-box" id="directResult" style="margin-top: 10px;">-</div>
          </div>
          <div class="comparison-box fixed">
            <h4 style="color: #00ff88; margin-bottom: 10px;">✅ First-Party Proxy</h4>
            <button class="btn" onclick="testProxyCall()">Call via Proxy</button>
            <div class="result-box" id="proxyResult" style="margin-top: 10px;">-</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- FIX 4: Redirect Flow -->
    <div class="panel" id="fix4">
      <div class="demo-box">
        <h3>✅ Fix 4: Redirect-Based Auth <span class="fix-tag">Works on iOS!</span></h3>
        <p>Instead of iframe auth, redirect user to third-party, authenticate, then redirect back with token.</p>
        
        <div class="code-block"><span class="comment">// 1. User clicks "Login with ThirdParty"</span>
<span class="keyword">window</span>.location.href = <span class="string">'http://third-party.com/auth?redirect=http://mysite.com/callback'</span>;

<span class="comment">// 2. Third-party authenticates, redirects back:</span>
<span class="comment">// http://mysite.com/callback?token=abc123</span>

<span class="comment">// 3. Your callback page saves token as FIRST-PARTY cookie:</span>
<span class="keyword">const</span> token = <span class="keyword">new</span> <span class="function">URLSearchParams</span>(location.search).<span class="function">get</span>(<span class="string">'token'</span>);
<span class="keyword">document</span>.cookie = <span class="string">\`auth_token=\${token}; path=/; max-age=86400\`</span>;</div>
        
        <p style="margin: 15px 0; color: #8892b0;">
          This is how OAuth/SSO works. The token becomes a first-party cookie on YOUR domain,
          so ITP doesn't block it.
        </p>
        
        <div style="margin: 20px 0;">
          <button class="btn" onclick="startRedirectFlow()">Start Redirect Auth Flow</button>
        </div>
        
        <div class="result-box" id="fix4Result">${req.query.token ? '<span class="success">✅ Auth successful! Token received: ' + req.query.token + '\\nThis token is now stored as a FIRST-PARTY cookie!</span>' : 'Click button to start OAuth-style redirect flow.'}</div>
      </div>
    </div>
  </div>
  
  <script>
    // Tab switching
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(tab.dataset.panel).classList.add('active');
      });
    });
    
    // If we have a token from redirect, show that panel
    if (window.location.search.includes('token=')) {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
      document.querySelector('[data-panel="fix4"]').classList.add('active');
      document.getElementById('fix4').classList.add('active');
      
      // Save as first-party cookie
      const token = new URLSearchParams(location.search).get('token');
      document.cookie = 'auth_token=' + token + '; path=/; max-age=86400';
    }
    
    // Browser detection
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    const browserInfo = document.getElementById('browserInfo');
    if (isIOS) {
      browserInfo.innerHTML = '📱 <strong>iOS Detected</strong> - ITP is active. Test the fixes!';
      browserInfo.style.background = 'rgba(255, 68, 68, 0.2)';
    } else {
      browserInfo.innerHTML = '🖥️ <strong>Desktop Browser</strong> - All methods work here. Test on iOS to see ITP blocking!';
      browserInfo.style.background = 'rgba(0, 255, 136, 0.2)';
    }
    
    // Listen for messages from iframes
    window.addEventListener('message', (e) => {
      if (e.origin !== 'http://localhost:7372') return;
      
      const data = e.data;
      
      if (data.source === 'broken') {
        const el = document.getElementById('problemResult');
        if (data.success) {
          el.innerHTML = '<span class="success">✅ Storage works (you are on desktop)</span>';
        } else {
          el.innerHTML = '<span class="error">❌ Storage BLOCKED by ITP!\\n' + data.error + '</span>';
        }
      }
      
      if (data.source === 'storage-access') {
        document.getElementById('fix1Result').innerHTML = 
          data.granted 
            ? '<span class="success">✅ Storage access granted! Cookies now work in iframe.</span>'
            : '<span class="error">❌ ' + data.message + '</span>';
      }
      
      if (data.source === 'postmessage') {
        document.getElementById('fix2Result').innerHTML = 
          '<span class="success">✅ Iframe received and confirmed token: ' + data.token + '</span>';
      }
    });
    
    // Fix 2: Send token via postMessage
    function sendTokenToIframe() {
      const token = 'user_' + Math.random().toString(36).substr(2, 9);
      const iframe = document.getElementById('postMessageFrame');
      iframe.contentWindow.postMessage({
        type: 'AUTH_TOKEN',
        token: token
      }, 'http://localhost:7372');
      document.getElementById('fix2Result').innerHTML = 'Sent token: ' + token + '\\nWaiting for confirmation from iframe...';
    }
    
    // Fix 3: Direct vs Proxy calls
    async function testDirectCall() {
      const el = document.getElementById('directResult');
      el.textContent = 'Calling...';
      try {
        const res = await fetch('http://localhost:7372/api/data', { 
          credentials: 'include',
          mode: 'cors'
        });
        const data = await res.json();
        el.innerHTML = '<span class="success">✅ Got data: ' + data.message + '\\n(Works on desktop, cookies may be blocked on iOS)</span>';
      } catch (err) {
        el.innerHTML = '<span class="error">❌ Failed: ' + err.message + '</span>';
      }
    }
    
    async function testProxyCall() {
      const el = document.getElementById('proxyResult');
      el.textContent = 'Calling...';
      try {
        const res = await fetch('/api/proxy/data', { credentials: 'include' });
        const data = await res.json();
        el.innerHTML = '<span class="success">✅ ' + data.message + '\\nFirst-party cookie set!</span>';
      } catch (err) {
        el.innerHTML = '<span class="error">Error: ' + err.message + '</span>';
      }
    }
    
    // Fix 4: Redirect flow
    function startRedirectFlow() {
      const returnUrl = encodeURIComponent(window.location.origin + window.location.pathname);
      window.location.href = 'http://localhost:7372/auth?redirect=' + returnUrl;
    }
  </script>
</body>
</html>
  `);
});

// Proxy endpoint - routes through first-party server
mainApp.get('/api/proxy/data', async (req, res) => {
  // In production, you'd call the actual third-party API here
  // For demo, we simulate fetching from third-party
  res.cookie('first_party_session', 'session_' + Date.now(), {
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true
  });
  res.json({
    message: 'Data fetched via first-party proxy!',
    timestamp: new Date().toISOString(),
    yourCookies: req.cookies
  });
});

// ============================================
// THIRD-PARTY APP ROUTES (Cross-origin context)
// ============================================

// Broken iframe (demonstrates the problem)
thirdPartyApp.get('/embed-broken', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: -apple-system, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: #f5f5f5;
    }
    .container { text-align: center; padding: 20px; }
    .icon { font-size: 48px; margin-bottom: 10px; }
    .error { color: #c62828; }
    .success { color: #2e7d32; }
    .details { font-size: 12px; color: #666; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="container" id="content">Testing storage...</div>
  <script>
    const container = document.getElementById('content');
    let success = true;
    let errors = [];
    
    // Test localStorage
    try {
      localStorage.setItem('test', 'value');
      const val = localStorage.getItem('test');
      if (!val) errors.push('localStorage: empty');
    } catch (e) {
      success = false;
      errors.push('localStorage: ' + e.name);
    }
    
    // Test sessionStorage
    try {
      sessionStorage.setItem('test', 'value');
    } catch (e) {
      success = false;
      errors.push('sessionStorage: ' + e.name);
    }
    
    // Test cookies
    try {
      document.cookie = 'test=value';
      if (!document.cookie.includes('test')) {
        success = false;
        errors.push('cookies: blocked');
      }
    } catch (e) {
      success = false;
      errors.push('cookies: ' + e.name);
    }
    
    window.parent.postMessage({
      source: 'broken',
      success: success,
      error: errors.join(' | ')
    }, 'http://localhost:7371');
    
    if (success) {
      container.innerHTML = '<div class="icon">✅</div><div class="success">Storage works!</div><div class="details">(Desktop browser detected)</div>';
    } else {
      container.innerHTML = '<div class="icon">🚫</div><div class="error">Storage BLOCKED by ITP!</div><div class="details">' + errors.join('<br>') + '</div>';
    }
  </script>
</body>
</html>
  `);
});

// Fix 1: Storage Access API iframe
thirdPartyApp.get('/embed-storage-access', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: -apple-system, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: #f0f7ff;
      padding: 20px;
      text-align: center;
    }
    button {
      padding: 15px 30px;
      font-size: 16px;
      background: #007AFF;
      color: white;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      margin: 10px;
    }
    button:hover { background: #0056b3; }
    .status { margin-top: 15px; font-size: 14px; color: #666; }
    .success { color: #2e7d32; }
    .error { color: #c62828; }
  </style>
</head>
<body>
  <h3>Third-Party Iframe</h3>
  <p>Click button to request storage access:</p>
  <button onclick="requestAccess()">🔓 Request Storage Access</button>
  <div class="status" id="status">Waiting for user interaction...</div>
  
  <script>
    async function requestAccess() {
      const status = document.getElementById('status');
      
      // Check if API is available
      if (!document.requestStorageAccess) {
        status.innerHTML = '<span class="error">Storage Access API not supported in this browser</span>';
        window.parent.postMessage({ source: 'storage-access', granted: false, message: 'API not supported' }, '*');
        return;
      }
      
      try {
        // First check if we already have access
        const hasAccess = await document.hasStorageAccess();
        if (hasAccess) {
          status.innerHTML = '<span class="success">✅ Already have storage access!</span>';
          window.parent.postMessage({ source: 'storage-access', granted: true }, '*');
          return;
        }
        
        // Request access - this requires user gesture
        await document.requestStorageAccess();
        status.innerHTML = '<span class="success">✅ Storage access granted!</span>';
        
        // Now we can use cookies
        document.cookie = 'storage_access_cookie=granted; max-age=3600';
        
        window.parent.postMessage({ source: 'storage-access', granted: true }, '*');
      } catch (err) {
        status.innerHTML = '<span class="error">❌ Access denied: ' + err.message + '</span>';
        window.parent.postMessage({ 
          source: 'storage-access', 
          granted: false, 
          message: err.message 
        }, '*');
      }
    }
  </script>
</body>
</html>
  `);
});

// Fix 2: postMessage iframe
thirdPartyApp.get('/embed-postmessage', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: -apple-system, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: #f0fff0;
      padding: 20px;
      text-align: center;
    }
    .token-display {
      background: white;
      padding: 15px 25px;
      border-radius: 10px;
      margin-top: 15px;
      font-family: monospace;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      word-break: break-all;
    }
    .waiting { color: #666; }
    .received { color: #2e7d32; font-weight: bold; }
  </style>
</head>
<body>
  <h3>Third-Party Iframe</h3>
  <p>Listening for token via postMessage...</p>
  <p style="font-size: 12px; color: #888;">(No cookies or localStorage needed!)</p>
  <div class="token-display">
    <span class="waiting" id="tokenDisplay">No token received yet</span>
  </div>
  
  <script>
    // Store token in memory (not localStorage - that's blocked!)
    let authToken = null;
    
    window.addEventListener('message', (event) => {
      // Always verify origin in production!
      if (event.origin !== 'http://localhost:7371') return;
      
      if (event.data.type === 'AUTH_TOKEN') {
        authToken = event.data.token;
        document.getElementById('tokenDisplay').innerHTML = 
          '<span class="received">✅ Token received!<br>' + authToken + '</span>';
        
        // Confirm receipt to parent
        window.parent.postMessage({
          source: 'postmessage',
          token: authToken
        }, 'http://localhost:7371');
      }
    });
  </script>
</body>
</html>
  `);
});

// Fix 3: API endpoint with CORS
thirdPartyApp.get('/api/data', (req, res) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:7371');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Try to set a cookie - this will be blocked by ITP on iOS
  res.cookie('third_party_cookie', 'value_' + Date.now(), {
    sameSite: 'None',
    secure: false // Should be true in production
  });
  
  res.json({ 
    message: 'Data from third-party API',
    note: 'Cookie may be blocked by ITP',
    timestamp: Date.now() 
  });
});

// Fix 4: Redirect auth endpoint
thirdPartyApp.get('/auth', (req, res) => {
  const redirect = req.query.redirect || 'http://localhost:7371';
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: -apple-system, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-align: center;
      padding: 20px;
    }
    .auth-box {
      background: rgba(255,255,255,0.2);
      padding: 40px;
      border-radius: 20px;
      backdrop-filter: blur(10px);
      max-width: 400px;
    }
    h2 { margin-bottom: 15px; }
    button {
      padding: 15px 40px;
      font-size: 18px;
      background: white;
      color: #667eea;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      margin-top: 20px;
      font-weight: bold;
      transition: transform 0.2s;
    }
    button:hover { transform: scale(1.05); }
    .note { font-size: 14px; opacity: 0.8; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="auth-box">
    <h2>🔐 Third-Party Auth</h2>
    <p>This is a simulated login page on the third-party domain (port 7372)</p>
    <p class="note">In real OAuth, user would enter credentials here</p>
    <button onclick="authenticate()">✓ Authorize & Return</button>
  </div>
  <script>
    function authenticate() {
      // Generate a token (in real app, this comes from your auth system)
      const token = 'auth_' + Math.random().toString(36).substr(2, 12);
      
      // Redirect back to first-party site with token in URL
      // The first-party site will save this as a FIRST-PARTY cookie
      window.location.href = '${redirect}?token=' + token;
    }
  </script>
</body>
</html>
  `);
});

// ============================================
// START SERVERS
// ============================================

const MAIN_PORT = 7371;
const THIRD_PARTY_PORT = 7372;

mainApp.listen(MAIN_PORT, () => {
  console.log('');
  console.log('🔧 iOS ITP Fixes Demo');
  console.log('======================');
  console.log('');
  console.log('Main app:        http://localhost:' + MAIN_PORT);
  console.log('Third-party app: http://localhost:' + THIRD_PARTY_PORT);
  console.log('');
  console.log('Fixes demonstrated:');
  console.log('  1. Storage Access API (requires user gesture)');
  console.log('  2. postMessage communication (works on iOS!)');
  console.log('  3. First-party proxy (works on iOS!)');
  console.log('  4. Redirect-based auth flow (works on iOS!)');
  console.log('');
});

thirdPartyApp.listen(THIRD_PARTY_PORT, () => {
  console.log('Third-party server ready on port ' + THIRD_PARTY_PORT);
});
