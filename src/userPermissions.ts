import {
  migrateLegacyAccountBooleans,
  seedAccountAccess,
} from "./demoAccounts";

export const paymentTypes = [
  "ACH payments",
  "ACH vendor payments",
  "Bill pay",
  "CashFlow 360",
  "Transfers and payments",
  "Wires",
];
export const statementTypes = [
  "See activity and balances",
  "See check images",
  "See statements and documents",
];
export const permissionNames = [
  ...statementTypes,
  "Chase QuickDeposit",
  ...paymentTypes,
  "Requires approval",
  "Card access",
  "Merchant services",
];

export type Permissions = {
  allowed: Record<string, boolean>;
  limits: Record<string, string>;
  mfa: boolean;
  token: "Soft token" | "Hard token" | "No token";
  accounts: Record<string, boolean>;
};

export type PermissionUser = { id: string; role: string };

export function permissionsForRole(role: string): Omit<Permissions, "accounts"> {
  const enabled = new Set<string>();
  const allow = (...names: string[]) => names.forEach((name) => enabled.add(name));
  const allMoney = ["Chase QuickDeposit", ...paymentTypes];

  switch (role) {
    case "Admin":
    case "CFO":
      allow(...statementTypes, ...allMoney, "Card access", "Merchant services");
      break;
    case "Business Partner":
      allow(...statementTypes, "Card access", "Merchant services");
      break;
    case "Finance Lead":
      allow(
        ...statementTypes,
        "Chase QuickDeposit",
        "ACH payments",
        "ACH vendor payments",
        "Bill pay",
        "CashFlow 360",
      );
      break;
    case "Money Mover":
      allow(...statementTypes, ...allMoney);
      break;
    case "Accountant":
      allow(...statementTypes, "Chase QuickDeposit", "CashFlow 360");
      break;
    case "Read Only":
    default:
      allow(...statementTypes, "Card access");
      break;
  }

  return {
    allowed: Object.fromEntries(
      permissionNames.map((name) => [name, enabled.has(name)]),
    ),
    limits: Object.fromEntries(paymentTypes.map((name) => [name, "50000.00"])),
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

type StoredPermissionsBlob = Omit<Permissions, "accounts"> & {
  accounts: Permissions["accounts"] | boolean[];
};

function isValidSavedPermissions(saved: unknown): saved is StoredPermissionsBlob {
  if (!saved || typeof saved !== "object") return false;
  const blob = saved as StoredPermissionsBlob;
  return (
    typeof blob.mfa === "boolean" &&
    ["Soft token", "Hard token", "No token"].includes(blob.token) &&
    permissionNames.every(
      (name) => typeof blob.allowed?.[name] === "boolean",
    ) &&
    paymentTypes.every(
      (name) =>
        typeof blob.limits?.[name] === "string" &&
        Number.isFinite(Number(blob.limits[name])) &&
        Number(blob.limits[name]) >= 0,
    ) &&
    (isValidAccountMap(blob.accounts) ||
      (Array.isArray(blob.accounts) &&
        blob.accounts.length === 4 &&
        blob.accounts.every((value: unknown) => typeof value === "boolean")))
  );
}

export function readStoredPermissions(user: PermissionUser): Permissions {
  const fallback = seedPermissionsForUser(user);
  try {
    const saved = JSON.parse(
      localStorage.getItem(permissionsStorageKey(user.id)) || "null",
    );
    if (!isValidSavedPermissions(saved)) return fallback;

    const accounts = Array.isArray(saved.accounts)
      ? migrateLegacyAccountBooleans(
          saved.accounts,
          user.id,
          user.role,
          saved,
        )
      : saved.accounts;

    return { ...saved, accounts };
  } catch {
    return fallback;
  }
}
