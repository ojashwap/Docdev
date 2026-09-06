# Docaya client demonstration guide

**Docaya · دوكايا · Document Management Intelligence / ذكاء إدارة الوثائق**

Updated **6 September 2026** for the current prototype experience.

**[Open the hosted demo](https://ojashwas.github.io/intdocayaprototype/)** · [Local setup](../README.md#run-locally) · [Architecture](architecture.md)

This guide describes what the browser prototype actually demonstrates. Records, people and MOI scenarios are synthetic. Authentication, cloud services, AI generation and digital signatures are simulated; this application does not establish production security or compliance.

## Before the meeting

1. Open the hosted demo or start the local site using the README instructions. No API, Azure account or credentials are required.
2. Select **Enter demo workspace** and **System Administrator** for the full demonstration.
3. Check English and Arabic layouts and open the floating assistant once to introduce it.
4. Use sample documents or non-sensitive demonstration files. Each browser/origin has its own workspace; your localhost records will not appear automatically on GitHub Pages.
5. Export existing **Client workshop** notes before using **Reset demo data**. Reset removes local changes, uploaded originals and workshop notes.

## Fifteen-minute walkthrough

| Time      | Screen and action                                                             | Client discussion                                                           |
| --------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| 0–2 min   | Overview, document register and Arabic toggle                                 | Terminology, information hierarchy, departments and bilingual expectations. |
| 2–5 min   | Register a sample; review suggestions, override a field and confirm           | Required metadata, classification rules and human responsibility.           |
| 5–8 min   | Approvals; review in the drawer, return or approve, move to the next document | Reviewer workload, approval order, exception handling and publishing.       |
| 8–10 min  | Run an indexing batch; browse thumbnails and ask Docaya                       | Search filters, source visibility and expected AI assistance.               |
| 10–13 min | Records & retention, Correspondence and reports                               | Holds, retention, action tracking and reporting expectations.               |
| 13–15 min | Client workshop; record priorities and export CSV                             | Confirm requirements, open questions and the next iteration.                |

## Register and classify a document

1. Select **Register document → Use a sample document**, or pick/drop a supported file. Samples include a traffic safety circular, civil defence procedure and evidence handling standard.
2. In **Capture**, inspect the filename, file-header check, duplicate result and SHA-256 fingerprint.
3. In **Classify**, review the suggested title, document class, department, sensitivity, approval pattern and summary, together with the rationale.
4. Override any suggestion to reflect the client's rules. Replacing the file during intake preserves fields that the user has overridden.
5. Continue to **Review & submit**, inspect the final values and select **I have reviewed the document and classification**. Editing a classification field clears the confirmation so the revised values must be reviewed again.
6. Select **Submit for approval** to enter the approval flow, or save a draft where offered.

Classification runs locally on filenames and up to the first **12,000 characters of TXT files**. The confidence label is a deterministic rule score, not measured model accuracy. PDF, Office and image contents are not extracted or OCR-processed. All suggestions remain subject to human review.

The registration form requires confirmation before its submit action. The confirmation flag and suggestion rationale are temporary intake state. A saved draft also has a direct submit action in record details, which validates required metadata without checking a persisted confirmation flag.

## Review documents without losing the queue

![Approval queue and side-by-side document review drawer](images/docaya-review.png)

On wide screens, the approval queue remains visible while a drawer shows the document beside its details. There is no blurred backdrop. On narrow screens, preview and details stack; close the drawer to return to the queue.

- Filter the queue using **All**, **Overdue** or **Returned**, or search for a record.
- Open a document and inspect **Overview**, **Approval & publishing**, **Governance** and **Activity**.
- Use previous/next-document controls or **Next pending document** to continue reviewing. Each document still receives an explicit decision; this is not bulk approval.
- Select **Approve & sign**, or **Return for changes** with a mandatory explanation. Edit and resubmit a returned document to demonstrate the correction loop.
- Demonstrate single, sequential, parallel and conditional approval patterns. Sequential flows enforce order; parallel flows allow either reviewer first. Conditional Secret records route to senior director and compliance review.

Final approval transitions the document through the simulated publishing flow, preserving its original bytes and showing a version and destination. Download the unchanged original to demonstrate format preservation. To show recovery, open the seeded **Facilities inspection report** and retry publication; administrator settings can also simulate a new publication failure. The signature and destination are demonstration artifacts, not a trusted signature or a SharePoint transfer.

## Thumbnail discovery and the Docaya AI Assistant

![Ask Docaya thumbnail search with synthetic document sources](images/docaya-search.png)

Open **Search & Ask Docaya** to browse thumbnail cards or switch to a list. Filter by class, department and sensitivity, save a text query, and open a result to inspect its record and version.

Only accessible records that are **Published** and **indexed** appear in retrieval. After publishing a new record, use **Staging & publishing → Search indexing → Run demo batch**. Draft, returned, archived and inaccessible records are excluded.

Search matches registered titles, Arabic titles, document IDs, classes, summaries, departments and references. It does not perform semantic or full-content search over arbitrary uploaded files. Useful sample questions include:

- Find road safety awareness guidance.
- What do we have about community safety outreach?
- Find ministry document control guidance.

To retrieve the seeded civil defence or evidence handling documents, complete their approval flow and run the indexing batch first; those examples begin pending review.

The bottom-right **Ask Docaya · AI Assistant** opens a companion panel with cited answers, source thumbnails, suggested questions and response feedback. Use **Explore thumbnails** to move into discovery. `Ctrl+J` on Windows or `Cmd+J` on macOS toggles the assistant while it is mounted; `Escape` or minimize closes the panel.

Answers use local deterministic retrieval from registered sample text, with links to supporting records. There is no live LLM, OCR, embedding service or external AI call. Each question is retrieved independently; chat history is not conversational model memory. Changing persona recalculates source access and removes inaccessible sources from existing answers. Chat history and response ratings are temporary component state.

## File and preview behavior

| File or record                      | Preview and download                                                                                          |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Seeded synthetic record             | Clearly marked sample page; download provides sample TXT rather than an invented original PDF or Office file. |
| Uploaded TXT                        | Preview of up to the first 200 KB; unchanged original remains downloadable.                                   |
| Browser-supported image             | Original image preview and original download.                                                                 |
| Uploaded PDF                        | Browser PDF viewer in the full preview where supported; thumbnail uses a cover, not rendered page extraction. |
| DOCX, XLSX or PPTX                  | Cover with file information and original download; no Office renderer or content extraction.                  |
| TIFF or unsupported image rendering | Preview depends on browser support; use the fallback and original download when it cannot render.             |

Accepted formats are **PDF, DOCX, XLSX, PPTX, PNG, JPEG, TIFF and TXT**, with a **20 MB per-file** browser limit. SHA-256, basic signature/header checks and duplicate detection support the capture demonstration. They do not constitute malware or DLP scanning. Uploaded bytes are preserved in IndexedDB.

## Readability and UAE visual design

The current design uses warm ivory, muted gold and a faint decorative UAE-inspired skyline. The artwork is decorative and is not an official ministry emblem. Synthetic scenarios cover Traffic & Patrols, Civil Defence, Forensic Sciences, Residency & Identity, and Strategy & Governance.

| Element                    | Current design                                                                                     |
| -------------------------- | -------------------------------------------------------------------------------------------------- |
| English body               | Bundled Inter, 15 px base size.                                                                    |
| Arabic body                | Bundled Noto Sans Arabic, 16 px base size and right-to-left layout.                                |
| Task labels and table text | 14 px with clearer contrast and spacing.                                                           |
| Standard captions          | 12.5 px; miniature document pages and compact brand/file-format marks use smaller decorative text. |
| Small-screen forms         | 16 px inputs and primary buttons at least 44 px high.                                              |
| Narrow registration drawer | Single-column fields below 470 px of form-container width.                                         |

Fonts are bundled with the application, so loading the UI does not require an external font service. Drawers use readable surfaces without background blur, and review tabs wrap to keep labels available at narrower widths.

## Governance, administration and workshop actions

- **Records & retention:** apply a hold with a reference and show that archive, disposition and revision actions are blocked. Release with a reason, declare or archive a record, and demonstrate confirmed simulated disposition while registry history remains.
- **Correspondence:** register incoming/outgoing items, memos or circulars; record replies, forward to a department, close/reopen an action and acknowledge reading. These actions update local state and do not send external messages.
- **Personas:** switch to Viewer, select a department and compare visibility. Document registration, approval and governance controls are unavailable to Viewer. Browser role controls demonstrate intended behavior; they are not a server security boundary.
- **Admin center:** add a class, configure routing root, default department, SLA, retention, cleanup, indexing cadence and notification preferences. Inspect the capability matrix and simulated integration cards.
- **Reports and activity:** review state-derived metrics, department filters, CSV export, browser print/PDF and local event history.
- **Client workshop:** explore M1–M15, capture expectations and priorities, and export notes to CSV before a reset.

## M1–M15 coverage and boundaries

| Module            | Interactive prototype                                                                                   | Production / future work                                                                         |
| ----------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| M1 Capture        | Picker/drop, samples, metadata, SHA-256, header checks, duplicate detection and drafts; 20 MB per file. | 5 GB resumable/bulk uploads, malware/DLP, scan/email capture and cloud staging.                  |
| M2 Classification | Local suggestions, rationale, overrides and explicit confirmation in registration.                      | Per-class schema designer, advanced rules and model-based content extraction.                    |
| M3 Workflow       | Queue and review drawer, next-pending navigation, four patterns, return/resubmit and SLA indicators.    | Real reviewer assignments, automated escalation, quorum configuration and email/Teams decisions. |
| M4 Publishing     | Approval-driven transition, original bytes, versions, supersession, failure and retry.                  | Graph transfer, durable orchestration, SharePoint IDs/URLs and transactional idempotency.        |
| M5 Staging        | Active/retained/purged indicators, cleanup preference and returned/failed items.                        | Actual storage cleanup and abandoned-draft scheduler; current cleanup is a state simulation.     |
| M6 RAG            | Explicit batch, published-only index flag and permission-aware cited sample retrieval.                  | OCR, embeddings, hybrid Azure search, live generation and scheduled batches.                     |
| M7 Notifications  | Local lifecycle alerts, read/unread, mark-all and locked security preference.                           | SignalR, email, Teams, push, quiet-hours scheduling and durable delivery.                        |
| M8 Correspondence | Registration, references, reply thread, assignment, due dates, close/reopen and acknowledgement.        | External transport, attachment links, distribution lists and templates.                          |
| M9 Records        | Holds/release reasons, declaration, archive, simulated disposition and due filters.                     | Event-based policies, archive tiers and actual defensible deletion.                              |
| M10 Discovery     | Thumbnail/list views, facets, saved queries, cited assistant and English/Arabic matching.               | Hybrid ranking, date/owner facets and shared smart views.                                        |
| M11 Identity      | Demo entry, UAE PASS simulation and integration design.                                                 | UAE PASS federation, Entra OIDC/PKCE, MFA/step-up and service identity.                          |
| M12 Access        | Demo role/department rules, capability matrix and restricted document controls for Viewer.              | Server-enforced RBAC/ABAC, SharePoint ACLs and named groups.                                     |
| M13 Admin         | Classes, routing root, default department, SLA, retention, cleanup and notification preferences.        | Full workflow/schema/routing designers and security policy editors.                              |
| M14 Reports       | State-derived metrics, department filters, CSV and browser print/PDF.                                   | Historical cycle times, scheduled reports, native XLSX, Power BI and anomalies.                  |
| M15 Audit         | Local actor/role/action/object/time/event IDs, CSV and demo signature certificate.                      | Trusted attribution, hash-chained SQL, immutable storage and legally valid signatures.           |

## Persistence and reset

| Data                                                        | Behavior                                                                        |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Records, settings, audit, saved searches and workshop notes | Stored in localStorage and preserved across refresh in the same browser/origin. |
| Uploaded originals                                          | Stored separately in IndexedDB, keyed to their document record.                 |
| Language preference                                         | Persists locally.                                                               |
| Demo sign-in                                                | Stored for the browser session.                                                 |
| Active page and persona                                     | Reset on refresh to Overview and System Administrator.                          |
| Assistant chat and response ratings                         | Temporary component state; not part of the saved workspace.                     |

Sample-data migration appends missing MOI examples while preserving existing records and workshop notes. Clearing site data, resetting the demo, or browser storage eviction can remove local work. Export workshop notes and retain any original files you need outside the demonstration.

Each localhost port and the hosted site is a separate origin. There is no shared collaboration, cross-device sync or real authorization. Git pushes and static deployments publish application files only; they do not upload or synchronize browser records, originals or notes.

## Architecture and validation

`src/main.tsx` loads `src/prototype/PrototypeApp.tsx`. The current prototype has no backend dependency. See [Architecture](architecture.md) for source responsibilities, storage and the retained connected-application design.

The latest UI revision passed build, lint, unit/integration checks and the nine prototype browser journeys. Manual browser review covered desktop/mobile English and Arabic screens, font loading, registration, approval review and search; automated accessibility scans found no violations in the scanned states. These are prototype checks, not a production accessibility or compliance certification. Reproducible commands are in the [README](../README.md#validate-changes).

## Publishing the client demo

The hosted URL is **https://ojashwas.github.io/intdocayaprototype/**. Push to `main`: **Prototype quality** runs, then **Publish prototype to GitHub Pages** deploys the exact tested commit after a successful push run. Pull-request runs do not publish. Manual dispatch builds the selected revision without requiring that preceding quality result; validate before using it.

Pages builds with `/intdocayaprototype/` as the asset base and uploads only `dist/`. Each client starts with an independent sample workspace. See the [publishing instructions](../README.md#publish-to-github-pages).
