"use client";

import { Artifact } from "@/components/create-artifact";
import { CopyIcon, RedoIcon, UndoIcon } from "@/components/icons";
import { toast } from "sonner";

interface StrollerRecommendation {
  name: string;
  price: string;
  features: string[];
  description: string;
  bestFor: string;
  rating: number;
  link: string;
}

interface StrollerRecommendationsMetadata {
  viewMode: "summary" | "details";
}

interface ParsedContent {
  summary: string;
  recommendations: string;
  answers: StrollerRecommendation[];
}

export const strollerRecommendationsArtifact = new Artifact<
  "stroller_recommendations",
  StrollerRecommendationsMetadata
>({
  kind: "stroller_recommendations",
  description: "Stroller recommendations based on your preferences",

  initialize: async ({ setMetadata }) => {
    setMetadata({
      viewMode: "summary",
    });
  },

  // Minimal fix specifically for "New stroll..." text response
  onStreamPart: ({ streamPart, setArtifact }) => {
    if (streamPart.type === "text-delta") {
      try {
        // Get the content as a string
        const contentStr = typeof streamPart.content === 'string' 
          ? streamPart.content 
          : JSON.stringify(streamPart.content);
        
        // IMPORTANT: Check if it's obviously not JSON by checking first character
        const firstChar = contentStr.trim()[0];
        if (firstChar !== '{' && firstChar !== '[') {
          // It's a text response, not JSON - directly create a valid structure
          setArtifact((draftArtifact) => ({
            ...draftArtifact,
            content: JSON.stringify({
              summary: "Stroller Recommendations",
              recommendations: contentStr,
              answers: [{
                name: "Stroller Recommendations",
                price: "Various",
                features: ["Please see the text recommendations"],
                description: contentStr.substring(0, 100) + (contentStr.length > 100 ? '...' : ''),
                bestFor: "Your specific needs",
                rating: 5,
                link: "#"
              }]
            }),
            isVisible: true,
            status: "streaming",
          }));
          return;
        }
        
        // Try to use it as JSON (only if it looks like JSON)
        setArtifact((draftArtifact) => ({
          ...draftArtifact,
          content: contentStr,
          isVisible: true,
          status: "streaming",
        }));
      } catch (e) {
        console.error("Error handling stream part:", e);
        // Fallback
        const fallbackContent = JSON.stringify({
          summary: "Stroller Recommendations",
          recommendations: "There was an error processing the recommendations. Please try again.",
          answers: []
        });
        
        setArtifact((draftArtifact) => ({
          ...draftArtifact,
          content: fallbackContent,
          isVisible: true,
          status: "error",
        }));
      }
    }
  },

  content: ({ content, metadata, setMetadata }) => {
    // Parse the content which contains summary, recommendations and answers
    let parsedContent: ParsedContent;
    try {
      parsedContent = JSON.parse(content);
    } catch (e) {
      console.error("Error parsing content:", e);
      // If we get here, it means our onStreamPart didn't handle something right
      // Let's recover by creating valid JSON from whatever we have
      return (
        <div className="max-w-2xl mx-auto p-6">
          <div className="mb-8">
            <h2 className="text-2xl font-medium mb-4">
              Stroller Recommendations
            </h2>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h3 className="text-lg font-medium mb-3">Recommendations</h3>
              <div className="whitespace-pre-line">
                {typeof content === 'string' ? content : 'No recommendations available.'}
              </div>
            </div>
          </div>
        </div>
      );
    }

    const { summary, recommendations, answers } = parsedContent;

    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-8">
          <h2 className="text-2xl font-medium mb-4">
            Your Stroller Recommendations
          </h2>

          <div className="flex space-x-4 mb-6">
            <button
              type="button"
              className={`px-4 py-2 rounded-lg transition-colors ${
                metadata?.viewMode === "summary"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200"
              }`}
              onClick={() => setMetadata({ ...metadata, viewMode: "summary" })}
            >
              Recommendations
            </button>
            <button
              type="button"
              className={`px-4 py-2 rounded-lg transition-colors ${
                metadata?.viewMode === "details"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200"
              }`}
              onClick={() => setMetadata({ ...metadata, viewMode: "details" })}
            >
              Details
            </button>
          </div>

          {metadata?.viewMode === "summary" ? (
            <div className="space-y-6">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="text-lg font-medium mb-3">Summary</h3>
                <div className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  {summary || "Based on your preferences, here are our recommendations:"}
                </div>
                <div className="whitespace-pre-line font-mono text-sm">
                  {recommendations || "No specific recommendations available."}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.isArray(answers) && answers.length > 0 ? (
                answers.map((stroller, index) => (
                  <div
                    key={`${stroller.name || 'stroller'}-${index}`}
                    className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <h3 className="text-lg font-medium mb-2">{stroller.name || "Unnamed Stroller"}</h3>
                    <div className="space-y-2">
                      <p className="text-blue-600 font-medium">{stroller.price || "Price not specified"}</p>
                      <p className="text-sm text-gray-600">
                        {stroller.description || "No description available"}
                      </p>
                      <div>
                        <p className="font-medium mb-1">Features:</p>
                        <ul className="list-disc list-inside text-sm text-gray-600">
                          {Array.isArray(stroller.features) && stroller.features.length > 0 ? (
                            stroller.features.map((feature, i) => (
                              <li key={`feature-${i}`}>{feature}</li>
                            ))
                          ) : (
                            <li>No features listed</li>
                          )}
                        </ul>
                      </div>
                      <div className="flex items-center">
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <span key={`star-${i}`}>
                              {i < Math.floor(stroller.rating || 0) ? "★" : "☆"}
                            </span>
                          ))}
                        </div>
                        <span className="ml-2 text-sm text-gray-600">
                          ({stroller.rating || 0}/5)
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Best for: {stroller.bestFor || "Not specified"}
                      </p>
                      {stroller.link && (
                        <a
                          href={stroller.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block mt-2 text-blue-600 hover:underline"
                        >
                          View Details →
                        </a>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p>No detailed stroller information available.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  },

  actions: [
    {
      icon: <UndoIcon size={18} />,
      description: "View Previous version",
      onClick: ({ handleVersionChange }) => {
        handleVersionChange("prev");
      },
      isDisabled: ({ currentVersionIndex }) => {
        return currentVersionIndex === 0;
      },
    },
    {
      icon: <RedoIcon size={18} />,
      description: "View Next version",
      onClick: ({ handleVersionChange }) => {
        handleVersionChange("next");
      },
      isDisabled: ({ isCurrentVersion }) => {
        return isCurrentVersion;
      },
    },
    {
      icon: <CopyIcon size={18} />,
      description: "Copy recommendations to clipboard",
      onClick: ({ content }) => {
        try {
          const { recommendations } = JSON.parse(content);
          navigator.clipboard.writeText(recommendations || "No recommendations available");
          toast.success("Recommendations copied to clipboard!");
        } catch (e) {
          // Handle the case where content isn't valid JSON
          if (typeof content === 'string') {
            navigator.clipboard.writeText(content);
            toast.success("Content copied to clipboard!");
          } else {
            toast.error("Failed to copy recommendations");
          }
          console.error("Error copying recommendations:", e);
        }
      },
    },
  ],

  toolbar: [],
});