// Catalogue de produits non-recette (TP, hygiène, ménage, vin, etc.)

export type CatalogCategory =
  | "hygiene"
  | "household"
  | "baby"
  | "drinks"
  | "snacks"
  | "wine_red" | "wine_white" | "wine_rose" | "wine_sparkling"
  | "spirits"
  | "beer"
  | "pet"
  | "frozen_misc"
  | "fresh_misc";

export interface CatalogProduct {
  id: string;
  name: string;
  emoji: string;
  category: CatalogCategory;
  defaultPack?: string;
  pairsWith?: string[]; // pour vins : types de plats qui matchent
}

export const CATEGORY_LABELS: Record<CatalogCategory, string> = {
  hygiene: "Hygiène & beauté",
  household: "Entretien & ménage",
  baby: "Bébé & enfant",
  drinks: "Boissons sans alcool",
  snacks: "Apéro & biscuits",
  wine_red: "Vins rouges",
  wine_white: "Vins blancs",
  wine_rose: "Vins rosés",
  wine_sparkling: "Vins effervescents",
  spirits: "Spiritueux",
  beer: "Bières",
  pet: "Animaux",
  frozen_misc: "Surgelés",
  fresh_misc: "Frais divers",
};

export const CATEGORY_EMOJIS: Record<CatalogCategory, string> = {
  hygiene: "🧴",
  household: "🧹",
  baby: "👶",
  drinks: "🥤",
  snacks: "🍪",
  wine_red: "🍷",
  wine_white: "🥂",
  wine_rose: "🌹",
  wine_sparkling: "🍾",
  spirits: "🥃",
  beer: "🍺",
  pet: "🐶",
  frozen_misc: "❄️",
  fresh_misc: "🥬",
};

// Catégories alcoolisées (cachées si user halal ou « sans alcool »)
export const ALCOHOL_CATEGORIES: CatalogCategory[] = [
  "wine_red", "wine_white", "wine_rose", "wine_sparkling", "spirits", "beer",
];

export const CATALOG: CatalogProduct[] = [
  // Hygiène
  { id: "tp", name: "Papier toilette", emoji: "🧻", category: "hygiene", defaultPack: "Pack 12 rouleaux" },
  { id: "shampoo", name: "Shampoing", emoji: "🧴", category: "hygiene", defaultPack: "500 ml" },
  { id: "shower_gel", name: "Gel douche", emoji: "🚿", category: "hygiene", defaultPack: "500 ml" },
  { id: "toothpaste", name: "Dentifrice", emoji: "🪥", category: "hygiene", defaultPack: "75 ml" },
  { id: "deodorant", name: "Déodorant", emoji: "💨", category: "hygiene", defaultPack: "150 ml" },
  { id: "razors", name: "Rasoirs", emoji: "🪒", category: "hygiene", defaultPack: "Pack de 4" },
  { id: "tissues", name: "Mouchoirs", emoji: "🤧", category: "hygiene", defaultPack: "Boîte de 100" },
  { id: "sanitary", name: "Protections périodiques", emoji: "🩸", category: "hygiene", defaultPack: "Boîte" },
  { id: "cotton_pads", name: "Cotons", emoji: "☁️", category: "hygiene", defaultPack: "Sachet 200" },
  { id: "body_lotion", name: "Crème corps", emoji: "🧴", category: "hygiene", defaultPack: "400 ml" },

  // Ménage
  { id: "dishsoap", name: "Liquide vaisselle", emoji: "🫧", category: "household", defaultPack: "500 ml" },
  { id: "laundry", name: "Lessive", emoji: "🧺", category: "household", defaultPack: "2 L" },
  { id: "fabric_softener", name: "Adoucissant", emoji: "🌸", category: "household", defaultPack: "1.5 L" },
  { id: "sponges", name: "Éponges", emoji: "🧽", category: "household", defaultPack: "Pack de 4" },
  { id: "trash_bags", name: "Sacs poubelle", emoji: "🗑️", category: "household", defaultPack: "30 L × 20" },
  { id: "all_purpose", name: "Nettoyant multi-usages", emoji: "🧴", category: "household", defaultPack: "750 ml" },
  { id: "floor_cleaner", name: "Nettoyant sol", emoji: "🪣", category: "household", defaultPack: "1 L" },
  { id: "paper_towels", name: "Essuie-tout", emoji: "🧻", category: "household", defaultPack: "Pack 4 rouleaux" },
  { id: "aluminum", name: "Aluminium", emoji: "🥡", category: "household", defaultPack: "30 m" },
  { id: "plastic_wrap", name: "Film alimentaire", emoji: "📦", category: "household", defaultPack: "30 m" },
  { id: "matches", name: "Allumettes", emoji: "🔥", category: "household", defaultPack: "Boîte" },

  // Bébé
  { id: "diapers", name: "Couches", emoji: "🍼", category: "baby", defaultPack: "Pack 36" },
  { id: "wipes", name: "Lingettes bébé", emoji: "👶", category: "baby", defaultPack: "Pack 72" },
  { id: "compote_apple", name: "Compote pomme", emoji: "🍎", category: "baby", defaultPack: "Pack 4 × 100g" },
  { id: "compote_mixed", name: "Compote fruits mélangés", emoji: "🍇", category: "baby", defaultPack: "Pack 4 × 100g" },
  { id: "baby_milk", name: "Lait infantile", emoji: "🍼", category: "baby", defaultPack: "800 g" },
  { id: "baby_cereal", name: "Céréales bébé", emoji: "🌾", category: "baby", defaultPack: "250 g" },
  { id: "baby_food_jar", name: "Petit pot salé", emoji: "🥕", category: "baby", defaultPack: "200 g" },

  // Boissons sans alcool
  { id: "water_still", name: "Eau plate", emoji: "💧", category: "drinks", defaultPack: "Pack 6 × 1,5 L" },
  { id: "water_sparkling", name: "Eau pétillante", emoji: "🫧", category: "drinks", defaultPack: "Pack 6 × 1 L" },
  { id: "coffee", name: "Café", emoji: "☕", category: "drinks", defaultPack: "250 g" },
  { id: "tea", name: "Thé", emoji: "🫖", category: "drinks", defaultPack: "Boîte 25 sachets" },
  { id: "fruit_juice", name: "Jus de fruits", emoji: "🧃", category: "drinks", defaultPack: "1 L" },
  { id: "soda", name: "Soda", emoji: "🥤", category: "drinks", defaultPack: "1,5 L" },
  { id: "ice_tea", name: "Thé glacé", emoji: "🧊", category: "drinks", defaultPack: "1,5 L" },

  // Apéro / Biscuits
  { id: "chips", name: "Chips", emoji: "🥔", category: "snacks", defaultPack: "150 g" },
  { id: "olives", name: "Olives apéritif", emoji: "🫒", category: "snacks", defaultPack: "200 g" },
  { id: "crackers", name: "Crackers", emoji: "🥨", category: "snacks", defaultPack: "200 g" },
  { id: "chocolate", name: "Chocolat", emoji: "🍫", category: "snacks", defaultPack: "100 g" },
  { id: "biscuits", name: "Biscuits sucrés", emoji: "🍪", category: "snacks", defaultPack: "200 g" },
  { id: "nuts_apero", name: "Cacahuètes apéro", emoji: "🥜", category: "snacks", defaultPack: "200 g" },
  { id: "popcorn", name: "Popcorn", emoji: "🍿", category: "snacks", defaultPack: "100 g" },

  // Vins rouges
  { id: "bordeaux", name: "Bordeaux rouge", emoji: "🍷", category: "wine_red", defaultPack: "Bouteille 75 cl",
    pairsWith: ["beef", "boeuf", "agneau", "fromage", "gibier", "magret"] },
  { id: "cotes_rhone", name: "Côtes du Rhône", emoji: "🍷", category: "wine_red", defaultPack: "Bouteille 75 cl",
    pairsWith: ["beef", "boeuf", "agneau", "ratatouille"] },
  { id: "bourgogne_rouge", name: "Bourgogne rouge", emoji: "🍷", category: "wine_red", defaultPack: "Bouteille 75 cl",
    pairsWith: ["boeuf", "canard", "champignon", "volaille"] },
  { id: "beaujolais", name: "Beaujolais", emoji: "🍷", category: "wine_red", defaultPack: "Bouteille 75 cl",
    pairsWith: ["volaille", "charcuterie", "burger"] },
  { id: "loire_red", name: "Loire rouge", emoji: "🍷", category: "wine_red", defaultPack: "Bouteille 75 cl",
    pairsWith: ["volaille", "poisson rouge", "porc"] },

  // Vins blancs
  { id: "chablis", name: "Chablis", emoji: "🥂", category: "wine_white", defaultPack: "Bouteille 75 cl",
    pairsWith: ["saumon", "huître", "crustacés", "poisson", "volaille"] },
  { id: "sancerre", name: "Sancerre", emoji: "🥂", category: "wine_white", defaultPack: "Bouteille 75 cl",
    pairsWith: ["fromage de chèvre", "asperge", "poisson"] },
  { id: "alsace_riesling", name: "Riesling d'Alsace", emoji: "🥂", category: "wine_white", defaultPack: "Bouteille 75 cl",
    pairsWith: ["choucroute", "poisson", "porc", "asian"] },
  { id: "bourgogne_blanc", name: "Bourgogne blanc", emoji: "🥂", category: "wine_white", defaultPack: "Bouteille 75 cl",
    pairsWith: ["poisson", "volaille crème"] },
  { id: "muscadet", name: "Muscadet", emoji: "🥂", category: "wine_white", defaultPack: "Bouteille 75 cl",
    pairsWith: ["crustacé", "huître", "fruits de mer"] },

  // Vins rosés
  { id: "provence_rose", name: "Rosé de Provence", emoji: "🌹", category: "wine_rose", defaultPack: "Bouteille 75 cl",
    pairsWith: ["salade", "grillade", "apéritif", "été"] },
  { id: "tavel", name: "Tavel rosé", emoji: "🌹", category: "wine_rose", defaultPack: "Bouteille 75 cl",
    pairsWith: ["paella", "épicé", "barbecue"] },

  // Vins effervescents
  { id: "champagne_brut", name: "Champagne brut", emoji: "🍾", category: "wine_sparkling", defaultPack: "Bouteille 75 cl",
    pairsWith: ["apéritif", "fête", "fruits de mer", "dessert"] },
  { id: "cremant", name: "Crémant", emoji: "🍾", category: "wine_sparkling", defaultPack: "Bouteille 75 cl",
    pairsWith: ["apéritif", "brunch"] },
  { id: "prosecco", name: "Prosecco", emoji: "🍾", category: "wine_sparkling", defaultPack: "Bouteille 75 cl",
    pairsWith: ["apéritif", "spritz"] },

  // Spiritueux
  { id: "whiskey", name: "Whisky", emoji: "🥃", category: "spirits", defaultPack: "Bouteille 70 cl" },
  { id: "vodka", name: "Vodka", emoji: "🍸", category: "spirits", defaultPack: "Bouteille 70 cl" },
  { id: "gin", name: "Gin", emoji: "🍸", category: "spirits", defaultPack: "Bouteille 70 cl" },
  { id: "rum", name: "Rhum", emoji: "🥃", category: "spirits", defaultPack: "Bouteille 70 cl" },
  { id: "pastis", name: "Pastis", emoji: "🍹", category: "spirits", defaultPack: "Bouteille 1 L" },

  // Bières
  { id: "beer_blonde", name: "Bière blonde", emoji: "🍺", category: "beer", defaultPack: "Pack 6 × 33 cl" },
  { id: "beer_ipa", name: "Bière IPA", emoji: "🍺", category: "beer", defaultPack: "Pack 4 × 33 cl" },
  { id: "beer_blanche", name: "Bière blanche", emoji: "🍺", category: "beer", defaultPack: "Pack 6 × 33 cl" },

  // Animaux
  { id: "dog_food", name: "Croquettes chien", emoji: "🐕", category: "pet", defaultPack: "3 kg" },
  { id: "cat_food", name: "Croquettes chat", emoji: "🐈", category: "pet", defaultPack: "2 kg" },
  { id: "litter", name: "Litière chat", emoji: "🟫", category: "pet", defaultPack: "10 L" },
  { id: "pet_treats", name: "Friandises animal", emoji: "🦴", category: "pet", defaultPack: "150 g" },

  // Surgelés divers
  { id: "ice_cream", name: "Glace", emoji: "🍦", category: "frozen_misc", defaultPack: "500 ml" },
  { id: "frozen_pizza", name: "Pizza surgelée", emoji: "🍕", category: "frozen_misc", defaultPack: "350 g" },
  { id: "frozen_fries", name: "Frites surgelées", emoji: "🍟", category: "frozen_misc", defaultPack: "1 kg" },

  // Frais divers
  { id: "butter_extra", name: "Beurre supplémentaire", emoji: "🧈", category: "fresh_misc", defaultPack: "250 g" },
  { id: "jam", name: "Confiture", emoji: "🍓", category: "fresh_misc", defaultPack: "370 g" },
];

export function listByCategory(): { category: CatalogCategory; products: CatalogProduct[] }[] {
  const map = new Map<CatalogCategory, CatalogProduct[]>();
  for (const p of CATALOG) {
    const arr = map.get(p.category) ?? [];
    arr.push(p);
    map.set(p.category, arr);
  }
  return Array.from(map.entries()).map(([category, products]) => ({ category, products }));
}

export function isAlcoholCategory(c: CatalogCategory): boolean {
  return ALCOHOL_CATEGORIES.includes(c);
}
