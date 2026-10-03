import { useEffect, useId, useRef, useState } from "react";
import { businessRoles, roleDescriptions } from "./business";
import assets from "./permission-assets.json";
export default function RoleSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const id = useId();
  const options = businessRoles;
  const [active, setActive] = useState(options.indexOf(value));
  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, []);
  useEffect(() => {
    if (open) list.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [open, active]);
  function select(role: string) { onChange(role); setOpen(false); }
  return <div className="role-picker" ref={root}>
    <span id={`${id}-label`}>Role</span>
    <button type="button" role="combobox" aria-labelledby={`${id}-label`} aria-haspopup="listbox"
      aria-expanded={open} aria-controls={`${id}-list`} aria-activedescendant={open ? `${id}-option-${active}` : undefined}
      className="role-picker-trigger" onClick={() => { setActive(options.indexOf(value)); setOpen(!open); }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) { event.preventDefault(); event.stopPropagation(); setOpen(false); }
        else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault(); setOpen(true); setActive((index) => Math.max(0, Math.min(options.length - 1, index + (event.key === "ArrowDown" ? 1 : -1))));
        } else if (event.key === "Home" && open) { event.preventDefault(); setActive(0); }
        else if (event.key === "End" && open) { event.preventDefault(); setActive(options.length - 1); }
        else if ((event.key === "Enter" || event.key === " ") && open) { event.preventDefault(); select(options[active]); }
        else if (event.key === "Tab") setOpen(false);
      }}><span className="role-picker-value">{value}</span><img className="role-picker-chevron" src={assets.imgMask} alt="" aria-hidden="true" /></button>
    {open && <div id={`${id}-list`} className="role-picker-options" role="listbox" aria-labelledby={`${id}-label`} ref={list}>
      {options.map((role, index) => <div role="option" id={`${id}-option-${index}`} data-index={index} aria-selected={value === role} key={role}
        className={`role-picker-option ${active === index ? "active" : ""}`} onPointerMove={() => setActive(index)}
        onPointerDown={(event) => event.preventDefault()} onClick={() => select(role)}>
        <span>{role}</span><small>{roleDescriptions[role]}</small>
      </div>)}
    </div>}
  </div>;
}
