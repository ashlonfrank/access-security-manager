export const businessRoles = ["Admin", "Business Partner", "Accountant", "CFO", "Finance Lead", "Money Mover", "Read Only"];
export const roleDescriptions: Record<string, string> = {
  Admin: "Full control including policies, accounts, and settings",
  "Business Partner": "Shares oversight of business finances, accounts, and banking activity",
  Accountant: "Can view all accounts and transactions, and manage books",
  CFO: "Full non-admin access to accounts, payments, cards, and users",
  "Finance Lead": "Manages bookkeeping, transaction coding, ACH processing, and ledger integrations",
  "Money Mover": "Can initiate payments and transfers, and manage recipients on selected accounts",
  "Read Only": "Can view all accounts and transactions, and be issued cards",
};
export function normalizeRole(role: string) {
  if (businessRoles.includes(role)) return role;
  const previousRoles: Record<string, string> = {
    Owner: "Admin", "Business partner": "Business Partner", "Co-owner": "Admin", "Co-Owner": "Admin",
    "Finance Manager": "Finance Lead", "Finance manager": "Finance Lead", "Finance lead": "Finance Lead",
    "Operations manager": "Finance Lead", Bookkeeper: "Finance Lead", "Store manager": "Money Mover",
    "Assistant store manager": "Money Mover", "Shift supervisor": "Money Mover",
    "Accounts payable": "Money Mover", "Payroll specialist": "Money Mover",
  };
  return previousRoles[role] || "Read Only";
}
export const coffeeCompanies = [
  { name: "Bean & Branch", location: "Head office" },
  { name: "Bean & Branch", location: "Downtown" },
  { name: "Bean & Branch", location: "Riverside" },
  { name: "Bean & Branch", location: "Roastery" },
];
export function companyIndex(userId: string) {
  if (["69032", "69037", "69038"].includes(userId)) return 1;
  if (userId === "69039") return 2;
  if (!/^690(29|30|31|33|34|35|36|40|41)$/.test(userId)) return 3;
  return 0;
}
export function companyLabel(userId: string) {
  const company = coffeeCompanies[companyIndex(userId)];
  return `${company.name} · ${company.location}`;
}

export const userStatuses = ["Active", "Invited", "Needs approval", "Deactivated", "Removed"];
export function statusClass(status: string) {
  return isInactive(status) ? "removed" : status === "Invited" ? "invited" : status === "Needs approval" ? "pending" : "";
}

export function isInactive(status: string) { return status === "Removed" || status === "Deactivated"; }
