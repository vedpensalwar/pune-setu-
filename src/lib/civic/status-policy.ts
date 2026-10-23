import { GrievanceStatus, GrievancePriority, Role } from "./types";

/**
 * Default PuneSetu civic application service target in calendar days.
 * Configurable via environment variable DEFAULT_SLA_DAYS.
 * Note: This represents an application operational benchmark, not a statutory legal guarantee.
 */
export const APPLICATION_SLA_DAYS = 21;

/**
 * Allowed status transitions state machine.
 */
export const ALLOWED_STATUS_TRANSITIONS: Record<GrievanceStatus, GrievanceStatus[]> = {
  SUBMITTED: ["ASSIGNED", "REJECTED", "ESCALATED", "SLA_BREACHED"],
  ASSIGNED: ["IN_PROGRESS", "REJECTED", "ESCALATED", "SLA_BREACHED"],
  IN_PROGRESS: ["RESOLVED", "REJECTED", "ESCALATED", "SLA_BREACHED"],
  RESOLVED: ["REOPENED"],
  REJECTED: ["REOPENED"], // Permitted via citizen appeal or supervisor re-evaluation
  ESCALATED: ["ASSIGNED", "IN_PROGRESS", "RESOLVED", "REJECTED"],
  SLA_BREACHED: ["ESCALATED", "ASSIGNED", "IN_PROGRESS", "RESOLVED"],
  REOPENED: ["ASSIGNED", "IN_PROGRESS", "RESOLVED", "REJECTED", "ESCALATED", "SLA_BREACHED"],
};

/**
 * Validate whether a proposed status transition is permitted by policy.
 */
export function isValidStatusTransition(
  currentStatus: GrievanceStatus,
  targetStatus: GrievanceStatus,
  userRole: Role
): { allowed: boolean; reason?: string } {
  // Admin has emergency override authority on all non-identical transitions
  if (userRole === "ADMIN") {
    if (currentStatus === targetStatus) {
      return { allowed: false, reason: "Grievance is already in the requested status." };
    }
    return { allowed: true };
  }

  // Citizens can reopen resolved or rejected grievances, or request escalation on active cases
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

  // Municipal Officer transitions
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

/**
 * Calculate standard resolution SLA deadline based on priority.
 * Used as an advisory municipal operational target.
 */
export function calculateSLADeadline(
  priority: GrievancePriority,
  fromDate: Date = new Date(),
  useApplicationTarget = false
): Date {
  if (useApplicationTarget) {
    return calculateApplicationSLADeadline(fromDate, APPLICATION_SLA_DAYS);
  }
  const deadline = new Date(fromDate);
  switch (priority) {
    case "EMERGENCY":
      deadline.setHours(deadline.getHours() + 6); // 6 hours
      break;
    case "HIGH":
      deadline.setHours(deadline.getHours() + 24); // 24 hours
      break;
    case "MEDIUM":
      deadline.setHours(deadline.getHours() + 72); // 72 hours (3 days)
      break;
    case "LOW":
    default:
      deadline.setHours(deadline.getHours() + 168); // 168 hours (7 days)
      break;
  }
  return deadline;
}

/**
 * Calculates standard 21-calendar-day application SLA benchmark deadline.
 */
export function calculateApplicationSLADeadline(
  fromDate: Date = new Date(),
  days: number = APPLICATION_SLA_DAYS
): Date {
  const deadline = new Date(fromDate);
  deadline.setDate(deadline.getDate() + days);
  return deadline;
}

export type SLALabelState =
  | "RESOLVED"
  | "REOPENED"
  | "REJECTED"
  | "OVERDUE"
  | "DUE_TODAY"
  | "APPROACHING"
  | "WITHIN_TARGET"
  | "NO_TARGET";

export interface SLAStatusInfo {
  state: SLALabelState;
  label: string;
  badgeVariant: "success" | "warning" | "error" | "neutral" | "brand";
  isOverdue: boolean;
  hoursRemaining?: number;
  daysRemaining?: number;
  hoursOverdue?: number;
  daysOverdue?: number;
  description: string;
}

/**
 * Evaluates the SLA deadline status relative to the current time.
 */
export function getSLAStatusInfo(grievance: {
  status: GrievanceStatus;
  deadlineAt?: string | null;
  resolvedAt?: string | null;
}): SLAStatusInfo {
  if (grievance.status === "RESOLVED") {
    return {
      state: "RESOLVED",
      label: "Resolved",
      badgeVariant: "success",
      isOverdue: false,
      description: "Case successfully resolved and closed by municipal engineers.",
    };
  }

  if (grievance.status === "REJECTED") {
    return {
      state: "REJECTED",
      label: "Rejected",
      badgeVariant: "neutral",
      isOverdue: false,
      description: "Case closed with formal municipal justification.",
    };
  }

  if (grievance.status === "REOPENED") {
    return {
      state: "REOPENED",
      label: "Reopened by Citizen",
      badgeVariant: "warning",
      isOverdue: false,
      description: "Reopened by citizen for further municipal review.",
    };
  }

  if (!grievance.deadlineAt) {
    return {
      state: "NO_TARGET",
      label: "No Target Configured",
      badgeVariant: "neutral",
      isOverdue: false,
      description: "No SLA target configured for this case.",
    };
  }

  const deadline = new Date(grievance.deadlineAt).getTime();
  const now = Date.now();
  const diffMs = deadline - now;

  if (diffMs < 0 || grievance.status === "SLA_BREACHED") {
    const overdueHours = Math.max(1, Math.round(Math.abs(diffMs) / (1000 * 3600)));
    const overdueDays = Math.floor(overdueHours / 24);
    return {
      state: "OVERDUE",
      label: overdueDays > 0 ? `Overdue by ${overdueDays}d` : `Overdue by ${overdueHours}h`,
      badgeVariant: "error",
      isOverdue: true,
      hoursOverdue: overdueHours,
      daysOverdue: overdueDays,
      description: "Advisory SLA inspection window has passed. Queued for escalation review.",
    };
  }

  const hoursRemaining = Math.round(diffMs / (1000 * 3600));
  const daysRemaining = Math.floor(hoursRemaining / 24);

  if (hoursRemaining <= 24) {
    return {
      state: "DUE_TODAY",
      label: hoursRemaining <= 1 ? "Due within an hour" : `Due in ${hoursRemaining}h`,
      badgeVariant: "warning",
      isOverdue: false,
      hoursRemaining,
      description: "Approaching immediate resolution deadline today.",
    };
  }

  if (hoursRemaining <= 72) {
    return {
      state: "APPROACHING",
      label: `${daysRemaining} days remaining`,
      badgeVariant: "warning",
      isOverdue: false,
      hoursRemaining,
      daysRemaining,
      description: "Approaching advisory resolution target deadline.",
    };
  }

  return {
    state: "WITHIN_TARGET",
    label: `${daysRemaining} days remaining`,
    badgeVariant: "success",
    isOverdue: false,
    hoursRemaining,
    daysRemaining,
    description: "Within standard municipal application service timeline.",
  };
}
