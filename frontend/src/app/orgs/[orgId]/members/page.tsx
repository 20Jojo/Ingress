"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { changeRole, listMembers, removeMember, type MemberDto } from "@/lib/membersApi";
import { useToast } from "@/components/toast";
import { useOrgRealtime } from "@/lib/useOrgRealtime";
import { ConfirmDialog } from "@/components/dialog";
import { Avatar } from "@/components/graphics";
import { IconRefresh, IconTrash, IconUserPlus, IconUsers } from "@/components/icons";
import {
  Button,
  ButtonLink,
  EmptyState,
  ErrorBox,
  LoadingCard,
  Mono,
  PageHeader,
  PageShell,
  ROLE_META,
  RoleBadge,
  Section,
  Table,
  Td,
  Th,
  THead,
  Tr,
  cx,
} from "@/components/ui";

const ROLES = ["Member", "Admin", "Owner"] as const;
const MEMBER_EVENTS = ["member.*"];

export default function OrgMembersPage() {
  const params = useParams<{ orgId: string }>();
  const orgId = useMemo(
    () => (Array.isArray(params.orgId) ? params.orgId[0] : params.orgId),
    [params.orgId],
  );

  const [members, setMembers] = useState<MemberDto[] | null>(null);
  const [error, setError] = useState("");
  const [busyByKey, setBusyByKey] = useState<Record<string, boolean>>({});
  const [pendingRemoval, setPendingRemoval] = useState<{ member: MemberDto; key: string } | null>(null);
  const { push } = useToast();

  const load = useCallback(async () => {
    if (!orgId) return;
    setError("");
    setMembers(null);
    try {
      setMembers(await listMembers(orgId));
    } catch (e: unknown) {
      const forbidden = isForbiddenError(e);
      const message = forbidden
        ? "You don't have permission to view members in this organization."
        : getErrorMessage(e, "Failed to load members");
      if (forbidden) {
        setError("");
        push(message, "info");
      } else {
        setError(message);
      }
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

  async function onConfirmRemove() {
    if (!orgId || !pendingRemoval?.member.userId) return;
    const { member, key } = pendingRemoval;
    setBusyByKey((prev) => ({ ...prev, [key]: true }));
    try {
      await removeMember(orgId, member.userId);
      push("Member removed", "success");
      setPendingRemoval(null);
      await load();
    } catch (e: unknown) {
      const message = getErrorMessage(e, "Failed to remove member");
      setError(message);
      push(message, "error");
      setPendingRemoval(null);
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
  useOrgRealtime(orgId, handleRealtime, { eventTypes: MEMBER_EVENTS, debounceMs: 300 });

  const roleCounts = ROLES.map((r) => ({ role: r, count: members?.filter((m) => (m.role || "Member") === r).length ?? 0 }));

  return (
    <PageShell>
      <PageHeader
        title="Members"
        description="People with access to this organization and what they're allowed to do."
        actions={
          <>
            <Button onClick={() => void load()} variant="secondary">
              <IconRefresh size={16} /> Reload list
            </Button>
            <ButtonLink href={`/orgs/${orgId}/invite`} variant="primary">
              <IconUserPlus size={16} /> Invite people
            </ButtonLink>
          </>
        }
      />

      {error && <ErrorBox>{error}</ErrorBox>}

      {members && members.length > 0 && (
        <section aria-label="Role summary" className="mb-8 grid grid-cols-3 gap-3 sm:gap-4">
          {roleCounts.map(({ role, count }) => (
            <div key={role} className="rounded-xl border border-line bg-surface p-3 shadow-xs sm:p-4">
              <div className="flex flex-col-reverse items-start gap-1 sm:flex-row sm:items-center sm:justify-between">
                <RoleBadge role={role} />
                <span className="font-display text-[22px] font-semibold">{count}</span>
              </div>
              <p className="mt-2 hidden text-[12.5px] text-fg-muted sm:block">{ROLE_META[role].description}</p>
            </div>
          ))}
        </section>
      )}

      <Section
        title="All members"
        description={members ? `${members.length} member${members.length === 1 ? "" : "s"}` : undefined}
        id="member-list"
      >
        {members === null && !error && <LoadingCard label="Loading members..." />}

        {members && members.length === 0 && (
          <EmptyState icon={<IconUsers size={20} />} title="No members found" description="Invite people to give them access to this organization." />
        )}

        {members && members.length > 0 && (
          <Table caption="Organization members">
            <THead>
              <Th>Member</Th>
              <Th>Role</Th>
              <Th align="right">
                <span className="sr-only">Actions</span>
              </Th>
            </THead>
            <tbody>
              {members.map((m, idx) => {
                const key = memberKey(m, idx);
                const busy = !!busyByKey[key];
                const userId = m.userId || "Unknown user";
                const role = m.role || "Member";

                return (
                  <Tr key={key} data-testid={`member-row-${idx}`} className={cx(busy && "opacity-60")}>
                    <Td>
                      <div className="flex items-center gap-3">
                        <Avatar seed={userId} label={userId} size={34} />
                        <div className="min-w-0">
                          <div data-testid={`member-user-${idx}`} className="truncate font-mono text-[12.5px] font-medium text-fg">
                            {userId}
                          </div>
                          <div className="text-[12.5px] text-fg-muted">
                            Joined {m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : "—"}
                          </div>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <span data-testid={`member-role-${idx}`} className="sr-only">
                        Role: {role}
                      </span>
                      <div
                        className="inline-flex rounded-lg border border-line-strong bg-subtle p-0.5"
                        role="group"
                        aria-label={`Role for ${userId}`}
                      >
                        {ROLES.map((nextRole) => {
                          const active = role === nextRole;
                          return (
                            <button
                              key={`${key}:${nextRole}`}
                              type="button"
                              data-testid={`member-set-role-${idx}-${nextRole}`}
                              disabled={busy || !m.userId || active}
                              aria-pressed={active}
                              onClick={() => void onChangeRole(m, nextRole, key)}
                              className={cx(
                                "h-7 cursor-pointer rounded-md px-3 text-[12.5px] font-medium transition-colors disabled:cursor-default",
                                active ? "bg-surface text-brand-800 shadow-sm ring-1 ring-line" : "text-fg-muted hover:text-fg",
                              )}
                            >
                              {nextRole}
                            </button>
                          );
                        })}
                      </div>
                    </Td>
                    <Td align="right">
                      <Button
                        variant="danger-ghost"
                        size="sm"
                        disabled={busy || !m.userId}
                        onClick={() => setPendingRemoval({ member: m, key })}
                      >
                        <IconTrash size={15} /> Remove
                      </Button>
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Section>

      <ConfirmDialog
        open={!!pendingRemoval}
        title="Remove member?"
        description={
          <>
            <Mono className="text-fg-secondary">{pendingRemoval?.member.userId}</Mono> will immediately lose access to this
            organization. You can invite them again later.
          </>
        }
        confirmLabel="Remove member"
        busy={pendingRemoval ? !!busyByKey[pendingRemoval.key] : false}
        onConfirm={() => void onConfirmRemove()}
        onCancel={() => setPendingRemoval(null)}
      />
    </PageShell>
  );
}

function memberKey(member: MemberDto, index: number): string {
  const org = member.organizationId || "org";
  const user = member.userId || `user-${index}`;
  const joined = member.joinedAt || `joined-${index}`;
  return `${org}:${user}:${joined}:${index}`;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function isForbiddenError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return error.message.includes("403");
}
