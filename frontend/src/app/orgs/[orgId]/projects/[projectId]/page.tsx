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
        <Link href={`/orgs/${orgId}/projects`} style={quickLinkStyle}>
          Back to projects
        </Link>
      </Row>

      <PageTitle title={project?.name || "Project"} subtitle={<span>Overview for project {projectId}</span>} />

      <Card style={{ marginBottom: 12 }}>
        <Row>
          <Button onClick={() => void load()} variant="secondary">
            Reload
          </Button>
          <Link href={`/orgs/${orgId}/projects/${projectId}/tasks`} style={quickLinkStyle}>
            Open tasks
          </Link>
        </Row>
      </Card>

      {error && <ErrorBox>{error}</ErrorBox>}

      {project && (
        <Card>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>Project Summary</div>
          <div style={metaRowStyle}>Name: {project.name || "-"}</div>
          <div style={metaRowStyle}>Organization ID: {project.organizationId || "-"}</div>
          <div style={metaRowStyle}>Project ID: {project.id || "-"}</div>
        </Card>
      )}
    </PageShell>
  );
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

const quickLinkStyle: React.CSSProperties = {
  textDecoration: "none",
  padding: "8px 12px",
  borderRadius: 9999,
  border: "1px solid var(--border)",
  background: "var(--surface)",
  color: "var(--foreground)",
  fontSize: 13,
  fontWeight: 500,
};

const metaRowStyle: React.CSSProperties = {
  color: "var(--text-muted)",
  marginBottom: 6,
  fontSize: 14,
};
