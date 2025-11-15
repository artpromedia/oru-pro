import { z } from "zod";
import { router, publicProcedure } from "../trpc.js";

const journalLine = z.object({
  account: z.string(),
  debit: z.number().nonnegative().default(0),
  credit: z.number().nonnegative().default(0),
  memo: z.string().optional()
});

const journalEntryInput = z.object({
  reference: z.string(),
  entryDate: z.string().datetime(),
  preparedBy: z.string(),
  lines: z.array(journalLine).min(2)
});

const budgetVsActualInput = z.object({
  department: z.string().optional(),
  period: z.string().regex(/\d{4}-Q[1-4]/, "Expecting YYYY-Q# format")
});

const cashFlowInput = z.object({
  horizonWeeks: z.number().min(4).max(26).default(12)
});

const reconciliationInput = z.object({
  bankAccount: z.string(),
  statementEndingBalance: z.number(),
  statementDate: z.string().datetime()
});

export const financeRouter = router({
  getTrialBalance: publicProcedure.query(async () => {
    return {
      generatedAt: new Date().toISOString(),
      baseCurrency: "USD",
      accounts: [
        { account: "1000", name: "Cash", debit: 520000, credit: 0 },
        { account: "1400", name: "Inventory", debit: 210000, credit: 0 },
        { account: "2000", name: "Accounts Payable", debit: 0, credit: 145000 }
      ]
    };
  }),

  createJournalEntry: publicProcedure.input(journalEntryInput).mutation(async ({ input }) => {
    const totalDebit = input.lines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredit = input.lines.reduce((sum, line) => sum + line.credit, 0);
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error("Journal entry is not balanced");
    }

    return {
      entryId: `JE-${Date.now()}`,
      status: "POSTED" as const,
      totals: { debit: totalDebit, credit: totalCredit },
      preparedBy: input.preparedBy
    };
  }),

  budgetVsActual: publicProcedure.input(budgetVsActualInput).query(async ({ input }) => {
    const variance = {
      revenue: { budget: 1_200_000, actual: 1_260_000 },
      cogs: { budget: 720_000, actual: 745_000 }
    };
    const aiNarrative = `AI variance analysis indicates ${(variance.revenue.actual - variance.revenue.budget).toLocaleString()} upside in revenue driven by seasonal beverage mix.`;
    return {
      period: input.period,
      department: input.department ?? "Consolidated",
      variance,
      aiNarrative
    };
  }),

  cashFlowForecast: publicProcedure.input(cashFlowInput).query(async ({ input }) => {
    const weeks = Array.from({ length: input.horizonWeeks }).map((_, idx) => ({
      week: idx + 1,
      inflow: 150000 + idx * 2500,
      outflow: 120000 + idx * 1800
    }));
    return {
      generatedAt: new Date().toISOString(),
      horizonWeeks: input.horizonWeeks,
      projection: weeks,
      netPosition: weeks.reduce((acc, week) => acc + (week.inflow - week.outflow), 0)
    };
  }),

  automatedReconciliation: publicProcedure.input(reconciliationInput).mutation(async ({ input }) => {
    const unmatched = [
      { type: "Deposit", amount: 12500, reference: "Stripe payout", action: "Verify settlement" },
      { type: "Withdrawal", amount: 7200, reference: "Armored cash pickup", action: "Confirm manifest" }
    ];
    return {
      bankAccount: input.bankAccount,
      statementDate: input.statementDate,
      endingBalance: input.statementEndingBalance,
      unmatched,
      status: unmatched.length === 0 ? "RECONCILED" : "REVIEW_REQUIRED"
    };
  })
});

export type FinanceRouter = typeof financeRouter;
