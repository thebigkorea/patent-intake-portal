특허상담 온라인 접수 V9 - 실제 Google Drive 첨부 연결

교체 파일
GitHub:
- index.html
- style.css
- script.js
- admin.html
- admin.css
- admin.js

Apps Script:
- Code.gs.txt 내용을 Code.gs에 전체 교체

Apps Script 스크립트 속성
1) ADMIN_KEY
   기존 관리자 비밀번호 그대로 유지

2) SUPPORT_EMAIL
   대용량/기타형식 자료를 받을 회사 상담 이메일
   예: counsel@example.com

3) ATTACHMENT_ROOT_FOLDER_ID (선택)
   비워두면 Apps Script가 My Drive에 '특허상담_첨부파일' 폴더를 자동 생성하고
   해당 폴더 ID를 스크립트 속성에 자동 저장합니다.
   특정 기존 Drive 폴더를 쓰려면 그 폴더 ID를 직접 넣으세요.

첨부 정책
- JPG / JPEG / PNG / PDF
- 최대 3개
- 파일당 5MB 이하
- 접수번호별 Drive 하위폴더 자동 생성
- Drive 파일은 '링크가 있는 모든 사용자 공개'로 바꾸지 않음
  (특허 발명자료 보호를 위해 기본 비공개 유지)
- 관리자 상세창에서 Drive에서 열기 버튼 제공

중요 적용 순서
1. Code.gs 전체 교체
2. Apps Script 프로젝트 설정 > 스크립트 속성에 SUPPORT_EMAIL 입력
3. 저장
4. 배포 > 배포 관리 > 기존 웹앱 수정 > 새 버전 배포
5. GitHub 6개 프론트 파일 교체
6. git push
7. 테스트 접수 1건으로 PDF/이미지 업로드 확인

Git 명령어
git add .
git commit -m "특허상담 Drive 첨부 업로드 V9 적용"
git push
