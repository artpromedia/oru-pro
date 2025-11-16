"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Brain, Building2, Factory, Package, Sparkles, CheckCircle } from "lucide-react";

import { CompanyProfileStep, IndustryOperationsStep } from "./components/CompanyProfileStep";
import { ModuleSelectionStep } from "./components/ModuleSelectionStep";
import { AIConfigurationStep } from "./components/AIConfigurationStep";
import { ModelProvisioningStep } from "./components/ModelProvisioningStep";
import { TenantOnboardingData } from "./types";

const TOTAL_STEPS = 5;

export default function TenantOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [tenantData, setTenantData] = useState<TenantOnboardingData>({
    company: "",
    industry: "",
    size: "",
    revenue: "",
    industryModels: [],
    locations: [{ type: "headquarters", name: "", address: "" }],
    modules: [],
    aiPreferences: {
      automationLevel: "balanced",
      dataPrivacy: "isolated",
      learningMode: "continuous",
      modelDeployment: "dedicated",
      computeLocation: "auto",
    },
  });

  const steps = useMemo(
    () => [
      { id: 1, name: "Company Profile", icon: Building2 },
      { id: 2, name: "Industry & Operations", icon: Factory },
      { id: 3, name: "Module Selection", icon: Package },
      { id: 4, name: "AI Configuration", icon: Brain },
      { id: 5, name: "Model Provisioning", icon: Sparkles },
    ],
    []
  );

  const goNext = () => setStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
  const goBack = () => setStep((prev) => Math.max(prev - 1, 1));

  const launchPlatform = () => {
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600">
      <div className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <Brain className="w-8 h-8 text-white" />
              <span className="text-white font-bold text-xl">Oru Onboarding</span>
            </div>
            <OnboardingProgress steps={steps} currentStep={step} />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {step === 1 && <CompanyProfileStep data={tenantData} setData={setTenantData} />}
          {step === 2 && <IndustryOperationsStep data={tenantData} setData={setTenantData} />}
          {step === 3 && <ModuleSelectionStep data={tenantData} setData={setTenantData} />}
          {step === 4 && <AIConfigurationStep data={tenantData} setData={setTenantData} />}
          {step === 5 && <ModelProvisioningStep data={tenantData} />}

          <div className="flex flex-wrap items-center justify-between mt-8 pt-6 border-t">
            {step > 1 && (
              <button onClick={goBack} className="px-6 py-3 text-gray-600 hover:text-gray-800" type="button">
                ← Previous
              </button>
            )}
            {step < TOTAL_STEPS ? (
              <button
                onClick={goNext}
                className="ml-auto px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                type="button"
              >
                Continue →
              </button>
            ) : (
              <button
                onClick={launchPlatform}
                className="ml-auto px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                type="button"
              >
                Launch Oru Platform →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface OnboardingStepMeta {
  id: number;
  name: string;
  icon: typeof Building2;
}

function OnboardingProgress({ steps, currentStep }: { steps: OnboardingStepMeta[]; currentStep: number }) {
  return (
    <div className="flex items-center space-x-2">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${
              step.id < currentStep
                ? "bg-green-500 text-white"
                : step.id === currentStep
                ? "bg-white text-purple-600"
                : "bg-white/30 text-white/70"
            }`}
          >
            {step.id < currentStep ? <CheckCircle className="w-5 h-5" /> : step.id}
          </div>
          {index < steps.length - 1 && (
            <div className={`w-12 h-0.5 mx-2 ${step.id < currentStep ? "bg-green-500" : "bg-white/30"}`} />
          )}
        </div>
      ))}
    </div>
  );
}
