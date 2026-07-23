// 증권사 자녀계좌 개설 이벤트 — 수기 큐레이션 데이터.
// 대부분 증권사 이벤트 페이지가 봇 차단/동적렌더/앱전용이라 자동 수집이 불가하여
// 여기 배열을 직접 갱신한다. (updatedAt: 마지막 정리일)
const UPDATED_AT = '2026-06-22';

const EVENTS = [
  {
    broker: '미래에셋증권',
    period: '2026.03.30 ~ 2026.07.31',
    benefits: [
      '계좌개설 시 용돈 2만원 (사용기간 2주)',
      '국내주식 90일간 90만원 이상 모으기 챌린지 달성 시 추가 2만원',
    ],
    domesticFee: '90일간 0% 면제 → 91일~1년 0.0036396% 우대',
    usFee: '',
    link: 'https://digital.securities.miraeasset.com/rich/',
  },
  {
    broker: '삼성증권',
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
    period: '~ 2026.12.31 (연중)',
    benefits: [
      '미성년 자녀 명의 계좌개설 시 2만원 (자녀 1인당 생애 1회)',
    ],
    domesticFee: '',
    usFee: '',
    link: 'https://toss.im/tossfeed/article/securities-child',
  },
  {
    broker: 'SK증권',
    period: '2026.06.01 ~ 2026.06.30',
    benefits: [
      '이벤트기간 순입금 1천만원 이상 시 2만원',
      '순입금 5천만원 이상 시 5만원',
      '※ 순입금액 = 입금액 − 출금액',
    ],
    domesticFee: '',
    usFee: '',
    link: 'https://direct-sks.co.kr/account_underage',
  },
  {
    broker: '나무증권 (NH투자증권)',
    period: '2026.01.01 ~ 2026.06.30',
    benefits: [
      '주식모으기(국내주식) 수수료 무료',
    ],
    domesticFee: '',
    usFee: '',
    link: 'https://www.mynamuhbegin.com/children',
  },
  {
    broker: '한국투자증권',
    period: '2026.06.01 ~ 2026.06.30',
    benefits: [
      '국내주식 KOSPI200 종목 1+1주 전원 지급',
      '네이버페이 5천원 전원 지급',
      '월 19만원 이상 국내주식 순매수 고객 중 19명 추첨 기프티콘',
      '월 100만원 이상 순매수 시 전원 네이버페이 1만원',
    ],
    domesticFee: '',
    usFee: '',
    link: 'https://www.truefriend.com/main/customer/notice/Event.jsp?gubun=i',
  },
  {
    broker: '우리투자증권',
    period: '2026.06.12 ~ 2026.07.31',
    benefits: [
      '코스닥150 ETF 랜덤 2주 증정 (약 4만원 상당)',
    ],
    domesticFee: '',
    usFee: '',
    link: 'https://fundsupermarket.wooriib.com/fmg/FMG4030002/main.do?articleNo=274',
  },
];

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  res.status(200).json({ updatedAt: UPDATED_AT, events: EVENTS });
}
