import {
  CollectionType,
  CollectionLayout,
  type ICollectionViewCapture,
  type ICollectionCapture
} from "@nucleum/features/collections/collection.type";
import JSZip from "jszip";
import { sanitizeAndResolve } from "@nucleum/features/memory/node/url.utils";
import { NodeType } from "@nucleum/schema/legacy/node-type.enum";
import { Resource } from "@nucleum/datafn/resource.enum";
import { generateResourceId } from "@nucleum/datafn/id.utils";
import { dispatchCustomEvent } from "@21n/utils/browser.utils";
import { GlobalEvent } from "@nucleum/stores/notifications/event.enum";
import { logger } from "@nucleum/client/runtime/logging/logger";
import { performApiCall } from "@21n/utils/network.utils";
import { UserDataMode } from "@nucleum/client/runtime/account/account.type";
import account from "@nucleum/stores/account.store";
import { parse } from "@21n/shared-utils/json.utils";
import { datafn } from "@nucleum/datafn/datafn.store";
import type { IRecordId } from "@nucleum/schema/legacy/data.type";

function isYoutubeUrl(url: string) {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return hostname === "youtube.com" || hostname.endsWith(".youtube.com");
  } catch {
    return false;
  }
}

export class PocketImporter {
  private processedUrls: Map<string, string> = new Map();
  private collectionItemsMap: Map<string, string[]> = new Map();
  private tagCollectionMap: Map<string, string> = new Map();
  private itemsInPocketCollections: any[] = [];
  constructor(
    private readonly fieldMappings: any,
    private readonly importId: string
  ) {}

  async run(file: File) {
    try {
      dispatchCustomEvent(GlobalEvent.APP_LOADING_STATUS, {
        message: "Importing data from Pocket...",
        subMessage: "",
        percentage: 0.1
      });
      let totalCreated = 0;
      let collectionsCreated = 0;
      const extractedData = await this.processZipFile(file);
      const { csvFiles, collectionFiles, annotationFiles } = extractedData;
      const totalRecords =
        csvFiles.reduce((sum, csvFile) => sum + csvFile.data.length, 0) +
        collectionFiles.reduce(
          (sum, collectionFile) =>
            sum + (collectionFile.data.items?.length || 0),
          0
        ) +
        annotationFiles.reduce(
          (sum, annotationFile) =>
            sum +
            annotationFile.data.reduce(
              (annotationSum, annotation) =>
                annotationSum + (annotation.highlights?.length || 0),
              0
            ),
          0
        );

      if (this.fieldMappings.collections !== "ignore") {
        const collectionCount =
          await this.createCollectionsFromFiles(collectionFiles);
        totalCreated += collectionCount;
        collectionsCreated += collectionFiles.length;
      }
      this.updateProgress(0.25);
      const csvCount = await this.createNodesFromCsvFiles(csvFiles);
      totalCreated += csvCount;
      this.updateProgress(0.75);
      if (this.itemsInPocketCollections.length > 0) {
        await this.createNodes(this.itemsInPocketCollections);
      }
      await this.addLinks();
      this.updateProgress(0.85);
      const annotationCount =
        await this.createAnnotationsFromFiles(annotationFiles);
      this.updateProgress(0.95);
      totalCreated += annotationCount;
      if (this.fieldMappings.tags !== "ignore") {
        const collectionType =
          this.fieldMappings.tags === "typed_collections"
            ? CollectionType.TYPED
            : CollectionType.UNTYPED;
        await this.createCollections(
          Array.from(this.tagCollectionMap.entries()).map(([tag, id]) => ({
            id,
            label: tag,
            type: collectionType
          }))
        );
        collectionsCreated += this.tagCollectionMap.size;
      }
      return { totalCreated, totalRecords, collectionsCreated };
    } catch (error) {
      logger.error({ at: "PocketImporter.run", error });
    } finally {
      setTimeout(() => {
        dispatchCustomEvent(GlobalEvent.APP_LOADING_STATUS, {
          message: "Import completed.",
          subMessage: "",
          isFinished: true
        });
      }, 500);
    }
  }

  private updateProgress(percentage: number) {
    dispatchCustomEvent(GlobalEvent.APP_LOADING_STATUS, {
      percentage
    });
  }

  private async processZipFile(file: File) {
    try {
      const zip = new JSZip();
      const zipContent = await zip.loadAsync(file);

      const csvFiles: { fileName: string; data: any[] }[] = [];
      const collectionFiles: { fileName: string; data: any }[] = [];
      const annotationFiles: { fileName: string; data: any[] }[] = [];

      // Process each file in the ZIP
      for (const [relativePath, zipEntry] of Object.entries(zipContent.files)) {
        if (zipEntry.dir) continue; // Skip directories

        const fileName = zipEntry.name.toLowerCase();
        const folderPath = relativePath.toLowerCase();

        // Process CSV files
        if (fileName.endsWith(".csv")) {
          const fileContent = await zipEntry.async("string");
          const records = this.parseCsv(fileContent);
          csvFiles.push({ fileName: zipEntry.name, data: records });
        }
        // Process JSON collection files
        else if (
          folderPath.includes("collections") &&
          fileName.endsWith(".json")
        ) {
          const fileContent = await zipEntry.async("string");
          try {
            const collectionData = parse(fileContent);
            // Only process non-empty collections
            if (collectionData.items && collectionData.items.length > 0) {
              collectionFiles.push({
                fileName: zipEntry.name,
                data: collectionData
              });
            }
          } catch (e) {
            console.warn(
              `Failed to parse collection file ${zipEntry.name}:`,
              e
            );
          }
        }
        // Process JSON annotation files
        else if (
          folderPath.includes("annotations") &&
          fileName.endsWith(".json")
        ) {
          const fileContent = await zipEntry.async("string");
          try {
            const annotationData = parse(fileContent);
            if (Array.isArray(annotationData) && annotationData.length > 0) {
              annotationFiles.push({
                fileName: zipEntry.name,
                data: annotationData
              });
            }
          } catch (e) {
            console.warn(
              `Failed to parse annotation file ${zipEntry.name}:`,
              e
            );
          }
        }
      }

      return { csvFiles, collectionFiles, annotationFiles };
    } catch (error) {
      console.error("Error processing ZIP file:", error);
      throw new Error(
        `Failed to process ZIP file: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  private parseCsv(csvText: string) {
    const lines = csvText.split("\n").filter((line) => line.trim());

    if (lines.length === 0) {
      return [];
    }

    const headers = this.parseCsvLine(lines[0]).map((h) => h.trim());

    if (headers.length === 0) {
      return [];
    }

    const urlIndex = headers.findIndex((h) => h.toLowerCase().includes("url"));
    const titleIndex = headers.findIndex(
      (h) =>
        h.toLowerCase().includes("title") || h.toLowerCase().includes("name")
    );
    const tagsIndex = headers.findIndex((h) =>
      h.toLowerCase().includes("tags")
    );
    const timeIndex = headers.findIndex(
      (h) =>
        h.toLowerCase().includes("time_added") ||
        h.toLowerCase().includes("date") ||
        h.toLowerCase().includes("created_at")
    );
    const statusIndex = headers.findIndex((h) =>
      h.toLowerCase().includes("status")
    );

    const records = [];

    for (let i = 1; i < lines.length; i++) {
      const columns = this.parseCsvLine(lines[i]);
      if (columns.length < 2) continue;

      const url = this.safeGetColumn(columns, urlIndex);
      const title = this.safeGetColumn(columns, titleIndex);
      const tags = this.safeGetColumn(columns, tagsIndex);
      const timestamp = this.safeGetColumn(columns, timeIndex);
      const status = this.safeGetColumn(columns, statusIndex);

      if (url && url.startsWith("http")) {
        records.push({
          url,
          title: title || url,
          tags: tags ? tags.split("|").map((t) => t.trim()) : [],
          timestamp: timestamp ? new Date(+timestamp * 1000) : new Date(),
          status: status ? status.toLowerCase() : "unread"
        });
      }
    }

    return records;
  }

  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i += 2;
        } else {
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
        i++;
      } else {
        current += char;
        i++;
      }
    }

    result.push(current.trim());
    return result.map((field) => field.replace(/^"(.*)"$/, "$1"));
  }

  private safeGetColumn(columns: string[], index: number): string {
    if (index === -1 || index >= columns.length) {
      return "";
    }
    return columns[index]?.trim() || "";
  }

  private async createNodes(nodes: any[]) {
    try {
      const accountStore = account.get();
      if (accountStore.dataMode === UserDataMode.CLOUD) {
        const response = await performApiCall("utils/n/run", "POST", {
          urls: nodes.map((node) => node.url),
          action: "get-multiple-webpage-metadata"
        });
        const responseJson = await response.json();
        if (Array.isArray(responseJson)) {
          for (const node of nodes) {
            const responseNode = responseJson.find(
              (responseNode) => responseNode.url === node.url
            );
            if (responseNode && !responseNode.error) {
              const desc =
                responseNode.description ?? responseNode.ogDescription;
              const title = responseNode.title ?? responseNode.ogTitle;
              node.body.description = desc ?? node.body.description;
              if (!isYoutubeUrl(node.url)) {
                node.label = title ?? node.label;
              }
              node.metadata = {
                ...(node.metadata ?? {}),
                ogTitle: responseNode.ogTitle,
                ogDescription: responseNode.ogDescription,
                ogImage: responseNode.ogImage,
                faviconLink: responseNode.faviconUrl,
                themeColor: responseNode.themeColor,
                language: responseNode.language ?? responseNode.ogLocale,
                author: responseNode.author,
                canonicalUrl: responseNode.canonicalUrl,
                title: responseNode.title,
                description: responseNode.description
              };
            }
          }
        }
      }
    } catch (error) {
      console.error("Error getting multiple webpage metadata:", error);
    }
    const records = nodes.map(({ collections, ...record }) =>
      Object.fromEntries(
        Object.entries(record).filter(([, value]) => value !== undefined)
      )
    );
    await datafn.node.mutate(
      records.map((record) => ({
        operation: "insert",
        id: record.id,
        record
      })) as any
    );
    const relationMutations = nodes.flatMap((node) => {
      const mutations: any[] = [];
      if (node.collections?.length) {
        mutations.push({
          operation: "relate",
          id: node.id,
          relations: {
            collections: node.collections.map((collectionId: string) => ({
              $ref: collectionId,
              fromResource: Resource.node
            }))
          }
        });
      }
      return mutations;
    });
    if (relationMutations.length > 0) {
      await datafn.node.mutate(relationMutations);
    }
    return records;
  }
  private async createCollections(collections: any[]) {
    let collectionsToCreate: Array<
      ICollectionCapture & { id: IRecordId; views: IRecordId[] }
    > = [];
    let views: ICollectionViewCapture[] = [];
    for (const collection of collections) {
      const viewId = generateResourceId(Resource.view);
      views.push({
        id: viewId,
        layout: CollectionLayout.BOARD,
        label: "Default",
        importId: this.importId
      });
      collectionsToCreate.push({
        ...collection,
        resource: Resource.node,
        views: [viewId],
        importId: this.importId
      });
    }
    await datafn.view.mutate(
      views.map((record) => ({
        operation: "insert",
        id: record.id,
        record: {
          layout: CollectionLayout.BOARD,
          tabBy: "none",
          groupBy: "none",
          subGroupBy: "none",
          ...record
        }
      }))
    );
    await datafn.collection.mutate(
      collectionsToCreate.map(({ views: _views, ...record }) => ({
        operation: "insert",
        id: record.id,
        record
      }))
    );
    await datafn.collection.mutate(
      collectionsToCreate.map((record) => ({
        operation: "relate",
        id: record.id,
        relations: {
          views: record.views.map((viewId) => ({ $ref: viewId }))
        }
      })) as any
    );
    return collectionsToCreate;
  }

  private async addLinks() {
    for (const [collectionId, nodeIds] of this.collectionItemsMap) {
      console.log({ collectionId, nodeIds });
      await datafn.node.mutate(
        nodeIds.map((id) => ({
          operation: "relate",
          id,
          relations: {
            collections: [
              {
                $ref: collectionId,
                fromResource: Resource.node
              }
            ]
          }
        })) as any
      );
    }
  }

  private async createNodesFromCsvFiles(
    csvFiles: { fileName: string; data: any[] }[]
  ) {
    let totalCreated = 0;
    const totalRecords = csvFiles.reduce(
      (sum, csvFile) => sum + (csvFile.data?.length || 0),
      0
    );
    let processedRecords = 0;
    for (const csvFile of csvFiles) {
      if (Array.isArray(csvFile.data)) {
        const created = await this.createNodesFromRecords(
          csvFile.data,
          totalRecords,
          processedRecords
        );
        totalCreated += created;
        processedRecords += csvFile.data.length;
      }
    }
    return totalCreated;
  }

  private async createCollectionsFromFiles(
    collectionFiles: { fileName: string; data: any }[]
  ) {
    let totalNodesCreated = 0;

    for (const collectionFile of collectionFiles) {
      const collection = collectionFile.data;

      const collectionId = generateResourceId(Resource.collection).toString();

      const collectionType =
        this.fieldMappings.collections === "typed_collections"
          ? CollectionType.TYPED
          : CollectionType.UNTYPED;

      try {
        await this.createCollections([
          {
            id: collectionId,
            label: collection.title || collection.slug,
            description: collection.description || null,
            type: collectionType
          }
        ]);
      } catch (error) {
        console.error("Error creating collection:", error);
      }

      if (collection.items && Array.isArray(collection.items)) {
        const collectionNodes = collection.items.map((item: any) => {
          const sanitized = sanitizeAndResolve(item.url);
          const contentType =
            typeof sanitized === "object"
              ? sanitized.contentType
              : NodeType.WEB_PAGE;
          const url = typeof sanitized === "object" ? sanitized.url : sanitized;

          const nodeId = generateResourceId(Resource.node).toString();
          this.processedUrls.set(item.url, nodeId);

          return {
            id: nodeId,
            contentType,
            url,
            label: item.title,
            body: {
              hash: btoa(item.url),
              description: item.excerpt || ""
            },
            importId: this.importId,
            metadata: {
              noteOnImport: item.note,
              titleOnImport: item.title,
              excerptOnImport: item.excerpt
            },
            createdAt: new Date(collection.createdAt),
            notes: item.note || "",
            text: item.excerpt || "",
            collections: [collectionId]
          };
        });

        try {
          this.itemsInPocketCollections.push(...collectionNodes);
          totalNodesCreated += collectionNodes.length;
          if (
            collectionId &&
            collectionNodes &&
            Array.isArray(collectionNodes)
          ) {
            this.collectionItemsMap.set(
              collectionId,
              collectionNodes.map((node) => node.id.toString())
            );
          }
        } catch (error) {
          console.error("Error creating collection nodes:", error);
        }
      }
    }
    return totalNodesCreated;
  }

  private async createAnnotationsFromFiles(
    annotationFiles: { fileName: string; data: any[] }[]
  ) {
    let totalCreated = 0;

    for (const annotationFile of annotationFiles) {
      const annotations = annotationFile.data;

      for (const annotation of annotations) {
        if (annotation.highlights && Array.isArray(annotation.highlights)) {
          const parentId = this.processedUrls.get(annotation.url);
          let annotationNodes: any[] = [];
          for (const highlight of annotation.highlights) {
            try {
              const id = generateResourceId(Resource.node);
              const annotationNode = {
                id,
                contentType: NodeType.WEB_TEXT_BOOKMARK,
                url: `${annotation.url}#${id.toString()}`,
                label: `Highlight from ${annotation.title}`,
                body: {
                  text: highlight.quote
                },
                importId: this.importId,
                metadata: {
                  sourceUrlOnImport: annotation.url,
                  sourceTitleOnImport: annotation.title,
                  createdAtOnImport: highlight.created_at,
                  textOnImport: highlight.quote,
                  titleOnImport: highlight.title
                },
                createdAt: new Date(highlight.created_at * 1000),
                parent: parentId,
                text: highlight.quote
              };
              annotationNodes.push(annotationNode);
            } catch (error) {
              console.error("Error creating annotation node:", error);
            }
          }
          await this.createNodes(annotationNodes as any);
          totalCreated += annotationNodes.length;
        }
      }
    }

    return totalCreated;
  }

  private mapTagsToCollections(tags: string[]) {
    const collectionIds: string[] = [];
    for (const tag of tags) {
      const tagCollectionId = this.tagCollectionMap.get(tag.trim());
      if (tagCollectionId) {
        collectionIds.push(tagCollectionId);
      } else {
        const collectionId = generateResourceId(Resource.collection).toString();
        this.tagCollectionMap.set(tag.trim(), collectionId);
        collectionIds.push(collectionId);
      }
    }
    return collectionIds;
  }

  private async createNodesFromRecords(
    records: any[],
    totalRecords: number,
    processedRecords: number
  ) {
    const batchSize = 50;
    let totalCreated = 0;
    let currentProcessed = processedRecords;

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      let nodes = batch.map((record) => {
        const isExisting = this.processedUrls.has(record.url);
        const nodeId = isExisting
          ? this.processedUrls.get(record.url)
          : generateResourceId(Resource.node).toString();
        if (!nodeId) return null;
        let collectionIds: string[] = [];
        if (
          this.fieldMappings.tags !== "ignore" &&
          record.tags &&
          record.tags.length > 0
        ) {
          collectionIds = this.mapTagsToCollections(record.tags);
          for (const collectionId of collectionIds) {
            const existing = this.collectionItemsMap.get(collectionId);
            this.collectionItemsMap.set(collectionId, [
              ...(existing ?? []),
              nodeId
            ]);
          }
        }
        if (isExisting) {
          let existingNode = this.itemsInPocketCollections.find(
            (node) => node.url === record.url
          );
          if (existingNode) {
            existingNode.collections.push(...collectionIds);
            existingNode = {
              ...existingNode,
              metadata: {
                ...existingNode.metadata,
                tagsOnImport: record.tags,
                statusOnImport: record.status,
                timestampOnImport: record.timestamp
              }
            };
            this.itemsInPocketCollections = this.itemsInPocketCollections.map(
              (node) => (node.url === record.url ? existingNode : node)
            );
            return null;
          }
        }
        this.processedUrls.set(record.url, nodeId);
        const sanitized = sanitizeAndResolve(record.url);
        const contentType =
          typeof sanitized === "object"
            ? sanitized.contentType
            : NodeType.WEB_PAGE;
        const url = typeof sanitized === "object" ? sanitized.url : sanitized;

        return {
          id: nodeId,
          contentType,
          url,
          label: record.title,
          body: {
            hash: btoa(record.url)
          },
          importId: this.importId,
          metadata: {
            tagsOnImport: record.tags,
            statusOnImport: record.status,
            timestampOnImport: record.timestamp,
            titleOnImport: record.title
          },
          createdAt: record.timestamp,
          parent: undefined,
          text: "",
          collections: collectionIds
        };
      });

      try {
        nodes = nodes.filter(Boolean);
        await this.createNodes(nodes as any);
        totalCreated += nodes.length;
        currentProcessed += batch.length;

        const progress = 0.25 + (currentProcessed / totalRecords) * 0.5;
        this.updateProgress(progress);
      } catch (error) {
        console.error("Error creating batch of nodes:", error);
        throw error;
      }
    }

    return totalCreated;
  }
}
