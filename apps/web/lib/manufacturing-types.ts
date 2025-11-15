export type ProductionCellStatus = "running" | "changeover" | "maintenance" | string;

export interface ProductionCell {
  id: string;
  product: string;
  oee: number;
  throughput: number;
  changeover: string;
  scrap: number;
  status: ProductionCellStatus;
}

export type LineEventStatus = "complete" | "running" | "attention" | "queued" | string;

export interface ManufacturingLineEvent {
  time: string;
  event: string;
  detail: string;
  owner: string;
  status: LineEventStatus;
}

export interface ManufacturingDonutSlice {
  id: string;
  value: number;
  color?: string;
}

export interface ManufacturingStaffingRow {
  name: string;
  coverage: string;
  skill: string;
}

export interface ManufacturingOptimizationTask {
  title: string;
  detail: string;
  benefit: string;
}

export interface ManufacturingShopfloorResponse {
  productionCells: ProductionCell[];
  oeeBreakdown: ManufacturingDonutSlice[];
  scrapRatio: ManufacturingDonutSlice[];
  staffing: ManufacturingStaffingRow[];
  lineEvents: ManufacturingLineEvent[];
  optimizationQueue: ManufacturingOptimizationTask[];
}
