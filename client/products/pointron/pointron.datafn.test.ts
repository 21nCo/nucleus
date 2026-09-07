import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";
import { get } from "svelte/store";
import {
  destroyNucleumDatafn,
  initializeNucleumDatafn
} from "@nucleum/datafn/datafn.store";
import { Product } from "@21n/types/product.type";
import { UserDataMode } from "@21n/types/account.type";
import { appStore } from "@nucleum/stores/app.store";
import { Resource } from "@nucleum/datafn/resource.enum";
import { datafn } from "@nucleum/datafn/datafn.store";
import { focusAggregates } from "@nucleum/features/focus/analytics/analytics.store";
import { recentsStore } from "@nucleum/components/record/recent.store";
import { BlockType } from "@21n/types/pointron/session.type";
import { SessionType } from "@nucleum/features/focus/logs/log.type";
import { ObjectiveStatus, ObjectiveType } from "@nucleum/features/focus/goals/goal.type";
import {
  resolveExpandedSessionItems,
  resolveSessionFocusView
} from "@nucleum/features/focus/logs/session-items.utils";

describe("Pointron DataFn resources", () => {
  afterEach(async () => {
    await destroyNucleumDatafn();
  });

  async function boot(env: string) {
    appStore.set({
      ...get(appStore),
      product: Product.POINTRON
    });
    await initializeNucleumDatafn({
      product: Product.POINTRON,
      account: {
        dataMode: UserDataMode.LOCAL,
        userId: "pointron-resource-test"
      },
      dapId: "pointron-dap",
      env
    });
  }

  it("persists objectives, tasks, sessions, analytics, recents, and search through DataFn", async () => {
    const env = `test-${crypto.randomUUID()}`;
    await boot(env);

    const objective = {
      id: "objective:alpha-launch",
      label: "Alpha launch objective",
      type: ObjectiveType.INDEFINITE,
      status: ObjectiveStatus.NOT_STARTED,
      isPinnedForQuickFocus: false
    };
    await datafn.objective.mutate({
      operation: "insert",
      id: objective.id,
      record: objective
    });
    expect(objective).toMatchObject({
      label: "Alpha launch objective",
      type: ObjectiveType.INDEFINITE,
      status: ObjectiveStatus.NOT_STARTED
    });
    expect("parentId" in objective).toBe(false);

    const task = {
      id: "task:alpha-beta",
      label: "Beta launch task",
      objectiveId: objective!.id,
      dateUnix: 0,
      isChecked: false
    };
    await datafn.task.mutate({
      operation: "insert",
      id: task.id,
      record: task
    });
    expect(task.objectiveId).toBe(objective!.id);

    const rootObjectives = await datafn.objective.query({
      filters: {
        parentId: { $is_empty: true }
      }
    });
    expect(rootObjectives.data?.map((item) => item.id)).toContain(objective!.id);

    const expandedTasks = await datafn.task.query({
      select: ["*", "objective.*"],
      filters: {
        id: { $in: [task.id] }
      }
    });
    expect(expandedTasks.data?.[0].objective).toMatchObject({
      id: objective!.id,
      label: "Alpha launch objective"
    });

    const startUnix = new Date().getTime() - 30 * 60 * 1000;
    const endUnix = new Date().getTime();
    const sessionId = "session:alpha";
    const sessionLogId = "sessionLog:alpha";
    await datafn.session.mutate([
      {
        operation: "insert",
        id: sessionId,
        record: {
          id: sessionId,
          type: SessionType.MANUAL_ENTRY,
          startUnix,
          endUnix,
          elapsed: 1800,
          extended: 0,
          blocks: [
            {
              id: "block:focus",
              type: BlockType.FOCUS,
              start: startUnix,
              duration: 1800,
              progress: 1
            }
          ],
          notes: {
            blocks: []
          }
        }
      },
      {
        operation: "relate",
        id: sessionId,
        relations: {
          items: [
            {
              $ref: objective!.id,
              toResource: Resource.objective,
              sortOrder: 0,
              blocks: [
                {
                  start: startUnix,
                  end: endUnix
                }
              ]
            },
            {
              $ref: task.id,
              toResource: Resource.task,
              parentObjectiveId: objective!.id,
              sortOrder: 1,
              blocks: []
            }
          ]
        }
      }
    ]);
    await datafn.sessionLog.mutate({
      operation: "insert",
      id: sessionLogId,
      record: {
        id: sessionLogId,
        sessionId,
        startUnix,
        endUnix,
        objectiveId: objective!.id,
        taskId: task.id,
        focus: 1800,
        breakTime: 0
      }
    });

    expect(
      await focusAggregates.aggregateFocusForCurrentDay({ objectiveId: objective!.id })
    ).toBe(1800);

    const expandedSessionsResult = await datafn.session.query({
      select: ["*", "items.*#"],
      filters: {
        id: sessionId
      },
      limit: 1
    });
    expect(expandedSessionsResult.data?.[0]).toMatchObject({
      id: sessionId,
      elapsed: 1800
    });
    expect(expandedSessionsResult.data?.[0].items?.map((item) => item.id)).toEqual([
      objective!.id,
      task.id
    ]);
    const expandedObjectivesResult = await datafn.objective.query({
      filters: {
        id: objective!.id
      },
      limit: 1
    });
    expect(expandedObjectivesResult.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: objective!.id,
          label: "Alpha launch objective"
        })
      ])
    );

    const objectiveSearch = (await datafn.search({
      query: "alpha",
      resources: [Resource.objective],
      fields: ["label"],
      source: "local"
    })) as { results: Array<{ id: string }> };
    expect(objectiveSearch.results.map((item) => item.id)).toContain(objective!.id);

    const taskSearch = (await datafn.search({
      query: "beta",
      resources: [Resource.task],
      fields: ["label"],
      source: "local"
    })) as { results: Array<{ id: string }> };
    expect(taskSearch.results.map((item) => item.id)).toContain(task.id);

    await recentsStore.refresh([Resource.objective, Resource.task]);
    expect(
      recentsStore.resolve({ type: Resource.task }).map((item) => item.id)
    ).toContain(task.id);

    await destroyNucleumDatafn();
    await boot(env);

    const persistedObjective = await datafn.objective.query({
      filters: { id: objective!.id },
      limit: 1
    });
    expect(persistedObjective.data?.[0]).toMatchObject({
      label: "Alpha launch objective"
    });
    const persistedTask = await datafn.task.query({
      filters: { id: task.id },
      limit: 1
    });
    expect(persistedTask.data?.[0]).toMatchObject({
      label: "Beta launch task",
      objectiveId: objective!.id
    });
    const sessionResult = await datafn.session.query({
      select: ["*", "items.*#"],
      filters: {
        id: sessionId
      },
      limit: 1
    });
    const persistedSession = sessionResult.data?.[0];
    expect(persistedSession).toMatchObject({
      elapsed: 1800
    });
    const persistedExpandedItems = resolveExpandedSessionItems(
      persistedSession?.items
    );
    expect(persistedExpandedItems.map((item) => item.id)).toEqual([
      objective!.id,
      task.id
    ]);
    expect(persistedExpandedItems.map((item) => item.label)).toEqual([
      "Alpha launch objective",
      "Beta launch task"
    ]);
    expect(resolveSessionFocusView(persistedSession?.items)).toMatchObject({
      objectives: [expect.objectContaining({ id: objective!.id })],
      tasks: [expect.objectContaining({ id: task.id })],
      topLevelFocusItems: [
        expect.objectContaining({
          id: objective!.id,
          tasks: [task.id]
        })
      ]
    });
    const sessionLogResult = await datafn.sessionLog.query({
      filters: { id: sessionLogId },
      limit: 1
    });
    expect(sessionLogResult.data?.[0]).toMatchObject({
      objectiveId: objective!.id,
      taskId: task.id,
      focus: 1800
    });

    await datafn.session.mutate({
      operation: "delete",
      id: sessionId
    });

    const deletedSessionResult = await datafn.session.query({
      filters: { id: sessionId },
      limit: 1
    });
    expect(deletedSessionResult.data).toEqual([]);

    const deletedSessionLogResult = await datafn.sessionLog.query({
      filters: { id: sessionLogId },
      limit: 1
    });
    expect(deletedSessionLogResult.data).toEqual([]);

    const retainedObjectiveResult = await datafn.objective.query({
      select: ["*", "sessions.*#"],
      filters: { id: objective!.id },
      limit: 1
    });
    expect(retainedObjectiveResult.data?.[0]).toMatchObject({
      id: objective!.id,
      label: "Alpha launch objective"
    });
    expect(retainedObjectiveResult.data?.[0].sessions ?? []).toEqual([]);

    const retainedTaskResult = await datafn.task.query({
      select: ["*", "sessions.*#"],
      filters: { id: task.id },
      limit: 1
    });
    expect(retainedTaskResult.data?.[0]).toMatchObject({
      id: task.id,
      label: "Beta launch task",
      objectiveId: objective!.id
    });
    expect(retainedTaskResult.data?.[0].sessions ?? []).toEqual([]);
  });
});
