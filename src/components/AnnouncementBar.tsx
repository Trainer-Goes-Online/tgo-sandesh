const ITEMS = [
  { num: "8+ Years", label: "Coaching Experience" },
  { num: "1000+", label: "Men Coached" },
  { num: "4X", label: "Natural Bodybuilding Pro" },
];

export function AnnouncementBar() {
  return (
    <div className="sdp-announce" role="note">
      <span className="sdp-announce-dot" aria-hidden />
      {ITEMS.map((it, i) => (
        <span className="sdp-announce-item" key={it.num}>
          {i > 0 && (
            <span className="sdp-announce-sep" aria-hidden>
              |
            </span>
          )}
          <b className="sdp-announce-num">{it.num}</b>
          <span>{it.label}</span>
        </span>
      ))}
    </div>
  );
}

export default AnnouncementBar;
