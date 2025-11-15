"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Building2,
  Truck,
  Package,
  Brain,
  TrendingUp,
  Users,
} from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-blue-50 to-cyan-50 items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative z-10 w-4/5">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="text-4xl font-bold text-blue-900 mb-4">
              Unified Enterprise Operations
            </h1>
            <p className="text-blue-700 text-lg mb-12">
              Replace SAP • Unify Operations • Deploy AI Agents
            </p>

            <div className="grid grid-cols-3 gap-8">
              <FeatureCard icon={Package} title="Smart WMS" description="Real-time inventory with QA controls" />
              <FeatureCard icon={Building2} title="Production Suite" description="BOM management & shop floor" />
              <FeatureCard icon={Truck} title="Logistics TMS" description="Cold chain & 3PL integration" />
              <FeatureCard icon={Brain} title="AI Agents" description="Autonomous decision making" />
              <FeatureCard icon={TrendingUp} title="Project Execution" description="Strategic initiatives" />
              <FeatureCard icon={Users} title="Decision Intelligence" description="Reduce decision noise" />
            </div>
          </motion.div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl mb-4">
              <span className="text-white text-2xlOE?"/>
          </div>

          <form className="space-y-6">
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

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-4 text-gray-500">Or sign in with SSO</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                { label: "Azure AD" },
                { label: "Okta" },
                { label: "SAP ID" },
              ].map((provider) => (
                <button
                  key={provider.label}
                  className="flex items-center justify-center rounded-lg border border-gray-200 px-4 py-2 text-xs hover:bg-gray-50"
                >
                  {provider.label}
                </button>
              ))}
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
      whileHover={{ scale: 1.05 }}
      className="rounded-xl bg-white/80 p-4 backdrop-blur"
    >
      <Icon className="mx-auto mb-2 h-8 w-8 text-blue-600" />
      <h3 className="font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-600">{description}</p>
    </motion.div>
  );
}
