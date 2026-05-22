import type { DietPreferences } from "./dietPresets";

export type Goal =
  | "lose_weight"
  | "maintain"
  | "gain_muscle"
  | "improve_health"
  | "sport_performance";

// Conservé pour compat ascendante (anciens utilisateurs en localStorage)
export type Diet =
  | "none"
  | "vegetarian"
  | "vegan"
  | "pescetarian"
  | "ketogenic"
  | "paleo"
  | "gluten_free";

export type Allergy =
  | "dairy"
  | "egg"
  | "gluten"
  | "peanut"
  | "seafood"
  | "shellfish"
  | "soy"
  | "tree_nut"
  | "wheat";

export type MealMoment = "breakfast" | "lunch" | "dinner";

export type FamilyRole = "adult" | "teen" | "child" | "baby";

export interface UserProfile {
  id?: string;                  // injecté à la création
  role?: FamilyRole;            // adulte / ado / enfant / bébé
  avatarEmoji?: string;         // un emoji par membre
  color?: string;               // accent visuel
  name: string;
  age: number;
  sex: "male" | "female" | "other";
  weightKg: number;
  heightCm: number;
  activity: "sedentary" | "light" | "moderate" | "active" | "very_active";
  goal: Goal;
  caloriesTarget: number;
  // Nouveau système de préférences alimentaires
  dietPrefs: DietPreferences;
  // Champs legacy conservés pour compat (peuvent être déduits de dietPrefs)
  diet?: Diet;
  allergies?: Allergy[];
  dislikes?: string[];
  // Inventaire "déjà chez moi" pour la liste de courses
  pantryItems?: string[];
  onboardedAt: string;
}

export interface SpoonacularRecipe {
  id: number;
  title: string;
  image: string;
  imageType?: string;
  readyInMinutes?: number;
  servings?: number;
  nutrition?: {
    nutrients: { name: string; amount: number; unit: string }[];
  };
}

export interface RecipeDetail extends SpoonacularRecipe {
  summary?: string;
  instructions?: string;
  extendedIngredients?: {
    id: number;
    name: string;
    original: string;
    amount: number;
    unit: string;
    aisle?: string;
  }[];
  diets?: string[];
  dishTypes?: string[];
  sourceUrl?: string;
}

export interface PlannedMeal {
  date: string;
  moment: MealMoment;
  recipeId: number;
  title: string;
  image: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  readyInMinutes?: number;
  // Personnalisation Picnic-style
  servings?: number;            // override des portions
  excludedIngredientIds?: number[]; // « j'ai déjà »
  consumed?: boolean;           // « j'ai mangé ce repas »
  rating?: number;              // 1-5 étoiles
  note?: string;                // commentaire libre
  skipped?: boolean;            // skippé (pour plan adaptatif)
  guestCount?: number;          // mode invités : nb de personnes ce repas
}

export interface PastPlan {
  id: string;
  startDate: string;
  endDate: string;
  mealsCount: number;
  archivedAt: string;
  notes?: string;
  averageRating?: number;
  // On garde une version compressée pour pouvoir recharger
  serialized: string;
}

export interface PantryItem {
  id: string;
  name: string;
  category?: "pantry" | "spice" | "fresh" | "cold" | "frozen";
  emoji?: string;
  addedAt: string;
}

export interface WeightLog {
  date: string;
  kg: number;
}

export interface MealHistoryEntry {
  recipeId: number;
  title: string;
  rating?: number;
  consumed: boolean;
  skipped: boolean;
  swapped: boolean;
  date: string;
}

export interface CustomShoppingItem {
  id: string;
  name: string;
  category: "hygiene" | "household" | "baby" | "drinks" | "snacks" | "alcohol" | "pet" | "other";
  emoji?: string;
  quantity: number;
  unit?: string;
  checked: boolean;
  addedAt: string;
}

export interface MealPlan {
  id: string;
  startDate: string;
  endDate: string;
  meals: PlannedMeal[];
  createdAt: string;
  notes?: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  amount: number;
  unit: string;
  aisle: string;
  checked: boolean;
  recipeIds: number[];
  // Nouveaux champs Pass 2
  category?: "pantry" | "fresh" | "cold" | "frozen" | "spice";
  optional?: boolean;
  packSize?: { amount: number; unit: string; label: string };
  leftoverRatio?: number;
}
