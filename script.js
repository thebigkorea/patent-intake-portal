// 특허 상담·출원 접수 포털 - GitHub Pages 운영용 V2
// 1) 아래 API_URL에 Apps Script "웹 앱 URL"을 붙여넣으세요.
// 2) 예: https://script.google.com/macros/s/AKfycb.../exec

const API_URL = '여기에_APPS_SCRIPT_웹앱_URL';

const homeView = document.getElementById("homeView");
const wizardView = document.getElementById("wizardView");
const successView = document.getElementById("successView");
const form = document.getElementById("intakeForm");
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

let currentStep = 0;
let serviceType = "precheck";
let isSubmitting = false;

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
    subtitle: "현재 V2에서는 특허 질문 흐름으로 연결됩니다. 상표·디자인 전용 폼은 다음 단계에서 분리합니다."
  }
};

function showView(view) {
  [homeView, wizardView, successView].forEach(v => v.classList.add("hidden"));
  view.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function startWizard(type = "precheck") {
  if (type === "status") {
    showStatusLookup();
    return;
  }

  serviceType = type;
  const meta = serviceMeta[type] || serviceMeta.precheck;
  wizardTitle.textContent = meta.title;
  wizardSubtitle.textContent = meta.subtitle;

  loadDraft();
  showView(wizardView);
  renderStep();
}

function renderStep() {
  steps.forEach((step, idx) => step.classList.toggle("active", idx === currentStep));

  const isReview = currentStep === steps.length - 1;
  const title = steps[currentStep].querySelector("h3")?.textContent || "접수";
  const displayStep = Math.min(currentStep + 1, 11);

  stepLabel.textContent = isReview ? "REVIEW" : `STEP ${String(displayStep).padStart(2, "0")} / 11`;
  stepTitleTop.textContent = title;
  progressBar.style.width = `${((currentStep + 1) / steps.length) * 100}%`;

  prevBtn.style.visibility = currentStep === 0 ? "hidden" : "visible";
  nextBtn.classList.toggle("hidden", isReview);
  submitBtn.classList.toggle("hidden", !isReview);

  if (isReview) buildReview();
}

function validateCurrentStep() {
  const section = steps[currentStep];
  const required = [...section.querySelectorAll("[required]")];

  for (const el of required) {
    if (el.type === "radio") {
      const group = form.querySelectorAll(`[name="${el.name}"]`);
      if (![...group].some(r => r.checked)) {
        alert("필수 항목을 선택해주세요.");
        return false;
      }
      continue;
    }

    if (el.type === "checkbox" && !el.checked) {
      alert("필수 동의 항목을 확인해주세요.");
      return false;
    }

    if (!String(el.value || "").trim()) {
      el.focus();
      el.reportValidity();
      return false;
    }
  }

  return true;
}

function formDataObject() {
  const fd = new FormData(form);
  const obj = {};

  for (const [key, value] of fd.entries()) {
    if (value instanceof File) continue;

    if (obj[key]) {
      if (!Array.isArray(obj[key])) obj[key] = [obj[key]];
      obj[key].push(value);
    } else {
      obj[key] = value;
    }
  }

  obj.serviceType = serviceType;
  obj.attachmentNames = [...document.getElementById("fileInput").files]
    .map(f => f.name)
    .join(", ");

  return obj;
}

function saveDraft(manual = false) {
  localStorage.setItem("patentIntakeDraft", JSON.stringify({
    serviceType,
    currentStep,
    data: formDataObject()
  }));

  saveState.textContent = manual ? "임시저장 완료" : "자동저장됨";

  if (manual) {
    setTimeout(() => saveState.textContent = "임시저장됨", 1400);
  }
}

function loadDraft() {
  const raw = localStorage.getItem("patentIntakeDraft");
  if (!raw) return;

  try {
    const draft = JSON.parse(raw);
    if (!draft?.data) return;

    Object.entries(draft.data).forEach(([name, value]) => {
      const fields = [...form.querySelectorAll(`[name="${name}"]`)];
      if (!fields.length) return;

      fields.forEach(field => {
        if (field.type === "radio") {
          field.checked = field.value === value;
        } else if (field.type === "checkbox") {
          field.checked = value === "on" || value === true;
        } else {
          field.value = Array.isArray(value) ? value[0] : value;
        }
      });
    });
  } catch (e) {
    console.warn("Draft load failed", e);
  }
}

const labels = {
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
  const data = formDataObject();
  reviewContent.innerHTML = "";

  Object.entries(labels).forEach(([key, label]) => {
    const value = data[key] || "—";
    const item = document.createElement("div");
    item.className = "review-item";
    item.innerHTML = `<strong>${label}</strong><span></span>`;
    item.querySelector("span").textContent = value;
    reviewContent.appendChild(item);
  });
}

async function submitToServer() {
  if (!API_URL || API_URL.includes("여기에_")) {
    alert("script.js 상단의 API_URL에 Apps Script 웹 앱 주소를 먼저 넣어주세요.");
    return;
  }

  if (isSubmitting) return;
  isSubmitting = true;

  submitBtn.disabled = true;
  submitBtn.textContent = "접수 중...";

  try {
    const payload = {
      action: "submit",
      ...formDataObject(),
      website: "" // honeypot
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
      throw new Error(result.message || "접수에 실패했습니다.");
    }

    localStorage.removeItem("patentIntakeDraft");

    receiptNo.textContent = result.receiptNo;
    form.reset();
    currentStep = 0;
    showView(successView);
  } catch (err) {
    console.error(err);
    alert(
      "접수 중 오류가 발생했습니다.\n\n" +
      (err.message || err) +
      "\n\n잠시 후 다시 시도해주세요."
    );
  } finally {
    isSubmitting = false;
    submitBtn.disabled = false;
    submitBtn.textContent = "접수하기";
  }
}

function showStatusLookup() {
  const receipt = prompt("접수번호를 입력해주세요.\n예: IP-20260908-0001");
  if (!receipt) return;

  const phone = prompt("신청 당시 연락처를 입력해주세요.\n예: 010-1234-5678");
  if (!phone) return;

  lookupStatus(receipt, phone);
}

async function lookupStatus(receipt, phone) {
  if (!API_URL || API_URL.includes("여기에_")) {
    alert("script.js 상단의 API_URL에 Apps Script 웹 앱 주소를 먼저 넣어주세요.");
    return;
  }

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

    if (!result.ok) {
      alert(result.message || "조회 결과가 없습니다.");
      return;
    }

    alert(
      `접수번호: ${result.receiptNo}\n` +
      `신청자: ${result.name}\n` +
      `발명의 명칭: ${result.inventionTitle}\n` +
      `현재 상태: ${result.status}\n` +
      `담당자: ${result.manager}\n` +
      `최종 변경: ${result.updatedAt}`
    );
  } catch (err) {
    console.error(err);
    alert("진행상황 조회 중 오류가 발생했습니다.\n" + (err.message || err));
  }
}

function generateLocalFallbackReceipt() {
  const now = new Date();
  const date = now.toISOString().slice(0,10).replaceAll("-","");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `TEMP-${date}-${rand}`;
}

nextBtn.addEventListener("click", () => {
  if (!validateCurrentStep()) return;

  saveDraft();
  currentStep = Math.min(currentStep + 1, steps.length - 1);
  renderStep();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

prevBtn.addEventListener("click", () => {
  currentStep = Math.max(currentStep - 1, 0);
  renderStep();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

saveBtn.addEventListener("click", () => saveDraft(true));

form.addEventListener("input", () => {
  clearTimeout(window.__draftTimer);
  saveState.textContent = "저장 중...";
  window.__draftTimer = setTimeout(() => saveDraft(), 600);
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!validateCurrentStep()) return;
  await submitToServer();
});

document.querySelectorAll("[data-start]").forEach(btn => {
  btn.addEventListener("click", () => startWizard(btn.dataset.start));
});

document.querySelectorAll("[data-service]").forEach(btn => {
  btn.addEventListener("click", () => startWizard(btn.dataset.service));
});

document.querySelectorAll("[data-go-home]").forEach(btn => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    showView(homeView);
  });
});

const fileInput = document.getElementById("fileInput");
const fileButton = document.getElementById("fileButton");
const fileList = document.getElementById("fileList");

fileButton.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", () => {
  const files = [...fileInput.files];

  fileList.textContent = files.length
    ? files.map(f => f.name).join(" · ")
    : "";
});

renderStep();
