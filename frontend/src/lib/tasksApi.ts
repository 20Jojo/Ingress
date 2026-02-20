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

export async function listTasks(projectId: string): Promise<TaskDto[]> {
  return authJson<TaskDto[]>(`/projects/${projectId}/tasks`, {
    method: "GET",
  });
}

export async function createTask(
  projectId: string,
  title: string,
  description?: string,
): Promise<TaskDto> {
  return authJson<TaskDto>(`/projects/${projectId}/tasks`, {
    method: "POST",
    body: JSON.stringify({ title, description: description || null }),
  });
}

export async function updateTaskStatus(taskId: string, status: string): Promise<TaskDto> {
  return authJson<TaskDto>(`/tasks/${taskId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function updateTaskDetails(
  taskId: string,
  title: string,
  description?: string | null,
): Promise<TaskDto> {
  return authJson<TaskDto>(`/tasks/${taskId}/details`, {
    method: "PUT",
    body: JSON.stringify({ title, description: description ?? null }),
  });
}

export async function updateTaskDueDate(
  taskId: string,
  dueAt: string | null,
): Promise<TaskDto> {
  return authJson<TaskDto>(`/tasks/${taskId}/due`, {
    method: "PATCH",
    body: JSON.stringify({ dueAt }),
  });
}

export async function assignTask(
  taskId: string,
  userId: string | null,
): Promise<TaskDto> {
  return authJson<TaskDto>(`/tasks/${taskId}/assign`, {
    method: "PATCH",
    body: JSON.stringify({ userId }),
  });
}

export async function getTask(taskId: string): Promise<TaskDto> {
  return authJson<TaskDto>(`/tasks/${taskId}`, {
    method: "GET",
  });
}
