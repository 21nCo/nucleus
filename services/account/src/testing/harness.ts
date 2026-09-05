import { Hono } from "hono";
import type {
  AuthFnEvent
} from "authfn";
import type {
  AuthFnMultiRegionRegionConfig
} from "@authfn/multi-region";
import { createSearchProvider } from "@searchfn/datafn-provider";
import { MemoryAdapter } from "@searchfn/adapter-memory";
import { createMemoryRuntimeStores, memoryAdapter } from "@superfunctions/db/adapters/memory";
import type { Adapter, KVStoreAdapter } from "@superfunctions/db";
import { resolveNucleumDatafnSearchResourceFields } from "@nucleum/schema";
import { buildAccountServices, registerCoreRoutes } from "../app.js";
import {
  registerTestRoutes,
  type AccountTestControlSurface
} from "./routes.js";
import { createCapturingDeliveryProvider } from "./outbox.js";
import type { CapturingDeliveryProvider } from "./outbox.js";
import { createCapturedLogger } from "./logger.js";
import { createInMemoryRegionLookupStore } from "./memory-lookup.js";
import type { InMemoryRegionLookupStore } from "./memory-lookup.js";
import { createMockOAuthConfig, type MockOAuthConfig } from "./oauth.js";

export interface AccountTestHarness {
  app: Hono;
  database: Adapter;
  datafnDatabase: Adapter;
  cacheStore: KVStoreAdapter;
  delivery: CapturingDeliveryProvider;
  regionLookupStore: InMemoryRegionLookupStore;
  oauth: MockOAuthConfig;
  regions: AuthFnMultiRegionRegionConfig[];
  authEvents(): AuthFnEvent[];
  logEvents(): unknown[];
  reset(): Promise<void>;
}

export interface MultiRegionAccountTestHarness {
  regionLookupStore: InMemoryRegionLookupStore;
  regions: AuthFnMultiRegionRegionConfig[];
  primary: AccountTestHarness;
  secondary: AccountTestHarness;
  reset(): Promise<void>;
}

export function createAccountTestHarness(
  input: {
    regionId?: string;
    authority?: string;
    regions?: AuthFnMultiRegionRegionConfig[];
    regionLookupStore?: InMemoryRegionLookupStore;
    enableRateLimit?: boolean;
    corsOrigins?: string[];
  } = {}
): AccountTestHarness {
  const regionId = input.regionId ?? "local";
  const authority = input.authority ?? "http://127.0.0.1:8787";
  const regions = input.regions ?? [
    {
      regionId,
      authority,
      hosts: [new URL(authority).hostname],
      oauth: {
        google: {
          clientId: "test-google-client",
          scopes: ["openid", "email", "profile"]
        },
        apple: {
          clientId: "test-apple-client",
          scopes: ["name", "email"]
        }
      }
    }
  ];
  const database = memoryAdapter({ debug: false });
  const datafnDatabase = memoryAdapter({ debug: false });
  const stores = createMemoryRuntimeStores();
  const cacheStore = stores.kv!;
  const delivery = createCapturingDeliveryProvider();
  const regionLookupStore = input.regionLookupStore ?? createInMemoryRegionLookupStore();
  const logger = createCapturedLogger(`nucleus-account-test-${regionId}`);
  const oauth = createMockOAuthConfig({
    returnTo: [`${authority}/auth/callback`, `${authority}/`],
    redirectUris: [
      `${authority}/auth/social/callback/google`,
      `${authority}/auth/social/callback/apple`
    ]
  });
  const authEvents: AuthFnEvent[] = [];

  const control: AccountTestControlSurface = {
    getLatestOutboxMessage: (identifier) => delivery.latest(identifier),
    getEvents: () => [...authEvents, ...logger.events()],
    reset: async () => {
      delivery.clear();
      logger.clear();
      authEvents.length = 0;
      oauth.clear();
      if ("clear" in regionLookupStore && typeof regionLookupStore.clear === "function") {
        regionLookupStore.clear();
      }
      if ("close" in database && typeof database.close === "function") {
        await database.close();
      }
      if (
        "close" in datafnDatabase &&
        typeof datafnDatabase.close === "function"
      ) {
        await datafnDatabase.close();
      }
    }
  };

  const app = new Hono();
  const services = buildAccountServices({
    infra: {
      database,
      syncDatabase: datafnDatabase,
      stores,
      logger: logger.logger,
      syncSearchProvider: createSearchProvider(new MemoryAdapter(), {
        resourceFields: resolveNucleumDatafnSearchResourceFields()
      })
    },
    deployment: {
      regionId,
      regionLookupStore,
      regions,
      corsOrigins: input.corsOrigins
    },
    integrations: {
      delivery,
      oauthProviders: oauth.oauthProviders,
      oauthPlugin: oauth.oauthPlugin,
      authRateLimit: input.enableRateLimit === false ? false : undefined,
      syncRateLimit: input.enableRateLimit === false ? false : undefined,
      eventSink: (event) => {
        if (event.domain === "authfn") {
          authEvents.push(event);
        }
      }
    }
  });
  registerCoreRoutes(app, services);
  registerTestRoutes(app, control);

  return {
    app,
    database,
    datafnDatabase,
    cacheStore,
    delivery,
    regionLookupStore,
    oauth,
    regions,
    authEvents: () => authEvents.map((event) => ({ ...event })),
    logEvents: () => logger.events(),
    reset: async () => {
      await control.reset();
    }
  };
}

export function createMultiRegionAccountHarness(
  input: {
    primaryAuthority?: string;
    secondaryAuthority?: string;
  } = {}
): MultiRegionAccountTestHarness {
  const primaryAuthority = input.primaryAuthority ?? "http://us.account.test";
  const secondaryAuthority =
    input.secondaryAuthority ?? "http://eu.account.test";
  const regionLookupStore = createInMemoryRegionLookupStore();
  const regions: AuthFnMultiRegionRegionConfig[] = [
    {
      regionId: "us",
      authority: primaryAuthority,
      hosts: [new URL(primaryAuthority).hostname]
    },
    {
      regionId: "eu",
      authority: secondaryAuthority,
      hosts: [new URL(secondaryAuthority).hostname]
    }
  ];

  const primary = createAccountTestHarness({
    regionId: "us",
    authority: primaryAuthority,
    regions,
    regionLookupStore,
    enableRateLimit: false
  });
  const secondary = createAccountTestHarness({
    regionId: "eu",
    authority: secondaryAuthority,
    regions: [regions[1]!, regions[0]!],
    regionLookupStore,
    enableRateLimit: false
  });

  return {
    regionLookupStore,
    regions,
    primary,
    secondary,
    reset: async () => {
      await primary.reset();
      await secondary.reset();
      regionLookupStore.clear();
    }
  };
}
