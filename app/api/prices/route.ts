import { NextRequest, NextResponse } from "next/server";
import { getPricesForIngredients } from "@/lib/openprices";

export const runtime = "nodejs";
export const maxDuration = 60;

interface Body { ingredients: string[]; enrich?: boolean }

export async function POST(req: NextRequest) {
  try {
    const { ingredients, enrich } = (await req.json()) as Body;
    if (!ingredients?.length) return NextResponse.json({ prices: [] });
    const limited = ingredients.slice(0, 40);
    const prices = await getPricesForIngredients(limited, {
      enrichWithOpenPrices: enrich === true,
    });
    return NextResponse.json({ prices });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "unknown" },
      { status: 500 }
    );
  }
}
