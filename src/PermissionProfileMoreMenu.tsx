import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

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
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(
    null,
  );
  const menuId = "permission-profile-more-menu";

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) {
      setMenuPos(null);
      return;
    }
    const rect = triggerRef.current.getBoundingClientRect();
    const width = 220;
    setMenuPos({
      top: rect.bottom + 4,
      left: Math.max(8, rect.right - width),
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        const menu = document.getElementById(menuId);
        if (menu && menu.contains(e.target as Node)) return;
        setOpen(false);
      }
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
  }, [open, menuId]);

  const menu =
    open && menuPos
      ? createPortal(
          <ul
            className="permission-more-menu permission-more-menu--fixed"
            id={menuId}
            role="menu"
            aria-label={`More actions for ${userName}`}
            style={{ top: menuPos.top, left: menuPos.left }}
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
          </ul>,
          document.body,
        )
      : null;

  return (
    <div className="permission-profile-more" ref={wrapRef}>
      <button
        ref={triggerRef}
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
      {menu}
    </div>
  );
}
