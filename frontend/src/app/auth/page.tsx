"use client";

import { useEffect, useState } from "react";
import { getAccessToken, getRefreshToken, isLoggedIn } from "@/lib/auth";
import { login, logout, register } from "@/lib/authApi";
import { useToast } from "@/components/toast";
import {
  Button,
  Card,
  ErrorBox,
  Input,
  Label,
  PageShell,
  PageTitle,
  SuccessBox,
} from "@/components/ui";

export default function AuthPage() {
  const [regEmail, setRegEmail] = useState("");
  const [regDisplayName, setRegDisplayName] = useState("");
  const [regPassword, setRegPassword] = useState("");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const { push } = useToast();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const loggedIn = mounted ? isLoggedIn() : false;
  const accessToken = mounted ? getAccessToken() : null;
  const refreshToken = mounted ? getRefreshToken() : null;

  async function onRegister() {
    setError("");
    setStatus("Registering...");
    try {
      await register({
        email: regEmail,
        displayName: regDisplayName,
        password: regPassword,
      });
      setStatus("Registered. User created.");
      push("Registered user", "success");
    } catch (e: unknown) {
      setStatus("");
      const message = getErrorMessage(e, "Register failed");
      setError(message);
      push(message, "error");
    }
  }

  async function onLogin() {
    setError("");
    setStatus("Logging in...");
    try {
      await login({ email: loginEmail, password: loginPassword });
      setStatus("Logged in. Tokens saved to localStorage.");
      push("Logged in", "success");
    } catch (e: unknown) {
      setStatus("");
      const message = getErrorMessage(e, "Login failed");
      setError(message);
      push(message, "error");
    }
  }

  async function onLogout() {
    setError("");
    setStatus("Logging out...");
    try {
      await logout();
      setStatus("Logged out. Tokens cleared.");
      push("Logged out", "success");
    } catch (e: unknown) {
      setStatus("");
      const message = getErrorMessage(e, "Logout failed");
      setError(message);
      push(message, "error");
    }
  }

  return (
    <PageShell>
      <PageTitle
        title="Auth"
        subtitle="Register a user, then login to store JWT + refresh token in localStorage."
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card>
          <h2 style={h2Style}>Register</h2>
          <Label>Email</Label>
          <Input
            data-testid="auth-register-email"
            value={regEmail}
            onChange={(e) => setRegEmail(e.target.value)}
            placeholder="owner@test.com"
          />

          <div style={fieldGap}>
            <Label>Display name</Label>
            <Input
              data-testid="auth-register-display-name"
              value={regDisplayName}
              onChange={(e) => setRegDisplayName(e.target.value)}
              placeholder="Owner"
            />
          </div>

          <div style={fieldGap}>
            <Label>Password</Label>
            <Input
              data-testid="auth-register-password"
              value={regPassword}
              onChange={(e) => setRegPassword(e.target.value)}
              type="password"
              placeholder="Pass123!"
            />
          </div>

          <Button data-testid="auth-register-submit" onClick={onRegister}>
            Register
          </Button>
        </Card>

        <Card>
          <h2 style={h2Style}>Login</h2>
          <Label>Email</Label>
          <Input
            data-testid="auth-login-email"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            placeholder="owner@test.com"
          />

          <div style={fieldGap}>
            <Label>Password</Label>
            <Input
              data-testid="auth-login-password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              type="password"
              placeholder="Pass123!"
            />
          </div>

          <Button data-testid="auth-login-submit" onClick={onLogin}>
            Login
          </Button>

          <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #eee" }}>
            <div data-testid="auth-logged-in" style={{ marginBottom: 8 }}>
              <strong>Logged in:</strong> {loggedIn ? "Yes" : "No"}
            </div>
            <Button data-testid="auth-logout" onClick={onLogout} variant="secondary">
              Logout
            </Button>
          </div>
        </Card>
      </div>

      <Card>
        <h2 style={h2Style}>Token status</h2>
        <div data-testid="auth-access-token">
          <strong>Access token:</strong> {accessToken ? "present" : "missing"}
        </div>
        <div data-testid="auth-refresh-token">
          <strong>Refresh token:</strong> {refreshToken ? "present" : "missing"}
        </div>

        {status && <SuccessBox>{status}</SuccessBox>}
        {error && <ErrorBox>{error}</ErrorBox>}
      </Card>
    </PageShell>
  );
}

const h2Style: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  marginBottom: 12,
};

const fieldGap: React.CSSProperties = { marginTop: 10 };

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}
