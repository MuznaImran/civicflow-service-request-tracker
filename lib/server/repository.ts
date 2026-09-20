import { getD1 } from "@/db";

import { HttpError } from "./http";
import type {
  AdminAction,
  AuditRecord,
  NewRequestInput,
  RequestPriority,
  RequestRecord,
  RequestStatus,
} from "./types";

interface RequestRow {
  id: number;
  publicId: string;
  title: string;
  category: string;
  priority: RequestPriority;
  status: RequestStatus;
  location: string;
  description: string;
  assignedTo: string | null;
  adminNote: string | null;
  resolutionNote: string | null;
  createdAt: number;
  updatedAt: number;
  claimedAt: number | null;
  resolvedAt: number | null;
}

interface AuditRow {
  id: number;
  requestRef: string;
  action: string;
  actor: string;
  detail: string | null;
  createdAt: number;
}

const REQUEST_COLUMNS = `
  id,
  public_id AS "publicId",
  title,
  category,
  priority,
  status,
  location,
  description,
  assigned_to AS "assignedTo",
  admin_note AS "adminNote",
  resolution_note AS "resolutionNote",
  created_at AS "createdAt",
  updated_at AS "updatedAt",
  claimed_at AS "claimedAt",
  resolved_at AS "resolvedAt"
`;

const AUDIT_COLUMNS = `
  id,
  request_ref AS "requestRef",
  action,
  actor,
  detail,
  created_at AS "createdAt"
`;

const SYNTHETIC_REQUESTS: Array<NewRequestInput & { publicId: string; ageHours: number }> = [
  {
    publicId: "CF-2026-A1047",
    title: "Streetlight outage near community library",
    category: "Street lighting",
    priority: "High",
    location: "Library Road, Sector 4",
    description: "Two streetlights near the pedestrian crossing have been out for several evenings.",
    ageHours: 2,
  },
  {
    publicId: "CF-2026-B2381",
    title: "Blocked storm drain after rainfall",
    category: "Water & drainage",
    priority: "Urgent",
    location: "Market Lane, Block B",
    description: "Standing water is collecting beside the public footpath because the drain appears blocked.",
    ageHours: 5,
  },
  {
    publicId: "CF-2026-C5192",
    title: "Damaged bench in neighborhood park",
    category: "Parks & public spaces",
    priority: "Medium",
    location: "Central Park, north entrance",
    description: "A wooden bench has a broken support and should be repaired before it becomes unsafe.",
    ageHours: 20,
  },
  {
    publicId: "CF-2026-D6730",
    title: "Faded pedestrian crossing markings",
    category: "Roads & sidewalks",
    priority: "High",
    location: "School Avenue junction",
    description: "The crossing markings near the school gate are difficult for drivers to see.",
    ageHours: 30,
  },
  {
    publicId: "CF-2026-E8426",
    title: "Overflowing public waste container",
    category: "Waste collection",
    priority: "Medium",
    location: "Community Centre parking area",
    description: "The shared waste container needs collection and the surrounding area needs cleaning.",
    ageHours: 44,
  },
];

function publicRequestId(): string {
  const now = new Date();
  const random = new Uint8Array(4);
  crypto.getRandomValues(random);
  const suffix = Array.from(random, (byte) => byte.toString(16).padStart(2, "0")).join("").toUpperCase();
  return `CF-${now.getUTCFullYear()}-${suffix}`;
}

export async function createServiceRequest(input: NewRequestInput): Promise<RequestRecord> {
  const database = getD1();
  const now = Date.now();
  const row = await database
    .prepare(
      `INSERT INTO service_requests
        (public_id, title, category, priority, status, location, description, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'New', ?, ?, ?, ?)
       RETURNING ${REQUEST_COLUMNS}`,
    )
    .bind(
      publicRequestId(),
      input.title,
      input.category,
      input.priority,
      input.location,
      input.description,
      now,
      now,
    )
    .first<RequestRow>();

  if (!row) throw new Error("The request could not be saved.");
  return row;
}

export async function ensureSyntheticData(): Promise<void> {
  const database = getD1();
  const count = await database.prepare("SELECT COUNT(*) AS count FROM service_requests").first<{ count: number }>();
  if ((count?.count ?? 0) > 0) return;

  const now = Date.now();
  const statements = SYNTHETIC_REQUESTS.map((request) => {
    const createdAt = now - request.ageHours * 60 * 60 * 1_000;
    return database
      .prepare(
        `INSERT OR IGNORE INTO service_requests
          (public_id, title, category, priority, status, location, description, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'New', ?, ?, ?, ?)`,
      )
      .bind(
        request.publicId,
        request.title,
        request.category,
        request.priority,
        request.location,
        request.description,
        createdAt,
        createdAt,
      );
  });

  await database.batch(statements);
}

interface ListFilters {
  status?: string;
  priority?: string;
  category?: string;
  query?: string;
}

export async function listServiceRequests(filters: ListFilters): Promise<RequestRecord[]> {
  const database = getD1();
  const clauses: string[] = [];
  const bindings: Array<string | number> = [];

  if (filters.status) {
    clauses.push("status = ?");
    bindings.push(filters.status);
  }
  if (filters.priority) {
    clauses.push("priority = ?");
    bindings.push(filters.priority);
  }
  if (filters.category) {
    clauses.push("category = ?");
    bindings.push(filters.category);
  }
  if (filters.query) {
    clauses.push("(public_id LIKE ? OR title LIKE ? OR location LIKE ?)");
    const query = `%${filters.query.replace(/[\\%_]/g, "\\$&")}%`;
    bindings.push(query, query, query);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const statement = database.prepare(
    `SELECT ${REQUEST_COLUMNS} FROM service_requests ${where}
     ORDER BY CASE priority WHEN 'Urgent' THEN 1 WHEN 'High' THEN 2 WHEN 'Medium' THEN 3 ELSE 4 END,
              created_at DESC
     LIMIT 250`,
  );
  const result = bindings.length
    ? await statement.bind(...bindings).all<RequestRow>()
    : await statement.all<RequestRow>();
  return result.results;
}

export async function listAuditLogs(): Promise<AuditRecord[]> {
  const result = await getD1()
    .prepare(`SELECT ${AUDIT_COLUMNS} FROM audit_logs ORDER BY created_at DESC LIMIT 30`)
    .all<AuditRow>();
  return result.results;
}

export async function getServiceRequest(id: number): Promise<RequestRecord | null> {
  return getD1()
    .prepare(`SELECT ${REQUEST_COLUMNS} FROM service_requests WHERE id = ?`)
    .bind(id)
    .first<RequestRow>();
}

export async function mutateServiceRequest(
  id: number,
  action: AdminAction,
  values: { adminNote: string; resolutionNote: string },
): Promise<RequestRecord> {
  const existing = await getServiceRequest(id);
  if (!existing) throw new HttpError(404, "Request not found.");
  if (existing.status === "Resolved" && action !== "note") {
    throw new HttpError(409, "Resolved requests can only receive an internal note.");
  }

  const now = Date.now();
  let updateSql: string;
  let detail: string;
  let bindings: Array<string | number>;

  if (action === "claim") {
    if (existing.status !== "New") throw new HttpError(409, "Only new requests can be claimed.");
    updateSql = "status = 'Claimed', assigned_to = 'admin', claimed_at = COALESCE(claimed_at, ?), updated_at = ?";
    bindings = [now, now];
    detail = "Request assigned to admin";
  } else if (action === "start") {
    if (existing.status !== "Claimed" || !existing.assignedTo) {
      throw new HttpError(409, "Only claimed requests can be moved to In Progress.");
    }
    updateSql = "status = 'In Progress', updated_at = ?";
    bindings = [now];
    detail = "Status changed to In Progress";
  } else if (action === "resolve") {
    if (existing.status !== "In Progress" || !existing.assignedTo) {
      throw new HttpError(409, "Only requests in progress can be resolved.");
    }
    updateSql = "status = 'Resolved', resolution_note = ?, resolved_at = ?, updated_at = ?";
    bindings = [values.resolutionNote, now, now];
    detail = "Request resolved with a resolution note";
  } else {
    updateSql = "admin_note = ?, updated_at = ?";
    bindings = [values.adminNote || "", now];
    detail = values.adminNote ? "Internal note updated" : "Internal note cleared";
  }

  const database = getD1();
  const update = database
    .prepare(`UPDATE service_requests SET ${updateSql} WHERE id = ? RETURNING ${REQUEST_COLUMNS}`)
    .bind(...bindings, id);
  const audit = database
    .prepare(
      "INSERT INTO audit_logs (request_ref, action, actor, detail, created_at) VALUES (?, ?, 'admin', ?, ?)",
    )
    .bind(existing.publicId, action, detail, now);
  const [updateResult] = await database.batch<RequestRow>([update, audit]);
  const updated = updateResult.results[0];
  if (!updated) throw new Error("The request could not be updated.");
  return updated;
}

export async function deleteServiceRequest(id: number): Promise<void> {
  const existing = await getServiceRequest(id);
  if (!existing) throw new HttpError(404, "Request not found.");

  const database = getD1();
  const deletion = database.prepare("DELETE FROM service_requests WHERE id = ?").bind(id);
  const audit = database
    .prepare(
      "INSERT INTO audit_logs (request_ref, action, actor, detail, created_at) VALUES (?, 'delete', 'admin', ?, ?)",
    )
    .bind(existing.publicId, "Request permanently deleted", Date.now());
  await database.batch([deletion, audit]);
}
