#!/usr/bin/env node

import { Command } from "commander";
import { ActorCLI } from "./ActorCLI";
import { handleHelpCommand } from "./commands/help";
import { handleListCommand } from "./commands/list";
import { handleLoadCommand } from "./commands/load";
import { handleSimulateCommand } from "./commands/simulate";
import { handleSyncCommand } from "./commands/sync";
import { logEnvHook } from "./hooks/logEnvHook";
import { validateEnvHook } from "./hooks/validateEnvHook";

async function main(): Promise<void> {
  try {
    const cli = new ActorCLI();

    // Register hooks with error handling
    [logEnvHook, validateEnvHook].forEach((hook) => {
      try {
        cli.addHook(hook);
      } catch (error) {
        console.error(
          `Failed to register hook: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
        process.exit(1);
      }
    });

    // Sync environment with error handling
    try {
      await cli.syncEnv("./.env");
    } catch (error) {
      console.error(
        "Environment synchronization failed:",
        error instanceof Error ? error.message : "Unknown error",
      );
      process.exit(1);
    }

    const program = new Command();

    // CLI Metadata
    program
      .name("actor")
      .description(
        "A CLI tool for managing GitHub Actions workflows and environment variables.",
      )
      .version("1.0.0", "-v, --version")
      .helpOption("-h, --help", "Display help information");

    // Register Commands with error handling
    program
      .command("load")
      .description("Load environment variables for a specific environment.")
      .option(
        "-e, --env <environment>",
        "Target environment (development/staging/production)",
      )
      .action(async (options) => {
        try {
          await handleLoadCommand(options);
        } catch (error) {
          console.error(
            "Load command failed:",
            error instanceof Error ? error.message : "Unknown error",
          );
          process.exit(1);
        }
      });

    program
      .command("sync")
      .description(
        "Synchronize environment variables for a specific environment.",
      )
      .option("-f, --force", "Force synchronization")
      .action(async (options) => {
        try {
          await handleSyncCommand(options);
        } catch (error) {
          console.error(
            "Sync command failed:",
            error instanceof Error ? error.message : "Unknown error",
          );
          process.exit(1);
        }
      });

    program
      .command("simulate")
      .description("Simulate a GitHub Actions workflow locally using act.")
      .option("-w, --workflow <name>", "Workflow name to simulate")
      .action(async (options) => {
        try {
          await handleSimulateCommand(options);
        } catch (error) {
          console.error(
            "Simulation failed:",
            error instanceof Error ? error.message : "Unknown error",
          );
          process.exit(1);
        }
      });

    program
      .command("list")
      .description(
        "List all available workflows in the .github/workflows directory.",
      )
      .option("-f, --format <type>", "Output format (json/table)", "table")
      .action(async (options) => {
        try {
          await handleListCommand(options);
        } catch (error) {
          console.error(
            "List command failed:",
            error instanceof Error ? error.message : "Unknown error",
          );
          process.exit(1);
        }
      });

    program
      .command("help")
      .description("Show help information for ActorCLI.")
      .action(handleHelpCommand);

    // Handle unknown commands
    program.on("command:*", () => {
      console.error(
        "Invalid command: %s\nSee --help for a list of available commands.",
        program.args.join(" "),
      );
      process.exit(1);
    });

    // Parse CLI arguments
    await program.parseAsync(process.argv);
  } catch (error) {
    console.error(
      "CLI initialization failed:",
      error instanceof Error ? error.message : "Unknown error",
    );
    process.exit(1);
  }
}

// Execute main function
main().catch((error) => {
  console.error(
    "Fatal error:",
    error instanceof Error ? error.message : "Unknown error",
  );
  process.exit(1);
});
