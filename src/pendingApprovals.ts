import type { User } from "./App";
import {
  DEFAULT_PENDING_USER_ID,
  pendingApprovalSeed,
  applyPendingPersona,
} from "./demoPersonas";

export { DEFAULT_PENDING_USER_ID } from "./demoPersonas";

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

export function pendingRequestInviterName(users: User[]): string {
  const leader = users.find(
    (u) =>
      u.status === "Active" &&
      (u.role === "Admin" ||
        u.role === "Business Partner" ||
        u.role === "Owner"),
  );
  if (!leader) return "Maria G.";
  const parts = leader.name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0]} ${parts[1][0]}.`;
  return parts[0];
}

export function pendingRequestLine(user: User, users: User[]): string {
  return `${user.role} access request by ${pendingRequestInviterName(users)} today`;
}
