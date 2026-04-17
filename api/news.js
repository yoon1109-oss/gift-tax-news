export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const { keyword = '증여', display = 100, start = 1, sort = 'date' } = req.query;
  const response = await fetch(
    `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(keyword)}&display=${display}&start=${start}&sort=${sort}`,
    { headers: {
      'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID,
      'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET,
    }}
  );
  const data = await response.json();
  res.status(200).json(data);
}
