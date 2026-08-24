// 증권사 자녀계좌 개설 이벤트 — 수기 큐레이션 데이터.
// 대부분 증권사 이벤트 페이지가 봇 차단/동적렌더/EUC-KR/앱전용이라 자동 수집이 불가하여
// 여기 배열을 직접 갱신한다. (매주 월요일 10시 스케줄 갱신 대상)
const UPDATED_AT = '2026-08-24'; // 데이터가 실제 바뀐 날 (정리 기준)
const CHECKED_AT = '2026-08-24'; // 마지막으로 재조사·확인한 날 (변경 없어도 갱신)

// 업데이트 메모 — 이벤트 '내용이 실제로 바뀐 것'만 최신순으로 기록 (배치가 변경 시 맨 앞에 추가)
const CHANGES = [
  { date: '2026-08-24', text: '미래에셋증권 \'90만원 모으기 2만원 추가\' 챌린지는 신청이 7월 31일로 마감됐어요. 지금 계좌를 새로 여시면 개설 축하금 2만원과 수수료 90일 무료는 그대로 받으실 수 있어요' },
  { date: '2026-08-10', text: '한국투자증권 이벤트가 2건으로 늘었어요 — 8월 새로 시작한 「우리아이 첫 투자」(~9/30, 주식 1+1주 + 매수쿠폰 2만원)와 「주식모으기 시즌2」(~10/8, 미성년 용돈 1만원 + 축하금, 최대 10만원)' },
  { date: '2026-08-10', text: 'SK증권 이벤트에 국내주식 1억원 이상 거래 시 받는 5만원 혜택이 빠져 있어 추가했어요 (합쳐서 최대 10만원)' },
  { date: '2026-08-03', text: '키움증권 미성년자계좌개설 이벤트(~9/30)가 확인되어 새로 추가했어요' },
  { date: '2026-08-03', text: 'SK증권 이벤트가 8월분(8/1~8/31, 최대 5만원)으로 갱신되었어요' },
  { date: '2026-08-03', text: '우리투자증권 이벤트가 종료되어 목록에서 내렸어요' },
];

// 진행중 확정 이벤트
const EVENTS = [
  {
    broker: '미래에셋증권',
    title: '우리아이 부자만들기',
    period: '2026.07.01 ~ 2026.12.31',
    benefits: [
      '자녀 다이렉트 주식계좌 첫 개설 시 용돈 2만원 (개설 후 15일 내 신청)',
      '90일간 국내주식 90만원 이상 모으기 달성 시 2만원 추가 — 챌린지 신청은 2026.07.31 마감(기존 신청자만 10.31까지 달성 가능)',
    ],
    domesticFee: '국내주식 온라인 수수료 90일 무료',
    usFee: '',
    link: 'https://digital.securities.miraeasset.com/rich/',
  },
  {
    broker: '삼성증권',
    title: '자녀자산관리 서비스 출시 이벤트',
    period: '2026.05.04 ~ 2026.10.30',
    benefits: [
      '계좌개설 1만원',
      '신규 미성년 고객 국내주식 투자지원금 2만원 (선착순 1.5만명)',
      '아동수당 수령계좌 변경 시 투자지원금 2만원',
      '자녀계좌 총잔고 100만원 이상 시 코스피200 종목 1주 추첨',
    ],
    domesticFee: '',
    usFee: '',
    link: 'https://www.samsungpop.com/customer/guide.do?cmd=event_view&menuNo=01010900&MenuSeqNo=3803',
  },
  {
    broker: '토스증권',
    title: '우리 아이 생애 첫 계좌 만들기',
    period: '~ 2026.12.31 (연중)',
    benefits: [
      '미성년 자녀 명의 계좌개설 시 2만원 (자녀 1인당 생애 1회)',
    ],
    domesticFee: '',
    usFee: '',
    link: 'https://toss.im/tossfeed/article/securities-child',
  },
  {
    broker: '한국투자증권',
    title: '우리아이 첫 투자, 한국투자증권과 함께!',
    period: '2026.08.01 ~ 2026.09.30',
    benefits: [
      '만 19세 미만 뱅키스(BanKIS) 주식계좌 최초 신규 개설 대상 (이벤트 신청·마케팅 동의 필수, 영업점 계좌 제외)',
      '개설만 해도 KOSPI200 종목 중 추첨해 1+1주 100% 지급',
      '주식 지급 이벤트 신청·추첨 시 국내주식 매수 쿠폰 2만원 추가 (중복 적용, 7일 내 미사용분 회수)',
    ],
    domesticFee: '',
    usFee: '',
    link: 'https://securities.koreainvestment.com/main/customer/notice/Event.jsp?gubun=i&cmd=TF04gb010002&currentPage=1&num=6518',
  },
  {
    broker: '한국투자증권',
    title: '주식모으기 이벤트 시즌2 — 함께 모으면 더블 혜택',
    period: '2026.08.10 ~ 2026.10.08',
    benefits: [
      '미성년계좌로 이벤트 신청 시 용돈 투자지원금 1만원 즉시 지급 (선착순 5천명, 30일 내 미사용 시 회수)',
      '주식모으기 10회 이상(소수점 포함) 축하금 3만원 500명 / 2회 이상 & 50만원 이상 5만원 500명 추첨',
      '자녀 + 부모가 각각 신청해 모으기 1건씩 체결하면 100명 추첨해 각 1만원씩 (미성년 계좌개설 시 등록된 부모만 인정)',
      '조건 충족 시 최대 10만원',
    ],
    domesticFee: '',
    usFee: '',
    link: 'https://securities.koreainvestment.com/main/customer/notice/Event.jsp?gubun=i',
  },
  {
    broker: '키움증권',
    title: '미성년자계좌개설 이벤트',
    period: '~ 2026.09.30',
    benefits: [
      '비대면 위탁종합계좌(앱·웹) 개설 + 이벤트 신청 시 국내 ETF 지급 (개설·신청 완료일 기준 1개월 내)',
    ],
    domesticFee: '',
    usFee: '',
    link: 'https://www.kiwoom.com/e/m/home/event/VEvent20260076View',
  },
  {
    broker: 'SK증권',
    title: '우리 아이 미래 투자',
    period: '2026.08.01 ~ 2026.08.31',
    benefits: [
      '스마트금융센터(비대면) 신규 미성년 계좌 개설 + 순입금 시 최대 5만원 현금',
      '순입금 조건 충족 후 국내주식 1억원 이상 거래 시 5만원 추가 (합산 최대 10만원)',
      '부모 명의 SK증권 계좌 보유 필수',
    ],
    domesticFee: '',
    usFee: '',
    link: 'https://direct-sks.co.kr/account_underage',
  },
];

// 친구 초대·추천 이벤트 (별도 탭). 증권사는 자본시장법상 재산상 이익 제공 제한이 있어
// 이 유형 자체가 드물다. 확정 건만 REFERRAL에, 확인 안 된 건 REFERRAL_PENDING에 둔다.
// 조사 결과 '미발견'인 곳은 목록에 남기지 않는다 (사용자 요청 2026-08-10).
const REFERRAL = [
  {
    broker: '신한투자증권',
    title: '신한 슈퍼SOL 신규 가입·친구 초대 이벤트',
    period: '2026.07.01 ~ 2026.09.30',
    benefits: [
      '친구 초대 후 친구가 신규 가입 시 — 초대한 사람 네이버페이 포인트 1,000원',
      '초대받은 친구 네이버페이 포인트 2,000원 (신규 가입 혜택과 중복 수령)',
      '신규 가입 혜택: 계좌 보유자 국내주식쿠폰 5,000원 / 미보유자 네이버페이 포인트 5,000원',
      '초대 실적 상위 20명 아이패드 1대',
    ],
    link: 'https://m.shinhansec.com/mweb/anev/evnt/aevnt0001?tab=1',
  },
];

// 친구 초대 이벤트 — 확인 필요 (공식 확인이 안 된 건만. '미발견'은 목록에 두지 않음)
const REFERRAL_PENDING = [
  { broker: '한국투자증권', status: '확인필요', note: '공식 이벤트 게시판 전체검색에서 ‘친구’·‘추천’ 모두 0건. 다만 비대면 계좌개설(뱅키스) 절차에 추천인 코드 입력란이 있어 앱 내 별도 운영 가능성 — 앱에서 재확인 필요', link: 'https://securities.koreainvestment.com/main/customer/notice/Event.jsp?gubun=i' },
  { broker: '키움증권', status: '확인필요', note: '신규고객 이벤트(~2026.08.27)에 ‘친구에게 공유 시 혜택 상향’ 언급이 블로그에 있으나 공식 페이지에서 확인되지 않음', link: 'https://www.kiwoom.com/e/m/common/event/VIngEventView' },
  { broker: '삼성증권', status: '확인필요', note: '이벤트 목록이 비로그인 상태에서 조회되지 않아 판독 불가', link: 'https://www.samsungpop.com/customer/event.do' },
];

// 추가 조사 대상 — 현재 진행 여부 미확정 (status: 확인필요 | 미발견 | 해당없음)
const PENDING = [
  { broker: '대신증권', status: '확인필요', note: '2024.03 미성년 비대면 계좌 이벤트(종료). 현재는 일반 신규고객 대상만', link: 'https://www.daishin.com/g.ds?m=1109&p=12931&v=12831' },
  { broker: '유안타증권', status: '확인필요', note: '2024.05 ‘가정의 달 자녀계좌개설’(선착순 100명 2만원, 종료)', link: 'https://www.myasset.com' },
  { broker: 'KB증권', status: '확인필요', note: '우리아이계좌개설 상시 운영 + 신규계좌 주식쿠폰 최대 3.5만원(미성년 한정 여부·기간 미확정)', link: 'https://m.kbsec.com/go.able?linkcd=m06110000' },
  { broker: '신영증권', status: '미발견', note: '미성년 특화 이벤트 정보 없음', link: '' },
  { broker: '메리츠증권', status: '해당없음', note: '슈퍼365는 만 19세 이상. 미성년 특화 이벤트 없음', link: '' },
  { broker: 'DB증권 (구 DB금융투자)', status: '확인필요', note: '‘우리아이 비대면 계좌 만들기’(미국주식 소수점 최대 5만원) — 기간 미확인', link: 'https://www.dbsec.co.kr/custcenter/notices/cu_NoticesEvent_lst.do' },
  { broker: '하나증권', status: '해당없음', note: '2026.05.07~08.31 신규 계좌개설 이벤트는 신규·휴면 고객 대상 일반 이벤트로 미성년 특화 아님 (2026-08-10 확인)', link: 'https://www.hanaw.com' },
  { broker: 'IBK투자증권', status: '미발견', note: '미성년은 영업점 개설, 특화 이벤트 없음', link: '' },
  { broker: '한화투자증권', status: '미발견', note: '미성년 특화 이벤트 정보 없음', link: '' },
  { broker: '신한투자증권', status: '확인필요', note: '자녀계좌 개설 안내만 있고 진행 이벤트 없음 (2026-08-10 확인). 2024 미성년 이벤트는 모두 종료', link: 'https://m.shinhansec.com/mweb/acct/cact/amact0015' },
  { broker: '현대차증권', status: '미발견', note: '현대차 제휴 신규계좌(7/10~10/9)는 미성년 특화 아님', link: '' },
  { broker: '유진투자증권', status: '미발견', note: '미성년 특화 이벤트 정보 없음', link: '' },
  { broker: '교보증권', status: '미발견', note: '미성년 특화 이벤트 정보 없음', link: '' },
  { broker: '우리투자증권', status: '확인필요', note: '우리아이 계좌개설 이벤트(2026.06.12~07.31) 종료. 후속 이벤트 미확인', link: 'https://fundsupermarket.wooriib.com/fmg/FMG4030002/main.do?articleNo=274' },
  { broker: 'NH투자증권 (나무)', status: '확인필요', note: '우리아이 계좌개설 상시 안내만 있고 이벤트 없음. 8월 진행 이벤트는 타사 주식 이전 건으로 미성년 특화 아님 (2026-08-10 확인)', link: 'https://www.mynamuhbegin.com/children' },
];

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1800'); // 이벤트: 주간 갱신
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  res.status(200).json({
    updatedAt: UPDATED_AT, checkedAt: CHECKED_AT,
    events: EVENTS, pending: PENDING, changes: CHANGES,
    referral: REFERRAL, referralPending: REFERRAL_PENDING,
  });
}
