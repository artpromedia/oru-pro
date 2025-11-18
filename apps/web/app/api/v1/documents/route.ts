import crypto from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import { aiDocumentProcessor } from "@/lib/ai/document-processor";
import { authMiddleware } from "@/lib/auth";
import { complianceChecker } from "@/lib/compliance";
import { dbManager } from "@/lib/database";
import { storageManager } from "@/lib/storage";

export const runtime = "nodejs";
export const maxDuration = 60;

function hasPermission(permissions: string[], value: string) {
  return permissions.includes("*") || permissions.includes(value);
}

export async function POST(req: NextRequest) {
  try {
    const session = await authMiddleware(req);
    const { tenantId, userId, permissions } = session;

    if (!hasPermission(permissions, "documents.write")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File too large" }, { status: 400 });
    }

    const documentId = `DOC-${tenantId}-${Date.now()}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const hash = crypto.createHash("sha256").update(Uint8Array.from(buffer)).digest("hex");

    const db = await dbManager.getTenantConnection(tenantId);
    const existing = await db.document.findFirst({ where: { hash } });

    if (existing) {
      return NextResponse.json({ error: "Duplicate document detected", existingId: existing.id }, { status: 409 });
    }

    const storageUrl = await storageManager.upload({ tenantId, documentId, file: buffer, contentType: file.type, encryption: true });
    const aiAnalysis = await aiDocumentProcessor.analyze({ documentId, content: buffer, contentType: file.type, fileName: file.name });
    const complianceResult = await complianceChecker.validateDocument({
      content: aiAnalysis.extractedText,
      type: aiAnalysis.documentType,
      metadata: { category: aiAnalysis.category },
    });

    const document = await db.document.create({
      data: {
        id: documentId,
        tenantId,
        name: file.name,
        type: file.type || "application/octet-stream",
        size: file.size,
        hash,
        storageUrl,
        uploadedBy: userId,
        status: complianceResult.compliant ? "approved" : "review",
        category: aiAnalysis.category,
        tags: aiAnalysis.tags,
        aiExtracted: {
          entities: aiAnalysis.entities,
          summary: aiAnalysis.summary,
          sentiment: aiAnalysis.sentiment,
          keyPhrases: aiAnalysis.keyPhrases,
        },
        compliance: {
          standards: complianceResult.standards,
          violations: complianceResult.violations,
          signature: complianceResult.digitalSignature,
        },
        version: 1,
        locked: complianceResult.requiresLock,
      },
    });

    await db.auditLog.create({
      data: {
        tenantId,
        userId,
        action: "DOCUMENT_UPLOAD",
        entity: "Document",
        entityId: documentId,
        details: {
          fileName: file.name,
          fileSize: file.size,
          hash,
          compliance: complianceResult.standards,
        },
      },
    });

    await aiDocumentProcessor.indexForSearch({ documentId, content: aiAnalysis.extractedText, metadata: document });

    return NextResponse.json({ document, aiAnalysis, compliance: complianceResult }, { status: 201 });
  } catch (error) {
    console.error("Document upload error", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await authMiddleware(req);
    const { tenantId, permissions } = session;

    if (!hasPermission(permissions, "documents.read")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const db = await dbManager.getTenantConnection(tenantId);
    const searchParams = req.nextUrl.searchParams;
    const category = searchParams.get("category") ?? undefined;
    const status = searchParams.get("status") ?? undefined;
    const search = searchParams.get("search") ?? undefined;

    const documents = await db.document.findMany({
      where: {
        ...(category && { category }),
        ...(status && { status }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { tags: { has: search } },
          ],
        }),
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error("Document fetch error", error);
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
}
