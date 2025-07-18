import fs from "fs";
import path from "path";
import readline from "readline";
import { syncEnv } from "../utils/envManager";
import { logError, logInfo } from "../utils/logger";

const VALID_ENVIRONMENTS = ["development", "staging", "production"] as const;
type Environment = (typeof VALID_ENVIRONMENTS)[number];

const promptEnvironment = async (): Promise<Environment> => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const env = await new Promise<string>((resolve) => {
    rl.question(
      `Select environment (${VALID_ENVIRONMENTS.join("/")}): `,
      (answer) => resolve(answer.toLowerCase().trim()),
    );
  });

  if (!VALID_ENVIRONMENTS.includes(env as Environment)) {
    throw new Error(
      `Invalid environment. Please choose one of: ${VALID_ENVIRONMENTS.join(", ")}`,
    );
  }

  return env as Environment;
};

export const handleSyncCommand = async (options?: {
  force?: boolean;
}): Promise<void> => {
  try {
    const env = await promptEnvironment();
    const envPath = path.resolve(process.cwd(), `dotenv.${env}`);

    try {
      await fs.promises.access(envPath, fs.constants.R_OK);
    } catch (error) {
      throw new Error(`Environment file not found or not readable: ${envPath}`);
    }

    if (env === "production" && !options?.force) {
      const confirmation = await promptConfirmation(
        "Are you sure you want to sync production environment? (y/N): ",
      );
      if (!confirmation) {
        logInfo("Sync cancelled");
        return;
      }
    }

    logInfo(`Synchronizing environment variables for: ${env}`);
    await syncEnv(env);
    logInfo("Environment synchronized successfully");
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    logError(`Failed to sync environment: ${errorMessage}`);
    throw error;
  }
};

const promptConfirmation = async (message: string): Promise<boolean> => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const answer = await new Promise<string>((resolve) => {
      rl.question(message, (response) =>
        resolve(response.toLowerCase().trim()),
      );
    });

    return answer === "y" || answer === "yes";
  } finally {
    rl.close();
  }
};
