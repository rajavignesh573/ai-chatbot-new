import { smoothStream, streamText } from "ai";
import { myProvider } from "@/lib/ai/models";
import { createDocumentHandler } from "@/lib/artifacts/server";
import { updateDocumentPrompt } from "@/lib/ai/prompts";

export const strollerQuestionsDocumentHandler =
  createDocumentHandler<"stroller_questions">({
    kind: "stroller_questions",
    // Called when the document is first created.
    onCreateDocument: async ({ title, dataStream }) => {
      let draftContent = "";

      // Send initial content
      dataStream.writeData({
        type: "content-update",
        content: "Initializing stroller questions...\n",
      });

      // Ensure we return some content
      return draftContent || "New stroller questions";
    },
    // Called when updating the document based on user modifications.
    onUpdateDocument: async ({ document, description, dataStream }) => {
      let draftContent = document.content || "";

      // Send update confirmation
      dataStream.writeData({
        type: "content-update",
        content: "Updating stroller recommendations...\n",
      });

      // Ensure we return some content
      return draftContent || "Updated stroller recommendations";
    },
  });
