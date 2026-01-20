"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function AuthButton() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  if (loading) return <div className="text-sm text-neutral-500">Loading…</div>;

  if (!user) {
    return (
      <Link
        href="/login"
        className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
      >
        Sign in
      </Link>
    );
  }

  const label = user.email ? user.email.split("@")[0] : "Account";

  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-sm text-neutral-600 md:inline">{label}</span>
      <button
        onClick={async () => {
          await signOut();
          router.push("/");
        }}
        className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
      >
        Sign out
      </button>
    </div>
  );
}
