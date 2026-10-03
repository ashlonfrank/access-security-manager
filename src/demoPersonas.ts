import type { User } from "./App";
import initialUsers from "./users.json";

/** Pending-approval demo row — always tied to a real roster persona. */
export const DEFAULT_PENDING_USER_ID = "69042";

/** Roster user whose identity the pending invite uses (Accountant). */
export const PENDING_PERSONA_ROSTER_ID = "69041";

export function rosterUser(id: string): User | undefined {
  return initialUsers.find((user) => user.id === id);
}

/** Build the canonical pending-approval user from the shared persona. */
export function pendingApprovalSeed(): User {
  const persona = rosterUser(PENDING_PERSONA_ROSTER_ID);
  if (!persona) {
    throw new Error("Missing pending approval persona on roster");
  }
  return {
    ...persona,
    id: DEFAULT_PENDING_USER_ID,
    status: "Needs approval",
  };
}

/** Keep pending row aligned with roster names, emails, roles, jobs, avatars. */
export function applyPendingPersona(user: User): User {
  if (user.id !== DEFAULT_PENDING_USER_ID) return user;
  const seed = pendingApprovalSeed();
  return {
    ...user,
    name: seed.name,
    email: seed.email,
    role: seed.role,
    job: seed.job,
    avatar: seed.avatar,
    status: "Needs approval",
  };
}

export function normalizeDemoPersonas(users: User[]): User[] {
  return users.map(applyPendingPersona);
}
