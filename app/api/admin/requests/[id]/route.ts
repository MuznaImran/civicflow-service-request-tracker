import { requireAdminSession } from "@/lib/server/auth";
import { errorResponse, HttpError, json, readJsonObject } from "@/lib/server/http";
import { deleteServiceRequest, mutateServiceRequest } from "@/lib/server/repository";
import { validateAdminMutation } from "@/lib/server/validation";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function requestId(context: RouteContext): Promise<number> {
  const value = Number((await context.params).id);
  if (!Number.isSafeInteger(value) || value < 1) throw new HttpError(400, "Invalid request id.");
  return value;
}

export async function PATCH(request: Request, context: RouteContext): Promise<Response> {
  try {
    await requireAdminSession(request, true);
    const id = await requestId(context);
    const mutation = validateAdminMutation(await readJsonObject(request));
    const updated = await mutateServiceRequest(id, mutation.action, mutation);
    return json({ request: updated });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request, context: RouteContext): Promise<Response> {
  try {
    await requireAdminSession(request, true);
    await deleteServiceRequest(await requestId(context));
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
