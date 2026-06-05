import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import React from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n";
import bs from "@/i18n/locales/bs";
import en from "@/i18n/locales/en";

const toastSpy = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastSpy }),
  toast: toastSpy,
}));

let queue: any[] = [];
const insertImpl = vi.fn();
vi.mock("@/lib/offlineStorage", () => ({
  initOfflineDB: vi.fn().mockResolvedValue({}),
  getSyncQueue: vi.fn(async () => queue.slice()),
  removeFromSyncQueue: vi.fn(async (id: string) => {
    queue = queue.filter((q) => q.id !== id);
  }),
  updateSyncQueueItem: vi.fn(async (id: string, patch: any) => {
    queue = queue.map((q) => (q.id === id ? { ...q, ...patch } : q));
  }),
  addToSyncQueue: vi.fn(async (item: any) => {
    const id = crypto.randomUUID();
    queue.push({ id, timestamp: Date.now(), retries: 0, ...item });
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
      insert: () => ({
        select: () => ({ single: () => insertImpl() }),
      }),
      update: () => ({ eq: () => insertImpl() }),
    }),
  },
}));

import { useOfflineSync } from "@/hooks/useOfflineSync";

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(I18nextProvider, { i18n }, children);

function setOnline(value: boolean) {
  Object.defineProperty(navigator, "onLine", { value, configurable: true });
  window.dispatchEvent(new Event(value ? "online" : "offline"));
}

describe("useOfflineSync — brutal stress test", () => {
  beforeEach(() => {
    queue = [];
    toastSpy.mockClear();
    insertImpl.mockReset();
    setOnline(true);
  });
  afterEach(() => vi.clearAllMocks());

  it("queues writes while offline and flushes them when network returns", async () => {
    setOnline(false);
    const { result } = renderHook(() => useOfflineSync(), { wrapper });

    await act(async () => {
      await result.current.queueTripSave({ title: "Trip A" });
      await result.current.queueTripSave({ title: "Trip B" });
    });
    expect(queue).toHaveLength(2);

    insertImpl.mockResolvedValue({ data: { id: "id1" }, error: null });
    await act(async () => {
      setOnline(true);
    });
    await waitFor(() => expect(queue.length).toBe(0), { timeout: 2000 });
    expect(insertImpl).toHaveBeenCalled();
  });

  it("retries up to 3 times on intermittent failures, then drops the item", async () => {
    const { result } = renderHook(() => useOfflineSync(), { wrapper });
    await act(async () => {
      await result.current.queueTripSave({ title: "Flaky" });
    });
    insertImpl.mockResolvedValue({ data: null, error: new Error("boom") });

    for (let i = 0; i < 4; i++) {
      await act(async () => {
        await result.current.syncPendingChanges();
      });
    }
    expect(queue.length).toBe(0);
  });

  it("emits offline toast in the active language (BS ↔ EN)", async () => {
    await i18n.changeLanguage("bs");
    renderHook(() => useOfflineSync(), { wrapper });
    await act(async () => setOnline(false));
    expect(toastSpy).toHaveBeenCalledWith(
      expect.objectContaining({ title: bs.offlineSyncToast.offlineTitle })
    );

    toastSpy.mockClear();
    await i18n.changeLanguage("en");
    await act(async () => setOnline(true));
    await act(async () => setOnline(false));
    expect(toastSpy).toHaveBeenCalledWith(
      expect.objectContaining({ title: en.offlineSyncToast.offlineTitle })
    );
  });

  it("sync-done toast interpolates {{count}} in the active locale", async () => {
    const { result } = renderHook(() => useOfflineSync(), { wrapper });
    await act(async () => {
      await result.current.queueTripSave({ title: "T1" });
      await result.current.queueTripSave({ title: "T2" });
    });
    insertImpl.mockResolvedValue({ data: { id: "ok" }, error: null });

    await i18n.changeLanguage("bs");
    await act(async () => {
      await result.current.syncPendingChanges();
    });
    const call = toastSpy.mock.calls.find(
      (c) => c[0]?.title === bs.offlineSyncToast.syncDoneTitle
    );
    expect(call?.[0]?.description).toContain("2");
  });
});
