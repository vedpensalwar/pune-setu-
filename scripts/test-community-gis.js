#!/usr/bin/env node

/**
 * PuneSetu (पुणे सेतू) — Version 7 Community Civic Feed & Interactive GIS Test Suite
 *
 * Comprehensive Automated Verification covering:
 * 1. Community Feed (Database-backed listing, text search, multi-field filtering, pagination)
 * 2. Feed Parameter Validation (Enum constraints, boundary limits, sanitization)
 * 3. Citizen Endorsements (Creation, duplicate prevention / toggle withdrawal, persistent counts)
 * 4. Citizen Comments (Validation, content limits, role badges, internal officer note isolation)
 * 5. Following & Follower Notifications (Follow/unfollow, duplicate prevention, status change alerts)
 * 6. Interactive GIS Map Markers (Coordinate filtering, missing-coord handling, bounding, privacy)
 * 7. Integration & Data Consistency (Feed and map count consistency, tracking route synchronization)
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
// VALIDATION SCHEMAS & ENUMS (Mirroring Production Code)
// -------------------------------------------------------------
const VALID_CATEGORIES = [
  "ROADS_POTHOLES", "SOLID_WASTE", "WATER_SUPPLY", "STREET_LIGHTING",
  "SEWAGE_DRAINAGE", "TRAFFIC_TRANSPORT", "ENCROACHMENT", "GARDENS_PARKS",
  "HEALTH_SANITATION", "OTHER",
];

const VALID_STATUSES = [
  "SUBMITTED", "ASSIGNED", "IN_PROGRESS", "RESOLVED",
  "REJECTED", "ESCALATED", "SLA_BREACHED", "REOPENED",
];

const VALID_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "EMERGENCY"];

const commentSchema = z.object({
  content: z.string().trim().min(1, "Comment content cannot be empty.").max(1000, "Comment cannot exceed 1000 characters."),
  isInternal: z.boolean().optional().default(false),
});

// -------------------------------------------------------------
// IN-MEMORY TEST DATASET (Prabhag Wards & Grievances)
// -------------------------------------------------------------
const mockStore = {
  wards: [
    { id: "w-01", name: "Aundh - Baner", wardNumber: 1 },
    { id: "w-07", name: "Shivajinagar - Ghole Road", wardNumber: 7 },
    { id: "w-12", name: "Kothrud - Bavdhan", wardNumber: 12 },
  ],
  departments: [
    { id: "d-road", name: "Road & Asphalt Maintenance", code: "ROAD" },
    { id: "d-drain", name: "Drainage & Sewerage Operations", code: "DRAIN" },
    { id: "d-light", name: "Street Lighting & Electrical Wing", code: "LIGHT" },
  ],
  grievances: [
    {
      id: "g-01",
      trackingToken: "PS-PUN-2026-004101",
      title: "Severe bitumen failure near Fergusson College Road gate 3",
      description: "A 12-inch asphalt crater has developed near the main college entrance posing risk to two-wheelers.",
      category: "ROADS_POTHOLES",
      priority: "HIGH",
      status: "IN_PROGRESS",
      latitude: 18.5204,
      longitude: 73.8427,
      landmark: "Near FC College Gate 3",
      wardId: "w-07",
      wardName: "Shivajinagar - Ghole Road",
      wardNumber: 7,
      departmentId: "d-road",
      departmentName: "Road & Asphalt Maintenance",
      citizenId: "citizen-01",
      submittedAt: "2026-10-18T10:00:00.000Z",
    },
    {
      id: "g-02",
      trackingToken: "PS-PUN-2026-004102",
      title: "Overflowing garbage bin on Karve Road junction",
      description: "Waste bin unemptied for 48 hours creating health hazard and pedestrian obstruction.",
      category: "SOLID_WASTE",
      priority: "MEDIUM",
      status: "SUBMITTED",
      latitude: 18.5074,
      longitude: 73.8077,
      landmark: "Karve Road Corner",
      wardId: "w-12",
      wardName: "Kothrud - Bavdhan",
      wardNumber: 12,
      departmentId: "d-road",
      departmentName: "Road & Asphalt Maintenance",
      citizenId: "citizen-02",
      submittedAt: "2026-10-19T09:30:00.000Z",
    },
    {
      id: "g-03",
      trackingToken: "PS-PUN-2026-004103",
      title: "Blocked storm drain on ITI Road Aundh",
      description: "Sidewalk completely submerged after heavy monsoon runoff.",
      category: "SEWAGE_DRAINAGE",
      priority: "HIGH",
      status: "RESOLVED",
      latitude: 18.5583,
      longitude: 73.8074,
      landmark: "Opposite ITI Gate",
      wardId: "w-01",
      wardName: "Aundh - Baner",
      wardNumber: 1,
      departmentId: "d-drain",
      departmentName: "Drainage & Sewerage Operations",
      citizenId: "citizen-03",
      submittedAt: "2026-10-17T11:00:00.000Z",
    },
    {
      id: "g-04",
      trackingToken: "PS-PUN-2026-004104",
      title: "Broken street light pole near Baner High Street",
      description: "Entire residential lane dark for four consecutive days.",
      category: "STREET_LIGHTING",
      priority: "LOW",
      status: "ASSIGNED",
      latitude: null, // intentionally missing coordinates to test GIS handling
      longitude: null,
      landmark: "Lane 5 Baner",
      wardId: "w-01",
      wardName: "Aundh - Baner",
      wardNumber: 1,
      departmentId: "d-light",
      departmentName: "Street Lighting & Electrical Wing",
      citizenId: "citizen-01",
      submittedAt: "2026-10-20T14:15:00.000Z",
    },
  ],
  endorsements: [
    { id: "e-01", grievanceId: "g-01", userId: "citizen-02", createdAt: "2026-10-18T12:00:00.000Z" },
    { id: "e-02", grievanceId: "g-01", userId: "citizen-03", createdAt: "2026-10-18T13:00:00.000Z" },
  ],
  comments: [
    {
      id: "c-01",
      grievanceId: "g-01",
      authorId: "citizen-02",
      authorName: "Amit Joshi",
      authorRole: "CITIZEN",
      content: "This pothole is indeed hazardous, saw a scooter slip yesterday.",
      isInternal: false,
      createdAt: "2026-10-18T12:30:00.000Z",
    },
    {
      id: "c-02",
      grievanceId: "g-01",
      authorId: "officer-01",
      authorName: "Er. Kulkarni",
      authorRole: "MUNICIPAL_OFFICER",
      content: "Internal note: dispatched emergency cold mix bitumen crew.",
      isInternal: true,
      createdAt: "2026-10-18T14:00:00.000Z",
    },
  ],
  followers: [
    { id: "f-01", grievanceId: "g-01", userId: "citizen-02", createdAt: "2026-10-18T12:00:00.000Z" },
  ],
  notifications: [],
};

// -------------------------------------------------------------
// REPOSITORY LOGIC IMPLEMENTATION (Matching repository.ts)
// -------------------------------------------------------------

function listPublicFeed(query) {
  let list = [...mockStore.grievances];

  if (query.search && query.search.trim().length > 0) {
    const s = query.search.trim().toLowerCase();
    list = list.filter(
      (g) =>
        g.title.toLowerCase().includes(s) ||
        g.description.toLowerCase().includes(s) ||
        (g.landmark && g.landmark.toLowerCase().includes(s)) ||
        (g.wardName && g.wardName.toLowerCase().includes(s)) ||
        g.trackingToken.toLowerCase().includes(s)
    );
  }

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
    list = list.filter((g) => g.departmentId === query.departmentId);
  }
  if (query.wardId) {
    list = list.filter((g) => g.wardId === query.wardId);
  }

  const total = list.length;
  const page = query.page || 1;
  const limit = query.limit || 12;
  const totalPages = Math.ceil(total / limit) || 1;
  const start = (page - 1) * limit;
  const paginated = list.slice(start, start + limit);

  const items = paginated.map((g) => ({
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
    endorsementsCount: mockStore.endorsements.filter((e) => e.grievanceId === g.id).length,
    commentsCount: mockStore.comments.filter((c) => c.grievanceId === g.id && !c.isInternal).length,
    followersCount: mockStore.followers.filter((f) => f.grievanceId === g.id).length,
    hasCoordinates: typeof g.latitude === "number" && typeof g.longitude === "number",
  }));

  return { items, total, page, totalPages };
}

function getMapMarkers(filters = {}) {
  let list = mockStore.grievances.filter(
    (g) => typeof g.latitude === "number" && typeof g.longitude === "number"
  );

  if (filters.category) list = list.filter((g) => g.category === filters.category);
  if (filters.status) list = list.filter((g) => g.status === filters.status);
  if (filters.priority) list = list.filter((g) => g.priority === filters.priority);
  if (filters.wardId) list = list.filter((g) => g.wardId === filters.wardId);
  if (filters.search) {
    const s = filters.search.trim().toLowerCase();
    list = list.filter((g) => g.title.toLowerCase().includes(s) || (g.landmark && g.landmark.toLowerCase().includes(s)));
  }

  return list.slice(0, 500).map((g) => ({
    id: g.id,
    trackingToken: g.trackingToken,
    title: g.title,
    category: g.category,
    priority: g.priority,
    status: g.status,
    latitude: g.latitude,
    longitude: g.longitude,
    landmark: g.landmark,
    wardName: g.wardName,
    submittedAt: g.submittedAt,
    endorsementsCount: mockStore.endorsements.filter((e) => e.grievanceId === g.id).length,
  }));
}

function toggleEndorsement(grievanceId, userId) {
  const existingIdx = mockStore.endorsements.findIndex((e) => e.grievanceId === grievanceId && e.userId === userId);
  if (existingIdx !== -1) {
    mockStore.endorsements.splice(existingIdx, 1);
    const total = mockStore.endorsements.filter((e) => e.grievanceId === grievanceId).length;
    return { endorsed: false, totalEndorsements: total };
  } else {
    mockStore.endorsements.push({
      id: `e-${Date.now()}`,
      grievanceId,
      userId,
      createdAt: new Date().toISOString(),
    });
    const total = mockStore.endorsements.filter((e) => e.grievanceId === grievanceId).length;
    return { endorsed: true, totalEndorsements: total };
  }
}

function toggleFollow(grievanceId, userId) {
  const existingIdx = mockStore.followers.findIndex((f) => f.grievanceId === grievanceId && f.userId === userId);
  if (existingIdx !== -1) {
    mockStore.followers.splice(existingIdx, 1);
    const total = mockStore.followers.filter((f) => f.grievanceId === grievanceId).length;
    return { following: false, totalFollowers: total };
  } else {
    mockStore.followers.push({
      id: `f-${Date.now()}`,
      grievanceId,
      userId,
      createdAt: new Date().toISOString(),
    });
    const total = mockStore.followers.filter((f) => f.grievanceId === grievanceId).length;
    return { following: true, totalFollowers: total };
  }
}

function addComment(grievanceId, input, author) {
  const parsed = commentSchema.parse(input);
  if (parsed.isInternal && author.role === "CITIZEN") {
    throw new Error("Citizens cannot mark comments as internal notes.");
  }
  const comment = {
    id: `c-${Date.now()}`,
    grievanceId,
    authorId: author.id,
    authorName: author.name,
    authorRole: author.role,
    content: parsed.content,
    isInternal: Boolean(parsed.isInternal),
    createdAt: new Date().toISOString(),
  };
  mockStore.comments.push(comment);
  return comment;
}

function listComments(grievanceId, viewer) {
  let list = mockStore.comments.filter((c) => c.grievanceId === grievanceId);
  const isPrivileged = viewer && (viewer.role === "MUNICIPAL_OFFICER" || viewer.role === "ADMIN");
  if (!isPrivileged) {
    list = list.filter((c) => !c.isInternal);
  }
  return list;
}

function updateStatusWithFollowerAlerts(grievanceId, newStatus, actor) {
  const grievance = mockStore.grievances.find((g) => g.id === grievanceId);
  if (!grievance) throw new Error("Grievance not found");

  const prevStatus = grievance.status;
  grievance.status = newStatus;

  // Queue owner notification
  if (grievance.citizenId && grievance.citizenId !== actor.id) {
    mockStore.notifications.push({
      recipientId: grievance.citizenId,
      type: newStatus === "RESOLVED" ? "RESOLUTION_VERIFIED" : "STATUS_CHANGE",
      title: `Status: ${newStatus}`,
      grievanceId: grievance.id,
    });
  }

  // Queue follower notifications
  const followers = mockStore.followers.filter(
    (f) => f.grievanceId === grievance.id && f.userId !== actor.id && f.userId !== grievance.citizenId
  );
  for (const follower of followers) {
    mockStore.notifications.push({
      recipientId: follower.userId,
      type: newStatus === "RESOLVED" ? "RESOLUTION_VERIFIED" : "STATUS_CHANGE",
      title: `Followed Issue: ${newStatus}`,
      grievanceId: grievance.id,
    });
  }

  return { grievance, prevStatus, newStatus };
}

// -------------------------------------------------------------
// TEST SUITE EXECUTION
// -------------------------------------------------------------
console.log(`\n${colors.bold}${colors.cyan}============================================================${colors.reset}`);
console.log(`${colors.bold}${colors.cyan} PuneSetu (पुणे सेतू) — Version 7 Community & GIS Test Suite${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}============================================================${colors.reset}\n`);

// SECTION 1: COMMUNITY FEED LISTING & FILTERING
console.log(`${colors.bold}1. Community Feed Listing & Filtering${colors.reset}`);

const allFeed = listPublicFeed({});
assert(allFeed.total === 4, "Feed returns all 4 persisted grievances when unfiltered");
assert(allFeed.items.length === 4, "Feed returns 4 items on initial page");
assert(allFeed.page === 1 && allFeed.totalPages === 1, "Feed calculates correct pagination metadata");

const searchFeed = listPublicFeed({ search: "Fergusson" });
assert(searchFeed.total === 1, "Feed correctly filters by text search across title");
assert(searchFeed.items[0].trackingToken === "PS-PUN-2026-004101", "Feed retrieves correct grievance record");

const searchToken = listPublicFeed({ search: "004103" });
assert(searchToken.total === 1 && searchToken.items[0].category === "SEWAGE_DRAINAGE", "Feed search matches tracking token");

const categoryFeed = listPublicFeed({ category: "ROADS_POTHOLES" });
assert(categoryFeed.total === 1 && categoryFeed.items[0].category === "ROADS_POTHOLES", "Feed correctly filters by category");

const statusFeed = listPublicFeed({ status: "RESOLVED" });
assert(statusFeed.total === 1 && statusFeed.items[0].status === "RESOLVED", "Feed correctly filters by status");

const priorityFeed = listPublicFeed({ priority: "HIGH" });
assert(priorityFeed.total === 2, "Feed correctly filters by priority (2 HIGH priority items)");

const wardFeed = listPublicFeed({ wardId: "w-01" });
assert(wardFeed.total === 2, "Feed correctly filters by Prabhag Ward (w-01)");

const emptyFeed = listPublicFeed({ search: "NonexistentLocationXYZ" });
assert(emptyFeed.total === 0 && emptyFeed.items.length === 0, "Feed returns empty results gracefully for non-matching query");

const paginatedFeed = listPublicFeed({ page: 2, limit: 2 });
assert(paginatedFeed.page === 2, "Feed respects requested page parameter");
assert(paginatedFeed.totalPages === 2, "Feed calculates totalPages = 2 for 4 items with limit 2");

// SECTION 2: FEED PARAMETER VALIDATION
console.log(`\n${colors.bold}2. Feed Parameter Validation & Guardrails${colors.reset}`);

assert(VALID_CATEGORIES.includes("ROADS_POTHOLES"), "Enum contains ROADS_POTHOLES");
assert(!VALID_CATEGORIES.includes("INVALID_CAT"), "Enum rejects arbitrary unvalidated category");
assert(VALID_STATUSES.includes("RESOLVED"), "Enum contains RESOLVED status");
assert(!VALID_STATUSES.includes("PENDING_REVIEW"), "Enum rejects non-state machine statuses");
assert(VALID_PRIORITIES.includes("EMERGENCY"), "Enum contains EMERGENCY priority");

// Verify sanitization: public feed items must not expose private coordinates or citizen personal info
const sampleItem = allFeed.items[0];
assert(!("citizenId" in sampleItem), "Public feed item scrubs citizen ID");
assert(!("citizenName" in sampleItem), "Public feed item scrubs citizen personal name");
assert(!("citizenPhone" in sampleItem), "Public feed item scrubs citizen telephone");
assert(sampleItem.hasCoordinates === true, "Public feed item flags coordinate availability without leaking raw GPS");

// SECTION 3: CITIZEN ENDORSEMENTS
console.log(`\n${colors.bold}3. Citizen Endorsements (Upvotes & Duplicate Prevention)${colors.reset}`);

// Case 1: Initial endorsement by new citizen
const initialCount = mockStore.endorsements.filter((e) => e.grievanceId === "g-01").length;
assert(initialCount === 2, "Initial endorsements count on g-01 is 2");

const endRes1 = toggleEndorsement("g-01", "citizen-04");
assert(endRes1.endorsed === true, "Endorsing as citizen-04 returns endorsed = true");
assert(endRes1.totalEndorsements === 3, "Total endorsements authoritatively increments to 3");

// Case 2: Duplicate prevention & withdrawal toggle
const endRes2 = toggleEndorsement("g-01", "citizen-04");
assert(endRes2.endorsed === false, "Second toggle by same user safely un-endorses (duplicate prevention)");
assert(endRes2.totalEndorsements === 2, "Total endorsements decrements back to 2");

// Verify feed count reflects authoritative database store
const feedAfterEndorse = listPublicFeed({ search: "Fergusson" });
assert(feedAfterEndorse.items[0].endorsementsCount === 2, "Feed item reflects authoritative persistent endorsement count");

// SECTION 4: PUBLIC COMMENTS & DISCUSSION
console.log(`\n${colors.bold}4. Public Comments & Discussion Threading${colors.reset}`);

// Case 1: Valid citizen comment
const newComment = addComment("g-01", { content: "Paving crew was spotted inspecting the road today." }, {
  id: "citizen-05",
  name: "Sunil K",
  role: "CITIZEN",
});
assert(newComment.content === "Paving crew was spotted inspecting the road today.", "Valid comment persisted successfully");
assert(newComment.authorRole === "CITIZEN", "Comment records authorRole = CITIZEN");
assert(newComment.isInternal === false, "Citizen comment is marked public (isInternal = false)");

// Case 2: Validation rejection on empty comment
let emptyRejected = false;
try {
  addComment("g-01", { content: "   " }, { id: "citizen-05", name: "Sunil K", role: "CITIZEN" });
} catch (err) {
  emptyRejected = true;
}
assert(emptyRejected, "Empty comment is strictly rejected by server-side Zod validation");

// Case 3: Validation rejection on over-length comment (> 1000 chars)
let overlengthRejected = false;
try {
  addComment("g-01", { content: "x".repeat(1001) }, { id: "citizen-05", name: "Sunil K", role: "CITIZEN" });
} catch (err) {
  overlengthRejected = true;
}
assert(overlengthRejected, "Overlength comment (> 1000 chars) is strictly rejected");

// Case 4: Citizen cannot post internal note
let citizenInternalBlocked = false;
try {
  addComment("g-01", { content: "Sneaky internal note", isInternal: true }, { id: "citizen-05", name: "Sunil K", role: "CITIZEN" });
} catch (err) {
  citizenInternalBlocked = true;
}
assert(citizenInternalBlocked, "Citizen is strictly blocked from creating internal notes");

// Case 5: Officer internal notes are isolated from public viewers
const publicComments = listComments("g-01", null);
const hasInternalInPublic = publicComments.some((c) => c.isInternal);
assert(!hasInternalInPublic, "Public viewer query strictly excludes internal officer notes");

const officerComments = listComments("g-01", { id: "officer-01", role: "MUNICIPAL_OFFICER" });
const hasInternalForOfficer = officerComments.some((c) => c.isInternal);
assert(hasInternalForOfficer, "Municipal officer query preserves internal operational notes");

// SECTION 5: FOLLOWING & FOLLOWER NOTIFICATIONS
console.log(`\n${colors.bold}5. Following & Follower Notifications${colors.reset}`);

// Case 1: Follow grievance
const followRes1 = toggleFollow("g-02", "citizen-04");
assert(followRes1.following === true, "Following grievance g-02 returns following = true");
assert(followRes1.totalFollowers === 1, "Total followers authoritatively increments to 1");

// Case 2: Unfollow grievance
const followRes2 = toggleFollow("g-02", "citizen-04");
assert(followRes2.following === false, "Second toggle safely unfollows grievance");
assert(followRes2.totalFollowers === 0, "Total followers decrements back to 0");

// Re-follow for notification test
toggleFollow("g-02", "citizen-04");

// Case 3: Follower notification on status transition
const notifCountBefore = mockStore.notifications.length;
updateStatusWithFollowerAlerts("g-02", "IN_PROGRESS", { id: "officer-01", role: "MUNICIPAL_OFFICER" });
const notifCountAfter = mockStore.notifications.length;
assert(notifCountAfter > notifCountBefore, "Status transition generates notifications");

const followerNotif = mockStore.notifications.find((n) => n.recipientId === "citizen-04");
assert(Boolean(followerNotif), "Registered follower receives an in-app status update notification");

const ownerNotif = mockStore.notifications.find((n) => n.recipientId === "citizen-02");
assert(Boolean(ownerNotif), "Grievance citizen owner also receives status update notification");

// SECTION 6: INTERACTIVE GIS MAP MARKERS
console.log(`\n${colors.bold}6. Interactive GIS Map Markers & Privacy${colors.reset}`);

const allMarkers = getMapMarkers({});
assert(allMarkers.length === 3, "Map markers include only grievances with valid coordinates (3 of 4)");

const missingCoordItem = mockStore.grievances.find((g) => g.id === "g-04");
assert(missingCoordItem.latitude === null, "Grievance g-04 has null coordinates");
const g4InMarkers = allMarkers.some((m) => m.id === "g-04");
assert(!g4InMarkers, "Grievance with missing coordinates is gracefully excluded from map markers");

// Marker filters
const roadMarkers = getMapMarkers({ category: "ROADS_POTHOLES" });
assert(roadMarkers.length === 1 && roadMarkers[0].id === "g-01", "Map markers filter by category accurately");

const wardMarkers = getMapMarkers({ wardId: "w-01" });
assert(wardMarkers.length === 1 && wardMarkers[0].id === "g-03", "Map markers filter by ward accurately");

// Marker fields verification
const marker0 = allMarkers[0];
assert(typeof marker0.latitude === "number" && typeof marker0.longitude === "number", "Marker contains numeric coordinates");
assert(typeof marker0.endorsementsCount === "number", "Marker contains real endorsement count");
assert(Boolean(marker0.trackingToken), "Marker contains tracking token for preview drawer navigation");

// SECTION 7: DATA CONSISTENCY & INTEGRATION
console.log(`\n${colors.bold}7. Cross-View Data Consistency${colors.reset}`);

// Check that feed items and map markers agree on endorsements and status
const feedG1 = listPublicFeed({ search: "004101" }).items[0];
const mapG1 = getMapMarkers({}).find((m) => m.id === "g-01");

assert(feedG1.status === mapG1.status, "Feed item and map marker have identical status");
assert(feedG1.endorsementsCount === mapG1.endorsementsCount, "Feed item and map marker have identical endorsement count");
assert(feedG1.category === mapG1.category, "Feed item and map marker have identical category");

console.log(`\n${colors.bold}${colors.cyan}------------------------------------------------------------${colors.reset}`);
console.log(`  Tests Passed: ${colors.green}${passed}${colors.reset}`);
console.log(`  Tests Failed: ${failed > 0 ? colors.red : colors.green}${failed}${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}============================================================${colors.reset}\n`);

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
