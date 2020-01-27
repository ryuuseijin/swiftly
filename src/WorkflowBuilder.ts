import {
    Workflow,
    Runnable,
    TaskRunnable,
    WorkflowRunnable,
    TaskFn,
    ConditionFn
} from './Workflow';

export type WorkflowParams = {
    name: string;
    version: string;
};

type WorkflowBuilderData<InputMap> = {
    workflowParams: WorkflowParams;
    runnables: Runnable<any, any>[];
    repeatConditionFn: ConditionFn<InputMap> | null;
};

export class WorkflowBuilder<InputMap extends {}, ResultMap extends {}> {
    constructor(
        readonly data: WorkflowBuilderData<InputMap>,
        readonly conditionFn?: ConditionFn<ResultMap>
    ) {}

    static create<InputMap extends {}>(
        workflowParams: WorkflowParams
    ): WorkflowBuilder<InputMap, InputMap> {
        return new WorkflowBuilder<InputMap, InputMap>({
            workflowParams,
            runnables: [],
            repeatConditionFn: null
        });
    }

    nextWhen(conditionFn: ConditionFn<ResultMap>) {
        return new WorkflowBuilderWithNextCondition<InputMap, ResultMap>(this.data, conditionFn);
    }

    run<RunnableOutput, RunnableId extends string>(
        runId: RunnableId,
        taskFn: TaskFn<ResultMap, RunnableOutput>
    ): WorkflowBuilderWithPreviousRunnable<
        InputMap,
        ResultMap & { [P in RunnableId]: RunnableOutput }
    > {
        const runnable: TaskRunnable<ResultMap, RunnableOutput> = {
            type: 'TaskRunnable',
            id: runId,
            taskFn,
            conditionFn: this.conditionFn || null,
            repeatConditionFn: null
        };
        return new WorkflowBuilderWithPreviousRunnable({
            ...this.data,
            runnables: this.data.runnables.concat([runnable])
        });
    }

    runWorkflow<RunnableOutput, RunnableId extends string>(
        runId: RunnableId,
        workflow: Workflow<ResultMap>
    ): WorkflowBuilderWithPreviousRunnable<
        InputMap,
        ResultMap & { [P in RunnableId]: RunnableOutput }
    > {
        const runnable: WorkflowRunnable<ResultMap> = {
            type: 'WorkflowRunnable',
            id: runId,
            workflow,
            conditionFn: this.conditionFn || null,
            repeatConditionFn: null
        };
        return new WorkflowBuilderWithPreviousRunnable({
            ...this.data,
            runnables: this.data.runnables.concat([runnable])
        });
    }

    repeatAll(conditionFn: ConditionFn<ResultMap>): WorkflowBuilderBuildOnly<ResultMap> {
        return new WorkflowBuilderBuildOnly({
            ...this.data,
            repeatConditionFn: conditionFn
        });
    }

    build(): Workflow<InputMap> {
        const workflow: Workflow<InputMap> = {
            name: this.data.workflowParams.name,
            runnables: this.data.runnables,
            repeatConditionFn: this.data.repeatConditionFn
        };
        return workflow;
    }
}

// after .repeatAll() only .build() is allowed
export class WorkflowBuilderBuildOnly<InputMap extends {}> {
    constructor(readonly data: WorkflowBuilderData<InputMap>) {}

    build(): Workflow<InputMap> {
        return new WorkflowBuilder(this.data).build();
    }
}

// if we have a condition function, the next .run() invokation may never
// run and therefore we must make the result **optional** in the ResultMap
export class WorkflowBuilderWithNextCondition<InputMap extends {}, ResultMap extends {}> {
    constructor(
        readonly data: WorkflowBuilderData<InputMap>,
        readonly conditionFn: ConditionFn<ResultMap>
    ) {}

    run<TaskOutput, RunnableId extends string>(
        runId: RunnableId,
        taskFn: TaskFn<ResultMap, TaskOutput>
    ): WorkflowBuilderWithPreviousRunnable<
        InputMap,
        ResultMap & { [P in RunnableId /* optional */]?: TaskOutput }
    > {
        return new WorkflowBuilder(this.data, this.conditionFn).run(
            runId,
            taskFn
        ) as WorkflowBuilderWithPreviousRunnable<
            InputMap,
            ResultMap & { [P in RunnableId]?: TaskOutput }
        >;
    }

    runWorkflow<TaskOutput, RunnableId extends string>(
        runId: RunnableId,
        workflow: Workflow<ResultMap>
    ): WorkflowBuilderWithPreviousRunnable<
        InputMap,
        ResultMap & { [P in RunnableId /* optional */]?: TaskOutput }
    > {
        return new WorkflowBuilder(this.data, this.conditionFn).runWorkflow(runId, workflow);
    }
}

// .repeatPreviousWhile() is only allowed immediately after .run()
export class WorkflowBuilderWithPreviousRunnable<
    InputMap extends {},
    ResultMap extends {}
> extends WorkflowBuilder<InputMap, ResultMap> {
    repeatPreviousWhile(conditionFn: ConditionFn<ResultMap>): WorkflowBuilder<InputMap, ResultMap> {
        const replacementTask = {
            ...this.data.runnables[this.data.runnables.length - 1],
            repeatConditionFn: conditionFn
        };
        return new WorkflowBuilder({
            ...this.data,
            runnables: this.data.runnables
                .slice(0, this.data.runnables.length - 1)
                .concat([replacementTask])
        });
    }
}
