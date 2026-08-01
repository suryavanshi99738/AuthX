import type { Metadata } from "next";
import { Inter, Sora, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

/* ── Inter Font Configuration ── */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

/* ── Sora Font Configuration (Headings) ── */
const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "600", "700", "800"],
});

/* ── Plus Jakarta Sans (Hero Display) ── */
const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

/* ── BankShield Auth Metadata ── */
export const metadata: Metadata = {
  title: "BankShield Auth — Passwordless Banking Authentication",
  description:
    "Modern passwordless authentication platform for banking systems. Secure login with passkeys, biometrics, QR codes, and trusted devices.",
  keywords: [
    "BankShield",
    "passwordless",
    "banking authentication",
    "passkeys",
    "WebAuthn",
    "biometrics",
    "FIDO2",
    "security",
    "Next.js",
    "TypeScript",
  ],
  authors: [{ name: "BankShield Auth Team" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "BankShield Auth",
    description: "Passwordless banking authentication platform",
    siteName: "BankShield Auth",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BankShield Auth",
    description: "Passwordless banking authentication platform",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${sora.variable} ${plusJakarta.variable} antialiased bg-background text-foreground min-h-screen flex flex-col`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
