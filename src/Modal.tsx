import { useEffect, useRef, type ReactNode } from "react";

export default function Modal({
  title,
  onClose,
  children,
  className,
  labelledBy,
}: {
  title?: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  labelledBy?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.showModal();
    return () => {
      ref.current?.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={
        className ??
        (title?.startsWith("Delete ") || title?.startsWith("Are you sure")
          ? "delete-confirmation"
          : undefined)
      }
      aria-labelledby={labelledBy ?? (title ? "dialog-title" : undefined)}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="dialog-heading">
        {title ? <h2 id="dialog-title">{title}</h2> : null}
        <button className="close" onClick={onClose} aria-label="Close dialog">
          ×
        </button>
      </div>
      {children}
    </dialog>
  );
}
