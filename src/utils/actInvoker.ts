import { spawn, spawnSync } from "child_process";
import readline from "readline";
import { logError, logInfo } from "./logger";

/**
 * Invokes `act` to simulate a GitHub Actions workflow locally.
 * @param workflowPath - Path to the workflow file to be executed.
 * @param options - Additional options for the act command.
 */
export const invokeAct = (workflowPath: string, options: string[] = []) => {
  return new Promise<void>((resolve, reject) => {
    const args = ["run", "-W", workflowPath, ...options];
    const actProcess = spawn("act", args, { stdio: "inherit" });

    actProcess.on("error", (err) => {
      logError(`Failed to invoke act: ${err.message}`);
      reject(err);
    });

    actProcess.on("close", (code) => {
      if (code === 0) {
        logInfo("Act completed successfully.");
        resolve();
      } else {
        logError(`Act process exited with code ${code}`);
        reject(new Error(`Act process exited with code ${code}`));
      }
    });
  });
};

/**
 * Checks if `act` is installed on the system.
 * @returns A boolean indicating whether `act` is installed.
 */
export const checkActInstallation = (): boolean => {
  const result = spawnSync("act", ["--version"], { stdio: "ignore" });
  return result.status === 0;
};

/**
 * Prompts the user to install `act` if not installed.
 * @returns A promise resolving to a boolean indicating whether the user wants to install `act`.
 */
export const promptInstallAct = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(
      "`act` is not installed. Would you like to install it? (Y/n): ",
      (answer: string) => {
        rl.close();
        resolve(answer.toLowerCase() === "y" || answer.toLowerCase() === "yes");
      },
    );
  });
};
