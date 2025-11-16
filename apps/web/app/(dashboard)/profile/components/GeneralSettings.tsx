"use client";

import { type ChangeEvent, useMemo, useState } from "react";
import { Building2, Clock, Globe, Mail, Phone, Save } from "lucide-react";

import type { UserProfileData } from "../page";

type GeneralSettingsProps = {
  userData: UserProfileData;
  userType: "super-admin" | "tenant-admin" | "user";
};

type FormShape = {
  fullName: string;
  email: string;
  phone: string;
  department: string;
  jobTitle: string;
  bio: string;
  location: string;
  linkedin: string;
  timezone: string;
  language: string;
};

const timezones = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
];

const languages = [
  { code: "en-US", name: "English (US)" },
  { code: "en-GB", name: "English (UK)" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "ja", name: "Japanese" },
  { code: "zh", name: "Chinese" },
];

export function GeneralSettings({ userData, userType }: GeneralSettingsProps) {
  const [formData, setFormData] = useState<FormShape>({
    fullName: userData.fullName,
    email: userData.email,
    phone: userData.phone ?? "",
    department: userData.department ?? "",
    jobTitle: userData.role ?? "",
    bio: userData.bio ?? "",
    location: userData.location ?? "",
    linkedin: userData.linkedin ?? "",
    timezone: userData.timezone ?? "UTC",
    language: userData.language ?? "en-US",
  });

  const currentTime = useMemo(() => {
    try {
      return new Date().toLocaleString("en-US", { timeZone: formData.timezone });
    } catch {
      return new Date().toLocaleString("en-US", { timeZone: "UTC" });
    }
  }, [formData.timezone]);

  const updateField = (field: keyof FormShape, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Personal Information</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <TextField
            label="Full Name"
            value={formData.fullName}
            onChange={(event) => updateField("fullName", event.target.value)}
          />
          <TextField
            label="Email Address"
            icon={<Mail className="h-4 w-4 text-gray-400" />}
            value={formData.email}
            onChange={(event) => updateField("email", event.target.value)}
            disabled={userType === "super-admin"}
            helper={
              userType === "super-admin"
                ? "Contact Oonru support to change email"
                : undefined
            }
          />
          <TextField
            label="Phone Number"
            icon={<Phone className="h-4 w-4 text-gray-400" />}
            value={formData.phone}
            onChange={(event) => updateField("phone", event.target.value)}
            placeholder="+1 (555) 123-4567"
          />
          <TextField
            label="Department"
            icon={<Building2 className="h-4 w-4 text-gray-400" />}
            value={formData.department}
            onChange={(event) => updateField("department", event.target.value)}
            readOnly={userType === "user"}
          />
          <TextField
            label="Job Title"
            value={formData.jobTitle}
            onChange={(event) => updateField("jobTitle", event.target.value)}
          />
          <TextField
            label="Location"
            value={formData.location}
            onChange={(event) => updateField("location", event.target.value)}
            placeholder="City, Country"
          />
        </div>
        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">Bio</label>
          <textarea
            value={formData.bio}
            onChange={(event) => updateField("bio", event.target.value)}
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-purple-500"
            placeholder="Tell us about yourself..."
          />
        </div>
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Regional Settings</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <SelectField
            label="Time Zone"
            icon={<Clock className="h-4 w-4 text-gray-400" />}
            value={formData.timezone}
            onChange={(event) => updateField("timezone", event.target.value)}
            options={timezones.map((tz) => ({ label: tz, value: tz }))}
            helper={`Current time: ${currentTime}`}
          />
          <SelectField
            label="Language"
            icon={<Globe className="h-4 w-4 text-gray-400" />}
            value={formData.language}
            onChange={(event) => updateField("language", event.target.value)}
            options={languages.map((language) => ({ label: language.name, value: language.code }))}
          />
        </div>
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Account Information</h2>
        <div className="grid gap-6 text-sm md:grid-cols-2">
          <InfoRow label="User ID" value={userData.id} />
          <InfoRow label="Account Type" value={userType.replace("-", " ").toUpperCase()} />
          <InfoRow label="Organization" value={userData.organization} />
          <InfoRow label="Member Since" value={userData.joinDate} />
          <InfoRow label="Last Login" value={userData.lastLogin} />
          <InfoRow label="Access Level" value={userData.accessLevel?.toUpperCase() ?? "N/A"} />
        </div>
      </section>

      <div className="flex justify-end">
        <button className="flex items-center gap-2 rounded-lg bg-purple-600 px-6 py-2 font-semibold text-white transition hover:bg-purple-700">
          <Save className="h-4 w-4" />
          Save Changes
        </button>
      </div>
    </div>
  );
}

type TextFieldProps = {
  label: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  icon?: React.ReactNode;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  helper?: string;
};

function TextField({ label, value, onChange, icon, placeholder, disabled, readOnly, helper }: TextFieldProps) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <div className="relative">
        {icon && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">{icon}</span>}
        <input
          type="text"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          className={`w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-purple-500 ${
            icon ? "pl-10" : ""
          } ${disabled ? "bg-gray-100 text-gray-500" : ""}`}
        />
      </div>
      {helper && <p className="mt-1 text-xs text-gray-500">{helper}</p>}
    </div>
  );
}

type SelectFieldProps = {
  label: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  options: { label: string; value: string }[];
  icon?: React.ReactNode;
  helper?: string;
};

function SelectField({ label, value, onChange, options, icon, helper }: SelectFieldProps) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <div className="relative">
        {icon && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">{icon}</span>}
        <select
          value={value}
          onChange={onChange}
          className={`w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-purple-500 ${
            icon ? "pl-10" : ""
          }`}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      {helper && <p className="mt-1 text-xs text-gray-500">{helper}</p>}
    </div>
  );
}

type InfoRowProps = {
  label: string;
  value: string;
};

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div>
      <p className="text-gray-500">{label}</p>
      <p className="font-medium text-gray-900">{value}</p>
    </div>
  );
}
