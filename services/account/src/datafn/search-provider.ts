import { createSearchProvider } from '@searchfn/datafn-provider';
import { OpenSearchAdapter } from '@searchfn/adapter-opensearch';
import type { SuperfunctionObservability } from '@superfunctions/observability';
import {
  nucleumDatafnSearchDefaults,
  resolveNucleumDatafnSearchResourceFields
} from '@nucleum/schema';
import {
  readNonNegativeIntegerEnv,
  readPositiveIntegerEnv
} from './env.js';

/** Dependencies used to create account-service search integration. */
export interface CreateSyncSearchProviderInput {
  observability?: SuperfunctionObservability;
  regionId?: string;
}

/** Creates the account-service Sync SearchProvider when OpenSearch is configured. */
export function createSyncSearchProvider(
  input: CreateSyncSearchProviderInput
) {
  const node = process.env.DATAFN_OPENSEARCH_URL?.trim();
  if (!node) {
    return undefined;
  }
  requireSecureOpenSearchUrl(node);
  const apiKey = process.env.DATAFN_OPENSEARCH_API_KEY;
  const username = process.env.DATAFN_OPENSEARCH_USERNAME;
  const password = process.env.DATAFN_OPENSEARCH_PASSWORD;
  const indexPrefix =
    process.env.DATAFN_OPENSEARCH_INDEX_PREFIX ??
    ['nucleum', process.env.NODE_ENV ?? 'dev', input.regionId ?? 'default']
      .join('_')
      .replace(/[^a-z0-9_]/gi, '_')
      .toLowerCase();
  const auth = apiKey
    ? { apiKey }
    : username && password
      ? { username, password }
      : undefined;
  const logger = input.observability?.child({
    component: 'searchfn.opensearch'
  }).logger;

  return createSearchProvider(
    new OpenSearchAdapter({
      node,
      auth,
      indexPrefix,
      defaults: nucleumDatafnSearchDefaults,
      requestTimeoutMs:
        readPositiveIntegerEnv('DATAFN_OPENSEARCH_REQUEST_TIMEOUT_MS') ??
        30_000,
      retry: {
        maxRetries:
          readNonNegativeIntegerEnv('DATAFN_OPENSEARCH_MAX_RETRIES') ?? 2,
        baseDelayMs:
          readPositiveIntegerEnv('DATAFN_OPENSEARCH_RETRY_BASE_MS') ?? 100,
        maxDelayMs:
          readPositiveIntegerEnv('DATAFN_OPENSEARCH_RETRY_MAX_MS') ?? 5_000
      },
      logger: logger
        ? {
            debug: (message, context) => logger.debug?.(message, context),
            warn: (message, context) => logger.warn?.(message, context),
            error: (message, context) => logger.error?.(message, context)
          }
        : undefined
    }),
    {
      resourceFields: resolveNucleumDatafnSearchResourceFields(),
      observability: input.observability
    }
  );
}

function requireSecureOpenSearchUrl(value: string): void {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('DATAFN_OPENSEARCH_URL must be a valid URL');
  }
  if (url.protocol !== 'https:' && !isLoopbackHttpUrl(url)) {
    throw new Error(
      'DATAFN_OPENSEARCH_URL must use HTTPS unless it targets local loopback'
    );
  }
}

function isLoopbackHttpUrl(url: URL): boolean {
  return url.protocol === 'http:'
    && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
}
