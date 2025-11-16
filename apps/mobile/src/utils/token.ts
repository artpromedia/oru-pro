import * as SecureStore from "expo-secure-store";
import { FALLBACK_TOKEN, TOKEN_STORAGE_KEY } from "./env";

export async function getAuthToken() {
  try {
    const token = await SecureStore.getItemAsync(TOKEN_STORAGE_KEY);
    if (token) {
      return token;
    }
  } catch (error) {
    console.warn("SecureStore unavailable", error);
  }

  return FALLBACK_TOKEN;
}
