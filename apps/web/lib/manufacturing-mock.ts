import type { ManufacturingShopfloorResponse } from "./manufacturing-types";

export const mockManufacturingShopfloor: ManufacturingShopfloorResponse = {
  productionCells: [
    {
      id: "Cell A",
      product: "Precision Housing",
      oee: 91,
      throughput: 284,
      changeover: "17m",
      scrap: 0.4,
      status: "running",
    },
    {
      id: "Cell B",
      product: "Micro Gear",
      oee: 84,
      throughput: 198,
      changeover: "26m",
      scrap: 1.3,
      status: "changeover",
    },
    {
      id: "Cell C",
      product: "Aero Bracket",
      oee: 76,
      throughput: 142,
      changeover: "—",
      scrap: 2.1,
      status: "maintenance",
    },
  ],
  oeeBreakdown: [
    { id: "availability", value: 92, color: "#0EA5E9" },
    { id: "performance", value: 88, color: "#22C55E" },
    { id: "quality", value: 96, color: "#FACC15" },
  ],
  scrapRatio: [
    { id: "conforming", value: 98.9, color: "#16A34A" },
    { id: "scrap", value: 1.1, color: "#DC2626" },
  ],
  staffing: [
    { name: "Operator shift", coverage: "7 / 8", skill: "5-axis" },
    { name: "Quality techs", coverage: "3 / 3", skill: "Metrology" },
    { name: "Maintenance", coverage: "1 / 2", skill: "Electro-mech" },
  ],
  lineEvents: [
    {
      time: "07:45",
      event: "Tool preset",
      detail: "Haas UMC-750 spindle drift compensated",
      owner: "Tooling bot",
      status: "complete",
    },
    {
      time: "08:05",
      event: "Autonomous changeover",
      detail: "Cell B switching to Gear Rev F",
      owner: "Production agent",
      status: "running",
    },
    {
      time: "08:32",
      event: "Inline metrology",
      detail: "Probe flagged bore variance 14μm",
      owner: "QA agent",
      status: "attention",
    },
    {
      time: "09:10",
      event: "Kanban pull",
      detail: "Material request for titanium billets",
      owner: "Logistics agent",
      status: "queued",
    },
  ],
  optimizationQueue: [
    {
      title: "Dynamic feed override",
      detail: "Increase feed +6% on Cell A while staying within torque window.",
      benefit: "+11 parts / hr",
    },
    {
      title: "Predictive maintenance",
      detail: "Schedule spindle lube cycle for Cell C at 13:00 before variance crosses threshold.",
      benefit: "Avoids 4h downtime",
    },
    {
      title: "Automated inspection routing",
      detail: "Reroute bore measurements to CMM-02 for faster release.",
      benefit: "Saves 22 min",
    },
  ],
};
