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

// 세무플랫폼 규제 이슈 — 조세 전문지만 보면 놓친다.
// '국세청 발주보고서, 삼쩜삼에 API호출 건당 최대 77원 부과 제안'(연합뉴스, 2026-09-24)이
// 세법 뉴스에 아예 없었다 (2026-09-28 제보). 이 주제는 연합·이데일리 같은 일반 매체가 먼저 쓴다.
// 그래서 이 주제만 매체 제한 없이 받되, '플랫폼 이름 × 국세청·규제' 둘 다 제목에 있어야 한다.
// '삼쩜삼' 검색 상위는 '삼쩜삼캠퍼스 가입자 14만' 같은 홍보 기사라 플랫폼 이름만으로는 거를 수 없다.
const ISSUE_KEYWORDS = ['삼쩜삼', '세무플랫폼', '홈택스 스크래핑'];
const ISSUE_PLATFORM = /삼쩜삼|세무\s?플랫폼|자비스앤빌런즈|택스테크|세금\s?환급\s?(앱|플랫폼)/;
const ISSUE_REG = /국세청|홈택스|API|수수료|이용료|스크래핑|과세\s?정보|세금\s?정보|개인정보|세무대리|세무사|규제|법안|시행령|제재|과징금|용역|보고서/;
const PRESS = {
  'yna.co.kr': '연합뉴스', 'yonhapnews.co.kr': '연합뉴스', 'edaily.co.kr': '이데일리', 'kookje.co.kr': '국제신문',
  'hankyung.com': '한국경제', 'mk.co.kr': '매일경제', 'mt.co.kr': '머니투데이', 'chosun.com': '조선일보',
  'joongang.co.kr': '중앙일보', 'donga.com': '동아일보', 'hani.co.kr': '한겨레', 'khan.co.kr': '경향신문',
  'sedaily.com': '서울경제', 'newsis.com': '뉴시스', 'news1.kr': '뉴스1', 'etnews.com': '전자신문',
  'zdnet.co.kr': '지디넷코리아', 'bloter.net': '블로터', 'asiae.co.kr': '아시아경제', 'fnnews.com': '파이낸셜뉴스',
  'heraldcorp.com': '헤럴드경제', 'newspim.com': '뉴스핌', 'taxwatch.co.kr': '택스워치', 'ddaily.co.kr': '디지털데일리',
};
function pressOf(url) {
  try {
    const h = new URL(url).hostname.replace(/^www\.|^m\.|^view\.|^biz\./, '');
    const key = Object.keys(PRESS).find(d => h === d || h.endsWith('.' + d));
    return key ? PRESS[key] : h;
  } catch (e) { return null; }
}

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

async function search(keyword, start, sort = 'sim') {
  const r = await fetch(
    `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(keyword)}&display=100&start=${start}&sort=${sort}`,
    { headers: {
      'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID,
      'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET,
    }}
  );
  if (!r.ok) throw new Error('naver ' + r.status);
  const j = await r.json();
  // 네이버는 속도 제한에 걸려도 200에 errorMessage만 보낸다 — 빈 배열로 삼키면 재시도가 안 걸린다
  if (!j.items) throw new Error(j.errorMessage || 'no items');
  return j.items;
}
const wait = ms => new Promise(r => setTimeout(r, ms));
const searchRetry = (kw, start, sort) => search(kw, start, sort)
  .catch(() => wait(800).then(() => search(kw, start, sort)))
  .catch(() => wait(1800).then(() => search(kw, start, sort)))
  .catch(() => []);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1800');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  // 15건을 한꺼번에 보내면 네이버가 일부를 조용히 거절한다(배포 직후 이슈 기사 0건으로 실측).
  // 이슈 질의를 먼저 받고(최신순 — 관련도순이면 몇 달 전 기사가 위에 온다), 나머지는 4개씩 나눠 보낸다.
  const issueBatches = await Promise.all(ISSUE_KEYWORDS.map(kw => searchRetry(kw, 1, 'date')));
  const tasks = [];
  for (const kw of KEYWORDS) for (const start of PAGES) tasks.push(() => searchRetry(kw, start));
  const batches = [];
  for (let i = 0; i < tasks.length; i += 4) {
    await wait(250);
    batches.push(...await Promise.all(tasks.slice(i, i + 4).map(f => f())));
  }

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

  // 세무플랫폼 이슈 — 매체 제한 없음. 전문지 기사가 이미 있으면 issue 표시만 붙인다.
  // 최근 120일만 — '홈택스 스크래핑'은 2025년 기사까지 27건이 걸려 연관도 맨 위를 과거 기사가 채운다.
  const issueCut = Date.now() - 120 * 864e5;
  for (const items of issueBatches) {
    for (const it of items) {
      const link = it.originallink || it.link;
      const title = clean(it.title);
      if (!ISSUE_PLATFORM.test(title) || !ISSUE_REG.test(title)) continue;
      if (new Date(it.pubDate) < issueCut) continue;
      if (byLink.has(link)) { byLink.get(link).issue = true; continue; }
      byLink.set(link, {
        title,
        desc: clean(it.description),
        link,
        outlet: outletOf(link) || pressOf(link) || '일반 매체',
        pubDate: it.pubDate,
        issue: true,
        general: !outletOf(link),
      });
    }
  }

  const items = [...byLink.values()].sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
  const byOutlet = {};
  items.forEach(x => { if (!x.general) byOutlet[x.outlet] = (byOutlet[x.outlet] || 0) + 1; });
  const issueCount = items.filter(x => x.general).length;

  res.status(200).json({
    fetchedAt: new Date().toISOString(),
    keywords: KEYWORDS,
    outlets: Object.values(OUTLETS),
    byOutlet,
    issueCount,
    items,
  });
}
