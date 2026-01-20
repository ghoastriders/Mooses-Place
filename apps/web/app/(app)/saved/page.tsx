"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";

type SavedPick = {
  id: string;
  game_id: string;
  label: string | null;
  numbers: any;
  strategy: string | null;
  created_at: string;
};

type Game = { id: string; name: string; region: string };

export default function Saved() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const { user, loading: authLoading } = useAuth();

  const [games, setGames] = useState<Game[]>([]);
  const [picks, setPicks] = useState<SavedPick[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/games");
      const json = await res.json();
      setGames(json.games || []);
    })();
  }, []);

  async function loadPicks() {
    if (!user) return;
    setLoading(true);
    setMsg(null);
    try {
      const { data, error } = await supabase
        .from("saved_picks")
        .select("id, game_id, label, numbers, strategy, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      setPicks(data || []);
    } catch (e: any) {
      setMsg(e?.message || "Unable to load saved picks.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading && user) loadPicks();
  }, [authLoading, user]);

  async function deletePick(id: string) {
    setMsg(null);
    const { error } = await supabase.from("saved_picks").delete().eq("id", id);
    if (error) {
      setMsg(error.message);
      return;
    }
    setPicks((prev) => prev.filter((p) => p.id !== id));
  }

  const gameName = (id: string) => {
    const g = games.find((x) => x.id === id);
    return g ? `${g.name} · ${g.region}` : id;
  };

  if (authLoading) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-2xl font-semibold">Saved Picks</h1>
        <p className="mt-2 text-sm text-neutral-600">Loading…</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-2xl font-semibold">Saved Picks</h1>
        <p className="mt-2 text-sm text-neutral-700">
          Sign in to save and view your picks. <Link href="/login" className="font-medium underline">Sign in</Link>.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Saved Picks</h1>
          <p className="mt-1 text-sm text-neutral-600">Your saved lines are protected by Supabase Row Level Security.</p>
        </div>
        <button onClick={loadPicks} disabled={loading} className="btn">
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {msg ? <p className="mt-4 text-sm text-neutral-700">{msg}</p> : null}

      <section className="mt-6 card p-6">
        {!picks.length ? (
          <p className="text-sm text-neutral-600">No saved picks yet. Generate some lines and tap “Save”.</p>
        ) : (
          <ol className="space-y-2 text-sm">
            {picks.map((p) => (
              <li key={p.id} className="rounded-xl border border-neutral-200 bg-white px-3 py-2">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-sm font-semibold">{p.label || "Saved line"}</div>
                    <div className="mt-0.5 text-xs text-neutral-600">{gameName(p.game_id)} · {new Date(p.created_at).toLocaleString()}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-600">{p.strategy || ""}</span>
                    <button
                      onClick={() => deletePick(p.id)}
                      className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-800 hover:bg-neutral-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {(p.numbers?.main || []).map((n: number) => (
                    <span key={n} className="badge">{n}</span>
                  ))}
                  {p.numbers?.bonus?.length ? <span className="badge">Bonus: {p.numbers.bonus.join(", ")}</span> : null}
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}
