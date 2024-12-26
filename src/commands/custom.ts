import { Command } from 'commander';
import dotenv from 'dotenv';
import fs from 'node:fs';

const program = new Command();

program
  .option('--env-file <path>', 'Path to the .env file', './.env') // Defaults
  .action((options) => {
    const envPath = options.envFile;
    if (!fs.existsSync(envPath)) {
      console.error(`The specified .env file does not exist: ${envPath}`);
      process.exit(1);
    }
    dotenv.config({ path: envPath });
    console.log(`Loaded environment variables from ${envPath}`);
  });

program.parse(process.argv);
