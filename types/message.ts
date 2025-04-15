export type TextUIPart = {
  type: 'text';
  text: string;
};

export type ReasoningUIPart = {
  type: 'reasoning';
  reasoning: string;
};

export type ToolInvocationUIPart = {
  type: 'tool-invocation';
  toolInvocation: {
    toolName: string;
    toolCallId: string;
    state: 'call' | 'result' | 'partial-call';
    args?: any;
    result?: any;
    step?: number;
  };
};

export type MessagePart = TextUIPart | ReasoningUIPart | ToolInvocationUIPart;

export type Attachment = {
  url: string;
  type: string;
  name: string;
};

export interface CustomMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'data';
  content?: string;
  parts?: MessagePart[];
  attachments?: Attachment[];
  createdAt: Date;
} 