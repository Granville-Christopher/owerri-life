import type { Metadata, Viewport } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { InstallProvider } from "@/components/InstallApp";
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
  icons: { icon: "/icon-192.png", apple: "/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#10211a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${outfit.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="min-h-full">
        <div className="ol-wide min-h-dvh items-center justify-center bg-[#0c1a14] px-6 text-center text-[#f6f1e6]">
          <div className="max-w-sm">
            <p className="font-display text-4xl">Owerri Life</p>
            <p className="mt-4 text-sm leading-6 text-[#d5e4d8]">This app runs on a phone or a tablet. A bigger screen is not supported. Open it on a smaller device, or shrink the window.</p>
          </div>
        </div>
        <div className="ol-fit">
          <InstallProvider>{children}</InstallProvider>
        </div>
      </body>
    </html>
  );
}
