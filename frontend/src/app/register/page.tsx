"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { register } from "@/lib/authApi";
import { useToast } from "@/components/toast";
import { AuthHeading, AuthLayout } from "@/components/auth-layout";
import { IconArrowRight } from "@/components/icons";
import { Button, ButtonLink, ErrorBox, Field, Input, Spinner, SuccessBox } from "@/components/ui";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { push } = useToast();

  async function onRegister(e?: FormEvent) {
    e?.preventDefault();
    setError("");
    setBusy(true);
    try {
      await register({ email, displayName, password });
      setDone(true);
      push("Account created", "success");
    } catch (err: unknown) {
      const message = err instanceof Error && err.message ? err.message : "Registration failed";
      setError(message);
      push(message, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout>
      <AuthHeading title="Create your account" description="Set up access for yourself, then create or join an organization." />

      {done ? (
        <>
          <SuccessBox>Your account has been created. You can now sign in with {email || "your email"}.</SuccessBox>
          <ButtonLink href="/auth" variant="primary" size="lg" className="mt-2 w-full">
            Continue to sign in <IconArrowRight size={16} />
          </ButtonLink>
        </>
      ) : (
        <form onSubmit={onRegister} className="grid gap-5" noValidate>
          <Field label="Full name" htmlFor="reg-name">
            <Input
              id="reg-name"
              data-testid="auth-register-display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Jordan Smith"
              autoComplete="name"
              className="h-11"
            />
          </Field>
          <Field label="Work email" htmlFor="reg-email">
            <Input
              id="reg-email"
              data-testid="auth-register-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              autoComplete="email"
              className="h-11"
            />
          </Field>
          <Field label="Password" htmlFor="reg-password" hint="Use at least 8 characters, mixing letters, numbers and symbols.">
            <Input
              id="reg-password"
              data-testid="auth-register-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              autoComplete="new-password"
              className="h-11"
            />
          </Field>
          <Button data-testid="auth-register-submit" type="submit" size="lg" disabled={busy} className="mt-1 w-full">
            {busy ? <Spinner className="border-white/40 border-t-white" /> : null}
            {busy ? "Creating account…" : "Create account"}
          </Button>
        </form>
      )}

      {error && <ErrorBox>{error}</ErrorBox>}

      <p className="mt-8 text-center text-[13.5px] text-fg-muted">
        Already have an account?{" "}
        <Link href="/auth" className="font-medium text-brand-700 hover:text-brand-800 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
