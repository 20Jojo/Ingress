"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { listMembers, type MemberDto } from "@/lib/membersApi";
import { useToast } from "@/components/toast";
import { assignTask, createTask, listTasks, updateTaskStatus, type TaskDto } from "@/lib/tasksApi";
import { useOrgRealtime } from "@/lib/useOrgRealtime";
import {
  Button,
  DataList,
  DataRow,
  EmptyState,
  ErrorBox,
  Input,
  LoadingCard,
  PageShell,
  PageTitle,
  Row,
  Select,
  TextArea,
} from "@/components/ui";

const STATUSES = ["Todo", "InProgress", "Done"] as const;

export default function ProjectTasksPage() {
  const params = useParams<{ orgId: string; projectId: string }>();
  const orgId = useMemo(
    () => (Array.isArray(params.orgId) ? params.orgId[0] : params.orgId),
    [params.orgId],
  );
  const projectId = useMemo(
    () => (Array.isArray(params.projectId) ? params.projectId[0] : params.projectId),
    [params.projectId],
  );

  const [tasks, setTasks] = useState<TaskDto[] | null>(null);
  const [members, setMembers] = useState<MemberDto[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [busyTaskKey, setBusyTaskKey] = useState<string | null>(null);
  const [error, setError] = useState("");
  const { push } = useToast();

  const load = useCallback(
    async (reset: boolean) => {
      if (!orgId || !projectId) return;
      if (reset) {
        setError("");
        setTasks(null);
      }

      try {
        const [taskList, memberList] = await Promise.all([listTasks(projectId), listMembers(orgId)]);
        setTasks(taskList);
        setMembers(memberList.filter((m) => !!m.userId));
      } catch (e: unknown) {
        setError(getErrorMessage(e, "Failed to load tasks"));
      }
    },
    [orgId, projectId],
  );

  async function onCreate() {
    if (!projectId) return;
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Task title is required.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      await createTask(projectId, trimmedTitle, description.trim() || undefined);
      setTitle("");
      setDescription("");
      push("Task created", "success");
      await load(true);
    } catch (e: unknown) {
      const message = getErrorMessage(e, "Failed to create task");
      setError(message);
      push(message, "error");
    } finally {
      setBusy(false);
    }
  }

  async function onChangeStatus(task: TaskDto, status: string, key: string) {
    if (!task.id) return;
    setBusyTaskKey(key);
    try {
      await updateTaskStatus(task.id, status);
      push("Task status updated", "success");
      await load(false);
    } catch (e: unknown) {
      const message = getErrorMessage(e, "Failed to update status");
      setError(message);
      push(message, "error");
    } finally {
      setBusyTaskKey(null);
    }
  }

  async function onAssign(task: TaskDto, userId: string, key: string) {
    if (!task.id) return;
    setBusyTaskKey(key);
    try {
      await assignTask(task.id, userId || null);
      push("Task assignee updated", "success");
      await load(false);
    } catch (e: unknown) {
      const message = getErrorMessage(e, "Failed to assign task");
      setError(message);
      push(message, "error");
    } finally {
      setBusyTaskKey(null);
    }
  }

  useEffect(() => {
    if (!orgId || !projectId) return;
    void load(false);
  }, [orgId, projectId, load]);

  const handleRealtime = useCallback(() => {
    void load(false);
  }, [load]);
  useOrgRealtime(orgId, handleRealtime);

  return (
    <PageShell wide>
      <Row>
        <Link href={`/orgs/${orgId}/projects/${projectId}`}>Back to project</Link>
      </Row>

      <PageTitle title="Tasks" subtitle={<span>Org: {orgId} | Project: {projectId}</span>} />

      <div style={{ display: "grid", gap: 10 }}>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" />
        <TextArea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Task description (optional)"
        />
        <Row>
          <Button onClick={onCreate} disabled={busy}>
            {busy ? "Creating..." : "Create Task"}
          </Button>
          <Button onClick={() => void load(true)} variant="secondary">
            Reload
          </Button>
        </Row>
      </div>

      {error && <ErrorBox>{error}</ErrorBox>}
      {tasks === null && <LoadingCard label="Loading tasks..." />}

      {tasks && tasks.length === 0 && <EmptyState>No tasks yet.</EmptyState>}

      {tasks && tasks.length > 0 && (
        <DataList>
          <DataRow>
            <strong>{tasks.length} task(s)</strong>
          </DataRow>

          {tasks.map((task, idx) => {
            const key = taskKey(task, idx);
            const busyThis = busyTaskKey === key;
            const taskId = task.id || "";
            return (
              <DataRow key={key}>
                <div style={taskRow}>
                  <div style={{ flex: 1 }}>
                    <strong>{task.title || "Untitled task"}</strong>
                    {task.description && <div style={{ marginTop: 4, opacity: 0.9 }}>{task.description}</div>}
                    <div style={subtle}>Task ID: {taskId || "-"}</div>
                    <div style={subtle}>
                      Created: {task.createdAt ? new Date(task.createdAt).toLocaleString() : "-"}
                    </div>
                    <div style={subtle}>Due: {task.dueAt ? new Date(task.dueAt).toLocaleString() : "none"}</div>
                  </div>

                  <div style={{ width: "min(270px, 100%)", display: "grid", gap: 8 }}>
                    <Select
                      value={task.status}
                      onChange={(e) => void onChangeStatus(task, e.target.value, key)}
                      disabled={busyThis || !taskId}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </Select>

                    <Select
                      value={task.assigneeUserId ?? ""}
                      onChange={(e) => void onAssign(task, e.target.value, key)}
                      disabled={busyThis || !taskId}
                    >
                      <option value="">Unassigned</option>
                      {members.map((m, mIdx) => (
                        <option key={memberOptionKey(m, mIdx)} value={m.userId}>
                          {m.userId} ({m.role || "Member"})
                        </option>
                      ))}
                    </Select>

                    {taskId ? (
                      <Link href={`/orgs/${orgId}/projects/${projectId}/tasks/${taskId}`}>Open details</Link>
                    ) : (
                      <span style={subtle}>No task id</span>
                    )}
                  </div>
                </div>
              </DataRow>
            );
          })}
        </DataList>
      )}
    </PageShell>
  );
}

function taskKey(task: TaskDto, index: number): string {
  const id = task.id || `task-${index}`;
  const title = task.title || "untitled";
  return `${id}:${title}:${index}`;
}

function memberOptionKey(member: MemberDto, index: number): string {
  return `${member.userId || "member"}:${index}`;
}

const taskRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  flexWrap: "wrap",
};

const subtle: React.CSSProperties = {
  opacity: 0.7,
  fontSize: 12,
  marginTop: 4,
};

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
