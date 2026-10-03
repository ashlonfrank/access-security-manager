import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import { useId, type KeyboardEvent } from "react";

type Tab = "users" | "companies";
const tabs: Tab[] = ["users", "companies"];

export default function ManageSegments({ value, onChange }: {
  value: Tab;
  onChange: (value: Tab) => void;
}) {
  const id = useId();
  const reduceMotion = useReducedMotion();
  function navigate(event: KeyboardEvent<HTMLButtonElement>, tab: Tab) {
    let next: Tab;
    if (event.key === "Home") next = "users";
    else if (event.key === "End") next = "companies";
    else if (event.key === "ArrowRight" || event.key === "ArrowLeft") next = tab === "users" ? "companies" : "users";
    else return;
    event.preventDefault();
    onChange(next);
    document.getElementById(`${next}-tab`)?.focus();
  }
  return (
    <LayoutGroup id={id}>
      <div className="segments" role="tablist" aria-label="Manage">
        {tabs.map((tab) => (
          <button key={tab} role="tab" id={`${tab}-tab`}
            aria-selected={value === tab} aria-controls={`${tab}-panel`}
            tabIndex={value === tab ? 0 : -1}
            className={value === tab ? "selected" : ""}
            onClick={() => onChange(tab)} onKeyDown={(event) => navigate(event, tab)}>
            {value === tab && <motion.span aria-hidden="true"
              className="segment-selection" layoutId="selection" initial={false}
              transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 30, mass: 0.8 }} />}
            <span className="segment-label">{tab}{value === tab && <span className="segment-icon"><img src={`/assets/${tab}-icon.svg`} alt="" /></span>}</span>
          </button>
        ))}
      </div>
    </LayoutGroup>
  );
}
