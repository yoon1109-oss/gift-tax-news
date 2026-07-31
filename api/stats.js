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
  { title: '증여세 신고 현황 (국세통계포털 TASIS)', desc: '건수·재산가액·결정세액, 규모별·재산종류별·연령별 상세', link: 'https://tasis.nts.go.kr/websquare/websquare.html?w2xPath=/cm/index.xml' },
  { title: '부동산 증여 거래현황 (한국부동산원 R-ONE)', desc: '거래원인별 부동산거래 중 증여 — 월 단위', link: 'https://www.reb.or.kr/r-one/' },
  { title: '상속·증여세 지표 시계열 (e-나라지표)', desc: '연도별 과세건수·총결정세액', link: 'https://www.index.go.kr/unity/potal/main/EachDtlPageDetail.do?idx_cd=2848' },
];

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  res.status(200).json({ updatedAt: UPDATED_AT, basis: BASIS, source: SOURCE, age: AGE, metrics: METRICS, sources: SOURCES });
}
