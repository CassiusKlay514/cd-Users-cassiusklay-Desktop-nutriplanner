"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ArrowRightLeft, Loader2, Plus, Trash2, UserPlus, Users,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { defaultDietPrefs, estimateCalories } from "@/lib/utils";
import type { FamilyRole, UserProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

const ROLES: { value: FamilyRole; label: string; emoji: string }[] = [
  { value: "adult", label: "Adulte", emoji: "🧑" },
  { value: "teen", label: "Ado", emoji: "🧒" },
  { value: "child", label: "Enfant", emoji: "👦" },
  { value: "baby", label: "Bébé", emoji: "👶" },
];

const COLORS = ["#16a34a", "#f97316", "#3b82f6", "#a855f7", "#ec4899", "#14b8a6"];
const EMOJIS = ["🧑", "👩", "👨", "🧒", "👦", "👧", "👶", "🧓"];

export default function FamilyPage() {
  const router = useRouter();
  const profile = useStore((s) => s.profile);
  const family = useStore((s) => s.familyMembers);
  const hasHydrated = useStore((s) => s.hasHydrated);
  const addMember = useStore((s) => s.addFamilyMember);
  const switchToMember = useStore((s) => s.switchToMember);
  const removeMember = useStore((s) => s.removeFamilyMember);
  const updateMember = useStore((s) => s.updateFamilyMember);

  const [addingOpen, setAddingOpen] = useState(false);

  if (!hasHydrated) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!profile) {
    return (
      <div className="px-5 py-20 text-center">
        <p>Créez d'abord votre profil.</p>
      </div>
    );
  }

  return (
    <div className="px-5 py-6 md:px-10 md:py-10 max-w-3xl mx-auto pb-28">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1 text-sm text-gray-600 mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Retour
      </button>

      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
          <Users className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ma famille</h1>
          <p className="text-sm text-gray-500">
            {family.length + 1} membre{family.length > 0 ? "s" : ""} configuré{family.length > 0 ? "s" : ""}
          </p>
        </div>
      </div>

      <p className="text-sm text-gray-600 mt-4">
        Ajoutez chaque membre du foyer avec ses propres allergies, objectifs et préférences.
        Vous pouvez basculer entre les profils en un clic depuis le menu.
      </p>

      {/* Profil actif */}
      <div className="mt-6">
        <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-2">
          Profil actif
        </div>
        <MemberCard member={profile} active />
      </div>

      {/* Autres membres */}
      {family.length > 0 && (
        <div className="mt-6">
          <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-2">
            Autres membres
          </div>
          <div className="space-y-2">
            {family.map((m) => (
              <MemberCard
                key={m.id}
                member={m}
                onSwitch={() => switchToMember(m.id!)}
                onRemove={() => removeMember(m.id!)}
                onUpdate={(patch) => updateMember(m.id!, patch)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Bouton + */}
      <button
        onClick={() => setAddingOpen(true)}
        className="mt-6 w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-primary/10 text-primary font-semibold border-2 border-dashed border-primary/40"
      >
        <UserPlus className="w-4 h-4" />
        Ajouter un membre
      </button>

      {addingOpen && (
        <AddMemberModal
          onClose={() => setAddingOpen(false)}
          onAdd={(member) => { addMember(member); setAddingOpen(false); }}
        />
      )}
    </div>
  );
}

function MemberCard({
  member, active, onSwitch, onRemove, onUpdate,
}: {
  member: UserProfile;
  active?: boolean;
  onSwitch?: () => void;
  onRemove?: () => void;
  onUpdate?: (patch: Partial<UserProfile>) => void;
}) {
  const role = ROLES.find((r) => r.value === member.role) ?? ROLES[0];
  const emoji = member.avatarEmoji ?? role.emoji;
  const color = member.color ?? "#16a34a";

  return (
    <div className={cn(
      "rounded-2xl border p-4 flex items-center gap-3",
      active ? "bg-primary/5 border-primary/30" : "bg-white border-gray-200"
    )}>
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
        style={{ backgroundColor: color + "22", color }}
      >
        {emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-base">{member.name}</div>
        <div className="text-xs text-gray-500">
          {role.label} · {member.age} ans · {member.caloriesTarget} kcal
          {member.dietPrefs?.allergies?.length ? ` · ${member.dietPrefs.allergies.length} allergie(s)` : ""}
        </div>
      </div>
      <div className="flex flex-col gap-1 shrink-0">
        {!active && onSwitch && (
          <button
            onClick={onSwitch}
            className="px-3 py-1.5 rounded-full bg-primary text-white text-xs font-bold"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 inline" /> Activer
          </button>
        )}
        {!active && onRemove && (
          <button
            onClick={() => {
              if (confirm(`Supprimer ${member.name} ?`)) onRemove();
            }}
            className="px-3 py-1.5 rounded-full bg-red-50 text-red-600 text-xs font-bold"
          >
            <Trash2 className="w-3 h-3 inline" />
          </button>
        )}
      </div>
    </div>
  );
}

function AddMemberModal({
  onClose, onAdd,
}: { onClose: () => void; onAdd: (m: Omit<UserProfile, "id">) => void }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState<FamilyRole>("adult");
  const [age, setAge] = useState(30);
  const [sex, setSex] = useState<"male" | "female" | "other">("other");
  const [weightKg, setWeightKg] = useState(60);
  const [heightCm, setHeightCm] = useState(170);
  const [emoji, setEmoji] = useState("🧑");
  const [color, setColor] = useState(COLORS[1]);

  const calories = useMemo(
    () => estimateCalories({ sex, age, weightKg, heightCm, activity: "moderate", goal: "maintain" }),
    [sex, age, weightKg, heightCm]
  );

  const submit = () => {
    if (!name.trim()) return;
    onAdd({
      name: name.trim(),
      age, sex, weightKg, heightCm,
      role,
      avatarEmoji: emoji,
      color,
      activity: role === "baby" || role === "child" ? "light" : "moderate",
      goal: "improve_health",
      caloriesTarget: role === "baby" ? 800 : role === "child" ? 1600 : calories,
      dietPrefs: defaultDietPrefs(),
      onboardedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white w-full md:max-w-md md:rounded-3xl rounded-t-3xl p-5 max-h-[90vh] overflow-y-auto">
        <div className="md:hidden flex justify-center -mt-2 mb-2">
          <div className="w-10 h-1.5 rounded-full bg-gray-300" />
        </div>
        <h2 className="font-bold text-lg">Ajouter un membre</h2>
        <p className="text-sm text-gray-500 mb-4">Quelques infos basiques. Vous pourrez compléter ensuite.</p>

        <div className="space-y-3">
          <Field label="Prénom">
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: Léa"
              autoFocus
            />
          </Field>

          <Field label="Rôle">
            <div className="grid grid-cols-4 gap-2">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => {
                    setRole(r.value);
                    if (r.value === "baby") { setAge(1); setWeightKg(10); setHeightCm(75); }
                    else if (r.value === "child") { setAge(7); setWeightKg(25); setHeightCm(125); }
                    else if (r.value === "teen") { setAge(14); setWeightKg(50); setHeightCm(160); }
                    else { setAge(30); setWeightKg(70); setHeightCm(170); }
                  }}
                  className={cn(
                    "py-2.5 rounded-xl border text-xs font-semibold",
                    role === r.value ? "bg-primary text-white border-primary" : "bg-white border-gray-200 text-gray-700"
                  )}
                >
                  <div className="text-lg">{r.emoji}</div>
                  {r.label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Avatar">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={cn(
                    "shrink-0 w-11 h-11 rounded-xl border text-2xl flex items-center justify-center",
                    emoji === e ? "bg-primary/10 border-primary" : "bg-white border-gray-200"
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Couleur">
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "w-9 h-9 rounded-full border-2",
                    color === c ? "border-gray-900 scale-110" : "border-transparent"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </Field>

          <Field label={`Âge (${age} ans)`}>
            <input
              type="range"
              min={1}
              max={90}
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </Field>

          <div className="flex gap-3 mt-4">
            <button onClick={onClose} className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-700 font-semibold">
              Annuler
            </button>
            <button
              onClick={submit}
              disabled={!name.trim()}
              className="flex-1 py-3 rounded-2xl bg-primary text-white font-bold disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Ajouter
            </button>
          </div>
        </div>

        <style jsx global>{`
          .input { width:100%; padding:12px 14px; border-radius:12px; border:1px solid #e5e7eb; background:white; font-size:16px; outline:none; }
          .input:focus { border-color:#16a34a; box-shadow:0 0 0 3px rgb(22 163 74 / 0.15); }
        `}</style>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 mb-1.5">{label}</span>
      {children}
    </label>
  );
}
