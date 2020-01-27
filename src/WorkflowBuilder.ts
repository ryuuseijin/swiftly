import {
    Workflow,
    AnyRunnable,
    TaskRunnable,
    WorkflowRunnable,
    TaskFn,
    InputFn,
    ConditionFn
} from './Workflow';

export type WorkflowParams = {
    name: string;
    version: string;
};

type WorkflowBuilderData<ResultMap, NextInput> = {
    workflowParams: WorkflowParams;
    runnables: AnyRunnable[];
    repeatAllConditionFn: ConditionFn<ResultMap> | null;
    nextConditionFn: ConditionFn<ResultMap> | null;
    nextInputFn: InputFn<ResultMap, NextInput> | null;
};

export class WorkflowBuilder<InputMap extends {}, ResultMap extends {}, NextInput> {
    constructor(readonly data: WorkflowBuilderData<ResultMap, NextInput>) {}

    static create<InputMap extends {}>(
        workflowParams: WorkflowParams
    ): WorkflowBuilder<InputMap, InputMap, InputMap> {
        return new WorkflowBuilder({
            workflowParams,
            runnables: [],
            repeatAllConditionFn: null,
            nextConditionFn: null,
            nextInputFn: null
        });
    }

    nextInput<NewNextInput>(
        nextInputFn: InputFn<ResultMap, NewNextInput>
    ): WorkflowBuilderWithRunOnly<InputMap, ResultMap, NewNextInput> {
        return new WorkflowBuilderWithRunOnly({
            ...this.data,
            nextInputFn
        });
    }

    nextWhen(
        nextConditionFn: ConditionFn<ResultMap>
    ): WorkflowBuilderWithRunOnly<InputMap, ResultMap, NextInput> {
        return new WorkflowBuilderWithRunOnly({
            ...this.data,
            nextConditionFn
        });
    }

    run<RunnableOutput, RunnableId extends string>(
        runId: RunnableId,
        taskFn: TaskFn<NextInput, RunnableOutput>
    ): WorkflowBuilderWithPreviousRunnable<
        InputMap,
        ResultMap & { [P in RunnableId]: RunnableOutput },
        NextInput
    > {
        const runnable: TaskRunnable<NextInput, RunnableOutput, ResultMap> = {
            type: 'TaskRunnable',
            id: runId,
            taskFn,
            inputFn: this.data.nextInputFn || null,
            conditionFn: this.data.nextConditionFn || null,
            repeatConditionFn: null
        };
        return new WorkflowBuilderWithPreviousRunnable<
            InputMap,
            ResultMap & { [P in RunnableId]: RunnableOutput },
            NextInput
        >({
            ...this.data,
            runnables: this.data.runnables.concat([runnable]),
            nextInputFn: null
        });
    }

    runWorkflow<WorkflowOutput, RunnableId extends string>(
        runId: RunnableId,
        workflow: Workflow<NextInput, WorkflowOutput>
    ): WorkflowBuilderWithPreviousRunnable<
        InputMap,
        ResultMap & { [P in RunnableId]: WorkflowOutput },
        NextInput
    > {
        const runnable: WorkflowRunnable<NextInput, WorkflowOutput, ResultMap> = {
            type: 'WorkflowRunnable',
            id: runId,
            workflow,
            inputFn: this.data.nextInputFn || null,
            conditionFn: this.data.nextConditionFn || null,
            repeatConditionFn: null
        };
        return new WorkflowBuilderWithPreviousRunnable<
            InputMap,
            ResultMap & { [P in RunnableId]: WorkflowOutput },
            NextInput
        >({
            ...this.data,
            runnables: this.data.runnables.concat([runnable]),
            nextInputFn: null
        });
    }

    repeatAll(conditionFn: ConditionFn<ResultMap>): WorkflowBuilderBuildOnly<InputMap, ResultMap> {
        return new WorkflowBuilderBuildOnly({
            ...this.data,
            repeatAllConditionFn: conditionFn
        });
    }

    build(): Workflow<InputMap, ResultMap> {
        return {
            name: this.data.workflowParams.name,
            runnables: this.data.runnables,
            repeatConditionFn: this.data.repeatAllConditionFn || null
        };
    }
}

// after .repeatAll() only .build() is allowed
export class WorkflowBuilderBuildOnly<InputMap extends {}, ResultMap extends {}> {
    constructor(readonly data: WorkflowBuilderData<ResultMap, void>) {}

    build(): Workflow<InputMap, ResultMap> {
        return new WorkflowBuilder(this.data).build();
    }
}

// after nextInput() or nextWhen() only .run() or .runWorkflow() or .nextInput()
export class WorkflowBuilderWithRunOnly<InputMap extends {}, ResultMap extends {}, NextInput> {
    constructor(readonly data: WorkflowBuilderData<ResultMap, NextInput>) {}

    nextInput<NewNextInput>(
        nextInputFn: InputFn<ResultMap, NewNextInput>
    ): WorkflowBuilderWithRunOnly<InputMap, ResultMap, NewNextInput> {
        return new WorkflowBuilderWithRunOnly({
            ...this.data,
            nextInputFn
        });
    }

    // If we have a condition function, the next .run() invocation may
    // never run and therefore we must make the RunnabldId property in
    // the ResultMap optional.
    run<TaskOutput, RunnableId extends string>(
        runId: RunnableId,
        taskFn: TaskFn<NextInput, TaskOutput>
    ): WorkflowBuilderWithPreviousRunnable<
        InputMap,
        ResultMap & { [P in RunnableId]?: TaskOutput },
        NextInput
    > {
        // need the type assertion to turn a required RunnableId property into an optional RunnableId property
        return new WorkflowBuilder<InputMap, ResultMap, NextInput>(this.data).run(
            runId,
            taskFn
        ) as WorkflowBuilderWithPreviousRunnable<
            InputMap,
            ResultMap & { [P in RunnableId]?: TaskOutput },
            NextInput
        >;
    }

    runWorkflow<WorkflowOutput, RunnableId extends string>(
        runId: RunnableId,
        workflow: Workflow<NextInput, WorkflowOutput>
    ): WorkflowBuilderWithPreviousRunnable<
        InputMap,
        ResultMap & { [P in RunnableId]?: WorkflowOutput },
        NextInput
    > {
        // need the type assertion to turn a required RunnableId property into an optional RunnableId property
        return new WorkflowBuilder<InputMap, ResultMap, NextInput>(this.data).runWorkflow(
            runId,
            workflow
        ) as WorkflowBuilderWithPreviousRunnable<
            InputMap,
            ResultMap & { [P in RunnableId]?: WorkflowOutput },
            NextInput
        >;
    }
}

// .repeatPreviousWhile() is only allowed immediately after .run()
export class WorkflowBuilderWithPreviousRunnable<
    InputMap extends {},
    ResultMap extends {},
    PrevInput
> extends WorkflowBuilder<InputMap, ResultMap, ResultMap> {
    repeatPreviousWhile(
        repeatConditionFn: ConditionFn<ResultMap>,
        repeatInputFn?: InputFn<ResultMap, PrevInput>
    ): WorkflowBuilder<InputMap, ResultMap, ResultMap> {
        const repeatTask = this.data.runnables[this.data.runnables.length - 1];
        const replacementTask = {
            ...repeatTask,
            repeatConditionFn,
            repeatInputFn
        };
        return new WorkflowBuilder({
            ...this.data,
            runnables: this.data.runnables
                .slice(0, this.data.runnables.length - 1)
                .concat([replacementTask])
        });
    }
}
