import { describe, it, expect, beforeEach } from "vitest";
import { modify } from "./index";
import {
  BillingCycle,
  PlanType
} from "@21n/shared-types/subscription.type";
import { ValidationError } from "../../errors";

describe("modify", () => {
  beforeEach(() => {
    process.env.PARTIAL_REFUND_AVAILABLE = "false";
  });

  describe("input validation", () => {
    it("should throw error when no body type is provided", async () => {
      const body = {} as any;
      await expect(modify(body, global.testEnv.agent)).rejects.toThrow(
        ValidationError
      );
    });

    it("should throw error when invalid type is provided", async () => {
      const body = { type: "invalid" } as any;
      await expect(modify(body, global.testEnv.agent)).rejects.toThrow(
        ValidationError
      );
    });
  });

  describe("cancel subscription", () => {
    // it("should throw error when no active subscription found", async () => {
    //   await expect(
    //     modify({ type: "cancel" }, global.testEnv.agent)
    //   ).rejects.toThrow("No active subscription found");
    // });

    it(
      "should cancel subscription successfully",
      async () => {
        const result = await modify({ type: "cancel" }, global.testEnv.agent);

        expect(result).toEqual({
          status: "success",
          message: "Subscription cancelled successfully"
        });
      },
      { timeout: 30000 }
    );
  });

  describe("sync", () => {
    it.only("should sync the subscription status", async () => {
      const result = await modify({ type: "sync" }, global.testEnv.agent);
      expect(result).toBeDefined();
    });
  });

  describe("switch plan", () => {
    it(
      "should switch to a new plan",
      async () => {
        const body = {
          type: "switch" as const,
          plan: PlanType.CLOUD_SYNC,
          cycle: BillingCycle.YEARLY,
          billing: {
            city: "Test City",
            country: "US",
            state: "CA",
            street: "123 Test St",
            zipcode: "12345",
            email: "test@example.com",
            name: "Test User"
          }
        };

        const result = await modify(body, global.testEnv.agent);
        expect(result).toBeDefined();
      },
      { timeout: 30000 }
    );
  });
});
