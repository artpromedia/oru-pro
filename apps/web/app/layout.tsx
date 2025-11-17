import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { GlobalAICommandBar } from "./components/GlobalAICommandBar";

export const metadata: Metadata = {
  title: {
    default: "Oonru Operations",
    template: "%s | Oonru Operations",
  },
  description: "Oonru's autonomous operational control tower",
  applicationName: "Oonru",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Oonru",
  },
  icons: {
    icon: [{ url: "/icons/pwa-icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/pwa-maskable.svg", type: "image/svg+xml" }],
    other: [{ rel: "mask-icon", url: "/icons/pwa-maskable.svg" }],
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="text-slate-900">
        <Providers>
          <main className="mx-auto max-w-7xl px-8 py-12">{children}</main>
          <GlobalAICommandBar />
        </Providers>
      </body>
    </html>
  );
}
