import Link from "next/link";
import { ContourLines } from "@/components/graphics";
import { IconArrowRight, IconBuilding, IconFolder, IconServer, IconTicket, IconUserPlus, IconUsers } from "@/components/icons";
import { ButtonLink, PageHeader, PageShell, Section } from "@/components/ui";

const steps = [
  { n: 1, title: "Create an organization", body: "A dedicated workspace with its own people, projects and permissions.", icon: <IconBuilding size={18} /> },
  { n: 2, title: "Invite your team", body: "Send secure invitation tokens and assign Owner, Admin or Member roles.", icon: <IconUserPlus size={18} /> },
  { n: 3, title: "Plan and deliver work", body: "Organize projects, track tasks across stages, and stay in sync in real time.", icon: <IconFolder size={18} /> },
];

const shortcuts = [
  { href: "/orgs", title: "Organizations", body: "Browse and create workspaces.", icon: <IconBuilding size={18} /> },
  { href: "/users", title: "People", body: "Everyone registered on the platform.", icon: <IconUsers size={18} /> },
  { href: "/invite/accept", title: "Accept invitation", body: "Join an organization with a token.", icon: <IconTicket size={18} /> },
  { href: "/ping", title: "API status", body: "Check connectivity to the backend.", icon: <IconServer size={18} /> },
];

export default function Home() {
  return (
    <PageShell>
      <PageHeader
        title="Welcome to Ingress"
        description="Workflow management for organizations — projects, tasks, people and access in one place."
        actions={
          <>
            <ButtonLink href="/auth" variant="secondary">
              Sign in
            </ButtonLink>
            <ButtonLink href="/orgs" variant="primary">
              Go to organizations <IconArrowRight size={16} />
            </ButtonLink>
          </>
        }
      />

      <Section title="Getting started" description="Three steps to a working organization." id="getting-started">
        <div className="ing-water relative overflow-hidden rounded-2xl border border-brand-100 shadow-xs">
          <ContourLines className="pointer-events-none absolute inset-0 h-full w-full" stroke="#10a2a8" opacity={0.12} />
          <ol className="relative grid divide-y divide-brand-100 md:grid-cols-3 md:divide-x md:divide-y-0">
            {steps.map((s) => (
              <li key={s.n} className="p-6 sm:p-7">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-surface text-brand-700 shadow-xs ring-1 ring-brand-100" aria-hidden>
                    {s.icon}
                  </span>
                  <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-brand-700">Step {s.n}</span>
                </div>
                <h3 className="mt-4 text-[15.5px] font-semibold">{s.title}</h3>
                <p className="mt-1 text-[13.5px] text-fg-secondary">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      <Section title="Quick access" id="quick-access">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {shortcuts.map((s) => (
            <li key={s.href}>
              <Link
                href={s.href}
                className="group flex h-full flex-col rounded-xl border border-line bg-surface p-5 shadow-xs transition hover:border-brand-200 hover:shadow-md"
              >
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-50 text-brand-700" aria-hidden>
                  {s.icon}
                </span>
                <span className="mt-4 flex items-center justify-between text-[14.5px] font-semibold text-fg">
                  {s.title}
                  <IconArrowRight size={16} className="text-fg-subtle transition group-hover:translate-x-0.5 group-hover:text-brand-600" />
                </span>
                <span className="mt-1 text-[13px] text-fg-muted">{s.body}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>
    </PageShell>
  );
}
