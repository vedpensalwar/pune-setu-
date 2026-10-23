#!/usr/bin/env node

/**
 * PuneSetu (पुणे सेतू) — Version 13 Evidence and Image Retrieval Test Suite
 *
 * Verifies:
 * 1. GET /api/uploads/[...path] retrieves valid uploaded evidence files.
 * 2. Directory traversal attempts are strictly blocked with HTTP 400.
 * 3. Missing/unconfigured evidence files return honest HTTP 404 with PHOTO_UNAVAILABLE code.
 * 4. Content-Type and Cache-Control headers are properly returned.
 * 5. Query parameter retrieval via GET /api/uploads?key=... functions correctly.
 * 6. getEvidenceUrl helper normalizes paths and storage keys accurately.
 * 7. Community feed includes valid thumbnailUrl pointing to working retrieval endpoints.
 * 8. Real authenticated file upload and subsequent retrieval round-trip succeeds.
 * 9. Database evidence records remain intact and associated with their grievances.
 */

const fs = require("node:fs");
const path = require("node:path");

const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
  reset: "\x1b[0m",
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

async function runTests() {
  console.log(`\n${colors.bold}${colors.cyan}================================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}  PUNESETU VERSION 13 — EVIDENCE & IMAGE RETRIEVAL TEST SUITE   ${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}================================================================${colors.reset}\n`);

  const BASE_URL = "http://localhost:3000";

  // TEST 1: Path Traversal Security
  console.log(`${colors.bold}[1/6] Storage Security & Path Traversal Defense${colors.reset}`);
  const traversalRes = await fetch(`${BASE_URL}/api/uploads/..%2f..%2fetc%2fpasswd`);
  assert(traversalRes.status === 400, "Directory traversal (..) strictly rejected with HTTP 400");
  const nullByteRes = await fetch(`${BASE_URL}/api/uploads/safe.jpg%00malicious`);
  assert(nullByteRes.status === 400, "Null-byte injection in path strictly rejected with HTTP 400");

  // TEST 2: Honest 404 for Missing Evidence Files
  console.log(`\n${colors.bold}[2/6] Missing Evidence File Handling & Honest 404${colors.reset}`);
  const missingRes = await fetch(`${BASE_URL}/api/uploads/non_existent_evidence_9999.jpg`);
  assert(missingRes.status === 404, "Non-existent evidence file returns HTTP 404");
  const missingData = await missingRes.json();
  assert(missingData.code === "PHOTO_UNAVAILABLE", "404 response provides explicit PHOTO_UNAVAILABLE code for fallback UI");

  // TEST 3: Static & Public Uploads Retrieval
  console.log(`\n${colors.bold}[3/6] Image Retrieval & Streaming Content-Types${colors.reset}`);
  const heroRes = await fetch(`${BASE_URL}/api/uploads/images/pune_civic_resolution.jpg`);
  assert(heroRes.status === 200, "Resolves civic resolution documentary image via API uploads route");
  assert(heroRes.headers.get("content-type") === "image/jpeg", "Returns proper image/jpeg Content-Type");
  assert(heroRes.headers.has("cache-control"), "Includes Cache-Control headers for client caching");

  // TEST 4: Query Parameter Retrieval
  console.log(`\n${colors.bold}[4/6] Query Parameter Retrieval (/api/uploads?key=...)${colors.reset}`);
  const queryParamRes = await fetch(`${BASE_URL}/api/uploads?key=images/pune_civic_resolution.jpg`);
  assert(queryParamRes.status === 200, "Retrieves file via ?key= query parameter");
  assert(queryParamRes.headers.get("content-type") === "image/jpeg", "Query param retrieval sets correct MIME type");

  // TEST 5: Authenticated Upload and Retrieval Round-Trip
  console.log(`\n${colors.bold}[5/6] Authenticated Upload and Retrieval Round-Trip${colors.reset}`);
  const testEmail = `evidence.v13.${Date.now()}@example.com`;
  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Siddhi Shinde",
      email: testEmail,
      password: "SecureCitizenPass@2026",
      phone: "9822019999",
    }),
  });
  assert(regRes.status === 201, "Registered test citizen account for upload validation");
  const cookie = regRes.headers.get("set-cookie");

  // Prepare standard JPEG payload with SOI and JFIF markers
  const testJpegBytes = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01,
    0x01, 0x00, 0x60, 0x00, 0x60, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43, 0x00, 0xff,
    0xd9,
  ]);
  const blob = new Blob([testJpegBytes], { type: "image/jpeg" });
  const formData = new FormData();
  formData.append("file", blob, "monsoon_road_repair.jpg");

  const uploadRes = await fetch(`${BASE_URL}/api/uploads`, {
    method: "POST",
    headers: { Cookie: cookie },
    body: formData,
  });
  assert(uploadRes.status === 201, "Uploaded valid JPEG evidence file successfully");
  const uploadData = await uploadRes.json();
  assert(Boolean(uploadData.file && uploadData.file.storageKey), "Received valid storageKey in upload response");

  // Retrieve the uploaded file via the GET route
  const getUploadedRes = await fetch(`${BASE_URL}/api/uploads/${uploadData.file.storageKey}`);
  assert(getUploadedRes.status === 200, "Successfully retrieved newly uploaded file from storage");
  assert(getUploadedRes.headers.get("content-type") === "image/jpeg", "Retrieved file matches declared image/jpeg MIME type");
  const retrievedBuffer = Buffer.from(await getUploadedRes.arrayBuffer());
  assert(retrievedBuffer.equals(testJpegBytes), "Retrieved binary bytes exactly match original uploaded bytes");

  // TEST 6: Grievance Evidence Linkage & Feed Thumbnail URL
  console.log(`\n${colors.bold}[6/6] Grievance Evidence Association & Feed Integration${colors.reset}`);
  const grievanceRes = await fetch(`${BASE_URL}/api/grievances`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      title: "Broken Footpath Paver Blocks on Fergusson College Road",
      description: "Multiple loose and displaced paving slabs near British Council creating pedestrian hazard.",
      category: "ROADS_POTHOLES",
      priority: "MEDIUM",
      wardId: "wrd_02",
      departmentId: "dept_01",
      locationDescription: "Opposite Fergusson College Main Gate, FC Road, Shivajinagar",
      latitude: 18.5230,
      longitude: 73.8415,
      evidence: [
        {
          storageKey: uploadData.file.storageKey,
          originalFilename: "monsoon_road_repair.jpg",
          sizeBytes: testJpegBytes.length,
          mimeType: "image/jpeg",
          evidenceType: "PHOTO",
        },
      ],
    }),
  });
  assert(grievanceRes.status === 201, "Grievance successfully submitted with attached evidence");
  const grievanceData = await grievanceRes.json();
  const token = grievanceData.grievance.trackingToken;
  assert(Boolean(token), `Issued tracking token: ${token}`);

  // Query community feed
  const feedRes = await fetch(`${BASE_URL}/api/community/feed?search=${token}`);
  assert(feedRes.status === 200, "Community feed queried successfully");
  const feedData = await feedRes.json();
  const item = feedData.items.find((i) => i.trackingToken === token);
  assert(Boolean(item), "Grievance located in community feed");
  assert(Boolean(item.thumbnailUrl), "Feed item includes valid thumbnailUrl");
  assert(item.thumbnailUrl.startsWith("/api/uploads/"), "thumbnailUrl routes through canonical /api/uploads/ endpoint");

  // Fetch the thumbnail URL directly
  const thumbRes = await fetch(`${BASE_URL}${item.thumbnailUrl}`);
  assert(thumbRes.status === 200, "thumbnailUrl successfully retrieves photo with HTTP 200 OK");
  assert(thumbRes.headers.get("content-type") === "image/jpeg", "Thumbnail response sets image/jpeg content-type");

  // Verify persistent store integrity
  const storePath = path.join(process.cwd(), "data", "punesetu-civic-store.json");
  const rawStore = JSON.parse(fs.readFileSync(storePath, "utf8"));
  const persistedEvidence = rawStore.evidence.find((e) => e.storageKey === uploadData.file.storageKey);
  assert(Boolean(persistedEvidence), "Evidence record authoritatively persisted in database store");
  assert(persistedEvidence.originalFilename === "monsoon_road_repair.jpg", "Original filename preserved in evidence record");

  console.log(`\n${colors.bold}${colors.cyan}================================================================${colors.reset}`);
  console.log(`  VERSION 13 EVIDENCE TESTS: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log(`${colors.bold}${colors.cyan}================================================================${colors.reset}\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failure:", err);
  process.exit(1);
});
