// 통계 탭 — 파이(Pi) 앱 참고용 증여 지표.
// 출처: 국세통계 6.3.1 증여세 신고 현황Ⅰ(납세지) — 2025년 신고분 (TASIS 다운로드본)
// 신고현황 데이터만 사용한다. (연령별은 '결정' 기준으로만 공표돼 연도가 어긋나므로 제외)
// 파이 앱 = 미성년 자녀 증여·투자·세무 플랫폼 → 직계존비속 공제, 혼인·출산 공제,
// 10년 합산(사전증여 가산 + 기납부세액공제)이 핵심 참고 지표.
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
    { name: '서울', cnt: 63057, amt: 16158854 },
    { name: '경기', cnt: 47279, amt: 6993844 },
    { name: '부산', cnt: 7677, amt: 1135231 },
    { name: '인천', cnt: 7403, amt: 897271 },
  ],
};

const nf = n => Number(n || 0).toLocaleString('ko-KR');
const jo = mw => (Number(mw || 0) / 1e6).toFixed(2) + '조원';
const eok = mw => Math.round(Number(mw || 0) / 1e2).toLocaleString('ko-KR') + '억원';
const pct = (a, b) => (a / b * 100).toFixed(1) + '%';
const perCase = (amt, cnt) => (amt * 1e6 / cnt / 1e8).toFixed(2) + '억원';

// 파이 앱 참고 포인트 (모두 신고현황 기준)
const PI_POINTS = {
  title: '파이 앱 참고 지표',
  items: [
    { group: '자녀 증여 시장 (파이 핵심)', tag: '타겟', lines: [
      `직계존비속 공제 ${jo(Y.공제_직계존비속)} — 전체 증여재산공제의 ${pct(Y.공제_직계존비속, Y.공제_소계)}로 최대 비중`,
      '부모·조부모 → 자녀 증여가 증여 시장의 중심축',
    ]},
    { group: '혼인·출산 공제 (2024 신설)', tag: '타겟', lines: [
      `혼인 ${jo(Y.공제_혼인)} + 출산 ${jo(Y.공제_출산)} = ${jo(Y.공제_혼인 + Y.공제_출산)} (공제의 ${pct(Y.공제_혼인 + Y.공제_출산, Y.공제_소계)})`,
      `신설 초기에 이미 배우자 공제(${jo(Y.공제_배우자)})의 절반 수준까지 활용`,
    ]},
    { group: '10년 합산 효과 (분할 증여 설계 근거)', tag: '타겟', lines: [
      `사전증여 가산액 ${jo(Y.가산액)} — 과세가액 ${jo(Y.과세가액)}의 ${pct(Y.가산액, Y.과세가액)}`,
      `기납부세액공제 ${jo(Y.세액공제_납부)} — 세액공제의 ${pct(Y.세액공제_납부, Y.세액공제_소계)}가 사전증여분`,
    ]},
  ],
};

const METRICS = [
  { group: '증여 시장 규모', items: [
    { label: '신고 건수', value: `${nf(Y.건수)}건`, delta: '' },
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
  { group: '지역 분포 (재산가액 상위)', items: Y.지역.map(r => ({
    label: r.name, value: jo(r.amt), delta: `${nf(r.cnt)}건 · 건당 ${perCase(r.amt, r.cnt)}`,
  }))},
];

const SOURCES = [
  { title: '증여세 신고 현황Ⅰ(납세지) — 2025년 신고분', desc: '이 탭의 모든 수치 원본 (신고건수·재산가액·공제·과세표준·세액)', link: 'https://tasis.nts.go.kr/websquare/websquare.html?w2xPath=/ui/ep/e/a/UTWEPEAA02.xml&sttPblYr=2026&sttsMtaInfrId=20251203F01202622977' },
  { title: '수증인과 증여인의 관계별 신고 현황 (6.3.5)', desc: '직계비속·직계존속 등 관계별 신고 인원·금액', link: 'https://kosis.kr/statHtml/statHtml.do?orgId=133&tblId=DT_133N_A6341' },
  { title: '증여재산가액 등 규모별 신고인원 (6.3.3)', desc: '증여 금액 구간별 분포', link: 'https://kosis.kr/statHtml/statHtml.do?orgId=133&tblId=TX_13301_A060' },
  { title: '국세통계포털(TASIS)', desc: '자산종류별·성별 등 증여세 상세 통계', link: 'https://tasis.nts.go.kr/websquare/websquare.html?w2xPath=/cm/index.xml' },
];

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1800');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  res.status(200).json({
    updatedAt: UPDATED_AT, basis: BASIS, source: SOURCE,
    age: PI_POINTS, metrics: METRICS, sources: SOURCES,
  });
}
