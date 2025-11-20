import { Prisma } from "@prisma/client";
import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { commsService, type AttachmentPayload } from "../services/commsService.js";

const router = Router();

const attachmentSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).optional(),
  type: z.string().min(1).optional(),
  url: z.string().min(1),
  size: z.number().int().nonnegative().optional(),
  metadata: z.record(z.unknown()).optional()
});

const messagePayloadSchema = z.object({
  content: z.string().min(1),
  attachments: z.array(attachmentSchema).nullable().optional(),
  metadata: z.record(z.unknown()).nullable().optional(),
  threadParentId: z.string().min(1).nullable().optional()
});

const updatePayloadSchema = z.object({
  content: z.string().min(1),
  attachments: z.array(attachmentSchema).nullable().optional(),
  metadata: z.record(z.unknown()).nullable().optional()
});

const reactionSchema = z.object({
  emoji: z.string().min(1)
});

const pinSchema = z.object({
  isPinned: z.boolean()
});

const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).optional()
});

const toJsonValue = (value: unknown): Prisma.InputJsonValue | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return value as Prisma.InputJsonValue;
};

const mapAttachments = (attachments?: Array<z.infer<typeof attachmentSchema>> | null): AttachmentPayload[] | undefined => {
  if (!attachments || attachments.length === 0) {
    return undefined;
  }

  return attachments.map((attachment) => {
    const metadata = toJsonValue(attachment.metadata);
    return {
      id: attachment.id,
      name: attachment.name,
      type: attachment.type,
      url: attachment.url,
      size: attachment.size,
      ...(metadata !== undefined ? { metadata } : {})
    } satisfies AttachmentPayload;
  });
};

const resolveOrganizationId = (req: Request) => {
  const queryValue = typeof req.query.organizationId === "string" ? req.query.organizationId : undefined;
  const headerValue = req.get("x-tenant-id") ?? req.get("x-organization-id") ?? undefined;
  return queryValue ?? headerValue;
};

const resolveUserId = (req: Request) => {
  const headerValue = req.get("x-user-id") ?? undefined;
  const queryValue = typeof req.query.userId === "string" ? req.query.userId : undefined;
  if (typeof req.body?.userId === "string") {
    return req.body.userId;
  }
  return queryValue ?? headerValue;
};

const handleError = (res: Response, error: unknown, fallback: string) => {
  const status = typeof (error as { status?: number })?.status === "number" ? (error as { status: number }).status : 500;
  const message = (error as Error)?.message ?? fallback;
  res.status(status).json({ message: fallback, error: message });
};

router.get("/channels", async (req, res) => {
  try {
    const channels = await commsService.listChannels({
      organizationId: resolveOrganizationId(req) ?? undefined,
      userId: resolveUserId(req) ?? undefined
    });
    res.json({ channels });
  } catch (error) {
    handleError(res, error, "Failed to load channels");
  }
});

router.get("/channels/:channelId/messages", async (req, res) => {
  try {
    const { cursor, limit } = paginationSchema.parse(req.query);
    const messages = await commsService.getChannelMessages({
      organizationId: resolveOrganizationId(req) ?? undefined,
      channelId: req.params.channelId,
      cursor,
      limit
    });
    res.json({ messages });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid pagination parameters", issues: error.flatten() });
    }
    handleError(res, error, "Failed to load messages");
  }
});

router.post("/channels/:channelId/messages", async (req, res) => {
  try {
    const payload = messagePayloadSchema.parse(req.body);
    const message = await commsService.createMessage({
      organizationId: resolveOrganizationId(req) ?? undefined,
      userId: resolveUserId(req) ?? undefined,
      channelId: req.params.channelId,
      content: payload.content,
      attachments: mapAttachments(payload.attachments),
      metadata: (() => {
        const metadata = toJsonValue(payload.metadata);
        return metadata === undefined ? undefined : metadata;
      })(),
      threadParentId: payload.threadParentId ?? undefined
    });
    res.status(201).json({ message });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid message payload", issues: error.flatten() });
    }
    handleError(res, error, "Failed to create message");
  }
});

router.patch("/messages/:messageId", async (req, res) => {
  try {
    const payload = updatePayloadSchema.parse(req.body);
    const message = await commsService.updateMessage({
      organizationId: resolveOrganizationId(req) ?? undefined,
      userId: resolveUserId(req) ?? undefined,
      messageId: req.params.messageId,
      content: payload.content,
      attachments: mapAttachments(payload.attachments),
      metadata: (() => {
        const metadata = toJsonValue(payload.metadata);
        return metadata === undefined ? undefined : metadata;
      })()
    });
    res.json({ message });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid update payload", issues: error.flatten() });
    }
    handleError(res, error, "Failed to update message");
  }
});

router.delete("/messages/:messageId", async (req, res) => {
  try {
    const result = await commsService.deleteMessage({
      organizationId: resolveOrganizationId(req) ?? undefined,
      userId: resolveUserId(req) ?? undefined,
      messageId: req.params.messageId
    });
    res.json(result);
  } catch (error) {
    handleError(res, error, "Failed to delete message");
  }
});

router.post("/messages/:messageId/reactions", async (req, res) => {
  try {
    const payload = reactionSchema.parse(req.body);
    const message = await commsService.toggleReaction({
      organizationId: resolveOrganizationId(req) ?? undefined,
      userId: resolveUserId(req) ?? undefined,
      messageId: req.params.messageId,
      emoji: payload.emoji
    });
    res.json({ message });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid reaction payload", issues: error.flatten() });
    }
    handleError(res, error, "Failed to toggle reaction");
  }
});

router.post("/messages/:messageId/pin", async (req, res) => {
  try {
    const payload = pinSchema.parse(req.body);
    const message = await commsService.togglePin({
      organizationId: resolveOrganizationId(req) ?? undefined,
      userId: resolveUserId(req) ?? undefined,
      messageId: req.params.messageId,
      isPinned: payload.isPinned
    });
    res.json({ message });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid pin payload", issues: error.flatten() });
    }
    handleError(res, error, "Failed to toggle pin");
  }
});

router.get("/presence", async (req, res) => {
  try {
    const presence = await commsService.getPresence({ organizationId: resolveOrganizationId(req) ?? undefined });
    res.json({ presence });
  } catch (error) {
    handleError(res, error, "Failed to load presence");
  }
});

export { router as commsRoutes };
