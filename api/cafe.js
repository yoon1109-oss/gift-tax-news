// 카페 검색 프록시 — 카페 탭이 삭제돼 화면은 더 이상 부르지 않는다.
// 남겨 두면 아무 검색어로나 네이버 API 키 쿼터를 쓸 수 있는 열린 통로라 닫아 둔다 (2026-11-11).
// 다시 쓰려면 git 기록의 이전 버전을 api/blog.js처럼 문지기(Origin·검색어 허용 목록)를 붙여 되살릴 것.
export default function handler(req, res) {
  res.setHeader('Cache-Control', 'public, s-maxage=86400');
  res.status(410).json({ error: 'cafe search removed' });
}
