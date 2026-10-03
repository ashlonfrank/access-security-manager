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

export function pendingRequestLine(user: User): string {
  const inviter = user.id === "69042" ? "Maria G." : "Maria Gomeze";
  return `${user.role} access request by ${inviter} today`;
}
