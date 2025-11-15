import { config } from "dotenv";
import { z } from "zod";

config();

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(16),
  NEXT_PUBLIC_SOCKET_URL: z.string().url().optional()
});

export const env = EnvSchema.parse(process.env);
