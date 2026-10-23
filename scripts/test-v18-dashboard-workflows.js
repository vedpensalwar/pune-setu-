const http = require('http');

async function runDashboardWorkflowTests() {
  console.log('================================================================');
  console.log('  PUNESETU VERSION 18 — DASHBOARD WORKFLOWS & RBAC VERIFICATION ');
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

  const BASE_URL = 'http://localhost:3000';

  // Helper to extract cookie from set-cookie header
  function extractCookie(res) {
    const setCookie = res.headers.get('set-cookie');
    if (!setCookie) return '';
    const match = setCookie.match(/punesetu_session=[^;]+/);
    return match ? match[0] : '';
  }

  // 0. Verify dev server is accessible
  try {
    const ping = await fetch(`${BASE_URL}/api/departments`);
    if (!ping.ok) throw new Error(`HTTP ${ping.status}`);
  } catch (err) {
    console.error('Next.js dev server is not accessible on http://localhost:3000:', err.message);
    process.exit(1);
  }

  // 1. Authenticate All User Tiers
  console.log('[Setup] Registering and Authenticating Real User Roles');

  // Citizen A
  const citizenAEmail = `citizen.v18.a.${Date.now()}@example.com`;
  const citizenAPass = 'CitizenPass@2026!';
  const citizenAName = 'Aarav Deshmukh';

  const regARes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: citizenAName,
      email: citizenAEmail,
      password: citizenAPass,
      confirmPassword: citizenAPass,
    }),
  });
  assert(regARes.status === 201, 'Citizen A registers successfully via /api/auth/register (HTTP 201)');

  const loginARes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: citizenAEmail,
      password: citizenAPass,
      portal: 'citizen',
    }),
  });
  const cookieCitizenA = extractCookie(loginARes);
  assert(loginARes.status === 200 && Boolean(cookieCitizenA), 'Citizen A authenticates and receives real session cookie');

  // Citizen B
  const citizenBEmail = `citizen.v18.b.${Date.now()}@example.com`;
  const citizenBPass = 'CitizenPass@2026!';
  const citizenBName = 'Sneha Joshi';

  const regBRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: citizenBName,
      email: citizenBEmail,
      password: citizenBPass,
      confirmPassword: citizenBPass,
    }),
  });
  assert(regBRes.status === 201, 'Citizen B registers successfully via /api/auth/register (HTTP 201)');

  const loginBRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: citizenBEmail,
      password: citizenBPass,
      portal: 'citizen',
    }),
  });
  const cookieCitizenB = extractCookie(loginBRes);
  assert(loginBRes.status === 200 && Boolean(cookieCitizenB), 'Citizen B authenticates and receives real session cookie');

  // Municipal Officer (Roads)
  const loginOffRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'officer.roads@punesetu.gov.in',
      password: 'OfficerPass@2026',
      portal: 'officer',
    }),
  });
  const cookieOfficerRoads = extractCookie(loginOffRes);
  assert(loginOffRes.status === 200 && Boolean(cookieOfficerRoads), 'Municipal Officer authenticates on /officer/login (HTTP 200)');

  // Administrator
  const loginAdminRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@punesetu.gov.in',
      password: 'ChangeMe@Pune2026!',
      portal: 'admin',
    }),
  });
  const cookieAdmin = extractCookie(loginAdminRes);
  assert(loginAdminRes.status === 200 && Boolean(cookieAdmin), 'Administrator authenticates on /admin/login (HTTP 200)');

  let createdTrackingToken = null;
  let createdGrievanceId = null;

  // --------------------------------------------------------------------------
  // STEP 1: CITIZEN DASHBOARD & GRIEVANCE REPORTING
  // --------------------------------------------------------------------------
  console.log('\n[Step 1] Citizen Dashboard & Grievance Reporting');

  // 1.1 Citizen files a grievance
  try {
    const res = await fetch(`${BASE_URL}/api/grievances`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieCitizenA,
      },
      body: JSON.stringify({
        title: 'Dangerous road depression on FC Road near Goodluck Chowk',
        description: 'Large 4-inch deep pothole causing severe two-wheeler skidding risk during evening traffic hours.',
        category: 'ROADS_POTHOLES',
        priority: 'HIGH',
        latitude: 18.5204,
        longitude: 73.8427,
        landmark: 'Opposite Goodluck Cafe, FC Road',
        wardId: 'wrd_02',
        departmentId: 'dept_01',
      }),
    });

    const data = await res.json();
    assert(res.status === 201 && data.success, 'Citizen A successfully files grievance (HTTP 201)');
    assert(Boolean(data.trackingToken && data.trackingToken.startsWith('PS-PUN-')), 'Valid tracking token issued: ' + data.trackingToken);
    createdTrackingToken = data.trackingToken;
    createdGrievanceId = data.grievance?.id;
  } catch (err) {
    assert(false, 'Grievance submission threw error: ' + err.message);
  }

  // 1.2 Citizen queries own grievances on citizen dashboard
  try {
    const res = await fetch(`${BASE_URL}/api/grievances?citizenOnly=true`, {
      headers: { Cookie: cookieCitizenA },
    });
    const data = await res.json();
    assert(res.ok && data.success, 'Citizen A retrieves own grievances via /api/grievances?citizenOnly=true');
    const match = data.grievances?.find((g) => g.trackingToken === createdTrackingToken);
    assert(Boolean(match), 'Submitted grievance appears in Citizen A dashboard queue');
    assert(match?.status === 'SUBMITTED', 'Grievance status is initially SUBMITTED');
    assert(match?.category === 'ROADS_POTHOLES', 'Category matches ROADS_POTHOLES');
    assert(match?.citizenName === citizenAName, 'Record displays reporting citizen name');
  } catch (err) {
    assert(false, 'Citizen list query failed: ' + err.message);
  }

  // 1.3 Search and filtering in citizen dashboard
  try {
    const resSearch = await fetch(`${BASE_URL}/api/grievances?citizenOnly=true&search=Goodluck`, {
      headers: { Cookie: cookieCitizenA },
    });
    const dataSearch = await resSearch.json();
    assert(dataSearch.grievances?.some((g) => g.trackingToken === createdTrackingToken), 'Search by keyword "Goodluck" successfully filters matching grievance');

    const resFilter = await fetch(`${BASE_URL}/api/grievances?citizenOnly=true&status=SUBMITTED`, {
      headers: { Cookie: cookieCitizenA },
    });
    const dataFilter = await resFilter.json();
    assert(dataFilter.grievances?.some((g) => g.trackingToken === createdTrackingToken), 'Filter by status "SUBMITTED" matches grievance');
  } catch (err) {
    assert(false, 'Citizen search and filter failed: ' + err.message);
  }

  // 1.4 Privacy & Isolation: Citizen B cannot see Citizen A's private grievance
  try {
    const resB = await fetch(`${BASE_URL}/api/grievances?citizenOnly=true`, {
      headers: { Cookie: cookieCitizenB },
    });
    const dataB = await resB.json();
    const hasLeak = dataB.grievances?.some((g) => g.trackingToken === createdTrackingToken);
    assert(!hasLeak, 'Citizen B dashboard queue STRICTLY hides Citizen A private grievances (Zero PII leakage)');
    assert(dataB.grievances?.length === 0, 'Citizen B has clean empty state (0 active complaints)');
  } catch (err) {
    assert(false, 'Privacy isolation check failed: ' + err.message);
  }

  // --------------------------------------------------------------------------
  // STEP 2: MUNICIPAL OFFICER WORKFLOWS
  // --------------------------------------------------------------------------
  console.log('\n[Step 2] Municipal Officer Workflows');

  // 2.1 Officer loads queue (use token-based search to handle pagination when queue has 20+ items)
  try {
    const res = await fetch(`${BASE_URL}/api/officer/grievances`, {
      headers: { Cookie: cookieOfficerRoads },
    });
    const data = await res.json();
    assert(res.ok && data.success, 'Roads Officer loads operational queue (HTTP 200)');

    // Use token-based search query to locate the specific grievance regardless of pagination depth
    const searchRes = await fetch(
      `${BASE_URL}/api/officer/grievances?search=${encodeURIComponent(createdTrackingToken)}`,
      { headers: { Cookie: cookieOfficerRoads } }
    );
    const searchData = await searchRes.json();
    const inQueue = searchData.items?.some((i) => i.trackingToken === createdTrackingToken);
    assert(inQueue, 'Newly submitted road grievance is visible in Roads Department queue');
  } catch (err) {
    assert(false, 'Officer queue query failed: ' + err.message);
  }

  // 2.2 Officer operational statistics API
  try {
    const res = await fetch(`${BASE_URL}/api/officer/stats`, {
      headers: { Cookie: cookieOfficerRoads },
    });
    const data = await res.json();
    assert(res.ok && data.success, 'Officer operational statistics API returns HTTP 200');
    assert(typeof data.stats?.assignedTotal === 'number', 'Contains computed assignedTotal metric');
  } catch (err) {
    assert(false, 'Officer stats API failed: ' + err.message);
  }

  // 2.3 Officer updates status: First SUBMITTED -> ASSIGNED, then ASSIGNED -> IN_PROGRESS
  try {
    const resAssign = await fetch(`${BASE_URL}/api/grievances/${createdTrackingToken}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieOfficerRoads,
      },
      body: JSON.stringify({
        newStatus: 'ASSIGNED',
        notes: 'Grievance acknowledged and assigned to FC Road field squad.',
      }),
    });
    const dataAssign = await resAssign.json();
    assert(resAssign.ok && dataAssign.success, 'Roads Officer acknowledges and transitions status to ASSIGNED (HTTP 200)');
    assert(dataAssign.grievance?.status === 'ASSIGNED', 'Persisted status is now ASSIGNED');

    const resProg = await fetch(`${BASE_URL}/api/grievances/${createdTrackingToken}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieOfficerRoads,
      },
      body: JSON.stringify({
        newStatus: 'IN_PROGRESS',
        notes: 'Inspection team dispatched to FC Road. Asphalt hot-mix patch scheduled for 22:00 IST.',
      }),
    });
    const dataProg = await resProg.json();
    assert(resProg.ok && dataProg.success, 'Roads Officer successfully transitions status to IN_PROGRESS (HTTP 200)');
    assert(dataProg.grievance?.status === 'IN_PROGRESS', 'Persisted status is now IN_PROGRESS');
  } catch (err) {
    assert(false, 'Status transition failed: ' + err.message);
  }

  // 2.4 Illegal status transition rejected
  try {
    const res = await fetch(`${BASE_URL}/api/grievances/${createdTrackingToken}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieOfficerRoads,
      },
      body: JSON.stringify({
        newStatus: 'SUBMITTED',
        notes: 'Illegal backwards transition to SUBMITTED',
      }),
    });
    assert(!res.ok, 'Unsupported status transition (IN_PROGRESS -> SUBMITTED) is rejected with HTTP 400');
  } catch (err) {
    assert(false, 'Illegal transition check failed: ' + err.message);
  }

  // 2.5 Resolution requirements check
  try {
    const res = await fetch(`${BASE_URL}/api/grievances/${createdTrackingToken}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieOfficerRoads,
      },
      body: JSON.stringify({
        newStatus: 'RESOLVED',
        notes: 'Short', // < 10 characters
      }),
    });
    assert(!res.ok, 'Resolving grievance without formal closing remarks (min 10 chars) is rejected (HTTP 400)');
  } catch (err) {
    assert(false, 'Resolution validation check failed: ' + err.message);
  }

  // 2.6 Officer adds internal operational note
  try {
    const res = await fetch(`${BASE_URL}/api/grievances/${createdTrackingToken}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieOfficerRoads,
      },
      body: JSON.stringify({
        content: 'PMC Quality Control team inspected base compaction. Ready for resurfacing.',
        isInternal: true,
      }),
    });
    const data = await res.json();
    assert(res.ok && data.success, 'Officer adds internal operational note to audit history (HTTP 200)');
  } catch (err) {
    assert(false, 'Officer note submission failed: ' + err.message);
  }

  // --------------------------------------------------------------------------
  // STEP 3: ADMINISTRATOR DASHBOARD & OVERSIGHT
  // --------------------------------------------------------------------------
  console.log('\n[Step 3] Administrator Dashboard & Platform Oversight');

  // 3.1 Admin Overview Analytics
  try {
    const res = await fetch(`${BASE_URL}/api/admin/analytics`, {
      headers: { Cookie: cookieAdmin },
    });
    const data = await res.json();
    assert(res.ok && data.success, 'Administrator retrieves system analytics (HTTP 200)');
    assert(typeof data.analytics?.totalGrievances === 'number', 'Analytics contains totalGrievances count: ' + data.analytics?.totalGrievances);
    assert(typeof data.analytics?.inProgress === 'number', 'Analytics contains inProgress count: ' + data.analytics?.inProgress);
  } catch (err) {
    assert(false, 'Admin analytics failed: ' + err.message);
  }

  // 3.2 Platform-wide grievance inspection
  try {
    const res = await fetch(`${BASE_URL}/api/grievances?limit=50`, {
      headers: { Cookie: cookieAdmin },
    });
    const data = await res.json();
    assert(res.ok && data.success, 'Admin queries platform-wide grievances');
    assert(data.grievances?.some((g) => g.trackingToken === createdTrackingToken), 'Created grievance is visible in Admin platform oversight');
  } catch (err) {
    assert(false, 'Admin grievance query failed: ' + err.message);
  }

  // 3.3 Admin Reassignment / Assignment
  try {
    const res = await fetch(`${BASE_URL}/api/officer/reassign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieAdmin,
      },
      body: JSON.stringify({
        trackingToken: createdTrackingToken,
        targetDepartmentId: 'dept_01',
        targetWardId: 'wrd_02',
        reason: 'Administrative directive: High priority corridor resurfacing fast-track.',
      }),
    });
    const data = await res.json();
    assert(res.ok && data.success, 'Admin executes formal reassignment/assignment with justification (HTTP 200)');
  } catch (err) {
    assert(false, 'Admin reassignment failed: ' + err.message);
  }

  // 3.4 Audit Trail Verification
  try {
    const res = await fetch(`${BASE_URL}/api/admin/audit?limit=20`, {
      headers: { Cookie: cookieAdmin },
    });
    const data = await res.json();
    assert(res.ok && data.success, 'Admin retrieves immutable audit trail records');
    assert(Array.isArray(data.logs) && data.logs.length > 0, 'Audit trail contains recorded actions');
  } catch (err) {
    assert(false, 'Admin audit query failed: ' + err.message);
  }

  // 3.5 Non-Admin Role Denial
  try {
    const resCitizen = await fetch(`${BASE_URL}/api/admin/analytics`, {
      headers: { Cookie: cookieCitizenA },
    });
    assert(resCitizen.status === 401 || resCitizen.status === 403, 'Citizen token strictly denied from /api/admin/analytics');

    const resOfficer = await fetch(`${BASE_URL}/api/admin/analytics`, {
      headers: { Cookie: cookieOfficerRoads },
    });
    assert(resOfficer.status === 401 || resOfficer.status === 403, 'Officer token strictly denied from /api/admin/analytics');
  } catch (err) {
    assert(false, 'Non-admin denial check failed: ' + err.message);
  }

  // --------------------------------------------------------------------------
  // STEP 4: CROSS-ROLE LIFECYCLE & NOTIFICATIONS
  // --------------------------------------------------------------------------
  console.log('\n[Step 4] Cross-Role Lifecycle Synchronization');

  // 4.1 Citizen receives in-app notification of status transition
  try {
    const res = await fetch(`${BASE_URL}/api/notifications`, {
      headers: { Cookie: cookieCitizenA },
    });
    const data = await res.json();
    assert(res.ok && data.success, 'Citizen A retrieves notification feed (HTTP 200)');
    const hasStatusNotif = data.notifications?.some(
      (n) => n.grievanceId === createdGrievanceId && n.title?.includes('IN PROGRESS')
    );
    assert(hasStatusNotif, 'Status transition by officer automatically triggered in-app notification for Citizen A');
  } catch (err) {
    assert(false, 'Citizen notification verification failed: ' + err.message);
  }

  // 4.2 Citizen opens full tracking dossier
  try {
    const res = await fetch(`${BASE_URL}/track/${createdTrackingToken}`);
    assert(res.status === 200, 'Public/Citizen dossier /track/' + createdTrackingToken + ' returns HTTP 200');
    const html = await res.text();
    assert(html.includes('IN_PROGRESS') || html.includes('In Progress'), 'Dossier page renders updated status IN_PROGRESS');
    assert(html.includes('FC Road') || html.includes('Goodluck'), 'Dossier page displays complaint title/location');
  } catch (err) {
    assert(false, 'Dossier verification failed: ' + err.message);
  }

  // --------------------------------------------------------------------------
  // STEP 5: DASHBOARD PAGES ACCESSIBILITY & RENDERING
  // --------------------------------------------------------------------------
  console.log('\n[Step 5] Dashboard Pages Server-Side Rendering');

  try {
    const resCitizenDash = await fetch(`${BASE_URL}/citizen/dashboard`, {
      headers: { Cookie: cookieCitizenA },
    });
    assert(resCitizenDash.status === 200, 'Citizen Dashboard /citizen/dashboard renders HTTP 200 with session');
    const htmlCitizen = await resCitizenDash.text();
    assert(htmlCitizen.includes('Welcome') && htmlCitizen.includes('Aarav Deshmukh'), 'Citizen dashboard displays personalized welcome banner');
    assert(htmlCitizen.includes('My Filed Grievances'), 'Citizen dashboard renders functional workspace tabs');

    const resOfficerDash = await fetch(`${BASE_URL}/officer/dashboard`, {
      headers: { Cookie: cookieOfficerRoads },
    });
    assert(resOfficerDash.status === 200, 'Officer Dashboard /officer/dashboard renders HTTP 200 with session');

    const resAdminDash = await fetch(`${BASE_URL}/admin/dashboard`, {
      headers: { Cookie: cookieAdmin },
    });
    assert(resAdminDash.status === 200, 'Admin Dashboard /admin/dashboard renders HTTP 200 with session');
  } catch (err) {
    assert(false, 'Dashboard SSR verification failed: ' + err.message);
  }

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`  VERSION 18 AUDIT RESULT: ${passes} PASSED, ${fails} FAILED (TOTAL: ${passes + fails})`);
  console.log('================================================================\n');

  if (fails > 0) {
    process.exit(1);
  }
}

runDashboardWorkflowTests().catch((err) => {
  console.error('Master test runner encountered error:', err);
  process.exit(1);
});
