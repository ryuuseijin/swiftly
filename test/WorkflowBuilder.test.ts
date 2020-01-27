import { WorkflowBuilder } from '../src';

describe('WorkflowBuilder', () => {
    it('builds workflows', async () => {
        const options = {
            name: 'MyWorkflow',
            version: '1'
        };
        const workflow = WorkflowBuilder.create<{ init: string }>(options)
            .nextWhen((data) => {
                return !!data.init;
            })
            .run('Task1', async (data) => {
                return data.init;
            })
            .run('Task2', async (data) => {
                return data.Task1.substring(0, 10);
            })
            .nextInput(() => {
                return { x: 'y' as 'y' };
            })
            .run('Task3', async (data) => {
                const x = data.x;
                return x.substring(0, 10);
            })
            .repeatPreviousWhile(
                (data) => {
                    return !data.init;
                },
                (results) => {
                    return { x: 'y' as 'y', z: results };
                }
            )
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
