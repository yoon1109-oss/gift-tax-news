// 파이 앱에 새 리뷰가 올라오면 메일로 알린다. Vercel Cron이 하루 한 번 호출한다.
//
// 서버리스라 '이미 보낸 리뷰'를 저장해 둘 곳이 없다. 그래서 상태를 두는 대신
// **어제 날짜 리뷰만** 골라 보낸다 — 날짜별로 정확히 한 번씩만 발송되므로 중복이 없다.
// (오늘 올라온 리뷰는 내일 메일에 담긴다. 최대 하루 남짓 늦는 대신 중복이 없다.)
//
// 필요한 환경변수 (Vercel):
//   RESEND_API_KEY  메일 발송 API 키
//   ALERT_EMAIL     받는 주소
//   ALERT_FROM      보내는 주소 (미설정 시 Resend 기본 발신 주소)
//   CRON_SECRET     Vercel Cron이 Authorization 헤더로 보내는 값 (외부 호출 차단용)
const REVIEWS_URL = '/api/reviews';
const STORE_NAME = { play: 'Google Play', apple: 'App Store' };

// KST 기준 날짜 문자열 (스토어가 주는 date도 날짜 단위라 맞춰야 한다)
function kstDate(offsetDays = 0) {
  const t = Date.now() + 9 * 3600e3 + offsetDays * 86400e3;
  return new Date(t).toISOString().slice(0, 10);
}

const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function buildEmail(list, day) {
  const rows = list.map(r => `
    <tr><td style="padding:14px 0;border-bottom:1px solid #e4e8f0">
      <div style="font-size:13px;color:#8992a4">
        ${'★'.repeat(r.rating)}${'☆'.repeat(Math.max(0, 5 - r.rating))}
        &nbsp;·&nbsp;${esc(STORE_NAME[r.store] || r.store)}
        ${r.version ? '&nbsp;·&nbsp;v' + esc(r.version) : ''}
      </div>
      ${r.title ? `<div style="font-size:15px;font-weight:700;margin:4px 0 2px">${esc(r.title)}</div>` : ''}
      <div style="font-size:14px;line-height:1.65;color:#161b27;margin-top:4px">${esc(r.text)}</div>
      <div style="font-size:12px;color:#8992a4;margin-top:6px">${esc(r.author)}</div>
    </td></tr>`).join('');

  const low = list.filter(r => r.rating <= 2).length;
  return {
    subject: `[파이] 새 앱 리뷰 ${list.length}건${low ? ` (낮은 평점 ${low}건)` : ''} · ${day}`,
    html: `<div style="max-width:640px;margin:0 auto;padding:24px;font-family:-apple-system,'Apple SD Gothic Neo','Malgun Gothic',sans-serif">
      <div style="font-size:12px;letter-spacing:.1em;color:#2f6fd0;font-weight:600">PI APP REVIEW</div>
      <h1 style="font-size:20px;margin:8px 0 4px">새 리뷰 ${list.length}건</h1>
      <div style="font-size:13px;color:#586074">${day} 등록분 · 구글 플레이 · 애플 앱스토어</div>
      <table style="width:100%;border-collapse:collapse;margin-top:12px">${rows}</table>
      <div style="margin-top:22px;font-size:13px">
        <a href="https://gift-tax-news.vercel.app/#reviews" style="color:#2f6fd0">모니터링에서 전체 보기 →</a>
      </div>
    </div>`,
  };
}

export default async function handler(req, res) {
  // Vercel Cron은 Authorization: Bearer <CRON_SECRET> 을 붙여 호출한다.
  // 공개 URL이므로 이 값이 맞을 때만 동작시킨다.
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.authorization !== `Bearer ${secret}`) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  const day = kstDate(-1);                       // 어제 등록분
  const dry = req.query && req.query.dry === '1';

  const base = `https://${req.headers.host}`;
  let reviews = [];
  try {
    const r = await fetch(base + REVIEWS_URL);
    reviews = (await r.json()).reviews || [];
  } catch (e) {
    res.status(502).json({ error: 'reviews fetch 실패', detail: String(e) });
    return;
  }

  const list = reviews.filter(r => r.date === day);
  if (!list.length) {
    res.status(200).json({ day, found: 0, sent: false, note: '어제 등록된 리뷰 없음' });
    return;
  }

  const mail = buildEmail(list, day);
  if (dry) { res.status(200).json({ day, found: list.length, sent: false, dryRun: mail }); return; }

  const key = process.env.RESEND_API_KEY, to = process.env.ALERT_EMAIL;
  if (!key || !to) {
    res.status(500).json({ error: 'RESEND_API_KEY 또는 ALERT_EMAIL 미설정', day, found: list.length });
    return;
  }

  const send = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.ALERT_FROM || 'onboarding@resend.dev',
      to: [to],
      subject: mail.subject,
      html: mail.html,
    }),
  });
  const body = await send.json().catch(() => ({}));
  res.status(send.ok ? 200 : 502).json({ day, found: list.length, sent: send.ok, provider: body });
}
