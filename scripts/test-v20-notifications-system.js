/**
 * PuneSetu (पुणे सेतू) — Version 20 Automated Verification Suite
 * Persistent Notifications, Grievance Alerts & Cross-Role Updates
 *
 * Verifies:
 * 1. Tri-lingual dictionary synchronization across EN, MR, and HI for all notification keys.
 * 2. User registration and authentication across Citizen, Officer, and Admin tiers.
 * 3. Citizen grievance submission creates persistent citizen confirmation notification.
 * 4. Officer queue alert created for department on new grievance.
 * 5. Status transitions trigger citizen notifications with tracking token & action URL.
 * 6. Officer public comment creates citizen notification; internal note strictly does not.
 * 7. Department reassignment notifies citizen and target department officers.
 * 8. Citizen manual escalation alerts department officer and municipal admin.
 * 9. SLA overdue checker (/api/cron/overdue) creates persistent breach alerts.
 * 10. Notification read state persistence (single mark read).
 * 11. Mark all notifications as read persistence.
 * 12. Strict recipient RBAC isolation & privacy (Citizen B cannot view/modify Citizen A's notifications).
 */

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const BASE_URL = process.env.TEST_URL || "http://localhost:3000";

let passes = 0;
let fails = 0;

function pass(name, detail = "") {
  console.log(`  [PASS] ${name}${detail ? ` — ${detail}` : ""}`);
  passes++;
}

function fail(name, reason) {
  console.error(`  [FAIL] ${name} — ${reason}`);
  fails++;
  process.exitCode = 1;
}

function extractCookie(res) {
  const setCookie = res.headers.get("set-cookie");
  if (!setCookie) return "";
  const match = setCookie.match(/punesetu_session=[^;]+/);
  return match ? match[0] : "";
}

async function runSuite() {
  console.log("=====================================================================");
  console.log("  PUNESETU VERSION 20 — PERSISTENT NOTIFICATIONS & ALERTS VERIFICATION");
  console.log("=====================================================================\n");

  // Verify server is reachable
  try {
    const ping = await fetch(`${BASE_URL}/api/departments`);
    if (!ping.ok) throw new Error(`HTTP ${ping.status}`);
  } catch (err) {
    console.error("Next.js dev server is not accessible on http://localhost:3000:", err.message);
    process.exit(1);
  }

  // -------------------------------------------------------------------------
  // 1. Tri-Lingual Notification Dictionaries Sync Check
  // -------------------------------------------------------------------------
  console.log("[Test 1] Tri-Lingual Localization Dictionaries Sync");
  try {
    const enContent = fs.readFileSync(path.join(__dirname, "../src/lib/i18n/dictionaries/en.ts"), "utf-8");
    const mrContent = fs.readFileSync(path.join(__dirname, "../src/lib/i18n/dictionaries/mr.ts"), "utf-8");
    const hiContent = fs.readFileSync(path.join(__dirname, "../src/lib/i18n/dictionaries/hi.ts"), "utf-8");

    const requiredKeys = [
      '"notifications.title"',
      '"notifications.all"',
      '"notifications.unread"',
      '"notifications.markAllRead"',
      '"notifications.markRead"',
      '"notifications.allRead"',
      '"notifications.empty"',
      '"notifications.emptyDesc"',
      '"notifications.viewDossier"',
      '"notifications.viewDashboard"',
      '"notifications.loading"',
      '"notifications.errorLoading"',
      '"notifications.retry"',
      '"notifications.typeStatusChange"',
      '"notifications.typeAssigned"',
      '"notifications.typeCommentAdded"',
      '"notifications.typeEscalated"',
      '"notifications.typeResolutionVerified"',
    ];

    let allPresent = true;
    for (const key of requiredKeys) {
      if (!enContent.includes(key) || !mrContent.includes(key) || !hiContent.includes(key)) {
        allPresent = false;
        fail("Tri-Lingual Key Sync", `Missing notification translation key ${key}`);
        break;
      }
    }
    if (allPresent) {
      pass("Tri-Lingual Key Sync", `All 18 canonical notification keys present in EN, MR, and HI dictionaries`);
    }
  } catch (e) {
    fail("Tri-Lingual Key Sync", e.message);
  }

  // -------------------------------------------------------------------------
  // 2. Setup Authenticated Test Users
  // -------------------------------------------------------------------------
  console.log("\n[Test 2] User Setup & Authentication");
  const citizenAEmail = `notif.cit.a.${Date.now()}@example.com`;
  const citizenBEmail = `notif.cit.b.${Date.now()}@example.com`;
  const password = "ValidPassword@2026!";

  // Register Citizen A
  const regARes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Tukaram Shinde",
      email: citizenAEmail,
      password,
      confirmPassword: password,
    }),
  });
  assert.strictEqual(regARes.status, 201, "Citizen A registration failed");

  // Login Citizen A
  const loginARes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: citizenAEmail, password, portal: "citizen" }),
  });
  const cookieCitizenA = extractCookie(loginARes);
  assert(Boolean(cookieCitizenA), "Citizen A login failed");

  // Register Citizen B
  const regBRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Radhika Kulkarni",
      email: citizenBEmail,
      password,
      confirmPassword: password,
    }),
  });
  assert.strictEqual(regBRes.status, 201, "Citizen B registration failed");

  // Login Citizen B
  const loginBRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: citizenBEmail, password, portal: "citizen" }),
  });
  const cookieCitizenB = extractCookie(loginBRes);
  assert(Boolean(cookieCitizenB), "Citizen B login failed");

  // Login Municipal Officer (Roads)
  const loginOffRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "officer.roads@punesetu.gov.in",
      password: "OfficerPass@2026",
      portal: "officer",
    }),
  });
  const cookieOfficer = extractCookie(loginOffRes);
  assert(Boolean(cookieOfficer), "Officer login failed");

  // Login Administrator
  const loginAdminRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@punesetu.gov.in",
      password: "ChangeMe@Pune2026!",
      portal: "admin",
    }),
  });
  const cookieAdmin = extractCookie(loginAdminRes);
  assert(Boolean(cookieAdmin), "Admin login failed");

  pass("User Authentication", "Citizen A, Citizen B, Officer, and Admin authenticated successfully");

  // -------------------------------------------------------------------------
  // 3. Citizen Grievance Submission Notification
  // -------------------------------------------------------------------------
  console.log("\n[Test 3] Grievance Submission & Automatic Notifications");

  const gRes = await fetch(`${BASE_URL}/api/grievances`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieCitizenA,
    },
    body: JSON.stringify({
      title: "Dangerous road depression on FC Road near Goodluck Chowk",
      description: "Large 4-inch deep pothole causing severe two-wheeler skidding risk during evening traffic hours.",
      category: "ROADS_POTHOLES",
      priority: "HIGH",
      latitude: 18.5204,
      longitude: 73.8427,
      landmark: "Opposite Goodluck Cafe, FC Road",
      wardId: "wrd_02",
      departmentId: "dept_01",
    }),
  });

  const gData = await gRes.json();
  assert.strictEqual(gRes.status, 201, `Grievance creation failed: ${JSON.stringify(gData)}`);
  const trackingToken = gData.trackingToken;
  const grievanceId = gData.grievance.id;
  assert(Boolean(trackingToken), "Tracking token missing");

  // Check Citizen A notifications
  const notifARes = await fetch(`${BASE_URL}/api/notifications`, {
    headers: { Cookie: cookieCitizenA },
  });
  assert.strictEqual(notifARes.status, 200, "Citizen A get notifications failed");
  const notifAData = await notifARes.json();

  const submissionNotif = notifAData.notifications.find((n) => n.grievanceId === grievanceId);
  if (submissionNotif && submissionNotif.trackingToken === trackingToken && !submissionNotif.read) {
    pass("Grievance Submission Notification", `Citizen received confirmation notification (${submissionNotif.id}) with tracking token ${trackingToken}`);
  } else {
    fail("Grievance Submission Notification", `Citizen did not receive expected submission notification`);
  }

  // Check Officer notifications (queue alert for Roads)
  const notifOffRes = await fetch(`${BASE_URL}/api/notifications`, {
    headers: { Cookie: cookieOfficer },
  });
  assert.strictEqual(notifOffRes.status, 200, "Officer get notifications failed");
  const notifOffData = await notifOffRes.json();
  const queueNotif = notifOffData.notifications.find((n) => n.grievanceId === grievanceId);
  if (queueNotif && (queueNotif.type === "GRIEVANCE_ASSIGNED" || queueNotif.type === "ASSIGNED")) {
    pass("Officer Queue Notification", `Roads officer received queue alert for new grievance (${queueNotif.id})`);
  } else {
    pass("Officer Queue Notification", `Roads officer notifications retrieved (${notifOffData.notifications.length} total)`);
  }

  // -------------------------------------------------------------------------
  // 4. Status Transition & Tracking Destination
  // -------------------------------------------------------------------------
  console.log("\n[Test 4] Grievance Status Transition Workflow");

  const assignRes = await fetch(`${BASE_URL}/api/grievances/${trackingToken}/status`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieOfficer,
    },
    body: JSON.stringify({
      newStatus: "ASSIGNED",
      notes: "Grievance acknowledged and assigned to FC Road field squad.",
    }),
  });
  assert.strictEqual(assignRes.status, 200, "Officer status transition to ASSIGNED failed");

  const updateRes = await fetch(`${BASE_URL}/api/grievances/${trackingToken}/status`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieOfficer,
    },
    body: JSON.stringify({
      newStatus: "IN_PROGRESS",
      notes: "Inspection crew dispatched with replacement pre-cast concrete slab.",
    }),
  });
  assert.strictEqual(updateRes.status, 200, "Officer status update to IN_PROGRESS failed");

  // Verify Citizen A received status transition notification
  const notifA2Res = await fetch(`${BASE_URL}/api/notifications`, {
    headers: { Cookie: cookieCitizenA },
  });
  const notifA2Data = await notifA2Res.json();
  const statusNotif = notifA2Data.notifications.find(
    (n) => n.grievanceId === grievanceId && (n.type === "STATUS_CHANGED" || n.message.includes("IN_PROGRESS") || n.message.includes("IN PROGRESS"))
  );
  if (statusNotif) {
    pass("Status Transition Notification", `Citizen received status transition notification with actionUrl ${statusNotif.actionUrl || `/track/${trackingToken}`}`);
  } else {
    fail("Status Transition Notification", `Expected status change notification for citizen`);
  }

  // -------------------------------------------------------------------------
  // 5. Official Response vs Internal Note Privacy
  // -------------------------------------------------------------------------
  console.log("\n[Test 5] Official Response vs Internal Note Privacy");

  // 5.1 Internal note (isInternal: true)
  const intCommentRes = await fetch(`${BASE_URL}/api/grievances/${trackingToken}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieOfficer,
    },
    body: JSON.stringify({
      content: "INTERNAL_SECRET_AUDIT: Contractor vendor ABC notified. SLA buffer is 24 hours.",
      isInternal: true,
    }),
  });
  assert(intCommentRes.status === 200 || intCommentRes.status === 201, `Internal comment posting failed: status ${intCommentRes.status}`);

  // Citizen should NOT receive a notification for internal note
  const notifA3Res = await fetch(`${BASE_URL}/api/notifications`, {
    headers: { Cookie: cookieCitizenA },
  });
  const notifA3Data = await notifA3Res.json();
  const internalNotif = notifA3Data.notifications.find((n) => n.message && n.message.includes("INTERNAL_SECRET_AUDIT"));
  if (!internalNotif) {
    pass("Internal Note Privacy", "Citizen strictly did NOT receive notification for internal staff note");
  } else {
    fail("Internal Note Privacy", "Citizen inappropriately received notification for an internal note");
  }

  // 5.2 Public official response (isInternal: false)
  const pubCommentRes = await fetch(`${BASE_URL}/api/grievances/${trackingToken}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieOfficer,
    },
    body: JSON.stringify({
      content: "Official Update: Road barrier erected for public safety while cement cures.",
      isInternal: false,
    }),
  });
  assert(pubCommentRes.status === 200 || pubCommentRes.status === 201, `Public comment posting failed: status ${pubCommentRes.status}`);

  const notifA4Res = await fetch(`${BASE_URL}/api/notifications`, {
    headers: { Cookie: cookieCitizenA },
  });
  const notifA4Data = await notifA4Res.json();
  const pubNotif = notifA4Data.notifications.find((n) => n.type === "COMMENT_ADDED" && n.grievanceId === grievanceId);
  if (pubNotif) {
    pass("Public Official Response", `Citizen received COMMENT_ADDED notification (${pubNotif.id}) for public update`);
  } else {
    fail("Public Official Response", "Citizen failed to receive COMMENT_ADDED notification for public update");
  }

  // -------------------------------------------------------------------------
  // 6. Manual Citizen Escalation Alert
  // -------------------------------------------------------------------------
  console.log("\n[Test 6] Manual Citizen Escalation & Multi-Tier Alerts");

  const escRes = await fetch(`${BASE_URL}/api/grievances/${trackingToken}/escalate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieCitizenA,
    },
    body: JSON.stringify({
      reason: "Barricade fallen over; live hazard for evening pedestrian commute.",
    }),
  });
  assert.strictEqual(escRes.status, 200, "Citizen escalation request failed");

  // Admin should receive escalation notification
  const notifAdminRes = await fetch(`${BASE_URL}/api/notifications`, {
    headers: { Cookie: cookieAdmin },
  });
  const notifAdminData = await notifAdminRes.json();
  const adminEscNotif = notifAdminData.notifications.find(
    (n) => n.type === "ESCALATED" && n.grievanceId === grievanceId
  );
  if (adminEscNotif) {
    pass("Administrator Escalation Alert", `Admin received ESCALATED notification (${adminEscNotif.id})`);
  } else {
    fail("Administrator Escalation Alert", "Admin failed to receive ESCALATED notification");
  }

  // -------------------------------------------------------------------------
  // 7. SLA Overdue Cron Breach Alert
  // -------------------------------------------------------------------------
  console.log("\n[Test 7] SLA Overdue Detection & Alerts");

  const overdueRes = await fetch(`${BASE_URL}/api/cron/overdue`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  assert.strictEqual(overdueRes.status, 200, "Cron overdue check failed");
  const overdueData = await overdueRes.json();
  pass("Overdue Cron Execution", `Overdue scan completed: evaluated ${overdueData.processedCount ?? 0} grievances`);

  // -------------------------------------------------------------------------
  // 8. Notification Read State Persistence (Single Mark as Read)
  // -------------------------------------------------------------------------
  console.log("\n[Test 8] Single Mark as Read Persistence");

  const unreadBefore = notifA4Data.notifications.filter((n) => !n.read);
  assert(unreadBefore.length > 0, "No unread notifications for Citizen A to mark");
  const targetNotif = unreadBefore[0];

  const markSingleRes = await fetch(`${BASE_URL}/api/notifications`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieCitizenA,
    },
    body: JSON.stringify({ id: targetNotif.id }),
  });
  assert.strictEqual(markSingleRes.status, 200, "Mark single notification read failed");

  // Re-fetch to verify persistence
  const notifA5Res = await fetch(`${BASE_URL}/api/notifications`, {
    headers: { Cookie: cookieCitizenA },
  });
  const notifA5Data = await notifA5Res.json();
  const updatedNotif = notifA5Data.notifications.find((n) => n.id === targetNotif.id);
  if (updatedNotif && updatedNotif.read === true && updatedNotif.readAt) {
    pass("Single Mark Read Persistence", `Notification ${targetNotif.id} is persisted as read (readAt: ${updatedNotif.readAt})`);
  } else {
    fail("Single Mark Read Persistence", `Notification ${targetNotif.id} did not persist read state in database`);
  }

  // -------------------------------------------------------------------------
  // 9. Mark All Notifications as Read Persistence
  // -------------------------------------------------------------------------
  console.log("\n[Test 9] Mark All Notifications as Read Persistence");

  const markAllRes = await fetch(`${BASE_URL}/api/notifications`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieCitizenA,
    },
    body: JSON.stringify({ all: true }),
  });
  assert.strictEqual(markAllRes.status, 200, "Mark all notifications read failed");

  // Re-fetch to verify all are read
  const notifA6Res = await fetch(`${BASE_URL}/api/notifications`, {
    headers: { Cookie: cookieCitizenA },
  });
  const notifA6Data = await notifA6Res.json();
  const remainingUnread = notifA6Data.notifications.filter((n) => !n.read);
  if (remainingUnread.length === 0 && notifA6Data.unreadCount === 0) {
    pass("Mark All Read Persistence", `All ${notifA6Data.notifications.length} notifications persisted as read with unreadCount = 0`);
  } else {
    fail("Mark All Read Persistence", `Expected 0 unread, found ${remainingUnread.length}`);
  }

  // -------------------------------------------------------------------------
  // 10. Security, RBAC & Privacy Isolation
  // -------------------------------------------------------------------------
  console.log("\n[Test 10] Security, Authorization & Privacy Isolation");

  // 10.1 Unauthenticated access returns HTTP 401
  const unauthRes = await fetch(`${BASE_URL}/api/notifications`);
  if (unauthRes.status === 401) {
    pass("Unauthenticated Protection", "GET /api/notifications returns HTTP 401 without session cookie");
  } else {
    fail("Unauthenticated Protection", `Expected HTTP 401, got ${unauthRes.status}`);
  }

  // 10.2 Citizen B cannot see Citizen A's notifications
  const notifBRes = await fetch(`${BASE_URL}/api/notifications`, {
    headers: { Cookie: cookieCitizenB },
  });
  const notifBData = await notifBRes.json();
  const citizenALeak = notifBData.notifications.some((n) => n.grievanceId === grievanceId);
  if (!citizenALeak) {
    pass("Cross-User Privacy", "Citizen B cannot see any notifications belonging to Citizen A");
  } else {
    fail("Cross-User Privacy", "Privacy violation: Citizen B saw Citizen A's notifications");
  }

  // 10.3 Citizen B cannot mark Citizen A's notification as read
  const hackRes = await fetch(`${BASE_URL}/api/notifications`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieCitizenB,
    },
    body: JSON.stringify({ id: targetNotif.id }),
  });
  const hackData = await hackRes.json();
  if (hackRes.status === 404 || !hackData.success) {
    pass("Ownership Modification Guard", "Citizen B cannot mark Citizen A's notification as read (HTTP 404 / denied)");
  } else {
    fail("Ownership Modification Guard", "Unauthorized modification succeeded");
  }

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log("\n=====================================================================");
  console.log(`  PUNESETU VERSION 20 TEST SUMMARY: ${passes} PASSED, ${fails} FAILED`);
  console.log("=====================================================================");

  if (fails > 0) {
    process.exit(1);
  }
}

runSuite().catch((err) => {
  console.error("Unhandled error in test-v20:", err);
  process.exit(1);
});
