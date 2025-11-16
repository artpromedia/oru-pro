import { config } from "dotenv";

declare const jest: {
	setTimeout(timeout: number): void;
};

config({ path: ".env.test", override: true });

process.env.DATABASE_URL ??= "postgresql://localhost:5432/test";
process.env.REDIS_URL ??= "redis://localhost:6379";
process.env.JWT_SECRET ??= "test-secret-value-12345";
process.env.OPENAI_MODEL ??= "gpt-4o-mini";
process.env.ANTHROPIC_MODEL ??= "claude-test";
process.env.GEMINI_MODEL ??= "gemini-test";
process.env.LLAMA_MODEL ??= "llama-test";

jest.setTimeout(30000);
