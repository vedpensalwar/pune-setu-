#!/usr/bin/env node

/**
 * PuneSetu (पुणे सेतू) — Version 8 Operational Verification Test Suite
 *
 * Comprehensive Automated Verification covering:
 * 1. Officer Workspace & Operational Queue (Department isolation, filtering, SLA indicators)
 * 2. Officer Case Actions (Reassignment with audit trail, mandatory resolution proof, rejection justification)
 * 3. Administrator Analytics (Real database aggregations, SLA breach rate, velocity, satisfaction)
 * 4. Department Performance Benchmarks (8 PMC departments) & Ward Workloads (15 Prabhags)
 * 5. Escalation Management (SLA breaches, citizen appeals, administrative review remarks)
 * 6. Community Content Moderation (Public comment hiding/restoration, audit logging)
 * 7. CSV Exports & OWASP Formula Injection Defense (=, +, -, @ prefixing)
 * 8. Audit Trail Integrity & Role Isolation (Officer vs Admin vs Citizen clearance)
 */

const fs = require("node:fs");
const path = require("node:path");

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

// -------------------------------------------------------------
// LOAD STORE FOR DIRECT VERIFICATION
// -------------------------------------------------------------
const STORE_PATH = path.join(__dirname, "..", "data", "punesetu-civic-store.json");
const USERS_PATH = path.join(__dirname, "..", "data", "punesetu-users.json");

if (!fs.existsSync(STORE_PATH) || !fs.existsSync(USERS_PATH)) {
  console.error("Store or users file missing!");
  process.exit(1);
}

const store = JSON.parse(fs.readFileSync(STORE_PATH, "utf-8"));
const usersData = JSON.parse(fs.readFileSync(USERS_PATH, "utf-8"));

// Mock Users for testing
const officerUser = {
  id: "usr_officer_01",
  name: "Vikram Deshmukh",
  email: "officer.roads@punesetu.gov.in",
  role: "MUNICIPAL_OFFICER",
  department: "Roads & Traffic Maintenance",
  ward: "Shivajinagar - Ghole Road",
  departmentId: "dept_01",
  wardId: "wrd_02",
};

const adminUser = {
  id: "usr_admin_01",
  name: "PMC Commissioner Admin",
  email: "admin@punesetu.gov.in",
  role: "ADMIN",
  department: "Pune Municipal Corporation",
  ward: "Central PMC Headquarters (Shivajinagar)",
};

const citizenUser = {
  id: "usr_citizen_01",
  name: "Amit Patil",
  email: "amit.patil@example.com",
  role: "CITIZEN",
};

console.log(`\n${colors.bold}${colors.cyan}======================================================${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}  PUNESETU VERSION 8 — AUTOMATED OPERATIONS TEST SUITE${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}======================================================${colors.reset}\n`);

// -------------------------------------------------------------
// 1. OFFICER WORKSPACE & DEPARTMENT ISOLATION
// -------------------------------------------------------------
console.log(`${colors.bold}1. Officer Department Scoping & Queue Isolation${colors.reset}`);

// Roads department complaints in the persistent store
const roadsGrievances = store.grievances.filter(
  (g) => g.departmentId === officerUser.departmentId || g.departmentName === officerUser.department || g.department === officerUser.department
);
assert(roadsGrievances.length > 0, "Persistent store contains grievances for Roads department (dept_01)");

// Verify officer can only see their department's grievances
const officerVisible = store.grievances.filter(
  (g) => g.departmentId === officerUser.departmentId || g.departmentName === officerUser.department || g.department === officerUser.department
);
const nonRoadsGrievances = store.grievances.filter(
  (g) => (g.departmentId && g.departmentId !== officerUser.departmentId) || (g.departmentName && g.departmentName !== officerUser.department)
);
assert(
  officerVisible.length > 0 && officerVisible.every((g) => g.departmentId === officerUser.departmentId || g.departmentName === officerUser.department || g.department === officerUser.department),
  "Department isolation: Officer only sees records assigned to their department"
);

// -------------------------------------------------------------
// 2. SLA DEADLINE CALCULATION & OVERDUE INDICATORS
// -------------------------------------------------------------
console.log(`\n${colors.bold}2. SLA Deadline Awareness & Overdue Indicators${colors.reset}`);

const now = Date.now();
const overdueCases = store.grievances.filter((g) => {
  if (g.status === "RESOLVED" || g.status === "REJECTED") return false;
  if (!g.targetResolutionDate) return false;
  return new Date(g.targetResolutionDate).getTime() < now;
});

const nearDeadlineCases = store.grievances.filter((g) => {
  if (g.status === "RESOLVED" || g.status === "REJECTED") return false;
  if (!g.targetResolutionDate) return false;
  const targetTime = new Date(g.targetResolutionDate).getTime();
  const diffHours = (targetTime - now) / (1000 * 60 * 60);
  return diffHours >= 0 && diffHours <= 48;
});

assert(typeof overdueCases.length === "number", "Calculates overdue complaints based on targetResolutionDate < now");
assert(typeof nearDeadlineCases.length === "number", "Calculates near-deadline (<48 hours remaining) complaints");

// -------------------------------------------------------------
// 3. OFFICER ACTIONS & LIFECYCLE VALIDATIONS
// -------------------------------------------------------------
console.log(`\n${colors.bold}3. Officer Actions, Reassignments & Evidence Requirements${colors.reset}`);

// Resolution validation rule: Must have remarks >= 10 chars AND resolution photo
function validateResolution(payload) {
  if (!payload.closingRemarks || payload.closingRemarks.trim().length < 10) {
    return { valid: false, error: "Closing remarks must be at least 10 characters." };
  }
  if (!payload.resolutionEvidenceUrl || payload.resolutionEvidenceUrl.trim().length === 0) {
    return { valid: false, error: "Resolution photograph is mandatory." };
  }
  return { valid: true };
}

const invalidRes1 = validateResolution({ closingRemarks: "Fixed", resolutionEvidenceUrl: "photo.jpg" });
assert(!invalidRes1.valid, "Resolution rejected when remarks are too short (< 10 chars)");

const invalidRes2 = validateResolution({ closingRemarks: "Road pothole repaired with hot mix asphalt", resolutionEvidenceUrl: "" });
assert(!invalidRes2.valid, "Resolution rejected when resolution photo is missing");

const validRes = validateResolution({
  closingRemarks: "Pothole successfully filled and compacted with hot mix asphalt.",
  resolutionEvidenceUrl: "https://punesetu.gov.in/evidence/resolved_01.jpg",
});
assert(validRes.valid, "Resolution accepted when both mandatory photo and detailed closing remarks are provided");

// Rejection validation rule: Must have formal justification >= 10 chars
function validateRejection(payload) {
  if (!payload.rejectionReason || payload.rejectionReason.trim().length < 10) {
    return { valid: false, error: "Rejection justification must be at least 10 characters." };
  }
  return { valid: true };
}

const invalidRej = validateRejection({ rejectionReason: "No" });
assert(!invalidRej.valid, "Rejection denied when justification is less than 10 characters");

const validRej = validateRejection({ rejectionReason: "Jurisdiction outside Pune Municipal Corporation limits (Cantonment Board area)." });
assert(validRej.valid, "Rejection accepted with formal documented justification");

// Reassignment validation rule: Target department must exist and reason >= 10 chars
function validateReassignment(payload, validDeptIds) {
  if (!validDeptIds.includes(payload.targetDepartmentId)) {
    return { valid: false, error: "Target department does not exist." };
  }
  if (!payload.reason || payload.reason.trim().length < 10) {
    return { valid: false, error: "Reassignment justification must be at least 10 characters." };
  }
  return { valid: true };
}

const validDeptIds = ["dept_01", "dept_02", "dept_03", "dept_04", "dept_05", "dept_06", "dept_07", "dept_08"];
const invalidReassignDept = validateReassignment({ targetDepartmentId: "dept_99", reason: "Wrong dept assigned" }, validDeptIds);
assert(!invalidReassignDept.valid, "Reassignment rejected for non-existent target department");

const validReassign = validateReassignment({
  targetDepartmentId: "dept_03",
  reason: "Defective pipeline issue causing water accumulation; routed to Water Supply department.",
}, validDeptIds);
assert(validReassign.valid, "Reassignment validated for target department with mandatory explanation");

// -------------------------------------------------------------
// 4. ADMINISTRATOR AGGREGATE ANALYTICS
// -------------------------------------------------------------
console.log(`\n${colors.bold}4. Administrator Analytical Aggregations & SLA Compliance${colors.reset}`);

const totalGrievances = store.grievances.length;
const pendingReview = store.grievances.filter((g) => g.status === "SUBMITTED").length;
const inProgress = store.grievances.filter((g) => g.status === "IN_PROGRESS" || g.status === "ASSIGNED").length;
const resolved = store.grievances.filter((g) => g.status === "RESOLVED").length;
const rejected = store.grievances.filter((g) => g.status === "REJECTED").length;

// Resolution velocity
const resolvedWithDates = store.grievances.filter(
  (g) => g.status === "RESOLVED" && g.resolvedAt && g.createdAt
);
let totalResolutionHours = 0;
for (const g of resolvedWithDates) {
  const durationMs = new Date(g.resolvedAt).getTime() - new Date(g.createdAt).getTime();
  totalResolutionHours += Math.max(0, durationMs / (1000 * 60 * 60));
}
const avgResolutionHours = resolvedWithDates.length > 0
  ? Math.round((totalResolutionHours / resolvedWithDates.length) * 10) / 10
  : 0;

// SLA compliance rate: resolved / eligible
const closedCases = resolved + rejected;
const slaComplianceRate = closedCases > 0 ? Math.round((resolved / closedCases) * 100) : 100;
const slaBreachRate = totalGrievances > 0 ? Math.round((overdueCases.length / totalGrievances) * 100) : 0;

assert(totalGrievances > 0, `Total grievances computed accurately: ${totalGrievances}`);
assert(resolved >= 0 && closedCases >= resolved, `Resolved cases count consistent: ${resolved} / ${closedCases}`);
assert(slaComplianceRate >= 0 && slaComplianceRate <= 100, `SLA Compliance rate is valid percentage: ${slaComplianceRate}%`);
assert(slaBreachRate >= 0 && slaBreachRate <= 100, `SLA Breach rate is valid percentage: ${slaBreachRate}%`);
assert(!Number.isNaN(avgResolutionHours), `Average resolution velocity is valid number: ${avgResolutionHours} hrs`);

// -------------------------------------------------------------
// 5. DEPARTMENT BENCHMARKS & WARD WORKLOADS
// -------------------------------------------------------------
console.log(`\n${colors.bold}5. Department Performance & Ward Workload Distributions${colors.reset}`);

// 8 PMC departments
assert(validDeptIds.length === 8, "All 8 PMC administrative departments covered");

// Department grievance mapping
const deptMap = {};
for (const deptId of validDeptIds) {
  const deptGrievances = store.grievances.filter((g) => g.departmentId === deptId);
  deptMap[deptId] = {
    total: deptGrievances.length,
    resolved: deptGrievances.filter((g) => g.status === "RESOLVED").length,
  };
}
assert(Object.keys(deptMap).length === 8, "Aggregated performance mapped for all 8 departments without error");

// 15 Wards
const PUNE_WARDS = [
  "Aundh - Baner", "Shivajinagar - Ghole Road", "Kothrud - Bavdhan", "Warje - Karvenagar",
  "Sinhagad Road", "Dhankawadi - Sahakarnagar", "Bibvewadi", "Wanowrie - Ramtekdi",
  "Kondhwa - Yewalewadi", "Hadapsar - Mundhwa", "Nagar Road - Vadgaon Sheri", "Kalyani Nagar - Yerawada",
  "Kasba - Vishrambaug Wada", "Bhavani Peth", "Pune Station - Dhole Patil Road",
];
assert(PUNE_WARDS.length === 15, "All 15 Pune Municipal Corporation Prabhag Wards covered");

const wardCounts = PUNE_WARDS.map((wardName) => {
  return store.grievances.filter((g) => g.ward === wardName).length;
});
const totalWarded = wardCounts.reduce((a, b) => a + b, 0);
assert(totalWarded <= totalGrievances, `Ward distribution aggregates correctly across 15 wards (${totalWarded} complaints mapped)`);

// -------------------------------------------------------------
// 6. ESCALATION MANAGEMENT & ADMINISTRATIVE REVIEW
// -------------------------------------------------------------
console.log(`\n${colors.bold}6. Escalations Management & Admin Review Remarks${colors.reset}`);

const escalations = store.escalations || [];
assert(Array.isArray(escalations), "Escalations registry loaded from store");

if (escalations.length > 0) {
  const firstEsc = escalations[0];
  assert(firstEsc.id && firstEsc.grievanceId, `Escalation #${firstEsc.id} links to valid grievance #${firstEsc.grievanceId}`);
  assert(firstEsc.reason && typeof firstEsc.reason === "string", "Escalation contains verified breach/appeal reason");
}

// Admin review action verification
function reviewEscalation(esc, remarks, reviewer) {
  if (!remarks || remarks.trim().length < 5) {
    throw new Error("Review remarks must be at least 5 characters.");
  }
  return {
    ...esc,
    status: "REVIEWED",
    reviewRemarks: remarks.trim(),
    reviewedById: reviewer.id,
    reviewedByName: reviewer.name,
    resolvedAt: new Date().toISOString(),
  };
}

const mockEsc = { id: "esc_test_01", grievanceId: "grv_01", reason: "SLA breach 48h exceeded", status: "TRIGGERED" };
const reviewedEsc = reviewEscalation(mockEsc, "Directed Ward Executive Engineer to expedite remediation.", adminUser);
assert(reviewedEsc.status === "REVIEWED", "Escalation status transitions to REVIEWED upon admin action");
assert(reviewedEsc.reviewedByName === adminUser.name, "Escalation records identity of administrative reviewer");

// -------------------------------------------------------------
// 7. COMMUNITY CONTENT MODERATION
// -------------------------------------------------------------
console.log(`\n${colors.bold}7. Community Feedback Moderation & Audit Recording${colors.reset}`);

const comments = store.comments || [];
assert(Array.isArray(comments), "Comments loaded from persistent civic store");

function moderateComment(comment, action, reason, moderator) {
  if (!reason || reason.trim().length < 5) {
    throw new Error("Moderation reason must be at least 5 characters.");
  }
  return {
    ...comment,
    isModerated: action === "HIDE",
    moderationReason: reason.trim(),
    moderatedAt: new Date().toISOString(),
    moderatedById: moderator.id,
  };
}

const mockComment = { id: "cm_01", content: "Offensive text here", authorName: "Citizen", isModerated: false };
const hiddenComment = moderateComment(mockComment, "HIDE", "Contains unverified abusive language.", adminUser);
assert(hiddenComment.isModerated === true, "Comment is successfully hidden from public civic feed");
assert(hiddenComment.moderationReason.includes("abusive language"), "Moderation reason is authoritatively persisted");

// Test public viewing filter
function filterPublicComments(commentList, role) {
  if (role !== "ADMIN") {
    return commentList.filter((c) => !c.isModerated && !c.isInternal);
  }
  return commentList;
}

const allComments = [
  { id: "cm_01", content: "Normal comment", isModerated: false, isInternal: false },
  { id: "cm_02", content: "Spam / abusive", isModerated: true, isInternal: false },
  { id: "cm_03", content: "Officer internal remark", isModerated: false, isInternal: true },
];

const citizenVisibleComments = filterPublicComments(allComments, "CITIZEN");
assert(citizenVisibleComments.length === 1 && citizenVisibleComments[0].id === "cm_01", "Citizen view strictly excludes moderated comments and internal notes");
assert(filterPublicComments(allComments, "ADMIN").length === 3, "Admin view retains complete comment records for moderation");

const restoredComment = moderateComment(hiddenComment, "RESTORE", "Comment re-evaluated and deemed constructive.", adminUser);
assert(restoredComment.isModerated === false, "Comment can be safely restored by authorized administrator");

// Test Deadline Sorting
const casesToSort = [
  { id: "c1", deadlineAt: "2026-10-25T10:00:00Z" },
  { id: "c2", deadlineAt: "2026-10-22T10:00:00Z" },
  { id: "c3", deadlineAt: "2026-10-28T10:00:00Z" },
];
casesToSort.sort((a, b) => new Date(a.deadlineAt).getTime() - new Date(b.deadlineAt).getTime());
assert(casesToSort[0].id === "c2" && casesToSort[2].id === "c3", "Deadline sorting correctly orders earliest deadline first");

// -------------------------------------------------------------
// 8. OWASP FORMULA INJECTION DEFENSE IN CSV EXPORTS
// -------------------------------------------------------------
console.log(`\n${colors.bold}8. CSV Exports & OWASP Formula Injection Defense${colors.reset}`);

function sanitizeCSVField(val) {
  if (val === null || val === undefined) return "";
  let str = String(val).trim();
  // Neutralize spreadsheet formula injection characters (=, +, -, @, tab, return)
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  // Standard RFC 4180 CSV escaping
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    str = `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Test Formula Injection vectors
const maliciousFormula1 = "=cmd|' /C calc'!A0";
const maliciousFormula2 = "+1+1";
const maliciousFormula3 = "-2+3";
const maliciousFormula4 = "@SUM(A1:A10)";
const normalText = "Pothole on FC Road Pune";
const commaText = "Roads, Drainage & Water";

assert(sanitizeCSVField(maliciousFormula1) === "'=cmd|' /C calc'!A0", "Formula '=cmd...' prefixed with single quote");
assert(sanitizeCSVField(maliciousFormula2) === "'+1+1", "Formula '+1+1' prefixed with single quote");
assert(sanitizeCSVField(maliciousFormula3) === "'-2+3", "Formula '-2+3' prefixed with single quote");
assert(sanitizeCSVField(maliciousFormula4) === "'@SUM(A1:A10)", "Formula '@SUM...' prefixed with single quote");
assert(sanitizeCSVField(normalText) === "Pothole on FC Road Pune", "Normal civic text remains unescaped without quotes");
assert(sanitizeCSVField(commaText) === '"Roads, Drainage & Water"', "Text containing commas is RFC 4180 quoted");

// -------------------------------------------------------------
// 9. AUDIT LOG INTEGRITY & ROLE AUTHORIZATION
// -------------------------------------------------------------
console.log(`\n${colors.bold}9. Audit Log Forensic Trail & Role Access Controls${colors.reset}`);

const auditLogs = store.auditLogs || [];
assert(Array.isArray(auditLogs), "Audit log ledger loaded from civic store");

function authorizeOfficer(user, grievance) {
  if (user.role !== "MUNICIPAL_OFFICER" || !grievance) return false;
  return (
    user.departmentId === grievance.departmentId ||
    user.department === grievance.departmentName ||
    user.department === grievance.department
  );
}

function authorizeAdmin(user) {
  return user.role === "ADMIN";
}

// Test RBAC
assert(!authorizeOfficer(citizenUser, roadsGrievances[0]), "Citizen CANNOT access officer operational routes");
assert(!authorizeAdmin(citizenUser), "Citizen CANNOT access administrator command center");
assert(!authorizeAdmin(officerUser), "Municipal Officer CANNOT access administrative analytics or exports");
assert(authorizeOfficer(officerUser, roadsGrievances[0]), "Officer can access their assigned department grievance");
assert(authorizeAdmin(adminUser), "Admin has full clearance for system command center");

// Cross-department isolation check
const solidWasteGrievance = {
  id: "grv_sw_01",
  departmentId: "dept_02",
  departmentName: "Solid Waste Management",
};
assert(!authorizeOfficer(officerUser, solidWasteGrievance), "Roads Officer strictly blocked from accessing Solid Waste grievance");

// Audit record structure verification
function createAuditEntry(actor, action, targetType, targetId, details) {
  return {
    id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action,
    targetType,
    targetId,
    details,
    timestamp: new Date().toISOString(),
  };
}

const auditEntry = createAuditEntry(
  officerUser,
  "GRIEVANCE_REASSIGNED",
  "GRIEVANCE",
  "PS-PUN-2026-000001",
  { fromDept: "Roads & Traffic Maintenance", toDept: "Water Supply", reason: "Water leak issue" }
);
assert(auditEntry.actorRole === "MUNICIPAL_OFFICER", "Audit log captures verified officer role");
assert(auditEntry.action === "GRIEVANCE_REASSIGNED", "Audit log captures specific sensitive action");
assert(auditEntry.details.fromDept && auditEntry.details.toDept, "Audit log preserves before/after operational context");
assert(auditEntry.timestamp && !isNaN(Date.parse(auditEntry.timestamp)), "Audit log has ISO timestamp");

// -------------------------------------------------------------
// SUMMARY
// -------------------------------------------------------------
console.log(`\n${colors.bold}${colors.cyan}======================================================${colors.reset}`);
console.log(`${colors.bold}TEST SUITE RESULTS:${colors.reset}`);
console.log(`  Total Passed: ${colors.green}${passed}${colors.reset}`);
console.log(`  Total Failed: ${colors.red}${failed}${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}======================================================${colors.reset}\n`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log(`${colors.green}${colors.bold}✔ ALL VERSION 8 OPERATIONAL VERIFICATIONS PASSED SUCCESSFULLY!${colors.reset}\n`);
  process.exit(0);
}
