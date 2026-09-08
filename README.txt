특허상담 관리자 화면 V1 적용 순서

1. GitHub 폴더 patent-intake-portal 에 추가
   - admin.html
   - admin.css
   - admin.js

2. Apps Script
   - Code.gs를 Code.gs.txt 내용으로 전체 교체
   - 저장
   - 프로젝트 설정(톱니바퀴) > 스크립트 속성
   - 속성 이름: ADMIN_KEY
   - 값: 원하는 관리자 비밀번호
   - 저장
   - 배포 관리 > 기존 웹 앱 수정 > 새 버전 배포

3. GitHub
   git add .
   git commit -m "특허상담 관리자 화면 추가"
   git push

4. 관리자 주소
   https://thebigkorea.github.io/patent-intake-portal/admin.html

보안 메모
- 관리자 비밀번호는 GitHub 코드에 저장하지 않습니다.
- 브라우저 sessionStorage에 현재 세션 동안만 보관합니다.
- 실제 장기 운영 시에는 Google 로그인/OAuth 또는 별도 인증 서버 방식으로 강화하는 것을 권장합니다.
