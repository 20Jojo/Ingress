import { authJson } from "@/lib/authFetch";

export type InviteDto = {
  id: string;
  organizationId: string;
  email: string;
  role: string;
  token: string;
  expiresAtUtc: string;
  createdByUserId: string;
  createdAtUtc: string;
  acceptedByUserId?: string | null;
  acceptedAtUtc?: string | null;
  revokedByUserId?: string | null;
  revokedAtUtc?: string | null;
};

export type CreateInviteResponse = {
  id: string;
  organizationId: string;
  email: string;
  role: string;
  token: string;
  expiresAtUtc: string;
};

export function createInvite(orgId: string, email: string, role?: string) {
  return authJson<CreateInviteResponse>(`/orgs/${orgId}/invitations`, {
    method: "POST",
    body: JSON.stringify({ email, role }),
  });
}

export async function listInvites(orgId: string): Promise<InviteDto[]> {
  return authJson<InviteDto[]>(`/orgs/${orgId}/invitations`, {
    method: "GET",
  });
}

export function revokeInvite(orgId: string, invitationId: string) {
  return authJson(`/orgs/${orgId}/invitations/${invitationId}`, {
    method: "DELETE",
  });
}

export function acceptInvite(token: string) {
  return authJson<unknown>(`/invitations/${token}/accept`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}
