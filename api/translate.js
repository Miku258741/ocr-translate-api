import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { imageBase64 } = req.body;
  if (!imageBase64) {
    return res.status(400).json({ error: "No image data provided" });
  }

  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

  try {
    const result = await model.generateContent([
      {
        inlineData: {
          data: imageBase64,
          mimeType: "image/png",
        },
      },
      "Translate any text in this image to Japanese."
    ]);

    const text = result.response.candidates[0].content.parts[0].text;
    res.status(200).json({ text });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Translation failed" });
  }
}
