import type { Metadata } from "next";

/* Metadata must sit in a server file: the page itself is a client component,
   because the sticky table of contents tracks scroll position. */
export const metadata: Metadata = {
  title: "Terms & Conditions · Extreme or Nothing",
  description: "What the booking fee buys and the limits on both sides.",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
