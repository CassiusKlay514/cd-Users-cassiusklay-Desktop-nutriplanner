import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import Sidebar from "@/components/Sidebar";
import MobileHeader from "@/components/MobileHeader";
import DesktopHeader from "@/components/DesktopHeader";
import AuthBridge from "@/components/AuthBridge";
import CoachFab from "@/components/CoachFab";
import QuickMealFab from "@/components/QuickMealFab";
import ToastProvider from "@/components/ToastProvider";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://nutriplanner-nu.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "NutriPlanner · Mangez mieux, sans y penser",
    template: "%s · NutriPlanner",
  },
  description:
    "Votre semaine de repas conçue par l'IA, votre liste de courses générée, vos objectifs nutrition à portée de main. Anti-gaspillage, prix comparés sur 4 enseignes.",
  applicationName: "NutriPlanner",
  authors: [{ name: "NutriPlanner" }],
  keywords: [
    "nutrition", "plan de repas", "recettes", "liste de courses",
    "IA cuisine", "anti-gaspillage", "comparateur prix",
  ],
  openGraph: {
    title: "NutriPlanner · Mangez mieux, sans y penser",
    description:
      "Plan de repas IA, courses comparées, photo du frigo, suivi nutrition. Tout en français.",
    siteName: "NutriPlanner",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NutriPlanner",
    description: "Votre assistant nutrition propulsé par l'IA.",
  },
  appleWebApp: {
    capable: true,
    title: "NutriPlanner",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#16a34a" },
    { media: "(prefers-color-scheme: dark)", color: "#15803d" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col md:flex-row bg-background">
        <AuthBridge />
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          <MobileHeader />
          <DesktopHeader />
          <main className="flex-1 pb-20 md:pb-6">{children}</main>
          <QuickMealFab />
          <CoachFab />
          <BottomNav />
        </div>
        <ToastProvider />
      </body>
    </html>
  );
}
