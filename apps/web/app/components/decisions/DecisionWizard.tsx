"use client";

import { useMemo, useState } from "react";
import { Card, Button } from "@oru/ui";

interface AlternativeScore {
  name: string;
  impact: string;
  cost: number;
  service: number;
  risk: number;
}

const steps = [
  "Capture decision context",
  "Compare alternatives",
  "Evaluate bias",
  "Review history",
  "Finalize + audit",
];

const alternativeMatrix: AlternativeScore[] = [
  { name: "Approve", impact: "Fast release", cost: 2, service: 5, risk: 3 },
  { name: "Conditional", impact: "Monitor", cost: 3, service: 4, risk: 2 },
  { name: "Retest", impact: "Delay", cost: 4, service: 2, risk: 1 },
];

const biasWarnings = [
  { label: "Overconfidence bias", severity: "high", note: "Owner sentiment flagged as overconfident." },
  { label: "Limited alternatives", severity: "medium", note: "Only two options considered in draft." },
  { label: "Missing data", severity: "low", note: "No supplier benchmark attached." },
];

const auditTrail = [
  { timestamp: "09:05", actor: "QA Co-Pilot", action: "Structured the decision" },
  { timestamp: "09:09", actor: "Inventory Ops", action: "Attached supplier audit" },
  { timestamp: "09:15", actor: "Decision Engine", action: "Calculated noise score 0.42" },
];

const historicalDecisions = [
  { id: "QA-8123", outcome: "Conditional", consistency: "0.86", reviewer: "M. Reyes" },
  { id: "QA-8099", outcome: "Approve", consistency: "0.74", reviewer: "V. Patel" },
];

export function DecisionWizard() {
  const [step, setStep] = useState(0);
  const [confidence, setConfidence] = useState(68);
  const [notes, setNotes] = useState("Observed slight texture variance. Releasing with monitoring.");

  const selectedStep = steps[step];

  const comparison = useMemo(() => {
    return alternativeMatrix.map((alt) => ({
      ...alt,
      score: (alt.service - alt.cost + (5 - alt.risk)) / 3,
    }));
  }, []);

  const next = () => setStep((prev) => Math.min(prev + 1, steps.length - 1));
  const back = () => setStep((prev) => Math.max(prev - 1, 0));

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-widest text-emerald-600">Decision hygiene</p>
        <h1 className="text-3xl font-semibold text-slate-900">Structured decision wizard</h1>
        <p className="text-slate-600">Guide ops teams through a human-in-the-loop approval with audit-ready artifacts.</p>
      </header>

      <Card className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          {steps.map((label, index) => (
            <div key={label} className="flex items-center text-sm text-slate-500">
              <span className={`mr-2 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${index <= step ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                {index + 1}
              </span>
              <span className={index === step ? "text-slate-900 font-medium" : undefined}>{label}</span>
              {index < steps.length - 1 && <span className="mx-2 text-slate-300">⟶</span>}
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={back} disabled={step === 0}>
            Back
          </Button>
          <Button onClick={next} disabled={step === steps.length - 1}>
            Continue
          </Button>
          <div className="ml-auto text-sm text-slate-500">{selectedStep}</div>
        </div>
      </Card>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4">
          <header>
            <h2 className="text-lg font-semibold text-slate-900">Alternative comparison matrix</h2>
            <p className="text-sm text-slate-500">Balance service, risk, and cost before making the call.</p>
          </header>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-slate-500">
                  <th className="py-2">Alternative</th>
                  <th className="py-2">Impact</th>
                  <th className="py-2">Cost</th>
                  <th className="py-2">Service</th>
                  <th className="py-2">Risk</th>
                  <th className="py-2">Score</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((alt) => (
                  <tr key={alt.name} className="border-t border-slate-100">
                    <td className="py-2 font-medium text-slate-900">{alt.name}</td>
                    <td className="py-2 text-slate-500">{alt.impact}</td>
                    <td className="py-2">{alt.cost}</td>
                    <td className="py-2">{alt.service}</td>
                    <td className="py-2">{alt.risk}</td>
                    <td className="py-2 font-semibold text-emerald-600">{alt.score.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="space-y-4">
          <header className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Bias warnings</h2>
              <p className="text-sm text-slate-500">Decision Intelligence Engine flags blind spots in real time.</p>
            </div>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">Noise score 0.42</span>
          </header>
          <ul className="space-y-3">
            {biasWarnings.map((bias) => (
              <li key={bias.label} className="rounded-lg border border-slate-100 p-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-900">{bias.label}</p>
                  <span className={`text-xs uppercase ${bias.severity === "high" ? "text-rose-600" : bias.severity === "medium" ? "text-amber-600" : "text-slate-400"}`}>
                    {bias.severity}
                  </span>
                </div>
                <p className="text-sm text-slate-500">{bias.note}</p>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="space-y-4">
          <header>
            <h2 className="text-lg font-semibold text-slate-900">Historical reference</h2>
            <p className="text-sm text-slate-500">Similar QA calls for context.</p>
          </header>
          <ul className="space-y-3 text-sm">
            {historicalDecisions.map((decision) => (
              <li key={decision.id} className="rounded-lg border border-slate-100 p-3">
                <p className="font-semibold text-slate-900">{decision.id}</p>
                <p className="text-slate-500">Outcome: {decision.outcome}</p>
                <p className="text-slate-500">Consistency: {decision.consistency}</p>
                <p className="text-xs text-slate-400">Reviewed by {decision.reviewer}</p>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="space-y-4">
          <header>
            <h2 className="text-lg font-semibold text-slate-900">Confidence score</h2>
            <p className="text-sm text-slate-500">Quantify how certain the approver is before routing.</p>
          </header>
          <div>
            <input
              type="range"
              min={0}
              max={100}
              value={confidence}
              onChange={(event) => setConfidence(Number(event.target.value))}
              className="w-full"
            />
            <p className="mt-2 text-sm text-slate-500">Confidence: <span className="font-semibold text-slate-900">{confidence}%</span></p>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-slate-400">Decision note</label>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-200 p-3 text-sm text-slate-700"
              rows={4}
            />
          </div>
        </Card>

        <Card className="space-y-4">
          <header>
            <h2 className="text-lg font-semibold text-slate-900">Audit trail</h2>
            <p className="text-sm text-slate-500">Phase 1 transparency for regulators and execs.</p>
          </header>
          <ul className="space-y-3 text-sm">
            {auditTrail.map((event) => (
              <li key={event.timestamp} className="flex gap-3">
                <div className="text-xs font-semibold text-slate-400">{event.timestamp}</div>
                <div>
                  <p className="font-medium text-slate-900">{event.actor}</p>
                  <p className="text-slate-500">{event.action}</p>
                </div>
              </li>
            ))}
          </ul>
          <Button variant="secondary">Export audit PDF</Button>
        </Card>
      </section>
    </div>
  );
}

export default DecisionWizard;
