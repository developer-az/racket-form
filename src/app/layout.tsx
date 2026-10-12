import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppHeader } from "@/components/layout/AppHeader";
import { MobileAppNav } from "@/components/layout/MobileAppNav";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import "./globals.css";

const sans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const mono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  applicationName: "Racket Form",
  title: {
    default: "Racket Form — Form Lab & Gear Intelligence",
    template: "%s · Racket Form",
  },
  description:
    "See how tour players hit in 3D, then find the racket, string and grip that fit your game.",
  openGraph: {
    siteName: "Racket Form",
    title: "Racket Form — Form Lab & Gear Intelligence",
    description:
      "See how tour players hit in 3D, then find the racket, string and grip that fit your game.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Racket Form — Form Lab & Gear Intelligence",
    description:
      "See how tour players hit in 3D, then find the racket, string and grip that fit your game.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f6f7" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0b0d" },
  ],
};

/** Prefer light when unset; only dark when stored or OS prefers dark. */
const themeBoot = `(function(){try{var k='strokeform-theme';var s=localStorage.getItem(k);var m=s==='light'||s==='dark'?s:(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.setAttribute('data-theme',m);document.documentElement.style.colorScheme=m;}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${mono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
      </head>
      <body className="flex h-dvh flex-col overflow-hidden font-sans">
        <ThemeProvider>
          <AuthProvider>
            <AppHeader />
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain">
              {children}
            </div>
            <MobileAppNav />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
