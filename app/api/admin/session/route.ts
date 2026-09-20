import { getAdminSession } from "@/lib/server/auth";
import { errorResponse, json } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  try {
    const session = await getAdminSession(request);
    if (!session) return json({ authenticated: false });
    return json({ authenticated: true, csrfToken: session.csrfToken });
  } catch (error) {
    return errorResponse(error);
  }
}
