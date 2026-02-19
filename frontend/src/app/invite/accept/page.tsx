"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getAccessToken } from "@/lib/auth";
import { acceptInvite } from "@/lib/invitesApi";
import {
  Button,
  ErrorBox,
  Input,
  PageShell,
  PageTitle,
  Row,
  SuccessBox,
} from "@/components/ui";

export default function AcceptInvitePage() {
  const searchParams = useSearchParams();
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const initialToken = searchParams.get("token");
    if (initialToken) {
      setToken(initialToken);
    }
  }, [searchParams]);

  async function onAccept() {
    setError("");
    setResult(null);
    const trimmed = token.trim();
    if (!trimmed) {
      setError("Token is required.");
      return;
    }

    if (!getAccessToken()) {
      setError("You must login as the invited user first (go to /auth).");
      return;
    }

    setBusy(true);
    try {
      setResult(await acceptInvite(trimmed));
    } catch (e: unknown) {
      setError(getErrorMessage(e, "Failed to accept invitation"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageShell>
      <PageTitle title="Accept Invitation" />

      <Row>
        <Link href="/auth">Login</Link>
        <Link href="/orgs">Orgs</Link>
      </Row>

      <Row>
        <Input
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Paste invitation token"
          style={{ flex: 1 }}
        />
        <Button onClick={onAccept} disabled={busy}>
          {busy ? "Accepting..." : "Accept"}
        </Button>
      </Row>

      {error && <ErrorBox>{error}</ErrorBox>}

      {result && (
        <SuccessBox>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Accepted</div>
          <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{JSON.stringify(result, null, 2)}</pre>
        </SuccessBox>
      )}
    </PageShell>
  );
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
