export interface TenantLocation {
  type: string;
  name: string;
  address: string;
}

export type AutomationLevel = "conservative" | "balanced" | "aggressive";
export type ModelDeployment = "dedicated" | "edge";
export type LearningMode = "continuous" | "static";

export interface AIPreferences {
  automationLevel: AutomationLevel;
  dataPrivacy: "isolated" | "shared";
  learningMode: LearningMode;
  modelDeployment: ModelDeployment;
  computeLocation: string;
}

export interface TenantOnboardingData {
  company: string;
  industry: string;
  size: string;
  revenue: string;
  industryModels: string[];
  locations: TenantLocation[];
  modules: string[];
  aiPreferences: AIPreferences;
}
