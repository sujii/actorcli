import dotenv from "dotenv";
import fs from "node:fs";

export class ActorCLI {
  private hooks: Function[] = [];

  addHook(hook: Function) {
    this.hooks.push(hook);
  }

  async runHooks(env: Record<string, string>) {
    for (const hook of this.hooks) {
      await hook(env);
    }
  }

  async syncEnv(envPath: string) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    console.log("Synchronizing environment variables...");
    await this.runHooks(envConfig);
  }
}

export function HookFunction(env: Record<string, string>) {
  const cli = new ActorCLI();

  cli.addHook((env: Record<string, string>) => {
    console.log("Custom hook: Logging environment variables", env);
  });
  cli.syncEnv("./.env");
}
