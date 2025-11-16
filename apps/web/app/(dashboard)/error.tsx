"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, LifeBuoy, RefreshCw } from "lucide-react";

type DashboardErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  useEffect(() => {
    console.error("Dashboard error boundary", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-3xl border border-dashed border-purple-200 bg-gradient-to-b from-white via-white to-purple-50 px-6 py-16 text-center shadow-lg">
      <div className="mb-6 inline-flex items-center rounded-full bg-purple-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-purple-600">
        <AlertTriangle className="mr-2 h-4 w-4" /> Oonru Control Shield
      </div>
      <h1 className="text-3xl font-semibold text-slate-900">We intercepted a noisy signal</h1>
      <p className="mt-3 max-w-2xl text-sm text-slate-600">
        The dashboard hit an unexpected state while streaming telemetry. Our guardrails paused the view so we can keep
        tenant data safe. You can retry the last action or jump to a known-good workspace while we self-heal.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-full bg-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-400/40 transition hover:bg-purple-700"
        >
          <RefreshCw className="h-4 w-4" /> Try again
        </button>
        <Link
          href="/super-admin/dashboard"
          className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-white px-6 py-3 text-sm font-semibold text-purple-700 transition hover:border-purple-400"
        >
          <LifeBuoy className="h-4 w-4" /> Open Super Admin Console
        </Link>
      </div>
      <div className="mt-10 grid gap-3 text-left text-xs text-slate-500 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white/60 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">Request Trace</p>
          <p className="mt-2 font-mono text-[11px] text-slate-600">{error.digest ?? "No digest provided"}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white/60 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">Message</p>
          <p className="mt-2 text-sm text-slate-700">{error.message || "Unknown error"}</p>
        </div>
      </div>
      <p className="mt-8 text-[11px] uppercase tracking-[0.3em] text-slate-400">
        Need humans? Email <a href="mailto:support@oonru.ai" className="text-purple-600 hover:underline">support@oonru.ai</a>
      </p>
    </div>
  );
}
