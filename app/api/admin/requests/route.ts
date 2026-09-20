import { requireAdminSession } from "@/lib/server/auth";
import { errorResponse, HttpError, json } from "@/lib/server/http";
import {
  ensureSyntheticData,
  listAuditLogs,
  listServiceRequests,
} from "@/lib/server/repository";
import { REQUEST_PRIORITIES, REQUEST_STATUSES } from "@/lib/server/types";

export const dynamic = "force-dynamic";

function optionalFilter(params: URLSearchParams, name: string, max: number): string | undefined {
  const value = params.get(name)?.trim();
  if (!value) return undefined;
  if (value.length > max) throw new HttpError(400, `${name} filter is too long.`);
  return value;
}

export async function GET(request: Request): Promise<Response> {
  try {
    await requireAdminSession(request);
    await ensureSyntheticData();

    const params = new URL(request.url).searchParams;
    const status = optionalFilter(params, "status", 20);
    const priority = optionalFilter(params, "priority", 10);
    if (status && !REQUEST_STATUSES.includes(status as (typeof REQUEST_STATUSES)[number])) {
      throw new HttpError(400, "Choose a valid status filter.");
    }
    if (priority && !REQUEST_PRIORITIES.includes(priority as (typeof REQUEST_PRIORITIES)[number])) {
      throw new HttpError(400, "Choose a valid priority filter.");
    }

    const [requests, auditLogs] = await Promise.all([
      listServiceRequests({
        status,
        priority,
        category: optionalFilter(params, "category", 48),
        query: optionalFilter(params, "q", 100),
      }),
      listAuditLogs(),
    ]);

    return json({ requests, auditLogs });
  } catch (error) {
    return errorResponse(error);
  }
}
