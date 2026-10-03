import { useLayoutEffect, useRef, useState } from "react";
import assets from "./permission-assets.json";
import Avatar from "./Avatar";
import type { User } from "./App";

const moveMoneyPermissions = [
  "Send money",
  "Recipient management",
  "Internal transfers",
  "Invoice creation",
] as const;

export default function ApprovalRequestPanel({
  user,
  organizationName,
  onClose,
  onApprove,
}: {
  user: User;
  organizationName: string;
  onClose: () => void;
  onApprove: () => void;
}) {
  const panel = useRef<HTMLElement>(null);
  const scroll = useRef<HTMLDivElement>(null);
  const [allowed, setAllowed] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(moveMoneyPermissions.map((name) => [name, false])),
  );

  const allSelected = moveMoneyPermissions.every((name) => allowed[name]);

  useLayoutEffect(() => {
    const element = panel.current;
    if (!element) return;
    let frame = 0;
    const measure = () => {
      const bounds = element.parentElement?.getBoundingClientRect();
      if (bounds) {
        const anchor =
          element.parentElement?.querySelector<HTMLElement>(
            ".pending-approvals-heading, .pending-approvals",
          )?.getBoundingClientRect() ?? bounds;
        element.style.setProperty(
          "--permissions-top",
          `${Math.max(32, anchor.top)}px`,
        );
        element.style.setProperty(
          "--permissions-left",
          `${anchor.left + anchor.width / 2 + 2}px`,
        );
        element.style.setProperty(
          "--permissions-width",
          `${anchor.width / 2 - 2}px`,
        );
      }
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    measure();
    const observer = new ResizeObserver(schedule);
    if (element.parentElement) observer.observe(element.parentElement);
    const main = element.closest("main");
    if (main) observer.observe(main);
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule);
    };
  }, []);

  function toggleAll() {
    const next = !allSelected;
    setAllowed(
      Object.fromEntries(moveMoneyPermissions.map((name) => [name, next])),
    );
  }

  return (
    <aside
      ref={panel}
      className="permissions-panel approval-request-panel"
      id="approval-request-title"
      aria-label="Access request details"
    >
      <div
        className="permissions-scroll"
        ref={scroll}
        tabIndex={0}
        aria-label={`Access request from ${user.name}`}
      >
        <div className="approval-request-header">
          <h2>Access request details</h2>
          <button
            className="permission-close"
            aria-label="Close access request"
            onClick={onClose}
          >
            <img src={assets.imgMask2} alt="" />
          </button>
        </div>
        <div className="approval-request-card">
          <Avatar user={user} />
          <div>
            <div className="user-name">{user.name}</div>
            <div className="user-email">{user.email}</div>
          </div>
        </div>
        <section className="permission-info approval-permissions-section">
          <h3>Permissions</h3>
          <p className="approval-permissions-intro">
            New users can get up to these permissions below. Users with access
            can invite other members.
          </p>
          <div className="approval-info-banner" role="note">
            <span className="approval-info-icon" aria-hidden="true">
              i
            </span>
            <p>
              Existing members who already have access to {organizationName}{" "}
              keep their existing permissions.
            </p>
          </div>
          <div className="approval-permission-group">
            <div className="approval-group-heading">
              <span className="approval-group-title">
                Move money
                <span className="approval-info-dot" aria-hidden="true">
                  i
                </span>
              </span>
              <button type="button" className="text-button" onClick={toggleAll}>
                {allSelected ? "Clear all" : "Select All"}
              </button>
            </div>
            <ul className="approval-checklist">
              {moveMoneyPermissions.map((text) => (
                <li key={text}>
                  <label className="permission-option">
                    <input
                      type="checkbox"
                      className="permission-checkbox"
                      checked={allowed[text]}
                      onChange={(event) =>
                        setAllowed((previous) => ({
                          ...previous,
                          [text]: event.target.checked,
                        }))
                      }
                    />
                    <span>{text}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        </section>
        <div className="approval-request-actions">
          <button type="button" className="pill" onClick={onClose}>
            Back
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={onApprove}
          >
            Approve access
          </button>
        </div>
      </div>
    </aside>
  );
}
