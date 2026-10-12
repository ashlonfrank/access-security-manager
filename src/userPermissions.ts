import {
  migrateLegacyAccountBooleans,
  seedAccountAccess,
} from "./demoAccounts";

export const accountInformationTypes = [
  "See activity and balances",
  "See check images",
  "See statements and documents",
  "Download statements and documents",
];
export const statementTypes = accountInformationTypes;
export const moneyMovementTypes = [
  "Chase QuickDeposit",
  "ACH payments",
  "ACH vendor payments",
  "Bill pay",
  "CashFlow 360",
  "Transfers and payments",
  "Wires",
  "Zelle",
  "Payroll",
];
export const paymentTypes = moneyMovementTypes;
export const creditCardTypes = ["Card access", "Business credit access"];
export const merchantServiceTypes = [
  "Chase QuickAccept",
  "Mobile Checkout",
  "Payment Solutions",
];
export const permissionNames = [
  ...accountInformationTypes,
  ...moneyMovementTypes,
  ...creditCardTypes,
  ...merchantServiceTypes,
];
export const defaultDailyLimit = "50000.00";

export type Permissions = {
  allowed: Record<string, boolean>;
  limits: Record<string, string>;
  mfa: boolean;
  token: "Soft token" | "Hard token" | "No token";
  accounts: Record<string, boolean>;
};

export type PermissionUser = { id: string; role: string };

const cardAccessRoles = new Set(["Admin", "Business Partner", "Read Only"]);

export function permissionsForRole(role: string): Omit<Permissions, "accounts"> {
  const resolved = role === "CFO" ? "Admin" : role;
  const enabled = new Set<string>();
  const allow = (...names: string[]) => names.forEach((name) => enabled.add(name));
  const adminLike = resolved === "Admin";
  const finance = resolved === "Finance Lead";
  const mover = resolved === "Money Mover";
  const accountant = resolved === "Accountant";
  const partner = resolved === "Business Partner";
  const readOnly = resolved === "Read Only" || resolved === "" || ![
    "Admin",
    "Business Partner",
    "Finance Lead",
    "Money Mover",
    "Accountant",
    "Read Only",
    "Custom",
  ].includes(resolved);

  if (resolved !== "Custom") {
    allow(...accountInformationTypes);
    if (adminLike || partner || finance || mover || accountant) allow("Chase QuickDeposit");
    if (adminLike || partner || finance || mover) {
      allow("ACH payments", "ACH vendor payments", "Bill pay", "Payroll");
    }
    if (adminLike || partner || finance || mover || accountant) allow("CashFlow 360");
    if (adminLike || partner || mover) allow("Transfers and payments", "Wires", "Zelle");
    if (cardAccessRoles.has(resolved) || readOnly) allow("Card access");
    if (adminLike || partner) {
      allow("Business credit access", ...merchantServiceTypes);
    }
  }

  return {
    allowed: Object.fromEntries(
      permissionNames.map((name) => [name, enabled.has(name)]),
    ),
    limits: Object.fromEntries(
      moneyMovementTypes.map((name) => [name, defaultDailyLimit]),
    ),
    mfa: true,
    token: "Soft token",
  };
}

export function seedPermissionsForUser(user: PermissionUser): Permissions {
  const base = permissionsForRole(user.role);
  return {
    ...base,
    accounts: seedAccountAccess(user.id, user.role, base),
  };
}

export const permissionsStorageKey = (id: string) => `asm-permissions-v1-${id}`;

function isValidAccountMap(
  accounts: unknown,
): accounts is Record<string, boolean> {
  return (
    accounts !== null &&
    typeof accounts === "object" &&
    !Array.isArray(accounts) &&
    Object.values(accounts).every((value) => typeof value === "boolean")
  );
}

function isUsableLimit(value: unknown): value is string {
  return (
    typeof value === "string" &&
    Number.isFinite(Number(value)) &&
    Number(value) >= 0 &&
    Number(value) <= 999999999
  );
}

export function readStoredPermissions(user: PermissionUser): Permissions {
  const fallback = seedPermissionsForUser(user);
  try {
    const saved = JSON.parse(
      localStorage.getItem(permissionsStorageKey(user.id)) || "null",
    );
    if (!saved || typeof saved !== "object") return fallback;
    const blob = saved as Partial<Permissions> & { accounts?: unknown };
    if (typeof blob.mfa !== "boolean") return fallback;
    if (!["Soft token", "Hard token", "No token"].includes(String(blob.token))) {
      return fallback;
    }
    if (!blob.allowed || typeof blob.allowed !== "object" || Array.isArray(blob.allowed)) {
      return fallback;
    }

    const allowed = { ...fallback.allowed };
    for (const name of permissionNames) {
      if (typeof blob.allowed[name] === "boolean") allowed[name] = blob.allowed[name];
    }
    const legacyMerchant = (blob.allowed as Record<string, unknown>)["Merchant services"];
    if (typeof legacyMerchant === "boolean") {
      for (const name of merchantServiceTypes) {
        if (typeof blob.allowed[name] !== "boolean") allowed[name] = legacyMerchant;
      }
    }

    const limits = { ...fallback.limits };
    const savedLimits = blob.limits ?? {};
    for (const name of moneyMovementTypes) {
      if (isUsableLimit(savedLimits[name])) limits[name] = savedLimits[name];
    }

    let accounts = { ...fallback.accounts };
    if (Array.isArray(blob.accounts) && blob.accounts.every((value) => typeof value === "boolean") && blob.accounts.length === 4) {
      accounts = migrateLegacyAccountBooleans(blob.accounts, user.id, user.role, { allowed });
    } else if (isValidAccountMap(blob.accounts)) {
      for (const [id, selected] of Object.entries(blob.accounts)) {
        if (id in accounts) accounts[id] = selected;
      }
    }

    return {
      allowed,
      limits,
      mfa: blob.mfa,
      token: blob.token === "Hard token" ? "Hard token" : blob.token === "No token" ? "No token" : "Soft token",
      accounts,
    };
  } catch {
    return fallback;
  }
}
