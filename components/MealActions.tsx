"use client";

import { useState } from "react";
import {
  ArrowRight, Copy, MoreVertical, Move, Trash2, Users, X,
} from "lucide-react";
import { addDays, format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { cn, fromIso, isoDate } from "@/lib/utils";
import type { MealMoment, PlannedMeal } from "@/lib/types";

const MOMENT_LABEL: Record<MealMoment, string> = {
  breakfast: "Petit-déj", lunch: "Déj", dinner: "Dîner",
};
const MOMENT_EMOJI: Record<MealMoment, string> = {
  breakfast: "🥐", lunch: "🥗", dinner: "🍲",
};

interface Props {
  meal: PlannedMeal;
}

export default function MealActions({ meal }: Props) {
  const moveMeal = useStore((s) => s.moveMeal);
  const copyMeal = useStore((s) => s.copyMeal);
  const removeMeal = useStore((s) => s.removeMeal);
  const setGuestCount = useStore((s) => s.setGuestCount);
  const plan = useStore((s) => s.plan);
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState<"move" | "copy" | "guest" | null>(null);
  const [guestCount, setGc] = useState(meal.guestCount ?? 2);

  if (!plan) return null;

  const planStart = fromIso(plan.startDate);
  const planEnd = fromIso(plan.endDate);
  const days: Date[] = [];
  const span = Math.floor((planEnd.getTime() - planStart.getTime()) / 86400000);
  for (let i = 0; i <= span; i++) days.push(addDays(planStart, i));

  const closeAll = () => { setOpen(false); setAction(null); };

  const handleMove = (targetDate: string, targetMoment: MealMoment) => {
    moveMeal(meal.date, meal.moment, targetDate, targetMoment);
    toast.success("Repas déplacé", {
      description: `${meal.title} → ${format(fromIso(targetDate), "EEEE d MMM", { locale: fr })}`,
    });
    closeAll();
  };

  const handleCopy = (targetDate: string, targetMoment: MealMoment) => {
    copyMeal(meal.date, meal.moment, targetDate, targetMoment);
    toast.success("Repas copié", {
      description: `${meal.title} dupliqué`,
    });
    closeAll();
  };

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setOpen(true);
        }}
        className="shrink-0 w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
        aria-label="Actions"
      >
        <MoreVertical className="w-4 h-4 text-gray-500" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={closeAll} />
          <div
            className="relative bg-white w-full md:max-w-md md:rounded-3xl rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="md:hidden flex justify-center -mt-2 mb-3">
              <div className="w-10 h-1.5 rounded-full bg-gray-300" />
            </div>

            {/* Header avec recette */}
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
              <div
                className="w-12 h-12 rounded-xl bg-cover bg-center shrink-0"
                style={{ backgroundImage: `url(${meal.image})` }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-500">
                  {MOMENT_EMOJI[meal.moment]} {MOMENT_LABEL[meal.moment]} ·{" "}
                  {format(fromIso(meal.date), "EEEE d MMM", { locale: fr })}
                </div>
                <div className="font-bold leading-tight">{meal.title}</div>
              </div>
              <button onClick={closeAll} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Liste des actions ou sous-menu */}
            {!action && (
              <div className="space-y-1.5">
                <ActionRow
                  icon={<Move className="w-5 h-5 text-blue-600" />}
                  label="Déplacer"
                  sub="Vers un autre jour ou moment"
                  onClick={() => setAction("move")}
                />
                <ActionRow
                  icon={<Copy className="w-5 h-5 text-amber-600" />}
                  label="Copier / Dupliquer"
                  sub="Réutiliser ce repas un autre jour"
                  onClick={() => setAction("copy")}
                />
                <ActionRow
                  icon={<Users className="w-5 h-5 text-purple-600" />}
                  label="Mode invités"
                  sub={meal.guestCount ? `Pour ${meal.guestCount} personnes` : "Définir le nombre de convives"}
                  onClick={() => setAction("guest")}
                />
                <ActionRow
                  icon={<Trash2 className="w-5 h-5 text-red-600" />}
                  label="Supprimer ce repas"
                  sub="Le créneau redevient libre"
                  onClick={() => {
                    if (confirm("Supprimer ce repas du plan ?")) {
                      removeMeal(meal.date, meal.moment);
                      toast.success("Repas supprimé du plan");
                      closeAll();
                    }
                  }}
                  danger
                />
              </div>
            )}

            {/* Sous-menu déplacer/copier */}
            {(action === "move" || action === "copy") && (
              <div>
                <button
                  onClick={() => setAction(null)}
                  className="text-sm text-gray-500 mb-3 inline-flex items-center gap-1"
                >
                  ← Retour
                </button>
                <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-2">
                  {action === "move" ? "Déplacer vers" : "Copier vers"}
                </div>
                <div className="space-y-3">
                  {days.map((d) => {
                    const iso = isoDate(d);
                    return (
                      <div key={iso}>
                        <div className="text-xs font-semibold text-gray-700 mb-1 capitalize">
                          {format(d, "EEEE d MMMM", { locale: fr })}
                          {iso === meal.date && <span className="text-gray-400 ml-1">(actuel)</span>}
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                          {(["breakfast", "lunch", "dinner"] as MealMoment[]).map((m) => {
                            const isCurrent = iso === meal.date && m === meal.moment;
                            const conflict = plan.meals.find((x) => x.date === iso && x.moment === m);
                            return (
                              <button
                                key={m}
                                onClick={() =>
                                  action === "move"
                                    ? handleMove(iso, m)
                                    : handleCopy(iso, m)
                                }
                                disabled={isCurrent}
                                className={cn(
                                  "py-2.5 rounded-xl text-xs font-semibold border",
                                  isCurrent
                                    ? "bg-gray-100 border-gray-200 text-gray-400"
                                    : conflict
                                      ? "bg-amber-50 border-amber-200 text-amber-700"
                                      : "bg-white border-gray-200 text-gray-700"
                                )}
                              >
                                <div className="text-base">{MOMENT_EMOJI[m]}</div>
                                {MOMENT_LABEL[m]}
                                {conflict && !isCurrent && (
                                  <div className="text-[9px] opacity-70 mt-0.5">remplace</div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sous-menu invités */}
            {action === "guest" && (
              <div>
                <button
                  onClick={() => setAction(null)}
                  className="text-sm text-gray-500 mb-3 inline-flex items-center gap-1"
                >
                  ← Retour
                </button>
                <div className="rounded-2xl bg-purple-50 p-4">
                  <div className="text-xs uppercase tracking-wide text-purple-700 font-semibold mb-2">
                    Combien de personnes ?
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setGc(Math.max(1, guestCount - 1))}
                      className="w-12 h-12 rounded-full bg-white font-bold text-xl"
                    >
                      −
                    </button>
                    <div className="flex-1 text-center">
                      <div className="text-4xl font-bold text-purple-900">{guestCount}</div>
                      <div className="text-xs text-purple-600">
                        personne{guestCount > 1 ? "s" : ""}
                      </div>
                    </div>
                    <button
                      onClick={() => setGc(Math.min(20, guestCount + 1))}
                      className="w-12 h-12 rounded-full bg-white font-bold text-xl"
                    >
                      +
                    </button>
                  </div>
                  <div className="mt-3 text-xs text-purple-700">
                    Les quantités d'ingrédients seront <strong>multipliées par {(guestCount / (meal.servings ?? 2)).toFixed(1)}</strong> dans la liste de courses.
                  </div>
                </div>
                <button
                  onClick={() => {
                    setGuestCount(meal.date, meal.moment, guestCount);
                    toast.success(`Mode invités activé`, {
                      description: `${meal.title} pour ${guestCount} personnes`,
                    });
                    closeAll();
                  }}
                  className="mt-3 w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-purple-600 text-white font-bold"
                >
                  Valider <ArrowRight className="w-4 h-4" />
                </button>
                {meal.guestCount && (
                  <button
                    onClick={() => {
                      setGuestCount(meal.date, meal.moment, 0);
                      toast.success("Mode invités retiré");
                      closeAll();
                    }}
                    className="mt-2 w-full py-2.5 text-sm font-semibold text-gray-500"
                  >
                    Retirer le mode invités
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function ActionRow({
  icon, label, sub, onClick, danger,
}: {
  icon: React.ReactNode; label: string; sub?: string; onClick: () => void; danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-50",
        danger && "hover:bg-red-50"
      )}
    >
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
        danger ? "bg-red-50" : "bg-gray-50"
      )}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className={cn("font-semibold text-sm", danger && "text-red-600")}>{label}</div>
        {sub && <div className="text-xs text-gray-500">{sub}</div>}
      </div>
    </button>
  );
}
