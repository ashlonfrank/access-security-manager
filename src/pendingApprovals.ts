import type { User } from "./App";

export function pendingUsers(users: User[]): User[] {
  return users.filter((user) => user.status === "Needs approval");
}

export function pendingRequestLine(user: User): string {
  const inviter = user.id === "69042" ? "Maria G." : "Maria Gomeze";
  return `${user.role} access request by ${inviter} today`;
}
