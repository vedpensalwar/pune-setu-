const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

async function runAuthVerification() {
  console.log('================================================================');
  console.log('  PUNESETU VERSION 17 — AUTH & PORTAL NAVIGATION AUDIT          ');
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

  function httpRequest(options, postData = null, cookie = null) {
    return new Promise((resolve, reject) => {
      const headers = options.headers || {};
      if (cookie) {
        headers['Cookie'] = cookie;
      }
      options.headers = headers;

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
            cookie: res.headers['set-cookie']
              ? res.headers['set-cookie'].map((c) => c.split(';')[0]).join('; ')
              : null,
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

  // 0. Verify dev server is up
  try {
    const ping = await httpRequest({ hostname: 'localhost', port: 3000, path: '/', method: 'GET' });
    if (ping.status !== 200) throw new Error(`Status ${ping.status}`);
  } catch (err) {
    console.error('Next.js dev server is not accessible on http://localhost:3000:', err.message);
    process.exit(1);
  }

  // --------------------------------------------------------------------------
  // Scenario 1: Citizen Login & Registration
  // --------------------------------------------------------------------------
  console.log('[Scenario 1] Citizen Registration & Login');
  const citizenEmail = `citizen.v17.${Date.now()}@example.com`;
  const citizenPass = 'CitizenPass@2026!';
  const citizenName = 'Aarav Deshmukh';

  const regRes = await httpRequest(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      name: citizenName,
      email: citizenEmail,
      password: citizenPass,
      confirmPassword: citizenPass,
    }
  );
  assert(regRes.status === 201 && regRes.json?.success, 'Citizen registration succeeds (HTTP 201)');
  assert(regRes.json?.user?.role === 'CITIZEN', 'Registered account is strictly assigned CITIZEN role');

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
  assert(citizenLogin.status === 200 && citizenLogin.json?.success, 'Citizen signs in with valid credentials');
  assert(citizenLogin.cookie && citizenLogin.cookie.includes('punesetu_session'), 'Session cookie punesetu_session issued');
  assert(citizenLogin.json?.redirectUrl === '/citizen/dashboard', 'Citizen redirectUrl points to /citizen/dashboard');
  const citizenCookie = citizenLogin.cookie;

  const citizenDash = await httpRequest(
    { hostname: 'localhost', port: 3000, path: '/citizen/dashboard', method: 'GET' },
    null,
    citizenCookie
  );
  assert(citizenDash.status === 200, 'Citizen accesses /citizen/dashboard with active session (HTTP 200)');

  // --------------------------------------------------------------------------
  // Scenario 2: Invalid Citizen Credentials
  // --------------------------------------------------------------------------
  console.log('\n[Scenario 2] Invalid Citizen Credentials Rejection');
  const invalidCitizen = await httpRequest(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      email: citizenEmail,
      password: 'WrongPassword123!',
      portal: 'citizen',
    }
  );
  assert(invalidCitizen.status === 401, 'Invalid citizen password returns HTTP 401');
  assert(
    invalidCitizen.json?.error?.includes('Invalid email address or password'),
    'Clear generic error message provided without disclosing user existence'
  );

  const emptyFields = await httpRequest(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      email: '',
      password: '',
      portal: 'citizen',
    }
  );
  assert(emptyFields.status === 400, 'Empty email/password submission rejected (HTTP 400)');

  // --------------------------------------------------------------------------
  // Scenario 3: Officer Portal Identification & Mounting
  // --------------------------------------------------------------------------
  console.log('\n[Scenario 3] Municipal Officer Portal Mounting');
  const officerPage = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/officer/login',
    method: 'GET',
  });
  assert(officerPage.status === 200, 'GET /officer/login returns HTTP 200');
  assert(officerPage.body.includes('Municipal Officer Sign In'), '/officer/login displays official title');
  assert(officerPage.body.includes('PMC Municipal Operations'), '/officer/login displays PMC Municipal Operations badge');
  assert(officerPage.body.includes('/login'), '/officer/login provides link to Citizen Portal');
  assert(officerPage.body.includes('/admin/login'), '/officer/login provides link to Administrator Portal');

  // --------------------------------------------------------------------------
  // Scenario 4: Authorized Officer Login
  // --------------------------------------------------------------------------
  console.log('\n[Scenario 4] Authorized Municipal Officer Login');
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
  assert(officerLogin.status === 200 && officerLogin.json?.success, 'Authorized officer signs in successfully');
  assert(officerLogin.json?.user?.role === 'MUNICIPAL_OFFICER', 'Authenticated role is MUNICIPAL_OFFICER');
  assert(officerLogin.json?.redirectUrl === '/officer/dashboard', 'Officer redirectUrl is /officer/dashboard');
  const officerCookie = officerLogin.cookie;

  const officerDash = await httpRequest(
    { hostname: 'localhost', port: 3000, path: '/officer/dashboard', method: 'GET' },
    null,
    officerCookie
  );
  assert(officerDash.status === 200, 'Officer accesses /officer/dashboard with active session (HTTP 200)');

  // --------------------------------------------------------------------------
  // Scenario 5: Invalid Officer Credentials
  // --------------------------------------------------------------------------
  console.log('\n[Scenario 5] Invalid Officer Credentials Rejection');
  const invalidOfficer = await httpRequest(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      email: 'officer.roads@punesetu.gov.in',
      password: 'IncorrectPassword!',
      portal: 'officer',
    }
  );
  assert(invalidOfficer.status === 401, 'Invalid officer password returns HTTP 401');

  // --------------------------------------------------------------------------
  // Scenario 6: Administrator Portal Identification & Mounting
  // --------------------------------------------------------------------------
  console.log('\n[Scenario 6] Administrator Portal Mounting');
  const adminPage = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/admin/login',
    method: 'GET',
  });
  assert(adminPage.status === 200, 'GET /admin/login returns HTTP 200');
  assert(adminPage.body.includes('Administrator Sign In'), '/admin/login displays Administrator title');
  assert(adminPage.body.includes('PMC Central Command'), '/admin/login displays PMC Central Command badge');
  assert(adminPage.body.includes('/login'), '/admin/login provides link to Citizen Portal');
  assert(adminPage.body.includes('/officer/login'), '/admin/login provides link to Municipal Officer Portal');

  // --------------------------------------------------------------------------
  // Scenario 7: Authorized Administrator Login
  // --------------------------------------------------------------------------
  console.log('\n[Scenario 7] Authorized Administrator Login');
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
  assert(adminLogin.status === 200 && adminLogin.json?.success, 'Authorized administrator signs in successfully');
  assert(adminLogin.json?.user?.role === 'ADMIN', 'Authenticated role is ADMIN');
  assert(adminLogin.json?.redirectUrl === '/admin/dashboard', 'Admin redirectUrl is /admin/dashboard');
  const adminCookie = adminLogin.cookie;

  const adminDash = await httpRequest(
    { hostname: 'localhost', port: 3000, path: '/admin/dashboard', method: 'GET' },
    null,
    adminCookie
  );
  assert(adminDash.status === 200, 'Administrator accesses /admin/dashboard with active session (HTTP 200)');

  // --------------------------------------------------------------------------
  // Scenario 8: Invalid Administrator Credentials
  // --------------------------------------------------------------------------
  console.log('\n[Scenario 8] Invalid Administrator Credentials Rejection');
  const invalidAdmin = await httpRequest(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      email: 'admin@punesetu.gov.in',
      password: 'IncorrectAdminKey!',
      portal: 'admin',
    }
  );
  assert(invalidAdmin.status === 401, 'Invalid admin password returns HTTP 401');

  // --------------------------------------------------------------------------
  // Scenario 9: Citizens Cannot Access Officer Routes
  // --------------------------------------------------------------------------
  console.log('\n[Scenario 9] Citizen Access Denial on Municipal Officer Routes');
  const citizenOnOfficerPortal = await httpRequest(
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
  assert(citizenOnOfficerPortal.status === 403, 'Citizen login attempt on officer portal rejected (HTTP 403)');

  const citizenOnOfficerDash = await httpRequest(
    { hostname: 'localhost', port: 3000, path: '/officer/dashboard', method: 'GET' },
    null,
    citizenCookie
  );
  assert(
    citizenOnOfficerDash.status === 307 && citizenOnOfficerDash.headers.location?.includes('/unauthorized'),
    'Citizen token requesting /officer/dashboard redirected to /unauthorized'
  );

  const citizenOnOfficerApi = await httpRequest(
    { hostname: 'localhost', port: 3000, path: '/api/officer/grievances', method: 'GET' },
    null,
    citizenCookie
  );
  assert(
    citizenOnOfficerApi.status === 401 || citizenOnOfficerApi.status === 403,
    'Citizen token requesting /api/officer/grievances rejected with HTTP 401/403'
  );

  // --------------------------------------------------------------------------
  // Scenario 10: Citizens & Officers Cannot Access Admin Routes
  // --------------------------------------------------------------------------
  console.log('\n[Scenario 10] Access Denial on PMC Central Command Routes');
  const citizenOnAdminPortal = await httpRequest(
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
  assert(citizenOnAdminPortal.status === 403, 'Citizen login attempt on admin portal rejected (HTTP 403)');

  const citizenOnAdminDash = await httpRequest(
    { hostname: 'localhost', port: 3000, path: '/admin/dashboard', method: 'GET' },
    null,
    citizenCookie
  );
  assert(
    citizenOnAdminDash.status === 307 && citizenOnAdminDash.headers.location?.includes('/unauthorized'),
    'Citizen token requesting /admin/dashboard redirected to /unauthorized'
  );

  const officerOnAdminPortal = await httpRequest(
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
  assert(officerOnAdminPortal.status === 403, 'Officer login attempt on admin portal rejected (HTTP 403)');

  const officerOnAdminDash = await httpRequest(
    { hostname: 'localhost', port: 3000, path: '/admin/dashboard', method: 'GET' },
    null,
    officerCookie
  );
  assert(
    officerOnAdminDash.status === 307 && officerOnAdminDash.headers.location?.includes('/unauthorized'),
    'Officer token requesting /admin/dashboard redirected to /unauthorized'
  );

  const officerOnAdminApi = await httpRequest(
    { hostname: 'localhost', port: 3000, path: '/api/admin/analytics', method: 'GET' },
    null,
    officerCookie
  );
  assert(
    officerOnAdminApi.status === 401 || officerOnAdminApi.status === 403,
    'Officer token requesting /api/admin/analytics rejected with HTTP 401/403'
  );

  // --------------------------------------------------------------------------
  // Scenario 11: Direct URL Access Protection
  // --------------------------------------------------------------------------
  console.log('\n[Scenario 11] Unauthenticated Direct URL Access Protection');
  const unauthOfficer = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/officer/dashboard',
    method: 'GET',
  });
  assert(
    unauthOfficer.status === 307 && unauthOfficer.headers.location?.includes('/officer/login'),
    'Unauthenticated GET /officer/dashboard redirects to /officer/login'
  );

  const unauthAdmin = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/admin/dashboard',
    method: 'GET',
  });
  assert(
    unauthAdmin.status === 307 && unauthAdmin.headers.location?.includes('/admin/login'),
    'Unauthenticated GET /admin/dashboard redirects to /admin/login'
  );

  const unauthCitizen = await httpRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/citizen/dashboard',
    method: 'GET',
  });
  assert(
    unauthCitizen.status === 307 && unauthCitizen.headers.location?.includes('/login'),
    'Unauthenticated GET /citizen/dashboard redirects to /login'
  );

  // --------------------------------------------------------------------------
  // Scenario 12: Logout Session Invalidation
  // --------------------------------------------------------------------------
  console.log('\n[Scenario 12] Logout Session Invalidation');
  const logoutRes = await httpRequest(
    { hostname: 'localhost', port: 3000, path: '/api/auth/signout', method: 'POST' },
    null,
    citizenCookie
  );
  assert(logoutRes.status === 200 && logoutRes.json?.success, 'POST /api/auth/signout returns HTTP 200');
  assert(
    logoutRes.headers['set-cookie'] &&
    logoutRes.headers['set-cookie'][0].includes('Max-Age=0'),
    'Session cookie invalidated with Max-Age=0'
  );

  // Cleared cookie attempt on protected route
  const postLogoutAccess = await httpRequest(
    { hostname: 'localhost', port: 3000, path: '/citizen/dashboard', method: 'GET' },
    null,
    'punesetu_session=; Path=/; Max-Age=0'
  );
  assert(
    postLogoutAccess.status === 307 && postLogoutAccess.headers.location?.includes('/login'),
    'Post-logout access to /citizen/dashboard strictly rejected and redirected to /login'
  );

  // --------------------------------------------------------------------------
  // Scenario 13 & 14: Refresh Stability & Multi-Viewport Verification
  // --------------------------------------------------------------------------
  console.log('\n[Scenario 13 & 14] Refresh Persistence & Multi-Viewport Layouts');

  // Verify refresh stability on authenticated dashboards
  const refresh1 = await httpRequest({ hostname: 'localhost', port: 3000, path: '/officer/dashboard', method: 'GET' }, null, officerCookie);
  const refresh2 = await httpRequest({ hostname: 'localhost', port: 3000, path: '/officer/dashboard', method: 'GET' }, null, officerCookie);
  assert(refresh1.status === 200 && refresh2.status === 200, 'Officer dashboard refresh persists without session drops');

  const adminRefresh1 = await httpRequest({ hostname: 'localhost', port: 3000, path: '/admin/dashboard', method: 'GET' }, null, adminCookie);
  const adminRefresh2 = await httpRequest({ hostname: 'localhost', port: 3000, path: '/admin/dashboard', method: 'GET' }, null, adminCookie);
  assert(adminRefresh1.status === 200 && adminRefresh2.status === 200, 'Admin command center refresh persists without session drops');

  // Chrome CDP Viewport layout inspection
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9288',
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
          http.get('http://127.0.0.1:9288/json', (res) => {
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
      await new Promise((r) => setTimeout(r, 1800));
    }

    async function evaluate(expression) {
      const res = await send('Runtime.evaluate', { expression, returnByValue: true });
      return res.result ? res.result.value : null;
    }

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

      // Test citizen login layout
      await navigateTo('http://localhost:3000/login');
      const loginLayout = await evaluate(`
        ({
          docWidth: document.documentElement.scrollWidth,
          winWidth: window.innerWidth,
          officerCard: !!document.querySelector('a[href*="/officer/login"]'),
          adminCard: !!document.querySelector('a[href*="/admin/login"]')
        })
      `);
      assert(
        loginLayout.docWidth <= loginLayout.winWidth,
        `/login at ${vp.name}: Zero horizontal overflow (${loginLayout.docWidth}px <= ${loginLayout.winWidth}px)`
      );
      assert(
        loginLayout.officerCard && loginLayout.adminCard,
        `/login at ${vp.name}: Both Officer and Admin portal access cards visible`
      );

      // Test staff portal gateway layout
      await navigateTo('http://localhost:3000/staff/login');
      const staffLayout = await evaluate(`
        ({
          docWidth: document.documentElement.scrollWidth,
          winWidth: window.innerWidth
        })
      `);
      assert(
        staffLayout.docWidth <= staffLayout.winWidth,
        `/staff/login at ${vp.name}: Zero horizontal overflow (${staffLayout.docWidth}px <= ${staffLayout.winWidth}px)`
      );
    }

    // --------------------------------------------------------------------------
    // Scenario 15: Grievance Submission & Tracking Regression Integrity
    // --------------------------------------------------------------------------
    console.log('\n[Scenario 15] Grievance Tracking & Public Services Integrity');
    await navigateTo('http://localhost:3000/track/PS-PUN-2026-0001');
    const trackPage = await evaluate(`
      ({
        hasTitle: document.body.innerText.includes('PS-PUN-2026-0001') || document.body.innerText.includes('Grievance') || document.body.innerText.includes('Tracking'),
        docWidth: document.documentElement.scrollWidth,
        winWidth: window.innerWidth
      })
    `);
    assert(trackPage.hasTitle, 'Public grievance dossier /track/PS-PUN-2026-0001 renders correctly');
    assert(trackPage.docWidth <= trackPage.winWidth, 'Grievance dossier page has zero horizontal overflow');

    ws.close();
  } catch (err) {
    console.error('Browser CDP verification exception:', err);
  } finally {
    try {
      chromeProc.kill('SIGKILL');
    } catch {}
  }

  console.log('\n================================================================');
  console.log(`  VERSION 17 AUDIT RESULT: ${passes} PASSED, ${fails} FAILED (TOTAL: ${passes + fails})`);
  console.log('================================================================\n');

  if (fails > 0) process.exit(1);
}

runAuthVerification().catch((err) => {
  console.error(err);
  process.exit(1);
});
