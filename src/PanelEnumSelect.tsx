import { useEffect, useId, useRef, useState } from "react";

/** Solid dropdown matching `.role-picker` (same as Role field). */
export default function PanelEnumSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const id = useId();
  const [active, setActive] = useState(Math.max(0, options.indexOf(value)));

  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, []);

  useEffect(() => {
    setActive(Math.max(0, options.indexOf(value)));
  }, [value, options]);

  useEffect(() => {
    if (open)
      list.current
        ?.querySelector(`[data-index="${active}"]`)
        ?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  function select(option: string) {
    onChange(option);
    setOpen(false);
  }

  return (
    <div className="role-picker" ref={root}>
      <span id={`${id}-label`}>{label}</span>
      <button
        type="button"
        role="combobox"
        aria-labelledby={`${id}-label`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-activedescendant={
          open ? `${id}-option-${active}` : undefined
        }
        className="role-picker-trigger"
        onClick={() => {
          setActive(Math.max(0, options.indexOf(value)));
          setOpen(!open);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape" && open) {
            event.preventDefault();
            event.stopPropagation();
            setOpen(false);
          } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setOpen(true);
            setActive((index) =>
              Math.max(
                0,
                Math.min(
                  options.length - 1,
                  index + (event.key === "ArrowDown" ? 1 : -1),
                ),
              ),
            );
          } else if (event.key === "Home" && open) {
            event.preventDefault();
            setActive(0);
          } else if (event.key === "End" && open) {
            event.preventDefault();
            setActive(options.length - 1);
          } else if (
            (event.key === "Enter" || event.key === " ") &&
            open
          ) {
            event.preventDefault();
            select(options[active]);
          } else if (event.key === "Tab") setOpen(false);
        }}
      >
        {value}
        <span className="role-picker-chevron" aria-hidden="true">
          ⌄
        </span>
      </button>
      {open ? (
        <div
          id={`${id}-list`}
          className="role-picker-options"
          role="listbox"
          aria-labelledby={`${id}-label`}
          ref={list}
        >
          {options.map((option, index) => (
            <div
              role="option"
              id={`${id}-option-${index}`}
              data-index={index}
              aria-selected={value === option}
              key={option}
              className={`role-picker-option role-picker-option--plain ${active === index ? "active" : ""}`}
              onPointerMove={() => setActive(index)}
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => select(option)}
            >
              <span>{option}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
