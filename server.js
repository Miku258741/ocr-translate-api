import express from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.post("/api/translate", async (req, res) => {
  const { base64ImageData } = req.body;

  const prompt = "この画像に含まれる中国語のテキストを抽出し、自然な日本語に翻訳してください。翻訳結果だけを返してください。もしテキストが見つからない場合は、「テキストが見つかりませんでした。」とだけ返してください。";

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${process.env.GOOGLE_API_KEY}`,
      {
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: "image/png",
                  data: base64ImageData
                }
              }
            ]
          }
        ],
      }
    );

    const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text ?? "翻訳結果を取得できませんでした。";
    res.json({ translated: text });

  } catch (err) {
    console.error("API呼び出しでエラー:", err.response?.data || err);
    res.status(500).json({ error: "翻訳APIに失敗しました" });
  }
});

app.listen(3000, () => {
  console.log("✅ サーバーが起動しました: http://localhost:3000");
});
