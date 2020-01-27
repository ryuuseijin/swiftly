import { Workflow, WorkflowId } from './Workflow';
import { WorkflowRunner } from './WorkflowRunner';
import { never } from './Utils';

export class InMemoryWorkflowRunner<Input, Output> implements WorkflowRunner<Input, Output> {
    private runCount = 0;
    private lastResult: { id: string; result: Output } | null = null;

    public async run(workflow: Workflow<Input, Output>, initialInput: Input): Promise<WorkflowId> {
        let nextInput: any = initialInput;
        do {
            for (const runnable of workflow.runnables) {
                if (runnable.conditionFn && !runnable.conditionFn(nextInput)) {
                    continue;
                }
                const input = runnable.inputFn ? runnable.inputFn(nextInput) : nextInput;
                do {
                    if (runnable.type === 'TaskRunnable') {
                        nextInput = {
                            ...nextInput,
                            [runnable.id]: await runnable.taskFn(input)
                        };
                    } else if (runnable.type === 'WorkflowRunnable') {
                        const subRunner = new InMemoryWorkflowRunner();
                        nextInput = {
                            ...nextInput,
                            [runnable.id]: await subRunner.run(runnable.workflow, input)
                        };
                    } else {
                        return never();
                    }
                } while (runnable.repeatConditionFn && runnable.repeatConditionFn(nextInput));
            }
            nextInput = initialInput;
        } while (workflow.repeatConditionFn && workflow.repeatConditionFn(nextInput));
        const id = `${this.runCount}`;
        this.runCount += 1;
        this.lastResult = { id, result: nextInput };
        return id;
    }

    public async getResult(workflowId: string): Promise<Output> {
        if (!this.lastResult) {
            throw Error('No workflow has been run yet');
        }
        if (this.lastResult.id !== workflowId) {
            throw Error(
                'InMemoryWorkflowRunner only support getting the result of the most recently run workflow'
            );
        }
        return this.lastResult.result;
    }
}
