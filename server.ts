import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Lazily initialize Gemini to prevent the server from crashing on boot if the API key is missing
  let aiClient: GoogleGenAI | null = null;
  const getAiClient = (): GoogleGenAI => {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("La clé d'API Google Gemini est manquante. Veuillez la configurer dans l'onglet des Paramètres.");
      }
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
    return aiClient;
  };

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // AI-powered pro matching endpoint
  app.post("/api/ai-search", async (req, res) => {
    const { query, professionals } = req.body;

    if (!query || !query.trim() || !professionals || !Array.isArray(professionals)) {
      return res.json({ results: [] });
    }

    try {
      // Map professionals list with only relevant fields to stay within token limits and maintain focus
      const proListBrief = professionals.map((p: any) => ({
        id: String(p.id),
        name: p.name,
        company_name: p.company_name || "",
        category: p.category || p.profession || "",
        bio: p.bio || p.description || "",
        languages: p.languages || [],
        rating: p.rating || 0,
        location: p.location || ""
      }));

      const sysInstruction = `You are an expert matching AI assistant for "Unlock'd" - a premier community-curated directory of recommended local professionals.
Your purpose is to thoroughly examine the user's natural language request (written in French, English, or Spanish) and return the most relevant matching professionals.

Review the list of professionals provided and rank them based on:
1. Skills, profession, and category align, or partial matches.
2. Direct/indirect/synonymous matches (e.g., if they ask for "relooking" or "decorateur d'interieur", match it against interior designers, painters, etc.).
3. Language spoken (if they request "qui parle anglais" or "bilingual", match it against pros that speak English).
4. Description context (matching specific skills mentioned in their bio, e.g. "compta" matching a tax advisor).

Assign a match score from 0 to 100 for each. Include any professional that has a match score above 0. If a professional doesn't match at all, you may omit them or output score as 0.
Under "reasonUrlExcerpt", write a single, user-friendly matching explanation in English (1 concise sentence maximum) suitable to be displayed inside a badge on their profile.
Example reasonUrlExcerpt: "Recommended for your painting project thanks to 12 years of experience" or "Bilingual tax advisor ideal for your autonomo setup".`;
 
      const response = await getAiClient().models.generateContent({
        model: "gemini-3.5-flash",
        contents: `User Query: "${query}"

Professionals:
${JSON.stringify(proListBrief, null, 2)}`,
        config: {
          systemInstruction: sysInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING, description: "The professional's ID as a string" },
                score: { type: Type.INTEGER, description: "The relevancy match score from 0 to 100" },
                reasonUrlExcerpt: { type: Type.STRING, description: "Highly engaging, concise explanation in English explaining why this pro is matched." }
              },
              required: ["id", "score", "reasonUrlExcerpt"]
            }
          }
        }
      });

      const parsedResults = JSON.parse(response.text || "[]");
      return res.json({ results: parsedResults });
    } catch (error: any) {
      console.error("[api] Gemini AI Search matching error:", error);
      return res.status(500).json({ error: error.message || "Failed to process matching" });
    }
  });

  // Server-side city-normalization endpoint (migrated from client-side for safety)
  app.post("/api/city-normalization", async (req, res) => {
    const { city, region, country } = req.body;
    if (!city) {
      return res.json({ result: 'Valencia' });
    }

    try {
      const locationContext = `${city}, ${region || ''}, ${country || ''}`;
      const response = await getAiClient().models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Target: Identify the nearest major metropolitan city for "${locationContext}". 
        Rules: 
        1. Return ONLY the name of the major city.
        2. No punctuation, no sentences.
        3. If the location is already a major city, return its name.
        4. Example: "La Eliana, Valencian Community, Spain" -> "Valencia".`,
      });

      const result = response.text?.trim() || city;
      return res.json({ result });
    } catch (error: any) {
      console.error("[api] City normalization error:", error);
      return res.json({ result: city || 'Valencia' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
