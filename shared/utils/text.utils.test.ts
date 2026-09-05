import { describe, expect, it } from "vitest";

import { Resource } from "@nucleum/schema/resource.enum";
import type { EmailParts } from "@21n/types/account.type";
import type { IMarkdown } from "@21n/components/markdown/md.type";
import { Display } from "@21n/types/view.type";
import { Size } from "@21n/types/size.enum";

import {
  determineTruncateLength,
  enumToCamelCase,
  enumToString,
  formatBytes,
  frameEmailFromParts,
  isValidDataString,
  isValidEmail,
  isValidEnumValue,
  isValidMarkdown,
  isValidNumber,
  isValidParentDomain,
  isValidString,
  prefix,
  prefixTable,
  properCase,
  stripTablePrefix,
  textIsCode,
  truncateString
} from "@21n/shared-utils/text.utils";

describe("text utils", () => {
  it("properCase capitalizes only the first character", () => {
    expect(properCase("hELLO WORLD")).toBe("Hello world");
    expect(properCase("")).toBe("");
  });

  it("builds and strips table prefixes", () => {
    const prefixed = prefixTable("123", Resource.collection);

    expect(prefixed).toBe("collection:123");
    expect(stripTablePrefix(prefixed)).toBe("123");
  });

  it("attaches arbitrary prefixes to strings", () => {
    expect(prefix("value", "pre-")).toBe("pre-value");
  });

  it("validates email and parent domain formats", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
    expect(isValidEmail("invalid@")).toBe(false);
    expect(isValidParentDomain("example.co.uk")).toBe(true);
    expect(isValidParentDomain("http://example.com")).toBe(false);
  });

  it("frames email parts into a truncated address", () => {
    const parts: EmailParts = {
      characterCount: 12,
      emailDomain: "example.com",
      firstFew: "user",
      lastFew: "mail"
    };

    expect(frameEmailFromParts(parts)).toBe("user...mail@example.com");
  });

  it("validates markdown payloads", () => {
    const validMarkdown: IMarkdown = {
      blocks: [{ id: "1", body: "hello", contentType: "TEXT" as any }]
    };
    const invalidMarkdown: IMarkdown = { blocks: [] };

    expect(isValidMarkdown(validMarkdown)).toBe(true);
    expect(isValidMarkdown(invalidMarkdown)).toBe(false);
  });

  it("accepts only meaningful strings", () => {
    expect(isValidString("value")).toBe("value");
    expect(isValidString("null")).toBeUndefined();
    expect(isValidString(undefined)).toBeUndefined();
  });

  it("identifies numeric strings and numbers", () => {
    expect(isValidNumber(42)).toBe(true);
    expect(isValidNumber(" 10.5 ")).toBe(true);
    expect(isValidNumber("abc")).toBe(false);
    expect(isValidNumber({} as any)).toBe(false);
  });

  it("checks membership within enum values", () => {
    expect(isValidEnumValue(Resource.collection, Resource)).toBe(true);
    expect(isValidEnumValue("missing", Resource)).toBe(false);
  });

  it("detects valid ISO date strings", () => {
    expect(isValidDataString("2024-01-01T00:00:00Z")).toBe(true);
    expect(isValidDataString("not a date")).toBe(false);
  });

  it("truncates and annotates long strings", () => {
    expect(truncateString("abcdef", 4)).toBe("abcd...");
    expect(truncateString("abc", 10)).toBe("abc");
    expect(truncateString("abc", undefined)).toBe("abc");
  });

  it("converts enum text to readable formats", () => {
    expect(enumToString("HELLO_WORLD")).toBe("Hello world");
    expect(enumToString("snake-case", false)).toBe("snake case");
    expect(enumToCamelCase("HELLO_WORLD")).toBe("helloWorld");
  });

  it("derives truncate length from display and size", () => {
    expect(determineTruncateLength(Display.MO, Size.sm)).toBe(8);
    expect(determineTruncateLength(Display.TP, Size.lg)).toBe(40);
    expect(determineTruncateLength(Display.UW, Size.md)).toBe(12);
  });

  it("formats byte counts into human readable strings", () => {
    expect(formatBytes(0)).toBe("0 Bytes");
    expect(formatBytes(1024)).toBe("1 KB");
    expect(formatBytes(10_485_760, 1)).toBe("10 MB");
  });

  it("detects code-like text", () => {
    const codeSample = `function greet() {\n  if (true) {\n    return "hi";\n  }\n}`;
    const prose = "This is a regular sentence about the weather.";

    expect(textIsCode(codeSample)).toBe(true);
    expect(textIsCode(prose)).toBe(false);
  });
});
