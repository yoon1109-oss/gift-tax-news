// 네이버 블로그 공감수(좋아요) 프록시.
// 검색 API는 공감수를 주지 않으므로 blog.like.naver.com 반응 API를 서버에서 대신 조회한다.
// (해당 엔드포인트는 CORS 미허용 + referer 필요라 브라우저 직접 호출 불가)
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=900'); // 공감수
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  // ids = "blogId_logNo,blogId_logNo,..." (최대 60건, 함수 실행시간 보호)
  const ids = String(req.query.ids || '')
    .split(',').map(s => s.trim()).filter(Boolean).slice(0, 60);

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
