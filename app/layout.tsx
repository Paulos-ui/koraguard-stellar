import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KoraGuard | Every payment, protected",
  description: "A clearer way for African businesses to plan obligations and pay safely on Stellar.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
