import { useEffect, useRef, useState } from "react";
import assets from "./assets.json";
import companyAssets from "./company-assets.json";
import PermissionsPanel, { permissionsMotionMs, usePermissionsPresence, type UserChanges } from "./PermissionsPanel";
import type { User } from "./App";
import Avatar from "./Avatar";
import useStickyRows from "./useStickyRows";
import NameSortHeader from "./NameSortHeader";
import FilterDropdown from "./FilterDropdown";
import Modal from "./Modal";
import PendingApprovalsOverview from "./PendingApprovalsOverview";
import {
  coffeeCompanies,
  companyIndex,
  companyLabel,
  statusClass,
  isInactive,
} from "./business";

export default function CompaniesView({
  users,
  onDelete,
  onUpdate,
  reviewId,
  onReview,
  onDecline,
  onApprovalModeChange,
  onPanelOpenChange,
  permissionsDismiss = 0,
}: {
  users: User[];
  onDelete: (user: User) => void;
  onUpdate: (user: User, patch: UserChanges) => void;
  reviewId: string | null;
  onReview: (user: User) => void;
  onDecline: (user: User) => void;
  onApprovalModeChange?: (active: boolean) => void;
  onPanelOpenChange?: (open: boolean) => void;
  permissionsDismiss?: number;
}) {
  const listRef = useStickyRows();
  const [deletedCompanies, setDeletedCompanies] = useState<number[]>(() => {
    try {
      const saved: unknown = JSON.parse(
        localStorage.getItem("asm-deleted-companies-v1") || "[]",
      );
      return Array.isArray(saved)
        ? saved.filter(
            (id) =>
              Number.isInteger(id) && id >= 0 && id < coffeeCompanies.length,
          )
        : [];
    } catch {
      return [];
    }
  });
  const [deletingCompany, setDeletingCompany] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [notice, setNotice] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [approval, setApproval] = useState(false);
  const approvalTimer = useRef(0);
  useEffect(() => {
    const cancelDeferredApproval = () => window.clearTimeout(approvalTimer.current);
    document.addEventListener("pointerdown", cancelDeferredApproval, true);
    return () => document.removeEventListener("pointerdown", cancelDeferredApproval, true);
  }, []);
  const [role, setRole] = useState<string[]>([]);
  const [status, setStatus] = useState<string[]>([]);
  const [nameSort, setNameSort] = useState<"ascending" | "descending" | null>(
    null,
  );
  const [sortKey, setSortKey] = useState<"name" | "status">("name");

  useEffect(() => {
    onApprovalModeChange?.(approval);
  }, [approval, onApprovalModeChange]);

  useEffect(() => {
    onPanelOpenChange?.(Boolean(selected));
  }, [selected, onPanelOpenChange]);

  useEffect(() => {
    if (permissionsDismiss) setSelected(null);
  }, [permissionsDismiss]);

  const matchesSearch = (user: User) =>
    `${companyLabel(user.id)} ${user.name} ${user.email} ${user.role} ${user.job}`
      .toLowerCase()
      .includes(query.toLowerCase().trim());

  const pendingVisible = users.filter(
    (user) =>
      user.status === "Needs approval" &&
      !deletedCompanies.includes(companyIndex(user.id)) &&
      (!role.length || role.includes(user.role)) &&
      matchesSearch(user),
  );

  const rows = users
    .map((user) => ({
      id: user.id,
      company: companyIndex(user.id),
      user,
    }))
    .sort((a, b) => a.company - b.company)
    .filter(
      ({ user, company }) =>
        !deletedCompanies.includes(company) &&
        (!approval || user.status === "Needs approval") &&
        (!role.length || role.includes(user.role)) &&
        (!status.length || status.includes(user.status)) &&
        matchesSearch(user),
    );
  if (nameSort)
    rows.sort(
      (a, b) =>
        (nameSort === "ascending" ? 1 : -1) *
          a.user[sortKey].localeCompare(b.user[sortKey], undefined, {
            sensitivity: "base",
          }) || a.company - b.company,
    );
  const selectedRow = rows.find((row) => row.id === selected);
  const selectedUser = selectedRow?.user;
  const presence = usePermissionsPresence(selectedUser);
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !document.querySelector("dialog[open]"))
        setSelected(null);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);
  function reset() {
    setQuery("");
    setApproval(false);
    setRole([]);
    setStatus([]);
  }
  return (
    <section
      id="companies-panel"
      role="tabpanel"
      aria-labelledby="companies-tab"
      className={`companies-view ${presence.visible && !approval ? "has-permissions" : ""}`}
    >
      <div className="toolbar">
        <button
          className={`pill ${!approval ? "active" : ""}`}
          aria-pressed={!approval}
          onClick={() => {
            window.clearTimeout(approvalTimer.current);
            setApproval(false);
          }}
        >
          All users
        </button>
        <button
          className={`pill ${approval ? "active" : ""}`}
          aria-pressed={approval}
          onClick={() => {
            window.clearTimeout(approvalTimer.current);
            if (selected) {
              setSelected(null);
              approvalTimer.current = window.setTimeout(() => setApproval(true), permissionsMotionMs + 40);
            } else {
              setApproval(true);
            }
          }}
        >
          Needs approval
        </button>
        <FilterDropdown
          roles={role}
          statuses={status}
          onRoles={setRole}
          onStatuses={setStatus}
        />
        <label className="search">
          <img src={assets.imgActionIcoSearch} alt="" />
          <input
            type="search"
            aria-label="Search for users"
            placeholder="Search for users"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>
      <div className="company-content">
        {approval ? (
          <PendingApprovalsOverview
            pendingUsers={pendingVisible}
            reviewId={reviewId}
            onReview={onReview}
            onDecline={onDecline}
            onShowAll={reset}
            contentClassName="users-table-content pending-approvals"
          />
        ) : (
          <>
            <div
              ref={listRef}
              className="company-table"
              role="table"
              aria-label="Company users"
            >
              <div className="company-list-header" role="row">
                <span role="columnheader">Company</span>
                <NameSortHeader
                  direction={sortKey === "name" ? nameSort : null}
                  onSort={() => {
                    setSortKey("name");
                    setNameSort(
                      sortKey === "name" && nameSort === "ascending"
                        ? "descending"
                        : "ascending",
                    );
                  }}
                />
                <span role="columnheader" className="company-role">
                  Role
                </span>
                <NameSortHeader
                  label="Status"
                  direction={sortKey === "status" ? nameSort : null}
                  onSort={() => {
                    setSortKey("status");
                    setNameSort(
                      sortKey === "status" && nameSort === "ascending"
                        ? "descending"
                        : "ascending",
                    );
                  }}
                  className="company-status"
                />
                <span className="sr-only" role="columnheader">
                  Details
                </span>
              </div>
              <div className="list-body" role="rowgroup">
                {rows.map((row, index) => {
                  const showCompany =
                    index === 0 || rows[index - 1].company !== row.company;
                  return (
                    <div
                      role="row"
                      key={row.id}
                      className={`company-row ${isInactive(row.user.status) ? "inactive-user" : ""} ${selected === row.id ? "selected-company-user" : ""}`}
                      onClick={(event) => {
                        if (
                          (event.target as HTMLElement).closest(".company-delete")
                        ) {
                          return;
                        }
                        setSelected(row.id);
                      }}
                    >
                      <div
                        role="cell"
                        className={`company-identity ${showCompany || selected === row.id ? "company-group-start" : ""}`}
                      >
                        <img src={companyAssets.imgAvatar} alt="" width={36} height={36} />
                        <span>
                          {coffeeCompanies[row.company].name}
                          <small>{coffeeCompanies[row.company].location}</small>
                        </span>
                        <button
                          className="company-delete"
                          aria-label={`Delete ${coffeeCompanies[row.company].name}, ${coffeeCompanies[row.company].location}`}
                          title="Delete company"
                          onClick={(event) => {
                            event.stopPropagation();
                            setDeleteError("");
                            setDeletingCompany(row.company);
                          }}
                        >
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                          >
                            <path
                              d="M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7"
                              stroke="currentColor"
                              strokeWidth="1.6"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      </div>
                      <div role="cell" className="company-user">
                        <Avatar user={row.user} />
                        <div>
                          <div className="user-name">{row.user.name}</div>
                          <div className="user-email">{row.user.email}</div>
                        </div>
                      </div>
                      <div role="cell" className="company-role">
                        <span
                          className={`tag role-tag ${isInactive(row.user.status) ? "inactive-role" : ""}`}
                        >
                          {isInactive(row.user.status)
                            ? "N/A"
                            : row.user.role}
                        </span>
                      </div>
                      <div role="cell" className="company-status">
                        <span
                          className={`tag status-tag ${statusClass(row.user.status)}`}
                        >
                          {row.user.status}
                        </span>
                      </div>
                      <div role="cell">
                        <button
                          className="company-row-link"
                          aria-label={`View ${row.user.name}, company ${row.company + 1}, membership ${row.id}`}
                          aria-expanded={selected === row.id && !!selectedUser}
                          aria-controls={
                            selectedUser ? "permissions-title" : undefined
                          }
                          onClick={() => setSelected(row.id)}
                        >
                          <img src={companyAssets.imgIcon} alt="" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              {!rows.length && (
                <div className="empty-state">
                  <h2>No company users found</h2>
                  <p>Try another search or adjust your filters.</p>
                  <button className="text-button" onClick={reset}>
                    Show all users
                  </button>
                </div>
              )}
            </div>
            {presence.visible && (
              <PermissionsPanel
                user={presence.visible}
                open={presence.open}
                onUpdate={(patch) => onUpdate(presence.visible!, patch)}
                onClose={() => setSelected(null)}
                emailInUse={(email) =>
                  users.some(
                    (u) =>
                      u.id !== presence.visible!.id &&
                      u.email.toLowerCase() === email,
                  )
                }
                onDelete={() => onDelete(presence.visible!)}
              />
            )}
          </>
        )}
      </div>
      {notice && (
        <p className="company-delete-notice" role="status">
          {notice}
        </p>
      )}
      {deletingCompany !== null && (
        <Modal
          title={`Delete ${coffeeCompanies[deletingCompany].name} · ${coffeeCompanies[deletingCompany].location}?`}
          onClose={() => setDeletingCompany(null)}
        >
          <p className="dialog-description">
            This company and its memberships will no longer appear in Companies.
            User profiles and saved permissions will remain in Users.
          </p>
          {deleteError && (
            <p className="error" role="alert">
              {deleteError}
            </p>
          )}
          <div className="dialog-actions">
            <button className="pill" onClick={() => setDeletingCompany(null)}>
              Cancel
            </button>
            <button
              className="pill danger"
              onClick={() => {
                const next = [...deletedCompanies, deletingCompany];
                try {
                  localStorage.setItem(
                    "asm-deleted-companies-v1",
                    JSON.stringify(next),
                  );
                } catch {
                  setDeleteError(
                    "The company could not be deleted. Please try again.",
                  );
                  return;
                }
                if (
                  selectedUser &&
                  companyIndex(selectedUser.id) === deletingCompany
                )
                  setSelected(null);
                setDeletedCompanies(next);
                setDeletingCompany(null);
                setNotice(
                  `${coffeeCompanies[deletingCompany].name} · ${coffeeCompanies[deletingCompany].location} deleted.`,
                );
              }}
            >
              Delete company
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}
