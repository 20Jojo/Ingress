import { listInvites, type InviteDto } from "@/lib/invitesApi";
import { listMembers, type MemberDto } from "@/lib/membersApi";
import { listProjects, type ProjectDto } from "@/lib/projectsApi";
import { listTasks, type TaskDto } from "@/lib/tasksApi";

export type DashboardData = {
  members: MemberDto[];
  projects: ProjectDto[];
  tasks: TaskDto[];
  invites: InviteDto[] | null;
  counts: {
    members: number;
    projects: number;
    tasks: number;
    pendingInvites: number;
    acceptedInvites: number;
    revokedInvites: number;
    overdueTasks: number;
  };
  tasksByStatus: Record<string, number>;
  membersByRole: Record<string, number>;
  recentEvents: DashboardEvent[];
};

export type DashboardEvent = {
  id: string;
  type: "task_created" | "invite_created";
  label: string;
  at: string;
};

export async function getOrgDashboardData(orgId: string): Promise<DashboardData> {
  const [members, projects] = await Promise.all([listMembers(orgId), listProjects(orgId)]);

  const tasksByProject = await Promise.all(projects.map((p) => listTasks(p.id)));
  const tasks = tasksByProject.flat();

  let invites: InviteDto[] | null = null;
  try {
    invites = await listInvites(orgId);
  } catch {
    invites = null;
  }

  const now = Date.now();
  const tasksByStatus: Record<string, number> = {};
  for (const t of tasks) {
    const key = t.status || "Unknown";
    tasksByStatus[key] = (tasksByStatus[key] ?? 0) + 1;
  }

  const membersByRole: Record<string, number> = {};
  for (const m of members) {
    const role = m.role || "Unknown";
    membersByRole[role] = (membersByRole[role] ?? 0) + 1;
  }

  const overdueTasks = tasks.filter((t) => t.dueAt && Date.parse(t.dueAt) < now && t.status !== "Done").length;

  const pendingInvites = invites?.filter((i) => !i.acceptedAtUtc && !i.revokedAtUtc).length ?? 0;
  const acceptedInvites = invites?.filter((i) => !!i.acceptedAtUtc).length ?? 0;
  const revokedInvites = invites?.filter((i) => !!i.revokedAtUtc).length ?? 0;

  const taskEvents: DashboardEvent[] = tasks
    .filter((t) => !!t.createdAt)
    .map((t) => ({
      id: `task:${t.id}`,
      type: "task_created",
      label: `Task created: ${t.title}`,
      at: t.createdAt,
    }));

  const inviteEvents: DashboardEvent[] =
    invites?.filter((i) => !!i.createdAtUtc).map((i) => ({
      id: `invite:${i.id}`,
      type: "invite_created",
      label: `Invite created for ${i.email}`,
      at: i.createdAtUtc,
    })) ?? [];

  const recentEvents = [...taskEvents, ...inviteEvents]
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
    .slice(0, 12);

  return {
    members,
    projects,
    tasks,
    invites,
    counts: {
      members: members.length,
      projects: projects.length,
      tasks: tasks.length,
      pendingInvites,
      acceptedInvites,
      revokedInvites,
      overdueTasks,
    },
    tasksByStatus,
    membersByRole,
    recentEvents,
  };
}

