import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import React from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n";

/**
 * Two-client offline editing stress test.
 *
 * Scenario: Client A and Client B both edit the SAME trip while offline,
 * each producing a queued 'update' for the same tripId. When the network
 * returns we expect:
 *   1. Both updates are detected as a conflict.
 *   2. The merge strategy is LAST-WRITE-WINS by timestamp.
 *   3. Non-conflicting fields from the older edit are preserved.
 *   4. The server is hit ONCE with the merged payload (not twice).
 *   5. A localized "conflict resolved" toast is emitted.
 */
const h = vi.hoisted(() => ({
  toastSpy: vi.fn(),
  updateImpl: vi.fn(),
  state: { queue: [] as any[] },
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: h.toastSpy }),
  toast: h.toastSpy,
}));

vi.mock("@/lib/offlineStorage", () => ({
  initOfflineDB: vi.fn().mockResolvedValue({}),
  getSyncQueue: vi.fn(async () => h.state.queue.slice()),
  removeFromSyncQueue: vi.fn(async (id: string) => {
    h.state.queue = h.state.queue.filter((q) => q.id !== id);
  }),
  updateSyncQueueItem: vi.fn(async (id: string, patch: any) => {
    h.state.queue = h.state.queue.map((q) => (q.id === id ? { ...q, ...patch } : q));
  }),
  addToSyncQueue: vi.fn(async (item: any) => {
    const id = crypto.randomUUID();
    h.state.queue.push({ id, timestamp: Date.now(), retries: 0, ...item });
    return id;
  }),
  cacheTrip: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ session: { user: { id: "u1" } } }),
    },
    from: () => ({
      insert: () => ({ select: () => ({ single: () => h.updateImpl() }) }),
      update: (payload: any) => ({ eq: (_c: string, id: string) => h.updateImpl(payload, id) }),
    }),
  },
}));

import { useOfflineSync } from "@/hooks/useOfflineSync";

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(I18nextProvider, { i18n }, children);

beforeEach(() => {
  h.state.queue = [];
  h.toastSpy.mockClear();
  h.updateImpl.mockReset();
  Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
});

describe("Offline conflict merge — two clients editing the same trip", () => {
  it("merges concurrent updates with last-write-wins and hits the server ONCE", async () => {
    const { result } = renderHook(() => useOfflineSync(), { wrapper });
    await i18n.changeLanguage("bs");

    // Client A edits title earlier
    await act(async () => {
      await result.current.queueTripUpdate("trip-42", { name: "A title", notes: "from A" });
    });
    // Tiny gap so timestamps differ deterministically
    await new Promise((r) => setTimeout(r, 5));
    // Client B edits title + transport LATER → must win on shared keys
    await act(async () => {
      await result.current.queueTripUpdate("trip-42", { name: "B title", transport: "bus" });
    });

    expect(h.state.queue).toHaveLength(2);

    h.updateImpl.mockResolvedValue({ data: null, error: null });

    await act(async () => {
      await result.current.syncPendingChanges();
    });

    // Server hit exactly once for trip-42
    expect(h.updateImpl).toHaveBeenCalledTimes(1);
    const [payload, tripId] = h.updateImpl.mock.calls[0];
    expect(tripId).toBe("trip-42");
    // Last-write-wins on conflicting key
    expect(payload.name).toBe("B title");
    // Newer field present
    expect(payload.transport).toBe("bus");
    // Older non-conflicting field preserved
    expect(payload.notes).toBe("from A");

    // Conflict-resolved toast emitted in the active locale (BS)
    const calls = h.toastSpy.mock.calls.map((c) => c[0]);
    const conflictCall = calls.find((c) =>
      typeof c?.title === "string" && /Konflikt|Conflict/.test(c.title)
    );
    expect(conflictCall).toBeTruthy();
    expect(conflictCall.description).toContain("1");

    // Queue is drained
    expect(h.state.queue).toHaveLength(0);
  });

  it("non-overlapping trips are NOT merged together", async () => {
    const { result } = renderHook(() => useOfflineSync(), { wrapper });
    await act(async () => {
      await result.current.queueTripUpdate("trip-1", { name: "one" });
      await result.current.queueTripUpdate("trip-2", { name: "two" });
    });
    h.updateImpl.mockResolvedValue({ data: null, error: null });
    await act(async () => {
      await result.current.syncPendingChanges();
    });
    expect(h.updateImpl).toHaveBeenCalledTimes(2);
  });

  it("emits conflict toast in EN when locale is English", async () => {
    await i18n.changeLanguage("en");
    const { result } = renderHook(() => useOfflineSync(), { wrapper });
    await act(async () => {
      await result.current.queueTripUpdate("trip-9", { a: 1 });
      await result.current.queueTripUpdate("trip-9", { b: 2 });
    });
    h.updateImpl.mockResolvedValue({ data: null, error: null });
    await act(async () => {
      await result.current.syncPendingChanges();
    });
    const calls = h.toastSpy.mock.calls.map((c) => c[0]);
    const en = calls.find((c) => typeof c?.title === "string" && /Conflict/.test(c.title));
    expect(en).toBeTruthy();
    expect(en.description).toMatch(/conflict.*last write wins/i);
  });
});