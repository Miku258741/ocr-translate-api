export default async function handler(req, res) {
  // ===== CORS 設定（ここから）=========================
  const ALLOW = new Set([
    'http://localhost:5000',
    'https://gazouhonnyaku-auth.web.app',
    'https://gazouhonnyaku-auth.firebaseapp.com',
  ]);
  const origin = req.headers.origin;
  if (origin && ALLOW.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // preflight（ブラウザ確認用の事前問い合わせ）
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  // ===== CORS 設定（ここまで）=========================

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { base64ImageData } = req.body || {};

  if (!base64ImageData) {
    return res.status(400).json({ error: 'No image data provided' });
  }

  try {
    // OCR API を叩く
    const ocrResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [
            {
              image: { content: base64ImageData },
              features: [{ type: 'TEXT_DETECTION' }],
            },
          ],
        }),
      }
    );

    const ocrData = await ocrResponse.json();
    const text = ocrData.responses?.[0]?.fullTextAnnotation?.text;

    if (!text) {
      return res.status(500).json({ error: 'OCR failed' });
    }

    // 翻訳 API を叩く
    const translateResponse = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${process.env.GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: text,
          target: 'ja',
        }),
      }
    );

    const translateData = await translateResponse.json();
    const translated = translateData.data?.translations?.[0]?.translatedText;

    if (!translated) {
      return res.status(500).json({ error: 'Translation failed' });
    }

    res.status(200).json({ translated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}
