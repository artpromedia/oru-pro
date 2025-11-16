"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, Bell, Brain, Building2, Camera, Download, LogOut, Settings, Shield, User } from "lucide-react";

import { GeneralSettings } from "./components/GeneralSettings";
import { NotificationSettings } from "./components/NotificationSettings";
import { OrganizationSettings } from "./components/OrganizationSettings";
import { PlatformSettings } from "./components/PlatformSettings";
import { PreferenceSettings } from "./components/PreferenceSettings";
import { SecuritySettings } from "./components/SecuritySettings";
import { ActivityLog } from "./components/ActivityLog";

type UserType = "super-admin" | "tenant-admin" | "user";

export type UserProfileData = {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  organization: string;
  department: string;
  joinDate: string;
  lastLogin: string;
  avatar: string | null;
  phone?: string;
  timezone?: string;
  language?: string;
  permissions: string;
  mfaEnabled: boolean;
  apiAccess: boolean;
  accessLevel?: string;
  bio?: string;
  location?: string;
  linkedin?: string;
};

const SESSION_USER = "artpromedia";

export default function UserProfile() {
  const [activeTab, setActiveTab] = useState("general");
  const [userType, setUserType] = useState<UserType>("user");
  const [userData, setUserData] = useState<UserProfileData | null>(null);

  useEffect(() => {
    if (SESSION_USER === "artpromedia") {
      setUserType("super-admin");
      setUserData({
        id: "OONRU-SA-001",
        username: SESSION_USER,
        email: "artpromedia@oonru.ai",
        fullName: "Art Pro Media",
        role: "Oonru Super Administrator",
        organization: "Oonru Platform",
        department: "Platform Administration",
        joinDate: "2024-01-15",
        lastLogin: "2025-11-16 03:18:40",
        avatar: null,
        phone: "+1 (555) 123-4567",
        timezone: "UTC",
        language: "en-US",
        permissions: "FULL_PLATFORM_ACCESS",
        mfaEnabled: true,
        apiAccess: true,
        accessLevel: "platform",
      });
      return;
    }

    // Placeholder for other roles; could be replaced with API call
    setUserType("user");
    setUserData({
      id: "OONRU-USR-0001",
      username: SESSION_USER,
      email: `${SESSION_USER}@oonru.ai`,
      fullName: "Oonru User",
      role: "Platform User",
      organization: "Sample Tenant",
      department: "Operations",
      joinDate: "2024-05-01",
      lastLogin: "2025-11-15 22:10:00",
      avatar: null,
      permissions: "LIMITED",
      mfaEnabled: true,
      apiAccess: false,
    });
  }, []);

  const tabs = useMemo(
    () => [
      { id: "general", name: "General", icon: User },
      { id: "security", name: "Security", icon: Shield },
      { id: "notifications", name: "Notifications", icon: Bell },
      { id: "preferences", name: "Preferences", icon: Settings },
      ...(userType === "super-admin"
        ? [{ id: "platform", name: "Platform Settings", icon: Brain }]
        : []),
      ...(userType === "tenant-admin"
        ? [{ id: "organization", name: "Organization", icon: Building2 }]
        : []),
      { id: "activity", name: "Activity Log", icon: Activity },
    ],
    [userType]
  );

  if (!userData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-500">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-4">
            <ProfileAvatar userData={userData} />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{userData.fullName}</h1>
              <p className="text-gray-500">{userData.role}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                <span>{userData.email}</span>
                {userData.mfaEnabled && (
                  <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                    <Shield className="h-3 w-3" /> MFA Active
                  </span>
                )}
                {userType === "super-admin" && (
                  <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700">
                    Platform Admin
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800">
              <Download className="mr-2 inline h-4 w-4" />
              Export Data
            </button>
            <button className="flex items-center rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600">
              <LogOut className="mr-2 inline h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-6">
          <nav className="flex flex-wrap gap-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 border-b-2 py-4 text-sm font-medium transition-colors ${
                    isActive
                      ? "border-purple-600 text-purple-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-6 py-6">
        {activeTab === "general" && <GeneralSettings userData={userData} userType={userType} />}
        {activeTab === "security" && <SecuritySettings userData={userData} userType={userType} />}
        {activeTab === "notifications" && <NotificationSettings userType={userType} />}
        {activeTab === "preferences" && <PreferenceSettings userData={userData} />}
        {activeTab === "platform" && userType === "super-admin" && <PlatformSettings />}
        {activeTab === "organization" && userType === "tenant-admin" && <OrganizationSettings />}
        {activeTab === "activity" && <ActivityLog user={userData} />}
      </main>
    </div>
  );
}

type ProfileAvatarProps = {
  userData: UserProfileData;
};

function ProfileAvatar({ userData }: ProfileAvatarProps) {
  const [imageError, setImageError] = useState(false);

  const initials = useMemo(
    () =>
      userData.fullName
        .split(" ")
        .map((name) => name[0])
        .join("")
        .toUpperCase(),
    [userData.fullName]
  );

  return (
    <div className="relative">
      {userData.avatar && !imageError ? (
        <img
          src={userData.avatar}
          alt={userData.fullName}
          onError={() => setImageError(true)}
          className="h-20 w-20 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-purple-600 text-2xl font-bold text-white">
          {initials}
        </div>
      )}
      <button className="absolute bottom-0 right-0 rounded-full bg-white p-1 shadow hover:bg-gray-100">
        <Camera className="h-4 w-4 text-gray-600" />
      </button>
    </div>
  );
}
