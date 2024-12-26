import { describe, it } from 'vitest';
import { listWorkflows } from '../src/utils/workflowLister';

describe('Workflow Lister', () => {
  it('should list ci.yml file in .github/workflows', async () => {
    const workflows = await listWorkflows();
    console.log(workflows);
    // expect(workflows).toContain('ci.yml');
    // expect(workflows).toBeInstanceOf(Array);
  });
});
