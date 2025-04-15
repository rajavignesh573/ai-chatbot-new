// import { createDocumentHandler } from "@/lib/artifacts/server";

// export const strollerRecommendationsDocumentHandler =
//   createDocumentHandler<"stroller_recommendations">({
//     kind: "stroller_recommendations",

//     onCreateDocument: async ({ title, dataStream }) => {
//       // Send initial content update
//       dataStream.writeData({
//         type: "content-update",
//         content:
//           "Preparing stroller recommendations based on your preferences...",
//       });

//       // Sample stroller recommendations data
//       // In a real implementation, this would come from an API or database based on user preferences
//       const sampleRecommendations = [
//         {
//           name: "City Mini GT2",
//           price: "$399.99",
//           features: [
//             "All-terrain wheels",
//             "One-hand quick fold",
//             "Adjustable handlebar",
//             "Large canopy with peek-a-boo windows",
//           ],
//           description:
//             "Perfect for urban parents who need a versatile stroller that can handle city sidewalks and park trails alike.",
//           rating: 5,
//           bestFor: "Urban families",
//         },
//         {
//           name: "UPPAbaby VISTA V2",
//           price: "$969.99",
//           features: [
//             "Expandable for multiple children",
//             "Large storage basket",
//             "Reversible seat",
//             "All-wheel suspension",
//           ],
//           description:
//             "A premium stroller that grows with your family, offering multiple configurations for siblings or twins.",
//           rating: 5,
//           bestFor: "Growing families",
//         },
//         {
//           name: "BOB Gear Alterrain Pro",
//           price: "$599.99",
//           features: [
//             "Jogging-friendly design",
//             "Air-filled tires",
//             "Suspension system",
//             "Hand-activated brake",
//           ],
//           description:
//             "Designed for active parents who want to maintain their running routine with baby in tow.",
//           rating: 4,
//           bestFor: "Active parents",
//         },
//         {
//           name: "Graco NimbleLite",
//           price: "$99.99",
//           features: [
//             "Lightweight (under 15 lbs)",
//             "One-hand fold",
//             "Parent tray with cup holders",
//             "Compatible with Graco infant car seats",
//           ],
//           description:
//             "An affordable, lightweight option that's perfect for quick trips and travel.",
//           rating: 4,
//           bestFor: "Budget-conscious parents",
//         },
//       ];

//       // Stream the recommendations to the client
//       dataStream.writeData({
//         type: "recommendations-data",
//         content: sampleRecommendations,
//       });

//       // Return content for the document
//       return JSON.stringify(sampleRecommendations);
//     },

//     onUpdateDocument: async ({
//       document,
//       description,
//       dataStream,
//       session,
//     }) => {
//       dataStream.writeData({
//         type: "content-update",
//         content: "Updating stroller recommendations...",
//       });

//       // Parse the current content to get existing recommendations
//       let currentRecommendations = [];
//       try {
//         currentRecommendations = JSON.parse(document.content || "[]");
//       } catch (e) {
//         console.error("Error parsing document content:", e);
//       }

//       // In a real implementation, you would filter or modify the recommendations based on the description
//       // For this example, we'll just return the same recommendations
//       dataStream.writeData({
//         type: "recommendations-data",
//         content: currentRecommendations,
//       });

//       return document.content || "[]";
//     },
//   });

import { createDocumentHandler } from "@/lib/artifacts/server";

export const strollerRecommendationsDocumentHandler =
  createDocumentHandler<"stroller_recommendations">({
    kind: "stroller_recommendations",

    onCreateDocument: async ({ title, dataStream }) => {
      // Initial content for the recommendations document
      const initialContent = JSON.stringify({
        summary: "Loading your preferences...",
        recommendations: "Preparing your stroller recommendations...",
        answers: {},
      });

      dataStream.writeData({
        type: "content-update",
        content: initialContent,
      });

      return initialContent;
    },

    onUpdateDocument: async ({ document, description, dataStream }) => {
      // Return the existing content
      return document.content || "";
    },
  });
