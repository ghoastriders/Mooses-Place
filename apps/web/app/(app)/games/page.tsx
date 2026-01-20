"use client";

import { useEffect, useState } from "react";

type Game = {
  id: string;
  name: string;
  region: string;
  game_type: string;
  rules: Record<string, any>;
};

export default function Games() {
  const [games, setGames] = useState<Game[]>([]);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/games");
      const json = await res.json();
      setGames(json.games || []);
    })();
  }, []);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Games</h1>
      <p className="mt-1 text-sm text-neutral-600">
        National games are provided for analysis only. Alaska section is for charitable draw tracking where data is available.
      </p>

      <div className="mt-6 grid gap-6">
        {games.map((g) => (
          <div key={g.id} className="card p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-lg font-semibold">{g.name}</div>
                <div className="text-sm text-neutral-600">{g.region}</div>
              </div>
              <span className="badge">{g.game_type === "national" ? "National" : "Alaska Charitable"}</span>
            </div>
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium">Rules</summary>
              <pre className="mt-3 overflow-x-auto rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-xs">
                {JSON.stringify(g.rules || {}, null, 2)}
              </pre>
            </details>
          </div>
        ))}
      </div>
    </main>
  );
}
