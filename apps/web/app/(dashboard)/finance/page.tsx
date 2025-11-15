"use client";

import { useState, type ComponentType } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Wallet,
  PieChart,
  AlertTriangle,
  CheckCircle,
  Brain,
  Download
} from 'lucide-react';
import {
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

type MetricKey = 'revenue' | 'expenses' | 'profit' | 'cashFlow';

type FinancialMetric = {
  current: number;
  previous: number;
  change: number;
  forecast: number;
};

type FinancialMetrics = Record<MetricKey, FinancialMetric> & {
  budget: {
    allocated: number;
    consumed: number;
    variance: number;
    burnRate: number;
  };
};

type CashFlowDatum = {
  month: string;
  inflow: number;
  outflow: number;
  net: number;
};

type BudgetAllocation = {
  category: string;
  allocated: number;
  spent: number;
  variance: number;
};

type Insight = {
  type: 'warning' | 'opportunity' | 'success';
  title: string;
  description: string;
  confidence: number;
  suggestedAction: string;
};

export default function FinanceDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('current-month');

  const financialMetrics: FinancialMetrics = {
    revenue: {
      current: 2847500,
      previous: 2654300,
      change: 7.3,
      forecast: 3100000
    },
    expenses: {
      current: 1923400,
      previous: 1876200,
      change: 2.5,
      forecast: 1950000
    },
    profit: {
      current: 924100,
      previous: 778100,
      change: 18.8,
      forecast: 1150000
    },
    cashFlow: {
      current: 567800,
      previous: 489200,
      change: 16.1,
      forecast: 620000
    },
    budget: {
      allocated: 2000000,
      consumed: 1923400,
      variance: -3.8,
      burnRate: 96.2
    }
  };

  const cashFlowData: CashFlowDatum[] = [
    { month: 'Jul', inflow: 2100000, outflow: 1800000, net: 300000 },
    { month: 'Aug', inflow: 2250000, outflow: 1900000, net: 350000 },
    { month: 'Sep', inflow: 2400000, outflow: 1950000, net: 450000 },
    { month: 'Oct', inflow: 2654300, outflow: 1876200, net: 778100 },
    { month: 'Nov', inflow: 2847500, outflow: 1923400, net: 924100 },
    { month: 'Dec (F)', inflow: 3100000, outflow: 1950000, net: 1150000 }
  ];

  const budgetAllocation: BudgetAllocation[] = [
    { category: 'Operations', allocated: 800000, spent: 765000, variance: -4.4 },
    { category: 'Procurement', allocated: 500000, spent: 523000, variance: 4.6 },
    { category: 'Logistics', allocated: 300000, spent: 287000, variance: -4.3 },
    { category: 'Quality', allocated: 150000, spent: 142000, variance: -5.3 },
    { category: 'HR & Admin', allocated: 250000, spent: 206400, variance: -17.4 }
  ];

  const aiInsights: Insight[] = [
    {
      type: 'warning',
      title: 'Cash Flow Risk Detected',
      description: 'Projected shortfall in Q1 2026 based on current burn rate',
      confidence: 87,
      suggestedAction: 'Accelerate receivables collection'
    },
    {
      type: 'opportunity',
      title: 'Cost Optimization Opportunity',
      description: 'Logistics costs 12% above industry benchmark',
      confidence: 92,
      suggestedAction: 'Renegotiate 3PL contracts'
    },
    {
      type: 'success',
      title: 'Revenue Growth Trend',
      description: 'Consistent 7% MoM growth for 3 months',
      confidence: 95,
      suggestedAction: 'Consider capacity expansion'
    }
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finance Dashboard</h1>
          <p className="text-gray-500 mt-1">Real-time financial intelligence and forecasting</p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg"
          >
            <option value="current-month">Current Month</option>
            <option value="current-quarter">Current Quarter</option>
            <option value="current-year">Current Year</option>
          </select>
          <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <FinanceMetricCard
          icon={DollarSign}
          label="Revenue"
          value={financialMetrics.revenue.current}
          change={financialMetrics.revenue.change}
          forecast={financialMetrics.revenue.forecast}
          positive
        />
        <FinanceMetricCard
          icon={CreditCard}
          label="Expenses"
          value={financialMetrics.expenses.current}
          change={financialMetrics.expenses.change}
          forecast={financialMetrics.expenses.forecast}
        />
        <FinanceMetricCard
          icon={TrendingUp}
          label="Net Profit"
          value={financialMetrics.profit.current}
          change={financialMetrics.profit.change}
          forecast={financialMetrics.profit.forecast}
          positive
        />
        <FinanceMetricCard
          icon={Wallet}
          label="Cash Flow"
          value={financialMetrics.cashFlow.current}
          change={financialMetrics.cashFlow.change}
          forecast={financialMetrics.cashFlow.forecast}
          positive
        />
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <PieChart className="w-4 h-4 text-gray-500" />
            <span className={`text-xs ${
              financialMetrics.budget.variance < 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {financialMetrics.budget.variance}%
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {financialMetrics.budget.burnRate}%
          </div>
          <div className="text-xs text-gray-500">Budget Utilization</div>
          <div className="text-xs text-gray-400 mt-1">
            ${(financialMetrics.budget.consumed / 1000000).toFixed(1)}M / ${(financialMetrics.budget.allocated / 1000000).toFixed(1)}M
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Cash Flow Chart */}
        <div className="col-span-2 bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Cash Flow Analysis</h2>
            <div className="flex items-center space-x-4 text-xs">
              <Legend color="bg-green-500" label="Inflow" />
              <Legend color="bg-red-500" label="Outflow" />
              <Legend color="bg-blue-500" label="Net" />
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={cashFlowData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
              <Tooltip formatter={(value: number) => `$${(value / 1000).toFixed(0)}K`} />
              <Area type="monotone" dataKey="inflow" stackId="1" stroke="#10B981" fill="#10B98133" />
              <Area type="monotone" dataKey="outflow" stackId="2" stroke="#EF4444" fill="#EF444433" />
              <Line type="monotone" dataKey="net" stroke="#3B82F6" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* AI Insights */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">AI Financial Insights</h2>
            <Brain className="w-5 h-5 text-blue-500" />
          </div>

          <div className="space-y-3">
            {aiInsights.map((insight, index) => (
              <motion.div
                key={insight.title}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-3 rounded-lg border ${
                  insight.type === 'warning'
                    ? 'border-orange-200 bg-orange-50'
                    : insight.type === 'opportunity'
                      ? 'border-blue-200 bg-blue-50'
                      : 'border-green-200 bg-green-50'
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <h4
                    className={`font-medium text-sm ${
                      insight.type === 'warning'
                        ? 'text-orange-900'
                        : insight.type === 'opportunity'
                          ? 'text-blue-900'
                          : 'text-green-900'
                    }`}
                  >
                    {insight.title}
                  </h4>
                  <span className="text-xs text-gray-500">{insight.confidence}%</span>
                </div>
                <p className="text-xs text-gray-600 mb-2">{insight.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-700">
                    Action: {insight.suggestedAction}
                  </span>
                  <button className="text-xs text-blue-600 hover:text-blue-700">Review →</button>
                </div>
              </motion.div>
            ))}
          </div>

          <button className="w-full mt-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm font-medium">
            View All Insights
          </button>
        </div>
      </div>

      {/* Budget Allocation Table */}
      <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Budget Allocation by Department</h2>
          <button className="text-sm text-blue-600 hover:text-blue-700">View Details →</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="text-xs text-gray-500 border-b">
              <tr>
                <th className="text-left py-3">Department</th>
                <th className="text-right py-3">Allocated</th>
                <th className="text-right py-3">Spent</th>
                <th className="text-right py-3">Remaining</th>
                <th className="text-right py-3">Variance</th>
                <th className="text-center py-3">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {budgetAllocation.map((dept) => (
                <tr key={dept.category} className="border-b">
                  <td className="py-3 font-medium">{dept.category}</td>
                  <td className="text-right">${(dept.allocated / 1000).toFixed(0)}K</td>
                  <td className="text-right">${(dept.spent / 1000).toFixed(0)}K</td>
                  <td className="text-right">${((dept.allocated - dept.spent) / 1000).toFixed(0)}K</td>
                  <td
                    className={`text-right font-medium ${
                      dept.variance < 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {dept.variance > 0 ? '+' : ''}
                    {dept.variance}%
                  </td>
                  <td className="text-center">
                    {Math.abs(dept.variance) < 5 ? (
                      <StatusPill variant="success" label="On Track" Icon={CheckCircle} />
                    ) : dept.variance > 0 ? (
                      <StatusPill variant="alert" label="Over Budget" Icon={AlertTriangle} />
                    ) : (
                      <StatusPill variant="info" label="Under Budget" Icon={TrendingDown} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

type FinanceMetricCardProps = {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: number;
  change: number;
  forecast: number;
  positive?: boolean;
};

function FinanceMetricCard({ icon: Icon, label, value, change, forecast, positive }: FinanceMetricCardProps) {
  const isPositive = positive ?? change >= 0;

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-4 h-4 text-gray-500" />
        <span className={`text-xs flex items-center ${
          isPositive ? 'text-green-600' : 'text-red-600'
        }`}>
          {change > 0 ? (
            <TrendingUp className="w-3 h-3 mr-1" />
          ) : (
            <TrendingDown className="w-3 h-3 mr-1" />
          )}
          {Math.abs(change)}%
        </span>
      </div>
      <div className="text-2xl font-bold text-gray-900">${(value / 1000000).toFixed(2)}M</div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-xs text-gray-400 mt-1">Forecast: ${(forecast / 1000000).toFixed(1)}M</div>
    </div>
  );
}

type LegendProps = {
  color: string;
  label: string;
};

function Legend({ color, label }: LegendProps) {
  return (
    <div className="flex items-center space-x-1">
      <div className={`w-3 h-3 rounded ${color}`} />
      <span>{label}</span>
    </div>
  );
}

type StatusVariant = 'success' | 'alert' | 'info';

type StatusPillProps = {
  variant: StatusVariant;
  label: string;
  Icon: ComponentType<{ className?: string }>;
};

function StatusPill({ variant, label, Icon }: StatusPillProps) {
  const variants: Record<StatusVariant, { bg: string; text: string }> = {
    success: { bg: 'bg-green-100', text: 'text-green-700' },
    alert: { bg: 'bg-red-100', text: 'text-red-700' },
    info: { bg: 'bg-blue-100', text: 'text-blue-700' }
  };

  return (
    <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${variants[variant].bg} ${variants[variant].text}`}>
      <Icon className="w-3 h-3 mr-1" />
      {label}
    </span>
  );
}
