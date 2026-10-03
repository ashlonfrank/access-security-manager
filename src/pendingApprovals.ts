import type { User } from "./App";
import initialUsers from "./users.json";

export const DEFAULT_PENDING_USER_ID = "69042";

export function defaultPendingUser(): User {
  const seed = initialUsers.find((u) => u.id === DEFAULT_PENDING_USER_ID);
  if (!seed) {
    throw new Error("Missing default pending approval seed user");
  }
  return { ...seed, status: "Needs approval" };
}

/** Demo: keep at least one pending approval (Pico Accountants) for the Needs approval tab. */
export function ensureDefaultPendingApproval(users: User[]): User[] {
  if (users.some((user) => user.status === "Needs approval")) return users;
  const template = defaultPendingUser();
  const index = users.findIndex((user) => user.id === template.id);
  if (index >= 0) {
    const next = users.slice();
    next[index] = { ...next[index], status: "Needs approval" };
    return next;
  }
  return [...users, template];
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
