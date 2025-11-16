import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import { logger } from "../../logger.js";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ProviderConfig = {
  openai?: {
    apiKey?: string;
    model?: string;
  };
  anthropic?: {
    apiKey?: string;
    model?: string;
  };
  gemini?: {
    apiKey?: string;
    model?: string;
  };
  llama?: {
    apiKey?: string;
    model?: string;
  };
};

interface ProviderAdapter {
  readonly name: string;
  isEnabled(): boolean;
  generate(messages: ChatMessage[]): Promise<string>;
}

class OpenAIProvider implements ProviderAdapter {
  readonly name = "openai";
  private client?: OpenAI;
  private readonly model?: string;

  constructor(config?: ProviderConfig["openai"]) {
    if (config?.apiKey) {
      this.client = new OpenAI({ apiKey: config.apiKey });
    }
    this.model = config?.model;
  }

  isEnabled() {
    return Boolean(this.client && this.model);
  }

  async generate(messages: ChatMessage[]) {
    if (!this.client || !this.model) {
      throw new Error("OpenAI provider not configured");
    }
    const completion = await this.client.chat.completions.create({
      model: this.model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: messages.map((message) => ({ role: message.role, content: message.content }))
    });
    return completion.choices[0]?.message?.content ?? "";
  }
}

class AnthropicProvider implements ProviderAdapter {
  readonly name = "anthropic";
  private client?: Anthropic;
  private readonly model?: string;

  constructor(config?: ProviderConfig["anthropic"]) {
    if (config?.apiKey) {
      this.client = new Anthropic({ apiKey: config.apiKey });
    }
    this.model = config?.model;
  }

  isEnabled() {
    return Boolean(this.client && this.model);
  }

  async generate(messages: ChatMessage[]) {
    if (!this.client || !this.model) {
      throw new Error("Anthropic provider not configured");
    }
    const systemPrompt = messages
      .filter((message) => message.role === "system")
      .map((message) => message.content)
      .join("\n");

    const convo = messages
      .filter((message) => message.role !== "system")
      .map((message) => ({
        role: message.role === "assistant" ? "assistant" : "user",
        content: [
          {
            type: "text" as const,
            text: message.content
          }
        ]
      }));

    const response = await this.client.messages.create({
      model: this.model,
      temperature: 0.2,
      max_tokens: 400,
      system: systemPrompt || undefined,
      messages: convo.length
        ? (convo as Parameters<Anthropic["messages"]["create"]>[0]["messages"])
        : [
            {
              role: "user" as const,
              content: [{ type: "text" as const, text: "Provide a concise JSON summary." }]
            }
          ]
    });

    const textContent = response.content?.find((entry) => entry.type === "text");
    return textContent?.text ?? "";
  }
}

class GeminiProvider implements ProviderAdapter {
  readonly name = "gemini";
  private client?: GoogleGenerativeAI;
  private readonly model?: string;

  constructor(config?: ProviderConfig["gemini"]) {
    if (config?.apiKey) {
      this.client = new GoogleGenerativeAI(config.apiKey);
    }
    this.model = config?.model;
  }

  isEnabled() {
    return Boolean(this.client && this.model);
  }

  async generate(messages: ChatMessage[]) {
    if (!this.client || !this.model) {
      throw new Error("Gemini provider not configured");
    }
    const prompt = messages.map((message) => `[${message.role}] ${message.content}`).join("\n");
    const model = this.client.getGenerativeModel({ model: this.model });
    const result = await model.generateContent(prompt);
    return result.response?.text() ?? "";
  }
}

class LlamaGroqProvider implements ProviderAdapter {
  readonly name = "llama";
  private client?: Groq;
  private readonly model?: string;

  constructor(config?: ProviderConfig["llama"]) {
    if (config?.apiKey) {
      this.client = new Groq({ apiKey: config.apiKey });
    }
    this.model = config?.model;
  }

  isEnabled() {
    return Boolean(this.client && this.model);
  }

  async generate(messages: ChatMessage[]) {
    if (!this.client || !this.model) {
      throw new Error("Llama provider not configured");
    }
    const completion = await this.client.chat.completions.create({
      model: this.model,
      temperature: 0.2,
      messages: messages.map((message) => ({ role: message.role, content: message.content }))
    });
    return completion.choices[0]?.message?.content ?? "";
  }
}

export class FallbackLLMRouter {
  private readonly providers: ProviderAdapter[];

  constructor(config: ProviderConfig) {
    this.providers = [
      new OpenAIProvider(config.openai),
      new AnthropicProvider(config.anthropic),
      new GeminiProvider(config.gemini),
      new LlamaGroqProvider(config.llama)
    ];
  }

  async generate(messages: ChatMessage[]): Promise<string | null> {
    for (const provider of this.providers) {
      if (!provider.isEnabled()) {
        continue;
      }
      try {
        const response = await provider.generate(messages);
        if (response?.trim()) {
          return response;
        }
      } catch (error) {
        logger.warn("inventory-ai: provider failed", { provider: provider.name, error });
      }
    }
    return null;
  }
}
