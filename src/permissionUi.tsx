import { createContext, useContext, type ReactNode } from "react";
import assets from "./permission-assets.json";
import {
  formatAccountLabel,
  visibleAccountsForUser,
  type DemoCompanyAccount,
} from "./demoAccounts";
import {
  accountInformationTypes,
  creditCardTypes,
  defaultDailyLimit,
  merchantServiceTypes,
  moneyMovementTypes,
  type Permissions,
} from "./userPermissions";

export const EditorContext = createContext<{
  editing: boolean;
  value: Permissions;
  setValue: React.Dispatch<React.SetStateAction<Permissions>>;
  userId: string;
  role: string;
  /** Company context for account catalog (defaults to user's home company). */
  companyIndex: number;
} | null>(null);

export function PermissionItem({
  text,
  limit = false,
}: {
  text: string;
  limit?: boolean;
}) {
  const ctx = useContext(EditorContext);
  if (!ctx) return null;
  const { editing, value, setValue } = ctx;
  const allowed = value.allowed[text];
  const showMoneyDetails = limit && allowed;
  const requiresApproval = value.approvals?.[text] ?? false;
  return (
    <li className={`permission-item ${showMoneyDetails ? "with-limit" : ""}`}>
      {editing ? (
        <input
          type="checkbox"
          className="permission-checkbox"
          aria-label={text}
          checked={allowed}
          onChange={(event) => {
            const checked = event.target.checked;
            setValue((previous) => ({
              ...previous,
              allowed: { ...previous.allowed, [text]: checked },
              limits:
                limit && checked
                  ? { ...previous.limits, [text]: defaultDailyLimit }
                  : previous.limits,
              approvals:
                limit && checked
                  ? { ...previous.approvals, [text]: false }
                  : previous.approvals,
            }));
          }}
        />
      ) : (
        <span
          className={`permission-state-icon ${allowed ? "allowed" : "denied"}`}
          role="img"
          aria-label={allowed ? "Allowed" : "Not allowed"}
          style={{
            maskImage: `url(${allowed ? assets.imgSuccessIcoCheckmark : assets.imgActionIcoClose})`,
          }}
        />
      )}
      <span>{text}</span>
      {showMoneyDetails && (
        <>
          <span className="daily-limit">Daily limit</span>
          {editing ? (
            <input
              className="limit-input"
              type="number"
              min="0"
              max="999999999"
              step="0.01"
              inputMode="decimal"
              required
              aria-label={`${text} daily limit`}
              value={value.limits[text] ?? defaultDailyLimit}
              onChange={(event) =>
                setValue((previous) => ({
                  ...previous,
                  limits: { ...previous.limits, [text]: event.target.value },
                }))
              }
            />
          ) : (
            <span className="limit-value">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(Number(value.limits[text]))}
            </span>
          )}
          <span className="permission-approval">
            {editing ? (
              <label className="permission-option">
                <input
                  type="checkbox"
                  className="permission-checkbox"
                  aria-label={`${text} requires approval`}
                  checked={requiresApproval}
                  onChange={(event) =>
                    setValue((previous) => ({
                      ...previous,
                      approvals: {
                        ...previous.approvals,
                        [text]: event.target.checked,
                      },
                    }))
                  }
                />
                Requires approval
              </label>
            ) : (
              <>
                <span className="permission-approval-label">Requires approval</span>
                <span className="limit-value">{requiresApproval ? "On" : "Off"}</span>
              </>
            )}
          </span>
        </>
      )}
    </li>
  );
}

const categoryDescriptions: Record<string, string> = {
  "Account Information": "Balances, statements, and account records",
  "Money movement": "Payments, transfers, and daily limits",
  "Credit cards": "Business card access",
  "Merchant services": "Coffee shop payment processing",
};

export function PermissionCategory({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: ReactNode;
}) {
  return (
    <section className="permission-category">
      <div className="category-heading">
        <span
          className="permission-category-icon"
          aria-hidden="true"
          style={{ maskImage: `url(${icon})` }}
        />
        <div>
          <h4>{title}</h4>
          <p>{categoryDescriptions[title]}</p>
        </div>
      </div>
      <ul>{children}</ul>
    </section>
  );
}

export function PermissionCategoriesEditor() {
  return (
    <section className="permission-details">
      <h3>User permissions</h3>
      <div className="permission-categories">
        <PermissionCategory title="Account Information" icon={assets.imgIcon1}>
          {accountInformationTypes.map((text) => (
            <PermissionItem key={text} text={text} />
          ))}
        </PermissionCategory>
        <PermissionCategory title="Money movement" icon={assets.imgIcon2}>
          {moneyMovementTypes.map((text) => (
            <PermissionItem key={text} text={text} limit />
          ))}
        </PermissionCategory>
        <PermissionCategory title="Credit cards" icon={assets.imgIcon4}>
          {creditCardTypes.map((text) => (
            <PermissionItem key={text} text={text} />
          ))}
        </PermissionCategory>
        <PermissionCategory title="Merchant services" icon={assets.imgIcon4}>
          {merchantServiceTypes.map((text) => (
            <PermissionItem key={text} text={text} />
          ))}
        </PermissionCategory>
      </div>
    </section>
  );
}

export function PermissionAccountsEditor() {
  const ctx = useContext(EditorContext);
  if (!ctx) return null;
  const { editing, value, setValue, userId, role, companyIndex } = ctx;
  const rows = visibleAccountsForUser(userId, role, value, companyIndex);
  return (
    <section className="permission-accounts">
      <h3>Has access to these accounts</h3>
      <ul>
        {rows.map((account) => {
          const label = formatAccountLabel(account, userId);
          const allowed = value.accounts[account.id] ?? false;
          return (
            <li key={account.id}>
              {editing ? (
                <label className="permission-option">
                  <input
                    className="permission-checkbox"
                    type="checkbox"
                    aria-label={`Access to ${label}`}
                    checked={allowed}
                    onChange={(event) =>
                      setValue((previous) => ({
                        ...previous,
                        accounts: {
                          ...previous.accounts,
                          [account.id]: event.target.checked,
                        },
                      }))
                    }
                  />
                  {label}
                </label>
              ) : (
                <>
                  <span>{label}</span>
                  <span
                    className={`permission-state-icon ${allowed ? "allowed" : "denied"}`}
                    role="img"
                    aria-label={allowed ? "Allowed" : "Not allowed"}
                    style={{
                      maskImage: `url(${allowed ? assets.imgSuccessIcoCheckmark : assets.imgActionIcoClose})`,
                    }}
                  />
                </>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
