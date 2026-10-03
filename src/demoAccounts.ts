import { coffeeCompanies, companyIndex } from "./business";
import type { Permissions } from "./userPermissions";

export type AccountProduct =
  | "checking"
  | "savings"
  | "credit_card"
  | "payroll"
  | "merchant_services";

export type DemoCompanyAccount = {
  id: string;
  companyIndex: number;
  product: AccountProduct;
  displayName: string;
};

const productDisplayNames: Record<AccountProduct, string> = {
  checking: "Chase Business Complete Checking",
  savings: "Chase Business Total Savings",
  credit_card: "Ink Business Preferred credit card",
  payroll: "Chase Payroll Services",
  merchant_services: "Chase Merchant Services",
};

/** Stable demo last-four from user + account (not refreshed randomly). */
export function accountLastFour(userId: string, accountId: string): string {
  let hash = 2166136261;
  const key = `${userId}\0${accountId}`;
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return String(Math.abs(hash) % 10000).padStart(4, "0");
}

export function formatAccountLabel(
  account: DemoCompanyAccount,
  userId: string,
): string {
  return `${account.displayName} (**${accountLastFour(userId, account.id)})`;
}

function buildCompanyCatalog(companyIdx: number): DemoCompanyAccount[] {
  const mk = (product: AccountProduct, index: number): DemoCompanyAccount => ({
    id: `c${companyIdx}-${product}-${index}`,
    companyIndex: companyIdx,
    product,
    displayName: productDisplayNames[product],
  });

  /** Company → accounts (product mix varies by location). */
  const productsByCompany: AccountProduct[][] = [
    ["checking", "checking", "savings", "credit_card", "payroll", "merchant_services"],
    ["checking", "checking", "savings", "credit_card", "merchant_services"],
    ["checking", "savings", "merchant_services"],
    ["checking", "savings", "payroll", "merchant_services"],
  ];

  const products = productsByCompany[companyIdx] ?? productsByCompany[0];
  const counts: Partial<Record<AccountProduct, number>> = {};
  return products.map((product) => {
    const index = counts[product] ?? 0;
    counts[product] = index + 1;
    return mk(product, index);
  });
}

const catalogByCompany: DemoCompanyAccount[][] = coffeeCompanies.map(
  (_company, idx) => buildCompanyCatalog(idx),
);

export function accountsForCompany(companyIdx: number): DemoCompanyAccount[] {
  return catalogByCompany[companyIdx] ?? catalogByCompany[0];
}

export function allCompanyAccountOptions(companyIdx: number): DemoCompanyAccount[] {
  return accountsForCompany(companyIdx);
}

/** Role × product baseline (company catalog still limits which rows exist). */
export function entitledProductsForRole(role: string): Set<AccountProduct> {
  switch (role) {
    case "Admin":
    case "CFO":
      return new Set([
        "checking",
        "savings",
        "credit_card",
        "payroll",
        "merchant_services",
      ]);
    case "Business Partner":
      return new Set([
        "checking",
        "savings",
        "credit_card",
        "merchant_services",
      ]);
    case "Finance Lead":
      return new Set(["checking", "savings", "payroll"]);
    case "Money Mover":
      return new Set(["checking"]);
    case "Accountant":
      return new Set(["checking", "savings"]);
    case "Read Only":
      return new Set(["checking", "savings", "credit_card"]);
    default:
      return new Set(["checking", "savings"]);
  }
}

export function isAccountEntitled(
  role: string,
  product: AccountProduct,
  companyIdx: number,
  permissions: Pick<Permissions, "allowed">,
): boolean {
  if (!accountsForCompany(companyIdx).some((row) => row.product === product)) {
    return false;
  }
  if (!entitledProductsForRole(role).has(product)) return false;

  if (
    product === "credit_card" &&
    role === "Read Only" &&
    !permissions.allowed["Card access"]
  ) {
    return false;
  }
  if (
    product === "merchant_services" &&
    !permissions.allowed["Merchant services"]
  ) {
    return false;
  }

  return true;
}

/**
 * Accounts visible for a user in a company context (home company or P2 selection).
 * Hierarchy: company → accounts → user access flags.
 */
export function visibleAccountsForUser(
  userId: string,
  role: string,
  permissions: Pick<Permissions, "allowed">,
  companyIdx: number = companyIndex(userId),
): DemoCompanyAccount[] {
  return accountsForCompany(companyIdx).filter((account) =>
    isAccountEntitled(role, account.product, companyIdx, permissions),
  );
}

function defaultAccessForAccount(
  role: string,
  account: DemoCompanyAccount,
  indexAmongVisible: number,
  permissions: Pick<Permissions, "allowed">,
): boolean {
  switch (role) {
    case "Admin":
    case "CFO":
    case "Business Partner":
    case "Finance Lead":
    case "Accountant":
      return true;
    case "Money Mover":
      return account.product === "checking" && indexAmongVisible < 2;
    case "Read Only":
      if (account.product === "checking") return indexAmongVisible === 0;
      if (account.product === "savings") return false;
      if (account.product === "credit_card") {
        return permissions.allowed["Card access"] === true;
      }
      return false;
    default:
      return indexAmongVisible === 0;
  }
}

export function seedAccountAccess(
  userId: string,
  role: string,
  permissions: Pick<Permissions, "allowed">,
  companyIdx: number = companyIndex(userId),
): Record<string, boolean> {
  const visible = visibleAccountsForUser(
    userId,
    role,
    permissions,
    companyIdx,
  );
  const access: Record<string, boolean> = {};
  visible.forEach((account, index) => {
    access[account.id] = defaultAccessForAccount(
      role,
      account,
      index,
      permissions,
    );
  });
  return access;
}

export function migrateLegacyAccountBooleans(
  legacy: boolean[],
  userId: string,
  role: string,
  permissions: Pick<Permissions, "allowed">,
  companyIdx: number = companyIndex(userId),
): Record<string, boolean> {
  const seeded = seedAccountAccess(userId, role, permissions, companyIdx);
  const ids = Object.keys(seeded);
  return Object.fromEntries(
    ids.map((id, index) => [
      id,
      typeof legacy[index] === "boolean" ? legacy[index] : seeded[id],
    ]),
  );
}
