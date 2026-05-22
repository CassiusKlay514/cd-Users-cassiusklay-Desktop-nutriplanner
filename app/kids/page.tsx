"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, ChefHat, Loader2, Sparkles, X } from "lucide-react";
import { useStore } from "@/lib/store";
import type { SpoonacularRecipe } from "@/lib/types";
import { cn } from "@/lib/utils";

interface QuizQuestion {
  q: string;
  options: { text: string; correct: boolean; explanation: string }[];
}

const QUIZ: QuizQuestion[] = [
  {
    q: "🍌 Quel est le fruit qui donne le plus d'énergie pour faire du sport ?",
    options: [
      { text: "La banane", correct: true, explanation: "Oui ! La banane apporte du sucre rapide et du potassium." },
      { text: "La fraise", correct: false, explanation: "La fraise est super, mais la banane a plus d'énergie." },
      { text: "Le kiwi", correct: false, explanation: "Le kiwi est plein de vitamines, mais moins d'énergie." },
    ],
  },
  {
    q: "🥕 Pourquoi on dit que les carottes c'est bon pour les yeux ?",
    options: [
      { text: "À cause des vitamines (la vitamine A)", correct: true, explanation: "Bravo ! La vitamine A aide les yeux à voir la nuit." },
      { text: "Parce qu'elles sont oranges", correct: false, explanation: "La couleur ne suffit pas, c'est la vitamine A qui compte." },
      { text: "Parce que les lapins en mangent", correct: false, explanation: "Les lapins en mangent mais ce n'est pas la raison." },
    ],
  },
  {
    q: "🥛 Combien de verres d'eau on devrait boire par jour environ ?",
    options: [
      { text: "1 verre", correct: false, explanation: "C'est beaucoup trop peu !" },
      { text: "6 à 8 verres", correct: true, explanation: "Bravo ! C'est environ 1,5L d'eau par jour." },
      { text: "20 verres", correct: false, explanation: "Trop d'eau aussi ce n'est pas idéal." },
    ],
  },
  {
    q: "🌈 Pour bien grandir, il faut manger…",
    options: [
      { text: "Que des bonbons", correct: false, explanation: "Hahaha, ça serait drôle mais non ! 🍭" },
      { text: "De tout, un peu de chaque couleur", correct: true, explanation: "Exactement ! Plus c'est coloré, plus c'est varié." },
      { text: "Seulement de la viande", correct: false, explanation: "Il faut aussi des fruits, légumes et céréales." },
    ],
  },
  {
    q: "🐟 Pourquoi on mange du poisson ?",
    options: [
      { text: "Parce qu'il a de bons gras pour le cerveau", correct: true, explanation: "Les oméga-3 du poisson aident le cerveau." },
      { text: "Parce qu'il nage vite", correct: false, explanation: "😄 Mignon mais non !" },
      { text: "Pour avoir des écailles", correct: false, explanation: "On ne mange pas les écailles 😄" },
    ],
  },
];

export default function KidsPage() {
  const profile = useStore((s) => s.profile);
  const [recipes, setRecipes] = useState<SpoonacularRecipe[]>([]);
  const [loading, setLoading] = useState(true);

  // Quiz state
  const [quizIdx, setQuizIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const sp = new URLSearchParams();
        sp.set("query", "kid friendly");
        sp.set("number", "12");
        if (profile?.dietPrefs?.allergies?.length) sp.set("allergies", profile.dietPrefs.allergies.join(","));
        const res = await fetch(`/api/recipes/search?${sp}`);
        const data = await res.json();
        if (res.ok) setRecipes(data.results);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [profile]);

  const q = QUIZ[quizIdx];

  const answer = (i: number) => {
    if (selected !== null) return;
    setSelected(i);
    if (q.options[i].correct) setScore((s) => s + 1);
  };

  const nextQuestion = () => {
    if (quizIdx < QUIZ.length - 1) {
      setQuizIdx(quizIdx + 1);
      setSelected(null);
    } else {
      setDone(true);
    }
  };

  const restart = () => {
    setQuizIdx(0); setSelected(null); setScore(0); setDone(false);
  };

  return (
    <div className="px-5 py-6 md:px-10 md:py-10 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-11 h-11 rounded-2xl bg-amber-400 text-white flex items-center justify-center text-2xl">
          🧒
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Espace enfants</h1>
          <p className="text-sm text-gray-500">Recettes rigolotes et quiz nutrition.</p>
        </div>
      </div>

      {/* Quiz */}
      <section className="mt-6 rounded-3xl bg-gradient-to-br from-amber-300 to-orange-400 text-white p-5 shadow-xl shadow-orange-300/50">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs uppercase tracking-wide opacity-90 font-bold">Le quiz du jour</div>
          <div className="text-xs font-bold bg-white/20 px-2 py-1 rounded-full">
            {done ? `Score ${score}/${QUIZ.length}` : `${quizIdx + 1}/${QUIZ.length}`}
          </div>
        </div>

        {!done ? (
          <>
            <h2 className="text-xl font-bold leading-tight">{q.q}</h2>
            <div className="mt-4 space-y-2">
              {q.options.map((o, i) => {
                const isSelected = selected === i;
                const isCorrect = o.correct;
                return (
                  <button
                    key={i}
                    onClick={() => answer(i)}
                    disabled={selected !== null}
                    className={cn(
                      "w-full text-left px-4 py-3 rounded-2xl font-semibold text-sm flex items-center justify-between transition",
                      selected === null
                        ? "bg-white text-gray-800"
                        : isCorrect
                          ? "bg-green-500 text-white"
                          : isSelected
                            ? "bg-red-500 text-white"
                            : "bg-white/50 text-gray-600"
                    )}
                  >
                    <span>{o.text}</span>
                    {selected !== null && isCorrect && <Check className="w-5 h-5" />}
                    {isSelected && !isCorrect && <X className="w-5 h-5" />}
                  </button>
                );
              })}
            </div>
            {selected !== null && (
              <div className="mt-3 p-3 rounded-2xl bg-white/20 text-sm">
                {q.options[selected].explanation}
              </div>
            )}
            {selected !== null && (
              <button
                onClick={nextQuestion}
                className="mt-3 w-full py-3 rounded-2xl bg-white text-orange-600 font-bold"
              >
                {quizIdx < QUIZ.length - 1 ? "Question suivante" : "Voir mon score 🎉"}
              </button>
            )}
          </>
        ) : (
          <div className="text-center py-4">
            <div className="text-6xl mb-2">
              {score >= 4 ? "🏆" : score >= 3 ? "🌟" : "💪"}
            </div>
            <h2 className="text-2xl font-bold">{score}/{QUIZ.length} bonnes réponses</h2>
            <p className="text-sm opacity-90 mt-1">
              {score === QUIZ.length ? "Champion·ne de la nutrition !" : score >= 3 ? "Très bien joué !" : "Bien essayé, on rejoue ?"}
            </p>
            <button
              onClick={restart}
              className="mt-4 px-5 py-3 rounded-2xl bg-white text-orange-600 font-bold inline-flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" /> Recommencer
            </button>
          </div>
        )}
      </section>

      {/* Recettes enfants */}
      <section className="mt-7">
        <h2 className="font-bold mb-3 flex items-center gap-2">
          <ChefHat className="w-4 h-4 text-amber-500" />
          Recettes rigolotes
        </h2>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {recipes.map((r) => (
              <Link
                key={r.id}
                href={`/recipes/${r.id}`}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden active:scale-[0.98]"
              >
                <div
                  className="aspect-square bg-cover bg-center"
                  style={{ backgroundImage: `url(${r.image})` }}
                />
                <div className="p-3">
                  <div className="font-semibold text-sm line-clamp-2">{r.title}</div>
                  {r.readyInMinutes && (
                    <div className="text-xs text-gray-500 mt-1">⏱️ {r.readyInMinutes} min</div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
