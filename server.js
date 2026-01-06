const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');

// Main app (port 7371) - simulates the first-party domain
const mainApp = express();
mainApp.use(cookieParser());
mainApp.use(express.static('public'));

// Third-party app (port 7372) - simulates a third-party domain
const thirdPartyApp = express();
thirdPartyApp.use(cookieParser());

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
  <title>iOS ITP Cookie Demo</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      min-height: 100vh;
      color: #fff;
      padding: 20px;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
    }
    h1 {
      text-align: center;
      margin-bottom: 10px;
      font-size: 1.8rem;
    }
    .subtitle {
      text-align: center;
      color: #8892b0;
      margin-bottom: 30px;
    }
    .info-box {
      background: rgba(255,255,255,0.1);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
    }
    .info-box h3 {
      color: #64ffda;
      margin-bottom: 10px;
    }
    .demo-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-top: 20px;
    }
    @media (max-width: 768px) {
      .demo-section {
        grid-template-columns: 1fr;
      }
    }
    .demo-box {
      background: rgba(0,0,0,0.3);
      border-radius: 12px;
      padding: 20px;
      border: 1px solid rgba(255,255,255,0.1);
    }
    .demo-box h3 {
      margin-bottom: 15px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .status-indicator {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #888;
    }
    .status-indicator.success {
      background: #00ff88;
      box-shadow: 0 0 10px #00ff88;
    }
    .status-indicator.error {
      background: #ff4444;
      box-shadow: 0 0 10px #ff4444;
    }
    .iframe-container {
      background: #fff;
      border-radius: 8px;
      overflow: hidden;
      min-height: 200px;
    }
    .iframe-container iframe {
      width: 100%;
      height: 200px;
      border: none;
    }
    .local-storage-result, .cookie-result {
      padding: 15px;
      background: rgba(0,0,0,0.5);
      border-radius: 8px;
      font-family: monospace;
      font-size: 14px;
      min-height: 80px;
    }
    .warning {
      background: rgba(255, 165, 0, 0.2);
      border: 1px solid orange;
      border-radius: 8px;
      padding: 15px;
      margin-top: 20px;
    }
    .warning h4 {
      color: orange;
      margin-bottom: 8px;
    }
    .browser-info {
      text-align: center;
      padding: 10px;
      background: rgba(100, 255, 218, 0.1);
      border-radius: 8px;
      margin-bottom: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🍎 iOS ITP Cookie Storage Demo</h1>
    <p class="subtitle">Demonstrating Intelligent Tracking Prevention issues</p>
    
    <div class="browser-info" id="browserInfo">
      Detecting browser...
    </div>
    
    <div class="info-box">
      <h3>What is ITP?</h3>
      <p>Intelligent Tracking Prevention (ITP) is Safari's privacy feature that restricts cookies and storage access in cross-site contexts. On iOS Safari, third-party iframes cannot access cookies or localStorage, causing content to fail to load.</p>
    </div>
    
    <div class="demo-section">
      <div class="demo-box">
        <h3>
          <span class="status-indicator" id="iframeStatus"></span>
          Third-Party Iframe (Port 7372)
        </h3>
        <p style="margin-bottom: 10px; color: #8892b0; font-size: 14px;">
          This iframe loads from a different origin. It tries to set/read cookies and localStorage.
          <strong>On iOS Safari, this will appear blank!</strong>
        </p>
        <div class="iframe-container">
          <iframe src="http://localhost:7372/embed" id="thirdPartyFrame"></iframe>
        </div>
      </div>
      
      <div class="demo-box">
        <h3>
          <span class="status-indicator" id="localStatus"></span>
          First-Party Storage Test
        </h3>
        <p style="margin-bottom: 10px; color: #8892b0; font-size: 14px;">
          Testing localStorage and cookies in first-party context (same origin).
        </p>
        <div class="local-storage-result" id="localResult">
          Testing...
        </div>
      </div>
    </div>
    
    <div class="demo-section" style="margin-top: 0;">
      <div class="demo-box">
        <h3>
          <span class="status-indicator" id="jsStorageStatus"></span>
          JS-Set Cookie Test (ITP 2.1+)
        </h3>
        <p style="margin-bottom: 10px; color: #8892b0; font-size: 14px;">
          ITP can cap JavaScript-set cookie expiration to 7 days (or 24 hours with link decoration).
        </p>
        <div class="cookie-result" id="jsCookieResult">
          Testing...
        </div>
      </div>
      
      <div class="demo-box">
        <h3>
          <span class="status-indicator" id="postMessageStatus"></span>
          Cross-Origin Communication
        </h3>
        <p style="margin-bottom: 10px; color: #8892b0; font-size: 14px;">
          Receiving messages from third-party iframe about its storage access.
        </p>
        <div class="local-storage-result" id="messageResult">
          Waiting for iframe message...
        </div>
      </div>
    </div>
    
    <div class="warning">
      <h4>⚠️ Expected Behavior</h4>
      <ul style="margin-left: 20px; line-height: 1.8;">
        <li><strong>Desktop browsers:</strong> All tests should pass, iframe shows content</li>
        <li><strong>iOS Safari:</strong> Third-party iframe will be BLANK, storage access blocked</li>
        <li><strong>iOS Chrome/Firefox:</strong> Uses WebKit engine, same restrictions apply</li>
      </ul>
    </div>
  </div>
  
  <script>
    // Detect browser
    const browserInfo = document.getElementById('browserInfo');
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
    const isIOSSafari = isIOS && isSafari;
    
    if (isIOS) {
      browserInfo.innerHTML = '📱 <strong>iOS Device Detected</strong> - ITP restrictions are active!';
      browserInfo.style.background = 'rgba(255, 68, 68, 0.2)';
      browserInfo.style.borderColor = '#ff4444';
    } else if (isSafari) {
      browserInfo.innerHTML = '🖥️ <strong>macOS Safari Detected</strong> - ITP may be active';
      browserInfo.style.background = 'rgba(255, 165, 0, 0.2)';
    } else {
      browserInfo.innerHTML = '✅ <strong>Non-Safari Browser Detected</strong> - Full storage access expected';
      browserInfo.style.background = 'rgba(0, 255, 136, 0.2)';
    }
    
    // Test first-party localStorage and cookies
    function testFirstPartyStorage() {
      const resultEl = document.getElementById('localResult');
      const statusEl = document.getElementById('localStatus');
      let results = [];
      
      try {
        // Test localStorage
        localStorage.setItem('itp_test', 'works');
        const lsValue = localStorage.getItem('itp_test');
        results.push('localStorage: ' + (lsValue === 'works' ? '✅ Working' : '❌ Failed'));
        
        // Test sessionStorage
        sessionStorage.setItem('itp_test', 'works');
        const ssValue = sessionStorage.getItem('itp_test');
        results.push('sessionStorage: ' + (ssValue === 'works' ? '✅ Working' : '❌ Failed'));
        
        // Test cookies
        document.cookie = 'itp_test=works; path=/';
        const hasCookie = document.cookie.includes('itp_test=works');
        results.push('document.cookie: ' + (hasCookie ? '✅ Working' : '❌ Failed'));
        
        statusEl.classList.add('success');
      } catch (e) {
        results.push('❌ Error: ' + e.message);
        statusEl.classList.add('error');
      }
      
      resultEl.textContent = results.join('\\n');
    }
    
    // Test JS-set cookie behavior
    function testJSCookies() {
      const resultEl = document.getElementById('jsCookieResult');
      const statusEl = document.getElementById('jsStorageStatus');
      let results = [];
      
      try {
        // Set a cookie with long expiration
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 1);
        document.cookie = 'long_lived=test; expires=' + futureDate.toUTCString() + '; path=/';
        
        // Try to read it back
        const hasCookie = document.cookie.includes('long_lived=test');
        results.push('Cookie set: ' + (hasCookie ? '✅ Yes' : '❌ No'));
        results.push('Requested expiry: 1 year');
        results.push('Actual expiry: ITP caps to 7 days max');
        
        if (isIOS) {
          results.push('\\n⚠️ On iOS, cookies may be');
          results.push('   capped to 24h with link decoration');
        }
        
        statusEl.classList.add(hasCookie ? 'success' : 'error');
      } catch (e) {
        results.push('❌ Error: ' + e.message);
        statusEl.classList.add('error');
      }
      
      resultEl.textContent = results.join('\\n');
    }
    
    // Listen for messages from iframe
    window.addEventListener('message', (event) => {
      if (event.origin === 'http://localhost:7372') {
        const resultEl = document.getElementById('messageResult');
        const statusEl = document.getElementById('postMessageStatus');
        const iframeStatusEl = document.getElementById('iframeStatus');
        
        const data = event.data;
        let results = [];
        
        results.push('Iframe localStorage: ' + (data.localStorage ? '✅' : '❌'));
        results.push('Iframe sessionStorage: ' + (data.sessionStorage ? '✅' : '❌'));
        results.push('Iframe cookies: ' + (data.cookies ? '✅' : '❌'));
        
        const allWorking = data.localStorage && data.sessionStorage && data.cookies;
        statusEl.classList.add(allWorking ? 'success' : 'error');
        iframeStatusEl.classList.add(allWorking ? 'success' : 'error');
        
        if (!allWorking) {
          results.push('\\n⚠️ ITP is blocking storage!');
        }
        
        resultEl.textContent = results.join('\\n');
      }
    });
    
    // Handle iframe load timeout (for when iframe is completely blocked)
    setTimeout(() => {
      const messageResult = document.getElementById('messageResult');
      if (messageResult.textContent === 'Waiting for iframe message...') {
        messageResult.textContent = '❌ No response from iframe\\n\\nITP may have completely\\nblocked the iframe content.';
        document.getElementById('postMessageStatus').classList.add('error');
        document.getElementById('iframeStatus').classList.add('error');
      }
    }, 7371);
    
    // Run tests
    testFirstPartyStorage();
    testJSCookies();
  </script>
</body>
</html>
  `);
});

// ============================================
// THIRD-PARTY APP ROUTES (Cross-origin context)
// ============================================

thirdPartyApp.get('/embed', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f0f0f0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .content {
      display: none;
      text-align: center;
      padding: 20px;
    }
    .content.visible {
      display: block;
    }
    .success-icon {
      font-size: 48px;
      margin-bottom: 10px;
    }
    h2 {
      color: #2e7d32;
      margin-bottom: 10px;
    }
    .storage-info {
      background: #fff;
      padding: 15px;
      border-radius: 8px;
      margin-top: 15px;
      text-align: left;
      font-size: 14px;
    }
    .error-content {
      color: #c62828;
    }
    .error-content h2 {
      color: #c62828;
    }
  </style>
</head>
<body>
  <div class="content" id="successContent">
    <div class="success-icon">✅</div>
    <h2>Storage Access Granted!</h2>
    <p>Third-party iframe can access storage</p>
    <div class="storage-info" id="storageInfo"></div>
  </div>
  
  <div class="content error-content" id="errorContent">
    <div class="success-icon">🚫</div>
    <h2>ITP Blocked Storage</h2>
    <p>Cannot access cookies or localStorage</p>
    <div class="storage-info" id="errorInfo"></div>
  </div>
  
  <script>
    let storageResults = {
      localStorage: false,
      sessionStorage: false,
      cookies: false
    };
    
    // Test localStorage
    try {
      localStorage.setItem('third_party_test', 'value_' + Date.now());
      const value = localStorage.getItem('third_party_test');
      storageResults.localStorage = !!value;
    } catch (e) {
      storageResults.localStorage = false;
    }
    
    // Test sessionStorage
    try {
      sessionStorage.setItem('third_party_test', 'value_' + Date.now());
      const value = sessionStorage.getItem('third_party_test');
      storageResults.sessionStorage = !!value;
    } catch (e) {
      storageResults.sessionStorage = false;
    }
    
    // Test cookies
    try {
      document.cookie = 'third_party_test=value_' + Date.now() + '; path=/';
      storageResults.cookies = document.cookie.includes('third_party_test=');
    } catch (e) {
      storageResults.cookies = false;
    }
    
    // Send results to parent
    if (window.parent !== window) {
      window.parent.postMessage(storageResults, 'http://localhost:7371');
    }
    
    // Show appropriate content based on results
    const allWorking = storageResults.localStorage && 
                       storageResults.sessionStorage && 
                       storageResults.cookies;
    
    if (allWorking) {
      document.getElementById('successContent').classList.add('visible');
      document.getElementById('storageInfo').innerHTML = 
        'localStorage: ✅<br>' +
        'sessionStorage: ✅<br>' +
        'cookies: ✅';
    } else {
      // On iOS with ITP, we may not even get here - the page might just be blank
      // But if we do, show the error
      document.getElementById('errorContent').classList.add('visible');
      document.getElementById('errorInfo').innerHTML = 
        'localStorage: ' + (storageResults.localStorage ? '✅' : '❌') + '<br>' +
        'sessionStorage: ' + (storageResults.sessionStorage ? '✅' : '❌') + '<br>' +
        'cookies: ' + (storageResults.cookies ? '✅' : '❌');
    }
  </script>
</body>
</html>
  `);
});

// Set third-party cookie via HTTP header
thirdPartyApp.get('/set-cookie', (req, res) => {
  res.cookie('third_party_cookie', 'test_value', {
    maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
    httpOnly: false,
    sameSite: 'None',
    secure: false // Should be true in production with HTTPS
  });
  res.json({ success: true, message: 'Cookie set' });
});

// ============================================
// START SERVERS
// ============================================

const MAIN_PORT = 7371;
const THIRD_PARTY_PORT = 7372;

mainApp.listen(MAIN_PORT, () => {
  console.log('');
  console.log('🍎 iOS ITP Cookie Demo');
  console.log('=======================');
  console.log('');
  console.log('Main app (first-party):        http://localhost:' + MAIN_PORT);
  console.log('Third-party app (cross-origin): http://localhost:' + THIRD_PARTY_PORT);
  console.log('');
  console.log('📱 To test on iOS:');
  console.log("   1. Find your computer's local IP address");
  console.log('   2. Replace "localhost" with your IP');
  console.log('   3. Open on iOS Safari to see ITP in action');
  console.log('');
  console.log('Expected behavior:');
  console.log('   • Desktop: All tests pass, iframe shows green checkmark');
  console.log('   • iOS Safari: Iframe blank or red, storage blocked');
  console.log('');
});

thirdPartyApp.listen(THIRD_PARTY_PORT, () => {
  console.log('Third-party server ready on port ' + THIRD_PARTY_PORT);
});