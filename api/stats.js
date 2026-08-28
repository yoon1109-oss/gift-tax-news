// 통계 탭 — 증여 지표 (파이 앱 참고용).
// 기준 표: 국세통계 6.3.3 증여재산가액 등 규모별 신고인원 현황 — 2025년 신고분 (TASIS).
//   → 규모(금액 구간) × 납세지 / 수증인 연령 교차표. 단위: 명.
// 보조 표: 국세통계 6.3.1 증여세 신고 현황Ⅰ(납세지) — 공제·과세흐름 금액 지표. 단위: 백만원.
// 두 표 모두 2025년 신고분이며 총계(180,260)가 일치한다. 다른 연도 통계는 섞지 않는다.
const UPDATED_AT = '2026-08-24';
const BASIS = '2025년 신고분';
const SOURCE = '국세청 국세통계';   // 상세 표 이름은 각 표 설명줄과 하단 바로가기에 남긴다

// ── 6.3.3 규모 구간 ──
// 공식 작성기준: "증여재산가액 등 규모"는 증여재산가액 + 증여재산가산액(10년 내 동일인 사전증여 합계,
// 그 합계가 1천만원 이상일 때만 가산)이다. 즉 이번 증여액이 아니라 10년 누적 기준에 가깝다.
// 각 구간은 "직전 구간 초과 ~ 표기액 이하".
const BANDS = ['1천만 이하', '5천만 이하', '1억 이하', '3억 이하', '5억 이하',
               '10억 이하', '20억 이하', '30억 이하', '50억 이하', '50억 초과'];

// 전국 합계 (단위: 명)
const TOTAL = 180260;
const ALL = [22168, 33884, 42894, 49700, 13073, 12697, 3873, 845, 508, 618];

// 수증인 연령별 × 규모별 (단위: 명).
// TASIS 6.3.3 주석 원문:
//   [D] 기타 = 수증자가 비영리법인 등인 경우  ← '연령 미상'이 아니다
//   [E] 청년 = 청년기본법 제3조의 19세 이상 34세 이하. 합계구간에 추가 합산되지 않음
// (연령 8개 구간 합 = 180,260 총계와 일치. 청년은 여기에 더해지지 않는다)
const AGES = [
  { name: '10세 미만', total: 8278,  band: [1087, 3803, 1400, 1419, 291, 192, 68, 9, 2, 7] },
  { name: '10세 이상', total: 9958,  band: [738, 3708, 2268, 2205, 507, 345, 111, 32, 24, 20] },
  { name: '20세 이상', total: 21892, band: [1676, 2471, 6315, 7433, 1925, 1401, 461, 93, 56, 61] },
  { name: '30세 이상', total: 38518, band: [3265, 4144, 8101, 13636, 4136, 3578, 1067, 247, 164, 180] },
  { name: '40세 이상', total: 35748, band: [3863, 5183, 8694, 10472, 3017, 2945, 1023, 229, 142, 180] },
  { name: '50세 이상', total: 35628, band: [4797, 6774, 9341, 9277, 2175, 2272, 635, 149, 82, 126] },
  { name: '60세 이상', total: 28130, band: [5628, 7460, 6533, 5027, 945, 1912, 489, 71, 30, 35] },
  { name: '기타(비영리법인 등)', total: 2108, band: [1114, 341, 242, 231, 77, 52, 19, 15, 8, 9] },
];
const YOUTH = { name: '청년(19~34세)', total: 43554, band: [3253, 4788, 11107, 15378, 4249, 3267, 979, 230, 151, 152] };

// 미성년(20세 미만) = 10세 미만 + 10세 이상 두 구간의 합
const MINOR_BAND = AGES[0].band.map((v, i) => v + AGES[1].band[i]);
const MINOR_TOTAL = AGES[0].total + AGES[1].total;   // 18,236명

// 20~40세 = 20세 이상(20대) + 30세 이상(30대)
const A2040_BAND = AGES[2].band.map((v, i) => v + AGES[3].band[i]);
const A2040_TOTAL = AGES[2].total + AGES[3].total;   // 60,410명

// 최다 구간의 인덱스 — 눈으로 고르지 않고 계산한다
const topIdx = arr => arr.indexOf(Math.max(...arr));

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
const perCase = (amt, cnt) => (amt * 1e6 / cnt / 1e8).toFixed(2) + '억원';
// 건당 금액 — 1억 미만은 만원, 이상은 억원
const perOne = (mw, cnt) => {
  const v = Number(mw) * 1e6 / cnt;
  return v >= 1e8 ? (v / 1e8).toFixed(2) + '억원' : Math.round(v / 1e4).toLocaleString('ko-KR') + '만원';
};

// 수치를 잘못 읽지 않도록 하는 해석 유의사항
const NOTICE = [
  `<b>금액은 '받은 돈' 기준입니다.</b> 세금에서 빼주는 공제를 적용하기 전, 받은 재산 그대로의 금액으로 줄을 세웠습니다. 10년 안에 같은 사람에게 이미 받은 게 있으면 합쳐서 봅니다 — 다만 소액일수록 합쳐지는 금액이 거의 없어(1천만 이하 ${addRate(0)}, 5천만 이하 ${addRate(1)}) 대체로 이번에 받은 금액으로 보시면 됩니다.`,
  `<b>'5천만 이하'는 "1천만 초과 ~ 5천만 이하"라는 뜻입니다.</b> 앞 구간에 든 사람은 빠집니다.`,
  `<b>단위는 '명'입니다.</b> 한 사람이 여러 번 받으면 각각 셉니다.`,
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

// 연령 구간 상세 — 수치와 그 수치가 뜻하는 정의만 적는다.
// 해석·추측('~하는 성향', '~때문에', '뉴스에 나오는')은 넣지 않는다.
const bandDetail = (band, total, label) => [
  `최다 구간 <b>${BANDS[topIdx(band)]}</b> ${nf(band[topIdx(band)])}명 (${pct(band[topIdx(band)], total)}). `
    + `같은 구간 전국 비중 ${pct(ALL[topIdx(band)], TOTAL)}.`,
  `누계 — 5천만 이하 <b>${pct(cum(band, 1), total)}</b> · 1억 이하 <b>${pct(cum(band, 2), total)}</b> · `
    + `3억 이하 <b>${pct(cum(band, 3), total)}</b> (전국 각 ${pct(cum(ALL, 1), TOTAL)} / ${pct(cum(ALL, 2), TOTAL)} / ${pct(cum(ALL, 3), TOTAL)}).`,
  `10억 초과 ${nf(total - cum(band, 5))}명 (${pct(total - cum(band, 5), total)}). 전국 ${pct(TOTAL - cum(ALL, 5), TOTAL)}.`,
  `구간별 인원 — ${BANDS.map((b, i) => `${b} ${nf(band[i])}`).join(' · ')}.`,
];

// 연도별 인원 (2021~2025) — TREND에서 같은 연령대를 합산
const MINOR_YEARS = TREND_YEARS.map((_, i) => TREND[0].v[i] + TREND[1].v[i]);
const A2040_YEARS = TREND_YEARS.map((_, i) => TREND[2].v[i] + TREND[3].v[i]);

const PI_POINTS = {
  title: '연령 구간 상세',
  items: [
    { group: '미성년 — 20세 미만', tag: `${nf(MINOR_TOTAL)}명 · 전체의 ${pct(MINOR_TOTAL, TOTAL)}`, lines: [
      `10세 미만 ${nf(AGES[0].total)}명 (이 구간의 ${pct(AGES[0].total, MINOR_TOTAL)}) · `
        + `10대 ${nf(AGES[1].total)}명 (${pct(AGES[1].total, MINOR_TOTAL)}).`,
      ...bandDetail(MINOR_BAND, MINOR_TOTAL),
      `연도별 — ${TREND_YEARS.map((y, i) => `${y}년 ${nf(MINOR_YEARS[i])}`).join(' · ')}명. `
        + `2021→2025 ${signed((MINOR_YEARS[4] / MINOR_YEARS[0] - 1) * 100)}, 전년 대비 ${signed(yoy(MINOR_YEARS, 4))}.`,
      `<b>구간 정의</b> — 통계표의 연령 구간이 '10세 미만 / 10세 이상 / 20세 이상'이라 여기서 말하는 미성년은 <b>20세 미만</b>입니다. `
        + `민법상 미성년(19세 미만)·증여재산공제 미성년 한도(2천만원)의 기준과 한 살 차이가 나며, 19세는 이 집계에 포함됩니다.`,
    ]},
    { group: '20~40세 — 20대·30대', tag: `${nf(A2040_TOTAL)}명 · 전체의 ${pct(A2040_TOTAL, TOTAL)}`, lines: [
      `20대 ${nf(AGES[2].total)}명 (이 구간의 ${pct(AGES[2].total, A2040_TOTAL)}) · `
        + `30대 ${nf(AGES[3].total)}명 (${pct(AGES[3].total, A2040_TOTAL)}). `
        + `연령 8개 구간 중 30대가 ${nf(AGES[3].total)}명으로 가장 많습니다.`,
      ...bandDetail(A2040_BAND, A2040_TOTAL),
      `연도별 — ${TREND_YEARS.map((y, i) => `${y}년 ${nf(A2040_YEARS[i])}`).join(' · ')}명. `
        + `2021→2025 ${signed((A2040_YEARS[4] / A2040_YEARS[0] - 1) * 100)}, 전년 대비 ${signed(yoy(A2040_YEARS, 4))}.`,
      `<b>겹치는 항목</b> — 청년(19~34세) ${nf(YOUTH.total)}명은 연령 구간을 가로질러 다시 묶은 항목이라 이 수치와 겹치며, 합계에는 더해지지 않습니다.`,
    ]},
  ],
};

// 분포 막대 — 연령 구간이 주(主), 전국은 비교 기준으로 마지막에 둔다
const distRows = (band, total) =>
  BANDS.map((b, i) => ({ label: b, value: nf(band[i]), pct: (band[i] / total * 100).toFixed(1) }));

const DIST = [
  { title: '미성년(20세 미만) — 얼마를 받았나',
    note: `${nf(MINOR_TOTAL)}명 · 전체의 ${pct(MINOR_TOTAL, TOTAL)} · 단위 명`,
    hl: true,
    rows: distRows(MINOR_BAND, MINOR_TOTAL) },
  { title: '20~40세 — 얼마를 받았나',
    note: `${nf(A2040_TOTAL)}명 · 전체의 ${pct(A2040_TOTAL, TOTAL)} · 단위 명`,
    hl: true,
    rows: distRows(A2040_BAND, A2040_TOTAL) },
  { title: `전국 ${nf(TOTAL)}명 — 비교 기준`,
    note: `2025년 신고분 · 단위 명 · 국세통계 6.3.3 '증여재산가액 등 규모별 신고인원'`,
    rows: distRows(ALL, TOTAL) },
];

// 맨 먼저 읽는 줄. 수치와 그 정의만 적고 해석은 붙이지 않는다.
const SUMMARY = {
  title: '한눈에 보기',
  items: [
    `2025년 증여세 신고인원 <b>${nf(TOTAL)}명</b>.`,
    `<b>미성년(20세 미만) ${nf(MINOR_TOTAL)}명</b> — 전체의 ${pct(MINOR_TOTAL, TOTAL)}. 이 중 1억 이하 ${pct(cum(MINOR_BAND, 2), MINOR_TOTAL)}, 최다 구간은 5천만 이하 ${pct(MINOR_BAND[1], MINOR_TOTAL)}.`,
    `<b>20~40세 ${nf(A2040_TOTAL)}명</b> — 전체의 ${pct(A2040_TOTAL, TOTAL)}. 이 중 1억 이하 ${pct(cum(A2040_BAND, 2), A2040_TOTAL)}, 최다 구간은 3억 이하 ${pct(A2040_BAND[3], A2040_TOTAL)}.`,
    `신고인원 추이 — 2021년 ${nf(TREND_ALL[0])}명에서 3년 연속 감소 후 2025년 ${nf(TREND_ALL[4])}명 (전년 대비 ${signed(yoy(TREND_ALL, 4))}).`,
  ],
};


// 로우 데이터 표의 컬럼 이름을 그대로 풀어주는 용어 설명
const TERMS = {
  title: '용어 풀이',
  items: [
    `<b>계산 순서</b> — 증여재산가액 → (− 비과세·불산입·채무 + 가산액) → 증여세과세가액 → (− <b>증여재산공제</b>) → 과세표준 → (× 세율 10~50%) → 산출세액 → (− 세액공제) → 자진납부할세액. <b>증여재산가액은 공제를 빼기 전</b> 금액이고, <b>공제를 뺀 뒤가 과세표준</b>입니다.`,
    `<b>증여재산가액</b> — 이번 증여로 받은 재산의 <b>세법상 평가액</b>. <b>공제를 빼기 전</b> 금액입니다. 신고한 증여금액이 맞지만, 현금은 액면 그대로인 반면 부동산·비상장주식은 시가(매매사례가·감정가액, 없으면 기준시가)로 평가한 값이 들어갑니다. <b>이번 증여 건만</b> 담깁니다.`,
    `<b>증여재산가산액</b> — 이번 증여 전 10년 이내에 같은 사람(직계존속이면 그 배우자 포함)에게 받은 증여재산의 합계(1천만원 이상일 때). 2025년 ${jo(Y.가산액)}으로 증여재산가액 ${jo(Y.증여재산가액)}의 <b>${pct(Y.가산액, Y.증여재산가액)}</b>에 이릅니다 — 이미 받아본 사람이 또 받는 경우가 그만큼 많습니다.`,
    `<b>증여세과세가액</b> — 증여재산가액 − 비과세 − 과세가액불산입 − 채무(부담부증여로 떠안은 빚) + 가산액. 2025년 ${jo(Y.과세가액)}.`,
    `<b>증여재산공제</b> — 관계별로 세금을 매기지 않고 빼주는 금액(10년 합산 한도). 배우자 6억, 직계존비속 5천만(미성년 2천만), 그 밖의 친족 1천만, 혼인·출산 각 1억. <b>실제 증여한 금액이 아닙니다.</b>`,
    `<b>과세표준</b> — 과세가액에서 증여재산공제 등을 <b>뺀 뒤</b>의 금액. 여기에 세율 10~50%를 곱해 <b>산출세액</b>이 나옵니다. 예를 들어 <b>1억 이하</b> 구간은 건당 증여재산가액 ${perOne(TAXB[2][1], TAXB[2][0])}에서 공제 ${perOne(TAXB[2][3], TAXB[2][0])}을 빼 과세표준이 ${perOne(TAXB[2][4], TAXB[2][0])}이 됩니다.`,
    `<b>자진납부할세액</b> — 산출세액에서 징수유예·감면과 세액공제(기납부세액공제, 신고세액공제 3% 등)를 뺀, 실제로 내는 돈. 2025년 ${jo(Y.자진납부세액)}.`,
  ],
};

// '얼마 이하가 몇 %' — 전국이 아니라 연령 구간 기준으로 낸다.
// 전국 값은 비교용으로 각 타일 밑줄(delta)에 같이 적는다.
const CUM_STEPS = [0, 1, 2, 3, 5];
const cumGroup = (name, band, total) => [{
  group: `얼마 이하가 몇 % — ${name}`,
  items: [
    ...CUM_STEPS.map(i => ({
      label: BANDS[i], value: pct(cum(band, i), total),
      delta: `${nf(cum(band, i))}명 · 전국 ${pct(cum(ALL, i), TOTAL)}`,
    })),
    { label: '10억 초과', value: pct(total - cum(band, 5), total),
      delta: `${nf(total - cum(band, 5))}명 · 전국 ${pct(TOTAL - cum(ALL, 5), TOTAL)}` },
  ],
}];

const METRICS = [
  ...cumGroup('미성년(20세 미만)', MINOR_BAND, MINOR_TOTAL),
  ...cumGroup('20~40세', A2040_BAND, A2040_TOTAL),
  { group: '받은 사람 나이별', items: [
    ...AGES.map(a => ({ label: a.name, value: `${nf(a.total)}명`, delta: `${pct(a.total, TOTAL)} · 1억 이하 ${pct(cum(a.band, 2), a.total)}` })),
    { label: YOUTH.name, value: `${nf(YOUTH.total)}명`, delta: `${pct(YOUTH.total, TOTAL)} · 합계에 미포함` },
  ]},
  { group: '사람 수 말고 돈으로 보면 (국세통계 6.3.1)', items: [
    { label: '증여재산가액', value: jo(Y.증여재산가액), delta: `건당 평균 ${perCase(Y.증여재산가액, Y.건수)}` },
    { label: '증여재산공제 소계', value: jo(Y.공제_소계), delta: `직계존비속 ${pct(Y.공제_직계존비속, Y.공제_소계)}` },
    { label: '혼인·출산 공제', value: jo(Y.공제_혼인 + Y.공제_출산), delta: `공제의 ${pct(Y.공제_혼인 + Y.공제_출산, Y.공제_소계)}` },
    { label: '10년 합산 가산액', value: jo(Y.가산액), delta: `과세가액의 ${pct(Y.가산액, Y.과세가액)}` },
    { label: '과세표준', value: jo(Y.과세표준), delta: `공제 ${jo(Y.공제_소계)} 차감 후` },
    { label: '자진납부세액', value: jo(Y.자진납부세액), delta: `세액공제 ${jo(Y.세액공제_소계)} 반영` },
  ]},
];

// 증감 추이 차트 — 2021년을 100으로 둔 지수. 연령대별 규모 차이가 커서
// 절대값을 그대로 겹치면 작은 계열이 눌린다.
const TREND_CHART = {
  title: '연령대별 증여세 신고인원 추이',
  note: `2021년을 100으로 놓고 이후 몇 %가 됐는지 그린 그래프입니다. 50이면 2021년의 절반이라는 뜻. `
    + `연령대마다 인원 규모가 달라(30대 3.9만 명 vs 10세 미만 8천 명) 같은 눈금으로 비교하려고 지수로 그렸습니다. `
    + `점에 마우스를 올리면 실제 인원이 나옵니다. · 출처 국세통계 6.3.3`,
  years: TREND_YEARS,
  series: [
    ...TREND.map(t => ({
      name: t.name, hl: !!t.hl,
      index: t.v.map(v => +(v / t.v[0] * 100).toFixed(1)),
      values: t.v.map(nf),
    })),
    { name: '40세 미만 계', sub: true,
      index: TREND_U40.map(v => +(v / TREND_U40[0] * 100).toFixed(1)), values: TREND_U40.map(nf) },
    { name: '전체 연령', sub: true,
      index: TREND_ALL.map(v => +(v / TREND_ALL[0] * 100).toFixed(1)), values: TREND_ALL.map(nf) },
  ],
};

const RAW = [
  { title: '2021~2025년 연령대별 증여세 신고인원과 증감율',
    note: '단위: 명 · 괄호는 전년 대비 증감율 · 출처 국세통계 6.3.3',
    columns: ['연령', ...TREND_YEARS.map(y => `${y}년`), '2021→2025'],
    rows: [
      ...TREND.map(t => [t.name,
        ...t.v.map((v, i) => i === 0 ? nf(v) : `${nf(v)} (${signed(yoy(t.v, i))})`),
        signed((t.v[4] / t.v[0] - 1) * 100)]),
      ['40세 미만 계',
        ...TREND_U40.map((v, i) => i === 0 ? nf(v) : `${nf(v)} (${signed(yoy(TREND_U40, i))})`),
        signed((TREND_U40[4] / TREND_U40[0] - 1) * 100)],
      ['전체 연령',
        ...TREND_ALL.map((v, i) => i === 0 ? nf(v) : `${nf(v)} (${signed(yoy(TREND_ALL, i))})`),
        signed((TREND_ALL[4] / TREND_ALL[0] - 1) * 100)],
    ] },
  { title: '2025년 금액 구간별 신고인원 — 전국',
    note: '단위: 명 · 출처 국세통계 6.3.3',
    columns: ['구간', '인원', '비중', '이하 누계 비중'],
    rows: BANDS.map((b, i) => [b, nf(ALL[i]), pct(ALL[i], TOTAL), pct(cum(ALL, i), TOTAL)])
      .concat([['합계', nf(TOTAL), '100.0%', '100.0%']]) },
  { title: '2025년 구간별로 실제 얼마 받고 세금 얼마 냈나',
    note: '금액 단위: 백만원 · 출처 국세통계 6.3.2 증여세 신고 현황Ⅱ',
    columns: ['구간', '신고건수', '증여재산가액', '건당 증여액', '가산액', '가산액 비중', '건당 공제', '산출세액', '건당 세액'],
    rows: BANDS.map((b, i) => {
      const [cnt, amt, add, ded, , tax] = TAXB[i];
      return [b, nf(cnt), nf(amt), perOne(amt, cnt), nf(add), addRate(i), perOne(ded, cnt), nf(tax), perOne(tax, cnt)];
    }) },
  { title: '2025년 나이 × 금액 구간 교차표',
    note: '단위: 명 · 청년(19~34세)은 연령 구간과 겹치는 재분류 항목으로 합계에 미포함 · 출처 국세통계 6.3.3',
    columns: ['연령', '합계', ...BANDS],
    rows: [
      ...AGES.map(a => [a.name, nf(a.total), ...a.band.map(nf)]),
      ['미성년 계(20세 미만)', nf(MINOR_TOTAL), ...MINOR_BAND.map(nf)],
      ['20~40세 계', nf(A2040_TOTAL), ...A2040_BAND.map(nf)],
      [YOUTH.name, nf(YOUTH.total), ...YOUTH.band.map(nf)],
      ['전국 합계', nf(TOTAL), ...ALL.map(nf)],
    ] },
];

const SOURCES = [
  { title: '증여재산가액 등 규모별 신고인원 현황 — 2025년 신고분', desc: '이 탭의 기준 표 (규모별 × 납세지 / 수증인 연령)', link: 'https://tasis.nts.go.kr/websquare/websquare.html?w2xPath=/ui/ep/e/a/UTWEPEAA02.xml&sttPblYr=2026&sttsMtaInfrId=20251203F01202622979' },
  { title: '증여세 신고 현황Ⅱ(증여재산가액 등) — 2025년 신고분', desc: '같은 구간 체계의 금액·세액 — 구간별 산출세액 확인용', link: 'https://tasis.nts.go.kr/websquare/websquare.html?w2xPath=/ui/ep/e/a/UTWEPEAA02.xml&sttPblYr=2026&sttsMtaInfrId=20251203F01202622978' },
  { title: '증여세 신고 현황Ⅰ(납세지) — 2025년 신고분', desc: '보조 표 — 공제·과세표준·세액 등 금액 지표 원본', link: 'https://tasis.nts.go.kr/websquare/websquare.html?w2xPath=/ui/ep/e/a/UTWEPEAA02.xml&sttPblYr=2026&sttsMtaInfrId=20251203F01202622977' },
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
    summary: SUMMARY, age: PI_POINTS, dist: DIST, trend: TREND_CHART, metrics: METRICS, terms: TERMS, raw: RAW, sources: SOURCES,
  });
}
