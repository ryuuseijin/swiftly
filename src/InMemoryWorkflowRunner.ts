import { Workflow } from './Workflow'
import { WorkflowRunner } from './WorkflowRunner'

export class InMemoryWorkflowRunner<Input> implements WorkflowRunner<Input> {
    public async run(workflow: Workflow<Input>, initialInput: Input): Promise<void> {
        let nextInput = initialInput
        for (const task of workflow.tasks) {
            nextInput = await task.fn(nextInput)
        }
    }
}
