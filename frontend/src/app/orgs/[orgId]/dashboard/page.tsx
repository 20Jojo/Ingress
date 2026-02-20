"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getOrgDashboardData, type DashboardData, type DashboardEvent } from "@/lib/dashboardApi";
import { useOrgRealtime } from "@/lib/useOrgRealtime";
import {
  Button,
  Card,
  EmptyState,
  ErrorBox,
  PageShell,
  PageTitle,
  Row,
} from "@/components/ui";

const DASHBOARD_EVENTS = ["invite.*", "member.*", "project.*", "task.*"];

export default function OrgDashboardPage() {
  const params = useParams<{ orgId: string }>();
  const orgId = useMemo(
    () => (Array.isArray(params.orgId) ? params.orgId[0] : params.orgId),
    [params.orgId],
  );

  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(
    async (reset: boolean) => {
      if (!orgId) return;
      if (reset) {
        setError("");
        setData(null);
      }
      try {
        const result = await getOrgDashboardData(orgId);
        setData(result);
      } catch (e: unknown) {
        setError(getErrorMessage(e, "Failed to load dashboard"));
      }
    },
    [orgId],
  );

  useEffect(() => {
    if (!orgId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(false);
  }, [orgId, load]);

  const handleRealtime = useCallback(() => {
    void load(false);
  }, [load]);

  useOrgRealtime(orgId, handleRealtime, { eventTypes: DASHBOARD_EVENTS, debounceMs: 500 });

  return (
    <PageShell wide>
      <Row>
        <Link href={`/orgs/${orgId}`}>Back to org</Link>
      </Row>

      <PageTitle title="Dashboard" subtitle={<span>Org: {orgId}</span>} />

      <Row>
        <Button onClick={() => void load(true)} variant="secondary">
          Reload
        </Button>
        <Link href={`/orgs/${orgId}/projects`}>Projects</Link>
        <Link href={`/orgs/${orgId}/members`}>Members</Link>
        <Link href={`/orgs/${orgId}/invite`}>Invites</Link>
      </Row>

      {error && <ErrorBox>{error}</ErrorBox>}

      {data && (
        <div style={{ display: "grid", gap: 14 }}>
          <section style={cardGrid}>
            <MetricCard label="Members" value={data.counts.members} />
            <MetricCard label="Projects" value={data.counts.projects} />
            <MetricCard label="Tasks" value={data.counts.tasks} />
            <MetricCard label="Overdue Tasks" value={data.counts.overdueTasks} />
            <MetricCard label="Pending Invites" value={data.counts.pendingInvites} />
            <MetricCard label="Accepted Invites" value={data.counts.acceptedInvites} />
            <MetricCard label="Revoked Invites" value={data.counts.revokedInvites} />
          </section>

          <Card>
            <h2 style={h2}>Tasks by Status</h2>
            <StatusBars data={data.tasksByStatus} />
          </Card>

          <Card>
            <h2 style={h2}>Members by Role</h2>
            <StatusBars data={data.membersByRole} />
          </Card>

          <Card>
            <h2 style={h2}>Recent Activity</h2>
            {data.recentEvents.length === 0 && <EmptyState>No recent events yet.</EmptyState>}
            {data.recentEvents.length > 0 && (
              <div style={{ border: "1px solid #eee", borderRadius: 10, overflow: "hidden" }}>
                {data.recentEvents.map((ev) => (
                  <ActivityRow key={ev.id} event={ev} />
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </PageShell>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <div style={{ fontSize: 12, opacity: 0.7 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800 }}>{value}</div>
    </Card>
  );
}

function StatusBars({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data);
  if (entries.length === 0) return <EmptyState>No data</EmptyState>;

  const max = Math.max(...entries.map(([, v]) => v), 1);
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {entries.map(([label, count]) => (
        <div key={label}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span>{label}</span>
            <strong>{count}</strong>
          </div>
          <div style={{ height: 10, borderRadius: 999, background: "#f0f0f0", overflow: "hidden" }}>
            <div
              style={{
                width: `${Math.max((count / max) * 100, count > 0 ? 6 : 0)}%`,
                height: "100%",
                background: "#111",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function ActivityRow({ event }: { event: DashboardEvent }) {
  return (
    <div style={{ padding: 10, borderBottom: "1px solid #f2f2f2" }}>
      <div style={{ fontWeight: 600 }}>{event.label}</div>
      <div style={{ opacity: 0.7, fontSize: 12 }}>
        {new Date(event.at).toLocaleString()} - {event.type}
      </div>
    </div>
  );
}

const cardGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
  gap: 10,
};

const h2: React.CSSProperties = {
  margin: "0 0 10px",
  fontSize: 18,
  fontWeight: 700,
};

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
