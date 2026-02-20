import { authJson } from "@/lib/authFetch";

export type OrgDto = {
  id: string;
  name: string;
};

export type CreateOrgResponse = {
  id: string;
  name: string;
  ownerUserId: string;
  ownerRole: string;
};

export type OrgMemberDto = {
  organizationId: string;
  userId: string;
  role: string;
  joinedAt: string;
};

export function createOrg(name: string) {
  return authJson<CreateOrgResponse>("/orgs", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export function listOrgs() {
  return authJson<OrgDto[]>("/orgs", { method: "GET" });
}

export function getOrg(orgId: string) {
  return authJson<OrgDto>(`/orgs/${orgId}`, { method: "GET" });
}

export function listOrgMembers(orgId: string) {
  return authJson<OrgMemberDto[]>(`/orgs/${orgId}/members`, {
    method: "GET",
  });
}
