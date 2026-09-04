/** The sticky "On This Page" rail. Its links are marked current by
 *  useTocActive; with JS off it is still a working anchor list. */
export default function PolicyToc({ items }: { items: { id: string; label: string }[] }) {
  return (
    <aside className="toc">
      <div className="toc-label">On This Page</div>
      <ul>
        {items.map(({ id, label }) => (
          <li key={id}>
            <a href={`#${id}`}>{label}</a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
