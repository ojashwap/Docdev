# Docaya client workshop

**Docaya · دوكايا · Document Management Intelligence / ذكاء إدارة الوثائق**

An experience prototype for the functional and business design v2.0. Demo identities and sample records are fictional. It does not certify compliance or connect to production services. Metadata is stored in localStorage; uploaded originals are stored in IndexedDB. No messages or files are sent to external services by the prototype.

## Fifteen-minute demo

1. Enter as **System Administrator**. Introduce the overview and Arabic toggle, which mirrors the layout and translates the main screens.
2. **Register document → Use a sample document**. Review the filename, signature check and SHA-256. Docaya suggests title, class, department, sensitivity and approval pattern from the filename and supported text. Inspect the rationale, override any field and confirm your review before submitting. Suggestions use local demo rules; PDFs and Office files are not OCR-extracted.
3. Open the record in **Approvals → Approval & publishing**. Approve each step or return with a mandatory explanation. Edit/resubmit returned records. Parallel flows allow either reviewer first; sequential flows enforce order. Conditional Secret records route to senior director and compliance.
4. Final approval publishes the original format with a version and simulated destination. Download the unchanged original. For recovery, open the seeded facilities report and retry publication. Admin settings can simulate new publication failures.
5. **Staging & publishing → Search indexing → Run demo batch**. Only Published records enter the demo index.
6. **Search & Ask Docaya**. Browse thumbnail cards or switch to the list; filter by class, department and sensitivity. Ask about road safety, civil defence, retention or your sample. The bottom-right **Ask Docaya ? AI Assistant** opens a companion panel with source thumbnails, follow-up questions and response feedback. Matching sample excerpts link to their record/version. This is deterministic retrieval, not a live LLM. Drafts, returned, archived and inaccessible records are excluded.
7. **Records & retention → open a record → Governance**. Apply a hold with a reference. Archiving, disposition and revisions are blocked. Release with a reason; declare or archive a record. Simulated disposition keeps registry history.
8. **Correspondence**. Register incoming/outgoing items, memos or circulars; record a reply, forward to a department, close an action and acknowledge reading. No external message is sent.
9. Switch to **Viewer**, select a department and compare register/search visibility. Write actions disappear. Switch back to administrator.
10. **Admin center**. Add a class and save. Change routing root, SLA, retention, cleanup, indexing cadence and demo notification preferences. Inspect the role matrix and integration cards.
11. Review notifications, state-derived reports, CSV export, browser print/PDF and activity history.
12. **Client workshop**. Explore M1–M15, capture expectations/priorities and export notes to CSV. Notes survive refresh in the same browser.
13. Export notes before resetting demo data, which removes local changes, originals and notes and restores the seed records.

## Coverage and boundaries

| Module            | Interactive prototype                                                                                  | Production / future work                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| M1 Capture        | File picker/drop, sample file, metadata, SHA-256, signature checks, duplicate detection, drafts        | 5 GB resumable/bulk uploads, malware/DLP, scan/email capture, cloud staging. Browser limit: 20 MB per file. |
| M2 Classification | Automatic demo suggestions, evidence/rationale, editable fields, explicit human confirmation           | Full per-class schema designer and advanced rules                                                           |
| M3 Workflow       | Queue and side-by-side preview drawer, next-pending navigation, four patterns, return/resubmit, SLA    | Real reviewer assignments, automated escalation, quorum configuration, email/Teams decisions                |
| M4 Publishing     | Approval-driven transition, native bytes, version labels, supersession, recoverable failure and replay | Graph transfer, durable orchestration, SharePoint IDs/URLs, transactional idempotency                       |
| M5 Staging        | Active/retained/purged indicators, cleanup preference, returned/failed items                           | Actual storage cleanup and abandoned-draft scheduler. Prototype cleanup is a state simulation.              |
| M6 RAG            | Explicit batch, published-only indexing flag, permission-aware cited sample retrieval                  | OCR, embeddings, hybrid Azure search, live generation and scheduled batches                                 |
| M7 Notifications  | Local lifecycle alerts, read/unread, mark-all, locked security preference                              | SignalR, email, Teams, push, quiet-hours scheduling, durable delivery                                       |
| M8 Correspondence | Registration, references, reply thread, assignment, due dates, close/reopen, acknowledgement           | External transport, attachment links, distribution lists, templates                                         |
| M9 Records        | Holds/release reasons, declaration, archive, confirmed simulated disposition, due filters              | Event-based policies, archive tiers, actual defensible deletion                                             |
| M10 Discovery     | Thumbnail/list views, facets, saved searches, cited assistant panel, English/Arabic matching           | Hybrid ranking, date/owner facets, shared smart views                                                       |
| M11 Identity      | Demo entry/UAE PASS simulation, integration design                                                     | UAE PASS federation, Entra OIDC/PKCE, MFA/step-up, service identity                                         |
| M12 Access        | Demo role/department rules, capability matrix, viewer write controls hidden                            | Server-enforced RBAC/ABAC, SharePoint ACLs, named groups. Browser controls are not a security boundary.     |
| M13 Admin         | Classes, routing root, default department, SLA, retention, cleanup, notification preferences           | Full workflow/schema/routing designers and security policy editors                                          |
| M14 Reports       | State-derived metrics, department filters, CSV and browser print/PDF                                   | Historical cycle times, scheduled reports, native XLSX, Power BI, anomalies                                 |
| M15 Audit         | Local actor/role/action/object/time/event IDs, CSV, demo signature certificate                         | Trusted attribution, hash-chained SQL, immutable storage, legally valid signatures, compliance evidence     |

## Visual and sample-data design

Warm ivory and muted gold, a subtle decorative UAE-inspired skyline and bilingual layouts support the MOI workshop context. The background illustration is decorative, not an official ministry emblem. Sample records cover Traffic & Patrols, Civil Defence, Forensic Sciences, Residency & Identity, and Strategy & Governance. All scenarios are synthetic. Existing browser records and workshop notes are preserved when these samples are added.

Full previews show original image, plain-text or PDF files when available; synthetic records use clearly marked sample pages. Office formats and PDF thumbnails use an honest cover with original download available.

## Architecture

`src/main.tsx` loads `src/prototype/PrototypeApp.tsx`. The prototype has no backend dependency. `model.ts` defines transitions and `files.ts` persists original files. Earlier `src/App.tsx`, `server/` and infrastructure remain as reference and are not imported by the default entry point. Earlier infrastructure/release workflows are not required for this prototype.

Each browser/origin has independent state. There is no shared collaboration or real authorization. Refresh preserves metadata and originals; reset clears only this prototype's state. Uploads and notes are never included in the static build or repository.

## Hosted client demo

The live prototype is available at **https://ojashwas.github.io/intdocayaprototype/**. GitHub Pages is configured to use GitHub Actions. To publish later changes, run **Publish prototype to GitHub Pages** after the quality workflow succeeds. It builds with `/intdocayaprototype/` as the asset base and uploads only `dist/`. It does not upload browser state. Each client starts with their own sample workspace.
