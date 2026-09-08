특허상담 관리자 UI V2

교체 대상
- admin.html
- admin.css
- admin.js

Code.gs는 수정하지 않습니다.

주요 개선
- 상세 팝업 1280px 확장
- 신청 기본정보 3열
- 발명내용 2열 카드 배치
- 핵심 항목은 전체폭 + 강조
- 관리자 처리 영역을 오른쪽 고정 패널로 분리
- 진행이력 하단 정리
- 담당자 선택 + 직접입력 방식
- 모바일 대응

담당자 목록을 고정하고 싶으면 admin.js의
const MANAGER_OPTIONS = [];
에 이름을 추가하세요.

예:
const MANAGER_OPTIONS = ["김변리사", "이변리사", "박변리사"];

Git 명령어
git add .
git commit -m "특허상담 관리자 상세화면 개선"
git push
