"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { isLoggedIn } from "@/lib/auth";
import { logout } from "@/lib/authApi";
import { getOrg, listOrgs, type OrgDto } from "@/lib/orgsApi";
import { useRealtimeConnectionStatus } from "@/lib/useOrgRealtime";
import { Avatar, IngressLogo, IngressMark } from "@/components/graphics";
import {
  IconActivity,
  IconBuilding,
  IconChart,
  IconCheck,
  IconChevronDown,
  IconChevronRight,
  IconFolder,
  IconHome,
  IconLogin,
  IconLogout,
  IconMail,
  IconMenu,
  IconServer,
  IconTicket,
  IconUsers,
  IconX,
} from "@/components/icons";
import { cx } from "@/components/ui";

/** Routes rendered without the application chrome (authentication flows). */
const BARE_ROUTES = ["/auth", "/register", "/invite/accept"];

type NavItem = { href: string; label: string; icon: ReactNode; exact?: boolean };

const STATUS: Record<string, { dot: string; label: string }> = {
  connected: { dot: "bg-success-600", label: "Connected" },
  connecting: { dot: "bg-warning-500", label: "Connecting" },
  reconnecting: { dot: "bg-warning-500", label: "Reconnecting" },
  offline: { dot: "bg-danger-600", label: "Offline" },
  idle: { dot: "bg-fg-subtle", label: "Idle" },
};

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/";
  const bare = BARE_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));
  if (bare) return <>{children}</>;
  return <Chrome pathname={pathname}>{children}</Chrome>;
}

function Chrome({ pathname, children }: { pathname: string; children: ReactNode }) {
  const router = useRouter();
  const status = useRealtimeConnectionStatus();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [org, setOrg] = useState<OrgDto | null>(null);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  const orgId = matchOrgId(pathname);

  useEffect(() => {
    setLoggedIn(isLoggedIn());
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawerOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  useEffect(() => {
    let cancelled = false;
    setOrg(null);
    if (!orgId) return;
    getOrg(orgId)
      .then((o) => !cancelled && setOrg(o))
      .catch(() => {
        /* name is contextual only */
      });
    return () => {
      cancelled = true;
    };
  }, [orgId]);

  async function onSignOut() {
    try {
      await logout();
    } finally {
      setLoggedIn(false);
      router.push("/auth");
    }
  }

  const general: NavItem[] = [
    { href: "/", label: "Home", icon: <IconHome />, exact: true },
    { href: "/orgs", label: "Organizations", icon: <IconBuilding />, exact: true },
    { href: "/users", label: "People", icon: <IconUsers /> },
  ];

  const workspace: NavItem[] = orgId
    ? [
        { href: `/orgs/${orgId}`, label: "Overview", icon: <IconActivity />, exact: true },
        { href: `/orgs/${orgId}/dashboard`, label: "Dashboard", icon: <IconChart /> },
        { href: `/orgs/${orgId}/projects`, label: "Projects", icon: <IconFolder /> },
        { href: `/orgs/${orgId}/members`, label: "Members", icon: <IconUsers /> },
        { href: `/orgs/${orgId}/invite`, label: "Invitations", icon: <IconMail /> },
      ]
    : [];

  const system: NavItem[] = [
    { href: "/ping", label: "API status", icon: <IconServer /> },
    { href: "/invite/accept", label: "Accept invitation", icon: <IconTicket /> },
  ];

  const st = STATUS[status] ?? STATUS.idle;
  const crumbs = buildCrumbs(pathname, org?.name ?? null);

  const nav = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center border-b border-line px-5">
        <Link href="/" aria-label="Ingress home" className="rounded-md">
          <IngressLogo size={30} />
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-5">
        {orgId && <OrgSwitcher orgId={orgId} org={org} />}

        <NavGroup title="General" items={general} pathname={pathname} />
        {orgId && <NavGroup title="Workspace" items={workspace} pathname={pathname} />}
        <NavGroup title="System" items={system} pathname={pathname} />
      </div>

      <div className="shrink-0 border-t border-line p-3">
        {loggedIn ? (
          <div className="flex items-center gap-3 rounded-lg px-2 py-1.5">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-50 text-brand-700" aria-hidden>
              <IconCheck size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-medium text-fg">Signed in</div>
              <div className="text-[12px] text-fg-muted">Session active</div>
            </div>
            <button
              type="button"
              onClick={() => void onSignOut()}
              className="grid h-8 w-8 cursor-pointer place-items-center rounded-md text-fg-muted hover:bg-subtle hover:text-fg"
              aria-label="Sign out"
              title="Sign out"
            >
              <IconLogout size={17} />
            </button>
          </div>
        ) : (
          <Link
            href="/auth"
            className="flex items-center gap-3 rounded-lg px-2 py-2 text-[13.5px] font-medium text-fg-secondary hover:bg-subtle hover:text-fg"
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-subtle text-fg-muted" aria-hidden>
              <IconLogin size={16} />
            </span>
            {loggedIn === null ? "Checking session…" : "Sign in"}
          </Link>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:pl-[264px]">
      <a
        href="#main"
        className="sr-only z-[70] rounded-md bg-brand-700 px-4 py-2 font-medium text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] border-r border-line bg-surface lg:block" aria-label="Sidebar">
        <nav aria-label="Main" className="h-full">
          {nav}
        </nav>
      </aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 animate-fade-in bg-ocean-900/25"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-[84%] max-w-[288px] animate-fade-in border-r border-line bg-surface shadow-lg">
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close navigation"
              className="absolute right-3 top-4 z-10 grid h-8 w-8 place-items-center rounded-md text-fg-muted hover:bg-subtle"
            >
              <IconX size={18} />
            </button>
            <nav aria-label="Main" className="h-full">
              {nav}
            </nav>
          </aside>
        </div>
      )}

      <header className="sticky top-0 z-20 border-b border-line bg-surface/85 backdrop-blur-md">
        <div className="flex h-16 items-center gap-3 px-5 sm:px-8 lg:px-10">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation"
            className="-ml-1 grid h-9 w-9 place-items-center rounded-md text-fg-secondary hover:bg-subtle lg:hidden"
          >
            <IconMenu size={20} />
          </button>
          <Link href="/" aria-label="Ingress home" className="lg:hidden">
            <IngressMark size={26} />
          </Link>

          <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
            <ol className="flex min-w-0 items-center gap-1 text-[13.5px]">
              {crumbs.map((c, i) => {
                const last = i === crumbs.length - 1;
                return (
                  <li key={c.href} className={cx("flex min-w-0 items-center gap-1", !last && "hidden md:flex")}>
                    {i > 0 && <IconChevronRight size={14} className="shrink-0 text-fg-subtle" />}
                    {last ? (
                      <span aria-current="page" className="truncate font-medium text-fg">
                        {c.label}
                      </span>
                    ) : (
                      <Link href={c.href} className="truncate rounded px-1 text-fg-muted hover:text-fg">
                        {c.label}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>

          <div
            className="flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-[12.5px] text-fg-secondary"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <span className="relative flex h-2 w-2">
              {status === "connected" && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success-600/50" />}
              <span className={cx("relative inline-flex h-2 w-2 rounded-full", st.dot)} />
            </span>
            <span className="hidden sm:inline">Realtime:</span> {st.label}
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}

function NavGroup({ title, items, pathname }: { title: string; items: NavItem[]; pathname: string }) {
  return (
    <div className="mb-6 last:mb-0">
      <div className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-subtle">{title}</div>
      <ul className="grid gap-0.5">
        {items.map((item) => {
          const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "relative flex h-9 items-center gap-3 rounded-lg px-3 text-[13.5px] font-medium transition-colors",
                  active ? "bg-brand-50 text-brand-800" : "text-fg-secondary hover:bg-subtle hover:text-fg",
                )}
              >
                {active && <span aria-hidden className="absolute -left-3 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-brand-500" />}
                <span className={cx("shrink-0", active ? "text-brand-600" : "text-fg-subtle")} aria-hidden>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function OrgSwitcher({ orgId, org }: { orgId: string; org: OrgDto | null }) {
  const [open, setOpen] = useState(false);
  const [orgs, setOrgs] = useState<OrgDto[] | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    if (orgs === null) {
      listOrgs()
        .then(setOrgs)
        .catch(() => setOrgs([]));
    }
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, orgs]);

  return (
    <div ref={ref} className="relative mb-6">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        className="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-line bg-surface px-2.5 py-2 text-left shadow-xs transition-colors hover:border-line-strong"
      >
        <Avatar seed={orgId} label={org?.name ?? "Organization"} size={32} shape="square" />
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-medium uppercase tracking-[0.06em] text-fg-subtle">Organization</span>
          <span className="block truncate text-[13.5px] font-semibold text-fg">{org?.name ?? "Loading…"}</span>
        </span>
        <IconChevronDown size={16} className={cx("shrink-0 text-fg-muted transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full z-20 mt-1.5 animate-fade-in overflow-hidden rounded-lg border border-line bg-surface shadow-md">
          <div className="max-h-64 overflow-y-auto py-1">
            {orgs === null && <div className="px-3 py-2 text-[13px] text-fg-muted">Loading…</div>}
            {orgs?.length === 0 && <div className="px-3 py-2 text-[13px] text-fg-muted">No other organizations</div>}
            {orgs?.map((o) => (
              <Link
                key={o.id}
                href={`/orgs/${o.id}`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-[13.5px] text-fg-secondary hover:bg-subtle hover:text-fg"
              >
                <Avatar seed={o.id} label={o.name} size={22} shape="square" />
                <span className="flex-1 truncate">{o.name}</span>
                {o.id === orgId && <IconCheck size={15} className="text-brand-600" />}
              </Link>
            ))}
          </div>
          <Link
            href="/orgs"
            onClick={() => setOpen(false)}
            className="block border-t border-line px-3 py-2 text-[13px] font-medium text-brand-700 hover:bg-subtle"
          >
            View all organizations
          </Link>
        </div>
      )}
    </div>
  );
}

function matchOrgId(pathname: string): string | null {
  const m = pathname.match(/^\/orgs\/([^/]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

function buildCrumbs(pathname: string, orgName: string | null): { href: string; label: string }[] {
  const crumbs = [{ href: "/", label: "Home" }];
  const parts = pathname.split("/").filter(Boolean);
  let href = "";
  parts.forEach((part, i) => {
    href += `/${part}`;
    const prev = parts[i - 1];
    let label: string;
    if (part === "orgs") label = "Organizations";
    else if (prev === "orgs") label = orgName ?? "Organization";
    else if (prev === "projects") label = "Project";
    else if (prev === "tasks") label = "Task";
    else if (part === "invite") label = i === 0 ? "Invitation" : "Invitations";
    else if (part === "users") label = "People";
    else if (part === "ping") label = "API status";
    else label = part.charAt(0).toUpperCase() + part.slice(1);
    crumbs.push({ href, label });
  });
  return crumbs;
}
