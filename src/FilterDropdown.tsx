import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { businessRoles, userStatuses } from "./business";

type Props = {
  roles: string[]; statuses: string[];
  onRoles: (roles: string[]) => void; onStatuses: (statuses: string[]) => void;
};
export default function FilterDropdown({ roles, statuses, onRoles, onStatuses }: Props) {
  const [open, setOpen] = useState(false);
  const [draftRoles, setDraftRoles] = useState<string[]>(roles);
  const [draftStatuses, setDraftStatuses] = useState<string[]>(statuses);
  const [category, setCategory] = useState<"Role" | "Status">("Role");
  const [position, setPosition] = useState({ left: 0, top: 0, width: 520, maxHeight: 400 });
  const trigger = useRef<HTMLButtonElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const id = useId();
  const count = roles.length + statuses.length;
  const options = category === "Role" ? businessRoles : userStatuses;
  const selected = category === "Role" ? draftRoles : draftStatuses;
  const update = category === "Role" ? setDraftRoles : setDraftStatuses;
  useLayoutEffect(() => {
    if (!open) return;
    function measure() {
      const rect = trigger.current!.getBoundingClientRect();
      const width = Math.min(520, window.innerWidth - 32);
      setPosition({ left: Math.max(16, Math.min(rect.left, window.innerWidth - width - 16)), top: rect.bottom + 8, width, maxHeight: Math.max(160, window.innerHeight - rect.bottom - 24) });
    }
    measure();
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    return () => { window.removeEventListener("scroll", measure, true); window.removeEventListener("resize", measure); };
  }, [open]);
  useEffect(() => {
    if (!open) return;
    popup.current?.querySelector<HTMLButtonElement>("[role=tab][aria-selected=true]")?.focus();
    function outside(event: PointerEvent) {
      if (!trigger.current?.contains(event.target as Node) && !popup.current?.contains(event.target as Node)) setOpen(false);
    }
    function key(event: KeyboardEvent) {
      if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); setOpen(false); trigger.current?.focus(); }
    }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", key); };
  }, [open]);
  return <>
    <button ref={trigger} aria-label="Filter" className={`pill filter-button ${count ? "active" : ""}`} aria-expanded={open} aria-controls={open ? id : undefined} onClick={() => { if (!open) { setDraftRoles([...roles]); setDraftStatuses([...statuses]); } setOpen(!open); }}>
      Filter{count > 0 && <span className="filter-count">{count}</span>}<span className="sort-chevron" aria-hidden="true" />
    </button>
    {open && createPortal(<div ref={popup} id={id} className="filter-dropdown" aria-label="User filters" style={position}>
      <div className="filter-categories" role="tablist" aria-label="Filter category">
        {(["Role", "Status"] as const).map((name) => <button key={name} id={`${id}-${name}`} role="tab" aria-selected={category === name} aria-controls={`${id}-options`} tabIndex={category === name ? 0 : -1} onKeyDown={(event) => {
          if (["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
            event.preventDefault();
            const next = event.key === "Home" ? "Role" : event.key === "End" ? "Status" : category === "Role" ? "Status" : "Role";
            setCategory(next); document.getElementById(`${id}-${next}`)?.focus();
          }
        }} onClick={() => setCategory(name)}>
          {name}<span className="filter-category-arrow" aria-hidden="true">›</span>
        </button>)}
      </div>
      <div className="filter-options" id={`${id}-options`} role="tabpanel" aria-labelledby={`${id}-${category}`}>
        <div className="filter-options-heading"><h3>{category === "Role" ? "Roles" : "Status"}</h3><button className="text-button" disabled={selected.length === options.length} onClick={() => update([...options])}>Select all</button></div>
        <div className="filter-checklist">{options.map((option) => <label key={option}><input className="permission-checkbox" type="checkbox" checked={selected.includes(option)} onChange={(event) => update(event.target.checked ? [...selected, option] : selected.filter((value) => value !== option))} />{option}</label>)}</div>
      </div>
      <div className="filter-footer"><button className="text-button" onClick={() => { setDraftRoles([]); setDraftStatuses([]); }}>Clear filters</button><button className="primary-button filter-apply" onClick={() => { onRoles(draftRoles); onStatuses(draftStatuses); setOpen(false); trigger.current?.focus(); }}>Apply</button></div>
    </div>, document.body)}
  </>;
}
