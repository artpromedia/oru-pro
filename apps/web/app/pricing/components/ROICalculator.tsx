"use client";

import { useMemo, useState } from "react";
import { Calendar, Clock, DollarSign, TrendingUp } from "lucide-react";

export type ROICalculatorProps = {
  seatCount?: number;
};

type CalculatorInputs = {
  seats: number;
  currentSystem: string;
  hoursPerWeek: number;
  errorRate: number;
  avgHourlyWage: number;
};

type Calculations = {
  oruMonthly: number;
  oruYearly: number;
  timeSavedPerWeek: number;
  timeSavedPerYear: number;
  errorCostPerYear: number;
  errorSavings: number;
  laborSavingsPerYear: number;
  totalSavings: number;
  roi: number;
  paybackMonths: number;
};

export function ROICalculator({ seatCount: initialSeats = 50 }: ROICalculatorProps) {
  const [inputs, setInputs] = useState<CalculatorInputs>({
    seats: initialSeats,
    currentSystem: "spreadsheets",
    hoursPerWeek: 40,
    errorRate: 5,
    avgHourlyWage: 35,
  });

  const calculations = useMemo<Calculations>(() => {
    const oruMonthly = inputs.seats * 35;
    const oruYearly = oruMonthly * 12;
    const timeSavedPerWeek = inputs.hoursPerWeek * 0.3;
    const timeSavedPerYear = timeSavedPerWeek * 52;
    const errorCostPerYear = inputs.errorRate * 10_000;
    const errorSavings = inputs.errorRate * 0.95 * 10_000;
    const laborSavingsPerYear = timeSavedPerYear * inputs.avgHourlyWage * inputs.seats;
    const totalSavings = laborSavingsPerYear + errorSavings;
    const roi = ((totalSavings - oruYearly) / oruYearly) * 100;
    const paybackMonths = totalSavings > 0 ? oruYearly / (totalSavings / 12) : Infinity;

    return {
      oruMonthly,
      oruYearly,
      timeSavedPerWeek,
      timeSavedPerYear,
      errorCostPerYear,
      errorSavings,
      laborSavingsPerYear,
      totalSavings,
      roi,
      paybackMonths,
    };
  }, [inputs]);

  const handleChange = (key: keyof CalculatorInputs, value: string) => {
    setInputs((prev) => ({
      ...prev,
      [key]: key === "currentSystem" ? value : Number(value),
    }));
  };

  return (
    <section className="my-16 rounded-xl bg-white p-8 shadow-sm">
      <div className="mb-8 text-center">
        <h2 className="mb-2 text-3xl font-bold text-gray-900">ROI Calculator</h2>
        <p className="text-gray-600">See how much you can save with Oru&apos;s AI-powered platform</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Your Current Situation</h3>
          <Field
            label="Number of Users"
            type="number"
            value={inputs.seats}
            onChange={(event) => handleChange("seats", event.target.value)}
          />
          <Field label="Current System" as="select" value={inputs.currentSystem} onChange={(event) => handleChange("currentSystem", event.target.value)}>
            <option value="spreadsheets">Spreadsheets</option>
            <option value="legacy">Legacy ERP</option>
            <option value="sap">SAP</option>
            <option value="oracle">Oracle</option>
          </Field>
          <Field
            label="Hours per User per Week on Admin Tasks"
            type="number"
            value={inputs.hoursPerWeek}
            onChange={(event) => handleChange("hoursPerWeek", event.target.value)}
          />
          <Field
            label="Current Error Rate (%)"
            type="number"
            value={inputs.errorRate}
            onChange={(event) => handleChange("errorRate", event.target.value)}
          />
          <Field
            label="Average Hourly Wage ($)"
            type="number"
            value={inputs.avgHourlyWage}
            onChange={(event) => handleChange("avgHourlyWage", event.target.value)}
          />
        </div>

        <div className="rounded-lg bg-gradient-to-br from-purple-50 to-blue-50 p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Your Savings with Oru</h3>
          <div className="space-y-4">
            <ROIMetric
              icon={DollarSign}
              label="Annual Savings"
              value={`$${Math.round(calculations.totalSavings).toLocaleString()}`}
              detail="From efficiency and error reduction"
            />
            <ROIMetric
              icon={Clock}
              label="Time Saved"
              value={`${Math.round(calculations.timeSavedPerYear).toLocaleString()} hrs/year`}
              detail="30% efficiency gain with AI automation"
            />
            <ROIMetric
              icon={TrendingUp}
              label="ROI"
              value={`${Math.round(calculations.roi)}%`}
              detail="Return on investment"
            />
            <ROIMetric
              icon={Calendar}
              label="Payback Period"
              value={Number.isFinite(calculations.paybackMonths) ? `${calculations.paybackMonths.toFixed(1)} months` : "N/A"}
              detail="Time to recover investment"
            />
          </div>

          <div className="mt-6 rounded-lg bg-green-100 p-4 text-sm text-green-800">
            <strong>Bottom Line:</strong> Oru will save you
            <span className="px-1 text-lg font-bold text-green-900">
              ${Math.round(calculations.totalSavings - calculations.oruYearly).toLocaleString()}
            </span>
            per year after costs
          </div>
        </div>
      </div>
    </section>
  );
}

type FieldProps = {
  label: string;
  type?: string;
  value: number | string;
  onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  as?: "input" | "select";
  children?: React.ReactNode;
};

function Field({ label, type = "text", value, onChange, as = "input", children }: FieldProps) {
  const Component = as;
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <Component
        {...(as === "input" ? { type } : {})}
        value={value}
        onChange={onChange}
        className="w-full rounded-lg border border-gray-300 px-3 py-2"
      >
        {children}
      </Component>
    </div>
  );
}

type ROIMetricProps = {
  icon: typeof Calendar;
  label: string;
  value: string;
  detail: string;
};

function ROIMetric({ icon: Icon, label, value, detail }: ROIMetricProps) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-1 h-5 w-5 text-purple-600" />
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-600">{label}</p>
        <p className="text-xs text-gray-500">{detail}</p>
      </div>
    </div>
  );
}
