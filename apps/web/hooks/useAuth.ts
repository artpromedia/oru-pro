import { useMemo } from "react";

export type AuthUser = {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  avatar?: string;
  roles: string[];
};

const FALLBACK_USER: AuthUser = {
  id: "ops-lead-001",
  tenantId: process.env.NEXT_PUBLIC_DEFAULT_TENANT ?? "demo",
  name: "Alex Rivera",
  email: "alex.rivera@oru.ai",
  avatar: "/avatars/alex.png",
  roles: ["operations-lead"],
};

export const useAuth = () => {
  const user = useMemo<AuthUser>(() => {
    if (typeof window === "undefined") {
      return FALLBACK_USER;
    }

    try {
      const stored = window.localStorage.getItem("oru:user");
      if (stored) {
        return { ...FALLBACK_USER, ...JSON.parse(stored) };
      }
    } catch {
      // ignore storage issues and fall back to default user profile
    }

    return FALLBACK_USER;
  }, []);

  return {
    user,
    isAuthenticated: true,
    isLoading: false,
  };
};
