"use client";

import { useState } from "react";
import { addDays, format, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  start: Date;
  end: Date;
  onChange: (start: Date, end: Date) => void;
}

export default function DateRangePicker({ start, end, onChange }: Props) {
  const [anchor, setAnchor] = useState(start);
  const [picking, setPicking] = useState<"start" | "end">("start");
  const [tempStart, setTempStart] = useState(start);

  const days: Date[] = [];
  const firstDay = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const gridStart = addDays(firstDay, -startOffset);
  for (let i = 0; i < 42; i++) days.push(addDays(gridStart, i));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const handleClick = (d: Date) => {
    if (d < today) return;
    if (picking === "start") {
      setTempStart(d);
      setPicking("end");
    } else {
      if (d < tempStart) {
        setTempStart(d);
        return;
      }
      const span = (d.getTime() - tempStart.getTime()) / 86400000;
      if (span > 13) {
        const max = addDays(tempStart, 13);
        onChange(tempStart, max);
      } else {
        onChange(tempStart, d);
      }
      setPicking("start");
    }
  };

  const inRange = (d: Date) => {
    if (picking === "end") return d >= tempStart && d <= tempStart;
    return d >= start && d <= end;
  };

  const isStart = (d: Date) =>
    picking === "end" ? isSameDay(d, tempStart) : isSameDay(d, start);
  const isEnd = (d: Date) => picking === "start" && isSameDay(d, end);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1))}
          className="p-2 -ml-2 rounded-full hover:bg-gray-100"
          aria-label="Mois précédent"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-semibold capitalize">
          {format(anchor, "MMMM yyyy", { locale: fr })}
        </span>
        <button
          onClick={() => setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1))}
          className="p-2 -mr-2 rounded-full hover:bg-gray-100"
          aria-label="Mois suivant"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 text-center text-xs text-gray-500 mb-2">
        {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => <div key={i}>{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((d, i) => {
          const past = d < today;
          const otherMonth = d.getMonth() !== anchor.getMonth();
          const range = inRange(d);
          const startDay = isStart(d);
          const endDay = isEnd(d);
          return (
            <button
              key={i}
              onClick={() => handleClick(d)}
              disabled={past}
              className={cn(
                "h-10 text-sm rounded-lg flex items-center justify-center transition",
                past && "text-gray-300 cursor-not-allowed",
                !past && otherMonth && "text-gray-400",
                !past && !otherMonth && "text-gray-800",
                range && !startDay && !endDay && "bg-primary/15 text-primary font-semibold",
                (startDay || endDay) && "bg-primary text-white font-semibold"
              )}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>

      <div className="mt-3 text-xs text-gray-500 text-center">
        {picking === "start"
          ? "Choisissez le jour de début"
          : "Choisissez le jour de fin (max 14 jours)"}
      </div>
    </div>
  );
}
