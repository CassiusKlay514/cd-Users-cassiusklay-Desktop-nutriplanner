"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props<T extends string> {
  options: { value: T; label: string }[];
  value: T[];
  onChange: (next: T[]) => void;
  columns?: 2 | 3;
}

export default function MultiChips<T extends string>({
  options, value, onChange, columns = 2,
}: Props<T>) {
  return (
    <div className={cn("grid gap-2", columns === 3 ? "grid-cols-3" : "grid-cols-2")}>
      {options.map((o) => {
        const on = value.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(on ? value.filter((v) => v !== o.value) : [...value, o.value])}
            className={cn(
              "px-3 py-2.5 rounded-xl border text-sm font-medium text-left flex items-center justify-between gap-2",
              on ? "bg-primary text-white border-primary" : "bg-white border-gray-200 text-gray-700"
            )}
          >
            <span>{o.label}</span>
            {on && <Check className="w-4 h-4 shrink-0" strokeWidth={3} />}
          </button>
        );
      })}
    </div>
  );
}
