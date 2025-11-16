"use client";

import { useState } from "react";
import { Globe, Moon, Sun, ToggleRight } from "lucide-react";

import type { UserProfileData } from "../page";

type PreferenceSettingsProps = {
  userData: UserProfileData;
};

type ThemeOption = "system" | "light" | "dark";

type PreferenceState = {
  theme: ThemeOption;
  accent: string;
  density: "comfortable" | "compact";
  accessibility: {
    reducedMotion: boolean;
    highContrast: boolean;
    largerText: boolean;
  };
};

const accentPalette = ["violet", "emerald", "blue", "amber", "rose"] as const;
const accentSwatches: Record<(typeof accentPalette)[number], string> = {
  violet: "#8b5cf6",
  emerald: "#10b981",
  blue: "#3b82f6",
  amber: "#f59e0b",
  rose: "#f43f5e",
};

export function PreferenceSettings({ userData }: PreferenceSettingsProps) {
  const [preferences, setPreferences] = useState<PreferenceState>({
    theme: "system",
    accent: "violet",
    density: "comfortable",
    accessibility: {
      reducedMotion: false,
      highContrast: false,
      largerText: false,
    },
  });

  const updateAccessibility = (key: keyof PreferenceState["accessibility"], value: boolean) => {
    setPreferences((prev) => ({
      ...prev,
      accessibility: {
        ...prev.accessibility,
        [key]: value,
      },
    }));
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Theme</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {([
            { id: "light", label: "Light", icon: Sun },
            { id: "dark", label: "Dark", icon: Moon },
            { id: "system", label: "System", icon: ToggleRight },
          ] as const).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setPreferences((prev) => ({ ...prev, theme: id }))}
              className={`rounded-lg border p-4 text-left transition ${
                preferences.theme === id ? "border-purple-500 bg-purple-50" : "border-gray-200"
              }`}
            >
              <Icon className="mb-2 h-5 w-5 text-gray-600" />
              <p className="font-semibold text-gray-900">{label} mode</p>
              <p className="text-sm text-gray-500">
                {id === "system" ? "Match device preference" : `Force ${label.toLowerCase()} mode`}
              </p>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Accent Color</h2>
        <div className="flex flex-wrap gap-4">
          {accentPalette.map((color) => (
            <button
              key={color}
              onClick={() => setPreferences((prev) => ({ ...prev, accent: color }))}
              className={`flex h-16 w-16 flex-col items-center justify-center rounded-lg border text-xs capitalize ${
                preferences.accent === color ? "border-purple-600" : "border-gray-200"
              }`}
            >
              <span
                className="mb-2 h-6 w-6 rounded-full"
                style={{ backgroundColor: accentSwatches[color] }}
              />
              {color}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Density & Locale</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Interface Density</label>
            <select
              value={preferences.density}
              onChange={(event) => setPreferences((prev) => ({ ...prev, density: event.target.value as PreferenceState["density"] }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              <option value="comfortable">Comfortable</option>
              <option value="compact">Compact</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Locale Preview</label>
            <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 text-sm text-gray-600">
              <Globe className="h-4 w-4 text-gray-500" />
              {userData.language ?? "en-US"}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Accessibility</h2>
        <div className="space-y-3">
          <AccessibilityToggle
            label="Reduce Motion"
            description="Disable complex animations"
            enabled={preferences.accessibility.reducedMotion}
            onChange={(value) => updateAccessibility("reducedMotion", value)}
          />
          <AccessibilityToggle
            label="High Contrast"
            description="Improve color contrast across UI"
            enabled={preferences.accessibility.highContrast}
            onChange={(value) => updateAccessibility("highContrast", value)}
          />
          <AccessibilityToggle
            label="Larger Text"
            description="Increase base font size for readability"
            enabled={preferences.accessibility.largerText}
            onChange={(value) => updateAccessibility("largerText", value)}
          />
        </div>
      </section>
    </div>
  );
}

type AccessibilityToggleProps = {
  label: string;
  description: string;
  enabled: boolean;
  onChange: (value: boolean) => void;
};

function AccessibilityToggle({ label, description, enabled, onChange }: AccessibilityToggleProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
      <div>
        <p className="font-medium text-gray-900">{label}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
          enabled ? "bg-purple-600" : "bg-gray-300"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
            enabled ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
