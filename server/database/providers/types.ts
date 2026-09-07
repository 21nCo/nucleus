import { IOAuthProviderConfig } from "$lib/server/common/oauth/oauth.type";
import {
  Agent,
  CONTEXT,
  IActivity
} from "$lib/server/common/account/account.type";
import { IUserProfileInfo } from "@nucleum/schema/account/profile.type";

export enum DatabaseProvider {
  SURREAL = "surreal",
  DYNAMODB = "dynamodb",
  TURSO = "turso"
}

export interface IDatabaseProviderConfig {
  provider: DatabaseProvider;
}

export interface IDatabaseProvider {
  // Activity logging
  log(userId: string, context: IActivity): Promise<any>;

  // User management
  createUserIfNotExists(
    userData: UserCreateData
  ): Promise<ICreateUserIfNotExistsResponse>;
  initializeUserDb(
    id: string,
    params: { scope: CONTEXT; host: string; region?: string }
  ): Promise<any>;
  getUserByEmail(email: string): Promise<any>;
  getUserById(userId: string): Promise<any>;
  bootstrapUser(userId: string, updates: any): Promise<any>;
  deleteUser(agent: Agent): Promise<any>;

  // Authentication
  authenticateUser(email: string, password: string): Promise<any>;

  // Beta list management
  checkBetaList(email: string, app: string): Promise<any>;

  // Guest management
  createGuest(guestData: GuestCreateData): Promise<any>;

  // User plan management
  createUserPlan(planData: UserPlanCreateData): Promise<any>;
  getUserAndPlan(userId: string): Promise<any>;

  // Product/App configuration
  getProductConfig(productId: string): Promise<IProductConfig | undefined>;

  // Subscription management
  createSubscription(subscriptionData: SubscriptionCreateData): Promise<any>;

  // Space management
  createSpace(name: string, userId: string): Promise<any>;
  getSpaceUser(spaceId: string, userId: string): Promise<any>;
  getUserSpaces(userId: string): Promise<any>;

  // Database definitions
  getDbDefinitions(app: string, lastChangeId: number): Promise<any>;
}

// Data interfaces
export interface UserCreateData {
  email: string;
  password?: string;
  nickName: string;
  profilePictureUrl?: string;
  guestId?: string;
  emailParts: any;
  joinDate: string;
  context: any;
  isOAuth?: boolean;
  oAuthId?: string;
}

export interface GuestCreateData {
  id: string;
  timestamp: string;
  context: any;
}

export interface UserPlanCreateData {
  id: string;
  userId: string;
  plan: string;
  trialPlan?: any;
  discount?: any;
}

export interface SubscriptionCreateData {
  email: string;
  app: string;
  context: string;
  productId: string;
}

export interface IProductConfig {
  id: string;
  name: string;
  oAuthConfig: IOAuthProviderConfig[];
  env?: any;
}

export interface ICreateUserIfNotExistsResponse {
  user: IUserProfileInfo | null;
  existingUserCount?: number;
  error?: string;
}
