"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import CoachSheet from "./CoachSheet";

export default function CoachFab() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  if (pathname?.startsWith("/onboarding") || pathname?.startsWith("/login") || pathname?.startsWith("/share")) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 md:bottom-6 right-5 z-30 w-14 h-14 rounded-2xl bg-primary text-white shadow-xl shadow-primary/30 flex items-center justify-center active:scale-95 transition"
        aria-label="Coach IA"
      >
        <Sparkles className="w-6 h-6" />
      </button>
      <CoachSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}
