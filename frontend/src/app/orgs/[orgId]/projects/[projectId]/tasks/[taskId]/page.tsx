"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { listMembers, type MemberDto } from "@/lib/membersApi";
import {
  assignTask,
  getTask,
  updateTaskDetails,
  updateTaskDueDate,
  updateTaskStatus,
  type TaskDto,
} from "@/lib/tasksApi";
import { useOrgRealtime } from "@/lib/useOrgRealtime";
import { Avatar } from "@/components/graphics";
import { IconArrowLeft, IconCalendar } from "@/components/icons";
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  CardHeader,
  ErrorBox,
  Field,
  Input,
  LoadingCard,
  MetaList,
  Mono,
  PageHeader,
  PageShell,
  STATUS_META,
  Select,
  StatusBadge,
  TextArea,
  cx,
} from "@/components/ui";

const STATUSES = ["Todo", "InProgress", "Done"] as const;
const TASK_DETAIL_EVENTS = ["task.*", "member.*"];

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
      const [taskItem, memberList] = await Promise.all([getTask(taskId), listMembers(orgId)]);
      setTask(taskItem);
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
  useOrgRealtime(orgId, handleRealtime, { eventTypes: TASK_DETAIL_EVENTS, debounceMs: 300 });

  const overdue = !!task?.dueAt && task.status !== "Done" && new Date(task.dueAt).getTime() < Date.now();

  return (
    <PageShell>
      <div className="mb-4">
        <ButtonLink href={`/orgs/${orgId}/projects/${projectId}/tasks`} variant="ghost" size="sm" className="-ml-3">
          <IconArrowLeft size={15} /> Back to tasks
        </ButtonLink>
      </div>

      <PageHeader
        eyebrow="Task"
        title={task?.title || "Task"}
        description={task?.description || undefined}
        meta={
          <>
            {task && <StatusBadge status={task.status} />}
            {overdue && <Badge tone="danger">Overdue</Badge>}
            <Mono>{taskId}</Mono>
          </>
        }
      />

      {error && <ErrorBox>{error}</ErrorBox>}
      {!task && !error && <LoadingCard label="Loading task..." rows={2} />}

      {task && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="grid content-start gap-6">
            <Card>
              <CardHeader title="Status" description="Move this task to the stage it's in." />
              <div className="grid grid-cols-3 gap-2" role="group" aria-label="Task status">
                {STATUSES.map((s) => {
                  const active = task.status === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      aria-pressed={active}
                      disabled={busy}
                      onClick={() => !active && void onSetStatus(s)}
                      className={cx(
                        "flex cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-[13.5px] font-medium transition-colors disabled:cursor-wait",
                        active
                          ? "border-brand-500 bg-brand-50 text-brand-800 ring-1 ring-inset ring-brand-500"
                          : "border-line-strong bg-surface text-fg-secondary hover:bg-subtle",
                      )}
                    >
                      <span className="h-2 w-2 rounded-full" style={{ background: STATUS_META[s].color }} aria-hidden />
                      {STATUS_META[s].label}
                    </button>
                  );
                })}
              </div>
            </Card>

            <Card>
              <CardHeader title="Details" description="Leave a field blank to keep its current value." />
              <div className="grid gap-5">
                <Field label="Title" htmlFor="task-title">
                  <Input id="task-title" value={titleInput} onChange={(e) => setTitleInput(e.target.value)} placeholder={task.title || "Untitled"} />
                </Field>
                <Field label="Description" htmlFor="task-desc">
                  <TextArea
                    id="task-desc"
                    value={descriptionInput}
                    onChange={(e) => setDescriptionInput(e.target.value)}
                    placeholder={task.description ?? "Add context for your team…"}
                    rows={5}
                  />
                </Field>
                <div className="flex justify-end">
                  <Button onClick={onSaveDetails} disabled={busy}>
                    Save Details
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid content-start gap-6">
            <Card>
              <CardHeader title="Assignee" />
              <div className="flex items-center gap-3">
                {task.assigneeUserId ? (
                  <Avatar seed={task.assigneeUserId} label={task.assigneeUserId} size={36} />
                ) : (
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-dashed border-line-strong text-fg-subtle" aria-hidden>
                    ?
                  </span>
                )}
                <Select value={task.assigneeUserId ?? ""} onChange={(e) => void onSetAssignee(e.target.value)} disabled={busy} aria-label="Task assignee">
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
              <CardHeader title="Due date" icon={<IconCalendar size={17} />} />
              <div className={cx("mb-4 text-[14px] font-medium", overdue ? "text-danger-700" : "text-fg")}>
                {task.dueAt ? new Date(task.dueAt).toLocaleString() : "No due date set"}
              </div>
              <Input type="datetime-local" value={dueInput} onChange={(e) => setDueInput(e.target.value)} aria-label="Task due date" />
              <div className="mt-3 flex flex-wrap gap-2">
                <Button onClick={onSaveDueDate} disabled={busy} size="sm">
                  Save Due Date
                </Button>
                <Button onClick={onClearDueDate} disabled={busy} variant="secondary" size="sm">
                  Clear Due Date
                </Button>
              </div>
            </Card>

            <Card>
              <CardHeader title="Metadata" />
              <MetaList
                items={[
                  { term: "Created", value: task.createdAt ? new Date(task.createdAt).toLocaleString() : "-" },
                  { term: "Project ID", value: <Mono>{task.projectId || "-"}</Mono> },
                  { term: "Task ID", value: <Mono>{task.id || "-"}</Mono> },
                ]}
              />
            </Card>
          </div>
        </div>
      )}
    </PageShell>
  );
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function toIso(localDateTime: string): string {
  return new Date(localDateTime).toISOString();
}
