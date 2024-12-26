import dotenv from 'dotenv';
import fs from 'node:fs';
import { ofetch } from 'ofetch';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { syncEnv } from '../src/utils/envManager';

// Mock external modules
vi.mock('ofetch');
vi.mock('dotenv');
vi.mock('node:fs');

describe('syncEnv', () => {
  const mockEnvPath = '/path/to/.env';
  const mockEnvConfig = {
    SECRET_1: 'value1',
    SECRET_2: 'value2',
    API_KEY: 'test-key',
  };

  beforeEach(() => {
    // Reset environment variables
    process.env.GITHUB_TOKEN = 'mock-token';
    process.env.REPO_OWNER = 'test-owner';
    process.env.REPO_NAME = 'test-repo';
    process.env.ENCRYPTION_KEY_ID = 'test-key-id';

    // Mock fs.promises.readFile
    vi.mocked(fs.promises).readFile = vi
      .fn()
      .mockResolvedValue('mock-env-content');

    // Mock dotenv.parse
    vi.mocked(dotenv.parse).mockReturnValue(mockEnvConfig);

    // Mock ofetch
    vi.mocked(ofetch).mockResolvedValue({ status: 201 });

    // Mock console methods
    console.log = vi.fn();
    console.error = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully sync environment variables', async () => {
    await syncEnv(mockEnvPath);

    // Verify file was read
    expect(fs.promises.readFile).toHaveBeenCalledWith(mockEnvPath, 'utf8');

    // Verify dotenv parsed the content
    expect(dotenv.parse).toHaveBeenCalledWith('mock-env-content');

    // Verify API calls
    expect(ofetch).toHaveBeenCalledTimes(Object.keys(mockEnvConfig).length);

    // Verify API call parameters
    Object.keys(mockEnvConfig).forEach((key) => {
      expect(ofetch).toHaveBeenCalledWith(
        `https://api.github.com/repos/test-owner/test-repo/actions/secrets/${key}`,
        {
          method: 'PUT',
          body: {
            encrypted_value: mockEnvConfig[key],
            key_id: 'test-key-id',
          },
          headers: {
            Authorization: 'Bearer mock-token',
            Accept: 'application/vnd.github.v3+json',
          },
        },
      );
    });

    // Verify success messages
    Object.keys(mockEnvConfig).forEach((key) => {
      expect(console.log).toHaveBeenCalledWith(`✓ Synchronized secret: ${key}`);
    });
  });

  it('should throw error when GITHUB_TOKEN is not set', async () => {
    process.env.GITHUB_TOKEN = '';

    await expect(syncEnv(mockEnvPath)).rejects.toThrow(
      'GITHUB_TOKEN is not set',
    );
  });

  it('should throw error when ENCRYPTION_KEY_ID is not set', async () => {
    process.env.ENCRYPTION_KEY_ID = '';

    await expect(syncEnv(mockEnvPath)).rejects.toThrow(
      'ENCRYPTION_KEY_ID is not set',
    );
  });

  it('should handle API errors gracefully', async () => {
    const mockError = new Error('API Error');
    vi.mocked(ofetch).mockRejectedValueOnce(mockError);

    await syncEnv(mockEnvPath);

    expect(console.error).toHaveBeenCalledWith(
      '✗ Failed to synchronize secret SECRET_1:',
      'API Error',
    );
  });

  // it('should handle file read errors', async () => {
  //   const mockError = new Error('File read error');
  //   vi.mocked(fs.promises.readFile).mockRejectedValueOnce(mockError);

  //   await expect(syncEnv(mockEnvPath)).rejects.toThrow(
  //     'Failed to synchronize environment variables: File read error',
  //   );
  // });

  it('should use default repo values when not provided', async () => {
    process.env.REPO_OWNER = '';
    process.env.REPO_NAME = '';

    await syncEnv(mockEnvPath);

    expect(ofetch).toHaveBeenCalledWith(
      expect.stringContaining('your-org-or-username/your-repo-name'),
      expect.any(Object),
    );
  });

  it('should handle concurrent API requests', async () => {
    const mockDelay = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    // Mock API calls with different delays
    vi.mocked(ofetch)
      .mockImplementationOnce(() =>
        mockDelay(100).then(() => ({ status: 201 })),
      )
      .mockImplementationOnce(() => mockDelay(50).then(() => ({ status: 201 })))
      .mockImplementationOnce(() =>
        mockDelay(150).then(() => ({ status: 201 })),
      );

    const startTime = Date.now();
    await syncEnv(mockEnvPath);
    const endTime = Date.now();

    // Verify all requests were made concurrently
    expect(endTime - startTime).toBeLessThan(200);
    expect(ofetch).toHaveBeenCalledTimes(3);
  });
});
