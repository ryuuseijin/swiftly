import { Workflow, TaskRunnable, InMemoryWorkflowRunner } from '../src';

describe('InMemoryWorkflowRunner', () => {
    it('runs workflows', async () => {
        const workflow: Workflow<number, { MyTask: string }> = {
            name: 'MyWorkflow',
            repeatConditionFn: null,
            runnables: [
                {
                    id: 'MyTask',
                    taskFn: async (input: number) => {
                        return `some number ${input}`;
                    }
                } as TaskRunnable<number, string, {}>
            ]
        };
        const runner = new InMemoryWorkflowRunner<number, { MyTask: string }>();
        const workflowId = await runner.run(workflow, 42);
        const result = await runner.getResult(workflowId);
        expect(result.MyTask).toEqual('some number 42');
    });
});
