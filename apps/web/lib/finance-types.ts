export type JournalStatus = "draft" | "posted" | "reversed";

export interface GeneralLedgerMetrics {
  revenue: number;
  revenueGrowth: number;
  expenses: number;
  expenseRatio: number;
  netIncome: number;
  profitMargin: number;
  cashBalance: number;
  currentRatio: number;
  dso: number;
  workingCapital: number;
}

export interface GeneralLedgerJournal {
  id: string;
  description: string;
  amount: number;
  status: JournalStatus;
  date: string;
}

export interface GeneralLedgerAccount {
  id: string;
  name: string;
  balance: number;
  variance: number;
  owner: string;
  risk: "low" | "medium" | "high";
}

export interface GeneralLedgerReportHighlight {
  title: string;
  detail: string;
  trend: string;
  positive: boolean;
}

export interface GeneralLedgerResponse {
  lastUpdated: string;
  companyCode: string;
  metrics: GeneralLedgerMetrics;
  journals: GeneralLedgerJournal[];
  accounts: GeneralLedgerAccount[];
  reports: GeneralLedgerReportHighlight[];
}
