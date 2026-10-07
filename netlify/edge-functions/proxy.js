// Netlify 앞문 전달 함수 — 받은 요청을 Vercel 본체로 넘기고 응답을 그대로 돌려준다.
//
// 왜 redirects(status 200)만으로 안 되나 (2026-10-07):
// 주소창으로 직접 연 화면 요청에는 브라우저가 Sec-Fetch-Mode: navigate 등을 붙인다.
// Netlify 서버가 이 표시를 단 채 Vercel에 요청하면, Vercel 봇 차단이 '브라우저인 척하는 서버'로 보고
// 빈 400을 돌려준다 (크롬에서 HTTP ERROR 400). 같은 요청이라도 이 표시만 없으면 200이었다.
// netlify.toml의 headers 옵션은 값을 '덧붙이기'만 해서(navigate,cors) 지울 수 없다 — 그래서 함수로 지운다.
//
// 비밀값 없음. 쿠키도 넘기지 않는다(이 사이트는 로그인이 없다).
const ORIGIN = 'https://gift-tax-news.vercel.app';
// accept-encoding도 지운다 — 브라우저가 보낸 zstd를 함수 쪽 fetch가 못 풀 수 있어, 압축 방식은 fetch가 스스로 고르게 한다
const DROP_REQ = /^(sec-|upgrade-insecure-requests$|cookie$|host$|accept-encoding$|x-nf-|x-forwarded-|x-real-ip$|cdn-loop$|via$)/i;
// fetch가 압축을 풀어 주므로 원래 압축·길이 헤더를 그대로 돌려주면 내용이 깨진다
const DROP_RES = /^(content-encoding|content-length|transfer-encoding|connection)$/i;

export default async (request) => {
  const url = new URL(request.url);
  const headers = new Headers();
  for (const [k, v] of request.headers) if (!DROP_REQ.test(k)) headers.set(k, v);
  const init = { method: request.method, headers, redirect: 'manual' };
  if (!['GET', 'HEAD'].includes(request.method)) init.body = await request.arrayBuffer();
  const res = await fetch(ORIGIN + url.pathname + url.search, init);
  const out = new Headers();
  for (const [k, v] of res.headers) if (!DROP_RES.test(k)) out.set(k, v);
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers: out });
};

export const config = { path: '/*' };
