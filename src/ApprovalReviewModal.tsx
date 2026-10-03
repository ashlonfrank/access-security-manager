import { useMemo, useState } from "react";
import Modal from "./Modal";
import Avatar from "./Avatar";
import type { User } from "./App";
import {
  paymentTypes,
  permissionsForRole,
  permissionsStorageKey,
  statementTypes,
  type Permissions,
} from "./userPermissions";

type Group = { id: string; title: string; items: string[] };

const permissionGroups: Group[] = [
  { id: "statements", title: "Statements and documents", items: [...statementTypes] },
  {
    id: "money",
    title: "Move money",
    items: ["Chase QuickDeposit", ...paymentTypes, "Requires approval"],
  },
  { id: "cards", title: "Credit cards", items: ["Card access"] },
  { id: "merchant", title: "Merchant services", items: ["Merchant services"] },
];

export default function ApprovalReviewModal({
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
  const [value, setValue] = useState<Permissions>(() =>
    permissionsForRole(user.role),
  );

  const groupState = useMemo(
    () =>
      permissionGroups.map((group) => ({
        ...group,
        allOn: group.items.every((item) => value.allowed[item]),
      })),
    [value.allowed],
  );

  function toggleGroup(group: Group, on: boolean) {
    setValue((previous) => ({
      ...previous,
      allowed: {
        ...previous.allowed,
        ...Object.fromEntries(group.items.map((item) => [item, on])),
      },
    }));
  }

  function approve() {
    try {
      localStorage.setItem(permissionsStorageKey(user.id), JSON.stringify(value));
    } catch {
      /* in-memory demo */
    }
    onApprove();
  }

  return (
    <Modal
      title="Advisor request details"
      className="approval-review-dialog"
      onClose={onClose}
    >
      <div className="approval-review-body" id="approval-request-title">
        <div className="approval-request-card">
          <Avatar user={user} />
          <div>
            <div className="user-name">{user.name}</div>
            <div className="user-email">{user.email}</div>
            <span className="tag role-tag">{user.role}</span>
          </div>
        </div>

        <section className="approval-permissions-section">
          <h3 className="approval-section-label">Permissions</h3>
          <p className="approval-permissions-intro">
            New advisors can get up to these permissions below. Advisors can
            invite members.
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

          <div className="approval-review-groups">
            {groupState.map((group) => (
              <div className="approval-permission-group" key={group.id}>
                <div className="approval-group-heading">
                  <span className="approval-group-title">{group.title}</span>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => toggleGroup(group, !group.allOn)}
                  >
                    {group.allOn ? "Clear all" : "Select all"}
                  </button>
                </div>
                <ul className="approval-checklist">
                  {group.items.map((text) => (
                    <li key={text}>
                      <label className="permission-option">
                        <input
                          type="checkbox"
                          className="permission-checkbox"
                          checked={value.allowed[text]}
                          onChange={(event) =>
                            setValue((previous) => ({
                              ...previous,
                              allowed: {
                                ...previous.allowed,
                                [text]: event.target.checked,
                              },
                            }))
                          }
                        />
                        <span>{text}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div className="approval-permission-group">
              <div className="approval-group-heading">
                <span className="approval-group-title">Account access</span>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => {
                    const allOn = value.accounts.every(Boolean);
                    setValue((previous) => ({
                      ...previous,
                      accounts: previous.accounts.map(() => !allOn),
                    }));
                  }}
                >
                  {value.accounts.every(Boolean) ? "Clear all" : "Select all"}
                </button>
              </div>
              <ul className="approval-checklist">
                {value.accounts.map((allowed, index) => (
                  <li key={index}>
                    <label className="permission-option">
                      <input
                        type="checkbox"
                        className="permission-checkbox"
                        checked={allowed}
                        onChange={(event) =>
                          setValue((previous) => ({
                            ...previous,
                            accounts: previous.accounts.map((checked, i) =>
                              i === index ? event.target.checked : checked,
                            ),
                          }))
                        }
                      />
                      <span>Savings (**0022)</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </div>

      <div className="dialog-actions approval-review-footer">
        <button type="button" className="pill" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="primary-button" onClick={approve}>
          Approve access
        </button>
      </div>
    </Modal>
  );
}
