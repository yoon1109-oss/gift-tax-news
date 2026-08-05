// 통계 탭 — 파이(Pi) 앱 참고용 증여 지표.
// 기본: 국세통계 6.3.1 증여세 신고 현황Ⅰ(납세지) 2025년 신고분 (TASIS 다운로드본)
// 보조(KOSIS 자동): 6.3.5 관계별 신고 현황(신고 기준) · 6.4.5 연령별 결정 현황(결정 기준)
// 표마다 최신 연도가 달라 각 항목에 기준 연도를 명시한다.
const UPDATED_AT = '2026-08-04';
const BASIS = '2025년 신고분 (표별 기준연도 별도 표기)';
const SOURCE = '국세통계 · TASIS · KOSIS';
const KEY = process.env.KOSIS_KEY;

// ── 2025년 신고 현황 전국 합계 (금액 단위: 백만원) ──
const Y = {
  건수: 180260,
  증여재산가액: 30992994,
  비과세재산가액: 4154,
  불산입_소계: 34501,
  불산입_공익법인: 31715,
  불산입_공익신탁: 2,
  불산입_장애인: 2784,
  채무: 1034692,
  가산액: 18164878,
  과세가액: 48084526,
  공제_소계: 7964058,
  공제_배우자: 2089835,
  공제_직계존비속: 4569818,
  공제_혼인: 711945,
  공제_출산: 293172,
  공제_기타친족: 299288,
  재해손실공제: 953,
  감정평가수수료: 9617,
  과세표준: 40109898,
  산출세액: 11354928,
  징수유예감면: 45680,
  세액공제_소계: 5384712,
  세액공제_납부: 5206475,
  세액공제_신고: 172766,
  세액공제_외국납부: 5471,
  자진납부세액: 5924535,
  지역: [
    { name: '서울', cnt: 63057, amt: 16158854 }, { name: '인천', cnt: 7403, amt: 897271 },
    { name: '경기', cnt: 47279, amt: 6993844 }, { name: '강원', cnt: 3811, amt: 384737 },
    { name: '대전', cnt: 3962, amt: 479609 }, { name: '충북', cnt: 4206, amt: 407927 },
    { name: '충남', cnt: 6316, amt: 628152 }, { name: '세종', cnt: 1426, amt: 163543 },
    { name: '광주', cnt: 3230, amt: 320577 }, { name: '전북', cnt: 4140, amt: 357669 },
    { name: '전남', cnt: 4255, amt: 324626 }, { name: '대구', cnt: 5485, amt: 845053 },
    { name: '경북', cnt: 5843, amt: 505124 }, { name: '부산', cnt: 7677, amt: 1135231 },
    { name: '울산', cnt: 2289, amt: 280414 }, { name: '경남', cnt: 6996, amt: 714212 },
    { name: '제주', cnt: 2885, amt: 396151 },
  ],
};

const nf = n => Number(n || 0).toLocaleString('ko-KR');
const jo = mw => (Number(mw || 0) / 1e6).toFixed(2) + '조원';
const eok = mw => Math.round(Number(mw || 0) / 1e2).toLocaleString('ko-KR') + '억원';
const pct = (a, b) => (a / b * 100).toFixed(1) + '%';
const perCase = (amt, cnt) => (amt * 1e6 / cnt / 1e8).toFixed(2) + '억원';

// 수치를 잘못 읽지 않도록 하는 해석 유의사항
const NOTICE = [
  '이 통계는 <b>과세미달을 제외</b>하고 작성됩니다 — 공제한도 이내라 낼 세금이 없는 증여(예: 미성년 자녀 10년 2천만원 이내)는 집계에 포함되지 않습니다. 파이 앱의 핵심 구간이 여기에 해당하므로 "시장 규모"로 읽을 때 주의가 필요합니다.',
  '직계존비속 공제에는 <b>창업자금·가업승계 주식 증여 공제(5억원)</b>가 포함돼 있어, 순수 자녀 증여 공제만을 뜻하지 않습니다.',
  '표마다 최신 연도가 다릅니다 — 신고 현황(6.3.1)은 2025년, 관계별(6.3.5)은 2024년, 연령별(6.4.5)은 결정 기준 2024년입니다.',
];

async function kosis(tblId) {
  if (!KEY) return null;
  try {
    const url = `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${KEY}&itmId=ALL&objL1=ALL&objL2=ALL&format=json&jsonVD=Y&prdSe=Y&newEstPrdCnt=1&orgId=133&tblId=${tblId}`;
    const j = await (await fetch(url)).json();
    return Array.isArray(j) && j.length ? j : null;
  } catch { return null; }
}

// 6.3.5 수증인과 증여인의 관계별 신고 현황 (신고 기준)
async function relation() {
  const j = await kosis('DT_133N_A6341');
  if (!j) return null;
  const nat = j.filter(x => x.C1_NM === '합계');
  if (!nat.length) return null;
  const year = nat[0].PRD_DE;
  const get = (c2, itm) => Number((nat.find(x => x.C2_NM === c2 && (x.ITM_NM || '').includes(itm)) || {}).DT || 0);
  const tot = { cnt: get('합계', '건수'), amt: get('합계', '증여재산가액') };
  const rows = ['배우자', '직계존비속', '기타 친족', '기타'].map(k => ({
    name: k, cnt: get(k, '건수'), amt: get(k, '증여재산가액'),
  })).filter(r => r.cnt);
  return { year, tot, rows };
}

// 6.4.5 수증인의 연령별 증여세 결정 현황 (결정 기준)
async function ages() {
  const j = await kosis('DT_133N_645');
  if (!j) return null;
  const nat = j.filter(x => x.C1_NM === '합계');
  if (!nat.length) return null;
  const by = {}; nat.forEach(x => { by[x.C2_NM] = Number(x.DT); });
  const g = k => by[k] || 0;
  return {
    year: nat[0].PRD_DE, all: g('합계') || 1,
    minor: g('10세 미만') + g('10세 이상'),
    under10: g('10세 미만'), teen: g('10세 이상'),
    d20: g('20세 이상'), d30: g('30세 이상'), d40: g('40세 이상'), d50: g('50세 이상'), d60: g('60세 이상'),
  };
}

const REL_FALLBACK = { year: '2024', tot: { cnt: 153557, amt: 39620384 }, rows: [
  { name: '배우자', cnt: 3029, amt: 2838427 }, { name: '직계존비속', cnt: 80806, amt: 28072216 },
  { name: '기타 친족', cnt: 28030, amt: 3984537 }, { name: '기타', cnt: 41692, amt: 4725205 },
]};
const AGE_FALLBACK = { year: '2024', all: 178660, minor: 15593, under10: 6607, teen: 8986,
  d20: 21752, d30: 35605, d40: 38128, d50: 38228, d60: 28012 };

function build(rel, age) {
  const dz = rel.rows.find(r => r.name === '직계존비속') || { cnt: 0, amt: 0 };
  const etc = rel.rows.find(r => r.name === '기타 친족') || { cnt: 0, amt: 0 };

  const piItems = [
    { group: `자녀 증여 시장 — 관계별 (${rel.year}년 신고)`, tag: '', lines: [
      `직계존비속 ${nf(dz.cnt)}건 · ${jo(dz.amt)} — 건수의 ${pct(dz.cnt, rel.tot.cnt)}, 금액의 ${pct(dz.amt, rel.tot.amt)}`,
      `부모·조부모 → 자녀 증여가 건수·금액 모두 최대`,
    ]},
    { group: `친족 증여 (${rel.year}년 신고)`, tag: '', lines: [
      `기타 친족 ${nf(etc.cnt)}건 · ${jo(etc.amt)} — 건수의 ${pct(etc.cnt, rel.tot.cnt)} (형제자매·삼촌·조카 등)`,
      `공제 한도는 10년간 1천만원 — 2025년 공제액 ${jo(Y.공제_기타친족)}`,
    ]},
    { group: `미성년 수증자 (${age.year}년 결정)`, tag: '', lines: [
      `미성년(만 19세 미만) ${nf(age.minor)}명 — 전체 수증자의 ${pct(age.minor, age.all)} (10세 미만 ${nf(age.under10)} / 10대 ${nf(age.teen)})`,
      `20대 ${nf(age.d20)} · 30대 ${nf(age.d30)} · 40대 ${nf(age.d40)} · 50대 ${nf(age.d50)}명`,
    ]},
    { group: '혼인·출산 공제 (2024 신설)', tag: '', lines: [
      `혼인 ${jo(Y.공제_혼인)} + 출산 ${jo(Y.공제_출산)} = ${jo(Y.공제_혼인 + Y.공제_출산)} (공제의 ${pct(Y.공제_혼인 + Y.공제_출산, Y.공제_소계)})`,
      `신설 초기에 이미 배우자 공제(${jo(Y.공제_배우자)})의 절반 수준까지 활용`,
    ]},
  ];

  const metrics = [
    { group: '증여 시장 규모 (2025년 신고)', items: [
      { label: '신고 건수', value: `${nf(Y.건수)}건`, delta: '과세미달 제외' },
      { label: '증여재산가액', value: jo(Y.증여재산가액), delta: `건당 평균 ${perCase(Y.증여재산가액, Y.건수)}` },
    ]},
    { group: `증여재산공제 (소계 ${jo(Y.공제_소계)})`, items: [
      { label: '직계존비속', value: jo(Y.공제_직계존비속), delta: pct(Y.공제_직계존비속, Y.공제_소계) },
      { label: '배우자', value: jo(Y.공제_배우자), delta: pct(Y.공제_배우자, Y.공제_소계) },
      { label: '혼인', value: jo(Y.공제_혼인), delta: pct(Y.공제_혼인, Y.공제_소계) },
      { label: '출산', value: jo(Y.공제_출산), delta: pct(Y.공제_출산, Y.공제_소계) },
      { label: '그 밖의 친족', value: jo(Y.공제_기타친족), delta: pct(Y.공제_기타친족, Y.공제_소계) },
      { label: '장애인 증여', value: eok(Y.불산입_장애인), delta: '과세가액 불산입' },
    ]},
    { group: `관계별 신고 (${rel.year}년)`, items: rel.rows.map(r => ({
      label: r.name, value: jo(r.amt), delta: `${nf(r.cnt)}건 · ${pct(r.cnt, rel.tot.cnt)}`,
    }))},
    { group: '과세 흐름 (2025년 신고)', items: [
      { label: '증여세 과세가액', value: jo(Y.과세가액), delta: `재산가액 + 가산액 ${jo(Y.가산액)}` },
      { label: '과세표준', value: jo(Y.과세표준), delta: `공제 ${jo(Y.공제_소계)} 차감 후` },
      { label: '산출세액', value: jo(Y.산출세액), delta: `과표 대비 ${pct(Y.산출세액, Y.과세표준)}` },
      { label: '자진납부세액', value: jo(Y.자진납부세액), delta: `세액공제 ${jo(Y.세액공제_소계)} 반영` },
    ]},
  ];

  const won = v => nf(v); // 백만원 그대로
  const raw = [
    { title: '2025년 증여세 신고 현황 — 전국 합계', note: '단위: 건 / 백만원 · 출처 국세통계 6.3.1',
      columns: ['항목', '값'],
      rows: [
        ['신고건수', `${nf(Y.건수)} 건`], ['증여재산가액', won(Y.증여재산가액)],
        ['비과세재산가액', won(Y.비과세재산가액)], ['과세가액불산입 소계', won(Y.불산입_소계)],
        ['　└ 공익법인출연', won(Y.불산입_공익법인)], ['　└ 공익신탁', won(Y.불산입_공익신탁)],
        ['　└ 장애인증여', won(Y.불산입_장애인)], ['채무', won(Y.채무)],
        ['증여재산 가산액(10년 합산)', won(Y.가산액)], ['증여세 과세가액', won(Y.과세가액)],
        ['증여재산공제 소계', won(Y.공제_소계)], ['　└ 배우자', won(Y.공제_배우자)],
        ['　└ 직계존비속', won(Y.공제_직계존비속)], ['　└ 혼인', won(Y.공제_혼인)],
        ['　└ 출산', won(Y.공제_출산)], ['　└ 그 밖의 친족', won(Y.공제_기타친족)],
        ['재해손실 공제', won(Y.재해손실공제)], ['감정평가 수수료 등', won(Y.감정평가수수료)],
        ['과세표준', won(Y.과세표준)], ['산출세액', won(Y.산출세액)],
        ['징수유예 및 감면세액', won(Y.징수유예감면)], ['세액공제 소계', won(Y.세액공제_소계)],
        ['　└ 납부세액공제', won(Y.세액공제_납부)], ['　└ 신고세액공제', won(Y.세액공제_신고)],
        ['　└ 외국납부세액', won(Y.세액공제_외국납부)], ['자진납부할세액', won(Y.자진납부세액)],
      ]},
    { title: '2025년 지역별 신고 현황', note: '단위: 건 / 백만원 · 재산가액 내림차순',
      columns: ['지역', '신고건수', '증여재산가액', '건당 평균'],
      rows: [...Y.지역].sort((a, b) => b.amt - a.amt).map(r => [r.name, nf(r.cnt), won(r.amt), perCase(r.amt, r.cnt)]) },
    { title: `${rel.year}년 관계별 신고 현황`, note: '단위: 건 / 백만원 · 출처 국세통계 6.3.5 (KOSIS 자동)',
      columns: ['관계', '건수', '증여재산가액 등', '건수 비중'],
      rows: [['합계', nf(rel.tot.cnt), won(rel.tot.amt), '100.0%'],
        ...rel.rows.map(r => [r.name, nf(r.cnt), won(r.amt), pct(r.cnt, rel.tot.cnt)])] },
    { title: `${age.year}년 수증자 연령별 결정 현황`, note: '단위: 명 · 출처 국세통계 6.4.5 (KOSIS 자동) · 결정 기준',
      columns: ['연령', '인원', '비중'],
      rows: [['합계', nf(age.all), '100.0%'],
        ['10세 미만', nf(age.under10), pct(age.under10, age.all)],
        ['10대', nf(age.teen), pct(age.teen, age.all)],
        ['20대', nf(age.d20), pct(age.d20, age.all)],
        ['30대', nf(age.d30), pct(age.d30, age.all)],
        ['40대', nf(age.d40), pct(age.d40, age.all)],
        ['50대', nf(age.d50), pct(age.d50, age.all)],
        ['60세 이상', nf(age.d60), pct(age.d60, age.all)]] },
  ];

  return { age: { title: '파이 앱 참고 지표', items: piItems }, metrics, raw };
}

const SOURCES = [
  { title: '증여세 신고 현황Ⅰ(납세지) — 2025년 신고분', desc: '신고건수·재산가액·공제·과세표준·세액 (기본 수치 원본)', link: 'https://tasis.nts.go.kr/websquare/websquare.html?w2xPath=/ui/ep/e/a/UTWEPEAA02.xml&sttPblYr=2026&sttsMtaInfrId=20251203F01202622977' },
  { title: '수증인과 증여인의 관계별 신고 현황 (6.3.5)', desc: '직계존비속·기타친족 등 관계별 건수·금액 — 자동 연동', link: 'https://kosis.kr/statHtml/statHtml.do?orgId=133&tblId=DT_133N_A6341' },
  { title: '수증인의 연령별 결정 현황 (6.4.5)', desc: '미성년·20~60대 연령별 인원 — 자동 연동 (결정 기준)', link: 'https://kosis.kr/statHtml/statHtml.do?orgId=133&tblId=DT_133N_645' },
  { title: '국세통계포털(TASIS)', desc: '규모별·자산종류별·성별 등 증여세 상세 통계', link: 'https://tasis.nts.go.kr/websquare/websquare.html?w2xPath=/cm/index.xml' },
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1800');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const [rel, age] = await Promise.all([relation(), ages()]);
  const built = build(rel || REL_FALLBACK, age || AGE_FALLBACK);
  res.status(200).json({
    updatedAt: UPDATED_AT, basis: BASIS, source: SOURCE, notice: NOTICE,
    ...built, sources: SOURCES,
  });
}
