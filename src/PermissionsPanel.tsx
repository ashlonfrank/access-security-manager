import { createContext, useContext, useRef, useEffect, useLayoutEffect, useState } from "react";
import assets from "./permission-assets.json";
import RoleSelect from "./RoleSelect";
import { userStatuses } from "./business";
import Avatar from "./Avatar";
import type { User } from "./App";
type PanelUser = User;
export type UserChanges = Pick<User, "name" | "email" | "role" | "job" | "status">;
const paymentTypes = ["ACH payments", "ACH vendor payments", "Bill pay", "CashFlow 360", "Transfers and payments", "Wires"];
const statementTypes = ["See activity and balances", "See check images", "See statements and documents"];
const permissionNames = [...statementTypes, "Chase QuickDeposit", ...paymentTypes, "Requires approval", "Card access", "Merchant services"];
type Permissions = {
  allowed: Record<string, boolean>;
  limits: Record<string, string>;
  mfa: boolean;
  token: "Soft token" | "Hard token" | "No token";
  accounts: boolean[];
};
function defaults(): Permissions {
  return { allowed: Object.fromEntries(permissionNames.map((name) => [name, !["Requires approval", "Merchant services"].includes(name)])),
    limits: Object.fromEntries(paymentTypes.map((name) => [name, "50000.00"])),
    mfa: true, token: "Soft token", accounts: [true, true, true, true] };
}
function permissionsForRole(role: string): Permissions {
  const enabled = new Set<string>();
  const allow = (...names: string[]) => names.forEach((name) => enabled.add(name));
  const statements = statementTypes;
  const allMoney = ["Chase QuickDeposit", ...paymentTypes];

  switch (role) {
    case "Admin":
    case "CFO":
      allow(...statements, ...allMoney, "Card access", "Merchant services");
      break;
    case "Business Partner":
      allow(...statements, "Card access", "Merchant services");
      break;
    case "Finance Lead":
      allow(...statements, "Chase QuickDeposit", "ACH payments", "ACH vendor payments", "Bill pay", "CashFlow 360");
      break;
    case "Money Mover":
      allow(...statements, ...allMoney);
      break;
    case "Accountant":
      allow(...statements, "Chase QuickDeposit", "CashFlow 360");
      break;
    case "Read Only":
    default:
      allow(...statements, "Card access");
      break;
  }

  return {
    allowed: Object.fromEntries(permissionNames.map((name) => [name, enabled.has(name)])),
    limits: Object.fromEntries(paymentTypes.map((name) => [name, "50000.00"])),
    mfa: true,
    token: "Soft token",
    accounts: role === "Read Only" ? [true, false, false, false] : [true, true, true, true],
  };
}
const storageKey = (id: string) => `asm-permissions-v1-${id}`;
function readPermissions(id: string): Permissions {
  const fallback = defaults();
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey(id)) || "null");
    if (saved && typeof saved.mfa === "boolean" && ["Soft token", "Hard token", "No token"].includes(saved.token) &&
      permissionNames.every((name) => typeof saved.allowed?.[name] === "boolean") &&
      paymentTypes.every((name) => typeof saved.limits?.[name] === "string" && Number.isFinite(Number(saved.limits[name])) && Number(saved.limits[name]) >= 0) &&
      Array.isArray(saved.accounts) && saved.accounts.length === 4 && saved.accounts.every((value: unknown) => typeof value === "boolean")) return saved;
  } catch { /* Use the demo defaults when saved data is unavailable. */ }
  return fallback;
}
const EditorContext = createContext<{ editing: boolean; value: Permissions; setValue: React.Dispatch<React.SetStateAction<Permissions>> } | null>(null);
function PermissionItem({ text, limit = false }: { text: string; limit?: boolean }) {
  const { editing, value, setValue } = useContext(EditorContext)!;
  const allowed = value.allowed[text];
  return <li className={`permission-item ${limit ? "with-limit" : ""}`}>
    {editing ? <input type="checkbox" className="permission-checkbox" aria-label={text} checked={allowed}
      onChange={(event) => setValue((previous) => ({ ...previous, allowed: { ...previous.allowed, [text]: event.target.checked } }))} />
      : <span className={`permission-state-icon ${allowed ? "allowed" : "denied"}`} role="img" aria-label={allowed ? "Allowed" : "Not allowed"}
          style={{ maskImage: `url(${allowed ? assets.imgSuccessIcoCheckmark : assets.imgActionIcoClose})` }} />}
    <span>{text}</span>
    {limit && <><span className="daily-limit">Daily limit</span>
      {editing ? <input className="limit-input" type="number" min="0" max="999999999" step="0.01" inputMode="decimal" required aria-label={`${text} daily limit`}
        disabled={!allowed} value={value.limits[text]} onChange={(event) => setValue((previous) => ({ ...previous, limits: { ...previous.limits, [text]: event.target.value } }))} />
        : <span className="limit-value">{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value.limits[text]))}</span>}
    </>}
  </li>;
}
function Category({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return <section className="permission-category"><div className="category-heading">
    <span className="permission-category-icon" aria-hidden="true" style={{ maskImage: `url(${icon})` }} />
    <div><h4>{title}</h4><p>{{ "Statements and documents": "Balances, statements, and account records", "Money movement": "Payments, transfers, and daily limits", "Credit cards": "Business card access", "Merchant services": "Coffee shop payment processing" }[title]}</p></div>
  </div><ul>{children}</ul></section>;
}
export default function PermissionsPanel({ user, onClose, emailInUse, onDelete, onUpdate }: {
  user: PanelUser; onClose: () => void; emailInUse: (email: string) => boolean; onDelete: () => void;
  onUpdate: (patch: UserChanges) => void;
}) {
  const panel = useRef<HTMLElement>(null);
  const scroll = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState<Permissions>(() => readPermissions(user.id));
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [status, setStatus] = useState(user.status);
  const [role, setRole] = useState(user.role);
  const [job, setJob] = useState(user.job);
  const [error, setError] = useState("");
  useLayoutEffect(() => {
    const element = panel.current;
    if (!element) return;
    let frame = 0;
    const measure = () => {
      const bounds = element.parentElement?.getBoundingClientRect();
      if (bounds) {
        const columnHeader = element.parentElement?.querySelector<HTMLElement>(".list-header, .company-list-header");
        const anchor = columnHeader?.getBoundingClientRect() ?? bounds;
        element.style.setProperty("--permissions-top", `${Math.max(32, anchor.top)}px`);
        element.style.setProperty("--permissions-left", `${anchor.left + anchor.width / 2 + 2}px`);
        element.style.setProperty("--permissions-width", `${anchor.width / 2 - 2}px`);
      }
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    measure();
    const observer = new ResizeObserver(schedule);
    if (element.parentElement) observer.observe(element.parentElement);
    const main = element.closest("main");
    if (main) observer.observe(main);
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule);

    };
  }, []);
  useLayoutEffect(() => {
    setValue(readPermissions(user.id)); setEditing(false); setError("");
    setRole(user.role); setJob(user.job); setName(user.name); setEmail(user.email); setStatus(user.status); scroll.current?.scrollTo(0, 0);
  }, [user.id]);
  useEffect(() => { scroll.current?.scrollTo(0, 0); }, [user.email]);
  function beginEdit() {
    setValue(readPermissions(user.id)); setRole(user.role); setJob(user.job); setName(user.name); setEmail(user.email); setStatus(user.status);
    setError(""); setEditing(true);
  }
  function updateRole(nextRole: string) {
    setRole(nextRole);
    setValue(permissionsForRole(nextRole));
  }
  function cancelEdit() { setValue(readPermissions(user.id)); setEditing(false); setError(""); }
  function save() {
    const savedEmail = email.trim().toLowerCase();
    if (!name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(savedEmail)) {
      setError("Enter a full name and a valid email address."); return;
    }
    if (emailInUse(savedEmail)) { setError("This email address is already assigned to another user."); return; }
    if (!job.trim() || paymentTypes.some((name) => value.limits[name].trim() === "" || !Number.isFinite(Number(value.limits[name])) || Number(value.limits[name]) < 0 || Number(value.limits[name]) > 999999999 || !/^\d+(\.\d{1,2})?$/.test(value.limits[name]))) {
      setError("Enter a job title and non-negative daily limits with up to two decimal places."); return;
    }
    try { localStorage.setItem(storageKey(user.id), JSON.stringify(value)); }
    catch { setError("Changes could not be saved. Please try again."); return; }
    onUpdate({ name: name.trim(), email: savedEmail, status, role, job: job.trim() }); setEditing(false); setError("");
  }
  return <EditorContext.Provider value={{ editing, value, setValue }}>
    <aside ref={panel} className={`permissions-panel ${editing ? "editing-permissions" : ""}`} id="permissions-title" aria-label="Permissions">
      <div className="permissions-scroll" ref={scroll} tabIndex={0} aria-label={`Permissions for ${user.name}`}>
        <div className="permission-profile">
          <Avatar user={user} />
          <div className="permission-name"><h3>{user.name}</h3><p>{user.email}</p></div>
          <button className="permission-close" aria-label="Close permissions" onClick={onClose}><img src={assets.imgMask2} alt="" /></button>
          <div className="permission-actions">
            {editing ? <><button className="permission-edit primary-button" onClick={save}>Save changes</button><button onClick={cancelEdit}>Cancel</button></>
              : <><button className="permission-edit" onClick={beginEdit}>Edit<img src={assets.imgMask} alt="" /></button><button className="permission-delete" onClick={onDelete}>Delete user</button></>}
          </div>
          {error && <p className="permission-feedback error" role="alert">{error}</p>}
        </div>
        <section className="permission-info">
          <div className="permission-info-heading"><h3>User info</h3></div>
          {editing ? <div className="permission-fields">
            <label>Full name<input value={name} maxLength={80} onChange={(event) => setName(event.target.value)} /></label>
            <label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
            <RoleSelect value={role} onChange={updateRole} />
            <label>Job title<input aria-label="Job title" value={job} maxLength={80} onChange={(event) => setJob(event.target.value)} /></label>
            <label>Status<select aria-label="Status" value={status} onChange={(event) => setStatus(event.target.value)}>{userStatuses.map((option) => <option key={option}>{option}</option>)}</select></label>
          </div> : <dl><div><dt>Role</dt><dd><span className="permission-small-tag">{user.role}</span></dd></div></dl>}
        </section>
        <section className="permission-info">
          <h3>User authentication</h3>
          {editing ? <div className="authentication-editor">
            <label className="permission-option"><input className="permission-checkbox" type="checkbox" checked={value.mfa} onChange={(event) => setValue({ ...value, mfa: event.target.checked })} />Multi-factor authentication</label>
            <fieldset><legend>Authentication type</legend>{(["Soft token", "Hard token", "No token"] as const).map((token) => <label className="permission-option" key={token}><input type="radio" name={`token-${user.id}`} checked={value.token === token} onChange={() => setValue({ ...value, token })} />{token}</label>)}</fieldset>
          </div> : <dl><div><dt>Multi-factor authentication</dt><dd>{value.mfa ? "Enabled" : "Disabled"}</dd></div><div><dt>Authentication type</dt><dd><span className="permission-small-tag">{value.token}</span></dd></div></dl>}
        </section>
        <section className="permission-details"><h3>User permissions</h3><div className="permission-categories">
          <Category title="Statements and documents" icon={assets.imgIcon1}>{statementTypes.map((text) => <PermissionItem key={text} text={text} />)}</Category>
          <Category title="Money movement" icon={assets.imgIcon2}><PermissionItem text="Chase QuickDeposit" />{paymentTypes.map((text) => <PermissionItem key={text} text={text} limit />)}<PermissionItem text="Requires approval" /></Category>
          <Category title="Credit cards" icon={assets.imgIcon4}><PermissionItem text="Card access" /></Category>
          <Category title="Merchant services" icon={assets.imgIcon4}><PermissionItem text="Merchant services" /></Category>
        </div></section>
        <section className="permission-accounts"><h3>Has access to these accounts</h3><ul>{value.accounts.map((allowed, index) => <li key={index}>
          {editing ? <label className="permission-option"><input className="permission-checkbox" type="checkbox" aria-label={`Access to Savings account ${index + 1}`} checked={allowed} onChange={(event) => setValue((previous) => ({ ...previous, accounts: previous.accounts.map((checked, i) => i === index ? event.target.checked : checked) }))} />Savings (**0022)</label>
            : <><span>Savings (**0022)</span><span className={`permission-state-icon ${allowed ? "allowed" : "denied"}`} role="img" aria-label={allowed ? "Allowed" : "Not allowed"} style={{ maskImage: `url(${allowed ? assets.imgSuccessIcoCheckmark : assets.imgActionIcoClose})` }} /></>}
        </li>)}</ul></section>
      </div>
    </aside>
  </EditorContext.Provider>;
}
