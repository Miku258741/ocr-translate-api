// api/translate.js
export default async function handler(req, res) {
  // --- CORS: まず最初に、必ず返す ---
  res.setHeader('Access-Control-Allow-Origin', '*'); // まずは全許可で復旧
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    // 事前問合せは即座に終了（ここで処理が完了しないと 500→CORS エラーになります）
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // --- 以降が今の OCR→翻訳 処理（そのままでOK） ---
  const { base64ImageData } = req.body || {};
  if (!base64ImageData) return res.status(400).json({ error: 'No image data provided' });

  try {
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
