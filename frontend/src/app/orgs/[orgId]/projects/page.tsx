"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createProject, listProjects, type ProjectDto } from "@/lib/projectsApi";
import { useOrgRealtime } from "@/lib/useOrgRealtime";
import {
  Button,
  DataList,
  DataRow,
  EmptyState,
  ErrorBox,
  Input,
  PageShell,
  PageTitle,
  Row,
} from "@/components/ui";

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

  async function onCreate() {
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
    } catch (e: unknown) {
      setError(getErrorMessage(e, "Failed to create project"));
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
  useOrgRealtime(orgId, handleRealtime);

  return (
    <PageShell wide>
      <Row>
        <Link href={`/orgs/${orgId}`}>Back to org</Link>
      </Row>

      <PageTitle title="Projects" subtitle={<span>Org: {orgId}</span>} />

      <Row>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New project name"
          style={{ flex: 1, minWidth: 220 }}
        />
        <Button disabled={busy} onClick={onCreate}>
          {busy ? "Creating..." : "Create"}
        </Button>
        <Button onClick={() => void load(true)} variant="secondary">
          Reload
        </Button>
      </Row>

      {error && <ErrorBox>{error}</ErrorBox>}

      {projects && projects.length === 0 && <EmptyState>No projects yet.</EmptyState>}

      {projects && projects.length > 0 && (
        <DataList>
          <DataRow>
            <strong>{projects.length} project(s)</strong>
          </DataRow>
          {projects.map((p, idx) => (
            <DataRow key={projectKey(p, idx)}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <strong>{p.name || "Untitled project"}</strong>
                  <div style={{ opacity: 0.7, fontSize: 12 }}>{p.id || "-"}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <Link href={`/orgs/${orgId}/projects/${p.id}`}>Open</Link>
                  <div style={{ marginTop: 6 }}>
                    <Link href={`/orgs/${orgId}/projects/${p.id}/tasks`}>Tasks</Link>
                  </div>
                </div>
              </div>
            </DataRow>
          ))}
        </DataList>
      )}
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
