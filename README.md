# Docaya prototype

**Docaya · دوكايا · Document Management Intelligence / ذكاء إدارة الوثائق**

An interactive Arabic/English client demonstration with sample records, manual registration, four approval patterns, publishing recovery, cited knowledge search, correspondence, records governance, reporting, administration, audit and client workshop feedback.

## Start the prototype

Requires Node.js 22.13–26 and npm 10–11.

```powershell
npm ci
npm start
```

Open **http://localhost:5173/** and select **Enter demo workspace**. Choose System Administrator to demonstrate every module. Use the language toggle for Arabic/RTL and the persona selector for access rules.

No API, Azure account, credentials or `.env` file is required. Production integrations are explicitly simulated. This is a UI/UX prototype, not a production security or compliance implementation.

See [the workshop walkthrough and M1–M15 coverage matrix](docs/prototype-demo.md) for presentation steps and exact simulation boundaries.

- Original uploads: stored in IndexedDB, limited to 20 MB per file in the browser demo.
- Records, settings and workshop notes: stored locally and preserved across refresh.
- Ask Docaya: cited excerpts from accessible, published and indexed sample text; no live AI.
- Workshop: capture expectations and export CSV. Export notes before resetting demo data.

## Validate the prototype

```powershell
npm run build
npm run lint
npm test
npm run test:e2e
```

Browser tests cover registration through cited search and legal holds, role filtering, correspondence, feedback persistence, Arabic/RTL, mobile and an accessibility scan. Local Windows tests use installed Chrome; CI installs Chromium.

## Static hosting

`npm run build` produces `dist/`. Preview with `npm run preview` or serve from a static host. A manual GitHub Pages workflow is included; see the demo guide. Pushing source does not itself publish a website.

Prototype repository: [Ojashwas/intdocayaprototype](https://github.com/Ojashwas/intdocayaprototype).

The default entry point is `src/prototype/PrototypeApp.tsx`. It makes no production API calls.

<details>
<summary>Legacy connected application reference — not required for the prototype</summary>

Docaya is a secure, bilingual document-governance workspace for controlled records, approvals, notifications, audit, and administration. This repository implements the v1.1 remediation baseline from `Docaya-DMS-Specification.md`.

## Prerequisites

- Node.js 22.13–26 and npm 10–11
- Azure CLI with Bicep for infrastructure validation
- Docker for production-image builds
- Playwright Chromium and k6 for E2E/accessibility/load gates
- PostgreSQL 16 for shared environments; SQLite is restricted to deliberate local development and tests

## Local startup

```powershell
Copy-Item .env.example .env
npm ci
npm run dev:api
npm run dev
```

Open `http://localhost:5173`, then use **Continue with organizational SSO**. The local button obtains a one-hour, signed development token; `AUTH_MODE=development` is rejected outside development/test. Never enter a real password in the prototype.

## Environment

`.env.example` documents every supported setting. Production requires `AUTH_MODE=entra`, `ENTRA_TENANT_ID`, `ENTRA_CLIENT_ID`, an allowlisted `CORS_ALLOWED_ORIGINS`, `DATABASE_URL` (or compatibility alias `POSTGRES_URL`) supplied as a Container Apps secret reference, and explicit SharePoint site/drive identifiers when Graph storage is enabled. Production fails closed if SQLite, wildcard CORS, incomplete Entra configuration, or an unvalidated PostgreSQL store is selected.

## Commands

| Command                    | Purpose                                 |
| -------------------------- | --------------------------------------- |
| `npm run build`            | TypeScript and Vite production build    |
| `npm run typecheck`        | Strict TypeScript check                 |
| `npm run lint`             | ESLint with zero warnings               |
| `npm run format:check`     | Prettier verification                   |
| `npm test`                 | Unit coverage and API integration tests |
| `npm run test:e2e`         | Playwright critical journeys            |
| `npm run test:a11y`        | axe browser checks                      |
| `npm run test:load`        | k6 search/list load profile             |
| `npm run security:audit`   | Production dependency audit             |
| `npm run openapi:validate` | OpenAPI 3.1 policy validation           |
| `npm run infra:build`      | Bicep compilation                       |

## Architecture

The React 18 frontend is divided into app shell, accessible components, domain features, i18n catalogs, typed services, styles, and shared types. The Node API is composed from validated configuration, security middleware, versioned routes, services, and migration-controlled repositories. Every business route is under `/api/v1`, requires a verified bearer token, applies deny-by-default capability checks, and returns a request ID in a normalized error envelope.

Upload sessions accept bounded binary chunks, support cancellation/retry, quarantine before commit, calculate SHA-256, and run malware/DLP adapters before metadata is committed. The included deterministic scanner is development-only; the production deployment must bind the approved scanning service and verify interruption/load evidence.

See [architecture](docs/architecture.md), [threat model](docs/threat-model.md), [API contract](docs/api/openapi.json), and [operations runbook](docs/runbooks/operations.md).

### Notifications and administration

Notifications are persisted per tenant and support listing, mark-all-read, individual
read/unread state, and category preferences through `/api/v1/notifications`.
The Admin Center is organized into Overview, Users, and Governance settings sections.
Overview shows live platform dependency health sourced from `/health/ready` (database,
search, cache, event bus). Users can be searched and filtered by status, invited via
`POST /api/v1/admin/users`, and have their role or lifecycle status (invited, active,
suspended, deprovisioned) updated in place via `PATCH /api/v1/admin/users/:id` — both
require `admin:write` and are fully audited; an administrator cannot suspend or
deprovision their own account. Governance settings expose language, retention, workflow
enforcement, and document-event notification defaults, updatable through
`/api/v1/admin/settings` with `admin:write`. SQLite and PostgreSQL migrations are kept in
sync under `server/db/migrations` and `server/db/postgres-migrations`.

## Deployment

1. Build and scan an immutable image, push it to ACR, and pass its release tag or digest to `containerImage`.
2. Run `az deployment group validate` and `az deployment group what-if` with an identity permitted to create the declared least-privilege role assignments.
3. Review private endpoint DNS, managed-identity access, policy compliance, and the image scan.
4. Apply migrations, rehearse rollback, deploy progressively, then execute synthetic login/search/upload/view/workflow/audit checks.
5. Record evidence under the release system; generated credentials, ARM JSON, and evidence output are ignored by Git.

Cloud release gates are not considered passed merely because Bicep compiles. Tenant consent, target-scope validation, reviewed what-if, policy/RBAC evidence, real malware/DLP integration, private DNS verification from the running app, backup/restore rehearsal, and product/security/accessibility/operations approvals remain environment-owned gates.

</details>
