"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Brain,
  Upload,
  Filter,
  Download,
} from "lucide-react";

const tabs = [
  "QA Holds",
  "All Inventory",
  "Expiring Items",
  "Temperature Monitoring",
  "Movements",
];

type TestStatus = "passed" | "failed" | "pending" | "na";

type QAResult = {
  status: TestStatus;
  value: string;
};

type QAHold = {
  id: string;
  product: string;
  sku: string;
  batch: string;
  quantity: string;
  supplier: string;
  receivedDate: string;
  holdDuration: string;
  tests: Record<string, QAResult>;
  aiRecommendation: string;
  confidence: number;
};

export default function InventoryManagement() {
  const [activeView, setActiveView] = useState("qa-holds");

  const qaHolds: QAHold[] = [
    {
      id: "QA-2024-1125-001",
      product: "Organic Whole Milk",
      sku: "MLK-ORG-001",
      batch: "B2024-1125-A",
      quantity: "500 gallons",
      supplier: "Green Valley Farms",
      receivedDate: "2024-11-25 08:30",
      holdDuration: "4.5 hours",
      tests: {
        microbiological: { status: "passed", value: "CFU < 10" },
        chemical: { status: "passed", value: "pH 6.7" },
        physical: { status: "pending", value: "In progress" },
        temperature: { status: "passed", value: "2.8°C" },
      },
      aiRecommendation:
        "Approve - All critical tests passed. Historical pass rate: 98%",
      confidence: 94,
    },
    {
      id: "QA-2024-1125-002",
      product: "Premium Wheat Flour",
      sku: "FLR-WHT-PR1",
      batch: "B2024-1125-B",
      quantity: "2000 kg",
      supplier: "Miller's Best",
      receivedDate: "2024-11-25 09:15",
      holdDuration: "3.8 hours",
      tests: {
        microbiological: { status: "passed", value: "Within limits" },
        chemical: { status: "failed", value: "Gluten 9.8%" },
        physical: { status: "passed", value: "No contamination" },
        temperature: { status: "na", value: "N/A" },
      },
      aiRecommendation:
        "Reject - Gluten content below specification (min 11%)",
      confidence: 98,
    },
  ];

  const expiringInventory = [
    { product: "Fresh Strawberries", daysLeft: 2, quantity: "50 kg", value: "$450", action: "Flash sale" },
    { product: "Yogurt - Plain", daysLeft: 3, quantity: "200 units", value: "$800", action: "Donate" },
    { product: "Salad Mix", daysLeft: 1, quantity: "30 kg", value: "$180", action: "Urgent sale" },
    { product: "Fresh Bread", daysLeft: 1, quantity: "100 loaves", value: "$300", action: "Markdown 50%" },
  ];

  const handleQaAction = (action: string, id: string) => {
    console.info(`${action} triggered for ${id}`);
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="mt-1 text-gray-500">
            Real-time inventory control with QA enforcement
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <ActionButton icon={Upload} label="Receive Inventory" />
          <ActionButton icon={Filter} label="Filters" />
          <ActionButton
            icon={Download}
            label="Export Report"
            variant="primary"
          />
        </div>
      </div>

      <div className="mb-6 rounded-xl bg-white shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const key = tab.toLowerCase().replace(/\s+/g, "-");
              return (
                <button
                  key={tab}
                  onClick={() => setActiveView(key)}
                  className={`py-4 text-sm font-medium transition-colors ${
                    activeView === key
                      ? "border-b-2 border-blue-600 text-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab}
                  {tab === "QA Holds" && qaHolds.length > 0 && (
                    <span className="ml-2 rounded-full bg-orange-100 px-2 py-1 text-xs text-orange-600">
                      {qaHolds.length}
                    </span>
                  )}
                  {tab === "Expiring Items" && expiringInventory.length > 0 && (
                    <span className="ml-2 rounded-full bg-red-100 px-2 py-1 text-xs text-red-600">
                      {expiringInventory.length}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {activeView === "qa-holds" && (
          <div className="space-y-4 p-6">
            {qaHolds.map((hold) => (
              <motion.div
                key={hold.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-gray-200 p-6 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-3 flex items-center space-x-4">
                      <h3 className="text-lg font-semibold text-gray-900">{hold.product}</h3>
                      <span className="rounded bg-orange-100 px-2 py-1 text-xs text-orange-600">
                        QA Hold - {hold.holdDuration}
                      </span>
                    </div>

                    <div className="mb-4 grid grid-cols-1 gap-4 text-sm text-gray-600 md:grid-cols-2 lg:grid-cols-4">
                      <InfoItem label="SKU" value={hold.sku} />
                      <InfoItem label="Batch" value={hold.batch} />
                      <InfoItem label="Quantity" value={hold.quantity} />
                      <InfoItem label="Supplier" value={hold.supplier} />
                    </div>

                    <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                      {Object.entries(hold.tests).map(([test, result]) => (
                        <TestBadge key={test} name={test} result={result} />
                      ))}
                    </div>

                    <div className="rounded-lg bg-blue-50 p-3">
                      <div className="flex items-center space-x-2">
                        <Brain className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">
                          AI Recommendation
                        </span>
                        <span className="text-xs text-blue-600">
                          Confidence: {hold.confidence}%
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-blue-700">
                        {hold.aiRecommendation}
                      </p>
                    </div>
                  </div>

                  <div className="ml-6 space-y-2">
                    <ActionCTA
                      label="Approve QA"
                      variant="approve"
                      onClick={() => handleQaAction("approve", hold.id)}
                    />
                    <ActionCTA
                      label="Reject"
                      variant="reject"
                      onClick={() => handleQaAction("reject", hold.id)}
                    />
                    <ActionCTA
                      label="Request Retest"
                      variant="ghost"
                      onClick={() => handleQaAction("retest", hold.id)}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {activeView === "expiring-items" && (
          <div className="p-6">
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span className="font-medium text-red-900">
                  Urgent Action Required
                </span>
                <span className="text-red-700">
                  - {expiringInventory.length} items expiring within 3 days
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {expiringInventory.map((item, index) => (
                <motion.div
                  key={`${item.product}-${index}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4"
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                        item.daysLeft === 1 ? "bg-red-100" : "bg-orange-100"
                      }`}
                    >
                      <span
                        className={`text-lg font-bold ${
                          item.daysLeft === 1 ? "text-red-600" : "text-orange-600"
                        }`}
                      >
                        {item.daysLeft}d
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{item.product}</p>
                      <p className="text-sm text-gray-500">
                        Quantity: {item.quantity} • Value: {item.value}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="rounded-lg bg-blue-100 px-3 py-1 text-sm text-blue-700">
                      {item.action}
                    </span>
                    <button className="rounded-lg bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600">
                      Execute Action
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface ActionCTAProps {
  label: string;
  variant: "approve" | "reject" | "ghost";
  onClick: () => void;
}

function ActionCTA({ label, variant, onClick }: ActionCTAProps) {
  const styles = {
    approve: "bg-green-500 text-white hover:bg-green-600",
    reject: "bg-red-500 text-white hover:bg-red-600",
    ghost: "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50",
  } as const;

  return (
    <button
      onClick={onClick}
      className={`w-full rounded-lg px-4 py-2 text-sm font-medium ${styles[variant]}`}
    >
      {label}
    </button>
  );
}

interface InfoItemProps {
  label: string;
  value: string;
}

function InfoItem({ label, value }: InfoItemProps) {
  return (
    <div>
      <span className="text-xs uppercase tracking-wide text-gray-400">
        {label}
      </span>
      <p className="text-sm text-gray-900">{value}</p>
    </div>
  );
}

interface TestBadgeProps {
  name: string;
  result: QAResult;
}

function TestBadge({ name, result }: TestBadgeProps) {
  const IconComponent =
    result.status === "passed"
      ? CheckCircle
      : result.status === "failed"
        ? AlertCircle
        : result.status === "pending"
          ? Clock
          : null;

  const colorClass =
    result.status === "passed"
      ? "text-green-500"
      : result.status === "failed"
        ? "text-red-500"
        : result.status === "pending"
          ? "text-yellow-500"
          : "text-gray-400";

  return (
    <div className="flex items-center space-x-2 rounded-lg border border-gray-100 p-3">
      {IconComponent ? (
        <IconComponent className={`h-4 w-4 ${colorClass}`} />
      ) : (
        <div className="h-4 w-4" />
      )}
      <div>
        <p className="text-xs font-medium capitalize text-gray-900">
          {name.replace("_", " ")}
        </p>
        <p className="text-xs text-gray-500">{result.value}</p>
      </div>
    </div>
  );
}

interface ActionButtonProps {
  icon: LucideIcon;
  label: string;
  variant?: "primary" | "default";
}

function ActionButton({ icon: Icon, label, variant = "default" }: ActionButtonProps) {
  const shared = "flex items-center space-x-2 rounded-lg px-4 py-2 text-sm";
  const styles =
    variant === "primary"
      ? "bg-blue-500 text-white hover:bg-blue-600"
      : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50";

  return (
    <button className={`${shared} ${styles}`}>
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );
}
