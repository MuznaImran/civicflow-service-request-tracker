# CivicFlow product requirements

## 1. Product statement

CivicFlow is an end-to-end portfolio application that demonstrates how a simple resident report can become structured, accountable operations work. It gives residents a low-friction submission path and gives one portfolio administrator a clear request queue, ownership workflow, outcome records, and reporting.

CivicFlow is an independent educational project. It is not an official service and has no affiliation with UNDP, a government agency, or a public service provider.

## 2. Problem

Unstructured service reports are difficult to route, prioritize, and close. Residents may not know which details matter, while operations staff need consistent categories, priorities, ownership, status, and outcome evidence. A useful digital product must make submission easy without sacrificing the structured information needed by the team receiving the work.

## 3. Goals

1. Let a resident submit one actionable service issue without creating an account.
2. Give each submission a clear, opaque reference.
3. Give an administrator a single operational queue with search and filters.
4. Record ownership and enforce a visible request lifecycle.
5. Require an outcome before work can be marked resolved.
6. Preserve minimal audit context for administrator actions.
7. Turn request data into useful queue metrics and a CSV export.
8. Demonstrate product thinking, documentation, full-stack development, and operations coordination in a portfolio-safe environment.

## 4. Scope boundaries

CivicFlow is designed for synthetic portfolio data. The current version deliberately excludes:

- Resident accounts or personal profiles.
- Names, email addresses, phone numbers, or exact home addresses.
- Public browsing or retrieval of submitted requests.
- File uploads, images, or location coordinates.
- Multiple administrator identities, teams, or fine-grained permissions.
- Notifications, service-level agreements, escalation rules, and external system integrations.
- Claims of use by any real organization.

## 5. Personas and access

### Resident

The resident wants to describe an issue quickly and understand that it entered the queue. Selecting the Resident portal opens the submission experience immediately; no password is requested.

The resident may:

- Submit one request at a time.
- Choose a service category and priority.
- Provide a general location and operational description.
- Receive a request reference and initial status.
- Submit another request after confirmation.

The resident may not:

- Browse, search, retrieve, update, or delete requests.
- View administrator notes, assignments, analytics, or audit events.

### Portfolio administrator

The administrator demonstrates how an operations team would triage and complete the work. The review credential is `admin` / `admin` and must only be used with synthetic data.

The administrator may:

- Sign in and out.
- View request and audit data.
- Search and filter the queue.
- Claim an unassigned request.
- Move a claimed request into active work.
- Add or edit an internal operations note.
- Resolve an in-progress request after recording the outcome.
- Delete a request after an explicit confirmation.
- Export an operations-safe CSV.

## 6. Functional requirements

### FR-1: Portal selection

- The landing page must present Resident and Administrator choices.
- Choosing Resident must enter the form without authentication.
- Choosing Administrator must show a credential form or restore a valid administrator session.

### FR-2: Resident submission

- Required fields: title, category, priority, general location, and description.
- Categories: Roads & sidewalks; Water & drainage; Street lighting; Waste collection; Parks & public spaces; Other.
- Priorities: Low; Medium; High; Urgent.
- The interface must explain that general location details should not contain names, contact details, or exact home addresses.
- Client constraints must guide the user, but the server remains authoritative.
- A hidden honeypot field must reject obvious automated submissions without creating a record.
- A successful response must show the generated public reference and `New` status.
- A failed response must preserve the form and show a useful error.

### FR-3: Request reference

- Every record must have an internal numeric identifier and a distinct public reference.
- The public reference must not expose the internal row identifier.
- Public submission responses must not return the complete stored record.

### FR-4: Administrator session

- The server must validate administrator credentials.
- A successful login must issue a signed, time-limited, HttpOnly session cookie.
- The client must not persist credentials or the session token in local storage.
- State-changing administrator requests must include a CSRF token that matches the server-issued cookie.
- A missing, invalid, or expired session must return the administrator to sign-in.

### FR-5: Queue and operational overview

- The administrator dashboard must show total, new, active, and resolved counts.
- Active work must include both `Claimed` and `In Progress` records.
- The queue must support free-text search across reference, title, location, and description.
- The queue must filter by status, category, and priority.
- The interface must provide loading, empty, no-match, refresh, and request-error states.
- Desktop and compact mobile layouts must expose the same request detail action.

### FR-6: Request lifecycle

The lifecycle is sequential:

1. `New` — submitted and waiting for ownership.
2. `Claimed` — assigned to the current portfolio administrator.
3. `In Progress` — active work has started.
4. `Resolved` — the final outcome has been recorded.

Rules:

- Only a `New` request can be claimed.
- Claiming must record the owner and claim time.
- Only a `Claimed` request can be started.
- Only an `In Progress` request can be resolved.
- Resolution requires a meaningful resolution note.
- Every lifecycle change must update the record time and add an audit event.
- Invalid or out-of-order transitions must be rejected on the server.

### FR-7: Internal notes

- An administrator may store a short internal operations note.
- Internal notes must never appear in the resident submission response or CSV export.
- Saving a note must update the request and add an audit event without changing the lifecycle status.

### FR-8: Deletion

- Delete must appear as a destructive action in request details.
- The interface must display a clear, explicit confirmation before sending the request.
- The service request must be deleted from the queue.
- A minimal audit event containing the public reference and deletion action must remain.

### FR-9: Audit activity

- The dashboard must show recent administrator events in reverse chronological order.
- Events must identify the request reference, action, actor, time, and optional short detail.
- The audit table must not require a live foreign key to a request so deletion evidence can remain.

### FR-10: Reporting and export

- The dashboard must summarize demand by service category.
- CSV export must require an administrator session.
- The export must use clear column headings and a timestamped filename.
- The export must omit free-text descriptions, internal notes, and resolution notes to reduce accidental exposure.

### FR-11: Synthetic starter records

- An empty portfolio database may receive a small synthetic dataset when the administrator first loads the queue.
- Starter records must use fictional, general locations and contain no personal data.
- Schema migrations must not contain seed data.

### FR-12: Browser Model Context Protocol tool

- The page may register a write-capable tool for submitting a synthetic resident request.
- The tool input schema must use the same categories, priorities, and field bounds as the resident form.
- The tool must call the same public API and show the resulting confirmation in the resident portal.
- The tool must not expose administrator actions or bypass server validation.

## 7. Non-functional requirements

### Usability and accessibility

- Use semantic form labels, buttons, tables, dialogs, and status text.
- Do not communicate status or priority through color alone.
- Support keyboard focus and reduced-motion preferences.
- Keep the interface usable on small and large screens.
- Explain destructive actions, private notes, and required resolution evidence before action.

### Data integrity

- D1 is the source of truth; product records must not rely on local storage.
- Use parameterized queries or typed Drizzle operations.
- Apply schema changes through ordered SQL migrations.
- Enforce field lengths, enums, and lifecycle rules on the server.
- Disable caching for authenticated or mutable JSON responses.

### Security and privacy

- Use synthetic data in the portfolio deployment.
- Collect no resident contact details.
- Use signed, HttpOnly, SameSite cookies and secure cookies on HTTPS.
- Require CSRF validation and same-origin checks for administrator mutations.
- Return generic service errors rather than stack traces.
- Never commit `.env.local`, local D1 state, or production secrets.

### Performance and resilience

- Provide immediate loading and mutation feedback.
- Keep dashboard filtering responsive for a portfolio-scale dataset.
- Use database indexes for status/creation-time, category, and audit recency queries.
- Make an empty database a valid, useful state.

## 8. Acceptance criteria

The first release is accepted when:

1. A resident can submit each valid category and priority without signing in.
2. Invalid fields and the honeypot do not create records.
3. A successful submission returns only a reference, status, and creation time.
4. Incorrect administrator credentials fail without creating a session.
5. A valid session survives a page refresh and can be explicitly cleared.
6. Unauthenticated users cannot read, export, mutate, or delete administrator data.
7. Missing or incorrect CSRF tokens cannot mutate administrator data.
8. A request can complete `New → Claimed → In Progress → Resolved` in order.
9. A request cannot resolve without a resolution note.
10. Search and all three filters produce the correct visible subset.
11. Delete requires confirmation and leaves an audit event.
12. CSV export excludes free-text and internal fields.
13. Loading, empty, error, confirmation, and session-expiry states are understandable.
14. Lint and the production build complete successfully.

## 9. Future product roadmap

### Production identity and governance

- Replace shared credentials with an identity provider.
- Add named accounts, roles, least-privilege authorization, and account revocation.
- Hash any locally managed passwords and rate-limit authentication.
- Define retention, deletion, backup, recovery, and audit-review policies.

### Operations maturity

- Add configurable teams, assignment, due dates, service-level targets, and escalations.
- Add saved filters, pagination, request history, and workload views.
- Add notification preferences and outbound email or messaging integrations.
- Add import and scheduled reporting.

### Resident experience

- Add privacy-preserving request lookup with a separate secret.
- Add multilingual content and accessibility testing with representative users.
- Add attachments only after defining malware scanning, moderation, storage, and retention controls.
- Add feedback on completed work without exposing internal notes.

### Delivery quality

- Add unit tests for lifecycle and validation rules.
- Add API integration tests for authentication, CSRF, and authorization boundaries.
- Add browser tests for the two critical role journeys.
- Add structured observability and redacted error reporting.
