"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRealtimeConnectionStatus } from "@/lib/useOrgRealtime";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/ping", label: "Ping" },
  { href: "/auth", label: "Auth" },
  { href: "/users", label: "Users" },
  { href: "/orgs", label: "Orgs" },
];

export default function TopNav() {
  const pathname = usePathname();
  const status = useRealtimeConnectionStatus();

  return (
    <header style={headerStyle}>
      <nav style={navStyle} aria-label="Main">
        {navItems.map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/"));
          return (
            <Link key={item.href} href={item.href} style={active ? activeLinkStyle : linkStyle}>
              {item.label}
            </Link>
          );
        })}
        <div style={statusWrapStyle}>
          <span style={{ ...statusDotStyle, ...statusTone[status] }} />
          <span style={statusTextStyle}>Realtime: {status}</span>
        </div>
      </nav>
    </header>
  );
}

const headerStyle: React.CSSProperties = {
  borderBottom: "1px solid #e9e9e9",
  background: "#fff",
  position: "sticky",
  top: 0,
  zIndex: 20,
};

const navStyle: React.CSSProperties = {
  maxWidth: 1120,
  margin: "0 auto",
  padding: "10px 16px",
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  alignItems: "center",
};

const statusWrapStyle: React.CSSProperties = {
  marginLeft: "auto",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  border: "1px solid var(--border)",
  borderRadius: 999,
  padding: "6px 10px",
  background: "var(--surface)",
};

const statusDotStyle: React.CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: "50%",
  display: "inline-block",
};

const statusTextStyle: React.CSSProperties = {
  fontSize: 12,
  color: "var(--text-muted)",
};

const statusTone: Record<string, React.CSSProperties> = {
  connected: { background: "#1e9e42" },
  reconnecting: { background: "#d08b16" },
  connecting: { background: "#d08b16" },
  offline: { background: "#c83a3a" },
  idle: { background: "#9e9e9e" },
};

const linkStyle: React.CSSProperties = {
  color: "#333",
  textDecoration: "none",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#ddd",
  borderRadius: 999,
  padding: "6px 10px",
  fontSize: 14,
};

const activeLinkStyle: React.CSSProperties = {
  ...linkStyle,
  background: "#111",
  color: "#fff",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#111",
};
