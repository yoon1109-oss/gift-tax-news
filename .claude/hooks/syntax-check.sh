#!/usr/bin/env bash
# PostToolUse 훅: gift-tax-news의 api/*.js 와 index.html(인라인 <script>) 문법 검사.
# 오류가 있으면 decision:block + reason 으로 Claude에게 되돌려준다.
# jq 미설치 환경이라 node로 JSON을 파싱한다.

input=$(cat)

f=$(printf '%s' "$input" | node -e '
let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{
  try{const j=JSON.parse(s);process.stdout.write(String(j?.tool_response?.filePath||j?.tool_input?.file_path||""))}catch(e){process.stdout.write("")}
})' 2>/dev/null)

[ -n "$f" ] || exit 0
[ -f "$f" ] || exit 0

case "$f" in
  */gift-tax-news/api/*.js) target="$f" ;;
  */gift-tax-news/index.html)
    target=$(mktemp /tmp/gtn-hook.XXXXXX.js)
    node -e '
      const fs=require("fs");
      const html=fs.readFileSync(process.argv[1],"utf8");
      const m=html.match(/<script>([\s\S]*?)<\/script>\s*<\/body>/) || html.match(/<script>([\s\S]*)<\/script>/);
      fs.writeFileSync(process.argv[2], m ? m[1] : "");
    ' "$f" "$target" 2>/dev/null || { rm -f "$target"; exit 0; }
    ;;
  *) exit 0 ;;
esac

if err=$(node --check "$target" 2>&1); then
  [ "$target" != "$f" ] && rm -f "$target"
  exit 0
fi

[ "$target" != "$f" ] && rm -f "$target"

FILE="$f" ERR="$err" node -e '
const file=process.env.FILE, err=process.env.ERR;
process.stdout.write(JSON.stringify({
  decision:"block",
  reason:"문법 오류가 있습니다 — 배포 전에 수정하세요.\n파일: "+file+"\n"+err,
  systemMessage:"⚠️ 문법 오류: "+file.split("/").pop()
}));'
exit 0
