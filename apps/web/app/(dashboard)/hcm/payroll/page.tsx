"use client";

import { AnimatePresence, motion } from "framer-motion";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Brain,
  Building,
  Calendar,
  Calculator,
  CheckCircle,
  ChevronRight,
  CreditCard,
  DollarSign,
  Heart,
  RefreshCw,
  Receipt,
  Send,
  Shield,
  Upload,
  UserPlus,
  Users,
  Zap,
  Clock,
} from "lucide-react";

type EmploymentType = "full-time" | "part-time" | "contractor";
type EmployeeStatus = "active" | "on-leave" | "terminated";
type PayrollTab = "dashboard" | "run" | "employees" | "taxes" | "benefits" | "reports";
type PayPeriod = "weekly" | "bi-weekly" | "semi-monthly" | "monthly";
type ComplianceStatus = "compliant" | "warning" | "error";

type MetricColor = "green" | "blue" | "orange" | "purple";

interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  position: string;
  employmentType: EmploymentType;
  status: EmployeeStatus;
  startDate: string;
  salary: number;
  hourlyRate?: number;
  taxProfile: {
    filingStatus: string;
    allowances: number;
    additionalWithholding: number;
    state: string;
  };
  benefits: {
    health: boolean;
    dental: boolean;
    vision: boolean;
    retirement401k: number;
    lifeInsurance: boolean;
    disability: boolean;
  };
  timeOff: {
    vacation: number;
    sick: number;
    personal: number;
    used: {
      vacation: number;
      sick: number;
      personal: number;
    };
  };
  directDeposit: {
    enabled: boolean;
    accounts: Array<{
      type: string;
      routing: string;
      account: string;
      amount: string;
    }>;
  };
}

interface PayrollRun {
  id: string;
  period: PayPeriod;
  startDate: string;
  endDate: string;
  payDate: string;
  status: "draft" | "pending" | "approved" | "processing" | "completed";
  totals: {
    gross: number;
    net: number;
    taxes: number;
    benefits: number;
    employerTaxes: number;
    employerBenefits: number;
  };
  employeeCount: number;
  approvedBy?: string;
  approvedAt?: string;
}

interface PayrollCalendarEvent {
  date: string;
  type: "payday" | "tax" | "quarterly";
  label: string;
}

interface ComplianceItem {
  label: string;
  status: ComplianceStatus;
  message: string;
}

const PayrollChart = dynamic(() => import("@/components/charts/PayrollAnalytics"), { ssr: false });

const metricColorMap: Record<MetricColor, { iconBg: string; iconColor: string }> = {
  green: { iconBg: "bg-green-100", iconColor: "text-green-600" },
  blue: { iconBg: "bg-blue-100", iconColor: "text-blue-600" },
  orange: { iconBg: "bg-orange-100", iconColor: "text-orange-600" },
  purple: { iconBg: "bg-purple-100", iconColor: "text-purple-600" },
};

const complianceStatusMap: Record<ComplianceStatus, { icon: typeof CheckCircle; color: string }> = {
  compliant: { icon: CheckCircle, color: "green" },
  warning: { icon: AlertTriangle, color: "yellow" },
  error: { icon: AlertTriangle, color: "red" },
};

const initialEmployees: Employee[] = [
  {
    id: "EMP001",
    name: "John Smith",
    email: "john.smith@example.com",
    department: "Engineering",
    position: "Senior Developer",
    employmentType: "full-time",
    status: "active",
    startDate: "2020-03-01",
    salary: 125000,
    taxProfile: { filingStatus: "Married", allowances: 2, additionalWithholding: 0, state: "CA" },
    benefits: { health: true, dental: true, vision: true, retirement401k: 6, lifeInsurance: true, disability: true },
    timeOff: { vacation: 20, sick: 10, personal: 5, used: { vacation: 8, sick: 2, personal: 1 } },
    directDeposit: {
      enabled: true,
      accounts: [
        { type: "Checking", routing: "123456789", account: "***1234", amount: "100%" },
      ],
    },
  },
  {
    id: "EMP002",
    name: "Sarah Johnson",
    email: "sarah.johnson@example.com",
    department: "Product",
    position: "Product Manager",
    employmentType: "full-time",
    status: "active",
    startDate: "2021-07-15",
    salary: 115000,
    taxProfile: { filingStatus: "Single", allowances: 1, additionalWithholding: 150, state: "NY" },
    benefits: { health: true, dental: true, vision: false, retirement401k: 4, lifeInsurance: true, disability: false },
    timeOff: { vacation: 18, sick: 8, personal: 4, used: { vacation: 6, sick: 1, personal: 0 } },
    directDeposit: {
      enabled: true,
      accounts: [
        { type: "Checking", routing: "234567891", account: "***5678", amount: "80%" },
        { type: "Savings", routing: "234567891", account: "***7890", amount: "20%" },
      ],
    },
  },
  {
    id: "EMP003",
    name: "Mike Wilson",
    email: "mike.wilson@example.com",
    department: "Engineering",
    position: "QA Engineer",
    employmentType: "contractor",
    status: "on-leave",
    startDate: "2019-05-21",
    salary: 0,
    hourlyRate: 55,
    taxProfile: { filingStatus: "Single", allowances: 0, additionalWithholding: 0, state: "TX" },
    benefits: { health: false, dental: false, vision: false, retirement401k: 0, lifeInsurance: false, disability: false },
    timeOff: { vacation: 0, sick: 0, personal: 0, used: { vacation: 0, sick: 0, personal: 0 } },
    directDeposit: {
      enabled: true,
      accounts: [
        { type: "Checking", routing: "987654321", account: "***9012", amount: "100%" },
      ],
    },
  },
];

const payrollCalendarEvents: PayrollCalendarEvent[] = [
  { date: "2025-11-20", type: "payday", label: "Payday" },
  { date: "2025-11-22", type: "tax", label: "Federal Tax Deposit" },
  { date: "2025-12-05", type: "payday", label: "Payday" },
  { date: "2025-12-15", type: "quarterly", label: "Q4 Tax Filing" },
];

const recentPayrollRuns: Array<{ id: string; date: string; amount: number; status: "completed" | "processing" }> = [
  { id: "PR-2025-11-05", date: "2025-11-05", amount: 456_789, status: "completed" },
  { id: "PR-2025-10-20", date: "2025-10-20", amount: 452_340, status: "completed" },
  { id: "PR-2025-10-05", date: "2025-10-05", amount: 448_920, status: "completed" },
];

const complianceChecklist: ComplianceItem[] = [
  { label: "Federal Tax Deposits", status: "compliant", message: "Next deposit due 11/22/2025" },
  { label: "State Tax Withholding", status: "compliant", message: "All states current" },
  { label: "Local Tax Requirements", status: "warning", message: "NYC tax rate updated - review required" },
  { label: "W-2/1099 Preparation", status: "compliant", message: "324 forms ready for year-end" },
  { label: "ACA Compliance", status: "compliant", message: "All full-time employees covered" },
];

const payrollMetrics = {
  totalPayroll: 2_456_789,
  employeeCount: 324,
  avgSalary: 75_825,
  overtimeCost: 45_600,
  benefitsCost: 412_300,
  taxLiability: 687_900,
  complianceScore: 98,
  onTimePayments: 100,
};

export default function PayrollManagementSystem() {
  const [activeTab, setActiveTab] = useState<PayrollTab>("dashboard");
  const [currentPayrollRun, setCurrentPayrollRun] = useState<PayrollRun | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<PayPeriod>("bi-weekly");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAIInsights, setShowAIInsights] = useState(true);

  useEffect(() => {
    setEmployees(initialEmployees);
  }, []);

  const runPayroll = async () => {
    setIsProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 3000));
    setCurrentPayrollRun({
      id: "PR-2025-11-18",
      period: selectedPeriod,
      startDate: "2025-11-01",
      endDate: "2025-11-15",
      payDate: "2025-11-20",
      status: "pending",
      totals: {
        gross: 456_789,
        net: 342_567,
        taxes: 89_234,
        benefits: 24_988,
        employerTaxes: 34_567,
        employerBenefits: 45_678,
      },
      employeeCount: payrollMetrics.employeeCount,
    });
    setIsProcessing(false);
  };

  const dashboardMetrics = useMemo(
    () => [
      {
        icon: DollarSign,
        label: "Total Payroll (MTD)",
        value: `$${(payrollMetrics.totalPayroll / 1_000).toFixed(0)}K`,
        change: "+5.2%",
        color: "green" as MetricColor,
      },
      {
        icon: Users,
        label: "Avg Salary",
        value: `$${(payrollMetrics.avgSalary / 1_000).toFixed(0)}K`,
        change: "+3.1%",
        color: "blue" as MetricColor,
      },
      {
        icon: Clock,
        label: "Overtime Cost",
        value: `$${(payrollMetrics.overtimeCost / 1_000).toFixed(0)}K`,
        change: "-12%",
        color: "orange" as MetricColor,
      },
      {
        icon: Heart,
        label: "Benefits Cost",
        value: `$${(payrollMetrics.benefitsCost / 1_000).toFixed(0)}K`,
        change: "+2.5%",
        color: "purple" as MetricColor,
      },
    ],
    [],
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <header className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-bold text-gray-900">
              <DollarSign className="h-8 w-8 text-green-600" />
              Payroll & HR Management
            </h1>
            <p className="mt-2 text-gray-500">AI-powered payroll processing with automatic tax compliance</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <MetricBadge label="Active Employees" value={payrollMetrics.employeeCount.toString()} icon={Users} colorClass="text-blue-600" />
            <MetricBadge label="Compliance" value={`${payrollMetrics.complianceScore}%`} icon={Shield} colorClass="text-green-600" />
            <button className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              <Upload className="h-4 w-4" />
              Import Time
            </button>
            <button
              onClick={runPayroll}
              disabled={isProcessing}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-green-600 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow hover:from-green-700 hover:to-blue-700 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" /> Processing...
                </>
              ) : (
                <>
                  <Calculator className="h-5 w-5" /> Run Payroll
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      <nav className="mb-6 flex flex-wrap gap-2">
        {( ["dashboard", "run", "employees", "taxes", "benefits", "reports"] as PayrollTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-lg px-4 py-2 capitalize transition-colors ${
              activeTab === tab ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab === "run" ? "Run Payroll" : tab}
          </button>
        ))}
      </nav>

      <AnimatePresence mode="wait">
        {activeTab === "dashboard" && (
          <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {dashboardMetrics.map((metric) => (
                <MetricCard key={metric.label} {...metric} />
              ))}
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold">Payroll Calendar</h2>
                <PayrollCalendar events={payrollCalendarEvents} />
              </div>
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold">Recent Payroll Runs</h2>
                <RecentPayrollRuns runs={recentPayrollRuns} />
              </div>
            </section>

            <section className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold">Payroll Analytics</h2>
              <div className="h-80">
                <PayrollChart />
              </div>
            </section>
          </motion.div>
        )}

        {activeTab === "run" && (
          <motion.div key="run" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <section className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold">Configure Payroll Run</h2>
              <div className="grid gap-6 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Pay Period</label>
                  <select
                    value={selectedPeriod}
                    onChange={(event) => setSelectedPeriod(event.target.value as PayPeriod)}
                    className="w-full rounded-lg border border-gray-200 px-4 py-2"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="bi-weekly">Bi-Weekly</option>
                    <option value="semi-monthly">Semi-Monthly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Pay Date</label>
                  <input type="date" defaultValue="2025-11-20" className="w-full rounded-lg border border-gray-200 px-4 py-2" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Period Ending</label>
                  <input type="date" defaultValue="2025-11-15" className="w-full rounded-lg border border-gray-200 px-4 py-2" />
                </div>
              </div>
              <div className="mt-6 rounded-lg bg-blue-50 p-4">
                <div className="flex items-start gap-3">
                  <Brain className="mt-0.5 h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">AI Pre-Check Complete</p>
                    <p className="mt-1 text-sm text-blue-700">✓ All timesheets approved • ✓ No tax law changes • ✓ Benefits verified</p>
                  </div>
                </div>
              </div>
            </section>

            {currentPayrollRun && (
              <section className="rounded-xl bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Payroll Preview</h2>
                  <span
                    className={`rounded-full px-3 py-1 text-sm ${
                      currentPayrollRun.status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"
                    }`}
                  >
                    {currentPayrollRun.status}
                  </span>
                </div>

                <div className="mb-6 grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                  <PayrollSummaryCard label="Gross Pay" value={`$${currentPayrollRun.totals.gross.toLocaleString()}`} icon={DollarSign} />
                  <PayrollSummaryCard label="Employee Taxes" value={`$${currentPayrollRun.totals.taxes.toLocaleString()}`} icon={Receipt} />
                  <PayrollSummaryCard label="Benefits" value={`$${currentPayrollRun.totals.benefits.toLocaleString()}`} icon={Heart} />
                  <PayrollSummaryCard label="Net Pay" value={`$${currentPayrollRun.totals.net.toLocaleString()}`} icon={CreditCard} />
                  <PayrollSummaryCard label="Employer Taxes" value={`$${currentPayrollRun.totals.employerTaxes.toLocaleString()}`} icon={Building} />
                  <PayrollSummaryCard
                    label="Total Cost"
                    value={`$${(
                      currentPayrollRun.totals.gross +
                      currentPayrollRun.totals.employerTaxes +
                      currentPayrollRun.totals.employerBenefits
                    ).toLocaleString()}`}
                    icon={Calculator}
                  />
                </div>

                <div className="border-t pt-4">
                  <h3 className="mb-3 font-medium">Employee Breakdown</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b text-xs uppercase tracking-wide text-gray-500">
                        <tr>
                          <th className="py-2 text-left">Employee</th>
                          <th className="py-2 text-right">Regular</th>
                          <th className="py-2 text-right">Overtime</th>
                          <th className="py-2 text-right">Gross</th>
                          <th className="py-2 text-right">Taxes</th>
                          <th className="py-2 text-right">Benefits</th>
                          <th className="py-2 text-right">Net Pay</th>
                          <th className="py-2 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[1, 2, 3, 4, 5].map((index) => (
                          <tr key={index} className="border-b last:border-b-0 hover:bg-gray-50">
                            <td className="py-3">
                              <div>
                                <p className="font-medium">Employee {index}</p>
                                <p className="text-xs text-gray-500">ID: EMP00{index}</p>
                              </div>
                            </td>
                            <td className="py-3 text-right">$3,846.15</td>
                            <td className="py-3 text-right">$576.92</td>
                            <td className="py-3 text-right font-medium">$4,423.07</td>
                            <td className="py-3 text-right text-red-600">-$884.61</td>
                            <td className="py-3 text-right text-red-600">-$221.15</td>
                            <td className="py-3 text-right font-bold text-green-600">$3,317.31</td>
                            <td className="py-3 text-center">
                              <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">Verified</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-6">
                  <div className="flex gap-2">
                    <button className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200">Save Draft</button>
                    <button className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Export Preview</button>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                      <Send className="h-4 w-4" /> Submit for Approval
                    </button>
                    <button className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700">
                      <CheckCircle className="h-4 w-4" /> Approve & Process
                    </button>
                  </div>
                </div>
              </section>
            )}

            <section className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <Shield className="h-5 w-5 text-green-600" /> Tax Compliance Check
              </h2>
              <div className="space-y-3">
                {complianceChecklist.map((item) => (
                  <ComplianceCheckItem key={item.label} {...item} />
                ))}
              </div>
            </section>
          </motion.div>
        )}

        {activeTab === "employees" && (
          <motion.div key="employees" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <section className="rounded-xl bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b p-6">
                <h2 className="text-lg font-semibold">Employee Management</h2>
                <div className="flex gap-2">
                  <button className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Import Employees</button>
                  <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                    <UserPlus className="h-4 w-4" /> Add Employee
                  </button>
                </div>
              </div>
              <div className="p-6">
                <EmployeeList employees={employees} />
              </div>
            </section>
          </motion.div>
        )}

        {(["taxes", "benefits", "reports"] as PayrollTab[]).includes(activeTab) && (
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="rounded-xl bg-white p-8 text-center shadow-sm">
              <h2 className="text-2xl font-semibold text-gray-900 capitalize">{activeTab} workspace</h2>
              <p className="mt-2 text-gray-500">Detailed {activeTab} controls coming soon with filings, benefits enrollment, and executive-ready reporting.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showAIInsights && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6 rounded-xl border border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-white p-3 shadow-sm">
              <Zap className="h-6 w-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="mb-2 font-semibold text-gray-900">AI Payroll Intelligence</h3>
              <div className="grid gap-4 text-sm text-gray-600 md:grid-cols-2">
                <div>
                  <p>✓ Automatic tax updates applied for 3 states</p>
                  <p>✓ Overtime optimization could save $12K this month</p>
                  <p>✓ Benefits enrollment deadline reminder sent to 23 employees</p>
                </div>
                <div>
                  <p>⚠️ 5 employees approaching overtime threshold</p>
                  <p>💡 Switching pay schedule could improve cash flow by 15%</p>
                  <p>🎯 Year-end bonus accrual: $234,567 recommended</p>
                </div>
              </div>
            </div>
            <button onClick={() => setShowAIInsights(false)} className="text-gray-400 hover:text-gray-600">
              ×
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, change, color }: { icon: typeof DollarSign; label: string; value: string; change: string; color: MetricColor }) {
  const palette = metricColorMap[color];
  const isPositive = change.startsWith("+");
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm">
      <div className={`${palette.iconBg} mb-2 w-fit rounded-lg p-2`}>
        <Icon className={`h-5 w-5 ${palette.iconColor}`} />
      </div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className={`mt-1 text-xs ${isPositive ? "text-green-600" : "text-red-600"}`}>{change} vs last period</p>
    </div>
  );
}

function MetricBadge({ icon: Icon, label, value, colorClass }: { icon: typeof Users; label: string; value: string; colorClass: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 shadow-sm">
      <Icon className={`h-5 w-5 ${colorClass}`} />
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-lg font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function PayrollSummaryCard({ label, value, icon: Icon }: { label: string; value: string; icon: typeof DollarSign }) {
  return (
    <div className="rounded-lg bg-gray-50 p-3">
      <div className="mb-1 flex items-center gap-2">
        <Icon className="h-4 w-4 text-gray-500" />
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <p className="text-lg font-bold text-gray-900">{value}</p>
    </div>
  );
}

function ComplianceCheckItem({ label, status, message }: ComplianceItem) {
  const config = complianceStatusMap[status];
  const Icon = config.icon;
  return (
    <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
      <div className="flex items-center gap-3">
        <Icon className={`h-5 w-5 text-${config.color}-600`} />
        <div>
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-sm text-gray-500">{message}</p>
        </div>
      </div>
      <span className={`rounded-full bg-${config.color}-100 px-2 py-1 text-xs capitalize text-${config.color}-700`}>{status}</span>
    </div>
  );
}

function PayrollCalendar({ events }: { events: PayrollCalendarEvent[] }) {
  return (
    <div className="space-y-3">
      {events.map((event) => (
        <div key={event.date} className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
          <div className="flex items-center gap-3">
            <Calendar
              className={`h-5 w-5 ${
                event.type === "payday" ? "text-green-600" : event.type === "tax" ? "text-blue-600" : "text-purple-600"
              }`}
            />
            <div>
              <p className="font-medium text-gray-900">{event.label}</p>
              <p className="text-xs text-gray-500">{event.date}</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-400" />
        </div>
      ))}
    </div>
  );
}

function RecentPayrollRuns({ runs }: { runs: Array<{ id: string; date: string; amount: number; status: string }> }) {
  return (
    <div className="space-y-3">
      {runs.map((run) => (
        <div key={run.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
          <div>
            <p className="font-medium text-gray-900">{run.id}</p>
            <p className="text-xs text-gray-500">{run.date}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-gray-900">${run.amount.toLocaleString()}</p>
            <span className="rounded-full bg-green-100 px-2 py-1 text-xs capitalize text-green-700">{run.status}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmployeeList({ employees }: { employees: Employee[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th className="py-3 text-left">Employee</th>
            <th className="py-3 text-left">Department</th>
            <th className="py-3 text-left">Position</th>
            <th className="py-3 text-right">Compensation</th>
            <th className="py-3 text-left">Employment Type</th>
            <th className="py-3 text-center">Status</th>
            <th className="py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((employee) => (
            <tr key={employee.id} className="border-b last:border-b-0 hover:bg-gray-50">
              <td className="py-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-gray-200" />
                  <div>
                    <p className="font-medium text-gray-900">{employee.name}</p>
                    <p className="text-xs text-gray-500">{employee.id}</p>
                  </div>
                </div>
              </td>
              <td className="py-3 text-gray-600">{employee.department}</td>
              <td className="py-3 text-gray-600">{employee.position}</td>
              <td className="py-3 text-right font-medium">
                {employee.salary > 0 ? `$${employee.salary.toLocaleString()}` : `$${employee.hourlyRate?.toFixed(2)}/hr`}
              </td>
              <td className="py-3 capitalize text-gray-600">{employee.employmentType.replace("-", " ")}</td>
              <td className="py-3 text-center">
                <span
                  className={`rounded-full px-2 py-1 text-xs ${
                    employee.status === "active"
                      ? "bg-green-100 text-green-700"
                      : employee.status === "on-leave"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {employee.status}
                </span>
              </td>
              <td className="py-3 text-right">
                <button className="text-sm font-semibold text-blue-600 hover:text-blue-700">Edit</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
