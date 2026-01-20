import Link from "next/link";
import { BRAND } from "@/lib/config";

export default function MarketingHome() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-neutral-900" />
          <div>
            <div className="text-lg font-semibold">{BRAND.name}</div>
            <div className="text-sm text-neutral-600">{BRAND.tagline}</div>
          </div>
        </div>
        <Link href="/dashboard" className="btn">
          Open App
        </Link>
      </header>

      <section className="mt-12 grid gap-6 md:grid-cols-3">
        <div className="card p-6">
          <div className="text-sm font-semibold">National games</div>
          <p className="mt-2 text-sm text-neutral-700">
            Visualize history and generate weighted-random picks for Powerball and Mega Millions.
          </p>
          <div className="mt-4">
            <span className="badge">Analysis only</span>
          </div>
        </div>
        <div className="card p-6">
          <div className="text-sm font-semibold">Alaska charitable draws</div>
          <p className="mt-2 text-sm text-neutral-700">
            Track organizer-published results for Alaska charitable draws (raffles / club draws) where
            data is available.
          </p>
          <div className="mt-4">
            <span className="badge">Custom formats</span>
          </div>
        </div>
        <div className="card p-6">
          <div className="text-sm font-semibold">Transparent generator</div>
          <p className="mt-2 text-sm text-neutral-700">
            Suggestions are weighted random with constraints you control—no predictions, no guarantees.
          </p>
          <div className="mt-4">
            <span className="badge">Explainable</span>
          </div>
        </div>
      </section>

      <section className="mt-10 card p-6">
        <div className="text-sm font-semibold">Disclaimer</div>
        <p className="mt-2 text-sm text-neutral-700">{BRAND.legal.disclaimerLong}</p>
      </section>

      <footer className="mt-10 text-xs text-neutral-500">
        © {new Date().getFullYear()} {BRAND.name}. Not affiliated with any lottery.
      </footer>
    </main>
  );
}
