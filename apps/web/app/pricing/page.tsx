"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Brain, Check, Sparkles, X } from "lucide-react";

import { ROICalculator } from "./components/ROICalculator";

type Plan = {
  id: "starter" | "professional" | "enterprise";
  name: string;
  description: string;
  priceMonthly: number | null;
  priceYearly: number | null;
  setupFee: number;
  freeTrialDays: number;
  popular?: boolean;
  features: Record<string, string | number | boolean>;
  limitations: string[];
};

type PricingCardProps = {
  plan: Plan;
  billingPeriod: BillingPeriod;
  seatCount: number;
  selected: boolean;
  onSelect: () => void;
};

type FeatureComparisonProps = {
  plans: Plan[];
};

type BillingPeriod = "monthly" | "yearly";

const plans: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    description: "Perfect for small teams getting started",
    priceMonthly: 35,
    priceYearly: 29,
    setupFee: 0,
    freeTrialDays: 30,
    features: {
      seats: "Up to 25 users",
      modules: "Inventory, Basic Production, Quality",
      aiModels: 3,
      storage: "100 GB",
      support: "Email support",
      training: "Self-service resources",
      api: "Basic API access",
      customization: "Limited",
      dataExport: "Included",
      mobileApp: "Included",
      integrations: "5 integrations",
    },
    limitations: ["Single location only", "Basic reporting", "Standard AI models"],
  },
  {
    id: "professional",
    name: "Professional",
    description: "For growing businesses with complex needs",
    priceMonthly: 35,
    priceYearly: 29,
    setupFee: 0,
    freeTrialDays: 30,
    popular: true,
    features: {
      seats: "Up to 100 users",
      modules: "All Core Modules, Advanced Analytics, WMS",
      aiModels: 8,
      storage: "1 TB",
      support: "24/7 Priority support",
      training: "Onboarding + 10 hrs/year",
      api: "Full API access",
      customization: "Moderate",
      dataExport: "Included",
      mobileApp: "Included",
      integrations: "Unlimited",
    },
    limitations: ["Up to 5 locations", "Standard compliance"],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Complete solution for large organizations",
    priceMonthly: null,
    priceYearly: null,
    setupFee: 0,
    freeTrialDays: 30,
    features: {
      seats: "Unlimited users",
      modules: "All modules + custom",
      aiModels: "Unlimited + custom training",
      storage: "Unlimited",
      support: "Dedicated success manager",
      training: "Unlimited training",
      api: "Premium API + webhooks",
      customization: "Full customization",
      dataExport: "Included",
      mobileApp: "Included",
      integrations: "Custom integrations",
      sla: "99.9% uptime SLA",
      compliance: "FDA, GDPR, SOC2, custom",
    },
    limitations: [],
  },
];

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");
  const [selectedPlan, setSelectedPlan] = useState<Plan["id"]>("professional");
  const [seatCount, setSeatCount] = useState(10);

  const savings = useMemo(() => {
    const sapInitial = 500_000;
    const sapMonthly = 100_000;
    const sapYearly = sapInitial + sapMonthly * 12;
    const oruYearly = 35 * seatCount * 12;
    const amount = sapYearly - oruYearly;
    const percent = ((amount / sapYearly) * 100).toFixed(0);
    return { amount, percent };
  }, [seatCount]);

  const handleSeatInput = (value: string) => {
    const numeric = Math.max(1, Math.min(500, Number(value) || 1));
    setSeatCount(numeric);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <Header />
      <Hero seatCount={seatCount} savingsPercent={savings.percent} />

      <main className="mx-auto max-w-7xl px-6">
        <BillingToggle billingPeriod={billingPeriod} setBillingPeriod={setBillingPeriod} />
        <SeatCalculator seatCount={seatCount} onChange={handleSeatInput} />
        <section className="mb-16 grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              billingPeriod={billingPeriod}
              seatCount={seatCount}
              selected={selectedPlan === plan.id}
              onSelect={() => setSelectedPlan(plan.id)}
            />
          ))}
        </section>

        <FeatureComparison plans={plans} />
        <ROICalculator seatCount={seatCount} />
        <FAQ />
        <CTA />
      </main>
    </div>
  );
}

function Header() {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <Brain className="h-8 w-8 text-purple-600" />
          <span className="text-xl font-bold">Oru Platform</span>
        </div>
        <nav className="flex items-center gap-4 text-sm font-semibold text-gray-600">
          <a href="/demo" className="hover:text-gray-900">
            Request Demo
          </a>
          <a href="/contact" className="hover:text-gray-900">
            Contact Sales
          </a>
          <button className="rounded-lg bg-purple-600 px-4 py-2 text-white transition hover:bg-purple-700">
            Start Free Trial
          </button>
        </nav>
      </div>
    </header>
  );
}

function Hero({ seatCount, savingsPercent }: { seatCount: number; savingsPercent: string }) {
  return (
    <section className="py-16 text-center">
      <h1 className="mb-4 text-5xl font-bold text-gray-900">Simple, Transparent Pricing</h1>
      <p className="mb-2 text-xl text-gray-600">No $500k installation fee. No $100k monthly charges.</p>
      <p className="text-lg font-semibold text-purple-600">Just $35 per user per month. Start with a 30-day free trial.</p>

      <div className="mt-8 inline-block rounded-xl border border-green-200 bg-green-50 p-6">
        <div className="flex flex-col items-center gap-6 text-left md:flex-row">
          <div>
            <p className="text-sm text-gray-600">Traditional ERP (SAP)</p>
            <p className="text-2xl font-bold text-red-600 line-through">$1.7M/year</p>
            <p className="text-xs text-gray-500">$500k setup + $100k/month</p>
          </div>
          <ArrowRight className="hidden h-6 w-6 text-gray-400 md:block" />
          <div>
            <p className="text-sm text-gray-600">Oru Platform</p>
            <p className="text-2xl font-bold text-green-600">
              ${Number(35 * seatCount * 12).toLocaleString()}/year
            </p>
            <p className="text-xs text-gray-500">For {seatCount} users</p>
          </div>
          <div className="rounded-lg bg-green-100 px-4 py-2 text-center">
            <p className="text-sm font-semibold text-green-800">You Save</p>
            <p className="text-xl font-bold text-green-700">{savingsPercent}%</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function BillingToggle({ billingPeriod, setBillingPeriod }: { billingPeriod: BillingPeriod; setBillingPeriod: (value: BillingPeriod) => void }) {
  return (
    <div className="mb-8 flex justify-center">
      <div className="flex rounded-lg bg-white p-1 shadow-sm">
        {["monthly", "yearly"].map((period) => (
          <button
            key={period}
            onClick={() => setBillingPeriod(period as BillingPeriod)}
            className={`rounded-md px-6 py-2 text-sm font-semibold transition ${
              billingPeriod === period ? "bg-purple-600 text-white" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {period === "monthly" ? "Monthly" : "Yearly"}
            {period === "yearly" && <span className="ml-2 text-xs">Save 17%</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

function SeatCalculator({ seatCount, onChange }: { seatCount: number; onChange: (value: string) => void }) {
  return (
    <div className="mb-12 text-center">
      <label className="text-sm text-gray-600">Number of users:</label>
      <input
        type="range"
        min={1}
        max={500}
        value={seatCount}
        onChange={(event) => onChange(event.target.value)}
        className="mx-4 align-middle"
      />
      <input
        type="number"
        value={seatCount}
        onChange={(event) => onChange(event.target.value)}
        className="w-20 rounded border px-2 py-1 text-center"
      />
      <span className="ml-2 text-sm text-gray-600">users</span>
    </div>
  );
}

function PricingCard({ plan, billingPeriod, seatCount, selected, onSelect }: PricingCardProps) {
  const perSeat = billingPeriod === "monthly" ? plan.priceMonthly : plan.priceYearly;
  const total = typeof perSeat === "number" ? perSeat * seatCount * (billingPeriod === "yearly" ? 12 * 0.83 : 1) : null;

  return (
    <article
      className={`relative cursor-pointer rounded-xl bg-white p-6 shadow-lg transition-transform ${
        plan.popular ? "ring-2 ring-purple-600" : ""
      } ${selected ? "scale-105" : ""}`}
      onClick={onSelect}
    >
      {plan.popular && (
        <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-purple-600 px-4 py-1 text-sm font-semibold text-white">
          Most Popular
        </span>
      )}

      <div className="mb-6 text-center">
        <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
        <p className="mt-2 text-gray-600">{plan.description}</p>
      </div>

      <div className="mb-6 text-center">
        {total !== null ? (
          <div>
            <p className="text-4xl font-bold text-gray-900">${Math.round(total).toLocaleString()}</p>
            <p className="text-gray-600">/ {billingPeriod === "monthly" ? "month" : "year"}</p>
            <p className="mt-2 text-sm text-gray-500">${perSeat} per user</p>
          </div>
        ) : (
          <div>
            <p className="text-3xl font-bold text-gray-900">Contact Sales</p>
            <p className="mt-2 text-sm text-gray-600">For custom pricing</p>
          </div>
        )}
      </div>

      <div className="mb-6 space-y-3">
        <FeatureItem text={String(plan.features.seats)} included />
        <FeatureItem text={`${plan.features.aiModels} AI Models`} included />
        <FeatureItem text={String(plan.features.storage)} included />
        <FeatureItem text={String(plan.features.support)} included />
        <FeatureItem text={String(plan.features.training)} included />
      </div>

      <button className="w-full rounded-lg bg-purple-600 py-3 font-semibold text-white transition hover:bg-purple-700">
        {plan.id === "enterprise" ? "Contact Sales" : "Start Free Trial"}
      </button>
      <p className="mt-3 text-center text-xs text-gray-500">30-day free trial • No credit card required</p>
    </article>
  );
}

function FeatureItem({ text, included }: { text: string; included: boolean }) {
  const Icon = included ? Check : X;
  return (
    <div className="flex items-center gap-2 text-sm text-gray-700">
      <Icon className={`h-5 w-5 flex-shrink-0 ${included ? "text-green-500" : "text-gray-300"}`} />
      <span>{text}</span>
    </div>
  );
}

function FeatureComparison({ plans }: FeatureComparisonProps) {
  const features = [
    { label: "Users", key: "seats" },
    { label: "Modules", key: "modules" },
    { label: "AI Models", key: "aiModels" },
    { label: "Storage", key: "storage" },
    { label: "Support", key: "support" },
    { label: "Training", key: "training" },
    { label: "API", key: "api" },
    { label: "Customizations", key: "customization" },
    { label: "Integrations", key: "integrations" },
  ];

  return (
    <section className="mb-16 rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Feature Comparison</h2>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Sparkles className="h-4 w-4" /> AI-ready out of the box
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase tracking-wide text-gray-500">
              <th className="py-3">Feature</th>
              {plans.map((plan) => (
                <th key={plan.id} className="py-3 text-center">
                  {plan.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {features.map((feature) => (
              <tr key={feature.key} className="border-b">
                <td className="py-3 font-medium text-gray-700">{feature.label}</td>
                {plans.map((plan) => (
                  <td key={`${plan.id}-${feature.key}`} className="py-3 text-center text-gray-900">
                    {String(plan.features[feature.key] ?? "Included")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function FAQ() {
  const faqs = [
    {
      question: "Is there really no setup fee?",
      answer: "Correct. Oru deploys in days without consultants or hidden implementation fees.",
    },
    {
      question: "Can I cancel anytime?",
      answer: "Yes. You can cancel monthly plans or downgrade tiers from the admin console.",
    },
    {
      question: "Do you integrate with SAP or Oracle?",
      answer: "We provide API and flat-file integrations plus prebuilt SAP connectors for hybrid deployments.",
    },
    {
      question: "Is support included?",
      answer: "Email support is included for Starter, while Professional and Enterprise get 24/7 priority access.",
    },
  ];

  return (
    <section className="mb-16 grid gap-6 rounded-2xl bg-white p-6 shadow-sm md:grid-cols-2">
      {faqs.map((faq) => (
        <div key={faq.question} className="rounded-xl border border-gray-100 p-4">
          <p className="text-lg font-semibold text-gray-900">{faq.question}</p>
          <p className="mt-2 text-sm text-gray-600">{faq.answer}</p>
        </div>
      ))}
    </section>
  );
}

function CTA() {
  return (
    <section className="py-16 text-center">
      <h2 className="mb-4 text-3xl font-bold text-gray-900">Ready to transform your business?</h2>
      <p className="mb-8 text-lg text-gray-600">Join hundreds of companies already using Oru&apos;s AI-native platform</p>
      <div className="flex flex-col items-center gap-4 md:flex-row md:justify-center">
        <button className="rounded-lg bg-purple-600 px-8 py-3 text-lg font-semibold text-white transition hover:bg-purple-700">
          Start 30-Day Free Trial
        </button>
        <button className="rounded-lg border-2 border-purple-600 px-8 py-3 text-lg font-semibold text-purple-600 transition hover:bg-purple-50">
          Schedule Demo
        </button>
      </div>
      <p className="mt-4 text-sm text-gray-500">No credit card required • Setup in minutes • Cancel anytime</p>
    </section>
  );
}
