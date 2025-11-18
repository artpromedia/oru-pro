export type SAPConnectorOptions = {
  host?: string;
  client?: string;
  user?: string;
  password?: string;
  systemNumber?: string;
  environment?: "R3" | "S4";
  language?: string;
};

export type SAPRecord = Record<string, unknown>;

export class SAPConnector {
  private connected = false;

  constructor(private readonly options: SAPConnectorOptions) {}

  async connect(): Promise<void> {
    if (!this.options.user || !this.options.password) {
      throw new Error("SAP credentials are required");
    }

    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  async getSystemInfo(): Promise<Record<string, unknown>> {
    this.ensureConnected();

    return {
      host: this.options.host,
      client: this.options.client,
      environment: this.options.environment ?? "S4",
      release: "S/4HANA 2022",
      systemTime: new Date().toISOString()
    };
  }

  async countRecords(table: string): Promise<number> {
    this.ensureConnected();
    const tableSeed = table.length || 1;
    return Math.floor(Math.random() * 5000) + 500 + tableSeed;
  }

  async extractBatch(table: string, offset: number, limit: number): Promise<SAPRecord[]> {
    this.ensureConnected();
    return Array.from({ length: limit }, (_, idx) => ({
      id: `${table}-${offset + idx + 1}`,
      table,
      payload: {
        updatedAt: new Date().toISOString()
      }
    }));
  }

  private ensureConnected(): void {
    if (!this.connected) {
      throw new Error("SAP connector is not connected");
    }
  }
}
