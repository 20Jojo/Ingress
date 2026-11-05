"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { getOrg, listOrgMembers, type OrgDto, type OrgMemberDto } from "@/lib/orgsApi";
import { useOrgRealtime } from "@/lib/useOrgRealtime";
import { Avatar } from "@/components/graphics";
import { IconArrowRight, IconChart, IconFolder, IconMail, IconRefresh, IconUsers } from "@/components/icons";
import {
  Button,
  ButtonLink,
  EmptyState,
  ErrorBox,
  LoadingCard,
  Mono,
  PageHeader,
  PageShell,
  RoleBadge,
  Section,
  Table,
  Td,
  Th,
  THead,
  Tr,
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

  const preview = members?.slice(0, 6) ?? [];

  return (
    <PageShell>
      <PageHeader
        leading={<Avatar seed={orgId ?? "org"} label={org?.name ?? "Organization"} size={52} shape="square" />}
        eyebrow="Organization"
        title={org?.name ?? "Organization"}
        meta={<Mono>{orgId}</Mono>}
        actions={
          <Button onClick={() => void load(true)} variant="secondary">
            <IconRefresh size={16} /> Reload
          </Button>
        }
      />

      {error && <ErrorBox>{error}</ErrorBox>}

      <Section title="Workspace" description="Everything in this organization, one click away." id="workspace">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <WorkspaceLink href={`/orgs/${orgId}/dashboard`} title="Dashboard" body="Live metrics, status breakdowns and recent activity." icon={<IconChart size={18} />} />
          <WorkspaceLink href={`/orgs/${orgId}/projects`} title="Project portfolio" body="Plan work and track delivery across every initiative." icon={<IconFolder size={18} />} />
          <WorkspaceLink href={`/orgs/${orgId}/members`} title="Manage members" body="Review access and change roles." icon={<IconUsers size={18} />} />
          <WorkspaceLink href={`/orgs/${orgId}/invite`} title="Invite members" body="Issue and track invitation tokens." icon={<IconMail size={18} />} />
        </div>
      </Section>

      <Section
        title="Members"
        description={members && !membersAccessMessage ? `${members.length} member${members.length === 1 ? "" : "s"} in this organization` : undefined}
        actions={
          members && members.length > 0 ? (
            <ButtonLink href={`/orgs/${orgId}/members`} variant="ghost" size="sm">
              View all <IconArrowRight size={14} />
            </ButtonLink>
          ) : undefined
        }
        id="members"
      >
        {members === null && !error && <LoadingCard label="Loading members..." rows={3} />}
        {membersAccessMessage && (
          <EmptyState icon={<IconUsers size={20} />} title="Members are restricted" description={membersAccessMessage} compact />
        )}

        {members && preview.length > 0 && (
          <Table caption="Members">
            <THead>
              <Th>Member</Th>
              <Th>Role</Th>
              <Th className="hidden sm:table-cell">Joined</Th>
            </THead>
            <tbody>
              {preview.map((m, idx) => (
                <Tr key={memberKey(m, idx)}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <Avatar seed={m.userId || `u${idx}`} label={m.userId} size={30} />
                      <Mono className="text-[12.5px] text-fg-secondary">{m.userId || "Unknown user"}</Mono>
                    </div>
                  </Td>
                  <Td>
                    <RoleBadge role={m.role || "Member"} />
                  </Td>
                  <Td className="hidden text-fg-muted sm:table-cell">{m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : "—"}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}

        {members && members.length === 0 && !membersAccessMessage && (
          <EmptyState icon={<IconUsers size={20} />} title="No members found" compact />
        )}
      </Section>
    </PageShell>
  );
}

function WorkspaceLink({ href, title, body, icon }: { href: string; title: string; body: string; icon: ReactNode }) {
  return (
    <Link
      href={href}
      className="group flex h-full flex-col rounded-xl border border-line bg-surface p-5 shadow-xs transition hover:border-brand-200 hover:shadow-md"
    >
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-50 text-brand-700" aria-hidden>
        {icon}
      </span>
      <span className="mt-4 flex items-center justify-between text-[14.5px] font-semibold text-fg">
        {title}
        <IconArrowRight size={16} className="text-fg-subtle transition group-hover:translate-x-0.5 group-hover:text-brand-600" />
      </span>
      <span className="mt-1 text-[13px] text-fg-muted">{body}</span>
    </Link>
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
