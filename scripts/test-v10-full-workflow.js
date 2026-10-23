/**
 * PuneSetu Version 10 — Critical Citizen-to-Officer-to-Administrator Workflow Test
 * 
 * Verifies all 13 steps of the end-to-end civic journey via live HTTP API endpoints:
 * 1. Citizen Authentication
 * 2. Grievance Submission
 * 3. Unique Tracking Token Generation (PS-PUN-YYYY-XXXXXX)
 * 4. Disk Store Persistence & Atomic Integrity
 * 5. Public Discovery & Privacy Masking
 * 6. Endorsement & Duplicate Prevention
 * 7. Following & State Persistence
 * 8. Municipal Officer Scoped Access
 * 9. Officer Progress Transition (IN_PROGRESS)
 * 10. Resolution Proof & Closing Remarks Enforcement
 * 11. Citizen Dossier Re-Inspection
 * 12. Citizen Satisfaction Feedback
 * 13. Administrator Analytics Aggregations
 */

const fs = require('fs');
const path = require('path');
const STORE_FILE = path.join(process.cwd(), 'data', 'punesetu-civic-store.json');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
  reset: '\x1b[0m',
};

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ${colors.green}✔ PASS:${colors.reset} ${message}`);
    passed++;
  } else {
    console.error(`  ${colors.red}✖ FAIL:${colors.reset} ${message}`);
    failed++;
  }
}

async function request(url, options = {}, cookie = '') {
  const headers = {
    'Content-Type': 'application/json',
    ...(cookie ? { Cookie: cookie } : {}),
    ...(options.headers || {}),
  };
  const res = await fetch(`http://localhost:3000${url}`, {
    ...options,
    headers,
  });

  const resCookie = res.headers.get('set-cookie');
  let data = null;
  const text = await res.text();
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: res.status, data, cookie: resCookie || cookie };
}

async function runWorkflow() {
  console.log(`\n${colors.bold}${colors.cyan}================================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}  PUNESETU VERSION 10 — FULL LIFECYCLE END-TO-END WORKFLOW TEST ${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}================================================================${colors.reset}\n`);

  // STEP 1: CITIZEN 1 REGISTRATION / AUTHENTICATION
  console.log(`${colors.bold}STEP 1: Citizen 1 Authentication${colors.reset}`);
  const citizenEmail = `citizen.v10.${Date.now()}@example.com`;
  const citizenPass = 'SecureCitizenPass@2026';

  const regRes = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Rohan Deshmukh',
      email: citizenEmail,
      password: citizenPass,
      phone: '9822012345',
    }),
  });

  assert(regRes.status === 201 && regRes.data.success, "Citizen 1 successfully registered");
  assert(regRes.data.user.role === 'CITIZEN', "Public registration strictly assigned CITIZEN role");
  let citizen1Cookie = regRes.cookie;

  // Verify server session
  const meRes = await request('/api/auth/me', { method: 'GET' }, citizen1Cookie);
  assert(meRes.status === 200 && meRes.data.authenticated, "Citizen 1 session verified via httpOnly cookie");
  assert(meRes.data.user.email === citizenEmail, "Session identity derived authoritatively from JWT");

  // STEP 2: GRIEVANCE SUBMISSION THROUGH REPORTING WIZARD
  console.log(`\n${colors.bold}STEP 2: Grievance Submission with Photographic Evidence${colors.reset}`);
  const submitRes = await request('/api/grievances', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Dangerous Pothole on FC Road near Goodluck Chowk',
      description: 'Large 4-inch deep pothole causing severe two-wheeler skidding risk during evening traffic hours.',
      category: 'ROADS_POTHOLES',
      priority: 'HIGH',
      wardId: 'wrd_02',
      departmentId: 'dept_01',
      locationDescription: 'Near Goodluck Chowk, FC Road, Shivajinagar, Pune 411004',
      latitude: 18.5204,
      longitude: 73.8427,
      evidence: [
        {
          storageKey: 'pothole_fc_road_v10.jpg',
          originalFilename: 'pothole_fc_road.jpg',
          sizeBytes: 1024 * 350,
          mimeType: 'image/jpeg',
          evidenceType: 'PHOTO',
        },
      ],
    }),
  }, citizen1Cookie);

  assert(submitRes.status === 201 && submitRes.data.success, "Grievance submitted successfully");
  const grievance = submitRes.data.grievance;

  // STEP 3: TRACKING TOKEN FORMAT & UNIQUENESS
  console.log(`\n${colors.bold}STEP 3: Authoritative Tracking Token Generation${colors.reset}`);
  const token = grievance.trackingToken;
  console.log(`  Issued Tracking Token: ${colors.bold}${token}${colors.reset}`);
  assert(/^PS-PUN-\d{4}-[A-Z0-9]{6}$/.test(token), `Token matches format PS-PUN-YYYY-XXXXXX (${token})`);

  // STEP 4: DATABASE PERSISTENCE VERIFICATION
  console.log(`\n${colors.bold}STEP 4: Database Persistence Verification${colors.reset}`);
  assert(grievance.id && grievance.id.startsWith('grv_'), "Grievance assigned persistent ID (grv_...)");
  assert(grievance.status === 'SUBMITTED', "Grievance initial status is SUBMITTED");

  // Read actual persisted disk file to verify atomic persistence
  const diskStore = JSON.parse(fs.readFileSync(STORE_FILE, 'utf8'));
  const persistedGrievance = diskStore.grievances.find(g => g.trackingToken === token);
  assert(persistedGrievance !== undefined, "Grievance persisted to data/punesetu-civic-store.json on disk");
  const persistedHistory = diskStore.statusHistory.filter(h => h.grievanceId === grievance.id);
  assert(persistedHistory.length >= 1, `Initial status history transition recorded on disk (${persistedHistory.length} entry)`);
  const persistedEvidence = diskStore.evidence.filter(e => e.grievanceId === grievance.id);
  assert(persistedEvidence.length === 1, "Evidence metadata persisted to store file on disk");

  // STEP 5: PUBLIC DISCOVERY & PRIVACY MASKING
  console.log(`\n${colors.bold}STEP 5: Public Discovery & Privacy Masking${colors.reset}`);
  const publicRes = await request(`/api/grievances/${token}`, { method: 'GET' });
  assert(publicRes.status === 200 && publicRes.data.success, "Grievance discoverable via public tracking lookup");
  const publicRecord = publicRes.data.grievance;
  assert(publicRecord.citizenPhone === undefined || publicRecord.citizenPhone === null || publicRecord.citizenPhone.includes('***'), "Citizen telephone masked/scrubbed from public tracking response");
  assert(publicRecord.title === 'Dangerous Pothole on FC Road near Goodluck Chowk', "Public record retains verified title");

  // STEP 6: SECOND CITIZEN ENDORSEMENT & DUPLICATE PREVENTION
  console.log(`\n${colors.bold}STEP 6: Second Citizen Endorsement & Duplicate Prevention${colors.reset}`);
  const citizen2Email = `citizen2.v10.${Date.now()}@example.com`;
  const reg2Res = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Pooja Kulkarni',
      email: citizen2Email,
      password: 'SecurePass@2026!',
      phone: '9822099999',
    }),
  });
  let citizen2Cookie = reg2Res.cookie;

  const endorseRes1 = await request(`/api/grievances/${token}/endorse`, { method: 'POST' }, citizen2Cookie);
  assert(endorseRes1.status === 200 && endorseRes1.data.endorsed === true, "Citizen 2 successfully endorsed grievance");
  assert(endorseRes1.data.totalEndorsements >= 1, `Endorsements count incremented to ${endorseRes1.data.totalEndorsements}`);

  // Duplicate prevention check (second click toggles off without double-counting)
  const endorseRes2 = await request(`/api/grievances/${token}/endorse`, { method: 'POST' }, citizen2Cookie);
  assert(endorseRes2.status === 200 && endorseRes2.data.endorsed === false, "Duplicate click safely toggles off endorsement (prevents duplicate votes)");

  // Re-endorse for realistic workflow
  await request(`/api/grievances/${token}/endorse`, { method: 'POST' }, citizen2Cookie);

  // STEP 7: FOLLOWING & NOTIFICATIONS
  console.log(`\n${colors.bold}STEP 7: Following Grievance Updates${colors.reset}`);
  const followRes = await request(`/api/grievances/${token}/follow`, { method: 'POST' }, citizen2Cookie);
  assert(followRes.status === 200 && followRes.data.following === true, "Citizen 2 followed grievance for real-time status notifications");

  // STEP 8: MUNICIPAL OFFICER ACCESS & SCOPING
  console.log(`\n${colors.bold}STEP 8: Municipal Officer Scoped Clearance${colors.reset}`);
  const officerLogin = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'officer.roads@punesetu.gov.in',
      password: 'OfficerPass@2026',
    }),
  });
  assert(officerLogin.status === 200 && officerLogin.data.success, "Roads Officer signed in successfully");
  const officerCookie = officerLogin.cookie;
  assert(officerLogin.data.user.role === 'MUNICIPAL_OFFICER', "Officer authenticated as MUNICIPAL_OFFICER");

  const officerQueue = await request(`/api/officer/grievances?search=${token}`, { method: 'GET' }, officerCookie);
  assert(officerQueue.status === 200 && officerQueue.data.success, "Officer retrieved department operational queue");
  const ourGrievanceInQueue = (officerQueue.data.items || []).find(g => g.trackingToken === token);
  assert(ourGrievanceInQueue !== undefined, "Roads grievance appeared in Roads Department operational queue");

  // STEP 9: OFFICER STATUS PROGRESSION (ASSIGNED -> IN_PROGRESS)
  console.log(`\n${colors.bold}STEP 9: Officer Transitions Status (ASSIGNED -> IN_PROGRESS)${colors.reset}`);
  const assignRes = await request(`/api/grievances/${token}/status`, {
    method: 'PATCH',
    body: JSON.stringify({
      newStatus: 'ASSIGNED',
      notes: 'Grievance accepted and assigned to Ward 2 road maintenance crew.',
    }),
  }, officerCookie);
  assert(assignRes.status === 200 && assignRes.data.success, "Officer transitioned status to ASSIGNED");

  const progressRes = await request(`/api/grievances/${token}/status`, {
    method: 'PATCH',
    body: JSON.stringify({
      newStatus: 'IN_PROGRESS',
      notes: 'Field inspection completed by Ward 2 road crew. Material and asphalt requisitioned for overnight repair.',
    }),
  }, officerCookie);

  assert(progressRes.status === 200 && progressRes.data.success, "Status transition to IN_PROGRESS recorded");
  assert(progressRes.data.grievance.status === 'IN_PROGRESS', "Grievance status updated to IN_PROGRESS");

  // STEP 10: RESOLUTION PROOF ENFORCEMENT & RESOLUTION
  console.log(`\n${colors.bold}STEP 10: Mandatory Evidence Enforcement on Resolution${colors.reset}`);
  // Attempt resolution WITHOUT remarks / evidence (should fail)
  const badResolveRes = await request(`/api/grievances/${token}/status`, {
    method: 'PATCH',
    body: JSON.stringify({
      newStatus: 'RESOLVED',
      notes: 'Fixed.',
    }),
  }, officerCookie);
  assert(badResolveRes.status === 400, "Server strictly rejected RESOLVED status without mandatory resolution photo and <10 char remarks");

  // Legitimate resolution WITH mandatory photo and closing remarks
  const goodResolveRes = await request(`/api/grievances/${token}/status`, {
    method: 'PATCH',
    body: JSON.stringify({
      newStatus: 'RESOLVED',
      notes: 'Pothole asphalt filling and steam-roller compaction completed successfully on FC Road. Road surface leveled.',
      resolutionEvidence: [
        {
          storageKey: 'resolution_fc_road_proof.jpg',
          originalFilename: 'resolution_fc_road_proof.jpg',
          sizeBytes: 1024 * 420,
          mimeType: 'image/jpeg',
          evidenceType: 'PHOTO',
        },
      ],
    }),
  }, officerCookie);

  assert(goodResolveRes.status === 200 && goodResolveRes.data.success, "Grievance transitioned to RESOLVED with verified photographic proof and closing remarks");
  assert(goodResolveRes.data.grievance.status === 'RESOLVED', "Grievance status is RESOLVED");

  // STEP 11: CITIZEN DOSSIER RE-INSPECTION
  console.log(`\n${colors.bold}STEP 11: Citizen Dossier Inspection of Resolution${colors.reset}`);
  const citizenDossier = await request(`/api/grievances/${token}`, { method: 'GET' }, citizen1Cookie);
  assert(citizenDossier.status === 200, "Citizen retrieved case dossier");
  assert(citizenDossier.data.grievance.status === 'RESOLVED', "Citizen sees case is marked RESOLVED");
  const timelineLength = citizenDossier.data.tracking?.timeline?.length || 0;
  assert(timelineLength >= 3, `Status history displays full progression (${timelineLength} steps: SUBMITTED -> IN_PROGRESS -> RESOLVED)`);

  // STEP 12: CITIZEN SATISFACTION FEEDBACK
  console.log(`\n${colors.bold}STEP 12: Citizen Satisfaction Feedback Submission${colors.reset}`);
  const feedbackRes = await request(`/api/grievances/${token}/feedback`, {
    method: 'POST',
    body: JSON.stringify({
      rating: 5,
      feedbackText: 'Excellent prompt repair by Ghole Road ward crew! Road is safe again.',
    }),
  }, citizen1Cookie);

  assert(feedbackRes.status === 201 && feedbackRes.data.success, "Citizen 1 submitted 5-star satisfaction rating");

  // STEP 13: ADMINISTRATOR ANALYTICS AGGREGATIONS
  console.log(`\n${colors.bold}STEP 13: Administrator Command Center Governance & Analytics${colors.reset}`);
  const adminLogin = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'admin@punesetu.gov.in',
      password: 'ChangeMe@Pune2026!',
    }),
  });
  assert(adminLogin.status === 200 && adminLogin.data.success, "Administrator signed in successfully");
  const adminCookie = adminLogin.cookie;
  assert(adminLogin.data.user.role === 'ADMIN', "Authenticated with ADMIN role clearance");

  const analyticsRes = await request('/api/admin/analytics', { method: 'GET' }, adminCookie);
  assert(analyticsRes.status === 200 && analyticsRes.data.success, "Administrator retrieved live system analytics");
  assert(analyticsRes.data.analytics.totalGrievances >= 1, "Total complaints aggregated from real database");
  assert(analyticsRes.data.analytics.resolvedCount >= 1, "Resolved cases metric includes newly resolved case");
  assert(analyticsRes.data.analytics.citizenSatisfactionScore >= 1, "Citizen satisfaction score calculated from real feedback ratings");

  console.log(`\n${colors.bold}================================================================${colors.reset}`);
  console.log(`${colors.bold}WORKFLOW VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})${colors.reset}`);
  console.log(`${colors.bold}================================================================\n${colors.reset}`);

  if (failed > 0) {
    process.exit(1);
  }
}

runWorkflow().catch(err => {
  console.error("Workflow execution error:", err);
  process.exit(1);
});
