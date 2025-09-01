const express = require("express");
const { GoogleGenAI } = require("@google/genai");
const app = express();
const port = 3000;
const GEMINI_API_KEY = "AIzaSyAId9-z_B7woLkXbvid9h6FqHDCQJ7yVmg";

app.use(express.json());
app.use(express.static("public"));

const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

app.post("/generate-flashcards-auto", async (req, res) => {
  try {
    const { text } = req.body;
    const response = await genAI.models.generateContent({
      model: "gemini-2.5-pro",
      contents: `Generate flashcards from the following text. Each flashcard should be in the format "question:answer". Only return the flashcards and nothing else. Do not include any introductory text or titles. For example:\nWhat is the capital of France?:Paris\n\nText: "${text}"`,
    });
    const flashcards = response.text;
    console.log(flashcards);
    res.json({ flashcards });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to generate flashcards" });
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
