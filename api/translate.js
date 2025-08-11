// api/translate.js — ログイン不要(トークン任意)版
export default async function handler(req, res) {
  // ----- CORS -----
  const allowedOrigins = [
    'http://localhost:5000',
    'https://gazouhonnyaku-auth.web.app',
    'https://auth-clean.web.app',
    'https://ocr-translate-api.vercel.app/',
  ];
  const origin = req.headers.origin || '';
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ★ ここがポイント：Authorization は“あってもなくてもOK”にする
  const authz = req.headers.authorization || '';
  const hasToken = /^Bearer\s+.+/.test(authz);
  // （必要なら hasToken の時だけ何かチェックする。今は何もしない）

  const { base64ImageData } = req.body || {};
  if (!base64ImageData) return res.status(400).json({ error: 'No image data provided' });

  try {
    // --- OCR ---
    const ocrRes = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{ image: { content: base64ImageData }, features: [{ type: 'TEXT_DETECTION' }] }]
        })
      }
    );
    const ocrData = await ocrRes.json();
    const text = ocrData?.responses?.[0]?.fullTextAnnotation?.text;
    if (!text) return res.status(500).json({ error: 'OCR failed' });

    // --- 翻訳 ---
    const trRes = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${process.env.GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: text, target: 'ja' })
      }
    );
    const trData = await trRes.json();
    const translated = trData?.data?.translations?.[0]?.translatedText;
    if (!translated) return res.status(500).json({ error: 'Translation failed' });

    return res.status(200).json({ translated });
  } catch (e) {
    console.error('[translate]', e);
    return res.status(500).json({ error: 'Server error' });
  }
}
