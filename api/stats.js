// 증여·상속세 주요 지표.
// 수증자 연령별(미성년·20~50대) 증여는 KOSIS OpenAPI로 자동 수집(국세청 6.4.5, DT_133N_645),
// 요약 지표는 국세통계(e-나라지표) 수기. KOSIS 실패 시 아래 큐레이션 값으로 폴백.
const UPDATED_AT = '2026-07-30';
const BASIS = '2024년 귀속(2025년 국세통계)';
const SOURCE = 'KOSIS 국세통계 · e-나라지표';
const KEY = process.env.KOSIS_KEY;

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

// KOSIS 실패 시 폴백용 연령별(수기)
const AGE_FALLBACK = {
  title: '수증자 연령별 증여 (핵심 타겟)',
  items: [
    { group: '미성년 (만 19세 미만)', tag: '타겟', lines: ['2024년 14,217건 · 1조 2,382억원', '1인당 평균 8,709만원 · 최근 5년 +44%'] },
    { group: '20·30대 (MZ)', tag: '타겟', lines: ['2018~2022 누적 37.0만건 · 73.4조원', '20대 27.0조 / 30대 46.4조'] },
    { group: '40·50대', tag: '', lines: ['연령대별 상세는 아래 국세통계 바로가기 참고'] },
  ],
};

const SOURCES = [
  { title: '수증인의 연령별 증여세 현황 (KOSIS 6.4.5)', desc: '미성년·20~50대 등 연령대별 결정 인원 — 자동 연동', link: 'https://kosis.kr/statHtml/statHtml.do?orgId=133&tblId=DT_133N_645' },
  { title: '증여세 신고 현황 (공공데이터포털·최신)', desc: '2025년 신고분(기준 2025-12-31) 지역별 신고건수·재산가액 — 국세청', link: 'https://www.data.go.kr/data/3058487/fileData.do' },
  { title: '증여세 신고 현황 (국세통계포털 TASIS)', desc: '건수·재산가액·결정세액, 규모별·재산종류별·연령별 상세', link: 'https://tasis.nts.go.kr/websquare/websquare.html?w2xPath=/cm/index.xml' },
  { title: '부동산 증여 거래현황 (한국부동산원 R-ONE)', desc: '거래원인별 부동산거래 중 증여 — 월 단위', link: 'https://www.reb.or.kr/r-one/' },
  { title: '상속·증여세 지표 시계열 (e-나라지표)', desc: '연도별 과세건수·총결정세액', link: 'https://www.index.go.kr/unity/potal/main/EachDtlPageDetail.do?idx_cd=2848' },
];

const nf = n => Number(n || 0).toLocaleString('ko-KR');

async function kosisAge() {
  if (!KEY) return null;
  try {
    const url = `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${KEY}&itmId=ALL&objL1=ALL&objL2=ALL&format=json&jsonVD=Y&prdSe=Y&newEstPrdCnt=1&orgId=133&tblId=DT_133N_645`;
    const r = await fetch(url);
    const j = await r.json();
    if (!Array.isArray(j) || !j.length) return null;
    const nat = j.filter(x => x.C1_NM === '합계'); // 전국(납세지 합계)
    if (!nat.length) return null;
    const by = {}; nat.forEach(x => { by[x.C2_NM] = Number(x.DT); });
    const g = k => by[k] || 0;
    const year = nat[0].PRD_DE;
    const minor = g('10세 미만') + g('10세 이상'); // 만19세 미만
    return {
      title: `수증자 연령별 증여 결정 인원 · ${year}년 (핵심 타겟)`,
      items: [
        { group: '미성년 (만 19세 미만)', tag: '타겟',
          lines: [`${year}년 결정 ${nf(minor)}명 · 재산가액 약 1조 2,382억원`, '1인당 평균 8,709만원 · 최근 5년 +44%'] },
        { group: '20·30대 (MZ)', tag: '타겟',
          lines: [`20대 ${nf(g('20세 이상'))}명 · 30대 ${nf(g('30세 이상'))}명`] },
        { group: '40·50대', tag: '',
          lines: [`40대 ${nf(g('40세 이상'))}명 · 50대 ${nf(g('50세 이상'))}명 · 60세 이상 ${nf(g('60세 이상'))}명`] },
      ],
    };
  } catch { return null; }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const dbg = req.query.debug;
  if (dbg) {
    const kg = async u => { const r = await fetch(u); const t = await r.text(); try { return JSON.parse(t); } catch { return { raw: t.slice(0, 2500) }; } };
    try {
      if (dbg === 'search') return res.status(200).json(await kg(`https://kosis.kr/openapi/statisticsSearch.do?method=getList&apiKey=${KEY}&searchNm=${encodeURIComponent(req.query.q || '증여세 결정')}&startCount=1&resultCount=25&format=json&jsonVD=Y`));
      if (dbg === 'data') {
        const { orgId, tblId, itmId = 'ALL', newEstPrdCnt = '1' } = req.query;
        for (const c of [{ objL1: 'ALL' }, { objL1: 'ALL', objL2: 'ALL' }, { objL1: 'ALL', objL2: 'ALL', objL3: 'ALL' }]) {
          const op = Object.entries(c).map(([k, v]) => `${k}=${v}`).join('&');
          const j = await kg(`https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${KEY}&itmId=${itmId}&${op}&format=json&jsonVD=Y&prdSe=Y&newEstPrdCnt=${newEstPrdCnt}&orgId=${orgId}&tblId=${tblId}`);
          if (Array.isArray(j) && j.length) return res.status(200).json({ combo: c, rows: j.length, sample: j.slice(0, 45) });
          var last = Array.isArray(j) ? null : j;
        }
        return res.status(200).json({ err: last });
      }
    } catch (e) { return res.status(200).json({ error: e.message }); }
  }

  const age = (await kosisAge()) || AGE_FALLBACK;
  res.status(200).json({ updatedAt: UPDATED_AT, basis: BASIS, source: SOURCE, age, metrics: METRICS, sources: SOURCES });
}
