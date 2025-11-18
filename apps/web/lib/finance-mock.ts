import type { GeneralLedgerResponse } from "./finance-types";

export const generalLedgerSnapshot: GeneralLedgerResponse = {
  lastUpdated: new Date().toISOString(),
  companyCode: "CC01",
  metrics: {
    revenue: 12_450_000,
    revenueGrowth: 12.5,
    expenses: 8_920_000,
    expenseRatio: 71.6,
    netIncome: 3_530_000,
    profitMargin: 28.4,
    cashBalance: 4_580_000,
    currentRatio: 2.1,
    dso: 42,
    workingCapital: 3_200_000,
  },
  journals: [
    { id: "JE-2024-1142", description: "Monthly Payroll", amount: 458_000, status: "posted", date: "Nov 15, 2024" },
    { id: "JE-2024-1143", description: "Inventory Purchase", amount: 125_000, status: "posted", date: "Nov 16, 2024" },
    { id: "JE-2024-1144", description: "Revenue Recognition", amount: 892_000, status: "draft", date: "Nov 18, 2024" },
    { id: "JE-2024-1145", description: "Depreciation", amount: 28_000, status: "draft", date: "Nov 18, 2024" },
  ],
  accounts: [
    { id: "100000", name: "Cash & Cash Equivalents", balance: 4_580_000, variance: 6.4, owner: "Treasury", risk: "low" },
    { id: "120000", name: "Accounts Receivable", balance: 3_120_000, variance: -2.1, owner: "Order-to-Cash", risk: "medium" },
    { id: "200000", name: "Accounts Payable", balance: -2_760_000, variance: 1.8, owner: "Procure-to-Pay", risk: "low" },
    { id: "310000", name: "Deferred Revenue", balance: -1_940_000, variance: 4.5, owner: "RevOps", risk: "high" },
  ],
  reports: [
    { title: "Intercompany Netting", detail: "$1.1M settled across CC01/CC02", trend: "+8%", positive: true },
    { title: "FX Exposure", detail: "EUR hedge effectiveness at 96%", trend: "-1.2%", positive: true },
    { title: "Compliance", detail: "SOX controls 100% on-time", trend: "0 issues", positive: true },
  ],
};
