"use client";

import { useState } from "react";
import { Check, Copy, Loader2, Share2 } from "lucide-react";
import { useStore } from "@/lib/store";

export default function ShareButton() {
  const profile = useStore((s) => s.profile);
  const plan = useStore((s) => s.plan);
  const [open, setOpen] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  const handleShare = async () => {
    if (!plan) return;
    setGenerating(true);
    try {
      // On encode le plan + le prénom dans l'URL en base64
      const payload = { plan, senderName: profile?.name };
      const json = JSON.stringify(payload);
      const encoded = encodeURIComponent(btoa(unescape(encodeURIComponent(json))));
      const url = `${window.location.origin}/share?d=${encoded}`;
      setLink(url);

      // Tentative de Web Share API native (mobile)
      if (navigator.share) {
        try {
          await navigator.share({
            title: "Mon plan de repas NutriPlanner",
            text: `${profile?.name ?? "Quelqu'un"} partage son plan de repas`,
            url,
          });
          setOpen(false);
          return;
        } catch { /* user cancelled */ }
      }
      setOpen(true);
    } finally {
      setGenerating(false);
    }
  };

  const copyLink = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!plan) return null;

  return (
    <>
      <button
        onClick={handleShare}
        disabled={generating}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-white border border-gray-200 text-sm font-semibold text-gray-700"
      >
        {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4 text-primary" />}
        Partager
      </button>

      {open && link && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative bg-white w-full md:max-w-md md:rounded-3xl rounded-t-3xl p-5">
            <div className="md:hidden flex justify-center -mt-2 mb-3">
              <div className="w-10 h-1.5 rounded-full bg-gray-300" />
            </div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <Share2 className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-lg">Partager mon plan</h2>
            </div>
            <p className="text-sm text-gray-600">
              Ce lien fonctionne sans compte. La personne qui le reçoit voit votre plan en lecture seule.
            </p>

            <div className="mt-4 p-3 rounded-xl bg-gray-100 text-xs text-gray-700 break-all">
              {link}
            </div>

            <button
              onClick={copyLink}
              className="mt-3 w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-primary text-white font-bold"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Lien copié !" : "Copier le lien"}
            </button>
            <button
              onClick={() => setOpen(false)}
              className="mt-2 w-full py-2.5 text-sm font-semibold text-gray-500"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </>
  );
}
