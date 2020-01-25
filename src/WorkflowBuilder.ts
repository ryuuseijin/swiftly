import { Workflow, Task, TaskFn } from './Workflow'

export type WorkflowParams = {
    name: string
}

type WorkflowBuilderData = {
    workflowParams: WorkflowParams
    tasks: Task<any, any>[]
}

export class WorkflowBuilder<Input, ResultMap extends {}> {
    private constructor(readonly data: WorkflowBuilderData) {}

    static create<Input>(workflowParams: WorkflowParams): WorkflowBuilder<Input, { init: Input }> {
        return new WorkflowBuilder<Input, { init: Input }>({
            workflowParams,
            tasks: []
        })
    }

    run<TaskOutput, TaskName extends string>(
        taskName: TaskName,
        taskFn: TaskFn<ResultMap, TaskOutput>
    ): WorkflowBuilder<Input, ResultMap & { [P in TaskName]: TaskOutput }> {
        const task = {
            name: taskName,
            fn: taskFn
        }
        return new WorkflowBuilder<Input, ResultMap & { [P in TaskName]: TaskOutput }>({
            workflowParams: this.data.workflowParams,
            tasks: this.data.tasks.concat([task])
        })
    }

    build(): Workflow<Input> {
        const workflow: Workflow<Input> = {
            name: this.data.workflowParams.name,
            tasks: this.data.tasks
        }
        return workflow
    }
}
