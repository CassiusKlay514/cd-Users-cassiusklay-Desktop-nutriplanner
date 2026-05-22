"use client";

import { cn } from "@/lib/utils";

interface Props {
  consumed: number;
  target: number;
  size?: number;
  label?: string;
}

export default function NutritionRing({ consumed, target, size = 180, label }: Props) {
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = target > 0 ? Math.min(consumed / target, 1.2) : 0;
  const offset = c * (1 - Math.min(pct, 1));
  const over = consumed > target;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#e5e7eb" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={over ? "#f97316" : "#16a34a"}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className={cn("text-3xl font-bold", over && "text-accent")}>
          {Math.round(consumed)}
        </div>
        <div className="text-xs text-gray-500">/ {target} kcal</div>
        {label && <div className="text-xs text-gray-400 mt-1">{label}</div>}
      </div>
    </div>
  );
}
