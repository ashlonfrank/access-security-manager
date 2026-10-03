import { createContext, useContext, type ReactNode } from "react";
import assets from "./permission-assets.json";
import { paymentTypes, statementTypes, type Permissions } from "./userPermissions";

export const EditorContext = createContext<{
  editing: boolean;
  value: Permissions;
  setValue: React.Dispatch<React.SetStateAction<Permissions>>;
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
  return (
    <li className={`permission-item ${limit ? "with-limit" : ""}`}>
      {editing ? (
        <input
          type="checkbox"
          className="permission-checkbox"
          aria-label={text}
          checked={allowed}
          onChange={(event) =>
            setValue((previous) => ({
              ...previous,
              allowed: { ...previous.allowed, [text]: event.target.checked },
            }))
          }
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
      {limit && (
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
              disabled={!allowed}
              value={value.limits[text]}
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
        </>
      )}
    </li>
  );
}

const categoryDescriptions: Record<string, string> = {
  "Statements and documents": "Balances, statements, and account records",
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
        <PermissionCategory title="Statements and documents" icon={assets.imgIcon1}>
          {statementTypes.map((text) => (
            <PermissionItem key={text} text={text} />
          ))}
        </PermissionCategory>
        <PermissionCategory title="Money movement" icon={assets.imgIcon2}>
          <PermissionItem text="Chase QuickDeposit" />
          {paymentTypes.map((text) => (
            <PermissionItem key={text} text={text} limit />
          ))}
          <PermissionItem text="Requires approval" />
        </PermissionCategory>
        <PermissionCategory title="Credit cards" icon={assets.imgIcon4}>
          <PermissionItem text="Card access" />
        </PermissionCategory>
        <PermissionCategory title="Merchant services" icon={assets.imgIcon4}>
          <PermissionItem text="Merchant services" />
        </PermissionCategory>
      </div>
    </section>
  );
}

export function PermissionAccountsEditor() {
  const ctx = useContext(EditorContext);
  if (!ctx) return null;
  const { editing, value, setValue } = ctx;
  return (
    <section className="permission-accounts">
      <h3>Has access to these accounts</h3>
      <ul>
        {value.accounts.map((allowed, index) => (
          <li key={index}>
            {editing ? (
              <label className="permission-option">
                <input
                  className="permission-checkbox"
                  type="checkbox"
                  aria-label={`Access to Savings account ${index + 1}`}
                  checked={allowed}
                  onChange={(event) =>
                    setValue((previous) => ({
                      ...previous,
                      accounts: previous.accounts.map((checked, i) =>
                        i === index ? event.target.checked : checked,
                      ),
                    }))
                  }
                />
                Savings (**0022)
              </label>
            ) : (
              <>
                <span>Savings (**0022)</span>
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
        ))}
      </ul>
    </section>
  );
}
