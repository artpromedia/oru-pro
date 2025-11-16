"use client";

import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Brain, Shield, Zap, Cpu } from "lucide-react";

import { AIPreferences, TenantOnboardingData } from "../types";

interface AIConfigurationProps {
  data: TenantOnboardingData;
  setData: Dispatch<SetStateAction<TenantOnboardingData>>;
}

export function AIConfigurationStep({ data, setData }: AIConfigurationProps) {
  const [aiSettings, setAiSettings] = useState<AIPreferences>(data.aiPreferences);

  useEffect(() => {
    setAiSettings(data.aiPreferences);
  }, [data.aiPreferences]);

  useEffect(() => {
    setData((prev) => ({ ...prev, aiPreferences: aiSettings }));
  }, [aiSettings, setData]);

  return (
    <div>
      <div className="text-center mb-8">
        <Brain className="w-16 h-16 text-purple-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Configure Your AI</h2>
        <p className="text-gray-600 mt-2">Set up how Oru's AI will work for your company</p>
      </div>

      <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <Shield className="w-5 h-5 text-green-600 mt-1" />
          <div>
            <p className="font-medium text-green-900">Complete Data Isolation</p>
            <p className="text-sm text-green-700 mt-1">
              Your AI models will be cloned from Oru's master models and trained exclusively on your data.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">AI Automation Level</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <AutomationOption
            level="conservative"
            title="Conservative"
            description="AI suggests, you approve"
            percentage="30%"
            selected={aiSettings.automationLevel === "conservative"}
            onClick={() => setAiSettings((prev) => ({ ...prev, automationLevel: "conservative" }))}
          />
          <AutomationOption
            level="balanced"
            title="Balanced"
            description="Auto-execute routine tasks"
            percentage="70%"
            selected={aiSettings.automationLevel === "balanced"}
            onClick={() => setAiSettings((prev) => ({ ...prev, automationLevel: "balanced" }))}
          />
          <AutomationOption
            level="aggressive"
            title="Aggressive"
            description="Maximum automation"
            percentage="95%"
            selected={aiSettings.automationLevel === "aggressive"}
            onClick={() => setAiSettings((prev) => ({ ...prev, automationLevel: "aggressive" }))}
          />
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">AI Model Deployment</label>
        <div className="space-y-3">
          <DeploymentOption
            type="dedicated"
            title="Dedicated Instance"
            description="Your own AI models running on isolated infrastructure"
            features={["100% isolated", "Custom training", "Full control"]}
            selected={aiSettings.modelDeployment === "dedicated"}
            onClick={() => setAiSettings((prev) => ({ ...prev, modelDeployment: "dedicated" }))}
          />
          <DeploymentOption
            type="edge"
            title="Edge + Cloud Hybrid"
            description="Critical AI runs on-premise, analytics in cloud"
            features={["Low latency", "Offline capable", "Cost optimized"]}
            selected={aiSettings.modelDeployment === "edge"}
            onClick={() => setAiSettings((prev) => ({ ...prev, modelDeployment: "edge" }))}
          />
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">Data Residency & Compute Location</label>
        <select
          value={aiSettings.computeLocation}
          onChange={(e) => setAiSettings((prev) => ({ ...prev, computeLocation: e.target.value }))}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg"
        >
          <option value="auto">Auto-select based on performance</option>
          <option value="us-east">US East (Virginia)</option>
          <option value="us-west">US West (Oregon)</option>
          <option value="eu-central">EU Central (Frankfurt)</option>
          <option value="ap-south">Asia Pacific (Singapore)</option>
          <option value="on-premise">On-Premise Only</option>
        </select>
      </div>

      <div className="border-t pt-6">
        <h3 className="font-medium text-gray-900 mb-4">Advanced AI Settings</h3>
        <div className="space-y-3">
          <ToggleSetting
            label="Continuous Learning"
            description="AI improves from your usage patterns"
            enabled={aiSettings.learningMode === "continuous"}
            onChange={(enabled) =>
              setAiSettings((prev) => ({ ...prev, learningMode: enabled ? "continuous" : "static" }))
            }
          />
          <ToggleSetting
            label="Predictive Analytics"
            description="AI predicts future trends and issues"
            enabled
            readOnly
          />
          <ToggleSetting
            label="Anomaly Detection"
            description="AI monitors for unusual patterns"
            enabled
            readOnly
          />
        </div>
      </div>
    </div>
  );
}

interface AutomationOptionProps {
  level: AIPreferences["automationLevel"];
  title: string;
  description: string;
  percentage: string;
  selected: boolean;
  onClick: () => void;
}

function AutomationOption({ title, description, percentage, selected, onClick }: AutomationOptionProps) {
  return (
    <button
      onClick={onClick}
      className={`p-4 border rounded-lg transition-all text-center ${
        selected ? "border-purple-500 bg-purple-50" : "border-gray-300 hover:border-gray-400"
      }`}
      type="button"
    >
      <Zap className={`w-6 h-6 mx-auto mb-2 ${selected ? "text-purple-600" : "text-gray-400"}`} />
      <p className="font-medium text-sm">{title}</p>
      <p className="text-xs text-gray-600 mt-1">{description}</p>
      <p className="text-lg font-bold mt-2 text-purple-600">{percentage}</p>
    </button>
  );
}

interface DeploymentOptionProps {
  type: AIPreferences["modelDeployment"];
  title: string;
  description: string;
  features: string[];
  selected: boolean;
  onClick: () => void;
}

function DeploymentOption({ title, description, features, selected, onClick }: DeploymentOptionProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full p-4 border rounded-lg text-left transition-all ${
        selected ? "border-purple-500 bg-purple-50" : "border-gray-300 hover:border-gray-400"
      }`}
      type="button"
    >
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
        <Cpu className="w-5 h-5 text-purple-500" />
      </div>
      <ul className="list-disc pl-5 text-xs text-gray-600 space-y-1">
        {features.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>
    </button>
  );
}

interface ToggleSettingProps {
  label: string;
  description: string;
  enabled: boolean;
  readOnly?: boolean;
  onChange?: (enabled: boolean) => void;
}

function ToggleSetting({ label, description, enabled, readOnly, onChange }: ToggleSettingProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <button
        onClick={() => !readOnly && onChange?.(!enabled)}
        disabled={readOnly}
        className={`rounded-full px-4 py-1 text-xs font-semibold ${
          enabled ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"
        } ${readOnly ? "cursor-not-allowed" : ""}`}
        type="button"
      >
        {enabled ? "Active" : "Paused"}
      </button>
    </div>
  );
}
