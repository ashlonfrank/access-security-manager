import type { User } from "./App";
import initialUsers from "./users.json";
import {
  DEFAULT_PENDING_USER_ID,
  pendingApprovalSeed,
  applyPendingPersona,
} from "./demoPersonas";

export { DEFAULT_PENDING_USER_ID } from "./demoPersonas";

/** Demo inviter for pending-access copy (Maria Gomeze, Admin). */
export const PENDING_REQUEST_INVITER_ID = "69029";

export function defaultPendingUser(): User {
  return pendingApprovalSeed();
}

export function ensureDefaultPendingApproval(users: User[]): User[] {
  const normalized = users.map(applyPendingPersona);
  if (normalized.some((user) => user.status === "Needs approval")) {
    return normalized;
  }
  const template = pendingApprovalSeed();
  const index = normalized.findIndex((user) => user.id === template.id);
  if (index >= 0) {
    const next = normalized.slice();
    next[index] = template;
    return next;
  }
  return [...normalized, template];
}

export function pendingUsers(users: User[]): User[] {
  return users.filter((user) => user.status === "Needs approval");
}

export function pendingRequestInviterName(): string {
  const inviter = initialUsers.find(
    (user) => user.id === PENDING_REQUEST_INVITER_ID,
  );
  if (!inviter) return "Maria G.";
  const parts = inviter.name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0]} ${parts[1][0]}.`;
  return parts[0];
}

export function pendingRequestLine(user: User): string {
  const roleLabel = user.role.toLowerCase();
  return `${pendingRequestInviterName()} added a user and gave ${roleLabel} access.`;
}
