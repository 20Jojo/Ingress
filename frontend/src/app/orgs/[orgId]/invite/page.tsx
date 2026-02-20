"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createInvite, listInvites, revokeInvite, type InviteDto } from "@/lib/invitesApi";
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
  Select,
  SuccessBox,
} from "@/components/ui";

const INVITE_EVENTS = ["invite.*"];

export default function OrgInvitePage() {
  const params = useParams<{ orgId: string }>();
  const orgId = useMemo(
    () => (Array.isArray(params.orgId) ? params.orgId[0] : params.orgId),
    [params.orgId],
  );

  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Member");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [invites, setInvites] = useState<InviteDto[] | null>(null);
  const [createdToken, setCreatedToken] = useState("");
  const [busyInviteKey, setBusyInviteKey] = useState<string | null>(null);

  const load = useCallback(
    async (reset: boolean) => {
      if (!orgId) return;
      if (reset) {
        setError("");
        setInvites(null);
      }
      try {
        setInvites(await listInvites(orgId));
      } catch (e: unknown) {
        if (isForbiddenError(e)) {
          setError("You don't have permission to view invitations in this organization.");
        } else {
          setError(getErrorMessage(e, "Failed to load invitations"));
        }
      }
    },
    [orgId],
  );

  async function onInvite() {
    if (!orgId) return;
    setError("");
    setCreatedToken("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Email is required.");
      return;
    }

    setBusy(true);
    try {
      const res = await createInvite(orgId, trimmedEmail, role);
      setCreatedToken(res.token || "");
      setEmail("");
      await load(true);
    } catch (e: unknown) {
      if (isForbiddenError(e)) {
        setError("You don't have permission to create invitations in this organization.");
      } else {
        setError(getErrorMessage(e, "Failed to create invitation"));
      }
    } finally {
      setBusy(false);
    }
  }

  async function onRevoke(invite: InviteDto, key: string) {
    if (!orgId || !invite.id) return;
    setError("");
    setBusyInviteKey(key);
    try {
      await revokeInvite(orgId, invite.id);
      await load(true);
    } catch (e: unknown) {
      if (isForbiddenError(e)) {
        setError("You don't have permission to revoke invitations in this organization.");
      } else {
        setError(getErrorMessage(e, "Failed to revoke invitation"));
      }
    } finally {
      setBusyInviteKey(null);
    }
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // no-op when clipboard is unavailable
    }
  }

  useEffect(() => {
    if (!orgId) return;
    void load(false);
  }, [orgId, load]);

  const handleRealtime = useCallback(() => {
    void load(false);
  }, [load]);
  useOrgRealtime(orgId, handleRealtime, { eventTypes: INVITE_EVENTS, debounceMs: 350 });

  return (
    <PageShell wide>
      <Row>
        <Link href={`/orgs/${orgId}`}>Back to org</Link>
      </Row>

      <PageTitle title="Invitations" subtitle={<span>Org: {orgId}</span>} />

      <Row>
        <Input
          data-testid="invite-email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Invitee email"
          style={{ flex: 1, minWidth: 240 }}
        />
        <Select data-testid="invite-role" value={role} onChange={(e) => setRole(e.target.value)} style={{ width: 130 }}>
          <option>Member</option>
          <option>Admin</option>
          <option>Owner</option>
        </Select>
        <Button data-testid="invite-submit" onClick={onInvite} disabled={busy}>
          {busy ? "Inviting..." : "Invite"}
        </Button>
        <Button onClick={() => void load(true)} variant="secondary">
          Reload
        </Button>
      </Row>

      {createdToken && (
        <SuccessBox data-testid="invite-created">
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Invitation token created</div>
          <code data-testid="invite-created-token" style={{ wordBreak: "break-all" }}>
            {createdToken}
          </code>
          <Row>
            <Button variant="secondary" onClick={() => void copy(createdToken)}>
              Copy token
            </Button>
            <Link href={`/invite/accept?token=${encodeURIComponent(createdToken)}`}>Go to accept page</Link>
          </Row>
        </SuccessBox>
      )}

      {error && <ErrorBox>{error}</ErrorBox>}

      {invites && invites.length === 0 && <EmptyState>No invitations yet.</EmptyState>}

      {invites && invites.length > 0 && (
        <DataList>
          <DataRow>
            <strong>Invites ({invites.length})</strong>
          </DataRow>

          {invites.map((i, idx) => {
            const key = inviteKey(i, idx);
            const revokable = !i.revokedAtUtc && !i.acceptedAtUtc && !!i.id;
            return (
              <DataRow key={key} data-testid={`invite-row-${i.id || idx}`}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <div>
                      <strong>{i.email || "Unknown email"}</strong> - {i.role || "Member"}
                    </div>
                    <div style={subtle}>
                      Expires: {i.expiresAtUtc ? new Date(i.expiresAtUtc).toLocaleString() : "-"}
                    </div>
                    <div style={subtle}>
                      Status:{" "}
                      <span style={getStatusStyle(i)}>
                        {i.revokedAtUtc ? "Revoked" : i.acceptedAtUtc ? "Accepted" : "Pending"}
                      </span>
                    </div>
                    <code style={{ display: "block", marginTop: 6, wordBreak: "break-all" }}>
                      {i.token || "-"}
                    </code>
                  </div>

                  <Row>
                    <Button variant="secondary" onClick={() => void copy(i.token || "")}>
                      Copy
                    </Button>
                    {revokable && (
                      <Button
                        variant="secondary"
                        onClick={() => void onRevoke(i, key)}
                        disabled={busyInviteKey === key}
                      >
                        {busyInviteKey === key ? "Revoking..." : "Revoke"}
                      </Button>
                    )}
                  </Row>
                </div>
              </DataRow>
            );
          })}
        </DataList>
      )}
    </PageShell>
  );
}

function inviteKey(invite: InviteDto, index: number): string {
  const id = invite.id || `invite-${index}`;
  const token = invite.token || `token-${index}`;
  return `${id}:${token}:${index}`;
}

const subtle: React.CSSProperties = {
  opacity: 0.7,
  fontSize: 12,
};

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function isForbiddenError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return error.message.includes("403");
}

function getStatusStyle(invite: InviteDto): React.CSSProperties {
  if (invite.revokedAtUtc) {
    return {
      color: "#8a2d2d",
      background: "#f9e3e3",
      border: "1px solid #efc0c0",
      borderRadius: 999,
      padding: "2px 8px",
      fontSize: 12,
      fontWeight: 600,
    };
  }
  if (invite.acceptedAtUtc) {
    return {
      color: "#1e6935",
      background: "#e4f6e9",
      border: "1px solid #bce8c8",
      borderRadius: 999,
      padding: "2px 8px",
      fontSize: 12,
      fontWeight: 600,
    };
  }
  return {
    color: "#7a6218",
    background: "#fff7dc",
    border: "1px solid #f2df98",
    borderRadius: 999,
    padding: "2px 8px",
    fontSize: 12,
    fontWeight: 600,
  };
}
