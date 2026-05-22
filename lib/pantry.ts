// ============================================================
// NutriPlanner — Classification ingrédient → catégorie + pack
// ============================================================

export type IngredientCategory = "pantry" | "spice" | "fresh" | "cold" | "frozen";

interface PantryRule {
  category: IngredientCategory;
  optional: boolean; // peut-être déjà chez soi
  fr: string;        // nom français normalisé
  packs?: number[];  // tailles courantes en grammes/ml chez les retailers FR
  unit?: "g" | "ml" | "u";
}

// Table des 80 ingrédients les plus courants en cuisine. Match par mot-clé.
// L'ordre compte : on prend le premier match.
const TABLE: { keys: string[]; rule: PantryRule }[] = [
  // ── ÉPICES / AROMATES (toujours optionnel)
  { keys: ["salt"], rule: { category: "spice", optional: true, fr: "Sel", packs: [125, 250, 500], unit: "g" } },
  { keys: ["pepper", "poivre"], rule: { category: "spice", optional: true, fr: "Poivre", packs: [50, 100], unit: "g" } },
  { keys: ["cumin"], rule: { category: "spice", optional: true, fr: "Cumin", packs: [40, 80], unit: "g" } },
  { keys: ["paprika"], rule: { category: "spice", optional: true, fr: "Paprika", packs: [40, 80], unit: "g" } },
  { keys: ["cinnamon", "cannelle"], rule: { category: "spice", optional: true, fr: "Cannelle", packs: [40], unit: "g" } },
  { keys: ["oregano"], rule: { category: "spice", optional: true, fr: "Origan", packs: [10, 20], unit: "g" } },
  { keys: ["basil", "basilic"], rule: { category: "spice", optional: true, fr: "Basilic", packs: [10, 20], unit: "g" } },
  { keys: ["thyme", "thym"], rule: { category: "spice", optional: true, fr: "Thym", packs: [10, 20], unit: "g" } },
  { keys: ["bay leaves", "laurier"], rule: { category: "spice", optional: true, fr: "Laurier", packs: [10], unit: "g" } },
  { keys: ["garlic", "ail"], rule: { category: "spice", optional: true, fr: "Ail", packs: [50, 100], unit: "g" } },
  { keys: ["ginger", "gingembre"], rule: { category: "spice", optional: true, fr: "Gingembre", packs: [50, 100], unit: "g" } },
  { keys: ["curry"], rule: { category: "spice", optional: true, fr: "Curry", packs: [40, 80], unit: "g" } },
  { keys: ["nutmeg", "muscade"], rule: { category: "spice", optional: true, fr: "Muscade", packs: [40], unit: "g" } },
  { keys: ["chili", "piment"], rule: { category: "spice", optional: true, fr: "Piment", packs: [40], unit: "g" } },
  { keys: ["spice", "seasoning", "épice"], rule: { category: "spice", optional: true, fr: "Mélange d'épices", packs: [40], unit: "g" } },

  // ── PLACARD (optionnel)
  { keys: ["sugar", "sucre"], rule: { category: "pantry", optional: true, fr: "Sucre", packs: [500, 1000], unit: "g" } },
  { keys: ["brown sugar"], rule: { category: "pantry", optional: true, fr: "Sucre roux", packs: [500, 750], unit: "g" } },
  { keys: ["honey", "miel"], rule: { category: "pantry", optional: true, fr: "Miel", packs: [250, 500], unit: "g" } },
  { keys: ["flour", "farine"], rule: { category: "pantry", optional: true, fr: "Farine", packs: [1000], unit: "g" } },
  { keys: ["olive oil", "huile d'olive"], rule: { category: "pantry", optional: true, fr: "Huile d'olive", packs: [500, 750, 1000], unit: "ml" } },
  { keys: ["vegetable oil", "huile végétale", "oil"], rule: { category: "pantry", optional: true, fr: "Huile", packs: [500, 1000], unit: "ml" } },
  { keys: ["vinegar", "vinaigre"], rule: { category: "pantry", optional: true, fr: "Vinaigre", packs: [500, 750], unit: "ml" } },
  { keys: ["soy sauce", "sauce soja"], rule: { category: "pantry", optional: true, fr: "Sauce soja", packs: [150, 250], unit: "ml" } },
  { keys: ["mustard", "moutarde"], rule: { category: "pantry", optional: true, fr: "Moutarde", packs: [200, 350], unit: "g" } },
  { keys: ["ketchup"], rule: { category: "pantry", optional: true, fr: "Ketchup", packs: [340, 560], unit: "g" } },
  { keys: ["mayonnaise"], rule: { category: "pantry", optional: true, fr: "Mayonnaise", packs: [235, 470], unit: "g" } },
  { keys: ["baking powder", "levure"], rule: { category: "pantry", optional: true, fr: "Levure", packs: [10, 50], unit: "g" } },
  { keys: ["baking soda"], rule: { category: "pantry", optional: true, fr: "Bicarbonate", packs: [200], unit: "g" } },
  { keys: ["vanilla", "vanille"], rule: { category: "pantry", optional: true, fr: "Vanille", packs: [20], unit: "ml" } },
  { keys: ["broth", "stock", "bouillon"], rule: { category: "pantry", optional: true, fr: "Bouillon", packs: [500, 1000], unit: "ml" } },
  { keys: ["tomato sauce", "sauce tomate"], rule: { category: "pantry", optional: false, fr: "Sauce tomate", packs: [400, 750], unit: "g" } },
  { keys: ["canned tomatoes", "tomates en conserve"], rule: { category: "pantry", optional: false, fr: "Tomates pelées", packs: [400, 800], unit: "g" } },
  { keys: ["pasta", "pâtes"], rule: { category: "pantry", optional: false, fr: "Pâtes", packs: [500, 1000], unit: "g" } },
  { keys: ["rice", "riz"], rule: { category: "pantry", optional: false, fr: "Riz", packs: [500, 1000], unit: "g" } },
  { keys: ["quinoa"], rule: { category: "pantry", optional: false, fr: "Quinoa", packs: [400, 500], unit: "g" } },
  { keys: ["lentils", "lentilles"], rule: { category: "pantry", optional: false, fr: "Lentilles", packs: [500, 1000], unit: "g" } },
  { keys: ["beans", "haricots"], rule: { category: "pantry", optional: false, fr: "Haricots", packs: [400, 800], unit: "g" } },
  { keys: ["chickpeas", "pois chiches"], rule: { category: "pantry", optional: false, fr: "Pois chiches", packs: [400, 800], unit: "g" } },
  { keys: ["oats", "flocons"], rule: { category: "pantry", optional: false, fr: "Flocons d'avoine", packs: [500, 1000], unit: "g" } },
  { keys: ["breadcrumbs", "chapelure"], rule: { category: "pantry", optional: false, fr: "Chapelure", packs: [250], unit: "g" } },

  // ── FRAIS (Boucherie / Poissonnerie / Volaille)
  { keys: ["chicken breast", "blanc de poulet"], rule: { category: "cold", optional: false, fr: "Blanc de poulet", packs: [300, 600, 1000], unit: "g" } },
  { keys: ["chicken thigh", "cuisse de poulet"], rule: { category: "cold", optional: false, fr: "Cuisse de poulet", packs: [500, 1000], unit: "g" } },
  { keys: ["chicken", "poulet"], rule: { category: "cold", optional: false, fr: "Poulet", packs: [300, 600, 1000], unit: "g" } },
  { keys: ["beef", "boeuf"], rule: { category: "cold", optional: false, fr: "Bœuf", packs: [250, 500, 1000], unit: "g" } },
  { keys: ["ground beef", "boeuf haché"], rule: { category: "cold", optional: false, fr: "Bœuf haché", packs: [250, 500, 1000], unit: "g" } },
  { keys: ["pork", "porc"], rule: { category: "cold", optional: false, fr: "Porc", packs: [400, 800], unit: "g" } },
  { keys: ["bacon", "lardons"], rule: { category: "cold", optional: false, fr: "Lardons", packs: [200, 400], unit: "g" } },
  { keys: ["ham", "jambon"], rule: { category: "cold", optional: false, fr: "Jambon", packs: [200, 400], unit: "g" } },
  { keys: ["sausage", "saucisse"], rule: { category: "cold", optional: false, fr: "Saucisse", packs: [200, 400], unit: "g" } },
  { keys: ["turkey", "dinde"], rule: { category: "cold", optional: false, fr: "Dinde", packs: [400, 800], unit: "g" } },
  { keys: ["lamb", "agneau"], rule: { category: "cold", optional: false, fr: "Agneau", packs: [400, 800], unit: "g" } },
  { keys: ["salmon", "saumon"], rule: { category: "cold", optional: false, fr: "Saumon", packs: [200, 400, 600], unit: "g" } },
  { keys: ["tuna", "thon"], rule: { category: "cold", optional: false, fr: "Thon", packs: [140, 200, 400], unit: "g" } },
  { keys: ["shrimp", "crevettes"], rule: { category: "cold", optional: false, fr: "Crevettes", packs: [200, 400], unit: "g" } },
  { keys: ["cod", "morue", "cabillaud"], rule: { category: "cold", optional: false, fr: "Cabillaud", packs: [300, 600], unit: "g" } },
  { keys: ["fish", "poisson"], rule: { category: "cold", optional: false, fr: "Poisson", packs: [300, 600], unit: "g" } },

  // ── CRÉMERIE (froid)
  { keys: ["milk", "lait"], rule: { category: "cold", optional: false, fr: "Lait", packs: [1000], unit: "ml" } },
  { keys: ["butter", "beurre"], rule: { category: "cold", optional: true, fr: "Beurre", packs: [250, 500], unit: "g" } },
  { keys: ["cream", "crème"], rule: { category: "cold", optional: false, fr: "Crème", packs: [200, 500], unit: "ml" } },
  { keys: ["yogurt", "yaourt"], rule: { category: "cold", optional: false, fr: "Yaourt", packs: [125, 500, 1000], unit: "g" } },
  { keys: ["cheese", "fromage"], rule: { category: "cold", optional: false, fr: "Fromage", packs: [150, 250], unit: "g" } },
  { keys: ["mozzarella"], rule: { category: "cold", optional: false, fr: "Mozzarella", packs: [125, 250], unit: "g" } },
  { keys: ["parmesan"], rule: { category: "cold", optional: false, fr: "Parmesan", packs: [80, 150], unit: "g" } },
  { keys: ["feta"], rule: { category: "cold", optional: false, fr: "Feta", packs: [150, 200], unit: "g" } },
  { keys: ["egg", "œuf", "oeuf"], rule: { category: "cold", optional: false, fr: "Œufs", packs: [6, 10, 12], unit: "u" } },
  { keys: ["tofu"], rule: { category: "cold", optional: false, fr: "Tofu", packs: [200, 400], unit: "g" } },

  // ── LÉGUMES & FRUITS (Frais)
  { keys: ["onion", "oignon"], rule: { category: "fresh", optional: false, fr: "Oignons", packs: [500, 1000], unit: "g" } },
  { keys: ["garlic clove", "gousse d'ail"], rule: { category: "fresh", optional: true, fr: "Ail", packs: [200], unit: "g" } },
  { keys: ["tomato", "tomate"], rule: { category: "fresh", optional: false, fr: "Tomates", packs: [500, 1000], unit: "g" } },
  { keys: ["carrot", "carotte"], rule: { category: "fresh", optional: false, fr: "Carottes", packs: [500, 1000], unit: "g" } },
  { keys: ["potato", "pomme de terre"], rule: { category: "fresh", optional: false, fr: "Pommes de terre", packs: [1000, 2500], unit: "g" } },
  { keys: ["sweet potato", "patate douce"], rule: { category: "fresh", optional: false, fr: "Patates douces", packs: [500, 1000], unit: "g" } },
  { keys: ["bell pepper", "poivron"], rule: { category: "fresh", optional: false, fr: "Poivrons", packs: [300, 600], unit: "g" } },
  { keys: ["cucumber", "concombre"], rule: { category: "fresh", optional: false, fr: "Concombre", packs: [400], unit: "g" } },
  { keys: ["lettuce", "salade"], rule: { category: "fresh", optional: false, fr: "Salade", packs: [200, 400], unit: "g" } },
  { keys: ["spinach", "épinards"], rule: { category: "fresh", optional: false, fr: "Épinards", packs: [200, 500], unit: "g" } },
  { keys: ["kale"], rule: { category: "fresh", optional: false, fr: "Chou kale", packs: [200, 400], unit: "g" } },
  { keys: ["broccoli", "brocoli"], rule: { category: "fresh", optional: false, fr: "Brocoli", packs: [500], unit: "g" } },
  { keys: ["cauliflower", "chou-fleur"], rule: { category: "fresh", optional: false, fr: "Chou-fleur", packs: [800], unit: "g" } },
  { keys: ["zucchini", "courgette"], rule: { category: "fresh", optional: false, fr: "Courgettes", packs: [500, 1000], unit: "g" } },
  { keys: ["eggplant", "aubergine"], rule: { category: "fresh", optional: false, fr: "Aubergine", packs: [500], unit: "g" } },
  { keys: ["mushroom", "champignon"], rule: { category: "fresh", optional: false, fr: "Champignons", packs: [250, 500], unit: "g" } },
  { keys: ["avocado", "avocat"], rule: { category: "fresh", optional: false, fr: "Avocats", packs: [200, 400], unit: "g" } },
  { keys: ["lemon", "citron"], rule: { category: "fresh", optional: false, fr: "Citrons", packs: [400], unit: "g" } },
  { keys: ["lime"], rule: { category: "fresh", optional: false, fr: "Citrons verts", packs: [400], unit: "g" } },
  { keys: ["orange"], rule: { category: "fresh", optional: false, fr: "Oranges", packs: [1000], unit: "g" } },
  { keys: ["apple", "pomme"], rule: { category: "fresh", optional: false, fr: "Pommes", packs: [1000], unit: "g" } },
  { keys: ["banana", "banane"], rule: { category: "fresh", optional: false, fr: "Bananes", packs: [1000], unit: "g" } },
  { keys: ["berry", "berries", "baies"], rule: { category: "fresh", optional: false, fr: "Fruits rouges", packs: [250, 500], unit: "g" } },
  { keys: ["parsley", "persil"], rule: { category: "fresh", optional: false, fr: "Persil", packs: [30], unit: "g" } },
  { keys: ["cilantro", "coriandre"], rule: { category: "fresh", optional: false, fr: "Coriandre", packs: [30], unit: "g" } },

  // ── PAINS & BOULANGERIE
  { keys: ["bread", "pain"], rule: { category: "fresh", optional: false, fr: "Pain", packs: [400], unit: "g" } },
  { keys: ["tortilla"], rule: { category: "fresh", optional: false, fr: "Tortillas", packs: [320], unit: "g" } },

  // ── SURGELÉS
  { keys: ["frozen"], rule: { category: "frozen", optional: false, fr: "Surgelé", packs: [400, 750], unit: "g" } },

  // ── NOIX (placard)
  { keys: ["almond", "amande"], rule: { category: "pantry", optional: false, fr: "Amandes", packs: [125, 250, 500], unit: "g" } },
  { keys: ["walnut", "noix"], rule: { category: "pantry", optional: false, fr: "Noix", packs: [100, 250], unit: "g" } },
  { keys: ["peanut", "cacahuète"], rule: { category: "pantry", optional: false, fr: "Cacahuètes", packs: [200, 500], unit: "g" } },
];

// ============================================================
// Conversion d'unités vers grammes/ml/units
// ============================================================

// Densités approximatives pour conversion volume → poids (g/ml)
const DENSITY: Record<string, number> = {
  "default": 1,
  "flour": 0.59, "farine": 0.59,
  "sugar": 0.85, "sucre": 0.85,
  "rice": 0.85, "riz": 0.85,
  "oats": 0.4,
  "salt": 1.2, "sel": 1.2,
  "honey": 1.42, "miel": 1.42,
  "oil": 0.92, "huile": 0.92,
  "butter": 0.96, "beurre": 0.96,
  "milk": 1.03, "lait": 1.03,
  "cream": 1.0, "crème": 1.0,
};

const UNIT_TO_ML: Record<string, number> = {
  "cup": 240, "cups": 240,
  "tablespoon": 15, "tbsp": 15, "tbs": 15, "tb": 15,
  "teaspoon": 5, "tsp": 5, "ts": 5,
  "fl oz": 30, "fluid ounce": 30,
  "pint": 470, "quart": 950, "gallon": 3800,
  "ml": 1, "milliliter": 1, "liter": 1000, "l": 1000,
};

const UNIT_TO_G: Record<string, number> = {
  "g": 1, "gram": 1, "grams": 1,
  "kg": 1000, "kilogram": 1000,
  "oz": 28.35, "ounce": 28.35,
  "lb": 454, "pound": 454,
};

export function normalizeQuantity(amount: number, unit: string, ingredientName: string): {
  amount: number;
  unit: "g" | "ml" | "u";
} {
  const u = (unit || "").toLowerCase().trim();
  const name = ingredientName.toLowerCase();

  if (!u || u === "" || u === "piece" || u === "pieces" || u === "u") {
    return { amount, unit: "u" };
  }
  if (UNIT_TO_G[u]) return { amount: amount * UNIT_TO_G[u], unit: "g" };
  if (UNIT_TO_ML[u]) {
    // Conversion volume → poids si dense
    const density = Object.entries(DENSITY).find(([k]) => name.includes(k))?.[1] ?? DENSITY.default;
    const ml = amount * UNIT_TO_ML[u];
    return { amount: ml * density, unit: "g" };
  }
  // Pinch / dash / large : on ignore
  if (u === "pinch" || u === "dash" || u === "large" || u === "small" || u === "medium" || u === "serving" || u === "servings") {
    return { amount: 0, unit: "u" };
  }
  return { amount, unit: "u" };
}

// ============================================================
// API principale
// ============================================================

export function classifyIngredient(ingredientName: string): PantryRule {
  const name = ingredientName.toLowerCase();
  for (const entry of TABLE) {
    for (const k of entry.keys) {
      if (name.includes(k)) return entry.rule;
    }
  }
  // Fallback générique : fruits & légumes frais
  return { category: "fresh", optional: false, fr: ingredientName, packs: [500], unit: "g" };
}

export interface PackChoice {
  packAmount: number;
  packUnit: "g" | "ml" | "u";
  qty: number;
  totalAmount: number;
  leftover: number;
  leftoverRatio: number;
  label: string;
}

export function pickPack(neededAmount: number, rule: PantryRule): PackChoice {
  const packs = rule.packs ?? [500];
  const unit = rule.unit ?? "g";

  // On cherche le plus petit pack qui couvre la quantité (ou le plus petit nombre de packs sinon)
  let best: PackChoice | null = null;
  for (const p of packs) {
    if (p >= neededAmount) {
      const totalAmount = p;
      const leftover = totalAmount - neededAmount;
      const leftoverRatio = leftover / totalAmount;
      best = {
        packAmount: p,
        packUnit: unit,
        qty: 1,
        totalAmount,
        leftover,
        leftoverRatio,
        label: `1 × ${p} ${unit === "u" ? "" : unit}`.trim(),
      };
      break;
    }
  }
  if (!best) {
    // Le plus gros pack ne suffit pas → on en prend plusieurs
    const largest = Math.max(...packs);
    const qty = Math.ceil(neededAmount / largest);
    const totalAmount = qty * largest;
    const leftover = totalAmount - neededAmount;
    best = {
      packAmount: largest,
      packUnit: unit,
      qty,
      totalAmount,
      leftover,
      leftoverRatio: leftover / totalAmount,
      label: `${qty} × ${largest} ${unit === "u" ? "" : unit}`.trim(),
    };
  }
  return best;
}
