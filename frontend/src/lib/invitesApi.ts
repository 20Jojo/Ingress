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

type InviteWireDto = {
  Id?: string;
  OrganizationId?: string;
  Email?: string;
  Role?: string;
  Token?: string;
  ExpiresAtUtc?: string;
  CreatedByUserId?: string;
  CreatedAtUtc?: string;
  AcceptedByUserId?: string | null;
  AcceptedAtUtc?: string | null;
  RevokedByUserId?: string | null;
  RevokedAtUtc?: string | null;
  id?: string;
  organizationId?: string;
  email?: string;
  role?: string;
  token?: string;
  expiresAtUtc?: string;
  createdByUserId?: string;
  createdAtUtc?: string;
  acceptedByUserId?: string | null;
  acceptedAtUtc?: string | null;
  revokedByUserId?: string | null;
  revokedAtUtc?: string | null;
};

function normalizeInvite(invite: InviteWireDto): InviteDto {
  return {
    id: invite.id ?? invite.Id ?? "",
    organizationId: invite.organizationId ?? invite.OrganizationId ?? "",
    email: invite.email ?? invite.Email ?? "",
    role: invite.role ?? invite.Role ?? "",
    token: invite.token ?? invite.Token ?? "",
    expiresAtUtc: invite.expiresAtUtc ?? invite.ExpiresAtUtc ?? "",
    createdByUserId: invite.createdByUserId ?? invite.CreatedByUserId ?? "",
    createdAtUtc: invite.createdAtUtc ?? invite.CreatedAtUtc ?? "",
    acceptedByUserId: invite.acceptedByUserId ?? invite.AcceptedByUserId ?? null,
    acceptedAtUtc: invite.acceptedAtUtc ?? invite.AcceptedAtUtc ?? null,
    revokedByUserId: invite.revokedByUserId ?? invite.RevokedByUserId ?? null,
    revokedAtUtc: invite.revokedAtUtc ?? invite.RevokedAtUtc ?? null,
  };
}

export function createInvite(orgId: string, email: string, role?: string) {
  return authJson<CreateInviteResponse>(`/orgs/${orgId}/invitations`, {
    method: "POST",
    body: JSON.stringify({ email, role }),
  });
}

export async function listInvites(orgId: string): Promise<InviteDto[]> {
  const list = await authJson<InviteWireDto[]>(`/orgs/${orgId}/invitations`, {
    method: "GET",
  });
  return list.map(normalizeInvite);
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
