"use client";

import { useEffect } from "react";

/**
 * Highlights the active link in the `.toc` aside as the reader scrolls past
 * each `<section id="…">` it points at. Ported from the live SDP funnel.
 *
 * Fail-open by construction: without JS the TOC is still a working list of
 * anchor links, it simply never marks one as current.
 */
export function useTocActive(tocSelector = ".toc a") {
  useEffect(() => {
    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>(tocSelector));
    if (!links.length) return;

    const sections = links
      .map((link) => {
        const id = link.getAttribute("href")?.slice(1) ?? "";
        return { link, el: id ? document.getElementById(id) : null };
      })
      .filter((s): s is { link: HTMLAnchorElement; el: HTMLElement } => !!s.el);

    function onScroll() {
      const y = window.scrollY + 120;
      let current = sections[0];
      for (const s of sections) if (s.el.offsetTop <= y) current = s;
      links.forEach((a) => a.classList.remove("active"));
      if (current) current.link.classList.add("active");
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [tocSelector]);
}
