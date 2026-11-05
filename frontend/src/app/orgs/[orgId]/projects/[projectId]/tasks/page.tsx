"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { listMembers, type MemberDto } from "@/lib/membersApi";
import { useToast } from "@/components/toast";
import { assignTask, createTask, listTasks, updateTaskStatus, type TaskDto } from "@/lib/tasksApi";
import { useOrgRealtime } from "@/lib/useOrgRealtime";
import { Avatar } from "@/components/graphics";
import { IconArrowRight, IconCalendar, IconPlus, IconRefresh, IconTask } from "@/components/icons";
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  EmptyState,
  ErrorBox,
  Field,
  Input,
  LoadingCard,
  PageHeader,
  PageShell,
  STATUS_META,
  Section,
  Select,
  TextArea,
  cx,
} from "@/components/ui";

const STATUSES = ["Todo", "InProgress", "Done"] as const;
const TASK_EVENTS = ["task.*", "member.*"];

type Entry = { task: TaskDto; idx: number };

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

  async function onCreate(e?: FormEvent) {
    e?.preventDefault();
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
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to create task");
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
  useOrgRealtime(orgId, handleRealtime, { eventTypes: TASK_EVENTS, debounceMs: 300 });

  const columns = useMemo(() => {
    const groups: { status: string; items: Entry[] }[] = STATUSES.map((s) => ({ status: s, items: [] }));
    const other: Entry[] = [];
    (tasks ?? []).forEach((task, idx) => {
      const group = groups.find((g) => g.status === task.status);
      if (group) group.items.push({ task, idx });
      else other.push({ task, idx });
    });
    if (other.length) groups.push({ status: "Other", items: other });
    return groups;
  }, [tasks]);

  return (
    <PageShell>
      <PageHeader
        title="Tasks"
        description="Track work through each stage. Changes are shared with your team in real time."
        actions={
          <>
            <ButtonLink href={`/orgs/${orgId}/projects/${projectId}`} variant="ghost">
              Project overview
            </ButtonLink>
            <Button onClick={() => void load(true)} variant="secondary">
              <IconRefresh size={16} /> Reload
            </Button>
          </>
        }
      />

      <Section title="New task" id="new-task">
        <Card>
          <form onSubmit={onCreate} className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto] md:items-end">
            <Field label="Title" htmlFor="task-title">
              <Input
                id="task-title"
                data-testid="task-create-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs to be done?"
                aria-label="Task title"
              />
            </Field>
            <Field label="Description" htmlFor="task-desc">
              <TextArea
                id="task-desc"
                data-testid="task-create-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional context"
                aria-label="Task description"
                className="h-10 min-h-10 py-2"
                rows={1}
              />
            </Field>
            <Button data-testid="task-create-submit" type="submit" disabled={busy}>
              <IconPlus size={16} /> {busy ? "Creating..." : "Create Task"}
            </Button>
          </form>
        </Card>
      </Section>

      {error && <ErrorBox>{error}</ErrorBox>}

      <Section title="Board" description={tasks ? `${tasks.length} task${tasks.length === 1 ? "" : "s"}` : undefined} id="board">
        {tasks === null && !error && <LoadingCard label="Loading tasks..." rows={3} />}

        {tasks && tasks.length === 0 && (
          <EmptyState icon={<IconTask size={20} />} title="No tasks yet" description="Create the first task for this project above." />
        )}

        {tasks && tasks.length > 0 && (
          <div className="-mx-5 overflow-x-auto px-5 pb-2 sm:-mx-8 sm:px-8 lg:-mx-10 lg:px-10">
            <div className="grid min-w-[880px] gap-4" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
              {columns.map((col) => {
                const meta = STATUS_META[col.status];
                return (
                  <section
                    key={col.status}
                    aria-label={`${meta?.label ?? col.status} column`}
                    className="flex flex-col rounded-xl border border-line bg-subtle/60"
                  >
                    <header className="flex items-center justify-between px-4 py-3">
                      <h3 className="flex items-center gap-2 text-[13.5px] font-semibold text-fg">
                        <span className="h-2 w-2 rounded-full" style={{ background: meta?.color ?? "#94a3b8" }} aria-hidden />
                        {meta?.label ?? col.status}
                      </h3>
                      <span className="rounded-full bg-surface px-2 py-0.5 text-[12px] font-medium text-fg-muted ring-1 ring-inset ring-line">
                        {col.items.length}
                      </span>
                    </header>
                    <ul className="grid content-start gap-2.5 px-2.5 pb-2.5">
                      {col.items.length === 0 && (
                        <li className="rounded-lg border border-dashed border-line-strong px-4 py-6 text-center text-[13px] text-fg-muted">
                          No tasks
                        </li>
                      )}
                      {col.items.map(({ task, idx }) => {
                        const key = taskKey(task, idx);
                        const busyThis = busyTaskKey === key;
                        const taskId = task.id || "";
                        const overdue = !!task.dueAt && task.status !== "Done" && new Date(task.dueAt).getTime() < Date.now();
                        return (
                          <li
                            key={key}
                            data-testid={`task-row-${task.id || idx}`}
                            className={cx(
                              "rounded-lg border border-line bg-surface p-3.5 shadow-xs transition-[opacity,box-shadow] hover:shadow-sm",
                              busyThis && "opacity-60",
                            )}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="break-words text-[14px] font-medium leading-snug text-fg">{task.title || "Untitled task"}</div>
                                {task.description && <p className="mt-1 line-clamp-2 text-[12.5px] text-fg-muted">{task.description}</p>}
                              </div>
                              {task.assigneeUserId && (
                                <span title={`Assigned to ${task.assigneeUserId}`}>
                                  <Avatar seed={task.assigneeUserId} label={task.assigneeUserId} size={26} />
                                </span>
                              )}
                            </div>

                            <div className="mt-3">
                              <Badge tone={overdue ? "danger" : "neutral"}>
                                <IconCalendar size={12} />
                                {task.dueAt
                                  ? `${overdue ? "Overdue · " : "Due "}${new Date(task.dueAt).toLocaleDateString()}`
                                  : "No due date"}
                              </Badge>
                            </div>

                            <div className="mt-3 grid gap-2 border-t border-line pt-3">
                              <Select
                                value={task.status}
                                onChange={(e) => void onChangeStatus(task, e.target.value, key)}
                                disabled={busyThis || !taskId}
                                aria-label={`Status for ${task.title || "task"}`}
                                className="h-8 text-[13px]"
                              >
                                {STATUSES.map((s) => (
                                  <option key={s} value={s}>
                                    {STATUS_META[s]?.label ?? s}
                                  </option>
                                ))}
                              </Select>
                              <Select
                                value={task.assigneeUserId ?? ""}
                                onChange={(e) => void onAssign(task, e.target.value, key)}
                                disabled={busyThis || !taskId}
                                aria-label={`Assignee for ${task.title || "task"}`}
                                className="h-8 text-[13px]"
                              >
                                <option value="">Unassigned</option>
                                {members.map((m, mIdx) => (
                                  <option key={memberOptionKey(m, mIdx)} value={m.userId}>
                                    {m.userId} ({m.role || "Member"})
                                  </option>
                                ))}
                              </Select>
                            </div>

                            {taskId ? (
                              <Link
                                href={`/orgs/${orgId}/projects/${projectId}/tasks/${taskId}`}
                                className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-medium text-brand-700 hover:text-brand-800 hover:underline"
                              >
                                Open details <IconArrowRight size={13} />
                              </Link>
                            ) : (
                              <span className="mt-3 block text-[12px] text-fg-muted">No task id</span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                );
              })}
            </div>
          </div>
        )}
      </Section>
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

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
