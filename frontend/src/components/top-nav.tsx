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
      <nav style={navStyle} aria-label="Main" className="wf-top-nav">
        <div style={brandStyle}>Workflow Platform</div>
        {navItems.map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/"));
          return (
            <Link
              key={item.href}
              href={item.href}
              style={active ? activeLinkStyle : linkStyle}
              className={active ? "wf-nav-link wf-nav-link-active" : "wf-nav-link"}
              aria-current={active ? "page" : undefined}
            >
              {item.label}
            </Link>
          );
        })}
        <div style={statusWrapStyle} className="wf-status-pill" role="status" aria-live="polite" aria-atomic="true">
          <span style={{ ...statusDotStyle, ...statusTone[status] }} />
          <span style={statusTextStyle}>Realtime: {status}</span>
        </div>
      </nav>
    </header>
  );
}

const headerStyle: React.CSSProperties = {
  borderBottom: "1px solid color-mix(in srgb, var(--brand) 72%, black 28%)",
  background: "var(--brand)",
  boxShadow: "var(--shadow-soft)",
  position: "sticky",
  top: 0,
  zIndex: 20,
};

const navStyle: React.CSSProperties = {
  maxWidth: 1200,
  margin: "0 auto",
  padding: "10px 18px",
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  alignItems: "center",
};

const brandStyle: React.CSSProperties = {
  fontWeight: 700,
  letterSpacing: "0.01em",
  marginRight: 8,
  padding: "6px 2px",
  color: "var(--brand-contrast)",
};

const statusWrapStyle: React.CSSProperties = {
  marginLeft: "auto",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  border: "1px solid color-mix(in srgb, var(--brand-contrast) 22%, transparent)",
  borderRadius: 9999,
  padding: "6px 10px",
  background: "color-mix(in srgb, var(--brand) 80%, black 20%)",
};

const statusDotStyle: React.CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: "50%",
  display: "inline-block",
};

const statusTextStyle: React.CSSProperties = {
  fontSize: 12,
  color: "color-mix(in srgb, var(--brand-contrast) 82%, transparent)",
};

const statusTone: Record<string, React.CSSProperties> = {
  connected: { background: "#22a34a" },
  reconnecting: { background: "#d2911f" },
  connecting: { background: "#d2911f" },
  offline: { background: "#d84b4b" },
  idle: { background: "#8895ad" },
};

const linkStyle: React.CSSProperties = {
  color: "var(--brand-contrast)",
  textDecoration: "none",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "color-mix(in srgb, var(--brand-contrast) 22%, transparent)",
  borderRadius: 9999,
  padding: "6px 12px",
  fontSize: 13,
  fontWeight: 500,
  background: "transparent",
};

const activeLinkStyle: React.CSSProperties = {
  ...linkStyle,
  background: "var(--accent)",
  color: "var(--accent-contrast)",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "var(--accent)",
  boxShadow: "0 6px 18px color-mix(in srgb, var(--accent) 34%, transparent)",
};
