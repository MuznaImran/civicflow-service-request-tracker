import {
  appendSessionCookies,
  clearSessionCookies,
  requireAdminSession,
} from "@/lib/server/auth";
import { errorResponse, json } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  try {
    await requireAdminSession(request, true);
    const headers = new Headers();
    appendSessionCookies(headers, clearSessionCookies(request));
    return json({ ok: true }, { headers });
  } catch (error) {
    return errorResponse(error);
  }
}
