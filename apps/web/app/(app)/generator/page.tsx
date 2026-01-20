"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";

type Game = {
  id: string;
  name: string;
  region: string;
  game_type: string;
  rules: {
    main_count?: number;
    main_min?: number;
    main_max?: number;
    bonus_count?: number;
    bonus_min?: number;
    bonus_max?: number;
  };
};

type GeneratedLine = {
  main: number[];
  bonus?: number[];
  meta: { strategy: string; score_hint: number };
};

export default function Generator() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const { user, loading: authLoading } = useAuth();

  const [games, setGames] = useState<Game[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string>("");
  const [lines, setLines] = useState<number>(5);
  const [strategy, setStrategy] = useState<string>("balanced");
  const [oddEven, setOddEven] = useState<string>("any");
  const [avoidRuns, setAvoidRuns] = useState<boolean>(true);
  const [result, setResult] = useState<GeneratedLine[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const selectedGame = useMemo(() => games.find((g) => g.id === selectedGameId) || null, [games, selectedGameId]);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/games");
      const json = await res.json();
      setGames(json.games || []);
      if (json.games?.length) setSelectedGameId(json.games[0].id);
    })();
  }, []);

  async function onGenerate() {
    if (!selectedGameId) return;
    setLoading(true);
    setSaveMsg(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          game_id: selectedGameId,
          n_lines: lines,
          strategy,
          constraints: {
            odd_even: oddEven,
            avoid_runs: avoidRuns
          }
        })
      });
      const json = await res.json();
      setResult(json.lines || []);
    } finally {
      setLoading(false);
    }
  }

  async function saveLine(line: GeneratedLine, label?: string) {
    setSaveMsg(null);
    if (!user) {
      setSaveMsg("Please sign in to save picks.");
      return;
    }
    const payload = {
      user_id: user.id,
      game_id: selectedGameId,
      label: label || null,
      numbers: {
        main: line.main,
        ...(line.bonus?.length ? { bonus: line.bonus } : {})
      },
      strategy: line.meta.strategy
    };

    const { error } = await supabase.from("saved_picks").insert(payload);
    if (error) {
      setSaveMsg(error.message);
      return;
    }
    setSaveMsg("Saved! See Saved Picks.");
  }

  async function saveAll() {
    if (!result?.length) return;
    if (!user) {
      setSaveMsg("Please sign in to save picks.");
      return;
    }
    setSaveMsg(null);
    const rows = result.map((line, idx) => ({
      user_id: user.id,
      game_id: selectedGameId,
      label: `Line ${idx + 1}`,
      numbers: {
        main: line.main,
        ...(line.bonus?.length ? { bonus: line.bonus } : {})
      },
      strategy: line.meta.strategy
    }));

    const { error } = await supabase.from("saved_picks").insert(rows);
    if (error) {
      setSaveMsg(error.message);
      return;
    }
    setSaveMsg(`Saved ${rows.length} lines!`);
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Pick Builder</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Generates weighted-random suggestions using historical frequency + recency signals (not predictions).
      </p>

      {!authLoading && !user ? (
        <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-700">
          Want to save picks? <Link href="/login" className="font-medium underline">Sign in</Link>.
        </div>
      ) : null}

      <section className="mt-8 card p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="text-sm font-semibold">Game</div>
            <select
              value={selectedGameId}
              onChange={(e) => setSelectedGameId(e.target.value)}
              className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm"
            >
              {games.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} · {g.region}
                </option>
              ))}
            </select>
            {selectedGame?.rules?.main_count && (
              <p className="mt-2 text-xs text-neutral-600">
                Rule: pick {selectedGame.rules.main_count} numbers {selectedGame.rules.main_min}–{selectedGame.rules.main_max}
                {selectedGame.rules.bonus_count ? ` + ${selectedGame.rules.bonus_count} bonus` : ""}
              </p>
            )}
          </div>

          <div>
            <div className="text-sm font-semibold">Lines</div>
            <input
              type="number"
              min={1}
              max={50}
              value={lines}
              onChange={(e) => setLines(Number(e.target.value))}
              className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm"
            />
          </div>

          <div>
            <div className="text-sm font-semibold">Strategy</div>
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm"
            >
              <option value="balanced">Balanced</option>
              <option value="hot">Hot-leaning</option>
              <option value="cold">Cold-leaning</option>
              <option value="random">Pure random</option>
            </select>
          </div>

          <div>
            <div className="text-sm font-semibold">Odd/Even</div>
            <select
              value={oddEven}
              onChange={(e) => setOddEven(e.target.value)}
              className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm"
            >
              <option value="any">Any</option>
              <option value="balanced">Balanced</option>
              <option value="more_odd">More odd</option>
              <option value="more_even">More even</option>
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={avoidRuns} onChange={(e) => setAvoidRuns(e.target.checked)} />
            Avoid long consecutive runs
          </label>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button onClick={onGenerate} disabled={loading} className="btn">
            {loading ? "Generating…" : "Generate Picks"}
          </button>
          {result?.length ? (
            <button
              onClick={saveAll}
              className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
            >
              Save all
            </button>
          ) : null}
          <span className="text-xs text-neutral-600">
            Tip: import historical draws first (Admin Import) so “hot/cold” strategies have data.
          </span>
        </div>

        {saveMsg ? <p className="mt-3 text-sm text-neutral-700">{saveMsg}</p> : null}
      </section>

      <section className="mt-6 card p-6">
        <div className="text-sm font-semibold">Results</div>
        {!result?.length ? (
          <p className="mt-2 text-sm text-neutral-600">No picks yet.</p>
        ) : (
          <ol className="mt-3 space-y-2 text-sm">
            {result.map((line, idx) => (
              <li
                key={idx}
                className="flex flex-col gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex flex-wrap items-center gap-2">
                  {line.main.map((n) => (
                    <span key={n} className="badge">
                      {n}
                    </span>
                  ))}
                  {line.bonus?.length ? <span className="badge">Bonus: {line.bonus.join(", ")}</span> : null}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-neutral-600">{line.meta.strategy}</span>
                  <button
                    onClick={() => saveLine(line, `Line ${idx + 1}`)}
                    className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-800 hover:bg-neutral-50"
                  >
                    Save
                  </button>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}
