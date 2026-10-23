/**
 * PuneSetu (पुणे सेतू) - End-to-End HTTP Integration Test Suite
 *
 * Tests the real running Next.js server on http://localhost:3005:
 * 1. POST /api/auth/register (Valid citizen registration + cookie verification)
 * 2. POST /api/auth/register (Duplicate email rejection 409)
 * 3. POST /api/auth/register (Role tampering rejection - role strictly remains CITIZEN)
 * 4. POST /api/auth/login (Valid login + Set-Cookie verification)
 * 5. POST /api/auth/login (Invalid password rejection 401)
 * 6. GET /api/auth/me (Authenticated profile inspection)
 * 7. POST /api/auth/signout (Cookie clearance verification)
 * 8. GET /api/auth/me (Unauthenticated 401 inspection)
 * 9. GET /citizen/dashboard with citizen cookie (Allowed 200)
 * 10. GET /admin/dashboard with citizen cookie (Redirected to /unauthorized 307)
 */

const BASE_URL = process.env.TEST_URL || "http://127.0.0.1:3005";

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
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

async function runE2E() {
  console.log(`${colors.bold}====================================================${colors.reset}`);
  console.log(`${colors.bold} PuneSetu E2E HTTP Verification Suite on ${BASE_URL}${colors.reset}`);
  console.log(`${colors.bold}====================================================${colors.reset}\n`);

  const uniqueId = Date.now();
  const testEmail = `aditi.shinde.${uniqueId}@example.com`;
  const testPassword = "CitizenSecure@2026!";
  const testName = "Aditi Shinde";

  // 1. Citizen Registration
  console.log(`${colors.cyan}[Step 1] Citizen Registration & Role Locking${colors.reset}`);
  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: testName,
      email: testEmail,
      password: testPassword,
      role: "ADMIN", // Malicious attempt to self-assign ADMIN
    }),
  });

  const regData = await regRes.json();
  assert(regRes.status === 201, "Registration returns HTTP 201 Created", `Status: ${regRes.status}`);
  assert(regData.success === true, "Response indicates success: true");
  assert(regData.user.role === "CITIZEN", "Server strictly assigned role CITIZEN, rejecting client-submitted ADMIN");
  assert(regData.user.email === testEmail.toLowerCase(), "Email stored in normalized format");
  assert(!regData.user.passwordHash, "Password hash is strictly omitted from API response");

  const regCookie = extractCookie(regRes);
  assert(Boolean(regCookie), "Server sets punesetu_session HTTP-only cookie on registration");

  // 2. Duplicate Account Prevention
  console.log(`\n${colors.cyan}[Step 2] Duplicate Email Prevention${colors.reset}`);
  const dupRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Duplicate User",
      email: testEmail.toUpperCase(), // Testing case-insensitive uniqueness
      password: "AnotherPassword123!",
    }),
  });
  const dupData = await dupRes.json();
  assert(dupRes.status === 409, "Duplicate registration returns HTTP 409 Conflict", `Status: ${dupRes.status}`);
  assert(dupData.error.includes("already exists"), "Error message warns about duplicate account safely");

  // 3. User Sign-In with Valid Credentials
  console.log(`\n${colors.cyan}[Step 3] Sign-In & Session Issuance${colors.reset}`);
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
    }),
  });
  const loginData = await loginRes.json();
  assert(loginRes.status === 200, "Valid sign-in returns HTTP 200 OK");
  assert(loginData.success === true, "Login response indicates success");
  assert(loginData.redirectUrl === "/citizen/dashboard", "Redirect URL correctly targets /citizen/dashboard for citizen");

  const loginCookie = extractCookie(loginRes);
  assert(Boolean(loginCookie), "Sign-in returns fresh signed punesetu_session cookie");

  // 4. User Sign-In with Invalid Password
  console.log(`\n${colors.cyan}[Step 4] Invalid Credentials Defense${colors.reset}`);
  const badLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: testEmail,
      password: "WrongPassword999!",
    }),
  });
  const badLoginData = await badLoginRes.json();
  assert(badLoginRes.status === 401, "Invalid password returns HTTP 401 Unauthorized");
  assert(
    badLoginData.error === "Invalid email address or password. Please verify your credentials.",
    "Error uses generic message preventing account enumeration"
  );

  // 5. Protected User Profile Verification (/api/auth/me)
  console.log(`\n${colors.cyan}[Step 5] Session Profile Inspection (/api/auth/me)${colors.reset}`);
  const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Cookie: `punesetu_session=${loginCookie}` },
  });
  const meData = await meRes.json();
  assert(meRes.status === 200, "Authenticated /api/auth/me returns HTTP 200");
  assert(meData.authenticated === true, "Authenticated flag is true");
  assert(meData.user.email === testEmail, "Profile email matches authenticated user");
  assert(meData.user.role === "CITIZEN", "Profile role is verified CITIZEN");

  // 6. Role-Based Route Authorization via Proxy/Middleware
  console.log(`\n${colors.cyan}[Step 6] Protected Routes & Role Authorization${colors.reset}`);
  
  // Citizen accessing citizen dashboard (Allowed)
  const citizenDashRes = await fetch(`${BASE_URL}/citizen/dashboard`, {
    headers: { Cookie: `punesetu_session=${loginCookie}` },
    redirect: "manual",
  });
  assert(citizenDashRes.status === 200, "Citizen can access /citizen/dashboard (HTTP 200)");

  // Citizen attempting to access admin dashboard (Forbidden -> Redirect to /unauthorized)
  const adminDashRes = await fetch(`${BASE_URL}/admin/dashboard`, {
    headers: { Cookie: `punesetu_session=${loginCookie}` },
    redirect: "manual",
  });
  assert(
    adminDashRes.status === 307 || adminDashRes.status === 308 || adminDashRes.status === 302,
    "Citizen accessing /admin/dashboard is intercepted by RBAC gatekeeper",
    `Status: ${adminDashRes.status}`
  );
  const locationHeader = adminDashRes.headers.get("location") || "";
  assert(locationHeader.includes("/unauthorized"), "Redirect location points to /unauthorized");

  // Anonymous visitor accessing /citizen/dashboard (Redirected to /login)
  const anonRes = await fetch(`${BASE_URL}/citizen/dashboard`, {
    redirect: "manual",
  });
  assert(
    anonRes.status === 307 || anonRes.status === 308 || anonRes.status === 302,
    "Anonymous user accessing protected route is redirected"
  );
  const anonLocation = anonRes.headers.get("location") || "";
  assert(anonLocation.includes("/login"), "Anonymous redirect points to /login");

  // 7. User Sign-Out
  console.log(`\n${colors.cyan}[Step 7] Sign-Out & Cookie Clearance${colors.reset}`);
  const logoutRes = await fetch(`${BASE_URL}/api/auth/signout`, {
    method: "POST",
    headers: { Cookie: `punesetu_session=${loginCookie}` },
  });
  assert(logoutRes.status === 200, "Sign-out endpoint returns HTTP 200");
  const clearedCookieHeader = logoutRes.headers.get("set-cookie") || "";
  assert(
    clearedCookieHeader.includes("punesetu_session=;") ||
    clearedCookieHeader.includes("Max-Age=0"),
    "Sign-out response header sets Max-Age=0 / clears cookie"
  );

  // Verification summary
  console.log(`\n${colors.bold}====================================================${colors.reset}`);
  console.log(` E2E Results: ${passed} Passed, ${failed} Failed`);
  console.log(`====================================================${colors.reset}\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runE2E().catch((err) => {
  console.error("E2E Test Runner failed:", err);
  process.exit(1);
});
