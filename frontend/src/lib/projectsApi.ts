import { authJson } from "@/lib/authFetch";

export type ProjectDto = {
  id: string;
  organizationId: string;
  name: string;
};

export async function listProjects(orgId: string): Promise<ProjectDto[]> {
  return authJson<ProjectDto[]>(`/orgs/${orgId}/projects`, {
    method: "GET",
  });
}

export async function createProject(orgId: string, name: string): Promise<ProjectDto> {
  return authJson<ProjectDto>(`/orgs/${orgId}/projects`, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function getProject(orgId: string, projectId: string): Promise<ProjectDto> {
  return authJson<ProjectDto>(`/orgs/${orgId}/projects/${projectId}`, {
    method: "GET",
  });
}
