import Constants from "expo-constants";

const config = Constants.expoConfig ?? Constants.manifest2?.extra ?? {};
const env = (globalThis as typeof globalThis & { process?: { env?: Record<string, string> } }).process?.env ?? {};

export const API_BASE_URL =
  (config?.extra && (config.extra as Record<string, unknown>).apiBaseUrl) ||
  env.EXPO_PUBLIC_API_BASE_URL ||
  "https://api.oru.ai/v1";

export const DEFAULT_OPERATION = "receiving" as const;
export const TOKEN_STORAGE_KEY = "oru.auth.token";
export const FALLBACK_TOKEN = env.EXPO_PUBLIC_API_TOKEN || "";
