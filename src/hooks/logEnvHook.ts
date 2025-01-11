import { HookFunction } from '../ActorCLI';
import { logInfo } from '../utils/logger';

/**
 * Hook function to safely log environment variables while protecting sensitive data
 */
export const logEnvHook: typeof HookFunction = (env: Record<string, string>): void => {
  try {
    // Create a sanitized copy of environment variables
    const sanitizedEnv = Object.entries(env).reduce(
      (acc, [key, value]) => {
        // Mask sensitive values
        const isSensitive = /key|token|secret|password|auth|credential/i.test(
          key,
        );
        acc[key] = isSensitive ? '[REDACTED]' : value;
        return acc;
      },
      {} as Record<string, string>,
    );

    // Log sanitized environment variables
    logInfo('Environment variables loaded:');

    // Format and log each variable on a new line for better readability
    Object.entries(sanitizedEnv)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to log environment variables:', errorMessage);

    // Don't throw error to avoid breaking the application flow
    // since logging is a non-critical operation
  }
};
