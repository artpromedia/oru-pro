"use client";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6 text-center text-slate-100">
      <div className="max-w-lg space-y-4">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Connection lost</p>
        <h1 className="text-3xl font-semibold">You are offline</h1>
        <p className="text-base text-slate-300">
          The Oonru workspace is still installed on this device. We will resync dashboards, copilots, and decision
          data as soon as you reconnect.
        </p>
        <ul className="text-left text-sm text-slate-400">
          <li>• Scans and approvals performed offline remain safely queued.</li>
          <li>• Keep the tab open so background sync can resume automatically.</li>
          <li>• Tap “Reload” once you have a stable signal.</li>
        </ul>
        <button
          type="button"
          className="rounded-full bg-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30"
          onClick={() => window.location.reload()}
        >
          Reload workspace
        </button>
      </div>
    </div>
  );
}
