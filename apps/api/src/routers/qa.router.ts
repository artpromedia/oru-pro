import { router, publicProcedure } from "../trpc.js";

type TelemetryRecord = {
  lot: string;
  plant: string;
  status: "pending" | "released" | "blocked";
  temperatureExcursion: boolean;
  dwellHours: number;
  recommendedAction: string;
};

const releaseQueue: TelemetryRecord[] = [
  {
    lot: "LOT-001",
    plant: "St. Louis",
    status: "pending",
    temperatureExcursion: false,
    dwellHours: 11,
    recommendedAction: "Prioritize QA spot check"
  },
  {
    lot: "LOT-002",
    plant: "Raleigh",
    status: "blocked",
    temperatureExcursion: true,
    dwellHours: 26,
    recommendedAction: "Trigger cold-chain requalification"
  }
];

export const qaRouter = router({
  releaseQueue: publicProcedure.query(() => releaseQueue),

  coldChainSegmentation: publicProcedure.query(() => {
    const segments = releaseQueue.reduce(
      (acc, lot) => {
        if (lot.temperatureExcursion) {
          acc.highRisk += 1;
        } else if (lot.dwellHours > 24) {
          acc.mediumRisk += 1;
        } else {
          acc.lowRisk += 1;
        }
        return acc;
      },
      { highRisk: 0, mediumRisk: 0, lowRisk: 0 }
    );

    return {
      segments,
      updatedAt: new Date().toISOString()
    };
  }),

  recommendations: publicProcedure.query(() => [
    {
      id: "qa-rec-1",
      action: "Route QA drones to cold-chain dock",
      impact: "High",
      effort: "Low"
    },
    {
      id: "qa-rec-2",
      action: "Escalate blocked lots to QA copilot",
      impact: "Medium",
      effort: "Medium"
    }
  ])
});

export type QaRouter = typeof qaRouter;
