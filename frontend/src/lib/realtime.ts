import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";
import { getAccessToken } from "@/lib/auth";

type Callback = (event: OrgRealtimeEvent) => void;

export type OrgRealtimeEvent = {
  type: string;
  organizationId: string;
  payload: unknown;
  occurredAtUtc: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
const HUB_URL = API_BASE ? `${API_BASE}/hubs/org-events` : "";

let connection: HubConnection | null = null;
let starting: Promise<void> | null = null;
const subscribers = new Map<string, Set<Callback>>();

export async function subscribeOrgEvents(
  orgId: string,
  callback: Callback,
): Promise<() => Promise<void>> {
  if (!orgId || !HUB_URL) {
    return async () => {};
  }

  const set = subscribers.get(orgId) ?? new Set<Callback>();
  set.add(callback);
  subscribers.set(orgId, set);

  const connected = await ensureConnected();
  if (!connected) {
    return async () => {
      const existing = subscribers.get(orgId);
      if (!existing) return;
      existing.delete(callback);
      if (existing.size === 0) subscribers.delete(orgId);
    };
  }

  await joinOrg(orgId);

  return async () => {
    const existing = subscribers.get(orgId);
    if (!existing) return;

    existing.delete(callback);
    if (existing.size > 0) return;

    subscribers.delete(orgId);
    await leaveOrg(orgId);
  };
}

async function ensureConnected(): Promise<boolean> {
  if (!connection) {
    connection = new HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => getAccessToken() ?? "",
        // We use bearer tokens, not cookies.
        // Disabling credentials avoids CORS credential requirements for negotiate.
        withCredentials: false,
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    connection.on("org_event", (raw: unknown) => {
      const ev = normalizeEvent(raw);
      if (!ev) return;

      const set = subscribers.get(ev.organizationId);
      if (!set || set.size === 0) return;

      for (const cb of set) {
        cb(ev);
      }
    });

    connection.onreconnected(async () => {
      for (const orgId of subscribers.keys()) {
        await joinOrg(orgId);
      }
    });
  }

  if (connection.state === HubConnectionState.Connected) return true;

  if (!starting) {
    starting = connection.start().finally(() => {
      starting = null;
    });
  }

  try {
    await starting;
    return true;
  } catch (error) {
    console.warn("Realtime connection failed; continuing without live updates.", error);
    return false;
  }
}

async function joinOrg(orgId: string) {
  if (!connection || connection.state !== HubConnectionState.Connected) return;
  await connection.invoke("JoinOrg", orgId);
}

async function leaveOrg(orgId: string) {
  if (!connection || connection.state !== HubConnectionState.Connected) return;
  await connection.invoke("LeaveOrg", orgId);
}

function normalizeEvent(raw: unknown): OrgRealtimeEvent | null {
  if (!raw || typeof raw !== "object") return null;
  const ev = raw as Record<string, unknown>;

  const type = asString(ev.type) ?? asString(ev.Type);
  const organizationId = asString(ev.organizationId) ?? asString(ev.OrganizationId);
  const occurredAtUtc = asString(ev.occurredAtUtc) ?? asString(ev.OccurredAtUtc);
  const payload = ev.payload ?? ev.Payload ?? {};

  if (!type || !organizationId || !occurredAtUtc) return null;
  return { type, organizationId, occurredAtUtc, payload };
}

function asString(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null;
}
