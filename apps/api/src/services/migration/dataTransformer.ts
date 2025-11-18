type GenericRecord = Record<string, unknown>;

export class DataTransformer {
  constructor() {}

  async transform(entityType: string, records: GenericRecord[]): Promise<GenericRecord[]> {
    // Basic identity transform placeholder. Real logic maps SAP fields to local schema.
    return records.map((record) => ({ ...record, __entity: entityType }));
  }
}

export default DataTransformer;
