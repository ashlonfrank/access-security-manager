import { useEffect, useRef, useState } from "react";

export default function PermissionProfileMoreMenu({
  userName,
  onDelete,
  onSendOneTimePassword,
}: {
  userName: string;
  onDelete: () => void;
  onSendOneTimePassword: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const menuId = "permission-profile-more-menu";

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="permission-profile-more" ref={ref}>
      <button
        type="button"
        className="permission-more-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="visually-hidden">More actions for {userName}</span>
        <span aria-hidden="true">⋯</span>
      </button>
      {open ? (
        <ul
          className="permission-more-menu"
          id={menuId}
          role="menu"
          aria-label={`More actions for ${userName}`}
        >
          <li role="none">
            <button
              type="button"
              role="menuitem"
              className="permission-more-menu-danger"
              onClick={() => {
                setOpen(false);
                onDelete();
              }}
            >
              Delete user
            </button>
          </li>
          <li role="none">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onSendOneTimePassword();
              }}
            >
              Send one time password
            </button>
          </li>
        </ul>
      ) : null}
    </div>
  );
}
