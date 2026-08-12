#!/bin/bash
# 계좌 이벤트 주간 배치 전용 동기화 스크립트.
#
# 배치(scheduled task)는 무인으로 돌기 때문에 임의의 셸 명령을 쓰면 매번 권한 승인에
# 걸려 멈춘다. 그래서 git·검증·커밋·푸시를 이 스크립트 하나로 묶고, 허용 목록에는
# 이 스크립트만 등록한다. 배치는 아래 서브커맨드만 호출한다.
#
#   ./scripts/event-sync.sh pull            저장소 최신화 + 오늘 날짜 출력
#   ./scripts/event-sync.sh check           api/events.js 문법 검사 + 현황 요약
#   ./scripts/event-sync.sh commit "<메시지>"  검증 통과 시 커밋 + 푸시
#   ./scripts/event-sync.sh verify          배포된 API에 오늘 확인일이 반영됐는지 확인
set -euo pipefail

REPO="$HOME/gift-tax-news"
API="https://gift-tax-news.vercel.app/api/events"
cd "$REPO"

summary() {
  node -e "
import('./api/events.js').then(m => {
  let o; m.default({method:'GET',query:{}}, {setHeader(){}, status(){return this;}, json(x){o=x;}});
  // 한 증권사가 이벤트를 여러 개 운영할 수 있으므로 개사 수는 중복을 제거해 센다
  const all = [...new Set([...o.events.map(e=>e.broker), ...o.pending.map(p=>p.broker)])];
  console.log('확인일:', o.checkedAt, '/ 변경일:', o.updatedAt);
  console.log('진행중:', o.events.length, '건 / 확인대상:', o.pending.length, '개 / 조사 대상:', all.length, '개사');
  console.log('진행중 목록:', o.events.map(e=>e.broker).join(', '));
  console.log('최신 메모:', o.changes[0].date, o.changes[0].text);
  if (all.length < 19) { console.error('✗ 증권사가 19개 미만입니다 — 완전 삭제가 발생했는지 확인하세요'); process.exit(1); }
});"
}

case "${1:-}" in
  pull)
    git pull --rebase
    echo "오늘: $(date +%F)"
    ;;
  check)
    node --check api/events.js && echo "문법 OK"
    summary
    ;;
  commit)
    MSG="${2:?커밋 메시지가 필요합니다}"
    node --check api/events.js || { echo "✗ 문법 오류 — 커밋 중단"; exit 1; }
    summary
    if git diff --quiet && git diff --cached --quiet; then
      echo "변경 없음 — 커밋 생략"
      exit 0
    fi
    git add -A api/events.js
    git commit -m "$MSG"
    git push origin main
    echo "커밋: $(git rev-parse --short HEAD)"
    ;;
  verify)
    TODAY=$(date +%F)
    for _ in $(seq 1 40); do
      BODY=$(curl -s --max-time 25 "$API" || true)
      if printf '%s' "$BODY" | grep -q "\"checkedAt\":\"$TODAY\""; then
        echo "✓ 배포 반영 확인 ($TODAY)"; exit 0
      fi
      sleep 6
    done
    echo "✗ 배포 반영이 확인되지 않았습니다"; exit 1
    ;;
  *)
    echo "사용법: $0 {pull|check|commit \"<메시지>\"|verify}" >&2
    exit 2
    ;;
esac
