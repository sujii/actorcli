import dotenv from 'dotenv';
import fs from 'node:fs';

export type HookFunction = (env: Record<string, string>) => void;

export class ActorCLI {
  private hooks: HookFunction[] = [];

  addHook(hook: HookFunction) {
    this.hooks.push(hook);
  }

  async runHooks(env: Record<string, string>) {
    for (const hook of this.hooks) {
      await hook(env);
    }
  }

  // Synv env
  async syncEnv(envPath: string) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    console.log('Synchronizing environment variables...');
    await this.runHooks(envConfig);
  }
}

// Usages
const cli = new ActorCLI();

cli.addHook((env) => {
  console.log('Custom hook: Logging environment variables', env);
});

cli.syncEnv('./.env');
