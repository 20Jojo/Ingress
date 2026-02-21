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
    <PageShell wide>
      <PageTitle
        title="Auth"
        subtitle="Register and sign in with JWT tokens stored in localStorage."
      />

      <div style={panelGrid}>
        <Card style={panelCard}>
          <h2 style={h2Style}>Create account</h2>
          <p style={helperStyle}>Use this in local dev to seed users quickly.</p>
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

          <Button data-testid="auth-register-submit" onClick={onRegister} style={authPrimaryButtonStyle}>
            Register
          </Button>
        </Card>

        <Card style={panelCard}>
          <h2 style={h2Style}>Sign in</h2>
          <p style={helperStyle}>Generates access and refresh tokens for authenticated routes.</p>
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

          <Button data-testid="auth-login-submit" onClick={onLogin} style={authPrimaryButtonStyle}>
            Login
          </Button>

          <div style={logoutSection}>
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
        <h2 style={h2Style}>Session status</h2>
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
  fontSize: 22,
  fontWeight: 700,
  marginBottom: 8,
};

const fieldGap: React.CSSProperties = { marginTop: 10 };

const helperStyle: React.CSSProperties = {
  marginTop: 0,
  marginBottom: 12,
  color: "var(--text-muted)",
  fontSize: 13,
};

const logoutSection: React.CSSProperties = {
  marginTop: 16,
  paddingTop: 16,
  borderTop: "1px solid var(--border-soft)",
};

const panelGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
  gap: 16,
  alignItems: "start",
};

const panelCard: React.CSSProperties = {
  minHeight: 300,
};

const authPrimaryButtonStyle: React.CSSProperties = {
  padding: "6px 10px",
};

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}
