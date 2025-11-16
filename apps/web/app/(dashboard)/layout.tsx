"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brain, Satellite, ShieldCheck, Sparkles } from "lucide-react";

type NavSection = {
  title: string;
  items: {
    label: string;
    href: string;
    badge?: string;
  }[];
};

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Tenant Control",
    items: [
      { label: "Tenant Overview", href: "/tenant/overview" },
      { label: "Tenant Admin", href: "/admin" },
      { label: "Super Admin", href: "/super-admin/dashboard", badge: "New" },
    ],
  },
  {
    title: "Operations",
    items: [
      { label: "Production", href: "/operations/production" },
      { label: "Logistics", href: "/operations/logistics" },
      { label: "Physical Inventory", href: "/operations/physical-inventory" },
    ],
  },
  {
    title: "Settings & Intelligence",
    items: [
      { label: "Global Settings", href: "/settings/global" },
      { label: "Offline & Edge", href: "/settings/offline" },
      { label: "Decision Intelligence", href: "/intelligence/agents" },
    ],
  },
];

const STATUS_PILLS = [
  { label: "Environment", value: "Prod" },
  { label: "Uptime", value: "99.982%" },
  { label: "AI Fleet", value: "1176 active" },
];

type DashboardLayoutProps = {
  children: ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50">
      <aside className="hidden w-72 flex-col border-r border-white/5 bg-slate-950/80 px-6 py-8 lg:flex">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-[0.3em] text-purple-300">Oonru</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">Enterprise Control</h1>
          <p className="text-sm text-slate-400">Command every tenant, module, and copilot from one shell.</p>
        </div>
        <nav className="space-y-8">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title}>
              <p className="text-xs uppercase tracking-widest text-slate-500">{section.title}</p>
              <div className="mt-3 space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition ${
                        isActive
                          ? "bg-white/10 text-white"
                          : "text-slate-400 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] uppercase text-purple-200">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="mt-auto space-y-3 rounded-2xl border border-white/10 bg-slate-900/60 p-4">
          <p className="text-xs uppercase tracking-widest text-slate-500">Decision Engine</p>
          <p className="text-sm text-slate-200">
            Calibrate copilots, guardrails, and telemetry across every tenant.
          </p>
          <Link
            href="/intelligence/agents"
            className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/20"
          >
            <Brain className="h-4 w-4" /> Open Decision HQ
          </Link>
        </div>
      </aside>
      <div className="flex min-h-screen flex-1 flex-col bg-slate-50">
        <MobileNav pathname={pathname} />
        <header className="border-b border-slate-200 bg-white/80 px-6 py-6 backdrop-blur lg:px-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Global Control Plane</p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-900">Autonomous operations cockpit</h2>
              <p className="text-sm text-slate-500">
                Navigate tenant administration, operations modules, and AI guardrails without leaving this shell.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {STATUS_PILLS.map((pill) => (
                <div key={pill.label} className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600">
                  <span className="font-semibold text-slate-900">{pill.label}:</span> {pill.value}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4">
            <Breadcrumbs pathname={pathname} />
          </div>
        </header>
        <div className="flex-1 px-4 py-6 sm:px-6 lg:px-12 lg:py-10">
          <div className="rounded-3xl bg-white p-4 shadow-lg shadow-slate-200/60 sm:p-8">{children}</div>
        </div>
      </div>
    </div>
  );
}

type BreadcrumbsProps = {
  pathname: string;
};

function Breadcrumbs({ pathname }: BreadcrumbsProps) {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return (
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Dashboard</p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
      <Link href="/tenant/overview" className="uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600">
        Dashboard
      </Link>
      {segments.map((segment, index) => {
        const href = `/${segments.slice(0, index + 1).join("/")}`;
        const label = segment.replace(/-/g, " ");
        const isLast = index === segments.length - 1;
        return (
          <span key={href} className="flex items-center gap-2">
            <span className="text-slate-400">/</span>
            {isLast ? (
              <span className="capitalize text-slate-700">{label}</span>
            ) : (
              <Link href={href} className="capitalize text-slate-500 hover:text-slate-700">
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </div>
  );
}

type MobileNavProps = {
  pathname: string;
};

function MobileNav({ pathname }: MobileNavProps) {
  return (
    <div className="border-b border-white/10 bg-slate-900 px-4 py-4 lg:hidden">
      <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-purple-200">
        <Sparkles className="h-4 w-4 text-purple-300" /> Oonru Dashboard
      </div>
      <div className="flex snap-x gap-2 overflow-x-auto pb-1">
        {NAV_SECTIONS.flatMap((section) => section.items).map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={`mobile-${item.href}`}
              href={item.href}
              className={`snap-start rounded-full px-4 py-2 text-xs font-semibold ${
                isActive ? "bg-white text-slate-900" : "bg-white/10 text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-300">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" /> Guardrails synced •
        <Satellite className="h-3.5 w-3.5 text-sky-300" /> Edge online
      </div>
    </div>
  );
}
