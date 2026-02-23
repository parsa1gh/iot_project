document.addEventListener("DOMContentLoaded", async () => {
  const res = await fetch("/nurse/getPatients", {
    method: "POST",
    credentials: "include",
  });

  const data = await res.json();
  const patients = data.data;

  document.getElementById("totalPatients").textContent = patients.length;

  const critical = patients.filter((p) => p.status === "critical").length;
  document.getElementById("criticalCount").textContent = critical;

  const tbody = document.getElementById("patientsTableBody");

  tbody.innerHTML = patients
    .map(
      (p) => `
    <tr>
      <td>#${p._id.slice(-5)}</td>
      <td>${p.firstName}</td>
      <td>
        ${p.status === "critical" ? "🔴 بحرانی" : "🟢 پایدار"}
      </td>
      <td>
        <button class="control-btn" data-id="${p._id}">
          حذف نود
        </button>
      </td>
    </tr>
  `
    )
    .join("");

  tbody.addEventListener("click", async (e) => {
    if (!e.target.classList.contains("control-btn")) return;

    const id = e.target.dataset.id;

    if (!confirm("این نود برای همیشه از شبکه حذف شود؟")) return;

    const res = await fetch(`/nurse/patient/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (res.ok) {
      e.target.closest("tr").remove();
      document.getElementById("totalPatients").textContent--;
    } else {
      alert("خطا در اجرای فرمان");
    }
  });
});
