import { InventoryAIAgent } from "./agent.js";
import { env } from "../../env.js";

export const aiAgent = new InventoryAIAgent({
  openai: { apiKey: process.env.OPENAI_API_KEY, model: env.OPENAI_MODEL },
  anthropic: { apiKey: process.env.ANTHROPIC_API_KEY, model: env.ANTHROPIC_MODEL },
  gemini: { apiKey: process.env.GEMINI_API_KEY, model: env.GEMINI_MODEL },
  llama: { apiKey: process.env.GROQ_API_KEY, model: env.LLAMA_MODEL },
  chromaUrl: env.CHROMA_URL
});
