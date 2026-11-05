"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import { getAccessToken } from "@/lib/auth";
import { acceptInvite } from "@/lib/invitesApi";
import { AuthHeading, AuthLayout } from "@/components/auth-layout";
import { IconArrowRight, IconTicket } from "@/components/icons";
import { Button, ButtonLink, ErrorBox, Field, Input, Spinner, SuccessBox } from "@/components/ui";

export default function AcceptInvitePage() {
  return (
    <AuthLayout>
      <Suspense fallback={<AcceptInviteFallback />}>
        <AcceptInviteContent />
      </Suspense>
    </AuthLayout>
  );
}

function Heading() {
  return (
    <>
      <span className="mb-6 grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200" aria-hidden>
        <IconTicket size={22} />
      </span>
      <AuthHeading
        title="Accept Invitation"
        description="Paste the invitation token you received to join the organization. You need to be signed in as the invited user."
      />
    </>
  );
}

function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [resultText, setResultText] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const initialToken = searchParams.get("token");
    if (initialToken) {
      setToken(initialToken);
    }
  }, [searchParams]);

  async function onAccept(e?: FormEvent) {
    e?.preventDefault();
    setError("");
    setResultText("");
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
      const res = await acceptInvite(trimmed);
      setResultText(JSON.stringify(res, null, 2));
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to accept invitation"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Heading />
      <form onSubmit={onAccept} className="grid gap-5">
        <Field label="Invitation token" htmlFor="accept-token">
          <Input
            id="accept-token"
            data-testid="accept-token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="inv_…"
            className="h-11 font-mono text-[13px]"
            autoComplete="off"
          />
        </Field>
        <Button data-testid="accept-submit" type="submit" size="lg" disabled={busy} className="w-full">
          {busy ? <Spinner className="border-white/40 border-t-white" /> : null}
          {busy ? "Accepting…" : "Accept invitation"}
        </Button>
      </form>

      {error && <ErrorBox data-testid="accept-error">{error}</ErrorBox>}

      {resultText && (
        <>
          <SuccessBox data-testid="accept-success">
            <div className="font-medium">Accepted — you&apos;re now a member of the organization.</div>
            <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-all rounded-md bg-white/70 p-2.5 text-[11.5px] text-fg-secondary">
              {resultText}
            </pre>
          </SuccessBox>
          <ButtonLink href="/orgs" variant="secondary" className="w-full">
            Go to organizations <IconArrowRight size={16} />
          </ButtonLink>
        </>
      )}

      <p className="mt-8 text-center text-[13.5px] text-fg-muted">
        Not signed in?{" "}
        <Link href="/auth" className="font-medium text-brand-700 hover:text-brand-800 hover:underline">
          Sign in first
        </Link>
        <span aria-hidden className="mx-2 text-fg-subtle">
          ·
        </span>
        <Link href="/orgs" className="font-medium text-brand-700 hover:text-brand-800 hover:underline">
          Organizations
        </Link>
      </p>
    </>
  );
}

function AcceptInviteFallback() {
  return (
    <>
      <Heading />
      <div className="flex items-center gap-3 text-fg-muted" role="status">
        <Spinner /> Loading invitation form…
      </div>
    </>
  );
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
