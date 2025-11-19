"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { TOAST_EVENT, type ToastPayload, type ToastVariant } from "@/hooks/use-toast";

interface ToastMessage extends ToastPayload {
  id: string;
}

const variantStyles: Record<ToastVariant | "default", { icon: typeof Info; classes: string; accent: string }> = {
  default: {
    icon: Info,
    classes: "border-slate-200 bg-white text-slate-900",
    accent: "text-slate-500",
  },
  success: {
    icon: CheckCircle2,
    classes: "border-emerald-200 bg-emerald-50 text-emerald-900",
    accent: "text-emerald-600",
  },
  destructive: {
    icon: AlertTriangle,
    classes: "border-rose-200 bg-rose-50 text-rose-900",
    accent: "text-rose-600",
  },
};

export function ToastViewport() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const timers = useRef<Record<string, number>>({});

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    if (timers.current[id]) {
      window.clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const enqueue = useCallback((payload: ToastPayload) => {
    const id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, ...payload }]);
    timers.current[id] = window.setTimeout(() => dismiss(id), 4500);
  }, [dismiss]);

  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<ToastPayload>;
      if (!customEvent.detail) return;
      enqueue(customEvent.detail);
    };

    window.addEventListener(TOAST_EVENT, handler as EventListener);
    return () => {
      window.removeEventListener(TOAST_EVENT, handler as EventListener);
      Object.values(timers.current).forEach((timerId) => window.clearTimeout(timerId));
    };
  }, [enqueue]);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-6 right-6 z-[1000] flex w-full max-w-sm flex-col gap-3" aria-live="polite">
      {toasts.map((toast) => {
        const variant = toast.variant ?? "default";
        const styles = variantStyles[variant];
        const Icon = styles.icon;
        return (
          <div
            key={toast.id}
            className={`relative flex items-start gap-3 rounded-xl border p-4 shadow-lg transition-all ${styles.classes}`}
            role="status"
          >
            <Icon className={`h-5 w-5 flex-shrink-0 ${styles.accent}`} />
            <div className="flex-1">
              <p className="text-sm font-semibold">{toast.title}</p>
              {toast.description && <p className="text-sm text-slate-600">{toast.description}</p>}
            </div>
            <button
              onClick={() => dismiss(toast.id)}
              className="rounded-full p-1 text-slate-400 transition hover:bg-white/40 hover:text-slate-600"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
