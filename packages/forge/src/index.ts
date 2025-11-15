import axios from "axios";

export interface ForgeClientOptions {
  baseUrl: string;
  apiKey: string;
}

export class ForgeClient {
  constructor(private readonly options: ForgeClientOptions) {}

  async triggerWorkflow<TResponse = unknown>(params: { workflowId: string; payload: unknown }): Promise<TResponse> {
    const response = await axios.post<TResponse>(
      new URL(`/workflows/${params.workflowId}/trigger`, this.options.baseUrl).toString(),
      params.payload,
      {
        headers: {
          Authorization: `Bearer ${this.options.apiKey}`
        }
      }
    );
    return response.data;
  }
}
