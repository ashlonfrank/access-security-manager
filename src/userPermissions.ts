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
  accounts: boolean[];
};

export function defaultPermissions(): Permissions {
  return {
    allowed: Object.fromEntries(
      permissionNames.map((name) => [
        name,
        !["Requires approval", "Merchant services"].includes(name),
      ]),
    ),
    limits: Object.fromEntries(paymentTypes.map((name) => [name, "50000.00"])),
    mfa: true,
    token: "Soft token",
    accounts: [true, true, true, true],
  };
}

export function permissionsForRole(role: string): Permissions {
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
    accounts:
      role === "Read Only" ? [true, false, false, false] : [true, true, true, true],
  };
}

export const permissionsStorageKey = (id: string) => `asm-permissions-v1-${id}`;

export function readStoredPermissions(id: string): Permissions {
  const fallback = defaultPermissions();
  try {
    const saved = JSON.parse(
      localStorage.getItem(permissionsStorageKey(id)) || "null",
    );
    if (
      saved &&
      typeof saved.mfa === "boolean" &&
      ["Soft token", "Hard token", "No token"].includes(saved.token) &&
      permissionNames.every(
        (name) => typeof saved.allowed?.[name] === "boolean",
      ) &&
      paymentTypes.every(
        (name) =>
          typeof saved.limits?.[name] === "string" &&
          Number.isFinite(Number(saved.limits[name])) &&
          Number(saved.limits[name]) >= 0,
      ) &&
      Array.isArray(saved.accounts) &&
      saved.accounts.length === 4 &&
      saved.accounts.every((value: unknown) => typeof value === "boolean")
    )
      return saved;
  } catch {
    /* demo fallback */
  }
  return fallback;
}
