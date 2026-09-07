import { describe, it, expect } from "vitest";
import { restore } from "./index";
import {
  BillingCycle,
  PlanType,
} from "@nucleum/schema/account/subscription";
import { ValidationError } from "../../errors";
import { performQueryOnMasterDb } from "$lib/server/surrealHelpers";

describe("restore", () => {
  it("should throw error when user plan not found", async () => {
    const invalidAgent = {
      ...global.testEnv.agent,
      id: "user:nonexistent",
    };

    await expect(restore({}, invalidAgent)).rejects.toThrow(ValidationError);
    await expect(restore({}, invalidAgent)).rejects.toThrow("User not found");
  });

  it("should return user if plan is already active", async () => {
    const result = await restore({}, global.testEnv.agent);
    console.log({ result });
    expect(result).toBeDefined();
    expect(result.userPlan.status).toBe("active");
  }, 10000);
});
