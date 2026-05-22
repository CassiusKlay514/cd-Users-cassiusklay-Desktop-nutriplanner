"use client";

import { useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { createClient, supabaseEnabled } from "@/lib/supabase/client";
import {
  pullArchivedPlans, pullCustomItems, pullFamilyMembers, pullHistory,
  pullLatestPlan, pullPantry, pullProfile, pullWater, pullWeights,
  pushAllArchivedPlans, pushAllWeights, pushCustomItems, pushFamilyMembers,
  pushHistory, pushPantry, pushPlan, pushProfile,
  pushWater,
} from "@/lib/sync";

export default function AuthBridge() {
  const hasHydrated = useStore((s) => s.hasHydrated);
  const synced = useRef(false);

  useEffect(() => {
    if (!supabaseEnabled() || !hasHydrated) return;
    const sb = createClient();

    const sync = async () => {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;

      // On capture l'état local actuel avant d'écraser
      const state = useStore.getState();

      // 1) Profile : cloud prioritaire si dispo, sinon push local
      const cloudProfile = await pullProfile();
      if (cloudProfile) {
        useStore.setState({ profile: cloudProfile });
      } else if (state.profile) {
        await pushProfile(state.profile);
      }

      // 2) Plan
      const cloudPlan = await pullLatestPlan();
      if (cloudPlan) {
        useStore.setState({ plan: cloudPlan });
      } else if (state.plan) {
        await pushPlan(state.plan);
      }

      // 3) Pantry
      const cloudPantry = await pullPantry();
      if (cloudPantry.length) {
        useStore.setState({ pantry: cloudPantry });
      } else if (state.pantry.length) {
        await pushPantry(state.pantry);
      }

      // 4) Custom items
      const cloudCustom = await pullCustomItems();
      if (cloudCustom.length) {
        useStore.setState({ customItems: cloudCustom });
      } else if (state.customItems.length) {
        await pushCustomItems(state.customItems);
      }

      // 5) Family members
      const cloudFamily = await pullFamilyMembers();
      if (cloudFamily.length) {
        useStore.setState({ familyMembers: cloudFamily });
      } else if (state.familyMembers.length) {
        await pushFamilyMembers(state.familyMembers);
      }

      // 6) Water intake : on prend l'union (max par date)
      const cloudWater = await pullWater();
      const mergedWater: Record<string, number> = { ...cloudWater };
      for (const [date, glasses] of Object.entries(state.waterIntake)) {
        if (!(date in mergedWater) || mergedWater[date] < glasses) {
          mergedWater[date] = glasses;
          // push si local plus à jour
          if (mergedWater[date] !== cloudWater[date]) {
            await pushWater(date, glasses);
          }
        }
      }
      useStore.setState({ waterIntake: mergedWater });

      // 7) Weight logs
      const cloudWeights = await pullWeights();
      if (cloudWeights.length) {
        useStore.setState({ weightLogs: cloudWeights });
      } else if (state.weightLogs.length) {
        await pushAllWeights(state.weightLogs);
      }

      // 8) Archived plans
      const cloudArchived = await pullArchivedPlans();
      if (cloudArchived.length) {
        useStore.setState({ planHistory: cloudArchived });
      } else if (state.planHistory.length) {
        await pushAllArchivedPlans(state.planHistory);
      }

      // 9) Meal history
      const cloudHistory = await pullHistory();
      if (cloudHistory.length) {
        useStore.setState({ history: cloudHistory });
      } else if (state.history.length) {
        await pushHistory(state.history);
      }

      synced.current = true;
    };

    sync();

    const { data: sub } = sb.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        synced.current = false;
        sync();
      }
      if (event === "SIGNED_OUT") {
        synced.current = false;
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [hasHydrated]);

  return null;
}
