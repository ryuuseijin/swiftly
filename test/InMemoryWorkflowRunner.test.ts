import { Workflow, InMemoryWorkflowRunner } from '../src'

describe('InMemoryWorkflowRunner', () => {
    it('runs workflows', async () => {
        const workflow: Workflow<number> = {
            tasks: [
                {
                    name: 'MyTask',
                    fn: async (input: number) => {
                        return `some number ${input}`
                    }
                }
            ]
        }
        const runner = new InMemoryWorkflowRunner<number>()
        await runner.run(workflow, 42)
    })
})
