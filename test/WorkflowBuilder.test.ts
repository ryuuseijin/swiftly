import { WorkflowBuilder } from '../src';

describe('WorkflowBuilder', () => {
    it('runs workflows', async () => {
        const workflow = WorkflowBuilder.create<{ init: string }>({
            name: 'MyWorkflow',
            version: '1'
        })
            .nextWhen((data) => {
                return !!data.init;
            })
            .run('Task1', async (data) => {
                return data.init;
            })
            .run('Task2', async (data) => {
                return data.Task1.substring(0, 10);
            })
            .run('Task3', async (data) => {
                const x = data.Task1;
                return x.substring(0, 10);
            })
            .repeatPreviousWhile((data) => {
                return !data.init;
            })
            .repeatAll((data) => {
                return !data.init;
            })
            .build();
        expect(workflow.name).toEqual('MyWorkflow');
        expect(workflow.runnables.length).toEqual(2);
        expect(workflow.runnables[0].id).toEqual('Task1');
        expect(workflow.runnables[1].id).toEqual('Task2');
    });
});
