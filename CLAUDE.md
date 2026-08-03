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
api/stats.js    KOSIS 국세통계 자동 연동 (현재 탭은 비활성)
```

## 탭 구조

`onModeChange(mode)` 로 분기. 라디오 `value` = mode.

| 탭 | mode | 내용 |
|----|------|------|
| 뉴스 검색 | `all` / `hanwha` | 키워드 칩으로 전환 (`자녀 증여` / `한화생명 파이`) |
| 블로그 검색 | `blog` | 키워드 칩 3종, 30개씩 무한스크롤, 공감수(♥) 표시 |
| 계좌 이벤트 | `event` | `api/events.js` 큐레이션 카드 + 업데이트 메모 |
| 세무사회 보도자료 | `press` | 1페이지 15건, 증여·상속·세무대리는 상단 분류 |

- 통계 탭(`stats`)은 **2025년 데이터 확보 후 재오픈 예정** — 버튼만 제거, `showStats()`·`api/stats.js`는 보존
- 카페 탭은 삭제됨 (`api/cafe.js`는 미사용 잔존)

## 뉴스 연관도 로직 (index.html)

- **검색**: 네이버 뉴스 API `sort=sim`(관련도순), 100건×3 = 최대 300건
- **제외** `isOwnerNews()`: 오너 승계(회장·오너·지분·2~4세·가업/기업승계) + 노이즈(부동산·아파트·주택·근저당·편법증여·대통령 등). '세무사회장'·'협회장'은 예외로 유지
- **점수** `relatedScore()`: 핵심 타겟 `REL_HIGH`(미성년·자녀·증여·자녀계좌·증여세·사전증여) 제목+3/본문+2, 나머지 `RELATED_KW` +2/+1
- **연관도 상위 5건**: 점수순 + 같은 사건 배제(제목 유사도 0.2 / 제목+본문 0.3 / **주체(회사명) 동일**)
- **중복 통합** `assignGroup()`: 회사명 같거나 본문 유사도 0.5↑ → 대표 1건 + `관련 N건` 접기

## 데이터 갱신 (api/events.js)

이벤트가 바뀌면 이 파일만 수정:

- `EVENTS[]` 진행중 확정 / `PENDING[]` 추가 조사 대상 / `CHANGES[]` 업데이트 메모(사용자 노출)
- `UPDATED_AT` 데이터가 실제 바뀐 날 / `CHECKED_AT` 마지막 확인일(변경 없어도 갱신)

**원칙 (SK증권 누락 사고 이후)**:
- 어떤 증권사도 **완전 삭제 금지** — EVENTS에서 뺄 땐 반드시 `PENDING`으로 이동
- 기간이 지났다는 이유만으로 만료 처리 금지 — 공식 페이지에서 후속 이벤트 먼저 확인
- 출처 2개 이상 교차 확인된 것만 EVENTS로 승격, 아니면 PENDING 유지

**주간 자동 갱신**: scheduled task `weekly-brokerage-event-refresh` (매주 월 10시 KST)

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
