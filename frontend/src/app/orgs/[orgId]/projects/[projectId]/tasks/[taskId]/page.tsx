"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { listMembers, type MemberDto } from "@/lib/membersApi";
import {
  assignTask,
  listTasks,
  updateTaskDetails,
  updateTaskDueDate,
  updateTaskStatus,
  type TaskDto,
} from "@/lib/tasksApi";
import { useOrgRealtime } from "@/lib/useOrgRealtime";
import {
  Button,
  Card,
  ErrorBox,
  Input,
  PageShell,
  PageTitle,
  Row,
  Select,
  TextArea,
} from "@/components/ui";

const STATUSES = ["Todo", "InProgress", "Done"] as const;

export default function TaskDetailPage() {
  const params = useParams<{ orgId: string; projectId: string; taskId: string }>();
  const orgId = useMemo(
    () => (Array.isArray(params.orgId) ? params.orgId[0] : params.orgId),
    [params.orgId],
  );
  const projectId = useMemo(
    () => (Array.isArray(params.projectId) ? params.projectId[0] : params.projectId),
    [params.projectId],
  );
  const taskId = useMemo(
    () => (Array.isArray(params.taskId) ? params.taskId[0] : params.taskId),
    [params.taskId],
  );

  const [task, setTask] = useState<TaskDto | null>(null);
  const [members, setMembers] = useState<MemberDto[]>([]);
  const [titleInput, setTitleInput] = useState("");
  const [descriptionInput, setDescriptionInput] = useState("");
  const [dueInput, setDueInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!orgId || !projectId || !taskId) return;
    setError("");
    try {
      const [tasks, memberList] = await Promise.all([listTasks(projectId), listMembers(orgId)]);
      const selected = tasks.find((t) => t.id === taskId) ?? null;
      if (!selected) {
        setTask(null);
        setError("Task not found in this project.");
        return;
      }

      setTask(selected);
      setMembers(memberList.filter((m) => !!m.userId));
    } catch (e: unknown) {
      setError(getErrorMessage(e, "Failed to load task"));
    }
  }, [orgId, projectId, taskId]);

  async function onSaveDetails() {
    if (!task?.id) return;
    const nextTitle = titleInput.trim() || task.title;
    const nextDescription = descriptionInput !== "" ? descriptionInput : task.description;

    setBusy(true);
    try {
      await updateTaskDetails(task.id, nextTitle, nextDescription);
      setTitleInput("");
      setDescriptionInput("");
      await load();
    } catch (e: unknown) {
      setError(getErrorMessage(e, "Failed to update details"));
    } finally {
      setBusy(false);
    }
  }

  async function onSetStatus(status: string) {
    if (!task?.id) return;
    setBusy(true);
    try {
      await updateTaskStatus(task.id, status);
      await load();
    } catch (e: unknown) {
      setError(getErrorMessage(e, "Failed to update status"));
    } finally {
      setBusy(false);
    }
  }

  async function onSetAssignee(userId: string) {
    if (!task?.id) return;
    setBusy(true);
    try {
      await assignTask(task.id, userId || null);
      await load();
    } catch (e: unknown) {
      setError(getErrorMessage(e, "Failed to assign task"));
    } finally {
      setBusy(false);
    }
  }

  async function onSaveDueDate() {
    if (!task?.id) return;
    setBusy(true);
    try {
      await updateTaskDueDate(task.id, dueInput ? toIso(dueInput) : null);
      setDueInput("");
      await load();
    } catch (e: unknown) {
      setError(getErrorMessage(e, "Failed to update due date"));
    } finally {
      setBusy(false);
    }
  }

  async function onClearDueDate() {
    if (!task?.id) return;
    setBusy(true);
    try {
      await updateTaskDueDate(task.id, null);
      setDueInput("");
      await load();
    } catch (e: unknown) {
      setError(getErrorMessage(e, "Failed to clear due date"));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!orgId || !projectId || !taskId) return;
    void load();
  }, [orgId, projectId, taskId, load]);

  const handleRealtime = useCallback(() => {
    void load();
  }, [load]);
  useOrgRealtime(orgId, handleRealtime);

  return (
    <PageShell wide>
      <Row>
        <Link href={`/orgs/${orgId}/projects/${projectId}/tasks`}>Back to tasks</Link>
      </Row>

      <PageTitle title={task?.title || "Task"} subtitle={<span>Task ID: {taskId}</span>} />

      {error && <ErrorBox>{error}</ErrorBox>}

      {task && (
        <div style={{ display: "grid", gap: 14 }}>
          <Card>
            <h2 style={h2}>Status + Assignee</h2>
            <div style={twoCol}>
              <Select value={task.status} onChange={(e) => void onSetStatus(e.target.value)} disabled={busy}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>

              <Select
                value={task.assigneeUserId ?? ""}
                onChange={(e) => void onSetAssignee(e.target.value)}
                disabled={busy}
              >
                <option value="">Unassigned</option>
                {members.map((m, idx) => (
                  <option key={`${m.userId || "member"}:${idx}`} value={m.userId}>
                    {m.userId} ({m.role || "Member"})
                  </option>
                ))}
              </Select>
            </div>
          </Card>

          <Card>
            <h2 style={h2}>Details</h2>
            <Input
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              placeholder={`Title (${task.title || "untitled"})`}
            />
            <TextArea
              value={descriptionInput}
              onChange={(e) => setDescriptionInput(e.target.value)}
              placeholder={task.description ?? "Description"}
              style={{ marginTop: 10 }}
            />
            <Button onClick={onSaveDetails} disabled={busy} style={{ marginTop: 10 }}>
              Save Details
            </Button>
          </Card>

          <Card>
            <h2 style={h2}>Due Date</h2>
            <div style={{ opacity: 0.8, marginBottom: 8 }}>
              Current: {task.dueAt ? new Date(task.dueAt).toLocaleString() : "none"}
            </div>
            <Input type="datetime-local" value={dueInput} onChange={(e) => setDueInput(e.target.value)} />
            <Row>
              <Button onClick={onSaveDueDate} disabled={busy}>
                Save Due Date
              </Button>
              <Button onClick={onClearDueDate} disabled={busy} variant="secondary">
                Clear Due Date
              </Button>
            </Row>
          </Card>

          <Card>
            <h2 style={h2}>Metadata</h2>
            <div>Created: {task.createdAt ? new Date(task.createdAt).toLocaleString() : "-"}</div>
            <div>Project ID: {task.projectId || "-"}</div>
            <div>Task ID: {task.id || "-"}</div>
          </Card>
        </div>
      )}
    </PageShell>
  );
}

const h2: React.CSSProperties = {
  margin: "0 0 10px",
  fontSize: 18,
  fontWeight: 700,
};

const twoCol: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 10,
};

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function toIso(localDateTime: string): string {
  return new Date(localDateTime).toISOString();
}
