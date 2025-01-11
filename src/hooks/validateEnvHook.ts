import { HookFunction } from '../ActorCLI';
import { logError, logInfo } from '../utils/logger';
// Removed incorrect import of Record from 'typescript'

interface EnvValidationRule {
  key: string;
  required: boolean;
  pattern?: RegExp;
  validate?: (value: string) => boolean;
}

const ENV_VALIDATION_RULES: EnvValidationRule[] = [
  {
    key: 'APP_ENV',
    required: true,
    validate: (value) =>
      ['development', 'staging', 'production'].includes(value),
  },
  {
    key: 'APP_NAME',
    required: true,
    pattern: /^[a-zA-Z0-9-_]+$/,
  },
  {
    key: 'API_KEY',
    required: true,
    pattern: /^[a-zA-Z0-9-_]+$/,
  },
  {
    key: 'DATABASE_URL',
    required: true,
    pattern: /^[a-zA-Z]+:\/\/.+/,
  },
  {
    key: 'GITHUB_TOKEN',
    required: true,
    pattern: /^[a-zA-Z0-9-_]+$/,
  }
];

/**
 * Hook function to validate environment variables against predefined rules
 */
export const validateEnvHook: typeof HookFunction = (
  env: Record<string, string>,
): void => {
  try {
    const validationErrors: string[] = [];

    // Validate each environment variable against rules
    ENV_VALIDATION_RULES.forEach((rule) => {
      const value = env[rule.key];

      // Check if required variable exists
      if (rule.required && !value) {
        validationErrors.push(
          `Missing required environment variable: ${rule.key}`,
        );
        return;
      }

      if (value) {
        // Check pattern if defined
        if (rule.pattern && !rule.pattern.test(value)) {
          validationErrors.push(
            `Invalid format for ${rule.key}: Must match pattern ${rule.pattern}`,
          );
        }

        // Check custom validation if defined
        if (rule.validate && !rule.validate(value)) {
          validationErrors.push(`Invalid value for ${rule.key}: ${value}`);
        }
      }
    });

    // Check for any validation errors
    if (validationErrors.length > 0) {
      throw new Error(
        `Environment validation failed:\n${validationErrors.map((err) => `- ${err}`).join('\n')}`,
      );
    }

    logInfo('Environment variables validated successfully');
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    logError(`Validation error: ${errorMessage}`);
    throw error;
  }
};
