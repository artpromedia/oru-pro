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

  constructor() {
    this.root = process.env.DOCUMENT_STORAGE_PATH || path.join(process.cwd(), "uploads", "documents");
  }

  async upload(options: StorageUploadOptions) {
    const buffer = Buffer.isBuffer(options.file) ? options.file : Buffer.from(options.file);
    const payload = options.encryption ? this.encryptBuffer(buffer) : buffer;
    const tenantDir = path.join(this.root, options.tenantId);
    const filePath = path.join(tenantDir, `${options.documentId}`);

    await fs.mkdir(tenantDir, { recursive: true });
    await fs.writeFile(filePath, payload);

    return `file://${filePath.replace(/\\/g, "/")}`;
  }

  private encryptBuffer(buffer: Buffer) {
    const keyMaterial = process.env.DOCUMENT_ENCRYPTION_KEY;
    if (!keyMaterial) {
      return buffer;
    }

    const key = crypto.createHash("sha256").update(keyMaterial).digest();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return Buffer.concat([iv, authTag, encrypted]);
  }
}

export const storageManager = new StorageManager();
