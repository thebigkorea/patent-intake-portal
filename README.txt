특허상담 온라인 접수관리 - 운영 연결 V1

1. Apps Script의 Code.gs 전체를 Code.gs.txt 내용으로 교체
2. 저장
3. 배포 > 새 배포 > 웹 앱
   - 실행 사용자: 나
   - 액세스 권한: 모든 사용자(Anyone)
4. 배포 후 /exec 주소 복사
5. GitHub 프로젝트 script.js 상단:
   const API_URL = '여기에_APPS_SCRIPT_웹앱_URL';
   를 실제 /exec 주소로 교체
6. 저장 후 Git 명령어:
   git add .
   git commit -m "특허 접수 API 연결"
   git push
7. GitHub Pages에서 실제 테스트

현재 구현:
- 접수번호: IP-YYYYMMDD-0001 형식
- 접수원장 자동 저장
- 진행이력 생성
- 고객 접수 완료 이메일
- 접수번호 + 연락처로 진행상황 조회
- 관리자 상태 변경용 updateStatus 함수
- 첨부파일은 아직 파일명만 저장 (실제 Drive 업로드는 다음 단계)
