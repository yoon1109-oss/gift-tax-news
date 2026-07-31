// 증여·상속세 주요 지표 — 큐레이션 데이터.
// KOSIS/TASIS Open API 키 발급 전까지 공식 통계(e-나라지표) 수치를 수기로 넣는다.
// 키 확보 시 자동 연동으로 전환 예정.
const UPDATED_AT = '2026-07-30';
const BASIS = '2025년';
const SOURCE = 'e-나라지표(국세통계)';

const METRICS = [
  { group: '증여세', items: [
    { label: '과세 건수', value: '181,653건', delta: '전년比 +1.7%' },
    { label: '총결정세액', value: '5.48조원', delta: '전년比 −3.5%' },
  ]},
  { group: '상속세', items: [
    { label: '과세 인원', value: '22,524명', delta: '전년比 +6.3%' },
    { label: '총결정세액', value: '8.93조원', delta: '전년比 +9.0%' },
  ]},
];

const SOURCES = [
  { title: '증여세 신고 현황 (국세통계포털 TASIS)', desc: '건수·재산가액·결정세액, 규모별·재산종류별·연령별 상세', link: 'https://tasis.nts.go.kr/websquare/websquare.html?w2xPath=/cm/index.xml' },
  { title: '증여세 신고 현황 원자료 (공공데이터포털)', desc: '연도별 CSV — 국세청 제공', link: 'https://www.data.go.kr/data/15119378/fileData.do' },
  { title: '부동산 증여 거래현황 (한국부동산원 R-ONE)', desc: '거래원인별 부동산거래 중 증여 — 월 단위', link: 'https://www.reb.or.kr/r-one/' },
  { title: '상속·증여세 지표 시계열 (e-나라지표)', desc: '연도별 과세건수·총결정세액', link: 'https://www.index.go.kr/unity/potal/main/EachDtlPageDetail.do?idx_cd=2848' },
];

const KEY = process.env.KOSIS_KEY;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  // ── 개발용 디버그 모드 (KOSIS 통계표 탐색) ──
  const dbg = req.query.debug;
  if (dbg) {
    try {
      if (dbg === 'key') return res.status(200).json({ hasKey: !!KEY, len: (KEY || '').length });
      if (dbg === 'search') {
        const q = req.query.q || '증여';
        const url = `https://kosis.kr/openapi/statisticsSearch.do?method=getList&apiKey=${KEY}&searchNm=${encodeURIComponent(q)}&startCount=1&resultCount=20&format=json&jsonVD=Y`;
        const r = await fetch(url);
        const t = await r.text();
        let j; try { j = JSON.parse(t); } catch { j = { raw: t.slice(0, 2000) }; }
        return res.status(200).json(j);
      }
      if (dbg === 'meta') {
        const { orgId, tblId, type = 'OBJ' } = req.query; // type=OBJ 분류 / ITM 항목
        const url = `https://kosis.kr/openapi/statisticsData.do?method=getMeta&apiKey=${KEY}&orgId=${orgId}&tblId=${tblId}&type=${type}&format=json&jsonVD=Y`;
        const r = await fetch(url);
        const t = await r.text();
        let j; try { j = JSON.parse(t); } catch { j = { raw: t.slice(0, 3000) }; }
        return res.status(200).json(j);
      }
      if (dbg === 'data') {
        const { orgId, tblId, objL1 = 'ALL', itmId = 'ALL', prdSe = 'Y', newEstPrdCnt = '1' } = req.query;
        const url = `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${KEY}&itmId=${itmId}&objL1=${objL1}&format=json&jsonVD=Y&prdSe=${prdSe}&newEstPrdCnt=${newEstPrdCnt}&orgId=${orgId}&tblId=${tblId}`;
        const r = await fetch(url);
        const t = await r.text();
        let j; try { j = JSON.parse(t); } catch { j = { raw: t.slice(0, 3000) }; }
        return res.status(200).json({ url: url.replace(KEY || '', 'KEY'), data: j });
      }
    } catch (e) { return res.status(200).json({ error: e.message }); }
  }

  res.status(200).json({ updatedAt: UPDATED_AT, basis: BASIS, source: SOURCE, metrics: METRICS, sources: SOURCES });
}
