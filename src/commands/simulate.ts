import readline from 'readline';
import { checkActInstallation, promptInstallAct } from '../utils/actInstaller';
import { invokeAct } from '../utils/actInvoker';
import { logError, logInfo } from '../utils/logger';
import { listWorkflows } from '../utils/workflowLister';

interface WorkflowSelection {
  workflow: string;
  cancelled: boolean;
}

const promptWorkflow = async (
  workflows: string[],
): Promise<WorkflowSelection> => {
  if (workflows.length === 0) {
    throw new Error('No workflows available to select');
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    console.log('\nAvailable workflows:');
    workflows.forEach((workflow, index) => {
      console.log(`${index + 1}. ${workflow}`);
    });

    const answer = await new Promise<string>((resolve) => {
      rl.question(
        '\nSelect a workflow to simulate (or press Enter to cancel): ',
        resolve,
      );
    });

    if (!answer.trim()) {
      return { workflow: '', cancelled: true };
    }

    const index = parseInt(answer, 10) - 1;
    if (isNaN(index) || index < 0 || index >= workflows.length) {
      throw new Error(
        `Invalid selection. Please choose a number between 1 and ${workflows.length}`,
      );
    }

    return { workflow: workflows[index], cancelled: false };
  } finally {
    rl.close();
  }
};

interface SimulateCommandOptions {
  workflow?: string;
}

export const handleSimulateCommand = async (
  options?: SimulateCommandOptions,
): Promise<void> => {
  try {
    // Check act installation
    if (!(await checkActInstallation())) {
      const shouldInstall = await promptInstallAct();
      if (!shouldInstall) {
        logError(
          '`act` is required to run simulations. Please install it manually.',
        );
        return;
      }
    }

    // Get available workflows
    const workflows = await listWorkflows();
    if (workflows.length === 0) {
      logError('No workflows found in .github/workflows directory.');
      return;
    }

    // Handle workflow selection
    let selectedWorkflow: string;
    if (options?.workflow) {
      if (!workflows.includes(options.workflow)) {
        throw new Error(`Workflow "${options.workflow}" not found`);
      }
      selectedWorkflow = options.workflow;
    } else {
      const selection = await promptWorkflow(workflows);
      if (selection.cancelled) {
        logInfo('Simulation cancelled');
        return;
      }
      selectedWorkflow = selection.workflow;
    }

    // Confirm before running simulation
    logInfo(`Preparing to simulate workflow: ${selectedWorkflow}`);
    logError('This will execute the workflow in your local environment');

    try {
      await invokeAct(selectedWorkflow);
      logInfo('Workflow simulation completed successfully');
    } catch (error) {
      throw new Error(
        `Workflow simulation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    logError(`Simulation error: ${errorMessage}`);
    throw error;
  }
};
