import crypto from "node:crypto";

export type ComplianceInput = {
  content: string;
  type: string;
  metadata?: Record<string, unknown>;
};

export type ComplianceResult = {
  compliant: boolean;
  standards: string[];
  violations: string[];
  digitalSignature: string;
  requiresLock: boolean;
};

class ComplianceChecker {
  async validateDocument(input: ComplianceInput): Promise<ComplianceResult> {
    const standards = this.detectStandards(input);
    const violations = this.detectViolations(input.content, standards);

    return {
      compliant: violations.length === 0,
      standards,
      violations,
      digitalSignature: crypto.createHash("sha256").update(input.content).digest("hex"),
      requiresLock: standards.includes("21 CFR Part 11"),
    };
  }

  private detectStandards(input: ComplianceInput) {
    const standards = new Set<string>();
    const text = input.content.toLowerCase();

    if (text.includes("batch") || (input.metadata?.category as string | undefined) === "quality") {
      standards.add("21 CFR Part 11");
    }
    if (text.includes("invoice") || text.includes("purchase")) {
      standards.add("SOX");
    }
    if (text.includes("gdpr") || text.includes("privacy")) {
      standards.add("GDPR");
    }

    return Array.from(standards);
  }

  private detectViolations(content: string, standards: string[]) {
    const violations: string[] = [];
    if (standards.includes("GDPR") && content.toLowerCase().includes("unmasked")) {
      violations.push("Sensitive data must be masked under GDPR");
    }
    return violations;
  }
}

export const complianceChecker = new ComplianceChecker();
