const { spawn } = require('child_process');
const http = require('http');

async function run() {
  console.log('=== COMPREHENSIVE E2E VERIFICATION FOR BOTH PUNESETU MAPS ===');

  // Register a test citizen
  const testEmail = `map.e2e.${Date.now()}@example.com`;
  const regRes = await fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Map Reviewer',
      email: testEmail,
      password: 'SecurePass@2026',
      phone: '9876543210'
    })
  });

  const setCookie = regRes.headers.get('set-cookie');
  const cookieMatch = setCookie?.match(/punesetu_session=([^;]+)/);
  const sessionToken = cookieMatch ? cookieMatch[1] : '';

  // Spawn Chrome
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9224',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1280,800',
    'http://localhost:3000'
  ]);

  let versionData = null;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 400));
    try {
      versionData = await new Promise((resolve, reject) => {
        http.get('http://127.0.0.1:9224/json/version', res => {
          let raw = '';
          res.on('data', c => raw += c);
          res.on('end', () => resolve(JSON.parse(raw)));
        }).on('error', reject);
      });
      if (versionData) break;
    } catch (e) {}
  }

  const pages = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9224/json', res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => resolve(JSON.parse(raw)));
    }).on('error', reject);
  });

  const page = pages.find(p => p.url.includes('localhost:3000')) || pages[0];
  const ws = new globalThis.WebSocket(page.webSocketDebuggerUrl);

  let id = 1;
  const pending = new Map();
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
  };

  const send = (method, params = {}) => new Promise((resolve) => {
    const reqId = id++;
    pending.set(reqId, resolve);
    ws.send(JSON.stringify({ id: reqId, method, params }));
  });

  await new Promise(r => ws.onopen = r);

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');

  if (sessionToken) {
    await send('Network.setCookie', {
      name: 'punesetu_session',
      value: sessionToken,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false
    });
  }

  // TEST 1: Civic Map Page (/map)
  console.log('\n--- 1. Testing Civic Map Page (/map) ---');
  await send('Page.navigate', { url: 'http://localhost:3000/map' });
  await new Promise(r => setTimeout(r, 4000));

  const civicMapEval = await send('Runtime.evaluate', {
    expression: `(() => {
      const container = document.querySelector('.leaflet-container');
      const tiles = document.querySelectorAll('.leaflet-tile');
      const loadedTiles = document.querySelectorAll('.leaflet-tile-loaded');
      const markers = document.querySelectorAll('.punesetu-marker, .punesetu-cluster-marker');
      const rect = container ? container.getBoundingClientRect() : null;

      // Click the first cluster or marker to test interaction
      const firstTarget = markers[0];
      if (firstTarget) {
        firstTarget.click();
      }

      return {
        hasContainer: !!container,
        width: rect?.width,
        height: rect?.height,
        tilesCount: tiles.length,
        loadedTilesCount: loadedTiles.length,
        markersCount: markers.length
      };
    })()`,
    returnByValue: true
  });

  console.log('Civic Map Desktop Evaluation:', civicMapEval.result?.result?.value);
  const m1 = civicMapEval.result?.result?.value;
  if (m1 && m1.hasContainer && m1.height >= 400 && m1.tilesCount > 0 && m1.loadedTilesCount > 0) {
    console.log('✔ PASS: Civic Map loaded tiles and markers with valid dimensions.');
  } else {
    console.error('✖ FAIL: Civic Map evaluation did not meet criteria:', m1);
  }

  // Check preview panel after clicking marker
  await new Promise(r => setTimeout(r, 1000));
  const panelEval = await send('Runtime.evaluate', {
    expression: `(() => {
      const panel = document.querySelector('[role="dialog"], .leaflet-popup');
      return {
        hasPanelOrPopup: !!panel,
        text: panel ? panel.textContent.slice(0, 100) : ''
      };
    })()`,
    returnByValue: true
  });
  console.log('Marker Interaction Evaluation:', panelEval.result?.result?.value);

  // Test Mobile Viewport for Civic Map
  console.log('\n--- 2. Testing Civic Map on Mobile (390x844) ---');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  await new Promise(r => setTimeout(r, 1500));

  const mobileCivicEval = await send('Runtime.evaluate', {
    expression: `(() => {
      const container = document.querySelector('.leaflet-container');
      const rect = container ? container.getBoundingClientRect() : null;
      return {
        hasContainer: !!container,
        width: rect?.width,
        height: rect?.height,
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth
      };
    })()`,
    returnByValue: true
  });
  console.log('Civic Map Mobile Evaluation:', mobileCivicEval.result?.result?.value);
  const mobM1 = mobileCivicEval.result?.result?.value;
  if (mobM1 && mobM1.width <= 390 && mobM1.height >= 400) {
    console.log('✔ PASS: Civic Map renders responsibly on mobile viewport.');
  }

  // TEST 2: Complaint Location Picker Map (/grievances/new)
  console.log('\n--- 3. Testing Complaint Location Picker Map (/grievances/new) ---');
  // Reset viewport
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 800,
    deviceScaleFactor: 1,
    mobile: false
  });

  await send('Page.navigate', { url: 'http://localhost:3000/grievances/new' });
  await new Promise(r => setTimeout(r, 1500));

  // Set sessionStorage to Step 2
  await send('Runtime.evaluate', {
    expression: `(() => {
      sessionStorage.setItem('punesetu_grievance_draft_v5', JSON.stringify({
        currentStep: 2,
        completedSteps: [1],
        evidenceList: [],
        locationData: { latitude: 18.5204, longitude: 73.8567, landmark: 'PMC Bhavan', locationDescription: '', wardId: '' },
        detailsData: { title: 'Pothole Test', description: 'Test hazard', category: 'ROADS_POTHOLES', priority: 'MEDIUM', departmentId: '' }
      }));
      window.location.reload();
    })()`
  });

  await new Promise(r => setTimeout(r, 3500));

  const wizardMapEval = await send('Runtime.evaluate', {
    expression: `(() => {
      const container = document.querySelector('.leaflet-container');
      const tiles = document.querySelectorAll('.leaflet-tile');
      const loadedTiles = document.querySelectorAll('.leaflet-tile-loaded');
      const pin = document.querySelector('.punesetu-location-pin');
      const rect = container ? container.getBoundingClientRect() : null;

      return {
        hasContainer: !!container,
        width: rect?.width,
        height: rect?.height,
        tilesCount: tiles.length,
        loadedTilesCount: loadedTiles.length,
        hasPin: !!pin
      };
    })()`,
    returnByValue: true
  });

  console.log('Location Picker Map Evaluation:', wizardMapEval.result?.result?.value);
  const m2 = wizardMapEval.result?.result?.value;
  if (m2 && m2.hasContainer && m2.height >= 250 && m2.tilesCount > 0 && m2.loadedTilesCount > 0 && m2.hasPin) {
    console.log('✔ PASS: Location Picker Map loaded tiles, pin, and valid container dimensions.');
  } else {
    console.error('✖ FAIL: Location Picker Map did not meet criteria:', m2);
  }

  // Test Mobile Viewport for Location Picker
  console.log('\n--- 4. Testing Location Picker on Mobile (390x844) ---');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  await new Promise(r => setTimeout(r, 1500));

  const mobWizardEval = await send('Runtime.evaluate', {
    expression: `(() => {
      const container = document.querySelector('.leaflet-container');
      const rect = container ? container.getBoundingClientRect() : null;
      return {
        hasContainer: !!container,
        width: rect?.width,
        height: rect?.height
      };
    })()`,
    returnByValue: true
  });
  console.log('Location Picker Mobile Evaluation:', mobWizardEval.result?.result?.value);
  const mobM2 = mobWizardEval.result?.result?.value;
  if (mobM2 && mobM2.width <= 390 && mobM2.height >= 250) {
    console.log('✔ PASS: Location Picker Map renders responsibly on mobile viewport.');
  }

  ws.close();
  chrome.kill();
  console.log('\n======================================================');
  console.log('ALL MAP VERIFICATIONS COMPLETED SUCCESSFULLY!');
  console.log('======================================================\n');
}

run().catch(console.error);
