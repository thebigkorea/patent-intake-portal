const API_URL = "https://script.google.com/macros/s/AKfycbwty1ir537jUHhGDE088UtX3tkqhqXfShEa_KXEa2JU6lpX83dCI23UIUMm5GNrprCq/exec";
const SESSION_KEY = "patentAdminKeySession";

const loginView = document.getElementById("loginView");
const dashboardView = document.getElementById("dashboardView");
const adminKeyInput = document.getElementById("adminKeyInput");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const loginMessage = document.getElementById("loginMessage");
const refreshBtn = document.getElementById("refreshBtn");

const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const tbody = document.getElementById("applicationTableBody");
const listCount = document.getElementById("listCount");

const modal = document.getElementById("detailModal");
const modalCloseBtn = document.getElementById("modalCloseBtn");
const basicDetail = document.getElementById("basicDetail");
const inventionDetail = document.getElementById("inventionDetail");
const detailReceiptNo = document.getElementById("detailReceiptNo");
const detailStatusBadge = document.getElementById("detailStatusBadge");

const editStatus = document.getElementById("editStatus");
const editManagerSelect = document.getElementById("editManagerSelect");
const editManagerCustom = document.getElementById("editManagerCustom");
const customManagerField = document.getElementById("customManagerField");
const editMemo = document.getElementById("editMemo");

const saveDetailBtn = document.getElementById("saveDetailBtn");
const saveDetailMessage = document.getElementById("saveDetailMessage");
const historyList = document.getElementById("historyList");

let adminKey = sessionStorage.getItem(SESSION_KEY) || "";
let applications = [];
let currentReceiptNo = "";

// 나중에 실제 변리사 이름이 정해지면 이 배열에 추가하면 됩니다.
const MANAGER_OPTIONS = [];

function showDashboard() {
  loginView.classList.add("hidden");
  dashboardView.classList.remove("hidden");
  logoutBtn.classList.remove("hidden");
}

function showLogin() {
  dashboardView.classList.add("hidden");
  loginView.classList.remove("hidden");
  logoutBtn.classList.add("hidden");
}

async function apiPost(payload) {
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
    throw new Error(result.message || "요청 처리 실패");
  }

  return result;
}

async function login() {
  const key = adminKeyInput.value.trim();

  if (!key) {
    loginMessage.textContent = "관리자 비밀번호를 입력해주세요.";
    return;
  }

  loginBtn.disabled = true;
  loginBtn.textContent = "확인 중...";
  loginMessage.textContent = "";

  try {
    await apiPost({
      action: "adminList",
      adminKey: key
    });

    adminKey = key;
    sessionStorage.setItem(SESSION_KEY, key);

    showDashboard();
    await loadApplications();

  } catch (err) {
    loginMessage.textContent = err.message || String(err);

  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = "관리자 로그인";
  }
}

async function loadApplications() {
  tbody.innerHTML =
    `<tr><td colspan="8" class="empty">접수 내역을 불러오는 중입니다.</td></tr>`;

  try {
    const result = await apiPost({
      action: "adminList",
      adminKey
    });

    applications = result.items || [];

    updateSummary(result.summary || {});
    renderTable();

  } catch (err) {
    tbody.innerHTML =
      `<tr><td colspan="8" class="empty">${escapeHtml(err.message || String(err))}</td></tr>`;
  }
}

function updateSummary(summary) {
  document.getElementById("countAll").textContent =
    summary.all || 0;

  document.getElementById("countNew").textContent =
    summary["신규접수"] || 0;

  document.getElementById("countReview").textContent =
    summary["검토중"] || 0;

  document.getElementById("countRequest").textContent =
    summary["추가자료 요청"] || 0;

  document.getElementById("countFiling").textContent =
    summary["출원진행"] || 0;

  document.getElementById("countDone").textContent =
    summary["출원완료"] || 0;
}

function renderTable() {
  const q = searchInput.value.trim().toLowerCase();
  const status = statusFilter.value;

  const filtered = applications.filter(item => {
    const hay = [
      item.receiptNo,
      item.name,
      item.company,
      item.inventionTitle,
      item.serviceType
    ]
      .join(" ")
      .toLowerCase();

    return (
      (!q || hay.includes(q)) &&
      (!status || item.status === status)
    );
  });

  listCount.textContent = `${filtered.length}건`;

  if (!filtered.length) {
    tbody.innerHTML =
      `<tr><td colspan="8" class="empty">조건에 맞는 접수 내역이 없습니다.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered
    .map(item => `
      <tr data-receipt="${escapeHtml(item.receiptNo)}">
        <td><strong>${escapeHtml(item.receiptNo)}</strong></td>
        <td>${escapeHtml(item.submittedAt || "")}</td>
        <td>${escapeHtml(item.serviceType || "")}</td>
        <td>${escapeHtml(item.name || "")}</td>
        <td>${escapeHtml(item.company || "")}</td>
        <td>${escapeHtml(item.inventionTitle || "")}</td>
        <td>
          <span class="status-chip" data-status="${escapeHtml(item.status || "")}">
            ${escapeHtml(item.status || "")}
          </span>
        </td>
        <td>${escapeHtml(item.manager || "")}</td>
      </tr>
    `)
    .join("");

  tbody
    .querySelectorAll("tr[data-receipt]")
    .forEach(tr => {
      tr.addEventListener("click", () => {
        openDetail(tr.dataset.receipt);
      });
    });
}

async function openDetail(receiptNo) {
  currentReceiptNo = receiptNo;

  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";

  detailReceiptNo.textContent = receiptNo;
  basicDetail.innerHTML = `<div class="empty">불러오는 중...</div>`;
  inventionDetail.innerHTML = "";
  historyList.innerHTML = "";
  saveDetailMessage.textContent = "";

  try {
    const result = await apiPost({
      action: "adminDetail",
      adminKey,
      receiptNo
    });

    const d = result.item;

    detailStatusBadge.textContent =
      d.status || "신규접수";
    detailStatusBadge.dataset.status =
      d.status || "신규접수";

    editStatus.value =
      d.status || "신규접수";

    setManagerValue(d.manager || "");

    editMemo.value =
      d.memo || "";

    basicDetail.innerHTML = [
      ["접수일시", d.submittedAt],
      ["서비스", d.serviceType],
      ["신청자", d.name],
      ["회사/소속", d.company],
      ["연락처", d.phone],
      ["이메일", d.email]
    ]
      .map(([label, value]) =>
        detailItem(label, value)
      )
      .join("");

    const inventionItems = [
      {
        label: "발명의 명칭",
        value: d.inventionTitle,
        wide: true,
        featured: true
      },
      {
        label: "기술 분야",
        value: d.technicalField
      },
      {
        label: "기존 방식의 문제점",
        value: d.existingProblem
      },
      {
        label: "해결 과제",
        value: d.objective
      },
      {
        label: "구성 및 구현 방법",
        value: d.implementation
      },
      {
        label: "도면 설명",
        value: d.drawingDescription
      },
      {
        label: "실험/성능 데이터",
        value: d.results
      },
      {
        label: "기대 효과",
        value: d.effects
      },
      {
        label: "핵심 차별점",
        value: d.differentiation,
        wide: true,
        featured: true
      },
      {
        label: "공개 여부",
        value: d.disclosed
      },
      {
        label: "공개 내용/참고사항",
        value: d.disclosureNote,
        wide: true
      },
      {
        label: "첨부파일",
        value: d.attachmentInfo,
        wide: true
      }
    ];

    inventionDetail.innerHTML =
      inventionItems
        .map(item => inventionItem(item))
        .join("");

    const history = result.history || [];

    historyList.innerHTML = history.length
      ? history
          .map(h => `
            <div class="history-item">
              <strong>
                ${escapeHtml(h.oldStatus || "—")}
                →
                ${escapeHtml(h.newStatus || "")}
              </strong>
              <small>
                ${escapeHtml(h.time || "")}
                ·
                ${escapeHtml(h.actor || "")}
                ·
                ${escapeHtml(h.note || "")}
              </small>
            </div>
          `)
          .join("")
      : `<div class="empty">진행이력이 없습니다.</div>`;

  } catch (err) {
    basicDetail.innerHTML =
      `<div class="empty">${escapeHtml(err.message || String(err))}</div>`;
  }
}

function detailItem(label, value) {
  return `
    <div class="detail-item">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value || "—")}</strong>
    </div>
  `;
}

function inventionItem(item) {
  const classes = [
    "detail-item",
    item.wide ? "wide" : "",
    item.featured ? "featured" : ""
  ]
    .filter(Boolean)
    .join(" ");

  return `
    <div class="${classes}">
      <span>${escapeHtml(item.label)}</span>
      <p>${escapeHtml(item.value || "—")}</p>
    </div>
  `;
}

function populateManagerOptions() {
  MANAGER_OPTIONS.forEach(name => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    editManagerSelect.insertBefore(
      option,
      editManagerSelect.querySelector('option[value="__custom__"]')
    );
  });
}

function setManagerValue(manager) {
  const normalized = String(manager || "").trim();

  if (!normalized) {
    editManagerSelect.value = "";
    editManagerCustom.value = "";
    customManagerField.classList.add("hidden");
    return;
  }

  const hasOption =
    [...editManagerSelect.options]
      .some(opt => opt.value === normalized);

  if (hasOption) {
    editManagerSelect.value = normalized;
    editManagerCustom.value = "";
    customManagerField.classList.add("hidden");
  } else {
    editManagerSelect.value = "__custom__";
    editManagerCustom.value = normalized;
    customManagerField.classList.remove("hidden");
  }
}

function getManagerValue() {
  if (editManagerSelect.value === "__custom__") {
    return editManagerCustom.value.trim();
  }

  return editManagerSelect.value.trim();
}

async function saveDetail() {
  if (!currentReceiptNo) return;

  saveDetailBtn.disabled = true;
  saveDetailBtn.textContent = "저장 중...";
  saveDetailMessage.textContent = "";

  try {
    const manager = getManagerValue();

    await apiPost({
      action: "adminUpdate",
      adminKey,
      receiptNo: currentReceiptNo,
      newStatus: editStatus.value,
      manager,
      memo: editMemo.value.trim()
    });

    saveDetailMessage.textContent =
      "저장되었습니다.";

    await loadApplications();
    await openDetail(currentReceiptNo);

  } catch (err) {
    saveDetailMessage.textContent =
      err.message || String(err);

  } finally {
    saveDetailBtn.disabled = false;
    saveDetailBtn.textContent =
      "변경사항 저장";
  }
}

function closeModal() {
  modal.classList.add("hidden");
  currentReceiptNo = "";
  document.body.style.overflow = "";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

loginBtn.addEventListener("click", login);

adminKeyInput.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    login();
  }
});

logoutBtn.addEventListener("click", () => {
  sessionStorage.removeItem(SESSION_KEY);

  adminKey = "";
  adminKeyInput.value = "";

  showLogin();
});

refreshBtn.addEventListener(
  "click",
  loadApplications
);

searchInput.addEventListener(
  "input",
  renderTable
);

statusFilter.addEventListener(
  "change",
  renderTable
);

modalCloseBtn.addEventListener(
  "click",
  closeModal
);

document
  .querySelector(".modal-backdrop")
  .addEventListener("click", closeModal);

saveDetailBtn.addEventListener(
  "click",
  saveDetail
);

editManagerSelect.addEventListener(
  "change",
  () => {
    const custom =
      editManagerSelect.value === "__custom__";

    customManagerField.classList.toggle(
      "hidden",
      !custom
    );

    if (custom) {
      setTimeout(() => {
        editManagerCustom.focus();
      }, 0);
    }
  }
);

document.addEventListener("keydown", e => {
  if (
    e.key === "Escape" &&
    !modal.classList.contains("hidden")
  ) {
    closeModal();
  }
});

populateManagerOptions();

if (adminKey) {
  showDashboard();

  loadApplications().catch(() => {
    sessionStorage.removeItem(SESSION_KEY);
    adminKey = "";
    showLogin();
  });

} else {
  showLogin();
}
