import { openai } from "@ai-sdk/openai";
import { fireworks } from "@ai-sdk/fireworks";
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import { difyProvider } from "./dify";

export const DEFAULT_CHAT_MODEL: string = "chat-model-small";

export const myProvider = customProvider({
  languageModels: {
    "chat-model-small": openai("gpt-4o-mini"),
    "chat-model-large": openai("gpt-4o"),
    "chat-model-reasoning": wrapLanguageModel({
      model: fireworks("accounts/fireworks/models/deepseek-r1"),
      middleware: extractReasoningMiddleware({ tagName: "think" }),
    }),
    "title-model": openai("gpt-4o"),
    "artifact-model": openai("gpt-4o-mini"),
    "stroller-model": openai("gpt-4o"),
    "dify-chat": difyProvider.languageModel("dify-chat"),
    "dify-wizard": difyProvider.languageModel("dify-wizard"),
    "dify-stroller": difyProvider.languageModel("dify-stroller"),
  },
  imageModels: {
    "small-model": openai.image("dall-e-2"),
    "large-model": openai.image("dall-e-3"),
  },
});

interface ChatModel {
  id: string;
  name: string;
  description: string;
}

export const chatModels: Array<ChatModel> = [
  {
    id: "chat-model-small",
    name: "Small model",
    description: "Small model for fast, lightweight tasks",
  },
  {
    id: "chat-model-large",
    name: "Large model",
    description: "Large model for complex, multi-step tasks",
  },
  {
    id: "chat-model-reasoning",
    name: "Reasoning model",
    description: "Uses advanced reasoning",
  },
  {
    id: "dify-chat",
    name: "Dify Chat",
    description: "General purpose chat model",
  },
  {
    id: "dify-wizard",
    name: "Dify Wizard",
    description: "Advanced assistant for complex tasks",
  },
  {
    id: "dify-stroller",
    name: "Stroller Assistant",
    description: "Get personalized stroller recommendations",
  },
];
