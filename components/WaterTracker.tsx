"use client";

import { Droplet, Minus, Plus } from "lucide-react";
import { useStore } from "@/lib/store";
import { isoDate } from "@/lib/utils";

const GOAL = 8;

export default function WaterTracker() {
  const water = useStore((s) => s.waterIntake);
  const addWater = useStore((s) => s.addWater);

  const today = isoDate(new Date());
  const glasses = water[today] ?? 0;
  const pct = Math.min(glasses / GOAL, 1) * 100;

  return (
    <div className="rounded-2xl bg-white border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
          <Droplet className="w-5 h-5" fill="currentColor" />
        </div>
        <div className="flex-1">
          <div className="text-xs uppercase tracking-wide text-gray-500">Hydratation</div>
          <div className="font-bold text-lg">
            {glasses} / {GOAL} <span className="text-sm font-normal text-gray-500">verres</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => addWater(today, -1)}
            disabled={glasses === 0}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center disabled:opacity-30"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={() => addWater(today, 1)}
            className="w-9 h-9 rounded-full bg-blue-500 text-white flex items-center justify-center"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-8 gap-1 mt-2">
        {Array.from({ length: GOAL }).map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full ${i < glasses ? "bg-blue-500" : "bg-blue-100"}`}
          />
        ))}
      </div>
      <p className="text-xs text-gray-400 mt-2">
        {glasses >= GOAL ? "🎉 Objectif atteint !" : `Encore ${GOAL - glasses} verre${GOAL - glasses > 1 ? "s" : ""}`}
        {pct > 0 ? ` · ${Math.round(pct)}%` : ""}
      </p>
    </div>
  );
}
