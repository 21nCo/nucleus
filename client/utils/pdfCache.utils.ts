import { logger } from "@nucleum/client/runtime/logging/logger";

const CACHE_NAME = "pdf-cache-v1";
const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_CACHE_SIZE_MB = 100;
const MAX_CACHE_SIZE_BYTES = MAX_CACHE_SIZE_MB * 1024 * 1024;

interface ICacheMetadata {
  timestamp: number;
  size: number;
}

class PdfCache {
  private isSupported: boolean;

  constructor() {
    this.isSupported = typeof caches !== "undefined";
    if (!this.isSupported) {
      logger.warn({
        at: "PdfCache.constructor",
        message: "Cache API not supported in this browser"
      });
    }
  }

  private getCacheKey(url: string): Request {
    return new Request(url, { method: "GET" });
  }

  private isCacheableUrl(url: string): boolean {
    try {
      const baseUrl =
        typeof location !== "undefined" ? location.href : "http://localhost";
      const protocol = new URL(url, baseUrl).protocol;
      return protocol === "http:" || protocol === "https:";
    } catch {
      return false;
    }
  }

  private getMetadataKey(url: string): Request {
    const metadataUrl = new URL(url);
    metadataUrl.searchParams.set("_cache_metadata", "true");
    return new Request(metadataUrl.toString(), { method: "GET" });
  }

  private async getMetadata(url: string): Promise<ICacheMetadata | null> {
    if (!this.isCacheableUrl(url)) return null;

    try {
      const cache = await caches.open(CACHE_NAME);
      const response = await cache.match(this.getMetadataKey(url));

      if (!response) return null;

      return await response.json();
    } catch (error) {
      logger.error({ at: "PdfCache.getMetadata", error });
      return null;
    }
  }

  private async setMetadata(
    url: string,
    metadata: ICacheMetadata
  ): Promise<void> {
    if (!this.isCacheableUrl(url)) return;

    try {
      const cache = await caches.open(CACHE_NAME);
      const response = new Response(JSON.stringify(metadata), {
        headers: { "Content-Type": "application/json" }
      });

      await cache.put(this.getMetadataKey(url), response);
    } catch (error) {
      logger.error({ at: "PdfCache.setMetadata", error });
    }
  }

  async get(url: string): Promise<Uint8Array | null> {
    if (!this.isSupported) return null;
    if (!this.isCacheableUrl(url)) return null;

    try {
      const cache = await caches.open(CACHE_NAME);
      const cacheKey = this.getCacheKey(url);
      const response = await cache.match(cacheKey);

      if (!response) {
        logger.log({ at: "PdfCache.get", message: "Cache miss", url });
        return null;
      }

      const metadata = await this.getMetadata(url);
      if (metadata) {
        const age = Date.now() - metadata.timestamp;
        if (age > CACHE_EXPIRY_MS) {
          logger.log({
            at: "PdfCache.get",
            message: "Cache expired",
            url,
            age
          });
          await this.delete(url);
          return null;
        }

        logger.log({
          at: "PdfCache.get",
          message: "Cache hit",
          url,
          size: metadata.size,
          age: Math.round(age / 1000 / 60) + " minutes"
        });
      }

      const arrayBuffer = await response.arrayBuffer();
      return new Uint8Array(arrayBuffer);
    } catch (error) {
      logger.error({ at: "PdfCache.get", error, url });
      return null;
    }
  }

  async set(url: string, data: Uint8Array): Promise<void> {
    if (!this.isSupported) return;
    if (!this.isCacheableUrl(url)) return;

    try {
      const cache = await caches.open(CACHE_NAME);
      const cacheKey = this.getCacheKey(url);

      const cacheData = new Uint8Array(data.byteLength);
      cacheData.set(data);

      const response = new Response(cacheData, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Length": data.length.toString()
        }
      });

      await cache.put(cacheKey, response);

      await this.setMetadata(url, {
        timestamp: Date.now(),
        size: data.length
      });

      logger.log({
        at: "PdfCache.set",
        message: "PDF cached",
        url,
        size: data.length
      });

      await this.cleanupOldEntries();
      await this.enforceMaxSize();
    } catch (error) {
      logger.error({ at: "PdfCache.set", error, url });
    }
  }

  async delete(url: string): Promise<void> {
    if (!this.isSupported) return;
    if (!this.isCacheableUrl(url)) return;

    try {
      const cache = await caches.open(CACHE_NAME);
      await cache.delete(this.getCacheKey(url));
      await cache.delete(this.getMetadataKey(url));
      logger.log({
        at: "PdfCache.delete",
        message: "Cache entry deleted",
        url
      });
    } catch (error) {
      logger.error({ at: "PdfCache.delete", error, url });
    }
  }

  async clear(): Promise<void> {
    if (!this.isSupported) return;

    try {
      await caches.delete(CACHE_NAME);
      logger.info({
        at: "PdfCache.clear",
        message: "All cache entries cleared"
      });
    } catch (error) {
      logger.error({ at: "PdfCache.clear", error });
    }
  }

  async getStats(): Promise<{
    count: number;
    totalSize: number;
    oldestEntry: number | null;
  }> {
    if (!this.isSupported) {
      return { count: 0, totalSize: 0, oldestEntry: null };
    }

    try {
      const cache = await caches.open(CACHE_NAME);
      const requests = await cache.keys();

      const pdfRequests = requests.filter(
        (req) => !req.url.includes("_cache_metadata=true")
      );

      let totalSize = 0;
      let oldestTimestamp: number | null = null;

      for (const req of pdfRequests) {
        const metadata = await this.getMetadata(req.url);

        if (metadata) {
          totalSize += metadata.size;
          if (!oldestTimestamp || metadata.timestamp < oldestTimestamp) {
            oldestTimestamp = metadata.timestamp;
          }
        }
      }

      return {
        count: pdfRequests.length,
        totalSize,
        oldestEntry: oldestTimestamp
      };
    } catch (error) {
      logger.error({ at: "PdfCache.getStats", error });
      return { count: 0, totalSize: 0, oldestEntry: null };
    }
  }

  private async cleanupOldEntries(): Promise<void> {
    if (!this.isSupported) return;

    try {
      const cache = await caches.open(CACHE_NAME);
      const requests = await cache.keys();
      const now = Date.now();
      let deletedCount = 0;

      for (const req of requests) {
        if (!req.url.includes("_cache_metadata=true")) {
          const metadata = await this.getMetadata(req.url);

          if (metadata && now - metadata.timestamp > CACHE_EXPIRY_MS) {
            await this.delete(req.url);
            deletedCount++;
          }
        }
      }

      if (deletedCount > 0) {
        logger.info({
          at: "PdfCache.cleanupOldEntries",
          message: `Cleaned up ${deletedCount} expired entries`
        });
      }
    } catch (error) {
      logger.error({ at: "PdfCache.cleanupOldEntries", error });
    }
  }

  private async enforceMaxSize(): Promise<void> {
    if (!this.isSupported) return;

    try {
      const stats = await this.getStats();

      if (stats.totalSize > MAX_CACHE_SIZE_BYTES) {
        const cache = await caches.open(CACHE_NAME);
        const requests = await cache.keys();

        const pdfRequests = requests.filter(
          (req) => !req.url.includes("_cache_metadata=true")
        );

        const entries = await Promise.all(
          pdfRequests.map(async (req) => ({
            url: req.url,
            metadata: await this.getMetadata(req.url)
          }))
        );

        entries.sort(
          (a, b) => (a.metadata?.timestamp || 0) - (b.metadata?.timestamp || 0)
        );

        let currentSize = stats.totalSize;
        for (const entry of entries) {
          if (currentSize <= MAX_CACHE_SIZE_BYTES * 0.8) break;

          await this.delete(entry.url);
          currentSize -= entry.metadata?.size || 0;
        }

        logger.info({
          at: "PdfCache.enforceMaxSize",
          message: `Reduced cache from ${Math.round(stats.totalSize / 1024 / 1024)}MB to ${Math.round(currentSize / 1024 / 1024)}MB`
        });
      }
    } catch (error) {
      logger.error({ at: "PdfCache.enforceMaxSize", error });
    }
  }
}

export const pdfCache = new PdfCache();
