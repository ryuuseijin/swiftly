import { Workflow } from './Workflow';

export interface WorkflowRunner<Input> {
    readonly run: (workflow: Workflow<Input>, initialInput: Input) => Promise<void>;
}
