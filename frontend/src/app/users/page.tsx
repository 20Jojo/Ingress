"use client";

import { useCallback, useEffect, useState } from "react";
import { isLoggedIn } from "@/lib/auth";
import { getUsers, type UserDto } from "@/lib/usersApi";
import { useToast } from "@/components/toast";
import { Avatar } from "@/components/graphics";
import { IconRefresh, IconUsers } from "@/components/icons";
import {
  Button,
  EmptyState,
  ErrorBox,
  InfoBox,
  LoadingCard,
  Mono,
  PageHeader,
  PageShell,
  Section,
  Table,
  Td,
  TextLink,
  Th,
  THead,
  Tr,
} from "@/components/ui";

export default function UsersPage() {
  const [users, setUsers] = useState<UserDto[] | null>(null);
  const [error, setError] = useState("");
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const { push } = useToast();

  const load = useCallback(
    async (reset: boolean) => {
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
    },
    [push],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoggedIn(isLoggedIn());
    void load(false);
  }, [load]);

  return (
    <PageShell>
      <PageHeader
        title="People"
        description="Everyone with an Ingress account on this platform."
        actions={
          <Button onClick={() => void load(true)} variant="secondary">
            <IconRefresh size={16} /> Reload
          </Button>
        }
      />

      {loggedIn === false && (
        <InfoBox>
          Logged in: No. <TextLink href="/auth">Sign in</TextLink> to view the directory.
        </InfoBox>
      )}

      {error && <ErrorBox>{error}</ErrorBox>}

      <Section title="Directory" description={users ? `${users.length} ${users.length === 1 ? "person" : "people"}` : undefined} id="directory">
        {users === null && !error && <LoadingCard label="Loading users..." />}

        {users && users.length === 0 && <EmptyState icon={<IconUsers size={20} />} title="No users found" />}

        {users && users.length > 0 && (
          <Table caption="Users">
            <THead>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th className="hidden md:table-cell">User ID</Th>
            </THead>
            <tbody>
              {users.map((u, idx) => (
                <Tr key={userKey(u, idx)}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <Avatar seed={u.id || u.email || String(idx)} label={u.displayName || u.email} size={32} />
                      <span className="font-medium text-fg">{u.displayName || "Unknown"}</span>
                    </div>
                  </Td>
                  <Td className="text-fg-secondary">{u.email || "-"}</Td>
                  <Td className="hidden md:table-cell">
                    <Mono>{u.id || "-"}</Mono>
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

function userKey(user: UserDto, index: number): string {
  return `${user.id || "user"}:${user.email || "email"}:${index}`;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
