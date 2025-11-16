'use client';

import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Calendar,
  DollarSign,
  FileText,
  Clock,
  Heart,
  Bell,
  Settings,
  TrendingUp,
  CreditCard,
  Home,
  Shield,
  Smile,
  Eye,
} from 'lucide-react';

type SectionId = 'overview' | 'payroll' | 'timeoff' | 'timesheet' | 'benefits' | 'documents' | 'development';

type QuickStatProps = {
  label: string;
  value: string;
  subvalue?: string;
  icon: LucideIcon;
};

type ActivityItemProps = {
  date: string;
  action: string;
  detail: string;
  status: 'pending' | 'approved' | 'completed';
};

type ActionCardProps = {
  title: string;
  description: string;
  urgency: 'low' | 'medium' | 'high';
  action: string;
};

type DeductionRecord = Record<string, number>;

type PaycheckSummary = {
  gross: number;
  net: number;
  deductions: DeductionRecord;
};

type PayrollInfo = {
  nextPayDate: string;
  lastPayDate: string;
  currentPeriod: string;
  ytdEarnings: number;
  lastPaycheck: PaycheckSummary;
};

type DepositAccountProps = {
  type: string;
  bank: string;
  last4: string;
  percentage: number;
  primary?: boolean;
};

type TimeOffBalanceEntry = {
  available: number;
  used: number;
  pending: number;
  accrualRate: string;
};

type TimeOffSnapshot = Record<string, TimeOffBalanceEntry>;

type TimesheetDay = {
  date: string;
  day: string;
  regular: number;
  overtime: number;
  total: number;
  status: 'approved' | 'submitted' | 'draft';
};

type TimesheetData = {
  currentWeek: TimesheetDay[];
  weekTotal: { regular: number; overtime: number; total: number };
};

type TimeOffEntryProps = {
  dates: string;
  type: string;
  hours: number;
  status: 'approved' | 'pending';
  approver: string;
};

type BenefitCardProps = {
  title: string;
  icon: LucideIcon;
  value: string;
  descriptor?: string;
};

export default function EmployeeSelfService() {
  const [activeSection, setActiveSection] = useState<SectionId>('overview');

  const employee = {
    name: 'John Martinez',
    id: 'EMP-2019-0847',
    title: 'Senior Warehouse Manager',
    department: 'Operations',
    manager: 'Sarah Chen',
    startDate: '2019-03-15',
    location: 'Chicago, IL',
  } as const;

  const payrollInfo: PayrollInfo = {
    nextPayDate: '2025-11-22',
    lastPayDate: '2025-11-08',
    currentPeriod: '11/09 - 11/22',
    ytdEarnings: 67500,
    lastPaycheck: {
      gross: 2884.62,
      net: 2087.43,
      deductions: {
        federal: 346.15,
        state: 144.23,
        social: 178.84,
        medicare: 41.83,
        '401k': 86.54,
      },
    },
  };

  const timeOffBalance: TimeOffSnapshot = {
    pto: { available: 120, used: 40, pending: 8, accrualRate: '10 hrs/month' },
    sick: { available: 40, used: 8, pending: 0, accrualRate: '3.33 hrs/month' },
    personal: { available: 16, used: 8, pending: 0, accrualRate: 'Annual grant' },
  };

  const benefits = {
    medical: {
      plan: 'PPO Plus Family',
      premium: 234.5,
      deductible: { used: 1200, max: 3000 },
      outOfPocket: { used: 1800, max: 6000 },
    },
    dental: {
      plan: 'Enhanced Dental',
      premium: 45.0,
      used: 450,
      max: 2000,
    },
    vision: {
      plan: 'Vision Care',
      premium: 12.5,
    },
    retirement: {
      contribution: 3,
      match: 3,
      vested: 100,
      balance: 45670,
    },
    life: {
      coverage: 150000,
      premium: 18.75,
    },
  } as const;

  const timesheet: TimesheetData = {
    currentWeek: [
      { date: '2025-11-11', day: 'Mon', regular: 8, overtime: 1, total: 9, status: 'approved' },
      { date: '2025-11-12', day: 'Tue', regular: 8, overtime: 0, total: 8, status: 'approved' },
      { date: '2025-11-13', day: 'Wed', regular: 8, overtime: 2, total: 10, status: 'approved' },
      { date: '2025-11-14', day: 'Thu', regular: 8, overtime: 0, total: 8, status: 'submitted' },
      { date: '2025-11-15', day: 'Fri', regular: 8, overtime: 0, total: 8, status: 'draft' },
    ],
    weekTotal: { regular: 40, overtime: 3, total: 43 },
  };

  const recentTransactions = [
    { date: '2025-11-08', type: 'Direct Deposit', amount: 2087.43, status: 'completed' },
    { date: '2025-11-01', type: 'FSA Reimbursement', amount: 147.5, status: 'completed' },
    { date: '2025-10-25', type: 'Direct Deposit', amount: 2087.43, status: 'completed' },
  ];

  return (
    <div className='p-6 bg-gray-50 min-h-screen space-y-6'>
      <header className='bg-white rounded-xl shadow-sm p-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
        <div className='flex items-center space-x-4'>
          <div className='w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center'>
            <span className='text-white text-xl font-bold'>JM</span>
          </div>
          <div>
            <h1 className='text-2xl font-bold text-gray-900'>{employee.name}</h1>
            <p className='text-gray-600'>
              {employee.title} • {employee.department}
            </p>
            <p className='text-sm text-gray-500'>Employee ID: {employee.id} • Reports to: {employee.manager}</p>
          </div>
        </div>
        <div className='flex items-center gap-3'>
          <button className='p-2 hover:bg-gray-100 rounded-lg'>
            <Bell className='w-5 h-5 text-gray-500' />
          </button>
          <button className='p-2 hover:bg-gray-100 rounded-lg'>
            <Settings className='w-5 h-5 text-gray-500' />
          </button>
          <button className='px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600'>Quick Actions</button>
        </div>
      </header>

      <nav className='bg-white rounded-xl shadow-sm overflow-x-auto'>
        <div className='flex space-x-8 px-6 min-w-max'>
          {[
            { id: 'overview', name: 'Overview', icon: Home },
            { id: 'payroll', name: 'Payroll', icon: DollarSign },
            { id: 'timeoff', name: 'Time Off', icon: Calendar },
            { id: 'timesheet', name: 'Timesheet', icon: Clock },
            { id: 'benefits', name: 'Benefits', icon: Heart },
            { id: 'documents', name: 'Documents', icon: FileText },
            { id: 'development', name: 'Development', icon: TrendingUp },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as SectionId)}
                className={`flex items-center space-x-2 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeSection === tab.id ? 'text-blue-600 border-blue-600' : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                <Icon className='w-4 h-4' />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {activeSection === 'overview' && (
        <div className='grid grid-cols-1 xl:grid-cols-3 gap-6'>
          <section className='bg-white rounded-xl shadow-sm p-6 space-y-4'>
            <h2 className='font-semibold text-gray-900'>Quick Stats</h2>
            <QuickStat label='Next Pay Date' value={payrollInfo.nextPayDate} subvalue={`Net: $${payrollInfo.lastPaycheck.net.toLocaleString()}`} icon={DollarSign} />
            <QuickStat
              label='PTO Balance'
              value={`${timeOffBalance.pto.available} hours`}
              subvalue={`${timeOffBalance.pto.pending} pending`}
              icon={Calendar}
            />
            <QuickStat
              label='This Week'
              value={`${timesheet.weekTotal.total} hours`}
              subvalue={`${timesheet.weekTotal.overtime} OT`}
              icon={Clock}
            />
            <QuickStat label='401(k) Balance' value={`$${benefits.retirement.balance.toLocaleString()}`} subvalue='100% vested' icon={TrendingUp} />
          </section>

          <section className='bg-white rounded-xl shadow-sm p-6'>
            <h2 className='font-semibold text-gray-900 mb-4'>Recent Activity</h2>
            <div className='space-y-3'>
              <ActivityItem date='Today' action='Timesheet submitted' detail='Week ending 11/17' status='pending' />
              <ActivityItem date='Nov 14' action='PTO Request' detail='Nov 28-29 (Thanksgiving)' status='approved' />
              <ActivityItem date='Nov 12' action='Benefits enrollment' detail='2026 selections confirmed' status='completed' />
              <ActivityItem date='Nov 8' action='Paycheck deposited' detail='$2,087.43' status='completed' />
            </div>
          </section>

          <section className='bg-white rounded-xl shadow-sm p-6'>
            <h2 className='font-semibold text-gray-900 mb-4'>Action Required</h2>
            <div className='space-y-3'>
              <ActionCard title='Complete timesheet' description='Friday 11/15 - 8 hours' urgency='high' action='Enter Time' />
              <ActionCard title='Review pay stub' description='11/08 paycheck available' urgency='low' action='View' />
              <ActionCard title='Training due' description='Annual safety certification' urgency='medium' action='Start' />
            </div>
          </section>
        </div>
      )}

      {activeSection === 'payroll' && (
        <div className='space-y-6'>
          <section className='bg-white rounded-xl shadow-sm p-6'>
            <h2 className='font-semibold text-gray-900 mb-4'>Current Pay Period: {payrollInfo.currentPeriod}</h2>
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
              <PayStubSummary paycheck={payrollInfo.lastPaycheck} />
              <DeductionsBreakdown deductions={payrollInfo.lastPaycheck.deductions} />
              <YTDSummary ytd={payrollInfo.ytdEarnings} />
            </div>
          </section>

          <section className='bg-white rounded-xl shadow-sm p-6'>
            <h2 className='font-semibold text-gray-900 mb-4'>Direct Deposit Accounts</h2>
            <div className='space-y-3'>
              <DepositAccount type='Checking' bank='Chase Bank' last4='4782' percentage={80} primary />
              <DepositAccount type='Savings' bank='Wells Fargo' last4='9234' percentage={20} />
            </div>
          </section>

          <section className='bg-white rounded-xl shadow-sm p-6'>
            <h2 className='font-semibold text-gray-900 mb-4'>Recent Transactions</h2>
            <div className='divide-y divide-gray-100'>
              {recentTransactions.map((txn) => (
                <div key={txn.date + txn.type} className='py-3 flex items-center justify-between text-sm'>
                  <div>
                    <p className='font-medium text-gray-900'>{txn.type}</p>
                    <p className='text-gray-500'>{txn.date}</p>
                  </div>
                  <div className='text-right'>
                    <p className='font-semibold text-gray-900'>${txn.amount.toLocaleString()}</p>
                    <p className='text-xs uppercase tracking-wide text-green-600'>{txn.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {activeSection === 'timeoff' && (
        <div className='space-y-6'>
          <section className='bg-white rounded-xl shadow-sm p-6'>
            <h2 className='font-semibold text-gray-900 mb-4'>Time Off Balances</h2>
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
              {Object.entries(timeOffBalance).map(([type, balance]) => (
                <TimeOffBalance key={type} type={type} balance={balance} />
              ))}
            </div>
          </section>

          <section className='bg-white rounded-xl shadow-sm p-6'>
            <h2 className='font-semibold text-gray-900 mb-4'>Request Time Off</h2>
            <TimeOffRequestForm />
          </section>

          <section className='bg-white rounded-xl shadow-sm p-6'>
            <h2 className='font-semibold text-gray-900 mb-4'>Upcoming Time Off</h2>
            <div className='space-y-3'>
              <TimeOffEntry dates='Nov 28-29, 2025' type='PTO' hours={16} status='approved' approver='Sarah Chen' />
              <TimeOffEntry dates='Dec 23-27, 2025' type='PTO' hours={24} status='pending' approver='Awaiting approval' />
            </div>
          </section>
        </div>
      )}

      {activeSection === 'timesheet' && (
        <section className='bg-white rounded-xl shadow-sm p-6'>
          <h2 className='font-semibold text-gray-900 mb-4'>Weekly Timesheet</h2>
          <TimesheetGrid timesheet={timesheet} />
        </section>
      )}

      {activeSection === 'benefits' && (
        <section className='bg-white rounded-xl shadow-sm p-6 space-y-6'>
          <h2 className='font-semibold text-gray-900'>Benefits Snapshot</h2>
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            <BenefitCard title='Medical' icon={Shield} value={benefits.medical.plan} descriptor={`$${benefits.medical.premium.toFixed(2)} per pay`} />
            <BenefitCard title='Dental' icon={Smile} value={benefits.dental.plan} descriptor={`Used $${benefits.dental.used}`} />
            <BenefitCard title='Vision' icon={Eye} value={benefits.vision.plan} descriptor={`$${benefits.vision.premium.toFixed(2)} per pay`} />
            <BenefitCard title='Retirement' icon={TrendingUp} value={`${benefits.retirement.contribution}% contribution`} descriptor={`Balance $${benefits.retirement.balance.toLocaleString()}`} />
            <BenefitCard title='Life Insurance' icon={Heart} value={`$${benefits.life.coverage.toLocaleString()} coverage`} descriptor={`$${benefits.life.premium.toFixed(2)} per pay`} />
          </div>
        </section>
      )}
    </div>
  );
}

function QuickStat({ label, value, subvalue, icon: Icon }: QuickStatProps) {
  return (
    <div className='flex items-center space-x-3'>
      <div className='p-2 bg-blue-100 rounded-lg'>
        <Icon className='w-5 h-5 text-blue-600' />
      </div>
      <div>
        <p className='text-sm text-gray-600'>{label}</p>
        <p className='font-semibold text-gray-900'>{value}</p>
        {subvalue && <p className='text-xs text-gray-500'>{subvalue}</p>}
      </div>
    </div>
  );
}

function ActivityItem({ date, action, detail, status }: ActivityItemProps) {
  const statusStyles: Record<ActivityItemProps['status'], string> = {
    pending: 'text-yellow-600',
    approved: 'text-green-600',
    completed: 'text-gray-500',
  };

  return (
    <div className='flex items-start justify-between border rounded-lg p-3'>
      <div>
        <p className='text-xs uppercase text-gray-500'>{date}</p>
        <p className='font-medium text-gray-900'>{action}</p>
        <p className='text-sm text-gray-600'>{detail}</p>
      </div>
      <span className={`text-xs font-semibold ${statusStyles[status]}`}>{status}</span>
    </div>
  );
}

function ActionCard({ title, description, urgency, action }: ActionCardProps) {
  const urgencyStyles: Record<ActionCardProps['urgency'], string> = {
    high: 'bg-red-50 text-red-700 border-red-100',
    medium: 'bg-yellow-50 text-yellow-700 border-yellow-100',
    low: 'bg-blue-50 text-blue-700 border-blue-100',
  };

  return (
    <div className={`border rounded-lg p-3 ${urgencyStyles[urgency]}`}>
      <p className='font-semibold'>{title}</p>
      <p className='text-sm'>{description}</p>
      <button className='mt-2 text-sm font-semibold underline'>{action}</button>
    </div>
  );
}

function PayStubSummary({ paycheck }: { paycheck: PaycheckSummary }) {
  return (
    <div className='border rounded-xl p-4 space-y-2'>
      <h3 className='font-semibold text-gray-900'>Paycheck Snapshot</h3>
      <div className='grid grid-cols-2 gap-3'>
        <SummaryTile label='Gross Pay' value={`$${paycheck.gross.toFixed(2)}`} icon={DollarSign} />
        <SummaryTile label='Net Pay' value={`$${paycheck.net.toFixed(2)}`} icon={CreditCard} />
      </div>
      <p className='text-sm text-gray-500'>Deposited on {new Date().toLocaleDateString()}</p>
    </div>
  );
}

function DeductionsBreakdown({ deductions }: { deductions: DeductionRecord }) {
  const entries = Object.entries(deductions);
  const total = entries.reduce((sum, [, amount]) => sum + amount, 0);

  return (
    <div className='border rounded-xl p-4'>
      <h3 className='font-semibold text-gray-900 mb-2'>Deductions</h3>
      <div className='space-y-2'>
        {entries.map(([label, amount]) => (
          <div key={label} className='flex justify-between text-sm text-gray-600'>
            <span className='capitalize'>{label}</span>
            <span>${amount.toFixed(2)}</span>
          </div>
        ))}
      </div>
      <div className='flex justify-between text-sm font-semibold text-gray-900 border-t pt-2 mt-2'>
        <span>Total</span>
        <span>${total.toFixed(2)}</span>
      </div>
    </div>
  );
}

function YTDSummary({ ytd }: { ytd: number }) {
  return (
    <div className='border rounded-xl p-4 flex flex-col justify-between'>
      <div>
        <h3 className='font-semibold text-gray-900'>YTD Earnings</h3>
        <p className='text-3xl font-bold text-gray-900 mt-2'>${ytd.toLocaleString()}</p>
      </div>
      <p className='text-sm text-gray-500'>Updated through {new Date().toLocaleDateString()}</p>
    </div>
  );
}

function SummaryTile({ label, value, icon: Icon }: { label: string; value: string; icon: LucideIcon }) {
  return (
    <div className='flex items-center space-x-3'>
      <div className='p-2 bg-gray-100 rounded-lg'>
        <Icon className='w-4 h-4 text-gray-600' />
      </div>
      <div>
        <p className='text-xs text-gray-500 uppercase tracking-wide'>{label}</p>
        <p className='font-semibold text-gray-900'>{value}</p>
      </div>
    </div>
  );
}

function DepositAccount({ type, bank, last4, percentage, primary }: DepositAccountProps) {
  return (
    <div className='border rounded-lg p-4 flex items-center justify-between'>
      <div>
        <p className='font-semibold text-gray-900'>{type}</p>
        <p className='text-sm text-gray-500'>
          {bank} • ****{last4}
        </p>
      </div>
      <div className='text-right'>
        <p className='font-semibold text-gray-900'>{percentage}%</p>
        {primary && <span className='text-xs text-blue-600 font-semibold'>Primary</span>}
      </div>
    </div>
  );
}

function TimeOffBalance({ type, balance }: { type: string; balance: TimeOffBalanceEntry }) {
  return (
    <div className='border rounded-xl p-4'>
      <div className='flex items-center justify-between'>
        <p className='font-semibold text-gray-900 uppercase tracking-wide'>{type}</p>
        <span className='text-sm text-gray-500'>{balance.accrualRate}</span>
      </div>
      <div className='mt-3 grid grid-cols-3 text-center text-sm'>
        <div>
          <p className='text-gray-500'>Available</p>
          <p className='text-xl font-bold text-gray-900'>{balance.available}</p>
        </div>
        <div>
          <p className='text-gray-500'>Used</p>
          <p className='text-xl font-bold text-gray-900'>{balance.used}</p>
        </div>
        <div>
          <p className='text-gray-500'>Pending</p>
          <p className='text-xl font-bold text-gray-900'>{balance.pending}</p>
        </div>
      </div>
    </div>
  );
}

function TimeOffRequestForm() {
  return (
    <form className='grid grid-cols-1 md:grid-cols-2 gap-4'>
      <label className='text-sm text-gray-600'>
        Start Date
        <input type='date' className='mt-1 w-full border rounded-lg px-3 py-2' />
      </label>
      <label className='text-sm text-gray-600'>
        End Date
        <input type='date' className='mt-1 w-full border rounded-lg px-3 py-2' />
      </label>
      <label className='text-sm text-gray-600'>
        Time Off Type
        <select className='mt-1 w-full border rounded-lg px-3 py-2'>
          <option>PTO</option>
          <option>Sick</option>
          <option>Personal</option>
        </select>
      </label>
      <label className='text-sm text-gray-600'>
        Hours Requested
        <input type='number' className='mt-1 w-full border rounded-lg px-3 py-2' defaultValue={8} />
      </label>
      <label className='md:col-span-2 text-sm text-gray-600'>
        Notes
        <textarea className='mt-1 w-full border rounded-lg px-3 py-2' rows={3} placeholder='Add context for your manager' />
      </label>
      <div className='md:col-span-2 flex justify-end gap-3'>
        <button type='button' className='px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50'>Save Draft</button>
        <button type='submit' className='px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600'>Submit Request</button>
      </div>
    </form>
  );
}

function TimeOffEntry({ dates, type, hours, status, approver }: TimeOffEntryProps) {
  const statusMap: Record<TimeOffEntryProps['status'], string> = {
    approved: 'text-green-600',
    pending: 'text-yellow-600',
  };

  return (
    <div className='border rounded-lg p-4 flex items-center justify-between'>
      <div>
        <p className='font-semibold text-gray-900'>{dates}</p>
        <p className='text-sm text-gray-500'>
          {type} • {hours} hrs
        </p>
      </div>
      <div className='text-right'>
        <p className={`text-sm font-semibold ${statusMap[status]}`}>{status}</p>
        <p className='text-xs text-gray-500'>{approver}</p>
      </div>
    </div>
  );
}

function TimesheetGrid({ timesheet }: { timesheet: TimesheetData }) {
  return (
    <div>
      <table className='w-full'>
        <thead>
          <tr className='text-sm text-gray-500 border-b'>
            <th className='text-left py-3'>Date</th>
            <th className='text-center py-3'>Regular</th>
            <th className='text-center py-3'>Overtime</th>
            <th className='text-center py-3'>Total</th>
            <th className='text-center py-3'>Status</th>
            <th className='text-center py-3'>Actions</th>
          </tr>
        </thead>
        <tbody>
          {timesheet.currentWeek.map((day) => (
            <tr key={day.date} className='border-b'>
              <td className='py-3'>
                <div>
                  <p className='font-medium'>{day.day}</p>
                  <p className='text-sm text-gray-500'>{day.date}</p>
                </div>
              </td>
              <td className='text-center'>
                <input type='number' value={day.regular} readOnly className='w-20 px-2 py-1 border rounded text-center bg-gray-50' />
              </td>
              <td className='text-center'>
                <input type='number' value={day.overtime} readOnly className='w-20 px-2 py-1 border rounded text-center bg-gray-50' />
              </td>
              <td className='text-center font-medium'>{day.total}</td>
              <td className='text-center'>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    day.status === 'approved'
                      ? 'bg-green-100 text-green-700'
                      : day.status === 'submitted'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {day.status}
                </span>
              </td>
              <td className='text-center'>
                {day.status === 'draft' && <button className='text-sm text-blue-600 hover:text-blue-700'>Submit</button>}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className='font-medium'>
            <td className='py-3'>Week Total</td>
            <td className='text-center'>{timesheet.weekTotal.regular}</td>
            <td className='text-center'>{timesheet.weekTotal.overtime}</td>
            <td className='text-center'>{timesheet.weekTotal.total}</td>
            <td colSpan={2}></td>
          </tr>
        </tfoot>
      </table>
      <div className='mt-4 flex justify-end space-x-3'>
        <button className='px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50'>Save Draft</button>
        <button className='px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600'>Submit Week</button>
      </div>
    </div>
  );
}

function BenefitCard({ title, icon: Icon, value, descriptor }: BenefitCardProps) {
  return (
    <div className='border rounded-xl p-4 flex items-start space-x-3'>
      <div className='p-2 bg-blue-100 rounded-lg'>
        <Icon className='w-5 h-5 text-blue-600' />
      </div>
      <div>
        <p className='text-sm text-gray-500 uppercase tracking-wide'>{title}</p>
        <p className='text-lg font-semibold text-gray-900'>{value}</p>
        {descriptor && <p className='text-xs text-gray-500'>{descriptor}</p>}
      </div>
    </div>
  );
}
