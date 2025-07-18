import dotenv from "dotenv";
import fs from "node:fs";
import { ofetch } from "ofetch";
import { logError } from "../utils/logger";

export interface EnvConfig {
  APP_ENV?: string;
  APP_NAME?: string;
  API_KEY?: string;
  GITHUB_TOKEN?: string;
}

const defaultEnv = {
  APP_ENV: "development",
  APP_NAME: "actorCLI",
  API_KEY: process.env.API_KEY || "",
  GITHUB_TOKEN: process.env.GITHUB_TOKEN || "",
} as EnvConfig;

export const loadEnv = async (envPath: string): Promise<void> => {
  if (!envPath) {
    throw new Error("Environment file path is required");
  }

  try {
    // Validate file exists and is readable
    await fs.promises.access(envPath, fs.constants.R_OK);

    // Read and parse environment file
    const envFile = await fs.promises.readFile(envPath, "utf8");
    const customEnv = envFile ? dotenv.parse(envFile) : {};

    // Validate custom environment variables
    if (typeof customEnv !== "object") {
      throw new Error("Invalid environment file format");
    }

    // Merge with default environment, custom values take precedence
    const mergedEnv: Record<string, string> = {
      ...defaultEnv,
      ...Object.fromEntries(
        Object.entries(customEnv).filter(([, value]) => value != null),
      ),
    };

    // Set environment variables
    Object.entries(mergedEnv).forEach(([key, value]) => {
      if (value !== undefined) {
        process.env[key] = String(value);
      }
    });

    console.log("Environment variables loaded successfully");
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to load environment variables";

    console.error("Environment loading error:", errorMessage);
    throw new Error(`Failed to load environment: ${errorMessage}`);
  }
};

export const syncEnv = async (envPath: string): Promise<void> => {
  try {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    if (!GITHUB_TOKEN) {
      throw new Error("GITHUB_TOKEN is not set");
    }

    const envConfig = await fs.promises
      .readFile(envPath, "utf8")
      .then(dotenv.parse);

    const REPO_OWNER = process.env.REPO_OWNER || "sujii";
    const REPO_NAME = process.env.REPO_NAME || "actorcli";
    const KEY_ID = process.env.ENCRYPTION_KEY_ID;

    if (!KEY_ID) {
      throw new Error("ENCRYPTION_KEY_ID is not set");
    }

    const headers = {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
    };

    // Use Promise.all for concurrent requests
    await Promise.all(
      Object.entries(envConfig).map(async ([key, value]) => {
        const apiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/secrets/${key}`;

        try {
          await ofetch(apiUrl, {
            method: "PUT",
            body: JSON.stringify({
              encrypted_value: value,
              key_id: KEY_ID,
            }),
            headers,
          });
          console.log(`✓ Synchronized secret: ${key}`);
        } catch (error) {
          console.error(
            `✗ Failed to synchronize secret ${key}:`,
            error instanceof Error ? error.message : "Unknown error",
          );
        }
      }),
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    logError(`Failed to synchronize environment variables: ${errorMessage}`);
    throw error;
  }
};
