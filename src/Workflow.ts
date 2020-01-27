export type TaskFn<Input, Output> = (input: Input) => Promise<Output>;
export type ConditionFn<Input> = (input: Input) => boolean;
export type InputFn<ResultMap, NextInput> = (resultMap: ResultMap) => NextInput;

export type RunnableProperties<Input, ResultMap> = {
    readonly id: string;
    readonly conditionFn: ConditionFn<ResultMap> | null;
    readonly repeatConditionFn: ConditionFn<ResultMap> | null;
    readonly inputFn: InputFn<ResultMap, Input> | null;
};

export type TaskRunnable<Input, Output, ResultMap> = RunnableProperties<Input, ResultMap> & {
    readonly type: 'TaskRunnable';
    readonly taskFn: TaskFn<Input, Output>;
};

export type WorkflowRunnable<Input, Output, ResultMap> = RunnableProperties<Input, ResultMap> & {
    readonly type: 'WorkflowRunnable';
    readonly workflow: Workflow<Input, Output>;
};

export type Runnable<Input, Output, ResultMap> =
    | TaskRunnable<Input, Output, ResultMap>
    | WorkflowRunnable<Input, Output, ResultMap>;

// This may not be ideal but it's probably ok not to be more specific
// since input/output of tasks and workflows are just piped through the
// aligned sequence and otherwise not of interest.
export type AnyRunnable = Runnable<any, any, any>;
export type AnyConditionFn = ConditionFn<any>;

export type Workflow<_Input, _Output> = {
    readonly name: string;
    readonly runnables: AnyRunnable[];
    readonly repeatConditionFn: AnyConditionFn | null;
};

export type WorkflowId = string;
