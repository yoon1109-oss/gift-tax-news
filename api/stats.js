// 통계 탭 — 파이(Pi) 앱 참고용 증여 지표.
//   2025년 신고 현황: 국세통계 6.3.1(납세지) 다운로드본 수기 반영 (KOSIS 미공개분)
//   수증자 연령별  : KOSIS OpenAPI 자동 연동 (국세청 6.4.5, DT_133N_645)
// 파이 앱 = 미성년 자녀 증여·투자·세무 원스톱 플랫폼 → 자녀 증여 시장 규모,
// 직계존비속 공제, 10년 합산(사전증여 가산) 효과, 수증자 연령 분포가 핵심 지표.
const UPDATED_AT = '2026-08-04';
const BASIS = '2025년 신고분 (국세통계 6.3.1) · 연령별은 2024년 결정분';
const SOURCE = '국세통계포털(TASIS) · KOSIS';
const KEY = process.env.KOSIS_KEY;

const nf = n => Number(n || 0).toLocaleString('ko-KR');
const jo = mw => (Number(mw || 0) / 1e6).toFixed(2) + '조원';

// ── 2025년 신고 현황 (단위: 백만원) ──
const Y2025 = {
  건수: 180260,
  증여재산가액: 30992994,
  가산액: 18164878,        // 10년 내 사전증여 합산
  과세가액: 48084526,
  공제소계: 7964058,
  공제_배우자: 2089835,
  공제_직계존비속: 4569818, // 파이 앱 핵심
  공제_혼인: 711945,
  공제_출산: 293172,
  공제_기타친족: 299288,
  과세표준: 40109898,
  산출세액: 11354928,
  자진납부세액: 5924535,
  지역: [
    { name: '서울', cnt: 63057, amt: 16158854 },
    { name: '경기', cnt: 47279, amt: 6993844 },
    { name: '부산', cnt: 7677, amt: 1135231 },
    { name: '인천', cnt: 7403, amt: 897271 },
    { name: '대구', cnt: 5485, amt: 845053 },
  ],
};

const pct = (a, b) => (a / b * 100).toFixed(1) + '%';
const 건당 = (amt, cnt) => (amt * 1e6 / cnt / 1e8).toFixed(2) + '억원';

// 파이 앱이 참고할 핵심 포인트 (연령별은 KOSIS에서 자동 채움)
function piPoints(age) {
  const y = Y2025;
  const items = [
    { group: '자녀 증여 시장 (파이 핵심)', tag: '타겟', lines: [
      `직계존비속 공제 ${jo(y.공제_직계존비속)} — 전체 증여재산공제의 ${pct(y.공제_직계존비속, y.공제소계)}`,
      `혼인 ${jo(y.공제_혼인)} + 출산 ${jo(y.공제_출산)} 공제 활용 (2024 신설)`,
    ]},
    { group: '10년 합산 효과 (분할 증여 설계 근거)', tag: '타겟', lines: [
      `사전증여 가산액 ${jo(y.가산액)} — 과세가액 ${jo(y.과세가액)}의 ${pct(y.가산액, y.과세가액)}`,
      '10년 내 증여가 합산돼 세율 구간이 올라감 → 조기·분할 증여 설계가 절세 핵심',
    ]},
  ];
  if (age) items.unshift(age);
  return { title: '파이 앱 참고 지표', items };
}

const METRICS = [
  { group: `증여 시장 규모 (2025년 신고)`, items: [
    { label: '신고 건수', value: `${nf(Y2025.건수)}건`, delta: '' },
    { label: '증여재산가액', value: jo(Y2025.증여재산가액), delta: `건당 평균 ${건당(Y2025.증여재산가액, Y2025.건수)}` },
  ]},
  { group: '세부담', items: [
    { label: '과세표준', value: jo(Y2025.과세표준), delta: `산출세액 ${jo(Y2025.산출세액)}` },
    { label: '자진납부세액', value: jo(Y2025.자진납부세액), delta: `실효 ${pct(Y2025.산출세액, Y2025.과세표준)} (산출/과표)` },
  ]},
  { group: '지역 분포 (재산가액 상위)', items: Y2025.지역.slice(0, 4).map(r => ({
    label: r.name, value: jo(r.amt), delta: `${nf(r.cnt)}건 · 건당 ${건당(r.amt, r.cnt)}`,
  }))},
];

async function kosisAge() {
  if (!KEY) return null;
  try {
    const url = `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${KEY}&itmId=ALL&objL1=ALL&objL2=ALL&format=json&jsonVD=Y&prdSe=Y&newEstPrdCnt=1&orgId=133&tblId=DT_133N_645`;
    const j = await (await fetch(url)).json();
    if (!Array.isArray(j) || !j.length) return null;
    const nat = j.filter(x => x.C1_NM === '합계');
    if (!nat.length) return null;
    const by = {}; nat.forEach(x => { by[x.C2_NM] = Number(x.DT); });
    const g = k => by[k] || 0, year = nat[0].PRD_DE, all = g('합계') || 1;
    const minor = g('10세 미만') + g('10세 이상');
    return { group: `수증자 연령별 (${year}년 결정)`, tag: '타겟', lines: [
      `미성년(만 19세 미만) ${nf(minor)}명 — 전체 수증자의 ${pct(minor, all)}`,
      `20대 ${nf(g('20세 이상'))}명 · 30대 ${nf(g('30세 이상'))}명 · 40대 ${nf(g('40세 이상'))}명 · 50대 ${nf(g('50세 이상'))}명`,
    ]};
  } catch { return null; }
}

const AGE_FALLBACK = { group: '수증자 연령별 (2024년 결정)', tag: '타겟', lines: [
  '미성년(만 19세 미만) 15,593명 — 전체 수증자의 8.7%',
  '20대 21,752명 · 30대 35,605명 · 40대 38,128명 · 50대 38,228명',
]};

const SOURCES = [
  { title: '증여세 신고 현황Ⅰ(납세지) — 2025년', desc: '신고건수·증여재산가액·공제·과세표준 (이 탭의 2025년 수치 원본)', link: 'https://tasis.nts.go.kr/websquare/websquare.html?w2xPath=/ui/ep/e/a/UTWEPEAA02.xml&sttPblYr=2026&sttsMtaInfrId=20251203F01202622977' },
  { title: '수증인의 연령별 증여세 현황 (KOSIS 6.4.5)', desc: '미성년·20~50대 연령대별 결정 인원 — 자동 연동', link: 'https://kosis.kr/statHtml/statHtml.do?orgId=133&tblId=DT_133N_645' },
  { title: '국세통계포털(TASIS)', desc: '규모별·재산종류별·관계별 등 증여세 상세 통계', link: 'https://tasis.nts.go.kr/websquare/websquare.html?w2xPath=/cm/index.xml' },
  { title: '부동산 증여 거래현황 (한국부동산원 R-ONE)', desc: '거래원인별 부동산거래 중 증여 — 월 단위', link: 'https://www.reb.or.kr/r-one/' },
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1800');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }


  // [임시] KOSIS 조회 — 연령별 표의 보유 연도/신고기준 표 존재 여부 확인용
  if (req.query.debug) {
    const kg = async u => { const r = await fetch(u); const t = await r.text(); try { return JSON.parse(t); } catch { return { raw: t.slice(0,1500) }; } };
    if (req.query.debug === 'search') {
      const q = req.query.q || '연령별 증여';
      const j = await kg(`https://kosis.kr/openapi/statisticsSearch.do?method=getList&apiKey=${KEY}&searchNm=${encodeURIComponent(q)}&startCount=1&resultCount=30&format=json&jsonVD=Y`);
      return res.status(200).json(Array.isArray(j) ? j.map(x => ({ org: x.ORG_ID, tbl: x.TBL_ID, nm: x.TBL_NM })) : j);
    }
    if (req.query.debug === 'years') {
      const t = req.query.tblId || 'DT_133N_645';
      const j = await kg(`https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${KEY}&itmId=ALL&objL1=ALL&objL2=ALL&format=json&jsonVD=Y&prdSe=Y&newEstPrdCnt=3&orgId=133&tblId=${t}`);
      return res.status(200).json({ tbl: t, years: Array.isArray(j) ? [...new Set(j.map(x => x.PRD_DE))].sort() : j });
    }
  }

  const age = (await kosisAge()) || AGE_FALLBACK;
  res.status(200).json({
    updatedAt: UPDATED_AT, basis: BASIS, source: SOURCE,
    age: piPoints(age), metrics: METRICS, sources: SOURCES,
  });
}
