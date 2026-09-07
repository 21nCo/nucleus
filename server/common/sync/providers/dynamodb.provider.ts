import { Agent } from "$lib/server/common/account/account.type";
import { Resource } from "@nucleum/datafn/resource.enum";
import {
  ISyncUpBody,
  ISyncDownBody,
  ICloneUpBody,
  ICloneDownBody,
  ICloneDownPaginateBody,
  IReconcileBody,
  ICloneDownPaginatev2Body
} from "$lib/shared/types/sync.type";
import {
  IMutation,
  IResourceSelectParams,
  PersistenceActionType
} from "$lib/client/types/data.type";
import { ResourceActionType } from "@nucleum/datafn/resource.type";
import { ISyncProvider, SyncProvider } from "./types";
import { resolveProviderRegionCode } from "$lib/deployment/deploy.utils";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  BatchWriteCommand,
  BatchGetCommand,
  QueryCommand,
  ScanCommand,
  GetCommand,
  DeleteCommand,
  UpdateCommand,
  PutCommand
} from "@aws-sdk/lib-dynamodb";
import { Select } from "@aws-sdk/client-dynamodb";
import { stringify, parse as parseJson } from "$lib/shared/utils/json.utils";

/**
 * DynamoDB Sync Provider using Single Table Design Pattern
 *
 *
 *
 * Access Patterns:
 * 1.  Clone down - resource records (Get all records of a resource type for a user/space): PK = "{spaceId}#{resource}"
 *
 * 2. Sync down - mutation records
 * 2a. Get mutations for given resource since timestamp: PK = "{spaceId}#mutation#{resource}", SK > "{timestamp}#"
 * 2b. Get specific resource record : PK = "{spaceId}#{resource}", SK = "{recordId}"
 *
 * 3. Paginate - resource records (Get records of a resource with offset and limit): PK = "{spaceId}#{resource}", Limit
 *
 * 4. Relay - mutation records (Get all mutations for a specific record): GSI1PK (spaceId) = "{spaceId}", GSI1SK = "mutation#{recordId}"
 *
 * 5. Delete user - everything (Get everything for a user/space): GSI1PK (spaceId) = "{spaceId}"
 *
 *
 */

interface DynamoDBConfig {
  tableName: string;
  tableArn: string;
  region: string;
}

interface DynamoDBItem {
  PK: string; // Partition Key: userId#{resource} or userId#mutation#{resource}
  SK: string; // Sort Key: {resourceId} or {timestamp}#{mutationId}
  userId: string;
  action?: ResourceActionType;
  timestamp?: number;
  dapId?: string;
  TTL?: number; // For automatic deletion of old records if applicable
  [key: string]: any; // Allow for spread resource attributes
}

export class DynamoDBSyncProvider implements ISyncProvider {
  name: SyncProvider = SyncProvider.DYNAMODB;
  private config: DynamoDBConfig;

  private getDynamoClient(agent: Agent): DynamoDBDocumentClient {
    let region = "us-east-1";
    const prefix = process.env.DYNAMODB_TABLE_PREFIX || "user";
    const dynamoAccount =
      process.env.DYNAMODB_ACCOUNT_ID || process.env.AWS_ACCOUNT_ID;

    if (agent?.region) {
      region = resolveProviderRegionCode(agent.region, "aws");
      // console.log("resolved region:", { region, agentRegion: agent.region });
    }

    const tableName = `${prefix}-${region}`;
    const tableArn = `arn:aws:dynamodb:${region}:${dynamoAccount}:table/${tableName}`;

    this.config = {
      tableName,
      tableArn: dynamoAccount ? tableArn : tableName,
      region
    };
    const client = new DynamoDBClient({ region });
    return DynamoDBDocumentClient.from(client);
  }

  private resolveUserId(agent: Agent): string {
    return agent.id?.includes("user:") ? agent.id : `user:${agent.id}`;
  }

  /**
   * Deletes all records for a user/space from DynamoDB.
   * Uses GSI1 with spaceId as partition key for efficient deletion.
   * Falls back to scanning with PK prefix filter if GSI1 approach fails.
   *
   * @param agent - Agent information containing database and region details
   * @returns Promise resolving to deletion result with success status and count
   */
  async deleteUser(agent: Agent): Promise<any> {
    try {
      const dynamoClient = this.getDynamoClient(agent);
      const spaceId = agent.db;

      try {
        const deletedCount = await this.deleteUserViaGSI1(
          spaceId,
          dynamoClient
        );
        console.log({ at: "DynamoDB deleteUser", deletedCount, spaceId });
        return { success: true, deletedCount, method: "GSI1" };
      } catch (gsi1Error) {
        console.warn("GSI1 deletion failed, trying PK prefix scan:", gsi1Error);
        const deletedCount = await this.deleteUserViaPKScan(
          spaceId,
          dynamoClient
        );
        return { success: true, deletedCount, method: "PKScan" };
      }
    } catch (e) {
      console.error({ at: "DynamoDB deleteUser - error", error: e });
      return {
        error: "Delete user failed",
        details: e instanceof Error ? e.message : "Unknown error"
      };
    }
  }

  /**
   * Gets a single record by resourceId from DynamoDB.
   * Maps properties to select only specific attributes if specified.
   *
   * @param agent - Agent information containing database and region details
   * @param resourceId - The ID of the record to retrieve
   * @param properties - Optional array of properties to select
   * @returns Promise resolving to the record data or null if not found
   */
  async select(
    agent: Agent,
    resourceId: any,
    properties?: string[]
  ): Promise<any> {
    try {
      const dynamoClient = this.getDynamoClient(agent);
      const spaceId = agent.db;

      // Parse resourceId to get resource and record ID
      // Expected format: "resource:recordId" or just "recordId" if resource is implied
      let resource: string;
      let recordId: string;

      if (typeof resourceId === "string" && resourceId.includes(":")) {
        [resource, recordId] = resourceId.split(":", 2);
      } else {
        // If no resource prefix, we need to infer it from context or throw error
        throw new Error(
          "Resource type must be specified in resourceId (format: resource:id)"
        );
      }

      const params: any = {
        TableName: this.config.tableArn,
        Key: {
          PK: `${spaceId}#${resource}`,
          SK: recordId
        }
      };

      // If specific properties are requested, use ProjectionExpression
      if (properties && properties.length > 0) {
        // Add required system properties to ensure we can process the response
        const systemProperties = ["PK", "SK", "spaceId", "userId"];
        const allProperties = Array.from(
          new Set([...properties, ...systemProperties])
        );

        params.ProjectionExpression = allProperties.join(", ");
      }

      const result = await dynamoClient.send(new GetCommand(params));

      if (result.Item) {
        const processedItem = this.getResourceData(result.Item);

        // If specific properties were requested, filter the response
        if (properties && properties.length > 0) {
          const filteredItem: any = { id: result.Item.SK };
          properties.forEach((prop) => {
            if (processedItem.hasOwnProperty(prop)) {
              filteredItem[prop] = processedItem[prop];
            }
          });
          return filteredItem;
        }

        return {
          ...processedItem,
          id: result.Item.SK
        };
      }

      return null;
    } catch (e) {
      console.error({ at: "DynamoDB select - error", error: e });
      return null;
    }
  }

  /**
   * Queries multiple records from a resource table in DynamoDB with optional filtering, pagination, and sorting.
   * Supports search functionality and various filter conditions.
   *
   * @param agent - Agent information containing database and region details
   * @param resource - The resource type to query
   * @param params - Optional parameters for filtering, pagination, sorting, etc.
   * @returns Promise resolving to array of matching records
   */
  async selectMany(
    agent: Agent,
    resource: Resource,
    params?: IResourceSelectParams
  ): Promise<any> {
    try {
      const dynamoClient = this.getDynamoClient(agent);
      const spaceId = agent.db;

      if (
        (resource === Resource.mutation || resource === Resource.accessLog) &&
        params?.filters &&
        "resourceId" in params.filters &&
        params.filters.resourceId
      ) {
        const recordId = params.filters.resourceId;

        const queryParams: any = {
          TableName: this.config.tableArn,
          KeyConditionExpression: "spaceId = :pk AND GSI1SK = :sk",
          IndexName: "GSI1",
          ExpressionAttributeValues: {
            ":pk": spaceId,
            ":sk":
              resource === Resource.mutation
                ? `mutation#${recordId}`
                : `accessLog#${recordId}`
          },
          ScanIndexForward: true // Default to ascending order
        };
        const result = await dynamoClient.send(new QueryCommand(queryParams));
        return result.Items || [];
      } else if (
        resource === Resource.mutation &&
        params?.filters &&
        "timestamp" in params.filters &&
        params.filters.timestamp
      ) {
        const queryParams: any = {
          TableName: this.config.tableArn,
          KeyConditionExpression: "PK = :pk",
          ExpressionAttributeValues: {
            ":pk": `${spaceId}#${resource}`
          },
          ScanIndexForward: true
        };
        const timestampFilter = params.filters.timestamp;
        if (timestampFilter) {
          queryParams.KeyConditionExpression =
            "PK = :pk AND SK BETWEEN :sk AND :sk2";
          queryParams.ExpressionAttributeValues = {
            ":pk": `${spaceId}#${resource}`,
            ":sk": `${timestampFilter.greaterThanOrEqual}`,
            ":sk2": `${timestampFilter.lessThanOrEqual}`
          };
        }
        const result = await dynamoClient.send(new QueryCommand(queryParams));
        let items = result.Items || [];
        if (items && items.length > 0) {
          if (params?.filters?.action) {
            items = items.filter((item) =>
              params.filters.action.includes(item.action)
            );
          }
          if (params?.filters?.resource) {
            items = items.filter((item) =>
              params.filters.resource.includes(item.resource)
            );
          }
        }
        return items;
      }

      const queryParams: any = {
        TableName: this.config.tableArn,
        KeyConditionExpression: "PK = :pk",
        ExpressionAttributeValues: {
          ":pk": `${spaceId}#${resource}`
        },
        ScanIndexForward: true // Default to ascending order
      };

      // Handle specific properties selection
      if (params?.properties && params.properties.length > 0) {
        const systemProperties = ["PK", "SK", "spaceId", "userId"];
        const allProperties = Array.from(
          new Set([...params.properties, ...systemProperties])
        );
        queryParams.ProjectionExpression = allProperties.join(", ");
      }

      // Handle omitted properties
      if (params?.omit && params.omit.length > 0) {
        // Note: DynamoDB doesn't have direct OMIT functionality like Surreal
        // We'll need to handle this in post-processing
      }

      // Handle filtering
      if (params?.filters || params?.search || params?.whereClause) {
        const filterConditions = this.buildFilterExpression(
          params,
          queryParams
        );
        if (filterConditions) {
          queryParams.FilterExpression = filterConditions;
        }
      }

      // Handle ordering
      if (params?.orderBy) {
        const orderByKeys = Object.keys(params.orderBy);
        if (orderByKeys.length > 0) {
          const firstKey = orderByKeys[0];
          const direction = params.orderBy[firstKey];

          // For DynamoDB, we can only sort by SK within a partition
          // For other attributes, we'll need to sort after retrieval
          if (firstKey === "id" || firstKey === "SK") {
            queryParams.ScanIndexForward = direction === "asc";
          }
          // Note: Complex sorting on other attributes will be handled post-query
        }
      }

      // Handle pagination
      if (params?.limit) {
        queryParams.Limit = params.limit;
      }

      // Handle offset (Note: DynamoDB doesn't support OFFSET directly)
      // For offset, we'll need to implement cursor-based pagination or fetch and skip
      if (params?.offset && params.offset > 0) {
        // For now, we'll fetch more records and slice them (not efficient for large offsets)
        queryParams.Limit = (params.limit || 100) + params.offset;
      }

      const result = await dynamoClient.send(new QueryCommand(queryParams));

      if (!result.Items || result.Items.length === 0) {
        return [];
      }

      let processedItems = result.Items.map((item) => {
        const resourceData = this.getResourceData(item);
        return {
          ...resourceData,
          id: item.SK
        };
      });

      // Handle offset by slicing results (inefficient for large offsets)
      if (params?.offset && params.offset > 0) {
        processedItems = processedItems.slice(params.offset);
        if (params?.limit) {
          processedItems = processedItems.slice(0, params.limit);
        }
      }

      // Handle complex sorting that couldn't be done at query level
      if (params?.orderBy) {
        const sortKeys = Object.keys(params.orderBy);
        if (
          sortKeys.length > 0 &&
          !(
            sortKeys.length === 1 &&
            (sortKeys[0] === "id" || sortKeys[0] === "SK")
          )
        ) {
          processedItems.sort((a, b) => {
            for (const key of sortKeys) {
              const direction = params.orderBy![key];
              const aVal = a[key];
              const bVal = b[key];

              if (aVal < bVal) return direction === "asc" ? -1 : 1;
              if (aVal > bVal) return direction === "asc" ? 1 : -1;
            }
            return 0;
          });
        }
      }

      // Handle property omission
      if (params?.omit && params.omit.length > 0) {
        processedItems = processedItems.map((item) => {
          const filteredItem = { ...item };
          params.omit!.forEach((prop) => {
            delete filteredItem[prop];
          });
          return filteredItem;
        });
      }

      // Handle property selection filtering (if not done via ProjectionExpression)
      if (params?.properties && params.properties.length > 0) {
        processedItems = processedItems.map((item) => {
          const filteredItem: any = { id: item.id };
          params.properties!.forEach((prop) => {
            if (item.hasOwnProperty(prop)) {
              filteredItem[prop] = item[prop];
            }
          });
          return filteredItem;
        });
      }

      return processedItems;
    } catch (e) {
      console.error({ at: "DynamoDB selectMany - error", error: e });
      return [];
    }
  }

  /**
   * Helper method to build DynamoDB FilterExpression from IResourceSelectParams
   * Handles various filter types including search, basic filters, and whereClause
   */
  private buildFilterExpression(
    params: IResourceSelectParams,
    queryParams: any
  ): string | null {
    const conditions: string[] = [];
    let attributeNameCounter = 0;
    let attributeValueCounter = 0;

    // Initialize ExpressionAttributeNames and ExpressionAttributeValues if not already present
    if (!queryParams.ExpressionAttributeNames) {
      queryParams.ExpressionAttributeNames = {};
    }
    if (!queryParams.ExpressionAttributeValues) {
      queryParams.ExpressionAttributeValues = {
        ":pk": queryParams.ExpressionAttributeValues[":pk"]
      };
    }

    // Handle search functionality
    if (
      params.search &&
      params.search.properties &&
      params.search.properties.length > 0
    ) {
      const searchConditions: string[] = [];
      const searchQuery = params.search.query.toLowerCase();

      params.search.properties.forEach((property) => {
        const attrName = `#searchAttr${attributeNameCounter++}`;
        const attrValue = `:searchVal${attributeValueCounter++}`;

        queryParams.ExpressionAttributeNames[attrName] = property;
        queryParams.ExpressionAttributeValues[attrValue] = searchQuery;

        // Use contains for text search (case-insensitive approximation)
        searchConditions.push(`contains(${attrName}, ${attrValue})`);
      });

      if (searchConditions.length > 0) {
        conditions.push(`(${searchConditions.join(" OR ")})`);
      }
    }

    // Handle basic filters
    if (
      params.filters &&
      typeof params.filters === "object" &&
      !("filters" in params.filters)
    ) {
      // Simple key-value filters
      Object.entries(params.filters).forEach(([key, value]) => {
        const attrName = `#filterAttr${attributeNameCounter++}`;
        queryParams.ExpressionAttributeNames[attrName] = key;

        if (Array.isArray(value)) {
          // IN condition
          const valueRefs = value.map((_, index) => {
            const attrValue = `:filterVal${attributeValueCounter++}`;
            queryParams.ExpressionAttributeValues[attrValue] = value[index];
            return attrValue;
          });
          conditions.push(`${attrName} IN (${valueRefs.join(", ")})`);
        } else if (
          typeof value === "object" &&
          value !== null &&
          value !== undefined
        ) {
          // Handle complex filter conditions
          this.handleComplexFilter(
            key,
            value,
            conditions,
            queryParams,
            attributeNameCounter,
            attributeValueCounter
          );
        } else if (typeof value === "boolean") {
          if (value === true) {
            const attrValue = `:filterVal${attributeValueCounter++}`;
            queryParams.ExpressionAttributeValues[attrValue] = true;
            conditions.push(`${attrName} = ${attrValue}`);
          } else {
            // For false, check if attribute is false, null, or doesn't exist
            const attrValue = `:filterVal${attributeValueCounter++}`;
            queryParams.ExpressionAttributeValues[attrValue] = false;
            conditions.push(
              `(${attrName} = ${attrValue} OR attribute_not_exists(${attrName}))`
            );
          }
        } else if (value !== undefined) {
          const attrValue = `:filterVal${attributeValueCounter++}`;
          queryParams.ExpressionAttributeValues[attrValue] = value;
          conditions.push(`${attrName} = ${attrValue}`);
        }
      });
    }

    // Handle whereClause (raw filter conditions)
    if (params.whereClause) {
      if (typeof params.whereClause === "string") {
        conditions.push(params.whereClause);
      } else if (Array.isArray(params.whereClause)) {
        conditions.push(...params.whereClause);
      }
    }

    return conditions.length > 0 ? conditions.join(" AND ") : null;
  }

  /**
   * Helper method to handle complex filter conditions (greater than, less than, etc.)
   */
  private handleComplexFilter(
    key: string,
    value: any,
    conditions: string[],
    queryParams: any,
    attributeNameCounter: number,
    attributeValueCounter: number
  ): void {
    const attrName = `#filterAttr${attributeNameCounter}`;
    queryParams.ExpressionAttributeNames[attrName] = key;

    if ("greaterThan" in value) {
      const attrValue = `:filterVal${attributeValueCounter++}`;
      queryParams.ExpressionAttributeValues[attrValue] = value.greaterThan;
      conditions.push(`${attrName} > ${attrValue}`);
    }
    if ("lessThan" in value) {
      const attrValue = `:filterVal${attributeValueCounter++}`;
      queryParams.ExpressionAttributeValues[attrValue] = value.lessThan;
      conditions.push(`${attrName} < ${attrValue}`);
    }
    if ("greaterThanOrEqual" in value) {
      const attrValue = `:filterVal${attributeValueCounter++}`;
      queryParams.ExpressionAttributeValues[attrValue] =
        value.greaterThanOrEqual;
      conditions.push(`${attrName} >= ${attrValue}`);
    }
    if ("lessThanOrEqual" in value) {
      const attrValue = `:filterVal${attributeValueCounter++}`;
      queryParams.ExpressionAttributeValues[attrValue] = value.lessThanOrEqual;
      conditions.push(`${attrName} <= ${attrValue}`);
    }
    if ("notIn" in value && Array.isArray(value.notIn)) {
      const valueRefs = value.notIn.map((val: any, index: number) => {
        const attrValue = `:filterVal${attributeValueCounter++}`;
        queryParams.ExpressionAttributeValues[attrValue] = val;
        return attrValue;
      });
      conditions.push(`NOT (${attrName} IN (${valueRefs.join(", ")}))`);
    }
    if ("contains" in value) {
      const attrValue = `:filterVal${attributeValueCounter++}`;
      queryParams.ExpressionAttributeValues[attrValue] = value.contains;
      conditions.push(`contains(${attrName}, ${attrValue})`);
    }
    if ("notEquals" in value) {
      const attrValue = `:filterVal${attributeValueCounter++}`;
      queryParams.ExpressionAttributeValues[attrValue] = value.notEquals;
      conditions.push(`${attrName} <> ${attrValue}`);
    }
  }

  /**
   * Syncs mutations from client to DynamoDB with proper timestamp ordering.
   *
   * Ensures data consistency by:
   * 1. Sorting all mutations by timestamp before processing
   * 2. Processing mutations for the same record sequentially to prevent race conditions
   * 3. Processing different records in parallel for optimal performance
   *
   * @param body - Contains mutations array, lastSyncDown timestamp, resources, and dapId
   * @param agent - Agent information containing database and region details
   * @returns Promise resolving to syncDown response or error
   */
  async syncUp(body: ISyncUpBody, agent: Agent): Promise<any> {
    try {
      const dynamoClient = this.getDynamoClient(agent);
      const { mutations, lastSyncDown, resources, dapId } = body;
      if (!mutations || !Array.isArray(mutations) || mutations.length < 1) {
        return { error: "No mutations to sync" };
      }

      const spaceId = agent.db;
      const userId = this.resolveUserId(agent);

      // Sort mutations by timestamp to ensure proper ordering
      const sortedMutations = mutations.sort(
        (a, b) => a.timestamp - b.timestamp
      );

      const batchSize = 25;
      for (let i = 0; i < sortedMutations.length; i += batchSize) {
        const batch = sortedMutations.slice(i, i + batchSize);

        // Group mutations by recordId to process them sequentially for the same record
        const mutationsByRecord = new Map<string, typeof batch>();

        for (const mutation of batch) {
          const recordId = Array.isArray(mutation.resourceId)
            ? mutation.resourceId[0]
            : mutation.resourceId;
          const recordKey = `${mutation.resource}#${recordId}`;

          if (!mutationsByRecord.has(recordKey)) {
            mutationsByRecord.set(recordKey, []);
          }
          mutationsByRecord.get(recordKey)!.push(mutation);
        }

        // Process mutations for each record sequentially, but different records in parallel
        const recordPromises = Array.from(mutationsByRecord.entries()).map(
          async ([recordKey, recordMutations]) => {
            const mutationResults = [];

            // Process mutations for this specific record sequentially
            for (const mutation of recordMutations) {
              const recordId = Array.isArray(mutation.resourceId)
                ? mutation.resourceId[0]
                : mutation.resourceId;

              const mutationItem: DynamoDBItem = {
                PK: `${spaceId}#mutation`,
                SK: `${mutation.timestamp}#${mutation.id}`,
                GSI1SK: this.resolveGSI1SK(Resource.mutation, {
                  resourceId: recordId
                }),
                spaceId,
                userId,
                dapId,
                ...mutation
              };

              const records = await this.applyMutationToResource(
                mutation,
                spaceId,
                userId,
                dynamoClient
              );

              mutationResults.push({
                mutationItem,
                records
              });
            }

            return mutationResults;
          }
        );

        // Wait for all records to be processed (records in parallel, mutations per record sequential)
        const allRecordResults = await Promise.all(recordPromises);
        const mutationResults = allRecordResults.flat();

        const allPutItems = [];
        const resourceItemMap = new Map<string, any>();
        for (const { mutationItem, records } of mutationResults) {
          allPutItems.push({ PutRequest: { Item: mutationItem } });

          if (records.length > 0) {
            records.forEach((item) => {
              const itemKey = `${item.PK}#${item.SK}`;
              const existingItem = resourceItemMap.get(itemKey);
              if (existingItem) {
                const mergedItem = {
                  ...existingItem.PutRequest.Item,
                  ...item,
                  PK: item.PK,
                  SK: item.SK,
                  spaceId: item.spaceId,
                  userId: item.userId,
                  modifiedAtUnix: Math.max(
                    existingItem.PutRequest.Item.modifiedAtUnix || 0,
                    item.modifiedAtUnix || 0
                  )
                };
                resourceItemMap.set(itemKey, {
                  PutRequest: { Item: mergedItem }
                });
              } else {
                resourceItemMap.set(itemKey, { PutRequest: { Item: item } });
              }
            });
          }
        }

        allPutItems.push(...Array.from(resourceItemMap.values()));

        const writeBatchSize = 25;
        console.time("syncUp-writeBatch");
        for (let j = 0; j < allPutItems.length; j += writeBatchSize) {
          const writeBatch = allPutItems.slice(j, j + writeBatchSize);

          if (writeBatch.length > 0) {
            const params = {
              RequestItems: {
                [this.config.tableArn]: writeBatch
              }
            };

            await dynamoClient.send(new BatchWriteCommand(params));
          }
        }
        console.timeEnd("syncUp-writeBatch");
      }
      const syncDownResponse = await this.syncDown(
        {
          lastSyncDown,
          resources,
          dapId
        },
        agent
      );

      return syncDownResponse;
    } catch (e) {
      console.error({ at: "DynamoDB syncUp - error", error: e });
      return { error: "Sync failed" };
    }
  }

  /**
   * notes:
   * + 1 is added to lastSyncDown to avoid fetching the same mutations with same timestamp of lastSyncDown again since lexicographical ordering is used
   * @param body
   * @param agent
   * @returns
   */
  async syncDown(body: ISyncDownBody, agent: Agent): Promise<any> {
    try {
      const dynamoClient = this.getDynamoClient(agent);
      const { lastSyncDown, resources, dapId, isReturnCount } = body;
      if (!resources || resources?.length < 1)
        return { error: "No resources found" };

      const spaceId = agent.db;
      const mutations: any[] = [];
      const records: any[] = [];
      const deleted: any[] = [];
      const resourcesSet = new Set(resources);
      let latestTimestamp = lastSyncDown;
      console.time("syncDown-mutations");
      const params = {
        TableName: this.config.tableArn,
        KeyConditionExpression: "PK = :pk AND SK > :lastSync",
        ExpressionAttributeValues: {
          ":pk": `${spaceId}#mutation`,
          ":lastSync": `${lastSyncDown + 1}#`
        },
        ScanIndexForward: false
      };

      // Process mutations page by page to avoid high memory usage
      let lastEvaluatedKey = undefined;
      const processedMutations: any[] = [];
      const uniqueRecordKeys = new Set<string>();
      const recordKeysToFetch: { key: { PK: string; SK: string } }[] = [];

      do {
        const queryParams: any = { ...params };
        if (lastEvaluatedKey) {
          queryParams.ExclusiveStartKey = lastEvaluatedKey;
        }

        const mutationsResult = await dynamoClient.send(
          new QueryCommand(queryParams)
        );

        if (mutationsResult.Items) {
          // Process this page immediately
          for (const item of mutationsResult.Items) {
            if (!resourcesSet.has(item.resource)) {
              continue;
            }
            if (item.dapId && item.dapId === dapId) {
              continue;
            }
            processedMutations.push(this.getResourceData(item));
            if (item.timestamp > latestTimestamp) {
              latestTimestamp = item.timestamp;
            }
            if (item.action !== ResourceActionType.DELETE) {
              const mutation = this.getResourceData(item);
              const recordIds = Array.isArray(mutation.resourceId)
                ? mutation.resourceId
                : [mutation.resourceId];
              for (const recordId of recordIds) {
                const pk = `${spaceId}#${item.resource}`;
                const sk = recordId;
                const uniqueKey = `${pk}#${sk}`;

                if (!uniqueRecordKeys.has(uniqueKey)) {
                  uniqueRecordKeys.add(uniqueKey);
                  recordKeysToFetch.push({
                    key: { PK: pk, SK: sk }
                  });
                }
              }
            } else {
              deleted.push(this.getResourceData(item));
            }
          }
        }

        lastEvaluatedKey = mutationsResult.LastEvaluatedKey;
      } while (lastEvaluatedKey);

      // Update mutations array with processed results
      mutations.push(...processedMutations);
      console.timeEnd("syncDown-mutations");

      console.time("syncDown-records");
      if (recordKeysToFetch.length > 0) {
        const batchedRecords = await this.batchGetItems(
          recordKeysToFetch.map((item) => item.key),
          dynamoClient
        );
        records.push(...batchedRecords);
      }
      console.timeEnd("syncDown-records");

      console.time("syncDown-counts");
      const counts =
        isReturnCount && isReturnCount !== "$NONE"
          ? await this.getResourceCounts(resources, spaceId, dynamoClient)
          : null;
      console.timeEnd("syncDown-counts");
      const response = {
        latestTimestamp:
          latestTimestamp > lastSyncDown
            ? { timestamp: latestTimestamp }
            : null,
        records,
        deleted,
        counts
      };

      const responseSize = Buffer.byteLength(JSON.stringify(response), "utf8");
      const maxResponseSize = 5 * 1024 * 1024;

      if (responseSize > maxResponseSize) {
        console.warn(
          `SyncDown response size (${responseSize} bytes) exceeds API Gateway limit (${maxResponseSize} bytes). Requesting re-clone.`
        );
        return { needsReclone: true };
      }

      return response;
    } catch (e) {
      console.error({ at: "DynamoDB syncDown - error", error: e });
      return { error: "Sync failed" };
    }
  }

  async cloneUp(body: ICloneUpBody, agent: Agent): Promise<any> {
    try {
      const dynamoClient = this.getDynamoClient(agent);
      const { resource, records } = body;
      const spaceId = agent.db;
      const userId = this.resolveUserId(agent);

      const batchSize = 25;
      const responses = [];
      const commonAttributes = {
        PK: `${spaceId}#${resource}`,
        spaceId,
        userId,
        GSI1SK: resource
      };

      console.time("cloneUp-batch");
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        const putRequests = batch.map((record) => {
          const item: DynamoDBItem = {
            ...commonAttributes,
            ...record,
            SK: record.id.toString(),
            GSI1SK: this.resolveGSI1SK(resource as Resource, record),
            modifiedAtUnix: record.modifiedAt
              ? new Date(record.modifiedAt).getTime()
              : Date.now()
          };

          return {
            PutRequest: { Item: item }
          };
        });

        const params = {
          RequestItems: {
            [this.config.tableArn]: putRequests
          }
        };

        const result = await dynamoClient.send(new BatchWriteCommand(params));
        responses.push(result);
      }
      console.timeEnd("cloneUp-batch");
      return responses;
    } catch (e) {
      console.error({ at: "DynamoDB cloneUp - error", error: e });
      return { error: "Sync failed" };
    }
  }

  async cloneDown(body: ICloneDownBody, agent: Agent): Promise<any> {
    try {
      const dynamoClient = this.getDynamoClient(agent);
      const { resources, isExtension } = body;
      if (resources?.length < 1) return { error: "No resources found" };

      const limit = body.limit || 500;
      const spaceId = agent.db;
      console.time("cloneDown-query");
      const queryPromises = resources.map(async (resource) => {
        try {
          const params = {
            TableName: this.config.tableArn,
            KeyConditionExpression: "PK = :pk",
            ExpressionAttributeValues: {
              ":pk": `${spaceId}#${resource}`
            },
            Limit: limit,
            ScanIndexForward: true
          };

          const result = await dynamoClient.send(new QueryCommand(params));
          return { resource, result, error: null };
        } catch (error) {
          console.error(`Error querying resource ${resource}:`, error);
          return { resource, result: null, error: error.message };
        }
      });

      const queryResults = await Promise.all(queryPromises);
      console.timeEnd("cloneDown-query");
      const results = [];
      for (const { resource, result, error } of queryResults) {
        if (error) {
          console.error(`Failed to fetch resource ${resource}: ${error}`);
          results.push([]);
          continue;
        }

        if (result?.Items) {
          const resourceData = this.mapResourceData(result.Items);
          results.push(resourceData);
        } else {
          results.push([]);
        }
      }
      return results;
    } catch (e) {
      console.error({ at: "DynamoDB cloneDown - error", error: e });
      return { error: "Sync failed" };
    }
  }

  async cloneDownv2(body: ICloneDownBody, agent: Agent): Promise<any> {
    try {
      const dynamoClient = this.getDynamoClient(agent);
      const { resources, isExtension } = body;
      if (resources?.length < 1) return { error: "No resources found" };

      const spaceId = agent.db;
      const limit = body.limit || 300;

      console.time("cloneDownv2-query");

      // Simple parallel queries like original cloneDown
      const queryPromises = resources.map(async (resource) => {
        try {
          const params = {
            TableName: this.config.tableArn,
            KeyConditionExpression: "PK = :pk",
            ExpressionAttributeValues: {
              ":pk": `${spaceId}#${resource}`
            },
            Limit: limit,
            ScanIndexForward: true
          };

          const result = await dynamoClient.send(new QueryCommand(params));
          return {
            resource,
            result,
            error: null,
            nextCursor: result.LastEvaluatedKey
              ? stringify(result.LastEvaluatedKey)
              : null,
            hasMore: !!result.LastEvaluatedKey
          };
        } catch (error) {
          console.error(`Error querying resource ${resource}:`, error);
          return {
            resource,
            result: null,
            error: error.message,
            nextCursor: null,
            hasMore: false
          };
        }
      });

      const queryResults = await Promise.all(queryPromises);
      console.timeEnd("cloneDownv2-query");

      const results = [];
      const cursors: Record<string, string | null> = {};
      let hasMoreData = false;

      for (const {
        resource,
        result,
        error,
        nextCursor,
        hasMore
      } of queryResults) {
        if (error) {
          console.error(`Failed to fetch resource ${resource}: ${error}`);
          results.push([]);
          cursors[resource] = null;
          continue;
        }

        if (result?.Items) {
          const resourceData = this.mapResourceData(result.Items);
          results.push(resourceData);
        } else {
          results.push([]);
        }

        cursors[resource] = nextCursor;
        if (hasMore) {
          hasMoreData = true;
        }
      }

      return {
        data: results,
        cursors: hasMoreData ? cursors : null,
        hasMore: hasMoreData
      };
    } catch (e) {
      console.error({ at: "DynamoDB cloneDownv2 - error", error: e });
      return { error: "Sync failed" };
    }
  }

  async paginate(body: ICloneDownPaginateBody, agent: Agent): Promise<any> {
    try {
      console.time("paginate");
      const dynamoClient = this.getDynamoClient(agent);
      const { resource, offset, limit, isExtension } = body;
      const spaceId = agent.db;

      // Check if a cursor is provided in the body (for cursor-based pagination)
      let cursor = (body as any).cursor;

      // If no cursor provided, try to retrieve saved cursor from DynamoDB
      if (!cursor) {
        cursor = await this.retrieveSavedCursor(
          spaceId,
          resource,
          dynamoClient
        );
      }

      const params: any = {
        TableName: this.config.tableArn,
        KeyConditionExpression: "PK = :pk",
        ExpressionAttributeValues: {
          ":pk": `${spaceId}#${resource}`
        },
        Limit: limit,
        ScanIndexForward: true
      };

      // If cursor is provided, use it for efficient pagination
      if (cursor) {
        try {
          params.ExclusiveStartKey = parseJson(cursor);
        } catch (e) {
          console.error("Invalid cursor provided:", cursor);
          return { error: "Invalid cursor" };
        }
      } else if (offset && offset > 0) {
        // Fallback to offset-based pagination but optimized
        if (offset <= 1000) {
          // For reasonable offsets, use a single large query
          params.Limit = offset + limit;
          const result = await dynamoClient.send(new QueryCommand(params));
          console.timeEnd("paginate");
          if (result.Items && result.Items.length > offset) {
            const items = result.Items.slice(offset, offset + limit);
            const resourceData = this.mapResourceData(items);

            // Include next cursor for efficient pagination
            const nextCursor =
              result.Items.length >= offset + limit
                ? stringify({
                    PK: result.Items[offset + limit - 1].PK,
                    SK: result.Items[offset + limit - 1].SK
                  })
                : null;

            const hasMore = result.Items.length >= offset + limit;

            // Save or delete cursor position in DynamoDB
            await this.managePaginationCursor(
              spaceId,
              resource,
              nextCursor,
              hasMore,
              dynamoClient
            );

            return {
              data: resourceData,
              nextCursor,
              hasMore
            };
          }
        } else {
          // For very large offsets, use optimized chunking
          return await this.paginateWithOptimizedChunking(
            dynamoClient,
            spaceId,
            resource,
            offset,
            limit,
            isExtension
          );
        }
      }

      // Direct query without offset
      const result = await dynamoClient.send(new QueryCommand(params));

      if (result.Items) {
        const resourceData = this.mapResourceData(result.Items);

        // Include next cursor for efficient pagination
        const nextCursor = result.LastEvaluatedKey
          ? stringify(result.LastEvaluatedKey)
          : null;

        const hasMore = !!result.LastEvaluatedKey;

        // Save or delete cursor position in DynamoDB
        await this.managePaginationCursor(
          spaceId,
          resource,
          nextCursor,
          hasMore,
          dynamoClient
        );
        console.timeEnd("paginate");

        return {
          data: resourceData,
          nextCursor,
          hasMore
        };
      }

      // No items found, delete any existing cursor
      await this.managePaginationCursor(
        spaceId,
        resource,
        null,
        false,
        dynamoClient
      );

      return { data: [], nextCursor: null, hasMore: false };
    } catch (e) {
      console.error({ at: "DynamoDB cloneDownPaginate - error", error: e });
      return { error: "Sync failed" };
    }
  }

  async paginatev2(body: ICloneDownPaginatev2Body, agent: Agent): Promise<any> {
    try {
      console.time("paginatev2");
      const dynamoClient = this.getDynamoClient(agent);
      const { resource, isExtension } = body;
      const cursor = (body as any).cursor;

      if (!cursor) {
        console.timeEnd("paginatev2");
        return { error: "Cursor is required for paginatev2" };
      }

      const spaceId = agent.db;

      const result = await this.queryResourceWithCursor(
        dynamoClient,
        spaceId,
        resource,
        cursor,
        isExtension
      );

      console.timeEnd("paginatev2");

      if (result.error) {
        return { error: result.error };
      }

      return {
        data: result.data,
        nextCursor: result.nextCursor,
        hasMore: result.hasMore
      };
    } catch (e) {
      console.error({ at: "DynamoDB paginatev2 - error", error: e });
      return { error: "Sync failed" };
    }
  }

  async reconcile(body: IReconcileBody, agent: Agent): Promise<any> {
    try {
      const { resources } = body;
      const spaceId = agent.db;

      for (const resource of resources) {
        switch (resource) {
          case Resource.node:
            await this.runReconciliationForNodeResource(agent);
            break;
          // Add other resource reconciliation logic as needed
        }
      }
      return { success: true };
    } catch (e) {
      console.error({ at: "DynamoDB reconcile - error", error: e });
      return { error: "Sync failed" };
    }
  }

  private async runReconciliationForNodeResource(agent: Agent) {
    try {
      const dynamoClient = this.getDynamoClient(agent);
      const spaceId = agent.db;

      // Query all nodes for this user
      const params = {
        TableName: this.config.tableArn,
        KeyConditionExpression: "PK = :pk",
        FilterExpression:
          "attribute_not_exists(contentType) OR contentType = :none",
        ExpressionAttributeValues: {
          ":pk": `${spaceId}#${Resource.node}`,
          ":none": null
        }
      };

      const result = await dynamoClient.send(new QueryCommand(params));

      if (result.Items && result.Items.length > 0) {
        // Delete bad nodes in batches
        const batchSize = 25;
        for (let i = 0; i < result.Items.length; i += batchSize) {
          const batch = result.Items.slice(i, i + batchSize);
          const deleteRequests = batch.map((item) => ({
            DeleteRequest: {
              Key: {
                PK: item.PK,
                SK: item.SK
              }
            }
          }));

          const deleteParams = {
            RequestItems: {
              [this.config.tableArn]: deleteRequests
            }
          };

          await dynamoClient.send(new BatchWriteCommand(deleteParams));
        }
      }
    } catch (e) {
      console.error({ at: "DynamoDB reconcile - node - error", error: e });
      return { error: "Sync failed" };
    }
  }

  private async applyMutationToResource(
    mutation: IMutation,
    spaceId: string,
    userId: string,
    dynamoClient: DynamoDBDocumentClient
  ): Promise<DynamoDBItem[]> {
    try {
      const { resource, resourceId, action, params } = mutation;
      const items: DynamoDBItem[] = [];
      const commonAttributes = {
        PK: `${spaceId}#${resource}`,
        spaceId,
        userId,
        modifiedAtUnix: mutation.timestamp,
        GSI1SK: resource
      };
      switch (action) {
        case ResourceActionType.CREATE:
        case ResourceActionType.EDIT:
          if (
            params.action === PersistenceActionType.INSERT ||
            params.action === PersistenceActionType.BULK_INSERT
          ) {
            const records = "records" in params ? params.records : [];
            for (const record of records) {
              const item: DynamoDBItem = {
                ...commonAttributes,
                ...record,
                SK: record.id.toString(),
                GSI1SK: this.resolveGSI1SK(resource as Resource, record)
              };
              items.push(item);
            }
          } else if (
            params.action === PersistenceActionType.REPLACE &&
            "record" in params
          ) {
            if (!resourceId) return [];
            const resourceIds = Array.isArray(resourceId)
              ? resourceId
              : [resourceId];

            for (const rId of resourceIds) {
              const item: DynamoDBItem = {
                ...commonAttributes,
                ...params.record,
                SK: rId.toString()
              };
              items.push(item);
            }
          } else if (
            params.action === PersistenceActionType.MERGE &&
            "record" in params
          ) {
            if (!resourceId) return [];
            const resourceIds = Array.isArray(resourceId)
              ? resourceId
              : [resourceId];

            for (const rId of resourceIds) {
              const mergeResult = await this.performMergeOperation(
                params.record,
                rId.toString(),
                commonAttributes.PK,
                commonAttributes,
                dynamoClient
              );
              if (mergeResult) {
                items.push(mergeResult);
              }
            }
          } else if (
            params.action === PersistenceActionType.BULK_MERGE &&
            "records" in params
          ) {
            const records = params.records;
            if (!records || records.length < 1) return [];

            const mergePromises = records
              .filter((record) => record.id)
              .map(async (record) => {
                const { id, ...mergeData } = record;
                return await this.performMergeOperation(
                  mergeData,
                  id.toString(),
                  commonAttributes.PK,
                  commonAttributes,
                  dynamoClient
                );
              });

            const mergeResults = await Promise.all(mergePromises);
            items.push(...mergeResults.filter((result) => result !== null));
          } else if (
            params.action === PersistenceActionType.BULK_MERGE &&
            "recordIds" in params &&
            "changes" in params
          ) {
            const recordIds = params.recordIds;
            if (!recordIds || recordIds.length < 1) return [];

            const mergePromises = recordIds
              .filter((recordId) => recordId)
              .map(async (recordId) => {
                return await this.performMergeOperation(
                  params.changes,
                  recordId.toString(),
                  commonAttributes.PK,
                  commonAttributes,
                  dynamoClient
                );
              });

            const mergeResults = await Promise.all(mergePromises);
            items.push(...mergeResults.filter((result) => result !== null));
          }
          break;

        case ResourceActionType.DELETE:
          if (params.action === PersistenceActionType.DELETE) {
            if (!resourceId) return [];
            const resourceIds = Array.isArray(resourceId)
              ? resourceId
              : [resourceId];

            for (const rId of resourceIds) {
              const deleteParams = {
                TableName: this.config.tableArn,
                Key: {
                  PK: `${spaceId}#${resource}`,
                  SK: rId.toString()
                }
              };
              await dynamoClient.send(new DeleteCommand(deleteParams));
            }
          } else if (params.action === PersistenceActionType.BULK_DELETE) {
            const recordIds = "recordIds" in params ? params.recordIds : [];
            if (!recordIds || recordIds.length < 1) return [];
            const batchSize = 25;
            for (let i = 0; i < recordIds.length; i += batchSize) {
              const batch = recordIds.slice(i, i + batchSize);
              const deleteRequests = batch.map((id) => ({
                DeleteRequest: {
                  Key: {
                    PK: `${spaceId}#${resource}`,
                    SK: id.toString()
                  }
                }
              }));

              const deleteParams = {
                RequestItems: {
                  [this.config.tableArn]: deleteRequests
                }
              };

              await dynamoClient.send(new BatchWriteCommand(deleteParams));
            }
          }
          break;
      }

      // Handle CUSTOM mutations at the params level
      if (params.action === PersistenceActionType.CUSTOM) {
        // Handle CUSTOM operation - for now, log that it's not implemented
        // In the future, this could execute custom DynamoDB operations
        console.warn(
          "CUSTOM mutations are not yet implemented for DynamoDB provider"
        );
      }

      return items;
    } catch (e) {
      console.error({ at: "applyMutationToResource - error", error: e });
      return [];
    }
  }

  private resolveGSI1SK(resource: Resource, record: any) {
    switch (resource) {
      case Resource.mutation:
        return `mutation#${record.resourceId}`;
      case Resource.accessLog:
        return `accessLog#${record.resourceId}`;
      case Resource.node:
        return `node#${record.contentType ?? ""}`;
      case Resource.goal:
        return `goal#${record.type ?? ""}`;
      case Resource.task:
        return `task#${record.type ?? ""}`;
      case Resource.collection:
        return `collection#${record.type}#${record.resource}`;
      case Resource.file:
        return `fileType#${record.type ?? ""}`;
      case Resource.link:
        return `link#${record.out ?? ""}`;
      case Resource.property:
        return `property#${record.type ?? ""}`;
      default:
        return resource;
    }
  }

  /**
   * Helper method to perform merge operations, abstracting common logic between MERGE and BULK_MERGE
   */
  private async performMergeOperation(
    mergeData: Record<string, any>,
    sortKey: string,
    partitionKey: string,
    fallbackAttributes: Record<string, any>,
    dynamoClient: DynamoDBDocumentClient
  ): Promise<DynamoDBItem | null> {
    try {
      const setExpressions: string[] = [];
      const removeExpressions: string[] = [];
      const expressionAttributeNames: Record<string, string> = {};
      const expressionAttributeValues: Record<string, any> = {};
      let attrIndex = 0;
      // console.log({ mergeData, sortKey, partitionKey, fallbackAttributes });
      // Build update expressions - separate SET and REMOVE operations
      Object.keys(mergeData).forEach((key) => {
        const value = mergeData[key];
        const attrName = `#attr${attrIndex}`;
        expressionAttributeNames[attrName] = key;
        if (value === undefined || value === null) {
          removeExpressions.push(attrName);
        } else {
          const attrValue = `:val${attrIndex}`;
          expressionAttributeValues[attrValue] = value;
          setExpressions.push(`${attrName} = ${attrValue}`);
        }
        attrIndex++;
      });

      const updateExpressionParts: string[] = [];
      if (setExpressions.length > 0) {
        updateExpressionParts.push(`SET ${setExpressions.join(", ")}`);
      }
      if (removeExpressions.length > 0) {
        updateExpressionParts.push(`REMOVE ${removeExpressions.join(", ")}`);
      }

      if (updateExpressionParts.length === 0) {
        return null;
      }

      const updateParams = {
        TableName: this.config.tableArn,
        Key: {
          PK: partitionKey,
          SK: sortKey
        },
        UpdateExpression: updateExpressionParts.join(" "),
        ExpressionAttributeNames: expressionAttributeNames,
        ConditionExpression: "attribute_exists(PK)"
      };

      if (Object.keys(expressionAttributeValues).length > 0) {
        updateParams.ExpressionAttributeValues = expressionAttributeValues;
      }

      try {
        await dynamoClient.send(new UpdateCommand(updateParams));
        return null; // No item to add to batch when update succeeds
      } catch (error: any) {
        if (error.name === "ConditionalCheckFailedException") {
          // Item doesn't exist, create it with the merge data
          const item: DynamoDBItem = {
            PK: partitionKey,
            SK: sortKey,
            userId: fallbackAttributes.userId || "",
            ...fallbackAttributes,
            ...mergeData
          };
          return item;
        } else {
          throw error;
        }
      }
    } catch (e) {
      console.error({ at: "performMergeOperation - error", error: e });
      return null;
    }
  }

  /**
   * Efficiently batch get multiple items using BatchGetCommand instead of individual GetCommand calls.
   * Handles DynamoDB's 100-item limit per batch and retries unprocessed keys.
   */
  private async batchGetItems(
    keys: { PK: string; SK: string }[],
    dynamoClient: DynamoDBDocumentClient
  ): Promise<any[]> {
    const results: any[] = [];
    const batchSize = 100;
    const seen = new Set<string>();
    const uniqueKeys = keys.filter((key) => {
      const keyString = `${key.PK}#${key.SK}`;
      if (seen.has(keyString)) {
        return false;
      }
      seen.add(keyString);
      return true;
    });

    try {
      for (let i = 0; i < uniqueKeys.length; i += batchSize) {
        const batchKeys = uniqueKeys.slice(i, i + batchSize);

        const params = {
          RequestItems: {
            [this.config.tableArn]: {
              Keys: batchKeys
            }
          }
        };

        const result = await dynamoClient.send(new BatchGetCommand(params));

        if (result.Responses && result.Responses[this.config.tableArn]) {
          for (const item of result.Responses[this.config.tableArn]) {
            results.push(this.getResourceData(item));
          }
        }

        if (
          result.UnprocessedKeys &&
          Object.keys(result.UnprocessedKeys).length > 0
        ) {
          console.warn(
            "Unprocessed keys in batch get operation:",
            result.UnprocessedKeys
          );
          const unprocessedKeys =
            result.UnprocessedKeys[this.config.tableArn]?.Keys || [];
          if (unprocessedKeys.length > 0) {
            const retryResults = await this.batchGetItems(
              unprocessedKeys as { PK: string; SK: string }[],
              dynamoClient
            );
            results.push(...retryResults);
          }
        }
      }
    } catch (e) {
      console.error({ at: "batchGetItems - error", error: e });
    }

    return results;
  }

  /**
   * Gets resource counts using efficient COUNT queries per resource.
   * Uses DynamoDB's built-in COUNT feature with proper pagination handling for large datasets.
   */
  private async getResourceCounts(
    resources: Resource[],
    spaceId: string,
    dynamoClient: DynamoDBDocumentClient
  ): Promise<any[]> {
    const countPromises = resources.map(async (resource) => {
      try {
        let totalCount = 0;
        let lastEvaluatedKey = undefined;

        do {
          const params: any = {
            TableName: this.config.tableArn,
            KeyConditionExpression: "PK = :pk",
            ExpressionAttributeValues: {
              ":pk": `${spaceId}#${resource}`
            },
            Select: "COUNT" as const
          };

          if (lastEvaluatedKey) {
            params.ExclusiveStartKey = lastEvaluatedKey;
          }

          const result = await dynamoClient.send(new QueryCommand(params));
          totalCount += result.Count || 0;
          lastEvaluatedKey = result.LastEvaluatedKey;
        } while (lastEvaluatedKey);

        const countObj: any = {};
        countObj[resource] = totalCount;
        return countObj;
      } catch (e) {
        console.error({ at: "getResourceCounts - error", error: e, resource });
        const countObj: any = {};
        countObj[resource] = 0;
        return countObj;
      }
    });

    return Promise.all(countPromises);
  }

  private getResourceData(item: any): any {
    const {
      PK,
      SK,
      userId,
      spaceId,
      GSI1PK,
      GSI1SK,
      action,
      timestamp,
      dapId,
      TTL,
      modifiedAtUnix,
      ...resourceData
    } = item;
    return resourceData;
  }

  private mapResourceData(records: any[]) {
    return records.map((record) => {
      return {
        ...this.getResourceData(record),
        id: record.SK
      };
    });
  }

  /**
   * Retrieves a saved pagination cursor from DynamoDB and checks if it's expired
   * Deletes the cursor if it's older than 30 minutes
   */
  private async retrieveSavedCursor(
    spaceId: string,
    resource: string,
    dynamoClient: DynamoDBDocumentClient
  ): Promise<string | null> {
    try {
      const savedCursorParams = {
        TableName: this.config.tableArn,
        Key: {
          PK: `${spaceId}#${resource}#paginatecursor`,
          SK: "cursor"
        }
      };

      const savedCursorResult = await dynamoClient.send(
        new GetCommand(savedCursorParams)
      );

      if (savedCursorResult.Item && savedCursorResult.Item.cursorData) {
        const cursorAge = Date.now() - (savedCursorResult.Item.updatedAt || 0);
        const thirtyMinutesInMs = 30 * 60 * 1000;

        if (cursorAge > thirtyMinutesInMs) {
          await this.deletePaginationCursor(spaceId, resource, dynamoClient);
          console.log("Deleted expired pagination cursor");
          return null;
        } else {
          return savedCursorResult.Item.cursorData;
        }
      }

      return null;
    } catch (e) {
      console.warn("Failed to retrieve saved cursor:", e);
      return null;
    }
  }

  /**
   * Deletes a pagination cursor from DynamoDB
   */
  private async deletePaginationCursor(
    spaceId: string,
    resource: string,
    dynamoClient: DynamoDBDocumentClient
  ): Promise<void> {
    try {
      const deleteParams = {
        TableName: this.config.tableArn,
        Key: {
          PK: `${spaceId}#${resource}#paginatecursor`,
          SK: "cursor"
        }
      };

      await dynamoClient.send(new DeleteCommand(deleteParams));
    } catch (e) {
      console.warn("Failed to delete pagination cursor:", e);
    }
  }

  /**
   * Manages pagination cursor persistence in DynamoDB
   * Saves cursor when there are more records, deletes when pagination is complete
   */
  private async managePaginationCursor(
    spaceId: string,
    resource: string,
    nextCursor: string | null,
    hasMore: boolean,
    dynamoClient: DynamoDBDocumentClient
  ): Promise<void> {
    try {
      const cursorPK = `${spaceId}#${resource}#paginatecursor`;
      const cursorSK = "cursor";

      if (hasMore && nextCursor) {
        // Save cursor for next pagination request
        const cursorItem = {
          PK: cursorPK,
          SK: cursorSK,
          cursorData: nextCursor,
          spaceId,
          resource,
          updatedAt: Date.now()
        };

        const putParams = {
          TableName: this.config.tableArn,
          Item: cursorItem
        };

        await dynamoClient.send(new PutCommand(putParams));
      } else {
        // Delete cursor when pagination is complete
        await this.deletePaginationCursor(spaceId, resource, dynamoClient);
      }
    } catch (e) {
      console.warn("Failed to manage pagination cursor:", e);
    }
  }

  /**
   * Simplified method to query a resource with cursor
   * Used by paginatev2
   */
  private async queryResourceWithCursor(
    dynamoClient: DynamoDBDocumentClient,
    spaceId: string,
    resource: string,
    cursor: string | null,
    isExtension: boolean
  ): Promise<{
    data: any[];
    nextCursor: string | null;
    hasMore: boolean;
    error?: string;
  }> {
    try {
      const params: any = {
        TableName: this.config.tableArn,
        KeyConditionExpression: "PK = :pk",
        ExpressionAttributeValues: {
          ":pk": `${spaceId}#${resource}`
        },
        ScanIndexForward: true
      };

      if (cursor) {
        params.ExclusiveStartKey = parseJson(cursor);
      }

      console.time("queryResourceWithCursor");
      const result = await dynamoClient.send(new QueryCommand(params));
      console.timeEnd("queryResourceWithCursor");

      if (!result.Items || result.Items.length === 0) {
        return {
          data: [],
          nextCursor: null,
          hasMore: false
        };
      }
      console.time("map");
      const processedItems = this.mapResourceData(result.Items);
      console.timeEnd("map");

      const nextCursor = result.LastEvaluatedKey
        ? stringify(result.LastEvaluatedKey)
        : null;

      return {
        data: processedItems,
        nextCursor,
        hasMore: !!result.LastEvaluatedKey
      };
    } catch (e) {
      console.error({ at: "queryResourceWithCursor - error", error: e });
      return {
        data: [],
        nextCursor: null,
        hasMore: false,
        error: e instanceof Error ? e.message : "Unknown error"
      };
    }
  }

  private async paginateWithOptimizedChunking(
    dynamoClient: DynamoDBDocumentClient,
    spaceId: string,
    resource: string,
    offset: number,
    limit: number,
    isExtension: boolean
  ): Promise<any> {
    try {
      // Use larger chunks to reduce the number of queries
      const chunkSize = 1000;
      let currentOffset = 0;
      let lastEvaluatedKey = undefined;

      // Skip to the desired offset with larger chunks
      while (currentOffset < offset) {
        const remainingSkip = offset - currentOffset;
        const queryLimit = Math.min(chunkSize, remainingSkip + limit);

        const skipParams: any = {
          TableName: this.config.tableArn,
          KeyConditionExpression: "PK = :pk",
          ExpressionAttributeValues: {
            ":pk": `${spaceId}#${resource}`
          },
          Limit: queryLimit,
          ScanIndexForward: true
        };

        if (lastEvaluatedKey) {
          skipParams.ExclusiveStartKey = lastEvaluatedKey;
        }

        const skipResult = await dynamoClient.send(
          new QueryCommand(skipParams)
        );

        if (!skipResult.Items || skipResult.Items.length === 0) {
          return { data: [], nextCursor: null, hasMore: false };
        }

        currentOffset += skipResult.Count || 0;
        lastEvaluatedKey = skipResult.LastEvaluatedKey;

        // If we've covered the offset and have enough items for the limit
        if (currentOffset >= offset + limit) {
          const startIndex = skipResult.Items.length - (currentOffset - offset);
          const endIndex = startIndex + limit;
          const items = skipResult.Items.slice(startIndex, endIndex);

          const resourceData = this.mapResourceData(items);

          const nextCursor = lastEvaluatedKey
            ? stringify(lastEvaluatedKey)
            : null;

          const hasMore = !!lastEvaluatedKey;

          // Save or delete cursor position in DynamoDB
          await this.managePaginationCursor(
            spaceId,
            resource,
            nextCursor,
            hasMore,
            dynamoClient
          );

          return {
            data: resourceData,
            nextCursor,
            hasMore
          };
        }

        if (!lastEvaluatedKey) break;
      }

      // If we need more items after skipping
      if (currentOffset >= offset && lastEvaluatedKey) {
        const finalParams: any = {
          TableName: this.config.tableArn,
          KeyConditionExpression: "PK = :pk",
          ExpressionAttributeValues: {
            ":pk": `${spaceId}#${resource}`
          },
          Limit: limit,
          ScanIndexForward: true,
          ExclusiveStartKey: lastEvaluatedKey
        };

        const result = await dynamoClient.send(new QueryCommand(finalParams));
        if (result.Items) {
          const resourceData = this.mapResourceData(result.Items);

          const nextCursor = result.LastEvaluatedKey
            ? stringify(result.LastEvaluatedKey)
            : null;

          const hasMore = !!result.LastEvaluatedKey;

          // Save or delete cursor position in DynamoDB
          await this.managePaginationCursor(
            spaceId,
            resource,
            nextCursor,
            hasMore,
            dynamoClient
          );

          return {
            data: resourceData,
            nextCursor,
            hasMore
          };
        }
      }

      // No more items, delete any existing cursor
      await this.managePaginationCursor(
        spaceId,
        resource,
        null,
        false,
        dynamoClient
      );

      return { data: [], nextCursor: null, hasMore: false };
    } catch (e) {
      console.error({ at: "paginateWithOptimizedChunking - error", error: e });
      return { data: [], nextCursor: null, hasMore: false };
    }
  }

  /**
   * Deletes all user records using GSI1 index with spaceId as partition key.
   * This is the most efficient approach if GSI1 is properly configured.
   *
   * @param spaceId - The space/user ID to delete all records for
   * @param dynamoClient - DynamoDB document client
   * @returns Promise resolving to the number of deleted records
   */
  private async deleteUserViaGSI1(
    spaceId: string,
    dynamoClient: DynamoDBDocumentClient
  ): Promise<number> {
    const queryParams: any = {
      TableName: this.config.tableArn,
      IndexName: "GSI1",
      KeyConditionExpression: "spaceId = :spaceId",
      ExpressionAttributeValues: {
        ":spaceId": spaceId
      }
    };

    let allItems: any[] = [];
    let lastEvaluatedKey = undefined;

    // Query all items for this spaceId using GSI1
    do {
      if (lastEvaluatedKey) {
        queryParams.ExclusiveStartKey = lastEvaluatedKey;
      }

      const result = await dynamoClient.send(new QueryCommand(queryParams));

      if (result.Items && result.Items.length > 0) {
        allItems.push(...result.Items);
      }

      lastEvaluatedKey = result.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    if (allItems.length === 0) {
      return 0;
    }

    // Delete items in batches
    const batchSize = 25; // DynamoDB batch write limit
    let deletedCount = 0;

    for (let i = 0; i < allItems.length; i += batchSize) {
      const batch = allItems.slice(i, i + batchSize);
      const deleteRequests = batch.map((item) => ({
        DeleteRequest: {
          Key: {
            PK: item.PK,
            SK: item.SK
          }
        }
      }));

      const deleteParams = {
        RequestItems: {
          [this.config.tableArn]: deleteRequests
        }
      };

      await dynamoClient.send(new BatchWriteCommand(deleteParams));
      deletedCount += deleteRequests.length;
    }

    return deletedCount;
  }

  /**
   * Deletes all user records by scanning table with PK prefix filter.
   * This is a fallback approach when GSI1 is not available or fails.
   * Note: This approach is less efficient as it requires scanning the entire table.
   *
   * @param spaceId - The space/user ID to delete all records for
   * @param dynamoClient - DynamoDB document client
   * @returns Promise resolving to the number of deleted records
   */
  private async deleteUserViaPKScan(
    spaceId: string,
    dynamoClient: DynamoDBDocumentClient
  ): Promise<number> {
    const scanParams: any = {
      TableName: this.config.tableArn,
      FilterExpression: "begins_with(PK, :pkPrefix)",
      ExpressionAttributeValues: {
        ":pkPrefix": `${spaceId}#`
      }
    };

    let allItems: any[] = [];
    let lastEvaluatedKey = undefined;

    // Scan all items with PK starting with spaceId
    do {
      if (lastEvaluatedKey) {
        scanParams.ExclusiveStartKey = lastEvaluatedKey;
      }

      const result = await dynamoClient.send(new ScanCommand(scanParams));

      if (result.Items && result.Items.length > 0) {
        allItems.push(...result.Items);
      }

      lastEvaluatedKey = result.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    if (allItems.length === 0) {
      return 0;
    }

    // Delete items in batches
    const batchSize = 25;
    let deletedCount = 0;

    for (let i = 0; i < allItems.length; i += batchSize) {
      const batch = allItems.slice(i, i + batchSize);
      const deleteRequests = batch.map((item) => ({
        DeleteRequest: {
          Key: {
            PK: item.PK,
            SK: item.SK
          }
        }
      }));

      const deleteParams = {
        RequestItems: {
          [this.config.tableArn]: deleteRequests
        }
      };

      await dynamoClient.send(new BatchWriteCommand(deleteParams));
      deletedCount += deleteRequests.length;
    }

    return deletedCount;
  }
}
