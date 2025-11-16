"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle, Key, Monitor, Shield, Smartphone, XCircle } from "lucide-react";

import type { UserProfileData } from "../page";

type SecuritySettingsProps = {
  userData: UserProfileData;
  userType: "super-admin" | "tenant-admin" | "user";
};

type Session = {
  id: number;
  device: string;
  ip: string;
  location: string;
  lastActive: string;
  current: boolean;
};

type ApiKey = {
  id: string;
  name: string;
  created: string;
  lastUsed: string;
  permissions: string;
  status: "active" | "revoked";
};

export function SecuritySettings({ userData, userType }: SecuritySettingsProps) {
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [mfaEnabled] = useState(userData.mfaEnabled);
  const [sessions] = useState<Session[]>([
    {
      id: 1,
      device: "Chrome on Windows",
      ip: "192.168.1.1",
      location: "New York, US",
      lastActive: userData.lastLogin,
      current: true,
    },
    {
      id: 2,
      device: "Safari on iPhone",
      ip: "192.168.1.2",
      location: "New York, US",
      lastActive: "2025-11-15 22:45:00",
      current: false,
    },
  ]);
  const [apiKeys] = useState<ApiKey[]>([
    {
      id: "key-001",
      name: "Production API",
      created: "2025-10-15",
      lastUsed: "2025-11-16 02:00:00",
      permissions: "read-write",
      status: "active",
    },
    {
      id: "key-002",
      name: "Testing API",
      created: "2025-09-20",
      lastUsed: "2025-11-10 15:30:00",
      permissions: "read-only",
      status: "active",
    },
  ]);

  return (
    <div className="space-y-6">
      <section className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Password</h2>
            <p className="text-sm text-gray-500">Last changed 45 days ago</p>
          </div>
          <button
            onClick={() => setShowPasswordChange((prev) => !prev)}
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700"
          >
            {showPasswordChange ? "Hide" : "Change Password"}
          </button>
        </div>
        {showPasswordChange && <PasswordForm onCancel={() => setShowPasswordChange(false)} />}
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Two-Factor Authentication</h2>
            <p className="text-sm text-gray-500">Add an extra layer of security</p>
          </div>
          <div className="flex items-center gap-3">
            {mfaEnabled ? (
              <>
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm text-green-700">
                  <CheckCircle className="h-4 w-4" /> Enabled
                </span>
                <button className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">
                  Configure
                </button>
              </>
            ) : (
              <button className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700">
                Enable 2FA
              </button>
            )}
          </div>
        </div>
        {mfaEnabled && (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <MFAMethod icon={Smartphone} method="Authenticator App" status="Active" description="Google Authenticator" />
            <MFAMethod icon={Key} method="Backup Codes" status="Generated" description="5 codes remaining" />
          </div>
        )}
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Active Sessions</h2>
          <button className="text-sm font-semibold text-red-600 hover:text-red-700">Sign out all other sessions</button>
        </div>
        <div className="space-y-3">
          {sessions.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}
        </div>
      </section>

      {(userType === "super-admin" || userType === "tenant-admin") && (
        <section className="rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">API Keys</h2>
            <button className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700">
              Generate New Key
            </button>
          </div>
          <div className="space-y-3">
            {apiKeys.map((key) => (
              <APIKeyCard key={key.id} apiKey={key} />
            ))}
          </div>
        </section>
      )}

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Security Recommendations</h2>
        <div className="space-y-3">
          <SecurityRecommendation
            status="success"
            title="Strong password"
            description="Your password meets security requirements"
          />
          <SecurityRecommendation
            status={mfaEnabled ? "success" : "warning"}
            title="Two-factor authentication"
            description={mfaEnabled ? "Enabled and protecting your account" : "Enable 2FA for better security"}
          />
          <SecurityRecommendation
            status="success"
            title="Recent activity review"
            description="No suspicious activity detected"
          />
          {userType === "super-admin" && (
            <SecurityRecommendation
              status="info"
              title="Platform security audit"
              description="Next audit scheduled for 2025-12-01"
            />
          )}
        </div>
      </section>
    </div>
  );
}

function PasswordForm({ onCancel }: { onCancel: () => void }) {
  return (
    <div className="space-y-4 border-t pt-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Current Password</label>
        <input type="password" className="w-full rounded-lg border border-gray-300 px-3 py-2" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">New Password</label>
        <input type="password" className="w-full rounded-lg border border-gray-300 px-3 py-2" />
        <PasswordStrength />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Confirm New Password</label>
        <input type="password" className="w-full rounded-lg border border-gray-300 px-3 py-2" />
      </div>
      <div className="flex justify-end gap-3">
        <button onClick={onCancel} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800">
          Cancel
        </button>
        <button className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700">
          Update Password
        </button>
      </div>
    </div>
  );
}

function PasswordStrength() {
  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((level) => (
          <div key={level} className={`h-1 flex-1 rounded ${level <= 2 ? "bg-yellow-400" : "bg-gray-200"}`} />
        ))}
      </div>
      <p className="mt-1 text-xs text-gray-500">Medium strength</p>
    </div>
  );
}

function MFAMethod({ icon: Icon, method, status, description }: { icon: typeof Smartphone; method: string; status: string; description: string }) {
  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 text-gray-500" />
        <div>
          <p className="font-medium text-gray-900">{method}</p>
          <p className="text-sm text-gray-500">{description}</p>
          <span className="text-xs text-green-600">{status}</span>
        </div>
      </div>
    </div>
  );
}

function SessionCard({ session }: { session: Session }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3 text-sm">
      <div className="flex items-center gap-3">
        <Monitor className="h-5 w-5 text-gray-500" />
        <div>
          <p className="font-semibold text-gray-900">{session.device}</p>
          <p className="text-xs text-gray-500">
            {session.location} • {session.ip}
          </p>
          <p className="text-xs text-gray-400">Last active: {session.lastActive}</p>
        </div>
      </div>
      {session.current ? (
        <span className="rounded bg-green-100 px-2 py-1 text-xs text-green-700">Current</span>
      ) : (
        <button className="text-xs font-semibold text-red-600 hover:text-red-700">Revoke</button>
      )}
    </div>
  );
}

function APIKeyCard({ apiKey }: { apiKey: ApiKey }) {
  const [showKey, setShowKey] = useState(false);
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3 text-sm">
      <div className="flex items-center gap-3">
        <Key className="h-5 w-5 text-gray-500" />
        <div>
          <p className="font-semibold text-gray-900">{apiKey.name}</p>
          <p className="text-xs text-gray-500">
            Created: {apiKey.created} • Last used: {apiKey.lastUsed}
          </p>
          <p className="text-xs text-gray-400">Permissions: {apiKey.permissions}</p>
          {showKey && <p className="text-xs font-mono text-gray-700">{apiKey.id}-****************</p>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={() => setShowKey((prev) => !prev)} className="text-xs font-semibold text-blue-600 hover:text-blue-700">
          {showKey ? "Hide" : "Show"}
        </button>
        <button className="text-xs font-semibold text-red-600 hover:text-red-700">Revoke</button>
      </div>
    </div>
  );
}

type SecurityStatus = "success" | "warning" | "error" | "info";

function SecurityRecommendation({ status, title, description }: { status: SecurityStatus; title: string; description: string }) {
  const icons: Record<SecurityStatus, JSX.Element> = {
    success: <CheckCircle className="h-5 w-5 text-green-500" />,
    warning: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
    error: <XCircle className="h-5 w-5 text-red-500" />,
    info: <Shield className="h-5 w-5 text-blue-500" />,
  };

  return (
    <div className="flex items-start gap-3 text-sm">
      {icons[status]}
      <div>
        <p className="font-medium text-gray-900">{title}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </div>
  );
}
