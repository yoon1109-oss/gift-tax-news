// 증여·상속세 주요 지표 — 큐레이션 데이터. (KOSIS 자동연동은 통계표 파라미터 확정 후 전환)
// 출처: 국세청 국세통계(e-나라지표) 및 이를 인용한 보도.
const UPDATED_AT = '2026-07-30';
const BASIS = '2024년 귀속(2025년 국세통계)';
const SOURCE = 'e-나라지표(국세통계)';

// ── 핵심 타겟: 수증자 연령별 증여 현황 (미성년·20~50대) ──
const AGE = {
  title: '수증자 연령별 증여 (핵심 타겟)',
  items: [
    { group: '미성년 (만 19세 미만)', tag: '타겟',
      lines: ['2024년 14,217건 · 1조 2,382억원', '1인당 평균 8,709만원 · 최근 5년 +44%'] },
    { group: '20·30대 (MZ)', tag: '타겟',
      lines: ['2018~2022 누적 37.0만건 · 73.4조원', '20대 27.0조 / 30대 46.4조 · 20대 수증인 증가율 최고(+66%)'] },
    { group: '40·50대', tag: '',
      lines: ['연령대별 상세 건수·재산가액은 국세통계(수증인 연령별) 참고', '아래 바로가기에서 확인'] },
  ],
};

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
  { title: '수증인의 연령별 증여세 현황 (KOSIS 6.4.5)', desc: '미성년·20~50대 등 연령대별 결정 건수·재산가액·세액', link: 'https://kosis.kr/statHtml/statHtml.do?orgId=133&tblId=DT_133N_645' },
  { title: '증여세 신고 현황 (공공데이터포털·최신)', desc: '2025년 신고분(기준 2025-12-31) 지역별 신고건수·재산가액 — 국세청', link: 'https://www.data.go.kr/data/3058487/fileData.do' },
  { title: '증여세 신고 현황 (국세통계포털 TASIS)', desc: '건수·재산가액·결정세액, 규모별·재산종류별·연령별 상세', link: 'https://tasis.nts.go.kr/websquare/websquare.html?w2xPath=/cm/index.xml' },
  { title: '부동산 증여 거래현황 (한국부동산원 R-ONE)', desc: '거래원인별 부동산거래 중 증여 — 월 단위', link: 'https://www.reb.or.kr/r-one/' },
  { title: '상속·증여세 지표 시계열 (e-나라지표)', desc: '연도별 과세건수·총결정세액', link: 'https://www.index.go.kr/unity/potal/main/EachDtlPageDetail.do?idx_cd=2848' },
];

const KEY = process.env.KOSIS_KEY;
async function kget(url) { const r = await fetch(url); const t = await r.text(); try { return JSON.parse(t); } catch { return { raw: t.slice(0, 2500) }; } }

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const dbg = req.query.debug;
  if (dbg) {
    try {
      if (dbg === 'search') {
        const q = req.query.q || '증여';
        return res.status(200).json(await kget(`https://kosis.kr/openapi/statisticsSearch.do?method=getList&apiKey=${KEY}&searchNm=${encodeURIComponent(q)}&startCount=1&resultCount=25&format=json&jsonVD=Y`));
      }
      if (dbg === 'meta') {
        const { orgId, tblId, type = 'OBJ' } = req.query;
        return res.status(200).json(await kget(`https://kosis.kr/openapi/statisticsData.do?method=getMeta&apiKey=${KEY}&orgId=${orgId}&tblId=${tblId}&type=${type}&format=json&jsonVD=Y`));
      }
      if (dbg === 'data') {
        const { orgId, tblId, itmId = 'ALL', prdSe = 'Y', newEstPrdCnt = '1' } = req.query;
        // objL1~objL3 조합을 자동으로 시도해 성공하는 걸 반환
        const combos = [
          { objL1: 'ALL' },
          { objL1: 'ALL', objL2: 'ALL' },
          { objL1: 'ALL', objL2: 'ALL', objL3: 'ALL' },
        ];
        for (const c of combos) {
          const objParams = Object.entries(c).map(([k, v]) => `${k}=${v}`).join('&');
          const url = `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${KEY}&itmId=${itmId}&${objParams}&format=json&jsonVD=Y&prdSe=${prdSe}&newEstPrdCnt=${newEstPrdCnt}&orgId=${orgId}&tblId=${tblId}`;
          const j = await kget(url);
          if (Array.isArray(j) && j.length) return res.status(200).json({ combo: c, rows: j.length, sample: j.slice(0, 40) });
          if (!Array.isArray(j)) var lastErr = j;
        }
        return res.status(200).json({ err: lastErr || 'no rows for any objL combo' });
      }
    } catch (e) { return res.status(200).json({ error: e.message }); }
  }

  res.status(200).json({ updatedAt: UPDATED_AT, basis: BASIS, source: SOURCE, age: AGE, metrics: METRICS, sources: SOURCES });
}
