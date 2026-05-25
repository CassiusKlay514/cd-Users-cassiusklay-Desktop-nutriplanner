"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createClient, supabaseEnabled } from "@/lib/supabase/client";
import { Leaf, Loader2, Mail } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enabled = supabaseEnabled();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return;
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      setSent(true);
      toast.success("Lien magique envoyé", {
        description: `Vérifiez votre boîte ${email}`,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur";
      setError(msg);
      toast.error("Échec d'envoi", { description: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
            <Leaf className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold">Connectez-vous</h1>
          <p className="text-gray-600 text-sm mt-1">
            Retrouvez votre plan sur tous vos appareils
          </p>
        </div>

        {!enabled && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 text-amber-900 p-3 text-sm mb-4">
            Supabase n'est pas configuré. Renseignez{" "}
            <code className="font-mono text-xs bg-amber-100 px-1 rounded">
              NEXT_PUBLIC_SUPABASE_URL
            </code>{" "}
            et{" "}
            <code className="font-mono text-xs bg-amber-100 px-1 rounded">
              NEXT_PUBLIC_SUPABASE_ANON_KEY
            </code>{" "}
            dans <code className="font-mono text-xs bg-amber-100 px-1 rounded">.env.local</code>.
          </div>
        )}

        {sent ? (
          <div className="rounded-2xl bg-white border border-gray-200 p-6 text-center">
            <Mail className="w-10 h-10 text-primary mx-auto mb-3" />
            <h2 className="font-bold text-lg">Email envoyé !</h2>
            <p className="text-sm text-gray-600 mt-2">
              Cliquez sur le lien dans l'email envoyé à <strong>{email}</strong> pour vous connecter.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@exemple.com"
              required
              disabled={!enabled}
              className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-white text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !enabled}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-primary text-white font-semibold shadow-lg shadow-primary/30 active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              Recevoir le lien magique
            </button>
            {error && (
              <div className="rounded-xl bg-red-50 text-red-700 text-sm p-3">{error}</div>
            )}
            <p className="text-xs text-gray-500 text-center mt-4">
              Pas de mot de passe. Un email avec un lien de connexion.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
