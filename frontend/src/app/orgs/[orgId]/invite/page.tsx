"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { createInvite, listInvites, revokeInvite, type InviteDto } from "@/lib/invitesApi";
import { useOrgRealtime } from "@/lib/useOrgRealtime";
import { useToast } from "@/components/toast";
import { ConfirmDialog, Dialog } from "@/components/dialog";
import { Avatar } from "@/components/graphics";
import { IconCheckCircle, IconCopy, IconExternal, IconMail, IconRefresh, IconUserPlus, IconX } from "@/components/icons";
import {
  Badge,
  Button,
  ButtonLink,
  EmptyState,
  ErrorBox,
  Field,
  Input,
  LoadingCard,
  PageHeader,
  PageShell,
  ROLE_META,
  RoleBadge,
  Section,
  Select,
  Table,
  Td,
  Th,
  THead,
  Tr,
  cx,
  type BadgeTone,
} from "@/components/ui";

const INVITE_EVENTS = ["invite.*"];
type Filter = "All" | "Pending" | "Accepted" | "Revoked";

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
  const [formError, setFormError] = useState("");
  const [invites, setInvites] = useState<InviteDto[] | null>(null);
  const [createdToken, setCreatedToken] = useState("");
  const [busyInviteKey, setBusyInviteKey] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingRevoke, setPendingRevoke] = useState<{ invite: InviteDto; key: string } | null>(null);
  const [filter, setFilter] = useState<Filter>("All");
  const { push } = useToast();

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
        setInvites([]);
        if (isForbiddenError(e)) {
          setError("You don't have permission to view invitations in this organization.");
        } else {
          setError(getErrorMessage(e, "Failed to load invitations"));
        }
      }
    },
    [orgId],
  );

  async function onInvite(e?: FormEvent) {
    e?.preventDefault();
    if (!orgId) return;
    setFormError("");
    setCreatedToken("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setFormError("Email is required.");
      return;
    }

    setBusy(true);
    try {
      const res = await createInvite(orgId, trimmedEmail, role);
      setCreatedToken(res.token || "");
      setEmail("");
      setDialogOpen(false);
      push("Invitation created", "success");
      await load(true);
    } catch (err: unknown) {
      if (isForbiddenError(err)) {
        setFormError("You don't have permission to create invitations in this organization.");
      } else {
        setFormError(getErrorMessage(err, "Failed to create invitation"));
      }
    } finally {
      setBusy(false);
    }
  }

  async function onConfirmRevoke() {
    if (!orgId || !pendingRevoke?.invite.id) return;
    const { invite, key } = pendingRevoke;
    setError("");
    setBusyInviteKey(key);
    try {
      await revokeInvite(orgId, invite.id);
      push("Invitation revoked", "success");
      setPendingRevoke(null);
      await load(true);
    } catch (e: unknown) {
      setPendingRevoke(null);
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
      push("Token copied to clipboard", "success");
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

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { All: 0, Pending: 0, Accepted: 0, Revoked: 0 };
    (invites ?? []).forEach((i) => {
      c.All++;
      c[inviteStatus(i).label]++;
    });
    return c;
  }, [invites]);

  const visible = (invites ?? []).filter((i) => filter === "All" || inviteStatus(i).label === filter);

  return (
    <PageShell>
      <PageHeader
        title="Invitations"
        description="Invite people by email. Each invitation produces a token the recipient uses to join."
        actions={
          <>
            <Button onClick={() => void load(true)} variant="secondary">
              <IconRefresh size={16} /> Reload
            </Button>
            <Button
              onClick={() => {
                setFormError("");
                setDialogOpen(true);
              }}
            >
              <IconUserPlus size={16} /> Invite member
            </Button>
          </>
        }
      />

      {createdToken && (
        <section
          data-testid="invite-created"
          role="status"
          aria-live="polite"
          className="mb-8 animate-fade-in overflow-hidden rounded-xl border border-success-600/25 bg-surface shadow-sm"
        >
          <div className="flex items-start gap-3 border-b border-line bg-success-50 px-5 py-4">
            <IconCheckCircle size={20} className="mt-px shrink-0 text-success-600" />
            <div className="flex-1">
              <div className="text-[14px] font-semibold text-fg">Invitation token created</div>
              <p className="text-[13px] text-fg-secondary">Share this token with the recipient. They&apos;ll paste it on the accept page.</p>
            </div>
            <button
              type="button"
              onClick={() => setCreatedToken("")}
              aria-label="Dismiss"
              className="grid h-7 w-7 cursor-pointer place-items-center rounded-md text-fg-muted hover:bg-white/70"
            >
              <IconX size={15} />
            </button>
          </div>
          <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
            <code
              data-testid="invite-created-token"
              className="flex-1 break-all rounded-lg border border-line bg-subtle px-3 py-2.5 font-mono text-[12.5px] text-fg"
            >
              {createdToken}
            </code>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => void copy(createdToken)}>
                <IconCopy size={15} /> Copy token
              </Button>
              <ButtonLink href={`/invite/accept?token=${encodeURIComponent(createdToken)}`} variant="ghost">
                Go to accept page <IconExternal size={15} />
              </ButtonLink>
            </div>
          </div>
        </section>
      )}

      {error && <ErrorBox>{error}</ErrorBox>}

      <Section
        title="Sent invitations"
        id="invite-list"
        actions={
          invites && invites.length > 0 ? (
            <div role="tablist" aria-label="Filter invitations" className="inline-flex rounded-lg border border-line-strong bg-subtle p-0.5">
              {(["All", "Pending", "Accepted", "Revoked"] as Filter[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  role="tab"
                  aria-selected={filter === f}
                  onClick={() => setFilter(f)}
                  className={cx(
                    "h-7 cursor-pointer rounded-md px-3 text-[12.5px] font-medium transition-colors",
                    filter === f ? "bg-surface text-fg shadow-sm ring-1 ring-line" : "text-fg-muted hover:text-fg",
                  )}
                >
                  {f} <span className="ml-0.5 text-fg-subtle">{counts[f]}</span>
                </button>
              ))}
            </div>
          ) : undefined
        }
      >
        {invites === null && !error && <LoadingCard label="Loading invitations..." />}

        {invites && invites.length === 0 && !error && (
          <EmptyState
            icon={<IconMail size={20} />}
            title="No invitations yet"
            description="Invite a colleague to give them access to this organization."
            action={
              <Button onClick={() => setDialogOpen(true)}>
                <IconUserPlus size={16} /> Invite member
              </Button>
            }
          />
        )}

        {invites && invites.length > 0 && visible.length === 0 && (
          <EmptyState icon={<IconMail size={20} />} title={`No ${filter.toLowerCase()} invitations`} compact />
        )}

        {visible.length > 0 && (
          <Table caption="Invitations">
            <THead>
              <Th>Recipient</Th>
              <Th>Role</Th>
              <Th>Status</Th>
              <Th className="hidden lg:table-cell">Expires</Th>
              <Th className="hidden md:table-cell">Token</Th>
              <Th align="right">
                <span className="sr-only">Actions</span>
              </Th>
            </THead>
            <tbody>
              {visible.map((i, idx) => {
                const key = inviteKey(i, idx);
                const revokable = !i.revokedAtUtc && !i.acceptedAtUtc && !!i.id;
                const st = inviteStatus(i);
                return (
                  <Tr key={key} data-testid={`invite-row-${i.id || idx}`}>
                    <Td>
                      <div className="flex items-center gap-3">
                        <Avatar seed={i.email || key} label={i.email} size={32} />
                        <span className="font-medium text-fg">{i.email || "Unknown email"}</span>
                      </div>
                    </Td>
                    <Td>
                      <RoleBadge role={i.role || "Member"} />
                    </Td>
                    <Td>
                      <Badge tone={st.tone} dot>
                        <span className="sr-only">Status: </span>
                        {st.label}
                      </Badge>
                    </Td>
                    <Td className="hidden text-fg-muted lg:table-cell">
                      {i.expiresAtUtc ? new Date(i.expiresAtUtc).toLocaleDateString() : "—"}
                    </Td>
                    <Td className="hidden md:table-cell">
                      <code className="block max-w-[180px] truncate font-mono text-[12px] text-fg-muted" title={i.token}>
                        {i.token || "-"}
                      </code>
                    </Td>
                    <Td align="right">
                      <div className="inline-flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => void copy(i.token || "")} aria-label={`Copy token for ${i.email}`}>
                          <IconCopy size={15} /> Copy
                        </Button>
                        {revokable && (
                          <Button
                            variant="danger-ghost"
                            size="sm"
                            onClick={() => setPendingRevoke({ invite: i, key })}
                            disabled={busyInviteKey === key}
                          >
                            {busyInviteKey === key ? "Revoking..." : "Revoke"}
                          </Button>
                        )}
                      </div>
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Section>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Invite a member"
        description="They'll receive access once they accept the invitation with their own account."
      >
        <form id="invite-form" onSubmit={onInvite} className="grid gap-5">
          <Field label="Email address" htmlFor="invite-email">
            <Input
              id="invite-email"
              data-testid="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@company.com"
              autoComplete="off"
            />
          </Field>
          <Field label="Role" htmlFor="invite-role" hint={ROLE_META[role]?.description}>
            <Select id="invite-role" data-testid="invite-role" value={role} onChange={(e) => setRole(e.target.value)}>
              <option>Member</option>
              <option>Admin</option>
              <option>Owner</option>
            </Select>
          </Field>
          {formError && <ErrorBox className="my-0">{formError}</ErrorBox>}
          <div className="-mx-6 mt-1 flex justify-end gap-2 rounded-b-2xl border-t border-line bg-subtle/60 px-6 py-4">
            <Button variant="secondary" onClick={() => setDialogOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button data-testid="invite-submit" type="submit" disabled={busy}>
              {busy ? "Inviting..." : "Send invitation"}
            </Button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog
        open={!!pendingRevoke}
        title="Revoke invitation?"
        description={`The token sent to ${pendingRevoke?.invite.email ?? "this recipient"} will stop working immediately.`}
        confirmLabel="Revoke invitation"
        busy={!!pendingRevoke && busyInviteKey === pendingRevoke.key}
        onConfirm={() => void onConfirmRevoke()}
        onCancel={() => setPendingRevoke(null)}
      />
    </PageShell>
  );
}

function inviteStatus(invite: InviteDto): { label: "Pending" | "Accepted" | "Revoked"; tone: BadgeTone } {
  if (invite.revokedAtUtc) return { label: "Revoked", tone: "neutral" };
  if (invite.acceptedAtUtc) return { label: "Accepted", tone: "success" };
  return { label: "Pending", tone: "warning" };
}

function inviteKey(invite: InviteDto, index: number): string {
  const id = invite.id || `invite-${index}`;
  const token = invite.token || `token-${index}`;
  return `${id}:${token}:${index}`;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function isForbiddenError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return error.message.includes("403");
}
