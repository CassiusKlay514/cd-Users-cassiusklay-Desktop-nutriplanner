import "server-only";

const BASE = "https://prices.openfoodfacts.org/api/v1";
const OFF_SEARCH = "https://world.openfoodfacts.org/api/v2/search";

const TARGET_RETAILERS = ["Carrefour", "Auchan", "Leclerc", "Amazon Fresh"];

export interface RetailerPrice {
  retailer: string;
  price: number;
  currency: string;
  source: "open-prices" | "estimated";
  date?: string;
}

export interface PricedIngredient {
  name: string;
  prices: RetailerPrice[];
}

// Search OFF for a product to get a canonical code
async function findProductCode(query: string): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      search_terms: query,
      fields: "code,product_name",
      page_size: "1",
      countries_tags: "france",
    });
    const r = await fetch(`${OFF_SEARCH}?${params}`, {
      next: { revalidate: 86400 },
      headers: { "User-Agent": "NutriPlanner/1.0" },
    });
    if (!r.ok) return null;
    const data = await r.json();
    return data.products?.[0]?.code ?? null;
  } catch {
    return null;
  }
}

// Get prices for a product code
async function pricesForCode(code: string): Promise<RetailerPrice[]> {
  try {
    const params = new URLSearchParams({
      product_code: code,
      page_size: "30",
    });
    const r = await fetch(`${BASE}/prices?${params}`, {
      next: { revalidate: 21600 },
      headers: { "User-Agent": "NutriPlanner/1.0" },
    });
    if (!r.ok) return [];
    const data = await r.json();
    const items = (data.items ?? []) as Array<{
      price: number;
      currency: string;
      date: string;
      location?: { osm_name?: string; osm_brand?: string };
    }>;

    // Aggregate by retailer
    const byRetailer = new Map<string, { sum: number; count: number; latest: string }>();
    for (const it of items) {
      const brand = (it.location?.osm_brand || it.location?.osm_name || "").trim();
      const matched = TARGET_RETAILERS.find((r) =>
        brand.toLowerCase().includes(r.toLowerCase().split(" ")[0])
      );
      if (!matched) continue;
      const entry = byRetailer.get(matched) ?? { sum: 0, count: 0, latest: "" };
      entry.sum += it.price;
      entry.count++;
      if (it.date > entry.latest) entry.latest = it.date;
      byRetailer.set(matched, entry);
    }
    return Array.from(byRetailer.entries()).map(([retailer, v]) => ({
      retailer,
      price: Number((v.sum / v.count).toFixed(2)),
      currency: "EUR",
      source: "open-prices" as const,
      date: v.latest,
    }));
  } catch {
    return [];
  }
}

// Fallback: heuristic estimation per retailer
function estimatedPrices(ingredient: string): RetailerPrice[] {
  const k = ingredient.toLowerCase();
  let base = 2.5;
  // Catalogue : hygiène, ménage, bébé, alcool…
  if (/(champagne)/.test(k)) base = 25;
  else if (/(whisky|whiskey|rum|vodka|gin|brandy|spirit)/.test(k)) base = 22;
  else if (/(wine|vin\b|rosé|rouge|blanc)/.test(k)) base = 8;
  else if (/(beer|bière)/.test(k)) base = 7;
  else if (/(couches|diaper)/.test(k)) base = 12;
  else if (/(lait infantile|baby milk|formula)/.test(k)) base = 18;
  else if (/(compote)/.test(k)) base = 3;
  else if (/(lessive|laundry)/.test(k)) base = 9;
  else if (/(sacs poubelle|trash)/.test(k)) base = 5;
  else if (/(papier toilette|toilet paper)/.test(k)) base = 7;
  else if (/(essuie-tout|paper towel)/.test(k)) base = 5;
  else if (/(shampoing|shampoo|gel douche|shower)/.test(k)) base = 4;
  else if (/(dentifrice|toothpaste)/.test(k)) base = 3;
  else if (/(déodorant|deodorant)/.test(k)) base = 4;
  else if (/(rasoir|razor)/.test(k)) base = 6;
  else if (/(croquettes|dog food|cat food)/.test(k)) base = 11;
  else if (/(litière|litter)/.test(k)) base = 7;
  else if (/(café|coffee)/.test(k)) base = 6;
  else if (/(thé|tea)/.test(k)) base = 4;
  else if (/(soda|coca|pepsi)/.test(k)) base = 2;
  else if (/(eau|water)/.test(k)) base = 3.5;
  else if (/(jus|juice)/.test(k)) base = 2.5;
  else if (/(chips|crackers|biscuit)/.test(k)) base = 2.5;
  else if (/(chocolat|chocolate)/.test(k)) base = 2.5;
  else if (/(pizza)/.test(k)) base = 4;
  else if (/(glace|ice cream)/.test(k)) base = 4.5;
  // Ingrédients de cuisine
  else if (/(salmon|saumon|beef|boeuf|steak|filet)/.test(k)) base = 8.5;
  else if (/(chicken|poulet|pork|porc)/.test(k)) base = 6;
  else if (/(cheese|fromage|gruyère|parmesan)/.test(k)) base = 4;
  else if (/(rice|riz|pasta|pâtes|flour|farine|sugar|sucre)/.test(k)) base = 1.5;
  else if (/(tomato|tomate|onion|oignon|carrot|carotte|potato|pomme de terre)/.test(k)) base = 1.2;
  else if (/(olive|huile|oil)/.test(k)) base = 5;
  else if (/(salt|sel|pepper|poivre|spice|herb|épice)/.test(k)) base = 1.8;
  else if (/(milk|lait|yogurt|yaourt|egg|œuf)/.test(k)) base = 2;
  else if (/(bread|pain|baguette)/.test(k)) base = 1.6;
  else if (/(fruit|berry|apple|pomme|banana|banane)/.test(k)) base = 2.5;

  const variance: Record<string, number> = {
    "Carrefour": 1.0,
    "Auchan": 0.95,
    "Leclerc": 0.92,
    "Amazon Fresh": 1.18,
  };
  return TARGET_RETAILERS.map((r) => ({
    retailer: r,
    price: Number((base * variance[r]).toFixed(2)),
    currency: "EUR",
    source: "estimated" as const,
  }));
}

export async function getPricesForIngredients(
  ingredients: string[],
  opts: { enrichWithOpenPrices?: boolean } = {}
): Promise<PricedIngredient[]> {
  // Fast path: estimates only, instant
  if (!opts.enrichWithOpenPrices) {
    return ingredients.map((name) => ({ name, prices: estimatedPrices(name) }));
  }

  // Enriched path: query OFF + Open Prices, fall back to estimates per retailer
  const results = await Promise.all(
    ingredients.map(async (name) => {
      try {
        const code = await findProductCode(name);
        let prices: RetailerPrice[] = [];
        if (code) prices = await pricesForCode(code);
        const found = new Set(prices.map((p) => p.retailer));
        const estimates = estimatedPrices(name).filter((e) => !found.has(e.retailer));
        return { name, prices: [...prices, ...estimates] };
      } catch {
        return { name, prices: estimatedPrices(name) };
      }
    })
  );
  return results;
}
