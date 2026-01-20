import "./styles/globals.css";
import type { Metadata } from "next";
import { BRAND } from "@/lib/config";

export const metadata: Metadata = {
  title: {
    default: BRAND.name,
    template: `%s · ${BRAND.name}`
  },
  description: BRAND.tagline
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
