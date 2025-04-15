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

import { useState } from "react";
import { Check, Star, ShoppingCart, ChevronDown, ChevronUp } from "lucide-react";
import { cn, generateUUID } from "@/lib/utils";
import { useArtifact } from "@/hooks/use-artifact";
import { useChat } from "@ai-sdk/react";

interface Question {
  id: string;
  question: string;
  type: "text" | "radio" | "checkbox";
  options?: string[];
}

interface SelectedOptions {
  [key: string]: string | string[];
}

interface StrollerRecommendation {
  name: string;
  price: string;
  features: string[];
  description: string;
  bestFor: string;
  rating: number;
  link: string;
  image?: string;
}

const ExampleComponent = () => {
  const pathname = window.location.pathname;
  const chatId = pathname.split("/").pop();

  const [questions, setQuestions] = useState<Question[]>([
    {
      id: "q1",
      question: "Where do you live?",
      type: "radio",
      options: ["Big City", "Suburban Area", "Rural Area", "Mixed Environment"]
    },
    {
      id: "q2",
      question: "What type of home do you live in?",
      type: "radio",
      options: ["House with stairs", "Apartment without lift", "Apartment with elevator", "Single-level home"]
    },
    {
      id: "q3",
      question: "How much space do you have in your trunk for a stroller?",
      type: "radio",
      options: ["Limited trunk space", "Average trunk space", "Large trunk space", "I don't have a car"]
    },
    {
      id: "q4",
      question: "Are you planning to have more children in the future?",
      type: "radio",
      options: ["Yes, Planning for more children", "No, Just one child", "Unsure at this time"]
    },
    {
      id: "q5",
      question: "What's your height?",
      type: "radio",
      options: ["Under 5'2\"", "5'2\" - 5'8\"", "5'9\" - 6'2\"", "Over 6'2\""]
    },
    {
      id: "q6",
      question: "Are there any specific stroller brands you're interested in?",
      type: "checkbox",
      options: ["UPPAbaby", "Bugaboo", "Baby Jogger", "Nuna", "Cybex", "Thule", "BOB", "Doona", "Chicco", "Graco", "Inglesina"]
    }
  ]);
  
  const [selectedOptions, setSelectedOptions] = useState<SelectedOptions>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [recommendations, setRecommendations] = useState<StrollerRecommendation[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [sortOption, setSortOption] = useState('recommended');
  const { setArtifact, artifact } = useArtifact();

  const { append } = useChat({
    id: chatId || "21d72c08-ce51-414c-af17-f7ab4f77da56",
    api: "/api/chat",
    initialMessages: [],
    onError: () => {
      setError("Failed to send messages");
    },
  });

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

  const toggleExpandCard = (index: number) => {
    if (expandedCard === index) {
      setExpandedCard(null);
    } else {
      setExpandedCard(index);
    }
  };

  const getPlaceholderImage = (name: string): string => {
    const hash = name.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const color = `${Math.abs(hash) % 255},${Math.abs(hash * 2) % 255},${Math.abs(hash * 3) % 255}`;
    return `/api/placeholder/400/320?text=${encodeURIComponent(name)}&bgcolor=rgb(${color})`;
  };

  const getDefaultRecommendations = (): StrollerRecommendation[] => {
    return [
      {
        name: "UPPAbaby VISTA V2",
        price: "$1,099.99",
        features: ["Expandable for multiple children", "Large storage basket", "All-wheel suspension system", "Reversible, reclining toddler seat"],
        description: "Premium convertible stroller system that grows with your family",
        bestFor: "Growing families who need long-term versatility",
        rating: 4.8,
        link: "#"
      },
      {
        name: "Baby Jogger City Mini GT2",
        price: "$399.99",
        features: ["All-terrain forever-air rubber tires", "One-hand quick fold mechanism", "Adjustable handlebar", "Multi-position recline"],
        description: "All-terrain compact stroller with quick fold technology",
        bestFor: "Urban parents who need maneuverability and compact storage",
        rating: 4.6,
        link: "#"
      },
      {
        name: "Mockingbird Single-to-Double",
        price: "$450.00",
        features: ["Modular design with 19+ configurations", "One-handed fold", "No-puncture tires", "Expandable to double stroller"],
        description: "High-quality modular stroller at direct-to-consumer price",
        bestFor: "Budget-conscious parents who want premium features",
        rating: 4.7,
        link: "#"
      },
      {
        name: "BOB Gear Alterrain Pro",
        price: "$699.99",
        features: ["Mountain-bike style suspension", "Pneumatic tires", "Weather-resistant canopy", "Hand-activated brake system"],
        description: "Premium jogging stroller designed for serious runners and outdoor adventurers",
        bestFor: "Athletic parents who want to jog with their baby on various terrains",
        rating: 4.5,
        link: "#"
      },
      {
        name: "Bugaboo Fox 3",
        price: "$1,299.00",
        features: ["Advanced central joint suspension", "Large puncture-proof wheels", "One-piece self-standing fold", "High-performance fabrics"],
        description: "High-end, full-size stroller with superior comfort and maneuverability",
        bestFor: "Parents wanting premium features and luxurious design",
        rating: 4.8,
        link: "#"
      }
    ];
  };

  const handleSubmit = async () => {
    try {
      setError(null);
      setIsLoading(true);

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

      // Get recommendations directly from our dummy data function
      const dummyRecommendations = getDefaultRecommendations();
      
      // Set the recommendations in state
      setRecommendations(dummyRecommendations);

      // Save the document with a unique ID
      const documentId = artifact?.documentId || generateUUID();
      const documentTitle = "Stroller Recommendations";
      
      // Create text recommendations
      const textRecommendations = `Based on your preferences, here are my recommendations...

1. ${dummyRecommendations[0].name} - ${dummyRecommendations[0].price}
   ${dummyRecommendations[0].description}
   - ${dummyRecommendations[0].features.join('\n   - ')}

2. ${dummyRecommendations[1].name} - ${dummyRecommendations[1].price}
   ${dummyRecommendations[1].description}
   - ${dummyRecommendations[1].features.join('\n   - ')}

3. ${dummyRecommendations[2].name} - ${dummyRecommendations[2].price}
   ${dummyRecommendations[2].description}
   - ${dummyRecommendations[2].features.join('\n   - ')}`;
      
      // IMPORTANT: Format the document content to exactly match what the artifact expects
      const documentContent = JSON.stringify({
        summary: summaryContent,
        recommendations: textRecommendations,
        answers: dummyRecommendations.map(stroller => ({
          name: stroller.name,
          price: stroller.price,
          features: stroller.features,
          description: stroller.description,
          bestFor: stroller.bestFor,
          rating: stroller.rating,
          link: stroller.link
          // Note: we don't include image as it's not in the StrollerRecommendation interface for the artifact
        })) // This is key - "answers" must contain the stroller objects with the correct fields
      });
      
      console.log("Setting artifact with content:", documentContent);

      // Create a new recommendations artifact
      setArtifact((prev) => ({
        ...prev,
        documentId: documentId,
        title: documentTitle,
        content: documentContent,
        status: "idle",
        kind: "stroller_recommendations",
        isVisible: true
      }));

      // Show results section
      setShowResults(true);

      // Add a message to the chat
      await append({
        role: "assistant",
        content: `I've analyzed your preferences and created personalized stroller recommendations. You can view the detailed recommendations below.`,
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
    } catch (err) {
      console.error("Error in handleSubmit:", err);
      setError("Failed to submit preferences");
      
      // Even if there's an error, show default recommendations
      setRecommendations(getDefaultRecommendations());
      setShowResults(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    const loadingMessage =
      currentStep === questions.length - 1 && !showResults
        ? "Finding the perfect strollers for you..."
        : "Loading questions...";
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <div className="inline-block w-6 h-6 border-2 border-t-blue-600 border-gray-200 rounded-full animate-spin mb-2"></div>
          <p>{loadingMessage}</p>
        </div>
      </div>
    );
  }

  if (error) return <div>Error: {error}</div>;
  if (questions.length === 0) return <div>No questions available.</div>;

  // Show product cards if we have recommendations
  if (showResults) {
    // Sort recommendations based on selected option
    const sortedRecommendations = [...recommendations].sort((a, b) => {
      if (sortOption === 'price-low') {
        return parseFloat(a.price.replace(/[^0-9.]/g, '')) - parseFloat(b.price.replace(/[^0-9.]/g, ''));
      } else if (sortOption === 'price-high') {
        return parseFloat(b.price.replace(/[^0-9.]/g, '')) - parseFloat(a.price.replace(/[^0-9.]/g, ''));
      } else if (sortOption === 'rating') {
        return b.rating - a.rating;
      }
      // Default to recommended order (original order)
      return 0;
    });
    
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-center mb-6">Your Personalized Stroller Recommendations</h2>
          
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-600">{sortedRecommendations.length} strollers found for you</p>
            
            <div className="flex items-center space-x-2">
              <label htmlFor="sort" className="text-sm text-gray-600">Sort by:</label>
              <select 
                id="sort"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="text-sm border rounded-md p-1"
              >
                <option value="recommended">Recommended</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sortedRecommendations.map((stroller, index) => (
            <div 
              key={`stroller-${index}`}
              className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white"
            >
              {/* Product Image */}
              <div className="aspect-video bg-gray-100 relative">
                <img 
                  src={stroller.image || `/api/placeholder/400/320?text=${encodeURIComponent(stroller.name)}`}
                  alt={stroller.name}
                  className="w-full h-full object-cover"
                />
                
                {/* Best Seller Tag - only for highest rated */}
                {stroller.rating >= 4.8 && (
                  <div className="absolute top-2 right-2 bg-yellow-400 text-xs font-bold px-2 py-1 rounded">
                    BEST SELLER
                  </div>
                )}
              </div>
              
              {/* Product Info */}
              <div className="p-4">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-medium text-lg">{stroller.name}</h3>
                </div>
                
                <div className="flex items-center mb-2">
                  {/* Star Rating */}
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={`star-${i}`}
                        size={16}
                        fill={i < Math.floor(stroller.rating) ? "currentColor" : "none"}
                        className={i < Math.floor(stroller.rating) ? "text-yellow-400" : "text-gray-300"}
                      />
                    ))}
                  </div>
                  <span className="ml-1 text-sm text-gray-600">
                    ({stroller.rating.toFixed(1)})
                  </span>
                </div>
                
                <p className="text-blue-600 font-medium text-lg mb-2">{stroller.price}</p>
                
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {stroller.description}
                </p>
                
                <div className="mb-3">
                  <div className="font-medium text-sm mb-1 flex justify-between items-center">
                    <span>Key Features:</span>
                    <button
                      onClick={() => toggleExpandCard(index)}
                      className="text-blue-600 flex items-center text-xs"
                    >
                      {expandedCard === index ? (
                        <>
                          <span>Less</span>
                          <ChevronUp size={14} />
                        </>
                      ) : (
                        <>
                          <span>More</span>
                          <ChevronDown size={14} />
                        </>
                      )}
                    </button>
                  </div>
                  
                  <ul className="text-xs text-gray-600 space-y-1">
                    {/* Always show first 2 features */}
                    {stroller.features.slice(0, 2).map((feature, i) => (
                      <li key={`feature-${i}`} className="flex items-start">
                        <Check size={12} className="mr-1 mt-1 text-green-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                    
                    {/* Show remaining features when expanded */}
                    {expandedCard === index && stroller.features.slice(2).map((feature, i) => (
                      <li key={`feature-extra-${i}`} className="flex items-start">
                        <Check size={12} className="mr-1 mt-1 text-green-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Additional details that show when expanded */}
                {expandedCard === index && (
                  <div className="mb-3 text-xs text-gray-600">
                    <p className="mb-1">
                      <span className="font-medium">Best for:</span> {stroller.bestFor}
                    </p>
                  </div>
                )}
                
                <div className="flex space-x-2">
                  <a
                    href={stroller.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <ShoppingCart size={14} className="mr-1" />
                    Shop Now
                  </a>
                  
                  <button
                    onClick={() => toggleExpandCard(index)}
                    className="px-3 py-2 border border-gray-300 text-sm rounded-md hover:bg-gray-50 transition-colors"
                  >
                    {expandedCard === index ? "Less" : "Details"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-8 text-center">
          <button
            onClick={() => {
              // Reset the form
              setCurrentStep(0);
              setSelectedOptions({});
              setShowResults(false);
            }}
            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Start Over
          </button>
        </div>
      </div>
    );
  }

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
            Find My Stroller
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