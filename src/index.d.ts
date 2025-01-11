/**
 * Global type declarations
 */
declare global {
  namespace NodeJS {
    interface ProcessEnv extends EnvConfig {}
  }
}

/**
 * Environment configuration interface
 */
export interface EnvConfig {
  /** Application name */
  APP_NAME: string;

  /** Application environment */
  APP_ENV: 'development' | 'staging' | 'production';

  /** Port number the application runs on */
  APP_PORT: number; // Changed from string to number for better type safety

  /** GitHub personal access token */
  GITHUB_TOKEN: string;

  /** Base URL for API endpoints */
  API_BASE_URL: string;

  /** Database connection string */
  DATABASE_URL: string;

  /** Redis connection string */
  REDIS_URL: string;

  /** Application logging level */
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';

  /** Secret key for JWT token generation/validation */
  JWT_SECRET: string;

  /** OAuth client ID (optional) */
  OAUTH_CLIENT_ID?: string;

  /** OAuth client secret (optional) */
  OAUTH_CLIENT_SECRET?: string;

  /**
   * @default 'development'
   */
  NODE_ENV?: 'development' | 'staging' | 'production';
}
