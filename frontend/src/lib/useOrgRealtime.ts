"use client";

import { useEffect } from "react";
import { subscribeOrgEvents, type OrgRealtimeEvent } from "@/lib/realtime";

export function useOrgRealtime(orgId: string | undefined, onEvent: (event: OrgRealtimeEvent) => void) {
  useEffect(() => {
    if (!orgId) return;

    let unsubscribe: (() => Promise<void>) | null = null;
    void (async () => {
      try {
        unsubscribe = await subscribeOrgEvents(orgId, onEvent);
      } catch (error) {
        console.warn("Realtime subscription failed; using non-realtime fallback.", error);
      }
    })();

    return () => {
      if (!unsubscribe) return;
      void unsubscribe();
    };
  }, [orgId, onEvent]);
}
