const express = require("express");
const bodyParser = require("body-parser");
const { GoogleGenAI } = require("@google/genai");
require("dotenv").config();

const app = express();
const port = 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.use(express.json({ limit: "50mb" }));
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
    res.json({ flashcards });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to generate flashcards" });
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
