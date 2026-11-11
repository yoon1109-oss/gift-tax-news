// 네이버 블로그 검색 프록시.
// 문지기(2026-11-11) — api/news.js와 같은 이유로 다른 사이트 요청과 화면 밖 검색어를 막는다.
// ★ index.html에 블로그 칩(#blogKeywords)이나 PI_BLOG_PLAN 질의를 추가하면 BLOG_KEYWORDS에도 넣을 것
const ALLOWED_ORIGIN = /^(https:\/\/wm-monitor\.netlify\.app|https:\/\/gift-tax-news(-[a-z0-9-]+)?\.vercel\.app|http:\/\/(localhost|127\.0\.0\.1)(:\d+)?)$/;
const BLOG_KEYWORDS = new Set([
  '한화생명 파이', '자녀 계좌 개설', '자녀 증여',          // 칩
  '파이 Pi 증여', '파이 앱 증여', '한화생명 파이 증여',    // PI_BLOG_PLAN
]);
const clampInt = (v, def, min, max) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : def;
};

export default async function handler(req, res) {
  res.setHeader('Vary', 'Origin');
  const origin = req.headers.origin;
  if (origin) {
    if (!ALLOWED_ORIGIN.test(origin)) {
      res.setHeader('Cache-Control', 'no-store');
      res.status(403).json({ error: 'origin not allowed' }); return;
    }
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  const keyword = String(req.query.keyword || '한화생명 파이');
  if (!BLOG_KEYWORDS.has(keyword)) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(400).json({ error: 'keyword not allowed' }); return;
  }
  res.setHeader('Cache-Control', 'public, s-maxage=180, stale-while-revalidate=600'); // 블로그
  const display = clampInt(req.query.display, 100, 1, 100);
  const start = clampInt(req.query.start, 1, 1, 1000);
  const sort = req.query.sort === 'sim' ? 'sim' : 'date';

  const apiUrl = `https://openapi.naver.com/v1/search/blog.json?query=${encodeURIComponent(keyword)}&display=${display}&start=${start}&sort=${sort}`;

  try {
    const response = await fetch(apiUrl, {
      headers: {
        'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID,
        'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET,
      },
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
