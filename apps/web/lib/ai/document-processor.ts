import crypto from "node:crypto";

import { dbManager } from "../database";

type AnalyzeInput = {
  documentId: string;
  content: ArrayBuffer | Buffer;
  contentType: string;
  fileName: string;
};

type AnalyzeResult = {
  documentId: string;
  documentType: string;
  category: string;
  tags: string[];
  summary: string;
  extractedText: string;
  metadata: Record<string, unknown>;
  entities: string[];
  sentiment: "positive" | "neutral" | "negative";
  keyPhrases: string[];
};

type IndexInput = {
  documentId: string;
  content: string;
  metadata: {
    id: string;
    tenantId: string;
    name: string;
    category?: string | null;
  } & Record<string, unknown>;
};

class AIDocumentProcessor {
  async analyze(input: AnalyzeInput): Promise<AnalyzeResult> {
    const buffer = Buffer.isBuffer(input.content) ? input.content : Buffer.from(input.content);
    const extractedText = this.extractText(buffer, input.contentType);
    const category = this.detectCategory(input.fileName, extractedText);
    const tags = this.buildTags(input.fileName, category);

    return {
      documentId: input.documentId,
      documentType: this.detectDocumentType(input.contentType, input.fileName),
      category,
      tags,
      summary: this.buildSummary(input.fileName, category, extractedText),
      extractedText,
      metadata: {
        checksum: crypto.createHash("md5").update(buffer).digest("hex"),
        byteLength: buffer.byteLength,
        contentType: input.contentType,
      },
      entities: this.extractEntities(extractedText),
      sentiment: "neutral",
      keyPhrases: tags.slice(0, 5),
    };
  }

  async indexForSearch(input: IndexInput) {
    const payload = {
      snippet: input.content.slice(0, 1000),
      metadata: {
        id: input.metadata.id,
        tenantId: input.metadata.tenantId,
        name: input.metadata.name,
        category: input.metadata.category,
      },
    };

    await dbManager.redis.hset(`documents:index:${input.metadata.tenantId}`, input.documentId, JSON.stringify(payload));
    await dbManager.redis.expire(`documents:index:${input.metadata.tenantId}`, 60 * 60 * 24 * 7);
  }

  private extractText(buffer: Buffer, contentType: string) {
    if (contentType.startsWith("text") || contentType.includes("json")) {
      return buffer.toString("utf-8");
    }
    return `Binary document (${Math.round(buffer.byteLength / 1024)} KB)`;
  }

  private detectCategory(fileName: string, extracted: string) {
    const name = fileName.toLowerCase();
    if (name.includes("quality") || extracted.includes("batch")) return "quality";
    if (name.includes("purchase") || extracted.includes("vendor")) return "procurement";
    if (name.includes("layout") || name.includes("warehouse")) return "operations";
    return "general";
  }

  private detectDocumentType(contentType: string, fileName: string) {
    if (contentType.includes("pdf")) return "pdf";
    if (contentType.includes("excel") || fileName.endsWith(".xlsx")) return "spreadsheet";
    if (contentType.includes("image")) return "image";
    return "binary";
  }

  private buildTags(fileName: string, category: string) {
    const base = [category, fileName.split(".")[0]];
    if (fileName.toLowerCase().includes("po")) {
      base.push("purchase-order");
    }
    if (category === "quality") {
      base.push("gmp", "compliance");
    }
    return Array.from(new Set(base.map((tag) => tag.replace(/[^a-z0-9-]/gi, "-").toLowerCase())));
  }

  private buildSummary(fileName: string, category: string, extracted: string) {
    return `AI summary for ${fileName} categorized as ${category}. ${extracted.slice(0, 120)}...`;
  }

  private extractEntities(text: string) {
    const entities: string[] = [];
    const vendorMatch = /vendor[:\s]+([a-z0-9\s]+)/i.exec(text);
    if (vendorMatch) {
      entities.push(`Vendor: ${vendorMatch[1].trim()}`);
    }
    const amountMatch = /(USD|\$)\s?([0-9,.]+)/i.exec(text);
    if (amountMatch) {
      entities.push(`Amount: ${amountMatch[2]}`);
    }
    return entities.length ? entities : ["Vendor: TBD", "Amount: Pending"];
  }
}

export const aiDocumentProcessor = new AIDocumentProcessor();
