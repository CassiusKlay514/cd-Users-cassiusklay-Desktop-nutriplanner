import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import Sidebar from "@/components/Sidebar";
import MobileHeader from "@/components/MobileHeader";
import AuthBridge from "@/components/AuthBridge";
import CoachFab from "@/components/CoachFab";
import QuickMealFab from "@/components/QuickMealFab";

export const metadata: Metadata = {
  title: "NutriPlanner",
  description: "Votre coach nutrition personnalisé par IA",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#16a34a",
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
          <main className="flex-1 pb-20 md:pb-6">{children}</main>
          <QuickMealFab />
          <CoachFab />
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
