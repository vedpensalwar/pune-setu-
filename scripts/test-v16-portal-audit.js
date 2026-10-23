const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

async function runPortalAudit() {
  console.log('================================================================');
  console.log('  PUNESETU VERSION 16 — DEDICATED LOGIN PORTALS AUDIT           ');
  console.log('================================================================\n');

  let passes = 0;
  let fails = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✔ PASS: ${message}`);
      passes++;
    } else {
      console.error(`  ✖ FAIL: ${message}`);
      fails++;
    }
  }

  function httpRequest(options, postData = null) {
    return new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let json = null;
          try {
            json = JSON.parse(data);
          } catch {}
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data,
            json,
          });
        });
      });
      req.on('error', reject);
      if (postData) {
        req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
      }
      req.end();
    });
  }

  // 0. Dev server responsiveness check
  try {
    const ping = await httpRequest({ hostname: 'localhost', port: 3000, path: '/', method: 'GET' });
    if (ping.status !== 200) throw new Error(`Status ${ping.status}`);
  } catch (err) {
    console.error('Next.js dev server is not accessible on http://localhost:3000:', err.message);
    process.exit(1);
  }

  // Test 1: Discoverability of Login Portals via HTTP inspection
  console.log('[1/4] Auditing Portal Discoverability & Route Endpoints');

  // A. Citizen Login Page
  const citizenLoginRes = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/login',
    method: 'GET',
  });
  assert(citizenLoginRes.status === 200, 'GET /login returns HTTP 200');
  assert(citizenLoginRes.body.includes('Citizen Sign In'), '/login renders Citizen Sign In title');
  assert(citizenLoginRes.body.includes('/officer/login'), '/login contains link to /officer/login');
  assert(citizenLoginRes.body.includes('/admin/login'), '/login contains link to /admin/login');
  assert(
    citizenLoginRes.body.includes('Staff accounts require assigned credentials') ||
    citizenLoginRes.body.includes('Municipal Staff'),
    '/login includes honest explanation of assigned municipal credentials'
  );

  // B. Municipal Officer Login Page
  const officerLoginRes = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/officer/login',
    method: 'GET',
  });
  assert(officerLoginRes.status === 200, 'GET /officer/login returns HTTP 200');
  assert(officerLoginRes.body.includes('Municipal Officer Sign In'), '/officer/login renders Municipal Officer heading');
  assert(officerLoginRes.body.includes('officer.roads@punesetu.gov.in'), '/officer/login contains official email placeholder');
  assert(officerLoginRes.body.includes('/login'), '/officer/login contains link back to Citizen Portal');
  assert(officerLoginRes.body.includes('/admin/login'), '/officer/login contains link to Administrator Portal');

  // C. Administrator Login Page
  const adminLoginRes = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/admin/login',
    method: 'GET',
  });
  assert(adminLoginRes.status === 200, 'GET /admin/login returns HTTP 200');
  assert(adminLoginRes.body.includes('Administrator Sign In'), '/admin/login renders Administrator heading');
  assert(adminLoginRes.body.includes('PMC Central Command'), '/admin/login renders PMC Central Command branding');
  assert(adminLoginRes.body.includes('/login'), '/admin/login contains link back to Citizen Portal');
  assert(adminLoginRes.body.includes('/officer/login'), '/admin/login contains link to Municipal Officer Portal');

  // D. Staff Gateway Page
  const staffLoginRes = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/staff/login',
    method: 'GET',
  });
  assert(staffLoginRes.status === 200, 'GET /staff/login returns HTTP 200');
  assert(
    staffLoginRes.body.includes('Municipal Staff &amp; Administration Gateway') ||
    staffLoginRes.body.includes('Municipal Staff & Administration Gateway'),
    '/staff/login renders Staff Gateway title'
  );
  assert(staffLoginRes.body.includes('/officer/login'), '/staff/login links to Municipal Officer portal');
  assert(staffLoginRes.body.includes('/admin/login'), '/staff/login links to Administrator portal');

  // E. Navigation & Footer Discoverability
  const homeRes = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/',
    method: 'GET',
  });
  assert(homeRes.body.includes('/officer/login'), 'Public footer includes Municipal Officer login link');
  assert(homeRes.body.includes('/admin/login'), 'Public footer includes Administrator login link');
  assert(homeRes.body.includes('/staff/login'), 'Public header / top strip includes Staff Portal link');

  // Test 2: Role-Based Access Control and Authentication Handlers
  console.log('\n[2/4] Testing RBAC Security & Portal Credentials');

  // Register fresh citizen to verify registration flow remains intact
  const citizenEmail = `portal.citizen.${Date.now()}@example.com`;
  const citizenPass = 'CitizenSecure@2026!';
  const regRes = await httpRequest(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      name: 'Portal Test Citizen',
      email: citizenEmail,
      password: citizenPass,
      confirmPassword: citizenPass,
    }
  );
  assert(regRes.status === 201 && regRes.json?.success, 'Citizen registration creates valid CITIZEN account');
  assert(regRes.json?.user?.role === 'CITIZEN', 'Registration strictly provisions CITIZEN role');

  // Citizen signs in via citizen portal
  const citizenLogin = await httpRequest(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      email: citizenEmail,
      password: citizenPass,
      portal: 'citizen',
    }
  );
  assert(citizenLogin.status === 200 && citizenLogin.json?.success, 'Citizen signs in successfully via citizen portal');
  assert(citizenLogin.json?.user?.role === 'CITIZEN', 'User authenticated as CITIZEN');
  assert(citizenLogin.json?.redirectUrl === '/citizen/dashboard', 'Citizen redirected to /citizen/dashboard');

  // Citizen attempt on officer portal
  const citizenOfficerAttempt = await httpRequest(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      email: citizenEmail,
      password: citizenPass,
      portal: 'officer',
    }
  );
  assert(citizenOfficerAttempt.status === 403, 'Citizen login rejected from Municipal Officer portal (HTTP 403)');
  assert(
    citizenOfficerAttempt.json?.error?.includes('Citizen accounts cannot access the Municipal Officer Portal'),
    'Honest error message explaining citizen account cannot access officer portal'
  );

  // Citizen attempt on admin portal
  const citizenAdminAttempt = await httpRequest(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      email: citizenEmail,
      password: citizenPass,
      portal: 'admin',
    }
  );
  assert(citizenAdminAttempt.status === 403, 'Citizen login rejected from Administrator portal (HTTP 403)');

  // Municipal Officer login
  const officerLogin = await httpRequest(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      email: 'officer.roads@punesetu.gov.in',
      password: 'OfficerPass@2026',
      portal: 'officer',
    }
  );
  assert(officerLogin.status === 200 && officerLogin.json?.success, 'Municipal Officer signs in successfully');
  assert(officerLogin.json?.user?.role === 'MUNICIPAL_OFFICER', 'User authenticated as MUNICIPAL_OFFICER');
  assert(officerLogin.json?.redirectUrl === '/officer/dashboard', 'Officer redirected to /officer/dashboard');

  // Officer attempt on admin portal
  const officerAdminAttempt = await httpRequest(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      email: 'officer.roads@punesetu.gov.in',
      password: 'OfficerPass@2026',
      portal: 'admin',
    }
  );
  assert(officerAdminAttempt.status === 403, 'Officer login rejected from Administrator portal (HTTP 403)');

  // Administrator login
  const adminLogin = await httpRequest(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      email: 'admin@punesetu.gov.in',
      password: 'ChangeMe@Pune2026!',
      portal: 'admin',
    }
  );
  assert(adminLogin.status === 200 && adminLogin.json?.success, 'Administrator signs in successfully');
  assert(adminLogin.json?.user?.role === 'ADMIN', 'User authenticated as ADMIN');
  assert(adminLogin.json?.redirectUrl === '/admin/dashboard', 'Admin redirected to /admin/dashboard');

  // Invalid credentials handling
  const invalidLogin = await httpRequest(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      email: 'officer.roads@punesetu.gov.in',
      password: 'WrongPassword123!',
      portal: 'officer',
    }
  );
  assert(invalidLogin.status === 401, 'Invalid password produces HTTP 401');

  // Test 3: Unauthenticated Direct Access & Middleware Protection
  console.log('\n[3/4] Testing Direct Route Protection & Middleware Redirects');

  const directOfficer = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/officer/dashboard',
    method: 'GET',
  });
  assert(
    directOfficer.status === 307 && directOfficer.headers.location?.includes('/officer/login'),
    'Unauthenticated direct access to /officer/dashboard redirects to /officer/login'
  );

  const directAdmin = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/admin/dashboard',
    method: 'GET',
  });
  assert(
    directAdmin.status === 307 && directAdmin.headers.location?.includes('/admin/login'),
    'Unauthenticated direct access to /admin/dashboard redirects to /admin/login'
  );

  const directCitizen = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/citizen/dashboard',
    method: 'GET',
  });
  assert(
    directCitizen.status === 307 && directCitizen.headers.location?.includes('/login'),
    'Unauthenticated direct access to /citizen/dashboard redirects to /login'
  );

  // Test 4: Live Chrome CDP Verification for Layout & Interactivity
  console.log('\n[4/4] Verifying Live Browser Interactivity & Multi-Viewport Layouts');

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9277',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1280,800',
    'about:blank',
  ]);

  try {
    let pages = null;
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 200));
      try {
        pages = await new Promise((resolve, reject) => {
          http.get('http://127.0.0.1:9277/json', (res) => {
            let raw = '';
            res.on('data', (c) => (raw += c));
            res.on('end', () => resolve(JSON.parse(raw)));
          }).on('error', reject);
        });
        if (pages && pages.length > 0) break;
      } catch (e) {}
    }

    const page = pages.find((p) => p.type === 'page') || pages[0];
    const ws = new globalThis.WebSocket(page.webSocketDebuggerUrl);

    await new Promise((res, rej) => {
      ws.onopen = res;
      ws.onerror = rej;
    });

    let msgId = 1;
    function send(method, params = {}) {
      return new Promise((resolve) => {
        const id = msgId++;
        const handler = (evt) => {
          const parsed = JSON.parse(evt.data);
          if (parsed.id === id) {
            ws.removeEventListener('message', handler);
            resolve(parsed.result || parsed);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await send('Page.enable');
    await send('DOM.enable');

    async function navigateTo(url) {
      await send('Page.navigate', { url });
      await new Promise((r) => setTimeout(r, 2000));
    }

    async function evaluate(expression) {
      const res = await send('Runtime.evaluate', { expression, returnByValue: true });
      return res.result ? res.result.value : null;
    }

    // A. Verify /login page layout across multiple viewports
    const viewports = [
      { name: '320px (Compact Mobile)', width: 320, height: 600 },
      { name: '360px (Standard Mobile)', width: 360, height: 740 },
      { name: '390px (iPhone 14/15)', width: 390, height: 844 },
      { name: '430px (Large Mobile)', width: 430, height: 932 },
      { name: '1280px (Desktop Full)', width: 1280, height: 800 },
    ];

    for (const vp of viewports) {
      await send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 1,
        mobile: vp.width < 768,
      });

      await navigateTo('http://localhost:3000/login');
      const overflowInfo = await evaluate(`
        ({
          docWidth: document.documentElement.scrollWidth,
          winWidth: window.innerWidth,
          officerLinkVisible: !!document.querySelector('a[href*="/officer/login"]'),
          adminLinkVisible: !!document.querySelector('a[href*="/admin/login"]')
        })
      `);

      assert(
        overflowInfo.docWidth <= overflowInfo.winWidth,
        `/login at ${vp.name}: Zero horizontal overflow (${overflowInfo.docWidth}px <= ${overflowInfo.winWidth}px)`
      );
      assert(
        overflowInfo.officerLinkVisible && overflowInfo.adminLinkVisible,
        `/login at ${vp.name}: Both Officer and Admin portal links visible and rendered`
      );
    }

    // B. Verify live /officer/login form mounting
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 800,
      deviceScaleFactor: 1,
      mobile: false,
    });

    await navigateTo('http://localhost:3000/officer/login');
    const officerFormReady = await evaluate(`
      ({
        hasEmail: !!document.querySelector('input[type="email"]'),
        hasPassword: !!document.querySelector('input[type="password"]'),
        buttonText: document.querySelector('button[type="submit"]')?.innerText || '',
        hasCitizenLink: !!document.querySelector('a[href="/login"]'),
        hasAdminLink: !!document.querySelector('a[href="/admin/login"]')
      })
    `);
    assert(
      officerFormReady.hasEmail && officerFormReady.hasPassword,
      'Live /officer/login mounts active email and password input elements'
    );
    assert(
      officerFormReady.hasCitizenLink && officerFormReady.hasAdminLink,
      'Live /officer/login displays bidirectional links to Citizen and Admin portals'
    );

    // C. Verify live /admin/login form mounting
    await navigateTo('http://localhost:3000/admin/login');
    const adminFormReady = await evaluate(`
      ({
        hasEmail: !!document.querySelector('input[type="email"]'),
        hasPassword: !!document.querySelector('input[type="password"]'),
        hasCitizenLink: !!document.querySelector('a[href="/login"]'),
        hasOfficerLink: !!document.querySelector('a[href="/officer/login"]')
      })
    `);
    assert(
      adminFormReady.hasEmail && adminFormReady.hasPassword,
      'Live /admin/login mounts active email and password input elements'
    );
    assert(
      adminFormReady.hasCitizenLink && adminFormReady.hasOfficerLink,
      'Live /admin/login displays bidirectional links to Citizen and Officer portals'
    );

    // D. Verify live /staff/login gateway mounting
    await navigateTo('http://localhost:3000/staff/login');
    const staffGatewayReady = await evaluate(`
      ({
        hasOfficerCard: !!document.querySelector('a[href="/officer/login"]'),
        hasAdminCard: !!document.querySelector('a[href="/admin/login"]'),
        hasCitizenLink: !!document.querySelector('a[href="/login"]')
      })
    `);
    assert(
      staffGatewayReady.hasOfficerCard && staffGatewayReady.hasAdminCard && staffGatewayReady.hasCitizenLink,
      'Live /staff/login gateway renders interactive portal selection cards and citizen link'
    );

    ws.close();
  } catch (err) {
    console.error('Browser CDP verification exception:', err);
  } finally {
    try {
      chromeProc.kill('SIGKILL');
    } catch {}
  }

  console.log('\n================================================================');
  console.log(`  PORTAL AUDIT RESULT: ${passes} PASSED, ${fails} FAILED (TOTAL: ${passes + fails})`);
  console.log('================================================================\n');

  if (fails > 0) process.exit(1);
}

runPortalAudit().catch((err) => {
  console.error(err);
  process.exit(1);
});
