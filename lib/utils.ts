import clsx, { ClassValue } from "clsx";
import type { DietPreferences } from "./dietPresets";
import type { Allergy, Diet, UserProfile } from "./types";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// Migration / valeurs par défaut pour DietPreferences
export function defaultDietPrefs(): DietPreferences {
  return {
    mainDiet: "omnivore",
    religiousDiet: "none",
    healthDiet: "none",
    exclusions: [],
    allergies: [],
    dislikes: [],
  };
}

// Si l'utilisateur a un ancien profil sans dietPrefs, on en construit un
export function ensureDietPrefs(profile: UserProfile): DietPreferences {
  if (profile.dietPrefs) return profile.dietPrefs;
  const legacy = profile;
  const prefs = defaultDietPrefs();
  if (legacy.diet === "vegetarian") prefs.mainDiet = "vegetarian";
  else if (legacy.diet === "vegan") prefs.mainDiet = "vegan";
  else if (legacy.diet === "pescetarian") prefs.mainDiet = "pescetarian";
  if (legacy.diet === "ketogenic") prefs.healthDiet = "ketogenic";
  else if (legacy.diet === "paleo") prefs.healthDiet = "paleo";
  if (legacy.diet === "gluten_free") prefs.exclusions.push("gluten");

  const allergyMap: Partial<Record<Allergy, DietPreferences["allergies"][number]>> = {
    dairy: "lactose", egg: "egg", gluten: "gluten", peanut: "peanut",
    seafood: "fish", shellfish: "shellfish", soy: "soy",
    tree_nut: "tree_nut", wheat: "gluten",
  };
  (legacy.allergies ?? []).forEach((a) => {
    const m = allergyMap[a];
    if (m && !prefs.allergies.includes(m)) prefs.allergies.push(m);
  });
  prefs.dislikes = legacy.dislikes ?? [];
  return prefs;
}

export function activityFactor(a: string) {
  switch (a) {
    case "sedentary": return 1.2;
    case "light": return 1.375;
    case "moderate": return 1.55;
    case "active": return 1.725;
    case "very_active": return 1.9;
    default: return 1.4;
  }
}

export function estimateCalories(p: {
  sex: string; age: number; weightKg: number; heightCm: number; activity: string; goal: string;
}) {
  const bmr = p.sex === "male"
    ? 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age + 5
    : 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age - 161;
  const tdee = bmr * activityFactor(p.activity);
  const adj =
    p.goal === "lose_weight" ? -400 :
    p.goal === "gain_muscle" ? 300 :
    p.goal === "sport_performance" ? 200 : 0;
  return Math.round((tdee + adj) / 10) * 10;
}

export function frenchDay(date: Date) {
  return date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

export function shortDay(date: Date) {
  return date.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" });
}

export function isoDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function fromIso(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// Traduction d'unités culinaires anglaises → FR + abrégées
const UNIT_FR: Record<string, string> = {
  "teaspoon": "c. à café", "teaspoons": "c. à café", "tsp": "c. à café", "ts": "c. à café",
  "tablespoon": "c. à soupe", "tablespoons": "c. à soupe", "tbsp": "c. à soupe", "tbs": "c. à soupe", "tb": "c. à soupe",
  "cup": "tasse", "cups": "tasses",
  "ounce": "g", "ounces": "g", "oz": "g",
  "pound": "g", "pounds": "g", "lb": "g", "lbs": "g",
  "fl oz": "ml", "fluid ounce": "ml", "fluid ounces": "ml",
  "pint": "ml", "pints": "ml",
  "quart": "L", "quarts": "L",
  "gallon": "L", "gallons": "L",
  "can": "boîte", "cans": "boîtes",
  "clove": "gousse", "cloves": "gousses",
  "slice": "tranche", "slices": "tranches",
  "pinch": "pincée", "pinches": "pincées",
  "dash": "trait", "dashes": "traits",
  "stick": "barre", "sticks": "barres",
  "bunch": "botte", "bunches": "bottes",
  "head": "tête", "heads": "têtes",
  "package": "paquet", "packages": "paquets", "pkg": "paquet",
  "large": "gros", "small": "petit", "medium": "moyen",
  "serving": "portion", "servings": "portions",
  "piece": "pièce", "pieces": "pièces",
  "leaf": "feuille", "leaves": "feuilles",
  "sprig": "brin", "sprigs": "brins",
};

const UNIT_CONVERT: Record<string, { factor: number; out: string }> = {
  "ounce": { factor: 28, out: "g" },
  "ounces": { factor: 28, out: "g" },
  "oz": { factor: 28, out: "g" },
  "pound": { factor: 454, out: "g" },
  "pounds": { factor: 454, out: "g" },
  "lb": { factor: 454, out: "g" },
  "lbs": { factor: 454, out: "g" },
  "fl oz": { factor: 30, out: "ml" },
  "pint": { factor: 470, out: "ml" },
  "quart": { factor: 950, out: "ml" },
  "gallon": { factor: 3800, out: "ml" },
};

export function translateUnit(unit: string | undefined): string {
  if (!unit) return "";
  const k = unit.toLowerCase().trim();
  return UNIT_FR[k] ?? unit;
}

export function formatAmountUnit(amount: number, unit: string | undefined): string {
  const k = (unit ?? "").toLowerCase().trim();
  if (UNIT_CONVERT[k]) {
    const conv = UNIT_CONVERT[k];
    const a = amount * conv.factor;
    return `${Math.round(a)} ${conv.out}`;
  }
  const fr = translateUnit(unit);
  const formatted =
    amount >= 100 ? String(Math.round(amount)) :
    amount >= 10 ? amount.toFixed(0) :
    amount >= 1 ? amount.toFixed(1) :
    amount.toFixed(2);
  return `${formatted} ${fr}`.trim();
}
