특허상담 온라인 접수관리 V4 적용파일

GitHub 교체:
- index.html
- style.css
- script.js
- admin.html
- admin.css
- admin.js

Apps Script:
- Code.gs.txt (현재 상세검색 V4 백엔드 유지본)
  ※ 이번 연락처/이메일 UI 변경은 기존 phone/email 필드에 완성된 문자열을 보내므로 백엔드 컬럼 변경은 필요 없습니다.

변경사항:
1. 고객 연락처: 010 고정 + 가운데 4자리 + 끝 4자리 입력, 저장은 010-1234-5678
2. 이메일: 아이디 직접입력 + 도메인 선택(naver/gmail/daum/hanmail/kakao/nate/직접입력)
3. 관리자 상세화면 연락처 010-1234-5678 표시
4. 관리자 검색결과 7개 핵심 컬럼으로 간소화
5. 접수번호 링크 강조 + 행 hover 강조
6. 관리자 상단 여백 보정
