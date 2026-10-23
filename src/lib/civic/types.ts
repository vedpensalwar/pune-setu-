export type Role = "CITIZEN" | "MUNICIPAL_OFFICER" | "ADMIN";
export type AccountStatus = "ACTIVE" | "SUSPENDED" | "DEACTIVATED";

export type GrievanceCategory =
  | "ROADS_POTHOLES"
  | "SOLID_WASTE"
  | "WATER_SUPPLY"
  | "STREET_LIGHTING"
  | "SEWAGE_DRAINAGE"
  | "TRAFFIC_TRANSPORT"
  | "ENCROACHMENT"
  | "GARDENS_PARKS"
  | "HEALTH_SANITATION"
  | "OTHER";

export type GrievancePriority = "LOW" | "MEDIUM" | "HIGH" | "EMERGENCY";

export type GrievanceStatus =
  | "SUBMITTED"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "REJECTED"
  | "ESCALATED"
  | "SLA_BREACHED"
  | "REOPENED";

export type EvidenceType = "PHOTO" | "DOCUMENT" | "VIDEO";

export type EscalationType =
  | "SLA_TIME_EXCEEDED"
  | "MANUAL_CITIZEN_ESCALATION"
  | "OFFICER_REASSIGNMENT"
  | "COMMISSIONER_DIRECTIVE";

export type NotificationType =
  | "STATUS_CHANGE"
  | "ASSIGNED"
  | "COMMENT_ADDED"
  | "ESCALATED"
  | "RESOLUTION_VERIFIED";

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Ward {
  id: string;
  name: string;
  wardNumber: number;
  zone: string;
  officeAddress?: string | null;
  contactPhone?: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GrievanceEvidence {
  id: string;
  grievanceId: string;
  evidenceType: EvidenceType;
  storageKey: string;
  originalFilename?: string | null;
  mimeType: string;
  sizeBytes: number;
  caption?: string | null;
  uploadedById: string;
  uploadedAt: string;
}

export interface GrievanceStatusHistory {
  id: string;
  grievanceId: string;
  previousStatus: GrievanceStatus;
  newStatus: GrievanceStatus;
  changeReason?: string | null;
  notes?: string | null;
  changedById?: string | null;
  changedByName?: string | null;
  createdAt: string;
}

export interface Comment {
  id: string;
  grievanceId: string;
  authorId: string;
  authorName: string;
  authorRole: Role;
  content: string;
  isInternal: boolean;
  isModerated?: boolean;
  moderationReason?: string | null;
  moderatedAt?: string | null;
  moderatedById?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Endorsement {
  id: string;
  grievanceId: string;
  userId: string;
  createdAt: string;
}

export interface GrievanceFollower {
  id: string;
  grievanceId: string;
  userId: string;
  createdAt: string;
}

export interface SatisfactionFeedback {
  id: string;
  grievanceId: string;
  citizenId: string;
  rating: number;
  feedbackText?: string | null;
  submittedAt: string;
  updatedAt: string;
}

export interface Grievance {
  id: string;
  trackingToken: string; // PS-PUN-YYYY-XXXXXX
  title: string;
  description: string;
  category: GrievanceCategory;
  priority: GrievancePriority;
  status: GrievanceStatus;
  latitude?: number | null;
  longitude?: number | null;
  landmark?: string | null;
  locationDescription?: string | null;
  citizenId: string;
  citizenName?: string;
  departmentId?: string | null;
  departmentName?: string;
  wardId?: string | null;
  wardName?: string;
  wardNumber?: number;
  assignedOfficerId?: string | null;
  assignedOfficerName?: string;
  submittedAt: string;
  deadlineAt?: string | null;
  resolvedAt?: string | null;
  resolutionNotes?: string | null;
  createdAt: string;
  updatedAt: string;

  // Computed count aggregations
  endorsementsCount?: number;
  commentsCount?: number;
  followersCount?: number;

  // SLA & Overdue state preservation
  isOverdue?: boolean;
  breachedAt?: string | null;
  underlyingStatus?: GrievanceStatus | null;
}

export interface EscalationRecord {
  id: string;
  grievanceId: string;
  escalationType: EscalationType;
  reason: string;
  status: "PENDING" | "REVIEWED" | "RESOLVED";
  escalatedById?: string | null;
  escalatedByName?: string | null;
  triggeredAt: string;
  resolvedAt?: string | null;
  reviewRemarks?: string | null;
  reviewedById?: string | null;
  reviewedByName?: string | null;
}

export interface Notification {
  id: string;
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  grievanceId?: string | null;
  trackingToken?: string | null;
  actionUrl?: string | null;
  titleKey?: string | null;
  messageKey?: string | null;
  metadata?: string | null;
  read: boolean;
  createdAt: string;
  readAt?: string | null;
}

export interface AuditLog {
  id: string;
  actorId?: string | null;
  actorName?: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  metadata?: string | null;
  createdAt: string;
}

/**
 * Publicly sanitized view of a grievance for general citizen browsing / tracking.
 * Masks exact sensitive coordinates and citizen personal details for privacy.
 */
export interface PublicGrievance {
  id?: string;
  trackingToken: string;
  title: string;
  description: string;
  category: GrievanceCategory;
  priority: GrievancePriority;
  status: GrievanceStatus;
  landmark?: string | null;
  departmentName?: string;
  wardName?: string;
  wardNumber?: number;
  submittedAt: string;
  deadlineAt?: string | null;
  resolvedAt?: string | null;
  resolutionNotes?: string | null;
  endorsementsCount: number;
  commentsCount: number;
  evidence?: GrievanceEvidence[];
  resolutionEvidence?: GrievanceEvidence[];
  escalations?: EscalationRecord[];
  statusHistory: Array<{
    previousStatus: GrievanceStatus;
    newStatus: GrievanceStatus;
    createdAt: string;
    notes?: string | null;
    changedByName?: string | null;
  }>;
}

export type { SLAStatusInfo, SLALabelState } from "./status-policy";

