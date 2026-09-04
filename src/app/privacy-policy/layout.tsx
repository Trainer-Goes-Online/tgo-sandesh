import type { Metadata } from "next";

/* Metadata must sit in a server file: the page itself is a client component,
   because the sticky table of contents tracks scroll position. */
export const metadata: Metadata = {
  title: "Privacy Policy · Extreme or Nothing",
  description: "What we collect, why, how long we keep it, and your rights.",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
