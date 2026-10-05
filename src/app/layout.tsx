import type { Metadata, Viewport } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { InstallProvider } from "@/components/InstallApp";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const description = "A shared life sim set in Owerri. Work a shift, eat, pay Saturday rent, and move through the city. In-game naira only. 18+.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "Owerri Life — Live the week in Owerri", template: "%s · Owerri Life" },
  description,
  applicationName: "Owerri Life",
  authors: [{ name: "Owerri Life" }],
  creator: "Owerri Life",
  category: "game",
  keywords: ["Owerri", "Owerri Life", "life sim", "browser game", "Imo", "Nigeria"],
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Owerri Life — Live the week in Owerri",
    description,
    url: "/",
    siteName: "Owerri Life",
    type: "website",
    locale: "en_NG",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Owerri Life. Live the week in Owerri. Cartel is open." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Owerri Life — Live the week in Owerri",
    description,
    images: ["/og.png"],
  },
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
