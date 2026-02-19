import { authJson } from "@/lib/authFetch";

export type TaskDto = {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: string;
  assigneeUserId: string | null;
  dueAt: string | null;
  createdAt: string;
};

type TaskWireDto = {
  Id?: string;
  ProjectId?: string;
  Title?: string;
  Description?: string | null;
  Status?: string;
  AssigneeUserId?: string | null;
  DueAt?: string | null;
  CreatedAt?: string;
  id?: string;
  projectId?: string;
  title?: string;
  description?: string | null;
  status?: string;
  assigneeUserId?: string | null;
  dueAt?: string | null;
  createdAt?: string;
};

function normalizeTask(task: TaskWireDto): TaskDto {
  return {
    id: task.id ?? task.Id ?? "",
    projectId: task.projectId ?? task.ProjectId ?? "",
    title: task.title ?? task.Title ?? "",
    description: task.description ?? task.Description ?? null,
    status: task.status ?? task.Status ?? "Todo",
    assigneeUserId: task.assigneeUserId ?? task.AssigneeUserId ?? null,
    dueAt: task.dueAt ?? task.DueAt ?? null,
    createdAt: task.createdAt ?? task.CreatedAt ?? "",
  };
}

export async function listTasks(projectId: string): Promise<TaskDto[]> {
  const list = await authJson<TaskWireDto[]>(`/projects/${projectId}/tasks`, {
    method: "GET",
  });
  return list.map(normalizeTask);
}

export async function createTask(
  projectId: string,
  title: string,
  description?: string,
): Promise<TaskDto> {
  const created = await authJson<TaskWireDto>(`/projects/${projectId}/tasks`, {
    method: "POST",
    body: JSON.stringify({ title, description: description || null }),
  });
  return normalizeTask(created);
}

export async function updateTaskStatus(taskId: string, status: string): Promise<TaskDto> {
  const updated = await authJson<TaskWireDto>(`/tasks/${taskId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  return normalizeTask(updated);
}

export async function updateTaskDetails(
  taskId: string,
  title: string,
  description?: string | null,
): Promise<TaskDto> {
  const updated = await authJson<TaskWireDto>(`/tasks/${taskId}/details`, {
    method: "PUT",
    body: JSON.stringify({ title, description: description ?? null }),
  });
  return normalizeTask(updated);
}

export async function updateTaskDueDate(
  taskId: string,
  dueAt: string | null,
): Promise<TaskDto> {
  const updated = await authJson<TaskWireDto>(`/tasks/${taskId}/due`, {
    method: "PATCH",
    body: JSON.stringify({ dueAt }),
  });
  return normalizeTask(updated);
}

export async function assignTask(
  taskId: string,
  userId: string | null,
): Promise<TaskDto> {
  const updated = await authJson<TaskWireDto>(`/tasks/${taskId}/assign`, {
    method: "PATCH",
    body: JSON.stringify({ userId }),
  });
  return normalizeTask(updated);
}

