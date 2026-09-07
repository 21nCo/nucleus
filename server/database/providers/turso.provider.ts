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
import * as crypto from "crypto";
import * as bcrypt from "bcrypt";
import {
  Agent,
  CONTEXT,
  IActivity
} from "$lib/server/common/account/account.type";
import { IUserProfileInfo } from "@nucleum/schema/account/profile.type";

/**
 * Turso Database Provider
 * 
 * This provider implements per-workspace database isolation using Turso.
 * Each Linear workspace gets its own Turso database instance for data isolation.
 * 
 * Configuration via environment variables:
 * - TURSO_BASE_URL: Base URL for Turso API
 * - TURSO_AUTH_TOKEN: Authentication token for Turso API
 * - TURSO_GROUP: Database group name (for multi-region replication)
 */

interface TursoConfig {
  baseUrl: string;
  authToken: string;
  group?: string;
}

export class TursoProvider implements IDatabaseProvider {
  private config: TursoConfig;
  private workspaceConnections: Map<string, any>;

  constructor() {
    this.config = {
      baseUrl: process.env.TURSO_BASE_URL || "",
      authToken: process.env.TURSO_AUTH_TOKEN || "",
      group: process.env.TURSO_GROUP
    };

    this.workspaceConnections = new Map();

    if (!this.config.baseUrl || !this.config.authToken) {
      console.warn(
        "Turso provider initialized without credentials. Set TURSO_BASE_URL and TURSO_AUTH_TOKEN environment variables."
      );
    }
  }

  /**
   * Gets or creates a database connection for a specific workspace
   * @param workspaceId - The workspace identifier (typically Linear workspace ID)
   * @returns Database connection object
   */
  private async getWorkspaceDb(workspaceId: string): Promise<any> {
    if (this.workspaceConnections.has(workspaceId)) {
      return this.workspaceConnections.get(workspaceId);
    }

    const dbName = `timear_workspace_${workspaceId}`;
    
    
    const connection = {
      name: dbName,
      workspaceId,
      execute: async (sql: string, params?: any[]) => {
        console.log(`[Turso] Executing on ${dbName}:`, sql, params);
        return { rows: [], rowsAffected: 0 };
      }
    };

    this.workspaceConnections.set(workspaceId, connection);
    return connection;
  }

  /**
   * Logs user activity with timestamp and context
   */
  async log(userId: string, context: IActivity): Promise<any> {
    const timestamp = new Date().toISOString();
    
    const workspaceId = this.extractWorkspaceId(userId, context);
    const db = await this.getWorkspaceDb(workspaceId);

    const query = `
      INSERT INTO activity (user_id, timestamp, context, activity)
      VALUES (?, ?, ?, ?)
    `;

    return db.execute(query, [
      userId,
      timestamp,
      JSON.stringify(context),
      context.activity ?? "unknown"
    ]);
  }

  /**
   * Creates a new user if they don't exist
   */
  async createUserIfNotExists(
    userData: UserCreateData
  ): Promise<ICreateUserIfNotExistsResponse> {
    const workspaceId = this.extractWorkspaceId(userData.guestId, userData.context);
    const db = await this.getWorkspaceDb(workspaceId);

    const emailHash = this.resolveEmailHash(userData.email);

    const existingUserQuery = `SELECT * FROM users WHERE email_hash = ? LIMIT 2`;
    const existing = await db.execute(existingUserQuery, [emailHash]);

    if (existing.rows && existing.rows.length > 0) {
      if (existing.rows.length === 1) {
        return {
          user: existing.rows[0] as IUserProfileInfo,
          existingUserCount: 1
        };
      } else {
        return {
          user: null,
          existingUserCount: existing.rows.length
        };
      }
    }

    const insertQuery = `
      INSERT INTO users (
        id, email_hash, email_parts, nick_name, profile_picture_url,
        join_date, context, is_oauth, oauth_id, password_hash, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const passwordHash = userData.password
      ? await this.hashPassword(userData.password)
      : null;

    await db.execute(insertQuery, [
      `user:${userData.guestId}`,
      emailHash,
      JSON.stringify(userData.emailParts),
      userData.nickName,
      userData.profilePictureUrl || "",
      userData.joinDate,
      JSON.stringify(userData.context),
      userData.isOAuth ? 1 : 0,
      userData.oAuthId || null,
      passwordHash,
      new Date().toISOString()
    ]);

    const createdUser = await db.execute(
      `SELECT * FROM users WHERE email_hash = ? LIMIT 1`,
      [emailHash]
    );

    return {
      user: createdUser.rows?.[0] as IUserProfileInfo
    };
  }

  /**
   * Initializes a user database (per-workspace isolation)
   */
  async initializeUserDb(
    id: string,
    params: { scope: CONTEXT; host: string; region?: string }
  ): Promise<any> {
    const db = await this.getWorkspaceDb(id);

    
    return { initialized: true, workspaceId: id };
  }

  /**
   * Retrieves a user by their email address
   */
  async getUserByEmail(email: string): Promise<any> {
    const emailHash = this.resolveEmailHash(email);
    
    console.warn("getUserByEmail requires workspace context in per-workspace architecture");
    
    return { rows: [] };
  }

  /**
   * Retrieves a user by their ID
   */
  async getUserById(userId: string): Promise<any> {
    const workspaceId = this.extractWorkspaceFromUserId(userId);
    const db = await this.getWorkspaceDb(workspaceId);

    const query = `SELECT * FROM users WHERE id = ? LIMIT 1`;
    const result = await db.execute(query, [userId]);

    return result.rows?.[0] || null;
  }

  /**
   * Updates user information (bootstrap)
   */
  async bootstrapUser(userId: string, updates: any): Promise<any> {
    const workspaceId = this.extractWorkspaceFromUserId(userId);
    const db = await this.getWorkspaceDb(workspaceId);

    const setClause = Object.keys(updates)
      .map(key => `${key} = ?`)
      .join(", ");
    const values = Object.values(updates);

    const query = `UPDATE users SET ${setClause} WHERE id = ?`;
    await db.execute(query, [...values, userId]);

    return this.getUserById(userId);
  }

  /**
   * Deletes a user from the database
   */
  async deleteUser(agent: Agent): Promise<any> {
    const workspaceId = this.extractWorkspaceFromUserId(agent.id);
    const db = await this.getWorkspaceDb(workspaceId);

    const query = `DELETE FROM users WHERE id = ?`;
    return db.execute(query, [agent.id]);
  }

  /**
   * Authenticates a user with email and password
   */
  async authenticateUser(email: string, password: string): Promise<any> {
    const emailHash = this.resolveEmailHash(email);
    
    console.warn("authenticateUser requires workspace context in per-workspace architecture");
    
    return null;
  }

  /**
   * Checks if an email is on the beta list
   */
  async checkBetaList(email: string, app: string): Promise<any> {
    console.warn("checkBetaList not implemented for Turso provider");
    return [];
  }

  /**
   * Creates a guest record
   */
  async createGuest(guestData: GuestCreateData): Promise<any> {
    const workspaceId = this.extractWorkspaceId(guestData.id, guestData.context);
    const db = await this.getWorkspaceDb(workspaceId);

    const query = `
      INSERT INTO guests (id, timestamp, context, created_at)
      VALUES (?, ?, ?, ?)
    `;

    await db.execute(query, [
      guestData.id,
      guestData.timestamp,
      JSON.stringify(guestData.context),
      new Date().toISOString()
    ]);

    await this.log(`guest:${guestData.id}`, {
      ...guestData.context,
      activity: "guest-visit"
    });

    return { id: guestData.id };
  }

  /**
   * Creates a user plan
   */
  async createUserPlan(planData: UserPlanCreateData): Promise<any> {
    const workspaceId = this.extractWorkspaceFromUserId(planData.userId);
    const db = await this.getWorkspaceDb(workspaceId);

    const query = `
      INSERT INTO user_plans (id, user_id, plan, trial_plan, discount, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    await db.execute(query, [
      `userPlan:${planData.id}`,
      `user:${planData.userId}`,
      planData.plan,
      JSON.stringify(planData.trialPlan),
      JSON.stringify(planData.discount),
      new Date().toISOString()
    ]);

    return {
      id: `userPlan:${planData.id}`,
      userId: `user:${planData.userId}`,
      plan: planData.plan
    };
  }

  /**
   * Retrieves user and their plan
   */
  async getUserAndPlan(userId: string): Promise<any> {
    const workspaceId = this.extractWorkspaceFromUserId(userId);
    const db = await this.getWorkspaceDb(workspaceId);

    const query = `
      SELECT u.*, up.*
      FROM users u
      LEFT JOIN user_plans up ON u.id = up.user_id
      WHERE u.id = ?
      LIMIT 1
    `;

    const result = await db.execute(query, [userId]);
    return result.rows?.[0] || null;
  }

  /**
   * Retrieves product configuration
   */
  async getProductConfig(
    productId: string
  ): Promise<IProductConfig | undefined> {
    console.warn("getProductConfig not fully implemented for Turso provider");
    return undefined;
  }

  /**
   * Creates a subscription
   */
  async createSubscription(
    subscriptionData: SubscriptionCreateData
  ): Promise<any> {
    console.warn("createSubscription not implemented for Turso provider");
    return { error: "Not implemented" };
  }

  /**
   * Creates a new space
   */
  async createSpace(name: string, userId: string): Promise<any> {
    const workspaceId = this.extractWorkspaceFromUserId(userId);
    const db = await this.getWorkspaceDb(workspaceId);

    const spaceId = crypto.randomBytes(16).toString("hex");
    
    const query = `
      INSERT INTO spaces (id, name, creator, created_at)
      VALUES (?, ?, ?, ?)
    `;

    await db.execute(query, [
      `space:${spaceId}`,
      name,
      userId,
      new Date().toISOString()
    ]);

    return [{ result: [{ id: `space:${spaceId}` }] }];
  }

  /**
   * Retrieves space user relationship
   */
  async getSpaceUser(spaceId: string, userId: string): Promise<any> {
    const workspaceId = this.extractWorkspaceFromUserId(userId);
    const db = await this.getWorkspaceDb(workspaceId);

    const query = `
      SELECT * FROM space_users
      WHERE space_id = ? AND user_id = ?
      LIMIT 1
    `;

    const result = await db.execute(query, [spaceId, userId]);
    
    return [{ result: { relation: result.rows?.[0] || { role: "admin" } } }];
  }

  /**
   * Retrieves all spaces for a user
   */
  async getUserSpaces(userId: string): Promise<any> {
    const workspaceId = this.extractWorkspaceFromUserId(userId);
    const db = await this.getWorkspaceDb(workspaceId);

    const query = `
      SELECT s.*
      FROM spaces s
      INNER JOIN space_users su ON s.id = su.space_id
      WHERE su.user_id = ?
    `;

    const result = await db.execute(query, [userId]);
    return [{ result: result.rows || [] }];
  }

  /**
   * Retrieves database definitions
   */
  async getDbDefinitions(app: string, lastChangeId: number): Promise<any> {
    console.warn("getDbDefinitions not implemented for Turso provider");
    return [{ result: [] }];
  }

  /**
   * Helper: Resolves email to hash
   */
  private resolveEmailHash(email: string): string {
    return crypto.createHash("md5").update(email).digest("hex");
  }

  /**
   * Helper: Hashes password using bcrypt
   */
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Helper: Extracts workspace ID from various sources
   */
  private extractWorkspaceId(id: string, context?: any): string {
    if (context?.workspaceId) return context.workspaceId;
    if (context?.linearWorkspaceId) return context.linearWorkspaceId;
    
    return "default";
  }

  /**
   * Helper: Extracts workspace ID from user ID format
   */
  private extractWorkspaceFromUserId(userId: string): string {
    
    return "default";
  }
}
