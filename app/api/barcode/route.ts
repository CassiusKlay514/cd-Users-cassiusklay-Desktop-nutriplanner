import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

interface OFFProduct {
  product_name?: string;
  product_name_fr?: string;
  brands?: string;
  image_url?: string;
  nutriscore_grade?: string;
  nova_group?: number;
  ecoscore_grade?: string;
  quantity?: string;
  categories?: string;
  nutriments?: {
    "energy-kcal_100g"?: number;
    proteins_100g?: number;
    carbohydrates_100g?: number;
    fat_100g?: number;
    sugars_100g?: number;
    fiber_100g?: number;
    salt_100g?: number;
  };
}

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get("code");
    if (!code) return NextResponse.json({ error: "code requis" }, { status: 400 });

    const r = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json`, {
      headers: { "User-Agent": "NutriPlanner/1.0" },
    });
    if (!r.ok) return NextResponse.json({ error: "OFF unavailable" }, { status: 502 });
    const data = await r.json();
    if (data.status !== 1) {
      return NextResponse.json({ found: false }, { status: 404 });
    }
    const p = data.product as OFFProduct;
    return NextResponse.json({
      found: true,
      name: p.product_name_fr || p.product_name || "Produit inconnu",
      brand: p.brands || null,
      image: p.image_url || null,
      nutriscore: p.nutriscore_grade?.toUpperCase() || null,
      novaGroup: p.nova_group || null,
      ecoscore: p.ecoscore_grade?.toUpperCase() || null,
      quantity: p.quantity || null,
      nutrition: {
        calories: Math.round(p.nutriments?.["energy-kcal_100g"] ?? 0),
        protein: Math.round(p.nutriments?.proteins_100g ?? 0),
        carbs: Math.round(p.nutriments?.carbohydrates_100g ?? 0),
        fat: Math.round(p.nutriments?.fat_100g ?? 0),
        sugars: Math.round(p.nutriments?.sugars_100g ?? 0),
        salt: Number((p.nutriments?.salt_100g ?? 0).toFixed(2)),
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "unknown" },
      { status: 500 }
    );
  }
}
