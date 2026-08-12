// 세법 뉴스 — 조세 전문지 4곳의 기사만 모은다.
//
// 이 매체들은 일반 키워드 검색 결과에서 비중이 2~5%밖에 안 돼(자녀 증여 300건 중 8건),
// 기존 뉴스 탭 결과를 걸러내는 방식으로는 양이 나오지 않는다. 그래서 세무 쪽 키워드로
// 따로 검색한 뒤 도메인으로 추려낸다. 클라이언트에서 하면 호출이 10회 넘게 나가므로
// 서버에서 모아 캐시한다.
const OUTLETS = {
  'taxtimes.co.kr': '한국세정신문',
  'joseilbo.com':   '조세일보',
  'intn.co.kr':     '국세신문(일간NTN)',
  'sejungilbo.com': '세정일보',
};
const KEYWORDS = ['증여세', '상속세', '세법', '세무', '가업승계', '세제개편'];
const PAGES = [1, 101];   // 키워드당 200건까지

const clean = s => String(s || '')
  .replace(/<[^>]*>/g, '')
  .replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>').replace(/&#\d+;/g, '').replace(/&apos;/g, "'").trim();

function outletOf(url) {
  try {
    const h = new URL(url).hostname.replace(/^www\.|^m\./, '');
    const key = Object.keys(OUTLETS).find(d => h === d || h.endsWith('.' + d));
    return key ? OUTLETS[key] : null;
  } catch (e) { return null; }
}

async function search(keyword, start) {
  const r = await fetch(
    `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(keyword)}&display=100&start=${start}&sort=sim`,
    { headers: {
      'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID,
      'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET,
    }}
  );
  if (!r.ok) throw new Error('naver ' + r.status);
  return (await r.json()).items || [];
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1800');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const jobs = [];
  for (const kw of KEYWORDS) for (const start of PAGES) jobs.push(search(kw, start).catch(() => []));
  const batches = await Promise.all(jobs);

  const byLink = new Map();
  for (const items of batches) {
    for (const it of items) {
      const link = it.originallink || it.link;
      const outlet = outletOf(link);
      if (!outlet || byLink.has(link)) continue;
      byLink.set(link, {
        title: clean(it.title),
        desc: clean(it.description),
        link,
        outlet,
        pubDate: it.pubDate,
      });
    }
  }

  const items = [...byLink.values()].sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
  const byOutlet = {};
  items.forEach(x => { byOutlet[x.outlet] = (byOutlet[x.outlet] || 0) + 1; });

  res.status(200).json({
    fetchedAt: new Date().toISOString(),
    keywords: KEYWORDS,
    outlets: Object.values(OUTLETS),
    byOutlet,
    items,
  });
}
