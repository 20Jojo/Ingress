import { authJson } from "@/lib/authFetch";

export type MemberDto = {
  organizationId: string;
  userId: string;
  role: string;
  joinedAt: string;
};

type MemberWireDto = {
  OrganizationId?: string;
  UserId?: string;
  Role?: string;
  JoinedAt?: string;
  organizationId?: string;
  userId?: string;
  role?: string;
  joinedAt?: string;
};

export async function listMembers(orgId: string) {
  const data = await authJson<MemberWireDto[]>(`/orgs/${orgId}/members`);
  return data.map((m) => ({
    organizationId: m.organizationId ?? m.OrganizationId ?? "",
    userId: m.userId ?? m.UserId ?? "",
    role: m.role ?? m.Role ?? "",
    joinedAt: m.joinedAt ?? m.JoinedAt ?? "",
  }));
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
