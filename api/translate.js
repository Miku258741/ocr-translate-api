import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { base64ImageData } = req.body;

    // OCRを実行
    const ocrResponse = await axios.post(
      "https://vision.googleapis.com/v1/images:annotate",
      {
        requests: [
          {
            image: { content: base64ImageData },
            features: [{ type: "TEXT_DETECTION" }],
          },
        ],
      },
      {
        params: { key: process.env.GOOGLE_API_KEY },
      }
    );

    const detectedText =
      ocrResponse.data.responses[0].fullTextAnnotation?.text;

    if (!detectedText) {
      return res.status(400).json({ error: "テキストが検出されませんでした。" });
    }

    // 翻訳を実行
    const translateResponse = await axios.post(
      "https://translation.googleapis.com/language/translate/v2",
      {},
      {
        params: {
          q: detectedText,
          target: "ja",
          key: process.env.GOOGLE_API_KEY,
        },
      }
    );

    const translatedText =
      translateResponse.data.data.translations[0].translatedText;

    res.status(200).json({ translated: translatedText });
  } catch (error) {
    console.error("APIエラー", error.response?.data || error.message);
    res.status(500).json({ error: "翻訳中にエラーが発生しました。" });
  }
}
