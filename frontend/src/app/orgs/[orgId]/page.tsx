"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getOrg, listOrgMembers, type OrgDto, type OrgMemberDto } from "@/lib/orgsApi";
import { useOrgRealtime } from "@/lib/useOrgRealtime";
import {
  Button,
  DataList,
  DataRow,
  EmptyState,
  ErrorBox,
  PageShell,
  PageTitle,
  Row,
} from "@/components/ui";

const ORG_DETAIL_EVENTS = ["member.*", "invite.accepted"];

export default function OrgDetailPage() {
  const params = useParams<{ orgId: string }>();
  const orgId = useMemo(
    () => (Array.isArray(params.orgId) ? params.orgId[0] : params.orgId),
    [params.orgId],
  );

  const [org, setOrg] = useState<OrgDto | null>(null);
  const [members, setMembers] = useState<OrgMemberDto[] | null>(null);
  const [error, setError] = useState("");
  const [membersAccessMessage, setMembersAccessMessage] = useState("");

  const load = useCallback(
    async (reset: boolean) => {
      if (!orgId) return;
      if (reset) {
        setError("");
        setOrg(null);
        setMembers(null);
        setMembersAccessMessage("");
      }
      try {
        const o = await getOrg(orgId);
        setOrg(o);

        try {
          const m = await listOrgMembers(orgId);
          setMembers(m);
          setMembersAccessMessage("");
        } catch (e: unknown) {
          if (isForbiddenError(e)) {
            setMembers([]);
            setMembersAccessMessage("You don't have permission to view member details in this organization.");
            return;
          }
          throw e;
        }
      } catch (e: unknown) {
        setError(getErrorMessage(e, "Failed to load org"));
      }
    },
    [orgId],
  );

  useEffect(() => {
    if (!orgId) return;
    void load(false);
  }, [orgId, load]);

  const handleRealtime = useCallback(() => {
    void load(false);
  }, [load]);

  useOrgRealtime(orgId, handleRealtime, { eventTypes: ORG_DETAIL_EVENTS, debounceMs: 350 });

  return (
    <PageShell>
      <Row>
        <Link href="/orgs">Back to orgs</Link>
      </Row>

      <PageTitle title={org?.name ?? "Organization"} subtitle={<code>{orgId}</code>} />

      <Row>
        <Link href={`/orgs/${orgId}/invite`}>Invite members</Link>
        <Link href={`/orgs/${orgId}/members`}>Manage Members</Link>
        <Link href={`/orgs/${orgId}/projects`}>Projects</Link>
        <Link href={`/orgs/${orgId}/dashboard`}>Dashboard</Link>
        <Button onClick={() => void load(true)} variant="secondary">
          Reload
        </Button>
      </Row>

      {error && <ErrorBox>{error}</ErrorBox>}
      {membersAccessMessage && <EmptyState>{membersAccessMessage}</EmptyState>}

      {members && members.length > 0 && (
        <DataList>
          <DataRow>
            <strong>Members ({members.length})</strong>
          </DataRow>
          {members.map((m, idx) => (
            <DataRow key={memberKey(m, idx)}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <strong>{m.role || "Member"}</strong>
                  <div style={{ opacity: 0.8 }}>{m.userId || "Unknown user"}</div>
                  <div style={{ opacity: 0.7, fontSize: 12 }}>
                    Joined: {m.joinedAt ? new Date(m.joinedAt).toLocaleString() : "-"}
                  </div>
                </div>
                <Link href="/users">Users</Link>
              </div>
            </DataRow>
          ))}
        </DataList>
      )}

      {members && members.length === 0 && <EmptyState>No members found.</EmptyState>}
    </PageShell>
  );
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function isForbiddenError(error: unknown): boolean {
  if (!(error instanceof Error) || !error.message) return false;
  return error.message.includes("403");
}

function memberKey(member: OrgMemberDto, index: number): string {
  const org = member.organizationId || "org";
  const user = member.userId || `user-${index}`;
  const joined = member.joinedAt || `joined-${index}`;
  return `${org}:${user}:${joined}:${index}`;
}
