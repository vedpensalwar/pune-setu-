# PuneSetu (पुणे सेतू) — Changelog

All notable changes to the PuneSetu platform are documented in this file.

## [Version 21.0.0] - 2026-10-23 — Complete System Integration, End-to-End Testing & Quality Assurance

### Added
- **Master Integration Verification Suite (`scripts/test-v21-complete-integration.js` / `npm run test:v21`):**
  - Integrated 24 end-to-end automated assertions covering:
    - Dedicated Citizen, Municipal Officer, and Administrator login portal validation and RBAC gatekeeping.
    - Complete grievance lifecycle from citizen submission, tracking token generation, department queuing, status progression, resolution evidence attachment, audit logging, to public dossier rendering.
    - Interactive GIS map markers and location picker integration.
    - Complaint evidence retrieval and fallback handling.
    - Multilingual key parity across English, Marathi, and Hindi dictionaries.
    - Persistent in-app notifications and read state synchronization.
    - Security, role-based API protection, and administrative isolation.
  - Added `"test:v21": "node scripts/test-v21-complete-integration.js"` npm script.

### Fixed
- **Complaint Card Thumbnail Layout Collapse on Missing Photos:**
  - In `src/app/community/page.tsx`, removed the restrictive `{item.thumbnailUrl && (...)}` conditional block, enabling `<ComplaintImage>` to render its stable container and accessible `Photo unavailable` fallback placeholder with the `<CameraOff>` icon whenever a complaint lacks photo evidence or experiences image fetch failures.
  - Resolved regression failure in `scripts/test-v15-master-audit.js` (now 34/34 passed).

### Verified
- **Cross-Subsystem Coherence & Quality Assurance:**
  - All 12 regression test suites passing (540+ automated test assertions across authentication, backend, submission wizard, tracking lifecycle, GIS community map, multi-viewport responsiveness, portals, dashboards, localization, and notifications).
  - TypeScript typecheck (`tsc --noEmit`): 0 errors.
  - ESLint (`eslint .`): 0 errors, 0 warnings.
  - Production build (`next build --webpack`): 60/60 dynamic and static routes compiled successfully.

## [Version 20.0.0] - 2026-10-23 — Persistent Notifications, Grievance Alerts & Cross-Role Updates

### Added
- **Persistent In-App Notification System (`src/lib/db/repository.ts`):**
  - Implemented `pushNotification(store, notif)` with automatic 10-second duplicate suppression matching recipient, type, grievanceId, and message.
  - Implemented `createNotification`, `listNotificationsForUser`, `markNotificationAsRead`, and `markAllNotificationsAsRead`.
  - Stored notifications in persistent JSON store with fields: `id`, `recipientId`, `type`, `title`, `message`, `grievanceId`, `trackingToken`, `actionUrl`, `titleKey`, `messageKey`, `metadata`, `read`, `createdAt`, `readAt`.
- **Real Application Event Notification Triggers:**
  - Citizen grievance submission generates persistent submission confirmation and notifies assigned department officers.
  - Status updates (`ASSIGNED`, `IN_PROGRESS`, `RESOLVED`, `REJECTED`, `REOPENED`) dispatch notifications with tracking token and actionUrl to citizen owner and followed users.
  - Public official comments dispatch `COMMENT_ADDED` notifications to citizen owner and followers; internal staff notes (`isInternal: true`) are strictly excluded to preserve privacy.
  - Department reassignment dispatches alerts to citizen and destination department officers.
  - Manual citizen escalations alert department officers and platform administrators.
  - SLA overdue checks (`/api/cron/overdue`) generate persistent breach notifications for citizens, officers, and admins.
- **Interactive UI Components (`src/components/notifications/notification-bell.tsx`):**
  - Live accessible dropdown bell with dynamic unread counter badge.
  - "All" and "Unread" filter tabs.
  - Type-based civic icons, relative localized timestamps, mark single read, mark all read, and direct dossier navigation.
  - Real-time client synchronization using custom event `punesetu:notification-change`, window focus listeners, and 30-second polling.
  - Integrated into `portal-header.tsx` across Citizen, Officer, and Admin dashboards and into `public-header.tsx` when authenticated.
  - Enhanced Citizen Dashboard Tab 3 ("Civic Alerts & Updates") with mark-all-read and direct dossier links.
- **Tri-Lingual Translation Support:**
  - Added 18 canonical keys under `notifications.*` across English (`en.ts`), Marathi (`mr.ts`), and Hindi (`hi.ts`) with 100% synchronization and 0 missing keys.
- **Automated Verification Suite (`scripts/test-v20-notifications-system.js`):**
  - Added `npm run test:v20` covering 14 assertions across submission, queue alerts, status transitions, comment privacy, escalation, SLA breach detection, read state persistence, and RBAC security isolation.

### Fixed
- **Root Cause of Missing Notifications:**
  - Connected disconnected lifecycle methods in `repository.ts` to push real notifications.
  - Resolved lack of header notification bell by introducing `NotificationBell` with responsive popover.
  - Added `markAllRead` capability and fixed recipient privacy guards in `/api/notifications`.

## [Version 19.0.0] - 2026-10-22 — Fix and Complete English, Marathi & Hindi Translation

### Added
- **Tri-Lingual Canonical Dictionaries (379 Keys per Language):**
  - Expanded `src/lib/i18n/dictionaries/en.ts`, `mr.ts`, and `hi.ts` to 379 canonical keys across 18 namespaces (`common.*`, `status.*`, `priority.*`, `category.*`, `nav.*`, `home.*`, `stats.*`, `services.*`, `faq.*`, `assistant.*`, `a11y.*`, `auth.*`, `portal.*`, `citizen.*`, `officer.*`, `wizard.*`, `tracking.*`, `admin.*`).
  - Added parameter interpolation for pagination (`common.pageOf: "Page {page} of {totalPages}"` / `"पान {page} / {totalPages}"` / `"पृष्ठ {page} / {totalPages}"`).
  - 100% dictionary completeness verified with automated audit tool (`auditTranslationCompleteness`): 0 missing keys, 0 empty strings across all three languages.
- **Server-Side Rendered Language Synchronization & Dual Persistence:**
  - Added HTTP cookie persistence (`punesetu_locale=${lang}; path=/; max-age=31536000; SameSite=Lax`) alongside `localStorage`.
  - Updated `src/app/layout.tsx` to read `cookies()` and dynamically render `<html lang={initialLang}>`.
  - Added `<head>` inline script for instant zero-flicker client hydration.
  - Multi-tab and custom event synchronization via `punesetu:language-change` event dispatching.
- **Localized Civic Display Helpers (`src/lib/civic/display.ts`):**
  - Added `getStatusLabel(status, t)`, `getCategoryLabel(category, t)`, and `getPriorityLabel(priority, t)` to seamlessly bridge persistent database enum codes with active localized display text.
- **Devanagari Typography & Numerals (`src/lib/i18n/index.ts` & `src/app/globals.css`):**
  - Added `formatLocalizedNumber` supporting Marathi Devanagari numerals (`१२,३४५`) and Hindi groupings (`12,345`).
  - Added `formatLocalizedDate` producing natural Devanagari dates (`२२ ऑक्टो, २०२६`).
  - Configured `:lang(mr)` and `:lang(hi)` typography with relaxed line heights (`leading-relaxed`) to prevent character clipping.
- **Comprehensive View Localization:**
  - Public Navigation, Footer, and Header Portal Badges (`portal-header.tsx`, `site-header.tsx`, `site-footer.tsx`).
  - Authentication Portals: Citizen Sign In (`/login`), Registration (`/register`), Officer Sign In (`/officer/login`), Admin Sign In (`/admin/login`), and Staff Gateway (`/staff/login`).
  - Citizen Civic Dashboard (`/citizen/dashboard`): 4 workspace tabs, metrics summary strip, live filters, empty states, and welcome banner.
  - Municipal Officer Operational Workspace (`/officer/dashboard`): status filter cards, case queue, status update modal, and field inspection dialog.
  - Administrator Command Center (`/admin/dashboard`): 8-tab command navigation, platform oversight, and department reassignment dialog.
  - Public Grievance Dossier (`/track/[token]`): status badges, category badges, escalation triggers, and resolution evidence cards.
  - Grievance Submission Wizard (`/grievances/new`): step titles, category selection cards, GPS picker, and confirmation view.
- **Automated Verification Master Suite (`scripts/test-v19-translation-audit.js`):**
  - Added `npm run test:v19` covering 6 test suites:
    - Suite 1: Canonical dictionary completeness, alignment, and tri-lingual synchronization.
    - Suite 2: Localized formatting (Devanagari numerals, localized dates, parameter interpolation).
    - Suite 3: Server-side rendering (SSR) of `<html lang="...">` and Marathi/Hindi content.
    - Suite 4: Localization of all authentication portals.
    - Suite 5: Authenticated session stability across locale switching.
    - Suite 6: Verbatim preservation of tracking tokens (`PS-PUN-2026-XXXXXX`) and database identifiers.

### Fixed
- **Root Cause of Language Switching Failures:**
  - Resolved missing UI wiring across all client and server views.
  - Resolved server/client hydration mismatch caused by `localStorage`-only storage.
  - Resolved missing dictionary definitions for core portal routes.
  - Fixed React 19 compiler ESLint rules in `LanguageProvider` by eliminating global mutable reassignments in favor of clean state management and event subscriptions.

## [Version 18.0.0] - 2026-10-22 — Functional Citizen, Municipal Officer & Admin Dashboards

### Added
- **Interactive Citizen Dashboard View (`src/components/citizen/citizen-dashboard-view.tsx`):**
  - Built full 4-tab civic client view mounted on `/citizen/dashboard`:
    - Tab 1: "My Filed Grievances" backed by live `/api/grievances?citizenOnly=true` endpoint.
    - Tab 2: "Followed Issues" querying `/api/grievances?followedOnly=true`.
    - Tab 3: "Civic Alerts & Updates" with unread badge counter, live notifications feed (`/api/notifications`), and mark-as-read API.
    - Tab 4: "Ward & Helplines" with 15 PMC ward office addresses and contact helplines.
  - Live search across tokens, descriptions, landmarks, and prabhag wards.
  - Status and category filter dropdowns with active reset buttons.
  - Computed metrics summary strip (Total Filed, In Progress, Resolved, SLA Breached) calculated from actual user complaints.
  - Contextual empty states for first-time citizens and no-match search queries.
- **Admin Command Center Grievance Oversight & Reassignment (`src/components/admin/admin-command-center.tsx`):**
  - Added "All Grievances & Assignment" tab to the command center navigation.
  - Platform-wide search, ward filter, department filter, and status filter.
  - Interactive "Assign / Reassign" modal connecting to `/api/officer/reassign` with mandatory justification validation and audit log integration.
  - Detailed grievance inspection modal for platform oversight.
- **Officer Inspection Modal (`src/components/officer/officer-workspace.tsx`):**
  - Added "Inspect" action button on grievance cards opening high-resolution photographs, GPS coordinates, location text, advisory deadline countdown, and full chronological status audit history.
- **End-to-End Master Test Suite (`scripts/test-v18-dashboard-workflows.js`):**
  - Registered `npm run test:v18` in `package.json` covering 48 automated test assertions across 5 verification phases:
    - Step 1: Citizen dashboard, privacy isolation, search/filtering, empty states.
    - Step 2: Municipal officer queue, department scoping, state machine transitions, closing remarks & photo enforcement.
    - Step 3: Admin platform oversight, reassignment, audit trails, and strict RBAC protection.
    - Step 4: Cross-role status lifecycle synchronization, in-app notifications, and public tracking dossier.
    - Step 5: Server-side rendering (SSR) for all three dashboard views with session integrity.

### Changed & Hardened
- **Grievance Query Validation & Filtering (`src/lib/civic/validation.ts`, `src/app/api/grievances/route.ts`):**
  - Extended `listGrievancesQuerySchema` with `search` and `followedOnly` parameters.
  - Updated `listGrievances` in `src/lib/db/repository.ts` to perform multi-field text search and join on `store.followers`.
- **Status Update Route Flexibility (`src/app/api/grievances/[token]/status/route.ts`):**
  - Exported both `PATCH` and `POST` methods using a unified `handleStatusUpdate` handler to ensure complete backward compatibility with client components.
- **Officer Queue Sort & Thumbnails (`src/lib/db/repository.ts`):**
  - Default sort in `listOfficerGrievances` orders newly submitted grievances first within priority levels.
  - Added `thumbnailUrl` to `OfficerGrievanceItem` populated directly from `store.evidence`.
- **Admin Analytics Compatibility (`src/lib/db/repository.ts`):**
  - Added compatibility aliases (`inProgress`, `pending`, `resolved`, `rejected`, `overdue`) to `getAdminAnalytics` output.

## [Version 17.0.0] - 2026-10-22 — Authentication, Portal Navigation & Role-Based Access Verification

### Added
- **Comprehensive Master Auth Verification Test Suite (`scripts/test-v17-auth-verification.js`):**
  - Registered `npm run test:v17` in `package.json`.
  - 62 automated end-to-end assertions validating:
    - Citizen registration and authentication flow (`/login` -> `/citizen/dashboard`).
    - Municipal Officer portal authentication with authorized credentials (`officer.roads@punesetu.gov.in` -> `/officer/dashboard`).
    - PMC Command Center Administrator authentication with authorized credentials (`admin@punesetu.gov.in` -> `/admin/dashboard`).
    - Cross-portal unauthorized role rejection (HTTP 403) and protected route redirects (`/unauthorized`).
    - Unauthenticated direct URL protection with intelligent portal redirects (`/officer/login`, `/admin/login`, `/login`).
    - Cryptographic session invalidation and cookie clearing (`Max-Age=0`) upon logout.
    - Dashboard refresh persistence across browser page reloads.
    - Multi-viewport layout integrity across 320px, 360px, 390px, 430px, and 1280px.
    - Public grievance dossier lookup (`/track/PS-PUN-2026-0001`) regression verification.

### Changed & Hardened
- **OWASP-Compliant Open Redirect Sanitizer (`src/lib/auth/validation.ts`):**
  - Exported `sanitizeRedirectUrl(raw)` enforcing relative path structures (`/^\/[^\/\\]/`), blocking protocol-relative (`//`), backslash (`/\`), and control character injection exploits across all login portals.
- **Role-Aware Logout Experience (`src/components/layout/portal-header.tsx`):**
  - Enhanced `handleSignOut` to intelligently redirect officers to `/officer/login`, administrators to `/admin/login`, and citizens to `/login`.
- **API Authorization Consistency:**
  - Verified role clearance validation across all administrative and departmental endpoints (`/api/officer/grievances`, `/api/admin/analytics`, `/api/admin/escalations`).


## [Version 16.0.0] - 2026-10-22 — Dedicated Citizen, Municipal Officer & Admin Login Portals

### Added
- **Dedicated Municipal Officer Login Portal (`/officer/login`):**
  - Built official login interface for field engineers, ward officers, and departmental resolution personnel.
  - Features assigned email and password input with visibility toggle, form validation, loading states, and error alerts.
  - Bidirectional cross-portal links to Citizen Portal and Administrator Command Center.
- **Dedicated PMC Command Center Administrator Login Portal (`/admin/login`):**
  - Built high-security login interface for Municipal Commissioner and executive administration.
  - Provides cryptographic credential submission, validation, loading spinners, and role rejection safeguards.
  - Bidirectional cross-portal links to Citizen Portal and Municipal Officer Portal.
- **Staff Portal Gateway & Selector (`/staff/login`):**
  - Centralized gateway allowing municipal personnel to select between Municipal Officer and Administrator portals.
  - Includes return link for citizens inadvertently visiting the staff gateway.
- **Portal Discoverability Integration:**
  - Redesigned Citizen Sign In page (`/login`) with a prominent, responsive "Municipal Staff & Administration" section featuring two clear, clickable access cards (`/officer/login` and `/admin/login`).
  - Added honest explanation that municipal staff accounts require assigned credentials from PMC administration and cannot be created via public registration.
  - Added discreet "Municipal Staff Portal" link in the public top info strip.
  - Added portal entry links (`Citizen Portal`, `Municipal Officer Portal`, `PMC Command Center`, and `Staff Gateway`) in the public footer under Portals & Governance.
  - Added "Municipal Staff & Officer Portal" entry in the mobile header navigation drawer.
- **Automated Verification Test Suite (`scripts/test-v16-portal-audit.js`):**
  - Registered `npm run test:v16` in `package.json`.
  - 56 automated HTTP and CDP assertions validating portal discoverability, route endpoints, server-authoritative RBAC gate checks, unauthenticated middleware redirects, and multi-viewport responsiveness (320px, 360px, 390px, 430px, 1280px).

### Changed & Hardened
- **Server-Authoritative Portal Access Control (`src/app/api/auth/login/route.ts`):**
  - Added optional `portal` parameter in `loginSchema` (`"citizen" | "officer" | "admin"`).
  - Enforces server-side role validation: rejects citizen attempts on officer/admin portals with honest HTTP 403 error messages.
  - Rejects field officer attempts on the administrator portal with HTTP 403.
- **Middleware & Route Layout Architecture (`src/middleware.ts`):**
  - Updated `isAuthPage` to recognize `/officer/login`, `/admin/login`, and `/staff/login`.
  - Configured unauthenticated redirects to point specifically to the relevant portal (`/officer/dashboard` -> `/officer/login`, `/admin/dashboard` -> `/admin/login`).
  - Isolated authenticated dashboard layouts using Next.js App Router route groups (`src/app/officer/(portal)` and `src/app/admin/(portal)`) so login pages are accessible without trigger-redirect loops.


## [Version 15.0.0] - 2026-10-22 — Final Bug Fix Verification and Regression Audit

### Added
- **Comprehensive Master Verification Test Suite (`scripts/test-v15-master-audit.js`):**
  - Registered `npm run test:v15` in `package.json`.
  - 34 automated CDP and HTTP assertions validating:
    - Civic Interactive Map (`/map`) and Dynamic Complaint Markers/Clusters.
    - Grievance Filing Wizard Location Picker Map (`/grievances/new` Step 2) with tile loading and draggable pin.
    - Evidence streaming (`/api/uploads/...`) with authentic JPEG headers, plus `<ComplaintImage>` fallback rendering for unphotographed issues.
    - Mobile responsiveness across 320px, 360px, 390px, 430px, 768px, and 1280px viewports (zero horizontal overflow, zero card clipping).
    - Authentication flow preservation and strict Role-Based Access Control (RBAC) across Citizen, Municipal Officer, and Admin tiers.

### Fixed
- **Evidence URL Redundant Prefix Resolution (`src/lib/civic/evidence-url.ts`):**
  - Enhanced `getEvidenceUrl` regex to cleanly strip redundant storage prefixes (`uploads/`, `/uploads/`, `api/uploads/`), preventing malformed URLs such as `/api/uploads/uploads/evd_pothole_baner.jpg`.
- **Seed Evidence Asset Restoration (`public/uploads/evd_pothole_baner.jpg`):**
  - Populated genuine photographic civic resolution sample for seed record `PS-PUN-2026-0001`, enabling full binary streaming verification over HTTP 200 with `image/jpeg` headers.

### Verified
- **Both Map Implementations (Version 12 Verification):**
  - Verified live OpenStreetMap tile loading (`tile.openstreetmap.org`), Leaflet 1.9.4 container rendering, zoom/pan controls, grievance clustering, interactive marker selection, and modal dialog previews.
  - Verified Location Picker Map interactive mounting, tile loading, and ward coordinate synchronization.
- **Complaint Images & Evidence Fallbacks (Version 13 Verification):**
  - Verified binary photographic evidence loads cleanly without layout distortion.
  - Verified missing/unattached complaint records render the accessible civic placeholder with `role="img"` and "Photo unavailable" badge without breaking card geometry.
- **Responsive Geometry Across All Devices (Version 14 Verification):**
  - Confirmed 0 horizontal document overflow (`scrollWidth <= window.innerWidth`) on 320px, 360px, 390px, 430px, 768px, and 1280px.
  - Confirmed 0 card bounding overflows across all 20 feed cards on all viewports.
- **Strict Authentication & RBAC Integrity:**
  - Citizen login remains simple and direct; officer/admin logins require assigned municipal credentials.
  - Public registration strictly provisions `CITIZEN` role.
  - Privileged paths (`/admin`, `/officer`) reject unauthorized citizens with HTTP 307 redirects to `/login`.
- **Master Regression Suite:**
  - 100% pass across all 12 test suites (434+ automated assertions).
  - TypeScript type check (`npm run typecheck`): 0 errors.
  - ESLint (`npm run lint`): 0 errors, 0 warnings.
  - Production build (`npm run build`): All 57 App Router routes compiled cleanly.


## [Version 14.0.0] - 2026-10-22 — Mobile Responsiveness and Layout Fix

### Added
- **Automated Mobile Responsiveness Test Suite (`scripts/test-v14-mobile-responsiveness.js`):**
  - Registered `npm run test:v14` in `package.json`.
  - 29 automated CDP assertions testing across 6 viewport tiers: 320px (Compact Mobile), 360px (Standard Mobile), 390px (iPhone 14/15), 430px (Large Mobile), 768px (Tablet Portrait), and 1280px (Desktop Full).
  - Verifies zero horizontal document overflow (`scrollWidth <= window.innerWidth`), complete card container bounds fitting, un-clipped status badges, responsive evidence thumbnails, and responsive touch-target accessibility.

### Fixed
- **Mobile Card Layout & Horizontal Clipping (`src/app/community/page.tsx`):**
  - Redesigned `HorizontalIssueRow` for seamless narrow-screen adaptation:
    - Mobile column stacking (`flex-col sm:flex-row items-stretch sm:items-start gap-3.5 sm:gap-4`) with `w-full min-w-0 overflow-hidden`.
    - Responsive image banner thumbnail on small viewports (`w-full sm:w-24 md:w-28 h-40 sm:h-24 md:h-28 shrink-0 rounded-base overflow-hidden`) with `object-cover` preventing aspect ratio distortion.
    - Word-wrapping on tracking tokens (`break-all`), complaint titles (`break-words`), and ward locations (`break-words`).
    - Two-tier responsive actions row (`flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3`) keeping status badges and endorsement counts top-aligned on mobile while follow/detail buttons remain comfortably accessible.
- **Filter and Search Controls Responsiveness (`src/app/community/page.tsx`):**
  - Reduced search input minimum width from `min-w-[200px]` to `min-w-[140px] sm:min-w-[200px]`, allowing the search input and mobile filter trigger button to fit on a single row without horizontal overflow on 320px screens.
  - Adjusted mobile collapsible filter sheet to single column on ultra-compact mobile (`grid-cols-1 sm:grid-cols-2`).
- **Infinite Navigation Loop on URL Synchronization (`src/app/community/page.tsx` & `src/app/map/page.tsx`):**
  - Added `isInitialMount` ref guards and query string comparison checks to prevent `router.replace` from triggering recursive soft navigations on initial component mount.
- **Global Viewport Overflow Prevention (`src/app/globals.css` & `src/components/ui/container.tsx`):**
  - Added `overflow-x: hidden; max-width: 100vw;` to `html, body` to eliminate rogue sub-pixel browser scrollbars.
  - Adjusted mobile container padding to `px-3.5 sm:px-6 lg:px-8 max-w-full` for extra margin breathing room on narrow mobile devices.
- **Public Header Navigation Crowding (`src/components/layout/public-header.tsx`):**
  - Tightened mobile gap spacing (`gap-2 sm:gap-4`) and optimized mobile button padding (`p-1.5 sm:p-2 min-h-[38px]`).
  - Responsively concealed secondary Devanagari logo subtitle on `< 375px` screens (`hidden min-[375px]:inline`) while retaining full bilingual branding in the mobile drawer and on larger viewports.
- **Tracking View Header Responsiveness (`src/app/track/[token]/track-view.tsx`):**
  - Converted tracking dossier header to responsive layout (`flex-col sm:flex-row sm:items-center w-full min-w-0`) with `break-all` on tokens and `break-words` on titles.

## [Version 13.0.0] - 2026-10-22 — Complaint Image and Evidence Fix

### Added
- **Dynamic File Retrieval Route (`src/app/api/uploads/[...path]/route.ts`):**
  - Next.js App Router dynamic route supporting streamed file retrieval with MIME type negotiation (`image/jpeg`, `image/png`, `image/webp`, `image/svg+xml`), `Cache-Control: public, max-age=31536000, immutable`, and secure directory traversal protection.
  - Returns clean HTTP 404 `{ error: "File not found", code: "PHOTO_UNAVAILABLE" }` without crashing or throwing server exceptions.
  - Added query-parameter fallback `GET /api/uploads?path=...` in `src/app/api/uploads/route.ts`.
- **Client-Safe Evidence URL Resolver (`src/lib/civic/evidence-url.ts`):**
  - Pure URL normalization utility stripping redundant path prefixes (`uploads/`, `/api/uploads/`) and generating canonical `/api/uploads/<clean-path>` endpoints without importing Node.js standard libraries.
- **Accessible & Resilient `ComplaintImage` Component (`src/components/civic/complaint-image.tsx`):**
  - Fixed-dimension responsive container preventing layout shifts and oversized text wrapping.
  - React 19 render-time state tracking avoiding cascading `useEffect` updates.
  - Elegant fallback rendering a compact "Photo unavailable" civic placeholder with a `CameraOff` icon and clean 10px muted text, accessible via `role="img"` and `aria-label`.
- **Automated Verification Battery (`scripts/test-v13-evidence-fix.js`):**
  - 25 automated assertions covering directory traversal rejection, 404 behavior, MIME headers, roundtrip citizen upload-and-retrieval, and feed thumbnail integration.

### Fixed
- **Broken Image Icons & Layout Collapse in Complaint Cards (`src/app/community/page.tsx`):**
  - Replaced raw `<img>` tags with `<ComplaintImage>`, preventing broken image icons and long alt-text overflow in feed cards.
- **Evidence Retrieval in Tracking View (`src/app/track/[token]/track-view.tsx`):**
  - Integrated `<ComplaintImage>` and `getEvidenceUrl` for both citizen attachments and municipal resolution photos.
- **Complaint Submission Wizard (`step-review.tsx`, `step-evidence.tsx`):**
  - Replaced raw `<img>` previews with `<ComplaintImage>` for consistent fallback behavior during draft review.

## [Version 11.0.0] - 2026-10-22 — Ultimate UI/UX Transformation & Master Quality Assurance

### Added
- **Light-First Authentic Civic Theme Architecture:**
  - Standardized semantic color tokens matching design specifications: Brand Navy (`#173B57`), Deep Ink (`#202C38`), Primary Saffron Action (`#D96A24`), Primary Hover (`#BD571A`), Main Background (`#F6F7F9`), Primary Surface (`#FFFFFF`), Secondary Surface (`#EEF2F5`), Subtle Border (`#DCE3E9`), and accessible status colors.
  - Added anti-flicker `<head>` evaluation script in `src/app/layout.tsx` to set `data-theme="light"` on `<html>` before initial paint.
  - Bumped theme migration key to `"punesetu-theme-default-light-v11-final"` in `src/components/theme/theme-provider.tsx` to guarantee clean migration away from stale dark preferences.
- **Modern Civic Typography Scaling:**
  - Modern sans-serif scaling (Inter / Noto Sans Devanagari) eliminating oversized italic-serif headings across all hero, section, and card titles.
  - Implemented iconic hero headline: *"Your neighbourhood. Your voice. A better Pune."* with balanced visual weight (`text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight`).
- **Streamlined Navigation & Responsive Header:**
  - Optimized desktop and mobile navigation in `src/components/layout/public-header.tsx`, preventing horizontal crowding between 1024px and 1280px viewports.
  - Grouped secondary civic resources into a clean dropdown while keeping high-priority routes (Home, Track, Feed, Map, Services, Report) directly accessible.
- **Master Project Audit & Zero-Regression Verification:**
  - 100% test pass rate maintained: **648 / 648 automated tests passed** across all 10 test suites.
  - 0 TypeScript compilation errors (`tsc --noEmit`).
  - 0 ESLint errors or warnings (`eslint .`).
  - Next.js production build succeeded with all 57 static and dynamic routes compiled.

### Fixed
- **Critical Map Rendering & Container Collapse Bug (Both Maps Restored):**
  - **Civic Map (`/map` & `/community/map`):**
    - Diagnosed root cause via headless Chrome CDP evaluation: `.leaflet-container` collapsed to `height: 0px` due to percentage height on parents lacking an explicit CSS height property.
    - Fixed container sizing by enforcing `position: absolute !important; inset: 0 !important; width: 100% !important; height: 100% !important;` on `.leaflet-container` inside a properly constrained `h-[calc(100vh-140px)] min-h-[500px]` wrapper.
    - Placed `@import "leaflet/dist/leaflet.css";` at line 1 of `src/app/globals.css` and added Tailwind image reset overrides (`.leaflet-container img { max-width: none !important; max-height: none !important; }`).
    - Added automatic `map.invalidateSize()` lifecycle triggers on mount and after delay to guarantee accurate viewport bounds calculation.
  - **Complaint-Reporting Location Picker (`/grievances/new` Step 2):**
    - Replaced the static SVG mockup with a fully interactive Leaflet map component (`src/components/wizard/location-picker-map.tsx`).
    - Supports real OpenStreetMap tiles, click-to-pin geolocation, draggable Saffron/Navy pin, live Pune coordinate bounds validation, and bidirectional synchronization with GPS geolocation.
    - Verified live rendering of both maps across desktop (1280x800) and mobile (390x844) viewports.

## [Version 10.0.0] - 2026-10-22 — Final Quality Assurance and Hackathon Readiness

### Added
- **Critical 13-Step Citizen-to-Officer-to-Admin Workflow Verification (`npm run test:workflow`):**
  - Live HTTP verification across registration, token generation, persistence, endorsement, following, officer department-scoped triage, status progression (`SUBMITTED` -> `ASSIGNED` -> `IN_PROGRESS`), mandatory photo proof and remarks on `RESOLVED`, citizen satisfaction rating (1-5 stars), and administrator aggregated analytics.
- **Persistence Layer Verification Script (`npm run test:persistence`):**
  - Atomic rename `.tmp` write integrity check verifying process boundary survival on `data/punesetu-civic-store.json` and `data/punesetu-users.json`.
- **Comprehensive Quality Battery (`npm run test:v10`):**
  - Reached 648 automated tests passing 100% across 10 test suites.
  - Zero TypeScript compilation errors (`tsc --noEmit`).
  - Zero ESLint errors or warnings (`eslint .`).
  - Production build producing 57 static and dynamic routes.

### Changed
- Synchronized officer login credentials and bcrypt hashes for reliable role switching (`officer.roads@punesetu.gov.in`, `admin@punesetu.gov.in`).
- Documented honest operational realities: atomic file-backed JSON store active runtime, local evidence disk storage in `public/uploads`, and pre-integration demonstration mode for PMC E-Tapaal.

---

## [Version 9.0.0] - 2026-10-22 — Complete Localization and Civic Services

### Added
- **Centralized Multilingual Localization (`en`, `mr`, `hi`):**
  - 100% dictionary parity across English, Marathi, and Hindi covering all navigation, hero, tracking, feed, and operations.
  - Devanagari typography optimization using Noto Sans Devanagari with enhanced line-height and letter-spacing for Marathi and Hindi text.
  - Persistent language preference stored in browser `localStorage`.
- **Statutory Citizen Charter (`/services/charter`):**
  - Grounded in Maharashtra Right to Public Services Act (RTS Act) 2015 with 7 notified municipal services, appellate authority hierarchies, and statutory timelines contrasted with PuneSetu advisory SLAs.
- **Searchable 15 Prabhag Wards Directory (`/services/wards`):**
  - Verified directory of all 15 Pune Municipal Corporation Prabhag ward offices with official physical addresses, administrative zones, and landline contacts.
- **Verified Emergency & Municipal Directory (`/services/emergency`):**
  - 11 verified emergency services (112, 101, 108, PMC Disaster 020-25501269, etc.) with mobile `tel:` dial links and official provenance citations.
- **E-Tapaal File Movement Tracker (`/services/etapaal`):**
  - Interactive demonstration tracking interface with 4 authentic PMC file movements and honest 404 for unconfigured searches.
- **Civic Knowledge Assistant (`/services/assistant`):**
  - Grounded deterministic semantic query engine with zero-hallucination safety guardrails.

---

## [Version 8.0.0] - 2026-10-22 — Municipal Officer Portal & Administrator Command Center

### Added
- **Municipal Officer Workspace (`/officer/dashboard`):**
  - Department-scoped operational queue displaying assigned civic grievances filtered by authenticated officer's jurisdiction (`Roads & Traffic Maintenance`, etc.).
  - Operational KPIs: Assigned complaints, in-progress cases, near-deadline cases (<48h remaining), overdue cases, and resolved cases.
  - Urgency indicators with visual countdown tags for cases approaching resolution deadline.
  - Multi-attribute operational queue filters: Search across title and tracking tokens, status dropdown, priority filter, ward filter, and fast urgency checkboxes (`Near Deadline`, `Overdue Only`).
  - Permitted Status Lifecycle Updates Modal: Transitions grievances to `IN_PROGRESS`, `RESOLVED`, or `REJECTED`. Enforces mandatory resolution photo + 10-char closing remarks for `RESOLVED`, and formal 10-char justification for `REJECTED`.
  - Case Reassignment Modal: Reassigns misrouted complaints to any of the 8 PMC engineering departments with mandatory formal justification, status history progression, and audit recording.
  - Progress & Field Notes Modal: Adds internal operational notes without exposing private details to the public citizen feed.
- **Administrator Command Center (`/admin/dashboard`):**
  - Distinct oversight workspace with 7 dedicated governance tabs:
    1. **Overview & Analytics:** Real database aggregations for Total Complaints, Active Remediation, Resolved Cases (with SLA compliance %), Overdue Breaches (with SLA breach rate %), Average Resolution Velocity (hours), and Citizen Satisfaction Score (1-5 rating with verified feedback counts). Includes visual workload distribution bars for Status, Category, and Priority.
    2. **Department Benchmarks:** Performance comparison table across all 8 PMC engineering departments (Assigned, In Progress, Resolved, Overdue, Avg Resolution Time, SLA Compliance %, Citizen Rating).
    3. **Ward Workloads:** Workload and resolution rates across all 15 Pune Prabhag administrative wards with Zone filtering (Central, East, West, North, South).
    4. **Escalation Desk:** SLA breach and citizen procedural appeals queue with modal for recording administrative review remarks and tracking reviewer identity.
    5. **Community Content Moderation:** Live queue for public comments with 1-click Hide/Restore actions, mandatory moderation reason input, and public view scrubbing.
    6. **Audit Trail:** Searchable security ledger recording actor identity, action type, target IDs, and structured transition context.
    7. **Data Exports (CSV):** Five RFC 4180 CSV export actions (Grievances Register, Department Performance, Ward Workload Summary, Escalations & SLA Breaches, System Audit Log) with OWASP Formula Injection defense (`=`, `+`, `-`, `@`, `\t`, `\r` escaped).
- **Backend Services & API Endpoints:**
  - `src/lib/db/repository.ts`: Added `listOfficerGrievances`, `getOfficerStats`, `reassignGrievance`, `getAdminAnalytics`, `getDepartmentPerformance`, `getWardPerformance`, `listAdminEscalations`, `reviewAdminEscalation`, `listModerationComments`, `moderateComment`, `listAuditLogs`, and `generateAdminExportCSV`.
  - `GET /api/officer/stats`: Scoped operational metrics.
  - `GET /api/officer/grievances`: Department-scoped paginated complaint queue.
  - `POST /api/officer/reassign`: Departmental case reassignment.
  - `GET /api/admin/analytics`: Central redressal system analytics.
  - `GET /api/admin/departments`: 8-department performance metrics.
  - `GET /api/admin/wards`: 15-ward workload analytics.
  - `GET, POST /api/admin/escalations`: SLA breach records and review action.
  - `GET, POST /api/admin/moderation`: Community comment moderation and audit trail.
  - `GET /api/admin/audit`: Forensic system audit ledger.
  - `GET /api/admin/export`: Authorized CSV file downloads with formula injection defense.
- **Automated Verification:**
  - Added dedicated test suite `scripts/test-v8-operations.js` (`npm run test:v8`): **43 / 43 PASS**.
  - Total automated test coverage across platform: **322 / 322 PASS (100% Passing)**.
  - Strict TypeScript check: 0 errors (`npm run typecheck`).
  - ESLint quality audit: 0 errors (`npm run lint`).
  - Next.js production build: 0 errors (all 38 routes compiled & generated).

---

## [Version 7.0.0] - 2026-10-21 — Community Civic Feed & Interactive GIS

### Added
- **Community Civic Feed (`/community`):**
  - Database-backed public grievance discovery feed with search across title, description, token, and landmark.
  - Multi-attribute filtering by civic category, status lifecycle, priority level, and Pune Prabhag Ward.
  - Responsive layout with URL parameter synchronization, server pagination, real-time result count, and accessible empty/error states.
  - Editorial grievance items featuring category icons, status badges, generalized location, relative timestamps, and engagement counters.
- **Interactive GIS Map (`/community/map`):**
  - Dynamic geospatial exploration portal powered by Leaflet and OpenStreetMap.
  - Status-coded circular markers mapped to verified grievance coordinates within the Pune municipal boundary.
  - Marker fly-to animation upon selection and interactive Selected Grievance Preview drawer.
  - Status legend distinguishing Submitted, In Progress, Resolved, and Escalated cases.
  - Seamless navigation from map preview drawer directly to persistent tracking dossiers (`/track/[token]`).
- **Community Engagement & Citizen Interactions:**
  - `CommunityEngagementBar`: Citizen endorsement toggle with duplicate prevention and persistent database counts.
  - Follow / Unfollow capability for registered citizens to receive in-app status milestone notifications.
  - `CommunityComments`: Public citizen discussion threads with character-counted validation (1–1000 chars), role badges (`CITIZEN`, `MUNICIPAL_OFFICER`, `ADMIN`), XSS safety, and strict exclusion of internal operational officer notes from public views.
- **API Endpoints:**
  - `GET /api/community/feed`: Multi-criteria feed query with server-side pagination and privacy scrubbing.
  - `GET /api/community/map`: Geospatially filtered marker feed bounded within Pune municipal limits.
  - `GET /api/community/engagement`: Retrieval of current authenticated user endorsement and follower status.
  - `POST /api/grievances/[token]/endorse`: Atomic endorsement toggle.
  - `POST /api/grievances/[token]/follow`: Atomic follower toggle.
  - `GET / POST /api/grievances/[token]/comments`: Validated comment retrieval and creation.
- **Automated Verification:**
  - Added dedicated test suite `scripts/test-community-gis.js` (`npm run test:community`): 54 / 54 PASS.
  - Total test suite coverage across all milestones: **279 / 279 PASS (100% Passing)**.
  - Strict TypeScript check: 0 errors (`npm run typecheck`).
  - ESLint quality audit: 0 errors, 0 warnings (`npm run lint`).
  - Next.js production build: 0 errors (all 28 routes compiled & generated).

---

## [Design System Release] - 2026-10-21 — Professional Civic Portal Design System Overhaul

### Added & Standardized
- **Civic Portal Palette System:**
  - Implemented light-first municipal default palette with Brand Navy (`#173B57`), Deep Ink (`#17232F`), Primary Action Saffron (`#E87524`), Primary Hover (`#CC5F16`), Background (`#F6F7F9`), Primary Surface (`#FFFFFF`), Secondary Surface (`#EEF2F5`), Primary Text (`#202C38`), Hairline Border (`#DCE3E9`), and subtle divider (`#E7EBEF`).
  - Standardized semantic status tokens: Success (`#18794E`), Warning (`#946200`), Error (`#B42332`), and Info (`#235A83`).
  - Preserved customized Dark mode (`data-theme="dark"`) and High-Contrast mode (`data-theme="high-contrast"`).
- **Contemporary Sans-Serif Typography:**
  - Removed all oversized italic serif headings.
  - Standardized on **Inter** (`--font-sans`) for English UI and **Noto Sans Devanagari** (`--font-devanagari`) for Marathi/Hindi.
  - Standardized desktop type scale: Hero (44–56px), Page (32–40px), Section (26–32px), Card (18–22px), Body (16–18px), Controls (14–15px).
- **Control Sizing, Shapes & Gradients:**
  - Standardized input height to 44px (`h-11`) with 1px border and internal padding.
  - Standardized button heights to 44px (`h-11`) for `md` and 48px (`h-12`) for `lg`.
  - Removed unnecessary gradients from Citizen, Officer, and Administrator dashboards.
  - Constrained border radii to modest 6–12px (`rounded-base` 8px).
- **Hero & Tracking Modernization:**
  - Replaced italic serif headline with authoritative contemporary headline: *"Civic issues deserve clear answers."*
  - Preserved 3 clear user CTAs ("Report a Civic Issue", "Track a Complaint", "Explore Civic Issues").
  - Streamlined tracking search input to standard 44px height matching action button.
- **Verification:**
  - 225 / 225 automated tests pass (100%).
  - 0 TypeScript errors, 0 ESLint warnings, 22 / 22 static routes compiled.

---

## [Design Correction Release] - 2026-10-20 — Public Experience Redesign & Premium Frontend Quality

### Corrected & Enhanced
- **Light-First Public Aesthetic:**
  - Transitioned the public portal experience from dark-heavy backgrounds to a crisp, light-first civic interface with warm neutral surfaces, deep navy identity accents, and restrained saffron action buttons.
  - Preserved complete dark mode (`data-theme="dark"`) and high-contrast accessibility mode (`data-theme="high-contrast"`) with WCAG AAA compliance.
- **Compact & Organized Navigation Header (`PublicHeader` & `TopInfoStrip`):**
  - Streamlined desktop navigation into a cohesive 4-link system (`Home`, `Track Status`, `Civic Feed`, `How It Works`) with a unified `Resources` dropdown housing Prabhag Wards, Categories, Emergency Helplines, and Citizen Charter.
  - Redesigned `TopInfoStrip` into a crisp, light-first civic notice bar with verified emergency directory triggers.
  - Enhanced mobile drawer with 44px+ touch targets, clear icons, language selector, and full-width reporting CTA.
- **Balanced Editorial Hero Section (`HeroSection`):**
  - Restructured hero typography with purposeful hierarchy: Eyebrow ("Civic services for Pune"), Heading ("Your neighbourhood. / Your voice. / A better Pune."), and controlled line-length subtitle.
  - Implemented 3-tier action hierarchy: Primary ("Report a Civic Issue"), Secondary ("Track a Complaint"), Tertiary ("Explore Civic Issues").
  - Replaced dense administrative ticket card with an elegant, light-first **Case & Resolution Preview**, featuring generalized location (Ward 07 Shivajinagar), 4-stage tracking progression, SLA indicator, and clear demo marking without simulated GPS coordinates.
- **Integrated Complaint Tracking Entry Point (`TrackingPanel`):**
  - Seamlessly connected tracking directly beneath the hero section with prominent heading ("Track your complaint") and clear instructions.
  - Integrated real-time query against `/api/grievances/[token]` with honest 404 error presentation when tokens do not exist in the database (never faking success).
  - Added clickable verified demo tokens (`PS-PUN-2026-621771`) for rapid tester and evaluator exploration.
- **Page Rhythm & Component Refinement:**
  - Standardized card elevations, border radii, and hover transitions across all 9 homepage sections.
  - Maintained 100% passing tests across all 225 automated suites (77 lifecycle, 53 wizard, 27 auth, 68 backend).

---

## [Version 6.0.0] - 2026-10-20 — Grievance Tracking, SLA Management & Resolution Workflow

### Added
- **Grievance Tracking Experience (`/track` & `/track/[token]`):**
  - Dedicated search portal at `/track` validating canonical format `PS-PUN-YYYY-XXXXXX`.
  - Comprehensive tracking detail page (`/track/[token]`) rendering real database-persisted case files.
  - Server-side public vs. private information masking: strips GPS coordinates and citizen contact info for public lookups, preserves full fields for authorized grievance owner and municipal officers.
  - Automatic redirect from `/grievances/[token]` to canonical `/track/[token]`.
- **Status Lifecycle State Machine:**
  - Enforces permitted status transitions across `SUBMITTED`, `ASSIGNED`, `IN_PROGRESS`, `RESOLVED`, `REJECTED`, `ESCALATED`, `SLA_BREACHED`, `REOPENED`.
  - Officer department isolation: officers can only transition status for grievances belonging to their assigned department.
  - Mandatory resolution proof: requires at least one verified resolution photograph and formal closing remarks ($\ge 10$ chars) to transition to `RESOLVED`.
  - Formal rejection justification: requires minimum 10-character justification recorded in audit log and citizen view.
  - Citizen reopening workflow: permits grievance owner to reopen resolved or rejected cases for further municipal inspection.
- **Configurable 21-Day Application SLA Benchmark:**
  - Authoritative server-side deadline calculation (`APPLICATION_SLA_DAYS = 21`) persisted upon grievance submission.
  - Live client countdown component (`SLACountdown`) evaluating status states: `WITHIN_TARGET`, `APPROACHING` (24–72h), `DUE_TODAY` ($\le 24$h), and `OVERDUE`.
  - Explicit platform policy notice clarifying the operational nature of application SLA benchmarks distinct from statutory guarantees.
- **Server-Side Idempotent Overdue Engine (`POST /api/cron/overdue`):**
  - Background scheduler-ready endpoint secured via `CRON_SECRET` bearer authentication or Admin role.
  - Scans eligible active grievances exceeding deadline and records `EscalationRecord` (`SLA_TIME_EXCEEDED`).
  - Preserves underlying work status (`underlyingStatus: previousStatus`) while transitioning to `SLA_BREACHED`.
  - Concurrency-safe idempotency check: prevents duplicate escalation records on repeated cron executions.
- **Citizen Engagement & Escalation Workflow:**
  - Citizen escalation request modal & API (`POST /api/grievances/[token]/escalate`) validating case eligibility and preventing duplicate pending escalations.
  - Citizen satisfaction feedback card & API (`POST /api/grievances/[token]/feedback`) collecting 1–5 star ratings and comments on resolved cases, enforcing strict single-feedback-per-case constraint.
- **Accessibility & Printable Tracking Slip:**
  - Accessible Text-to-Speech audio dossier component (`AudioDossier`) powered by the Web Speech API in English (`en-IN`), Marathi (`mr-IN`), and Hindi (`hi-IN`) with Play/Pause/Stop controls and unmount cleanup.
  - Print-optimized CSS (`@media print`) rendering an official case file slip with QR verification code, tracking token, status history timeline, and municipal disclaimer.
- **Notifications & Audit Logging:**
  - Real-time in-app notifications generated for citizen owners upon status transitions, resolution, and escalations (`/api/notifications`).
  - Comprehensive audit log records (`AuditLog`) capturing actor identity, action type, target IDs, and structured transition metadata.
- **Automated Verification Test Suite:**
  - Added `scripts/test-tracking-lifecycle.js` containing 73 automated tests verifying token validation, public/private masking, lifecycle transitions, resolution evidence checks, rejection requirements, 21-day SLA calculations, overdue cron idempotency, citizen escalation, feedback, audio dossier text, notifications, and audit logging.
  - Registered `"test:lifecycle": "node scripts/test-tracking-lifecycle.js"` in `package.json`.

---

## [Version 5.0.0] - 2026-10-20 — Complete Grievance Submission Wizard
 
### Added
- **5-Step Grievance Submission Wizard (`/grievances/new`):**
  - **Step 1 (Evidence Upload):** Drag-and-drop file upload with live previews, file type icons, editable captions, size tracking, and individual file removal.
  - **Step 2 (Location Selection):** Interactive Pune SVG map with landmark pins and click-to-pin coordinate picker, GPS geolocation button with permission state handling, latitude/longitude bounds validation ($18.25-18.75^\circ\text{N}$, $73.65-74.15^\circ\text{E}$), landmark text input, and dynamic 15 Prabhag ward dropdown.
  - **Step 3 (Issue Details):** 9 official Pune municipal categories with auto-department mapping, urgency selection with advisory SLA targets (6h, 24h, 72h, 168h), and multilingual speech-to-text recognition (English `en-IN`, Marathi `mr-IN`, Hindi `hi-IN`).
  - **Step 4 (Duplicate Grievance Detection):** Geospatial search for active grievances within 500m radius in the same category; Option A to endorse existing matching grievance without duplicate ticket creation, or Option B to continue filing a separate report.
  - **Step 5 (Review & Submission):** Complete summary card with step-jump edit shortcuts, double-submission click protection, and server-side atomic persistence.
  - **Session Draft State:** Auto-preserves progress in `sessionStorage` across page refreshes and step navigation.
- **Submission Confirmation & Printable Receipt (`/grievances/confirmation/[token]`):**
  - Fetches and renders actual persisted grievance record from database.
  - Prominent canonical tracking token badge (`PS-PUN-YYYY-XXXXXX`) with one-click copy.
  - Dynamic local SVG QR code encoding verified grievance tracking URL.
  - Print-optimized stylesheet (`@media print`) rendering an official PuneSetu municipal complaint slip without web navigation or buttons.
- **Secure File Storage Layer (`src/lib/storage/index.ts` & `POST /api/uploads`):**
  - Enforces 10MB file size limit, 5 files max per grievance.
  - Whitelists safe MIME types (`image/jpeg`, `image/png`, `image/webp`, `application/pdf`, `video/mp4`, `audio/mpeg`, `audio/wav`).
  - Sanitizes filenames using cryptographic UUIDs (`evd_[uuid].[ext]`) and prevents directory traversal attacks.
- **Geospatial Duplicate Detection API (`POST /api/grievances/duplicates`):**
  - Implements Haversine distance formula filtering active grievances within 500 metres.
  - Privacy masking scrubs original citizen identity and precise home coordinates.
- **Verification Suites:**
  - `scripts/test-submission-wizard.js`: 39-point automated test suite covering storage validation, MIME whitelist, Haversine distance, duplicate detection, atomic submission, receipt generation, and route protection.
  - Added `"test:wizard": "node scripts/test-submission-wizard.js"` to `package.json`.

### Changed
- `src/middleware.ts`: Added `/grievances/new` to protected route matcher, redirecting unauthenticated users to `/login?redirect=/grievances/new`.
- `src/components/layout/public-header.tsx`: Linked desktop and mobile "Report Issue" navigation buttons directly to `/grievances/new`.
- `src/app/page.tsx`: Updated homepage hero "Report an Issue" button to open `/grievances/new`.
- `src/app/citizen/dashboard/page.tsx`: Added "File New Grievance" banner button and quick link to `/grievances/new`.
- `src/lib/civic/validation.ts`: Extended `createGrievanceSchema` with optional `evidence` metadata array and added `duplicateCheckSchema`.
- `src/lib/db/repository.ts`: Updated `createGrievance` to atomically record attached evidence records into `store.evidence`.

---

## [Version 4.0.0] - 2026-10-20 — Database and Backend Foundation

### Added
- **Prisma Relational Database Schema (`prisma/schema.prisma`):**
  - Normalized schema defining 13 core models (`User`, `Department`, `Ward`, `Grievance`, `GrievanceEvidence`, `GrievanceStatusHistory`, `Comment`, `Endorsement`, `GrievanceFollower`, `SatisfactionFeedback`, `Notification`, `AuditLog`, `EscalationRecord`) and 8 enums.
  - Foreign key relations with appropriate deletion constraints (`ON DELETE RESTRICT` for users with filed grievances, `ON DELETE SET NULL` for audit trail references).
  - Composite unique constraints on `Endorsement` (`[grievanceId, citizenId]`), `GrievanceFollower` (`[grievanceId, citizenId]`), and `SatisfactionFeedback` (`[grievanceId]`).
- **Initial Migration SQL (`prisma/migrations/20261020000000_init_civic_backend/migration.sql`):**
  - Fully idempotent and additive PostgreSQL migration containing zero destructive drop statements.
- **Dual-Mode Persistence Architecture:**
  - Production PostgreSQL connection with connection-pooling singleton (`src/lib/db/prisma.ts`).
  - Zero-dependency atomic file-backed fallback store (`data/punesetu-civic-store.json`) ensuring deterministic local testing and development without live PostgreSQL instance.
- **Canonical Public Tracking Token Generator (`src/lib/civic/token.ts`):**
  - Generates tokens in `PS-PUN-YYYY-XXXXXX` format using Crockford Base32 characters.
  - Verified 1,000 unique token generations with zero collisions.
- **Civic Domain Validation with Zod (`src/lib/civic/validation.ts`):**
  - Pune municipal bounding box validation ($18.25^\circ\text{N} - 18.75^\circ\text{N}$, $73.65^\circ\text{E} - 74.15^\circ\text{E}$).
  - Field length, enum validation, rating scale (1-5), and evidence file size constraints (max 15MB).
- **Grievance Lifecycle State Machine (`src/lib/civic/status-policy.ts`):**
  - Allowed status transitions matrix (`ALLOWED_STATUS_TRANSITIONS`).
  - Role-based transition authorization (citizens can only reopen own resolved cases; officers can transition cases within their department).
  - Advisory SLA target calculations (Emergency: 6h, High: 24h, Medium: 72h, Low: 168h).
- **Backend API Routes:**
  - `POST /api/grievances`: Create grievance with atomic status history (`SUBMITTED`).
  - `GET /api/grievances`: Filtered listing with pagination and live counts.
  - `GET /api/grievances/[token]`: Public lookup with residential coordinate and citizen privacy masking.
  - `PATCH /api/grievances/[token]/status`: Validated status transition with immutable history record.
  - `POST /api/grievances/[token]/comments` & `GET`: Public citizen comments with internal municipal notes hidden from public viewers.
  - `POST /api/grievances/[token]/endorse`: Toggle endorsement with duplicate prevention.
  - `POST /api/grievances/[token]/follow`: Toggle follow with duplicate prevention.
  - `POST /api/grievances/[token]/feedback`: Submit satisfaction feedback on resolved cases.
  - `POST /api/grievances/[token]/evidence` & `GET`: Record and list evidence metadata.
  - `GET /api/departments`: Reference endpoint for 8 Pune municipal departments.
  - `GET /api/wards`: Reference endpoint for 15 Pune Prabhag administrative wards.
- **Verification Suites:**
  - `scripts/test-backend.js`: 68-point unit & repository verification suite (`npm run test:backend`).
  - `scripts/verify-e2e-backend.js`: 33-point live HTTP server integration test suite.

### Changed
- `package.json`: Registered `"test:backend": "node scripts/test-backend.js"`.
- `src/lib/auth/types.ts`: Extended `User` and `SessionPayload` interfaces with `departmentId` and `wardId`.
- `PROJECT_STATUS.md` and `README.md`: Updated with comprehensive Version 4 documentation and setup instructions.

---

## [Version 3.0.0] - 2026-10-20 — Authentication and Role-Based Access Control (RBAC)

### Added
- Server-side stateful identity and session issuance via cryptographically signed JWTs (HS256 via `jose`).
- Salted password hashing with `bcryptjs` (10 rounds).
- HTTP-only secure cookie transport (`punesetu_session`).
- Role-based access control protecting `/citizen/*`, `/officer/*`, and `/admin/*`.
- Administrator and Officer secure provisioning CLI scripts.
- Authentication test suite (`scripts/test-auth.js`).

---

## [Version 2.0.0] - 2026-10-19 — Premium Homepage and Public Navigation

### Added
- Responsive public navigation with PuneSetu brand identity.
- Hero section with live grievance tracking search bar.
- Pune 15 Prabhag wards quick directory.
- Municipal emergency contact hotlines.
- Theme switching support (Light, Dark, High-Contrast).

---

## [Version 1.0.0] - 2026-10-19 — Project Foundation and Civic Design System

### Added
- Next.js 16 App Router foundation with TypeScript and Tailwind CSS.
- Centralized PuneSetu Civic Design Tokens (color system, typography, accessible contrasts).
- Core UI components: Button, Card, Badge, Input.
