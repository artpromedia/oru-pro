export interface SAPConfig {
  host: string;
  client: string;
  systemNumber: string;
  user: string;
  password: string;
  environment: "R3" | "S4";
  language?: string;
}

interface SandboxResult {
  orgId: string;
  anonymized: boolean;
  datasets: string[];
  sandboxId: string;
}

interface MasterDataPayload {
  materials: string[];
  vendors: string[];
  customers: string[];
  chartOfAccounts: string[];
}

interface TransactionPayload {
  inventoryMovements: number;
  purchaseOrders: number;
  productionOrders: number;
  financialPostings: number;
}

export class SAPMigrationService {
  async connectToSAP(config: SAPConfig) {
    await this.simulateLatency();
    if (!config.user || !config.password) {
      throw new Error("Missing SAP credentials");
    }

    return {
      connectionId: `SAP-${config.client}-${Date.now()}`,
      environment: config.environment,
      validatedAt: new Date().toISOString()
    };
  }

  async extractMasterData(): Promise<MasterDataPayload> {
    await this.simulateLatency();
    const data = {
      materials: ["MARA", "MARC"],
      vendors: ["LFA1", "LFB1"],
      customers: ["KNA1", "KNB1"],
      chartOfAccounts: ["SKA1"]
    };
    return this.mapToOruSchema(data);
  }

  async extractTransactions(months: number = 6): Promise<TransactionPayload> {
    await this.simulateLatency();
    return {
      inventoryMovements: months * 1200,
      purchaseOrders: months * 450,
      productionOrders: months * 260,
      financialPostings: months * 3200
    };
  }

  async createSandbox(orgId: string): Promise<SandboxResult> {
    await this.simulateLatency();
    return {
      orgId,
      anonymized: true,
      datasets: ["inventory", "procurement", "finance", "production"],
      sandboxId: `SBOX-${orgId}-${Date.now()}`
    };
  }

  private mapToOruSchema<T>(data: T): T {
    return data;
  }

  private async simulateLatency(delayMs = 300): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}
