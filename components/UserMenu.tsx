"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, LogOut, User as UserIcon } from "lucide-react";
import { createClient, supabaseEnabled } from "@/lib/supabase/client";
import { useStore } from "@/lib/store";

export default function UserMenu() {
  const [email, setEmail] = useState<string | null>(null);
  const router = useRouter();
  const clearAll = useStore((s) => s.clearAll);

  useEffect(() => {
    if (!supabaseEnabled()) return;
    const sb = createClient();
    sb.auth.getUser().then(({ data: { user } }) => setEmail(user?.email ?? null));
    const { data: sub } = sb.auth.onAuthStateChange((_, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!supabaseEnabled()) return null;

  if (!email) {
    return (
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold"
      >
        <LogIn className="w-3.5 h-3.5" /> Se connecter
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="hidden md:inline text-xs text-gray-500 truncate max-w-[140px]">
        <UserIcon className="w-3.5 h-3.5 inline mr-1" />
        {email}
      </span>
      <button
        onClick={async () => {
          await createClient().auth.signOut();
          clearAll();
          router.push("/");
        }}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold"
      >
        <LogOut className="w-3.5 h-3.5" /> Sortir
      </button>
    </div>
  );
}
