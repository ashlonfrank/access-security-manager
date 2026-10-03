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
  onClose,
  onApprove,
}: {
  user: User;
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
      className="approval-review-dialog"
      labelledBy="approval-request-title"
      onClose={onClose}
    >
      <EditorContext.Provider value={{ editing: true, value, setValue }}>
        <div className="permissions-panel editing-permissions approval-review-panel">
          <div
            className="permissions-scroll"
            tabIndex={0}
            aria-label={`Request details for ${user.name}`}
          >
            <div className="permission-profile approval-review-profile">
              <Avatar user={user} />
              <div className="permission-name">
                <h3>{user.name}</h3>
                <p>{user.email}</p>
              </div>
            </div>

            <div
              className="approval-review-scroll-heading"
              id="approval-request-title"
            >
              <h3>Request details</h3>
            </div>

            <section className="permission-info">
              <div className="permission-info-heading">
                <h3>User info</h3>
              </div>
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
        </div>
      </EditorContext.Provider>
    </Modal>
  );
}
