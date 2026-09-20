# CivicFlow data dictionary

## Storage overview

CivicFlow stores product records in Cloudflare D1, a managed SQLite database. Drizzle defines the schema in `db/schema.ts`; ordered SQL files in `drizzle/` apply the schema to local and hosted databases.

The portfolio deployment accepts synthetic service requests only. The model deliberately excludes resident names, email addresses, phone numbers, account identifiers, attachments, precise coordinates, and exact home addresses.

## Enumerations

### Request status

| Value | Meaning | Valid next lifecycle state |
| --- | --- | --- |
| `New` | The request entered the queue and has no owner | `Claimed` |
| `Claimed` | The portfolio administrator has taken ownership | `In Progress` |
| `In Progress` | Work is actively underway | `Resolved` |
| `Resolved` | An outcome note was recorded and the work is closed | None |

Deletion is an administrator action, not a stored request status. Deleting removes the request record while retaining a minimal audit event.

### Request priority

| Value | Intended interpretation |
| --- | --- |
| `Low` | Routine issue with limited operational effect |
| `Medium` | Standard queue priority |
| `High` | Material issue that should be reviewed promptly |
| `Urgent` | Time-sensitive issue requiring immediate triage |

Priority is resident-provided context in this portfolio version. It does not replace administrator review or represent an emergency dispatch service.

### Request category

- `Roads & sidewalks`
- `Water & drainage`
- `Street lighting`
- `Waste collection`
- `Parks & public spaces`
- `Other`

## Table: `service_requests`

| Column | SQLite type | Null | Key/default | Description |
| --- | --- | --- | --- | --- |
| `id` | `INTEGER` | No | Primary key, auto-increment | Internal database identifier. It is used only by authenticated administrator routes and is never the resident reference. |
| `public_id` | `TEXT` | No | Unique | Opaque, human-readable request reference returned after submission and used in audit events. |
| `title` | `TEXT` | No | — | Short operational summary of the issue. |
| `category` | `TEXT` | No | — | Service category selected from the supported category list. |
| `priority` | `TEXT` | No | — | One of `Low`, `Medium`, `High`, or `Urgent`. |
| `status` | `TEXT` | No | Default `New` | Current lifecycle state. |
| `location` | `TEXT` | No | — | General area, landmark, or intersection. The form tells users not to enter an exact home address. |
| `description` | `TEXT` | No | — | Operational detail supplied by the resident. |
| `assigned_to` | `TEXT` | Yes | Default `NULL` | Current owner. The portfolio workflow assigns the value `admin`. |
| `admin_note` | `TEXT` | Yes | Default `NULL` | Internal operations context. It is not exposed in public responses or CSV export. |
| `resolution_note` | `TEXT` | Yes | Default `NULL` | Required outcome evidence when a request becomes `Resolved`. |
| `created_at` | `INTEGER` | No | — | Creation time stored as Unix epoch milliseconds. |
| `updated_at` | `INTEGER` | No | — | Time of the latest lifecycle or note update. |
| `claimed_at` | `INTEGER` | Yes | Default `NULL` | Time at which an administrator claimed the request. |
| `resolved_at` | `INTEGER` | Yes | Default `NULL` | Time at which the request became resolved. |

### `service_requests` indexes

| Index | Columns | Purpose |
| --- | --- | --- |
| `uq_service_requests_public_id` | `public_id` | Enforces one unique public reference per request. |
| `idx_service_requests_status_created_at` | `status`, `created_at` | Supports queue grouping and recency ordering by status. |
| `idx_service_requests_category` | `category` | Supports category filters and demand summaries. |

## Table: `audit_logs`

| Column | SQLite type | Null | Key/default | Description |
| --- | --- | --- | --- | --- |
| `id` | `INTEGER` | No | Primary key, auto-increment | Internal event identifier. |
| `request_ref` | `TEXT` | No | — | Public request reference copied into the event. It is intentionally not a foreign key so a deletion event can outlive the request row. |
| `action` | `TEXT` | No | — | Short administrator event label such as claim, work start, note update, resolution, or deletion. |
| `actor` | `TEXT` | No | Default `admin` | Actor label for the administrator action recorded in the portfolio workflow. |
| `detail` | `TEXT` | Yes | Default `NULL` | Optional short event context. It should not contain resident personal information or full internal notes. |
| `created_at` | `INTEGER` | No | — | Event creation time stored as Unix epoch milliseconds. |

### `audit_logs` indexes

| Index | Columns | Purpose |
| --- | --- | --- |
| `idx_audit_logs_created_at` | `created_at` | Supports the reverse-chronological activity feed. |

## Field validation

The server is authoritative. Browser constraints provide earlier feedback but do not replace these checks.

| Input | Rule |
| --- | --- |
| `title` | Required trimmed text; 6–80 characters |
| `category` | Required value from the supported category list |
| `priority` | Required enum: Low, Medium, High, or Urgent |
| `location` | Required general-location text; no personal contact fields are requested |
| `description` | Required operational detail; 15–500 characters |
| `website` | Hidden honeypot; any non-empty value rejects the submission |
| `adminNote` | Optional bounded internal text |
| `resolutionNote` | Required with at least 10 characters for the resolve action |
| `action` | Administrator enum: `claim`, `start`, `resolve`, or `note` |

Whitespace is normalized before storage. Invalid types, out-of-range lengths, unsupported priorities or categories, and out-of-order lifecycle actions return a client-safe error and create no state change.

## API representations

### Public request creation input

```json
{
  "title": "Streetlight not working",
  "category": "Street lighting",
  "priority": "Medium",
  "location": "North Market entrance",
  "description": "The light beside the pedestrian entrance does not switch on after dark.",
  "website": ""
}
```

### Public request creation result

```json
{
  "request": {
    "publicId": "CF-2026-ABC123",
    "status": "New",
    "createdAt": 1789400000000
  }
}
```

The public result intentionally omits the internal row identifier, location, description, assignment, administrator notes, resolution note, and audit history.

### Administrator request representation

Authenticated queue responses include the complete `service_requests` record using camelCase JSON names:

| JSON name | Database column |
| --- | --- |
| `id` | `id` |
| `publicId` | `public_id` |
| `title` | `title` |
| `category` | `category` |
| `priority` | `priority` |
| `status` | `status` |
| `location` | `location` |
| `description` | `description` |
| `assignedTo` | `assigned_to` |
| `adminNote` | `admin_note` |
| `resolutionNote` | `resolution_note` |
| `createdAt` | `created_at` |
| `updatedAt` | `updated_at` |
| `claimedAt` | `claimed_at` |
| `resolvedAt` | `resolved_at` |

### Administrator mutation input

```json
{ "action": "claim" }
```

```json
{ "action": "start" }
```

```json
{ "action": "note", "adminNote": "Crew availability confirmed for the next route." }
```

```json
{
  "action": "resolve",
  "resolutionNote": "The faulty fitting was replaced and the light passed an evening check."
}
```

### Audit representation

Authenticated queue responses include recent audit records using camelCase JSON names:

| JSON name | Database column |
| --- | --- |
| `id` | `id` |
| `requestRef` | `request_ref` |
| `action` | `action` |
| `actor` | `actor` |
| `detail` | `detail` |
| `createdAt` | `created_at` |

## CSV export

CSV is an operational summary, not a database dump. It should include identifiers and structured workflow fields needed for reporting, such as:

- Public reference
- Title
- Category
- Priority
- Status
- General location
- Assignment
- Created, updated, claimed, and resolved times

It deliberately omits the resident description, internal administrator note, resolution note, numeric database identifier, and audit detail. Formula-like cell values must be escaped before export so spreadsheet software cannot interpret user text as a formula.

## Retention and migration notes

- Local data is stored under the ignored `.wrangler/state` directory.
- Production data is stored in the Site's D1 database.
- Schema changes must be generated with `npm run db:generate`, reviewed as SQL, and applied in filename order.
- Seed rows are created at runtime only for an empty portfolio database; they do not belong in migrations.
- The portfolio version does not define a legal or operational retention schedule. A real service must define retention, deletion, backup, recovery, access review, and audit governance before collecting data.
