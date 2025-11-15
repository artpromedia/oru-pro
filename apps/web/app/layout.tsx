import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Oru Operations",
  description: "Odoo-inspired operational control tower"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="text-slate-900">
        <Providers>
          <main className="mx-auto max-w-7xl px-8 py-12">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
