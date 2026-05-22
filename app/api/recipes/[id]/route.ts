import { NextRequest, NextResponse } from "next/server";
import { getRecipe } from "@/lib/spoonacular";
import { translateRecipeDetailFR } from "@/lib/translate";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const recipe = await getRecipe(Number(id));
    const wantFr = req.nextUrl.searchParams.get("lang") !== "en";
    const out = wantFr ? await translateRecipeDetailFR(recipe) : recipe;
    return NextResponse.json({ recipe: out });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "unknown" },
      { status: 500 }
    );
  }
}
