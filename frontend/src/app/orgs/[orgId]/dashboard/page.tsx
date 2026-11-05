"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getOrgDashboardData, type DashboardData, type DashboardEvent } from "@/lib/dashboardApi";
import { useOrgRealtime } from "@/lib/useOrgRealtime";
import { IconActivity, IconCalendar, IconFolder, IconMail, IconRefresh, IconTask, IconUsers } from "@/components/icons";
import {
  Button,
  Card,
  CardHeader,
  EmptyState,
  ErrorBox,
  PageHeader,
  PageShell,
  ROLE_META,
  STATUS_META,
  Skeleton,
  StatCard,
  cx,
} from "@/components/ui";

const DASHBOARD_EVENTS = ["invite.*", "member.*", "project.*", "task.*"];
const FALLBACK = ["#64748b", "#0a7bb5", "#48dde0"];

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
        setData(await getOrgDashboardData(orgId));
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

  const statusRows = data
    ? Object.entries(data.tasksByStatus).map(([key, value], i) => ({
        key,
        label: STATUS_META[key]?.label ?? key,
        value,
        color: STATUS_META[key]?.color ?? FALLBACK[i % FALLBACK.length],
      }))
    : [];
  const done = data?.tasksByStatus["Done"] ?? 0;
  const completion = data && data.counts.tasks > 0 ? Math.round((done / data.counts.tasks) * 100) : 0;

  return (
    <PageShell>
      <PageHeader
        title="Dashboard"
        description="A live overview of work, people and access in this organization. Updates automatically."
        actions={
          <Button onClick={() => void load(true)} variant="secondary">
            <IconRefresh size={16} /> Reload
          </Button>
        }
      />

      {error && <ErrorBox>{error}</ErrorBox>}

      {!data && !error && <DashboardSkeleton />}

      {data && (
        <div className="grid gap-6">
          <section aria-label="Key metrics" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Members" value={data.counts.members} icon={<IconUsers size={16} />} />
            <StatCard label="Projects" value={data.counts.projects} icon={<IconFolder size={16} />} />
            <StatCard label="Tasks" value={data.counts.tasks} icon={<IconTask size={16} />} hint={`${completion}% complete`} hintTone="success" />
            <StatCard
              label="Overdue tasks"
              value={data.counts.overdueTasks}
              icon={<IconCalendar size={16} />}
              hint={data.counts.overdueTasks > 0 ? "Needs attention" : "Everything on schedule"}
              hintTone={data.counts.overdueTasks > 0 ? "danger" : "muted"}
            />
          </section>

          <div className="grid gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-3">
              <CardHeader title="Tasks by status" description={`${data.counts.tasks} tasks across ${data.counts.projects} projects`} />
              {statusRows.length === 0 ? (
                <EmptyState icon={<IconTask size={20} />} title="No tasks yet" compact />
              ) : (
                <>
                  <div
                    className="flex h-3 w-full overflow-hidden rounded-full bg-subtle"
                    role="img"
                    aria-label={statusRows.map((r) => `${r.label}: ${r.value}`).join(", ")}
                  >
                    {statusRows.map((r) => (
                      <div key={r.key} style={{ width: `${(r.value / Math.max(data.counts.tasks, 1)) * 100}%`, background: r.color }} />
                    ))}
                  </div>
                  <ul className="mt-6 grid gap-3 sm:grid-cols-3">
                    {statusRows.map((r) => (
                      <li key={r.key} className="rounded-lg border border-line px-4 py-3">
                        <div className="flex items-center gap-2 text-[13px] text-fg-muted">
                          <span className="h-2 w-2 rounded-full" style={{ background: r.color }} aria-hidden />
                          {r.label}
                        </div>
                        <div className="mt-1 flex items-baseline gap-2">
                          <span className="font-display text-[22px] font-semibold">{r.value}</span>
                          <span className="text-[12.5px] text-fg-muted">
                            {Math.round((r.value / Math.max(data.counts.tasks, 1)) * 100)}%
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader title="Members by role" description="Access distribution" />
              <RoleBars data={data.membersByRole} />
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-2">
              <CardHeader title="Invitations" description="Status of issued invitation tokens" icon={<IconMail size={17} />} />
              <dl className="divide-y divide-line">
                <InviteRow label="Pending" value={data.counts.pendingInvites} dot="bg-warning-500" />
                <InviteRow label="Accepted" value={data.counts.acceptedInvites} dot="bg-success-600" />
                <InviteRow label="Revoked" value={data.counts.revokedInvites} dot="bg-fg-subtle" />
              </dl>
            </Card>

            <Card className="lg:col-span-3">
              <CardHeader title="Recent activity" description="Latest tasks and invitations" icon={<IconActivity size={17} />} />
              {data.recentEvents.length === 0 ? (
                <EmptyState icon={<IconActivity size={20} />} title="No recent activity" compact />
              ) : (
                <ol>
                  {data.recentEvents.map((ev, i) => (
                    <ActivityRow key={ev.id} event={ev} last={i === data.recentEvents.length - 1} />
                  ))}
                </ol>
              )}
            </Card>
          </div>
        </div>
      )}
    </PageShell>
  );
}

function RoleBars({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data);
  if (entries.length === 0) return <EmptyState icon={<IconUsers size={20} />} title="No members" compact />;
  const total = entries.reduce((s, [, v]) => s + v, 0) || 1;
  return (
    <ul className="grid gap-5">
      {entries.map(([role, count]) => (
        <li key={role}>
          <div className="mb-2 flex items-center justify-between text-[13.5px]">
            <span className="font-medium text-fg-secondary">{role}</span>
            <span className="text-fg-muted">
              <span className="font-semibold text-fg">{count}</span> · {Math.round((count / total) * 100)}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-subtle">
            <div
              className="h-full rounded-full transition-[width] duration-500"
              style={{ width: `${(count / total) * 100}%`, background: ROLE_META[role]?.color ?? "#48dde0" }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function InviteRow({ label, value, dot }: { label: string; value: number; dot: string }) {
  return (
    <div className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
      <dt className="flex items-center gap-2.5 text-[13.5px] text-fg-secondary">
        <span className={cx("h-2 w-2 rounded-full", dot)} aria-hidden />
        {label}
      </dt>
      <dd className="m-0 font-display text-[18px] font-semibold">{value}</dd>
    </div>
  );
}

function ActivityRow({ event, last }: { event: DashboardEvent; last: boolean }) {
  const isTask = event.type === "task_created";
  return (
    <li className="relative flex gap-3 pb-4 last:pb-0">
      {!last && <span aria-hidden className="absolute bottom-0 left-[15px] top-8 w-px bg-line" />}
      <span
        className={cx(
          "relative grid h-8 w-8 shrink-0 place-items-center rounded-full ring-4 ring-surface",
          isTask ? "bg-brand-50 text-brand-700" : "bg-ocean-50 text-ocean-700",
        )}
        aria-hidden
      >
        {isTask ? <IconTask size={15} /> : <IconMail size={15} />}
      </span>
      <div className="min-w-0 pt-1">
        <div className="text-[13.5px] font-medium text-fg">{event.label}</div>
        <div className="text-[12.5px] text-fg-muted">
          {isTask ? "Task" : "Invitation"} · {new Date(event.at).toLocaleString()}
        </div>
      </div>
    </li>
  );
}

function DashboardSkeleton() {
  return (
    <div role="status" aria-busy="true" className="grid gap-6">
      <span className="sr-only">Loading dashboard…</span>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-line bg-surface p-5 shadow-xs">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-4 h-7 w-12" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="h-56 rounded-xl border border-line bg-surface p-6 lg:col-span-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="mt-6 h-3 w-full" />
        </div>
        <div className="h-56 rounded-xl border border-line bg-surface p-6 lg:col-span-2">
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    </div>
  );
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
