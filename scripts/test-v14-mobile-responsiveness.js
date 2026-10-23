const { spawn } = require('child_process');
const http = require('http');

async function run() {
  console.log('================================================================');
  console.log('  PUNESETU VERSION 14 — MOBILE RESPONSIVENESS & LAYOUT SUITE     ');
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

  // Verify server is ready
  try {
    const health = await fetch('http://localhost:3000/api/community/feed?limit=1');
    if (!health.ok) throw new Error(`HTTP ${health.status}`);
  } catch (err) {
    console.error('Next.js dev server is not accessible on http://localhost:3000:', err.message);
    process.exit(1);
  }

  // Spawn headless Chrome
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9244',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1280,800',
    'about:blank'
  ]);

  let versionData = null;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 200));
    try {
      versionData = await new Promise((resolve, reject) => {
        http.get('http://127.0.0.1:9244/json/version', res => {
          let raw = '';
          res.on('data', c => raw += c);
          res.on('end', () => resolve(JSON.parse(raw)));
        }).on('error', reject);
      });
      if (versionData) break;
    } catch (e) {}
  }

  const pages = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9244/json', res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => resolve(JSON.parse(raw)));
    }).on('error', reject);
  });

  const page = pages.find(p => p.type === 'page') || pages[0];
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

  const viewports = [
    { width: 320, height: 600, label: '320px (Compact Mobile)' },
    { width: 360, height: 740, label: '360px (Standard Mobile)' },
    { width: 390, height: 844, label: '390px (iPhone 14/15)' },
    { width: 430, height: 932, label: '430px (Large Mobile)' },
    { width: 768, height: 1024, label: '768px (Tablet Portrait)' },
    { width: 1280, height: 800, label: '1280px (Desktop Full)' }
  ];

  console.log('[1/4] Testing Community Complaint Feed (/community) Across All 6 Viewports');
  for (const vp of viewports) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 2,
      mobile: vp.width < 1024
    });

    await send('Page.navigate', { url: 'http://localhost:3000/community' });
    await new Promise(r => setTimeout(r, 2000));

    // Wait for feed cards to hydrate
    for (let i = 0; i < 25; i++) {
      const check = await send('Runtime.evaluate', {
        expression: `document.querySelectorAll('a[href*="/track/"]').length`,
        returnByValue: true
      });
      if (check.result?.result?.value > 0) break;
      await new Promise(r => setTimeout(r, 300));
    }

    const evalRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const winWidth = window.innerWidth;
        const docWidth = document.documentElement.scrollWidth;
        const hasHorizontalOverflow = docWidth > winWidth;
        const delta = docWidth - winWidth;

        // Cards check
        const trackLinks = Array.from(document.querySelectorAll('a[href*="/track/"]'));
        const cardSet = new Set();
        const cards = [];
        for (const a of trackLinks) {
          const card = a.closest('.border');
          if (card && !cardSet.has(card)) {
            cardSet.add(card);
            cards.push(card);
          }
        }

        let overflowingCards = 0;
        let validImageCards = 0;
        for (const card of cards) {
          const r = card.getBoundingClientRect();
          if (r.right > winWidth + 1) {
            overflowingCards++;
          }
          const img = card.querySelector('img, [role="img"]');
          if (img) {
            const ir = img.getBoundingClientRect();
            if (ir.width > 0 && ir.height > 0 && ir.right <= winWidth + 1) {
              validImageCards++;
            }
          }
        }

        return {
          winWidth,
          docWidth,
          hasHorizontalOverflow,
          delta,
          cardCount: cards.length,
          overflowingCards,
          validImageCards
        };
      })()`,
      returnByValue: true
    });

    const v = evalRes.result?.result?.value;
    assert(!v?.hasHorizontalOverflow, `${vp.label}: Zero horizontal overflow (docWidth=${v?.docWidth}px <= winWidth=${v?.winWidth}px)`);
    assert(v?.cardCount > 0, `${vp.label}: Successfully loaded ${v?.cardCount} complaint cards`);
    assert(v?.overflowingCards === 0, `${vp.label}: All complaint cards fit completely within viewport (0/${v?.cardCount} overflow)`);
  }

  console.log('\n[2/4] Testing Homepage Preview & Hero Responsive Layout');
  for (const vp of [viewports[0], viewports[2], viewports[5]]) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 2,
      mobile: vp.width < 1024
    });

    await send('Page.navigate', { url: 'http://localhost:3000/' });
    await new Promise(r => setTimeout(r, 2000));

    const evalRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const winWidth = window.innerWidth;
        const docWidth = document.documentElement.scrollWidth;
        return {
          winWidth,
          docWidth,
          hasOverflow: docWidth > winWidth
        };
      })()`,
      returnByValue: true
    });

    const v = evalRes.result?.result?.value;
    assert(!v?.hasOverflow, `Homepage ${vp.label}: Zero horizontal overflow (docWidth=${v?.docWidth}px <= winWidth=${v?.winWidth}px)`);
  }

  console.log('\n[3/4] Testing Civic Map (/map & /community/map) Container Responsiveness');
  for (const vp of [viewports[0], viewports[2], viewports[5]]) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 2,
      mobile: vp.width < 1024
    });

    await send('Page.navigate', { url: 'http://localhost:3000/map' });
    await new Promise(r => setTimeout(r, 2500));

    // Wait for Leaflet container to mount with valid computed height
    for (let i = 0; i < 35; i++) {
      const check = await send('Runtime.evaluate', {
        expression: `(() => {
          const c = document.querySelector('.leaflet-container');
          return !!(c && c.getBoundingClientRect().height >= 300);
        })()`,
        returnByValue: true
      });
      if (check.result?.result?.value) break;
      await new Promise(r => setTimeout(r, 300));
    }

    const evalRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const winWidth = window.innerWidth;
        const docWidth = document.documentElement.scrollWidth;
        const mapContainer = document.querySelector('.leaflet-container');
        const mr = mapContainer ? mapContainer.getBoundingClientRect() : null;
        return {
          winWidth,
          docWidth,
          hasOverflow: docWidth > winWidth,
          hasMap: !!mapContainer,
          mapWidth: mr ? Math.round(mr.width) : 0,
          mapHeight: mr ? Math.round(mr.height) : 0
        };
      })()`,
      returnByValue: true
    });

    const v = evalRes.result?.result?.value;
    assert(!v?.hasOverflow, `Civic Map ${vp.label}: Zero horizontal overflow`);
    assert(v?.hasMap && v.mapHeight >= 400, `Civic Map ${vp.label}: Map container rendered with height >= 400px (${v?.mapHeight}px)`);
  }

  console.log('\n[4/4] Testing Tracking Dossier View (/track/...) Responsiveness');
  for (const vp of [viewports[0], viewports[2]]) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 2,
      mobile: vp.width < 1024
    });

    await send('Page.navigate', { url: 'http://localhost:3000/track/PS-PUN-2026-372503' });
    await new Promise(r => setTimeout(r, 2000));

    const evalRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const winWidth = window.innerWidth;
        const docWidth = document.documentElement.scrollWidth;
        return {
          winWidth,
          docWidth,
          hasOverflow: docWidth > winWidth
        };
      })()`,
      returnByValue: true
    });

    const v = evalRes.result?.result?.value;
    assert(!v?.hasOverflow, `Track Page ${vp.label}: Zero horizontal overflow (docWidth=${v?.docWidth}px <= winWidth=${v?.winWidth}px)`);
  }

  ws.close();
  chrome.kill();

  console.log('\n================================================================');
  console.log(`  VERSION 14 RESPONSIVE TESTS: ${passes} PASSED, ${fails} FAILED (TOTAL: ${passes + fails})`);
  console.log('================================================================\n');

  if (fails > 0) {
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
