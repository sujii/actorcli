import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { loadEnv } from '../utils/envManager';
import { logError, logInfo } from '../utils/logger';

const VALID_ENVIRONMENTS = ['development', 'staging', 'production'] as const;
type Environment = (typeof VALID_ENVIRONMENTS)[number];

const promptEnvironment = async (): Promise<Environment> => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const env = await new Promise<string>((resolve) => {
      rl.question(
        `Select environment (${VALID_ENVIRONMENTS.join('/')}): `,
        (answer) => resolve(answer.toLowerCase().trim()),
      );
    });

    if (!VALID_ENVIRONMENTS.includes(env as Environment)) {
      throw new Error(
        `Invalid environment. Please choose one of: ${VALID_ENVIRONMENTS.join(', ')}`,
      );
    }

    return env as Environment;
  } finally {
    rl.close();
  }
};

interface LoadCommandOptions {
  env?: string;
}

export const handleLoadCommand = async (
  options?: LoadCommandOptions,
): Promise<void> => {
  try {
    // Use provided environment or prompt for one
    const env = options?.env || (await promptEnvironment());

    const envPath = path.resolve(process.cwd(), `dotenv.${env}`);

    // Check if file exists and is readable
    try {
      await fs.promises.access(envPath, fs.constants.R_OK);
    } catch (error) {
      throw new Error(`Environment file not found or not readable: ${envPath}`);
    }

    // Warn if loading production environment
    if (env === 'production') {
      logError('Loading production environment - please proceed with caution');
    }

    logInfo(`Loading environment: ${env}`);

    await loadEnv(envPath);
    logInfo('Environment loaded successfully');
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    logError(`Failed to load environment: ${errorMessage}`);
    throw error;
  }
};
