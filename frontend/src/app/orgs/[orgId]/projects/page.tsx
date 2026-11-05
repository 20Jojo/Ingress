"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { createProject, listProjects, type ProjectDto } from "@/lib/projectsApi";
import { useOrgRealtime } from "@/lib/useOrgRealtime";
import { Avatar } from "@/components/graphics";
import { IconFolder, IconPlus, IconRefresh, IconTask } from "@/components/icons";
import {
  Button,
  ButtonLink,
  Card,
  EmptyState,
  ErrorBox,
  Input,
  LoadingCard,
  Mono,
  PageHeader,
  PageShell,
  Section,
  Table,
  Td,
  Th,
  THead,
  Tr,
} from "@/components/ui";

const PROJECT_EVENTS = ["project.*"];

export default function OrgProjectsPage() {
  const params = useParams<{ orgId: string }>();
  const orgId = useMemo(
    () => (Array.isArray(params.orgId) ? params.orgId[0] : params.orgId),
    [params.orgId],
  );

  const [projects, setProjects] = useState<ProjectDto[] | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(
    async (reset: boolean) => {
      if (!orgId) return;
      if (reset) {
        setError("");
        setProjects(null);
      }
      try {
        setProjects(await listProjects(orgId));
      } catch (e: unknown) {
        setError(getErrorMessage(e, "Failed to load projects"));
      }
    },
    [orgId],
  );

  async function onCreate(e?: FormEvent) {
    e?.preventDefault();
    if (!orgId) return;
    setError("");
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Project name is required.");
      return;
    }

    setBusy(true);
    try {
      await createProject(orgId, trimmed);
      setName("");
      await load(true);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to create project"));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!orgId) return;
    void load(false);
  }, [orgId, load]);

  const handleRealtime = useCallback(() => {
    void load(false);
  }, [load]);
  useOrgRealtime(orgId, handleRealtime, { eventTypes: PROJECT_EVENTS, debounceMs: 300 });

  return (
    <PageShell>
      <PageHeader
        title="Projects"
        description="Initiatives in this organization. Open a project for its summary, or go straight to its task board."
        actions={
          <Button onClick={() => void load(true)} variant="secondary">
            <IconRefresh size={16} /> Reload
          </Button>
        }
      />

      <Section title="Create a project" id="create-project">
        <Card>
          <form onSubmit={onCreate} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label htmlFor="project-name" className="mb-1.5 block text-[13px] font-medium text-fg-secondary">
                Project name
              </label>
              <Input
                id="project-name"
                data-testid="project-create-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Q3 Product Launch"
              />
            </div>
            <Button data-testid="project-create-submit" type="submit" disabled={busy}>
              <IconPlus size={16} /> {busy ? "Creating..." : "Create"}
            </Button>
          </form>
        </Card>
      </Section>

      {error && <ErrorBox>{error}</ErrorBox>}

      <Section
        title="All projects"
        description={projects ? `${projects.length} project${projects.length === 1 ? "" : "s"}` : undefined}
        id="project-list"
      >
        {projects === null && !error && <LoadingCard label="Loading projects..." />}

        {projects && projects.length === 0 && (
          <EmptyState icon={<IconFolder size={20} />} title="No projects yet" description="Create the first project for this organization above." />
        )}

        {projects && projects.length > 0 && (
          <Table caption="Projects">
            <THead>
              <Th>Project</Th>
              <Th className="hidden md:table-cell">Identifier</Th>
              <Th align="right">
                <span className="sr-only">Actions</span>
              </Th>
            </THead>
            <tbody>
              {projects.map((p, idx) => (
                <Tr key={projectKey(p, idx)} data-testid={`project-row-${p.id || idx}`}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <Avatar seed={p.id || String(idx)} label={p.name || "Project"} size={34} shape="square" />
                      <span className="font-medium text-fg">{p.name || "Untitled project"}</span>
                    </div>
                  </Td>
                  <Td className="hidden md:table-cell">
                    <Mono>{p.id || "-"}</Mono>
                  </Td>
                  <Td align="right">
                    <div className="inline-flex gap-2">
                      <ButtonLink data-testid={`project-open-${p.id || idx}`} href={`/orgs/${orgId}/projects/${p.id}`} size="sm" variant="ghost">
                        Open
                      </ButtonLink>
                      <ButtonLink data-testid={`project-tasks-${p.id || idx}`} href={`/orgs/${orgId}/projects/${p.id}/tasks`} size="sm">
                        <IconTask size={14} /> Tasks
                      </ButtonLink>
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Section>
    </PageShell>
  );
}

function projectKey(project: ProjectDto, index: number): string {
  const org = project.organizationId || "org";
  const id = project.id || `project-${index}`;
  return `${org}:${id}:${index}`;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
