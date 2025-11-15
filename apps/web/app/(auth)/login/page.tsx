"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Building2,
  Truck,
  Package,
  Brain,
  TrendingUp,
  Users,
  Shield,
  Sparkles,
} from "lucide-react";

const trustSignals = ["Cold Chain", "CPG", "Manufacturing", "Life Sciences"];
const ssoProviders = ["Azure AD", "Okta", "Google", "SAP ID"];
const formStats = [
  { label: "Live Deployments", value: "42" },
  { label: "AI Actions / day", value: "3.2k" },
  { label: "Decision Noise", value: "-67%" },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const featureHighlights = useMemo(
    () => [
      { icon: Package, title: "Smart WMS", description: "Real-time inventory with QA controls" },
      { icon: Building2, title: "Production Suite", description: "BOM management & shop floor" },
      { icon: Truck, title: "Logistics TMS", description: "Cold chain & 3PL integration" },
      { icon: Brain, title: "AI Agents", description: "Autonomous decision making" },
      { icon: TrendingUp, title: "Project Execution", description: "Strategic initiatives" },
      { icon: Users, title: "Decision Intelligence", description: "Reduce decision noise" },
    ],
    []
  );

  return (
    <div className="min-h-screen bg-slate-950 lg:flex">
      <div className="relative hidden flex-1 items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-cyan-50 to-white lg:flex">
        <div className="absolute inset-0 opacity-40">
          <svg className="h-full w-full" viewBox="0 0 400 400" preserveAspectRatio="none">
            <defs>
              <linearGradient id="gridGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.6" />
              </linearGradient>
            </defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="url(#gridGradient)" strokeWidth="1" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative z-10 mx-auto w-[85%] max-w-4xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <p className="mb-4 inline-flex items-center rounded-full bg-white/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              <Shield className="mr-2 h-3.5 w-3.5 text-blue-600" /> Enterprise AI Platform
            </p>
            <h1 className="mb-4 text-4xl font-bold text-slate-900">
              Unified Enterprise Operations
            </h1>
            <p className="text-lg text-slate-600">
              Replace SAP · Unify Operations · Deploy AI Agents
            </p>

            <div className="mx-auto mt-10 grid grid-cols-3 gap-4">
              {formStats.map((stat) => (
                <StatPill key={stat.label} label={stat.label} value={stat.value} />
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-12 grid grid-cols-2 gap-4"
          >
            {featureHighlights.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mt-12 rounded-2xl bg-white/80 p-6 backdrop-blur"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Trusted by operations teams across
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm font-medium text-slate-700">
              {trustSignals.map((item) => (
                <span key={item} className="rounded-full border border-slate-200 px-3 py-1">
                  {item}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="flex w-full items-center justify-center bg-white px-6 py-12 lg:w-[480px]">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="mb-10 text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 text-2xl font-semibold text-white">
              Oru
            </div>
            <h2 className="mt-4 text-3xl font-semibold text-slate-900">Welcome to the Oru Portal</h2>
            <p className="mt-1 text-sm text-slate-500">The Autonomous Enterprise Platform</p>
          </div>

          <form
            className="space-y-6"
            onSubmit={(event) => {
              event.preventDefault();
            }}
          >
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Business Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-lg border border-gray-200 px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-gray-200 px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your password"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2">Keep me signed in</span>
              </label>
              <a href="#" className="text-sm text-blue-600 hover:text-blue-700">
                Forgot Password?
              </a>
            </div>

            <button
              type="submit"
              className="w-full transform rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-3 font-medium text-white transition-all hover:scale-[1.02] hover:from-blue-600 hover:to-cyan-600"
            >
              Sign In to Oru
            </button>
          </form>

          <div className="mt-8 space-y-6">
            <Divider label="Or continue with SSO" />

            <div className="grid grid-cols-2 gap-3">
              {ssoProviders.map((provider) => (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  key={provider}
                  type="button"
                  className="flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:border-blue-200 hover:bg-blue-50"
                >
                  {provider}
                </motion.button>
              ))}
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-start space-x-3">
                <div className="rounded-xl bg-white p-2 shadow-sm">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-sm text-slate-600">
                  <p className="font-medium text-slate-900">Decision Intelligence</p>
                  <p>Reduce decision noise with AI copilots orchestrating inventory, production, and logistics.</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="rounded-2xl border border-white/70 bg-white/80 p-4 text-left shadow-sm backdrop-blur"
    >
      <div className="mb-3 inline-flex rounded-2xl bg-slate-100 p-2 text-blue-600">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-600">{description}</p>
    </motion.div>
  );
}

interface StatPillProps {
  label: string;
  value: string;
}

function StatPill({ label, value }: StatPillProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

interface DividerProps {
  label: string;
}

function Divider({ label }: DividerProps) {
  return (
    <div className="relative flex items-center">
      <span className="h-px w-full bg-slate-200" />
      <span className="mx-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <span className="h-px w-full bg-slate-200" />
    </div>
  );
}
