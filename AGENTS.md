# PuneSetu (पुणे सेतू) — Master Engineering Directive & Rules

**Project:** PuneSetu (पुणे सेतू)  
**Tagline:** Connecting Citizens. Empowering Communities. Improving Pune.  
**Category:** Civic Technology / GovTech / Smart City / Community Impact  
**Location:** Pune, Maharashtra, India (15 Administrative Prabhag Wards)  
**Hackathon:** Neighborhood Hacks 2026  

---

## 1. Core Operating Principles

1. **Version Boundaries:**
   - Always implement strictly the requested version. Never start future milestones or build speculative features.
2. **Honesty & Integrity:**
   - Never fabricate municipal complaints, resolution statistics, or official numbers.
   - Unavailable or future features must be explicitly labelled with clear roadmap indicators.
3. **Authentication & Security:**
   - Zero client-only authentication state or role trusting.
   - All session issuance, verification, and role access control is server-side authoritative.
   - Passwords must be hashed using bcrypt (10 rounds). Plaintext passwords must never be stored, logged, or exposed in API responses.
   - Session tokens must be signed JWTs stored exclusively in HTTP-only secure cookies (`punesetu_session`).
   - Public registration strictly provisions the `CITIZEN` role. Privileged accounts (`ADMIN`, `MUNICIPAL_OFFICER`) must be provisioned through secure administrative mechanisms.
4. **Design Excellence:**
   - Adhere to the PuneSetu Civic Design System: professional typography, accessible contrasts, theme switching (Light, Dark, High-Contrast), responsive layouts, and restrained civic branding.
5. **Quality Verification:**
   - Every version must pass TypeScript typecheck (`npm run typecheck`), ESLint (`npm run lint`), automated tests (`npm run test:auth`), and production build (`npm run build`).

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
