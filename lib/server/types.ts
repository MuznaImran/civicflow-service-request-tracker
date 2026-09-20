export const REQUEST_STATUSES = ["New", "Claimed", "In Progress", "Resolved"] as const;
export const REQUEST_PRIORITIES = ["Low", "Medium", "High", "Urgent"] as const;

export type RequestStatus = (typeof REQUEST_STATUSES)[number];
export type RequestPriority = (typeof REQUEST_PRIORITIES)[number];

export interface RequestRecord {
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

export interface AuditRecord {
  id: number;
  requestRef: string;
  action: string;
  actor: string;
  detail: string | null;
  createdAt: number;
}

export interface NewRequestInput {
  title: string;
  category: string;
  priority: RequestPriority;
  location: string;
  description: string;
}

export type AdminAction = "claim" | "start" | "resolve" | "note";
