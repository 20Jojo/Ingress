"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { getAccessToken, getRefreshToken, isLoggedIn } from "@/lib/auth";
import { login, logout } from "@/lib/authApi";
import { useToast } from "@/components/toast";
import { AuthHeading, AuthLayout } from "@/components/auth-layout";
import { IconArrowRight, IconCheck, IconLogout } from "@/components/icons";
import { Button, ButtonLink, ErrorBox, Field, Input, Spinner, SuccessBox, cx } from "@/components/ui";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { push } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  const loggedIn = mounted ? isLoggedIn() : false;
  const accessToken = mounted ? getAccessToken() : null;
  const refreshToken = mounted ? getRefreshToken() : null;

  async function onLogin(e?: FormEvent) {
    e?.preventDefault();
    setError("");
    setStatus("");
    setBusy(true);
    try {
      await login({ email, password });
      setStatus("You're signed in. Tokens are stored for this browser.");
      push("Signed in", "success");
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Sign in failed");
      setError(message);
      push(message, "error");
    } finally {
      setBusy(false);
    }
  }

  async function onLogout() {
    setError("");
    setStatus("");
    try {
      await logout();
      setStatus("You've been signed out.");
      push("Signed out", "success");
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Sign out failed");
      setError(message);
      push(message, "error");
    }
  }

  return (
    <AuthLayout>
      <AuthHeading title="Sign in to Ingress" description="Welcome back. Enter your work email to continue." />

      <form onSubmit={onLogin} className="grid gap-5" noValidate>
        <Field label="Email address" htmlFor="login-email">
          <Input
            id="login-email"
            data-testid="auth-login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            autoComplete="email"
            className="h-11"
          />
        </Field>
        <Field label="Password" htmlFor="login-password">
          <Input
            id="login-password"
            data-testid="auth-login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            autoComplete="current-password"
            className="h-11"
          />
        </Field>
        <Button data-testid="auth-login-submit" type="submit" size="lg" disabled={busy} className="mt-1 w-full">
          {busy ? <Spinner className="border-white/40 border-t-white" /> : null}
          {busy ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      {error && <ErrorBox>{error}</ErrorBox>}
      {status && <SuccessBox>{status}</SuccessBox>}

      {loggedIn && (
        <ButtonLink href="/orgs" variant="secondary" className="mt-2 w-full">
          Continue to organizations <IconArrowRight size={16} />
        </ButtonLink>
      )}

      <p className="mt-8 text-center text-[13.5px] text-fg-muted">
        New to Ingress?{" "}
        <Link href="/register" className="font-medium text-brand-700 hover:text-brand-800 hover:underline">
          Create an account
        </Link>
      </p>

      <section aria-labelledby="session-heading" className="mt-10 rounded-xl border border-line bg-surface p-4 shadow-xs">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="session-heading" className="text-[13px] font-semibold text-fg">
            Current session
          </h2>
          <Button data-testid="auth-logout" onClick={onLogout} variant="ghost" size="sm" disabled={!mounted}>
            <IconLogout size={15} /> Sign out
          </Button>
        </div>
        <dl className="grid grid-cols-3 gap-2">
          <SessionItem testId="auth-logged-in" term="Logged in" value={loggedIn ? "Yes" : "No"} ok={loggedIn} />
          <SessionItem testId="auth-access-token" term="Access token" value={accessToken ? "present" : "missing"} ok={!!accessToken} />
          <SessionItem testId="auth-refresh-token" term="Refresh token" value={refreshToken ? "present" : "missing"} ok={!!refreshToken} />
        </dl>
      </section>
    </AuthLayout>
  );
}

function SessionItem({ testId, term, value, ok }: { testId: string; term: string; value: string; ok: boolean }) {
  return (
    <div data-testid={testId} className="rounded-lg bg-subtle px-3 py-2">
      <dt className="text-[11.5px] text-fg-muted">{term}:</dt>{" "}
      <dd className={cx("m-0 flex items-center gap-1 text-[13px] font-medium", ok ? "text-success-700" : "text-fg-secondary")}>
        {ok && <IconCheck size={13} />}
        {value}
      </dd>
    </div>
  );
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
