import { Workflow } from './Workflow';
import { WorkflowRunner } from './WorkflowRunner';
import { never } from './Utils';

export class InMemoryWorkflowRunner<Input> implements WorkflowRunner<Input> {
    public async run(workflow: Workflow<Input>, initialInput: Input): Promise<void> {
        let nextInput = initialInput;
        do {
            for (const runnable of workflow.runnables) {
                if (runnable.conditionFn && !runnable.conditionFn(nextInput)) {
                    continue;
                }
                do {
                    if (runnable.type === 'TaskRunnable') {
                        nextInput = {
                            ...nextInput,
                            [runnable.id]: await runnable.taskFn(nextInput)
                        };
                    } else if (runnable.type === 'WorkflowRunnable') {
                        const subRunner = new InMemoryWorkflowRunner();
                        nextInput = {
                            ...nextInput,
                            [runnable.id]: await subRunner.run(runnable.workflow, nextInput)
                        };
                    } else {
                        return never();
                    }
                } while (runnable.repeatConditionFn && runnable.repeatConditionFn(nextInput));
            }
            nextInput = initialInput;
        } while (workflow.repeatConditionFn && workflow.repeatConditionFn(nextInput));
    }
}
