import type { Metadata } from "next";

/* Metadata must sit in a server file: the page itself is a client component,
   because the sticky table of contents tracks scroll position. */
export const metadata: Metadata = {
  title: "Refund Policy · Extreme or Nothing",
  description: "What the ₹97 buys, and exactly what the Money-Back Guarantee covers.",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
