특허상담 온라인 접수 포털 - 전체 교체본 V2

1) Apps Script
- Code.gs 기존 내용 전체 삭제
- Code.gs.txt 내용 전체 붙여넣기
- 저장
- "배포 관리" > 기존 웹앱 배포 수정 > 새 버전으로 배포
  또는 새 배포
- 웹앱 URL은 현재 아래 주소 기준:
  https://script.google.com/macros/s/AKfycbwty1ir537jUHhGDE088UtX3tkqhqXfShEa_KXEa2JU6lpX83dCI23UIUMm5GNrprCq/exec

2) GitHub
- 기존 script.js 전체 삭제
- 이 폴더의 script.js 전체 붙여넣기
- 저장

3) Git 명령어
git add .
git commit -m "특허 접수 전체 연결 수정"
git push

4) 테스트
- GitHub Pages 접속
- 특허 사전검토 입력
- 마지막 접수하기
- 접수번호 확인
- Google Sheet 접수원장 새 행 확인
- 상단 진행상황 조회 클릭
- 접수번호 + 신청 당시 연락처로 조회

현재 포함 기능
- 실제 Google Sheet 접수 저장
- 접수번호 IP-YYYYMMDD-0001 자동 발급
- 진행이력 기록
- 고객 이메일 발송
- 접수번호+연락처 진행상황 조회
- 임시저장
- 첨부파일 이름 기록
- 진행상황 조회 팝업 UI

아직 미포함
- 첨부파일 실제 Google Drive 업로드
- 변리사 관리자 전용 웹 화면
- 개인정보처리방침/약관 전용 페이지
