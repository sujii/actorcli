import fs from "fs";
import path from "path";

export const listWorkflows = (): string[] => {
  try {
    const workflowsDir = path.resolve(process.cwd(), ".github/workflows");

    if (!fs.existsSync(workflowsDir)) {
      throw new Error(`Workflows directory not found: ${workflowsDir}`);
    }

    return fs
      .readdirSync(workflowsDir)
      .filter((file) => file.endsWith(".yml") || file.endsWith(".yaml"));
  } catch (error) {
    console.error(error);
    return [];
  }
};
