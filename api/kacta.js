// 한국세무사회 보도자료(조세뉴스) 1페이지 목록 프록시.
// 목록 페이지는 EUC-KR HTML로 서버 렌더되며, 상세는 goView(page,key) 폼 이동이지만
// GET(josenews.asp?mode=view&GotoPage=1&bbs_key=KEY)으로도 열린다.
const LIST_URL = 'https://m.kacta.or.kr/notice_view/not_press/josenews.asp';

function clean(s) {
  return (s || '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#8231;|&#8226;|&#8901;|&middot;/g, '·')
    .replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&apos;|&#39;/g, "'")
    .replace(/&#\d+;/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  try {
    const r = await fetch(LIST_URL, { headers: { 'user-agent': 'Mozilla/5.0' } });
    const buf = await r.arrayBuffer();
    const html = new TextDecoder('euc-kr').decode(buf);

    // 행 구조: <a href="javascript:goView(1,KEY)"> &nbsp;&nbsp;제목</a> ... <font ...>YYYY-MM-DD</font>
    const re = /goView\(1,(\d+)\)"[^>]*>([\s\S]*?)<\/a>[\s\S]{0,180}?(\d{4}-\d{2}-\d{2})/g;
    const items = [];
    let m;
    while ((m = re.exec(html)) && items.length < 15) {
      const title = clean(m[2]);
      if (!title) continue;
      items.push({
        key: m[1],
        title,
        date: m[3],
        link: `${LIST_URL}?mode=view&GotoPage=1&bbs_key=${m[1]}`,
      });
    }
    res.status(200).json({ items });
  } catch (e) {
    res.status(500).json({ error: e.message, items: [] });
  }
}
