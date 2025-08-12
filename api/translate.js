const allowedOrigins = [
  'http://localhost:5000',
  'https://gazouhonnyaku-auth.web.app',
  'https://auth-clean.web.app',
  'https://ocr-translate-api.vercel.app',                     // ← 末尾 / を削除
  'https://ocr-translate-4yco87elc-mikus-projects-3bcdde09.vercel.app' // ← 旧フロント
];

// もしくは vercel.app を丸ごと許可したい場合
function allow(origin) {
  if (!origin) return false;
  const o = origin.replace(/\/$/, '');
  if (allowedOrigins.includes(o)) return true;
  try {
    const { hostname } = new URL(o);
    return hostname.endsWith('.vercel.app');   // ← *.vercel.app OK
  } catch { return false; }
}

const origin = req.headers.origin || '';
if (allow(origin)) {
  res.setHeader('Access-Control-Allow-Origin', origin);
}
res.setHeader('Vary', 'Origin');
res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
res.setHeader('Access-Control-Max-Age', '86400');
if (req.method === 'OPTIONS') return res.status(204).end();
