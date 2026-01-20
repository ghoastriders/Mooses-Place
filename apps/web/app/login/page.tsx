"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BRAND } from "@/lib/config";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/dashboard");
    });
  }, [supabase, router]);

  async function signInEmail() {
    setLoading(true);
    setStatus(null);
    try {
      const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/dashboard` : undefined;
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo }
      });
      if (error) throw error;
      setStatus("Check your email for the sign-in link.");
    } catch (e: any) {
      setStatus(e?.message || "Unable to send sign-in link.");
    } finally {
      setLoading(false);
    }
  }

  async function signInGoogle() {
    setLoading(true);
    setStatus(null);
    try {
      const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/dashboard` : undefined;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo }
      });
      if (error) throw error;
      // OAuth redirects away
    } catch (e: any) {
      setStatus(e?.message || "Unable to sign in with Google.");
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-12">
      <Link href="/" className="text-sm text-neutral-600 hover:underline">
        ← Back
      </Link>

      <h1 className="mt-4 text-3xl font-semibold">Sign in to {BRAND.name}</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Save picks, track your lines, and sync across devices. {BRAND.legal.disclaimerShort}
      </p>

      <section className="mt-8 card p-6">
        <div className="text-sm font-semibold">Email link</div>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          type="email"
          className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm"
        />
        <button onClick={signInEmail} disabled={loading || !email} className="btn mt-3 w-full">
          {loading ? "Working…" : "Send magic link"}
        </button>

        <div className="my-4 text-center text-xs text-neutral-500">OR</div>

        <button onClick={signInGoogle} disabled={loading} className="btn w-full">
          Continue with Google
        </button>

        {status ? <p className="mt-3 text-sm text-neutral-700">{status}</p> : null}

        <p className="mt-4 text-xs text-neutral-500">
          By signing in you agree this app is for entertainment/analytics only and does not sell tickets or predict outcomes.
        </p>
      </section>
    </main>
  );
}
