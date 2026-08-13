/**
 * 파이 앱 새 리뷰 메일 알림 — Google Apps Script (30분 주기)
 *
 * 30분마다 리뷰 목록을 확인해, 아직 안 보낸 리뷰가 있으면 그것만 메일로 보낸다.
 * 보낸 리뷰는 스크립트 저장소(PropertiesService)에 기록해 두므로 같은 리뷰가
 * 두 번 오지 않는다.
 *
 * 왜 Vercel 크론이 아니라 여기서 하나:
 *   - Vercel Hobby 플랜은 크론이 하루 1회가 최대다(30분 주기는 배포 자체가 실패).
 *   - 30분 주기로 하려면 '이미 보낸 리뷰' 기록이 필요한데, 서버리스에는 저장소가 없다.
 *     Apps Script는 PropertiesService라는 저장소를 기본 제공한다.
 *   - 덤으로 본인 Gmail로 나가서 회사 메일함에서 스팸 처리될 확률이 가장 낮다.
 *
 * ── 설치 (한 번만) ──────────────────────────────────────────
 *  1. https://script.google.com 접속 → '새 프로젝트'
 *  2. 편집기 내용을 모두 지우고 이 파일 전체를 붙여넣기
 *  3. 아래 TO 값에 받는 사람을 넣고 저장(⌘S)
 *  4. 상단에서 함수 'testSend' 선택 → '실행'
 *     → 최초 1회 권한 승인 창이 뜬다. '고급' → '(안전하지 않음)으로 이동' → 허용
 *       (본인이 만든 스크립트라 정상이다. Gmail 발송 권한을 주는 절차)
 *     → 테스트 메일이 오면 설정 성공
 *  5. 왼쪽 시계 아이콘(트리거) → '트리거 추가'
 *       실행할 함수: checkNewReviews
 *       이벤트 소스: 시간 기반
 *       트리거 유형: 분 단위 타이머
 *       간격: 30분마다
 *     → 저장
 *
 * 첫 실행은 '지금 있는 리뷰'를 기준선으로 기록만 하고 메일을 보내지 않는다.
 * 그 이후에 올라온 리뷰부터 알림이 온다.
 */

// 받는 사람 (쉼표로 구분). 이 저장소는 공개라 실제 주소를 넣지 않는다 —
// 붙여넣은 뒤 Apps Script 편집기에서만 채운다.
var TO = 'name1@example.com,name2@example.com';

var API = 'https://gift-tax-news.vercel.app/api/reviews';
var APP_URL = 'https://gift-tax-news.vercel.app/#reviews';
var PROP_KEY = 'sentReviewIds';
var KEEP = 200;   // 기록해 둘 리뷰 수. 저장소 한도(9KB)를 넘지 않게 제한한다

var STORE_NAME = { play: 'Google Play', apple: 'App Store' };

/** 리뷰 하나를 짧은 문자열로 식별한다. 저장 용량을 아끼려고 해시를 쓴다. */
function reviewId(r) {
  var s = [r.date, r.store, r.author, String(r.text || '').slice(0, 40)].join('|');
  var h = 0;
  for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h.toString(36);
}

function checkNewReviews() {
  var res = UrlFetchApp.fetch(API, { muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) {
    Logger.log('리뷰 조회 실패 %s', res.getResponseCode());
    return;
  }
  var reviews = (JSON.parse(res.getContentText()).reviews) || [];
  if (!reviews.length) { Logger.log('리뷰 없음'); return; }

  var props = PropertiesService.getScriptProperties();
  var saved = props.getProperty(PROP_KEY);

  // 최초 실행: 기존 리뷰를 한꺼번에 보내면 곤란하므로 기준선만 잡는다
  if (saved === null) {
    props.setProperty(PROP_KEY, JSON.stringify(reviews.map(reviewId).slice(0, KEEP)));
    Logger.log('최초 실행 — 기존 %s건을 기준선으로 기록 (메일 미발송)', reviews.length);
    return;
  }

  var sent = JSON.parse(saved);
  var sentSet = {};
  for (var i = 0; i < sent.length; i++) sentSet[sent[i]] = true;

  var fresh = reviews.filter(function (r) { return !sentSet[reviewId(r)]; });
  if (!fresh.length) { Logger.log('새 리뷰 없음'); return; }

  MailApp.sendEmail({
    to: TO,
    subject: buildSubject(fresh),
    htmlBody: buildBody(fresh),
    name: '파이 모니터링',
  });

  // 이번에 보낸 것 + 기존 기록을 합쳐 최근 것부터 KEEP개만 남긴다
  var merged = reviews.map(reviewId).concat(sent);
  var uniq = [], seen = {};
  for (var j = 0; j < merged.length && uniq.length < KEEP; j++) {
    if (!seen[merged[j]]) { seen[merged[j]] = true; uniq.push(merged[j]); }
  }
  props.setProperty(PROP_KEY, JSON.stringify(uniq));

  Logger.log('%s건 발송 → %s', fresh.length, TO);
}

function buildSubject(list) {
  var low = list.filter(function (r) { return r.rating <= 2; }).length;
  return '[파이] 새 앱 리뷰 ' + list.length + '건' + (low ? ' (낮은 평점 ' + low + '건)' : '');
}

function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildBody(list) {
  var rows = list.map(function (r) {
    var stars = repeat('★', r.rating) + repeat('☆', Math.max(0, 5 - r.rating));
    return '<tr><td style="padding:14px 0;border-bottom:1px solid #e4e8f0">'
      + '<div style="font-size:13px;color:#8992a4">' + stars
      + ' &nbsp;·&nbsp; ' + esc(STORE_NAME[r.store] || r.store)
      + (r.version ? ' &nbsp;·&nbsp; v' + esc(r.version) : '')
      + ' &nbsp;·&nbsp; ' + esc(r.date) + '</div>'
      + (r.title ? '<div style="font-size:15px;font-weight:700;margin:4px 0 2px">' + esc(r.title) + '</div>' : '')
      + '<div style="font-size:14px;line-height:1.65;color:#161b27;margin-top:4px">' + esc(r.text) + '</div>'
      + '<div style="font-size:12px;color:#8992a4;margin-top:6px">' + esc(r.author) + '</div>'
      + '</td></tr>';
  }).join('');

  return '<div style="max-width:640px;margin:0 auto;padding:24px;'
    + 'font-family:-apple-system,\'Apple SD Gothic Neo\',\'Malgun Gothic\',sans-serif">'
    + '<div style="font-size:12px;letter-spacing:.1em;color:#2f6fd0;font-weight:600">PI APP REVIEW</div>'
    + '<h1 style="font-size:20px;margin:8px 0 4px">새 리뷰 ' + list.length + '건</h1>'
    + '<table style="width:100%;border-collapse:collapse;margin-top:12px">' + rows + '</table>'
    + '<div style="margin-top:22px;font-size:13px">'
    + '<a href="' + APP_URL + '" style="color:#2f6fd0">모니터링에서 전체 보기 →</a></div></div>';
}

function repeat(s, n) { var o = ''; for (var i = 0; i < n; i++) o += s; return o; }

/** 설치 확인용. 실제 최신 리뷰 1건을 샘플로 보내본다. */
function testSend() {
  var res = UrlFetchApp.fetch(API, { muteHttpExceptions: true });
  var reviews = (JSON.parse(res.getContentText()).reviews) || [];
  MailApp.sendEmail({
    to: TO,
    subject: '[파이] 리뷰 알림 설정 테스트',
    htmlBody: '<p>이 메일이 보이면 설정이 끝난 것입니다. 이후로는 <b>새 리뷰가 올라올 때만</b> 발송됩니다.</p>'
            + (reviews.length ? '<p>아래는 현재 최신 리뷰 미리보기입니다.</p>' + buildBody(reviews.slice(0, 2)) : ''),
    name: '파이 모니터링',
  });
  Logger.log('테스트 발송 → %s', TO);
}

/** 기록을 지운다. 다음 실행이 '최초 실행'처럼 기준선만 다시 잡는다. */
function resetSeen() {
  PropertiesService.getScriptProperties().deleteProperty(PROP_KEY);
  Logger.log('기록 초기화 완료');
}
