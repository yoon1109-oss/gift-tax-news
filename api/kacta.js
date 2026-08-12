// 한국세무사회 보도자료(조세뉴스) 1페이지 목록 프록시.
// 목록 페이지(EUC-KR)에서 키·날짜를 얻고, 전체 제목은 목록이 잘라서 주므로
// 각 상세 페이지(GET: ?mode=view&bbs_key=KEY)에서 전체 제목을 병렬로 가져온다.
const BASE = 'https://m.kacta.or.kr/notice_view/not_press/josenews.asp';

function clean(s) {
  return (s || '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#8231;|&#8226;|&#8901;|&middot;/g, '·')
    .replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&apos;|&#39;/g, "'")
    .replace(/&#\d+;/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
// 앞머리 [보도자료] / [보도자료/조세브리핑] 등 대괄호 태그 제거
const stripTag = t => t.replace(/^\s*\[[^\]]*\]\s*/, '').trim();

// 세무사회 서버가 느릴 때 전체 응답이 묶이지 않도록 요청별 타임아웃을 건다.
async function fetchDecoded(url, timeoutMs = 0) {
  const ctl = timeoutMs ? new AbortController() : null;
  const timer = ctl ? setTimeout(() => ctl.abort(), timeoutMs) : null;
  try {
    const r = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0' }, signal: ctl?.signal });
    const buf = await r.arrayBuffer();
    return new TextDecoder('euc-kr').decode(buf);
  } finally { if (timer) clearTimeout(timer); }
}

// 상세에서 전체 제목을 가져오되, 2.5초 넘으면 목록의 (잘린) 제목으로 폴백.
//
// 상세 페이지의 '제 목' 칸도 세무사회 DB에서 잘려 오는 경우가 있다(15건 중 4~5건).
// 그때는 본문 첫 줄(.kacta-publish-body 안의 제목 스타일 div)에 전체 제목이 남아 있어
// 그쪽을 쓴다. 제목이 잘리면 '세무플랫폼' 같은 뒷부분 단어가 사라져 연관도 분류에서도
// 빠지므로, 표시뿐 아니라 분류 정확도에도 영향이 있다.
async function fullTitle(key, fallback) {
  try {
    const html = await fetchDecoded(`${BASE}?mode=view&GotoPage=1&bbs_key=${key}`, 2500);
    const m = html.match(/<td[^>]*colspan="4"[^>]*align="left"[^>]*>([\s\S]*?)<\/td>/i);
    const field = m ? stripTag(clean(m[1])) : '';
    // 잘린 제목은 점 2개 이상 또는 …으로 끝난다 ('대법원판결..' 같은 사례가 있어 3개로 보면 놓친다)
    if (field && !/\.{2,}$|…$/.test(field)) return field;

    const b = html.match(/class="kacta-publish-body"[\s\S]{0,200}?>([\s\S]*?)<\/div>/i);
    const body = b ? stripTag(clean(b[1])) : '';
    // 본문 첫 줄이 정말 이 글의 제목인지 확인한다 — 잘린 앞부분으로 시작해야 한다.
    // 다른 문장으로 바꿔치기되는 것을 막기 위함.
    const head = field.replace(/\.{2,}$|…$/, '').trim();
    if (body && head && body.startsWith(head.slice(0, Math.min(head.length, 20)))) return body;
    return field || fallback;
  } catch { return fallback; }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1800'); // 보도자료: 하루 몇 건
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  try {
    const html = await fetchDecoded(BASE, 6000);
    // <a href="javascript:goView(1,KEY)"> 제목(잘림)</a> ... <font>YYYY-MM-DD</font>
    const re = /goView\(1,(\d+)\)"[^>]*>([\s\S]*?)<\/a>[\s\S]{0,180}?(\d{4}-\d{2}-\d{2})/g;
    const rows = [];
    let m;
    while ((m = re.exec(html)) && rows.length < 15) {
      const listTitle = stripTag(clean(m[2]));
      if (!listTitle) continue;
      rows.push({ key: m[1], listTitle, date: m[3] });
    }

    // 전체 제목은 상세에서 병렬로 보강
    const items = await Promise.all(rows.map(async row => ({
      key: row.key,
      title: await fullTitle(row.key, row.listTitle),
      date: row.date,
      link: `${BASE}?mode=view&GotoPage=1&bbs_key=${row.key}`,
    })));

    res.status(200).json({ items });
  } catch (e) {
    res.status(500).json({ error: e.message, items: [] });
  }
}
