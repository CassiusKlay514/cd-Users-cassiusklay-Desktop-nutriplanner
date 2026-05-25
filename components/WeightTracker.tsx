"use client";

import { useMemo, useState } from "react";
import { Plus, Scale, TrendingDown, TrendingUp } from "lucide-react";
import { useStore } from "@/lib/store";
import { isoDate } from "@/lib/utils";

export default function WeightTracker() {
  const profile = useStore((s) => s.profile);
  const logs = useStore((s) => s.weightLogs);
  const logWeight = useStore((s) => s.logWeight);

  const [adding, setAdding] = useState(false);
  const [value, setValue] = useState<number>(profile?.weightKg ?? 70);

  const latest = logs[logs.length - 1];
  const previous = logs[logs.length - 2];
  const delta = latest && previous ? latest.kg - previous.kg : null;

  // Min/max pour le graph
  const { min, max } = useMemo(() => {
    if (!logs.length) return { min: 0, max: 0 };
    return {
      min: Math.min(...logs.map((l) => l.kg)),
      max: Math.max(...logs.map((l) => l.kg)),
    };
  }, [logs]);

  return (
    <div className="rounded-2xl bg-white border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-gray-500">Poids</div>
            <div className="font-bold text-lg flex items-baseline gap-2">
              {latest ? `${latest.kg} kg` : (profile?.weightKg ?? "·") + " kg"}
              {delta !== null && (
                <span className={`text-xs font-medium ${delta < 0 ? "text-emerald-600" : "text-rose-600"} flex items-center gap-0.5`}>
                  {delta < 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                  {Math.abs(delta).toFixed(1)} kg
                </span>
              )}
            </div>
          </div>
        </div>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="px-3 py-1.5 rounded-full bg-purple-100 text-purple-700 text-xs font-bold inline-flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Peser
          </button>
        )}
      </div>

      {adding && (
        <div className="mt-3 p-3 rounded-xl bg-purple-50">
          <div className="text-xs font-semibold text-purple-900 mb-2">
            Quel est votre poids aujourd'hui ?
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setValue((v) => Math.max(30, v - 0.5))}
              className="w-10 h-10 rounded-full bg-white"
            >−</button>
            <input
              type="number"
              step={0.1}
              value={value}
              onChange={(e) => setValue(Number(e.target.value))}
              className="flex-1 px-3 py-2 rounded-xl text-center font-bold text-lg bg-white"
            />
            <button
              onClick={() => setValue((v) => Math.min(250, v + 0.5))}
              className="w-10 h-10 rounded-full bg-white"
            >+</button>
          </div>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setAdding(false)}
              className="flex-1 py-2 rounded-xl bg-gray-100 text-sm font-semibold"
            >
              Annuler
            </button>
            <button
              onClick={() => {
                logWeight(value, isoDate(new Date()));
                setAdding(false);
              }}
              className="flex-1 py-2 rounded-xl bg-purple-600 text-white text-sm font-bold"
            >
              Enregistrer
            </button>
          </div>
        </div>
      )}

      {/* Mini graph */}
      {logs.length >= 2 && (
        <div className="mt-3 flex items-end gap-1 h-12">
          {logs.slice(-10).map((l, i) => {
            const range = max - min || 1;
            const pct = ((l.kg - min) / range) * 100;
            return (
              <div
                key={i}
                className="flex-1 bg-purple-400 rounded-t"
                style={{ height: `${Math.max(10, pct)}%` }}
                title={`${l.date}: ${l.kg} kg`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
