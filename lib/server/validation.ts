import { HttpError } from "./http";
import {
  REQUEST_PRIORITIES,
  type AdminAction,
  type NewRequestInput,
  type RequestPriority,
} from "./types";

const REQUEST_CATEGORIES = [
  "Roads & sidewalks",
  "Water & drainage",
  "Street lighting",
  "Waste collection",
  "Parks & public spaces",
  "Other",
] as const;

function textField(
  body: Record<string, unknown>,
  name: string,
  label: string,
  min: number,
  max: number,
): string {
  const value = body[name];
  if (typeof value !== "string") {
    throw new HttpError(400, `${label} is required.`);
  }

  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length < min || clean.length > max) {
    throw new HttpError(400, `${label} must be between ${min} and ${max} characters.`);
  }
  return clean;
}

function optionalText(body: Record<string, unknown>, name: string, max: number): string {
  const value = body[name];
  if (value === undefined || value === null) return "";
  if (typeof value !== "string") throw new HttpError(400, `${name} must be text.`);
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length > max) throw new HttpError(400, `${name} must be ${max} characters or fewer.`);
  return clean;
}

export function hasHoneypotValue(body: Record<string, unknown>): boolean {
  return typeof body.website === "string" && body.website.trim().length > 0;
}

export function validateNewRequest(body: Record<string, unknown>): NewRequestInput {
  const title = textField(body, "title", "Title", 6, 80);
  const category = textField(body, "category", "Category", 2, 48);
  if (!REQUEST_CATEGORIES.includes(category as (typeof REQUEST_CATEGORIES)[number])) {
    throw new HttpError(400, "Choose a valid category.");
  }

  const rawPriority = textField(body, "priority", "Priority", 3, 8).toLowerCase();
  const priority = REQUEST_PRIORITIES.find((item) => item.toLowerCase() === rawPriority);
  if (!priority) throw new HttpError(400, "Choose a valid priority.");

  return {
    title,
    category,
    priority: priority as RequestPriority,
    location: textField(body, "location", "General location", 3, 100),
    description: textField(body, "description", "Description", 15, 500),
  };
}

export function validateAdminMutation(body: Record<string, unknown>): {
  action: AdminAction;
  adminNote: string;
  resolutionNote: string;
} {
  const action = body.action;
  if (action !== "claim" && action !== "start" && action !== "resolve" && action !== "note") {
    throw new HttpError(400, "Choose a valid request action.");
  }

  const adminNote = optionalText(body, "adminNote", 500);
  const resolutionNote = optionalText(body, "resolutionNote", 500);
  if (action === "resolve" && resolutionNote.length < 10) {
    throw new HttpError(400, "Resolution note must be between 10 and 500 characters.");
  }

  return { action, adminNote, resolutionNote };
}
