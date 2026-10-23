# PuneSetu (पुणे सेतू)

> **Connecting Citizens. Empowering Communities. Improving Pune.**  
> Civic Grievance Redressal & Municipal Operations Platform for Pune, Maharashtra  
> Built for *Neighborhood Hacks 2026*

---

## Overview

PuneSetu is an enterprise-grade civic technology platform connecting citizens of Pune with the Pune Municipal Corporation (PMC). It provides end-to-end transparency, role-based workflows for municipal officers, and civic redressal tracking across Pune's 15 administrative Prabhag ward offices.

---

## Current Release: Version 21 (Complete System Integration & Quality Assurance)

Version 21 establishes PuneSetu as a fully integrated, audited, end-to-end verified civic redressal and municipal operations platform across all citizen, municipal officer, and administrator workflows:

1. **Multilingual Architecture (`en`, `mr`, `hi`):**
   - 100% translation key parity across English, Marathi (मराठी), and Hindi (हिंदी).
   - Devanagari typography hierarchy (`--font-devanagari` / Noto Sans Devanagari) active on Marathi and Hindi views.
   - Header dropdown language switcher with instant reactive translation and persistent storage (`punesetu_language_pref`).
2. **Citizen Charter & Civic Rights (`/services/charter`):**
   - Grounded in the Maharashtra Right to Public Services Act, 2015 (RTS Act) with notified service timelines and appellate officer hierarchy.
   - Clear distinction between statutory notified services and PuneSetu internal SLA targets.
3. **Searchable Ward Directory (`/services/wards`):**
   - Verified directory of all 15 Pune Municipal Corporation (PMC) Prabhag Ward Offices with exact addresses, Assistant Municipal Commissioners, and phone numbers.
4. **Verified Emergency Contacts (`/services/emergency`):**
   - 11 verified emergency, disaster, municipal helpline (1800-1030-222), and utility numbers with click-to-call `tel:` links and official provenance.
5. **E-Tapaal File Movement Tracker (`/services/etapaal`):**
   - Interactive tracking of internal correspondence and file movement with clear pre-integration demonstration disclosure and honest 404 for non-existent records.
6. **Civic Knowledge Assistant (`/services/assistant`):**
   - Zero-hallucination semantic civic assistant grounded in verified municipal datasets, RTS statutory timelines, and redressal rules.
7. **Accessibility & Speech:**
   - Web Speech Synthesis audio dossier readout on Charter and Emergency Contacts, strict keyboard focus rings, and full Light/Dark/High-Contrast theme support.

---

## Prior Release: Version 8 (Municipal Officer Portal & Administrator Command Center)

1. **Municipal Officer Workspace (`/officer/dashboard`):**
   - Department-scoped operational queue displaying assigned civic grievances filtered by authenticated officer's jurisdiction (`Roads & Traffic Maintenance`, etc.).
   - Operational KPIs: Assigned complaints, in-progress cases, near-deadline cases (<48h remaining), overdue cases, and resolved cases.
   - Urgency indicators with visual countdown tags for cases approaching resolution deadline.
   - Multi-attribute operational queue filters: Search across title and tracking tokens, status dropdown, priority filter, ward filter, and fast urgency checkboxes (`Near Deadline`, `Overdue Only`).
   - Permitted Status Lifecycle Updates Modal: Transitions grievances to `IN_PROGRESS`, `RESOLVED`, or `REJECTED`. Enforces mandatory resolution photo + 10-char closing remarks for `RESOLVED`, and formal 10-char justification for `REJECTED`.
   - Case Reassignment Modal: Reassigns misrouted complaints to any of the 8 PMC engineering departments with mandatory formal justification, status history progression, and audit recording.
   - Progress & Field Notes Modal: Adds internal operational notes without exposing private details to the public citizen feed.
2. **Administrator Command Center (`/admin/dashboard`):**
   - Distinct oversight workspace with 7 dedicated governance tabs:
     - **Overview & Analytics:** Real database aggregations for Total Complaints, Active Remediation, Resolved Cases (with SLA compliance %), Overdue Breaches (with SLA breach rate %), Average Resolution Velocity (hours), and Citizen Satisfaction Score (1-5 rating with verified feedback counts). Includes visual workload distribution bars for Status, Category, and Priority.
     - **Department Benchmarks:** Performance comparison table across all 8 PMC engineering departments (Assigned, In Progress, Resolved, Overdue, Avg Resolution Time, SLA Compliance %, Citizen Rating).
     - **Ward Workloads:** Workload and resolution rates across all 15 Pune Prabhag administrative wards with Zone filtering (Central, East, West, North, South).
     - **Escalation Desk:** SLA breach and citizen procedural appeals queue with modal for recording administrative review remarks and tracking reviewer identity.
     - **Community Content Moderation:** Live queue for public comments with 1-click Hide/Restore actions, mandatory moderation reason input, and public view scrubbing.
     - **Audit Trail:** Searchable security ledger recording actor identity, action type, target IDs, and structured transition context.
     - **Data Exports (CSV):** Five RFC 4180 CSV export actions (Grievances Register, Department Performance, Ward Workload Summary, Escalations & SLA Breaches, System Audit Log) with OWASP Formula Injection defense (`=`, `+`, `-`, `@`, `\t`, `\r` escaped).
3. **Preserved Citizen Experience:**
   - 5-step submission wizard (`/grievances/new`), tracking dossier (`/track/[token]`), community feed (`/community`), and interactive GIS map (`/map`).


---

## Getting Started

### Prerequisites

- **Node.js:** v18.18+ (tested on Node v24)
- **Package Manager:** `npm`
- **PostgreSQL (Optional for production):** v14+

### Installation

```bash
# Clone or navigate to the repository
cd "siddhi ssp project"

# Install dependencies
npm install
```

### Environment Configuration

Copy the example environment configuration:

```bash
cp .env.example .env.local
```

Required variables:

```env
# Session secret (min 32 characters in production)
SESSION_SECRET="your-32-character-secret-key-for-punesetu"

# Database URL (PostgreSQL)
DATABASE_URL="postgresql://postgres:password@localhost:5432/punesetu?schema=public"

# Admin Provisioning (optional defaults)
ADMIN_EMAIL="admin@punesetu.gov.in"
ADMIN_PASSWORD="SecureAdminPassword@2026"
ADMIN_NAME="PMC Central Administrator"
```

---

## Database Management & Migrations

### 1. Validate Prisma Schema
```bash
npx prisma validate
```

### 2. Generate Prisma Client
```bash
npx prisma generate
```

### 3. Apply Migrations to PostgreSQL
```bash
npx prisma migrate deploy
```

### 4. Zero-Config Local Development Mode
If running without a PostgreSQL instance, PuneSetu automatically uses its atomic file-backed data store (`data/punesetu-civic-store.json`), seeded with all 15 Pune Prabhag wards and 8 municipal departments.

---

## Running the Application

### Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

### Production Build
```bash
# Compile optimized production bundle
npm run build

# Start production server
npm run start
```

---

## Testing & Quality Assurance
 
### 1. Run the Submission Wizard Test Suite
Runs the 39-point verification suite covering file upload validation, MIME whitelisting, Haversine 500m duplicate detection, multi-step submission, atomic persistence, and receipt generation:
```bash
npm run test:wizard
```

### 2. Run the Backend & Database Test Suite
Runs the 68-point verification suite covering Prisma schema, migration consistency, tracking tokens, geographic bounds, RBAC status transitions, SLA calculations, duplicate prevention, and privacy masking:
```bash
npm run test:backend
```

### 1. Run the Version 8 Operational Verification Test Suite
Runs the 43-point verification suite covering officer workspace, department isolation, reassignment, status updates, admin analytics, department/ward benchmarks, escalation desk, moderation, CSV formula defense, and audit logging:
```bash
npm run test:v8
```

### 2. Run the Community Feed & Interactive GIS Test Suite
Runs the 54-point verification suite covering feed filters, endorsements, comments, following, and GIS map markers:
```bash
npm run test:community
```

### 3. Run the Version 9 Civic Services & Localization Test Suite
Runs the 126-point verification suite covering EN/MR/HI translation key parity, language persistence, Devanagari typography, Citizen Charter notified statutory timelines, all 15 PMC Prabhag Wards, 11 emergency contacts with `tel:` links, E-Tapaal file movement tracker with authentic demonstration records and 404 handling, zero-hallucination semantic civic assistant, and accessibility checks:
```bash
npm run test:v9
```

### 4. Run the Version 9 Independent Post-Implementation Review Suite
Runs the 156-point exhaustive verification suite covering all 51 criteria of the Version 9 specification including complete EN/MR/HI key parity, pre-hydration script, Maharashtra RTS statutory timelines, 15 PMC Prabhags, emergency `tel:` links, E-Tapaal demonstration boundaries, and grounded assistant safety:
```bash
npm run test:review:v9
```

### 3. Run the Lifecycle, Tracking & SLA Test Suite
Runs the 77-point verification suite covering token validation, public/private boundary, lifecycle transitions, resolution photo + remarks check, rejection justification, 21-day SLA calculation, live countdown evaluation, overdue cron idempotency, citizen escalation, satisfaction feedback, TTS text generation, notifications, and audit logging:
```bash
npm run test:lifecycle
```

### 4. Run the Submission Wizard Test Suite
Runs the 53-point verification suite covering multi-step submission, GPS geofencing, duplicate detection, and file uploads:
```bash
npm run test:wizard
```

### 5. Run the Backend & Database Test Suite
Runs the 68-point verification suite covering schema, relationships, and store transactions:
```bash
npm run test:backend
```

### 6. Run the Authentication Test Suite
Runs the 27-point verification suite covering bcrypt hashing, JWT integrity, RBAC matrix, and provisioning checks:
```bash
npm run test:auth
```

### 7. Run the Critical 13-Step Citizen-to-Officer-to-Admin Workflow Test
Executes the live end-to-end journey over active HTTP endpoints (`/api/*`):
```bash
npm run test:workflow
```

### 8. Run the Persistence Layer Audit
Verifies atomic file-backed JSON persistence and process-restart survival:
```bash
npm run test:persistence
```

### 9. Run the Full Version 10 Verification Battery
```bash
npm run test:v10
```

### 10. Code Quality & Production Build
```bash
# Strict TypeScript validation (0 errors)
npm run typecheck

# ESLint audit (0 errors, 0 warnings)
npm run lint

# Production build (57 routes, 0 errors)
npm run build
```

---

## Role Demonstration Credentials

| Role | Portal Route | Email | Password | Assigned Scope |
| :--- | :--- | :--- | :--- | :--- |
| **Municipal Officer** | `/officer/dashboard` | `officer.roads@punesetu.gov.in` | `OfficerPass@2026` | Roads & Traffic Maintenance (Ward: Shivajinagar - Ghole Road) |
| **Administrator** | `/admin/dashboard` | `admin@punesetu.gov.in` | `ChangeMe@Pune2026!` | PMC Headquarters (All Departments & Wards) |
| **Citizen (Demo)** | `/citizen/dashboard` | Register new or use test accounts | Your Chosen Password | Citizen Portal (Self-filed grievances) |

---

## 20-Step Hackathon Demonstration Script

1. **Homepage Introduction (`/`):** Open the public homepage. Highlight the clean light theme, saffron accents, and multilingual selector (`English`, `मराठी`, `हिंदी`).
2. **Citizen Registration / Sign-In (`/register`):** Register a demonstration citizen. Show that public registration strictly assigns the `CITIZEN` role.
3. **Citizen Services Overview (`/services`):** Explore the civic services hub: Citizen Charter, Ward Directory, Emergency Numbers, E-Tapaal, and Civic Assistant.
4. **Citizen Charter Inspection (`/services/charter`):** Show the 7 Maharashtra RTS Act statutory services and contrast them with internal SLA targets.
5. **Ward Directory Search (`/services/wards`):** Search for "Kothrud" in English or "कोथरूड" in Devanagari to view official PMC ward addresses and landlines.
6. **Emergency Services (`/services/emergency`):** Show verified emergency hotlines with clickable `tel:` links and official 2026 verification dates.
7. **E-Tapaal Tracker (`/services/etapaal`):** Track file `ET-PMC-2026-08912` to show authentic file movements and explain the transparent demonstration mode.
8. **Civic Knowledge Assistant (`/services/assistant`):** Ask a query in Marathi or English to demonstrate grounded semantic responses with zero hallucinations.
9. **Grievance Filing (`/grievances/new`):** Fill out a new road issue (e.g., Pothole on FC Road). Attach photographic evidence and Pune coordinates.
10. **Tracking Slip Generation:** View the issued canonical tracking token (`PS-PUN-YYYY-XXXXXX`) and atomic confirmation receipt.
11. **Public Tracking & Privacy (`/track/[token]`):** Open tracking in an incognito/public window. Show that citizen phone and exact GPS coordinates are masked.
12. **Community Discovery & GIS Map (`/community`, `/community/map`):** Show the complaint on the public feed and map without leaking personal PII.
13. **Citizen Endorsement (Upvote):** Sign in as a second citizen and upvote the issue. Show duplicate vote prevention.
14. **Officer Login (`/login`):** Sign in as `officer.roads@punesetu.gov.in` (`OfficerPass@2026`).
15. **Officer Operational Queue (`/officer/dashboard`):** Show department isolation (Roads Officer only sees Roads complaints). Locate the newly filed grievance.
16. **Status Progression (`ASSIGNED` -> `IN_PROGRESS`):** Accept the grievance and advance status to `IN_PROGRESS` with operational notes.
17. **Resolution Proof Enforcement:** Attempt resolution without photo or remarks (strictly blocked). Upload resolution photo and formal closing remarks to transition to `RESOLVED`.
18. **Citizen Verification (`/track/[token]`):** Return to citizen view. Show the 4-step status timeline (`SUBMITTED` -> `ASSIGNED` -> `IN_PROGRESS` -> `RESOLVED`) and resolution photo.
19. **Satisfaction Feedback:** Submit a 5-star rating and review as the citizen owner.
20. **Administrator Command Center (`/admin/dashboard`):** Sign in as `admin@punesetu.gov.in` (`ChangeMe@Pune2026!`). Show live updated analytics, department benchmarks, audit logs, and export CSV with formula-injection defenses.

---

## Backend API Operations

All API endpoints are located under `/api/` and feature server-side Zod validation and authentication:

| Endpoint | Method | Access | Description |
| :--- | :--- | :--- | :--- |
| `/api/officer/stats` | `GET` | Officer | Department-scoped operational metrics (assigned, in-progress, near-deadline, overdue, resolved) |
| `/api/officer/grievances` | `GET` | Officer / Admin | Department-scoped operational queue with status, priority, ward, and search filters |
| `/api/officer/reassign` | `POST` | Officer / Admin | Reassign grievance to target department with mandatory formal explanation |
| `/api/admin/analytics` | `GET` | Admin | Comprehensive system-wide grievance analytics and workload distributions |
| `/api/admin/departments` | `GET` | Admin | 8 PMC department performance benchmarks (SLA compliance %, avg resolution hours) |
| `/api/admin/wards` | `GET` | Admin | 15 Pune Prabhag Ward workload and resolution rates with zone filter |
| `/api/admin/escalations` | `GET, POST` | Admin | SLA breach escalation desk with administrative review remarks recording |
| `/api/admin/moderation` | `GET, POST` | Admin | Community comment moderation queue with 1-click Hide/Restore actions |
| `/api/admin/audit` | `GET` | Admin | Forensic audit log viewer with action filtering |
| `/api/admin/export` | `GET` | Admin | RFC 4180 CSV export generation with OWASP Formula Injection defense |
| `/api/grievances` | `POST` | Authenticated | Create grievance with canonical token & atomic status history |
| `/api/grievances` | `GET` | Public / Filtered | List grievances with pagination, status, ward, & department filters |
| `/api/grievances/[token]` | `GET` | Public (Masked) | Retrieve grievance; masks sensitive coordinates for general public |
| `/api/grievances/[token]/status` | `PATCH` | Officer / Admin | Authorized status transition with resolution proof or rejection reason |
| `/api/grievances/[token]/escalate` | `POST` | Citizen Owner | Submit citizen escalation request with anti-abuse verification |
| `/api/cron/overdue` | `POST` / `GET` | Cron / Admin | Idempotent server-side scan detecting overdue SLAs & triggering escalations |
| `/api/grievances/[token]/comments` | `POST` / `GET` | Auth / Public | Add comment (distinguishes public notes from internal notes) |
| `/api/grievances/[token]/endorse` | `POST` | Citizen | Toggle endorsement with duplicate prevention |
| `/api/grievances/[token]/follow` | `POST` | Citizen | Toggle follow with duplicate prevention |
| `/api/grievances/[token]/feedback` | `POST` | Citizen | Submit 1-5 satisfaction rating on resolved grievances |
| `/api/grievances/[token]/evidence` | `POST` / `GET` | Auth / Public | Record or list evidence metadata (storage key, MIME, size) |
| `/api/grievances/duplicates` | `POST` | Public / Citizen | Geospatial search for active duplicates within 500m |
| `/api/uploads` | `POST` | Authenticated | Upload evidence with MIME whitelisting, size limits, and UUID renaming |
| `/api/notifications` | `GET` / `PATCH` | Authenticated | Retrieve and mark in-app notifications as read |
| `/api/departments` | `GET` | Public | List active municipal departments |
| `/api/wards` | `GET` | Public | List Pune's 15 Prabhag administrative wards |
| `/api/civic/charter` | `GET` | Public | Maharashtra RTS Act 2015 statutory timelines & PuneSetu SLA targets |
| `/api/civic/wards` | `GET` | Public | Searchable 15 PMC Prabhag ward offices with zone filters & contact phone numbers |
| `/api/civic/emergency` | `GET` | Public | 11 verified emergency services & disaster helplines with official provenance |
| `/api/civic/etapaal` | `GET, POST` | Public | E-Tapaal electronic file movement tracking with authentic demonstration datasets |
| `/api/civic/assistant` | `POST` | Public | Zero-hallucination grounded civic knowledge assistant with semantic query engine |


---

## Security Architecture

- **Password Hashing:** Salted `bcryptjs` with 10 rounds. Plaintext passwords are never stored or logged.
- **Session Tokens:** Stateless, tamper-resistant JWT signed via HMAC-SHA256 (`jose`) stored in an `httpOnly`, `sameSite: lax`, `secure` cookie (`punesetu_session`).
- **Timing Attack Mitigation:** Uniform dummy bcrypt verification executed when an email address is not found.
- **Privacy by Design:** Exact coordinates and citizen identifiers are scrubbed from public tracking lookups.
- **Role Elevation Prevention:** Client-submitted roles are discarded; public registration strictly provisions `CITIZEN`. Privileged accounts must be provisioned via server CLI scripts.

---

## License

Built for Pune Municipal Corporation civic redressal evaluation under Neighborhood Hacks 2026.
