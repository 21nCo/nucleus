import { userPreferences } from "@nucleum/stores/preferences/user-preferences.store";
import { get } from "svelte/store";
import { NodeType } from "@nucleum/features/memory/node/node.type";
import { TacoActions } from "@nucleum/client/runtime/inference/worker.type";
import { tacoWorker } from "@nucleum/products/memotron/memotron.utils";
import { Embed, OperatingSystem } from "@nucleum/client/runtime/context.type";
import context from "@nucleum/stores/context.store";
import { deleteAllLocalModels } from "@nucleum/products/memotron/taco/taco.utils";
import { datafn } from "@nucleum/datafn/datafn.store";
import { Resource } from "@nucleum/datafn/resource.enum";

const dev_isEnableSemanticSearch = false;
const vectorNodeTypes = [
  NodeType.NODULAR_MARKDOWN,
  NodeType.HEADING1,
  NodeType.HEADING2,
  NodeType.HEADING3,
  NodeType.HEADING4,
  NodeType.HEADING5
];

export async function initializeTaco() {
  try {
    const userPref = get(userPreferences);
    const ctx = get(context);
    if (ctx.os === OperatingSystem.IOS) {
      await deleteAllLocalModels();
      return;
    }
    if (dev_isEnableSemanticSearch && userPref.localAI.semanticSearch) {
      tacoWorker.postMessage({
        action: TacoActions.INITIALIZE_FEATURE_EXTRACTOR
      });
      tacoWorker.onmessage = (e) => {
        if (e.data.status == "ready") {
          console.log("semantic model initialized");
          runVectorGeneration();
        }
      };
    }
    if (userPref.localAI.audioTranscription) {
      tacoWorker.postMessage({
        action: TacoActions.INITIALIZE_TRANSCRIBER
      });
    }
  } catch (error) {
    console.error("initializeTaco", error);
  }
}

export async function runVectorGeneration(isRegenerateForAll: boolean = false) {
  try {
    const userPref = get(userPreferences);
    if (
      !dev_isEnableSemanticSearch ||
      !userPref.localAI.semanticSearch ||
      get(context).embed === Embed.HANDSET ||
      userPref.localAI.vectorGenerationInProgress === true
    )
      return;

    let nodes;
    if (isRegenerateForAll) {
      const nodesResult = (await datafn.node.query({
        filters: {
          contentType: { $in: vectorNodeTypes }
        }
      } as any)) as { data?: any[] };
      nodes = nodesResult.data ?? [];
      const vectors = await datafn.vector.query({ select: ["id"] });
      const vectorIds = vectors.data?.map((vector: any) => vector.id) ?? [];
      if (vectorIds.length > 0) {
        await datafn.vector.mutate(
          vectorIds.map((id: string) => ({
            operation: "delete",
            id
          }))
        );
      }
    } else {
      const vectorsResult = await datafn.vector.query({
        select: ["resourceId"],
        filters: {
          resource: Resource.node
        }
      } as any);
      const vectorizedNodeIds = new Set(
        vectorsResult.data
          ?.map((vector: any) => vector.resourceId)
          .filter(Boolean) ?? []
      );
      const nodesResult = (await datafn.node.query({
        filters: {
          contentType: { $in: vectorNodeTypes }
        }
      } as any)) as { data?: any[] };
      nodes = (nodesResult.data ?? []).filter(
        (node: any) => !vectorizedNodeIds.has(node.id?.toString())
      );
    }

    console.log("nodes without vector: ", nodes.length);
    if (nodes.length === 0) return;
    userPreferences.modify({
      localAI: {
        ...get(userPreferences).localAI,
        vectorGenerationInProgress: true
      }
    });
    const semanticSearchWorker = new Worker(
      new URL(
        "$lib/client/products/memotron/taco/taco.worker.ts",
        import.meta.url
      ),
      { type: "module" }
    );
    semanticSearchWorker.postMessage({
      action: TacoActions.GEN_EMBEDDINGS_AND_RETURN_PROCESSED_DATA,
      params: { nodes: nodes }
    });
    semanticSearchWorker.onmessage = async (e) => {
      if (e.data.params) {
        const { vectorRecords } = e.data.params;
        await datafn.vector.mutate(
          vectorRecords.map((record: any) => ({
            operation: "insert",
            id: record.id,
            record
          }))
        );
      }
      semanticSearchWorker.terminate();
    };
  } catch (error) {
    console.error("verifyVectorGenerationTransactionNUpdate", error);
  } finally {
    userPreferences.modify({
      localAI: {
        ...get(userPreferences).localAI,
        vectorGenerationInProgress: false
      }
    });
  }
}
