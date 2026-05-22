"use client";

import { createClient, supabaseEnabled } from "./supabase/client";
import { defaultDietPrefs } from "./utils";
import type {
  CustomShoppingItem, MealHistoryEntry, MealPlan, PantryItem, PastPlan, ShoppingItem,
  UserProfile, WeightLog,
} from "./types";

// Helper : récupère l'utilisateur authentifié, retourne null si Supabase off ou pas connecté
async function authedUser() {
  if (!supabaseEnabled()) return null;
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  return { sb, user };
}

// ============================================================
// PROFILE
// ============================================================

export async function pushProfile(p: UserProfile) {
  const ctx = await authedUser();
  if (!ctx) return;
  await ctx.sb.from("profiles").upsert({
    user_id: ctx.user.id,
    name: p.name,
    age: p.age,
    sex: p.sex,
    weight_kg: p.weightKg,
    height_cm: p.heightCm,
    activity: p.activity,
    goal: p.goal,
    calories_target: p.caloriesTarget,
    diet_prefs: p.dietPrefs ?? null,
    updated_at: new Date().toISOString(),
  });
}

export async function pullProfile(): Promise<UserProfile | null> {
  const ctx = await authedUser();
  if (!ctx) return null;
  const { data } = await ctx.sb.from("profiles").select("*").eq("user_id", ctx.user.id).maybeSingle();
  if (!data || !data.name) return null;
  return {
    id: ctx.user.id,
    name: data.name,
    age: data.age ?? 30,
    sex: data.sex ?? "other",
    weightKg: Number(data.weight_kg) || 70,
    heightCm: Number(data.height_cm) || 175,
    activity: data.activity ?? "moderate",
    goal: data.goal ?? "maintain",
    caloriesTarget: data.calories_target ?? 2000,
    dietPrefs: data.diet_prefs ?? defaultDietPrefs(),
    onboardedAt: data.updated_at ?? new Date().toISOString(),
  };
}

// ============================================================
// PLAN + REPAS
// ============================================================

export async function pushPlan(plan: MealPlan) {
  const ctx = await authedUser();
  if (!ctx) return;
  await ctx.sb.from("meal_plans").upsert({
    id: plan.id,
    user_id: ctx.user.id,
    start_date: plan.startDate,
    end_date: plan.endDate,
    notes: plan.notes ?? null,
    created_at: plan.createdAt,
  });
  await ctx.sb.from("planned_meals").delete().eq("plan_id", plan.id);
  if (plan.meals.length) {
    await ctx.sb.from("planned_meals").insert(
      plan.meals.map((m) => ({
        plan_id: plan.id,
        date: m.date,
        moment: m.moment,
        recipe_id: m.recipeId,
        title: m.title,
        image: m.image,
        calories: m.calories,
        protein: m.protein,
        carbs: m.carbs,
        fat: m.fat,
        ready_in_minutes: m.readyInMinutes,
      }))
    );
  }
}

export async function pullLatestPlan(): Promise<MealPlan | null> {
  const ctx = await authedUser();
  if (!ctx) return null;
  const { data: planRow } = await ctx.sb
    .from("meal_plans")
    .select("*")
    .eq("user_id", ctx.user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!planRow) return null;
  const { data: meals } = await ctx.sb
    .from("planned_meals")
    .select("*")
    .eq("plan_id", planRow.id);
  return {
    id: planRow.id,
    startDate: planRow.start_date,
    endDate: planRow.end_date,
    notes: planRow.notes ?? undefined,
    createdAt: planRow.created_at,
    meals: (meals ?? []).map((m) => ({
      date: m.date,
      moment: m.moment,
      recipeId: m.recipe_id,
      title: m.title,
      image: m.image ?? "",
      calories: m.calories ?? 0,
      protein: m.protein ?? 0,
      carbs: m.carbs ?? 0,
      fat: m.fat ?? 0,
      readyInMinutes: m.ready_in_minutes ?? undefined,
    })),
  };
}

// ============================================================
// SHOPPING LIST
// ============================================================

export async function pushShopping(planId: string, items: ShoppingItem[]) {
  const ctx = await authedUser();
  if (!ctx) return;
  const { data: list } = await ctx.sb
    .from("shopping_lists")
    .upsert({ plan_id: planId, user_id: ctx.user.id }, { onConflict: "plan_id" })
    .select()
    .single();
  if (!list) return;
  await ctx.sb.from("shopping_items").delete().eq("list_id", list.id);
  if (items.length) {
    await ctx.sb.from("shopping_items").insert(
      items.map((it) => ({
        list_id: list.id,
        name: it.name,
        amount: it.amount,
        unit: it.unit,
        aisle: it.aisle,
        checked: it.checked,
        recipe_ids: it.recipeIds,
      }))
    );
  }
}

// ============================================================
// PANTRY
// ============================================================

export async function pushPantry(items: PantryItem[]) {
  const ctx = await authedUser();
  if (!ctx) return;
  await ctx.sb.from("pantry_items").delete().eq("user_id", ctx.user.id);
  if (items.length) {
    await ctx.sb.from("pantry_items").insert(
      items.map((p) => ({
        user_id: ctx.user.id,
        name: p.name,
        category: p.category ?? null,
        emoji: p.emoji ?? null,
        added_at: p.addedAt,
      }))
    );
  }
}

export async function pullPantry(): Promise<PantryItem[]> {
  const ctx = await authedUser();
  if (!ctx) return [];
  const { data } = await ctx.sb
    .from("pantry_items")
    .select("*")
    .eq("user_id", ctx.user.id);
  return (data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category ?? undefined,
    emoji: p.emoji ?? undefined,
    addedAt: p.added_at,
  }));
}

// ============================================================
// WATER INTAKE
// ============================================================

export async function pushWater(date: string, glasses: number) {
  const ctx = await authedUser();
  if (!ctx) return;
  await ctx.sb.from("water_intake").upsert({
    user_id: ctx.user.id,
    date,
    glasses,
    updated_at: new Date().toISOString(),
  });
}

export async function pullWater(): Promise<Record<string, number>> {
  const ctx = await authedUser();
  if (!ctx) return {};
  const { data } = await ctx.sb
    .from("water_intake")
    .select("date, glasses")
    .eq("user_id", ctx.user.id);
  const out: Record<string, number> = {};
  (data ?? []).forEach((r) => { out[r.date] = r.glasses; });
  return out;
}

// ============================================================
// WEIGHT
// ============================================================

export async function pushWeight(log: WeightLog) {
  const ctx = await authedUser();
  if (!ctx) return;
  await ctx.sb.from("weight_logs").upsert({
    user_id: ctx.user.id,
    date: log.date,
    kg: log.kg,
  });
}

export async function pushAllWeights(logs: WeightLog[]) {
  const ctx = await authedUser();
  if (!ctx) return;
  await ctx.sb.from("weight_logs").delete().eq("user_id", ctx.user.id);
  if (logs.length) {
    await ctx.sb.from("weight_logs").insert(
      logs.map((w) => ({ user_id: ctx.user.id, date: w.date, kg: w.kg }))
    );
  }
}

export async function pullWeights(): Promise<WeightLog[]> {
  const ctx = await authedUser();
  if (!ctx) return [];
  const { data } = await ctx.sb
    .from("weight_logs")
    .select("date, kg")
    .eq("user_id", ctx.user.id)
    .order("date", { ascending: true });
  return (data ?? []).map((w) => ({ date: w.date, kg: Number(w.kg) }));
}

// ============================================================
// ARCHIVED PLANS (HISTORIQUE)
// ============================================================

export async function pushArchivedPlan(p: PastPlan) {
  const ctx = await authedUser();
  if (!ctx) return;
  await ctx.sb.from("archived_plans").upsert({
    id: p.id,
    user_id: ctx.user.id,
    start_date: p.startDate,
    end_date: p.endDate,
    meals_count: p.mealsCount,
    notes: p.notes ?? null,
    average_rating: p.averageRating ?? null,
    archived_at: p.archivedAt,
    serialized: JSON.parse(p.serialized),
  });
}

export async function pushAllArchivedPlans(list: PastPlan[]) {
  const ctx = await authedUser();
  if (!ctx) return;
  await ctx.sb.from("archived_plans").delete().eq("user_id", ctx.user.id);
  if (list.length) {
    await ctx.sb.from("archived_plans").insert(
      list.map((p) => ({
        id: p.id,
        user_id: ctx.user.id,
        start_date: p.startDate,
        end_date: p.endDate,
        meals_count: p.mealsCount,
        notes: p.notes ?? null,
        average_rating: p.averageRating ?? null,
        archived_at: p.archivedAt,
        serialized: JSON.parse(p.serialized),
      }))
    );
  }
}

export async function pullArchivedPlans(): Promise<PastPlan[]> {
  const ctx = await authedUser();
  if (!ctx) return [];
  const { data } = await ctx.sb
    .from("archived_plans")
    .select("*")
    .eq("user_id", ctx.user.id)
    .order("archived_at", { ascending: false });
  return (data ?? []).map((p) => ({
    id: p.id,
    startDate: p.start_date,
    endDate: p.end_date,
    mealsCount: p.meals_count ?? 0,
    notes: p.notes ?? undefined,
    averageRating: p.average_rating ?? undefined,
    archivedAt: p.archived_at,
    serialized: JSON.stringify(p.serialized),
  }));
}

// ============================================================
// CUSTOM ITEMS (catalogue)
// ============================================================

export async function pushCustomItems(items: CustomShoppingItem[]) {
  const ctx = await authedUser();
  if (!ctx) return;
  await ctx.sb.from("custom_items").delete().eq("user_id", ctx.user.id);
  if (items.length) {
    await ctx.sb.from("custom_items").insert(
      items.map((i) => ({
        id: i.id,
        user_id: ctx.user.id,
        name: i.name,
        category: i.category,
        emoji: i.emoji ?? null,
        quantity: i.quantity,
        unit: i.unit ?? null,
        checked: i.checked,
        added_at: i.addedAt,
      }))
    );
  }
}

export async function pullCustomItems(): Promise<CustomShoppingItem[]> {
  const ctx = await authedUser();
  if (!ctx) return [];
  const { data } = await ctx.sb
    .from("custom_items")
    .select("*")
    .eq("user_id", ctx.user.id);
  return (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    category: r.category as CustomShoppingItem["category"],
    emoji: r.emoji ?? undefined,
    quantity: Number(r.quantity) || 1,
    unit: r.unit ?? undefined,
    checked: !!r.checked,
    addedAt: r.added_at,
  }));
}

// ============================================================
// FAMILY MEMBERS
// ============================================================

export async function pushFamilyMembers(members: UserProfile[]) {
  const ctx = await authedUser();
  if (!ctx) return;
  await ctx.sb.from("family_members").delete().eq("account_user_id", ctx.user.id);
  if (members.length) {
    await ctx.sb.from("family_members").insert(
      members.map((m) => ({
        id: m.id!,
        account_user_id: ctx.user.id,
        name: m.name,
        age: m.age,
        sex: m.sex,
        weight_kg: m.weightKg,
        height_cm: m.heightCm,
        activity: m.activity,
        goal: m.goal,
        calories_target: m.caloriesTarget,
        diet_prefs: m.dietPrefs ?? null,
        role: m.role ?? null,
        avatar_emoji: m.avatarEmoji ?? null,
        color: m.color ?? null,
        onboarded_at: m.onboardedAt,
      }))
    );
  }
}

export async function pullFamilyMembers(): Promise<UserProfile[]> {
  const ctx = await authedUser();
  if (!ctx) return [];
  const { data } = await ctx.sb
    .from("family_members")
    .select("*")
    .eq("account_user_id", ctx.user.id);
  return (data ?? []).map((r) => ({
    id: r.id,
    name: r.name ?? "Membre",
    age: r.age ?? 30,
    sex: r.sex ?? "other",
    weightKg: Number(r.weight_kg) || 70,
    heightCm: Number(r.height_cm) || 170,
    activity: r.activity ?? "moderate",
    goal: r.goal ?? "maintain",
    caloriesTarget: r.calories_target ?? 2000,
    dietPrefs: r.diet_prefs ?? defaultDietPrefs(),
    role: r.role ?? undefined,
    avatarEmoji: r.avatar_emoji ?? undefined,
    color: r.color ?? undefined,
    onboardedAt: r.onboarded_at ?? new Date().toISOString(),
  }));
}

// ============================================================
// MEAL HISTORY (notes/ratings/skipped pour plan adaptatif)
// ============================================================

export async function pushHistory(history: MealHistoryEntry[]) {
  const ctx = await authedUser();
  if (!ctx) return;
  await ctx.sb.from("meal_history").delete().eq("user_id", ctx.user.id);
  if (history.length) {
    await ctx.sb.from("meal_history").insert(
      history.map((h) => ({
        user_id: ctx.user.id,
        recipe_id: h.recipeId,
        title: h.title,
        rating: h.rating ?? null,
        consumed: h.consumed,
        skipped: h.skipped,
        swapped: h.swapped,
        date: h.date,
      }))
    );
  }
}

export async function pullHistory(): Promise<MealHistoryEntry[]> {
  const ctx = await authedUser();
  if (!ctx) return [];
  const { data } = await ctx.sb
    .from("meal_history")
    .select("*")
    .eq("user_id", ctx.user.id)
    .order("recorded_at", { ascending: false })
    .limit(300);
  return (data ?? []).map((r) => ({
    recipeId: r.recipe_id ?? 0,
    title: r.title ?? "",
    rating: r.rating ?? undefined,
    consumed: !!r.consumed,
    skipped: !!r.skipped,
    swapped: !!r.swapped,
    date: r.date,
  })).reverse();
}
