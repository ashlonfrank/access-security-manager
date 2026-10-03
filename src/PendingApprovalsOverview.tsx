import Avatar from "./Avatar";
import type { User } from "./App";
import { pendingRequestLine } from "./pendingApprovals";

export default function PendingApprovalsOverview({
  pendingUsers,
  reviewId,
  onReview,
  onDecline,
  onShowAll,
  contentClassName = "users-table-content pending-approvals",
}: {
  pendingUsers: User[];
  reviewId: string | null;
  onReview: (user: User) => void;
  onDecline: (user: User) => void;
  onShowAll?: () => void;
  contentClassName?: string;
}) {
  return (
    <div className={contentClassName}>
      {pendingUsers.length > 0 ? (
        <>
          <h2 className="pending-approvals-heading">Pending approvals</h2>
          <ul className="pending-approvals-list" aria-label="Pending approvals">
            {pendingUsers.map((user) => (
              <li
                key={user.id}
                className={`pending-approval-row ${reviewId === user.id ? "selected-pending" : ""}`}
              >
                <div className="pending-approval-identity">
                  <Avatar user={user} />
                  <div className="pending-approval-name">{user.name}</div>
                </div>
                <p className="pending-approval-meta">{pendingRequestLine(user)}</p>
                <div className="permission-actions pending-approval-actions">
                  <button
                    type="button"
                    className="permission-delete"
                    onClick={() => onDecline(user)}
                  >
                    Decline
                  </button>
                  <button
                    type="button"
                    className="permission-edit"
                    aria-expanded={reviewId === user.id}
                    aria-controls="approval-request-title"
                    onClick={() => onReview(user)}
                  >
                    Review
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className="empty-state">
          <h2>No users need approval</h2>
          <p>New users awaiting approval will appear here.</p>
          {onShowAll && (
            <button type="button" className="text-button" onClick={onShowAll}>
              Show all users
            </button>
          )}
        </div>
      )}
    </div>
  );
}
