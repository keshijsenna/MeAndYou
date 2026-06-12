import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const fallbackAffirmations = [
    "Setiap hari bersamamu adalah lembaran indah yang tak pernah lelah kubaca, Nauraa dan Farsya. 💕",
    "Di antara ribuan bintang di semesta, senyumanmu adalah yang paling indah bagi hatiku.",
    "Jarak dan waktu tidak akan mampu mengikis rasa tulus yang tumbuh subur di antara kita berdua.",
    "Kamu adalah rumah tempat jiwaku pulang, pelabuhan tercantik dari segala perjalanan kisah kita. 🏡",
    "Terima kasih telah menemani setiap langkah dan membuat setiap detik terasa begitu berharga.",
    "Cinta kita bagaikan melodi paling romantis yang selalu diputar berulang di dalam hatiku. 🎵",
    "Bersama Nauraa, Farsya merasa menjadi orang paling beruntung di semesta ini setiap hari.",
    "Setiap hembusan napas dan tatapan hangat darimu adalah alasan terbaikku untuk terus berjuang.",
    "Mari terus merajut mimpi-mimpi indah kita bersama dan melangkah menyongsong masa depan cerah.",
    "Mencintaimu adalah keputusan terindah dan paling mudah yang pernah kulakukan seumur hidupku. ✨",
    "Kamu tidak perlu menjadi sempurna untuk dicintai, karena bagiku, kehadiranmu saja sudah seutuhnya sempurna.",
    "Ada ketenangan mendalam yang luar biasa di setiap kali aku mendengar suara tulus dari bibirmu."
  ];

  // API Route for Daily Affirmation
  app.get("/api/affirmation", async (req, res) => {
    if (!process.env.GEMINI_API_KEY) {
      const randomQuote = fallbackAffirmations[Math.floor(Math.random() * fallbackAffirmations.length)];
      return res.json({ quote: randomQuote });
    }

    const prompt = "Generate a short, romantic, and encouraging quote in Indonesian for a couple named Nauraa and Farsya. Maximum 2 sentences. No quotes formatting around the string.";
    const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
    
    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: model,
          contents: prompt,
          config: {
            temperature: 0.7
          }
        });
        if (response && response.text) {
          return res.json({ quote: response.text });
        }
      } catch (err: any) {
        console.warn(`Gemini model ${model} failed:`, err.message || err);
        // Continue to the next model in the list
      }
    }

    // All models failed or were rate-limited, use local fallback
    console.warn("All Gemini fallback models exhausted, sending a warm offline fallback affirmation instead.");
    const randomQuote = fallbackAffirmations[Math.floor(Math.random() * fallbackAffirmations.length)];
    res.json({ quote: randomQuote });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Note: express@4 syntax for wildcard
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
