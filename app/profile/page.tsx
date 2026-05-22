"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity, Apple, ArrowLeft, Check, Loader2, Save, ShieldAlert, Sparkles, Target, User as UserIcon, UtensilsCrossed,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { defaultDietPrefs, ensureDietPrefs, estimateCalories } from "@/lib/utils";
import {
  ALLERGIES, EXCLUSIONS, HEALTH_DIETS, MAIN_DIETS, RELIGIOUS_DIETS,
  type AllergyTag, type ExclusionTag, type HealthDiet, type MainDiet, type ReligiousDiet,
} from "@/lib/dietPresets";
import type { Goal, UserProfile } from "@/lib/types";
import MultiChips from "@/components/MultiChips";

const GOAL_OPTIONS: { value: Goal; label: string }[] = [
  { value: "lose_weight", label: "Perdre du poids" },
  { value: "maintain", label: "Maintenir mon poids" },
  { value: "gain_muscle", label: "Prendre du muscle" },
  { value: "improve_health", label: "Améliorer ma santé" },
  { value: "sport_performance", label: "Performance sportive" },
];

const ACTIVITY_OPTIONS = [
  { value: "sedentary", label: "Sédentaire" },
  { value: "light", label: "Léger" },
  { value: "moderate", label: "Modéré" },
  { value: "active", label: "Actif" },
  { value: "very_active", label: "Très actif" },
] as const;

export default function ProfilePage() {
  const router = useRouter();
  const storedProfile = useStore((s) => s.profile);
  const setProfile = useStore((s) => s.setProfile);
  const setPlan = useStore((s) => s.setPlan);
  const plan = useStore((s) => s.plan);
  const hasHydrated = useStore((s) => s.hasHydrated);

  const initial = useMemo<UserProfile>(
    () =>
      storedProfile ?? {
        name: "", age: 30, sex: "male", weightKg: 70, heightCm: 175,
        activity: "moderate", goal: "maintain", caloriesTarget: 2000,
        dietPrefs: defaultDietPrefs(),
        onboardedAt: new Date().toISOString(),
      },
    [storedProfile]
  );

  const [draft, setDraft] = useState<UserProfile>(initial);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [regenAsk, setRegenAsk] = useState(false);

  useEffect(() => {
    if (storedProfile) {
      const migrated = { ...storedProfile, dietPrefs: ensureDietPrefs(storedProfile) };
      setDraft(migrated);
    }
  }, [storedProfile]);

  useEffect(() => {
    if (hasHydrated && !storedProfile) router.push("/onboarding");
  }, [hasHydrated, storedProfile, router]);

  const dietPrefs = draft.dietPrefs ?? defaultDietPrefs();

  const autoKcal = useMemo(
    () => estimateCalories({
      sex: draft.sex, age: draft.age, weightKg: draft.weightKg,
      heightCm: draft.heightCm, activity: draft.activity, goal: draft.goal,
    }),
    [draft.sex, draft.age, draft.weightKg, draft.heightCm, draft.activity, draft.goal]
  );

  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);
  const physicalChanged =
    storedProfile &&
    (storedProfile.dietPrefs ?
      JSON.stringify(storedProfile.dietPrefs) !== JSON.stringify(dietPrefs) :
      true) ||
    storedProfile?.caloriesTarget !== draft.caloriesTarget;

  const update = <K extends keyof UserProfile>(key: K, v: UserProfile[K]) =>
    setDraft((d) => ({ ...d, [key]: v }));

  const updatePrefs = <K extends keyof typeof dietPrefs>(key: K, v: typeof dietPrefs[K]) =>
    setDraft((d) => ({ ...d, dietPrefs: { ...(d.dietPrefs ?? defaultDietPrefs()), [key]: v } }));

  const save = (regenerate: boolean) => {
    setSaving(true);
    const next: UserProfile = { ...draft, dietPrefs };
    setProfile(next);
    setSaving(false);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
    if (regenerate && plan) {
      setPlan(null);
      router.push("/plan");
    }
  };

  const handleSave = () => {
    if (plan && physicalChanged) {
      setRegenAsk(true);
    } else {
      save(false);
    }
  };

  if (!hasHydrated) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="px-5 py-6 md:px-10 md:py-10 max-w-2xl mx-auto pb-32">
      <div className="flex items-center justify-between gap-2 mb-6">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1 text-sm text-gray-600"
        >
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>
        {savedFlash && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
            <Check className="w-3.5 h-3.5" /> Enregistré
          </span>
        )}
      </div>

      <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Mon profil</h1>
      <p className="text-gray-600 text-sm mt-1">
        Vos infos servent à personnaliser votre plan et vos recettes.
      </p>

      {/* Identité */}
      <Section icon={<UserIcon className="w-4 h-4" />} title="Identité">
        <Field label="Prénom">
          <input
            className="input"
            value={draft.name}
            onChange={(e) => update("name", e.target.value)}
          />
        </Field>
        <Field label="Âge">
          <NumberInput value={draft.age} onChange={(v) => update("age", v)} min={14} max={100} suffix="ans" />
        </Field>
        <Field label="Sexe biologique">
          <Segmented<UserProfile["sex"]>
            value={draft.sex}
            onChange={(v) => update("sex", v)}
            options={[
              { value: "female", label: "Femme" },
              { value: "male", label: "Homme" },
              { value: "other", label: "Autre" },
            ]}
          />
        </Field>
      </Section>

      {/* Morphologie + activité */}
      <Section icon={<Activity className="w-4 h-4" />} title="Morphologie & activité">
        <Field label="Poids">
          <NumberInput value={draft.weightKg} onChange={(v) => update("weightKg", v)} min={30} max={250} suffix="kg" />
        </Field>
        <Field label="Taille">
          <NumberInput value={draft.heightCm} onChange={(v) => update("heightCm", v)} min={120} max={230} suffix="cm" />
        </Field>
        <Field label="Niveau d'activité">
          <Segmented
            value={draft.activity}
            onChange={(v) => update("activity", v)}
            options={ACTIVITY_OPTIONS}
            columns={5}
          />
        </Field>
      </Section>

      {/* Objectif */}
      <Section icon={<Target className="w-4 h-4" />} title="Objectif">
        <RadioCards
          value={draft.goal}
          onChange={(v) => update("goal", v as Goal)}
          options={GOAL_OPTIONS}
        />
        <Field label="Cible calorique journalière">
          <div className="flex items-center gap-2">
            <NumberInput
              value={draft.caloriesTarget}
              onChange={(v) => update("caloriesTarget", v)}
              min={1200}
              max={5000}
              suffix="kcal"
            />
            <button
              type="button"
              onClick={() => update("caloriesTarget", autoKcal)}
              className="text-xs font-semibold text-primary shrink-0 px-2"
            >
              Auto ({autoKcal})
            </button>
          </div>
        </Field>
      </Section>

      {/* Régime principal */}
      <Section icon={<UtensilsCrossed className="w-4 h-4" />} title="Régime alimentaire">
        <Field label="Régime principal">
          <RadioCards
            value={dietPrefs.mainDiet}
            onChange={(v) => updatePrefs("mainDiet", v as MainDiet)}
            options={MAIN_DIETS.map((d) => ({ value: d.value, label: d.label, desc: d.desc }))}
          />
        </Field>
        <Field label="Régime religieux ou éthique">
          <RadioCards
            value={dietPrefs.religiousDiet}
            onChange={(v) => updatePrefs("religiousDiet", v as ReligiousDiet)}
            options={RELIGIOUS_DIETS.map((d) => ({ value: d.value, label: d.label, desc: d.desc }))}
          />
        </Field>
        <Field label="Régime spécifique santé">
          <RadioCards
            value={dietPrefs.healthDiet}
            onChange={(v) => updatePrefs("healthDiet", v as HealthDiet)}
            options={HEALTH_DIETS.map((d) => ({ value: d.value, label: d.label, desc: d.desc }))}
          />
        </Field>
      </Section>

      {/* Exclusions personnalisées */}
      <Section icon={<Apple className="w-4 h-4" />} title="Je ne mange pas…" subtitle="Vous pouvez cocher plusieurs choix.">
        <MultiChips<ExclusionTag>
          options={EXCLUSIONS}
          value={dietPrefs.exclusions}
          onChange={(v) => updatePrefs("exclusions", v)}
        />
        <Field label="Ingrédients à éviter (libres)">
          <input
            className="input"
            value={(dietPrefs.dislikes ?? []).join(", ")}
            onChange={(e) =>
              updatePrefs("dislikes", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))
            }
            placeholder="ex: coriandre, champignons, foie"
          />
        </Field>
      </Section>

      {/* Allergies */}
      <Section
        icon={<ShieldAlert className="w-4 h-4" />}
        title="Allergies sévères"
        subtitle="Aucune trace ne sera tolérée dans les recettes."
      >
        <MultiChips<AllergyTag>
          options={ALLERGIES}
          value={dietPrefs.allergies}
          onChange={(v) => updatePrefs("allergies", v)}
        />
      </Section>

      {/* Action bar */}
      <div className="fixed bottom-16 md:bottom-4 inset-x-0 z-30 px-5">
        <div className="max-w-2xl mx-auto bg-white border border-gray-200 rounded-2xl shadow-xl shadow-black/5 p-3 flex gap-2">
          <button
            onClick={() => setDraft(initial)}
            disabled={!dirty || saving}
            className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold disabled:opacity-40"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={!dirty || saving}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-semibold disabled:opacity-40"
          >
            <Save className="w-4 h-4" />
            Enregistrer
          </button>
        </div>
      </div>

      {/* Regen modal */}
      {regenAsk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/50">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="font-bold text-lg">Régénérer votre plan ?</h2>
            <p className="text-sm text-gray-600 mt-1">
              Vos préférences ont changé. On peut régénérer votre plan pour qu'il les respecte.
            </p>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => { setRegenAsk(false); save(false); }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold"
              >
                Plus tard
              </button>
              <button
                onClick={() => { setRegenAsk(false); save(true); }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold"
              >
                Régénérer
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .input {
          width: 100%;
          padding: 12px 14px;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          background: white;
          font-size: 16px;
          outline: none;
        }
        .input:focus { border-color: #16a34a; box-shadow: 0 0 0 3px rgb(22 163 74 / 0.15); }
      `}</style>
    </div>
  );
}

function Section({
  icon, title, subtitle, children,
}: { icon: React.ReactNode; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="mt-7">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">{icon}</div>
        <h2 className="font-bold">{title}</h2>
      </div>
      {subtitle && <p className="text-xs text-gray-500 mb-3 -mt-2 ml-9">{subtitle}</p>}
      <div className="space-y-3">{children}</div>
    </section>
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

function NumberInput({
  value, onChange, min, max, suffix,
}: { value: number; onChange: (n: number) => void; min: number; max: number; suffix?: string }) {
  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} className="w-11 h-11 rounded-full bg-white border border-gray-200 font-bold text-lg">−</button>
      <div className="flex-1 text-center">
        <input
          type="number"
          className="input text-center font-semibold text-lg"
          value={value}
          min={min}
          max={max}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
        />
        {suffix && <div className="text-xs text-gray-500 mt-1">{suffix}</div>}
      </div>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} className="w-11 h-11 rounded-full bg-white border border-gray-200 font-bold text-lg">+</button>
    </div>
  );
}

function Segmented<T extends string>({
  value, onChange, options, columns,
}: { value: T; onChange: (v: T) => void; options: readonly { value: T; label: string }[]; columns?: number }) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${columns ?? options.length}, minmax(0, 1fr))` }}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`py-2.5 rounded-xl border text-xs font-semibold ${value === o.value ? "bg-primary text-white border-primary" : "bg-white border-gray-200 text-gray-700"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function RadioCards({
  value, onChange, options,
}: { value: string; onChange: (v: string) => void; options: { value: string; label: string; desc?: string }[] }) {
  return (
    <div className="space-y-2">
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`w-full text-left p-3.5 rounded-xl border transition ${active ? "bg-primary/5 border-primary" : "bg-white border-gray-200"}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-sm">{o.label}</div>
                {o.desc && <div className="text-xs text-gray-500 mt-0.5">{o.desc}</div>}
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${active ? "border-primary bg-primary" : "border-gray-300"}`}>
                {active && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
