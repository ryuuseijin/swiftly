import { WorkflowBuilder } from '../src'

describe('WorkflowBuilder', () => {
    it('runs workflows', async () => {
        const workflow = WorkflowBuilder.create<string>({ name: 'MyWorkflow' })
            .run('Task1', async input => {
                return input.init
            })
            .run('Task2', async input => {
                return input.Task1
            })
            .build()
        expect(workflow.name).toEqual('MyWorkflow')
        expect(workflow.tasks.length).toEqual(2)
        expect(workflow.tasks[0].name).toEqual('Task1')
        expect(workflow.tasks[1].name).toEqual('Task2')
    })
})
