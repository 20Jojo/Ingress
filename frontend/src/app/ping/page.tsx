"use client";

import Link from "next/link";
import { useState } from "react";
import { pingApi, type PingResult } from "@/lib/api";
import { useToast } from "@/components/toast";
import {
  Button,
  Card,
  ErrorBox,
  PageShell,
  PageTitle,
  Row,
  SuccessBox,
} from "@/components/ui";

type PingState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; result: PingResult }
  | { kind: "error"; message: string };

export default function PingPage() {
  const [state, setState] = useState<PingState>({ kind: "idle" });
  const { push } = useToast();

  async function handlePing() {
    setState({ kind: "loading" });

    try {
      const result = await pingApi();
      if (!result.ok) {
        push(`Ping failed (${result.status})`, "error");
        setState({
          kind: "error",
          message: `API responded with status ${result.status}. Body: ${result.body || "(empty)"}`,
        });
        return;
      }
      push("API reachable", "success");
      setState({ kind: "success", result });
    } catch (error) {
      push("Network error while pinging API", "error");
      setState({
        kind: "error",
        message: error instanceof Error ? error.message : "Unknown network error",
      });
    }
  }

  return (
    <PageShell>
      <PageTitle title="API Ping" subtitle={<code>NEXT_PUBLIC_API_BASE_URL/health/live</code>} />

      <Row>
        <Button onClick={handlePing} disabled={state.kind === "loading"}>
          {state.kind === "loading" ? "Pinging..." : "Ping API"}
        </Button>
        <Link href="/">Back to home</Link>
      </Row>

      {state.kind === "idle" && <Card>No request sent yet.</Card>}

      {state.kind === "success" && (
        <SuccessBox>
          <div style={{ fontWeight: 700 }}>Success ({state.result.status}) - API reachable.</div>
          <div style={{ marginTop: 8, wordBreak: "break-all" }}>URL: {state.result.url}</div>
          <div style={{ marginTop: 4, wordBreak: "break-all" }}>
            Response: {state.result.body || "(empty)"}
          </div>
        </SuccessBox>
      )}

      {state.kind === "error" && <ErrorBox>{state.message}</ErrorBox>}
    </PageShell>
  );
}
