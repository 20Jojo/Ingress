"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { isLoggedIn } from "@/lib/auth";
import { createOrg, listOrgs, type OrgDto } from "@/lib/orgsApi";
import { useToast } from "@/components/toast";
import {
  Button,
  Card,
  DataList,
  DataRow,
  EmptyState,
  ErrorBox,
  Input,
  LoadingCard,
  PageShell,
  PageTitle,
  Row,
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
      const list = await listOrgs();
      setOrgs(list);
    } catch (e: unknown) {
      setError(getErrorMessage(e, "Failed to load orgs"));
    }
  }

  async function onCreate() {
    setError("");
    if (!name.trim()) return setError("Organization name is required.");
    setBusy(true);
    try {
      await createOrg(name.trim());
      setName("");
      push("Organization created", "success");
      await load(true);
    } catch (e: unknown) {
      const message = getErrorMessage(e, "Failed to create org");
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
      <PageTitle title="Organizations" />

      <Row>
        <div>
          Logged in: <strong>{loggedIn === null ? "Checking..." : loggedIn ? "Yes" : "No"}</strong>
        </div>
        <Link href="/auth">/auth</Link>
        <Link href="/users">/users</Link>
      </Row>

      <Card>
        <Row>
          <Input
            data-testid="org-create-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New organization name"
          />
          <Button data-testid="org-create-submit" onClick={onCreate} disabled={busy}>
            {busy ? "Creating..." : "Create"}
          </Button>
          <Button onClick={() => void load(true)} variant="secondary">
            Reload {orgs === null ? <span style={{ marginLeft: 4 }}>...</span> : ""}
          </Button>
        </Row>
      </Card>

      {error && <ErrorBox>{error}</ErrorBox>}
      {orgs === null && <LoadingCard label="Loading organizations..." />}

      {orgs && orgs.length > 0 && (
        <DataList>
          <DataRow>
            <strong>{orgs.length} organization(s)</strong>
          </DataRow>
          {orgs.map((o) => (
            <DataRow key={o.id} data-testid={`org-row-${o.id}`}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <strong>{o.name}</strong>
                  <div style={{ opacity: 0.7, fontSize: 12 }}>{o.id}</div>
                </div>
                <Link data-testid={`org-open-${o.id}`} href={`/orgs/${o.id}`}>
                  Open
                </Link>
              </div>
            </DataRow>
          ))}
        </DataList>
      )}

      {orgs && orgs.length === 0 && <EmptyState>No organizations yet.</EmptyState>}
    </PageShell>
  );
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
