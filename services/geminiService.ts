
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { ProductData } from "../types";

const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

/**
 * Analyzes a product image using structured JSON output.
 */
export const analyzeProduct = async (base64Image: string, prompt: string): Promise<ProductData> => {
  const ai = getAIClient();
  const imagePart = {
    inlineData: {
      mimeType: 'image/jpeg',
      data: base64Image.split(',')[1] || base64Image,
    },
  };
  
  const textPart = {
    text: prompt || "Identify this product and provide deep retail insights. Focus on quality, style, and market positioning."
  };

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts: [imagePart, textPart] },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Name of the product" },
          brandSuggestion: { type: Type.STRING, description: "Likely brand or luxury tier" },
          estimatedPrice: { type: Type.STRING, description: "Market price estimate with currency" },
          materials: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "List of materials used" 
          },
          style: { type: Type.STRING, description: "Aesthetic style classification" },
          description: { type: Type.STRING, description: "One paragraph marketing description" },
          complementaryItems: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "3 items that look good with this" 
          }
        },
        required: ["name", "brandSuggestion", "estimatedPrice", "materials", "style", "description", "complementaryItems"]
      }
    }
  });

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    throw new Error("Failed to parse product data.");
  }
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

  const enhancedPrompt = `High-end commercial lifestyle photography: ${prompt}. Place the product in a realistic, perfectly lit environment. Maintain the product's exact proportions and design details. High dynamic range, soft shadows, 8k resolution.`;

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [imagePart, { text: enhancedPrompt }] },
    config: {
      imageConfig: {
        aspectRatio: "1:1"
      }
    }
  });

  let generatedImageUrl = "";
  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        generatedImageUrl = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }
  }

  if (!generatedImageUrl) {
    throw new Error("Unable to render the visualization.");
  }

  return generatedImageUrl;
};
