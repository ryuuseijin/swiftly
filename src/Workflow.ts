export type TaskFn<Input, Output> = (input: Input) => Promise<Output>

export type Task<Input, Output> = {
    readonly name: string
    readonly fn: TaskFn<Input, Output>
}

export type Workflow<Input> = {
    readonly name: string
    readonly tasks: Task<Input | any, any>[]
}
