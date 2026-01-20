"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BRAND } from "@/lib/config";

type Game = {
  id: string;
  name: string;
  region: string;
  game_type: string;
};

type Analytics = {
  window_draws: number;
  main: {
    top_hot: { n: number; count: number }[];
    top_cold: { n: number; last_seen_draws_ago: number | null }[];
  };
};

export default function Dashboard() {
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string>("");
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(false);
  const selectedGame = useMemo(() => games.find((g) => g.id === selectedGameId) || null, [games, selectedGameId]);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/games");
      const json = await res.json();
      setGames(json.games || []);
      if (json.games?.length) setSelectedGameId(json.games[0].id);
    })();
  }, []);

  useEffect(() => {
    if (!selectedGameId) return;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/analytics?game_id=${encodeURIComponent(selectedGameId)}`);
        const json = await res.json();
        setAnalytics(json);
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedGameId]);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="mt-1 text-sm text-neutral-600">{BRAND.legal.disclaimerShort}</p>
        </div>
        <Link href="/generator" className="btn">
          Open Pick Builder
        </Link>
      </div>

      <section className="mt-8 card p-6">
        <div className="text-sm font-semibold">Game</div>
        <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-center">
          <select
            value={selectedGameId}
            onChange={(e) => setSelectedGameId(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm md:w-96"
          >
            {games.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} · {g.region}
              </option>
            ))}
          </select>
          {selectedGame && (
            <span className="badge">
              {selectedGame.game_type === "national" ? "National" : "Alaska Charitable"}
            </span>
          )}
        </div>
      </section>

      <section className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="card p-6">
          <div className="text-sm font-semibold">Hot numbers (recent frequency)</div>
          {loading && <p className="mt-3 text-sm text-neutral-600">Loading…</p>}
          {!loading && analytics?.main?.top_hot?.length ? (
            <ul className="mt-3 space-y-2 text-sm">
              {analytics.main.top_hot.map((x) => (
                <li key={x.n} className="flex items-center justify-between">
                  <span className="badge">{x.n}</span>
                  <span className="text-neutral-700">{x.count} hits</span>
                </li>
              ))}
            </ul>
          ) : (
            !loading && <p className="mt-3 text-sm text-neutral-600">No data yet. Import draws first.</p>
          )}
        </div>

        <div className="card p-6">
          <div className="text-sm font-semibold">Cold numbers (longest since last seen)</div>
          {loading && <p className="mt-3 text-sm text-neutral-600">Loading…</p>}
          {!loading && analytics?.main?.top_cold?.length ? (
            <ul className="mt-3 space-y-2 text-sm">
              {analytics.main.top_cold.map((x) => (
                <li key={x.n} className="flex items-center justify-between">
                  <span className="badge">{x.n}</span>
                  <span className="text-neutral-700">
                    {x.last_seen_draws_ago === null ? "Never" : `${x.last_seen_draws_ago} draws ago`}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            !loading && <p className="mt-3 text-sm text-neutral-600">No data yet. Import draws first.</p>
          )}
        </div>
      </section>

      <section className="mt-6 card p-6">
        <div className="text-sm font-semibold">Notes</div>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-neutral-700">
          <li>Suggestions are weighted random, not predictions.</li>
          <li>Mooses Place does not sell tickets or facilitate purchases.</li>
          <li>For Alaska, charitable draw formats vary; only supported where results data exists.</li>
        </ul>
      </section>
    </main>
  );
}
