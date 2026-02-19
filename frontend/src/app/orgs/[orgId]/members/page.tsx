"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { changeRole, listMembers, removeMember, type MemberDto } from "@/lib/membersApi";
import { useToast } from "@/components/toast";
import { useOrgRealtime } from "@/lib/useOrgRealtime";
import {
  Button,
  DataList,
  DataRow,
  EmptyState,
  ErrorBox,
  LoadingCard,
  PageShell,
  PageTitle,
  Row,
} from "@/components/ui";

const ROLES = ["Member", "Admin", "Owner"] as const;

export default function OrgMembersPage() {
  const params = useParams<{ orgId: string }>();
  const orgId = useMemo(
    () => (Array.isArray(params.orgId) ? params.orgId[0] : params.orgId),
    [params.orgId],
  );

  const [members, setMembers] = useState<MemberDto[] | null>(null);
  const [error, setError] = useState("");
  const [busyByKey, setBusyByKey] = useState<Record<string, boolean>>({});
  const { push } = useToast();

  const load = useCallback(async () => {
    if (!orgId) return;
    setError("");
    setMembers(null);
    try {
      setMembers(await listMembers(orgId));
    } catch (e: unknown) {
      const message = getErrorMessage(e, "Failed to load members");
      setError(message);
      push(message, "error");
    }
  }, [orgId, push]);

  async function onChangeRole(member: MemberDto, role: string, key: string) {
    if (!orgId || !member.userId) return;
    setBusyByKey((prev) => ({ ...prev, [key]: true }));
    try {
      await changeRole(orgId, member.userId, role);
      push("Role updated", "success");
      await load();
    } catch (e: unknown) {
      const message = getErrorMessage(e, "Failed to change role");
      setError(message);
      push(message, "error");
    } finally {
      setBusyByKey((prev) => ({ ...prev, [key]: false }));
    }
  }

  async function onRemove(member: MemberDto, key: string) {
    if (!orgId || !member.userId) return;
    if (!confirm("Remove this member?")) return;

    setBusyByKey((prev) => ({ ...prev, [key]: true }));
    try {
      await removeMember(orgId, member.userId);
      push("Member removed", "success");
      await load();
    } catch (e: unknown) {
      const message = getErrorMessage(e, "Failed to remove member");
      setError(message);
      push(message, "error");
    } finally {
      setBusyByKey((prev) => ({ ...prev, [key]: false }));
    }
  }

  useEffect(() => {
    void load();
  }, [load]);

  const handleRealtime = useCallback(() => {
    void load();
  }, [load]);
  useOrgRealtime(orgId, handleRealtime);

  return (
    <PageShell wide>
      <Row>
        <Link href={`/orgs/${orgId}`}>Back to org</Link>
      </Row>

      <PageTitle title="Members" subtitle={<span>Org: {orgId}</span>} />

      <Row>
        <Button onClick={() => void load()} variant="secondary">
          Reload
        </Button>
      </Row>

      {error && <ErrorBox>{error}</ErrorBox>}
      {members === null && <LoadingCard label="Loading members..." />}

      {members && members.length === 0 && <EmptyState>No members found.</EmptyState>}

      {members && members.length > 0 && (
        <DataList>
          <DataRow>
            <strong>{members.length} member(s)</strong>
          </DataRow>

          {members.map((m, idx) => {
            const key = memberKey(m, idx);
            const busy = !!busyByKey[key];
            const userId = m.userId || "Unknown user";
            const role = m.role || "Member";

            return (
              <DataRow key={key}>
                <div style={memberRow}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{userId}</div>
                    <div>Role: {role}</div>
                    <div style={subtle}>
                      Joined: {m.joinedAt ? new Date(m.joinedAt).toLocaleString() : "-"}
                    </div>
                  </div>

                  <Row>
                    {ROLES.map((nextRole) => (
                      <Button
                        key={`${key}:${nextRole}`}
                        variant="secondary"
                        disabled={busy || !m.userId || role === nextRole}
                        onClick={() => void onChangeRole(m, nextRole, key)}
                      >
                        {nextRole}
                      </Button>
                    ))}
                    <Button
                      variant="danger"
                      disabled={busy || !m.userId}
                      onClick={() => void onRemove(m, key)}
                    >
                      Remove
                    </Button>
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

function memberKey(member: MemberDto, index: number): string {
  const org = member.organizationId || "org";
  const user = member.userId || `user-${index}`;
  const joined = member.joinedAt || `joined-${index}`;
  return `${org}:${user}:${joined}:${index}`;
}

const memberRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "center",
  flexWrap: "wrap",
};

const subtle: React.CSSProperties = {
  fontSize: 12,
  opacity: 0.7,
};

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
