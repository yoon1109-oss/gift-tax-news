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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, s-maxage=180, stale-while-revalidate=600'); // 뉴스: 앱이 10분마다 갱신 → 3분 캐시
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const { keyword = '증여', display = 100, start = 1, sort = 'date', batch } = req.query;

  if (batch) {
    let list;
    try { list = JSON.parse(batch); } catch { res.status(400).json({ error: 'bad batch' }); return; }
    if (!Array.isArray(list) || !list.length || list.length > 24) { res.status(400).json({ error: 'bad batch' }); return; }
    // 네이버 한도(초당 10건) 안에서 4개씩 나눠 보낸다
    const results = [];
    for (let i = 0; i < list.length; i += 4) {
      if (i) await wait(150);
      results.push(...await Promise.all(list.slice(i, i + 4).map(([kw, st]) =>
        naverSafe(String(kw), Number(st) || 1, display, sort))));
    }
    // 일부라도 실패하면 캐시를 짧게 — 빈칸이 3분 동안 굳지 않게
    if (results.some(r => r.error)) res.setHeader('Cache-Control', 'public, s-maxage=10');
    res.status(200).json({ results });
    return;
  }

  const data = await naver(keyword, start, display, sort);
  res.status(200).json(data);
}
