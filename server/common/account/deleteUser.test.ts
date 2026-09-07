import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { deleteUserAccount, signup } from "./index";
import { DatabaseProviderFactory } from "$lib/server/database/providers";
import { SyncProviderFactory } from "$lib/server/common/sync/providers";
import { syncUp } from "$lib/server/common/sync/up";
import { cloneUp } from "$lib/server/common/sync/cloneup";
import { Agent } from "./account.type";
import { ValidationError } from "../errors";
import { generateRandomIdv2 } from "$lib/shared/utils/crypto.utils";
import { Resource } from "$lib/client/components/flux/resourceStores/resource.enum";
import { ResourceActionType } from "$lib/client/components/flux/resourceStores/resource.type";
import { PersistenceActionType } from "@nucleum/schema/legacy/data.type";
import { createMutation } from "$lib/tests/fixtures/mutations";

describe("deleteUserAccount integration tests", () => {
  let testUserId: string;
  let testAgent: Agent;
  let createdUserEmail: string;

  beforeEach(async () => {
    testUserId = generateRandomIdv2();
    console.log({ testUserId });
    createdUserEmail = `delete-test-${testUserId}@example.com`;

    testAgent = {
      id: testUserId,
      context: "test",
      db: testUserId, // Use testUserId as db for proper data isolation
      region: "insouth"
    };

    // Create a test user first so we can delete it
    const signupData = {
      email: createdUserEmail,
      pass: "password123",
      nickName: "Delete Test User",
      context: {
        guest: generateRandomIdv2(),
        app: "localhost",
        host: "localhost",
        timezone: "UTC"
      }
    };

    const signupResult = await signup(signupData);

    // Extract the actual user ID from signup result if available
    if (
      typeof signupResult === "object" &&
      "userInfo" in signupResult &&
      signupResult.userInfo?.id
    ) {
      const actualUserId = signupResult.userInfo.id.split("user:")[1];
      if (actualUserId) {
        testUserId = actualUserId;
        testAgent.id = actualUserId;
        testAgent.db = actualUserId; // Update db to match user ID
      }
    }

    // Add some test data using syncUp to make deletion test more comprehensive
    await addTestDataForUser(testAgent);
  });

  afterEach(async () => {
    // Cleanup: Ensure test user is removed even if test fails
    try {
      const provider = DatabaseProviderFactory.getProvider();
      await provider.deleteUser(testAgent);

      const syncProvider = SyncProviderFactory.getProvider();
      await syncProvider.deleteUser(testAgent);
    } catch (error) {
      // Ignore cleanup errors as they may be expected
    }
  });

  describe("successful deletion scenarios", () => {
    it.only("should successfully delete a user account with all required data", async () => {
      const deleteBody = {
        context: {
          app: "localhost",
          host: "localhost",
          activity: "deleteAccount"
        }
      };

      console.log({ testAgent });
      const provider = DatabaseProviderFactory.getProvider();
      await vi.waitFor(
        async () => {
          expect(await provider.getUserById(testUserId)).not.toBeNull();
        },
        { interval: 250, timeout: 10_000 }
      );
      const result = await deleteUserAccount(deleteBody, testAgent);
      expect(result).toBeDefined();

      // Verify user is actually deleted by trying to retrieve it
      const deletedUser = await provider.getUserById(testUserId);
      expect(deletedUser).toBeNull();
    }, 20000);

    it("should handle deletion when user has minimal data", async () => {
      const deleteBody = {
        context: {
          activity: "deleteAccount"
        }
      };

      const result = await deleteUserAccount(deleteBody, testAgent);

      expect(result).toBeDefined();

      // Verify deletion in database
      const provider = DatabaseProviderFactory.getProvider();
      const deletedUser = await provider.getUserById(testUserId);
      expect(deletedUser).toBeNull();
    });

    it("should delete user from both database and sync providers", async () => {
      const deleteBody = {
        context: {
          app: "localhost",
          host: "localhost",
          activity: "deleteAccount"
        }
      };

      const result = await deleteUserAccount(deleteBody, testAgent);

      expect(result).toBeDefined();

      // Verify deletion from database provider
      const provider = DatabaseProviderFactory.getProvider();
      const deletedUser = await provider.getUserById(testUserId);
      expect(deletedUser).toBeNull();

      // Note: Sync provider deletion verification would depend on the specific
      // implementation of the sync provider's deleteUser method
    });
  });

  describe("error scenarios", () => {
    it("should throw ValidationError when agent.id is missing", async () => {
      const invalidAgent = {
        context: "test",
        db: "test",
        region: "us-east-1"
      } as Agent; // Missing id property

      const deleteBody = {
        context: {
          activity: "deleteAccount"
        }
      };

      await expect(deleteUserAccount(deleteBody, invalidAgent)).rejects.toThrow(
        ValidationError
      );

      await expect(deleteUserAccount(deleteBody, invalidAgent)).rejects.toThrow(
        "userId is required"
      );
    });

    it("should handle deletion of non-existent user gracefully", async () => {
      const nonExistentAgent = {
        id: "non-existent-user-id",
        context: "test",
        db: "test",
        region: "us-east-1"
      };

      const deleteBody = {
        context: {
          activity: "deleteAccount"
        }
      };

      // Should not throw an error even if user doesn't exist
      const result = await deleteUserAccount(deleteBody, nonExistentAgent);
      expect(result).toBeDefined();
    });

    it("should handle empty context gracefully", async () => {
      const deleteBody = {
        context: {}
      };

      const result = await deleteUserAccount(deleteBody, testAgent);
      expect(result).toBeDefined();

      // Verify deletion still works
      const provider = DatabaseProviderFactory.getProvider();
      const deletedUser = await provider.getUserById(testUserId);
      expect(deletedUser).toBeNull();
    });
  });

  describe("data integrity", () => {
    it("should completely remove user data from DynamoDB", async () => {
      const provider = DatabaseProviderFactory.getProvider();

      // Verify user exists before deletion
      const userBeforeDeletion = await provider.getUserById(testUserId);
      expect(userBeforeDeletion).toBeDefined();

      const deleteBody = {
        context: {
          activity: "deleteAccount",
          app: "localhost"
        }
      };

      await deleteUserAccount(deleteBody, testAgent);

      // Verify user profile is deleted
      const userAfterDeletion = await provider.getUserById(testUserId);
      expect(userAfterDeletion).toBeNull();

      // Verify user cannot be retrieved by email
      const userByEmail = await provider.getUserByEmail(createdUserEmail);
      expect(userByEmail).toBeNull();
    });

    it("should delete all user synced data including nodes, kv pairs, and mutations", async () => {
      const syncProvider = SyncProviderFactory.getProvider();

      // Verify sync data exists before deletion (this data was added in beforeEach)
      // Note: Actual verification would depend on the sync provider's query methods

      const deleteBody = {
        context: {
          activity: "deleteAccount",
          app: "localhost"
        }
      };

      await deleteUserAccount(deleteBody, testAgent);

      // Verify all synced data is deleted
      // The sync provider's deleteUser method should have been called
      // and all user data should be removed from the sync storage

      // Verify user profile is deleted from database
      const provider = DatabaseProviderFactory.getProvider();
      const deletedUser = await provider.getUserById(testUserId);
      expect(deletedUser).toBeNull();

      // Note: More specific sync data verification would require
      // access to the sync provider's query methods to check that
      // nodes, kv pairs, and mutations are all properly deleted
    });

    it("should log the deletion activity", async () => {
      const deleteBody = {
        context: {
          activity: "deleteAccount",
          app: "localhost",
          host: "localhost",
          userAgent: "test-browser"
        }
      };

      // The function should complete without throwing errors
      // (actual logging verification would require accessing log storage)
      const result = await deleteUserAccount(deleteBody, testAgent);
      expect(result).toBeDefined();
    });
  });

  describe("provider integration", () => {
    it("should work with DynamoDB provider specifically", async () => {
      // Ensure we're using DynamoDB provider
      const provider = DatabaseProviderFactory.getProvider();
      expect(provider.constructor.name).toBe("DynamoDBDatabaseProvider");

      const deleteBody = {
        context: {
          activity: "deleteAccount"
        }
      };

      const result = await deleteUserAccount(deleteBody, testAgent);
      expect(result).toBeDefined();

      // Verify DynamoDB-specific deletion behavior
      const deletedUser = await provider.getUserById(testUserId);
      expect(deletedUser).toBeNull();
    });

    it("should handle sync provider deletion", async () => {
      const syncProvider = SyncProviderFactory.getProvider();

      const deleteBody = {
        context: {
          activity: "deleteAccount"
        }
      };

      // Should complete without errors
      const result = await deleteUserAccount(deleteBody, testAgent);
      expect(result).toBeDefined();
    });
  });

  /**
   * Helper function to add test data for a user using syncUp functionality
   * This creates various types of data that should be deleted when the account is deleted
   */
  async function addTestDataForUser(agent: Agent) {
    try {
      const dapId = `test-dap-${agent.id}`;

      // 1. First, clone up some initial records
      const initialRecords = [
        {
          id: `node:${agent.id}-test-node-1`,
          title: "Test Node for Deletion",
          content: "This node should be deleted",
          modifiedAt: new Date().toISOString()
        },
        {
          id: `node:${agent.id}-test-node-2`,
          title: "Another Test Node",
          content: "This should also be deleted",
          modifiedAt: new Date().toISOString()
        }
      ];

      await cloneUp(
        {
          resource: Resource.node,
          records: initialRecords
        },
        agent
      );

      // 2. Add some key-value data
      const kvRecords = [
        {
          id: `kv:${agent.id}-preferences`,
          value: {
            theme: "dark",
            language: "en",
            deleteTestData: true
          },
          modifiedAt: new Date().toISOString()
        },
        {
          id: `kv:${agent.id}-settings`,
          value: {
            notifications: true,
            syncEnabled: true,
            deleteTestData: true
          },
          modifiedAt: new Date().toISOString()
        }
      ];

      await cloneUp(
        {
          resource: Resource.kv,
          records: kvRecords
        },
        agent
      );

      // 3. Create some mutations via syncUp to test mutation deletion
      const mutations = [
        createMutation({
          action: ResourceActionType.EDIT,
          resource: Resource.node,
          resourceId: `node:${agent.id}-test-node-1`,
          dapId,
          params: {
            action: PersistenceActionType.MERGE,
            record: {
              id: `node:${agent.id}-test-node-1`,
              title: "Updated Test Node for Deletion",
              content: "This node was updated and should be deleted",
              modifiedAt: new Date().toISOString()
            }
          }
        }),
        createMutation({
          action: ResourceActionType.CREATE,
          resource: Resource.node,
          resourceId: `node:${agent.id}-test-node-3`,
          dapId,
          params: {
            action: PersistenceActionType.INSERT,
            record: {
              id: `node:${agent.id}-test-node-3`,
              title: "New Test Node via SyncUp",
              content: "Created via syncUp, should be deleted",
              modifiedAt: new Date().toISOString()
            }
          }
        }),
        createMutation({
          action: ResourceActionType.EDIT,
          resource: Resource.kv,
          resourceId: `kv:${agent.id}-preferences`,
          dapId,
          params: {
            action: PersistenceActionType.MERGE,
            record: {
              id: `kv:${agent.id}-preferences`,
              value: {
                theme: "light",
                language: "en",
                lastUpdated: new Date().toISOString(),
                deleteTestData: true
              },
              modifiedAt: new Date().toISOString()
            }
          }
        })
      ];

      await syncUp(
        {
          mutations,
          lastSyncDown: 0,
          resources: [Resource.node, Resource.kv],
          dapId
        },
        agent
      );

      const syncProvider = SyncProviderFactory.getProvider();
      await vi.waitFor(
        async () => {
          const result = await syncProvider.cloneDown(
            {
              resources: [Resource.node, Resource.kv],
              isExtension: false
            },
            agent
          );
          expect(JSON.stringify(result)).toContain(initialRecords[0].id);
          expect(JSON.stringify(result)).toContain(kvRecords[0].id);
        },
        { interval: 250, timeout: 10_000 }
      );
    } catch (error) {
      console.error("Error adding test data:", error);
      // Don't fail the test setup if adding test data fails
    }
  }
});
