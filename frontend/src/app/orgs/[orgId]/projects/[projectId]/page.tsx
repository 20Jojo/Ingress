"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getProject, type ProjectDto } from "@/lib/projectsApi";
import {
  Button,
  Card,
  ErrorBox,
  PageShell,
  PageTitle,
  Row,
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
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!orgId || !projectId) return;
    setError("");
    setProject(null);
    try {
      setProject(await getProject(orgId, projectId));
    } catch (e: unknown) {
      setError(getErrorMessage(e, "Failed to load project"));
    }
  }, [orgId, projectId]);

  useEffect(() => {
    if (!orgId || !projectId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [orgId, projectId, load]);

  return (
    <PageShell>
      <Row>
        <Link href={`/orgs/${orgId}/projects`}>Back to projects</Link>
      </Row>

      <PageTitle title={project?.name || "Project"} subtitle={<span>Org: {orgId}</span>} />

      <Row>
        <Button onClick={() => void load()} variant="secondary">
          Reload
        </Button>
        <Link href={`/orgs/${orgId}/projects/${projectId}/tasks`}>Open Tasks</Link>
      </Row>

      {error && <ErrorBox>{error}</ErrorBox>}

      {project && (
        <Card>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Project Summary</div>
          <div>Name: {project.name || "-"}</div>
          <div>Organization ID: {project.organizationId || "-"}</div>
          <div>Project ID: {project.id || "-"}</div>
        </Card>
      )}
    </PageShell>
  );
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
