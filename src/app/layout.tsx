import type { Metadata, Viewport } from "next";
import { Fraunces, Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Owerri Life",
  description: "A browser life simulation set in Owerri. Work, eat, pay rent, and keep the naira in the city.",
  applicationName: "Owerri Life",
  appleWebApp: { capable: true, title: "Owerri Life", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#10211a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${outfit.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
