import { Resource } from "@nucleum/datafn/resource.enum";
import { determineResourceType } from "@nucleum/datafn/resource.utils";
import { datafn, datafnRuntime } from "@nucleum/datafn/datafn.store";
import type { IRecordId } from "@nucleum/schema/legacy/data.type";
import { get } from "svelte/store";
import { assertDatafnMutationSucceeded } from "@nucleum/datafn/mutation.utils";

type DatafnRelationSource = {
  id: string;
  resource: Resource;
};

function isCollectionItemResource(resource: Resource) {
  return resource === Resource.node || resource === Resource.objective;
}

function isLinkableResource(resource: Resource) {
  return (
    resource === Resource.node ||
    resource === Resource.objective ||
    resource === Resource.task ||
    resource === Resource.event
  );
}

function assertRelationSelection(
  targetResource: Resource,
  sources: DatafnRelationSource[]
) {
  if (targetResource === Resource.collection) {
    if (sources.some((source) => !isCollectionItemResource(source.resource))) {
      throw new Error(
        "The selection contains records that cannot be collected"
      );
    }
    return;
  }
  if (
    !isLinkableResource(targetResource) ||
    sources.some((source) => !isLinkableResource(source.resource))
  ) {
    throw new Error("The selection contains records that cannot be linked");
  }
}

function resolveRelationMutation(input: {
  source: DatafnRelationSource;
  targetId: string;
  targetResource: Resource;
  context?: unknown;
}) {
  return {
    resource: input.source.resource.toString(),
    version: 1,
    operation: "relate",
    id: input.source.id,
    relations:
      input.targetResource === Resource.collection
        ? {
            collections: [
              {
                $ref: input.targetId,
                fromResource: input.source.resource.toString()
              }
            ]
          }
        : {
            links: [
              {
                $ref: input.targetId,
                fromResource: input.source.resource.toString(),
                toResource: input.targetResource.toString()
              }
            ]
          },
    context: input.context
  };
}

async function resolvePendingRelationSources(input: {
  sources: DatafnRelationSource[];
  targetId: string;
  relationName: string;
}) {
  const pendingSources: DatafnRelationSource[] = [];
  for (const source of input.sources) {
    const existing = await datafn
      .table(source.resource)
      .relation(input.relationName)
      .query(source.id, { select: ["id"] });
    if (!existing.data.some((record) => record.id === input.targetId)) {
      pendingSources.push(source);
    }
  }
  return pendingSources;
}

async function applyLocalRelationBatchWithRollback(
  mutations: ReturnType<typeof resolveRelationMutation>[]
) {
  const appliedMutations: ReturnType<typeof resolveRelationMutation>[] = [];
  try {
    for (const mutation of mutations) {
      const result = await datafn.mutate(mutation);
      assertDatafnMutationSucceeded(result);
      appliedMutations.push(mutation);
    }
  } catch (error) {
    const rollbackErrors: unknown[] = [];
    for (const mutation of appliedMutations.reverse()) {
      try {
        const result = await datafn.mutate({
          ...mutation,
          operation: "unrelate"
        });
        assertDatafnMutationSucceeded(result);
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError);
      }
    }
    if (rollbackErrors.length > 0) {
      throw new AggregateError(
        [error, ...rollbackErrors],
        "DataFn relation mutation rollback failed"
      );
    }
    throw error;
  }
}

export async function relateDatafnRecords(input: {
  sourceIds: IRecordId[];
  targetId: IRecordId;
  context?: unknown;
}) {
  if (input.sourceIds.length === 0) {
    throw new Error("Select at least one record to link");
  }
  const targetResource = determineResourceType(input.targetId);
  const sources = input.sourceIds.map((sourceId) => ({
    id: sourceId.toString(),
    resource: determineResourceType(sourceId)
  }));
  assertRelationSelection(targetResource, sources);

  const relationName =
    targetResource === Resource.collection ? "collections" : "links";
  const targetId = input.targetId.toString();
  const pendingSources = await resolvePendingRelationSources({
    sources,
    targetId,
    relationName
  });
  if (pendingSources.length > 0) {
    const mutations = pendingSources.map((source) =>
      resolveRelationMutation({
        source,
        targetId,
        targetResource,
        context: input.context
      })
    );
    const runtime = get(datafnRuntime);
    if (!runtime) throw new Error("DataFn runtime is not initialized");
    if (runtime.mode === "local-only") {
      await applyLocalRelationBatchWithRollback(mutations);
    } else {
      const result = await datafn.transact({
        atomic: true,
        steps: mutations.map((mutation) => ({ mutation }))
      });
      assertDatafnMutationSucceeded(result);
    }
  }
  return pendingSources.length;
}

export async function addDatafnRecordToCollection(input: {
  sourceId: IRecordId;
  collectionId: IRecordId;
  context?: unknown;
}) {
  return relateDatafnRecords({
    sourceIds: [input.sourceId],
    targetId: input.collectionId,
    context: input.context
  });
}
