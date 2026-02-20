import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";
import { getAccessToken } from "@/lib/auth";

type Callback = (event: OrgRealtimeEvent) => void;

type Subscription = {
  callback: Callback;
  eventTypes?: Set<string>;
};

export type OrgRealtimeEvent = {
  type: string;
  organizationId: string;
  payload: unknown;
  occurredAtUtc: string;
};

export type RealtimeConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "offline";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
const HUB_URL = API_BASE ? `${API_BASE}/hubs/org-events` : "";

let connection: HubConnection | null = null;
let starting: Promise<void> | null = null;
const subscribers = new Map<string, Set<Subscription>>();

let status: RealtimeConnectionStatus = "idle";
const statusListeners = new Set<() => void>();

export function getRealtimeConnectionStatus(): RealtimeConnectionStatus {
  return status;
}

export function subscribeRealtimeConnectionStatus(listener: () => void): () => void {
  statusListeners.add(listener);
  return () => {
    statusListeners.delete(listener);
  };
}

export async function subscribeOrgEvents(
  orgId: string,
  callback: Callback,
  options?: { eventTypes?: string[] },
): Promise<() => Promise<void>> {
  if (!orgId || !HUB_URL) {
    setStatus("offline");
    return async () => {};
  }

  const set = subscribers.get(orgId) ?? new Set<Subscription>();
  const subscription: Subscription = {
    callback,
    eventTypes: toEventTypeSet(options?.eventTypes),
  };
  set.add(subscription);
  subscribers.set(orgId, set);

  const connected = await ensureConnected();
  if (!connected) {
    return async () => {
      detach(orgId, subscription);
    };
  }

  await joinOrg(orgId);

  return async () => {
    detach(orgId, subscription);

    if (!subscribers.has(orgId)) {
      await leaveOrg(orgId);
    }
    if (subscribers.size === 0) {
      await stopConnection();
    }
  };
}

async function ensureConnected(): Promise<boolean> {
  if (!connection) {
    connection = new HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => getAccessToken() ?? "",
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

      for (const sub of set) {
        if (!matchesEventType(sub.eventTypes, ev.type)) continue;
        sub.callback(ev);
      }
    });

    connection.onreconnecting(() => {
      setStatus("reconnecting");
    });

    connection.onreconnected(async () => {
      setStatus("connected");
      for (const orgId of subscribers.keys()) {
        await joinOrg(orgId);
      }
    });

    connection.onclose(() => {
      setStatus(subscribers.size > 0 ? "offline" : "idle");
    });
  }

  if (connection.state === HubConnectionState.Connected) {
    setStatus("connected");
    return true;
  }

  if (!starting) {
    setStatus("connecting");
    starting = connection.start().finally(() => {
      starting = null;
    });
  }

  try {
    await starting;
    setStatus("connected");
    return true;
  } catch (error) {
    console.warn("Realtime connection failed; continuing without live updates.", error);
    setStatus("offline");
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

async function stopConnection() {
  if (!connection) return;
  if (connection.state === HubConnectionState.Disconnected) {
    setStatus("idle");
    return;
  }
  try {
    await connection.stop();
  } finally {
    setStatus("idle");
  }
}

function detach(orgId: string, sub: Subscription) {
  const existing = subscribers.get(orgId);
  if (!existing) return;

  existing.delete(sub);
  if (existing.size === 0) {
    subscribers.delete(orgId);
  }
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

function toEventTypeSet(eventTypes?: string[]): Set<string> | undefined {
  if (!eventTypes || eventTypes.length === 0) return undefined;
  return new Set(eventTypes.map((x) => x.trim()).filter((x) => x.length > 0));
}

function matchesEventType(allowed: Set<string> | undefined, incomingType: string): boolean {
  if (!allowed || allowed.size === 0) return true;
  if (allowed.has(incomingType)) return true;

  for (const t of allowed) {
    if (t.endsWith("*")) {
      const prefix = t.slice(0, -1);
      if (incomingType.startsWith(prefix)) return true;
    }
  }
  return false;
}

function setStatus(next: RealtimeConnectionStatus) {
  if (status === next) return;
  status = next;
  for (const listener of statusListeners) {
    listener();
  }
}
