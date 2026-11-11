// 네이버 뉴스 검색 프록시.
// 단건: ?keyword=&start=&display=&sort=
// 묶음: ?batch=[["검색어",1],["검색어",101],...] — 여러 요청을 서버에서 한 번에 받아 돌려준다.
//   화면에서 요청을 하나씩 보내면 브라우저 → Netlify → Vercel 왕복이 요청마다 2~3초라
//   모아보기(17건)가 3개씩 6번 기다리며 20초 가까이 걸렸다 (2026-10-28 실측).
//   서버(icn1) → 네이버는 건당 0.2~0.4초라 서버에서 모으면 왕복 한 번이면 된다.
const naver = async (keyword, start, display, sort) => {
  const r = await fetch(
    `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(keyword)}&display=${display}&start=${start}&sort=${sort}`,
    { headers: {
      'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID,
      'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET,
    }}
  );
  return r.json();
};
const wait = ms => new Promise(r => setTimeout(r, ms));

// 네이버는 속도 제한에 걸려도 200에 errorMessage만 담아 보낸다 — items가 없으면 두 번 더 시도한다
async function naverSafe(keyword, start, display, sort) {
  for (const delay of [0, 600, 1500]) {
    if (delay) await wait(delay);
    try {
      const d = await naver(keyword, start, display, sort);
      if (d.items) return { items: d.items };
      if (delay === 1500) return { error: d.errorMessage || 'no items' };
    } catch (e) {
      if (delay === 1500) return { error: String(e.message || e) };
    }
  }
}

// ── 문지기 (2026-11-11) ──────────────────────────────────────────
// 예전엔 Access-Control-Allow-Origin: * 에 검색어 제한도 없어, 아무 사이트·스크립트나 이 주소로
// 네이버 검색을 돌릴 수 있었다 — 그 호출은 전부 우리 API 키 일일 쿼터에서 빠진다.
//  ① 다른 사이트(Origin 헤더가 아래 목록 밖)에서 온 요청은 403. 우리 화면은 같은 주소라 Origin을 안 보낸다
//  ② 검색어는 화면이 실제로 쓰는 것만 받는다. ★ index.html에 뉴스 칩·보조 질의를 추가하면 여기에도 넣을 것
//     (getKeyword · PEN_SECOND_QUERY · PLAT_AI_QUERY · PEN_THIRD_QUERY)
//  ③ display·start·sort는 네이버 허용 범위로 자른다
const ALLOWED_ORIGIN = /^(https:\/\/wm-monitor\.netlify\.app|https:\/\/gift-tax-news(-[a-z0-9-]+)?\.vercel\.app|http:\/\/(localhost|127\.0\.0\.1)(:\d+)?)$/;
const NEWS_KEYWORDS = new Set([
  '자녀 증여', '가족 자산관리 금융', '자녀 금융', '금융 플랫폼', '절세 상품', '한화생명 파이 증여',
  '장기 투자 상품', '금융 AI 비서', '모으기 서비스 은행',
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
  res.setHeader('Cache-Control', 'public, s-maxage=180, stale-while-revalidate=600'); // 뉴스: 앱이 10분마다 갱신 → 3분 캐시

  const { keyword, batch } = req.query;
  const display = clampInt(req.query.display, 100, 1, 100);
  const sort = req.query.sort === 'date' ? 'date' : 'sim';
  const reject = msg => { res.setHeader('Cache-Control', 'no-store'); res.status(400).json({ error: msg }); };

  if (batch) {
    let list;
    try { list = JSON.parse(batch); } catch { reject('bad batch'); return; }
    if (!Array.isArray(list) || !list.length || list.length > 24) { reject('bad batch'); return; }
    if (!list.every(p => Array.isArray(p) && NEWS_KEYWORDS.has(String(p[0])))) { reject('keyword not allowed'); return; }
    // 네이버 한도(초당 10건) 안에서 4개씩 나눠 보낸다
    const results = [];
    for (let i = 0; i < list.length; i += 4) {
      if (i) await wait(150);
      results.push(...await Promise.all(list.slice(i, i + 4).map(([kw, st]) =>
        naverSafe(String(kw), clampInt(st, 1, 1, 1000), display, sort))));
    }
    // 일부라도 실패하면 캐시를 짧게 — 빈칸이 3분 동안 굳지 않게
    if (results.some(r => r.error)) res.setHeader('Cache-Control', 'public, s-maxage=10');
    res.status(200).json({ results });
    return;
  }

  if (!NEWS_KEYWORDS.has(String(keyword))) { reject('keyword not allowed'); return; }
  const data = await naver(String(keyword), clampInt(req.query.start, 1, 1, 1000), display, sort);
  res.status(200).json(data);
}
