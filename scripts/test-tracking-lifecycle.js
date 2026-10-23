#!/usr/bin/env node

/**
 * PuneSetu (पुणे सेतू) - Version 6 Grievance Tracking, SLA & Lifecycle Test Suite
 *
 * Comprehensive Automated Verification covering:
 * 1. Tracking Token Validation & Public/Private Privacy Boundary
 * 2. Status Lifecycle State Machine & Role Transitions
 * 3. Resolution Verification (Mandatory Closing Remarks & Photos)
 * 4. Formal Rejection Requirements & Citizen Reopening Workflow
 * 5. 21-Day Application SLA Target & Real-Time Countdown Evaluation
 * 6. Idempotent Server-Side Overdue Processing (Cron Engine)
 * 7. Citizen-Requested Escalation & Anti-Abuse Prevention
 * 8. Citizen Satisfaction Feedback (1-5 Rating & Owner Verification)
 * 9. Multilingual Text-to-Speech Dossier Generation
 * 10. Audit Logging & In-App Notification Generation
 */

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { z } = require("zod");

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
// IN-MEMORY ISOLATED TEST HARNESS
// -------------------------------------------------------------
const APPLICATION_SLA_DAYS = 21;

const ALLOWED_STATUS_TRANSITIONS = {
  SUBMITTED: ["ASSIGNED", "REJECTED", "ESCALATED", "SLA_BREACHED"],
  ASSIGNED: ["IN_PROGRESS", "REJECTED", "ESCALATED", "SLA_BREACHED"],
  IN_PROGRESS: ["RESOLVED", "REJECTED", "ESCALATED", "SLA_BREACHED"],
  RESOLVED: ["REOPENED"],
  REJECTED: ["REOPENED"],
  ESCALATED: ["ASSIGNED", "IN_PROGRESS", "RESOLVED", "REJECTED"],
  SLA_BREACHED: ["ESCALATED", "ASSIGNED", "IN_PROGRESS", "RESOLVED"],
  REOPENED: ["ASSIGNED", "IN_PROGRESS", "RESOLVED", "REJECTED", "ESCALATED", "SLA_BREACHED"],
};

function isValidStatusTransition(currentStatus, targetStatus, userRole) {
  if (userRole === "ADMIN") {
    if (currentStatus === targetStatus) {
      return { allowed: false, reason: "Grievance is already in the requested status." };
    }
    return { allowed: true };
  }

  if (userRole === "CITIZEN") {
    if ((currentStatus === "RESOLVED" || currentStatus === "REJECTED") && targetStatus === "REOPENED") {
      return { allowed: true };
    }
    if (["SUBMITTED", "ASSIGNED", "IN_PROGRESS", "REOPENED"].includes(currentStatus) && targetStatus === "ESCALATED") {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: "Citizens can only request reopening on resolved cases or request escalation on delayed active cases.",
    };
  }

  if (userRole === "MUNICIPAL_OFFICER") {
    const allowedTargets = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];
    if (!allowedTargets.includes(targetStatus)) {
      return {
        allowed: false,
        reason: `Cannot transition grievance from ${currentStatus} to ${targetStatus}. Allowed: [${allowedTargets.join(", ")}]`,
      };
    }
    return { allowed: true };
  }

  return { allowed: false, reason: "Unauthorized status transition." };
}

function calculateApplicationSLADeadline(fromDate = new Date(), days = APPLICATION_SLA_DAYS) {
  const deadline = new Date(fromDate);
  deadline.setDate(deadline.getDate() + days);
  return deadline;
}

function getSLAStatusInfo(grievance, now = Date.now()) {
  if (grievance.status === "RESOLVED") {
    return { state: "RESOLVED", label: "Resolved", isOverdue: false };
  }
  if (grievance.status === "REJECTED") {
    return { state: "REJECTED", label: "Rejected", isOverdue: false };
  }
  if (grievance.status === "REOPENED") {
    return { state: "REOPENED", label: "Reopened by Citizen", isOverdue: false };
  }
  if (!grievance.deadlineAt) {
    return { state: "NO_TARGET", label: "No Target Configured", isOverdue: false };
  }

  const deadline = new Date(grievance.deadlineAt).getTime();
  const diffMs = deadline - now;

  if (diffMs < 0 || grievance.status === "SLA_BREACHED") {
    const overdueHours = Math.max(1, Math.round(Math.abs(diffMs) / (1000 * 3600)));
    const overdueDays = Math.floor(overdueHours / 24);
    return {
      state: "OVERDUE",
      label: overdueDays > 0 ? `Overdue by ${overdueDays}d` : `Overdue by ${overdueHours}h`,
      isOverdue: true,
      overdueHours,
    };
  }

  const hoursRemaining = Math.round(diffMs / (1000 * 3600));
  const daysRemaining = Math.floor(hoursRemaining / 24);

  if (hoursRemaining <= 24) {
    return { state: "DUE_TODAY", label: `Due in ${hoursRemaining}h`, isOverdue: false };
  }
  if (hoursRemaining <= 72) {
    return { state: "APPROACHING", label: `${daysRemaining} days remaining`, isOverdue: false };
  }
  return { state: "WITHIN_TARGET", label: `${daysRemaining} days remaining`, isOverdue: false };
}

// -------------------------------------------------------------
// 1. TRACKING TOKEN VALIDATION & PRIVACY BOUNDARY
// -------------------------------------------------------------
function testTrackingTokenAndPrivacy() {
  console.log(`\n${colors.bold}${colors.cyan}[1/10] Tracking Token Format & Public/Private Boundary${colors.reset}`);

  const TOKEN_REGEX = /^PS-PUN-(20\d{2})-([A-Z0-9]{6})$/;

  // Token format tests
  assert(TOKEN_REGEX.test("PS-PUN-2026-AB12CD"), "Valid token format passes regex validation");
  assert(!TOKEN_REGEX.test("PS-MUM-2026-AB12CD"), "Invalid city prefix PS-MUM rejected");
  assert(!TOKEN_REGEX.test("PS-PUN-2026-ABCDE"), "Token with 5 chars rejected (requires 6)");
  assert(!TOKEN_REGEX.test("PS-PUN-2026-ABCDEFG"), "Token with 7 chars rejected (requires 6)");
  assert(!TOKEN_REGEX.test("INVALID_TOKEN"), "Completely invalid string rejected");

  // Privacy boundary masking test
  const fullGrievance = {
    id: "grv_test1",
    trackingToken: "PS-PUN-2026-TK0001",
    title: "Overflowing garbage bin on FC Road",
    description: "Waste accumulation near modern cafe",
    category: "SOLID_WASTE",
    priority: "HIGH",
    status: "IN_PROGRESS",
    latitude: 18.52043,
    longitude: 73.856744,
    address: "Opposite Modern College, FC Road, Shivajinagar, Pune 411005",
    landmark: "Near Modern Cafe",
    wardName: "Shivajinagar-Ghole Road",
    departmentName: "Solid Waste Management",
    citizenId: "usr_citizen1",
    citizenName: "Rahul Sharma",
    citizenEmail: "rahul.sharma@example.com",
    citizenPhone: "9876543210",
    submittedAt: "2026-03-01T10:00:00.000Z",
    deadlineAt: "2026-03-22T10:00:00.000Z",
  };

  function sanitizeForPublic(grievance, viewer) {
    const isOwner = viewer && viewer.id === grievance.citizenId;
    const isOfficer = viewer && (viewer.role === "MUNICIPAL_OFFICER" || viewer.role === "ADMIN");
    if (isOwner || isOfficer) {
      return { ...grievance };
    }
    // Masked public record
    const { latitude, longitude, citizenName, citizenEmail, citizenPhone, ...safePublic } = grievance;
    return safePublic;
  }

  // Unauthenticated / Anonymous public viewer
  const publicView = sanitizeForPublic(fullGrievance, null);
  assert(publicView.trackingToken === "PS-PUN-2026-TK0001", "Public view preserves tracking token");
  assert(publicView.latitude === undefined, "Public view masks exact GPS latitude");
  assert(publicView.longitude === undefined, "Public view masks exact GPS longitude");
  assert(publicView.citizenEmail === undefined, "Public view masks citizen email address");
  assert(publicView.citizenPhone === undefined, "Public view masks citizen phone number");
  assert(publicView.landmark === "Near Modern Cafe", "Public view preserves non-sensitive generalized landmark");

  // Authorized Citizen Owner viewer
  const ownerView = sanitizeForPublic(fullGrievance, { id: "usr_citizen1", role: "CITIZEN" });
  assert(ownerView.latitude === 18.52043, "Owner view reveals exact GPS latitude");
  assert(ownerView.citizenEmail === "rahul.sharma@example.com", "Owner view reveals citizen email");

  // Authorized Municipal Officer viewer
  const officerView = sanitizeForPublic(fullGrievance, { id: "usr_officer1", role: "MUNICIPAL_OFFICER" });
  assert(officerView.latitude === 18.52043, "Officer view reveals exact GPS coordinates for field inspection");
}

// -------------------------------------------------------------
// 2. STATUS LIFECYCLE & ROLE-BASED TRANSITIONS
// -------------------------------------------------------------
function testStatusLifecycle() {
  console.log(`\n${colors.bold}${colors.cyan}[2/10] Status Lifecycle & Role-Based Transitions${colors.reset}`);

  // Permitted Officer transitions
  assert(
    isValidStatusTransition("SUBMITTED", "ASSIGNED", "MUNICIPAL_OFFICER").allowed,
    "Officer: SUBMITTED -> ASSIGNED is allowed"
  );
  assert(
    isValidStatusTransition("ASSIGNED", "IN_PROGRESS", "MUNICIPAL_OFFICER").allowed,
    "Officer: ASSIGNED -> IN_PROGRESS is allowed"
  );
  assert(
    isValidStatusTransition("IN_PROGRESS", "RESOLVED", "MUNICIPAL_OFFICER").allowed,
    "Officer: IN_PROGRESS -> RESOLVED is allowed"
  );
  assert(
    isValidStatusTransition("IN_PROGRESS", "REJECTED", "MUNICIPAL_OFFICER").allowed,
    "Officer: IN_PROGRESS -> REJECTED is allowed"
  );

  // Illegal Officer transitions
  assert(
    !isValidStatusTransition("SUBMITTED", "RESOLVED", "MUNICIPAL_OFFICER").allowed,
    "Officer: Direct SUBMITTED -> RESOLVED is rejected (must be assigned/in progress first)"
  );
  assert(
    !isValidStatusTransition("RESOLVED", "IN_PROGRESS", "MUNICIPAL_OFFICER").allowed,
    "Officer: Direct RESOLVED -> IN_PROGRESS is rejected (must be reopened first)"
  );

  // Citizen permissions
  assert(
    !isValidStatusTransition("SUBMITTED", "IN_PROGRESS", "CITIZEN").allowed,
    "Citizen: Cannot mark case as IN_PROGRESS"
  );
  assert(
    !isValidStatusTransition("IN_PROGRESS", "RESOLVED", "CITIZEN").allowed,
    "Citizen: Cannot mark case as RESOLVED"
  );
  assert(
    isValidStatusTransition("RESOLVED", "REOPENED", "CITIZEN").allowed,
    "Citizen: Can request REOPENED on a resolved case"
  );
  assert(
    isValidStatusTransition("IN_PROGRESS", "ESCALATED", "CITIZEN").allowed,
    "Citizen: Can request ESCALATED on an active case"
  );

  // Admin override permissions
  assert(
    isValidStatusTransition("SUBMITTED", "RESOLVED", "ADMIN").allowed,
    "Admin: Administrative override permits direct transition"
  );
  assert(
    !isValidStatusTransition("RESOLVED", "RESOLVED", "ADMIN").allowed,
    "Admin: Cannot transition to the identical current status"
  );
}

// -------------------------------------------------------------
// 3. RESOLUTION REQUIREMENTS (REMARKS + PHOTO)
// -------------------------------------------------------------
function testResolutionRequirements() {
  console.log(`\n${colors.bold}${colors.cyan}[3/10] Resolution Evidence & Mandatory Closing Remarks${colors.reset}`);

  function validateResolution(input, existingPhotos = []) {
    if (input.newStatus !== "RESOLVED") return { valid: true };

    if (!input.notes || input.notes.trim().length < 10) {
      throw new Error("Formal closing remarks (minimum 10 characters) are required to mark a grievance as RESOLVED.");
    }

    const hasNewPhoto = Boolean(
      input.resolutionEvidence &&
        input.resolutionEvidence.some((e) => e.evidenceType === "PHOTO")
    );
    const hasExistingPhoto = existingPhotos.some((e) => e.evidenceType === "PHOTO");

    if (!hasNewPhoto && !hasExistingPhoto) {
      throw new Error("At least one verified resolution photograph is required to mark a grievance as RESOLVED.");
    }

    return { valid: true };
  }

  // 1. Missing closing remarks
  let errMissingRemarks = false;
  try {
    validateResolution({
      newStatus: "RESOLVED",
      notes: "Done",
      resolutionEvidence: [{ evidenceType: "PHOTO" }],
    });
  } catch (err) {
    errMissingRemarks = err.message.includes("minimum 10 characters");
  }
  assert(errMissingRemarks, "Rejects resolution when closing remarks are under 10 characters");

  // 2. Missing resolution photo
  let errMissingPhoto = false;
  try {
    validateResolution({
      newStatus: "RESOLVED",
      notes: "Pothole has been completely asphalted and leveled by junior engineer.",
      resolutionEvidence: [],
    });
  } catch (err) {
    errMissingPhoto = err.message.includes("resolution photograph is required");
  }
  assert(errMissingPhoto, "Rejects resolution when resolution photograph is missing");

  // 3. Valid resolution with photo and closing remarks
  const validRes = validateResolution({
    newStatus: "RESOLVED",
    notes: "Pothole filled with mastic asphalt mix and rolled smooth. Road reopened.",
    resolutionEvidence: [
      {
        evidenceType: "PHOTO",
        storageKey: "evd_res_1234.jpg",
        originalFilename: "completed_work.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 1024 * 400,
      },
    ],
  });
  assert(validRes.valid, "Accepts resolution with verified photo and formal closing remarks");
}

// -------------------------------------------------------------
// 4. FORMAL REJECTION & CITIZEN REOPENING
// -------------------------------------------------------------
function testRejectionAndReopening() {
  console.log(`\n${colors.bold}${colors.cyan}[4/10] Formal Rejection & Citizen Reopening Workflow${colors.reset}`);

  function validateRejection(input) {
    if (input.newStatus !== "REJECTED") return { valid: true };
    const reason = (input.rejectionReason || input.notes || "").trim();
    if (reason.length < 10) {
      throw new Error("A formal justification (minimum 10 characters) is required to reject a grievance.");
    }
    return { valid: true, formalNote: `Rejected: ${reason}` };
  }

  // Insufficient rejection justification
  let errRejection = false;
  try {
    validateRejection({ newStatus: "REJECTED", rejectionReason: "Invalid" });
  } catch (err) {
    errRejection = err.message.includes("minimum 10 characters");
  }
  assert(errRejection, "Rejects formal rejection without minimum 10-char justification");

  // Valid formal rejection
  const validRejection = validateRejection({
    newStatus: "REJECTED",
    rejectionReason: "Private residential society property outside municipal jurisdiction.",
  });
  assert(validRejection.valid, "Accepts formal rejection with comprehensive municipal justification");
  assert(
    validRejection.formalNote.includes("outside municipal jurisdiction"),
    "Properly formats formal rejection audit note"
  );

  // Reopening a rejected grievance
  const reopenCheck = isValidStatusTransition("REJECTED", "REOPENED", "CITIZEN");
  assert(reopenCheck.allowed, "Citizen appeal allows transitioning REJECTED to REOPENED");
}

// -------------------------------------------------------------
// 5. 21-DAY APPLICATION SLA TARGET & COUNTDOWN
// -------------------------------------------------------------
function testSLATargetAndCountdown() {
  console.log(`\n${colors.bold}${colors.cyan}[5/10] 21-Day Application SLA Target & Countdown Engine${colors.reset}`);

  const submissionDate = new Date("2026-04-01T12:00:00.000Z");
  const calculatedDeadline = calculateApplicationSLADeadline(submissionDate, 21);

  // 1. Deadline calculation
  const expectedDeadline = new Date("2026-04-22T12:00:00.000Z");
  assert(
    calculatedDeadline.getTime() === expectedDeadline.getTime(),
    "Accurately calculates 21-day application deadline from submission date"
  );

  // 2. SLA countdown evaluation
  // Day 5 after submission: Within target
  const nowDay5 = new Date("2026-04-06T12:00:00.000Z").getTime();
  const infoDay5 = getSLAStatusInfo(
    { status: "IN_PROGRESS", deadlineAt: calculatedDeadline.toISOString() },
    nowDay5
  );
  assert(infoDay5.state === "WITHIN_TARGET", "Correctly evaluates state as WITHIN_TARGET (16 days remaining)");
  assert(!infoDay5.isOverdue, "isOverdue is false when within target");

  // Day 19 after submission: Approaching (within 72 hours)
  const nowDay19 = new Date("2026-04-20T12:00:00.000Z").getTime();
  const infoDay19 = getSLAStatusInfo(
    { status: "IN_PROGRESS", deadlineAt: calculatedDeadline.toISOString() },
    nowDay19
  );
  assert(infoDay19.state === "APPROACHING", "Correctly evaluates state as APPROACHING (48h / 2 days remaining)");

  // Day 20.5 after submission: Due today (< 24 hours)
  const nowDay20_5 = new Date("2026-04-21T18:00:00.000Z").getTime();
  const infoDay20_5 = getSLAStatusInfo(
    { status: "IN_PROGRESS", deadlineAt: calculatedDeadline.toISOString() },
    nowDay20_5
  );
  assert(infoDay20_5.state === "DUE_TODAY", "Correctly evaluates state as DUE_TODAY (< 24 hours remaining)");

  // Day 22 after submission: Overdue
  const nowDay22 = new Date("2026-04-23T12:00:00.000Z").getTime();
  const infoDay22 = getSLAStatusInfo(
    { status: "IN_PROGRESS", deadlineAt: calculatedDeadline.toISOString() },
    nowDay22
  );
  assert(infoDay22.state === "OVERDUE", "Correctly evaluates state as OVERDUE after deadline passes");
  assert(infoDay22.isOverdue === true, "isOverdue is true after deadline passes");

  // Resolved status overrides countdown
  const infoResolved = getSLAStatusInfo(
    { status: "RESOLVED", deadlineAt: calculatedDeadline.toISOString() },
    nowDay22
  );
  assert(infoResolved.state === "RESOLVED", "Resolved grievance evaluates to RESOLVED state, not OVERDUE");
}

// -------------------------------------------------------------
// 6. RELIABLE SERVER-SIDE OVERDUE PROCESSING & IDEMPOTENCY
// -------------------------------------------------------------
function testOverdueProcessingIdempotency() {
  console.log(`\n${colors.bold}${colors.cyan}[6/10] Server-Side Overdue Processing & Idempotency Engine${colors.reset}`);

  // Mock store
  const mockStore = {
    grievances: [
      {
        id: "grv_overdue_1",
        trackingToken: "PS-PUN-2026-OVD001",
        status: "IN_PROGRESS",
        deadlineAt: "2026-03-01T12:00:00.000Z", // Past deadline
        citizenId: "usr_citizen1",
      },
      {
        id: "grv_active_normal",
        trackingToken: "PS-PUN-2026-NRM002",
        status: "IN_PROGRESS",
        deadlineAt: "2026-12-31T12:00:00.000Z", // Future deadline
        citizenId: "usr_citizen2",
      },
      {
        id: "grv_already_resolved",
        trackingToken: "PS-PUN-2026-RES003",
        status: "RESOLVED",
        deadlineAt: "2026-03-01T12:00:00.000Z", // Past deadline, but RESOLVED!
        citizenId: "usr_citizen3",
      },
    ],
    escalations: [],
    statusHistory: [],
    notifications: [],
  };

  function processOverdue(store, now = new Date("2026-04-01T12:00:00.000Z")) {
    const activeStatuses = ["SUBMITTED", "ASSIGNED", "IN_PROGRESS", "REOPENED", "SLA_BREACHED"];
    const eligible = store.grievances.filter((g) => {
      if (!activeStatuses.includes(g.status)) return false;
      if (!g.deadlineAt) return false;
      return new Date(g.deadlineAt).getTime() < now.getTime();
    });

    let escalatedCount = 0;
    let skippedCount = 0;

    for (const g of eligible) {
      // Idempotency check: has SLA_TIME_EXCEEDED already been created?
      const already = store.escalations.some(
        (e) => e.grievanceId === g.id && e.escalationType === "SLA_TIME_EXCEEDED"
      );
      if (already) {
        skippedCount++;
        continue;
      }

      store.escalations.push({
        id: `esc_${crypto.randomUUID()}`,
        grievanceId: g.id,
        escalationType: "SLA_TIME_EXCEEDED",
        reason: `Automated SLA Overdue Monitor: Case exceeded resolution target of ${g.deadlineAt}.`,
        status: "PENDING",
      });

      g.underlyingStatus = g.status;
      g.isOverdue = true;
      g.status = "SLA_BREACHED";
      store.statusHistory.push({
        grievanceId: g.id,
        newStatus: "SLA_BREACHED",
        changeReason: "Automatic SLA target breach detection",
      });
      escalatedCount++;
    }

    return { processedCount: eligible.length, escalatedCount, skippedCount };
  }

  // Run 1: First run
  const run1 = processOverdue(mockStore);
  assert(run1.processedCount === 1, "Run 1: Identifies exactly 1 overdue active grievance (ignores resolved & future)");
  assert(run1.escalatedCount === 1, "Run 1: Escalates the overdue grievance to SLA_BREACHED");
  assert(mockStore.grievances[0].status === "SLA_BREACHED", "Run 1: Status updated to SLA_BREACHED");
  assert(mockStore.escalations.length === 1, "Run 1: Creates exactly 1 EscalationRecord");

  // Run 2: Immediately execute again (simulate duplicate cron / concurrent trigger)
  const run2 = processOverdue(mockStore);
  assert(run2.escalatedCount === 0, "Run 2 (Duplicate execution): 0 new escalations created");
  assert(run2.skippedCount === 1, "Run 2: Correctly skipped already-escalated grievance via idempotency check");
  assert(mockStore.escalations.length === 1, "Run 2: Total escalation records remain strictly 1 (No duplicate spam)");
}

// -------------------------------------------------------------
// 7. CITIZEN-REQUESTED ESCALATION & ABUSE PREVENTION
// -------------------------------------------------------------
function testCitizenRequestedEscalation() {
  console.log(`\n${colors.bold}${colors.cyan}[7/10] Citizen-Requested Escalation & Anti-Abuse Rules${colors.reset}`);

  const mockStore = {
    grievances: [
      {
        id: "grv_esc_1",
        trackingToken: "PS-PUN-2026-ESC001",
        status: "IN_PROGRESS",
        citizenId: "usr_citizen1",
      },
      {
        id: "grv_esc_resolved",
        trackingToken: "PS-PUN-2026-ESC002",
        status: "RESOLVED",
        citizenId: "usr_citizen1",
      },
    ],
    escalations: [],
  };

  function requestCitizenEscalation(store, token, reason, user) {
    const grievance = store.grievances.find((g) => g.trackingToken === token);
    if (!grievance) throw new Error("Grievance not found");

    if (user.role === "CITIZEN" && grievance.citizenId !== user.id) {
      throw new Error("You are not authorized to escalate another citizen's grievance.");
    }

    if (grievance.status === "RESOLVED") {
      throw new Error("Cannot escalate a resolved grievance. You may request to reopen the case instead.");
    }

    const pending = store.escalations.find(
      (e) => e.grievanceId === grievance.id && e.escalationType === "MANUAL_CITIZEN_ESCALATION" && e.status === "PENDING"
    );
    if (pending) {
      throw new Error("An escalation request for this grievance is already pending review.");
    }

    if (!reason || reason.trim().length < 10) {
      throw new Error("Escalation reason must be at least 10 characters long.");
    }

    const escalation = {
      id: `esc_${crypto.randomUUID()}`,
      grievanceId: grievance.id,
      escalationType: "MANUAL_CITIZEN_ESCALATION",
      reason: reason.trim(),
      status: "PENDING",
      escalatedById: user.id,
    };
    store.escalations.push(escalation);
    grievance.status = "ESCALATED";
    return escalation;
  }

  // 1. Citizen cannot escalate another citizen's grievance
  let errAuth = false;
  try {
    requestCitizenEscalation(mockStore, "PS-PUN-2026-ESC001", "Delay in resolution", {
      id: "usr_different_citizen",
      role: "CITIZEN",
    });
  } catch (err) {
    errAuth = err.message.includes("not authorized");
  }
  assert(errAuth, "Rejects unauthorized escalation request on another citizen's case");

  // 2. Cannot escalate a resolved grievance
  let errResolved = false;
  try {
    requestCitizenEscalation(mockStore, "PS-PUN-2026-ESC002", "Dissatisfied with work", {
      id: "usr_citizen1",
      role: "CITIZEN",
    });
  } catch (err) {
    errResolved = err.message.includes("Cannot escalate a resolved grievance");
  }
  assert(errResolved, "Rejects escalation request on already resolved grievance (instructs to reopen)");

  // 3. Short reason rejected (< 10 chars)
  let errShort = false;
  try {
    requestCitizenEscalation(mockStore, "PS-PUN-2026-ESC001", "Too slow", {
      id: "usr_citizen1",
      role: "CITIZEN",
    });
  } catch (err) {
    errShort = err.message.includes("at least 10 characters");
  }
  assert(errShort, "Rejects escalation with reason under 10 characters");

  // 4. Valid escalation succeeds
  const esc = requestCitizenEscalation(
    mockStore,
    "PS-PUN-2026-ESC001",
    "Grievance unaddressed for 14 days without any site inspection.",
    { id: "usr_citizen1", role: "CITIZEN" }
  );
  assert(esc.escalationType === "MANUAL_CITIZEN_ESCALATION", "Creates valid MANUAL_CITIZEN_ESCALATION record");
  assert(mockStore.grievances[0].status === "ESCALATED", "Updates grievance status to ESCALATED");

  // 5. Anti-spam: Cannot create a second pending escalation
  let errDuplicate = false;
  try {
    requestCitizenEscalation(
      mockStore,
      "PS-PUN-2026-ESC001",
      "Repeated request: please check this as soon as possible.",
      { id: "usr_citizen1", role: "CITIZEN" }
    );
  } catch (err) {
    errDuplicate = err.message.includes("already pending review");
  }
  assert(errDuplicate, "Prevents duplicate pending citizen escalation requests (anti-abuse)");
}

// -------------------------------------------------------------
// 8. CITIZEN SATISFACTION FEEDBACK (1-5 RATING)
// -------------------------------------------------------------
function testSatisfactionFeedback() {
  console.log(`\n${colors.bold}${colors.cyan}[8/10] Citizen Satisfaction Feedback Engine${colors.reset}`);

  const mockStore = {
    grievances: [
      {
        id: "grv_fb_1",
        trackingToken: "PS-PUN-2026-FB0001",
        status: "RESOLVED",
        citizenId: "usr_citizen1",
      },
      {
        id: "grv_fb_in_progress",
        trackingToken: "PS-PUN-2026-FB0002",
        status: "IN_PROGRESS",
        citizenId: "usr_citizen1",
      },
    ],
    feedback: [],
  };

  const feedbackSchema = z.object({
    rating: z.number().int().min(1).max(5),
    feedbackText: z.string().trim().max(500).optional().nullable(),
  });

  function submitFeedback(store, token, input, user) {
    const validated = feedbackSchema.parse(input);
    const grievance = store.grievances.find((g) => g.trackingToken === token);
    if (!grievance) throw new Error("Grievance not found");

    if (grievance.citizenId !== user.id) {
      throw new Error("You can only submit satisfaction feedback for your own grievances.");
    }
    if (grievance.status !== "RESOLVED") {
      throw new Error("Satisfaction feedback can only be submitted once the grievance is officially marked as RESOLVED.");
    }

    const existing = store.feedback.find((f) => f.grievanceId === grievance.id);
    if (existing) {
      throw new Error("Satisfaction feedback has already been submitted for this grievance.");
    }

    const newFb = {
      id: `fbk_${crypto.randomUUID()}`,
      grievanceId: grievance.id,
      citizenId: user.id,
      rating: validated.rating,
      feedbackText: validated.feedbackText || null,
      submittedAt: new Date().toISOString(),
    };
    store.feedback.push(newFb);
    return newFb;
  }

  // 1. Invalid ratings (0, 6, decimal)
  assert(!feedbackSchema.safeParse({ rating: 0 }).success, "Rejects rating 0 (minimum is 1)");
  assert(!feedbackSchema.safeParse({ rating: 6 }).success, "Rejects rating 6 (maximum is 5)");
  assert(!feedbackSchema.safeParse({ rating: 3.5 }).success, "Rejects float rating 3.5 (integers only)");
  assert(feedbackSchema.safeParse({ rating: 5 }).success, "Accepts rating 5");
  assert(feedbackSchema.safeParse({ rating: 1 }).success, "Accepts rating 1");

  // 2. Feedback on non-resolved grievance rejected
  let errNotResolved = false;
  try {
    submitFeedback(mockStore, "PS-PUN-2026-FB0002", { rating: 4 }, { id: "usr_citizen1" });
  } catch (err) {
    errNotResolved = err.message.includes("officially marked as RESOLVED");
  }
  assert(errNotResolved, "Rejects feedback when grievance status is not RESOLVED");

  // 3. Unauthorized citizen feedback rejected
  let errUnauthorized = false;
  try {
    submitFeedback(mockStore, "PS-PUN-2026-FB0001", { rating: 5 }, { id: "usr_stranger" });
  } catch (err) {
    errUnauthorized = err.message.includes("only submit satisfaction feedback for your own");
  }
  assert(errUnauthorized, "Rejects feedback submitted by someone other than the citizen owner");

  // 4. Valid feedback accepted
  const fb = submitFeedback(
    mockStore,
    "PS-PUN-2026-FB0001",
    { rating: 5, feedbackText: "Pothole repaired swiftly within 48 hours. Thank you PMC!" },
    { id: "usr_citizen1" }
  );
  assert(fb.rating === 5, "Successfully saves 5-star rating");
  assert(fb.feedbackText.includes("repaired swiftly"), "Successfully saves citizen feedback text");

  // 5. Duplicate feedback rejected
  let errDuplicateFb = false;
  try {
    submitFeedback(mockStore, "PS-PUN-2026-FB0001", { rating: 4 }, { id: "usr_citizen1" });
  } catch (err) {
    errDuplicateFb = err.message.includes("already been submitted");
  }
  assert(errDuplicateFb, "Rejects duplicate satisfaction feedback (one feedback per grievance)");
}

// -------------------------------------------------------------
// 9. TEXT-TO-SPEECH ACCESSIBLE AUDIO DOSSIER GENERATION
// -------------------------------------------------------------
function testAudioDossierGeneration() {
  console.log(`\n${colors.bold}${colors.cyan}[9/10] Accessible Text-to-Speech Audio Dossier Generation${colors.reset}`);

  function generateAudioDossierText(grievance, lang = "en") {
    const formattedToken = grievance.trackingToken.replace(/-/g, " ");
    const statusClean = grievance.status.replace(/_/g, " ").toLowerCase();

    if (lang === "mr") {
      return `पुणे सेतू तक्रार अहवाल. टोकन क्रमांक: ${formattedToken}. शीर्षक: ${grievance.title}. प्रभाग: ${grievance.wardName || "पुणे महानगरपालिका"}. सद्यस्थिती: ${statusClean}.`;
    }
    if (lang === "hi") {
      return `पुणे सेतू शिकायत रिपोर्ट. टोकन नंबर: ${formattedToken}. शीर्षक: ${grievance.title}. प्रभाग: ${grievance.wardName || "पुणे नगर निगम"}. वर्तमान स्थिति: ${statusClean}.`;
    }
    return `PuneSetu Grievance Tracking Summary. Tracking Token: ${formattedToken}. Title: ${grievance.title}. Ward: ${grievance.wardName || "Pune Municipal Corporation"}. Department: ${grievance.departmentName || "Municipal Services"}. Current recorded status is: ${statusClean}.`;
  }

  const sampleGrievance = {
    trackingToken: "PS-PUN-2026-TK9988",
    title: "Broken streetlight near Sambhaji Park",
    wardName: "Shivajinagar-Ghole Road",
    departmentName: "Electrical & Street Lighting",
    status: "IN_PROGRESS",
    citizenPhone: "9876543210", // Private field
  };

  const audioEn = generateAudioDossierText(sampleGrievance, "en");
  const audioMr = generateAudioDossierText(sampleGrievance, "mr");
  const audioHi = generateAudioDossierText(sampleGrievance, "hi");

  assert(audioEn.includes("Tracking Token: PS PUN 2026 TK9988"), "Generates spaced token for natural TTS pronunciation");
  assert(audioEn.includes("Current recorded status is: in progress"), "Announces current recorded status");
  assert(!audioEn.includes("9876543210"), "Strictly omits private citizen phone or personal details from speech text");
  assert(audioMr.includes("पुणे सेतू तक्रार अहवाल"), "Generates valid Marathi audio synthesis text");
  assert(audioHi.includes("पुणे सेतू शिकायत रिपोर्ट"), "Generates valid Hindi audio synthesis text");
}

// -------------------------------------------------------------
// 10. NOTIFICATIONS & AUDIT LOGGING
// -------------------------------------------------------------
function testNotificationsAndAudit() {
  console.log(`\n${colors.bold}${colors.cyan}[10/10] In-App Notification & Audit Logging Engine${colors.reset}`);

  const mockStore = {
    notifications: [],
    auditLogs: [],
  };

  function triggerStatusNotification(store, recipientId, token, newStatus) {
    const notif = {
      id: `notif_${crypto.randomUUID()}`,
      recipientId,
      type: newStatus === "RESOLVED" ? "RESOLUTION_VERIFIED" : "STATUS_CHANGE",
      title: `Grievance Status: ${newStatus.replace(/_/g, " ")}`,
      message: `Your grievance ${token} has transitioned to ${newStatus.replace(/_/g, " ")}.`,
      read: false,
      createdAt: new Date().toISOString(),
    };
    store.notifications.push(notif);
    return notif;
  }

  function recordAudit(store, actorId, action, targetId, metadata) {
    const audit = {
      id: `aud_${crypto.randomUUID()}`,
      actorId,
      action,
      targetType: "Grievance",
      targetId,
      metadata: JSON.stringify(metadata),
      createdAt: new Date().toISOString(),
    };
    store.auditLogs.push(audit);
    return audit;
  }

  // 1. Notification generation
  const notif = triggerStatusNotification(mockStore, "usr_citizen1", "PS-PUN-2026-TK0001", "RESOLVED");
  assert(notif.type === "RESOLUTION_VERIFIED", "Generates RESOLUTION_VERIFIED notification for resolved cases");
  assert(notif.read === false, "New notification has read = false");

  // 2. Audit log generation
  const audit = recordAudit(mockStore, "usr_officer1", "STATUS_TRANSITION_RESOLVED", "grv_123", {
    previousStatus: "IN_PROGRESS",
    newStatus: "RESOLVED",
  });
  assert(audit.action === "STATUS_TRANSITION_RESOLVED", "Records immutable audit action");
  assert(JSON.parse(audit.metadata).newStatus === "RESOLVED", "Preserves structured audit transition metadata");
}

// -------------------------------------------------------------
// 11. PRINTABLE TRACKING RECEIPT & QR VERIFICATION DESTINATION
// -------------------------------------------------------------
function testPrintableReceiptAndQR() {
  console.log(`\n${colors.bold}${colors.cyan}[11/11] Printable Tracking Receipt & QR Verification Destination${colors.reset}`);

  function generateReceiptSlipData(grievance, baseUrl = "https://punesetu.gov.in") {
    const qrUrl = `${baseUrl}/track/${grievance.trackingToken}`;
    return {
      token: grievance.trackingToken,
      qrUrl,
      title: grievance.title,
      category: grievance.category,
      department: grievance.departmentName || "Municipal Maintenance",
      status: grievance.status,
      disclaimer: "This document is an electronic tracking slip generated by the PuneSetu municipal portal.",
    };
  }

  const sample = {
    trackingToken: "PS-PUN-2026-TK9988",
    title: "Broken streetlight near Sambhaji Park",
    category: "STREET_LIGHTING",
    departmentName: "Electrical & Street Lighting",
    status: "IN_PROGRESS",
  };

  const receipt = generateReceiptSlipData(sample, "https://punesetu.gov.in");
  assert(receipt.qrUrl === "https://punesetu.gov.in/track/PS-PUN-2026-TK9988", "QR destination points strictly to canonical /track/[token] route");
  assert(!receipt.qrUrl.includes("undefined"), "QR destination does not contain undefined components");
  assert(receipt.disclaimer.includes("electronic tracking slip"), "Receipt includes official electronic tracking slip disclaimer");
  assert(!receipt.disclaimer.includes("government certified"), "Receipt avoids false claims of official statutory certification");
}

// -------------------------------------------------------------
// RUN ALL TESTS
// -------------------------------------------------------------
console.log(`${colors.bold}${colors.cyan}============================================================${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}  PuneSetu (पुणे सेतू) - Version 6 Verification Test Suite  ${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}============================================================${colors.reset}`);

testTrackingTokenAndPrivacy();
testStatusLifecycle();
testResolutionRequirements();
testRejectionAndReopening();
testSLATargetAndCountdown();
testOverdueProcessingIdempotency();
testCitizenRequestedEscalation();
testSatisfactionFeedback();
testAudioDossierGeneration();
testNotificationsAndAudit();
testPrintableReceiptAndQR();

console.log(`\n${colors.bold}${colors.cyan}============================================================${colors.reset}`);
console.log(`  Tests Passed: ${colors.green}${passed}${colors.reset}`);
console.log(`  Tests Failed: ${failed > 0 ? colors.red : colors.green}${failed}${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}============================================================${colors.reset}\n`);

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
