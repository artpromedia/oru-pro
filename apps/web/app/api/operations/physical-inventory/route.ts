import { NextResponse } from "next/server";
import { inventoryPayloadMock } from "@/app/(dashboard)/operations/physical-inventory/mock-data";
import { inventoryPayloadSchema } from "@/app/(dashboard)/operations/physical-inventory/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const documentId = searchParams.get("documentId");

  const payload = inventoryPayloadSchema.parse(inventoryPayloadMock);
  const responsePayload =
    documentId && payload.documents.some((doc) => doc.id === documentId)
      ? { ...payload, documents: payload.documents.filter((doc) => doc.id === documentId) }
      : payload;

  return NextResponse.json(responsePayload, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
