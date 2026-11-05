"use client";

import { useState } from "react";
import { pingApi, type PingResult } from "@/lib/api";
import { useToast } from "@/components/toast";
import { IconActivity, IconServer } from "@/components/icons";
import { Button, Card, CardHeader, ErrorBox, MetaList, Mono, PageHeader, PageShell, Spinner, SuccessBox, cx } from "@/components/ui";

type PingState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; result: PingResult }
  | { kind: "error"; message: string };

const STATE_META = {
  idle: { label: "Not checked", dot: "bg-fg-subtle", text: "text-fg-secondary", bg: "bg-subtle" },
  loading: { label: "Checking…", dot: "bg-warning-500", text: "text-warning-700", bg: "bg-warning-50" },
  success: { label: "Operational", dot: "bg-success-600", text: "text-success-700", bg: "bg-success-50" },
  error: { label: "Unreachable", dot: "bg-danger-600", text: "text-danger-700", bg: "bg-danger-50" },
} as const;

export default function PingPage() {
  const [state, setState] = useState<PingState>({ kind: "idle" });
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const { push } = useToast();

  async function handlePing() {
    setState({ kind: "loading" });

    try {
      const result = await pingApi();
      setCheckedAt(new Date().toLocaleTimeString());
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
      setCheckedAt(new Date().toLocaleTimeString());
      push("Network error while pinging API", "error");
      setState({
        kind: "error",
        message: error instanceof Error ? error.message : "Unknown network error",
      });
    }
  }

  const meta = STATE_META[state.kind];

  return (
    <PageShell>
      <PageHeader
        title="API status"
        description="Verify that this frontend can reach the Ingress API."
        actions={
          <Button data-testid="ping-submit" onClick={handlePing} disabled={state.kind === "loading"}>
            {state.kind === "loading" ? <Spinner className="border-white/40 border-t-white" /> : <IconActivity size={16} />}
            {state.kind === "loading" ? "Pinging..." : "Ping API"}
          </Button>
        }
      />

      <Card className="max-w-[760px]">
        <CardHeader title="Health check" description="Liveness endpoint of the backend service" icon={<IconServer size={17} />} />

        <div className={cx("mb-5 flex items-center gap-3 rounded-lg px-4 py-3", meta.bg)}>
          <span className="relative flex h-2.5 w-2.5">
            {state.kind === "loading" && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-warning-500/60" />}
            <span className={cx("relative inline-flex h-2.5 w-2.5 rounded-full", meta.dot)} />
          </span>
          <span className={cx("text-[14px] font-semibold", meta.text)}>{meta.label}</span>
          {checkedAt && <span className="ml-auto text-[12.5px] text-fg-muted">Last checked {checkedAt}</span>}
        </div>

        <MetaList
          items={[
            { term: "Endpoint", value: <Mono>NEXT_PUBLIC_API_BASE_URL/health/live</Mono> },
            { term: "Method", value: "GET" },
          ]}
        />

        {state.kind === "idle" && (
          <p data-testid="ping-idle" className="mt-5 border-t border-line pt-4 text-[13px] text-fg-muted">
            No request sent yet.
          </p>
        )}

        {state.kind === "success" && (
          <SuccessBox data-testid="ping-success" className="mb-0 mt-5">
            <div className="font-medium">Success ({state.result.status}) - API reachable.</div>
            <div className="mt-1 break-all text-[12.5px]">URL: {state.result.url}</div>
            <div className="break-all text-[12.5px]">Response: {state.result.body || "(empty)"}</div>
          </SuccessBox>
        )}

        {state.kind === "error" && (
          <ErrorBox data-testid="ping-error" className="mb-0 mt-5">
            {state.message}
          </ErrorBox>
        )}
      </Card>
    </PageShell>
  );
}
