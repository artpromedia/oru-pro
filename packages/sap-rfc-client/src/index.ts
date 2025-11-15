export interface SapConnectionOptions {
  user: string;
  passwd: string;
  ashost: string;
  sysnr: string;
  client: string;
}

export class SapRfcClient {
  constructor(private readonly options: SapConnectionOptions) {}

  async invoke(functionName: string, payload: Record<string, unknown>) {
    return { functionName, payload, destination: this.options.ashost };
  }
}
