import { attachTimeToDate, formatTime } from "@21n/utils/time.utils";
import { currentTime } from "@nucleum/stores/app.store";
import { userPreferences } from "@nucleum/stores/preferences/user-preferences.store";
import { get } from "svelte/store";
import { Resource } from "@nucleum/datafn/resource.enum";
import { toasts } from "@nucleum/stores/notification.store";
import {
  SessionType,
  type IManualSessionLogForm,
  type IManualLogStore,
  type ISessionCapture,
  type ISessionLogCapture
} from "@nucleum/features/focus/logs/log.type";
import { ObservableStore } from "@nucleum/stores/client.store";
import { sessionStore } from "@nucleum/features/focus/session.store";
import { BlockType } from "@nucleum/features/focus/session.type";
import { generateSimpleRandomId } from "@21n/shared-utils/crypto.utils";
import { generateResourceId } from "@nucleum/datafn/id.utils";
import { PointronAction } from "@nucleum/client/config/focus-action.enum";
import { resolveUnixTimestamp } from "@21n/shared-utils/time.utils";
import { deepCopy } from "@21n/shared-utils/obj.utils";
import { datafn } from "@nucleum/datafn/datafn.store";
import { createSessionItemRelationRefs } from "@nucleum/features/focus/logs/session-items.utils";

class ManualLogStore extends ObservableStore<IManualLogStore> {
  constructor() {
    super("manualLogStore");
  }

  reset() {
    this.set({
      manualLogs: []
    });
  }

  generateNewLog(objectiveId: string | undefined = undefined) {
    const userGlobalPreferences = get(userPreferences);
    let newLog: IManualSessionLogForm = {
      startDate: new Date(), //.toISOString().split("T")[0],
      endDate: new Date(), //.toISOString().split("T")[0],
      endTime: formatTime(userGlobalPreferences, get(currentTime), {
        format: "24"
      })!,
      startTime: formatTime(userGlobalPreferences, get(currentTime), {
        format: "24"
      })!,
      id: generateSimpleRandomId(),
      objectiveId: objectiveId ?? "",
      duration: 0
    };
    return newLog;
  }

  addNew(objectiveId?: string) {
    this.update((n) => {
      let newLog = this.generateNewLog(objectiveId);
      n.manualLogs.push(newLog);
      return n;
    });
  }

  remove(logId: string) {
    this.update((n) => {
      n.manualLogs = n.manualLogs.filter((x) => x.id != logId);
      return n;
    });
  }

  updateLog(log: IManualSessionLogForm) {
    this.update((n) => {
      let index = n.manualLogs.findIndex((x) => x.id == log.id);
      n.manualLogs[index] = log;
      return n;
    });
  }

  async save() {
    let n = this.get();
    let sessionEntries: ISessionCapture[] = [];
    let logEntries: ISessionLogCapture[] = [];
    n.manualLogs.forEach((entry) => {
      const duration = entry.duration;
      let start = attachTimeToDate(entry.startDate, entry.startTime);
      let end = attachTimeToDate(entry.endDate, entry.endTime);
      const sessionId = generateResourceId(Resource.session);
      const log: ISessionLogCapture = {
        startUnix: resolveUnixTimestamp(start),
        endUnix: resolveUnixTimestamp(end),
        id: generateResourceId(Resource.sessionLog),
        sessionId: sessionId,
        focus: duration,
        breakTime: 0,
        objectiveId: entry.objectiveId,
        manualEntryId: entry.id
      };

      const session: ISessionCapture = {
        startUnix: resolveUnixTimestamp(start),
        endUnix: resolveUnixTimestamp(end),
        elapsed: duration,
        id: sessionId,
        manualEntryId: entry.id,
        // logs: [{ ...log, start: start.getTime(), end: end.getTime() }],
        blocks: [
          {
            start: start.getTime(),
            type: BlockType.FOCUS,
            duration: duration,
            progress: 1,
            id: generateSimpleRandomId()
          },
          {
            id: generateSimpleRandomId(),
            start: end.getTime(),
            type: BlockType.NONE,
            progress: 0,
            duration: 0
          }
        ],
        notes: deepCopy(
          entry.notes ?? {
            blocks: []
          }
        ),
        type: SessionType.MANUAL_ENTRY,
        extended: 0
      };
      sessionEntries.push(session);
      logEntries.push(log);
    });
    await datafn.session.mutate(
      sessionEntries.flatMap((record) => {
        const log = logEntries.find((log) => log.sessionId === record.id);
        const relationItems = log?.objectiveId
          ? [
              {
                id: log.objectiveId,
                blocks: [
                  {
                    start: record.startUnix,
                    end: record.endUnix
                  }
                ]
              }
            ]
          : [];
        return [
          {
            operation: "insert",
            id: record.id,
            record,
            context: PointronAction.MANUAL_FOCUS_ENTRY
          },
          {
            operation: "relate",
            id: record.id,
            relations: {
              items: createSessionItemRelationRefs(relationItems)
            },
            context: PointronAction.MANUAL_FOCUS_ENTRY
          }
        ];
      })
    );
    await datafn.sessionLog.mutate(
      logEntries.map((record) => ({
        operation: "insert",
        id: record.id,
        record: {
          objectiveId: "",
          sessionId: "",
          taskId: "",
          ...record
        },
        context: PointronAction.MANUAL_FOCUS_ENTRY
      }))
    );
    sessionStore.addToRecentFocusItems(logEntries);
    this.reset();
    toasts.success("Manual log added successfully");
    return true;
  }
}

export const manualLogStore = new ManualLogStore();
