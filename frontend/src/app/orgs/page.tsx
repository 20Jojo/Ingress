"use client";

import { useEffect, useState, type FormEvent } from "react";
import { isLoggedIn } from "@/lib/auth";
import { createOrg, listOrgs, type OrgDto } from "@/lib/orgsApi";
import { useToast } from "@/components/toast";
import { Avatar } from "@/components/graphics";
import { IconArrowRight, IconBuilding, IconPlus, IconRefresh } from "@/components/icons";
import {
  Button,
  ButtonLink,
  Card,
  EmptyState,
  ErrorBox,
  InfoBox,
  Input,
  LoadingCard,
  Mono,
  PageHeader,
  PageShell,
  Section,
  Table,
  Td,
  Th,
  THead,
  TextLink,
  Tr,
} from "@/components/ui";

export default function OrgsPage() {
  const [orgs, setOrgs] = useState<OrgDto[] | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const { push } = useToast();

  async function load(reset: boolean) {
    if (reset) {
      setError("");
      setOrgs(null);
    }
    try {
      setOrgs(await listOrgs());
    } catch (e: unknown) {
      setError(getErrorMessage(e, "Failed to load orgs"));
    }
  }

  async function onCreate(e?: FormEvent) {
    e?.preventDefault();
    setError("");
    if (!name.trim()) return setError("Organization name is required.");
    setBusy(true);
    try {
      await createOrg(name.trim());
      setName("");
      push("Organization created", "success");
      await load(true);
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to create org");
      setError(message);
      push(message, "error");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    setLoggedIn(isLoggedIn());
    void load(false);
  }, []);

  return (
    <PageShell>
      <PageHeader
        title="Organizations"
        description="Each organization is an isolated workspace with its own members, projects and permissions."
        actions={
          <Button onClick={() => void load(true)} variant="secondary">
            <IconRefresh size={16} /> Reload
          </Button>
        }
      />

      {loggedIn === false && (
        <InfoBox>
          You&apos;re not signed in, so organizations can&apos;t be loaded. <TextLink href="/auth">Sign in</TextLink> to continue.
        </InfoBox>
      )}

      <Section title="Create an organization" id="create-org">
        <Card>
          <form onSubmit={onCreate} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label htmlFor="org-name" className="mb-1.5 block text-[13px] font-medium text-fg-secondary">
                Organization name
              </label>
              <Input
                id="org-name"
                data-testid="org-create-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Acme Corporation"
                aria-label="Organization name"
              />
            </div>
            <Button data-testid="org-create-submit" type="submit" disabled={busy}>
              <IconPlus size={16} /> {busy ? "Creating..." : "Create"}
            </Button>
          </form>
        </Card>
      </Section>

      {error && <ErrorBox>{error}</ErrorBox>}

      <Section
        title="Your organizations"
        description={orgs ? `${orgs.length} organization${orgs.length === 1 ? "" : "s"}` : undefined}
        id="org-list"
      >
        {orgs === null && !error && <LoadingCard label="Loading organizations..." />}

        {orgs && orgs.length === 0 && (
          <EmptyState
            icon={<IconBuilding size={20} />}
            title="No organizations yet"
            description="Create your first organization above, or accept an invitation to join an existing one."
          />
        )}

        {orgs && orgs.length > 0 && (
          <Table caption="Organizations">
            <THead>
              <Th>Organization</Th>
              <Th className="hidden md:table-cell">Identifier</Th>
              <Th align="right">
                <span className="sr-only">Actions</span>
              </Th>
            </THead>
            <tbody>
              {orgs.map((o) => (
                <Tr key={o.id} data-testid={`org-row-${o.id}`}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <Avatar seed={o.id} label={o.name} size={34} shape="square" />
                      <span className="font-medium text-fg">{o.name}</span>
                    </div>
                  </Td>
                  <Td className="hidden md:table-cell">
                    <Mono>{o.id}</Mono>
                  </Td>
                  <Td align="right">
                    <ButtonLink data-testid={`org-open-${o.id}`} href={`/orgs/${o.id}`} size="sm">
                      Open <IconArrowRight size={14} />
                    </ButtonLink>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Section>
    </PageShell>
  );
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
