"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getProject, type ProjectDto } from "@/lib/projectsApi";
import { listTasks, type TaskDto } from "@/lib/tasksApi";
import { Avatar } from "@/components/graphics";
import { IconArrowRight, IconRefresh } from "@/components/icons";
import {
  Button,
  ButtonLink,
  Card,
  CardHeader,
  ErrorBox,
  LoadingCard,
  MetaList,
  Mono,
  PageHeader,
  PageShell,
  STATUS_META,
  StatCard,
} from "@/components/ui";

export default function ProjectDetailPage() {
  const params = useParams<{ orgId: string; projectId: string }>();
  const orgId = useMemo(
    () => (Array.isArray(params.orgId) ? params.orgId[0] : params.orgId),
    [params.orgId],
  );
  const projectId = useMemo(
    () => (Array.isArray(params.projectId) ? params.projectId[0] : params.projectId),
    [params.projectId],
  );

  const [project, setProject] = useState<ProjectDto | null>(null);
  const [tasks, setTasks] = useState<TaskDto[] | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!orgId || !projectId) return;
    setError("");
    setProject(null);
    try {
      setProject(await getProject(orgId, projectId));
    } catch (e: unknown) {
      setError(getErrorMessage(e, "Failed to load project"));
      return;
    }
    try {
      setTasks(await listTasks(projectId));
    } catch {
      setTasks([]);
    }
  }, [orgId, projectId]);

  useEffect(() => {
    if (!orgId || !projectId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [orgId, projectId, load]);

  const count = (s: string) => tasks?.filter((t) => t.status === s).length ?? 0;
  const total = tasks?.length ?? 0;
  const pct = total > 0 ? Math.round((count("Done") / total) * 100) : 0;
  const show = (n: number) => (tasks ? n : "—");

  return (
    <PageShell>
      <PageHeader
        leading={<Avatar seed={projectId ?? "project"} label={project?.name ?? "Project"} size={52} shape="square" />}
        eyebrow="Project"
        title={project?.name || "Project"}
        meta={<Mono>{projectId}</Mono>}
        actions={
          <>
            <Button onClick={() => void load()} variant="secondary">
              <IconRefresh size={16} /> Reload
            </Button>
            <ButtonLink href={`/orgs/${orgId}/projects/${projectId}/tasks`} variant="primary">
              Open tasks <IconArrowRight size={16} />
            </ButtonLink>
          </>
        }
      />

      {error && <ErrorBox>{error}</ErrorBox>}
      {!project && !error && <LoadingCard label="Loading project..." rows={2} />}

      {project && (
        <div className="grid gap-6">
          <section aria-label="Task counts" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="All tasks" value={show(total)} />
            <StatCard label="To do" value={show(count("Todo"))} />
            <StatCard label="In progress" value={show(count("InProgress"))} />
            <StatCard label="Done" value={show(count("Done"))} hint={tasks ? `${pct}% complete` : undefined} hintTone="success" />
          </section>

          <div className="grid gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-3">
              <CardHeader title="Delivery progress" description="Share of tasks in each stage" />
              <div className="flex items-baseline gap-2">
                <span className="font-display text-[40px] font-semibold leading-none tracking-[-0.02em]">{pct}%</span>
                <span className="text-[13.5px] text-fg-muted">complete</span>
              </div>
              <div className="mt-5 flex h-2.5 overflow-hidden rounded-full bg-subtle">
                {total > 0 &&
                  (["Done", "InProgress", "Todo"] as const).map((s) => (
                    <div key={s} style={{ width: `${(count(s) / total) * 100}%`, background: STATUS_META[s].color }} />
                  ))}
              </div>
              <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-fg-muted">
                {(["Done", "InProgress", "Todo"] as const).map((s) => (
                  <li key={s} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: STATUS_META[s].color }} aria-hidden />
                    {STATUS_META[s].label} · <span className="font-medium text-fg">{show(count(s))}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader title="Project summary" />
              <MetaList
                items={[
                  { term: "Name", value: project.name || "-" },
                  { term: "Organization ID", value: <Mono>{project.organizationId || "-"}</Mono> },
                  { term: "Project ID", value: <Mono>{project.id || "-"}</Mono> },
                ]}
              />
            </Card>
          </div>
        </div>
      )}
    </PageShell>
  );
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
