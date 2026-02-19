import Link from "next/link";
import { Card, PageShell, PageTitle, Row } from "@/components/ui";

const links = [
  { href: "/ping", label: "Ping API" },
  { href: "/auth", label: "Auth" },
  { href: "/users", label: "Users" },
  { href: "/orgs", label: "Orgs" },
];

export default function Home() {
  return (
    <PageShell>
      <PageTitle
        title="Workflow Platform"
        subtitle="Frontend for auth, orgs, projects, tasks, invites, members, dashboard, and realtime updates."
      />

      <Card>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Quick Navigation</div>
        <Row>
          {links.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </Row>
      </Card>
    </PageShell>
  );
}
