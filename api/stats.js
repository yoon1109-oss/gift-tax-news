// 통계 탭 — 증여 지표 (파이 앱 참고용).
// 기준 표: 국세통계 6.3.3 증여재산가액 등 규모별 신고인원 현황 — 2025년 신고분 (TASIS).
//   → 규모(금액 구간) × 납세지 / 수증인 연령 교차표. 단위: 명.
// 보조 표: 국세통계 6.3.1 증여세 신고 현황Ⅰ(납세지) — 공제·과세흐름 금액 지표. 단위: 백만원.
// 두 표 모두 2025년 신고분이며 총계(180,260)가 일치한다. 다른 연도 통계는 섞지 않는다.
const UPDATED_AT = '2026-08-24';
const BASIS = '2025년 신고분';
const SOURCE = '국세통계 6.3.3 증여재산가액 등 규모별 신고인원 현황 · TASIS';

// ── 6.3.3 규모 구간 ──
// 공식 작성기준: "증여재산가액 등 규모"는 증여재산가액 + 증여재산가산액(10년 내 동일인 사전증여 합계,
// 그 합계가 1천만원 이상일 때만 가산)이다. 즉 이번 증여액이 아니라 10년 누적 기준에 가깝다.
// 각 구간은 "직전 구간 초과 ~ 표기액 이하".
const BANDS = ['1천만 이하', '5천만 이하', '1억 이하', '3억 이하', '5억 이하',
               '10억 이하', '20억 이하', '30억 이하', '50억 이하', '50억 초과'];

// 전국 합계 (단위: 명)
const TOTAL = 180260;
const ALL = [22168, 33884, 42894, 49700, 13073, 12697, 3873, 845, 508, 618];

// 수증인 연령별 × 규모별 (단위: 명). 기타=연령 미상. 청년은 별도 재분류(합계에 중복).
const AGES = [
  { name: '10세 미만', total: 8278,  band: [1087, 3803, 1400, 1419, 291, 192, 68, 9, 2, 7] },
  { name: '10세 이상', total: 9958,  band: [738, 3708, 2268, 2205, 507, 345, 111, 32, 24, 20] },
  { name: '20세 이상', total: 21892, band: [1676, 2471, 6315, 7433, 1925, 1401, 461, 93, 56, 61] },
  { name: '30세 이상', total: 38518, band: [3265, 4144, 8101, 13636, 4136, 3578, 1067, 247, 164, 180] },
  { name: '40세 이상', total: 35748, band: [3863, 5183, 8694, 10472, 3017, 2945, 1023, 229, 142, 180] },
  { name: '50세 이상', total: 35628, band: [4797, 6774, 9341, 9277, 2175, 2272, 635, 149, 82, 126] },
  { name: '60세 이상', total: 28130, band: [5628, 7460, 6533, 5027, 945, 1912, 489, 71, 30, 35] },
  { name: '기타(연령 미상)', total: 2108, band: [1114, 341, 242, 231, 77, 52, 19, 15, 8, 9] },
];
const YOUTH = { name: '청년(재분류)', total: 43554, band: [3253, 4788, 11107, 15378, 4249, 3267, 979, 230, 151, 152] };

// 미성년(20세 미만) = 10세 미만 + 10세 이상 두 구간의 합
const MINOR_BAND = AGES[0].band.map((v, i) => v + AGES[1].band[i]);
const MINOR_TOTAL = AGES[0].total + AGES[1].total;   // 18,236명

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
// "과세미달 제외"가 사실인지 확인할 수 있는 표. 1천만 이하 구간도 산출세액이 0이 아니다.
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
  '이 통계는 <b>과세미달을 제외</b>하고 작성됩니다 — 공제한도 이내라 낼 세금이 없는 증여(예: 미성년 자녀 10년 2천만원 이내)는 집계에 포함되지 않습니다. 아래 소액 구간은 <b>세금이 발생한 증여만</b> 센 수치입니다.',
  `<b>금액이 작은 것</b>과 <b>세금이 0원인 것</b>은 다릅니다. 삼촌에게 1천만원을 받으면 그 밖의 친족 공제(1천만원)로 세금이 0원이라 통계에서 <b>빠지고</b>, 같은 1천만원이라도 친족이 아닌 사람에게 받으면 공제가 0원이라 세금 100만원이 나와 <b>집계됩니다</b>.`,
  `그래서 <b>1천만 이하 구간에도 건수(${nf(TAXB[0][0])}건)가 나옵니다</b> — 과세미달이 섞인 게 아니라 <b>공제를 못 받는 증여만 남은</b> 구간입니다. 건당 증여재산공제가 ${perOne(TAXB[0][3], TAXB[0][0])}뿐이고 산출세액은 ${perOne(TAXB[0][5], TAXB[0][0])}입니다. (아래 구간별 표에서 확인)`,
  `구간 기준은 <b>증여재산가액 + 증여재산가산액</b>입니다. (가산액 = 증여 전 10년 이내 동일인에게 받은 증여재산 합계가 1천만원 이상인 경우 그 금액)`,
  `다만 <b>소액 구간에서는 사실상 이번에 받은 금액</b>과 같습니다 — 가산액이 증여재산가액의 <b>1천만 이하 ${addRate(0)}, 5천만 이하 ${addRate(1)}, 1억 이하 ${addRate(2)}</b>에 그칩니다. 반대로 고액일수록 사전증여 합산이 커져 <b>50억 초과는 ${addRate(9)}</b>에 이릅니다.`,
  '각 구간은 "직전 구간 초과 ~ 표기 금액 이하"입니다. (예: <b>5천만 이하</b> = 1천만 초과 ~ 5천만 이하)',
  '단위는 <b>명(신고인원)</b>입니다. 같은 사람이 여러 번 증여받으면 각각 집계됩니다.',
  '<b>청년</b>은 연령 구간과 별도로 재분류한 항목이라 연령별 합계에 중복 포함됩니다. <b>기타</b>는 연령 미상입니다.',
];

const PI_POINTS = {
  title: '주요 지표',
  items: [
    { group: '미성년 자녀 증여 (20세 미만)', tag: '파이 타깃', lines: [
      `${nf(MINOR_TOTAL)}명 — 전체 신고인원 ${nf(TOTAL)}명의 ${pct(MINOR_TOTAL, TOTAL)}`,
      `이 중 ${pct(cum(MINOR_BAND, 2), MINOR_TOTAL)}(${nf(cum(MINOR_BAND, 2))}명)가 <b>1억 이하</b> 소액 증여`,
      `가장 두꺼운 구간은 <b>5천만 이하</b> ${nf(MINOR_BAND[1])}명 (${pct(MINOR_BAND[1], MINOR_TOTAL)})`,
    ]},
    { group: '10세 미만 — 가장 이른 증여', tag: '', lines: [
      `${nf(AGES[0].total)}명 중 ${nf(AGES[0].band[1])}명(${pct(AGES[0].band[1], AGES[0].total)})이 <b>5천만 이하</b> 구간에 몰려 있음`,
      `전국 평균 ${pct(ALL[1], TOTAL)} 대비 약 ${((AGES[0].band[1] / AGES[0].total) / (ALL[1] / TOTAL)).toFixed(1)}배 — 어릴수록 소액·정기 증여 성향`,
      `이 구간은 가산액이 증여재산가액의 ${addRate(1)}뿐이라 대부분 <b>이번에 받은 금액</b>입니다 — 미성년 공제한도(10년 2천만원)를 갓 넘긴 증여가 여기 모입니다`,
    ]},
    { group: '증여의 절반 이상이 소액', tag: '', lines: [
      `<b>1억 이하</b> 누계 ${nf(cum(ALL, 2))}명 — 전체의 ${pct(cum(ALL, 2), TOTAL)}`,
      `<b>5천만 이하</b> 누계 ${nf(cum(ALL, 1))}명 (${pct(cum(ALL, 1), TOTAL)}), <b>3억 이하</b>까지 넓히면 ${pct(cum(ALL, 3), TOTAL)}`,
      '건수 기준으로는 대형 자산가가 아니라 생활형 증여가 다수',
    ]},
    { group: '고액 증여는 소수', tag: '', lines: [
      `<b>10억 초과</b> ${nf(TOTAL - cum(ALL, 5))}명 — 전체의 ${pct(TOTAL - cum(ALL, 5), TOTAL)}`,
      `<b>50억 초과</b>는 ${nf(ALL[9])}명 (${pct(ALL[9], TOTAL)})`,
      `반면 금액 기준 증여재산가액은 ${jo(Y.증여재산가액)}, 건당 평균 ${perCase(Y.증여재산가액, Y.건수)} — 소수 고액 건이 금액을 끌어올림`,
    ]},
  ],
};

// 분포 막대 — 전국 / 미성년 두 계열
const DIST = [
  { title: '증여재산가액 등 규모별 신고인원 — 전국',
    note: `2025년 신고분 ${nf(TOTAL)}명 · 단위 명`,
    rows: BANDS.map((b, i) => ({ label: b, value: nf(ALL[i]), pct: (ALL[i] / TOTAL * 100).toFixed(1) })) },
  { title: '같은 분포 — 미성년(20세 미만) 수증인만',
    note: `${nf(MINOR_TOTAL)}명 · 전체의 ${pct(MINOR_TOTAL, TOTAL)} · 단위 명`,
    hl: true,
    rows: BANDS.map((b, i) => ({ label: b, value: nf(MINOR_BAND[i]), pct: (MINOR_BAND[i] / MINOR_TOTAL * 100).toFixed(1) })) },
];

// 로우 데이터 표의 컬럼 이름을 그대로 풀어주는 용어 설명
const TERMS = {
  title: '용어 풀이',
  items: [
    `<b>증여재산가액</b> — 이번 증여로 받은 재산의 <b>세법상 평가액</b>. 신고한 증여금액이 맞지만, 현금은 액면 그대로인 반면 부동산·비상장주식은 시가(매매사례가·감정가액, 없으면 기준시가)로 평가한 값이 들어갑니다. <b>이번 증여 건만</b> 담깁니다.`,
    `<b>증여재산가산액</b> — 이번 증여 전 10년 이내에 같은 사람(직계존속이면 그 배우자 포함)에게 받은 증여재산의 합계(1천만원 이상일 때). 2025년 ${jo(Y.가산액)}으로 증여재산가액 ${jo(Y.증여재산가액)}의 <b>${pct(Y.가산액, Y.증여재산가액)}</b>에 이릅니다 — 이미 받아본 사람이 또 받는 경우가 그만큼 많습니다.`,
    `<b>증여세과세가액</b> — 증여재산가액 − 비과세 − 과세가액불산입 − 채무(부담부증여로 떠안은 빚) + 가산액. 2025년 ${jo(Y.과세가액)}.`,
    `<b>증여재산공제</b> — 관계별로 세금을 매기지 않고 빼주는 금액(10년 합산 한도). 배우자 6억, 직계존비속 5천만(미성년 2천만), 그 밖의 친족 1천만, 혼인·출산 각 1억. <b>실제 증여한 금액이 아닙니다.</b>`,
    `<b>과세표준</b> — 과세가액에서 증여재산공제 등을 뺀 금액. 여기에 세율 10~50%를 곱해 <b>산출세액</b>이 나옵니다.`,
    `<b>자진납부할세액</b> — 산출세액에서 징수유예·감면과 세액공제(기납부세액공제, 신고세액공제 3% 등)를 뺀, 실제로 내는 돈. 2025년 ${jo(Y.자진납부세액)}.`,
  ],
};

const METRICS = [
  { group: '누적 분포 (전국 · 이하 누계 비중)', items: [
    { label: '1천만 이하', value: pct(cum(ALL, 0), TOTAL), delta: `${nf(cum(ALL, 0))}명` },
    { label: '5천만 이하', value: pct(cum(ALL, 1), TOTAL), delta: `${nf(cum(ALL, 1))}명` },
    { label: '1억 이하', value: pct(cum(ALL, 2), TOTAL), delta: `${nf(cum(ALL, 2))}명` },
    { label: '3억 이하', value: pct(cum(ALL, 3), TOTAL), delta: `${nf(cum(ALL, 3))}명` },
    { label: '10억 이하', value: pct(cum(ALL, 5), TOTAL), delta: `${nf(cum(ALL, 5))}명` },
    { label: '10억 초과', value: pct(TOTAL - cum(ALL, 5), TOTAL), delta: `${nf(TOTAL - cum(ALL, 5))}명` },
  ]},
  { group: '수증인 연령별 신고인원', items: [
    ...AGES.map(a => ({ label: a.name, value: `${nf(a.total)}명`, delta: `${pct(a.total, TOTAL)} · 1억 이하 ${pct(cum(a.band, 2), a.total)}` })),
    { label: YOUTH.name, value: `${nf(YOUTH.total)}명`, delta: `${pct(YOUTH.total, TOTAL)} · 연령 구간과 중복` },
  ]},
  { group: '증여 금액 지표 (보조 · 국세통계 6.3.1)', items: [
    { label: '증여재산가액', value: jo(Y.증여재산가액), delta: `건당 평균 ${perCase(Y.증여재산가액, Y.건수)}` },
    { label: '증여재산공제 소계', value: jo(Y.공제_소계), delta: `직계존비속 ${pct(Y.공제_직계존비속, Y.공제_소계)}` },
    { label: '혼인·출산 공제', value: jo(Y.공제_혼인 + Y.공제_출산), delta: `공제의 ${pct(Y.공제_혼인 + Y.공제_출산, Y.공제_소계)}` },
    { label: '10년 합산 가산액', value: jo(Y.가산액), delta: `과세가액의 ${pct(Y.가산액, Y.과세가액)}` },
    { label: '과세표준', value: jo(Y.과세표준), delta: `공제 ${jo(Y.공제_소계)} 차감 후` },
    { label: '자진납부세액', value: jo(Y.자진납부세액), delta: `세액공제 ${jo(Y.세액공제_소계)} 반영` },
  ]},
];

const RAW = [
  { title: '2025년 증여재산가액 등 규모별 신고인원 — 전국',
    note: '단위: 명 · 출처 국세통계 6.3.3',
    columns: ['구간', '인원', '비중', '이하 누계 비중'],
    rows: BANDS.map((b, i) => [b, nf(ALL[i]), pct(ALL[i], TOTAL), pct(cum(ALL, i), TOTAL)])
      .concat([['합계', nf(TOTAL), '100.0%', '100.0%']]) },
  { title: '2025년 구간별 실제 증여액·가산액·세금',
    note: '금액 단위: 백만원 · 모든 구간에서 산출세액 > 0(과세미달 제외의 근거) · 출처 국세통계 6.3.2 증여세 신고 현황Ⅱ',
    columns: ['구간', '신고건수', '증여재산가액', '건당 증여액', '가산액', '가산액 비중', '건당 공제', '산출세액', '건당 세액'],
    rows: BANDS.map((b, i) => {
      const [cnt, amt, add, ded, , tax] = TAXB[i];
      return [b, nf(cnt), nf(amt), perOne(amt, cnt), nf(add), addRate(i), perOne(ded, cnt), nf(tax), perOne(tax, cnt)];
    }) },
  { title: '2025년 수증인 연령별 × 규모별 신고인원',
    note: '단위: 명 · 청년은 연령 구간과 중복되는 재분류 항목 · 출처 국세통계 6.3.3',
    columns: ['연령', '합계', ...BANDS],
    rows: [
      ...AGES.map(a => [a.name, nf(a.total), ...a.band.map(nf)]),
      ['미성년 계(20세 미만)', nf(MINOR_TOTAL), ...MINOR_BAND.map(nf)],
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
    age: PI_POINTS, dist: DIST, metrics: METRICS, terms: TERMS, raw: RAW, sources: SOURCES,
  });
}
