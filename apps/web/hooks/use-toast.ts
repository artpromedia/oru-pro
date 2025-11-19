export type ToastVariant = "default" | "destructive" | "success";

export interface ToastPayload {
  title: string;
  description?: string;
  variant?: ToastVariant;
}

export const TOAST_EVENT = "oru:toast";

/**
 * Lightweight toast emitter that broadcasts events the shell can subscribe to.
 * Falls back to console logging when no client event loop is available yet.
 */
export function useToast() {
  const toast = (payload: ToastPayload) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent<ToastPayload>(TOAST_EVENT, { detail: payload }));
    } else {
      const level = payload.variant === "destructive" ? "error" : payload.variant === "success" ? "info" : "log";
      console[level](`[toast] ${payload.title}${payload.description ? ` - ${payload.description}` : ""}`);
    }
  };

  return { toast };
}
