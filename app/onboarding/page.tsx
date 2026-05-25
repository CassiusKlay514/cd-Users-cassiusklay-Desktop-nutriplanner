"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { defaultDietPrefs, estimateCalories } from "@/lib/utils";
import {
  ALLERGIES, EXCLUSIONS, HEALTH_DIETS, MAIN_DIETS, RELIGIOUS_DIETS,
  type AllergyTag, type ExclusionTag, type DietPreferences,
  type HealthDiet, type MainDiet, type ReligiousDiet,
} from "@/lib/dietPresets";
import MultiChips from "@/components/MultiChips";
import type { Goal, UserProfile } from "@/lib/types";
import {
  Activity, Apple, ArrowLeft, ArrowRight, Check, Leaf, Loader2, Mail,
  ShieldAlert, Target, User as UserIcon, UtensilsCrossed,
} from "lucide-react";
import { createClient, supabaseEnabled } from "@/lib/supabase/client";

const STEPS = ["welcome", "identity", "physical", "activity", "goal", "diet", "restrictions", "summary"] as const;
type Step = (typeof STEPS)[number];

const GOAL_OPTIONS: { value: Goal; label: string; desc: string }[] = [
  { value: "lose_weight", label: "Perdre du poids", desc: "Déficit calorique progressif" },
  { value: "maintain", label: "Maintenir mon poids", desc: "Stabilité et équilibre" },
  { value: "gain_muscle", label: "Prendre du muscle", desc: "Surplus protéiné" },
  { value: "improve_health", label: "Améliorer ma santé", desc: "Alimentation plus saine" },
  { value: "sport_performance", label: "Performance sportive", desc: "Énergie et récupération" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const setProfile = useStore((s) => s.setProfile);

  const [step, setStep] = useState<Step>("welcome");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [sendingMagic, setSendingMagic] = useState(false);
  const [magicSent, setMagicSent] = useState(false);
  const [age, setAge] = useState(30);
  const [sex, setSex] = useState<"male" | "female" | "other">("male");
  const [weightKg, setWeightKg] = useState(70);
  const [heightCm, setHeightCm] = useState(175);
  const [activity, setActivity] = useState<UserProfile["activity"]>("moderate");
  const [goal, setGoal] = useState<Goal>("maintain");
  const [dietPrefs, setDietPrefs] = useState<DietPreferences>(defaultDietPrefs());
  const [dislikesText, setDislikesText] = useState("");

  const idx = STEPS.indexOf(step);
  const progress = ((idx + 1) / STEPS.length) * 100;

  const calories = useMemo(
    () => estimateCalories({ sex, age, weightKg, heightCm, activity, goal }),
    [sex, age, weightKg, heightCm, activity, goal]
  );

  const next = () => setStep(STEPS[Math.min(idx + 1, STEPS.length - 1)]);
  const back = () => setStep(STEPS[Math.max(idx - 1, 0)]);

  const finish = async () => {
    const profile: UserProfile = {
      name: name.trim() || "Toi",
      age, sex, weightKg, heightCm, activity, goal,
      caloriesTarget: calories,
      dietPrefs: {
        ...dietPrefs,
        dislikes: dislikesText.split(",").map((s) => s.trim()).filter(Boolean),
      },
      onboardedAt: new Date().toISOString(),
    };
    setProfile(profile);

    // Si email + Supabase configuré, envoie le magic link puis affiche un écran de confirmation
    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail && cleanEmail.includes("@") && supabaseEnabled()) {
      setSendingMagic(true);
      try {
        const supabase = createClient();
        const { error } = await supabase.auth.signInWithOtp({
          email: cleanEmail,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/plan`,
          },
        });
        if (!error) {
          setMagicSent(true);
          setSendingMagic(false);
          return;
        }
      } catch {
        // ignore, on continue sans auth
      }
      setSendingMagic(false);
    }

    router.push("/plan");
  };

  const updatePrefs = <K extends keyof DietPreferences>(k: K, v: DietPreferences[K]) =>
    setDietPrefs((p) => ({ ...p, [k]: v }));

  if (magicSent) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 max-w-md mx-auto text-center">
        <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mb-4">
          <Mail className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold">Email envoyé !</h1>
        <p className="text-gray-600 mt-2 text-sm">
          Un lien de connexion vient d'être envoyé à <strong>{email}</strong>.
          Cliquez dessus pour activer la synchronisation de vos données.
        </p>
        <p className="text-xs text-gray-400 mt-3">
          Pas reçu après 1 min, vérifiez vos spams.
        </p>
        <button
          onClick={() => router.push("/plan")}
          className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-full bg-primary text-white font-semibold"
        >
          Continuer sans attendre
          <ArrowRight className="w-4 h-4" />
        </button>
        <p className="text-xs text-gray-400 mt-3 max-w-xs">
          Vos données sont déjà sauvegardées localement.
          L'activation du lien permet juste de les retrouver sur d'autres appareils.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col px-5 py-6 md:px-10 md:py-10 max-w-2xl mx-auto w-full">
      <div className="flex items-center gap-2 mb-6">
        <Leaf className="w-6 h-6 text-primary" />
        <span className="font-bold">NutriPlanner</span>
      </div>

      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mb-8">
        <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex-1 pb-32">
        {step === "welcome" && (
          <StepBox icon={<Leaf className="w-7 h-7" />} title="Bienvenue 👋" subtitle="Quelques questions pour construire votre plan sur mesure.">
            <Field label="Votre prénom">
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Marie" autoFocus />
            </Field>
            <Field label="Votre email (recommandé)">
              <input
                className="input"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
              />
              <p className="text-xs text-gray-500 mt-1.5 flex items-start gap-1.5">
                <Mail className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
                Pour retrouver votre plan, vos recettes notées et votre garde-manger
                sur tous vos appareils. Aucun mot de passe, un simple lien par email.
              </p>
            </Field>
          </StepBox>
        )}

        {step === "identity" && (
          <StepBox icon={<UserIcon className="w-7 h-7" />} title="Vous, en bref">
            <Field label="Âge">
              <NumberInput value={age} onChange={setAge} min={14} max={100} suffix="ans" />
            </Field>
            <Field label="Sexe biologique">
              <Segmented<typeof sex>
                value={sex}
                onChange={setSex}
                options={[
                  { value: "female", label: "Femme" },
                  { value: "male", label: "Homme" },
                  { value: "other", label: "Autre" },
                ]}
              />
            </Field>
          </StepBox>
        )}

        {step === "physical" && (
          <StepBox icon={<UserIcon className="w-7 h-7" />} title="Morphologie">
            <Field label="Poids">
              <NumberInput value={weightKg} onChange={setWeightKg} min={30} max={250} suffix="kg" />
            </Field>
            <Field label="Taille">
              <NumberInput value={heightCm} onChange={setHeightCm} min={120} max={230} suffix="cm" />
            </Field>
          </StepBox>
        )}

        {step === "activity" && (
          <StepBox icon={<Activity className="w-7 h-7" />} title="Niveau d'activité">
            <RadioCards
              value={activity}
              onChange={(v) => setActivity(v as UserProfile["activity"])}
              options={[
                { value: "sedentary", label: "Sédentaire", desc: "Travail assis, peu d'activité" },
                { value: "light", label: "Léger", desc: "Marche ou sport 1–2x / semaine" },
                { value: "moderate", label: "Modéré", desc: "Sport 3–5x / semaine" },
                { value: "active", label: "Actif", desc: "Sport intensif 6–7x / semaine" },
                { value: "very_active", label: "Très actif", desc: "Athlète, sport quotidien" },
              ]}
            />
          </StepBox>
        )}

        {step === "goal" && (
          <StepBox icon={<Target className="w-7 h-7" />} title="Votre objectif principal">
            <RadioCards value={goal} onChange={(v) => setGoal(v as Goal)} options={GOAL_OPTIONS} />
            <div className="mt-4 p-3 rounded-xl bg-primary/10 text-primary text-sm">
              Cible estimée : <strong>{calories} kcal / jour</strong>
            </div>
          </StepBox>
        )}

        {step === "diet" && (
          <StepBox icon={<UtensilsCrossed className="w-7 h-7" />} title="Votre régime" subtitle="Choisissez ce qui vous correspond.">
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
            <Field label="Régime santé spécifique (optionnel)">
              <RadioCards
                value={dietPrefs.healthDiet}
                onChange={(v) => updatePrefs("healthDiet", v as HealthDiet)}
                options={HEALTH_DIETS.map((d) => ({ value: d.value, label: d.label, desc: d.desc }))}
              />
            </Field>
          </StepBox>
        )}

        {step === "restrictions" && (
          <StepBox icon={<Apple className="w-7 h-7" />} title="Restrictions" subtitle="Ce que vous ne mangez pas et vos allergies.">
            <Field label="Je ne mange pas…">
              <MultiChips<ExclusionTag>
                options={EXCLUSIONS}
                value={dietPrefs.exclusions}
                onChange={(v) => updatePrefs("exclusions", v)}
              />
            </Field>
            <Field label="Allergies sévères">
              <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
                Aucune trace ne sera tolérée dans les recettes.
              </p>
              <MultiChips<AllergyTag>
                options={ALLERGIES}
                value={dietPrefs.allergies}
                onChange={(v) => updatePrefs("allergies", v)}
              />
            </Field>
            <Field label="Ingrédients à éviter (optionnel)">
              <input
                className="input"
                value={dislikesText}
                onChange={(e) => setDislikesText(e.target.value)}
                placeholder="ex: coriandre, foie"
              />
              <span className="text-xs text-gray-500 mt-1 block">Séparez par des virgules.</span>
            </Field>
          </StepBox>
        )}

        {step === "summary" && (
          <StepBox icon={<Check className="w-7 h-7" />} title="Tout est prêt !" subtitle="Récap de votre profil.">
            <div className="space-y-2 text-sm">
              <Row k="Prénom" v={name || "·"} />
              <Row k="Âge" v={`${age} ans`} />
              <Row k="Morphologie" v={`${weightKg} kg · ${heightCm} cm`} />
              <Row k="Activité" v={activity} />
              <Row k="Objectif" v={GOAL_OPTIONS.find((g) => g.value === goal)?.label ?? goal} />
              <Row k="Cible quotidienne" v={`${calories} kcal`} />
              <Row k="Régime principal" v={MAIN_DIETS.find((d) => d.value === dietPrefs.mainDiet)?.label ?? "·"} />
              <Row k="Régime religieux" v={RELIGIOUS_DIETS.find((d) => d.value === dietPrefs.religiousDiet)?.label ?? "Aucun"} />
              <Row k="Régime santé" v={HEALTH_DIETS.find((d) => d.value === dietPrefs.healthDiet)?.label ?? "Aucun"} />
              <Row k="Exclusions" v={dietPrefs.exclusions.length ? `${dietPrefs.exclusions.length} choisies` : "aucune"} />
              <Row k="Allergies sévères" v={dietPrefs.allergies.length ? `${dietPrefs.allergies.length} cochées` : "aucune"} />
            </div>
          </StepBox>
        )}
      </div>

      <div className="fixed bottom-0 inset-x-0 z-30 px-5 py-3 bg-background/95 backdrop-blur border-t border-gray-200">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={back} disabled={idx === 0} className="px-4 py-2.5 rounded-full text-gray-600 disabled:opacity-30 flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
          {step === "summary" ? (
            <button
              onClick={finish}
              disabled={sendingMagic}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-primary text-white font-semibold shadow-lg shadow-primary/30 active:scale-95 disabled:opacity-60"
            >
              {sendingMagic ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Envoi du lien...
                </>
              ) : (
                <>
                  Lancer mon plan
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          ) : (
            <button onClick={next} disabled={step === "welcome" && !name.trim()} className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-primary text-white font-semibold shadow-lg shadow-primary/30 active:scale-95 disabled:opacity-40 disabled:shadow-none">
              Continuer <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

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

function StepBox({
  icon, title, subtitle, children,
}: { icon: React.ReactNode; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">{icon}</div>
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
      <div className="mt-6 space-y-4">{children}</div>
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
  value, onChange, options,
}: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`py-3 rounded-xl border text-sm font-semibold ${value === o.value ? "bg-primary text-white border-primary" : "bg-white border-gray-200 text-gray-700"}`}
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
            <div className="flex items-center justify-between gap-3">
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

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-gray-500">{k}</span>
      <span className="font-medium">{v}</span>
    </div>
  );
}
