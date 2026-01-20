import Link from "next/link";
import { BRAND } from "@/lib/config";
import AuthButton from "@/components/AuthButton";
import { AuthProvider } from "@/components/AuthProvider";

const NavItem = ({ href, label }: { href: string; label: string }) => (
  <Link href={href} className="rounded-xl px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100">
    {label}
  </Link>
);

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-neutral-50">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-neutral-900" />
              <div>
                <div className="text-lg font-semibold">{BRAND.name}</div>
                <div className="text-sm text-neutral-600">{BRAND.tagline}</div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <NavItem href="/dashboard" label="Dashboard" />
              <NavItem href="/games" label="Games" />
              <NavItem href="/generator" label="Pick Builder" />
              <NavItem href="/saved" label="Saved" />
              <div className="ml-0 md:ml-2" />
              <AuthButton />
            </div>
          </header>

          <div className="mt-6">{children}</div>

          <footer className="mt-10 text-xs text-neutral-500">{BRAND.legal.disclaimerShort}</footer>
        </div>
      </div>
    </AuthProvider>
  );
}
