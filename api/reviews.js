// 파이 앱 스토어 리뷰 — 구글 플레이 + 애플 앱스토어.
//
// 애플: 공식 RSS(customerreviews)를 쓴다. 별점만 남긴 사용자는 여기 안 잡히므로
//       RSS 건수와 스토어 평점 개수는 서로 다르다.
// 구글: 공식 공개 API가 없어 플레이스토어 웹이 내부적으로 쓰는 batchexecute를 호출한다.
//       비공식 경로라 구글이 응답 형식을 바꾸면 깨질 수 있어, 실패해도 애플 쪽은
//       그대로 나오도록 스토어별로 독립 처리하고 상태를 응답에 담는다.
const PLAY_ID = 'hw.dp.plus';
const APPLE_ID = '6755743981';
const PLAY_URL = `https://play.google.com/store/apps/details?id=${PLAY_ID}&hl=ko&gl=KR`;
const APPLE_URL = `https://apps.apple.com/kr/app/id${APPLE_ID}`;

const TIMEOUT = 8000;
async function get(url, opts = {}) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), opts.timeout || TIMEOUT);
  try { return await fetch(url, { ...opts, signal: ac.signal }); }
  finally { clearTimeout(t); }
}
const strip = s => String(s || '').replace(/\s+/g, ' ').trim();

// ── 구글 플레이 ──────────────────────────────────────────────
async function playReviews() {
  const body = 'f.req=' + encodeURIComponent(JSON.stringify([[[
    'UsvDTd',
    JSON.stringify([null, null, [2 /* 최신순 */, null, [100, null, null], null, []], [PLAY_ID, 7]]),
    null, 'generic',
  ]]]));
  const res = await get('https://play.google.com/_/PlayStoreUi/data/batchexecute?rpcids=UsvDTd&hl=ko&gl=KR', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body,
  });
  if (!res.ok) throw new Error('play ' + res.status);
  const txt = await res.text();
  const outer = JSON.parse(txt.slice(txt.indexOf('\n')));   // 앞의 )]}' 방어 접두사 제거
  const rows = JSON.parse(outer[0][2])[0] || [];
  return rows.map(v => ({
    store: 'play',
    author: strip(v[1] && v[1][0]) || '익명',
    rating: Number(v[2]) || 0,
    title: '',
    text: strip(v[4]),
    date: v[5] && v[5][0] ? new Date(v[5][0] * 1000).toISOString().slice(0, 10) : '',
    version: strip(v[10]) || '',
    thumbsUp: Number(v[6]) || 0,
    reply: v[7] ? strip(v[7][1]) : '',
  })).filter(r => r.text);
}

// 평점 요약은 상세 페이지 배지에서 읽는다 (batchexecute 응답에는 없음)
async function playSummary() {
  const res = await get(PLAY_URL);
  if (!res.ok) throw new Error('play page ' + res.status);
  const html = await res.text();
  const rating = html.match(/별표 5개 만점에 ([\d.]+)개를 받았습니다/);
  const count = html.match(/리뷰 ([\d,]+)개/);
  return {
    rating: rating ? Number(rating[1]) : null,
    count: count ? Number(count[1].replace(/,/g, '')) : null,
  };
}

// ── 애플 앱스토어 ────────────────────────────────────────────
// 애플 RSS는 같은 앱이어도 호출 시점에 따라 빈 피드를 돌려줄 때가 있다(캐시 반영 지연).
// 정렬을 바꿔 한 번 더 시도해 빈손으로 끝나는 경우를 줄인다.
async function appleFeed(sortBy) {
  const res = await get(`https://itunes.apple.com/kr/rss/customerreviews/id=${APPLE_ID}/sortBy=${sortBy}/json`);
  if (!res.ok) throw new Error('apple ' + res.status);
  const feed = (await res.json()).feed || {};
  let entries = feed.entry || [];
  if (!Array.isArray(entries)) entries = [entries];   // 1건이면 배열이 아니라 객체로 온다
  return entries;
}

async function appleReviews() {
  const seen = new Set(), entries = [];
  for (const sort of ['mostRecent', 'mostHelpful']) {
    let list = [];
    try { list = await appleFeed(sort); } catch (e) { if (!entries.length && sort === 'mostHelpful') throw e; }
    for (const e of list) {
      const id = (e.id && (e.id.label || e.id.attributes?.['im:id'])) || JSON.stringify(e).slice(0, 80);
      if (seen.has(id)) continue;
      seen.add(id); entries.push(e);
    }
    if (entries.length) break;   // 한쪽에서 받았으면 충분
  }
  return entries.map(e => ({
    store: 'apple',
    author: strip(e.author && e.author.name && e.author.name.label) || '익명',
    rating: Number(e['im:rating'] && e['im:rating'].label) || 0,
    title: strip(e.title && e.title.label),
    text: strip(e.content && e.content.label),
    date: strip(e.updated && e.updated.label).slice(0, 10),
    version: strip(e['im:version'] && e['im:version'].label),
    thumbsUp: Number(e['im:voteSum'] && e['im:voteSum'].label) || 0,
    reply: '',
  })).filter(r => r.text);
}

async function appleSummary() {
  const res = await get(`https://itunes.apple.com/lookup?id=${APPLE_ID}&country=kr`);
  if (!res.ok) throw new Error('apple lookup ' + res.status);
  const r = ((await res.json()).results || [])[0] || {};
  return {
    rating: r.averageUserRating != null ? Math.round(r.averageUserRating * 10) / 10 : null,
    count: r.userRatingCount != null ? r.userRatingCount : null,
    version: r.version || '',
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=3600');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const [pr, ps, ar, as] = await Promise.all([
    playReviews().catch(e => e), playSummary().catch(e => e),
    appleReviews().catch(e => e), appleSummary().catch(e => e),
  ]);
  const ok = v => !(v instanceof Error);

  const reviews = [...(ok(pr) ? pr : []), ...(ok(ar) ? ar : [])]
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const stores = [
    {
      key: 'play', name: 'Google Play', link: PLAY_URL,
      rating: ok(ps) ? ps.rating : null, count: ok(ps) ? ps.count : null,
      written: ok(pr) ? pr.length : 0, ok: ok(pr),
    },
    {
      key: 'apple', name: 'App Store', link: APPLE_URL,
      rating: ok(as) ? as.rating : null, count: ok(as) ? as.count : null,
      version: ok(as) ? as.version : '',
      written: ok(ar) ? ar.length : 0, ok: ok(ar),
    },
  ];

  res.status(200).json({
    app: '파이 (한화생명)',
    fetchedAt: new Date().toISOString(),
    stores,
    reviews,
    // 스토어에 남은 별점 수와 글로 쓴 리뷰 수가 다른 이유를 화면에서 안내하기 위한 값
    note: '별점만 남긴 이용자는 목록에 나오지 않아, 스토어 평점 개수보다 글 리뷰가 적습니다.',
  });
}
