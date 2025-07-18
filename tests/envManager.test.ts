import Ajv from "ajv";
import dotenv from "dotenv";
import fs from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { validateEnv } from "../src/utils/envValidator";

// Mock the external modules
vi.mock("node:fs");
vi.mock("dotenv");
vi.mock("ajv");

describe("validateEnv", () => {
  const mockSchema = {
    type: "object",
    properties: {
      API_KEY: { type: "string" },
    },
    required: ["API_KEY"],
  };

  const mockEnvConfig = {
    API_KEY: "test-key",
  };

  beforeEach(() => {
    // Reset all mocks before each test
    vi.resetAllMocks();

    // Setup default mock implementations
    // Convert objects to strings when mocking readFileSync
    vi.mocked(fs.readFileSync).mockImplementation(
      (path: fs.PathOrFileDescriptor) => {
        if (path === "./schema.json") {
          return JSON.stringify(mockSchema);
        } else {
          return JSON.stringify(mockEnvConfig);
        }
      },
    );

    vi.mocked(dotenv.parse).mockReturnValue(mockEnvConfig);

    // Mock Ajv implementation
    const mockValidate = vi.fn().mockReturnValue(true);
    vi.mocked(Ajv).mockImplementation(
      () =>
        ({
          compile: () => mockValidate,
        }) as any,
    )(mockValidate as any).errors = null;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should validate environment successfully", () => {
    const consoleSpy = vi.spyOn(console, "log");
    const envConfig = validateEnv("./.env.mock");

    expect(consoleSpy).toHaveBeenCalledWith(
      "Environment validated successfully",
    );
    expect(envConfig).toEqual(mockEnvConfig);
    // expect(fs.readFileSync).toHaveBeenCalledTimes(1)
    expect(dotenv.parse).toHaveBeenCalledTimes(1);
  });

  it("should exit process when validation fails", () => {
    const mockValidate = vi.fn().mockReturnValue(false) as any;
    mockValidate.errors = [
      { instancePath: "/API_KEY", message: "is required" },
    ];

    vi.mocked(Ajv).mockImplementation(
      () =>
        ({
          compile: () => mockValidate,
        }) as any,
    );

    const processExitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation(() => undefined as never);
    const consoleErrorSpy = vi.spyOn(console, "error");

    validateEnv("./.env.mock");

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Invalid environment file: Field /API_KEY is required",
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });
});
