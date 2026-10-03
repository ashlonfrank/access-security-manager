export default function NameSortHeader({ direction, onSort, label = "Name", className }: {
  direction: "ascending" | "descending" | null;
  onSort: () => void;
  label?: string; className?: string;
}) {
  return <span className={className} role="columnheader" aria-sort={direction || "none"}>
    <button className="column-sort" onClick={onSort} aria-label={`Sort by ${label.toLowerCase()} ${direction === "ascending" ? "Z to A" : "A to Z"}`}>
      {label}<span aria-hidden="true" className={`sort-chevron ${direction === "ascending" ? "ascending" : ""}`} />
    </button>
  </span>;
}
