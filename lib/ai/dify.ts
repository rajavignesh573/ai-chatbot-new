import { customProvider, type LanguageModelV1 } from "ai";

const DIFY_API_URL = "https://cloud.dify.ai/api/v1";

/**
 * Creates a Dify model with enhanced error handling and response formatting
 */
const createDifyModel = (apiKey: string, modelType: 'chat' | 'wizard' | 'stroller') => ({
  specificationVersion: "v1",
  provider: "dify",
  modelId: `dify-${modelType}`,
  defaultObjectGenerationMode: "text" as const,
  
  async doGenerate(prompt: string) {
    try {
      const response = await fetch(`${DIFY_API_URL}/chat-messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          inputs: {},
          query: prompt,
          response_mode: "streaming",
          conversation_id: "",
          user: "user",
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get response from Dify.ai: ${response.status} ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to get response stream');
      }

      let fullText = '';
      const decoder = new TextDecoder();
      
      // Process stream response
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.event === 'message') {
                if (modelType === 'stroller') {
                  // For stroller, collect the entire response before formatting
                  fullText += data.answer || '';
                } else {
                  fullText += data.answer;
                }
              }
            } catch (e) {
              console.error("Error processing stream chunk:", e);
            }
          }
        }
      }

      // For stroller responses, format the complete response after receiving all chunks
      if (modelType === 'stroller') {
        fullText = formatStrollerResponse(fullText);
      }

      return {
        text: fullText,
        finishReason: 'stop',
      };
    } catch (error) {
      console.error(`Dify API ${modelType} model error:`, error);
      // Return a more helpful error message to the user
      return {
        text: `Error: Unable to get recommendations. Please try again. (${error.message || 'Unknown error'})`,
        finishReason: 'error',
      };
    }
  },

  async doStream(prompt: string) {
    try {
      const response = await fetch(`${DIFY_API_URL}/chat-messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          inputs: {},
          query: prompt,
          response_mode: "streaming",
          conversation_id: "",
          user: "user",
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get response from Dify.ai: ${response.status} ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to get response stream');
      }

      let accumulatedStrollerData = '';
      
      return {
        async *[Symbol.asyncIterator]() {
          const decoder = new TextDecoder();
          
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                // If we're handling stroller data and have accumulated content,
                // format and yield it one final time when the stream is done
                if (modelType === 'stroller' && accumulatedStrollerData) {
                  yield {
                    text: formatStrollerResponse(accumulatedStrollerData),
                    finishReason: 'stop',
                  };
                }
                break;
              }
              
              const chunk = decoder.decode(value);
              const lines = chunk.split('\n');
              
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const data = JSON.parse(line.slice(6));
                    if (data.event === 'message') {
                      if (modelType === 'stroller') {
                        // Accumulate stroller data
                        accumulatedStrollerData += data.answer || '';
                        
                        // Only try to format if we have enough data to work with
                        // This avoids partial JSON parsing errors
                        if (accumulatedStrollerData.length > 20) {
                          yield {
                            text: formatStrollerResponse(accumulatedStrollerData),
                            finishReason: null,
                          };
                        }
                      } else {
                        yield {
                          text: data.answer,
                          finishReason: null,
                        };
                      }
                    }
                  } catch (e) {
                    console.error("Error processing stream chunk:", e);
                  }
                }
              }
            }
          } catch (error) {
            console.error(`Stream error in ${modelType} model:`, error);
            yield {
              text: `Error: Unable to process recommendations. Please try again. (${error.message || 'Unknown error'})`,
              finishReason: 'error',
            };
          }
        }
      };
    } catch (error) {
      console.error(`Dify API ${modelType} stream error:`, error);
      // Return an async iterator that immediately yields an error
      return {
        async *[Symbol.asyncIterator]() {
          yield {
            text: `Error: Unable to connect to recommendation service. Please try again. (${error.message || 'Unknown error'})`,
            finishReason: 'error',
          };
        }
      };
    }
  }
} as unknown as LanguageModelV1);

/**
 * Enhanced formatStrollerResponse function with improved JSON handling
 * This function takes raw data from Dify.ai and ensures it's properly formatted
 * for the stroller recommendations artifact
 */
function formatStrollerResponse(rawData: any): string {
  try {
    // If rawData is a string, try to parse it as JSON first
    let data = rawData;
    
    // Check if the string starts with a bracket or curly brace, suggesting it might be JSON
    if (typeof rawData === 'string' && 
        (rawData.trim().startsWith('{') || rawData.trim().startsWith('['))) {
      try {
        data = JSON.parse(rawData);
      } catch (e) {
        // Handle partial JSON by attempting to extract JSON subset
        const jsonMatch = rawData.match(/{[\s\S]*}/);
        if (jsonMatch) {
          try {
            data = JSON.parse(jsonMatch[0]);
          } catch (e2) {
            // If parsing still fails, use a fallback structure
            return createFallbackResponse(rawData);
          }
        } else {
          // No JSON-like structure found, use fallback
          return createFallbackResponse(rawData);
        }
      }
    } else if (typeof rawData === 'string') {
      // Plain text response
      return createFallbackResponse(rawData);
    }

    // We now have either a parsed object or the original data
    // Check specifically for the recommendations array based on the Dify prompt
    if (data && Array.isArray(data.recommendations)) {
      // Format the recommendations in a readable way
      const formattedRecommendations = formatRecommendationsArray(data.recommendations);
      
      // Return properly formatted JSON
      return JSON.stringify({
        summary: "Based on your preferences, here are our top recommendations:",
        recommendations: formattedRecommendations,
        answers: data.recommendations
      });
    } 
    // Check if it's not in the expected format but has recommendations as a non-array
    // biome-ignore lint/complexity/useOptionalChain: <explanation>
        else if (data && data.recommendations && !Array.isArray(data.recommendations)) {
      return JSON.stringify({
        summary: "Based on your preferences, here are our recommendations:",
        recommendations: typeof data.recommendations === 'string' 
          ? data.recommendations 
          : JSON.stringify(data.recommendations),
        answers: Array.isArray(data.recommendations) ? data.recommendations : []
      });
    }
    // If we have a valid object but not in the expected format, try to adapt it
    else if (data && typeof data === 'object') {
      // Check if this might be a single recommendation without the outer recommendations array
      if (data.name && data.price) {
        const singleRec = [data];
        const formattedRec = formatRecommendationsArray(singleRec);
        
        return JSON.stringify({
          summary: "Based on your preferences, here's our top recommendation:",
          recommendations: formattedRec,
          answers: singleRec
        });
      } else {
        // Otherwise, just convert the object to a string representation
        return createFallbackResponse(JSON.stringify(data));
      }
    } else {
      // Any other case we can't handle
      return createFallbackResponse(typeof rawData === 'string' ? rawData : "Unknown data format");
    }
  } catch (error) {
    // If any error occurs during formatting, return a valid JSON response
    console.error("Error formatting stroller response:", error);
    return createFallbackResponse(typeof rawData === 'string' ? rawData : "Could not format recommendations properly.");
  }
}

/**
 * Creates a fallback response when the data format is not as expected
 */
function createFallbackResponse(textContent: string): string {
  return JSON.stringify({
    summary: "Stroller Recommendations",
    recommendations: textContent,
    answers: [{
      name: "Stroller Recommendations",
      price: "Various",
      features: ["Please see the text recommendations"],
      description: textContent.substring(0, 100) + (textContent.length > 100 ? '...' : ''),
      bestFor: "Your specific needs",
      rating: 5,
      link: "#"
    }]
  });
}

/**
 * Formats an array of recommendation objects into a readable string
 */
function formatRecommendationsArray(recommendations: any[]): string {
  return recommendations.map((stroller: any, index: number) => {
    const featuresString = Array.isArray(stroller.features) 
      ? stroller.features.join('\n  • ') 
      : 'N/A';
    
    return `${index + 1}. ${stroller.name || 'Unnamed Stroller'}\n` +
           `   Price: ${stroller.price || 'N/A'}\n` +
           `   Features:\n  • ${featuresString}\n` +
           `   Description: ${stroller.description || 'N/A'}\n` +
           `   Best For: ${stroller.bestFor || 'N/A'}\n` +
           `   Rating: ${stroller.rating ? `${stroller.rating}/5` : 'N/A'}\n` +
           `   Link: ${stroller.link || 'No link provided'}\n`;
  }).join('\n');
}

// Modified onStreamPart implementation for StrollerRecommendationsArtifact
const improvedOnStreamPart = ({ streamPart, setArtifact }) => {
  if (streamPart.type === "text-delta") {
    try {
      // Get the content as a string
      const rawContent = typeof streamPart.content === 'string' 
        ? streamPart.content 
        : JSON.stringify(streamPart.content);
      
      // Use our enhanced formatter function
      const validJsonContent = formatStrollerResponse(rawContent);
      
      // Set the artifact with guaranteed valid JSON
      setArtifact((draftArtifact) => ({
        ...draftArtifact,
        content: validJsonContent,
        isVisible: true,
        status: "streaming",
      }));
    } catch (e) {
      console.error("Error handling stream part:", e);
      // Provide a fallback valid JSON if any other error occurs
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
}

export const difyProvider = customProvider({
  languageModels: {
    "dify-chat": createDifyModel(process.env.DIFY_API_KEY_CHAT || '', 'chat'),
    "dify-wizard": createDifyModel(process.env.DIFY_API_KEY_WIZARD || '', 'wizard'),
    "dify-stroller": createDifyModel(process.env.DIFY_API_KEY_STROLLER || '', 'stroller'),
  }
});