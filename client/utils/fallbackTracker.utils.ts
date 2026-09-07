import { clientStorage } from "@nucleum/persistence/persistence.utils";
import { ClientStorageKey } from "@nucleum/persistence/persistence.type";
import { logger } from "@nucleum/client/runtime/logging/logger";
import { parse } from "@21n/shared-utils/json.utils";

interface FallbackRunStatus {
  [fallbackName: string]: {
    hasRun: boolean;
    lastRunAt: string;
    version?: string;
  };
}

/**
 * Utility class for tracking fallback function execution status
 *
 * This class helps prevent re-running fallback functions that have already been executed
 * by storing their completion status in localStorage. This is useful for migration scripts,
 * data corrections, and other one-time operations that should not be repeated.
 *
 * @example
 * ```typescript
 * // Run a fallback only if it hasn't been completed before
 * await FallbackTracker.runIfNotCompleted("myFallback", async () => {
 *   // Your fallback logic here
 *   console.log("Running fallback...");
 * });
 *
 * // Check if a fallback has been run
 * const hasRun = await FallbackTracker.hasRun("myFallback");
 *
 * // Reset a fallback to force re-run
 * await FallbackTracker.reset("myFallback");
 * ```
 */
export class FallbackTracker {
  private static async getFallbackStatus(): Promise<FallbackRunStatus> {
    try {
      const status = await clientStorage.get(
        ClientStorageKey.FALLBACKS_RUN_STATUS
      );
      return status ? parse(status) : {};
    } catch (error) {
      logger.error({ at: "FallbackTracker.getFallbackStatus", error });
      return {};
    }
  }

  private static async saveFallbackStatus(
    status: FallbackRunStatus
  ): Promise<void> {
    try {
      await clientStorage.set(ClientStorageKey.FALLBACKS_RUN_STATUS, status);
    } catch (error) {
      logger.error({ at: "FallbackTracker.saveFallbackStatus", error });
    }
  }

  /**
   * Check if a fallback has already been run
   */
  static async hasRun(fallbackName: string): Promise<boolean> {
    const status = await this.getFallbackStatus();
    return status[fallbackName]?.hasRun === true;
  }

  /**
   * Mark a fallback as completed
   */
  static async markAsRun(
    fallbackName: string,
    version?: string
  ): Promise<void> {
    const status = await this.getFallbackStatus();
    status[fallbackName] = {
      hasRun: true,
      lastRunAt: new Date().toISOString(),
      version
    };
    await this.saveFallbackStatus(status);
    logger.info({ at: "FallbackTracker.markAsRun", fallbackName, version });
  }

  /**
   * Reset a specific fallback status (useful for testing or forced re-runs)
   */
  static async reset(fallbackName: string): Promise<void> {
    const status = await this.getFallbackStatus();
    delete status[fallbackName];
    await this.saveFallbackStatus(status);
    logger.info({ at: "FallbackTracker.reset", fallbackName });
  }

  /**
   * Reset all fallback statuses
   */
  static async resetAll(): Promise<void> {
    await clientStorage.remove(ClientStorageKey.FALLBACKS_RUN_STATUS);
    logger.info({ at: "FallbackTracker.resetAll" });
  }

  /**
   * Get all fallback run statuses
   */
  static async getAll(): Promise<FallbackRunStatus> {
    return this.getFallbackStatus();
  }

  /**
   * Wrapper function to run a fallback only if it hasn't been run before
   */
  static async runIfNotCompleted(
    fallbackName: string,
    fallbackFunction: () => Promise<void>,
    version?: string
  ): Promise<number> {
    const hasAlreadyRun = await this.hasRun(fallbackName);

    if (hasAlreadyRun) {
      logger.info({
        at: "FallbackTracker.runIfNotCompleted",
        fallbackName,
        message: "Skipping - already completed"
      });
      return 0;
    }

    try {
      logger.info({
        at: "FallbackTracker.runIfNotCompleted",
        fallbackName,
        message: "Running fallback"
      });

      await fallbackFunction();
      await this.markAsRun(fallbackName, version);
      logger.info({
        at: "FallbackTracker.runIfNotCompleted",
        fallbackName,
        message: "Completed successfully"
      });
      return 1;
    } catch (error) {
      logger.error({
        at: "FallbackTracker.runIfNotCompleted",
        fallbackName,
        error,
        message: "Failed to run fallback"
      });
      throw error;
    }
  }
}
