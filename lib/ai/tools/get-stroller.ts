import { tool } from 'ai';
import { z } from 'zod';

export const getStroller = tool({
  name: 'getStroller',
  description: 'Fetch questions to help find a stroller',
  parameters: z.object({}),
  execute: async () => {
    try {
      const response = await fetch('https://api.dify.ai/v1/workflows/run', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer app-u2vM7iAQmNSBnnFx5amAKTcD', 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: {},
          response_mode: 'blocking',
          user: 'abc-123', 
        }),
      });

      
      if (!response.ok) {
        throw new Error(`Failed to fetch questions: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.data || !data.data.outputs || !data.data.outputs.questions) {
        throw new Error('Unexpected response structure: data, outputs, or result is missing');
      }

      const questions = data.data.outputs.questions; 
      console.log(`questions 34277423: ${questions}`);
      return questions; 
    } catch (error) {
      console.error('Error fetching stroller questions:', error);
      throw new Error('Could not retrieve stroller questions. Please try again later.');
    }
  },
});