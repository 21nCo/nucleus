import { describe, it, expect } from "vitest";
import { subscribe } from "./index";
import {
  BillingCycle,
  PlanType
} from "@21n/shared-types/subscription.type";
import { ValidationError } from "../../errors";

const product = "memotron";
const billing = {
  city: "Hyderabad",
  country: "IN",
  state: "Telangana",
  street: "street",
  zipcode: "500085",
  email: "test@21n.org",
  name: "user"
};

describe("subscribe", () => {
  it("should throw error when no body is provided", async () => {
    await expect(subscribe(null, global.testEnv.agent)).rejects.toThrow(
      ValidationError
    );
    await expect(subscribe(null, global.testEnv.agent)).rejects.toThrow(
      "No body provided"
    );
  });

  it(
    "should create a payment - cloud sync yearly",
    async () => {
      const subscriptionData = {
        plan: PlanType.CLOUD_SYNC,
        cycle: BillingCycle.YEARLY,
        product,
        billing,
        context: {
          origin: "https://21n.org"
        }
      };

      const result = await subscribe(subscriptionData, global.testEnv.agent);

      expect(result).toBeDefined();
    },
    { timeout: 30000 }
  );

  it.only(
    "should create a payment - cloud sync yearly - embed",
    async () => {
      const subscriptionData = {
        plan: PlanType.CLOUD_SYNC,
        cycle: BillingCycle.YEARLY,
        product,
        billing,
        provider: "apple",
        context: {
          origin: "https://21n.org"
        }
      };

      const result = await subscribe(subscriptionData, global.testEnv.agent);

      expect(result).toBeDefined();
    },
    { timeout: 30000 }
  );

  it(
    "should create a payment - cloud sync monthly",
    async () => {
      const subscriptionData = {
        plan: PlanType.CLOUD_SYNC,
        cycle: BillingCycle.MONTHLY,
        product,
        billing,
        context: {
          origin: "https://21n.org"
        }
      };

      const result = await subscribe(subscriptionData, global.testEnv.agent);

      expect(result).toBeDefined();
    },
    { timeout: 30000 }
  );

  it(
    "should create a payment - nucleus yearly",
    async () => {
      const subscriptionData = {
        plan: PlanType.NUCLEUS,
        cycle: BillingCycle.YEARLY,
        billing,
        context: {
          origin: "https://21n.org"
        }
      };

      const result = await subscribe(subscriptionData, global.testEnv.agent);

      expect(result).toBeDefined();
    },
    { timeout: 30000 }
  );

  it(
    "should create a payment - nucleus lifetime",
    async () => {
      const subscriptionData = {
        plan: PlanType.NUCLEUS,
        cycle: BillingCycle.LIFETIME,
        billing,
        context: {
          origin: "https://21n.org"
        }
      };

      const result = await subscribe(subscriptionData, global.testEnv.agent);

      expect(result).toBeDefined();
    },
    { timeout: 30000 }
  );

  it("should throw error when plan is missing", async () => {
    const invalidData = {
      cycle: BillingCycle.MONTHLY
    };

    await expect(subscribe(invalidData, global.testEnv.agent)).rejects.toThrow(
      ValidationError
    );
    await expect(subscribe(invalidData, global.testEnv.agent)).rejects.toThrow(
      "No plan provided"
    );
  });

  it("should throw error when cycle is missing", async () => {
    const invalidData = {
      plan: PlanType.CLOUD_SYNC
    };

    await expect(subscribe(invalidData, global.testEnv.agent)).rejects.toThrow(
      ValidationError
    );
    await expect(subscribe(invalidData, global.testEnv.agent)).rejects.toThrow(
      "No cycle provided"
    );
  });

  it("should handle non-existent user", async () => {
    const invalidAgent = {
      ...global.testEnv.agent,
      id: "user:nonexistent"
    };

    const subscriptionData = {
      plan: PlanType.CLOUD_SYNC,
      cycle: BillingCycle.MONTHLY
    };

    await expect(subscribe(subscriptionData, invalidAgent)).rejects.toThrow(
      ValidationError
    );
    await expect(subscribe(subscriptionData, invalidAgent)).rejects.toThrow(
      "User not found"
    );
  });
});
