import { Workflow, WorkflowId } from './Workflow';

export interface WorkflowRunner<Input, Output> {
    readonly run: (workflow: Workflow<Input, Output>, input: Input) => Promise<WorkflowId>;
    readonly getResult: (workflowId: WorkflowId) => Promise<Output>;
}
