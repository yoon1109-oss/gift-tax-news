# 증여세 뉴스 모니터링

증여 / 증여세 키워드 뉴스를 네이버 뉴스 API로 실시간 수집하는 웹사이트입니다.

## 파일 구조

```
gift-tax-news/
├── api/
│   └── news.js          # Vercel Serverless 함수 (네이버 API 호출)
├── public/
│   └── index.html       # 프론트엔드
├── vercel.json
└── README.md
```

## Vercel 배포 방법

### 1단계 - GitHub에 올리기
1. [github.com](https://github.com) 접속 → **New repository** 생성
2. 아래 명령어 실행:
```bash
git init
git add .
git commit -m "first commit"
git remote add origin https://github.com/본인계정/gift-tax-news.git
git push -u origin main
```

