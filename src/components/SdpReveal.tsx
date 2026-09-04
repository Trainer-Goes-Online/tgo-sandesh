"use client";

import { useEffect } from "react";

/**
 * Arms the reveal-on-scroll animation, AFTER React has hydrated.
 *
 * It used to be an inline <script> that ran while the browser parsed the body.
 * That was deliberate (arming before paint stops the page showing all its
 * content and then yanking it back to invisible) but it mutated the DOM before
 * hydration: it added `sdp-armed` to the root and `vis` to every element already
 * on screen, and React then found classNames it had not rendered. The root's
 * mismatch was silenced with suppressHydrationWarning, but that prop covers one
 * element only, so every revealed child kept warning.
 *
 * Doing the work in an effect removes the mismatch at the source: React owns the
 * DOM until it has finished hydrating, and only then does this touch it.
 *
 * The flash that the inline script existed to prevent does not come back,
 * because arming and marking happen in ONE synchronous pass. The browser cannot
 * paint between `sdp-armed` being added and the on-screen elements getting
 * `vis`, so no frame ever shows the armed-but-unrevealed state.
 *
 * Still fail-open: with JS disabled nothing is armed, and the CSS only hides
 * `[data-sdp-reveal]` under `.sdp-root.sdp-armed`, so every section is visible.
 */
export function SdpReveal() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".sdp-root");
    if (!root || !("IntersectionObserver" in window)) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const nodes = Array.from(root.querySelectorAll<HTMLElement>("[data-sdp-reveal]"));

    /* One synchronous pass: arm, then immediately reveal whatever is already on
       screen. Reading every rect before writing any class keeps this to a single
       layout rather than one per node. */
    const onScreen = nodes.map((n) => {
      const r = n.getBoundingClientRect();
      return r.top < window.innerHeight && r.bottom > 0;
    });

    root.classList.add("sdp-armed");
    nodes.forEach((n, i) => {
      if (onScreen[i]) n.classList.add("vis");
    });

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("vis");
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    nodes.forEach((n, i) => {
      if (!onScreen[i]) io.observe(n);
    });

    return () => io.disconnect();
  }, []);

  return null;
}

export default SdpReveal;
