import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
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

/* ── AuthX Metadata ── */
export const metadata: Metadata = {
  title: "AuthX — Enterprise Passwordless Authentication",
  description:
    "Modern passwordless authentication platform. Secure login with passkeys, biometrics, QR codes, and trusted devices.",
  keywords: [
    "AuthX",
    "passwordless",
    "authentication",
    "passkeys",
    "WebAuthn",
    "biometrics",
    "FIDO2",
    "security",
    "Next.js",
    "TypeScript",
  ],
  authors: [{ name: "AuthX Team" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "AuthX — Enterprise Passwordless Authentication",
    description: "Passwordless authentication platform",
    siteName: "AuthX",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AuthX",
    description: "Passwordless authentication platform",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${sora.variable} antialiased bg-background text-foreground min-h-screen flex flex-col font-sans`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
