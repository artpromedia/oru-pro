"use client";

import { useMemo, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  FileText,
  Receipt,
  CreditCard,
  Building,
  TrendingUp,
  Calculator,
  Calendar,
  Download,
  Upload,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  Brain,
  Zap,
  BookOpen,
  PieChart,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Lock,
  Eye,
  Shield,
  Workflow,
  Scale,
  FileSpreadsheet,
  Users,
  Repeat,
  Mail,
  BadgeDollarSign,
  type LucideIcon
} from 'lucide-react';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

type Module = 'gl' | 'ap' | 'ar' | 'assets' | 'closing';

type ModuleMetric = {
  label: string;
  value: number;
  change: number;
  unit: 'currency' | 'count' | 'days';
  icon: LucideIcon;
  subtitle: string;
};

type Status = 'success' | 'warning' | 'error' | 'info';

type SectionAction = {
  label: string;
  icon?: LucideIcon;
};

type SectionCardProps = {
  title: string;
  description?: string;
  tCodes?: string;
  actions?: SectionAction[];
  children: ReactNode;
};

type TableColumn = {
  label: string;
  align?: 'left' | 'center' | 'right';
};

type TableRow = (string | number | ReactNode)[];

type TimelineItem = {
  title: string;
  subtitle: string;
  actor: string;
  status: Status;
  timestamp: string;
};

type Insight = {
  category: string;
  detail: string;
  impact: string;
  status: Status;
};

const moduleTabs: Array<{
  id: Module;
  label: string;
  description: string;
  icon: LucideIcon;
  replaces: string;
}> = [
  {
    id: 'gl',
    label: 'General Ledger',
    description: 'Real-time balances, journal intelligence',
    icon: BookOpen,
    replaces: 'FS10N / FB03'
  },
  {
    id: 'ap',
    label: 'Accounts Payable',
    description: '3-way match, vendor exposures',
    icon: Receipt,
    replaces: 'FK10N / FBL1N'
  },
  {
    id: 'ar',
    label: 'Accounts Receivable',
    description: 'Collections cockpit, DSO alerts',
    icon: CreditCard,
    replaces: 'FD10N / FBL5N'
  },
  {
    id: 'assets',
    label: 'Fixed Assets',
    description: 'Asset register + depreciation',
    icon: Building,
    replaces: 'AS03 / AW01N'
  },
  {
    id: 'closing',
    label: 'Period Closing',
    description: 'Calendar, controls, narratives',
    icon: Lock,
    replaces: 'F.01 / F.16'
  }
];

const moduleMetrics: Record<Module, ModuleMetric[]> = {
  gl: [
    { label: 'Balanced Postings', value: 18400000, change: 2.3, unit: 'currency', icon: FileText, subtitle: 'Across 312 documents' },
    { label: 'Accounts Reconciled', value: 178, change: -1.2, unit: 'count', icon: Scale, subtitle: 'of 182 required' },
    { label: 'Outstanding Adjustments', value: 12, change: -18.4, unit: 'count', icon: PieChart, subtitle: 'AI auto-classified' },
    { label: 'Close Confidence', value: 96, change: 4.5, unit: 'count', icon: Shield, subtitle: 'control score' }
  ],
  ap: [
    { label: 'Invoices Ready to Pay', value: 4250000, change: -6.1, unit: 'currency', icon: Receipt, subtitle: 'within next 7 days' },
    { label: '3-Way Match Rate', value: 98.1, change: 1.4, unit: 'count', icon: CheckCircle, subtitle: 'auto matched' },
    { label: 'Blocked Invoices', value: 14, change: -22.0, unit: 'count', icon: AlertTriangle, subtitle: 'exceptions awaiting review' },
    { label: 'Dynamic Discount Capture', value: 187000, change: 8.2, unit: 'currency', icon: DollarSign, subtitle: 'savings YTD' }
  ],
  ar: [
    { label: 'Open Receivables', value: 6320000, change: 5.3, unit: 'currency', icon: CreditCard, subtitle: '62% within terms' },
    { label: 'DSO', value: 42, change: -3.8, unit: 'days', icon: Calendar, subtitle: 'target 40 days' },
    { label: 'Collections Queue', value: 58, change: -9.2, unit: 'count', icon: Users, subtitle: 'tasks prioritized' },
    { label: 'Cash Forecast Accuracy', value: 93, change: 1.1, unit: 'count', icon: Brain, subtitle: 'next 30-day horizon' }
  ],
  assets: [
    { label: 'Asset Net Book Value', value: 45600000, change: 3.2, unit: 'currency', icon: Building, subtitle: '1,284 active assets' },
    { label: 'Depreciation Run', value: 98.6, change: 0.9, unit: 'count', icon: Repeat, subtitle: 'complete for Nov 2025' },
    { label: 'Capital Projects', value: 27, change: 12.0, unit: 'count', icon: BarChart3, subtitle: 'monitored for CIP' },
    { label: 'Audit Ready Docs', value: 412, change: 5.4, unit: 'count', icon: FileSpreadsheet, subtitle: 'tagged & approved' }
  ],
  closing: [
    { label: 'Close Progress', value: 72, change: 8.0, unit: 'count', icon: Zap, subtitle: 'of 146 tasks complete' },
    { label: 'Critical Issues', value: 3, change: -25.0, unit: 'count', icon: AlertTriangle, subtitle: 'all mitigated' },
    { label: 'Narratives Drafted', value: 11, change: 22.0, unit: 'count', icon: FileText, subtitle: 'ready for CFO sign-off' },
    { label: 'Automation Coverage', value: 64, change: 6.5, unit: 'count', icon: Workflow, subtitle: 'processes orchestrated' }
  ]
};

const glAccounts = [
  {
    number: '100000',
    name: 'Cash & Cash Equivalents',
    debit: 5234567,
    credit: 1234567,
    balance: 4000000,
    status: 'Reconciled'
  },
  {
    number: '120000',
    name: 'Accounts Receivable',
    debit: 7654300,
    credit: 1865000,
    balance: 5789300,
    status: 'Variance'
  },
  {
    number: '200000',
    name: 'Accounts Payable',
    debit: 1098700,
    credit: 4897600,
    balance: -3798900,
    status: 'Reconciled'
  },
  {
    number: '300000',
    name: 'Finished Goods Inventory',
    debit: 6980000,
    credit: 3250000,
    balance: 3730000,
    status: 'Pending Review'
  }
];

const journalWorkflow: TimelineItem[] = [
  {
    title: 'SA-2025-1189 — Payroll Accrual',
    subtitle: formatCurrency(425000),
    actor: 'Auto-post via payroll connector',
    status: 'success',
    timestamp: 'Posted 08:32'
  },
  {
    title: 'KR-2025-2214 — Vendor Invoice',
    subtitle: 'Awaiting variance explanation',
    actor: 'M. Chen • Controlling',
    status: 'warning',
    timestamp: 'Due in 3h'
  },
  {
    title: 'DR-2025-4412 — Customer Billing',
    subtitle: 'AI flagged unusual tax key',
    actor: 'AI Auto-Coding',
    status: 'error',
    timestamp: 'Needs approval'
  }
];

const apInvoices = [
  {
    vendor: 'Siemens Industrial',
    invoice: '4500018923',
    amount: 275000,
    due: 'Nov 20',
    match: 'Cleared',
    status: 'Scheduled'
  },
  {
    vendor: 'DHL Logistics',
    invoice: '4500019077',
    amount: 118400,
    due: 'Nov 22',
    match: 'Exception',
    status: 'Blocked'
  },
  {
    vendor: 'AWS Enterprise',
    invoice: '4500019058',
    amount: 86000,
    due: 'Nov 25',
    match: 'Cleared',
    status: 'Discount'
  }
];

const apAgingBuckets = [
  { bucket: 'Current', amount: 3120000, vendors: 164 },
  { bucket: '1-30 days', amount: 1480000, vendors: 42 },
  { bucket: '31-60 days', amount: 870000, vendors: 19 },
  { bucket: '61+ days', amount: 240000, vendors: 6 }
];

const arCustomers = [
  {
    customer: 'Target Retail',
    exposure: 980000,
    status: 'Within terms',
    dso: 38,
    risk: 'Low'
  },
  {
    customer: 'Allied Pharma',
    exposure: 765000,
    status: '1 reminder sent',
    dso: 52,
    risk: 'Medium'
  },
  {
    customer: 'Global Automotive',
    exposure: 624000,
    status: 'Promise to pay',
    dso: 67,
    risk: 'High'
  }
];

const arStrategies = [
  {
    title: 'Cash accelerator wave',
    description: 'Bundle 14 low-risk invoices for instant-pay facility',
    impact: '$420K within 48h'
  },
  {
    title: 'AI-crafted dunning',
    description: 'Personalized outreach to strategic accounts with predicted intent',
    impact: '-4 days DSO'
  }
];

const assetRegister = [
  { tag: 'PLT-0041', name: 'CNC Mill Line 4', nbv: 4150000, life: '2029-03', status: 'Operational' },
  { tag: 'LAB-0187', name: 'QC Spectrometer', nbv: 780000, life: '2027-11', status: 'Calibration due' },
  { tag: 'HQ-0102', name: 'HQ Campus Building', nbv: 18800000, life: '2045-12', status: 'Impairment review' }
];

const depreciationRuns = [
  { period: 'Nov 2025', coverage: '98.6%', status: 'Posted', owner: 'Automation Bot', journals: 214 },
  { period: 'Dec 2025 (forecast)', coverage: '95.2%', status: 'Ready', owner: 'AI Simulation', journals: 219 }
];

const closingTasks = [
  { step: 'Inventory revaluation', owner: 'Supply Finance', due: 'Nov 19', status: 'In Progress', criticality: 'High' },
  { step: 'Revenue recognition memo', owner: 'Technical Accounting', due: 'Nov 20', status: 'Ready for review', criticality: 'Medium' },
  { step: 'Tax provision alignment', owner: 'Tax', due: 'Nov 22', status: 'Not started', criticality: 'High' }
];

const controlsMonitor: Array<{ control: string; status: Status; owner: string; evidence: string }> = [
  { control: 'GL tie-out', status: 'success', owner: 'Controllership', evidence: 'Auto-collected (14 files)' },
  { control: 'AP spend segregation', status: 'warning', owner: 'Procurement', evidence: 'Workflow pending 1 approval' },
  { control: 'Revenue cutoff test', status: 'info', owner: 'External Audit', evidence: 'Scheduled for Nov 21' }
];

const intelligenceFeed: Insight[] = [
  {
    category: 'Variance',
    detail: 'Marketing OPEX 45% above plan — vendor rate card outdated',
    impact: 'Recommend new contract before Q1 close',
    status: 'warning'
  },
  {
    category: 'Opportunity',
    detail: 'Dynamic discount captures projected to exceed target by $125K',
    impact: 'Extend program to top 10 vendors',
    status: 'success'
  },
  {
    category: 'Risk',
    detail: 'Two subsidiaries have aging over 75 days with VAT exposure',
    impact: 'Escalate to local controllers',
    status: 'error'
  }
];

export default function FinancialAccounting() {
  const [activeModule, setActiveModule] = useState<Module>('gl');
  const [selectedPeriod, setSelectedPeriod] = useState('2025-11');

  const currentMetrics = moduleMetrics[activeModule];
  const activeTab = useMemo(() => moduleTabs.find((tab) => tab.id === activeModule), [activeModule]);

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      <header className="flex flex-wrap gap-6 items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-green-600" />
            Financial Accounting Suite
          </h1>
          <p className="text-gray-500 mt-2">
            Unified replacement for SAP FI (F*/FB) — AI-assisted postings, reconciliations, and close orchestration
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm">
            <label className="text-xs text-gray-500 block">Fiscal Period</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="text-sm font-medium text-gray-900 bg-transparent focus:outline-none"
            >
              <option value="2025-11">Nov 2025</option>
              <option value="2025-10">Oct 2025</option>
              <option value="2025-09">Sep 2025</option>
            </select>
          </div>
          <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Import JE
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            Post Document (FB01)
          </button>
        </div>
      </header>

      <nav className="bg-white rounded-xl p-2 shadow-sm flex flex-wrap gap-2">
        {moduleTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveModule(tab.id)}
            className={`px-4 py-2 rounded-lg transition-colors flex flex-col text-left min-w-[180px] border ${
              activeModule === tab.id
                ? 'bg-green-600 text-white border-green-600'
                : 'text-gray-600 hover:text-gray-900 border-transparent'
            }`}
          >
            <div className="flex items-center gap-2 text-sm font-semibold">
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </div>
            <p className="text-xs mt-1 opacity-80">{tab.description}</p>
            <p className="text-[11px] mt-1 opacity-60">Replaces {tab.replaces}</p>
          </button>
        ))}
      </nav>

      <section>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs uppercase text-gray-500 tracking-wide">Module snapshot</p>
            <h2 className="text-lg font-semibold text-gray-900">{activeTab?.label}</h2>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <Search className="w-4 h-4" />
            <Filter className="w-4 h-4" />
            <span>{activeTab?.replaces}</span>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {currentMetrics.map((metric) => (
            <MetricCard key={metric.label} metric={metric} />
          ))}
        </div>
      </section>

      {activeModule === 'gl' && (
        <GeneralLedgerPanel />
      )}
      {activeModule === 'ap' && (
        <AccountsPayablePanel />
      )}
      {activeModule === 'ar' && (
        <AccountsReceivablePanel />
      )}
      {activeModule === 'assets' && (
        <FixedAssetsPanel />
      )}
      {activeModule === 'closing' && (
        <ClosingPanel />
      )}

      <IntelligencePanel />
    </div>
  );
}

function MetricCard({ metric }: { metric: ModuleMetric }) {
  const isPositive = metric.change >= 0;
  const valueDisplay =
    metric.unit === 'currency'
      ? formatCurrency(metric.value)
      : metric.unit === 'days'
        ? `${metric.value} days`
        : `${metric.value.toLocaleString()}${metric.unit === 'count' && metric.value < 100 ? '%' : ''}`;

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <metric.icon className="w-5 h-5 text-gray-500" />
        <span className={`text-xs font-semibold flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {Math.abs(metric.change)}%
        </span>
      </div>
      <div className="text-2xl font-semibold text-gray-900">{valueDisplay}</div>
      <p className="text-xs text-gray-500">{metric.label}</p>
      <p className="text-xs text-gray-400 mt-1">{metric.subtitle}</p>
    </div>
  );
}

function StatusBadge({ status, label }: { status: Status; label?: string }) {
  const map: Record<Status, { bg: string; text: string }> = {
    success: { bg: 'bg-green-100', text: 'text-green-700' },
    warning: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
    error: { bg: 'bg-red-100', text: 'text-red-700' },
    info: { bg: 'bg-blue-100', text: 'text-blue-700' }
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${map[status].bg} ${map[status].text}`}>
      {label}
    </span>
  );
}

function SectionCard({ title, description, tCodes, actions, children }: SectionCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {description && <p className="text-sm text-gray-500">{description}</p>}
          {tCodes && <p className="text-xs text-gray-400 mt-1">Replaces {tCodes}</p>}
        </div>
        {actions && (
          <div className="flex flex-wrap gap-2">
            {actions.map((action) => (
              <button
                key={action.label}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2"
              >
                {action.icon && <action.icon className="w-4 h-4" />}
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

function DataTable({ columns, rows }: { columns: TableColumn[]; rows: TableRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-xs text-gray-500 border-b">
            {columns.map((col) => (
              <th key={col.label} className={`py-2 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-sm">
          {rows.map((row, idx) => (
            <tr key={idx} className="border-b last:border-0">
              {row.map((cell, cellIdx) => (
                <td key={cellIdx} className={`py-3 ${columns[cellIdx]?.align === 'right' ? 'text-right' : columns[cellIdx]?.align === 'center' ? 'text-center' : 'text-left'} text-gray-700`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.title} className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
            <Clock className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm text-gray-900">{item.title}</p>
                <p className="text-xs text-gray-500">{item.subtitle}</p>
              </div>
              <StatusBadge status={item.status} label={item.timestamp} />
            </div>
            <p className="text-xs text-gray-500 mt-1">{item.actor}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function InsightList({ insights }: { insights: Insight[] }) {
  return (
    <div className="space-y-3">
      {insights.map((insight) => (
        <div key={insight.detail} className="p-3 border border-gray-100 rounded-lg bg-white">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900">{insight.category}</p>
            <StatusBadge status={insight.status} />
          </div>
          <p className="text-sm text-gray-600 mt-1">{insight.detail}</p>
          <p className="text-xs text-gray-400 mt-1">{insight.impact}</p>
        </div>
      ))}
    </div>
  );
}

function GeneralLedgerPanel() {
  return (
    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <SectionCard
        title="General Ledger Accounts"
        description="Multi-entity trial balance with AI variance tagging"
        tCodes="FS10N / FS00"
        actions={[{ label: 'Trial Balance', icon: PieChart }, { label: 'Financial Statements', icon: Download }]}
      >
        <DataTable
          columns={[
            { label: 'Account' },
            { label: 'Description' },
            { label: 'Debit', align: 'right' },
            { label: 'Credit', align: 'right' },
            { label: 'Balance', align: 'right' },
            { label: 'Status', align: 'center' },
            { label: 'Action', align: 'center' }
          ]}
          rows={glAccounts.map((account) => [
            account.number,
            account.name,
            formatCurrency(account.debit),
            formatCurrency(account.credit),
            <span className={`font-semibold ${account.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(account.balance)}
            </span>,
            <StatusBadge
              status={account.status === 'Reconciled' ? 'success' : account.status === 'Variance' ? 'warning' : 'info'}
              label={account.status}
            />,
            <button className="text-sm text-blue-600 hover:underline">View Ledger</button>
          ])}
        />
      </SectionCard>

      <div className="grid lg:grid-cols-2 gap-6">
        <SectionCard
          title="Journal Posting Workflow"
          description="Every FB01 entry traced end-to-end with control evidence"
          tCodes="FB01 / FB03"
        >
          <Timeline items={journalWorkflow} />
        </SectionCard>
        <SectionCard
          title="AI Controls & Recommendations"
          description="Continuous monitoring of GL health and policy adherence"
          actions={[{ label: 'Refresh', icon: Zap }]}
        >
          <InsightList
            insights={[
              { category: 'Auto-Coding', detail: '97% of descriptions mapped to correct GL in <2s', impact: 'Override threshold set to $25K', status: 'success' },
              { category: 'Variance', detail: 'Inventory revaluation exceeds tolerance by $180K', impact: 'Suggested split across plants', status: 'warning' },
              { category: 'Control', detail: '2 reconciliations missing reviewer sign-off', impact: 'Escalate to controller', status: 'error' }
            ]}
          />
        </SectionCard>
      </div>
    </motion.section>
  );
}

function AccountsPayablePanel() {
  return (
    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <SectionCard
        title="Invoice Workbench"
        description="3-way match, dispute resolution, and payment readiness"
        tCodes="MIRO / FBL1N"
        actions={[{ label: 'Create Vendor Invoice', icon: Receipt }, { label: 'Run Payment Proposal', icon: Download }]}
      >
        <DataTable
          columns={[
            { label: 'Vendor' },
            { label: 'Invoice #' },
            { label: 'Amount', align: 'right' },
            { label: 'Due' },
            { label: '3-Way Match', align: 'center' },
            { label: 'Status', align: 'center' }
          ]}
          rows={apInvoices.map((invoice) => [
            invoice.vendor,
            invoice.invoice,
            formatCurrency(invoice.amount),
            invoice.due,
            <StatusBadge status={invoice.match === 'Cleared' ? 'success' : 'warning'} label={invoice.match} />,
            <StatusBadge
              status={invoice.status === 'Blocked' ? 'error' : invoice.status === 'Discount' ? 'success' : 'info'}
              label={invoice.status}
            />
          ])}
        />
      </SectionCard>

      <div className="grid lg:grid-cols-2 gap-6">
        <SectionCard
          title="Vendor Aging & Working Capital"
          description="AI clusters liabilities by leverage, terms, and discount windows"
          actions={[{ label: 'View Vendor Lens', icon: Eye }]}
        >
          <div className="grid grid-cols-2 gap-4">
            {apAgingBuckets.map((bucket) => (
              <div key={bucket.bucket} className="p-4 border border-gray-100 rounded-xl">
                <p className="text-xs text-gray-500">{bucket.bucket}</p>
                <p className="text-xl font-semibold text-gray-900">{formatCurrency(bucket.amount)}</p>
                <p className="text-xs text-gray-400">{bucket.vendors} vendors</p>
              </div>
            ))}
          </div>
        </SectionCard>
        <SectionCard
          title="Autonomous Payables"
          description="Exceptions, fraud signals, discount plays orchestrated via AI copilot"
          actions={[{ label: 'Launch AP Copilot', icon: Brain }]}
        >
          <InsightList
            insights={[
              { category: 'Exception', detail: 'PO 4500019077 missing GR — rerouted to plant lead', impact: 'Auto-chase triggered', status: 'warning' },
              { category: 'Fraud Signal', detail: 'New bank instructions for Siemens flagged', impact: 'Hold until vendor validation', status: 'error' },
              { category: 'Savings', detail: 'Dynamic discount accepted by AWS (1.5%)', impact: '$21K benefit', status: 'success' }
            ]}
          />
        </SectionCard>
      </div>
    </motion.section>
  );
}

function AccountsReceivablePanel() {
  return (
    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <SectionCard
        title="Collections Cockpit"
        description="Prioritized actions, cash acceleration, and credit insights"
        tCodes="FBL5N / FD32"
        actions={[{ label: 'Create Dunning Run', icon: Mail }, { label: 'Offer Payment Plan', icon: BadgeDollarSign }]}
      >
        <DataTable
          columns={[
            { label: 'Customer' },
            { label: 'Exposure', align: 'right' },
            { label: 'Status' },
            { label: 'DSO', align: 'center' },
            { label: 'Risk', align: 'center' },
            { label: 'Action', align: 'center' }
          ]}
          rows={arCustomers.map((customer) => [
            customer.customer,
            formatCurrency(customer.exposure),
            customer.status,
            `${customer.dso} days`,
            <StatusBadge
              status={customer.risk === 'Low' ? 'success' : customer.risk === 'Medium' ? 'warning' : 'error'}
              label={customer.risk}
            />,
            <button className="text-sm text-blue-600 hover:underline">Open Workplan</button>
          ])}
        />
      </SectionCard>

      <div className="grid lg:grid-cols-2 gap-6">
        <SectionCard
          title="Cash Acceleration Plays"
          description="AI groups receivables into immediate impact waves"
          actions={[{ label: 'Simulate Impact', icon: TrendingUp }]}
        >
          <div className="space-y-4">
            {arStrategies.map((strategy) => (
              <div key={strategy.title} className="p-4 border border-gray-100 rounded-xl">
                <p className="text-sm font-semibold text-gray-900">{strategy.title}</p>
                <p className="text-sm text-gray-600 mt-1">{strategy.description}</p>
                <p className="text-xs text-gray-400 mt-2">{strategy.impact}</p>
              </div>
            ))}
          </div>
        </SectionCard>
        <SectionCard
          title="Credit Risk Lens"
          description="External bureau feeds + behavioral scoring"
          actions={[{ label: 'Refresh Scores', icon: Repeat }]}
        >
          <InsightList
            insights={[
              { category: 'Watchlist', detail: 'Global Automotive trending to BBB- outlook negative', impact: 'Advance collateral discussion', status: 'warning' },
              { category: 'Opportunity', detail: 'Top 5 customers eligible for early-pay incentives', impact: '$310K upside', status: 'success' },
              { category: 'Alert', detail: '2 customers approaching credit limit', impact: 'Auto-stop on next release', status: 'error' }
            ]}
          />
        </SectionCard>
      </div>
    </motion.section>
  );
}

function FixedAssetsPanel() {
  return (
    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <SectionCard
        title="Asset Register"
        description="NBV, useful life, and compliance status for every asset class"
        tCodes="AS03 / AW01N"
        actions={[{ label: 'Add Asset', icon: Building }, { label: 'Run Impairment Test', icon: AlertTriangle }]}
      >
        <DataTable
          columns={[
            { label: 'Asset Tag' },
            { label: 'Description' },
            { label: 'NBV', align: 'right' },
            { label: 'Useful Life' },
            { label: 'Status', align: 'center' }
          ]}
          rows={assetRegister.map((asset) => [
            asset.tag,
            asset.name,
            formatCurrency(asset.nbv),
            asset.life,
            <StatusBadge
              status={asset.status === 'Operational' ? 'success' : asset.status === 'Calibration due' ? 'warning' : 'info'}
              label={asset.status}
            />
          ])}
        />
      </SectionCard>

      <div className="grid lg:grid-cols-2 gap-6">
        <SectionCard
          title="Depreciation Runs"
          description="Automated posting packs with audit-ready support"
          actions={[{ label: 'Post Run', icon: Upload }]}
        >
          <DataTable
            columns={[
              { label: 'Period' },
              { label: 'Coverage' },
              { label: 'Status', align: 'center' },
              { label: 'Owner' },
              { label: 'Journals', align: 'right' }
            ]}
            rows={depreciationRuns.map((run) => [
              run.period,
              run.coverage,
              <StatusBadge status={run.status === 'Posted' ? 'success' : 'info'} label={run.status} />,
              run.owner,
              run.journals
            ])}
          />
        </SectionCard>
        <SectionCard
          title="Capital Projects & CIP"
          description="AI-watched budgets, in-service readiness, and policy breaks"
          actions={[{ label: 'View Workflow', icon: Workflow }]}
        >
          <InsightList
            insights={[
              { category: 'CIP Aging', detail: 'Line 4 automation project at 92% completion', impact: 'Ready for capitalization', status: 'success' },
              { category: 'Policy', detail: 'Spectrometer upgrade missing QA validation', impact: 'Hold depreciation run', status: 'warning' },
              { category: 'Budget', detail: 'HQ renovation 8% above capex plan', impact: 'Trigger executive review', status: 'error' }
            ]}
          />
        </SectionCard>
      </div>
    </motion.section>
  );
}

function ClosingPanel() {
  return (
    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <SectionCard
        title="Close Calendar"
        description="Sequenced playbook replacing blackline spreadsheets"
        actions={[{ label: 'Export Calendar', icon: Download }, { label: 'Launch Close Room', icon: Zap }]}
        tCodes="F.01 / F.16"
      >
        <DataTable
          columns={[
            { label: 'Task' },
            { label: 'Owner' },
            { label: 'Due' },
            { label: 'Status', align: 'center' },
            { label: 'Criticality', align: 'center' }
          ]}
          rows={closingTasks.map((task) => [
            task.step,
            task.owner,
            task.due,
            <StatusBadge
              status={task.status === 'Ready for review' ? 'info' : task.status === 'In Progress' ? 'warning' : 'error'}
              label={task.status}
            />,
            <StatusBadge status={task.criticality === 'High' ? 'error' : 'warning'} label={task.criticality} />
          ])}
        />
      </SectionCard>

      <div className="grid lg:grid-cols-2 gap-6">
        <SectionCard
          title="Controls Monitor"
          description="SOX narratives, evidence bundles, and ownership tracking"
          actions={[{ label: 'Attach Evidence', icon: Upload }]}
        >
          <DataTable
            columns={[
              { label: 'Control' },
              { label: 'Status', align: 'center' },
              { label: 'Owner' },
              { label: 'Evidence' }
            ]}
            rows={controlsMonitor.map((control) => [
              control.control,
              <StatusBadge status={control.status} label={control.status.toUpperCase()} />,
              control.owner,
              control.evidence
            ])}
          />
        </SectionCard>
        <SectionCard
          title="Narratives & Sign-Off"
          description="Auto-generated commentaries + CFO approval workflow"
          actions={[{ label: 'Generate Narrative', icon: Brain }, { label: 'Submit to CFO', icon: Upload }]}
        >
          <InsightList
            insights={[
              { category: 'Revenue', detail: 'Macro + FX tailwinds added $5.2M YoY', impact: 'Narrative drafted for CFO', status: 'success' },
              { category: 'Cash', detail: 'Working capital program improving DPO by 4.5 days', impact: 'Add to MD&A', status: 'info' },
              { category: 'Risk', detail: 'One-time cyber insurance reserve $1.1M', impact: 'Flag for Audit Committee slide', status: 'warning' }
            ]}
          />
        </SectionCard>
      </div>
    </motion.section>
  );
}

function IntelligencePanel() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 border border-green-100"
    >
      <div className="flex flex-wrap gap-6 items-center">
        <div className="p-4 bg-white rounded-xl shadow-sm">
          <Brain className="w-8 h-8 text-green-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">AI Financial Intelligence</h3>
          <p className="text-sm text-gray-600">
            Autonomous variance detection, working capital optimization, and policy guardrails across GL/AP/AR/Assets/Close
          </p>
          <div className="grid md:grid-cols-3 gap-4 mt-4">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <p className="text-xs text-gray-500">Close Readiness</p>
              <p className="text-2xl font-semibold text-gray-900">96%</p>
              <p className="text-xs text-green-600 mt-1">+4.5% vs last month</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <p className="text-xs text-gray-500">Working Capital Unlock</p>
              <p className="text-2xl font-semibold text-gray-900">$612K</p>
              <p className="text-xs text-gray-400 mt-1">Next 30 days potential</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <p className="text-xs text-gray-500">Control Health</p>
              <p className="text-2xl font-semibold text-gray-900">32/35</p>
              <p className="text-xs text-green-600 mt-1">SOX ready</p>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-6">
        <InsightList insights={intelligenceFeed} />
      </div>
    </motion.section>
  );
}
