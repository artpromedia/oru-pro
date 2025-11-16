import { config } from "dotenv";
import { z } from "zod";

config();

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16).optional(),
  NEXT_PUBLIC_SOCKET_URL: z.string().url().optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default("claude-3-5-sonnet-20241022"),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default("gemini-1.5-flash"),
  GROQ_API_KEY: z.string().optional(),
  LLAMA_MODEL: z.string().default("llama3-70b-8192"),
  CHROMA_URL: z.string().url().optional(),
  REALTIME_ALLOWED_ORIGINS: z.string().optional(),
  SUPER_ADMIN_PASSWORD_HASH: z.string().optional(),
  SUPER_ADMIN_MFA_SECRET: z.string().optional()
});

export const env = EnvSchema.parse(process.env);
