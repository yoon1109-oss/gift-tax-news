/**
 * 파이 앱 새 리뷰 메일 알림 — Google Apps Script 버전
 *
 * 외부 메일 서비스에 가입하지 않고 본인 Gmail로 보낸다. 회사 메일함에서
 * 스팸 처리될 확률이 가장 낮은 방법이다.
 *
 * 무엇을 보낼지는 서버(/api/review-alert?dry=1)가 정하고, 이 스크립트는
 * 그 결과를 받아 발송만 한다. 알림 내용이나 조건을 바꿀 일이 생겨도
 * 이 스크립트는 손댈 필요가 없다.
 *
 * ── 설치 (한 번만) ──────────────────────────────────────────
 *  1. https://script.google.com 접속 → '새 프로젝트'
 *  2. 편집기 내용을 모두 지우고 이 파일 전체를 붙여넣기
 *  3. 아래 TO 값에 받는 사람을 넣고 저장(⌘S)
 *  4. 상단에서 함수 'sendReviewAlert' 선택 → '실행'
 *     → 최초 1회 권한 승인 창이 뜬다. '고급' → '(안전하지 않음)으로 이동' → 허용
 *       (본인이 만든 스크립트라 정상이다. Gmail 발송 권한을 주는 절차)
 *  5. 왼쪽 시계 아이콘(트리거) → '트리거 추가'
 *       실행할 함수: sendReviewAlert
 *       이벤트 소스: 시간 기반
 *       트리거 유형: 일 단위 타이머
 *       시간: 오전 9시~10시
 *     → 저장
 *
 * 이걸로 끝. 매일 아침 어제 올라온 리뷰가 있으면 메일이 온다.
 */

// 받는 사람 (쉼표로 구분). 이 저장소는 공개라 실제 주소를 넣지 않는다 —
// 붙여넣은 뒤 Apps Script 편집기에서만 채운다.
var TO = 'name1@example.com,name2@example.com';

// 서버가 CRON_SECRET을 설정한 경우에만 채운다. 안 썼으면 빈 문자열로 둔다.
var SECRET = '';

var ENDPOINT = 'https://gift-tax-news.vercel.app/api/review-alert?dry=1';

function sendReviewAlert() {
  var options = { muteHttpExceptions: true };
  if (SECRET) options.headers = { Authorization: 'Bearer ' + SECRET };

  var res = UrlFetchApp.fetch(ENDPOINT, options);
  if (res.getResponseCode() !== 200) {
    Logger.log('요청 실패 %s: %s', res.getResponseCode(), res.getContentText().slice(0, 300));
    return;
  }

  var data = JSON.parse(res.getContentText());
  if (!data.found) {                       // 어제 등록된 리뷰 없음 — 조용히 종료
    Logger.log('%s: 새 리뷰 없음', data.day);
    return;
  }

  MailApp.sendEmail({
    to: TO,
    subject: data.dryRun.subject,
    htmlBody: data.dryRun.html,
    name: '파이 모니터링',
  });
  Logger.log('%s: %s건 발송 → %s', data.day, data.found, TO);
}

/** 설치 확인용. 새 리뷰가 없어도 강제로 한 통 보내본다. */
function testSend() {
  MailApp.sendEmail({
    to: TO,
    subject: '[파이] 리뷰 알림 설정 테스트',
    htmlBody: '<p>이 메일이 보이면 설정이 끝난 것입니다.</p>'
            + '<p>이후로는 새 리뷰가 있는 날에만 발송됩니다.</p>'
            + '<p><a href="https://gift-tax-news.vercel.app/#reviews">앱 리뷰 보기 →</a></p>',
    name: '파이 모니터링',
  });
  Logger.log('테스트 발송 → %s', TO);
}
