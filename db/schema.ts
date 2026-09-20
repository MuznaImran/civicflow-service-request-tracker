import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const serviceRequests = sqliteTable(
  "service_requests",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    publicId: text("public_id").notNull(),
    title: text("title").notNull(),
    category: text("category").notNull(),
    priority: text("priority").notNull(),
    status: text("status").notNull().default("New"),
    location: text("location").notNull(),
    description: text("description").notNull(),
    assignedTo: text("assigned_to"),
    adminNote: text("admin_note"),
    resolutionNote: text("resolution_note"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
    claimedAt: integer("claimed_at"),
    resolvedAt: integer("resolved_at"),
  },
  (table) => [
    uniqueIndex("uq_service_requests_public_id").on(table.publicId),
    index("idx_service_requests_status_created_at").on(table.status, table.createdAt),
    index("idx_service_requests_category").on(table.category),
  ],
);

export const auditLogs = sqliteTable(
  "audit_logs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    requestRef: text("request_ref").notNull(),
    action: text("action").notNull(),
    actor: text("actor").notNull().default("admin"),
    detail: text("detail"),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [index("idx_audit_logs_created_at").on(table.createdAt)],
);

export type ServiceRequest = typeof serviceRequests.$inferSelect;
export type NewServiceRequest = typeof serviceRequests.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
