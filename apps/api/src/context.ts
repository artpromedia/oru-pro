import { prisma } from "@oru/database";
import { inferAsyncReturnType } from "@trpc/server";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { env } from "./env.js";

export const createContext = ({ req }: CreateExpressContextOptions) => ({
  prisma,
  user: req.user ?? null,
  env
});

export type Context = inferAsyncReturnType<typeof createContext>;
