"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";

import { COUNTRIES, countryByCode, type Country } from "@/lib/countries";

/**
 * Phone number with a themed dial-code picker. Used on the qualifying form's
 * last step.
 *
 * Custom, not a native <select>: on desktop the native list is the browser's
 * grey panel, which breaks the modal's look. What the native one gives for free
 * is rebuilt deliberately:
 *   · type-ahead: a search box matching name, ISO code or dial code
 *   · keyboard: ↑ ↓ Home End to move, Enter to pick, Esc to close
 *   · closes on an outside press, on Tab away, and on pick
 *   · combobox / listbox ARIA
 *
 * Esc inside the picker stops there: the modal closes on Esc too, and one
 * keypress must not do both.
 *
 * The ISO code is shown in a chip, not a flag emoji: Windows has no flag emoji
 * and renders them as bare letters, and the skin bans emoji in chrome.
 */
export default function PhoneField({
  code,
  onCode,
  value,
  onChange,
  invalid,
  labelledBy,
  onEnter,
}: {
  code: string;
  onCode: (code: string) => void;
  value: string;
  onChange: (v: string) => void;
  invalid?: boolean;
  labelledBy?: string;
  onEnter?: () => void;
}) {
  const selected = countryByCode(code);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [pos, setPos] = useState<CSSProperties>({});
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    const digits = q.replace(/^\+/, "");
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase() === q ||
        (/^\d+$/.test(digits) && c.dial.slice(1).startsWith(digits)),
    );
  }, [query]);

  const openList = () => {
    setQuery("");
    setActive(Math.max(0, COUNTRIES.findIndex((c) => c.code === code)));
    setOpen(true);
  };
  const close = (refocus: boolean) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  };
  const choose = (c: Country) => {
    onCode(c.code);
    close(true);
  };

  /* THE PANEL IS PORTALLED, position:fixed (2026-10-26). Rendered in place it
     lived inside the modal's scrolling body, which clips: on a short screen
     the list was cut off and the modal's footer sat on top of it. Portalled
     into the modal overlay (still inside `.sdp-qm`, so its styles and the
     modal's own stacking apply) and placed from the field's on-screen box,
     it floats above everything. It opens UPWARD when there is not enough room
     below, and the list shrinks to whatever room there is. */
  const place = useCallback(() => {
    const r = wrapRef.current?.getBoundingClientRect();
    if (!r) return;
    const GAP = 6;
    const EDGE = 12;
    const SEARCH = 64; // the search box and its margins
    const below = window.innerHeight - r.bottom - GAP - EDGE;
    const above = r.top - GAP - EDGE;
    const down = below >= 260 || below >= above;
    const room = down ? below : above;
    setPos({
      left: r.left,
      width: r.width,
      ...(down
        ? { top: r.bottom + GAP }
        : { bottom: window.innerHeight - r.top + GAP }),
      ["--phone-list-h" as string]: `${Math.max(120, Math.min(240, room - SEARCH))}px`,
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    setHost(rootRef.current?.closest<HTMLElement>(".sdp-qm") ?? document.body);
    place();
    /* Outside press closes it. pointerdown, so the panel is gone before
       whatever was pressed reacts. The panel is portalled, so "inside" is
       the field OR the panel. */
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!rootRef.current?.contains(t) && !panelRef.current?.contains(t)) setOpen(false);
    };
    /* Capture: the modal body scrolls, not the window. */
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    document.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open, place]);

  /* Focus once the portal has mounted (the first open has no host yet). */
  useEffect(() => {
    if (open && host) searchRef.current?.focus();
  }, [open, host]);

  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector<HTMLElement>(`[data-i="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  const onSearchKey = (e: KeyboardEvent<HTMLInputElement>) => {
    const last = matches.length - 1;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(last, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(last);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (matches[active]) choose(matches[active]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.nativeEvent.stopImmediatePropagation();
      close(true);
    } else if (e.key === "Tab") {
      close(false);
    }
  };

  return (
    <div className="sdp-phone" ref={rootRef}>
      <div ref={wrapRef} className={`sdp-phone-wrap${invalid ? " is-invalid" : ""}`}>
        <button
          ref={triggerRef}
          type="button"
          className="sdp-phone-code"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={`Country code: ${selected.name} ${selected.dial}`}
          onClick={() => (open ? close(false) : openList())}
          onKeyDown={(e) => {
            if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
              e.preventDefault();
              openList();
            }
          }}
        >
          <span className="sdp-phone-chip" aria-hidden>{selected.code}</span>
          <span className="sdp-phone-dial" aria-hidden>{selected.dial}</span>
          <span className={`sdp-phone-chev${open ? " is-open" : ""}`} aria-hidden>▾</span>
        </button>

        <input
          className="sdp-phone-input"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          enterKeyHint="next"
          placeholder={code === "IN" ? "98765 43210" : "Phone number"}
          aria-labelledby={labelledBy}
          aria-invalid={invalid || undefined}
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^\d\s-]/g, ""))}
          onKeyDown={(e) => e.key === "Enter" && onEnter?.()}
        />
      </div>

      {open && host && createPortal(
        <div className="sdp-phone-panel" ref={panelRef} style={pos}>
          <input
            ref={searchRef}
            className="sdp-phone-search"
            type="text"
            role="combobox"
            aria-expanded
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={matches[active] ? `${listId}-${matches[active].code}` : undefined}
            aria-label="Search countries"
            placeholder="Search country or code"
            autoComplete="off"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onSearchKey}
          />
          <ul className="sdp-phone-list" role="listbox" id={listId} ref={listRef} aria-label="Countries">
            {matches.map((c, i) => (
              <li
                key={c.code}
                id={`${listId}-${c.code}`}
                data-i={i}
                role="option"
                aria-selected={c.code === code}
                className={`sdp-phone-option${i === active ? " is-active" : ""}${c.code === code ? " is-selected" : ""}`}
                /* mousedown is cancelled so the search box keeps focus */
                onMouseDown={(e) => e.preventDefault()}
                onMouseMove={() => setActive(i)}
                onClick={() => choose(c)}
              >
                <span className="sdp-phone-chip">{c.code}</span>
                <span className="sdp-phone-name">{c.name}</span>
                <span className="sdp-phone-optdial">{c.dial}</span>
              </li>
            ))}
            {matches.length === 0 && <li className="sdp-phone-empty">No country matches</li>}
          </ul>
        </div>,
        host,
      )}
    </div>
  );
}
