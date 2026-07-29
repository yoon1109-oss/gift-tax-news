// 증권사 자녀계좌 개설 이벤트 — 수기 큐레이션 데이터.
// 대부분 증권사 이벤트 페이지가 봇 차단/동적렌더/EUC-KR/앱전용이라 자동 수집이 불가하여
// 여기 배열을 직접 갱신한다. (매주 월요일 10시 스케줄 갱신 대상)
const UPDATED_AT = '2026-07-29'; // 데이터가 실제 바뀐 날 (정리 기준)
const CHECKED_AT = '2026-07-29'; // 마지막으로 재조사·확인한 날 (변경 없어도 갱신)

// 업데이트 메모 — 이벤트 '내용이 실제로 바뀐 것'만 최신순으로 기록 (배치가 변경 시 맨 앞에 추가)
const CHANGES = [
  { date: '2026-07-27', text: '미래에셋 이벤트 기간이 2026년 12월 31일까지 연장되었어요' },
];

// 진행중 확정 이벤트
const EVENTS = [
  {
    broker: '미래에셋증권',
    title: '우리아이 부자만들기',
    period: '2026.07.01 ~ 2026.12.31',
    benefits: [
      '자녀 다이렉트 주식계좌 첫 개설 시 용돈 2만원 (개설 후 15일 내 신청)',
      '90일간 국내주식 90만원 이상 모으기 달성 시 2만원 추가 (챌린지 ~2026.10.31)',
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
    title: '미성년 자녀계좌 통합 메뉴 오픈 기념 이벤트',
    period: '2026.07.21 ~ 2026.08.15',
    benefits: [
      '미성년 자녀계좌 개설 + 부모 약정대리인 등록·연동 완료 시 모바일 커피쿠폰 (전원)',
      '자녀계좌로 국내주식 100만원 이상 순매수 시 30명 추첨 백화점상품권 1만원',
    ],
    domesticFee: '',
    usFee: '',
    link: 'https://securities.koreainvestment.com/main/customer/notice/Event.jsp?gubun=i&cmd=TF04gb010002&currentPage=1&num=6518',
  },
  {
    broker: '우리투자증권',
    title: '우리아이 계좌개설 이벤트',
    period: '2026.06.12 ~ 2026.07.31',
    benefits: [
      '우리 아이 첫 계좌(미성년 자녀) 개설 시 코스닥150 ETF 2주 선물',
    ],
    domesticFee: '',
    usFee: '',
    link: 'https://fundsupermarket.wooriib.com/fmg/FMG4030002/main.do?articleNo=274',
  },
  {
    broker: 'SK증권',
    title: '우리 아이 미래 투자',
    period: '2026.07.01 ~ 2026.07.31',
    benefits: [
      '스마트금융센터(비대면) 신규 미성년 계좌 개설 + 순입금·국내주식 거래 실적 구간별 현금 지급 (최대 8만원)',
      '부모 명의 SK증권 계좌 보유 필수',
    ],
    domesticFee: '',
    usFee: '',
    link: 'https://direct-sks.co.kr/account_underage',
  },
];

// 추가 조사 대상 — 현재 진행 여부 미확정 (status: 확인필요 | 미발견 | 해당없음)
const PENDING = [
  { broker: '대신증권', status: '확인필요', note: '2024.03 미성년 비대면 계좌 이벤트(종료). 현재는 일반 신규고객 대상만', link: 'https://www.daishin.com/g.ds?m=1109&p=12931&v=12831' },
  { broker: '유안타증권', status: '확인필요', note: '2024.05 ‘가정의 달 자녀계좌개설’(선착순 100명 2만원, 종료)', link: 'https://www.myasset.com' },
  { broker: 'KB증권', status: '확인필요', note: '2023 ‘우리아이 부자만들기’(종료). 미성년 비대면 서비스는 상시 운영', link: 'https://m.kbsec.com/go.able?linkcd=m06110000' },
  { broker: '신영증권', status: '미발견', note: '미성년 특화 이벤트 정보 없음', link: '' },
  { broker: '메리츠증권', status: '해당없음', note: '슈퍼365는 만 19세 이상. 미성년 특화 이벤트 없음', link: '' },
  { broker: 'DB증권 (구 DB금융투자)', status: '확인필요', note: '‘우리아이 비대면 계좌 만들기’(미국주식 소수점 최대 5만원) — 기간 미확인', link: 'https://www.dbsec.co.kr/custcenter/notices/cu_NoticesEvent_lst.do' },
  { broker: '하나증권', status: '확인필요', note: '2026.05.07~08.31 신규 계좌개설 이벤트 진행 중 (미성년 특화 여부 확인 필요)', link: 'https://www.hanaw.com' },
  { broker: 'IBK투자증권', status: '미발견', note: '미성년은 영업점 개설, 특화 이벤트 없음', link: '' },
  { broker: '한화투자증권', status: '미발견', note: '미성년 특화 이벤트 정보 없음', link: '' },
  { broker: '신한투자증권', status: '확인필요', note: '2024 미성년 이벤트 다수(종료). 자녀계좌 개설 상시 운영', link: 'https://m.shinhansec.com/mweb/acct/cact/amact0015' },
  { broker: '현대차증권', status: '미발견', note: '현대차 제휴 신규계좌(7/10~10/9)는 미성년 특화 아님', link: '' },
  { broker: '유진투자증권', status: '미발견', note: '미성년 특화 이벤트 정보 없음', link: '' },
  { broker: '교보증권', status: '미발견', note: '미성년 특화 이벤트 정보 없음', link: '' },
  { broker: '키움증권', status: '확인필요', note: '‘우리아이 국내주식 더모으기’(2025 종료) 등 정기 운영사. 2026 현재분 미확인', link: 'https://www.kiwoom.com/e/m/home/event/VEvent20230038View' },
  { broker: 'NH투자증권 (나무)', status: '확인필요', note: '자녀 주식모으기 이벤트 이력(2026.06.30 종료). 현행 여부 재확인 필요', link: 'https://www.mynamuhbegin.com/children' },
];

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  res.status(200).json({ updatedAt: UPDATED_AT, checkedAt: CHECKED_AT, events: EVENTS, pending: PENDING, changes: CHANGES });
}
