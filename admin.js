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
const editManager = document.getElementById("editManager");
const editMemo = document.getElementById("editMemo");
const saveDetailBtn = document.getElementById("saveDetailBtn");
const saveDetailMessage = document.getElementById("saveDetailMessage");
const historyList = document.getElementById("historyList");

let adminKey = sessionStorage.getItem(SESSION_KEY) || "";
let applications = [];
let currentReceiptNo = "";

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

  if (!response.ok) throw new Error(`서버 응답 오류 (${response.status})`);

  const result = await response.json();
  if (!result.ok) throw new Error(result.message || "요청 처리 실패");
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
    await apiPost({ action: "adminList", adminKey: key });
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
  tbody.innerHTML = `<tr><td colspan="8" class="empty">접수 내역을 불러오는 중입니다.</td></tr>`;

  try {
    const result = await apiPost({
      action: "adminList",
      adminKey
    });

    applications = result.items || [];
    updateSummary(result.summary || {});
    renderTable();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" class="empty">${escapeHtml(err.message || String(err))}</td></tr>`;
  }
}

function updateSummary(summary) {
  document.getElementById("countAll").textContent = summary.all || 0;
  document.getElementById("countNew").textContent = summary["신규접수"] || 0;
  document.getElementById("countReview").textContent = summary["검토중"] || 0;
  document.getElementById("countRequest").textContent = summary["추가자료 요청"] || 0;
  document.getElementById("countFiling").textContent = summary["출원진행"] || 0;
  document.getElementById("countDone").textContent = summary["출원완료"] || 0;
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
    ].join(" ").toLowerCase();

    return (!q || hay.includes(q)) && (!status || item.status === status);
  });

  listCount.textContent = `${filtered.length}건`;

  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="empty">조건에 맞는 접수 내역이 없습니다.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(item => `
    <tr data-receipt="${escapeHtml(item.receiptNo)}">
      <td><strong>${escapeHtml(item.receiptNo)}</strong></td>
      <td>${escapeHtml(item.submittedAt || "")}</td>
      <td>${escapeHtml(item.serviceType || "")}</td>
      <td>${escapeHtml(item.name || "")}</td>
      <td>${escapeHtml(item.company || "")}</td>
      <td>${escapeHtml(item.inventionTitle || "")}</td>
      <td><span class="status-chip">${escapeHtml(item.status || "")}</span></td>
      <td>${escapeHtml(item.manager || "")}</td>
    </tr>
  `).join("");

  tbody.querySelectorAll("tr[data-receipt]").forEach(tr => {
    tr.addEventListener("click", () => openDetail(tr.dataset.receipt));
  });
}

async function openDetail(receiptNo) {
  currentReceiptNo = receiptNo;
  modal.classList.remove("hidden");
  detailReceiptNo.textContent = receiptNo;
  basicDetail.innerHTML = "불러오는 중...";
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
    detailStatusBadge.textContent = d.status || "";
    editStatus.value = d.status || "신규접수";
    editManager.value = d.manager || "";
    editMemo.value = d.memo || "";

    basicDetail.innerHTML = [
      ["접수일시", d.submittedAt],
      ["서비스", d.serviceType],
      ["신청자", d.name],
      ["회사/소속", d.company],
      ["연락처", d.phone],
      ["이메일", d.email],
    ].map(([k,v]) => detailItem(k,v)).join("");

    inventionDetail.innerHTML = [
      ["발명의 명칭", d.inventionTitle],
      ["기술 분야", d.technicalField],
      ["기존 방식의 문제점", d.existingProblem],
      ["해결 과제", d.objective],
      ["구성 및 구현 방법", d.implementation],
      ["도면 설명", d.drawingDescription],
      ["실험/성능 데이터", d.results],
      ["기대 효과", d.effects],
      ["핵심 차별점", d.differentiation],
      ["공개 여부", d.disclosed],
      ["공개 내용/참고사항", d.disclosureNote],
      ["첨부파일", d.attachmentInfo]
    ].map(([k,v]) => detailItem(k,v, true)).join("");

    const history = result.history || [];
    historyList.innerHTML = history.length
      ? history.map(h => `
          <div class="history-item">
            <strong>${escapeHtml(h.oldStatus || "—")} → ${escapeHtml(h.newStatus || "")}</strong>
            <small>${escapeHtml(h.time || "")} · ${escapeHtml(h.actor || "")} · ${escapeHtml(h.note || "")}</small>
          </div>
        `).join("")
      : `<div class="empty">진행이력이 없습니다.</div>`;
  } catch (err) {
    basicDetail.innerHTML = `<div class="empty">${escapeHtml(err.message || String(err))}</div>`;
  }
}

function detailItem(label, value, stack=false) {
  return `
    <div class="detail-item">
      <span>${escapeHtml(label)}</span>
      <${stack ? "p" : "strong"}>${escapeHtml(value || "—")}</${stack ? "p" : "strong"}>
    </div>
  `;
}

async function saveDetail() {
  if (!currentReceiptNo) return;

  saveDetailBtn.disabled = true;
  saveDetailBtn.textContent = "저장 중...";
  saveDetailMessage.textContent = "";

  try {
    await apiPost({
      action: "adminUpdate",
      adminKey,
      receiptNo: currentReceiptNo,
      newStatus: editStatus.value,
      manager: editManager.value.trim(),
      memo: editMemo.value.trim()
    });

    saveDetailMessage.textContent = "저장되었습니다.";
    await loadApplications();
    await openDetail(currentReceiptNo);
  } catch (err) {
    saveDetailMessage.textContent = err.message || String(err);
  } finally {
    saveDetailBtn.disabled = false;
    saveDetailBtn.textContent = "변경사항 저장";
  }
}

function closeModal() {
  modal.classList.add("hidden");
  currentReceiptNo = "";
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
  if (e.key === "Enter") login();
});
logoutBtn.addEventListener("click", () => {
  sessionStorage.removeItem(SESSION_KEY);
  adminKey = "";
  adminKeyInput.value = "";
  showLogin();
});
refreshBtn.addEventListener("click", loadApplications);
searchInput.addEventListener("input", renderTable);
statusFilter.addEventListener("change", renderTable);
modalCloseBtn.addEventListener("click", closeModal);
document.querySelector(".modal-backdrop").addEventListener("click", closeModal);
saveDetailBtn.addEventListener("click", saveDetail);

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
