"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import {
  getRealtimeConnectionStatus,
  subscribeOrgEvents,
  subscribeRealtimeConnectionStatus,
  type OrgRealtimeEvent,
  type RealtimeConnectionStatus,
} from "@/lib/realtime";

type UseOrgRealtimeOptions = {
  eventTypes?: string[];
  debounceMs?: number;
};

export function useOrgRealtime(
  orgId: string | undefined,
  onEvent: (event: OrgRealtimeEvent) => void,
  options?: UseOrgRealtimeOptions,
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastEventRef = useRef<OrgRealtimeEvent | null>(null);
  const debounceMs = options?.debounceMs ?? 350;

  useEffect(() => {
    if (!orgId) return;

    let unsubscribe: (() => Promise<void>) | null = null;
    let cancelled = false;

    void (async () => {
      try {
        unsubscribe = await subscribeOrgEvents(
          orgId,
          (event) => {
            if (debounceMs <= 0) {
              onEvent(event);
              return;
            }

            lastEventRef.current = event;
            if (timerRef.current) {
              clearTimeout(timerRef.current);
            }
            timerRef.current = setTimeout(() => {
              const pending = lastEventRef.current;
              lastEventRef.current = null;
              if (pending) onEvent(pending);
            }, debounceMs);
          },
          { eventTypes: options?.eventTypes },
        );
      } catch (error) {
        console.warn("Realtime subscription failed; using non-realtime fallback.", error);
      }
    })();

    return () => {
      cancelled = true;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (!unsubscribe) return;
      if (cancelled) {
        void unsubscribe();
      }
    };
  }, [orgId, onEvent, debounceMs, options?.eventTypes]);
}

export function useRealtimeConnectionStatus(): RealtimeConnectionStatus {
  return useSyncExternalStore(
    subscribeRealtimeConnectionStatus,
    getRealtimeConnectionStatus,
    getRealtimeConnectionStatus,
  );
}
