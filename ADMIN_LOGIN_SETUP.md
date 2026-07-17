# 관리자 로그인 설정

로컬 `.env.local`과 Vercel 환경변수에 아래 두 값을 설정합니다.

```env
ADMIN_PASSWORD=원하는_관리자_비밀번호
ADMIN_SESSION_SECRET=충분히_길고_임의적인_문자열
```

환경변수 변경 후 개발 서버를 재시작해야 합니다.

관리자 로그인 주소: `/admin/login`

관리자 세션은 HTTP-only 쿠키로 8시간 유지됩니다.
