// ============================================================
// 특허 상담·출원 접수 포털 - script.js 전체 교체본 V2
// ============================================================
// Google Apps Script 웹앱 주소
const API_URL = "https://script.google.com/macros/s/AKfycbwty1ir537jUHhGDE088UtX3tkqhqXfShEa_KXEa2JU6lpX83dCI23UIUMm5GNrprCq/exec";

// -----------------------------
// DOM
// -----------------------------
const homeView = document.getElementById("homeView");
const wizardView = document.getElementById("wizardView");
const successView = document.getElementById("successView");
const intakeForm = document.getElementById("intakeForm");
const steps = [...document.querySelectorAll(".step")];

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const saveBtn = document.getElementById("saveBtn");
const submitBtn = document.getElementById("submitBtn");

const progressBar = document.getElementById("progressBar");
const stepLabel = document.getElementById("stepLabel");
const stepTitleTop = document.getElementById("stepTitleTop");
const saveState = document.getElementById("saveState");

const wizardTitle = document.getElementById("wizardTitle");
const wizardSubtitle = document.getElementById("wizardSubtitle");
const reviewContent = document.getElementById("reviewContent");
const receiptNo = document.getElementById("receiptNo");

const fileInput = document.getElementById("fileInput");
const fileButton = document.getElementById("fileButton");
const fileList = document.getElementById("fileList");

// -----------------------------
// 상태
// -----------------------------
let currentStep = 0;
let serviceType = "precheck";
let isSubmitting = false;

const DRAFT_KEY = "patentIntakeDraftV2";

// -----------------------------
// 서비스별 화면 문구
// -----------------------------
const serviceMeta = {
  precheck: {
    title: "특허 가능성 사전검토",
    subtitle: "핵심 정보만 순서대로 입력해주세요."
  },
  filing: {
    title: "특허출원 접수",
    subtitle: "출원 준비에 필요한 발명 내용을 단계별로 작성합니다."
  },
  brand: {
    title: "상표·디자인 상담",
    subtitle: "현재는 공통 접수폼으로 접수되며, 담당자가 확인 후 별도 안내합니다."
  }
};

// -----------------------------
// 화면 전환
// -----------------------------
function showView(view) {
  [homeView, wizardView, successView].forEach(v => {
    if (v) v.classList.add("hidden");
  });

  if (view) view.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function goHome() {
  showView(homeView);
}

// -----------------------------
// 접수 시작
// -----------------------------
function startWizard(type = "precheck") {
  if (type === "status") {
    openStatusLookup();
    return;
  }

  serviceType = type;
  currentStep = 0;

  const meta = serviceMeta[type] || serviceMeta.precheck;

  if (wizardTitle) wizardTitle.textContent = meta.title;
  if (wizardSubtitle) wizardSubtitle.textContent = meta.subtitle;

  loadDraft();
  showView(wizardView);
  renderStep();
}

// -----------------------------
// 단계 렌더링
// -----------------------------
function renderStep() {
  if (!steps.length) return;

  steps.forEach((step, idx) => {
    step.classList.toggle("active", idx === currentStep);
  });

  const isReview = currentStep === steps.length - 1;
  const title = steps[currentStep]?.querySelector("h3")?.textContent || "접수";
  const displayStep = Math.min(currentStep + 1, 11);

  if (stepLabel) {
    stepLabel.textContent = isReview
      ? "REVIEW"
      : `STEP ${String(displayStep).padStart(2, "0")} / 11`;
  }

  if (stepTitleTop) stepTitleTop.textContent = title;

  if (progressBar) {
    progressBar.style.width = `${((currentStep + 1) / steps.length) * 100}%`;
  }

  if (prevBtn) {
    prevBtn.style.visibility = currentStep === 0 ? "hidden" : "visible";
  }

  if (nextBtn) nextBtn.classList.toggle("hidden", isReview);
  if (submitBtn) submitBtn.classList.toggle("hidden", !isReview);

  if (isReview) buildReview();
}

// -----------------------------
// 현재 단계 검증
// -----------------------------
function validateCurrentStep() {
  const section = steps[currentStep];
  if (!section) return true;

  const required = [...section.querySelectorAll("[required]")];

  for (const el of required) {
    if (el.type === "radio") {
      const group = intakeForm.querySelectorAll(`[name="${el.name}"]`);
      const checked = [...group].some(r => r.checked);

      if (!checked) {
        alert("필수 항목을 선택해주세요.");
        return false;
      }
      continue;
    }

    if (el.type === "checkbox") {
      if (!el.checked) {
        alert("필수 동의 항목을 확인해주세요.");
        el.focus();
        return false;
      }
      continue;
    }

    const value = String(el.value || "").trim();

    if (!value) {
      el.focus();
      if (typeof el.reportValidity === "function") el.reportValidity();
      return false;
    }
  }

  return true;
}

// -----------------------------
// 폼 데이터 객체화
// -----------------------------
function formDataObject() {
  const fd = new FormData(intakeForm);
  const obj = {};

  for (const [key, value] of fd.entries()) {
    if (value instanceof File) continue;

    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (!Array.isArray(obj[key])) obj[key] = [obj[key]];
      obj[key].push(value);
    } else {
      obj[key] = value;
    }
  }

  obj.serviceType = serviceType;

  if (fileInput?.files?.length) {
    obj.attachmentNames = [...fileInput.files]
      .map(f => f.name)
      .join(", ");
  } else {
    obj.attachmentNames = "";
  }

  return obj;
}

// -----------------------------
// 임시저장
// -----------------------------
function saveDraft(manual = false) {
  const draft = {
    serviceType,
    currentStep,
    savedAt: new Date().toISOString(),
    data: formDataObject()
  };

  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));

  if (saveState) {
    saveState.textContent = manual ? "임시저장 완료" : "자동저장됨";
  }

  if (manual && saveState) {
    setTimeout(() => {
      saveState.textContent = "임시저장됨";
    }, 1400);
  }
}

function loadDraft() {
  const raw = localStorage.getItem(DRAFT_KEY);
  if (!raw) return;

  try {
    const draft = JSON.parse(raw);

    if (!draft?.data) return;

    if (draft.serviceType) {
      serviceType = draft.serviceType;
    }

    Object.entries(draft.data).forEach(([name, value]) => {
      const fields = [...intakeForm.querySelectorAll(`[name="${name}"]`)];

      if (!fields.length) return;

      fields.forEach(field => {
        if (field.type === "radio") {
          field.checked = field.value === value;
        } else if (field.type === "checkbox") {
          field.checked = value === "on" || value === true || value === "true";
        } else if (field.type !== "file") {
          field.value = Array.isArray(value) ? value[0] : value;
        }
      });
    });
  } catch (err) {
    console.warn("임시저장 데이터 불러오기 실패", err);
  }
}

// -----------------------------
// 검토 화면
// -----------------------------
const reviewLabels = {
  name: "성함 / 담당자명",
  company: "회사명 · 소속",
  phone: "연락처",
  email: "이메일",
  inventionTitle: "발명의 명칭",
  technicalField: "기술 분야",
  existingProblem: "기존 방식의 문제점",
  objective: "해결 과제",
  implementation: "구성 및 구현 방법",
  drawingDescription: "도면 설명",
  results: "실험·성능 데이터",
  effects: "기대 효과",
  differentiation: "핵심 차별점",
  disclosed: "공개 여부",
  disclosureNote: "공개 내용 / 참고사항",
  attachmentNames: "첨부파일"
};

function buildReview() {
  if (!reviewContent) return;

  const data = formDataObject();
  reviewContent.innerHTML = "";

  Object.entries(reviewLabels).forEach(([key, label]) => {
    const value = data[key] || "—";

    const item = document.createElement("div");
    item.className = "review-item";

    const strong = document.createElement("strong");
    strong.textContent = label;

    const span = document.createElement("span");
    span.textContent = value;

    item.appendChild(strong);
    item.appendChild(span);
    reviewContent.appendChild(item);
  });
}

// -----------------------------
// 실제 접수 전송
// -----------------------------
async function submitToServer() {
  if (isSubmitting) return;

  if (!API_URL || !API_URL.includes("script.google.com/macros/s/")) {
    alert("Apps Script 웹앱 주소가 설정되지 않았습니다.");
    return;
  }

  isSubmitting = true;

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "접수 중...";
  }

  try {
    const payload = {
      action: "submit",
      website: "",
      ...formDataObject()
    };

    const response = await fetch(API_URL, {
      method: "POST",
      redirect: "follow",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`서버 응답 오류 (${response.status})`);
    }

    const result = await response.json();

    if (!result.ok) {
      throw new Error(result.message || "접수 처리에 실패했습니다.");
    }

    localStorage.removeItem(DRAFT_KEY);

    if (receiptNo) {
      receiptNo.textContent = result.receiptNo || "접수번호 확인 필요";
    }

    intakeForm.reset();

    if (fileList) fileList.textContent = "";

    currentStep = 0;
    showView(successView);
  } catch (err) {
    console.error(err);

    alert(
      "접수 중 오류가 발생했습니다.\n\n" +
      (err?.message || err) +
      "\n\n잠시 후 다시 시도해주세요."
    );
  } finally {
    isSubmitting = false;

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "접수하기";
    }
  }
}

// -----------------------------
// 진행상황 조회
// -----------------------------
function openStatusLookup() {
  const oldModal = document.getElementById("statusLookupModal");
  if (oldModal) oldModal.remove();

  const modal = document.createElement("div");
  modal.id = "statusLookupModal";

  modal.innerHTML = `
    <div class="status-modal-backdrop">
      <div class="status-modal-card">
        <button type="button" class="status-modal-close" aria-label="닫기">×</button>
        <p class="eyebrow">APPLICATION STATUS</p>
        <h2>진행상황 조회</h2>
        <p class="status-modal-desc">
          접수 완료 시 발급된 접수번호와 신청 당시 연락처를 입력해주세요.
        </p>

        <label class="field">
          <span>접수번호</span>
          <input id="statusReceiptNo" type="text" placeholder="예: IP-20260908-0001">
        </label>

        <label class="field">
          <span>연락처</span>
          <input id="statusPhone" type="tel" placeholder="예: 010-1234-5678">
        </label>

        <div id="statusResult" class="status-result hidden"></div>

        <div class="status-modal-actions">
          <button type="button" class="btn soft status-cancel">취소</button>
          <button type="button" class="btn primary status-submit">조회하기</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const close = () => modal.remove();

  modal.querySelector(".status-modal-close").addEventListener("click", close);
  modal.querySelector(".status-cancel").addEventListener("click", close);
  modal.querySelector(".status-modal-backdrop").addEventListener("click", e => {
    if (e.target.classList.contains("status-modal-backdrop")) close();
  });

  modal.querySelector(".status-submit").addEventListener("click", async () => {
    const receipt = modal.querySelector("#statusReceiptNo").value.trim();
    const phone = modal.querySelector("#statusPhone").value.trim();

    await lookupStatus(receipt, phone, modal);
  });
}

async function lookupStatus(receipt, phone, modal) {
  const resultBox = modal.querySelector("#statusResult");
  const button = modal.querySelector(".status-submit");

  if (!receipt || !phone) {
    alert("접수번호와 연락처를 모두 입력해주세요.");
    return;
  }

  button.disabled = true;
  button.textContent = "조회 중...";

  try {
    const url =
      `${API_URL}?action=status` +
      `&receiptNo=${encodeURIComponent(receipt)}` +
      `&phone=${encodeURIComponent(phone)}`;

    const response = await fetch(url, {
      method: "GET",
      redirect: "follow"
    });

    if (!response.ok) {
      throw new Error(`서버 응답 오류 (${response.status})`);
    }

    const result = await response.json();

    resultBox.classList.remove("hidden");

    if (!result.ok) {
      resultBox.innerHTML = `
        <div class="status-error">
          <strong>조회되지 않았습니다.</strong>
          <p>${escapeHtml(result.message || "접수정보를 확인해주세요.")}</p>
        </div>
      `;
      return;
    }

    resultBox.innerHTML = `
      <div class="status-success">
        <div><span>접수번호</span><strong>${escapeHtml(result.receiptNo || "")}</strong></div>
        <div><span>신청자</span><strong>${escapeHtml(result.name || "")}</strong></div>
        <div><span>발명의 명칭</span><strong>${escapeHtml(result.inventionTitle || "")}</strong></div>
        <div><span>현재 상태</span><strong>${escapeHtml(result.status || "")}</strong></div>
        <div><span>담당자</span><strong>${escapeHtml(result.manager || "")}</strong></div>
        <div><span>최종 변경</span><strong>${escapeHtml(result.updatedAt || "")}</strong></div>
      </div>
    `;
  } catch (err) {
    console.error(err);

    resultBox.classList.remove("hidden");
    resultBox.innerHTML = `
      <div class="status-error">
        <strong>조회 중 오류가 발생했습니다.</strong>
        <p>${escapeHtml(err?.message || String(err))}</p>
      </div>
    `;
  } finally {
    button.disabled = false;
    button.textContent = "조회하기";
  }
}

// -----------------------------
// 간단 HTML escape
// -----------------------------
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// -----------------------------
// 진행상황 조회 모달 스타일
// -----------------------------
function injectStatusModalStyle() {
  if (document.getElementById("statusModalStyle")) return;

  const style = document.createElement("style");
  style.id = "statusModalStyle";

  style.textContent = `
    .status-modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 9999;
      display: grid;
      place-items: center;
      padding: 20px;
      background: rgba(3, 19, 34, .72);
      backdrop-filter: blur(5px);
    }

    .status-modal-card {
      position: relative;
      width: min(560px, 100%);
      background: #f7f2e7;
      padding: 34px;
      box-shadow: 0 30px 100px rgba(0,0,0,.35);
    }

    .status-modal-card h2 {
      margin: 0 0 8px;
      font-size: 30px;
      color: #152333;
    }

    .status-modal-desc {
      margin: 0 0 28px;
      color: #6b7785;
      line-height: 1.65;
    }

    .status-modal-close {
      position: absolute;
      right: 16px;
      top: 12px;
      border: 0;
      background: transparent;
      color: #596672;
      font-size: 28px;
      line-height: 1;
    }

    .status-modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 24px;
    }

    .status-result {
      margin-top: 24px;
      border-top: 1px solid #d9d4c9;
      padding-top: 20px;
    }

    .status-success {
      display: grid;
      gap: 10px;
    }

    .status-success > div {
      display: grid;
      grid-template-columns: 120px 1fr;
      gap: 14px;
      padding: 10px 0;
      border-bottom: 1px solid #e0dbd0;
    }

    .status-success span {
      color: #7a838d;
      font-size: 13px;
    }

    .status-success strong {
      color: #152333;
    }

    .status-error {
      padding: 16px;
      background: #fff1ef;
      border: 1px solid #edc7c0;
    }

    .status-error p {
      margin: 6px 0 0;
      color: #8a463a;
    }

    @media (max-width: 560px) {
      .status-modal-card {
        padding: 28px 20px 22px;
      }

      .status-success > div {
        grid-template-columns: 1fr;
        gap: 4px;
      }
    }
  `;

  document.head.appendChild(style);
}

// -----------------------------
// 이벤트
// -----------------------------
if (nextBtn) {
  nextBtn.addEventListener("click", () => {
    if (!validateCurrentStep()) return;

    saveDraft();

    currentStep = Math.min(currentStep + 1, steps.length - 1);
    renderStep();

    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

if (prevBtn) {
  prevBtn.addEventListener("click", () => {
    currentStep = Math.max(currentStep - 1, 0);
    renderStep();

    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

if (saveBtn) {
  saveBtn.addEventListener("click", () => saveDraft(true));
}

if (intakeForm) {
  intakeForm.addEventListener("input", () => {
    clearTimeout(window.__patentDraftTimer);

    if (saveState) saveState.textContent = "저장 중...";

    window.__patentDraftTimer = setTimeout(() => {
      saveDraft(false);
    }, 600);
  });

  intakeForm.addEventListener("submit", async e => {
    e.preventDefault();

    if (!validateCurrentStep()) return;

    await submitToServer();
  });
}

document.querySelectorAll("[data-start]").forEach(btn => {
  btn.addEventListener("click", () => {
    startWizard(btn.dataset.start);
  });
});

document.querySelectorAll("[data-service]").forEach(btn => {
  btn.addEventListener("click", () => {
    startWizard(btn.dataset.service);
  });
});

document.querySelectorAll("[data-go-home]").forEach(btn => {
  btn.addEventListener("click", e => {
    e.preventDefault();
    goHome();
  });
});

if (fileButton && fileInput) {
  fileButton.addEventListener("click", () => {
    fileInput.click();
  });

  fileInput.addEventListener("change", () => {
    const files = [...fileInput.files];

    if (fileList) {
      fileList.textContent = files.length
        ? files.map(f => f.name).join(" · ")
        : "";
    }
  });
}

// -----------------------------
// 시작
// -----------------------------
injectStatusModalStyle();
renderStep();
