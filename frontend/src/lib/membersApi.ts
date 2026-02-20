import { authJson } from "@/lib/authFetch";

export type MemberDto = {
  organizationId: string;
  userId: string;
  role: string;
  joinedAt: string;
};

export async function listMembers(orgId: string) {
  return authJson<MemberDto[]>(`/orgs/${orgId}/members`);
}

export function changeRole(orgId: string, userId: string, role: string) {
  return authJson(`/orgs/${orgId}/members/${userId}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export function removeMember(orgId: string, userId: string) {
  return authJson(`/orgs/${orgId}/members/${userId}`, {
    method: "DELETE",
  });
}
