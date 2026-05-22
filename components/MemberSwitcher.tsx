"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, Settings, Users } from "lucide-react";
import { useStore } from "@/lib/store";
import { createClient, supabaseEnabled } from "@/lib/supabase/client";

export default function MemberSwitcher() {
  const profile = useStore((s) => s.profile);
  const family = useStore((s) => s.familyMembers);
  const switchToMember = useStore((s) => s.switchToMember);
  const clearAll = useStore((s) => s.clearAll);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const signOut = async () => {
    if (supabaseEnabled()) {
      try { await createClient().auth.signOut(); } catch { /* ignore */ }
    }
    clearAll();
    setOpen(false);
    router.push("/");
  };

  if (!profile) return null;

  const emoji = profile.avatarEmoji ?? "🧑";
  const color = profile.color ?? "#16a34a";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full bg-gray-100 active:scale-95"
      >
        <span
          className="w-7 h-7 rounded-full flex items-center justify-center text-sm"
          style={{ backgroundColor: color + "33" }}
        >
          {emoji}
        </span>
        <span className="text-xs font-semibold max-w-[80px] truncate">{profile.name}</span>
        <ChevronDown className="w-3 h-3 text-gray-500" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full right-0 mt-1 z-50 w-60 bg-white border border-gray-200 rounded-2xl shadow-xl p-2">
            <div className="px-2 py-1 text-[10px] uppercase tracking-wide text-gray-500 font-semibold">
              Profil actif
            </div>
            <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-primary/5">
              <span className="w-8 h-8 rounded-full flex items-center justify-center text-base" style={{ backgroundColor: color + "33" }}>
                {emoji}
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{profile.name}</div>
                <div className="text-[10px] text-gray-500">{profile.caloriesTarget} kcal</div>
              </div>
            </div>

            {family.length > 0 && (
              <>
                <div className="px-2 mt-2 py-1 text-[10px] uppercase tracking-wide text-gray-500 font-semibold">
                  Autres membres
                </div>
                {family.map((m) => {
                  const c = m.color ?? "#999";
                  return (
                    <button
                      key={m.id}
                      onClick={() => { switchToMember(m.id!); setOpen(false); }}
                      className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-gray-100"
                    >
                      <span className="w-8 h-8 rounded-full flex items-center justify-center text-base" style={{ backgroundColor: c + "33" }}>
                        {m.avatarEmoji ?? "🧑"}
                      </span>
                      <div className="flex-1 text-left min-w-0">
                        <div className="font-semibold text-sm truncate">{m.name}</div>
                        <div className="text-[10px] text-gray-500">{m.caloriesTarget} kcal</div>
                      </div>
                    </button>
                  );
                })}
              </>
            )}

            <div className="mt-2 pt-2 border-t border-gray-100 space-y-0.5">
              <button
                onClick={() => { setOpen(false); router.push("/profile"); }}
                className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-gray-100 text-sm font-medium text-gray-700"
              >
                <Settings className="w-4 h-4" />
                Mon profil & paramètres
              </button>
              <button
                onClick={() => { setOpen(false); router.push("/family"); }}
                className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-gray-100 text-sm font-medium text-gray-700"
              >
                <Users className="w-4 h-4" />
                Gérer la famille
              </button>
              <button
                onClick={signOut}
                className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-red-50 text-sm font-medium text-red-600"
              >
                <LogOut className="w-4 h-4" />
                Se déconnecter
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
