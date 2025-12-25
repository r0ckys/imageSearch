
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// Use process.env.API_KEY directly as per guidelines.
const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

/**
 * Analyzes a product image for ecommerce details.
 */
export const analyzeProduct = async (base64Image: string, prompt: string): Promise<string> => {
  const ai = getAIClient();
  const imagePart = {
    inlineData: {
      mimeType: 'image/jpeg',
      data: base64Image.split(',')[1] || base64Image,
    },
  };
  
  const textPart = {
    text: prompt || "Analyze this product. Provide details on: 1. Primary Material/Fabric, 2. Style (e.g. Minimalist, Industrial, Luxury), 3. Recommended use cases, 4. Three items that would complement this visually."
  };

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts: [imagePart, textPart] },
  });

  return response.text || "No product insights available.";
};

/**
 * Lifestyle visualization using Gemini 2.5 Flash Image.
 */
export const visualizeProduct = async (base64Image: string, prompt: string): Promise<string> => {
  const ai = getAIClient();
  
  const imagePart = {
    inlineData: {
      mimeType: 'image/jpeg',
      data: base64Image.split(',')[1] || base64Image,
    },
  };

  // Enhance the prompt for better ecommerce visualization
  const enhancedPrompt = `High quality product visualization: ${prompt}. Maintain the core product's identity while changing the environment or style realistically. 4k resolution, professional photography style.`;

  const textPart = {
    text: enhancedPrompt
  };

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [imagePart, textPart] },
  });

  let generatedImageUrl = "";
  if (response.candidates?.[0]?.content?.parts) {
    // Correctly iterate through all parts to find the image part as per guidelines.
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        generatedImageUrl = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }
  }

  if (!generatedImageUrl) {
    throw new Error("Unable to render the visualization. Try a different request.");
  }

  return generatedImageUrl;
};
