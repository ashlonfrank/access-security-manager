import { useState } from "react";
import Modal from "./Modal";
import Avatar from "./Avatar";
import type { User } from "./App";
import {
  permissionsForRole,
  permissionsStorageKey,
  type Permissions,
} from "./userPermissions";
import {
  EditorContext,
  PermissionAccountsEditor,
  PermissionCategoriesEditor,
} from "./permissionUi";

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
      title="Request detail"
      className="approval-review-dialog"
      onClose={onClose}
    >
      <EditorContext.Provider value={{ editing: true, value, setValue }}>
        <div
          className="approval-review-shell permissions-scroll"
          id="approval-request-title"
          tabIndex={0}
          aria-label={`Request detail for ${user.name}`}
        >
          <div className="permission-profile approval-review-profile">
            <Avatar user={user} />
            <div className="permission-name">
              <h3>{user.name}</h3>
              <p>{user.email}</p>
            </div>
          </div>

          <section className="permission-info approval-review-intro">
            <p className="approval-permissions-intro">
              Review the access this advisor is requesting for {organizationName}
              .
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
          </section>

          <section className="permission-info">
            <dl>
              <div>
                <dt>Role</dt>
                <dd>
                  <span className="permission-small-tag">{user.role}</span>
                </dd>
              </div>
              <div>
                <dt>Job</dt>
                <dd>{user.job}</dd>
              </div>
            </dl>
          </section>

          <PermissionCategoriesEditor />
          <PermissionAccountsEditor />
        </div>

        <div className="permission-actions approval-review-footer">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="permission-edit primary-button"
            onClick={approve}
          >
            Approve access
          </button>
        </div>
      </EditorContext.Provider>
    </Modal>
  );
}
