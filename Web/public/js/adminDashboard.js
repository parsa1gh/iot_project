let nurses = [];
let editingId = null;

/* Load Nurses */
async function loadNurses() {
  const res = await fetch("/nurse", { credentials: "include" });
  const result = await res.json();
  nurses = result.nurses;

  document.getElementById("totalNurses").textContent = nurses.length;
  render();
}

function render() {
  document.getElementById("nursesTable").innerHTML = nurses
    .map(
      (n) => `
      <tr>
        <td>${n.firstName} ${n.lastName}</td>
        <td>${n.phoneNumber}</td>
        <td>
          <button class="btn-edit" onclick="openEdit('${n._id}')">ویرایش</button>
          <button class="btn-delete" onclick="deleteNurse('${n._id}')">حذف</button>
          <button class="btn-view" onclick="viewPatients('${n._id}')">بیماران</button>
        </td>
      </tr>
    `
    )
    .join("");
}

/* Delete */
async function deleteNurse(id) {
  if (!confirm("حذف شود؟")) return;

  await fetch(`/nurse/${id}`, {
    method: "delete",
    credentials: "include",
  });
  nurses = nurses.filter((n) => n._id !== id);
  render();
}

/* =======================
   EDIT (UPDATED SECTION)
   ======================= */

function openEdit(id) {
  editingId = id;
  // console.log(editingId);
  const nurse = nurses.find((n) => n._id === id);

  document.getElementById("editFirstName").value = nurse.firstName;
  document.getElementById("editLastName").value = nurse.lastName;
  document.getElementById("editPhone").value = nurse.phoneNumber;
  document.getElementById("editBirthday").value = nurse.birthday
    ? nurse.birthday.split("T")[0]
    : "";
  document.getElementById("editPassword").value = "";

  document.getElementById("editModal").style.display = "flex";
}

async function saveEdit() {
  const data = {
    firstName: document.getElementById("editFirstName").value.trim(),
    lastName: document.getElementById("editLastName").value.trim(),
    phoneNumber: document.getElementById("editPhone").value.trim(),
    birthday: document.getElementById("editBirthday").value,
  };

  const password = document.getElementById("editPassword").value;
  if (password) data.password = password;
  const res = await fetch(`/nurse/${editingId}`, {
    method: "put",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  const result = await res.json();
  console.log(result);
  const index = nurses.findIndex((n) => n._id === editingId);
  nurses[index] = { ...nurses[index], ...data };

  closeEdit();
  render();
}

function closeEdit() {
  document.getElementById("editModal").style.display = "none";
}

/* Patients */
async function viewPatients(id) {
  const res = await fetch(`/nurse/getPatients`, {
    method: "POST",
    headers: { "Content-Type": "application/json" }, // مهم!
    body: JSON.stringify({ id }),
    credentials: "include",
  });
  const result = await res.json();
  console.log(result);
  document.getElementById("patientsList").innerHTML = result.data
    .map((p) => `<li>${p.firstName}</li>`)
    .join("");

  document.getElementById("patientsModal").style.display = "flex";
}

function closePatients() {
  document.getElementById("patientsModal").style.display = "none";
}

loadNurses();
