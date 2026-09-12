import { get } from "svelte/store";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@nucleum/client/runtime/embed/embed.utils", () => ({
  postMessageToParent: vi.fn()
}));

import {
  scheduledNotifications,
  type ScheduledNotification
} from "@21n/layout/notifications/scheduled-notifications.store";

describe("scheduledNotifications", () => {
  beforeEach(() => {
    scheduledNotifications.set([]);
  });

  it("preserves previously emitted snapshots when appending a notification", () => {
    const first: ScheduledNotification = {
      id: "first",
      inSeconds: 60,
      message: "First reminder",
      timestamp: 1
    };
    const second: ScheduledNotification = {
      id: "second",
      inSeconds: 120,
      message: "Second reminder",
      timestamp: 2
    };
    scheduledNotifications.set([first]);
    const priorSnapshot = get(scheduledNotifications);

    scheduledNotifications.push(second);

    expect(priorSnapshot).toEqual([first]);
    expect(get(scheduledNotifications)).toEqual([first, second]);
    expect(get(scheduledNotifications)).not.toBe(priorSnapshot);
  });
});
