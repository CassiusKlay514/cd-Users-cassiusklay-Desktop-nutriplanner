"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Send, Sparkles, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "J'ai 30 min ce soir, que je peux faire avec ce que j'ai déjà ?",
  "Comment remplacer le beurre dans la frittata ?",
  "Pourquoi mon plan a tant de glucides ?",
  "Une astuce pour mon repas du midi ?",
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CoachSheet({ open, onClose }: Props) {
  const profile = useStore((s) => s.profile);
  const plan = useStore((s) => s.plan);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: "assistant",
        content: profile
          ? `Salut ${profile.name} ! Je suis ton coach NutriPlanner. Comment puis-je t'aider ?`
          : "Salut ! Je suis ton coach NutriPlanner. Configure d'abord ton profil pour des conseils plus personnalisés.",
      }]);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  const send = async (text: string) => {
    if (!text.trim() || sending) return;
    const next: Message[] = [...messages, { role: "user", content: text.trim() }];
    setMessages(next);
    setInput("");
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, profile, plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec");
      setMessages([...next, { role: "assistant", content: data.reply as string }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "unknown");
    } finally {
      setSending(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full md:max-w-xl md:rounded-3xl bg-white rounded-t-3xl h-[85vh] md:h-[80vh] flex flex-col shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="shrink-0 border-b border-gray-200">
          <div className="md:hidden flex justify-center pt-2 pb-1">
            <div className="w-10 h-1.5 rounded-full bg-gray-300" />
          </div>
          <div className="flex items-center justify-between px-5 py-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-2xl bg-primary text-white flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-sm">Coach NutriPlanner</div>
                <div className="text-[10px] text-gray-500">En ligne · IA Claude</div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm whitespace-pre-wrap",
                  m.role === "user"
                    ? "bg-primary text-white rounded-br-md"
                    : "bg-gray-100 text-gray-800 rounded-bl-md"
                )}
              >
                {m.content}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="px-3.5 py-2.5 rounded-2xl bg-gray-100 text-gray-500 text-sm flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Le coach réfléchit…
              </div>
            </div>
          )}
          {error && (
            <div className="text-xs text-red-600 text-center">{error}</div>
          )}
        </div>

        {/* Suggestions */}
        {messages.length <= 1 && (
          <div className="shrink-0 px-4 pb-2">
            <div className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold mb-2">
              Pour commencer
            </div>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-xs px-3 py-2 rounded-full bg-primary/10 text-primary font-medium text-left"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="shrink-0 px-3 pb-3 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send(input)}
              placeholder="Posez-moi une question…"
              className="flex-1 px-4 py-3 rounded-full bg-gray-100 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-primary/30"
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || sending}
              className="w-11 h-11 rounded-full bg-primary text-white flex items-center justify-center disabled:opacity-40"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <style jsx global>{`
          @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
          .animate-slide-up { animation: slideUp 0.25s ease-out; }
        `}</style>
      </div>
    </div>
  );
}
