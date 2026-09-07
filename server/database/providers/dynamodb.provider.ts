import {
  IDatabaseProvider,
  UserCreateData,
  GuestCreateData,
  UserPlanCreateData,
  SubscriptionCreateData,
  IProductConfig,
  ICreateUserIfNotExistsResponse
} from "./types";
import { DatabaseError } from "$lib/server/common/errors";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  PutCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
  GetCommand,
  ScanCommand
} from "@aws-sdk/lib-dynamodb";
import * as crypto from "crypto";
import {
  Agent,
  CONTEXT,
  IActivity
} from "$lib/server/common/account/account.type";
import { IUserProfileInfo } from "@nucleum/schema/account/profile.type";

interface IDynamoBaseAttributes {
  PK: string;
  SK: string;
  GSI1PK: string;
  GSI1SK: string;
  createdAt: string;
}

/**
 * DynamoDB Database Provider for Master Database Operations
 *
 * Table Structure (Single Table Design):
 * - PK (Partition Key): EntityType#{id} (e.g., user#{userId}, activity#{userId}, etc.)
 * - SK (Sort Key): Additional identifier or timestamp for sorting
 * - GSI1PK/GSI1SK: Global Secondary Index for alternate access patterns
 *   - Email lookup: GSI1PK = email#{emailHash}, GSI1SK = {userId}
 * - All other entity attributes are stored as top-level fields
 *
 * User Entity Structure:
 * - PK: user#{userId}, SK: profile (main user record)
 * - PK: user#{userId}, SK: userPlan (user plan details)
 * - PK: user#{userId}, SK: subscription#{productId} (user subscriptions)
 */

interface DynamoDBConfig {
  tableName: string;
  tableArn: string;
  region: string;
}

export class DynamoDBDatabaseProvider implements IDatabaseProvider {
  private config: DynamoDBConfig;
  private client: DynamoDBDocumentClient;

  constructor() {
    const region = process.env.AWS_REGION || "us-east-1";
    const tableName = process.env.MASTER_DB_TABLE_NAME || "master";
    const dynamoAccount =
      process.env.DYNAMODB_ACCOUNT_ID || process.env.AWS_ACCOUNT_ID;
    const tableArn = `arn:aws:dynamodb:${region}:${dynamoAccount}:table/${tableName}`;

    this.config = {
      tableName,
      tableArn,
      region
    };

    const dynamoClient = new DynamoDBClient({ region });
    this.client = DynamoDBDocumentClient.from(dynamoClient);
  }

  /**
   * Logs user activity with timestamp and context
   * @param userId - The user ID performing the activity
   * @param context - The activity context containing activity details
   * @returns Promise resolving to the logged activity item
   */
  async log(userId: string, context: IActivity): Promise<any> {
    const timestamp = new Date().toISOString();
    const timestampMs = Date.now();

    const activityItem = {
      PK: `activity#${context.activity}`,
      SK: `${timestampMs}#${Math.floor(Math.random() * 1000000)}`,
      GSI1PK: userId,
      timestamp,
      context
    };

    return this.client.send(
      new PutCommand({
        TableName: this.config.tableArn,
        Item: activityItem
      })
    );
  }

  /**
   * Creates a new user in the database
   * @param userData - The user data for creating a new user
   * @returns Promise resolving to the created user data or existing user info
   */
  async createUserIfNotExists(
    userData: UserCreateData
  ): Promise<ICreateUserIfNotExistsResponse> {
    const existingUser = await this.getUserByEmail(userData.email);

    if (existingUser.Items && existingUser.Items.length > 0) {
      const existingUsers = existingUser.Items;
      if (existingUsers.length === 1) {
        return {
          user: existingUsers[0] as IUserProfileInfo,
          existingUserCount: 1
        };
      } else {
        return {
          user: null,
          existingUserCount: existingUser.Items.length
        };
      }
    }
    const emailHash = this.resolveEmailHash(userData.email);

    const userItem: IUserProfileInfo & IDynamoBaseAttributes = {
      PK: `user#${userData.guestId}`,
      SK: `profile`,
      id: `user:${userData.guestId}`,
      emailhash: emailHash,
      emailParts: userData.emailParts,
      nickName: userData.nickName,
      profilePictureUrl: userData.profilePictureUrl,
      joinDate: userData.joinDate,
      context: userData.context,
      createdAt: new Date().toISOString(),
      GSI1PK: `email#${emailHash}`,
      GSI1SK: userData.guestId
    };

    if (userData.isOAuth) {
      userItem.isOAuth = true;
      userItem.oAuthId = userData.oAuthId;
    } else {
      const hashedPassword = this.hashPassword(userData.password);
      userItem.pass = hashedPassword;
      userItem.passhash = hashedPassword;
    }

    await this.client.send(
      new PutCommand({
        TableName: this.config.tableArn,
        Item: userItem
      })
    );

    return {
      user: userItem,
      existingUserCount: 1
    };
  }

  /**
   * Initializes a user database with the given parameters
   * @param id - The user ID
   * @param params - Database initialization parameters including scope, host, and optional region
   * @returns Promise resolving to an empty array (placeholder implementation)
   */
  async initializeUserDb(
    id: string,
    params: { scope: CONTEXT; host: string; region?: string }
  ): Promise<any> {
    return true;
  }

  resolveEmailHash(email: string) {
    return crypto.createHash("md5").update(email).digest("hex");
  }

  /**
   * Retrieves a user by their email address
   * @param email - The email address to search for
   * @returns Promise resolving to the user data if found, empty array otherwise
   */
  async getUserByEmail(
    email: string,
    isIncludeUserProfile = false
  ): Promise<any> {
    const emailHash = this.resolveEmailHash(email);

    const result = await this.client.send(
      new QueryCommand({
        TableName: this.config.tableArn,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :pk",
        ExpressionAttributeValues: {
          ":pk": `email#${emailHash}`
        }
      })
    );
    if (!isIncludeUserProfile) return result;

    if (!result.Items || result.Items.length === 0) return null;
    const userId = result.Items[0].GSI1SK;
    const userResult = await this.client.send(
      new GetCommand({
        TableName: this.config.tableArn,
        Key: {
          PK: `user#${userId}`,
          SK: "profile"
        }
      })
    );
    return userResult.Item;
  }

  /**
   * Retrieves a user by their user ID
   * @param userId - The user ID to search for
   * @returns Promise resolving to the user data if found, or result count of 0
   */
  async getUserById(userId: string): Promise<any> {
    const result = await this.client.send(
      new GetCommand({
        TableName: this.config.tableArn,
        Key: {
          PK: `user#${userId}`,
          SK: "profile"
        }
      })
    );
    if (result.Item) {
      return result.Item;
    }
    return null;
  }

  /**
   * Updates user information with the provided data
   * @param userId - The user ID to update
   * @param updates - Object containing the fields to update
   * @returns Promise resolving to the updated user data and guest context
   */
  async bootstrapUser(userId: string, updates: any): Promise<any> {
    const updateExpression = [];
    const expressionAttributeValues = {};
    const expressionAttributeNames = {};

    Object.entries(updates).forEach(([key, value], index) => {
      const attrName = `#attr${index}`;
      const attrValue = `:val${index}`;
      updateExpression.push(`${attrName} = ${attrValue}`);
      expressionAttributeNames[attrName] = key;
      expressionAttributeValues[attrValue] = value;
    });

    await this.client.send(
      new UpdateCommand({
        TableName: this.config.tableArn,
        Key: {
          PK: `user#${userId}`,
          SK: "profile"
        },
        UpdateExpression: `SET ${updateExpression.join(", ")}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues
      })
    );

    return await this.getUserById(userId);
  }

  /**
   * Deletes a user from the database
   * @param agent - The agent object containing the user ID to delete
   * @returns Promise resolving to the deletion result
   */
  async deleteUser(agent: Agent): Promise<any> {
    const result = await this.client.send(
      new DeleteCommand({
        TableName: this.config.tableArn,
        Key: {
          PK: `user#${agent.id}`,
          SK: "profile"
        }
      })
    );
    //TODO - delete all user related data from the database

    return result;
  }

  /**
   * Authenticates a user with email and password
   * @param email - The user's email address
   * @param password - The user's password
   * @returns Promise resolving to user data if authentication succeeds, or error code
   */
  async authenticateUser(email: string, password: string): Promise<any> {
    const user = await this.getUserByEmail(email);
    if (user) {
      const hashedPassword = this.hashPassword(password);
      if (user.pass === hashedPassword) {
        return user;
      }
    }
    return [];
  }

  /**
   * Checks if an email is on the beta list for a specific app
   * @param email - The email address to check
   * @param app - The app name to check beta access for
   * @returns Promise resolving to beta list items if found
   */
  async checkBetaList(email: string, app: string): Promise<any> {
    const result = await this.client.send(
      new QueryCommand({
        TableName: this.config.tableArn,
        KeyConditionExpression: "PK = :pk AND SK = :sk",
        ExpressionAttributeValues: {
          ":pk": `betaList#${app}`,
          ":sk": email
        }
      })
    );

    return result.Items || [];
  }

  /**
   * Creates a guest user and logs their activity
   * @param guestData - The guest data for creating a new guest
   * @returns Promise resolving to the created guest and activity items
   */
  async createGuest(guestData: GuestCreateData): Promise<any> {
    const guestItem = {
      PK: `guest#${guestData.id}`,
      SK: "profile",
      id: guestData.id,
      timestamp: guestData.timestamp,
      context: guestData.context,
      createdAt: new Date().toISOString()
    };

    await Promise.all([
      this.client.send(
        new PutCommand({
          TableName: this.config.tableArn,
          Item: guestItem
        })
      ),
      this.log(`guest:${guestData.id}`, {
        ...guestData.context,
        activity: "guest-visit"
      })
    ]);

    return guestItem;
  }

  /**
   * Creates a user plan with the provided plan data
   * @param planData - The user plan data including userId, plan details, trial, and discount
   * @returns Promise resolving to the created user plan item
   */
  async createUserPlan(planData: UserPlanCreateData): Promise<any> {
    const userPlanItem = {
      PK: `user#${planData.userId}`,
      SK: "userPlan",
      id: `userPlan:${planData.id}`,
      userId: `user:${planData.userId}`,
      plan: planData.plan,
      trialPlan: planData.trialPlan,
      discount: planData.discount,
      createdAt: new Date().toISOString()
    };

    await this.client.send(
      new PutCommand({
        TableName: this.config.tableArn,
        Item: userPlanItem
      })
    );

    return userPlanItem;
  }

  /**
   * Retrieves the user plan for a specific user
   * @param userId - The user ID to get the plan for
   * @returns Promise resolving to the user plan data if found
   */
  async getUserAndPlan(userId: string): Promise<any> {
    const user = this.getUserById(userId);
    const userPlan = this.client.send(
      new GetCommand({
        TableName: this.config.tableArn,
        Key: {
          PK: `user#${userId}`,
          SK: "userPlan"
        }
      })
    );
    const result = await Promise.all([user, userPlan]);
    if (result[0] && result[1]) {
      return [
        {
          ...result[0],
          userPlan: result[1].Item
        }
      ];
    }
    return null;
  }

  /**
   * Retrieves the configuration for a specific product
   * @param productId - The product ID to get configuration for
   * @returns Promise resolving to the product configuration if found
   */
  async getProductConfig(
    productId: string
  ): Promise<IProductConfig | undefined> {
    const result = await this.client.send(
      new GetCommand({
        TableName: this.config.tableArn,
        Key: {
          PK: `product#${productId}`,
          SK: "config"
        }
      })
    );

    return result?.Item as unknown as IProductConfig;
  }

  /**
   * Creates a subscription for a user, creating the user if they don't exist
   * @param subscriptionData - The subscription data including email, product ID, and context
   * @returns Promise resolving to the created subscription item or error
   */
  async createSubscription(
    subscriptionData: SubscriptionCreateData
  ): Promise<any> {
    //TODO
  }

  /**
   * Creates a new space with the given name and creator
   * @param name - The name of the space to create
   * @param userId - The user ID of the space creator
   * @returns Promise resolving to the created space item
   */
  async createSpace(name: string, userId: string): Promise<any> {
    const spaceId = crypto.randomBytes(16).toString("hex");
    const spaceItem = {
      PK: `space#${spaceId}`,
      SK: "details",
      id: `space:${spaceId}`,
      name,
      creator: `user:${userId}`,
      createdAt: new Date().toISOString()
    };

    await this.client.send(
      new PutCommand({
        TableName: this.config.tableArn,
        Item: spaceItem
      })
    );

    return [{ result: [{ id: spaceItem }] }];
  }

  /**
   * Retrieves the relationship between a space and user (membership details)
   * @param spaceId - The space ID to check
   * @param userId - The user ID to check
   * @returns Promise resolving to the space-user relationship with default admin role
   */
  async getSpaceUser(spaceId: string, userId: string): Promise<any> {
    const result = await this.client.send(
      new GetCommand({
        TableName: this.config.tableArn,
        Key: {
          PK: `spaceUser#${spaceId}#${userId}`,
          SK: "membership"
        }
      })
    );

    return [{ result: { relation: result.Item || { role: "admin" } } }];
  }

  /**
   * Retrieves all spaces associated with a user
   * @param userId - The user ID to get spaces for
   * @returns Promise resolving to an array of user spaces
   */
  async getUserSpaces(userId: string): Promise<any> {
    const result = await this.client.send(
      new QueryCommand({
        TableName: this.config.tableArn,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :pk",
        ExpressionAttributeValues: {
          ":pk": `userSpaces#${userId}`
        }
      })
    );

    return [{ result: result.Items || [] }];
  }

  /**
   * Retrieves database definitions for an app since the last change ID
   * @param app - The app name to get definitions for
   * @param lastChangeId - The last change ID to get definitions after
   * @returns Promise resolving to database definition items
   */
  async getDbDefinitions(app: string, lastChangeId: number): Promise<any> {
    const result = await this.client.send(
      new QueryCommand({
        TableName: this.config.tableArn,
        KeyConditionExpression: "PK = :pk AND SK > :lastChange",
        ExpressionAttributeValues: {
          ":pk": `dbDef#${app.toLowerCase()}`,
          ":lastChange": lastChangeId.toString()
        },
        ScanIndexForward: true
      })
    );

    return [{ result: result.Items || [] }];
  }

  /**
   * Hashes a password using SHA256 with salt
   * @param password - The plain text password to hash
   * @returns The hashed password string
   */
  private hashPassword(password: string): string {
    // Simplified password hashing - in production use bcrypt or similar
    return crypto
      .createHash("sha256")
      .update(password + process.env.PASSWORD_SALT)
      .digest("hex");
  }
}
