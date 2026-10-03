import type { User } from "./App";

export default function Avatar({ user }: { user: User }) {
  const words = user.name.trim().split(/\s+/);
  const initials = `${words[0]?.[0] || ""}${words.length > 1 ? words.at(-1)?.[0] || "" : ""}`.toUpperCase();
  return (
    <span
      className={`avatar ${user.avatar ? "" : "placeholder"}`}
      aria-hidden="true"
    >
      {user.avatar ? <img src={user.avatar} alt="" /> : <span className="avatar-initials">{initials}</span>}
    </span>
  );
}
