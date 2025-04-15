// import { Artifact } from "@/components/create-artifact";
// import { toast } from "sonner";

// interface StrollerRecommendation {
//   name: string;
//   price: string;
//   features: string[];
//   description: string;
//   imageUrl?: string;
//   rating: number;
//   bestFor: string;
// }

// interface StrollerRecommendationsMetadata {
//   recommendations: StrollerRecommendation[];
//   loading: boolean;
// }

// export const strollerRecommendationsArtifact = new Artifact<
//   "stroller_recommendations",
//   StrollerRecommendationsMetadata
// >({
//   kind: "stroller_recommendations",
//   description: "Displays stroller recommendations based on user preferences",

//   initialize: async ({ setMetadata }) => {
//     setMetadata({
//       recommendations: [],
//       loading: true,
//     });
//   },

//   onStreamPart: ({ streamPart, setMetadata, setArtifact }) => {
//     if (streamPart.type === "recommendations-data") {
//       setMetadata((metadata) => ({
//         ...metadata,
//         recommendations: streamPart.content as StrollerRecommendation[],
//         loading: false,
//       }));

//       setArtifact((draftArtifact) => ({
//         ...draftArtifact,
//         isVisible: true,
//         status: "idle",
//       }));
//     }

//     if (streamPart.type === "content-update") {
//       setArtifact((draftArtifact) => ({
//         ...draftArtifact,
//         content: streamPart.content as string,
//         status: "streaming",
//       }));
//     }
//   },

//   content: ({ metadata, isLoading }) => {
//     if (isLoading || (metadata && metadata.loading)) {
//       return (
//         <div className="flex items-center justify-center h-full">
//           Loading recommendations...
//         </div>
//       );
//     }

//     if (
//       !metadata ||
//       !metadata.recommendations ||
//       metadata.recommendations.length === 0
//     ) {
//       return (
//         <div className="flex items-center justify-center h-full">
//           No recommendations available
//         </div>
//       );
//     }

//     return (
//       <div className="p-6 max-w-4xl mx-auto">
//         <h2 className="text-2xl font-bold mb-6">Recommended Strollers</h2>

//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           {metadata.recommendations.map((stroller, index) => (
//             <StrollerCard key={index} stroller={stroller} />
//           ))}
//         </div>
//       </div>
//     );
//   },

//   actions: [
//     {
//       icon: <span>🔄</span>,
//       description: "Refresh recommendations",
//       onClick: async ({ appendMessage }) => {
//         appendMessage({
//           role: "user",
//           content: "Can you show me different stroller options?",
//         });
//         toast.success("Refreshing recommendations...");
//       },
//     },
//   ],

//   toolbar: [
//     {
//       icon: <span>💰</span>,
//       description: "Filter by price",
//       onClick: ({ appendMessage }) => {
//         appendMessage({
//           role: "user",
//           content: "Show me budget-friendly stroller options under $300",
//         });
//       },
//     },
//     {
//       icon: <span>🏆</span>,
//       description: "Show top-rated strollers",
//       onClick: ({ appendMessage }) => {
//         appendMessage({
//           role: "user",
//           content: "Show me only the highest-rated strollers",
//         });
//       },
//     },
//   ],
// });

// function StrollerCard({ stroller }: { stroller: StrollerRecommendation }) {
//   return (
//     <div className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
//       <div className="h-48 bg-gray-100 flex items-center justify-center">
//         {stroller.imageUrl ? (
//           <img
//             src={stroller.imageUrl || "/placeholder.svg"}
//             alt={stroller.name}
//             className="h-full w-full object-contain"
//           />
//         ) : (
//           <img
//             src={`/placeholder.svg?height=200&width=300&text=${encodeURIComponent(
//               stroller.name
//             )}`}
//             alt={stroller.name}
//             className="h-full w-full object-contain"
//           />
//         )}
//       </div>

//       <div className="p-4">
//         <div className="flex justify-between items-start mb-2">
//           <h3 className="text-lg font-semibold">{stroller.name}</h3>
//           <span className="text-lg font-bold text-blue-600">
//             {stroller.price}
//           </span>
//         </div>

//         <div className="flex items-center mb-2">
//           <div className="flex">
//             {[...Array(5)].map((_, i) => (
//               <span
//                 key={i}
//                 className={
//                   i < stroller.rating ? "text-yellow-500" : "text-gray-300"
//                 }
//               >
//                 ★
//               </span>
//             ))}
//           </div>
//           <span className="ml-2 text-sm text-gray-600">
//             Best for: {stroller.bestFor}
//           </span>
//         </div>

//         <p className="text-gray-700 text-sm mb-3">{stroller.description}</p>

//         <div className="mt-2">
//           <h4 className="text-sm font-medium mb-1">Key Features:</h4>
//           <ul className="text-sm text-gray-600">
//             {stroller.features.slice(0, 3).map((feature, index) => (
//               <li key={index} className="flex items-center">
//                 <span className="mr-1">•</span> {feature}
//               </li>
//             ))}
//           </ul>
//         </div>

//         <button className="mt-4 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors">
//           View Details
//         </button>
//       </div>
//     </div>
//   );
// }

"use client";

import { Artifact } from "@/components/create-artifact";
import { CopyIcon, RedoIcon, UndoIcon } from "@/components/icons";
import { toast } from "sonner";

interface StrollerRecommendationsMetadata {
  // Define any metadata your artifact might need
  viewMode: "summary" | "details";
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

  onStreamPart: ({ streamPart, setArtifact }) => {
    if (streamPart.type === "content-update") {
      setArtifact((draftArtifact) => ({
        ...draftArtifact,
        content: streamPart.content as string,
        isVisible: true,
        status: "streaming",
      }));
    }
  },

  content: ({ content, metadata, setMetadata }) => {
    // Parse the content which contains summary, recommendations and answers
    let parsedContent;
    try {
      parsedContent = JSON.parse(content);
    } catch (e) {
      console.error("Error parsing content:", e);
      return <div>Error loading recommendations. Please try again.</div>;
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
              className={`px-4 py-2 rounded-lg transition-colors ${
                metadata?.viewMode === "summary"
                  ? "bg-black text-white"
                  : "bg-gray-200"
              }`}
              onClick={() => setMetadata({ ...metadata, viewMode: "summary" })}
            >
              Recommendations
            </button>
            <button
              className={`px-4 py-2 rounded-lg transition-colors ${
                metadata?.viewMode === "details"
                  ? "bg-black text-white"
                  : "bg-gray-200"
              }`}
              onClick={() => setMetadata({ ...metadata, viewMode: "details" })}
            >
              Your Answers
            </button>
          </div>

          {metadata?.viewMode === "summary" ? (
            <div className="space-y-6">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="text-lg font-medium mb-3">
                  Our Recommendations
                </h3>
                <div className="whitespace-pre-line">{recommendations}</div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="text-lg font-medium mb-3">Your Preferences</h3>
                <div className="whitespace-pre-line">{summary}</div>
              </div>
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
          navigator.clipboard.writeText(recommendations);
          toast.success("Recommendations copied to clipboard!");
        } catch (e) {
          toast.error("Failed to copy recommendations");
        }
      },
    },
  ],

  toolbar: [],
});
