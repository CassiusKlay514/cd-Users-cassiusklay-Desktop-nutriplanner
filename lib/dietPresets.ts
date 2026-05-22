// ============================================================
// NutriPlanner — Système de régimes alimentaires complet
// ============================================================

export type MainDiet =
  | "omnivore"
  | "vegetarian"
  | "vegan"
  | "pescetarian"
  | "flexitarian";

export type ReligiousDiet =
  | "none"
  | "halal"
  | "kosher"
  | "hindu_no_beef"
  | "buddhist"
  | "jain";

export type HealthDiet =
  | "none"
  | "ketogenic"
  | "paleo"
  | "mediterranean"
  | "low_fodmap"
  | "diabetes"
  | "cholesterol"
  | "dash";

export type ExclusionTag =
  | "pork" | "beef" | "red_meat" | "all_meat" | "fish" | "shellfish"
  | "alcohol" | "gluten" | "lactose" | "egg" | "soy"
  | "tree_nut" | "peanut" | "added_sugar" | "sesame";

export type AllergyTag = ExclusionTag; // mêmes valeurs, sévérité différente

export interface DietPreferences {
  mainDiet: MainDiet;
  religiousDiet: ReligiousDiet;
  healthDiet: HealthDiet;
  exclusions: ExclusionTag[]; // « je ne mange pas »
  allergies: AllergyTag[];     // « je ne tolère pas du tout »
  dislikes: string[];          // liste libre, ex: « coriandre, foie »
}

export const MAIN_DIETS: { value: MainDiet; label: string; desc: string }[] = [
  { value: "omnivore", label: "Omnivore", desc: "Je mange de tout" },
  { value: "vegetarian", label: "Végétarien", desc: "Pas de viande ni poisson" },
  { value: "vegan", label: "Végan", desc: "Aucun produit animal" },
  { value: "pescetarian", label: "Pescétarien", desc: "Poisson oui, viande non" },
  { value: "flexitarian", label: "Flexitarien", desc: "Peu de viande" },
];

export const RELIGIOUS_DIETS: { value: ReligiousDiet; label: string; desc?: string }[] = [
  { value: "none", label: "Aucun" },
  { value: "halal", label: "Halal", desc: "Pas de porc ni alcool" },
  { value: "kosher", label: "Casher", desc: "Pas de porc ni fruits de mer" },
  { value: "hindu_no_beef", label: "Sans bœuf (hindouisme)" },
  { value: "buddhist", label: "Bouddhiste", desc: "Souvent végétarien" },
  { value: "jain", label: "Jaïn", desc: "Sans viande, œuf, racines" },
];

export const HEALTH_DIETS: { value: HealthDiet; label: string; desc?: string }[] = [
  { value: "none", label: "Aucun" },
  { value: "ketogenic", label: "Cétogène", desc: "Très peu de glucides" },
  { value: "paleo", label: "Paléo", desc: "Aliments non transformés" },
  { value: "mediterranean", label: "Méditerranéen", desc: "Légumes, poisson, huile olive" },
  { value: "low_fodmap", label: "Low FODMAP", desc: "Confort intestinal" },
  { value: "diabetes", label: "Diabète", desc: "Index glycémique bas" },
  { value: "cholesterol", label: "Cholestérol", desc: "Peu de graisses saturées" },
  { value: "dash", label: "DASH (hypertension)", desc: "Peu de sel" },
];

export const EXCLUSIONS: { value: ExclusionTag; label: string }[] = [
  { value: "pork", label: "Sans porc" },
  { value: "beef", label: "Sans bœuf" },
  { value: "red_meat", label: "Sans viande rouge" },
  { value: "all_meat", label: "Sans viande" },
  { value: "fish", label: "Sans poisson" },
  { value: "shellfish", label: "Sans crustacés" },
  { value: "alcohol", label: "Sans alcool" },
  { value: "gluten", label: "Sans gluten" },
  { value: "lactose", label: "Sans lactose" },
  { value: "egg", label: "Sans œuf" },
  { value: "soy", label: "Sans soja" },
  { value: "tree_nut", label: "Sans fruits à coque" },
  { value: "peanut", label: "Sans cacahuète" },
  { value: "added_sugar", label: "Sans sucre ajouté" },
  { value: "sesame", label: "Sans sésame" },
];

export const ALLERGIES: { value: AllergyTag; label: string }[] = [
  { value: "gluten", label: "Gluten" },
  { value: "lactose", label: "Lactose / produits laitiers" },
  { value: "egg", label: "Œuf" },
  { value: "peanut", label: "Cacahuète" },
  { value: "tree_nut", label: "Fruits à coque" },
  { value: "soy", label: "Soja" },
  { value: "shellfish", label: "Crustacés" },
  { value: "fish", label: "Poisson" },
  { value: "sesame", label: "Sésame" },
];

// ============================================================
// Mapping vers Spoonacular
// ============================================================

const MAIN_DIET_SPOON: Record<MainDiet, string> = {
  omnivore: "",
  vegetarian: "vegetarian",
  vegan: "vegan",
  pescetarian: "pescetarian",
  flexitarian: "",
};

const HEALTH_DIET_SPOON: Record<HealthDiet, string> = {
  none: "",
  ketogenic: "ketogenic",
  paleo: "paleo",
  mediterranean: "mediterranean",
  low_fodmap: "low fodmap",
  diabetes: "",
  cholesterol: "",
  dash: "",
};

const ALLERGY_SPOON: Record<AllergyTag, string> = {
  pork: "",
  beef: "",
  red_meat: "",
  all_meat: "",
  fish: "seafood",
  shellfish: "shellfish",
  alcohol: "",
  gluten: "gluten",
  lactose: "dairy",
  egg: "egg",
  soy: "soy",
  tree_nut: "tree nut",
  peanut: "peanut",
  added_sugar: "",
  sesame: "sesame",
};

// Ingrédients à exclure selon le tag
const EXCLUSION_INGREDIENTS: Record<ExclusionTag, string[]> = {
  pork: ["pork", "bacon", "ham", "lard", "pancetta", "prosciutto", "chorizo", "sausage"],
  beef: ["beef", "veal", "steak"],
  red_meat: ["beef", "veal", "lamb", "pork", "venison"],
  all_meat: ["beef", "pork", "chicken", "turkey", "lamb", "duck", "veal", "ham", "bacon", "sausage"],
  fish: ["fish", "salmon", "tuna", "cod", "trout", "sardine", "anchovy"],
  shellfish: ["shrimp", "lobster", "crab", "mussel", "oyster", "clam", "prawn"],
  alcohol: ["wine", "beer", "rum", "vodka", "whiskey", "champagne", "liquor", "brandy"],
  gluten: ["flour", "bread", "pasta", "wheat", "barley", "rye"],
  lactose: ["milk", "cheese", "butter", "cream", "yogurt"],
  egg: ["egg"],
  soy: ["soy", "tofu", "edamame", "soybean", "tempeh"],
  tree_nut: ["almond", "walnut", "cashew", "pecan", "hazelnut", "pistachio"],
  peanut: ["peanut"],
  added_sugar: ["sugar", "syrup", "honey", "molasses"],
  sesame: ["sesame", "tahini"],
};

// Règles automatiques selon religion
const RELIGIOUS_AUTO_EXCLUDE: Record<ReligiousDiet, ExclusionTag[]> = {
  none: [],
  halal: ["pork", "alcohol"],
  kosher: ["pork", "shellfish"],
  hindu_no_beef: ["beef"],
  buddhist: ["all_meat"],
  jain: ["all_meat", "egg"],
};

// ============================================================
// Helpers
// ============================================================

export function buildSpoonacularQuery(prefs: DietPreferences): {
  diet: string;
  intolerances: string;
  excludeIngredients: string;
} {
  // Diet : on prend health prioritaire (keto/paleo bloque), sinon main
  const diet =
    HEALTH_DIET_SPOON[prefs.healthDiet] ||
    MAIN_DIET_SPOON[prefs.mainDiet] ||
    "";

  // Intolerances : allergies prioritairement (sévère)
  const intolerances = prefs.allergies
    .map((a) => ALLERGY_SPOON[a])
    .filter(Boolean)
    .join(",");

  // Exclusions : religion + perso + dislikes
  const tagsAuto = RELIGIOUS_AUTO_EXCLUDE[prefs.religiousDiet];
  const allTags = new Set<ExclusionTag>([...tagsAuto, ...prefs.exclusions]);
  const ingredients = new Set<string>();
  for (const tag of allTags) {
    EXCLUSION_INGREDIENTS[tag]?.forEach((i) => ingredients.add(i));
  }
  prefs.dislikes.forEach((d) => d.trim() && ingredients.add(d.trim()));
  const excludeIngredients = Array.from(ingredients).join(",");

  return { diet, intolerances, excludeIngredients };
}

// Pour affichage humain
export function dietSummary(prefs: DietPreferences): string {
  const parts: string[] = [];
  const main = MAIN_DIETS.find((d) => d.value === prefs.mainDiet);
  if (main && prefs.mainDiet !== "omnivore") parts.push(main.label);
  const rel = RELIGIOUS_DIETS.find((d) => d.value === prefs.religiousDiet);
  if (rel && prefs.religiousDiet !== "none") parts.push(rel.label);
  const health = HEALTH_DIETS.find((d) => d.value === prefs.healthDiet);
  if (health && prefs.healthDiet !== "none") parts.push(health.label);
  if (prefs.exclusions.length) parts.push(`${prefs.exclusions.length} exclusion${prefs.exclusions.length > 1 ? "s" : ""}`);
  if (prefs.allergies.length) parts.push(`${prefs.allergies.length} allergie${prefs.allergies.length > 1 ? "s" : ""}`);
  return parts.length ? parts.join(" · ") : "Aucune restriction";
}
