"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { isLoggedIn } from "@/lib/auth";
import { getUsers, type UserDto } from "@/lib/usersApi";
import { useToast } from "@/components/toast";
import {
  Button,
  DataList,
  DataRow,
  EmptyState,
  ErrorBox,
  LoadingCard,
  PageShell,
  PageTitle,
  Row,
} from "@/components/ui";

export default function UsersPage() {
  const [users, setUsers] = useState<UserDto[] | null>(null);
  const [error, setError] = useState("");
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const { push } = useToast();

  const load = useCallback(async (reset: boolean) => {
    if (reset) {
      setError("");
      setUsers(null);
    }
    try {
      setUsers(await getUsers());
    } catch (e: unknown) {
      const message = getErrorMessage(e, "Failed to load users");
      setError(message);
      push(message, "error");
    }
  }, [push]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoggedIn(isLoggedIn());
    void load(false);
  }, [load]);

  return (
    <PageShell>
      <PageTitle title="Users" />

      <Row>
        <span>
          Logged in: <strong>{loggedIn === null ? "Checking..." : loggedIn ? "Yes" : "No"}</strong>
        </span>
        <Link href="/auth">Go to /auth</Link>
        <Button onClick={() => void load(true)} variant="secondary">
          Reload
        </Button>
      </Row>

      {error && <ErrorBox>{error}</ErrorBox>}
      {users === null && <LoadingCard label="Loading users..." />}

      {users && users.length === 0 && <EmptyState>No users found.</EmptyState>}

      {users && users.length > 0 && (
        <DataList>
          <DataRow>
            <strong>{users.length} user(s)</strong>
          </DataRow>
          {users.map((u, idx) => (
            <DataRow key={userKey(u, idx)}>
              <strong>{u.displayName || "Unknown"}</strong>
              <div style={{ opacity: 0.8 }}>{u.email || "-"}</div>
              <div style={{ opacity: 0.7, fontSize: 12 }}>{u.id || "-"}</div>
            </DataRow>
          ))}
        </DataList>
      )}
    </PageShell>
  );
}

function userKey(user: UserDto, index: number): string {
  return `${user.id || "user"}:${user.email || "email"}:${index}`;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
