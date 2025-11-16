"use client";

import { useEffect, useState } from "react";
import { Brain, Shield, CheckCircle, Loader } from "lucide-react";

import { TenantOnboardingData } from "../types";

interface ProvisioningStepState {
  id: string;
  name: string;
  status: "pending" | "running" | "completed";
  detail: string;
}

interface ModelProvisioningProps {
  data: TenantOnboardingData;
}

export function ModelProvisioningStep({ data }: ModelProvisioningProps) {
  const [provisioningStatus, setProvisioningStatus] = useState<"initializing" | "completed">("initializing");
  const [progress, setProgress] = useState(0);
  const [steps, setSteps] = useState<ProvisioningStepState[]>([
    { id: "clone", name: "Cloning Oru Master Models", status: "pending", detail: "" },
    { id: "isolate", name: "Creating Isolated Environment", status: "pending", detail: "" },
    { id: "customize", name: "Customizing for Your Industry", status: "pending", detail: "" },
    { id: "security", name: "Applying Security Policies", status: "pending", detail: "" },
    { id: "train", name: "Initial AI Training", status: "pending", detail: "" },
    { id: "validate", name: "Validating Deployment", status: "pending", detail: "" },
  ]);

  useEffect(() => {
    let isMounted = true;

    const runProvisioning = async () => {
      const advanceStep = async (stepId: string, runningDetail: string, completedDetail: string, progressValue: number, delay = 2000) => {
        if (!isMounted) return;
        setSteps((prev) =>
          prev.map((step) =>
            step.id === stepId
              ? {
                  ...step,
                  status: "running",
                  detail: runningDetail,
                }
              : step
          )
        );
        setProgress(progressValue);
        await new Promise((resolve) => setTimeout(resolve, delay));
        if (!isMounted) return;
        setSteps((prev) =>
          prev.map((step) =>
            step.id === stepId
              ? {
                  ...step,
                  status: "completed",
                  detail: completedDetail,
                }
              : step
          )
        );
      };

      await advanceStep("clone", "Cloning master AI models...", `${data.modules.length || 0} module models cloned`, 10);
      await advanceStep("isolate", "Setting up isolated infrastructure...", "Dedicated namespace created", 25);
      await advanceStep("customize", `Configuring for ${data.industry || "your"} operations...`, "Industry-specific models configured", 45);
      await advanceStep("security", "Applying encryption and access controls...", "End-to-end encryption enabled", 65, 1500);
      await advanceStep("train", "Running initial training cycles...", "Base training completed", 85, 2500);
      await advanceStep("validate", "Running validation tests...", "All systems operational", 95, 1500);

      if (!isMounted) return;
      setProgress(100);
      setProvisioningStatus("completed");
    };

    runProvisioning();

    return () => {
      isMounted = false;
    };
  }, [data]);

  return (
    <div>
      <div className="text-center mb-8">
        <div className="relative inline-block">
          <Brain className={`w-16 h-16 text-purple-600 mx-auto mb-4 ${provisioningStatus === "completed" ? "" : "animate-pulse"}`} />
          {provisioningStatus === "completed" && <CheckCircle className="w-6 h-6 text-green-500 absolute -bottom-1 -right-1" />}
        </div>
        <h2 className="text-2xl font-bold text-gray-900">
          {provisioningStatus === "completed" ? "Your AI is Ready!" : "Provisioning Your AI Instance"}
        </h2>
        <p className="text-gray-600 mt-2">
          {provisioningStatus === "completed"
            ? `${data.company || "Your company"}'s dedicated Oru platform is ready to use`
            : "Creating your isolated AI environment..."}
        </p>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="space-y-3 mb-8">
        {steps.map((step) => (
          <ProvisioningStep key={step.id} step={step} />
        ))}
      </div>

      {provisioningStatus === "completed" && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="font-semibold text-green-900 mb-4">Deployment Complete</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <DeploymentStat label="Tenant ID" value={`ORU-${(data.company || "tenant").toUpperCase()}-001`} />
            <DeploymentStat label="AI Models" value={`${data.modules.length} deployed`} />
            <DeploymentStat label="Data Region" value={data.aiPreferences.computeLocation || "US-East"} />
            <DeploymentStat label="Isolation Level" value="Complete" />
            <DeploymentStat label="API Endpoint" value={`${data.company.toLowerCase() || "tenant"}.oru.ai`} />
            <DeploymentStat label="Status" value="Active" status="active" />
          </div>

          <div className="mt-6 p-4 bg-white rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Your Dedicated AI Models</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {data.modules.map((module) => (
                <div key={module} className="flex items-center space-x-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="capitalize">{module} AI</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex items-start space-x-3">
            <Shield className="w-5 h-5 text-green-600 mt-0.5" />
            <div className="text-sm text-green-800">
              <p className="font-medium">Security &amp; Compliance</p>
              <p className="mt-1">
                Your data is fully isolated. AI models are trained exclusively on your data and will never share information with other tenants.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface ProvisioningStepProps {
  step: ProvisioningStepState;
}

function ProvisioningStep({ step }: ProvisioningStepProps) {
  const statusVisual = {
    pending: <div className="w-5 h-5 rounded-full border-2 border-gray-300" />,
    running: <Loader className="w-5 h-5 text-purple-600 animate-spin" />,
    completed: <CheckCircle className="w-5 h-5 text-green-500" />,
  } as const;

  return (
    <div
      className={`flex items-center space-x-3 p-3 rounded-lg ${
        step.status === "running"
          ? "bg-purple-50 border border-purple-200"
          : step.status === "completed"
          ? "bg-green-50"
          : "bg-gray-50"
      }`}
    >
      {statusVisual[step.status]}
      <div className="flex-1">
        <p className={`text-sm font-medium ${step.status === "completed" ? "text-green-900" : "text-gray-900"}`}>
          {step.name}
        </p>
        {step.detail && <p className="text-xs text-gray-600">{step.detail}</p>}
      </div>
    </div>
  );
}

interface DeploymentStatProps {
  label: string;
  value: string;
  status?: "active" | "default";
}

function DeploymentStat({ label, value, status = "default" }: DeploymentStatProps) {
  return (
    <div>
      <p className="text-gray-600">{label}</p>
      <p className={`font-medium ${status === "active" ? "text-green-600" : "text-gray-900"}`}>{value}</p>
    </div>
  );
}
