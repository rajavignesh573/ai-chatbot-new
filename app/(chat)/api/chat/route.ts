import {
  type Message,
  createDataStreamResponse,
  smoothStream,
  streamText,
} from 'ai';

import { auth } from '@/app/(auth)/auth';
import { myProvider } from '@/lib/ai/models';
import { systemPrompt } from '@/lib/ai/prompts';
import {
  deleteChatById,
  getChatById,
  saveChat,
  saveMessages,
} from '@/lib/db/queries';
import {
  generateUUID,
  getMostRecentUserMessage,
  sanitizeResponseMessages,
} from '@/lib/utils';

import { generateTitleFromUserMessage } from '../../actions';
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import { getWeather } from '@/lib/ai/tools/get-weather';

type ExtendedMessage = Message & {
  reasoning?: string;
  toolInvocations?: Array<any>;
  experimental_attachments?: Array<any>;
};

export const maxDuration = 60;

export async function POST(request: Request) {
  const {
    id,
    messages,
    selectedChatModel,
  }: { id: string; messages: Array<ExtendedMessage>; selectedChatModel: string } =
    await request.json();

  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const userMessage = getMostRecentUserMessage(messages);

  if (!userMessage) {
    return new Response('No user message found', { status: 400 });
  }

  const chat = await getChatById({ id });

  if (!chat) {
    const title = await generateTitleFromUserMessage({ message: userMessage });
    await saveChat({ id, userId: session.user.id, title });
  }

  await saveMessages({
    messages: [{
      id: userMessage.id,
      chatId: id,
      role: userMessage.role,
      parts: userMessage.content ? [{
        type: 'text',
        text: userMessage.content,
      }] : [],
      attachments: userMessage.experimental_attachments || [],
      createdAt: new Date(),
    }],
  });

  return createDataStreamResponse({
    execute: (dataStream) => {
      const result = streamText({
        model: myProvider.languageModel(selectedChatModel),
        system: systemPrompt({ selectedChatModel }),
        messages,
        maxSteps: 5,
        experimental_activeTools: [
          'getWeather',
          'createDocument',
          'updateDocument',
          'requestSuggestions',
        ],
        experimental_transform: smoothStream({ chunking: 'word' }),
        experimental_generateMessageId: generateUUID,
        tools: {
          getWeather,
          createDocument: createDocument({ session, dataStream }),
          updateDocument: updateDocument({ session, dataStream }),
          requestSuggestions: requestSuggestions({
            session,
            dataStream,
          }),
        },
        onFinish: async ({ response, reasoning }) => {
          if (session.user?.id) {
            try {
              const sanitizedResponseMessages = sanitizeResponseMessages({
                messages: response.messages,
                reasoning,
              });

              await saveMessages({
                messages: sanitizedResponseMessages.map((message) => {
                  const parts = [];
                  
                  // Add text part if content exists
                  if (message.content) {
                    parts.push({
                      type: 'text',
                      text: message.content,
                    });
                  }

                  // Add reasoning part if it exists
                  if (reasoning) {
                    parts.push({
                      type: 'reasoning',
                      reasoning,
                    });
                  }

                  // Add tool invocations if they exist
                  if ('toolInvocations' in message) {
                    const toolInvocations = (message as any).toolInvocations;
                    if (toolInvocations) {
                      for (const toolInvocation of toolInvocations) {
                        parts.push({
                          type: 'tool-invocation',
                          toolInvocation,
                        });
                      }
                    }
                  }

                  return {
                    id: message.id,
                    chatId: id,
                    role: message.role,
                    parts,
                    attachments: 'experimental_attachments' in message ? (message as any).experimental_attachments || [] : [],
                    createdAt: new Date(),
                  };
                }),
              });
            } catch (error) {
              console.error('Failed to save chat');
            }
          }
        },
        experimental_telemetry: {
          isEnabled: true,
          functionId: 'stream-text',
        },
      });

      result.consumeStream();

      result.mergeIntoDataStream(dataStream, {
        sendReasoning: true,
      });
    },
    onError: () => {
      return 'Oops, an error occured!';
    },
  });
}


