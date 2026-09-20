import { createServiceRequest } from "@/lib/server/repository";
import { errorResponse, json, readJsonObject } from "@/lib/server/http";
import { hasHoneypotValue, validateNewRequest } from "@/lib/server/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await readJsonObject(request);

    // Bots tend to fill this visually hidden field. Return a plausible response
    // without creating a record so the honeypot remains effective.
    if (hasHoneypotValue(body)) {
      return json(
        {
          request: {
            publicId: `CF-${new Date().getUTCFullYear()}-RECEIVED`,
            status: "New",
            createdAt: Date.now(),
          },
        },
        { status: 202 },
      );
    }

    const saved = await createServiceRequest(validateNewRequest(body));
    return json(
      {
        request: {
          publicId: saved.publicId,
          status: saved.status,
          createdAt: saved.createdAt,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
