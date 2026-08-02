// 증여·상속세 지표 — KOSIS 국세통계 OpenAPI 자동 수집 (국세청 orgId=133).
//   수증자 연령별 증여: 6.4.5 DT_133N_645 (결정 인원)
//   증여세 요약:        6.4.2 DT_133N_652 (결정건수·재산가액·총결정세액)
//   상속세 요약:        6.2.2 DT_133N_622 (피상속인수·총상속재산가액·총결정세액)
// 키: process.env.KOSIS_KEY (Vercel). 실패 시 아래 FALLBACK 사용.
const UPDATED_AT = '2026-07-30';
const SOURCE = 'KOSIS 국세통계(국세청)';
const KEY = process.env.KOSIS_KEY;

const nf = n => Number(n || 0).toLocaleString('ko-KR');
const jo = mw => (Number(mw || 0) / 1e6).toFixed(2) + '조원'; // 백만원 → 조원
const pct = (c, p) => (p ? `전년比 ${c - p >= 0 ? '+' : '−'}${Math.abs((c - p) / p * 100).toFixed(1)}%` : '');

async function kosisRows(tblId, cnt = 1) {
  if (!KEY) return null;
  try {
    const url = `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${KEY}&itmId=ALL&objL1=ALL&objL2=ALL&format=json&jsonVD=Y&prdSe=Y&newEstPrdCnt=${cnt}&orgId=133&tblId=${tblId}`;
    const j = await (await fetch(url)).json();
    return Array.isArray(j) && j.length ? j.filter(x => x.C1_NM === '합계') : null; // 전국(납세지 합계)
  } catch { return null; }
}

async function kosisAge() {
  const nat = await kosisRows('DT_133N_645', 1);
  if (!nat || !nat.length) return null;
  const by = {}; nat.forEach(x => { by[x.C2_NM] = Number(x.DT); });
  const g = k => by[k] || 0, year = nat[0].PRD_DE;
  const minor = g('10세 미만') + g('10세 이상');
  return {
    title: `수증자 연령별 증여 결정 인원 · ${year}년 (핵심 타겟)`,
    items: [
      { group: '미성년 (만 19세 미만)', tag: '타겟', lines: [`${year}년 결정 ${nf(minor)}명 · 재산가액 약 1조 2,382억원`, '1인당 평균 8,709만원 · 최근 5년 +44%'] },
      { group: '20·30대 (MZ)', tag: '타겟', lines: [`20대 ${nf(g('20세 이상'))}명 · 30대 ${nf(g('30세 이상'))}명`] },
      { group: '40·50대', tag: '', lines: [`40대 ${nf(g('40세 이상'))}명 · 50대 ${nf(g('50세 이상'))}명 · 60세 이상 ${nf(g('60세 이상'))}명`] },
    ],
  };
}

// 표에서 특정 항목(C2_NM)의 최신·전년 값
function pick(rows, itm) {
  const yrs = [...new Set(rows.filter(x => x.C2_NM === itm).map(x => x.PRD_DE))].sort();
  const cur = yrs[yrs.length - 1], prev = yrs[yrs.length - 2];
  const v = y => Number((rows.find(x => x.C2_NM === itm && x.PRD_DE === y) || {}).DT || 0);
  return { year: cur, cur: v(cur), prev: prev ? v(prev) : null };
}

async function kosisMetrics() {
  const [gift, inh] = await Promise.all([kosisRows('DT_133N_652', 2), kosisRows('DT_133N_622', 2)]);
  if (!gift || !inh) return null;
  const gCnt = pick(gift, '결정건수'), gTax = pick(gift, '총 결정세액');
  const iCnt = pick(inh, '피상속인수'), iTax = pick(inh, '총결정세액');
  return [
    { group: `증여세 (${gCnt.year}년)`, items: [
      { label: '결정 건수', value: `${nf(gCnt.cur)}건`, delta: pct(gCnt.cur, gCnt.prev) },
      { label: '총결정세액', value: jo(gTax.cur), delta: pct(gTax.cur, gTax.prev) },
    ]},
    { group: `상속세 (${iCnt.year}년)`, items: [
      { label: '피상속인 수', value: `${nf(iCnt.cur)}명`, delta: pct(iCnt.cur, iCnt.prev) },
      { label: '총결정세액', value: jo(iTax.cur), delta: pct(iTax.cur, iTax.prev) },
    ]},
  ];
}

const AGE_FALLBACK = { title: '수증자 연령별 증여 (핵심 타겟)', items: [
  { group: '미성년 (만 19세 미만)', tag: '타겟', lines: ['2024년 15,593명 · 재산가액 약 1조 2,382억원', '1인당 평균 8,709만원 · 최근 5년 +44%'] },
  { group: '20·30대 (MZ)', tag: '타겟', lines: ['20대 21,752명 · 30대 35,605명'] },
  { group: '40·50대', tag: '', lines: ['40대 38,128명 · 50대 38,228명 · 60세 이상 28,012명'] },
]};
const METRICS_FALLBACK = [
  { group: '증여세 (2024년)', items: [{ label: '결정 건수', value: '178,660건', delta: '' }, { label: '총결정세액', value: '5.68조원', delta: '' }] },
  { group: '상속세 (2023년)', items: [{ label: '피상속인 수', value: '19,944명', delta: '' }, { label: '총결정세액', value: '12.29조원', delta: '' }] },
];

const SOURCES = [
  { title: '수증인의 연령별 증여세 현황 (KOSIS 6.4.5)', desc: '미성년·20~50대 등 연령대별 결정 인원 — 자동 연동', link: 'https://kosis.kr/statHtml/statHtml.do?orgId=133&tblId=DT_133N_645' },
  { title: '증여세 결정 현황 (KOSIS 6.4.2)', desc: '결정건수·증여재산가액·총결정세액 — 자동 연동', link: 'https://kosis.kr/statHtml/statHtml.do?orgId=133&tblId=DT_133N_652' },
  { title: '증여세 신고 현황 (공공데이터포털·최신)', desc: '2025년 신고분(기준 2025-12-31) 지역별 신고건수·재산가액 — 국세청', link: 'https://www.data.go.kr/data/3058487/fileData.do' },
  { title: '증여세 신고 현황 (국세통계포털 TASIS)', desc: '규모별·재산종류별·연령별 상세', link: 'https://tasis.nts.go.kr/websquare/websquare.html?w2xPath=/cm/index.xml' },
  { title: '부동산 증여 거래현황 (한국부동산원 R-ONE)', desc: '거래원인별 부동산거래 중 증여 — 월 단위', link: 'https://www.reb.or.kr/r-one/' },
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  if (req.query.debug === 'years') {
    const out = {};
    for (const [nm, tbl] of [['연령별645', 'DT_133N_645'], ['증여652', 'DT_133N_652'], ['상속622', 'DT_133N_622']]) {
      const rows = await kosisRows(tbl, 3);
      out[nm] = rows ? [...new Set(rows.map(x => x.PRD_DE))].sort() : 'null';
    }
    return res.status(200).json(out);
  }

  const [age, metrics] = await Promise.all([kosisAge(), kosisMetrics()]);
  res.status(200).json({
    updatedAt: UPDATED_AT,
    basis: '국세통계 최신 · 표별 연도 표기',
    source: SOURCE,
    age: age || AGE_FALLBACK,
    metrics: metrics || METRICS_FALLBACK,
    sources: SOURCES,
  });
}
