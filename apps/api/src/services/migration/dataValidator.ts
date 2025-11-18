export type ValidationResult = {
  isValid: boolean;
  errors: string[];
  warnings: string[];
};

export class DataValidator {
  constructor() {}

  async validate(entityType: string, record: Record<string, unknown>): Promise<ValidationResult> {
    // Very permissive placeholder validator
    const res: ValidationResult = { isValid: true, errors: [], warnings: [] };
    if (!record || Object.keys(record).length === 0) {
      res.warnings.push(`${entityType} record was empty`);
    }
    return res;
  }
}

export default DataValidator;
