/**
 * PuneSetu (पुणे सेतू) - End-to-End Civic Backend & API Integration Suite
 *
 * Runs against live running Next.js instance on BASE_URL (default http://127.0.0.1:3005):
 * 1. Homepage preservation (GET / returns 200, title & PuneSetu branding)
 * 2. GET /api/departments (returns 8 active departments)
 * 3. GET /api/wards (returns 15 active Pune Prabhag wards)
 * 4. POST /api/grievances unauthenticated rejection (401)
 * 5. Citizen registration & authenticated session cookie issuance
 * 6. POST /api/grievances with valid Pune coordinates (201 Created + canonical token)
 * 7. POST /api/grievances with out-of-bounds coordinates (400 Bad Request)
 * 8. GET /api/grievances/[token] anonymous lookup (Privacy masking: coordinates & email scrubbed)
 * 9. GET /api/grievances/[token] owner lookup (Full coordinates & profile preserved)
 * 10. POST /api/grievances/[token]/endorse (First endorse = true, second = false)
 * 11. POST /api/grievances/[token]/follow (First follow = true, second = false)
 * 12. POST /api/grievances/[token]/comments (Public comment added)
 * 13. POST /api/grievances/[token]/status citizen unauthorized status transition rejection (400)
 * 14. POST /api/grievances/[token]/feedback on non-resolved grievance rejection (400)
 * 15. POST /api/grievances/[token]/evidence (Metadata recorded)
 * 16. GET /api/grievances/[token]/evidence (Metadata retrieved)
 * 17. GET /api/grievances with pagination & filtering
 */

const BASE_URL = process.env.TEST_URL || "http://127.0.0.1:3005";

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  bold: "\x1b[1m",
};

let passed = 0;
let failed = 0;

function assert(condition, testName, details = "") {
  if (condition) {
    console.log(`  ${colors.green}✔ PASS:${colors.reset} ${testName}`);
    passed++;
  } else {
    console.error(`  ${colors.red}✖ FAIL:${colors.reset} ${testName} ${details ? `(${details})` : ""}`);
    failed++;
  }
}

function extractCookie(res) {
  const setCookie = res.headers.get("set-cookie");
  if (!setCookie) return null;
  const match = setCookie.match(/punesetu_session=([^;]+)/);
  return match ? match[1] : null;
}

async function run() {
  console.log(`${colors.bold}====================================================================${colors.reset}`);
  console.log(`${colors.bold} PuneSetu Version 4: Live E2E Backend Verification Suite on ${BASE_URL} ${colors.reset}`);
  console.log(`${colors.bold}====================================================================${colors.reset}\n`);

  try {
    // 1. Homepage Preservation Check
    console.log(`${colors.cyan}[Step 1] Public Homepage Preservation Check${colors.reset}`);
    const homeRes = await fetch(`${BASE_URL}/`);
    assert(homeRes.status === 200, "Homepage returns HTTP 200 OK");
    const homeText = await homeRes.text();
    assert(homeText.includes("PuneSetu") || homeText.includes("पुणे सेतू"), "Homepage renders PuneSetu civic branding");

    // 2. Departments API
    console.log(`\n${colors.cyan}[Step 2] Departments Reference API${colors.reset}`);
    const deptRes = await fetch(`${BASE_URL}/api/departments`);
    assert(deptRes.status === 200, "GET /api/departments returns HTTP 200 OK");
    const deptData = await deptRes.json();
    assert(deptData.success === true && deptData.departments.length === 8, "Returns all 8 active municipal departments");

    // 3. Wards API
    console.log(`\n${colors.cyan}[Step 3] Wards Reference API${colors.reset}`);
    const wardRes = await fetch(`${BASE_URL}/api/wards`);
    assert(wardRes.status === 200, "GET /api/wards returns HTTP 200 OK");
    const wardData = await wardRes.json();
    assert(wardData.success === true && wardData.wards.length === 15, "Returns all 15 Pune administrative Prabhag wards");

    // 4. Anonymous Grievance Submission Rejection
    console.log(`\n${colors.cyan}[Step 4] Unauthenticated Grievance Submission Security${colors.reset}`);
    const unauthRes = await fetch(`${BASE_URL}/api/grievances`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Pothole on Senapati Bapat Road",
        description: "Large deep crater near symbio college.",
        category: "ROADS_POTHOLES",
      }),
    });
    assert(unauthRes.status === 401, "Unauthenticated grievance creation returns HTTP 401 Unauthorized");

    // 5. Register Citizen for Backend Testing
    console.log(`\n${colors.cyan}[Step 5] Provisioning Test Citizen Account${colors.reset}`);
    const uniqueId = Date.now();
    const citizenEmail = `backend.tester.${uniqueId}@example.com`;
    const citizenPassword = "CivicPassword@2026!";
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Backend Verification Citizen",
        email: citizenEmail,
        password: citizenPassword,
      }),
    });
    const citizenCookie = extractCookie(regRes);
    assert(regRes.status === 201 && Boolean(citizenCookie), "Registered citizen and obtained HTTP-only session cookie");

    const authHeaders = {
      "Content-Type": "application/json",
      Cookie: `punesetu_session=${citizenCookie}`,
    };

    // 6. Valid Grievance Creation
    console.log(`\n${colors.cyan}[Step 6] Grievance Creation & Canonical Token Issuance${colors.reset}`);
    const validGrievance = {
      title: "Broken streetlight causing darkness on SB Road",
      description: "Streetlight opposite ICC Trade Tower has been flickering and completely dark for 3 nights.",
      category: "STREET_LIGHTING",
      priority: "HIGH",
      latitude: 18.5362,
      longitude: 73.8304,
      landmark: "Opposite ICC Trade Tower",
      locationDescription: "Senapati Bapat Road, Shivaji Nagar",
      wardId: wardData.wards[1].id,
      departmentId: deptData.departments[3].id,
    };
    const createRes = await fetch(`${BASE_URL}/api/grievances`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify(validGrievance),
    });
    const createData = await createRes.json();
    assert(createRes.status === 201, "Valid grievance creation returns HTTP 201 Created");
    assert(Boolean(createData.trackingToken), `Issued tracking token: ${createData.trackingToken}`);
    assert(
      /^PS-PUN-2026-[A-Z0-9]{6}$/.test(createData.trackingToken),
      "Tracking token conforms to canonical PS-PUN-YYYY-XXXXXX format"
    );
    const token = createData.trackingToken;

    // 7. Coordinate Geofence Validation Rejection
    console.log(`\n${colors.cyan}[Step 7] Geographic Bounding Box Defense${colors.reset}`);
    const outOfBoundsGrievance = {
      ...validGrievance,
      title: "Street issue in Mumbai",
      latitude: 19.076, // Mumbai latitude
      longitude: 72.8777,
    };
    const boundsRes = await fetch(`${BASE_URL}/api/grievances`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify(outOfBoundsGrievance),
    });
    assert(boundsRes.status === 400, "Coordinates outside Pune municipal bounds return HTTP 400 Bad Request");

    // 8. Anonymous Public Tracking Lookup (Privacy Masking)
    console.log(`\n${colors.cyan}[Step 8] Public Tracking Lookup & Coordinate Masking${colors.reset}`);
    const anonLookupRes = await fetch(`${BASE_URL}/api/grievances/${token}`);
    assert(anonLookupRes.status === 200, "Public tracking lookup returns HTTP 200 OK");
    const anonLookupData = await anonLookupRes.json();
    assert(anonLookupData.grievance.latitude === undefined, "Exact latitude is masked from public viewer");
    assert(anonLookupData.grievance.longitude === undefined, "Exact longitude is masked from public viewer");
    assert(anonLookupData.grievance.citizenEmail === undefined, "Citizen email is masked from public viewer");
    assert(anonLookupData.grievance.citizenId === undefined, "Citizen user ID is masked from public viewer");
    assert(anonLookupData.grievance.trackingToken === token, "Tracking token matches looked up record");

    // 9. Owner Grievance Lookup (Full Coordinates Preserved)
    console.log(`\n${colors.cyan}[Step 9] Authenticated Author Grievance Lookup${colors.reset}`);
    const ownerLookupRes = await fetch(`${BASE_URL}/api/grievances/${token}`, {
      headers: { Cookie: `punesetu_session=${citizenCookie}` },
    });
    const ownerLookupData = await ownerLookupRes.json();
    assert(ownerLookupData.grievance.latitude === 18.5362, "Exact coordinates preserved for the grievance author");

    // 10. Endorsement Toggle & Duplicate Prevention
    console.log(`\n${colors.cyan}[Step 10] Grievance Endorsement Toggle${colors.reset}`);
    const endorseRes1 = await fetch(`${BASE_URL}/api/grievances/${token}/endorse`, {
      method: "POST",
      headers: authHeaders,
    });
    const endorseData1 = await endorseRes1.json();
    assert(endorseRes1.status === 200 && endorseData1.endorsed === true, "First endorsement vote succeeds");

    const endorseRes2 = await fetch(`${BASE_URL}/api/grievances/${token}/endorse`, {
      method: "POST",
      headers: authHeaders,
    });
    const endorseData2 = await endorseRes2.json();
    assert(endorseRes2.status === 200 && endorseData2.endorsed === false, "Second endorsement toggles upvote off");

    // 11. Follower Toggle
    console.log(`\n${colors.cyan}[Step 11] Grievance Follower Toggle${colors.reset}`);
    const followRes1 = await fetch(`${BASE_URL}/api/grievances/${token}/follow`, {
      method: "POST",
      headers: authHeaders,
    });
    const followData1 = await followRes1.json();
    assert(followRes1.status === 200 && followData1.following === true, "First follow toggles following to true");

    // 12. Add Public Comment
    console.log(`\n${colors.cyan}[Step 12] Grievance Comments${colors.reset}`);
    const commentRes = await fetch(`${BASE_URL}/api/grievances/${token}/comments`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        content: "Vehicles are swerving dangerously here after dark.",
      }),
    });
    const commentData = await commentRes.json();
    assert(commentRes.status === 201 && commentData.success === true, "Citizen comment successfully added");

    const getCommentsRes = await fetch(`${BASE_URL}/api/grievances/${token}/comments`);
    const getCommentsData = await getCommentsRes.json();
    assert(
      getCommentsRes.status === 200 && getCommentsData.comments.length >= 1,
      "Comments list returns added comment"
    );

    // 13. Unauthorized Status Transition Attempt by Citizen
    console.log(`\n${colors.cyan}[Step 13] RBAC Protection on Status Transitions${colors.reset}`);
    const badStatusRes = await fetch(`${BASE_URL}/api/grievances/${token}/status`, {
      method: "PATCH",
      headers: authHeaders,
      body: JSON.stringify({
        newStatus: "RESOLVED",
        changeReason: "Citizen attempting to unilaterally close case",
      }),
    });
    assert(
      badStatusRes.status === 400,
      "Citizen cannot unilaterally mark grievance RESOLVED (returns HTTP 400 Bad Request)"
    );

    // 14. Satisfaction Feedback on Non-Resolved Grievance Defense
    console.log(`\n${colors.cyan}[Step 14] Satisfaction Feedback Lifecycle Constraint${colors.reset}`);
    const badFeedbackRes = await fetch(`${BASE_URL}/api/grievances/${token}/feedback`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        rating: 5,
        feedbackText: "Great job",
      }),
    });
    assert(
      badFeedbackRes.status === 400,
      "Feedback rejected on non-resolved grievance (returns HTTP 400 Bad Request)"
    );

    // 15. Evidence Metadata Recording
    console.log(`\n${colors.cyan}[Step 15] Evidence Metadata Attachment${colors.reset}`);
    const evidenceRes = await fetch(`${BASE_URL}/api/grievances/${token}/evidence`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        evidenceType: "PHOTO",
        storageKey: "evidence/2026/sb-road-pole-dark.jpg",
        originalFilename: "sb-road-pole.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 1024 * 350,
        caption: "Photograph of dark street pole at 9 PM",
      }),
    });
    const evidenceData = await evidenceRes.json();
    assert(evidenceRes.status === 201 && evidenceData.success === true, "Evidence metadata recorded successfully");

    // 16. Evidence Metadata Retrieval
    console.log(`\n${colors.cyan}[Step 16] Evidence Metadata Listing${colors.reset}`);
    const listEvRes = await fetch(`${BASE_URL}/api/grievances/${token}/evidence`);
    const listEvData = await listEvRes.json();
    assert(
      listEvRes.status === 200 && listEvData.evidence.length >= 1,
      "Evidence metadata list returns attached record"
    );

    // 17. Grievances Query & Pagination
    console.log(`\n${colors.cyan}[Step 17] Grievance Listing, Filtering & Live Counts${colors.reset}`);
    const listRes = await fetch(`${BASE_URL}/api/grievances?limit=10&page=1`);
    const listData = await listRes.json();
    assert(listRes.status === 200 && listData.success === true, "GET /api/grievances returns HTTP 200 OK");
    assert(Array.isArray(listData.grievances), "Returns array of grievances");
    const found = listData.grievances.find((g) => g.trackingToken === token);
    assert(Boolean(found), "Created grievance present in list query results");
    assert(found.commentsCount >= 1, "Live commentsCount reflects added comment");
    assert(found.followersCount >= 1, "Live followersCount reflects follower");

    console.log(`\n${colors.bold}====================================================================${colors.reset}`);
    console.log(
      `${colors.bold}Results: ${colors.green}${passed} Passed${colors.reset}, ${failed > 0 ? `${colors.red}${failed} Failed` : `${colors.green}0 Failed`}${colors.reset}`
    );
    console.log(`${colors.bold}====================================================================${colors.reset}\n`);

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error(`\n${colors.red}Unhandled error in E2E backend test suite:${colors.reset}`, err);
    process.exit(1);
  }
}

run();
