import { mastra } from './src/mastra';

async function main() {
  const userId = 'user_2tm6fW1u9m6v4u8y7z0v2w4x6y8';
  console.log('Starting workflow test for user:', userId);
  
  try {
    const workflow = mastra.getWorkflow('energyWorkflow');
    if (!workflow) {
      console.error('Workflow not found');
      return;
    }

    const run = await workflow.createRun();
    const result = await run.start({ inputData: { userId } });

    console.log('Workflow status:', result.status);
    console.log('Step Results:');
    Object.entries(result.steps).forEach(([id, step]) => {
      console.log(`- ${id}: ${step.status}`);
      if (step.status === 'success') {
        console.log(`  Output:`, JSON.stringify(step.output, null, 2));
      } else if (step.status === 'failed') {
        console.log(`  Error:`, step.error);
      }
    });

    if (result.status === 'success') {
      console.log('Final Result:', JSON.stringify(result.result, null, 2));
    }
  } catch (err) {
    console.error('Caught error:', err);
  }
}

main();
