"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  CustomShoppingItem, MealHistoryEntry, MealPlan, PantryItem, PastPlan, PlannedMeal,
  ShoppingItem, UserProfile, WeightLog,
} from "./types";
import {
  pushAllArchivedPlans, pushAllWeights, pushArchivedPlan, pushCustomItems,
  pushFamilyMembers, pushHistory, pushPantry, pushPlan, pushProfile, pushShopping,
  pushWater, pushWeight,
} from "./sync";

interface AppState {
  hasHydrated: boolean;
  profile: UserProfile | null;
  plan: MealPlan | null;
  shopping: ShoppingItem[];
  customItems: CustomShoppingItem[];
  familyMembers: UserProfile[];
  familyPlans: Record<string, MealPlan>;
  // Vie quotidienne
  pantry: PantryItem[];
  history: MealHistoryEntry[];
  // Engagement
  waterIntake: Record<string, number>;
  weightLogs: WeightLog[];
  // Historique des plans archivés
  planHistory: PastPlan[];

  setHasHydrated: (b: boolean) => void;
  setProfile: (p: UserProfile) => void;
  setPlan: (p: MealPlan | null) => void;
  archiveCurrentPlan: () => void;
  restorePlan: (id: string) => void;
  deletePastPlan: (id: string) => void;
  moveMeal: (date: string, moment: PlannedMeal["moment"], targetDate: string, targetMoment: PlannedMeal["moment"]) => void;
  copyMeal: (date: string, moment: PlannedMeal["moment"], targetDate: string, targetMoment: PlannedMeal["moment"]) => void;
  removeMeal: (date: string, moment: PlannedMeal["moment"]) => void;
  setGuestCount: (date: string, moment: PlannedMeal["moment"], count: number) => void;
  setShopping: (items: ShoppingItem[]) => void;
  toggleItem: (id: string) => void;
  updateMeal: (date: string, moment: PlannedMeal["moment"], patch: Partial<PlannedMeal>) => void;
  toggleConsumed: (date: string, moment: PlannedMeal["moment"]) => void;
  rateMeal: (date: string, moment: PlannedMeal["moment"], rating: number, note?: string) => void;
  addCustomItem: (item: Omit<CustomShoppingItem, "id" | "addedAt">) => void;
  toggleCustomItem: (id: string) => void;
  removeCustomItem: (id: string) => void;
  addFamilyMember: (p: Omit<UserProfile, "id">) => void;
  switchToMember: (id: string) => void;
  removeFamilyMember: (id: string) => void;
  updateFamilyMember: (id: string, patch: Partial<UserProfile>) => void;
  // Pantry
  addPantryItem: (item: Omit<PantryItem, "id" | "addedAt">) => void;
  removePantryItem: (id: string) => void;
  // History
  recordHistory: (entry: MealHistoryEntry) => void;
  // Water
  addWater: (date: string, delta: number) => void;
  setWater: (date: string, glasses: number) => void;
  // Weight
  logWeight: (kg: number, date?: string) => void;
  removeWeightLog: (date: string) => void;

  clearAll: () => void;
}

function uuid() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      hasHydrated: false,
      profile: null,
      plan: null,
      shopping: [],
      customItems: [],
      familyMembers: [],
      familyPlans: {},
      pantry: [],
      history: [],
      waterIntake: {},
      weightLogs: [],
      planHistory: [],
      setHasHydrated: (b) => set({ hasHydrated: b }),
      setProfile: (profile) => {
        if (!profile.id) profile = { ...profile, id: uuid() };
        set({ profile });
        pushProfile(profile).catch(() => {});
      },
      setPlan: (plan) => {
        set({ plan });
        if (plan) pushPlan(plan).catch(() => {});
      },
      archiveCurrentPlan: () =>
        set((state) => {
          if (!state.plan) return {};
          const ratings = state.plan.meals
            .map((m) => m.rating)
            .filter((r): r is number => typeof r === "number" && r > 0);
          const avg = ratings.length
            ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
            : undefined;
          const past: PastPlan = {
            id: state.plan.id,
            startDate: state.plan.startDate,
            endDate: state.plan.endDate,
            mealsCount: state.plan.meals.length,
            notes: state.plan.notes,
            averageRating: avg,
            archivedAt: new Date().toISOString(),
            serialized: JSON.stringify(state.plan),
          };
          const filtered = state.planHistory.filter((p) => p.id !== past.id);
          const next = [past, ...filtered].slice(0, 50);
          pushArchivedPlan(past).catch(() => {});
          return { planHistory: next };
        }),
      restorePlan: (id) =>
        set((state) => {
          const past = state.planHistory.find((p) => p.id === id);
          if (!past) return {};
          try {
            const plan = JSON.parse(past.serialized) as MealPlan;
            const remaining = state.planHistory.filter((p) => p.id !== id);
            pushPlan(plan).catch(() => {});
            pushAllArchivedPlans(remaining).catch(() => {});
            return { plan, planHistory: remaining };
          } catch { return {}; }
        }),
      deletePastPlan: (id) =>
        set((state) => {
          const next = state.planHistory.filter((p) => p.id !== id);
          pushAllArchivedPlans(next).catch(() => {});
          return { planHistory: next };
        }),
      moveMeal: (date, moment, targetDate, targetMoment) =>
        set((state) => {
          if (!state.plan) return {};
          const source = state.plan.meals.find((m) => m.date === date && m.moment === moment);
          if (!source) return {};
          // Retire le repas cible existant + déplace
          const filtered = state.plan.meals.filter(
            (m) => !(m.date === targetDate && m.moment === targetMoment) &&
                   !(m.date === date && m.moment === moment)
          );
          const moved = { ...source, date: targetDate, moment: targetMoment };
          const next = { ...state.plan, meals: [...filtered, moved] };
          pushPlan(next).catch(() => {});
          return { plan: next };
        }),
      copyMeal: (date, moment, targetDate, targetMoment) =>
        set((state) => {
          if (!state.plan) return {};
          const source = state.plan.meals.find((m) => m.date === date && m.moment === moment);
          if (!source) return {};
          const filtered = state.plan.meals.filter(
            (m) => !(m.date === targetDate && m.moment === targetMoment)
          );
          const copy = {
            ...source, date: targetDate, moment: targetMoment,
            consumed: false, rating: undefined, note: undefined,
          };
          const next = { ...state.plan, meals: [...filtered, copy] };
          pushPlan(next).catch(() => {});
          return { plan: next };
        }),
      removeMeal: (date, moment) =>
        set((state) => {
          if (!state.plan) return {};
          const next = {
            ...state.plan,
            meals: state.plan.meals.filter((m) => !(m.date === date && m.moment === moment)),
          };
          pushPlan(next).catch(() => {});
          return { plan: next };
        }),
      setGuestCount: (date, moment, count) =>
        set((state) => {
          if (!state.plan) return {};
          const meals = state.plan.meals.map((m) =>
            m.date === date && m.moment === moment ? { ...m, guestCount: count } : m
          );
          const next = { ...state.plan, meals };
          pushPlan(next).catch(() => {});
          return { plan: next };
        }),
      setShopping: (shopping) => {
        set({ shopping });
        const planId = useStore.getState().plan?.id;
        if (planId) pushShopping(planId, shopping).catch(() => {});
      },
      toggleItem: (id) =>
        set((state) => {
          const next = state.shopping.map((i) =>
            i.id === id ? { ...i, checked: !i.checked } : i
          );
          const planId = state.plan?.id;
          if (planId) pushShopping(planId, next).catch(() => {});
          return { shopping: next };
        }),
      updateMeal: (date, moment, patch) =>
        set((state) => {
          if (!state.plan) return {};
          const meals = state.plan.meals.map((m) =>
            m.date === date && m.moment === moment ? { ...m, ...patch } : m
          );
          const next = { ...state.plan, meals };
          pushPlan(next).catch(() => {});
          return { plan: next };
        }),
      toggleConsumed: (date, moment) =>
        set((state) => {
          if (!state.plan) return {};
          const meals = state.plan.meals.map((m) =>
            m.date === date && m.moment === moment ? { ...m, consumed: !m.consumed } : m
          );
          // Record history
          const m = meals.find((x) => x.date === date && x.moment === moment);
          if (m && m.consumed) {
            const hist = [...state.history, {
              recipeId: m.recipeId, title: m.title,
              consumed: true, skipped: false, swapped: false, date,
            }];
            const next = { ...state.plan, meals };
            pushPlan(next).catch(() => {});
            return { plan: next, history: hist.slice(-300) };
          }
          const next = { ...state.plan, meals };
          pushPlan(next).catch(() => {});
          return { plan: next };
        }),
      rateMeal: (date, moment, rating, note) =>
        set((state) => {
          if (!state.plan) return {};
          const meals = state.plan.meals.map((m) =>
            m.date === date && m.moment === moment ? { ...m, rating, note } : m
          );
          const m = meals.find((x) => x.date === date && x.moment === moment);
          if (m) {
            // Mise à jour history avec rating
            const hist = state.history.map((h) =>
              h.recipeId === m.recipeId && h.date === date ? { ...h, rating } : h
            );
            const exists = hist.find((h) => h.recipeId === m.recipeId && h.date === date);
            if (!exists) {
              hist.push({
                recipeId: m.recipeId, title: m.title,
                consumed: !!m.consumed, skipped: false, swapped: false, rating, date,
              });
            }
            return { plan: { ...state.plan, meals }, history: hist.slice(-300) };
          }
          return { plan: { ...state.plan, meals } };
        }),
      addCustomItem: (item) =>
        set((state) => {
          const next = [
            ...state.customItems,
            { ...item, id: uuid(), addedAt: new Date().toISOString() },
          ];
          pushCustomItems(next).catch(() => {});
          return { customItems: next };
        }),
      toggleCustomItem: (id) =>
        set((state) => {
          const next = state.customItems.map((i) =>
            i.id === id ? { ...i, checked: !i.checked } : i
          );
          pushCustomItems(next).catch(() => {});
          return { customItems: next };
        }),
      removeCustomItem: (id) =>
        set((state) => {
          const next = state.customItems.filter((i) => i.id !== id);
          pushCustomItems(next).catch(() => {});
          return { customItems: next };
        }),
      addFamilyMember: (p) => {
        const member: UserProfile = { ...p, id: uuid() };
        set((state) => {
          const next = [...state.familyMembers, member];
          pushFamilyMembers(next).catch(() => {});
          return { familyMembers: next };
        });
      },
      switchToMember: (id) =>
        set((state) => {
          if (!state.profile) return {};
          const target = state.familyMembers.find((m) => m.id === id);
          if (!target) return {};
          const newFamily = state.familyMembers
            .filter((m) => m.id !== id)
            .concat(state.profile);
          const newPlans = { ...state.familyPlans };
          if (state.profile.id && state.plan) {
            newPlans[state.profile.id] = state.plan;
          }
          const nextPlan = newPlans[id] ?? null;
          delete newPlans[id];
          pushFamilyMembers(newFamily).catch(() => {});
          pushProfile(target).catch(() => {});
          if (nextPlan) pushPlan(nextPlan).catch(() => {});
          return {
            profile: target,
            familyMembers: newFamily,
            plan: nextPlan,
            familyPlans: newPlans,
            shopping: [],
          };
        }),
      removeFamilyMember: (id) =>
        set((state) => {
          const newPlans = { ...state.familyPlans };
          delete newPlans[id];
          const next = state.familyMembers.filter((m) => m.id !== id);
          pushFamilyMembers(next).catch(() => {});
          return {
            familyMembers: next,
            familyPlans: newPlans,
          };
        }),
      updateFamilyMember: (id, patch) =>
        set((state) => {
          const next = state.familyMembers.map((m) =>
            m.id === id ? { ...m, ...patch } : m
          );
          pushFamilyMembers(next).catch(() => {});
          return { familyMembers: next };
        }),
      // Pantry
      addPantryItem: (item) =>
        set((state) => {
          if (state.pantry.some((p) => p.name.toLowerCase() === item.name.toLowerCase())) {
            return {};
          }
          const next = [
            ...state.pantry,
            { ...item, id: uuid(), addedAt: new Date().toISOString() },
          ];
          pushPantry(next).catch(() => {});
          return { pantry: next };
        }),
      removePantryItem: (id) =>
        set((state) => {
          const next = state.pantry.filter((p) => p.id !== id);
          pushPantry(next).catch(() => {});
          return { pantry: next };
        }),
      // History
      recordHistory: (entry) =>
        set((state) => {
          const next = [...state.history, entry].slice(-300);
          pushHistory(next).catch(() => {});
          return { history: next };
        }),
      // Water
      addWater: (date, delta) =>
        set((state) => {
          const current = state.waterIntake[date] ?? 0;
          const value = Math.max(0, current + delta);
          pushWater(date, value).catch(() => {});
          return { waterIntake: { ...state.waterIntake, [date]: value } };
        }),
      setWater: (date, glasses) =>
        set((state) => {
          const value = Math.max(0, glasses);
          pushWater(date, value).catch(() => {});
          return { waterIntake: { ...state.waterIntake, [date]: value } };
        }),
      // Weight
      logWeight: (kg, date) =>
        set((state) => {
          const d = date ?? new Date().toISOString().split("T")[0];
          const existing = state.weightLogs.findIndex((w) => w.date === d);
          const logs = [...state.weightLogs];
          if (existing >= 0) logs[existing] = { date: d, kg };
          else logs.push({ date: d, kg });
          logs.sort((a, b) => a.date.localeCompare(b.date));
          pushWeight({ date: d, kg }).catch(() => {});
          return { weightLogs: logs };
        }),
      removeWeightLog: (date) =>
        set((state) => {
          const next = state.weightLogs.filter((w) => w.date !== date);
          pushAllWeights(next).catch(() => {});
          return { weightLogs: next };
        }),
      clearAll: () => set({
        profile: null, plan: null, shopping: [], customItems: [],
        familyMembers: [], familyPlans: {},
        pantry: [], history: [], waterIntake: {}, weightLogs: [],
        planHistory: [],
      }),
    }),
    {
      name: "nutriplanner-storage",
      partialize: (s) => ({
        profile: s.profile,
        plan: s.plan,
        shopping: s.shopping,
        customItems: s.customItems,
        familyMembers: s.familyMembers,
        familyPlans: s.familyPlans,
        pantry: s.pantry,
        history: s.history,
        waterIntake: s.waterIntake,
        weightLogs: s.weightLogs,
        planHistory: s.planHistory,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.profile && !state.profile.id) {
          state.profile = { ...state.profile, id: uuid() };
        }
        state?.setHasHydrated(true);
      },
    }
  )
);
