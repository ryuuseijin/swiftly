export type TaskFn<Input, Output> = (input: Input) => Promise<Output>;
export type ConditionFn<Input> = (input: Input) => boolean;

export type RunnableProperties<Input> = {
    readonly id: string;
    readonly conditionFn: ConditionFn<Input> | null;
    readonly repeatConditionFn: ConditionFn<Input> | null;
};

export type TaskRunnable<Input, Output> = RunnableProperties<Input> & {
    readonly type: 'TaskRunnable';
    readonly taskFn: TaskFn<Input, Output>;
};

export type WorkflowRunnable<Input> = RunnableProperties<Input> & {
    readonly type: 'WorkflowRunnable';
    readonly workflow: Workflow<Input>;
};

export type Runnable<Input, Output> = TaskRunnable<Input, Output> | WorkflowRunnable<Input>;

export type Workflow<Input> = {
    readonly name: string;
    readonly runnables: Runnable<any, any>[];
    readonly repeatConditionFn: ConditionFn<Input> | null;
};
