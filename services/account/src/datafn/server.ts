import {
  createDatafnPublicLinksPlugin,
  datafnMultiRegionPlugin,
  datafn,
  type DatafnApp,
  type DataFnAction,
  type DatafnPublicLinksPlugin,
  type DatafnPublicLinkPrincipal,
  type RateLimitConfig,
  type DatafnServer,
  type SearchProvider
} from '@datafn/server';
import type { AuthFnSession } from 'authfn';
import type { Adapter, RuntimeStores } from '@superfunctions/db';
import type { SuperfunctionObservability } from '@superfunctions/observability';
import { nucleumDatafnSchema } from '@nucleum/schema/datafn';
import { createSyncSearchProvider } from './search-provider.js';
import { resolveAccountUserNamespace } from './namespace.js';
import { readPositiveIntegerEnv } from './env.js';

export {
  resolveAccountUserNamespace,
  resolveAccountUserPrincipal
} from './namespace.js';

export interface SyncContext {
  request: Request;
  session: AuthFnSession | null;
  publicLink: DatafnPublicLinkPrincipal | null;
  regionId?: string;
}

export interface SyncAuthProvider {
  authenticate(request: Request): Promise<AuthFnSession | null> | AuthFnSession | null;
  authorizeMutation(request: Request): Promise<AuthFnSession>;
}

export interface CreateSyncServerInput {
  auth: SyncAuthProvider;
  database: Adapter;
  stores?: RuntimeStores;
  rateLimit?: false | RateLimitConfig<SyncContext>;
  regionId?: string;
  observability?: SuperfunctionObservability;
  searchProvider?: SearchProvider;
}

export type SyncServer = DatafnServer<SyncContext>;

/**
 * Sync app declaration with public-link plugin access.
 */
export interface SyncApp extends DatafnApp {
  publicLinks: DatafnPublicLinksPlugin<AuthFnSession>;
}

/**
 * Declares the account-service sync app for codegen and runtime use.
 */
export function sync(): SyncApp {
  const publicLinks = createDatafnPublicLinksPlugin<AuthFnSession>({
    getOwnerActorId: (session) => session.actorId,
    getOwnerNamespace: (actorId) => resolveAccountUserNamespace(actorId)
  });
  return Object.assign(datafn({
    schema: nucleumDatafnSchema,
    plugins: [publicLinks]
  }), { publicLinks });
}

export const syncApp = sync();

export function createSyncServer(
  input: CreateSyncServerInput
): Promise<SyncServer> {
  const app = syncApp;
  const runtimePublicLinks = createDatafnPublicLinksPlugin<AuthFnSession>({
    authenticateOwner: (request) => authorizeMutationRequest(input.auth, request),
    getOwnerActorId: (session) => session.actorId,
    getOwnerNamespace: (actorId) => resolveAccountUserNamespace(actorId),
    directory: input.stores?.directory,
    resourceRegion: input.regionId ?? process.env.ACCOUNT_REGION_ID
  });
  const runtimePlugins = [
    runtimePublicLinks,
    ...(input.stores?.directory && (input.regionId ?? process.env.ACCOUNT_REGION_ID)
      ? [
          datafnMultiRegionPlugin({
            regionId: input.regionId ?? process.env.ACCOUNT_REGION_ID ?? 'default',
            directory: input.stores.directory
          })
        ]
      : [])
  ];
  const publicLinks = runtimePublicLinks;
  return app.createServer<SyncContext>({
    database: input.database,
    stores: input.stores,
    plugins: runtimePlugins,
    searchProvider: input.searchProvider ?? createSyncSearchProvider({
      observability: input.observability,
      regionId: input.regionId ?? process.env.ACCOUNT_REGION_ID
    }),
    allowUnknownResources: false,
    context: async (request) => {
      const publicLinkToken = publicLinks.readToken(request);
      const publicLink = publicLinkToken
        ? await publicLinks.resolve(input.database, publicLinkToken)
        : null;
      const session = publicLinkToken
        ? null
        : await input.auth.authenticate(request);
      return {
        request,
        session,
        publicLink,
        regionId: input.regionId ?? process.env.ACCOUNT_REGION_ID
      };
    },
    authorize: async (ctx, action) => {
      if (ctx.session) {
        if (!MUTATING_DATAFN_ACTIONS.has(action)) return true;
        return Boolean(await authorizeMutationRequest(input.auth, ctx.request));
      }
      if (!ctx.publicLink) return false;
      return true;
    },
    namespaceProvider: {
      getNamespace: (ctx) => {
        if (ctx.publicLink) {
          return ctx.publicLink.namespace;
        }
        const actorId = requireActorId(ctx);
        return resolveAccountUserNamespace(actorId);
      },
      getActorId: (ctx) => ctx.publicLink?.actorId ?? requireActorId(ctx)
    },
    limits: {
      maxPayloadBytes:
        readPositiveIntegerEnv('DATAFN_MAX_PAYLOAD_BYTES') ?? 5_242_880
    },
    rateLimit: input.rateLimit === false
      ? undefined
      : input.rateLimit ?? createDefaultRateLimit(input.stores),
    routeHooks: (input.regionId ?? process.env.ACCOUNT_REGION_ID)
      ? {
          headers: {
            'x-datafn-region': input.regionId ?? process.env.ACCOUNT_REGION_ID ?? ''
          }
        }
      : undefined,
    observability: input.observability
  });
}

function createDefaultRateLimit(
  stores: RuntimeStores | undefined
): RateLimitConfig<SyncContext> {
  const cloneMaxRequests =
    readPositiveIntegerEnv('DATAFN_RATE_LIMIT_CLONE_MAX_REQUESTS') ?? 20;
  const cloneWindowSeconds =
    readPositiveIntegerEnv('DATAFN_RATE_LIMIT_CLONE_WINDOW_SECONDS') ?? 60;

  return {
    enabled: true,
    mode: stores?.atomicKv ? 'strict' : stores?.kv ? 'best-effort' : 'local',
    maxRequests: 120,
    windowSeconds: 60,
    endpoints: {
      query: { maxRequests: 120, windowSeconds: 60 },
      search: { maxRequests: 60, windowSeconds: 60 },
      mutation: { maxRequests: 60, windowSeconds: 60 },
      transact: { maxRequests: 30, windowSeconds: 60 },
      push: { maxRequests: 60, windowSeconds: 60 },
      pull: { maxRequests: 120, windowSeconds: 60 },
      clone: {
        maxRequests: cloneMaxRequests,
        windowSeconds: cloneWindowSeconds
      },
      reconcile: { maxRequests: 60, windowSeconds: 60 },
      seed: { maxRequests: 10, windowSeconds: 60 }
    }
  };
}

export default syncApp;

function requireActorId(ctx: SyncContext): string {
  const actorId = ctx.session?.actorId;
  if (!actorId) {
    throw new Error('AuthFn session actor is required');
  }
  return actorId;
}

const MUTATING_DATAFN_ACTIONS = new Set<DataFnAction>([
  'mutation',
  'transact',
  'seed',
  'push',
  'reconcile'
]);

async function authorizeMutationRequest(
  auth: SyncAuthProvider,
  request: Request
): Promise<AuthFnSession | null> {
  try {
    return await auth.authorizeMutation(request);
  } catch {
    return null;
  }
}
