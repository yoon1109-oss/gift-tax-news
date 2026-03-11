export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { keyword = '증여', display = 100, start = 1 } = req.query;

  try {
    const response = await fetch(
      `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(keyword)}&display=${display}&start=${start}&sort=date`,
      {
        headers: {
          'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID,
          'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET,
        },
      }
    );

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Naver API error' });
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
