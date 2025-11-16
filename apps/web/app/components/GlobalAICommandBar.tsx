"use client";

import { usePathname } from "next/navigation";
import AICommandBar from "../(dashboard)/components/AICommandBar";

const DISABLED_PREFIXES = ["/auth", "/login"];

export function GlobalAICommandBar() {
  const pathname = usePathname();

  const shouldHide = pathname ? DISABLED_PREFIXES.some((prefix) => pathname.startsWith(prefix)) : false;

  if (shouldHide) {
    return null;
  }

  return <AICommandBar anchored />;
}