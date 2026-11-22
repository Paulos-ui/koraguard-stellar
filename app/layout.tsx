import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KoraGuard | Every payment has a before",
  description: "KoraGuard helps businesses plan commitments, understand available funds, and explore user-authorized payments on Stellar Testnet.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
