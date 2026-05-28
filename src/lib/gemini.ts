import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getReflection(entry: string) {
  if (!entry.trim()) return null;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: entry,
      config: {
        systemInstruction: `You are Lumina, a gentle and insightful journaling companion. 
        The user has just written a journal entry. 
        Your goal is to provide a brief (2-3 sentences) reflection that validates their feelings and asks one deep, open-ended follow-up question to encourage further introspection. 
        Keep the tone warm, poetic, and non-judgmental. Use Markdown for formatting.`,
      },
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "The stars are quiet tonight. (Failed to connect to AI)";
  }
}

export async function getMood(entry: string) {
  if (!entry.trim()) return "Neutral";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: entry,
      config: {
        systemInstruction: "Analyze the mood of this journal entry. Return exactly one word from this list: Peaceful, Melancholic, Energetic, Anxious, Grateful, Reflective, Frustrated.",
      },
    });

    return response.text.trim();
  } catch (error) {
    return "Reflective";
  }
}
