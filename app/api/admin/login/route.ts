import {
  appendSessionCookies,
  assertSameOrigin,
  createAdminSession,
  validateAdminCredentials,
} from "@/lib/server/auth";
import { errorResponse, HttpError, json, readJsonObject } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOrigin(request);
    const body = await readJsonObject(request);
    const username = typeof body.username === "string" ? body.username.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (username.length > 100 || password.length > 200 || !validateAdminCredentials(username, password)) {
      throw new HttpError(401, "Incorrect username or password.");
    }

    const session = await createAdminSession(request);
    const headers = new Headers();
    appendSessionCookies(headers, session.setCookies);
    return json({ ok: true, csrfToken: session.csrfToken }, { headers });
  } catch (error) {
    return errorResponse(error);
  }
}
