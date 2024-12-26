import fs from 'fs';
import path from 'path';
import { logError, logInfo } from '../utils/logger';

interface ListCommandOptions {
  format?: 'simple' | 'json' | 'table';
}

interface WorkflowInfo {
  name: string;
  path: string;
  size: number;
  lastModified: Date;
}

export const handleListCommand = async (
  options: ListCommandOptions = {},
): Promise<void> => {
  try {
    const workflowsDir = path.resolve(process.cwd(), '.github/workflows');

    // Check if workflows directory exists
    if (!fs.existsSync(workflowsDir)) {
      throw new Error(`Workflows directory not found: ${workflowsDir}`);
    }

    // Get workflow files with additional information
    const workflowFiles = await getWorkflowFiles(workflowsDir);

    if (workflowFiles.length === 0) {
      logError('No workflow files found in .github/workflows');
      return;
    }

    // Display workflows based on format option
    displayWorkflows(workflowFiles, options.format);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    logError(`Failed to list workflows: ${errorMessage}`);
    throw error;
  }
};

const getWorkflowFiles = async (directory: string): Promise<WorkflowInfo[]> => {
  try {
    const files = await fs.promises.readdir(directory);

    const workflowFiles = files.filter(
      (file) => file.endsWith('.yml') || file.endsWith('.yaml'),
    );

    const workflowInfoPromises = workflowFiles.map(async (file) => {
      const filePath = path.join(directory, file);
      const stats = await fs.promises.stat(filePath);

      return {
        name: file,
        path: filePath,
        size: stats.size,
        lastModified: stats.mtime,
      };
    });

    return Promise.all(workflowInfoPromises);
  } catch (error) {
    throw new Error(
      `Failed to read workflow files: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
};

const displayWorkflows = (
  workflows: WorkflowInfo[],
  format: ListCommandOptions['format'] = 'simple',
): void => {
  switch (format) {
    case 'json':
      console.log(JSON.stringify(workflows, null, 2));
      break;

    case 'table':
      console.table(
        workflows.map((wf) => ({
          Name: wf.name,
          Size: `${(wf.size / 1024).toFixed(2)} KB`,
          'Last Modified': wf.lastModified.toLocaleString(),
        })),
      );
      break;

    case 'simple':
    default:
      logInfo('Available workflows:');
      workflows.forEach((wf) => {
        console.log(`- ${wf.name} (${(wf.size / 1024).toFixed(2)} KB)`);
      });
      break;
  }

  logInfo(`Total workflows found: ${workflows.length}`);
};
