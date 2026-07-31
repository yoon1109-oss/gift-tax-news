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

async function fetchDecoded(url) {
  const r = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0' } });
  const buf = await r.arrayBuffer();
  return new TextDecoder('euc-kr').decode(buf);
}

async function fullTitle(key, fallback) {
  try {
    const html = await fetchDecoded(`${BASE}?mode=view&GotoPage=1&bbs_key=${key}`);
    const m = html.match(/<td[^>]*colspan="4"[^>]*align="left"[^>]*>([\s\S]*?)<\/td>/i);
    const t = m ? stripTag(clean(m[1])) : '';
    return t || fallback;
  } catch { return fallback; }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  try {
    const html = await fetchDecoded(BASE);
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
