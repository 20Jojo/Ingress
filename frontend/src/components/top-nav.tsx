"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/ping", label: "Ping" },
  { href: "/auth", label: "Auth" },
  { href: "/users", label: "Users" },
  { href: "/orgs", label: "Orgs" },
];

export default function TopNav() {
  const pathname = usePathname();

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
