import { authJson } from "@/lib/authFetch";

export type ProjectDto = {
  id: string;
  organizationId: string;
  name: string;
};

type ProjectWireDto = {
  Id?: string;
  OrganizationId?: string;
  Name?: string;
  id?: string;
  organizationId?: string;
  name?: string;
};

function normalizeProject(p: ProjectWireDto): ProjectDto {
  return {
    id: p.id ?? p.Id ?? "",
    organizationId: p.organizationId ?? p.OrganizationId ?? "",
    name: p.name ?? p.Name ?? "",
  };
}

export async function listProjects(orgId: string): Promise<ProjectDto[]> {
  const list = await authJson<ProjectWireDto[]>(`/orgs/${orgId}/projects`, {
    method: "GET",
  });

  return list.map(normalizeProject);
}

export async function createProject(orgId: string, name: string): Promise<ProjectDto> {
  const created = await authJson<ProjectWireDto>(`/orgs/${orgId}/projects`, {
    method: "POST",
    body: JSON.stringify({ name }),
  });

  return normalizeProject(created);
}

