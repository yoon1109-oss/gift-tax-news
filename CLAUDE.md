# CLAUDE.md — 증여 모니터링 (gift-tax-news)

증여·자녀 증여 관련 뉴스/블로그/증권사 계좌 이벤트/세무사회 보도자료를 모아 보여주는 대시보드.

- **배포**: https://gift-tax-news.vercel.app — `git push origin main` 시 Vercel 자동 배포 (반영까지 ~10-30초)
- **저장소**: https://github.com/yoon1109-oss/gift-tax-news (GitHub 계정은 `yoon1109-oss`)
- **공개 기능 정의서**: https://gift-tax-news.vercel.app/guide.html (`guide.html`)

## 구조

프레임워크·package.json 없음. 바닐라 JS + Vercel 서버리스.

```
index.html      전체 UI + JS 인라인 (탭·렌더링·연관도 로직 전부 여기)
guide.html      공개 기능 정의서 (정적)
api/news.js     네이버 뉴스 검색 프록시
api/blog.js     네이버 블로그 검색 프록시
api/likes.js    네이버 블로그 공감수(비공식 경로) 프록시
api/events.js   증권사 자녀계좌 이벤트 — 수기 큐레이션 데이터
api/kacta.js    한국세무사회 보도자료 목록 파싱(EUC-KR)
api/stats.js    증여세 통계 — 국세통계 6.3.1 (2025년 신고분) 하드코딩
api/reviews.js  파이 앱 리뷰 (구글 플레이 batchexecute + 애플 스토어 페이지)
```

## 탭 구조

`onModeChange(mode)` 로 분기. 라디오 `value` = mode.

| 탭 | mode | 내용 |
|----|------|------|
| 뉴스 검색 | `all` / `childfin` / `family` / `platform` / `hanwha` | 키워드 칩 5종 (`자녀 증여` / `자녀 금융` / `가족 자산 관리` / `금융 플랫폼` / `한화생명 파이 증여`) |
| 블로그 검색 | `blog` | 키워드 칩 3종, 30개씩 무한스크롤, 공감수(♥) 표시 |
| 이벤트 | `event` / `referral` | 서브탭 2종 — 계좌 이벤트 / 친구 초대 이벤트. 둘 다 `api/events.js`. 미확인 갱신 배지 有 |
| 앱 리뷰 | `reviews` | `api/reviews.js` — 파이 앱 구글 플레이 + 애플 앱스토어 |
| 세무사회 보도자료 | `press` | 1페이지 15건, 증여·상속·세무대리는 상단 분류 |
| 통계 | `stats` | 증여세 신고 현황 — 유의사항 + 주요 지표 + 요약 타일 + 로우 데이터 |

- 카페 탭은 삭제됨 (`api/cafe.js`는 미사용 잔존)

## 통계 탭 (api/stats.js)

**2025년 신고분 단일 기준.** 연도가 섞이면 안 되므로 KOSIS 자동 연동(2024년 관계별·연령별)은 제거함.

- 원본: 국세통계 6.3.1 증여세 신고 현황Ⅰ(납세지), TASIS에서 xlsx 내려받아 `Y` 객체에 하드코딩 (금액 단위 **백만원**)
- 갱신 시: TASIS에서 새 연도 xlsx 다운로드 → `Y` 값 27개 항목 + 지역 17개 교체 → `BASIS`/`UPDATED_AT` 수정
- xlsx는 `sharedStrings`가 아니라 `inlineStr`(`<is><t>`) 형식이라 파싱 시 주의
- `NOTICE` 3건은 수치 오독 방지용 — **과세미달 제외**(공제한도 이내 무세금 증여는 미집계), 증여재산공제는 실제 증여액이 아님, 직계존비속 공제에 가업승계 5억 포함
- 금액 표기 `jo()`는 1조원 이상만 조 단위, 미만은 억 단위

## 뉴스 연관도 로직 (index.html)

- **검색**: 네이버 뉴스 API `sort=sim`(관련도순), 100건×3 = 최대 300건
- **제외** `isOwnerNews()`: 오너 승계(회장·오너·지분·2~4세·가업/기업승계) + 노이즈(부동산·아파트·주택·근저당·편법증여·대통령·보이스피싱 등). '세무사회장'·'협회장'은 예외로 유지
- **점수** `relatedScore()` — 키워드 묶음 4개, **서로 겹치는 단어가 없어야 함**(겹치면 중복 가산):
  - `REL_GUIDE` 제목+4/본문+2 — 절세·분산 증여·증여 방법 등 증여 실행 정보 (가장 높게 봄)
  - `REL_HIGH` 제목+3/본문+2 — 미성년·자녀·증여·자녀계좌·증여세·사전증여
  - `RELATED_KW` 제목+2/본문+1 — 세금·제도, 손주·직계비속, 자산관리·가족
  - `REL_PROMO` 제목+1만 — 계좌개설·통합 메뉴·이벤트 등. 증권사 상품 보도자료 독식 방지
  - `family` 모드는 `REL_FAMILY`(가족·자산관리) 제목+3/본문+1만 본다. 자녀 신호를 섞으면
    주제가 흐려져 별도 키워드(`childfin`)로 분리했다
  - `childfin`(자녀 금융) 모드는 별도 경로 — `REL_KID` 제목+5/본문+2, `REL_FIN` 제목+3/본문+1,
    둘 다 제목에 있으면 +4, 파이 핵심어(`REL_KID_CORE` 증여·투자·계좌)가 제목이면 +3,
    금융교육(`REL_KID_EDU`)은 +1. **각 묶음은 개념당 1회만 계상**(동의어 나열로 배점이
    부풀지 않게). `REL_KID`의 `아이`는 정규식으로 아이디어·아이폰 등을 배제
  - `platform` 모드는 `REL_PLAT_HIGH`/`REL_PLAT` 별도 경로
- **연관도 상위 4건**: 점수순 + 같은 사건 배제(제목 유사도 0.2 / 제목+본문 0.3 / **주체(회사명) 동일**)
- **배경 배치 후 재선정**: 연관도 섹션은 1차 배치(약 40건)만 보고 그려지므로, 300건을 다 받은 뒤
  `window.scrollY < 200`이면 목록을 다시 그린다. 이게 없으면 2·3차 배치의 상위 기사가 영구 누락됨
- **중복 통합** `assignGroup()`: 회사명 같거나 본문 유사도 0.5↑ → 대표 1건 + `관련 N건` 접기

## 데이터 갱신 (api/events.js)

이벤트가 바뀌면 이 파일만 수정:

- `EVENTS[]` 진행중 확정 / `PENDING[]` 추가 조사 대상 / `CHANGES[]` 업데이트 메모(사용자 노출)
- `REFERRAL[]` / `REFERRAL_PENDING[]` — **친구 초대 이벤트** 탭(`mode='referral'`) 데이터.
  같은 `api/events.js`를 공유하되 화면은 별도 탭. `REFERRAL_PENDING`에는 `확인필요`만 두고
  조사 결과 '미발견'인 곳은 넣지 않는다
- `UPDATED_AT` 데이터가 실제 바뀐 날 / `CHECKED_AT` 마지막 확인일(변경 없어도 갱신)

**미확인 갱신 배지**: `CHANGES`의 **날짜 개수** 기준으로 이벤트 탭에 숫자를 띄운다.
같은 날 여러 건이 바뀌어도 1로 센다. 확인 여부는 `localStorage['giftTax.eventChangesSeen']`
(마지막으로 본 갱신 날짜)에 두므로 **기기·브라우저별로 따로** 관리되고 서버에는 남지 않는다.
첫 방문은 최근 갱신 1건만 알린다. 배지를 띄우려면 탭을 열기 전에 데이터가 필요해
`initEventBadge()`가 시작 시 `/api/events`를 한 번 받아 두고, 그 데이터를 이벤트 탭이 재사용한다.

**원칙 (SK증권 누락 사고 이후)**:
- 어떤 증권사도 **완전 삭제 금지** — EVENTS에서 뺄 땐 반드시 `PENDING`으로 이동
- 기간이 지났다는 이유만으로 만료 처리 금지 — 공식 페이지에서 후속 이벤트 먼저 확인
- 출처 2개 이상 교차 확인된 것만 EVENTS로 승격, 아니면 PENDING 유지

**주간 자동 갱신**: scheduled task `weekly-brokerage-event-refresh` (매주 월 10시 KST)

- 무인 실행이라 임의 셸 명령은 권한 승인에 걸려 즉시 멈춘다 (2026-08-10 실패 원인).
  git·검증·커밋·푸시는 **`scripts/event-sync.sh {pull|check|commit|verify}`** 로만 한다.
  이 스크립트 경로만 `~/.claude/settings.local.json` 허용 목록에 등록돼 있다.
- 증권사 도메인 WebFetch와 브라우저 판독 도구도 같은 파일에 등록해 뒀다. 조사 대상 사이트가
  늘면 `WebFetch(domain:...)` 를 추가해야 무인 실행이 막히지 않는다.
- `event-sync.sh check`는 전체 증권사가 19개 미만이면 실패한다 (완전 삭제 방지 가드).

## 앱 리뷰 (api/reviews.js)

파이 앱: 구글 플레이 `hw.dp.plus` / 애플 `6755743981`.

- **구글**: 공식 공개 API가 없어 플레이스토어 웹의 `batchexecute`(rpcid `UsvDTd`)를 POST로 호출.
  응답은 `)]}'` 접두사 뒤 중첩 JSON — `[0][2]`를 다시 파싱해야 배열이 나온다. 비공식 경로라
  구글이 형식을 바꾸면 깨진다. 평점 요약은 이 응답에 없어 상세 페이지 배지에서 정규식으로 읽는다
- **애플**: RSS(`customerreviews`)가 **빈 피드를 돌려주는 일이 잦아**(2026-08-10 하루 종일 0건)
  앱스토어 페이지 HTML을 1차 출처로 쓴다. 리뷰는 `aria-labelledby="review-<id>-title"` 컨테이너에
  서버 렌더링돼 있다. 클래스명에 svelte 해시가 붙으므로 **안정적인 속성**(`id="review-N-title"`,
  `data-testid="truncate-text"`, `<time datetime>`)에만 의존해 파싱할 것. 같은 리뷰가 모달용으로
  한 번 더 나오니 id로 중복 제거 필요. RSS는 보조로 합쳐 앱 버전·도움됨 수를 채운다
  (RSS는 리뷰 1건이면 `entry`가 배열이 아니라 **객체**로 온다).
  평점·별점 수는 `itunes.apple.com/lookup`으로 따로 받아 항상 표시된다
- 스토어별로 독립 처리해 한쪽이 실패해도 다른 쪽은 표시된다 (`stores[].ok`)
- 별점만 남긴 이용자는 리뷰 목록에 안 잡히므로 `count`(별점 수) > `written`(글 리뷰)가 정상

## 외부 사이트 수집 제약

| 유형 | 대상 | 대응 |
|------|------|------|
| JS 렌더 | SK증권, 메리츠, 신한 | WebFetch 불가 → **브라우저(preview_start + get_page_text)로 판독** |
| EUC-KR | 세무사회, KB, 나무 | `TextDecoder('euc-kr')` 또는 `iconv -f EUC-KR` |
| 이미지 배너 | 우리투자 등 | 이미지 내려받아 Read(비전)로 판독 |
| robots 차단 | 키움 | **크롤링 금지** — 뉴스 검색으로만 판단 |
| 앱 전용 | 토스 | 웹에 없음 — 보도자료로만 확인 |

## 환경변수 (Vercel)

`NAVER_CLIENT_ID` / `NAVER_CLIENT_SECRET` / `KOSIS_KEY`

- 로컬에 키 파일 두지 않음. KOSIS 개발 시 Vercel 키로 라이브 임시 debug 엔드포인트를 붙였다가 **작업 후 반드시 제거**
- KOSIS 호출 시 `objL` 에러 → `objL1=ALL&objL2=ALL` 둘 다 지정하면 해결. 통계표 검색은 `statisticsSearch.do`

## 작업 규칙

- **수정 후 항상 문법 검사**: `node --check api/*.js`, `index.html`은 인라인 스크립트 추출해 `node --check`
- **배포 후 라이브 확인**: `curl -s https://gift-tax-news.vercel.app/api/... ` 로 실제 반영 확인 (브라우저 캐시 때문에 사용자 화면이 늦을 수 있음)
- 커밋·푸시는 요청 없어도 진행 (사용자가 "묻지 말고 배포까지" 지시함)
- 로직을 바꾸면 `guide.html`(공개 정의서)도 같이 갱신
