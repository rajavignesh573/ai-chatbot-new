import { Artifact } from "@/components/create-artifact";
import ExampleComponent from "@/components/example-component";
import { toast } from "sonner";

interface CustomArtifactMetadata {
  // Define metadata your custom artifact might need—the example below is minimal.
  info: string;
}

export const strollerQuestionsArtifact = new Artifact<
  "stroller_questions",
  CustomArtifactMetadata
>({
  kind: "stroller_questions",
  description: "A custom artifact for stroller recommendations.",
  // Initialization can fetch any extra data or perform side effects
  initialize: async ({ documentId, setMetadata }) => {
    // For example, initialize the artifact with default metadata.
    setMetadata({
      info: `Document ${documentId} initialized.`,
    });
  },

  // Handle streamed parts from the server (if your artifact supports streaming updates)
  onStreamPart: ({ streamPart, setMetadata, setArtifact }) => {
    if (streamPart.type === "info-update") {
      setMetadata((metadata) => ({
        ...metadata,
        info: streamPart.content as string,
      }));
    }
    if (streamPart.type === "content-update") {
      setArtifact((draftArtifact) => ({
        ...draftArtifact,
        content: draftArtifact.content + (streamPart.content as string),
        status: "streaming",
      }));
    }
  },
  // Defines how the artifact content is rendered
  content: ({
    mode,
    status,
    content,
    isCurrentVersion,
    currentVersionIndex,
    onSaveContent,
    getDocumentContentById,
    isLoading,
    metadata,
  }) => {
    if (isLoading) {
      return <div>Loading custom artifact...</div>;
    }

    if (mode === "diff") {
      const oldContent = getDocumentContentById(currentVersionIndex - 1);
      const newContent = getDocumentContentById(currentVersionIndex);
      return (
        <div>
          <h3>Diff View</h3>
          <div style={{ marginBottom: "20px" }}>
            <button
              className="nav-button"
              onClick={() => handleVersionChange("prev")}
              disabled={currentVersionIndex === 0}
            >
              Previous
            </button>
            <button
              className="nav-button"
              onClick={() => handleVersionChange("next")}
              disabled={isCurrentVersion}
            >
              Next
            </button>
          </div>
          <pre>{oldContent}</pre>
          <pre>{newContent}</pre>
        </div>
      );
    }

    return (
      <div className="custom-artifact">
        <ExampleComponent
          content={content}
          metadata={metadata}
          onSaveContent={onSaveContent}
          isCurrentVersion={isCurrentVersion}
        />
      </div>
    );
  },
  // An optional set of actions exposed in the artifact toolbar.
  actions: [
    {
      icon: <span>⟳</span>,
      description: "Refresh artifact info",
      onClick: async ({ content }) => {
        // Make sure we're not sending empty messages
        if (!content.trim()) {
          toast.error("No content to refresh");
          return;
        }

        try {
          // Your refresh logic here
          toast.success("Refreshed successfully");
        } catch (error) {
          toast.error("Failed to refresh");
        }
      },
    },
  ],
  // Additional toolbar actions for more control
  toolbar: [
    {
      icon: <span>✎</span>,
      description: "Edit custom artifact",
      onClick: async ({ content }) => {
        if (!content.trim()) {
          toast.error("No content to edit");
          return;
        }

        try {
          // Your edit logic here
          toast.success("Edit successful");
        } catch (error) {
          toast.error("Failed to edit");
        }
      },
    },
  ],
});
