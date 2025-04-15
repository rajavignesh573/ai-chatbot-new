// "use client";

// import { useState, useEffect } from "react";
// import { Check } from "lucide-react";
// import { cn } from "@/lib/utils";
// import { useArtifact } from "@/hooks/use-artifact";
// import { useChat } from "@ai-sdk/react";
// import { useParams } from "next/navigation";

// interface Question {
//   id: string;
//   question: string;
//   type: "text" | "radio" | "checkbox";
//   options?: string[];
// }

// interface SelectedOptions {
//   [key: string]: string | string[];
// }

// const ExampleComponent = () => {
//   const params = useParams();
//   const pathname = window.location.pathname;
//   const chatId = pathname.split("/").pop();

//   console.log("Chat ID from URL:", chatId);

//   const [questions, setQuestions] = useState<Question[]>([]);
//   const [selectedOptions, setSelectedOptions] = useState<SelectedOptions>({});
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [currentStep, setCurrentStep] = useState(0);
//   const { setArtifact } = useArtifact();

//   const { append, messages, setMessages } = useChat({
//     id: chatId || "21d72c08-ce51-414c-af17-f7ab4f77da56",
//     api: "/api/chat",
//     initialMessages: [],
//     onError: () => {
//       setError("Failed to send messages");
//     },
//   });

//   useEffect(() => {
//     const fetchQuestions = async () => {
//       try {
//         const response = await fetch("/api/chat/tools/getStroller", {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({}),
//         });

//         if (!response.ok) {
//           throw new Error(`Failed to fetch questions: ${response.statusText}`);
//         }

//         const data = await response.json();
//         const formattedQuestions = data.map((q: any, index: number) => ({
//           id: `q${index + 1}`,
//           question: q.question,
//           type: q.question.toLowerCase().includes("brand")
//             ? "checkbox"
//             : q.options?.length > 0
//             ? "radio"
//             : "text",
//           options: q.options || [],
//         }));
//         setQuestions(formattedQuestions);
//       } catch (error) {
//         setError(
//           error instanceof Error ? error.message : "Failed to fetch questions"
//         );
//         console.error("Error fetching questions:", error);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchQuestions();
//   }, []);

//   const handleInputChange = (questionId: string, value: string) => {
//     if (questions.find((q) => q.id === questionId)?.type === "checkbox") {
//       setSelectedOptions((prev) => {
//         const currentSelections = Array.isArray(prev[questionId])
//           ? (prev[questionId] as string[])
//           : [];
//         const updatedSelections = currentSelections.includes(value)
//           ? currentSelections.filter((item) => item !== value)
//           : [...currentSelections, value];
//         return { ...prev, [questionId]: updatedSelections };
//       });
//     } else {
//       setSelectedOptions((prev) => ({ ...prev, [questionId]: value }));
//     }
//   };

//   const handleNext = () => {
//     if (currentStep < questions.length - 1) {
//       setCurrentStep(currentStep + 1);
//     }
//   };

//   const handlePrevious = () => {
//     if (currentStep > 0) {
//       setCurrentStep(currentStep - 1);
//     }
//   };

//   const handleSubmit = async () => {
//     try {
//       setError(null);

//       // Create a summary of user's answers
//       const summaryContent = `Here's a summary of your preferences for a stroller:

// ${Object.entries(selectedOptions)
//   .map(([questionId, answer]) => {
//     const question = questions.find((q) => q.id === questionId);
//     const answerText = Array.isArray(answer) ? answer.join(", ") : answer;
//     return `• ${question?.question}\n  Answer: ${answerText}`;
//   })
//   .join("\n\n")}`;

//       try {
//         setArtifact((prev) => ({
//           ...prev,
//           isVisible: false,
//           status: "idle",
//         }));

//         await new Promise((resolve) => setTimeout(resolve, 500));

//         const firstMessage = await append({
//           role: "assistant",
//           content: summaryContent,
//         });

//         await new Promise((resolve) => setTimeout(resolve, 2000));

//         const response = await fetch("https://api.dify.ai/v1/chat-messages", {
//           method: "POST",
//           headers: {
//             Authorization: "Bearer app-s1RWQRrLsLZq3xj8cBClIVo4",
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//             inputs: {},
//             query: `Based on your preferences:\n\n${questions
//               .map(
//                 (q) =>
//                   `• ${q.question}\n  Answer: ${
//                     selectedOptions[q.id] || "Not answered"
//                   }`
//               )
//               .join("\n\n")}`,
//             response_mode: "blocking",
//             user: "test_122",
//           }),
//         });

//         const difyData = await response.json();

//         await new Promise((resolve) => setTimeout(resolve, 2000));

//         await append({
//           role: "assistant",
//           content:
//             difyData.answer ||
//             "Based on your preferences, here are my recommendations...",
//         });
//       } catch (error) {
//         console.error("Error in message sequence:", error);
//         setError(
//           error instanceof Error ? error.message : "Error processing messages"
//         );
//         throw error;
//       }
//     } catch (err) {
//       console.error("Error in handleSubmit:", err);
//       if (!error) {
//         setError("Failed to submit preferences");
//       }
//     }
//   };

//   if (isLoading) return <div>Loading questions...</div>;

//   if (error) return <div>Error: {error}</div>;
//   if (questions.length === 0) return <div>No questions available.</div>;

//   const currentQuestion = questions[currentStep];
//   const isLastStep = currentStep === questions.length - 1;

//   const canProceed =
//     currentQuestion.type === "checkbox"
//       ? Array.isArray(selectedOptions[currentQuestion.id]) &&
//         (selectedOptions[currentQuestion.id] as string[]).length > 0
//       : selectedOptions[currentQuestion?.id]?.toString().trim() !== "";

//   return (
//     <div className="max-w-2xl mx-auto p-6">
//       <div className="flex justify-center gap-2 mb-12">
//         {questions.map((_, index) => (
//           <div
//             key={index}
//             className={cn(
//               "w-2 h-2 rounded-full",
//               index <= currentStep ? "bg-black" : "bg-gray-200"
//             )}
//           />
//         ))}
//       </div>

//       <div className="mb-8">
//         <h2 className="text-2xl font-medium mb-8">
//           {currentQuestion.question}
//         </h2>

//         <div className="space-y-3">
//           {currentQuestion.type === "text" ? (
//             <input
//               type="text"
//               value={selectedOptions[currentQuestion.id] || ""}
//               onChange={(e) =>
//                 handleInputChange(currentQuestion.id, e.target.value)
//               }
//               placeholder="Type your answer here..."
//               className="w-full p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
//               autoFocus
//             />
//           ) : currentQuestion.type === "checkbox" ? (
//             <div className="space-y-3">
//               {currentQuestion.options?.map((option) => {
//                 const isSelected =
//                   Array.isArray(selectedOptions[currentQuestion.id]) &&
//                   (selectedOptions[currentQuestion.id] as string[]).includes(
//                     option
//                   );

//                 return (
//                   <label
//                     key={option}
//                     className={cn(
//                       "flex items-center w-full p-4 border rounded-lg cursor-pointer transition-colors",
//                       isSelected
//                         ? "border-black bg-gray-50"
//                         : "hover:border-gray-400"
//                     )}
//                   >
//                     <input
//                       type="checkbox"
//                       name={`question-${currentQuestion.id}`}
//                       value={option}
//                       checked={isSelected}
//                       onChange={() =>
//                         handleInputChange(currentQuestion.id, option)
//                       }
//                       className="sr-only"
//                     />
//                     <span className="flex-1">{option}</span>
//                     {isSelected && (
//                       <div className="flex items-center justify-center w-5 h-5 border-2 border-black rounded">
//                         <Check className="w-3 h-3 text-black" />
//                       </div>
//                     )}
//                   </label>
//                 );
//               })}
//             </div>
//           ) : (
//             <div className="space-y-3">
//               {currentQuestion.options?.map((option) => (
//                 <label
//                   key={option}
//                   className={cn(
//                     "flex items-center w-full p-4 border rounded-lg cursor-pointer transition-colors",
//                     selectedOptions[currentQuestion.id] === option
//                       ? "border-black bg-gray-50"
//                       : "hover:border-gray-400"
//                   )}
//                 >
//                   <input
//                     type="radio"
//                     name={`question-${currentQuestion.id}`}
//                     value={option}
//                     checked={selectedOptions[currentQuestion.id] === option}
//                     onChange={() =>
//                       handleInputChange(currentQuestion.id, option)
//                     }
//                     className="sr-only"
//                   />
//                   <span className="flex-1">{option}</span>
//                   {selectedOptions[currentQuestion.id] === option && (
//                     <div className="w-3 h-3 rounded-full border-4 border-black" />
//                   )}
//                 </label>
//               ))}
//             </div>
//           )}
//         </div>
//       </div>

//       <div className="flex justify-between items-center">
//         <button
//           onClick={handlePrevious}
//           disabled={currentStep === 0}
//           className={cn(
//             "px-6 py-2 rounded-lg transition-colors",
//             currentStep === 0
//               ? "text-gray-400 cursor-not-allowed"
//               : "text-black hover:bg-gray-100"
//           )}
//         >
//           Previous
//         </button>
//         {isLastStep ? (
//           <button
//             onClick={handleSubmit}
//             disabled={!canProceed}
//             className={cn(
//               "px-6 py-2 rounded-lg transition-colors",
//               canProceed
//                 ? "bg-black text-white hover:bg-gray-900"
//                 : "bg-gray-200 text-gray-400 cursor-not-allowed"
//             )}
//           >
//             Submit
//           </button>
//         ) : (
//           <button
//             onClick={handleNext}
//             disabled={!canProceed}
//             className={cn(
//               "px-6 py-2 rounded-lg transition-colors",
//               canProceed
//                 ? "bg-black text-white hover:bg-gray-900"
//                 : "bg-gray-200 text-gray-400 cursor-not-allowed"
//             )}
//           >
//             Next
//           </button>
//         )}
//       </div>
//     </div>
//   );
// };

// export default ExampleComponent;

"use client";

import { useState, useEffect } from "react";
import { Check } from "lucide-react";
import { cn, generateUUID } from "@/lib/utils";
import { useArtifact } from "@/hooks/use-artifact";
import { useChat } from "@ai-sdk/react";
import { useParams } from "next/navigation";

interface Question {
  id: string;
  question: string;
  type: "text" | "radio" | "checkbox";
  options?: string[];
}

interface SelectedOptions {
  [key: string]: string | string[];
}

const ExampleComponent = () => {
  const params = useParams();
  const pathname = window.location.pathname;
  const chatId = pathname.split("/").pop();

  console.log("Chat ID from URL:", chatId);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<SelectedOptions>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const { setArtifact, artifact } = useArtifact();

  const { append, messages, setMessages } = useChat({
    id: chatId || "21d72c08-ce51-414c-af17-f7ab4f77da56",
    api: "/api/chat",
    initialMessages: [],
    onError: () => {
      setError("Failed to send messages");
    },
  });

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await fetch("/api/chat/tools/getStroller", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch questions: ${response.statusText}`);
        }

        const data = await response.json();
        const formattedQuestions = data.map((q: any, index: number) => ({
          id: `q${index + 1}`,
          question: q.question,
          type: q.question.toLowerCase().includes("brand")
            ? "checkbox"
            : q.options?.length > 0
            ? "radio"
            : "text",
          options: q.options || [],
        }));
        setQuestions(formattedQuestions);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to fetch questions"
        );
        console.error("Error fetching questions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  const handleInputChange = (questionId: string, value: string) => {
    if (questions.find((q) => q.id === questionId)?.type === "checkbox") {
      setSelectedOptions((prev) => {
        const currentSelections = Array.isArray(prev[questionId])
          ? (prev[questionId] as string[])
          : [];
        const updatedSelections = currentSelections.includes(value)
          ? currentSelections.filter((item) => item !== value)
          : [...currentSelections, value];
        return { ...prev, [questionId]: updatedSelections };
      });
    } else {
      setSelectedOptions((prev) => ({ ...prev, [questionId]: value }));
    }
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setError(null);

      // Create a summary of user's answers
      const summaryContent = `Here's a summary of your preferences for a stroller:

${Object.entries(selectedOptions)
  .map(([questionId, answer]) => {
    const question = questions.find((q) => q.id === questionId);
    const answerText = Array.isArray(answer) ? answer.join(", ") : answer;
    return `• ${question?.question}
  Answer: ${answerText}`;
  })
  .join("\n\n")}`;

      try {
        // Don't close the artifact yet
        setIsLoading(true);

        // Get recommendations from Dify API
        const response = await fetch("https://api.dify.ai/v1/chat-messages", {
          method: "POST",
          headers: {
            Authorization: "Bearer app-s1RWQRrLsLZq3xj8cBClIVo4",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: {},
            query: `Based on your preferences:

${questions
  .map(
    (q) => `• ${q.question}
  Answer: ${selectedOptions[q.id] || "Not answered"}`
  )
  .join("\n\n")}`,
            response_mode: "blocking",
            user: "test_122",
          }),
        });

        const difyData = await response.json();
        const recommendations =
          difyData.answer ||
          "Based on your preferences, here are my recommendations...";

        // Save the document to the database with a unique ID
        const documentId = artifact.documentId || generateUUID();
        // const documentTitle = "Stroller Recommendations";
        const documentTitle = isLastStep
          ? "Stroller Recommendations"
          : "Stroller Questionnaire";
        const documentContent = JSON.stringify({
          summary: summaryContent,
          recommendations: recommendations,
          answers: selectedOptions,
        });

        // Save the document
        await fetch(`/api/document?id=${documentId}`, {
          method: "POST",
          body: JSON.stringify({
            title: documentTitle,
            content: documentContent,
            kind: "stroller_recommendations",
          }),
        });

        // Create a new recommendations artifact
        setArtifact((prev) => ({
          ...prev,
          documentId: documentId,
          title: documentTitle,
          content: documentContent,
          status: "idle",
          kind: "stroller_recommendations",
        }));

        // Add a message to the chat with the recommendations and a button to reopen them
        await append({
          role: "assistant",
          // content: `${summaryContent}\n\n**Recommendations:**\n\n${recommendations}\n\nYou can view these recommendations again by clicking the button below.`,
          content: `I've analyzed your preferences and created personalized stroller recommendations. You can view the detailed recommendations by clicking below.`,
          toolInvocations: [
            {
              toolName: "createDocument",
              toolCallId: documentId,
              state: "result",
              args: {
                title: documentTitle,
                kind: "stroller_recommendations",
              },
              result: {
                id: documentId,
                title: documentTitle,
                kind: "stroller_recommendations",
                content: "Stroller recommendations based on your preferences",
              },
            },
          ],
        });
      } catch (error) {
        console.error("Error in message sequence:", error);
        setError(
          error instanceof Error ? error.message : "Error processing messages"
        );
        throw error;
      } finally {
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Error in handleSubmit:", err);
      if (!error) {
        setError("Failed to submit preferences");
      }
    }
  };

  // if (isLoading) return <div>Loading questions...</div>;
  if (isLoading) {
    // Show different loading message based on whether we're submitting or initially loading
    const loadingMessage =
      currentStep === questions.length - 1
        ? "Applying preferences..."
        : "Loading questions...";
    return <div>{loadingMessage}</div>;
  }

  if (error) return <div>Error: {error}</div>;
  if (questions.length === 0) return <div>No questions available.</div>;

  const currentQuestion = questions[currentStep];
  const isLastStep = currentStep === questions.length - 1;

  const canProceed =
    currentQuestion.type === "checkbox"
      ? Array.isArray(selectedOptions[currentQuestion.id]) &&
        (selectedOptions[currentQuestion.id] as string[]).length > 0
      : selectedOptions[currentQuestion?.id]?.toString().trim() !== "";

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex justify-center gap-2 mb-12">
        {questions.map((_, index) => (
          <div
            key={index}
            className={cn(
              "w-2 h-2 rounded-full",
              index <= currentStep ? "bg-black" : "bg-gray-200"
            )}
          />
        ))}
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-medium mb-8">
          {currentQuestion.question}
        </h2>

        <div className="space-y-3">
          {currentQuestion.type === "text" ? (
            <input
              type="text"
              value={selectedOptions[currentQuestion.id] || ""}
              onChange={(e) =>
                handleInputChange(currentQuestion.id, e.target.value)
              }
              placeholder="Type your answer here..."
              className="w-full p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              autoFocus
            />
          ) : currentQuestion.type === "checkbox" ? (
            <div className="space-y-3">
              {currentQuestion.options?.map((option) => {
                const isSelected =
                  Array.isArray(selectedOptions[currentQuestion.id]) &&
                  (selectedOptions[currentQuestion.id] as string[]).includes(
                    option
                  );

                return (
                  <label
                    key={option}
                    className={cn(
                      "flex items-center w-full p-4 border rounded-lg cursor-pointer transition-colors",
                      isSelected
                        ? "border-black bg-gray-50"
                        : "hover:border-gray-400"
                    )}
                  >
                    <input
                      type="checkbox"
                      name={`question-${currentQuestion.id}`}
                      value={option}
                      checked={isSelected}
                      onChange={() =>
                        handleInputChange(currentQuestion.id, option)
                      }
                      className="sr-only"
                    />
                    <span className="flex-1">{option}</span>
                    {isSelected && (
                      <div className="flex items-center justify-center w-5 h-5 border-2 border-black rounded">
                        <Check className="w-3 h-3 text-black" />
                      </div>
                    )}
                  </label>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              {currentQuestion.options?.map((option) => (
                <label
                  key={option}
                  className={cn(
                    "flex items-center w-full p-4 border rounded-lg cursor-pointer transition-colors",
                    selectedOptions[currentQuestion.id] === option
                      ? "border-black bg-gray-50"
                      : "hover:border-gray-400"
                  )}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value={option}
                    checked={selectedOptions[currentQuestion.id] === option}
                    onChange={() =>
                      handleInputChange(currentQuestion.id, option)
                    }
                    className="sr-only"
                  />
                  <span className="flex-1">{option}</span>
                  {selectedOptions[currentQuestion.id] === option && (
                    <div className="w-3 h-3 rounded-full border-4 border-black" />
                  )}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center">
        <button
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className={cn(
            "px-6 py-2 rounded-lg transition-colors",
            currentStep === 0
              ? "text-gray-400 cursor-not-allowed"
              : "text-black hover:bg-gray-100"
          )}
        >
          Previous
        </button>
        {isLastStep ? (
          <button
            onClick={handleSubmit}
            disabled={!canProceed}
            className={cn(
              "px-6 py-2 rounded-lg transition-colors",
              canProceed
                ? "bg-black text-white hover:bg-gray-900"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            )}
          >
            Submit
          </button>
        ) : (
          <button
            onClick={handleNext}
            disabled={!canProceed}
            className={cn(
              "px-6 py-2 rounded-lg transition-colors",
              canProceed
                ? "bg-black text-white hover:bg-gray-900"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            )}
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
};

export default ExampleComponent;
