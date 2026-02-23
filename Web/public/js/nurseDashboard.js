document.addEventListener("DOMContentLoaded", () => {
  init();
});

let patients = [];
let socket = null;
let currentEditingId = null;
const userData = { type: "patient", patient: { devices: {} } };

/* ======================
   Init
====================== */
async function init() {
  await loadPatients();
  bindSearch();
  bindLogout();
  bindTableActions();
  initSocket();
}

/* ======================
   Load Patients
====================== */
async function loadPatients() {
  try {
    const res = await fetch("/nurse/getPatients", {
      method: "POST",
      credentials: "include",
    });

    const result = await res.json();
    patients = result.data || [];

    updateStats();
    renderPatientsTable();
  } catch (err) {
    console.error(err);
    alert("خطا در دریافت اطلاعات بیماران");
  }
}

/* ======================
   Stats
====================== */
function updateStats() {
  const total = document.getElementById("totalPatients");
  if (total) total.textContent = patients.length;
}

/* ======================
   Render Table
====================== */
function renderPatientsTable(filtered = patients) {
  const tableBody = document.getElementById("patientsTableBody");
  if (!tableBody) return;

  tableBody.innerHTML = filtered
    .map(
      (p) => `
      <tr data-id="${p._id}">
        <td>${p.firstName} ${p.lastName}</td>
        <td>${p.phoneNumber}</td>
        <td>${formatDate(p.birthday)}</td>
        <td>${p.nurseId.firstName} ${p.nurseId.lastName}</td>
        <td>
          <button class="btn-edit" data-id="${p._id}">ویرایش</button>
          <button class="btn-delete" data-id="${p._id}">حذف</button>
        </td>
      </tr>
    `
    )
    .join("");
}

/* ======================
   Search
====================== */
function bindSearch() {
  const searchInput = document.getElementById("searchInput");
  if (!searchInput) return;

  searchInput.addEventListener("input", (e) => {
    const value = e.target.value.toLowerCase().trim();
    const filtered = patients.filter((p) =>
      p.firstName.toLowerCase().includes(value)
    );
    renderPatientsTable(filtered);
  });
}

/* ======================
   Table Actions
====================== */
function bindTableActions() {
  const tableBody = document.getElementById("patientsTableBody");
  if (!tableBody) return;

  tableBody.addEventListener("click", (e) => {
    const id = e.target.dataset.id;
    if (!id) return;

    if (e.target.classList.contains("btn-delete")) {
      deletePatient(id);
    } else if (e.target.classList.contains("btn-edit")) {
      const patient = patients.find((p) => p._id === id);
      if (patient) openEditModal(patient);
    }
  });
}

/* ======================
   Delete
====================== */
async function deletePatient(id) {
  if (!confirm("آیا از حذف این بیمار مطمئن هستید؟")) return;

  try {
    const res = await fetch(`/patient/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) throw new Error();

    patients = patients.filter((p) => p._id !== id);
    renderPatientsTable();
    updateStats();
  } catch {
    alert("حذف بیمار با خطا مواجه شد");
  }
}

/* ======================
   Edit Modal
====================== */
function openEditModal(patient) {
  currentEditingId = patient._id;
  const form = document.getElementById("editPatientForm");

  // اطلاعات پایه
  form.firstName.value = patient.firstName || "";
  form.lastName.value = patient.lastName || "";
  form.phoneNumber.value = patient.phoneNumber || "";
  form.birthday.value = patient.birthday || "";

  // دستگاه‌ها
  form.rfid.value = patient.devices?.rfid || "";
  form.ble.value = patient.devices?.ble || "";

  if (patient.devices?.face) {
    const preview = document.getElementById("facePreview");
    preview.src = patient.devices.face;
    preview.style.display = "block";
  } else {
    document.getElementById("facePreview").style.display = "none";
  }

  document.getElementById("editPatientModal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("editPatientModal").classList.add("hidden");
}

/* ======================
   Form Submit
====================== */
document
  .getElementById("editPatientForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    // تبدیل تصویر face به Base64
    const faceFile = formData.get("face");
    if (faceFile && faceFile.size > 0) {
      formData.set("face", await fileToBase64(faceFile));
    }

    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch(`/patients/${currentEditingId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) return alert(result.message || "خطا در ویرایش بیمار");

      showToast("ویرایش با موفقیت انجام شد");
      closeModal();

      // بروزرسانی جدول بدون reload
      const row = document.querySelector(`tr[data-id="${currentEditingId}"]`);
      row.cells[0].textContent = `${data.firstName} ${data.lastName}`;
      row.cells[1].textContent = data.phoneNumber;
      row.cells[2].textContent = formatDate(data.birthday);
    } catch (err) {
      console.error(err);
      alert("خطا در ارتباط با سرور");
    }
  });

/* ======================
   Face Preview
====================== */
document.getElementById("patientFace").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const preview = document.getElementById("facePreview");
    preview.src = reader.result;
    preview.style.display = "block";
  };
  reader.readAsDataURL(file);
});

/* ======================
   Socket.IO
====================== */
function initSocket() {
  if (typeof io === "undefined") return;

  try {
    socket = io();
    socket.on("connect", () => console.log("Socket connected", socket.id));

    socket.on("recognition:scan", ({ device, value } = {}) => {
      if (!userData.patient || !device || !value) return;
      userData.patient.devices[device] = value;

      const el =
        device === "fr"
          ? document.getElementById("patientFace")
          : device === "ble"
          ? document.getElementById("patientBle")
          : document.getElementById("patientRfid");

      if (el) {
        el.value = value;
        el.classList.add("highlight");
        setTimeout(() => el.classList.remove("highlight"), 1500);
        showToast(`${device.toUpperCase()} دریافت شد`);
      }
    });

    socket.on("image", (data) => {
      const blob = new Blob([data], { type: "image/jpeg" });
      document.getElementById("cam").src = URL.createObjectURL(blob);
    });
  } catch (err) {
    console.warn("Socket.IO init failed", err);
  }
}

// دکمه اسکن دستی
function scanDevice(type) {
  if (!socket) return;
  socket.emit("scan:start", { device: type });
}

/* ======================
   Logout
====================== */
function bindLogout() {
  const logoutBtn = document.querySelector(".logout-btn");
  if (!logoutBtn) return;

  logoutBtn.addEventListener("click", async () => {
    if (!confirm("آیا از خروج از سیستم اطمینان دارید؟")) return;

    const res = await fetch("/nurse", {
      method: "POST",
      credentials: "include",
    });

    if (res.ok) window.location.href = "/";
    else alert("خروج ناموفق بود");
  });
}

/* ======================
   Utils
====================== */
function formatDate(date) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-CA");
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ======================
   Toast
====================== */
function showToast(message) {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => el.classList.add("visible"), 10);
  setTimeout(() => {
    el.classList.remove("visible");
    setTimeout(() => el.remove(), 300);
  }, 2200);
}
