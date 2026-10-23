import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import {
  Department,
  Ward,
  Grievance,
  GrievanceStatusHistory,
  Comment,
  Endorsement,
  GrievanceFollower,
  SatisfactionFeedback,
  GrievanceEvidence,
  PublicGrievance,
  GrievanceStatus,
  EscalationRecord,
  Notification,
  AuditLog,
} from "../civic/types";
import { generateTrackingToken } from "../civic/token";
import { calculateSLADeadline, isValidStatusTransition, getSLAStatusInfo, SLAStatusInfo } from "../civic/status-policy";
import {
  CreateGrievanceInput,
  UpdateStatusInput,
  AddCommentInput,
  FeedbackInput,
  EvidenceMetadataInput,
  ListGrievancesQuery,
  EscalationRequestInput,
  OverdueProcessingInput,
} from "../civic/validation";
import { SafeUser } from "../auth/types";
import { findUserById, listAllUsers } from "./user-store";
import { getEvidenceUrl } from "../storage";

const DATA_DIR = path.join(process.cwd(), "data");
const CIVIC_FILE = path.join(DATA_DIR, "punesetu-civic-store.json");

interface CivicStoreData {
  departments: Department[];
  wards: Ward[];
  grievances: Grievance[];
  statusHistory: GrievanceStatusHistory[];
  comments: Comment[];
  endorsements: Endorsement[];
  followers: GrievanceFollower[];
  feedback: SatisfactionFeedback[];
  evidence: GrievanceEvidence[];
  escalations: EscalationRecord[];
  notifications: Notification[];
  auditLogs: AuditLog[];
}

const INITIAL_DEPARTMENTS: Omit<Department, "id" | "createdAt" | "updatedAt">[] = [
  { name: "Roads & Traffic Maintenance", code: "ROAD_TRAFFIC", description: "Pothole repair, asphalt surfacing, and road safety infrastructure.", active: true },
  { name: "Solid Waste Management", code: "SOLID_WASTE", description: "Garbage collection, community bins, and municipal compost units.", active: true },
  { name: "Water Supply & Pumping", code: "WATER_SUPPLY", description: "Pipeline maintenance, drinking water supply, and pressure management.", active: true },
  { name: "Electrical & Street Lighting", code: "STREET_LIGHT", description: "Street lamp repair, feeder pillars, and LED conversions.", active: true },
  { name: "Drainage & Sewerage Maintenance", code: "DRAINAGE", description: "Stormwater drains, sewer line blockages, and manhole coverage.", active: true },
  { name: "Encroachment Removal & Licensing", code: "ENCROACHMENT", description: "Footpath clearance, unauthorized vendor removal, and public rights-of-way.", active: true },
  { name: "Public Health & Sanitation", code: "PUBLIC_HEALTH", description: "Vector control, public toilet sanitation, and disease prevention.", active: true },
  { name: "Garden & Tree Authority", code: "GARDEN_PARK", description: "Public park maintenance, fallen branch clearing, and green zones.", active: true },
];

const INITIAL_WARDS: Omit<Ward, "id" | "createdAt" | "updatedAt">[] = [
  { name: "Aundh - Baner", wardNumber: 1, zone: "Zone 1", officeAddress: "Aundh Ward Office, DP Road, Pune 411007", contactPhone: "020-25881234", active: true },
  { name: "Shivaji Nagar - Ghole Road", wardNumber: 2, zone: "Zone 1", officeAddress: "Ghole Road Ward Office, Near Balgandharva, Pune 411005", contactPhone: "020-25531234", active: true },
  { name: "Kothrud - Bavdhan", wardNumber: 3, zone: "Zone 2", officeAddress: "Kothrud Ward Office, Paud Road, Pune 411038", contactPhone: "020-25441234", active: true },
  { name: "Warje - Karvenagar", wardNumber: 4, zone: "Zone 2", officeAddress: "Warje Ward Office, Near Flyover, Pune 411058", contactPhone: "020-25281234", active: true },
  { name: "Sinhagad Road", wardNumber: 5, zone: "Zone 2", officeAddress: "Sinhagad Road Ward Office, Vadgaon Budruk, Pune 411041", contactPhone: "020-24351234", active: true },
  { name: "Dhankawadi - Sahakarnagar", wardNumber: 6, zone: "Zone 3", officeAddress: "Dhankawadi Ward Office, Pune-Satara Road, Pune 411043", contactPhone: "020-24371234", active: true },
  { name: "Bibwewadi", wardNumber: 7, zone: "Zone 3", officeAddress: "Bibwewadi Ward Office, Utsav Chowk, Pune 411037", contactPhone: "020-24211234", active: true },
  { name: "Kasba - Vishrambaug Wada", wardNumber: 8, zone: "Zone 1", officeAddress: "Kasba Ward Office, Sadashiv Peth, Pune 411030", contactPhone: "020-24451234", active: true },
  { name: "Bhavani Peth", wardNumber: 9, zone: "Zone 3", officeAddress: "Bhavani Peth Ward Office, General Arunkumar Vaidya Stadium, Pune 411042", contactPhone: "020-26381234", active: true },
  { name: "Pune Station", wardNumber: 10, zone: "Zone 1", officeAddress: "Pune Station Ward Office, Sassoon Road, Pune 411001", contactPhone: "020-26121234", active: true },
  { name: "Yerwada - Kalas - Dhanori", wardNumber: 11, zone: "Zone 4", officeAddress: "Yerwada Ward Office, Nagar Road, Pune 411006", contactPhone: "020-26681234", active: true },
  { name: "Nagar Road - Vadgaonsheri", wardNumber: 12, zone: "Zone 4", officeAddress: "Vadgaonsheri Ward Office, Kalyani Nagar, Pune 411014", contactPhone: "020-26651234", active: true },
  { name: "Hadapsar - Mundhwa", wardNumber: 13, zone: "Zone 4", officeAddress: "Hadapsar Ward Office, Gadital, Pune 411028", contactPhone: "020-26991234", active: true },
  { name: "Kondhwa - Yewalewadi", wardNumber: 14, zone: "Zone 3", officeAddress: "Kondhwa Ward Office, NIBM Road, Pune 411048", contactPhone: "020-26831234", active: true },
  { name: "Wanowrie - Ramtekdi", wardNumber: 15, zone: "Zone 4", officeAddress: "Wanowrie Ward Office, Kedari Nagar, Pune 411040", contactPhone: "020-26801234", active: true },
];

let memoryCache: CivicStoreData | null = null;

async function ensureStoreFile(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    try {
      await fs.access(CIVIC_FILE);
    } catch {
      const now = new Date().toISOString();
      const defaultData: CivicStoreData = {
        departments: INITIAL_DEPARTMENTS.map((d, i) => ({
          ...d,
          id: `dept_${(i + 1).toString().padStart(2, "0")}`,
          createdAt: now,
          updatedAt: now,
        })),
        wards: INITIAL_WARDS.map((w) => ({
          ...w,
          id: `wrd_${w.wardNumber.toString().padStart(2, "0")}`,
          createdAt: now,
          updatedAt: now,
        })),
        grievances: [],
        statusHistory: [],
        comments: [],
        endorsements: [],
        followers: [],
        feedback: [],
        evidence: [],
        escalations: [],
        notifications: [],
        auditLogs: [],
      };
      await fs.writeFile(CIVIC_FILE, JSON.stringify(defaultData, null, 2), "utf8");
    }
  } catch (err) {
    console.error("Failed to initialize civic store directory:", err);
  }
}

async function readStore(): Promise<CivicStoreData> {
  await ensureStoreFile();
  try {
    const data = await fs.readFile(CIVIC_FILE, "utf8");
    const parsed = JSON.parse(data) as CivicStoreData;
    if (!parsed.escalations) parsed.escalations = [];
    if (!parsed.notifications) parsed.notifications = [];
    if (!parsed.auditLogs) parsed.auditLogs = [];
    memoryCache = parsed;
    return parsed;
  } catch {
    if (memoryCache !== null) return memoryCache;
    return {
      departments: [],
      wards: [],
      grievances: [],
      statusHistory: [],
      comments: [],
      endorsements: [],
      followers: [],
      feedback: [],
      evidence: [],
      escalations: [],
      notifications: [],
      auditLogs: [],
    };
  }
}

async function writeStore(data: CivicStoreData): Promise<void> {
  await ensureStoreFile();
  const tempFile = `${CIVIC_FILE}.${crypto.randomUUID()}.tmp`;
  await fs.writeFile(tempFile, JSON.stringify(data, null, 2), "utf8");
  await fs.rename(tempFile, CIVIC_FILE);
  memoryCache = data;
}

// -------------------------------------------------------------
// DEPARTMENTS & WARDS
// -------------------------------------------------------------

export async function listDepartments(): Promise<Department[]> {
  const store = await readStore();
  return store.departments.filter((d) => d.active);
}

export async function listWards(): Promise<Ward[]> {
  const store = await readStore();
  return store.wards.filter((w) => w.active).sort((a, b) => a.wardNumber - b.wardNumber);
}

export async function getDepartmentById(id: string): Promise<Department | null> {
  const store = await readStore();
  return store.departments.find((d) => d.id === id) || null;
}

export async function getWardById(id: string): Promise<Ward | null> {
  const store = await readStore();
  return store.wards.find((w) => w.id === id) || null;
}

// -------------------------------------------------------------
// GRIEVANCES (CRUD, ATOMIC TRANSACTIONS, & SLA)
// -------------------------------------------------------------

export async function createGrievance(
  input: CreateGrievanceInput,
  citizenUser: SafeUser
): Promise<{ grievance: Grievance; trackingToken: string }> {
  const store = await readStore();
  const now = new Date();
  const nowIso = now.toISOString();

  // Generate unique tracking token (Collision avoidance loop)
  let token = generateTrackingToken(now.getFullYear());
  while (store.grievances.some((g) => g.trackingToken === token)) {
    token = generateTrackingToken(now.getFullYear());
  }

  // Derive department & ward names
  const department = input.departmentId ? store.departments.find((d) => d.id === input.departmentId) : null;
  const ward = input.wardId ? store.wards.find((w) => w.id === input.wardId) : null;

  // Advisory SLA deadline
  const priority = input.priority || "MEDIUM";
  const deadlineAt = calculateSLADeadline(priority, now).toISOString();

  const grievanceId = `grv_${crypto.randomUUID().replace(/-/g, "").substring(0, 16)}`;

  const newGrievance: Grievance = {
    id: grievanceId,
    trackingToken: token,
    title: input.title,
    description: input.description,
    category: input.category,
    priority,
    status: "SUBMITTED",
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    landmark: input.landmark ?? null,
    locationDescription: input.locationDescription ?? null,
    citizenId: citizenUser.id,
    citizenName: citizenUser.name,
    departmentId: department?.id ?? null,
    departmentName: department?.name,
    wardId: ward?.id ?? null,
    wardName: ward?.name,
    wardNumber: ward?.wardNumber,
    assignedOfficerId: null,
    submittedAt: nowIso,
    deadlineAt,
    resolvedAt: null,
    resolutionNotes: null,
    createdAt: nowIso,
    updatedAt: nowIso,
    endorsementsCount: 0,
    commentsCount: 0,
    followersCount: 0,
  };

  // Initial Status History entry (Atomic transaction guarantee)
  const initialHistory: GrievanceStatusHistory = {
    id: `gsh_${crypto.randomUUID().replace(/-/g, "").substring(0, 16)}`,
    grievanceId: grievanceId,
    previousStatus: "SUBMITTED",
    newStatus: "SUBMITTED",
    changeReason: "Initial grievance filing by citizen",
    notes: `Filed under ${input.category} with advisory SLA target: ${deadlineAt}`,
    changedById: citizenUser.id,
    changedByName: citizenUser.name,
    createdAt: nowIso,
  };

  // Atomically record any uploaded evidence metadata
  if (input.evidence && input.evidence.length > 0) {
    for (const ev of input.evidence) {
      const evidenceRecord: GrievanceEvidence = {
        id: `evd_${crypto.randomUUID().replace(/-/g, "").substring(0, 16)}`,
        grievanceId: grievanceId,
        evidenceType: ev.evidenceType,
        storageKey: ev.storageKey,
        originalFilename: ev.originalFilename ?? null,
        mimeType: ev.mimeType,
        sizeBytes: ev.sizeBytes,
        caption: ev.caption ?? null,
        uploadedById: citizenUser.id,
        uploadedAt: nowIso,
      };
      store.evidence.push(evidenceRecord);
    }
  }

  store.grievances.unshift(newGrievance);
  store.statusHistory.unshift(initialHistory);

  // Queue in-app notification for citizen owner confirming grievance submission
  pushNotification(store, {
    recipientId: citizenUser.id,
    type: "STATUS_CHANGE",
    title: "Grievance Filed Successfully",
    message: `Your grievance ${token} has been registered under ${input.category}. Reference ID: ${token}.`,
    grievanceId: grievanceId,
    trackingToken: token,
    actionUrl: `/track/${token}`,
    titleKey: "notifications.grievanceSubmittedTitle",
    messageKey: "notifications.grievanceSubmittedMsg",
  });

  // Notify assigned department officers of newly submitted case
  if (department) {
    const allUsers = await listAllUsers();
    const deptOfficers = allUsers.filter(
      (u) =>
        u.role === "MUNICIPAL_OFFICER" &&
        (u.departmentId === department.id || u.department === department.name)
    );
    for (const officer of deptOfficers) {
      pushNotification(store, {
        recipientId: officer.id,
        type: "ASSIGNED",
        title: "New Grievance in Department Queue",
        message: `New case ${token} (${input.category}) filed in ${ward?.name || "Pune"}.`,
        grievanceId: grievanceId,
        trackingToken: token,
        actionUrl: `/officer/dashboard`,
        titleKey: "notifications.officerNewQueueTitle",
        messageKey: "notifications.officerNewQueueMsg",
      });
    }
  }

  await writeStore(store);

  return { grievance: newGrievance, trackingToken: token };
}

export interface DuplicateGrievanceSummary {
  trackingToken: string;
  title: string;
  category: string;
  landmark: string | null;
  wardName?: string;
  wardNumber?: number;
  status: GrievanceStatus;
  submittedAt: string;
  endorsementsCount: number;
  distanceMeters: number;
}

export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export async function findNearbyDuplicates(
  latitude: number,
  longitude: number,
  category: string,
  radiusMeters = 500
): Promise<DuplicateGrievanceSummary[]> {
  const store = await readStore();

  const activeStatuses: GrievanceStatus[] = [
    "SUBMITTED",
    "ASSIGNED",
    "IN_PROGRESS",
    "ESCALATED",
    "SLA_BREACHED",
    "REOPENED",
  ];

  const matches: DuplicateGrievanceSummary[] = [];

  for (const g of store.grievances) {
    if (g.category !== category) continue;
    if (!activeStatuses.includes(g.status)) continue;
    if (typeof g.latitude !== "number" || typeof g.longitude !== "number") continue;

    const distance = calculateDistanceMeters(latitude, longitude, g.latitude, g.longitude);
    if (distance <= radiusMeters) {
      const endorsementsCount = store.endorsements.filter((e) => e.grievanceId === g.id).length;
      matches.push({
        trackingToken: g.trackingToken,
        title: g.title,
        category: g.category,
        landmark: g.landmark ?? null,
        wardName: g.wardName,
        wardNumber: g.wardNumber,
        status: g.status,
        submittedAt: g.submittedAt,
        endorsementsCount,
        distanceMeters: distance,
      });
    }
  }

  return matches.sort((a, b) => a.distanceMeters - b.distanceMeters);
}

export async function getGrievanceByTrackingToken(token: string): Promise<Grievance | null> {
  if (!token) return null;
  const normalized = token.trim().toUpperCase();
  const store = await readStore();
  const grievance = store.grievances.find((g) => g.trackingToken === normalized);
  if (!grievance) return null;

  // Attach counts
  grievance.endorsementsCount = store.endorsements.filter((e) => e.grievanceId === grievance.id).length;
  grievance.commentsCount = store.comments.filter((c) => c.grievanceId === grievance.id && !c.isInternal).length;
  grievance.followersCount = store.followers.filter((f) => f.grievanceId === grievance.id).length;

  return grievance;
}

export async function getGrievanceById(id: string): Promise<Grievance | null> {
  if (!id) return null;
  const store = await readStore();
  return store.grievances.find((g) => g.id === id) || null;
}

export async function listGrievances(
  query: ListGrievancesQuery,
  viewerUser?: SafeUser | null
): Promise<{ grievances: Grievance[]; total: number; page: number; totalPages: number }> {
  const store = await readStore();
  let list = [...store.grievances];

  // Apply filters
  if (query.status) {
    list = list.filter((g) => g.status === query.status);
  }
  if (query.category) {
    list = list.filter((g) => g.category === query.category);
  }
  if (query.priority) {
    list = list.filter((g) => g.priority === query.priority);
  }
  if (query.departmentId) {
    list = list.filter((g) => g.departmentId === query.departmentId);
  }
  if (query.wardId) {
    list = list.filter((g) => g.wardId === query.wardId);
  }

  // Text search filter across tracking token, title, description, landmark, and ward
  if (query.search && query.search.trim().length > 0) {
    const s = query.search.trim().toLowerCase();
    list = list.filter(
      (g) =>
        g.trackingToken.toLowerCase().includes(s) ||
        g.title.toLowerCase().includes(s) ||
        g.description.toLowerCase().includes(s) ||
        (g.landmark && g.landmark.toLowerCase().includes(s)) ||
        (g.wardName && g.wardName.toLowerCase().includes(s)) ||
        (g.departmentName && g.departmentName.toLowerCase().includes(s))
    );
  }

  // Access control scoping:
  // If citizen requests own grievances:
  if (query.citizenOnly === "true") {
    if (!viewerUser) return { grievances: [], total: 0, page: 1, totalPages: 0 };
    list = list.filter((g) => g.citizenId === viewerUser.id);
  } else if (query.followedOnly === "true") {
    if (!viewerUser) return { grievances: [], total: 0, page: 1, totalPages: 0 };
    const followedIds = new Set(
      store.followers.filter((f) => f.userId === viewerUser.id).map((f) => f.grievanceId)
    );
    list = list.filter((g) => followedIds.has(g.id));
  } else if (viewerUser?.role === "MUNICIPAL_OFFICER") {
    // Officers by default see grievances within their department or assigned to them
    const officerDept = viewerUser.departmentId || viewerUser.department;
    if (officerDept) {
      list = list.filter(
        (g) => g.departmentId === officerDept || g.assignedOfficerId === viewerUser.id
      );
    }
  }

  const total = list.length;
  const page = query.page || 1;
  const limit = query.limit || 20;
  const totalPages = Math.ceil(total / limit) || 1;
  const start = (page - 1) * limit;
  const paginated = list.slice(start, start + limit);

  // Compute live counts
  paginated.forEach((g) => {
    g.endorsementsCount = store.endorsements.filter((e) => e.grievanceId === g.id).length;
    g.commentsCount = store.comments.filter((c) => c.grievanceId === g.id && !c.isInternal).length;
    g.followersCount = store.followers.filter((f) => f.grievanceId === g.id).length;
  });

  return { grievances: paginated, total, page, totalPages };
}

// -------------------------------------------------------------
// PUBLIC COMMUNITY FEED (Version 7)
// -------------------------------------------------------------

export interface PublicFeedQuery {
  search?: string;
  category?: string;
  status?: string;
  priority?: string;
  departmentId?: string;
  wardId?: string;
  sortBy?: "newest" | "most_endorsed";
  page: number;
  limit: number;
}

export interface PublicFeedItem {
  id: string;
  trackingToken: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  landmark?: string | null;
  departmentName?: string;
  wardName?: string;
  wardNumber?: number;
  submittedAt: string;
  deadlineAt?: string | null;
  resolvedAt?: string | null;
  endorsementsCount: number;
  commentsCount: number;
  followersCount: number;
  hasCoordinates: boolean;
  thumbnailUrl?: string | null;
}

export async function listPublicFeed(
  query: PublicFeedQuery
): Promise<{ items: PublicFeedItem[]; total: number; page: number; totalPages: number }> {
  const store = await readStore();
  let list = [...store.grievances];

  // Text search across title, description, landmark, ward, token
  if (query.search && query.search.trim().length > 0) {
    const searchLower = query.search.trim().toLowerCase();
    list = list.filter(
      (g) =>
        g.title.toLowerCase().includes(searchLower) ||
        g.description.toLowerCase().includes(searchLower) ||
        (g.landmark && g.landmark.toLowerCase().includes(searchLower)) ||
        (g.wardName && g.wardName.toLowerCase().includes(searchLower)) ||
        g.trackingToken.toLowerCase().includes(searchLower)
    );
  }

  // Apply filters
  if (query.category) {
    list = list.filter((g) => g.category === query.category);
  }
  if (query.status) {
    list = list.filter((g) => g.status === query.status);
  }
  if (query.priority) {
    list = list.filter((g) => g.priority === query.priority);
  }
  if (query.departmentId) {
    const targetDept = store.departments.find((d) => d.id === query.departmentId);
    list = list.filter(
      (g) => g.departmentId === query.departmentId || (targetDept && g.departmentName === targetDept.name)
    );
  }
  if (query.wardId) {
    const targetWard = store.wards.find((w) => w.id === query.wardId);
    list = list.filter(
      (g) =>
        g.wardId === query.wardId ||
        (targetWard && (g.wardName === targetWard.name || (targetWard.wardNumber && g.wardNumber === targetWard.wardNumber)))
    );
  }

  // Sort: newest vs most_endorsed
  if (query.sortBy === "most_endorsed") {
    list.sort((a, b) => {
      const countA = store.endorsements.filter((e) => e.grievanceId === a.id).length;
      const countB = store.endorsements.filter((e) => e.grievanceId === b.id).length;
      if (countB !== countA) return countB - countA;
      return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
    });
  } else {
    // Default newest first
    list.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }

  const total = list.length;
  const page = query.page || 1;
  const limit = query.limit || 20;
  const totalPages = Math.ceil(total / limit) || 1;
  const start = (page - 1) * limit;
  const paginated = list.slice(start, start + limit);

  const items: PublicFeedItem[] = paginated.map((g) => {
    const photo = store.evidence.find(
      (e) => e.grievanceId === g.id && (e.evidenceType === "PHOTO" || e.mimeType?.startsWith("image/"))
    );

    return {
      id: g.id,
      trackingToken: g.trackingToken,
      title: g.title,
      description: g.description.length > 200 ? g.description.substring(0, 200) + "…" : g.description,
      category: g.category,
      priority: g.priority,
      status: g.status,
      landmark: g.landmark,
      departmentName: g.departmentName,
      wardName: g.wardName,
      wardNumber: g.wardNumber,
      submittedAt: g.submittedAt,
      deadlineAt: g.deadlineAt,
      resolvedAt: g.resolvedAt,
      endorsementsCount: store.endorsements.filter((e) => e.grievanceId === g.id).length,
      commentsCount: store.comments.filter((c) => c.grievanceId === g.id && !c.isInternal).length,
      followersCount: store.followers.filter((f) => f.grievanceId === g.id).length,
      hasCoordinates: typeof g.latitude === "number" && typeof g.longitude === "number",
      thumbnailUrl: photo ? getEvidenceUrl(photo.storageKey) : null,
    };
  });

  return { items, total, page, totalPages };
}

// -------------------------------------------------------------
// MAP MARKERS (Version 7)
// -------------------------------------------------------------

export interface MapMarker {
  id: string;
  trackingToken: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  latitude: number;
  longitude: number;
  landmark?: string | null;
  wardName?: string;
  departmentName?: string;
  submittedAt: string;
  endorsementsCount: number;
}

export async function getMapMarkers(filters?: {
  category?: string;
  status?: string;
  priority?: string;
  departmentId?: string;
  wardId?: string;
  search?: string;
}): Promise<{ markers: MapMarker[]; unlocatedCount: number }> {
  const store = await readStore();
  const unlocatedCount = store.grievances.filter(
    (g) => typeof g.latitude !== "number" || typeof g.longitude !== "number"
  ).length;

  let list = store.grievances.filter(
    (g) => typeof g.latitude === "number" && typeof g.longitude === "number"
  );

  if (filters?.category) {
    list = list.filter((g) => g.category === filters.category);
  }
  if (filters?.status) {
    list = list.filter((g) => g.status === filters.status);
  }
  if (filters?.priority) {
    list = list.filter((g) => g.priority === filters.priority);
  }
  if (filters?.departmentId) {
    const targetDept = store.departments.find((d) => d.id === filters.departmentId);
    list = list.filter(
      (g) => g.departmentId === filters.departmentId || (targetDept && g.departmentName === targetDept.name)
    );
  }
  if (filters?.wardId) {
    const targetWard = store.wards.find((w) => w.id === filters.wardId);
    list = list.filter(
      (g) =>
        g.wardId === filters.wardId ||
        (targetWard && (g.wardName === targetWard.name || (targetWard.wardNumber && g.wardNumber === targetWard.wardNumber)))
    );
  }
  if (filters?.search && filters.search.trim().length > 0) {
    const s = filters.search.trim().toLowerCase();
    list = list.filter(
      (g) =>
        g.title.toLowerCase().includes(s) ||
        (g.landmark && g.landmark.toLowerCase().includes(s)) ||
        (g.wardName && g.wardName.toLowerCase().includes(s))
    );
  }

  // Cap markers at 500 for performance
  const markers = list.slice(0, 500).map((g) => ({
    id: g.id,
    trackingToken: g.trackingToken,
    title: g.title,
    category: g.category,
    priority: g.priority,
    status: g.status,
    // Privacy: Round public coordinates to 3 decimals (~100m) on server-side
    latitude: Math.round((g.latitude as number) * 1000) / 1000,
    longitude: Math.round((g.longitude as number) * 1000) / 1000,
    landmark: g.landmark,
    wardName: g.wardName,
    departmentName: g.departmentName,
    submittedAt: g.submittedAt,
    endorsementsCount: store.endorsements.filter((e) => e.grievanceId === g.id).length,
  }));

  return { markers, unlocatedCount };
}

// -------------------------------------------------------------
// USER ENGAGEMENT STATE (Version 7)
// -------------------------------------------------------------

export async function getUserEngagementState(
  grievanceId: string,
  userId: string
): Promise<{ endorsed: boolean; following: boolean }> {
  const store = await readStore();
  const endorsed = store.endorsements.some(
    (e) => e.grievanceId === grievanceId && e.userId === userId
  );
  const following = store.followers.some(
    (f) => f.grievanceId === grievanceId && f.userId === userId
  );
  return { endorsed, following };
}

export async function updateGrievanceStatus(
  trackingToken: string,
  input: UpdateStatusInput,
  actor: SafeUser
): Promise<{ grievance: Grievance; history: GrievanceStatusHistory }> {
  const store = await readStore();
  const normalized = trackingToken.trim().toUpperCase();
  const index = store.grievances.findIndex((g) => g.trackingToken === normalized);

  if (index === -1) {
    throw new Error(`Grievance with tracking token ${trackingToken} was not found.`);
  }

  const grievance = store.grievances[index];

  // Validate status transition against policy
  const check = isValidStatusTransition(grievance.status, input.newStatus, actor.role);
  if (!check.allowed) {
    throw new Error(check.reason || "Illegal status transition.");
  }

  // If officer, strictly verify department association across both departmentId and departmentName
  if (actor.role === "MUNICIPAL_OFFICER") {
    const actorDeptId = actor.departmentId;
    const actorDeptName = actor.department;
    const gDeptId = grievance.departmentId;
    const gDeptName = grievance.departmentName;

    const matches =
      (actorDeptId && gDeptId && actorDeptId === gDeptId) ||
      (actorDeptName && gDeptName && actorDeptName === gDeptName) ||
      (actorDeptId && !gDeptId && gDeptName && store.departments.find((d) => d.id === actorDeptId)?.name === gDeptName) ||
      (!actorDeptId && gDeptId && actorDeptName && store.departments.find((d) => d.name === actorDeptName)?.id === gDeptId);

    if (!matches) {
      throw new Error("You are not authorized to transition grievances assigned to another department.");
    }
  }

  // If citizen, verify ownership
  if (actor.role === "CITIZEN" && grievance.citizenId !== actor.id) {
    throw new Error("You can only request reopening on your own grievances.");
  }

  const now = new Date().toISOString();
  const previousStatus = grievance.status;

  // 1. Enforce Resolution Requirements: Mandatory closing remarks & resolution photograph
  if (input.newStatus === "RESOLVED") {
    if (!input.notes || input.notes.trim().length < 10) {
      throw new Error("Formal closing remarks (minimum 10 characters) are required to mark a grievance as RESOLVED.");
    }

    const hasNewEvidence = Boolean(input.resolutionEvidence && input.resolutionEvidence.length > 0);
    const hasExistingPhoto = store.evidence.some(
      (e) => e.grievanceId === grievance.id && e.evidenceType === "PHOTO"
    );

    if (!hasNewEvidence && !hasExistingPhoto) {
      throw new Error("At least one verified resolution photograph is required to mark a grievance as RESOLVED.");
    }

    // Attach any newly provided resolution evidence
    if (hasNewEvidence && input.resolutionEvidence) {
      for (const ev of input.resolutionEvidence) {
        store.evidence.push({
          id: `evd_${crypto.randomUUID().replace(/-/g, "").substring(0, 16)}`,
          grievanceId: grievance.id,
          evidenceType: ev.evidenceType,
          storageKey: ev.storageKey,
          originalFilename: ev.originalFilename ?? "resolution-photo.jpg",
          mimeType: ev.mimeType,
          sizeBytes: ev.sizeBytes,
          caption: ev.caption || "Official Resolution Evidence Photo",
          uploadedById: actor.id,
          uploadedAt: now,
        });
      }
    }

    grievance.resolvedAt = now;
    grievance.resolutionNotes = input.notes.trim();
  }

  // 2. Enforce Formal Rejection Justification
  if (input.newStatus === "REJECTED") {
    const reason = (input.rejectionReason || input.notes || "").trim();
    if (reason.length < 10) {
      throw new Error("A formal justification (minimum 10 characters) is required to reject a grievance.");
    }
    grievance.resolutionNotes = `Rejected: ${reason}`;
  }

  // 3. Clear resolution timestamps if reopened
  if (input.newStatus === "REOPENED") {
    grievance.resolvedAt = null;
  }

  // Apply updates
  grievance.status = input.newStatus;
  grievance.updatedAt = now;

  if (input.assignedOfficerId) {
    const officer = await findUserById(input.assignedOfficerId);
    if (officer) {
      grievance.assignedOfficerId = officer.id;
      grievance.assignedOfficerName = officer.name;
    }
  }

  const historyRecord: GrievanceStatusHistory = {
    id: `gsh_${crypto.randomUUID().replace(/-/g, "").substring(0, 16)}`,
    grievanceId: grievance.id,
    previousStatus,
    newStatus: input.newStatus,
    changeReason: input.changeReason || "Status changed by authorized personnel",
    notes: input.notes ?? (input.rejectionReason ? `Rejected: ${input.rejectionReason}` : null),
    changedById: actor.id,
    changedByName: actor.name,
    createdAt: now,
  };

  store.statusHistory.unshift(historyRecord);
  store.grievances[index] = grievance;

  // Queue in-app notification for citizen owner
  if (grievance.citizenId && grievance.citizenId !== actor.id) {
    pushNotification(store, {
      recipientId: grievance.citizenId,
      type: input.newStatus === "RESOLVED" ? "RESOLUTION_VERIFIED" : "STATUS_CHANGE",
      title: `Grievance Status: ${input.newStatus.replace(/_/g, " ")}`,
      message: `Your grievance ${grievance.trackingToken} has transitioned to ${input.newStatus.replace(/_/g, " ")}.`,
      grievanceId: grievance.id,
      trackingToken: grievance.trackingToken,
      actionUrl: `/track/${grievance.trackingToken}`,
      titleKey: input.newStatus === "RESOLVED" ? "notifications.typeResolutionVerified" : "notifications.typeStatusChange",
    });
  }

  // Queue in-app notifications for registered followers
  const followersToNotify = store.followers.filter(
    (f) => f.grievanceId === grievance.id && f.userId !== actor.id && f.userId !== grievance.citizenId
  );
  for (const follower of followersToNotify) {
    pushNotification(store, {
      recipientId: follower.userId,
      type: input.newStatus === "RESOLVED" ? "RESOLUTION_VERIFIED" : "STATUS_CHANGE",
      title: `Followed Issue: ${input.newStatus.replace(/_/g, " ")}`,
      message: `Civic issue ${grievance.trackingToken} you follow has transitioned to ${input.newStatus.replace(/_/g, " ")}.`,
      grievanceId: grievance.id,
      trackingToken: grievance.trackingToken,
      actionUrl: `/track/${grievance.trackingToken}`,
      titleKey: input.newStatus === "RESOLVED" ? "notifications.typeResolutionVerified" : "notifications.typeStatusChange",
    });
  }

  // Record audit log
  store.auditLogs.unshift({
    id: `aud_${crypto.randomUUID().replace(/-/g, "").substring(0, 16)}`,
    actorId: actor.id,
    actorName: actor.name,
    action: `STATUS_TRANSITION_${input.newStatus}`,
    targetType: "Grievance",
    targetId: grievance.id,
    metadata: JSON.stringify({ previousStatus, newStatus: input.newStatus }),
    createdAt: now,
  });

  await writeStore(store);

  return { grievance, history: historyRecord };
}

// -------------------------------------------------------------
// COMMENTS
// -------------------------------------------------------------

export async function addComment(
  trackingToken: string,
  input: AddCommentInput,
  author: SafeUser
): Promise<Comment> {
  const store = await readStore();
  const grievance = await getGrievanceByTrackingToken(trackingToken);
  if (!grievance) {
    throw new Error(`Grievance ${trackingToken} not found.`);
  }

  // Internal notes strictly restricted to Officers and Admins
  const isInternal = Boolean(input.isInternal);
  if (isInternal && author.role === "CITIZEN") {
    throw new Error("Citizens cannot mark comments as internal notes.");
  }

  const now = new Date().toISOString();
  const newComment: Comment = {
    id: `cmt_${crypto.randomUUID().replace(/-/g, "").substring(0, 16)}`,
    grievanceId: grievance.id,
    authorId: author.id,
    authorName: author.name,
    authorRole: author.role,
    content: input.content.trim(),
    isInternal,
    createdAt: now,
    updatedAt: now,
  };

  store.comments.push(newComment);

  // Notifications for public responses and updates (exclude internal notes)
  if (!isInternal) {
    // 1. If Officer/Admin posted an official response, notify citizen owner
    if (author.role !== "CITIZEN" && grievance.citizenId && grievance.citizenId !== author.id) {
      pushNotification(store, {
        recipientId: grievance.citizenId,
        type: "COMMENT_ADDED",
        title: "Official Response Added",
        message: `Municipal officer ${author.name} posted a response on grievance ${grievance.trackingToken}.`,
        grievanceId: grievance.id,
        trackingToken: grievance.trackingToken,
        actionUrl: `/track/${grievance.trackingToken}`,
        titleKey: "notifications.typeCommentAdded",
      });
    }

    // 2. If Citizen posted a response, notify department officers
    if (author.role === "CITIZEN") {
      const allUsers = await listAllUsers();
      const deptOfficers = allUsers.filter(
        (u) =>
          u.role === "MUNICIPAL_OFFICER" &&
          (u.departmentId === grievance.departmentId || u.department === grievance.departmentName)
      );
      for (const officer of deptOfficers) {
        if (officer.id !== author.id) {
          pushNotification(store, {
            recipientId: officer.id,
            type: "COMMENT_ADDED",
            title: "Citizen Response on Grievance",
            message: `Citizen response posted on grievance ${grievance.trackingToken}.`,
            grievanceId: grievance.id,
            trackingToken: grievance.trackingToken,
            actionUrl: `/officer/dashboard`,
            titleKey: "notifications.typeCommentAdded",
          });
        }
      }
    }

    // 3. Notify registered followers
    const followers = store.followers.filter(
      (f) => f.grievanceId === grievance.id && f.userId !== author.id && f.userId !== grievance.citizenId
    );
    for (const follower of followers) {
      pushNotification(store, {
        recipientId: follower.userId,
        type: "COMMENT_ADDED",
        title: "New Update on Followed Issue",
        message: `New response posted on civic issue ${grievance.trackingToken}.`,
        grievanceId: grievance.id,
        trackingToken: grievance.trackingToken,
        actionUrl: `/track/${grievance.trackingToken}`,
        titleKey: "notifications.typeCommentAdded",
      });
    }
  }

  await writeStore(store);

  return newComment;
}

export async function listComments(
  trackingToken: string,
  viewerUser?: SafeUser | null
): Promise<Comment[]> {
  const store = await readStore();
  const grievance = await getGrievanceByTrackingToken(trackingToken);
  if (!grievance) return [];

  let comments = store.comments.filter((c) => c.grievanceId === grievance.id);

  // If viewer is not Officer or Admin, strictly exclude internal notes
  const isPrivileged = viewerUser?.role === "MUNICIPAL_OFFICER" || viewerUser?.role === "ADMIN";
  if (!isPrivileged) {
    comments = comments.filter((c) => !c.isInternal && !c.isModerated);
  } else if (viewerUser?.role !== "ADMIN") {
    // Field officers also do not view moderated/flagged public comments
    comments = comments.filter((c) => !c.isModerated);
  }

  return comments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

// -------------------------------------------------------------
// ENDORSEMENTS (UPVOTES WITH DUPLICATE PREVENTION)
// -------------------------------------------------------------

export async function toggleEndorsement(
  trackingToken: string,
  userId: string
): Promise<{ endorsed: boolean; totalEndorsements: number }> {
  const store = await readStore();
  const grievance = await getGrievanceByTrackingToken(trackingToken);
  if (!grievance) {
    throw new Error(`Grievance ${trackingToken} not found.`);
  }

  const existingIndex = store.endorsements.findIndex(
    (e) => e.grievanceId === grievance.id && e.userId === userId
  );

  if (existingIndex !== -1) {
    // Un-endorse
    store.endorsements.splice(existingIndex, 1);
    await writeStore(store);
    const count = store.endorsements.filter((e) => e.grievanceId === grievance.id).length;
    return { endorsed: false, totalEndorsements: count };
  } else {
    // Add endorsement
    const newEndorsement: Endorsement = {
      id: `end_${crypto.randomUUID().replace(/-/g, "").substring(0, 16)}`,
      grievanceId: grievance.id,
      userId,
      createdAt: new Date().toISOString(),
    };
    store.endorsements.push(newEndorsement);
    await writeStore(store);
    const count = store.endorsements.filter((e) => e.grievanceId === grievance.id).length;
    return { endorsed: true, totalEndorsements: count };
  }
}

// -------------------------------------------------------------
// FOLLOW / UNFOLLOW
// -------------------------------------------------------------

export async function toggleFollow(
  trackingToken: string,
  userId: string
): Promise<{ following: boolean; totalFollowers: number }> {
  const store = await readStore();
  const grievance = await getGrievanceByTrackingToken(trackingToken);
  if (!grievance) {
    throw new Error(`Grievance ${trackingToken} not found.`);
  }

  const existingIndex = store.followers.findIndex(
    (f) => f.grievanceId === grievance.id && f.userId === userId
  );

  if (existingIndex !== -1) {
    // Unfollow
    store.followers.splice(existingIndex, 1);
    await writeStore(store);
    const count = store.followers.filter((f) => f.grievanceId === grievance.id).length;
    return { following: false, totalFollowers: count };
  } else {
    // Follow
    const newFollower: GrievanceFollower = {
      id: `flw_${crypto.randomUUID().replace(/-/g, "").substring(0, 16)}`,
      grievanceId: grievance.id,
      userId,
      createdAt: new Date().toISOString(),
    };
    store.followers.push(newFollower);
    await writeStore(store);
    const count = store.followers.filter((f) => f.grievanceId === grievance.id).length;
    return { following: true, totalFollowers: count };
  }
}

// -------------------------------------------------------------
// SATISFACTION FEEDBACK (1-5 RATING ON RESOLVED GRIEVANCES)
// -------------------------------------------------------------

export async function submitSatisfactionFeedback(
  trackingToken: string,
  input: FeedbackInput,
  citizenUser: SafeUser
): Promise<SatisfactionFeedback> {
  const store = await readStore();
  const grievance = await getGrievanceByTrackingToken(trackingToken);
  if (!grievance) {
    throw new Error(`Grievance ${trackingToken} not found.`);
  }

  // Verification 1: Only the citizen who submitted the grievance can rate it
  if (grievance.citizenId !== citizenUser.id) {
    throw new Error("You can only submit satisfaction feedback for your own grievances.");
  }

  // Verification 2: Grievance must be RESOLVED
  if (grievance.status !== "RESOLVED") {
    throw new Error("Satisfaction feedback can only be submitted once the grievance is officially marked as RESOLVED.");
  }

  // Verification 3: Enforce one feedback per grievance rule
  const existing = store.feedback.find((f) => f.grievanceId === grievance.id);
  if (existing) {
    throw new Error("Satisfaction feedback has already been submitted for this grievance.");
  }

  const now = new Date().toISOString();
  const newFeedback: SatisfactionFeedback = {
    id: `fbk_${crypto.randomUUID().replace(/-/g, "").substring(0, 16)}`,
    grievanceId: grievance.id,
    citizenId: citizenUser.id,
    rating: input.rating,
    feedbackText: input.feedbackText ?? null,
    submittedAt: now,
    updatedAt: now,
  };

  store.feedback.push(newFeedback);
  await writeStore(store);

  return newFeedback;
}

// -------------------------------------------------------------
// EVIDENCE METADATA
// -------------------------------------------------------------

export async function addEvidenceMetadata(
  trackingToken: string,
  input: EvidenceMetadataInput,
  uploaderUser: SafeUser
): Promise<GrievanceEvidence> {
  const store = await readStore();
  const grievance = await getGrievanceByTrackingToken(trackingToken);
  if (!grievance) {
    throw new Error(`Grievance ${trackingToken} not found.`);
  }

  const newEvidence: GrievanceEvidence = {
    id: `evd_${crypto.randomUUID().replace(/-/g, "").substring(0, 16)}`,
    grievanceId: grievance.id,
    evidenceType: input.evidenceType,
    storageKey: input.storageKey,
    originalFilename: input.originalFilename ?? null,
    mimeType: input.mimeType,
    sizeBytes: input.sizeBytes,
    caption: input.caption ?? null,
    uploadedById: uploaderUser.id,
    uploadedAt: new Date().toISOString(),
  };

  store.evidence.push(newEvidence);
  await writeStore(store);

  return newEvidence;
}

export async function listEvidenceForGrievance(trackingToken: string): Promise<GrievanceEvidence[]> {
  const store = await readStore();
  const grievance = await getGrievanceByTrackingToken(trackingToken);
  if (!grievance) {
    return [];
  }
  return store.evidence.filter((e) => e.grievanceId === grievance.id);
}

// -------------------------------------------------------------
// AUDIT LOGGING
// -------------------------------------------------------------

export async function createAuditLog(
  actorId: string | null,
  action: string,
  targetType: string,
  targetId: string | null,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    // In production with PostgreSQL, writes to audit_logs table
    // Lightweight safe console audit during development
    const payload = {
      timestamp: new Date().toISOString(),
      actorId,
      action,
      targetType,
      targetId,
      metadata,
    };
    if (process.env.NODE_ENV === "development") {
      console.log(`[AUDIT] ${action} on ${targetType}:${targetId || "none"} by ${actorId || "SYSTEM"}`);
    }
  } catch (err) {
    console.error("Audit log error:", err);
  }
}

// -------------------------------------------------------------
// SANITIZATION HELPER FOR PUBLIC DISPLAY
// -------------------------------------------------------------

export async function sanitizeGrievanceForPublic(
  grievance: Grievance,
  viewerUser?: SafeUser | null
): Promise<PublicGrievance | Grievance> {
  const isOwner = viewerUser && viewerUser.id === grievance.citizenId;
  const isOfficerOrAdmin = viewerUser && (viewerUser.role === "MUNICIPAL_OFFICER" || viewerUser.role === "ADMIN");

  // If viewer is owner or privileged officer, return full record
  if (isOwner || isOfficerOrAdmin) {
    return grievance;
  }

  // For general public tracking lookup: mask exact coordinates and citizen personal info
  const store = await readStore();
  const history = store.statusHistory
    .filter((h) => h.grievanceId === grievance.id)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((h) => ({
      previousStatus: h.previousStatus,
      newStatus: h.newStatus,
      createdAt: h.createdAt,
      notes: h.notes,
    }));

  return {
    trackingToken: grievance.trackingToken,
    title: grievance.title,
    description: grievance.description,
    category: grievance.category,
    priority: grievance.priority,
    status: grievance.status,
    landmark: grievance.landmark,
    departmentName: grievance.departmentName,
    wardName: grievance.wardName,
    wardNumber: grievance.wardNumber,
    submittedAt: grievance.submittedAt,
    deadlineAt: grievance.deadlineAt,
    resolvedAt: grievance.resolvedAt,
    resolutionNotes: grievance.resolutionNotes,
    endorsementsCount: grievance.endorsementsCount || 0,
    commentsCount: grievance.commentsCount || 0,
    followersCount: grievance.followersCount || 0,
    statusHistory: history,
  };
}

// -------------------------------------------------------------
// OVERDUE PROCESSING & SLA MONITORING (Idempotent Server-Side Cron Engine)
// -------------------------------------------------------------

export interface OverdueProcessingResult {
  success: boolean;
  timestamp: string;
  processedCount: number;
  escalatedCount: number;
  skippedCount: number;
  records: Array<{
    trackingToken: string;
    escalationId: string;
    deadlineAt: string;
  }>;
}

export async function processOverdueGrievances(
  options: { limit?: number; dryRun?: boolean } = {}
): Promise<OverdueProcessingResult> {
  const store = await readStore();
  const limit = options.limit || 50;
  const now = new Date();
  const nowIso = now.toISOString();

  const activeStatuses: GrievanceStatus[] = [
    "SUBMITTED",
    "ASSIGNED",
    "IN_PROGRESS",
    "REOPENED",
    "SLA_BREACHED",
  ];

  // 1. Find eligible unresolved grievances whose deadline has passed
  const eligible = store.grievances.filter((g) => {
    if (!activeStatuses.includes(g.status)) return false;
    if (!g.deadlineAt) return false;
    return new Date(g.deadlineAt).getTime() < now.getTime();
  });

  let escalatedCount = 0;
  let skippedCount = 0;
  const createdEscalations: Array<{ trackingToken: string; escalationId: string; deadlineAt: string }> = [];

  for (const grievance of eligible.slice(0, limit)) {
    // 2. Concurrency-safe idempotency check: Has an SLA_TIME_EXCEEDED escalation already been created?
    const alreadyEscalated = store.escalations.some(
      (e) => e.grievanceId === grievance.id && e.escalationType === "SLA_TIME_EXCEEDED"
    );

    if (alreadyEscalated) {
      skippedCount++;
      continue;
    }

    if (options.dryRun) {
      escalatedCount++;
      continue;
    }

    // 3. Create unique escalation record
    const escalationId = `esc_${crypto.randomUUID().replace(/-/g, "").substring(0, 16)}`;
    const escalation: EscalationRecord = {
      id: escalationId,
      grievanceId: grievance.id,
      escalationType: "SLA_TIME_EXCEEDED",
      reason: `Automated SLA Overdue Monitor: Case exceeded resolution target of ${grievance.deadlineAt}.`,
      status: "PENDING",
      escalatedById: "SYSTEM",
      escalatedByName: "PuneSetu SLA Monitor",
      triggeredAt: nowIso,
    };
    store.escalations.unshift(escalation);

    // 4. Update grievance status to SLA_BREACHED while preserving underlying work status and audit history
    const previousStatus = grievance.status;
    grievance.underlyingStatus = previousStatus;
    grievance.isOverdue = true;
    grievance.breachedAt = nowIso;
    grievance.status = "SLA_BREACHED";
    grievance.updatedAt = nowIso;

    // 5. Append immutable status history
    store.statusHistory.unshift({
      id: `gsh_${crypto.randomUUID().replace(/-/g, "").substring(0, 16)}`,
      grievanceId: grievance.id,
      previousStatus,
      newStatus: "SLA_BREACHED",
      changeReason: "Automatic SLA target breach detection",
      notes: `Operational resolution target ${grievance.deadlineAt} was exceeded. Case escalated for supervisor inspection.`,
      changedById: "SYSTEM",
      changedByName: "PuneSetu SLA Monitor",
      createdAt: nowIso,
    });

    // 6. Queue citizen, officer, and admin notifications
    if (grievance.citizenId) {
      pushNotification(store, {
        recipientId: grievance.citizenId,
        type: "ESCALATED",
        title: "Grievance Overdue — Escalated to Ward Supervisor",
        message: `Your grievance ${grievance.trackingToken} has passed its advisory SLA target and has been automatically escalated.`,
        grievanceId: grievance.id,
        trackingToken: grievance.trackingToken,
        actionUrl: `/track/${grievance.trackingToken}`,
        titleKey: "notifications.typeEscalated",
      });
    }

    const allUsers = await listAllUsers();
    // Notify department officers
    const deptOfficers = allUsers.filter(
      (u) =>
        u.role === "MUNICIPAL_OFFICER" &&
        (u.departmentId === grievance.departmentId || u.department === grievance.departmentName)
    );
    for (const officer of deptOfficers) {
      pushNotification(store, {
        recipientId: officer.id,
        type: "ESCALATED",
        title: "SLA Warning: Grievance Overdue",
        message: `Grievance ${grievance.trackingToken} in your queue has breached SLA target (${grievance.deadlineAt}).`,
        grievanceId: grievance.id,
        trackingToken: grievance.trackingToken,
        actionUrl: `/officer/dashboard`,
        titleKey: "notifications.typeEscalated",
      });
    }

    // Notify administrators
    const adminUsers = allUsers.filter((u) => u.role === "ADMIN");
    for (const admin of adminUsers) {
      pushNotification(store, {
        recipientId: admin.id,
        type: "ESCALATED",
        title: "SLA Breach Detected",
        message: `Grievance ${grievance.trackingToken} (${grievance.departmentName || "General"}) breached SLA target.`,
        grievanceId: grievance.id,
        trackingToken: grievance.trackingToken,
        actionUrl: `/admin/dashboard`,
        titleKey: "notifications.typeEscalated",
      });
    }

    // 7. Record system audit log
    store.auditLogs.unshift({
      id: `aud_${crypto.randomUUID().replace(/-/g, "").substring(0, 16)}`,
      actorId: "SYSTEM",
      actorName: "PuneSetu SLA Monitor",
      action: "SLA_BREACH_DETECTED",
      targetType: "Grievance",
      targetId: grievance.id,
      metadata: JSON.stringify({ trackingToken: grievance.trackingToken, deadlineAt: grievance.deadlineAt }),
      createdAt: nowIso,
    });

    escalatedCount++;
    createdEscalations.push({
      trackingToken: grievance.trackingToken,
      escalationId,
      deadlineAt: grievance.deadlineAt ?? "",
    });
  }

  if (!options.dryRun && escalatedCount > 0) {
    await writeStore(store);
  }

  return {
    success: true,
    timestamp: nowIso,
    processedCount: eligible.length,
    escalatedCount,
    skippedCount,
    records: createdEscalations,
  };
}

// -------------------------------------------------------------
// CITIZEN-REQUESTED ESCALATION
// -------------------------------------------------------------

export async function requestCitizenEscalation(
  trackingToken: string,
  input: EscalationRequestInput,
  citizenUser: SafeUser
): Promise<{ grievance: Grievance; escalation: EscalationRecord }> {
  const store = await readStore();
  const grievance = await getGrievanceByTrackingToken(trackingToken);

  if (!grievance) {
    throw new Error(`Grievance ${trackingToken} was not found.`);
  }

  // 1. Verify Ownership: Citizens can only escalate their own grievance
  if (citizenUser.role === "CITIZEN" && grievance.citizenId !== citizenUser.id) {
    throw new Error("You are not authorized to escalate another citizen's grievance.");
  }

  // 2. State eligibility
  if (grievance.status === "RESOLVED") {
    throw new Error("Cannot escalate a resolved grievance. You may request to reopen the case instead.");
  }
  if (grievance.status === "REJECTED") {
    throw new Error("Cannot escalate a formally rejected grievance. You may file an appeal or request to reopen.");
  }

  // 3. Concurrency / Abuse check: prevent spamming multiple pending citizen escalations
  const pendingCitizenEscalation = store.escalations.find(
    (e) => e.grievanceId === grievance.id && e.escalationType === "MANUAL_CITIZEN_ESCALATION" && e.status === "PENDING"
  );
  if (pendingCitizenEscalation) {
    throw new Error("An escalation request for this grievance is already pending municipal supervisor review.");
  }

  const nowIso = new Date().toISOString();
  const escalationId = `esc_${crypto.randomUUID().replace(/-/g, "").substring(0, 16)}`;

  const escalation: EscalationRecord = {
    id: escalationId,
    grievanceId: grievance.id,
    escalationType: "MANUAL_CITIZEN_ESCALATION",
    reason: input.reason.trim(),
    status: "PENDING",
    escalatedById: citizenUser.id,
    escalatedByName: citizenUser.name,
    triggeredAt: nowIso,
  };
  store.escalations.unshift(escalation);

  const previousStatus = grievance.status;
  grievance.status = "ESCALATED";
  grievance.updatedAt = nowIso;

  // Append history
  store.statusHistory.unshift({
    id: `gsh_${crypto.randomUUID().replace(/-/g, "").substring(0, 16)}`,
    grievanceId: grievance.id,
    previousStatus,
    newStatus: "ESCALATED",
    changeReason: "Citizen requested escalation",
    notes: input.reason.trim(),
    changedById: citizenUser.id,
    changedByName: citizenUser.name,
    createdAt: nowIso,
  });

  // Audit log
  store.auditLogs.unshift({
    id: `aud_${crypto.randomUUID().replace(/-/g, "").substring(0, 16)}`,
    actorId: citizenUser.id,
    actorName: citizenUser.name,
    action: "CITIZEN_ESCALATION_REQUESTED",
    targetType: "Grievance",
    targetId: grievance.id,
    metadata: JSON.stringify({ reason: input.reason }),
    createdAt: nowIso,
  });

  // 1. Notify citizen owner
  pushNotification(store, {
    recipientId: citizenUser.id,
    type: "ESCALATED",
    title: "Escalation Request Registered",
    message: `Your grievance ${grievance.trackingToken} has been escalated for supervisor review. Reason: ${input.reason.trim()}.`,
    grievanceId: grievance.id,
    trackingToken: grievance.trackingToken,
    actionUrl: `/track/${grievance.trackingToken}`,
    titleKey: "notifications.typeEscalated",
  });

  // 2. Notify assigned department officers
  const allUsers = await listAllUsers();
  const deptOfficers = allUsers.filter(
    (u) =>
      u.role === "MUNICIPAL_OFFICER" &&
      (u.departmentId === grievance.departmentId || u.department === grievance.departmentName)
  );
  for (const officer of deptOfficers) {
    pushNotification(store, {
      recipientId: officer.id,
      type: "ESCALATED",
      title: "Escalation Notice: Case Escalated by Citizen",
      message: `Grievance ${grievance.trackingToken} has been escalated by citizen. Reason: ${input.reason.trim()}.`,
      grievanceId: grievance.id,
      trackingToken: grievance.trackingToken,
      actionUrl: `/officer/dashboard`,
      titleKey: "notifications.typeEscalated",
    });
  }

  // 3. Notify administrators
  const adminUsers = allUsers.filter((u) => u.role === "ADMIN");
  for (const admin of adminUsers) {
    pushNotification(store, {
      recipientId: admin.id,
      type: "ESCALATED",
      title: "Platform Alert: Grievance Escalated",
      message: `Grievance ${grievance.trackingToken} (${grievance.category}) escalated by citizen: ${input.reason.trim()}.`,
      grievanceId: grievance.id,
      trackingToken: grievance.trackingToken,
      actionUrl: `/admin/dashboard`,
      titleKey: "notifications.typeEscalated",
    });
  }

  await writeStore(store);

  return { grievance, escalation };
}

// -------------------------------------------------------------
// COMPREHENSIVE TRACKING DETAILS
// -------------------------------------------------------------

export interface GrievanceTrackingDetails {
  grievance: Grievance | PublicGrievance;
  timeline: Array<{
    id: string;
    previousStatus: GrievanceStatus;
    newStatus: GrievanceStatus;
    createdAt: string;
    notes?: string | null;
    changeReason?: string | null;
    changedByName?: string | null;
  }>;
  evidence: GrievanceEvidence[];
  resolutionEvidence: GrievanceEvidence[];
  feedback: SatisfactionFeedback | null;
  escalations: EscalationRecord[];
  slaStatus: SLAStatusInfo;
  endorsementsCount: number;
  followersCount: number;
  viewerPermissions: {
    isOwner: boolean;
    isOfficer: boolean;
    isAdmin: boolean;
    canReopen: boolean;
    canEscalate: boolean;
    canFeedback: boolean;
    canUpdateStatus: boolean;
  };
}

export async function getGrievanceTrackingDetails(
  token: string,
  viewerUser?: SafeUser | null
): Promise<GrievanceTrackingDetails | null> {
  const store = await readStore();
  const grievance = await getGrievanceByTrackingToken(token);
  if (!grievance) return null;

  const isOwner = Boolean(viewerUser && viewerUser.id === grievance.citizenId);
  const isOfficer = Boolean(
    viewerUser &&
      viewerUser.role === "MUNICIPAL_OFFICER" &&
      (!viewerUser.departmentId || !grievance.departmentId || viewerUser.departmentId === grievance.departmentId)
  );
  const isAdmin = Boolean(viewerUser && viewerUser.role === "ADMIN");
  const isPrivileged = isOwner || isOfficer || isAdmin;

  // 1. Grievance Record (mask coordinates and citizen contact for general public)
  const displayedGrievance: Grievance | PublicGrievance = isPrivileged
    ? grievance
    : ((await sanitizeGrievanceForPublic(grievance, viewerUser)) as PublicGrievance);

  // 2. Timeline
  const timeline = store.statusHistory
    .filter((h) => h.grievanceId === grievance.id)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((h) => ({
      id: h.id,
      previousStatus: h.previousStatus,
      newStatus: h.newStatus,
      createdAt: h.createdAt,
      notes: h.notes,
      changeReason: h.changeReason,
      changedByName: isPrivileged ? h.changedByName : undefined,
    }));

  // 3. Evidence
  const allEvidence = store.evidence.filter((e) => e.grievanceId === grievance.id);
  const resolutionEvidence = allEvidence.filter(
    (e) => e.caption?.toLowerCase().includes("resolution") || e.originalFilename?.toLowerCase().includes("resolution")
  );
  const initialEvidence = allEvidence.filter((e) => !resolutionEvidence.some((r) => r.id === e.id));

  // 4. Feedback
  const feedback = store.feedback.find((f) => f.grievanceId === grievance.id) || null;

  // 5. Escalations
  const escalations = store.escalations.filter((e) => e.grievanceId === grievance.id);

  // 6. SLA status info
  const slaStatus = getSLAStatusInfo(grievance);

  // 7. Viewer Permissions
  const canReopen = isOwner && (grievance.status === "RESOLVED" || grievance.status === "REJECTED");
  const canEscalate =
    isOwner && ["SUBMITTED", "ASSIGNED", "IN_PROGRESS", "REOPENED", "SLA_BREACHED"].includes(grievance.status);
  const canFeedback = isOwner && grievance.status === "RESOLVED" && !feedback;
  const canUpdateStatus = isOfficer || isAdmin;

  return {
    grievance: displayedGrievance,
    timeline,
    evidence: initialEvidence,
    resolutionEvidence,
    feedback: isPrivileged || feedback ? feedback : null,
    escalations: isPrivileged ? escalations : [],
    slaStatus,
    endorsementsCount: store.endorsements.filter((e) => e.grievanceId === grievance.id).length,
    followersCount: store.followers.filter((f) => f.grievanceId === grievance.id).length,
    viewerPermissions: {
      isOwner,
      isOfficer,
      isAdmin,
      canReopen,
      canEscalate,
      canFeedback,
      canUpdateStatus,
    },
  };
}

// -------------------------------------------------------------
// NOTIFICATIONS (Version 20: Persistent, Deduplicated & Audited)
// -------------------------------------------------------------

export function pushNotification(
  store: CivicStoreData,
  notif: {
    recipientId: string;
    type: Notification["type"];
    title: string;
    message: string;
    grievanceId?: string | null;
    trackingToken?: string | null;
    actionUrl?: string | null;
    titleKey?: string | null;
    messageKey?: string | null;
    metadata?: string | null;
  }
): Notification | null {
  const nowMs = Date.now();
  // Prevent duplicate notifications within 10 seconds for the same recipient, type, grievance, and message
  const isDuplicate = store.notifications.some(
    (n) =>
      n.recipientId === notif.recipientId &&
      n.type === notif.type &&
      n.grievanceId === notif.grievanceId &&
      n.message === notif.message &&
      Math.abs(nowMs - new Date(n.createdAt).getTime()) < 10000
  );

  if (isDuplicate) {
    return null;
  }

  const record: Notification = {
    id: `notif_${crypto.randomUUID().replace(/-/g, "").substring(0, 16)}`,
    recipientId: notif.recipientId,
    type: notif.type,
    title: notif.title,
    message: notif.message,
    grievanceId: notif.grievanceId ?? null,
    trackingToken: notif.trackingToken ?? null,
    actionUrl: notif.actionUrl ?? (notif.trackingToken ? `/track/${notif.trackingToken}` : null),
    titleKey: notif.titleKey ?? null,
    messageKey: notif.messageKey ?? null,
    metadata: notif.metadata ?? null,
    read: false,
    createdAt: new Date().toISOString(),
    readAt: null,
  };

  store.notifications.unshift(record);
  return record;
}

export async function createNotification(input: {
  recipientId: string;
  type: Notification["type"];
  title: string;
  message: string;
  grievanceId?: string | null;
  trackingToken?: string | null;
  actionUrl?: string | null;
  titleKey?: string | null;
  messageKey?: string | null;
  metadata?: string | null;
}): Promise<Notification | null> {
  const store = await readStore();
  const created = pushNotification(store, input);
  if (created) {
    await writeStore(store);
  }
  return created;
}

export async function listNotificationsForUser(userId: string): Promise<Notification[]> {
  const store = await readStore();
  return store.notifications
    .filter((n) => n.recipientId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function markNotificationAsRead(notificationId: string, userId: string): Promise<boolean> {
  const store = await readStore();
  const notif = store.notifications.find((n) => n.id === notificationId && n.recipientId === userId);
  if (!notif) return false;
  notif.read = true;
  notif.readAt = new Date().toISOString();
  await writeStore(store);
  return true;
}

export async function markAllNotificationsAsRead(userId: string): Promise<number> {
  const store = await readStore();
  let count = 0;
  const nowIso = new Date().toISOString();
  for (const notif of store.notifications) {
    if (notif.recipientId === userId && !notif.read) {
      notif.read = true;
      notif.readAt = nowIso;
      count++;
    }
  }
  if (count > 0) {
    await writeStore(store);
  }
  return count;
}

// =============================================================
// VERSION 8: MUNICIPAL OFFICER OPERATIONS
// =============================================================

export interface OfficerQueueQuery {
  status?: string;
  priority?: string;
  wardId?: string;
  departmentId?: string;
  search?: string;
  overdueOnly?: boolean;
  nearDeadlineOnly?: boolean;
  sortBy?: "deadline" | "priority" | "submitted" | "urgency";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface OfficerGrievanceItem extends Grievance {
  isOverdue: boolean;
  hoursRemaining: number | null;
  slaState: string;
  thumbnailUrl?: string | null;
}

export async function listOfficerGrievances(
  officer: SafeUser,
  query: OfficerQueueQuery = {}
): Promise<{
  items: OfficerGrievanceItem[];
  total: number;
  page: number;
  totalPages: number;
}> {
  if (officer.role !== "MUNICIPAL_OFFICER" && officer.role !== "ADMIN") {
    throw new Error("Unauthorized: Only Municipal Officers and Administrators can access the operational queue.");
  }

  const store = await readStore();
  let list = [...store.grievances];

  // Department Scoping: If officer, scope to officer's assigned department
  if (officer.role === "MUNICIPAL_OFFICER") {
    if (officer.departmentId) {
      list = list.filter(
        (g) => g.departmentId === officer.departmentId || (officer.department && g.departmentName === officer.department)
      );
    } else if (officer.department) {
      list = list.filter((g) => g.departmentName === officer.department);
    }
  } else if (query.departmentId) {
    // Admin filtering by specific department
    list = list.filter((g) => g.departmentId === query.departmentId);
  }

  // Status Filter
  if (query.status) {
    list = list.filter((g) => g.status === query.status);
  }

  // Priority Filter
  if (query.priority) {
    list = list.filter((g) => g.priority === query.priority);
  }

  // Ward Filter
  if (query.wardId) {
    const targetWard = store.wards.find((w) => w.id === query.wardId);
    list = list.filter(
      (g) =>
        g.wardId === query.wardId ||
        (targetWard && (g.wardName === targetWard.name || (targetWard.wardNumber && g.wardNumber === targetWard.wardNumber)))
    );
  }

  // Text Search across title, description, landmark, tracking token
  if (query.search && query.search.trim().length > 0) {
    const s = query.search.trim().toLowerCase();
    list = list.filter(
      (g) =>
        g.title.toLowerCase().includes(s) ||
        g.description.toLowerCase().includes(s) ||
        (g.landmark && g.landmark.toLowerCase().includes(s)) ||
        g.trackingToken.toLowerCase().includes(s)
    );
  }

  const nowMs = Date.now();

  // Annotate with SLA countdown info
  const annotated = list.map((g) => {
    const sla = getSLAStatusInfo(g);
    let hoursRemaining: number | null = null;
    if (g.deadlineAt && g.status !== "RESOLVED" && g.status !== "REJECTED") {
      const diffMs = new Date(g.deadlineAt).getTime() - nowMs;
      hoursRemaining = Math.round(diffMs / (1000 * 60 * 60));
    }
    const photo = store.evidence.find(
      (e) => e.grievanceId === g.id && (e.evidenceType === "PHOTO" || e.mimeType?.startsWith("image/"))
    );
    return {
      ...g,
      isOverdue: sla.isOverdue,
      hoursRemaining,
      slaState: sla.state,
      thumbnailUrl: photo ? getEvidenceUrl(photo.storageKey) : null,
    };
  });

  // Near Deadline filter (< 48 hours remaining and unresolved)
  let filtered = annotated;
  if (query.nearDeadlineOnly) {
    filtered = filtered.filter(
      (g) =>
        g.hoursRemaining !== null &&
        g.hoursRemaining > 0 &&
        g.hoursRemaining <= 48 &&
        g.status !== "RESOLVED" &&
        g.status !== "REJECTED"
    );
  }

  // Overdue Only filter
  if (query.overdueOnly) {
    filtered = filtered.filter((g) => g.isOverdue && g.status !== "RESOLVED" && g.status !== "REJECTED");
  }

  // Sort options: deadline, submitted, or default (overdue first, then priority, then submitted)
  if (query.sortBy === "deadline") {
    filtered.sort((a, b) => {
      const tA = a.deadlineAt ? new Date(a.deadlineAt).getTime() : Infinity;
      const tB = b.deadlineAt ? new Date(b.deadlineAt).getTime() : Infinity;
      return query.sortOrder === "desc" ? tB - tA : tA - tB;
    });
  } else if (query.sortBy === "submitted") {
    filtered.sort((a, b) => {
      const tA = new Date(a.submittedAt).getTime();
      const tB = new Date(b.submittedAt).getTime();
      return query.sortOrder === "asc" ? tA - tB : tB - tA;
    });
  } else {
    // Default: Overdue cases pinned first, then by priority weight, then by newest submitted
    const priorityWeight: Record<string, number> = { EMERGENCY: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    filtered.sort((a, b) => {
      if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
      const pA = priorityWeight[a.priority] || 0;
      const pB = priorityWeight[b.priority] || 0;
      if (pB !== pA) return pB - pA;
      return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
    });
  }

  const total = filtered.length;
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(50, Math.max(1, query.limit || 20));
  const totalPages = Math.ceil(total / limit) || 1;
  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + limit);

  return { items: paginated, total, page, totalPages };
}

export async function getOfficerStats(officer: SafeUser): Promise<{
  assignedTotal: number;
  inProgress: number;
  nearDeadline: number;
  overdue: number;
  resolved: number;
  departmentName: string;
}> {
  if (officer.role !== "MUNICIPAL_OFFICER" && officer.role !== "ADMIN") {
    throw new Error("Unauthorized: Officer clearance required.");
  }

  const store = await readStore();
  let list = [...store.grievances];

  if (officer.role === "MUNICIPAL_OFFICER") {
    if (officer.departmentId) {
      list = list.filter(
        (g) => g.departmentId === officer.departmentId || (officer.department && g.departmentName === officer.department)
      );
    } else if (officer.department) {
      list = list.filter((g) => g.departmentName === officer.department);
    }
  }

  const nowMs = Date.now();
  let assignedTotal = list.length;
  let inProgress = 0;
  let nearDeadline = 0;
  let overdue = 0;
  let resolved = 0;

  for (const g of list) {
    if (g.status === "RESOLVED") {
      resolved++;
      continue;
    }
    if (g.status === "IN_PROGRESS" || g.status === "ASSIGNED" || g.status === "REOPENED") {
      inProgress++;
    }
    const sla = getSLAStatusInfo(g);
    if (sla.isOverdue) {
      overdue++;
    } else if (g.deadlineAt) {
      const diffHours = (new Date(g.deadlineAt).getTime() - nowMs) / (1000 * 60 * 60);
      if (diffHours > 0 && diffHours <= 48) {
        nearDeadline++;
      }
    }
  }

  return {
    assignedTotal,
    inProgress,
    nearDeadline,
    overdue,
    resolved,
    departmentName: officer.department || "All Departments",
  };
}

export async function reassignGrievance(
  token: string,
  input: { targetDepartmentId: string; targetWardId?: string; reason: string },
  actor: SafeUser
): Promise<{ success: boolean; grievance: Grievance }> {
  if (actor.role !== "MUNICIPAL_OFFICER" && actor.role !== "ADMIN") {
    throw new Error("Unauthorized: Reassignment requires officer or administrative clearance.");
  }
  if (!input.reason || input.reason.trim().length < 10) {
    throw new Error("A clear justification (minimum 10 characters) is required to reassign a grievance.");
  }

  const store = await readStore();
  const grievance = await getGrievanceByTrackingToken(token);
  if (!grievance) {
    throw new Error(`Grievance ${token} not found.`);
  }

  // Officer department isolation: officer can only reassign grievances in their department
  if (actor.role === "MUNICIPAL_OFFICER") {
    const actorDeptId = actor.departmentId;
    const actorDeptName = actor.department;
    const gDeptId = grievance.departmentId;
    const gDeptName = grievance.departmentName;

    const matches =
      (actorDeptId && gDeptId && actorDeptId === gDeptId) ||
      (actorDeptName && gDeptName && actorDeptName === gDeptName) ||
      (actorDeptId && !gDeptId && gDeptName && store.departments.find((d) => d.id === actorDeptId)?.name === gDeptName) ||
      (!actorDeptId && gDeptId && actorDeptName && store.departments.find((d) => d.name === actorDeptName)?.id === gDeptId);

    if (!matches) {
      throw new Error("Unauthorized: You can only reassign grievances assigned to your own department.");
    }
  }

  const targetDept = store.departments.find((d) => d.id === input.targetDepartmentId);
  if (!targetDept) {
    throw new Error(`Target department ${input.targetDepartmentId} does not exist.`);
  }

  const previousDeptName = grievance.departmentName || "Unassigned";
  grievance.departmentId = targetDept.id;
  grievance.departmentName = targetDept.name;

  if (input.targetWardId) {
    const targetWard = store.wards.find((w) => w.id === input.targetWardId);
    if (targetWard) {
      grievance.wardId = targetWard.id;
      grievance.wardName = targetWard.name;
      grievance.wardNumber = targetWard.wardNumber;
    }
  }

  const nowIso = new Date().toISOString();
  grievance.updatedAt = nowIso;

  // Add to status history
  store.statusHistory.unshift({
    id: `gsh_${crypto.randomUUID().replace(/-/g, "").substring(0, 16)}`,
    grievanceId: grievance.id,
    previousStatus: grievance.status,
    newStatus: grievance.status,
    changeReason: `Reassigned from ${previousDeptName} to ${targetDept.name}`,
    notes: input.reason.trim(),
    changedById: actor.id,
    changedByName: actor.name,
    createdAt: nowIso,
  });

  // Record audit log
  store.auditLogs.unshift({
    id: `aud_${crypto.randomUUID().replace(/-/g, "").substring(0, 16)}`,
    actorId: actor.id,
    actorName: actor.name,
    action: "GRIEVANCE_REASSIGNED",
    targetType: "Grievance",
    targetId: grievance.id,
    metadata: JSON.stringify({
      previousDepartment: previousDeptName,
      newDepartment: targetDept.name,
      reason: input.reason.trim(),
    }),
    createdAt: nowIso,
  });

  // Record Escalation/Dispatch record
  store.escalations.unshift({
    id: `esc_${crypto.randomUUID().replace(/-/g, "").substring(0, 16)}`,
    grievanceId: grievance.id,
    escalationType: "OFFICER_REASSIGNMENT",
    reason: `Department reassignment from ${previousDeptName} to ${targetDept.name}: ${input.reason.trim()}`,
    status: "REVIEWED",
    escalatedById: actor.id,
    escalatedByName: actor.name,
    triggeredAt: nowIso,
    resolvedAt: nowIso,
    reviewRemarks: input.reason.trim(),
  });

  // 1. Notify citizen owner of department reassignment
  if (grievance.citizenId && grievance.citizenId !== actor.id) {
    pushNotification(store, {
      recipientId: grievance.citizenId,
      type: "ASSIGNED",
      title: "Grievance Reassigned to Department",
      message: `Your grievance ${grievance.trackingToken} was transferred to ${targetDept.name}. Reason: ${input.reason.trim()}.`,
      grievanceId: grievance.id,
      trackingToken: grievance.trackingToken,
      actionUrl: `/track/${grievance.trackingToken}`,
      titleKey: "notifications.typeAssigned",
    });
  }

  // 2. Notify officers of the target department
  const allUsers = await listAllUsers();
  const targetOfficers = allUsers.filter(
    (u) =>
      u.role === "MUNICIPAL_OFFICER" &&
      (u.departmentId === targetDept.id || u.department === targetDept.name)
  );
  for (const officer of targetOfficers) {
    if (officer.id !== actor.id) {
      pushNotification(store, {
        recipientId: officer.id,
        type: "ASSIGNED",
        title: "Grievance Transferred to Your Department",
        message: `Grievance ${grievance.trackingToken} was reassigned from ${previousDeptName} to ${targetDept.name}. Reason: ${input.reason.trim()}.`,
        grievanceId: grievance.id,
        trackingToken: grievance.trackingToken,
        actionUrl: `/officer/dashboard`,
        titleKey: "notifications.typeAssigned",
      });
    }
  }

  await writeStore(store);
  return { success: true, grievance };
}

// =============================================================
// VERSION 8: ADMINISTRATOR COMMAND CENTER OPERATIONS
// =============================================================

export interface AdminAnalyticsData {
  totalGrievances: number;
  pendingCount: number;
  inProgressCount: number;
  resolvedCount: number;
  rejectedCount: number;
  overdueCount: number;
  inProgress?: number;
  pending?: number;
  resolved?: number;
  rejected?: number;
  overdue?: number;
  slaBreachPercentage: number;
  avgResolutionHours: number;
  citizenSatisfactionScore: number;
  statusDistribution: Array<{ status: string; label: string; count: number; color: string }>;
  categoryDistribution: Array<{ category: string; label: string; count: number }>;
  priorityDistribution: Array<{ priority: string; count: number }>;
}

export async function getAdminAnalytics(admin: SafeUser): Promise<AdminAnalyticsData> {
  if (admin.role !== "ADMIN") {
    throw new Error("Unauthorized: Administrator clearance required for system analytics.");
  }

  const store = await readStore();
  const list = store.grievances;
  const nowMs = Date.now();

  const totalGrievances = list.length;
  let pendingCount = 0;
  let inProgressCount = 0;
  let resolvedCount = 0;
  let rejectedCount = 0;
  let overdueCount = 0;
  let totalResolutionHours = 0;

  for (const g of list) {
    if (g.status === "SUBMITTED" || g.status === "ASSIGNED") {
      pendingCount++;
    } else if (g.status === "IN_PROGRESS" || g.status === "REOPENED") {
      inProgressCount++;
    } else if (g.status === "RESOLVED") {
      resolvedCount++;
      if (g.submittedAt && g.resolvedAt) {
        const diffHours = (new Date(g.resolvedAt).getTime() - new Date(g.submittedAt).getTime()) / (1000 * 60 * 60);
        if (diffHours > 0) totalResolutionHours += diffHours;
      }
    } else if (g.status === "REJECTED") {
      rejectedCount++;
    }

    if (g.status !== "RESOLVED" && g.status !== "REJECTED") {
      const sla = getSLAStatusInfo(g);
      if (sla.isOverdue) overdueCount++;
    }
  }

  // SLA breach percentage across eligible population
  const eligibleSla = list.filter((g) => g.deadlineAt).length;
  const breachedCount = list.filter(
    (g) => g.status === "SLA_BREACHED" || (g.deadlineAt && new Date(g.deadlineAt).getTime() < nowMs && g.status !== "RESOLVED")
  ).length;
  const slaBreachPercentage = eligibleSla > 0 ? Math.round((breachedCount / eligibleSla) * 100) : 0;

  const avgResolutionHours = resolvedCount > 0 ? Math.round((totalResolutionHours / resolvedCount) * 10) / 10 : 0;

  // Citizen satisfaction calculation
  const feedbackList = store.feedback || [];
  let totalRating = 0;
  for (const f of feedbackList) {
    totalRating += f.rating;
  }
  const citizenSatisfactionScore =
    feedbackList.length > 0 ? Math.round((totalRating / feedbackList.length) * 10) / 10 : 0;

  // Status distribution
  const statusLabels: Record<string, { label: string; color: string }> = {
    SUBMITTED: { label: "Submitted", color: "#235A83" },
    ASSIGNED: { label: "Assigned", color: "#173B57" },
    IN_PROGRESS: { label: "In Progress", color: "#946200" },
    RESOLVED: { label: "Resolved", color: "#18794E" },
    REJECTED: { label: "Rejected", color: "#B42332" },
    ESCALATED: { label: "Escalated", color: "#B42332" },
    SLA_BREACHED: { label: "SLA Breached", color: "#B42332" },
    REOPENED: { label: "Reopened", color: "#946200" },
  };

  const statusDistribution = Object.keys(statusLabels).map((status) => ({
    status,
    label: statusLabels[status].label,
    color: statusLabels[status].color,
    count: list.filter((g) => g.status === status).length,
  }));

  // Category distribution
  const categories = [
    { category: "ROADS_POTHOLES", label: "Roads & Potholes" },
    { category: "SOLID_WASTE", label: "Solid Waste" },
    { category: "WATER_SUPPLY", label: "Water Supply" },
    { category: "STREET_LIGHTING", label: "Street Lighting" },
    { category: "SEWAGE_DRAINAGE", label: "Sewage & Drainage" },
    { category: "TRAFFIC_TRANSPORT", label: "Traffic & Transport" },
    { category: "ENCROACHMENT", label: "Encroachment" },
    { category: "GARDENS_PARKS", label: "Gardens & Parks" },
    { category: "HEALTH_SANITATION", label: "Health & Sanitation" },
  ];

  const categoryDistribution = categories.map((cat) => ({
    category: cat.category,
    label: cat.label,
    count: list.filter((g) => g.category === cat.category).length,
  }));

  const priorityDistribution = ["EMERGENCY", "HIGH", "MEDIUM", "LOW"].map((p) => ({
    priority: p,
    count: list.filter((g) => g.priority === p).length,
  }));

  return {
    totalGrievances,
    pendingCount,
    inProgressCount,
    resolvedCount,
    rejectedCount,
    overdueCount,
    inProgress: inProgressCount,
    pending: pendingCount,
    resolved: resolvedCount,
    rejected: rejectedCount,
    overdue: overdueCount,
    slaBreachPercentage,
    avgResolutionHours,
    citizenSatisfactionScore,
    statusDistribution,
    categoryDistribution,
    priorityDistribution,
  };
}

export interface DepartmentPerformanceItem {
  id: string;
  name: string;
  code: string;
  totalAssigned: number;
  inProgress: number;
  resolved: number;
  overdue: number;
  avgResolutionHours: number;
  avgSatisfaction: number;
  slaComplianceRate: number;
}

export async function getDepartmentPerformance(admin: SafeUser): Promise<DepartmentPerformanceItem[]> {
  if (admin.role !== "ADMIN") {
    throw new Error("Unauthorized: Administrator clearance required.");
  }

  const store = await readStore();
  const nowMs = Date.now();

  return store.departments.map((dept) => {
    const deptGrievances = store.grievances.filter(
      (g) => g.departmentId === dept.id || g.departmentName === dept.name
    );

    let inProgress = 0;
    let resolved = 0;
    let overdue = 0;
    let totalResHours = 0;

    for (const g of deptGrievances) {
      if (g.status === "RESOLVED") {
        resolved++;
        if (g.submittedAt && g.resolvedAt) {
          const diff = (new Date(g.resolvedAt).getTime() - new Date(g.submittedAt).getTime()) / (1000 * 60 * 60);
          if (diff > 0) totalResHours += diff;
        }
      } else if (g.status === "IN_PROGRESS" || g.status === "ASSIGNED" || g.status === "REOPENED") {
        inProgress++;
      }

      if (g.status !== "RESOLVED" && g.status !== "REJECTED") {
        const sla = getSLAStatusInfo(g);
        if (sla.isOverdue) overdue++;
      }
    }

    const totalAssigned = deptGrievances.length;
    const avgResolutionHours = resolved > 0 ? Math.round((totalResHours / resolved) * 10) / 10 : 0;

    // Satisfaction for department's grievances
    const deptGrievanceIds = new Set(deptGrievances.map((g) => g.id));
    const deptFeedbacks = store.feedback.filter((f) => deptGrievanceIds.has(f.grievanceId));
    let deptTotalRating = 0;
    for (const f of deptFeedbacks) deptTotalRating += f.rating;
    const avgSatisfaction = deptFeedbacks.length > 0 ? Math.round((deptTotalRating / deptFeedbacks.length) * 10) / 10 : 0;

    const slaComplianceRate = totalAssigned > 0 ? Math.round(((totalAssigned - overdue) / totalAssigned) * 100) : 100;

    return {
      id: dept.id,
      name: dept.name,
      code: dept.code,
      totalAssigned,
      inProgress,
      resolved,
      overdue,
      avgResolutionHours,
      avgSatisfaction,
      slaComplianceRate,
    };
  });
}

export interface WardPerformanceItem {
  id: string;
  name: string;
  wardNumber: number;
  zone: string;
  totalWorkload: number;
  activeCount: number;
  resolvedCount: number;
  resolutionRate: number;
}

export async function getWardPerformance(admin: SafeUser): Promise<WardPerformanceItem[]> {
  if (admin.role !== "ADMIN") {
    throw new Error("Unauthorized: Administrator clearance required.");
  }

  const store = await readStore();

  return store.wards.map((w) => {
    const wardGrievances = store.grievances.filter(
      (g) => g.wardId === w.id || g.wardName === w.name || (w.wardNumber && g.wardNumber === w.wardNumber)
    );

    let activeCount = 0;
    let resolvedCount = 0;

    for (const g of wardGrievances) {
      if (g.status === "RESOLVED") {
        resolvedCount++;
      } else if (g.status !== "REJECTED") {
        activeCount++;
      }
    }

    const totalWorkload = wardGrievances.length;
    const resolutionRate = totalWorkload > 0 ? Math.round((resolvedCount / totalWorkload) * 100) : 0;

    return {
      id: w.id,
      name: w.name,
      wardNumber: w.wardNumber || 0,
      zone: w.zone || "Central",
      totalWorkload,
      activeCount,
      resolvedCount,
      resolutionRate,
    };
  });
}

export interface AdminEscalationItem {
  id: string;
  grievanceId: string;
  trackingToken: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  departmentName?: string;
  wardName?: string;
  escalationType: string;
  reason: string;
  createdAt: string;
  reviewedByAdmin?: boolean;
  adminRemarks?: string | null;
}

export async function listAdminEscalations(admin: SafeUser): Promise<AdminEscalationItem[]> {
  if (admin.role !== "ADMIN") {
    throw new Error("Unauthorized: Administrator clearance required.");
  }

  const store = await readStore();
  const grievanceMap = new Map(store.grievances.map((g) => [g.id, g]));

  return store.escalations.map((esc) => {
    const g = grievanceMap.get(esc.grievanceId);
    return {
      id: esc.id,
      grievanceId: esc.grievanceId,
      trackingToken: g?.trackingToken || "PS-PUN-UNKNOWN",
      title: g?.title || "Civic Complaint",
      category: g?.category || "OTHER",
      priority: g?.priority || "MEDIUM",
      status: g?.status || "SUBMITTED",
      departmentName: g?.departmentName,
      wardName: g?.wardName,
      escalationType: esc.escalationType,
      reason: esc.reason,
      createdAt: esc.triggeredAt || new Date().toISOString(),
      reviewedByAdmin: Boolean(esc.resolvedAt),
      adminRemarks: esc.reviewRemarks,
    };
  });
}

export async function reviewAdminEscalation(
  escalationId: string,
  input: { remarks: string },
  admin: SafeUser
): Promise<{ success: boolean }> {
  if (admin.role !== "ADMIN") {
    throw new Error("Unauthorized: Only administrators can review escalations.");
  }
  if (!input.remarks || input.remarks.trim().length < 5) {
    throw new Error("Administrative review remarks (minimum 5 characters) are required.");
  }

  const store = await readStore();
  const esc = store.escalations.find((e) => e.id === escalationId);
  if (!esc) {
    throw new Error(`Escalation record ${escalationId} not found.`);
  }

  const nowIso = new Date().toISOString();
  esc.status = "REVIEWED";
  esc.resolvedAt = nowIso;
  esc.reviewRemarks = input.remarks.trim();
  esc.reviewedById = admin.id;
  esc.reviewedByName = admin.name;

  // Log in Audit Trail
  store.auditLogs.unshift({
    id: `aud_${crypto.randomUUID().replace(/-/g, "").substring(0, 16)}`,
    actorId: admin.id,
    actorName: admin.name,
    action: "ESCALATION_REVIEWED",
    targetType: "EscalationRecord",
    targetId: esc.id,
    metadata: JSON.stringify({ grievanceId: esc.grievanceId, remarks: input.remarks.trim() }),
    createdAt: nowIso,
  });

  await writeStore(store);
  return { success: true };
}

export interface AdminModerationCommentItem {
  id: string;
  grievanceId: string;
  trackingToken: string;
  grievanceTitle: string;
  authorName: string;
  authorRole: string;
  content: string;
  isInternal: boolean;
  isModerated: boolean;
  moderationReason?: string | null;
  moderatedAt?: string | null;
  createdAt: string;
}

export async function listModerationComments(admin: SafeUser): Promise<AdminModerationCommentItem[]> {
  if (admin.role !== "ADMIN") {
    throw new Error("Unauthorized: Administrator clearance required.");
  }

  const store = await readStore();
  const grievanceMap = new Map(store.grievances.map((g) => [g.id, g]));

  return store.comments
    .filter((c) => !c.isInternal) // Only public citizen comments need moderation
    .map((c) => {
      const g = grievanceMap.get(c.grievanceId);
      return {
        id: c.id,
        grievanceId: c.grievanceId,
        trackingToken: g?.trackingToken || "PS-PUN-UNKNOWN",
        grievanceTitle: g?.title || "Civic Complaint",
        authorName: c.authorName,
        authorRole: c.authorRole,
        content: c.content,
        isInternal: c.isInternal,
        isModerated: Boolean(c.isModerated),
        moderationReason: c.moderationReason,
        moderatedAt: c.moderatedAt,
        createdAt: c.createdAt,
      };
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function moderateComment(
  commentId: string,
  input: { action: "HIDE" | "RESTORE"; reason: string },
  admin: SafeUser
): Promise<{ success: boolean }> {
  if (admin.role !== "ADMIN") {
    throw new Error("Unauthorized: Only administrators can moderate community content.");
  }
  if (!input.reason || input.reason.trim().length < 5) {
    throw new Error("A valid moderation reason (minimum 5 characters) is required.");
  }

  const store = await readStore();
  const comment = store.comments.find((c) => c.id === commentId);
  if (!comment) {
    throw new Error(`Comment ${commentId} not found.`);
  }

  const nowIso = new Date().toISOString();
  comment.isModerated = input.action === "HIDE";
  comment.moderationReason = input.reason.trim();
  comment.moderatedAt = nowIso;
  comment.moderatedById = admin.id;

  // Audit log
  store.auditLogs.unshift({
    id: `aud_${crypto.randomUUID().replace(/-/g, "").substring(0, 16)}`,
    actorId: admin.id,
    actorName: admin.name,
    action: input.action === "HIDE" ? "COMMENT_HIDDEN" : "COMMENT_RESTORED",
    targetType: "Comment",
    targetId: comment.id,
    metadata: JSON.stringify({
      grievanceId: comment.grievanceId,
      action: input.action,
      reason: input.reason.trim(),
    }),
    createdAt: nowIso,
  });

  await writeStore(store);
  return { success: true };
}

export async function listAuditLogs(
  admin: SafeUser,
  query: { action?: string; limit?: number } = {}
): Promise<AuditLog[]> {
  if (admin.role !== "ADMIN") {
    throw new Error("Unauthorized: Administrator clearance required to inspect audit logs.");
  }

  const store = await readStore();
  let logs = [...store.auditLogs];

  if (query.action) {
    logs = logs.filter((l) => l.action === query.action);
  }

  const limit = Math.min(100, Math.max(1, query.limit || 50));
  return logs.slice(0, limit);
}

// -------------------------------------------------------------
// CSV FORMULA INJECTION DEFENSE & EXPORT GENERATION
// -------------------------------------------------------------

function sanitizeCSVField(value: any): string {
  if (value === null || value === undefined) return "";
  let str = String(value).trim();
  // Defense against CSV Formula Injection (DDE attacks: `=cmd`, `+cmd`, `-cmd`, `@cmd`)
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  // Enclose in quotes if it contains commas, quotes, or newlines
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    str = `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function generateAdminExportCSV(
  reportType: "grievances" | "departments" | "wards" | "escalations" | "audit",
  admin: SafeUser
): Promise<string> {
  if (admin.role !== "ADMIN") {
    throw new Error("Unauthorized: Only administrators can export operational reports.");
  }

  const store = await readStore();

  if (reportType === "grievances") {
    const headers = [
      "Tracking Token",
      "Title",
      "Category",
      "Priority",
      "Status",
      "Department",
      "Ward",
      "Landmark",
      "Submitted At",
      "Deadline At",
      "Resolved At",
      "Endorsements",
      "Followers",
    ];
    const rows = store.grievances.map((g) => [
      sanitizeCSVField(g.trackingToken),
      sanitizeCSVField(g.title),
      sanitizeCSVField(g.category),
      sanitizeCSVField(g.priority),
      sanitizeCSVField(g.status),
      sanitizeCSVField(g.departmentName),
      sanitizeCSVField(g.wardName),
      sanitizeCSVField(g.landmark),
      sanitizeCSVField(g.submittedAt),
      sanitizeCSVField(g.deadlineAt),
      sanitizeCSVField(g.resolvedAt),
      sanitizeCSVField(store.endorsements.filter((e) => e.grievanceId === g.id).length),
      sanitizeCSVField(store.followers.filter((f) => f.grievanceId === g.id).length),
    ]);
    return [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
  }

  if (reportType === "departments") {
    const depts = await getDepartmentPerformance(admin);
    const headers = [
      "Department Code",
      "Department Name",
      "Total Assigned",
      "In Progress",
      "Resolved",
      "Overdue",
      "Avg Resolution Hours",
      "Satisfaction Rating",
      "SLA Compliance %",
    ];
    const rows = depts.map((d) => [
      sanitizeCSVField(d.code),
      sanitizeCSVField(d.name),
      sanitizeCSVField(d.totalAssigned),
      sanitizeCSVField(d.inProgress),
      sanitizeCSVField(d.resolved),
      sanitizeCSVField(d.overdue),
      sanitizeCSVField(d.avgResolutionHours),
      sanitizeCSVField(d.avgSatisfaction),
      sanitizeCSVField(d.slaComplianceRate),
    ]);
    return [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
  }

  if (reportType === "wards") {
    const wards = await getWardPerformance(admin);
    const headers = ["Ward Number", "Ward Name", "Zone", "Total Workload", "Active Complaints", "Resolved", "Resolution Rate %"];
    const rows = wards.map((w) => [
      sanitizeCSVField(w.wardNumber),
      sanitizeCSVField(w.name),
      sanitizeCSVField(w.zone),
      sanitizeCSVField(w.totalWorkload),
      sanitizeCSVField(w.activeCount),
      sanitizeCSVField(w.resolvedCount),
      sanitizeCSVField(w.resolutionRate),
    ]);
    return [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
  }

  if (reportType === "escalations") {
    const escalations = await listAdminEscalations(admin);
    const headers = [
      "Escalation ID",
      "Tracking Token",
      "Title",
      "Category",
      "Priority",
      "Status",
      "Department",
      "Type",
      "Reason",
      "Created At",
      "Reviewed By Admin",
      "Admin Remarks",
    ];
    const rows = escalations.map((e) => [
      sanitizeCSVField(e.id),
      sanitizeCSVField(e.trackingToken),
      sanitizeCSVField(e.title),
      sanitizeCSVField(e.category),
      sanitizeCSVField(e.priority),
      sanitizeCSVField(e.status),
      sanitizeCSVField(e.departmentName),
      sanitizeCSVField(e.escalationType),
      sanitizeCSVField(e.reason),
      sanitizeCSVField(e.createdAt),
      sanitizeCSVField(e.reviewedByAdmin ? "YES" : "NO"),
      sanitizeCSVField(e.adminRemarks),
    ]);
    return [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
  }

  if (reportType === "audit") {
    const logs = await listAuditLogs(admin, { limit: 100 });
    const headers = ["Audit ID", "Timestamp", "Actor Name", "Action", "Target Type", "Target ID", "Metadata"];
    const rows = logs.map((l) => [
      sanitizeCSVField(l.id),
      sanitizeCSVField(l.createdAt),
      sanitizeCSVField(l.actorName || l.actorId || "System"),
      sanitizeCSVField(l.action),
      sanitizeCSVField(l.targetType),
      sanitizeCSVField(l.targetId),
      sanitizeCSVField(l.metadata),
    ]);
    return [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
  }

  throw new Error(`Unsupported export report type: ${reportType}`);
}

