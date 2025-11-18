"use client";

import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  BookOpen,
  Brain,
  Building2,
  Calendar,
  Calculator,
  CheckCircle,
  DollarSign,
  FileText,
  Filter,
  Globe,
  Lock,
  PieChart,
  TrendingUp,
  Zap,
} from "lucide-react";
import { fetchGeneralLedgerSnapshot } from "@/lib/api";
import type {
  GeneralLedgerAccount,
  GeneralLedgerJournal,
  GeneralLedgerReportHighlight,
  GeneralLedgerResponse,
} from "@/lib/finance-types";
import { generalLedgerSnapshot } from "@/lib/finance-mock";

const FinancialChart = dynamic(() => import("@/components/charts/FinancialChart"), { ssr: false });
const CashFlowChart = dynamic(() => import("@/components/charts/CashFlow"), { ssr: false });
const BalanceSheet = dynamic(() => import("@/components/charts/BalanceSheet"), { ssr: false });

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function formatMillions(value: number) {
  return `$${(value / 1_000_000).toFixed(1)}M`;
}

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

export default function GeneralLedgerDashboard() {
  const [activeView, setActiveView] = useState<"overview" | "journals" | "accounts" | "reports">("overview");
  const [selectedPeriod, setSelectedPeriod] = useState("current");
  const [selectedCompanyCode, setSelectedCompanyCode] = useState("CC01");
  const [isClosing, setIsClosing] = useState(false);

  const { data, isFetching, isError, refetch } = useQuery<GeneralLedgerResponse>({
    queryKey: ["finance", "general-ledger", selectedCompanyCode, selectedPeriod],
    queryFn: () => fetchGeneralLedgerSnapshot(selectedCompanyCode),
    placeholderData: () => generalLedgerSnapshot,
    staleTime: 60_000,
  });

  const ledger = data ?? generalLedgerSnapshot;
  const financialMetrics = ledger.metrics;
  const journalFeed = ledger.journals;
  const glAccounts = ledger.accounts;
  const reportHighlights = ledger.reports;
  const lastUpdatedLabel = ledger.lastUpdated ? new Date(ledger.lastUpdated).toLocaleString() : "";

  const handleClose = async () => {
    setIsClosing(true);
    await new Promise((resolve) => setTimeout(resolve, 2500));
    setIsClosing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <header className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-bold text-gray-900">
              <BookOpen className="h-8 w-8 text-emerald-600" /> General Ledger & Financial Control
            </h1>
            <p className="mt-2 text-gray-500">Real-time financial management with AI-powered insights and automation.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <SelectorCard label="Company Code" value={selectedCompanyCode} onChange={setSelectedCompanyCode} options={[{ value: "CC01", label: "US Operations" }, { value: "CC02", label: "EU Operations" }, { value: "CC03", label: "APAC Operations" }]} />
            <SelectorCard label="Fiscal Period" value={selectedPeriod} onChange={setSelectedPeriod} options={[{ value: "current", label: "Nov 2024" }, { value: "previous", label: "Oct 2024" }, { value: "quarter", label: "Q4 2024" }, { value: "year", label: "FY 2024" }]} />
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              <Zap className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} /> Sync data
            </button>
            <button className="inline-flex items-center rounded-lg border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-50" aria-label="Download GL report">
              <FileText className="h-4 w-4" />
            </button>
            <button
              onClick={handleClose}
              disabled={isClosing}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700 disabled:opacity-50"
            >
              {isClosing ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white" /> Closing period...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" /> Month-end close
                </>
              )}
            </button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-gray-500">
          <span className="inline-flex items-center gap-2">
            <Globe className="h-4 w-4" /> Consolidated view · {selectedCompanyCode}
          </span>
          {lastUpdatedLabel && <span>Last updated {lastUpdatedLabel}</span>}
          {isError && <span className="text-rose-600">Unable to refresh ledger — showing cached snapshot.</span>}
        </div>
      </header>

      <section className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <FinancialKPI label="Revenue" value={formatMillions(financialMetrics.revenue)} change={`+${financialMetrics.revenueGrowth}%`} positive icon={DollarSign} />
        <FinancialKPI label="Net Income" value={formatMillions(financialMetrics.netIncome)} change={`${financialMetrics.profitMargin}% margin`} positive icon={TrendingUp} />
        <FinancialKPI label="Cash Balance" value={formatMillions(financialMetrics.cashBalance)} change="+$1.2M MoM" positive icon={DollarSign} />
        <FinancialKPI label="Current Ratio" value={financialMetrics.currentRatio.toFixed(2)} change="Healthy" positive icon={PieChart} />
        <FinancialKPI label="DSO" value={`${financialMetrics.dso} days`} change="-3 days" positive icon={Calendar} />
        <FinancialKPI label="Working Capital" value={formatMillions(financialMetrics.workingCapital)} change="+8%" positive icon={Calculator} />
      </section>

      <div className="mb-6 flex flex-wrap gap-2">
        {["overview", "journals", "accounts", "reports"].map((view) => (
          <button
            key={view}
            onClick={() => setActiveView(view as typeof activeView)}
            className={`rounded-lg px-4 py-2 capitalize transition-colors ${activeView === view ? "bg-emerald-600 text-white" : "bg-white text-gray-600 hover:text-gray-900"}`}
          >
            {view}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeView === "overview" && (
          <motion.div key="gl-overview" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-5 rounded-xl bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold">Profit & Loss Statement</h3>
              <div className="space-y-3">
                <PLLineItem label="Revenue" amount={financialMetrics.revenue} bold />
                <PLLineItem label="Cost of Goods Sold" amount={-5_200_000} indent />
                <PLLineItem label="Gross Profit" amount={7_250_000} highlight />
                <PLLineItem label="Operating Expenses" amount={-3_720_000} indent />
                <PLLineItem label="EBITDA" amount={3_530_000} highlight />
                <PLLineItem label="Depreciation" amount={-280_000} indent />
                <PLLineItem label="Interest" amount={-120_000} indent />
                <PLLineItem label="Tax" amount={-940_000} indent />
                <PLLineItem label="Net Income" amount={2_190_000} bold highlight />
              </div>
            </div>

            <div className="lg:col-span-7 rounded-xl bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Balance Sheet Summary</h3>
                <span className="text-xs text-gray-500">Assets vs Liabilities</span>
              </div>
              <div className="h-72">
                <BalanceSheet />
              </div>
            </div>

            <div className="lg:col-span-8 rounded-xl bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Cash Flow Analysis</h3>
                <span className="text-xs text-gray-500">Operating • Investing • Financing</span>
              </div>
              <div className="h-80">
                <CashFlowChart />
              </div>
            </div>

            <div className="lg:col-span-4 rounded-xl bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Recent Journal Entries</h3>
                <button className="text-sm text-emerald-600 hover:text-emerald-700">View all</button>
              </div>
              <div className="space-y-3">
                {journalFeed.map((entry) => (
                  <JournalCard key={entry.id} journal={entry} />
                ))}
              </div>
            </div>

            <div className="lg:col-span-12 rounded-xl bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Global Performance</h3>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Globe className="h-4 w-4" /> CC01 • CC02 • CC03 consolidated
                </div>
              </div>
              <div className="h-72">
                <FinancialChart />
              </div>
            </div>
          </motion.div>
        )}

        {activeView === "journals" && (
          <motion.div key="gl-journals" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="rounded-xl bg-white p-6 shadow-sm">
            <JournalEntryInterface />
          </motion.div>
        )}

        {activeView === "accounts" && (
          <motion.div key="gl-accounts" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">Account Health</h3>
                <p className="text-sm text-gray-500">Automated variance watchlist across cost/profit centers.</p>
              </div>
              <button className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
                <Filter className="h-4 w-4" /> Filters
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {glAccounts.map((account) => (
                <AccountHealthCard key={account.id} account={account} />
              ))}
            </div>
          </motion.div>
        )}

        {activeView === "reports" && (
          <motion.div key="gl-reports" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="rounded-xl bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">Regulatory & Management Reports</h3>
                <p className="text-sm text-gray-500">AI-curated narratives for CFO packs, IFRS/GAAP tie-outs, and variance audits.</p>
              </div>
              <button className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700">
                <Building2 className="h-4 w-4" /> Consolidate entities
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {reportHighlights.map((highlight) => (
                <ReportCard key={highlight.title} highlight={highlight} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-white p-3 shadow-sm">
            <Brain className="h-6 w-6 text-emerald-600" />
          </div>
          <div className="flex-1">
            <h3 className="mb-2 font-semibold text-gray-900">AI Financial Intelligence</h3>
            <div className="grid gap-4 text-sm text-gray-600 md:grid-cols-2">
              <div>
                <p>✓ Cash flow forecast positive for next 90 days</p>
                <p>✓ Anomaly detected: Marketing expense 20% over budget</p>
                <p>✓ Tax optimization: $45K savings opportunity identified</p>
              </div>
              <div>
                <p>⚠️ AR aging: 3 accounts over 90 days ($125K)</p>
                <p>💡 Working capital can improve by extending DPO by 5 days</p>
                <p>🎯 Month-end close automation ready for 12 recurring entries</p>
              </div>
            </div>
          </div>
          <div className="hidden sm:block">
            <div className="rounded-lg bg-white/80 p-3 text-sm text-emerald-700">
              <Zap className="mb-2 h-5 w-5" />
              <p>Decision Engine ready</p>
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  );
}

function SelectorCard({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="rounded-lg bg-white px-4 py-2 shadow-sm">
      <p className="text-xs text-gray-500">{label}</p>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="bg-transparent text-sm font-semibold text-gray-900 focus:outline-none">
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function FinancialKPI({ label, value, change, positive, icon: Icon }: { label: string; value: string; change: string; positive: boolean; icon: LucideIcon }) {
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <div className="rounded-lg bg-emerald-100 p-2">
          <Icon className="h-4 w-4 text-emerald-600" />
        </div>
        <span className={`text-xs font-medium ${positive ? "text-emerald-600" : "text-rose-600"}`}>{change}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

function PLLineItem({ label, amount, indent = false, bold = false, highlight = false }: { label: string; amount: number; indent?: boolean; bold?: boolean; highlight?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${indent ? "ml-4" : ""} ${highlight ? "rounded-lg bg-gray-50 p-2" : ""}`}>
      <span className={`text-sm ${bold ? "font-semibold" : "text-gray-600"}`}>{label}</span>
      <span className={`text-sm ${bold ? "font-semibold" : "text-gray-700"} ${amount < 0 ? "text-rose-600" : ""}`}>
        {amount < 0 ? `(${Math.abs(amount).toLocaleString()})` : amount.toLocaleString()}
      </span>
    </div>
  );
}

function JournalCard({ journal }: { journal: GeneralLedgerJournal }) {
  const statusColors: Record<GeneralLedgerJournal["status"], string> = {
    draft: "bg-gray-100 text-gray-700",
    posted: "bg-emerald-100 text-emerald-700",
    reversed: "bg-rose-100 text-rose-700",
  };

  return (
    <div className="cursor-pointer rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-900">{journal.id}</span>
        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusColors[journal.status]}`}>{journal.status}</span>
      </div>
      <p className="text-xs text-gray-600">{journal.description}</p>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-sm font-semibold">${journal.amount.toLocaleString()}</span>
        <span className="text-xs text-gray-500">{journal.date}</span>
      </div>
    </div>
  );
}

function AccountHealthCard({ account }: { account: GeneralLedgerAccount }) {
  const riskTokens: Record<GeneralLedgerAccount["risk"], { label: string; classes: string; icon: LucideIcon }> = {
    low: { label: "Low risk", classes: "bg-emerald-50 text-emerald-700", icon: CheckCircle },
    medium: { label: "Monitor", classes: "bg-amber-50 text-amber-700", icon: AlertCircle },
    high: { label: "Action", classes: "bg-rose-50 text-rose-700", icon: AlertCircle },
  };
  const riskMeta = riskTokens[account.risk];
  const RiskIcon = riskMeta.icon;

  return (
    <div className="rounded-xl border border-slate-100 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">{account.name}</p>
          <p className="text-xs text-gray-500">{account.id}</p>
        </div>
        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${riskMeta.classes}`}>
          <RiskIcon className="mr-1 inline h-3.5 w-3.5" /> {riskMeta.label}
        </span>
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <p className="text-2xl font-bold text-gray-900">{formatCurrency(account.balance)}</p>
        <span className={`inline-flex items-center text-sm ${account.variance >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
          {account.variance >= 0 ? <ArrowUpRight className="mr-1 h-4 w-4" /> : <ArrowDownRight className="mr-1 h-4 w-4" />} {Math.abs(account.variance)}%
        </span>
      </div>
      <p className="mt-2 text-xs text-gray-500">Owner: {account.owner}</p>
    </div>
  );
}

function ReportCard({ highlight }: { highlight: GeneralLedgerReportHighlight }) {
  return (
    <div className="rounded-xl border border-slate-100 p-4 shadow-sm">
      <p className="text-sm font-semibold text-gray-900">{highlight.title}</p>
      <p className="mt-1 text-sm text-gray-600">{highlight.detail}</p>
      <span className={`mt-3 inline-flex items-center text-sm ${highlight.positive ? "text-emerald-600" : "text-rose-600"}`}>
        {highlight.positive ? <ArrowUpRight className="mr-1 h-4 w-4" /> : <ArrowDownRight className="mr-1 h-4 w-4" />} {highlight.trend}
      </span>
    </div>
  );
}

function JournalEntryInterface() {
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">Create journal entry</h3>
        <div className="flex gap-2">
          <button className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Template</button>
          <button className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Recurring</button>
          <button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">Post entry</button>
        </div>
      </div>

      <div className="mb-6 grid gap-6 md:grid-cols-2">
        <Field label="Date">
          <input type="date" className="w-full rounded-lg border px-3 py-2" />
        </Field>
        <Field label="Reference">
          <input type="text" placeholder="Reference number" className="w-full rounded-lg border px-3 py-2" />
        </Field>
      </div>

      <EntryTable title="Debit entries" />
      <EntryTable title="Credit entries" />

      <div className="mt-6 rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span>Total debits: $0.00</span>
          <span>Total credits: $0.00</span>
          <span className="font-semibold text-emerald-600">Balanced ✓</span>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm font-medium text-gray-700">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}

function EntryTable({ title }: { title: string }) {
  return (
    <div className="mb-4 rounded-lg border p-4">
      <h4 className="mb-3 font-medium">{title}</h4>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b text-xs text-gray-500">
            <tr>
              <th className="py-2 text-left">Account</th>
              <th className="py-2 text-left">Description</th>
              <th className="py-2 text-left">Cost Center</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-2">
                <input type="text" placeholder="Select account" className="w-full rounded border px-2 py-1" />
              </td>
              <td className="py-2">
                <input type="text" placeholder="Description" className="w-full rounded border px-2 py-1" />
              </td>
              <td className="py-2">
                <input type="text" placeholder="Cost center" className="w-full rounded border px-2 py-1" />
              </td>
              <td className="py-2">
                <input type="number" placeholder="0.00" className="w-full rounded border px-2 py-1 text-right" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
