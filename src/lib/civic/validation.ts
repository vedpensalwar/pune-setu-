import { z } from "zod";

export const PUNE_BOUNDS = {
  MIN_LAT: 18.25,
  MAX_LAT: 18.75,
  MIN_LNG: 73.65,
  MAX_LNG: 74.15,
};

export const evidenceItemSchema = z.object({
  evidenceType: z.enum(["PHOTO", "DOCUMENT", "VIDEO"]).default("PHOTO"),
  storageKey: z.string().min(1, "Storage key is required."),
  originalFilename: z.string().max(255).optional().nullable(),
  mimeType: z.string().min(1, "MIME type is required."),
  sizeBytes: z
    .number()
    .int()
    .positive("Size must be positive.")
    .max(10 * 1024 * 1024, "Evidence file cannot exceed 10MB limit."),
  caption: z.string().max(200).optional().nullable(),
});

export const createGrievanceSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, "Title must be at least 5 characters long.")
    .max(150, "Title cannot exceed 150 characters."),
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters long.")
    .max(2000, "Description cannot exceed 2000 characters."),
  category: z.enum([
    "ROADS_POTHOLES",
    "SOLID_WASTE",
    "WATER_SUPPLY",
    "STREET_LIGHTING",
    "SEWAGE_DRAINAGE",
    "TRAFFIC_TRANSPORT",
    "ENCROACHMENT",
    "GARDENS_PARKS",
    "HEALTH_SANITATION",
    "OTHER",
  ]),
  priority: z
    .enum(["LOW", "MEDIUM", "HIGH", "EMERGENCY"])
    .optional()
    .default("MEDIUM"),
  latitude: z
    .number()
    .refine(
      (val) => val >= PUNE_BOUNDS.MIN_LAT && val <= PUNE_BOUNDS.MAX_LAT,
      `Latitude must be within the Pune municipal boundary (${PUNE_BOUNDS.MIN_LAT} to ${PUNE_BOUNDS.MAX_LAT}).`
    )
    .optional()
    .nullable(),
  longitude: z
    .number()
    .refine(
      (val) => val >= PUNE_BOUNDS.MIN_LNG && val <= PUNE_BOUNDS.MAX_LNG,
      `Longitude must be within the Pune municipal boundary (${PUNE_BOUNDS.MIN_LNG} to ${PUNE_BOUNDS.MAX_LNG}).`
    )
    .optional()
    .nullable(),
  landmark: z.string().trim().max(100, "Landmark cannot exceed 100 characters.").optional().nullable(),
  locationDescription: z
    .string()
    .trim()
    .max(255, "Location description cannot exceed 255 characters.")
    .optional()
    .nullable(),
  wardId: z.string().optional().nullable(),
  departmentId: z.string().optional().nullable(),
  evidence: z.array(evidenceItemSchema).max(5, "Maximum 5 evidence files allowed.").optional().default([]),
});

export type CreateGrievanceInput = z.infer<typeof createGrievanceSchema>;

export const duplicateCheckSchema = z.object({
  latitude: z
    .number()
    .refine(
      (val) => val >= PUNE_BOUNDS.MIN_LAT && val <= PUNE_BOUNDS.MAX_LAT,
      `Latitude must be within the Pune municipal boundary (${PUNE_BOUNDS.MIN_LAT} to ${PUNE_BOUNDS.MAX_LAT}).`
    ),
  longitude: z
    .number()
    .refine(
      (val) => val >= PUNE_BOUNDS.MIN_LNG && val <= PUNE_BOUNDS.MAX_LNG,
      `Longitude must be within the Pune municipal boundary (${PUNE_BOUNDS.MIN_LNG} to ${PUNE_BOUNDS.MAX_LNG}).`
    ),
  category: z.enum([
    "ROADS_POTHOLES",
    "SOLID_WASTE",
    "WATER_SUPPLY",
    "STREET_LIGHTING",
    "SEWAGE_DRAINAGE",
    "TRAFFIC_TRANSPORT",
    "ENCROACHMENT",
    "GARDENS_PARKS",
    "HEALTH_SANITATION",
    "OTHER",
  ]),
  radiusMeters: z.number().positive().max(2000).optional().default(500),
});

export type DuplicateCheckInput = z.infer<typeof duplicateCheckSchema>;

export const updateStatusSchema = z.object({
  newStatus: z.enum([
    "SUBMITTED",
    "ASSIGNED",
    "IN_PROGRESS",
    "RESOLVED",
    "REJECTED",
    "ESCALATED",
    "SLA_BREACHED",
    "REOPENED",
  ]),
  changeReason: z.string().trim().max(255).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
  assignedOfficerId: z.string().optional().nullable(),
  rejectionReason: z.string().trim().max(500).optional().nullable(),
  resolutionEvidence: z.array(evidenceItemSchema).optional().default([]),
});

export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;

export const escalationRequestSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(10, "Escalation reason must be at least 10 characters long.")
    .max(500, "Escalation reason cannot exceed 500 characters."),
  details: z
    .string()
    .trim()
    .max(1000, "Additional details cannot exceed 1000 characters.")
    .optional()
    .nullable(),
});

export type EscalationRequestInput = z.infer<typeof escalationRequestSchema>;

export const overdueProcessingSchema = z.object({
  limit: z.number().int().positive().max(500).optional().default(50),
  dryRun: z.boolean().optional().default(false),
});

export type OverdueProcessingInput = z.infer<typeof overdueProcessingSchema>;

export const addCommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Comment content cannot be empty.")
    .max(1000, "Comment cannot exceed 1000 characters."),
  isInternal: z.boolean().optional().default(false),
});

export type AddCommentInput = z.infer<typeof addCommentSchema>;

export const feedbackSchema = z.object({
  rating: z
    .number()
    .int("Rating must be an integer.")
    .min(1, "Rating must be at least 1.")
    .max(5, "Rating cannot exceed 5."),
  feedbackText: z
    .string()
    .trim()
    .max(500, "Feedback text cannot exceed 500 characters.")
    .optional()
    .nullable(),
});

export type FeedbackInput = z.infer<typeof feedbackSchema>;

export const evidenceMetadataSchema = z.object({
  evidenceType: z.enum(["PHOTO", "DOCUMENT", "VIDEO"]).default("PHOTO"),
  storageKey: z.string().min(1, "Storage key is required."),
  originalFilename: z.string().max(255).optional().nullable(),
  mimeType: z.string().min(1, "MIME type is required."),
  sizeBytes: z
    .number()
    .int()
    .positive("Size must be positive.")
    .max(15 * 1024 * 1024, "Evidence file cannot exceed 15MB limit."),
  caption: z.string().max(200).optional().nullable(),
});

export type EvidenceMetadataInput = z.infer<typeof evidenceMetadataSchema>;

export const listGrievancesQuerySchema = z.object({
  status: z
    .enum([
      "SUBMITTED",
      "ASSIGNED",
      "IN_PROGRESS",
      "RESOLVED",
      "REJECTED",
      "ESCALATED",
      "SLA_BREACHED",
      "REOPENED",
    ])
    .optional(),
  category: z
    .enum([
      "ROADS_POTHOLES",
      "SOLID_WASTE",
      "WATER_SUPPLY",
      "STREET_LIGHTING",
      "SEWAGE_DRAINAGE",
      "TRAFFIC_TRANSPORT",
      "ENCROACHMENT",
      "GARDENS_PARKS",
      "HEALTH_SANITATION",
      "OTHER",
    ])
    .optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "EMERGENCY"]).optional(),
  departmentId: z.string().optional(),
  wardId: z.string().optional(),
  citizenOnly: z.enum(["true", "false"]).optional(),
  followedOnly: z.enum(["true", "false"]).optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type ListGrievancesQuery = z.infer<typeof listGrievancesQuerySchema>;
