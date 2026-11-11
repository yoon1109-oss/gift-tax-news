// 네이버 블로그 공감수(좋아요) 프록시.
// 검색 API는 공감수를 주지 않으므로 blog.like.naver.com 반응 API를 서버에서 대신 조회한다.
// (해당 엔드포인트는 CORS 미허용 + referer 필요라 브라우저 직접 호출 불가)
// 문지기(2026-11-11) — 다른 사이트에서 온 요청은 막는다 (api/news.js 참고)
const ALLOWED_ORIGIN = /^(https:\/\/wm-monitor\.netlify\.app|https:\/\/gift-tax-news(-[a-z0-9-]+)?\.vercel\.app|http:\/\/(localhost|127\.0\.0\.1)(:\d+)?)$/;

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
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=900'); // 공감수

  // ids = "blogId_logNo,blogId_logNo,..." (최대 60건, 함수 실행시간 보호)
  // 형식이 다른 값은 버린다 — 네이버 반응 API에 임의 문자열을 넘기지 않게
  const ids = String(req.query.ids || '')
    .split(',').map(s => s.trim()).filter(s => /^[A-Za-z0-9_.-]{1,40}_\d{1,20}$/.test(s)).slice(0, 60);

  const result = {};
  const fetchOne = async (id) => {
    try {
      const r = await fetch(
        `https://blog.like.naver.com/v1/search/contents?suffix=&q=${encodeURIComponent(`BLOG[${id}]`)}`,
        { headers: { 'referer': 'https://blog.naver.com/', 'user-agent': 'Mozilla/5.0' } }
      );
      if (!r.ok) return;
      const d = await r.json();
      const c = d?.contents?.[0]?.reactions?.[0]?.count;
      if (typeof c === 'number') result[id] = c;
    } catch { /* 개별 실패는 무시 */ }
  };

  // 동시성 10으로 제한해 순차 배치 처리
  const POOL = 20;
  for (let i = 0; i < ids.length; i += POOL) {
    await Promise.all(ids.slice(i, i + POOL).map(fetchOne));
  }

  res.status(200).json(result);
}
