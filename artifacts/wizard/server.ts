import { smoothStream, streamText } from 'ai';
import { myProvider } from '@/lib/ai/models';
import { createDocumentHandler } from '@/lib/artifacts/server';

export const wizardDocumentHandler = createDocumentHandler<'wizard'>({
  kind: 'wizard',
  onCreateDocument: async ({ title, dataStream }) => {
    try {
      // Define some sample questions (or fetch from your API)
      const questions = [
        { id: 'q1', question: "What's your height?", type: 'text' },
        { id: 'q2', question: "What's your weight?", type: 'text' },
        { id: 'q3', question: "What's your age?", type: 'text' },
        // Add more questions as needed
      ];

      // Stream the questions to the client
      dataStream.writeData({
        type: 'wizard-data',
        content: questions,
      });

      // Return initial content
      return {
        questions,
        answers: {},
      };
    } catch (error) {
      console.error('Error creating wizard document:', error);
      throw error;
    }
  },
  onUpdateDocument: async ({ document, description, dataStream }) => {
    // Simply return the updated content with answers
    return document.content;
  },
}); 