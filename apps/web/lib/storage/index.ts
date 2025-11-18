import { Buffer } from "node:buffer";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

export type StorageUploadOptions = {
  tenantId: string;
  documentId: string;
  file: ArrayBuffer | Buffer;
  contentType: string;
  encryption?: boolean;
};

class StorageManager {
  private root: string;

  private static toBinaryView(buffer: Buffer) {
    return Uint8Array.from(buffer);
  }

  private static toBuffer(source: Buffer | ArrayBuffer) {
    const view = Buffer.isBuffer(source) ? Uint8Array.from(source) : new Uint8Array(source);
    return Buffer.from(view);
  }

  constructor() {
    this.root = process.env.DOCUMENT_STORAGE_PATH || path.join(process.cwd(), "uploads", "documents");
  }

  async upload(options: StorageUploadOptions) {
  const buffer = StorageManager.toBuffer(options.file);
    const payload = options.encryption ? this.encryptBuffer(buffer) : buffer;
    const tenantDir = path.join(this.root, options.tenantId);
    const filePath = path.join(tenantDir, `${options.documentId}`);

  await fs.mkdir(tenantDir, { recursive: true });
  await fs.writeFile(filePath, StorageManager.toBinaryView(payload));

    return `file://${filePath.replace(/\\/g, "/")}`;
  }

  private encryptBuffer(buffer: Buffer) {
    const keyMaterial = process.env.DOCUMENT_ENCRYPTION_KEY;
    if (!keyMaterial) {
      return buffer;
    }

    const key = crypto.createHash("sha256").update(keyMaterial).digest();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", StorageManager.toBinaryView(key), StorageManager.toBinaryView(iv));
    const encryptedChunks = [cipher.update(StorageManager.toBinaryView(buffer)), cipher.final()].map((chunk) => Uint8Array.from(chunk));
    const encrypted = Buffer.concat(encryptedChunks);
    const authTag = cipher.getAuthTag();

    return Buffer.concat([Uint8Array.from(iv), Uint8Array.from(authTag), Uint8Array.from(encrypted)]);
  }
}

export const storageManager = new StorageManager();
