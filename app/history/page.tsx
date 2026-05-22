"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, History, RefreshCw, Star, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useStore } from "@/lib/store";
import { fromIso } from "@/lib/utils";

export default function HistoryPage() {
  const router = useRouter();
  const planHistory = useStore((s) => s.planHistory);
  const restorePlan = useStore((s) => s.restorePlan);
  const deletePastPlan = useStore((s) => s.deletePastPlan);

  const handleRestore = (id: string) => {
    if (confirm("Recharger ce plan ? Votre plan actuel sera archivé.")) {
      restorePlan(id);
      router.push("/plan");
    }
  };

  return (
    <div className="px-5 py-6 md:px-10 md:py-10 max-w-3xl mx-auto pb-20">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1 text-sm text-gray-600 mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Retour
      </button>

      <div className="flex items-center gap-2 mb-1">
        <div className="w-11 h-11 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center">
          <History className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Mes plans passés</h1>
          <p className="text-sm text-gray-500">
            {planHistory.length} plan{planHistory.length > 1 ? "s" : ""} archivé{planHistory.length > 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {planHistory.length === 0 ? (
        <div className="mt-10 text-center py-12 px-4 rounded-3xl bg-white border border-dashed border-gray-300">
          <div className="text-5xl mb-3">📜</div>
          <h3 className="font-bold text-lg">Aucun plan archivé</h3>
          <p className="text-gray-500 text-sm mt-1 max-w-xs mx-auto">
            Chaque fois que vous régénérez un plan, l'ancien est sauvegardé ici pour pouvoir y revenir.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {planHistory.map((p) => {
            const start = fromIso(p.startDate);
            const end = fromIso(p.endDate);
            const archived = new Date(p.archivedAt);
            return (
              <div
                key={p.id}
                className="rounded-2xl bg-white border border-gray-200 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold capitalize">
                      Du {format(start, "d MMM", { locale: fr })} au {format(end, "d MMM yyyy", { locale: fr })}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {p.mealsCount} repas · Archivé le {format(archived, "d MMM 'à' HH:mm", { locale: fr })}
                    </div>
                    {p.averageRating !== undefined && (
                      <div className="flex items-center gap-1 mt-1 text-amber-500 text-sm">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span className="font-bold">{p.averageRating}</span>
                        <span className="text-xs text-gray-400">/ 5</span>
                      </div>
                    )}
                    {p.notes && (
                      <p className="text-xs text-gray-600 mt-2 line-clamp-2">{p.notes}</p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      if (confirm("Supprimer définitivement ce plan ?")) deletePastPlan(p.id);
                    }}
                    className="shrink-0 w-9 h-9 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center"
                    aria-label="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={() => handleRestore(p.id)}
                  className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-bold"
                >
                  <RefreshCw className="w-4 h-4" />
                  Recharger ce plan
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
