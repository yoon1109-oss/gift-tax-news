// 통계 탭 — 증여 지표 (파이 앱 참고용).
// 출처: 국세통계 6.3.1 증여세 신고 현황Ⅰ(납세지) — 2025년 신고분 (TASIS 다운로드본) 단일.
// 2025년 자료만 사용한다. (연도가 다른 KOSIS 관계별·연령별 통계는 쓰지 않음)
const UPDATED_AT = '2026-08-04';
const BASIS = '2025년 신고분';
const SOURCE = '국세통계 6.3.1 증여세 신고 현황Ⅰ(납세지) · TASIS';

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
  가산액: 18164878,          // 10년 내 사전증여 합산
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
  세액공제_납부: 5206475,     // 사전증여분 기납부세액
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
const eok = mw => Math.round(Number(mw || 0) / 1e2).toLocaleString('ko-KR') + '억원';
// 1조원(= 100만 백만원) 이상은 조 단위, 그 미만은 억 단위로 읽기 쉽게
const jo = mw => Number(mw || 0) >= 1e6 ? (Number(mw) / 1e6).toFixed(2) + '조원' : eok(mw);
const pct = (a, b) => (a / b * 100).toFixed(1) + '%';
const perCase = (amt, cnt) => (amt * 1e6 / cnt / 1e8).toFixed(2) + '억원';

// 수치를 잘못 읽지 않도록 하는 해석 유의사항
const NOTICE = [
  '이 통계는 <b>과세미달을 제외</b>하고 작성됩니다 — 공제한도 이내라 낼 세금이 없는 증여(예: 미성년 자녀 10년 2천만원 이내)는 집계에 포함되지 않습니다. "시장 규모"로 읽을 때 주의가 필요합니다.',
  '<b>증여재산공제</b>는 실제 증여한 금액이 아니라, 세금을 매기지 않고 빼주는 공제 금액의 합계입니다.',
  '직계존비속 공제에는 <b>창업자금·가업승계 주식 증여 공제(5억원)</b>가 포함돼 있어, 순수 자녀 증여 공제만을 뜻하지 않습니다.',
];

const PI_POINTS = {
  title: '주요 지표',
  items: [
    { group: '자녀 증여 (직계존비속)', tag: '', lines: [
      `증여재산공제 ${jo(Y.공제_직계존비속)} — 전체 공제 ${jo(Y.공제_소계)}의 ${pct(Y.공제_직계존비속, Y.공제_소계)}로 최대 비중`,
      '부모·조부모 → 자녀 증여가 공제 규모의 중심축',
    ]},
    { group: '친족 증여 (그 밖의 친족)', tag: '', lines: [
      `증여재산공제 ${jo(Y.공제_기타친족)} — 전체 공제의 ${pct(Y.공제_기타친족, Y.공제_소계)}`,
      '형제자매·삼촌·조카 등, 공제 한도는 10년간 1천만원',
    ]},
    { group: '혼인·출산 공제', tag: '', lines: [
      `혼인 ${jo(Y.공제_혼인)} + 출산 ${jo(Y.공제_출산)} = ${jo(Y.공제_혼인 + Y.공제_출산)} (공제의 ${pct(Y.공제_혼인 + Y.공제_출산, Y.공제_소계)})`,
      `2024년 신설된 제도로, 배우자 공제(${jo(Y.공제_배우자)})의 절반 수준까지 이미 활용`,
    ]},
    { group: '10년 합산 (사전증여)', tag: '', lines: [
      `증여재산 가산액 ${jo(Y.가산액)} — 과세가액 ${jo(Y.과세가액)}의 ${pct(Y.가산액, Y.과세가액)}`,
      `기납부세액공제 ${jo(Y.세액공제_납부)} — 세액공제의 ${pct(Y.세액공제_납부, Y.세액공제_소계)}가 사전증여분`,
    ]},
  ],
};

const METRICS = [
  { group: '증여 시장 규모', items: [
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
  { group: '과세 흐름', items: [
    { label: '증여세 과세가액', value: jo(Y.과세가액), delta: `재산가액 + 가산액 ${jo(Y.가산액)}` },
    { label: '과세표준', value: jo(Y.과세표준), delta: `공제 ${jo(Y.공제_소계)} 차감 후` },
    { label: '산출세액', value: jo(Y.산출세액), delta: `과표 대비 ${pct(Y.산출세액, Y.과세표준)}` },
    { label: '자진납부세액', value: jo(Y.자진납부세액), delta: `세액공제 ${jo(Y.세액공제_소계)} 반영` },
  ]},
  { group: '지역 분포 (재산가액 상위)', items: [...Y.지역].sort((a, b) => b.amt - a.amt).slice(0, 4).map(r => ({
    label: r.name, value: jo(r.amt), delta: `${nf(r.cnt)}건 · 건당 ${perCase(r.amt, r.cnt)}`,
  }))},
];

const RAW = [
  { title: '2025년 증여세 신고 현황 — 전국 합계', note: '단위: 건 / 백만원 · 출처 국세통계 6.3.1',
    columns: ['항목', '값'],
    rows: [
      ['신고건수', `${nf(Y.건수)} 건`], ['증여재산가액', nf(Y.증여재산가액)],
      ['비과세재산가액', nf(Y.비과세재산가액)], ['과세가액불산입 소계', nf(Y.불산입_소계)],
      ['　└ 공익법인출연', nf(Y.불산입_공익법인)], ['　└ 공익신탁', nf(Y.불산입_공익신탁)],
      ['　└ 장애인증여', nf(Y.불산입_장애인)], ['채무', nf(Y.채무)],
      ['증여재산 가산액(10년 합산)', nf(Y.가산액)], ['증여세 과세가액', nf(Y.과세가액)],
      ['증여재산공제 소계', nf(Y.공제_소계)], ['　└ 배우자', nf(Y.공제_배우자)],
      ['　└ 직계존비속', nf(Y.공제_직계존비속)], ['　└ 혼인', nf(Y.공제_혼인)],
      ['　└ 출산', nf(Y.공제_출산)], ['　└ 그 밖의 친족', nf(Y.공제_기타친족)],
      ['재해손실 공제', nf(Y.재해손실공제)], ['감정평가 수수료 등', nf(Y.감정평가수수료)],
      ['과세표준', nf(Y.과세표준)], ['산출세액', nf(Y.산출세액)],
      ['징수유예 및 감면세액', nf(Y.징수유예감면)], ['세액공제 소계', nf(Y.세액공제_소계)],
      ['　└ 납부세액공제', nf(Y.세액공제_납부)], ['　└ 신고세액공제', nf(Y.세액공제_신고)],
      ['　└ 외국납부세액', nf(Y.세액공제_외국납부)], ['자진납부할세액', nf(Y.자진납부세액)],
    ]},
  { title: '2025년 지역별 신고 현황', note: '단위: 건 / 백만원 · 재산가액 내림차순',
    columns: ['지역', '신고건수', '증여재산가액', '건당 평균'],
    rows: [...Y.지역].sort((a, b) => b.amt - a.amt).map(r => [r.name, nf(r.cnt), nf(r.amt), perCase(r.amt, r.cnt)]) },
];

const SOURCES = [
  { title: '증여세 신고 현황Ⅰ(납세지) — 2025년 신고분', desc: '이 탭의 모든 수치 원본 (신고건수·재산가액·공제·과세표준·세액)', link: 'https://tasis.nts.go.kr/websquare/websquare.html?w2xPath=/ui/ep/e/a/UTWEPEAA02.xml&sttPblYr=2026&sttsMtaInfrId=20251203F01202622977' },
  { title: '국세통계포털(TASIS)', desc: '관계별·규모별·자산종류별 등 증여세 상세 통계', link: 'https://tasis.nts.go.kr/websquare/websquare.html?w2xPath=/cm/index.xml' },
];

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1800');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  res.status(200).json({
    updatedAt: UPDATED_AT, basis: BASIS, source: SOURCE, notice: NOTICE,
    age: PI_POINTS, metrics: METRICS, raw: RAW, sources: SOURCES,
  });
}
