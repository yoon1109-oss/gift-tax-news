// 통계 탭 — 증여 지표 (파이 앱 참고용).
// 기준 표: 국세통계 6.3.3 증여재산가액 등 규모별 신고인원 현황 — 2025년 신고분 (TASIS).
//   → 규모(금액 구간) × 납세지 / 수증인 연령 교차표. 단위: 명.
// 보조 표: 국세통계 6.3.1 증여세 신고 현황Ⅰ(납세지) — 공제·과세흐름 금액 지표. 단위: 백만원.
// 두 표 모두 2025년 신고분이며 총계(180,260)가 일치한다. 다른 연도 통계는 섞지 않는다.
// ★ 주석 [A] "해당연도 증여세 신고자 중 과세미달을 제외하고 작성" — 6-3-1~6-3-5·6-3-8 전부 같은 문구
//   (2026-09-28 TASIS 원문 재확인). 과세미달 = 공제 후 낼 세금이 없는 신고. 금액이 작아도
//   공제를 넘겨 세금이 나왔으면 포함된다(1천만 이하 22,168명이 그 경우).
//   과세미달을 '포함'한 표는 6-4-3 과세유형별 증여세 결정 현황뿐이다(결정 기준, 연령 구분 없음).
const UPDATED_AT = '2026-08-24';
const BASIS = '2025년 신고분';
const SOURCE = '국세청 국세통계';   // 상세 표 이름은 각 표 설명줄과 하단 바로가기에 남긴다

// ── 6.3.3 규모 구간 ──
// 공식 작성기준: "증여재산가액 등 규모"는 증여재산가액 + 증여재산가산액(10년 내 동일인 사전증여 합계,
// 그 합계가 1천만원 이상일 때만 가산)이다. 즉 이번 증여액이 아니라 10년 누적 기준에 가깝다.
// 각 구간은 "직전 구간 초과 ~ 표기액 이하".
const BANDS = ['1천만원 이하', '5천만원 이하', '1억원 이하', '3억원 이하', '5억원 이하',
               '10억원 이하', '20억원 이하', '30억원 이하', '50억원 이하', '50억원 초과'];

// 전국 합계 (단위: 명)
const TOTAL = 180260;
const ALL = [22168, 33884, 42894, 49700, 13073, 12697, 3873, 845, 508, 618];

// 수증인 연령별 × 규모별 (단위: 명).
// TASIS 6.3.3 주석 원문:
//   [D] 기타 = 수증자가 비영리법인 등인 경우  ← '연령 미상'이 아니다
//   [E] 청년 = 청년기본법 제3조의 19세 이상 34세 이하. 합계구간에 추가 합산되지 않음
// (연령 8개 구간 합 = 180,260 총계와 일치. 청년은 여기에 더해지지 않는다)
// 원표기는 '10세 이상 / 20세 이상 / …'이지만 이는 각각 10대·20대를 뜻하는 구간이다
// (다음 구간이 20세 이상이므로 '10세 이상'은 10~19세). 오해를 막으려고 라벨을 풀어 쓴다.
const AGES = [
  { name: '10세 미만', total: 8278,  band: [1087, 3803, 1400, 1419, 291, 192, 68, 9, 2, 7] },
  { name: '10대 (10~19세)', total: 9958,  band: [738, 3708, 2268, 2205, 507, 345, 111, 32, 24, 20] },
  { name: '20대', total: 21892, band: [1676, 2471, 6315, 7433, 1925, 1401, 461, 93, 56, 61] },
  { name: '30대', total: 38518, band: [3265, 4144, 8101, 13636, 4136, 3578, 1067, 247, 164, 180] },
  { name: '40대', total: 35748, band: [3863, 5183, 8694, 10472, 3017, 2945, 1023, 229, 142, 180] },
  { name: '50대', total: 35628, band: [4797, 6774, 9341, 9277, 2175, 2272, 635, 149, 82, 126] },
  { name: '60세 이상', total: 28130, band: [5628, 7460, 6533, 5027, 945, 1912, 489, 71, 30, 35] },
  { name: '기타 (비영리법인 등)', total: 2108, band: [1114, 341, 242, 231, 77, 52, 19, 15, 8, 9] },
];
const YOUTH = { name: '청년 (19~34세)', total: 43554, band: [3253, 4788, 11107, 15378, 4249, 3267, 979, 230, 151, 152] };

// 미성년(20세 미만) = 10세 미만 + 10세 이상 두 구간의 합
const MINOR_BAND = AGES[0].band.map((v, i) => v + AGES[1].band[i]);
const MINOR_TOTAL = AGES[0].total + AGES[1].total;   // 18,236명

// 20~39세 = 20세 이상(20대) + 30세 이상(30대). '20~40세'로 적으면 40세가 든 것처럼 읽힌다
const A2040_BAND = AGES[2].band.map((v, i) => v + AGES[3].band[i]);
const A2040_TOTAL = AGES[2].total + AGES[3].total;   // 60,410명

// 최다 구간의 인덱스 — 눈으로 고르지 않고 계산한다
const topIdx = arr => arr.indexOf(Math.max(...arr));

// 구간 라벨은 위쪽 끝만 적혀 있어('5천만 이하') 줄줄이 늘어놓을 때는 앞 구간이 보이니 괜찮지만,
// 타일·요약처럼 구간 하나만 따로 지목하면 '0~5천만'으로 오해한다. 그럴 때는 시작점을 붙인다.
const BAND_RANGE = BANDS.map((b, i) =>
  (i === 0 || i === BANDS.length - 1) ? b : `${BANDS[i - 1].replace(' 이하', '')} 초과~${b}`);

const sum = a => a.reduce((x, y) => x + y, 0);
const cum = (arr, upto) => sum(arr.slice(0, upto + 1));

// ── 6.3.1 금액 지표 (보조) — 단위: 백만원 ──
const Y = {
  건수: 180260,
  증여재산가액: 30992994,
  가산액: 18164878,          // 10년 내 사전증여 합산
  과세가액: 48084526,
  공제_소계: 7964058,
  공제_배우자: 2089835,
  공제_직계존비속: 4569818,
  공제_혼인: 711945,
  공제_출산: 293172,
  공제_기타친족: 299288,
  불산입_장애인: 2784,
  과세표준: 40109898,
  산출세액: 11354928,
  세액공제_소계: 5384712,
  세액공제_납부: 5206475,     // 사전증여분 기납부세액
  자진납부세액: 5924535,
};

// ── 6.3.2 증여세 신고 현황Ⅱ(증여재산가액 등) — 같은 구간 체계의 금액·세액 (단위: 백만원) ──
// 검산: 건수합 180,260 / 과세표준합 40,109,897 / 산출세액합 11,354,927 (반올림 오차 ±1)
const TAXB = [
  // [신고건수, 증여재산가액, 증여재산가산액, 증여재산공제, 과세표준, 산출세액]
  [22168, 82693, 103, 3238, 79279, 7964],
  [33884, 829081, 115973, 251825, 691193, 70346],
  [42894, 2866184, 437405, 1454779, 1832964, 187826],
  [49700, 6742897, 1909184, 2440414, 6004776, 779788],
  [13073, 3924943, 1321274, 659457, 4353204, 756528],
  [12697, 6090465, 2662902, 2277494, 6169632, 1256388],
  [3873, 3111606, 1995686, 575068, 4321221, 1159829],
  [845, 1164178, 902437, 95261, 1934034, 634619],
  [508, 991195, 911830, 82836, 1804285, 631196],
  [618, 5189751, 7908084, 123685, 12919309, 5870443],
];
// 가산액 합계 18,164,878 = Y.가산액 (정확히 일치)
const addRate = i => (TAXB[i][2] / TAXB[i][1] * 100).toFixed(1) + '%';

const nf = n => Number(n || 0).toLocaleString('ko-KR');
const eok = mw => Math.round(Number(mw || 0) / 1e2).toLocaleString('ko-KR') + '억원';
// 1조원(= 100만 백만원) 이상은 조 단위, 그 미만은 억 단위로 읽기 쉽게
const jo = mw => Number(mw || 0) >= 1e6 ? (Number(mw) / 1e6).toFixed(2) + '조원' : eok(mw);
const pct = (a, b) => (a / b * 100).toFixed(1) + '%';
// %p 차이는 화면에 찍힌 반올림 값끼리 뺀다 — 원값으로 빼면 59.1% − 44.6%가 14.4%p로 찍혀 눈으로 한 계산과 어긋난다
const ppDiff = (a1, b1, a2, b2) => (Math.round(a1 / b1 * 1000) - Math.round(a2 / b2 * 1000)) / 10;
const perCase = (amt, cnt) => (amt * 1e6 / cnt / 1e8).toFixed(2) + '억원';
// 건당 금액 — 1억 미만은 만원, 이상은 억원
const perOne = (mw, cnt) => {
  const v = Number(mw) * 1e6 / cnt;
  return v >= 1e8 ? (v / 1e8).toFixed(2) + '억원' : Math.round(v / 1e4).toLocaleString('ko-KR') + '만원';
};

// 수치를 잘못 읽지 않도록 하는 해석 유의사항
const NOTICE = [
  `<b>금액 구간은 공제 적용 전 증여재산 기준입니다.</b> 10년 내 동일인에게 받은 증여분(가산액)이 합산되어 있으며, 1천만원 이하 구간은 가산액 비중이 ${addRate(0)}로 사실상 당해 증여액과 같습니다. 그 이상 구간은 가산액이 당해 증여액의 ${addRate(1)}(5천만원 이하)~${addRate(9)}(50억원 초과) 수준으로 포함되어 있습니다.`,
  `<b>각 구간은 직전 구간을 초과하는 범위입니다.</b> 예컨대 '5천만원 이하'는 1천만원 초과~5천만원 이하를 뜻합니다.`,
  `<b>단위는 '명'이며 신고 건별로 집계됩니다.</b> 한 사람이 여러 차례 신고한 경우 각각 집계됩니다.`,
];

// ── 연령대별 신고인원 추이 (2021~2025 신고분) ──
// 출처: 6.3.3 시계열 조회 (TASIS wqAction ATWEPEAA001R03, 발간연도 2022~2026 = 신고연도 2021~2025)
// 각 연도 연령 합계가 총계와 일치하는 것을 확인함.
const TREND_YEARS = [2021, 2022, 2023, 2024, 2025];
const TREND = [
  { name: '10세 미만', hl: true, v: [9990, 7528, 5415, 6231, 8278] },
  { name: '10대',      hl: true, v: [14383, 11022, 8222, 7947, 9958] },
  { name: '20대',      v: [46074, 31966, 21445, 19110, 21892] },
  { name: '30대',      v: [55701, 41075, 31199, 32036, 38518] },
];
const TREND_ALL = [264274, 215640, 164230, 153557, 180260];   // 전체 연령 총계
// 40세 미만 소계
const TREND_U40 = TREND_YEARS.map((_, i) => TREND.reduce((a, s) => a + s.v[i], 0));

const yoy = (arr, i) => i === 0 ? null : (arr[i] / arr[i - 1] - 1) * 100;
const signed = n => (n == null ? '—' : (n >= 0 ? '+' : '') + n.toFixed(1) + '%');
// 문장용 — '16.6% 증가' / '3.2% 감소'. 부호를 문장에 고정해 두면 다음 해 갱신 때 방향이 틀린다
const chg = n => `${Math.abs(n).toFixed(1)}% ${n >= 0 ? '증가' : '감소'}`;

// 저점 연도와 그 뒤 회복폭. 계열마다 저점 연도가 달라(10세 미만만 2023년) 이걸 안 적으면
// '2021→2025' 한 칸만 보고 전부 같은 모양으로 회복한 줄 안다.
const troughOf = v => { const lo = Math.min(...v); const i = v.indexOf(lo); return { year: TREND_YEARS[i], lo, i }; };
const reboundRow = v => {
  const { year, lo } = troughOf(v);
  return { trough: year, fromTrough: signed((v[4] / lo - 1) * 100), yoy: signed(yoy(v, 4)), idx2025: (v[4] / v[0] * 100).toFixed(1) };
};

// 연령 구간 상세 — 수치와 그 수치가 뜻하는 정의만 적는다.
// 해석·추측('~하는 성향', '~때문에')은 넣지 않는다.
// 문장으로 늘어놓으면 눈에 안 들어와, 핵심 3개는 타일로 뽑고 나머지는 줄을 맞춘다.
// 구간별 인원 전체는 아래 '규모별 분포' 막대가 이미 보여주므로 여기서 반복하지 않는다.
const MINOR_YEARS = TREND_YEARS.map((_, i) => TREND[0].v[i] + TREND[1].v[i]);
const A2040_YEARS = TREND_YEARS.map((_, i) => TREND[2].v[i] + TREND[3].v[i]);

// 타일 3개. 예전에 '중앙 구간'(중앙값이 걸리는 칸)을 넣었다가 "무슨 말이냐"는 질문을
// 두 번 받고 뺐다 (2026-08-29). 설명이 필요한 지표는 한눈에 보는 자리에 두지 않는다.
// 지금은 5천만·1억이라는 고정 문턱의 누계만 쓴다 — 설명 없이 읽히고 구간 간 비교도 그대로 된다.
const abFacts = (band, total) => {
  const t = topIdx(band);
  return [
    { label: '최다 구간', value: BAND_RANGE[t], sub: `${nf(band[t])}명 · ${pct(band[t], total)} (전국 ${pct(ALL[t], TOTAL)})` },
    { label: '5천만원 이하', value: pct(cum(band, 1), total), sub: `${nf(cum(band, 1))}명 (전국 ${pct(cum(ALL, 1), TOTAL)})` },
    { label: '1억원 이하', value: pct(cum(band, 2), total), sub: `${nf(cum(band, 2))}명 (전국 ${pct(cum(ALL, 2), TOTAL)})` },
  ];
};

// 전체 신고인원 중 이 연령대가 차지하는 비중의 연도별 변화
const shareRow = years =>
  TREND_YEARS.map((y, i) => `${String(y).slice(2)}년 <b>${pct(years[i], TREND_ALL[i])}</b>`).join('  ·  ');

const cumRow = (band, total) =>
  [1, 2, 3].map(i => `${BANDS[i]} <b>${pct(cum(band, i), total)}</b>`).join('  ·  ')
  + `<br><span style="opacity:.72">전국 ${[1, 2, 3].map(i => pct(cum(ALL, i), TOTAL)).join(' · ')}</span>`;

const yearRow = years =>
  TREND_YEARS.map((y, i) => `${String(y).slice(2)}년 <b>${nf(years[i])}</b>`).join('  ·  ')
  + `<br><span style="opacity:.72">2021년 대비 ${signed((years[4] / years[0] - 1) * 100)} · 전년 대비 ${signed(yoy(years, 4))}</span>`;

const PI_POINTS = {
  title: '연령대별 상세',
  items: [
    {
      group: '10세 미만',
      tag: `${nf(AGES[0].total)}명 (전체의 ${pct(AGES[0].total, TOTAL)})`,
      facts: abFacts(AGES[0].band, AGES[0].total),
      rows: [
        { label: '구간별 누계', value: cumRow(AGES[0].band, AGES[0].total) },
        { label: '연도별 인원', value: yearRow(TREND[0].v) },
        { label: '전체 대비 비중', value: shareRow(TREND[0].v) },
      ],
      note: `<b>1천만원 이하</b> ${nf(AGES[0].band[0])}명(${pct(AGES[0].band[0], AGES[0].total)}), <b>5천만원 이하</b> ${nf(AGES[0].band[1])}명(${pct(AGES[0].band[1], AGES[0].total)})입니다. 미성년자 증여재산공제 한도(10년간 2천만원)는 통계 구간 경계(1천만원·5천만원)와 일치하지 않아, 구간 자료만으로 공제 한도 소진 여부를 판단하기는 어렵습니다.`,
    },
    {
      group: '10대 (10~19세)',
      tag: `${nf(AGES[1].total)}명 (전체의 ${pct(AGES[1].total, TOTAL)})`,
      facts: abFacts(AGES[1].band, AGES[1].total),
      rows: [
        { label: '구간별 누계', value: cumRow(AGES[1].band, AGES[1].total) },
        { label: '연도별 인원', value: yearRow(TREND[1].v) },
        { label: '전체 대비 비중', value: shareRow(TREND[1].v) },
      ],
      note: `<b>10세 미만과 비교</b>하면 1억원 이하 누계는 ${pct(cum(AGES[0].band, 2), AGES[0].total)} 대 ${pct(cum(AGES[1].band, 2), AGES[1].total)}, 3억원 이하 누계는 ${pct(cum(AGES[0].band, 3), AGES[0].total)} 대 ${pct(cum(AGES[1].band, 3), AGES[1].total)}로 10대의 증여 규모가 상대적으로 큽니다.`,
    },
    {
      group: '미성년 합계 (20세 미만)',
      tag: `${nf(MINOR_TOTAL)}명 (전체의 ${pct(MINOR_TOTAL, TOTAL)})`,
      facts: abFacts(MINOR_BAND, MINOR_TOTAL),
      rows: [
        { label: '구성', value: `10세 미만 <b>${nf(AGES[0].total)}</b> (${pct(AGES[0].total, MINOR_TOTAL)})  ·  10대 <b>${nf(AGES[1].total)}</b> (${pct(AGES[1].total, MINOR_TOTAL)})` },
        { label: '구간별 누계', value: cumRow(MINOR_BAND, MINOR_TOTAL) },
        { label: '연도별 인원', value: yearRow(MINOR_YEARS) },
        { label: '전체 대비 비중', value: shareRow(MINOR_YEARS) },
      ],
      note: `<b>집계 기준</b> — 통계표 연령 구간이 '10세 미만 / 10세 이상 / 20세 이상'으로 구분되어 있어 미성년을 <b>20세 미만</b>으로 집계했습니다. 민법상 미성년(19세 미만) 및 증여재산공제 미성년 기준과는 1세 차이가 있으며, 19세가 포함되어 있습니다.`,
    },
    {
      group: '20~39세 (20대·30대)',
      tag: `${nf(A2040_TOTAL)}명 (전체의 ${pct(A2040_TOTAL, TOTAL)})`,
      facts: abFacts(A2040_BAND, A2040_TOTAL),
      rows: [
        { label: '구성', value: `20대 <b>${nf(AGES[2].total)}</b> (${pct(AGES[2].total, A2040_TOTAL)})  ·  30대 <b>${nf(AGES[3].total)}</b> (${pct(AGES[3].total, A2040_TOTAL)})` },
        { label: '구간별 누계', value: cumRow(A2040_BAND, A2040_TOTAL) },
        { label: '연도별 인원', value: yearRow(A2040_YEARS) },
        { label: '전체 대비 비중', value: shareRow(A2040_YEARS) },
      ],
      note: `<b>참고</b> — 청년(19~34세, ${nf(YOUTH.total)}명)은 연령 구간과 중복되는 별도 분류로, 합계에는 포함되지 않습니다.`,
    },
  ],
};

// 분포 막대 — 연령 구간이 주(主), 전국은 비교 기준으로 마지막에 둔다
const distRows = (band, total) =>
  BANDS.map((b, i) => ({ label: b, value: nf(band[i]), pct: (band[i] / total * 100).toFixed(1) }));

const DIST = [
  { title: '10세 미만 — 금액 구간별 분포',
    note: `${nf(AGES[0].total)}명 (전체의 ${pct(AGES[0].total, TOTAL)}) · 단위: 명`,
    hl: true,
    rows: distRows(AGES[0].band, AGES[0].total) },
  { title: '10대 (10~19세) — 금액 구간별 분포',
    note: `${nf(AGES[1].total)}명 (전체의 ${pct(AGES[1].total, TOTAL)}) · 단위: 명`,
    hl: true,
    rows: distRows(AGES[1].band, AGES[1].total) },
  { title: '미성년 합계 (20세 미만) — 금액 구간별 분포',
    note: `${nf(MINOR_TOTAL)}명 (전체의 ${pct(MINOR_TOTAL, TOTAL)}) · 10세 미만과 10대의 합 · 단위: 명`,
    hl: true,
    rows: distRows(MINOR_BAND, MINOR_TOTAL) },
  { title: '20~39세 — 금액 구간별 분포',
    note: `${nf(A2040_TOTAL)}명 (전체의 ${pct(A2040_TOTAL, TOTAL)}) · 단위: 명`,
    rows: distRows(A2040_BAND, A2040_TOTAL) },
  { title: `전국 (${nf(TOTAL)}명) — 비교 기준`,
    note: `2025년 신고분 · 단위: 명 · 출처: 국세통계 6-3-3 증여재산가액 등 규모별 신고인원`,
    rows: distRows(ALL, TOTAL) },
];

// ── 세금 0원 신고까지 합친 전체 (국세통계 6-4-3 과세유형별 증여세 결정 현황 '합계' 열) ──
// 6-3 계열(위 연령별 수치)은 전부 '과세미달 제외'다. 과세미달까지 합친 전체는 6-4-3 하나뿐이라
// 이 표의 합계 열(과세 + 과세미달)만 쓴다. 과세/과세미달 구분은 보여주지 않는다 (사용자 요청 2026-09-28).
// 주의: ① '결정' 기준(국세청이 세액을 확정한 해)이라 신고 기준 6-3과 연도·건수가 다르다 — 한 표에 섞지 말 것
//       ② 연령 구분이 없다 (규모 구간·납세지만)  ③ 단위: 건수 = 건, 금액 = 백만원
//       ④ 연도 합계 금액에는 전년도 이전 결정분의 경정(구간 미배정)이 포함돼 구간 합과 다르다
// 추출: TASIS sttsMtaInfrId 20251203F01202622989, 발간연도 2022~2026 시계열(ATWEPEAA001R03) — 2026-09-28
const DEC_YEARS = [2021, 2022, 2023, 2024, 2025];
const DEC_CNT = [800109, 711875, 530004, 542843, 633061];
const DEC_AMT = [117486960, 92370763, 77967412, 71735488, 79735685];   // 경정 포함
const DEC_FIX = [178575, -97995, 659076, 186426, 442245];               // 경정분(구간 미배정)
const DEC_BAND_CNT = [   // 구간 × 연도 (건)
  [216613, 210588, 138657, 150039, 170459],
  [280956, 250236, 186156, 189146, 216212],
  [92889, 81745, 64774, 68025, 83159],
  [119707, 99991, 82170, 86075, 104832],
  [41171, 32457, 27650, 24168, 28504],
  [38691, 28115, 23441, 19076, 23357],
  [7165, 6054, 4787, 4134, 4491],
  [1310, 1248, 1059, 970, 943],
  [649, 701, 632, 561, 505],
  [958, 740, 678, 649, 599],
];
const DEC_BAND_AMT = [   // 구간 × 연도 (백만원)
  [809998, 714543, 496697, 519586, 605554],
  [8876138, 7803962, 5805932, 5870981, 6698360],
  [6934369, 6137219, 4852739, 5208908, 6490249],
  [21072200, 17494408, 14429857, 14946995, 18049510],
  [16335512, 12910174, 10966311, 9585819, 11306448],
  [25355612, 18390946, 15340012, 12529798, 14951498],
  [9477879, 8072533, 6372809, 5507301, 5964484],
  [3186874, 3049312, 2585488, 2370240, 2293014],
  [2454926, 2650582, 2334543, 2120355, 1898677],
  [22804878, 15245078, 14123948, 12889080, 11035646],
];
const DI = DEC_YEARS.length - 1;   // 2025
const decBand = i => DEC_BAND_CNT.map(r => r[i]);
const DEC_LO = troughOf(DEC_CNT);  // 저점 연도

const ALLGIFT = {
  title: '전체 증여 현황 (과세미달 포함)',
  note: `공제 한도 내 증여로 납부세액이 없는 신고(과세미달)까지 포함한 전체 현황입니다. `
    + `국세청 결정 기준으로 집계되어 아래 연령별 통계(신고 기준, 과세미달 제외)와 연도·건수에 차이가 있으며, 연령별 구분은 제공되지 않습니다. 출처: 국세통계 6-4-3`,
  tiles: [
    { label: '2025년 증여 건수', value: `${nf(DEC_CNT[DI])}건`, delta: `전년 대비 ${signed(yoy(DEC_CNT, DI))} · ${DEC_LO.year}년 저점 대비 ${signed((DEC_CNT[DI] / DEC_LO.lo - 1) * 100)}` },
    { label: '5천만원 이하 비중', value: pct(cum(decBand(DI), 1), DEC_CNT[DI]), delta: `${nf(cum(decBand(DI), 1))}건 (1천만원 이하 ${pct(decBand(DI)[0], DEC_CNT[DI])})` },
    { label: '1억원 이하 비중', value: pct(cum(decBand(DI), 2), DEC_CNT[DI]), delta: `3억원 이하 ${pct(cum(decBand(DI), 3), DEC_CNT[DI])}` },
    { label: '증여재산 합계', value: jo(DEC_AMT[DI]), delta: `건당 평균 ${perOne(DEC_AMT[DI] - DEC_FIX[DI], DEC_CNT[DI])} (10년 내 합산 기준)` },
  ],
  dist: {
    title: `2025년 금액 구간별 증여 건수 (총 ${nf(DEC_CNT[DI])}건)`,
    note: '과세미달 포함 · 단위: 건 · 출처: 국세통계 6-4-3',
    rows: BANDS.map((b, i) => ({ label: b, value: nf(decBand(DI)[i]), pct: (decBand(DI)[i] / DEC_CNT[DI] * 100).toFixed(1) })),
  },
  tables: [
    { title: '연도별 증여 건수 및 금액 (2021~2025년, 과세미달 포함)',
      note: '단위: 건, 백만원 · ( )는 전년 대비 증감률 · 금액은 당해 증여액에 10년 내 동일인 증여액을 합산한 값이며 과년도 경정분 포함 · 출처: 국세통계 6-4-3',
      columns: ['연도', '건수', '증여재산 (10년 합산)', '건당 평균'],
      rows: DEC_YEARS.map((y, i) => [`${y}년`,
        i ? `${nf(DEC_CNT[i])} (${signed(yoy(DEC_CNT, i))})` : nf(DEC_CNT[i]),
        i ? `${nf(DEC_AMT[i])} (${signed(yoy(DEC_AMT, i))})` : nf(DEC_AMT[i]),
        perOne(DEC_AMT[i] - DEC_FIX[i], DEC_CNT[i])]) },
  ],
};
// 구간별 상세 표는 아래 '로우 데이터'로 보낸다 — 위 섹션은 타일·막대·5개년 표만 두어 가볍게
const ALLGIFT_RAW = [
    { title: '금액 구간별 증여 건수 추이 (2021~2025년, 과세미달 포함)',
      note: '단위: 건 · ( )는 해당 연도 전체 대비 비중 · 출처: 국세통계 6-4-3',
      columns: ['구간', ...DEC_YEARS.map(y => `${y}년`), '2023년 대비 2025년'],
      rows: BANDS.map((b, bi) => [b,
        ...DEC_YEARS.map((_, i) => `${nf(DEC_BAND_CNT[bi][i])} (${pct(DEC_BAND_CNT[bi][i], DEC_CNT[i])})`),
        signed((DEC_BAND_CNT[bi][4] / DEC_BAND_CNT[bi][2] - 1) * 100)])
        .concat([['합계', ...DEC_CNT.map(nf), signed((DEC_CNT[4] / DEC_CNT[2] - 1) * 100)]]) },
    { title: '2025년 금액 구간별 건당 증여액 (과세미달 포함)',
      note: '금액 단위: 백만원 · 금액은 당해 증여액에 10년 내 동일인 증여액을 합산한 값 · 출처: 국세통계 6-4-3',
      columns: ['구간', '건수', '비중', '누계 비중', '증여재산 (10년 합산)', '건당 평균'],
      rows: BANDS.map((b, i) => [b, nf(decBand(DI)[i]), pct(decBand(DI)[i], DEC_CNT[DI]), pct(cum(decBand(DI), i), DEC_CNT[DI]),
        nf(DEC_BAND_AMT[i][DI]), perOne(DEC_BAND_AMT[i][DI], decBand(DI)[i])]) },
];

// 맨 먼저 읽는 줄. 수치와 그 정의만 적고 해석은 붙이지 않는다.
const SUMMARY = {
  title: '핵심 요약',
  items: [
    `2025년 증여 신고는 과세미달을 포함해 총 <b>${nf(DEC_CNT[DI])}건</b>으로 전년 대비 <b>${chg(yoy(DEC_CNT, DI))}</b>했으며, 이 중 <b>5천만원 이하가 ${pct(cum(decBand(DI), 1), DEC_CNT[DI])}</b>를 차지합니다.`,
    `연령별 통계는 과세 대상 신고만 집계됩니다. 2025년 과세 대상 신고인원은 <b>${nf(TOTAL)}명</b>이며, 이 중 <b>20세 미만은 ${nf(MINOR_TOTAL)}명(${pct(MINOR_TOTAL, TOTAL)})</b>입니다.`,
    `<b>10세 미만(${nf(AGES[0].total)}명)</b>은 5천만원 이하가 ${pct(cum(AGES[0].band, 1), AGES[0].total)}, 1억원 이하가 ${pct(cum(AGES[0].band, 2), AGES[0].total)}로 전국 평균(${pct(cum(ALL, 1), TOTAL)}, ${pct(cum(ALL, 2), TOTAL)})보다 소액 증여 비중이 높습니다.`,
    `<b>10대(${nf(AGES[1].total)}명)</b>는 5천만원 이하 ${pct(cum(AGES[1].band, 1), AGES[1].total)}, 1억원 이하 ${pct(cum(AGES[1].band, 2), AGES[1].total)}로, 10세 미만보다 각각 ${ppDiff(cum(AGES[0].band,1), AGES[0].total, cum(AGES[1].band,1), AGES[1].total)}%p, ${ppDiff(cum(AGES[0].band,2), AGES[0].total, cum(AGES[1].band,2), AGES[1].total)}%p 낮습니다.`,
    `20세 미만 비중은 2023년 ${pct(MINOR_YEARS[2], TREND_ALL[2])}에서 2025년 ${pct(MINOR_YEARS[4], TREND_ALL[4])}로 높아졌으며, 2025년 인원은 전년 대비 ${chg(yoy(MINOR_YEARS, 4))}해 전체(${chg(yoy(TREND_ALL, 4))})${yoy(MINOR_YEARS, 4) >= yoy(TREND_ALL, 4) ? '를 웃돌았습니다' : '에 못 미쳤습니다'}.`,
  ],
};


// 용어 풀이 — 로우 데이터 표의 컬럼 이름만 짧게 푼다.
// 계산 순서 한 줄 + 항목당 한 문장. 자세한 배경은 국세통계 원문에 있다.
const TERMS = {
  title: '용어 풀이',
  items: [
    `<b>계산 순서</b> — 증여재산가액 → (비과세·과세가액불산입·채무 차감, 가산액 합산) → 증여세과세가액 → (증여재산공제·감정평가수수료 등 차감) → 과세표준 → (세율 적용) → 산출세액 → (세액공제·감면 차감) → 자진납부할세액`,
    `<b>증여재산가액</b> — 해당 증여로 받은 재산의 세법상 평가액으로, <b>공제 적용 전</b> 금액입니다.`,
    `<b>증여재산가산액</b> — 10년 이내 동일인(증여자가 직계존속인 경우 그 배우자 포함)으로부터 받은 증여재산의 합계액으로, 1천만원 이상인 경우에만 합산합니다.`,
    `<b>증여세과세가액</b> — 증여재산가액에서 비과세·과세가액불산입·채무를 차감하고 가산액을 더한 금액입니다.`,
    `<b>증여재산공제</b> — 과세 대상에서 제외되는 금액(10년 합산 한도)입니다. 직계존비속 5천만원(미성년 2천만원), 배우자 6억원, 혼인·출산 각 1억원(통합 한도 1억원)이며, <b>실제 증여액과는 다릅니다.</b>`,
    `<b>과세표준</b> — 과세가액에서 공제를 <b>차감한 후</b>의 금액으로, 세율(10~50%)을 적용해 산출세액을 계산합니다.`,
    `<b>자진납부할세액</b> — 산출세액에서 세액공제·감면을 차감한 실제 납부세액입니다. 세액공제의 ${pct(Y.세액공제_납부, Y.세액공제_소계)}는 10년 내 이전 증여분에 대해 이미 납부한 세액의 공제이며, 기한 내 신고 시 3% 신고세액공제가 적용됩니다.`,
  ],
};

const METRICS = [
  { group: '수증자 연령별 신고인원', items: [
    ...AGES.map(a => ({ label: a.name, value: `${nf(a.total)}명`, delta: `전체의 ${pct(a.total, TOTAL)} · 1억원 이하 ${pct(cum(a.band, 2), a.total)}` })),
    { label: YOUTH.name, value: `${nf(YOUTH.total)}명`, delta: `전체의 ${pct(YOUTH.total, TOTAL)} · 중복 분류로 합계 미포함` },
  ]},
  { group: '금액 기준 주요 지표 (국세통계 6-3-1)', items: [
    { label: '증여재산가액', value: jo(Y.증여재산가액), delta: `건당 평균 ${perCase(Y.증여재산가액, Y.건수)}` },
    { label: '증여재산공제 소계', value: jo(Y.공제_소계), delta: `직계존비속 ${pct(Y.공제_직계존비속, Y.공제_소계)}` },
    { label: '혼인·출산 공제', value: jo(Y.공제_혼인 + Y.공제_출산), delta: `공제의 ${pct(Y.공제_혼인 + Y.공제_출산, Y.공제_소계)}` },
    { label: '10년 합산 가산액', value: jo(Y.가산액), delta: `과세가액의 ${pct(Y.가산액, Y.과세가액)}` },
    { label: '과세표준', value: jo(Y.과세표준), delta: `공제 ${jo(Y.공제_소계)} 차감 후` },
    { label: '자진납부세액', value: jo(Y.자진납부세액), delta: `세액공제 ${jo(Y.세액공제_소계)} 차감 후` },
  ]},
];

// 증감 추이 차트 — 2021년을 100으로 둔 지수. 연령대별 규모 차이가 커서
// 절대값을 그대로 겹치면 작은 계열이 눌린다.
const TREND_CHART = {
  title: '연령대별 증여세 신고인원 추이 (2021년 = 100)',
  note: `2021년을 100으로 환산한 지수입니다(50은 2021년의 절반). `
    + `연령대별 인원 규모 차이(30대 3.9만 명, 10세 미만 8천 명)가 커 지수로 비교했습니다. `
    + `각 점에 마우스를 올리면 실제 인원을 확인할 수 있습니다. 출처: 국세통계 6-3-3`,
  years: TREND_YEARS,
  series: [
    ...TREND.map(t => ({
      name: t.name, hl: !!t.hl,
      index: t.v.map(v => +(v / t.v[0] * 100).toFixed(1)),
      values: t.v.map(nf),
    })),
    { name: '40세 미만 합계', sub: true,
      index: TREND_U40.map(v => +(v / TREND_U40[0] * 100).toFixed(1)), values: TREND_U40.map(nf) },
    { name: '전체 연령', sub: true,
      index: TREND_ALL.map(v => +(v / TREND_ALL[0] * 100).toFixed(1)), values: TREND_ALL.map(nf) },
  ],
};

const RAW = [
  ...ALLGIFT_RAW,
  { title: '연령대별 신고인원 및 증감률 (2021~2025년)',
    note: '단위: 명 · ( )는 전년 대비 증감률 · 출처: 국세통계 6-3-3',
    columns: ['연령', ...TREND_YEARS.map(y => `${y}년`), '2021년 대비'],
    rows: [
      ...TREND.map(t => [t.name,
        ...t.v.map((v, i) => i === 0 ? nf(v) : `${nf(v)} (${signed(yoy(t.v, i))})`),
        signed((t.v[4] / t.v[0] - 1) * 100)]),
      ['40세 미만 합계',
        ...TREND_U40.map((v, i) => i === 0 ? nf(v) : `${nf(v)} (${signed(yoy(TREND_U40, i))})`),
        signed((TREND_U40[4] / TREND_U40[0] - 1) * 100)],
      ['전체 연령',
        ...TREND_ALL.map((v, i) => i === 0 ? nf(v) : `${nf(v)} (${signed(yoy(TREND_ALL, i))})`),
        signed((TREND_ALL[4] / TREND_ALL[0] - 1) * 100)],
    ] },
  { title: '연령대별 저점 및 회복 추이 (2021~2025년)',
    note: '저점: 5개 연도 중 신고인원이 가장 적었던 해 · 지수: 2021년 = 100 · 출처: 국세통계 6-3-3',
    columns: ['연령', '저점 연도', '저점 인원', '저점 대비 2025년', '전년 대비', '2025년 지수 (2021=100)'],
    rows: [
      ...TREND.map(t => { const r = reboundRow(t.v); return [t.name, `${r.trough}년`, nf(troughOf(t.v).lo), r.fromTrough, r.yoy, r.idx2025]; }),
      (() => { const r = reboundRow(MINOR_YEARS); return ['미성년 합계 (20세 미만)', `${r.trough}년`, nf(troughOf(MINOR_YEARS).lo), r.fromTrough, r.yoy, r.idx2025]; })(),
      (() => { const r = reboundRow(TREND_ALL); return ['전체 연령', `${r.trough}년`, nf(troughOf(TREND_ALL).lo), r.fromTrough, r.yoy, r.idx2025]; })(),
    ] },
  { title: '연령대별 비중 추이 (2021~2025년)',
    note: '해당 연도 전체 신고인원 대비 비중 · 출처: 국세통계 6-3-3',
    columns: ['연령', ...TREND_YEARS.map(y => `${y}년`), '2021년 대비 변화'],
    rows: [
      ...TREND.map(t => [t.name, ...t.v.map((v, i) => pct(v, TREND_ALL[i])),
        signed(t.v[4] / TREND_ALL[4] * 100 - t.v[0] / TREND_ALL[0] * 100) + 'p']),
      ['미성년 합계 (20세 미만)', ...MINOR_YEARS.map((v, i) => pct(v, TREND_ALL[i])),
        signed(MINOR_YEARS[4] / TREND_ALL[4] * 100 - MINOR_YEARS[0] / TREND_ALL[0] * 100) + 'p'],
      ['40세 미만 합계', ...TREND_U40.map((v, i) => pct(v, TREND_ALL[i])),
        signed(TREND_U40[4] / TREND_ALL[4] * 100 - TREND_U40[0] / TREND_ALL[0] * 100) + 'p'],
      ['전체 연령 (기준)', ...TREND_YEARS.map(() => '100.0%'), '—'],
    ] },
  { title: '2025년 금액 구간별 신고인원 (전국)',
    note: '단위: 명 · 출처: 국세통계 6-3-3',
    columns: ['구간', '인원', '비중', '누계 비중'],
    rows: BANDS.map((b, i) => [b, nf(ALL[i]), pct(ALL[i], TOTAL), pct(cum(ALL, i), TOTAL)])
      .concat([['합계', nf(TOTAL), '100.0%', '100.0%']]) },
  { title: '2025년 금액 구간별 증여액 및 세액 (과세 대상)',
    note: '금액 단위: 백만원 · 출처: 국세통계 6-3-2 증여세 신고 현황Ⅱ',
    columns: ['구간', '신고건수', '증여재산가액', '건당 증여액', '가산액', '가산액 비중', '건당 공제', '산출세액', '건당 세액'],
    rows: BANDS.map((b, i) => {
      const [cnt, amt, add, ded, , tax] = TAXB[i];
      return [b, nf(cnt), nf(amt), perOne(amt, cnt), nf(add), addRate(i), perOne(ded, cnt), nf(tax), perOne(tax, cnt)];
    }) },
  { title: '2025년 연령 × 금액 구간 교차표 (과세 대상)',
    note: '단위: 명 · 청년(19~34세)은 연령 구간과 중복되는 별도 분류로 합계 미포함 · 출처: 국세통계 6-3-3',
    columns: ['연령', '합계', ...BANDS],
    rows: [
      ...AGES.map(a => [a.name, nf(a.total), ...a.band.map(nf)]),
      ['미성년 합계 (20세 미만)', nf(MINOR_TOTAL), ...MINOR_BAND.map(nf)],
      ['20~39세 합계', nf(A2040_TOTAL), ...A2040_BAND.map(nf)],
      [YOUTH.name, nf(YOUTH.total), ...YOUTH.band.map(nf)],
      ['전국 합계', nf(TOTAL), ...ALL.map(nf)],
    ] },
];

const SOURCES = [
  { title: '증여재산가액 등 규모별 신고인원 현황 — 2025년 신고분', desc: '연령별 통계의 기준 표 (금액 구간 × 납세지·수증자 연령)', alt: 'https://www.data.go.kr/data/15119378/fileData.do', link: 'https://tasis.nts.go.kr/websquare/websquare.html?w2xPath=/ui/ep/e/a/UTWEPEAA02.xml&sttPblYr=2026&sttsMtaInfrId=20251203F01202622979' },
  { title: '증여세 신고 현황Ⅱ(증여재산가액 등) — 2025년 신고분', desc: '금액 구간별 증여액·세액 (구간별 산출세액 확인용)', alt: 'https://www.data.go.kr/data/15119378/fileData.do', link: 'https://tasis.nts.go.kr/websquare/websquare.html?w2xPath=/ui/ep/e/a/UTWEPEAA02.xml&sttPblYr=2026&sttsMtaInfrId=20251203F01202622978' },
  { title: '증여세 신고 현황Ⅰ(납세지) — 2025년 신고분', desc: '공제·과세표준·세액 등 금액 지표 원본', alt: 'https://www.data.go.kr/data/3058487/fileData.do', link: 'https://tasis.nts.go.kr/websquare/websquare.html?w2xPath=/ui/ep/e/a/UTWEPEAA02.xml&sttPblYr=2026&sttsMtaInfrId=20251203F01202622977' },
  { title: '과세유형별 증여세 결정 현황 — 2025년 결정분', desc: '과세미달 포함 전체 증여 현황의 출처 (결정 기준, 연령 구분 없음)', link: 'https://tasis.nts.go.kr/websquare/websquare.html?w2xPath=/ui/ep/e/a/UTWEPEAA02.xml&sttPblYr=2026&sttsMtaInfrId=20251203F01202622989' },
  { title: '국세통계포털(TASIS)', desc: '관계별·자산종류별 등 증여세 상세 통계', link: 'https://tasis.nts.go.kr/websquare/websquare.html?w2xPath=/cm/index.xml' },
];

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1800');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  res.status(200).json({
    updatedAt: UPDATED_AT, basis: BASIS, source: SOURCE, notice: NOTICE,
    summary: SUMMARY, allGift: ALLGIFT, age: PI_POINTS, dist: DIST, trend: TREND_CHART, metrics: METRICS, terms: TERMS, raw: RAW, sources: SOURCES,
  });
}
