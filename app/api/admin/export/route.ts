import { requireAdminSession } from "@/lib/server/auth";
import { errorResponse } from "@/lib/server/http";
import { ensureSyntheticData, listServiceRequests } from "@/lib/server/repository";

export const dynamic = "force-dynamic";

function safeCsvCell(value: string | number | null): string {
  let text = value === null ? "" : String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

function dateCell(timestamp: number | null): string {
  return timestamp ? new Date(timestamp).toISOString() : "";
}

export async function GET(request: Request): Promise<Response> {
  try {
    await requireAdminSession(request);
    await ensureSyntheticData();
    const requests = await listServiceRequests({});
    const rows: Array<Array<string | number | null>> = [
      [
        "Request ID",
        "Title",
        "Category",
        "Priority",
        "Status",
        "General location",
        "Assigned to",
        "Created at",
        "Updated at",
        "Resolved at",
      ],
      ...requests.map((item) => [
        item.publicId,
        item.title,
        item.category,
        item.priority,
        item.status,
        item.location,
        item.assignedTo,
        dateCell(item.createdAt),
        dateCell(item.updatedAt),
        dateCell(item.resolvedAt),
      ]),
    ];
    const csv = `\uFEFF${rows.map((row) => row.map(safeCsvCell).join(",")).join("\r\n")}`;

    return new Response(csv, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="civicflow-requests-${new Date()
          .toISOString()
          .slice(0, 10)}.csv"`,
        "Content-Type": "text/csv; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
