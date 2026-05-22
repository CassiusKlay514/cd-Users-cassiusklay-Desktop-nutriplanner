import { NextRequest, NextResponse } from "next/server";
import { searchRecipes } from "@/lib/spoonacular";
import { getSeasonalIngredients } from "@/lib/seasonal";
import type { Allergy, Diet, MealMoment } from "@/lib/types";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const diet = (sp.get("diet") || "none") as Diet;
    const allergies = (sp.get("allergies") || "")
      .split(",").filter(Boolean) as Allergy[];
    const exclude = (sp.get("exclude") || "").split(",").filter(Boolean);
    const moment = sp.get("moment") as MealMoment | null;
    const number = Number(sp.get("number") || 30);
    const offset = Number(sp.get("offset") || 0);
    const query = sp.get("query") || undefined;
    const maxReadyTime = sp.get("maxReadyTime") ? Number(sp.get("maxReadyTime")) : undefined;
    const sort = sp.get("sort") || undefined;
    const direction = sp.get("direction") || undefined;
    const seasonal = sp.get("season") === "1";

    const includeIngredients = seasonal ? getSeasonalIngredients() : undefined;

    const results = await searchRecipes({
      diet,
      allergies,
      exclude,
      moment: moment || undefined,
      number,
      offset,
      query,
      maxReadyTime,
      sort,
      direction,
      includeIngredients,
    });
    return NextResponse.json({ results });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "unknown" },
      { status: 500 }
    );
  }
}
