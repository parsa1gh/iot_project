// داده‌های ذخیره شده
const userData = {
  type: "nurse",
  nurse: {},
  patient: {
    devices: {
      rfid: null,
      blu: null,
      face: null,
    },
  },
};

// تغییر نوع کاربر
document.querySelectorAll(".user-type").forEach((type) => {
  type.addEventListener("click", function () {
    const userType = this.dataset.type;

    // حذف active از همه
    document
      .querySelectorAll(".user-type")
      .forEach((t) => t.classList.remove("active"));
    // اضافه کردن active به انتخاب شده
    this.classList.add("active");

    // تغییر فرم
    if (userType === "nurse") {
      document.getElementById("nurseForm").style.display = "block";
      document.getElementById("patientForm").style.display = "none";
      document.getElementById("registerBtn").textContent = "ثبت‌نام پرستار";
      userData.type = "nurse";
    } else {
      document.getElementById("nurseForm").style.display = "none";
      document.getElementById("patientForm").style.display = "block";
      document.getElementById("registerBtn").textContent = "ثبت‌نام بیمار";
      userData.type = "patient";
    }
  });
});

// ثبت کاربر
// socket listener: auto-fill device fields for patients
let socket = null;

function showToast(message) {
  const container = document.getElementById("toast-container");
  if (container) {
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
}

if (typeof io !== "undefined") {
  try {
    socket = io();
    socket.on("connect", () => console.log("Socket connected", socket.id));
    socket.on("recognition:scan", (payload) => {
      // only fill when patient form is active
      if (userData.type !== "patient") return;
      const { device, value } = payload || {};
      if (!device || !value) return;
      if (device === "rfid") {
        userData.patient.devices.rfid = value;
        const el = document.getElementById("patientRfid");
        if (el) {
          el.value = value;
          el.classList.add("highlight");
          setTimeout(() => el.classList.remove("highlight"), 1500);
          showToast("RFID دریافت شد");
        }
      } else if (device === "ble") {
        userData.patient.devices.ble = value;
        const el = document.getElementById("patientBle");
        if (el) {
          el.value = value;
          el.classList.add("highlight");
          setTimeout(() => el.classList.remove("highlight"), 1500);
          showToast("BLE دریافت شد");
        }
      } else if (device === "fr") {
        userData.patient.devices.face = value;
        const el = document.getElementById("patientFace");
        if (el) {
          el.value = value;
          el.classList.add("highlight");
          setTimeout(() => el.classList.remove("highlight"), 1500);
          showToast("چهره دریافت شد");
        }
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

async function registerUser() {
  const registerBtn = document.getElementById("registerBtn");

  if (userData.type === "nurse") {
    // ثبت پرستار
    const nurseData = {
      firstName: document.getElementById("nurseFirstName").value,
      lastName: document.getElementById("nurseLastName").value,
      phoneNumber: document.getElementById("nursePhone").value,
      password: document.getElementById("nursePassword").value,
      birthday: document.getElementById("nurseBirthday").value,
    };

    // اعتبارسنجی
    if (
      !nurseData.firstName ||
      !nurseData.lastName ||
      !nurseData.phoneNumber ||
      !nurseData.password
    ) {
      alert("لطفا همه فیلدهای ضروری را پر کنید");
      return;
    }

    registerBtn.disabled = true;
    registerBtn.textContent = "در حال ثبت...";

    try {
      const response = await fetch("nurse/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(nurseData),
      });

      const result = await response.json();
      if (response.ok) {
        alert("✅ پرستار با موفقیت ثبت شد");
        // ریست فرم
        document
          .querySelectorAll("#nurseForm input")
          .forEach((input) => (input.value = ""));
        // هدایت به صفحه لاگین
        setTimeout(() => {
          window.location.href = "/";
        }, 1500);
      } else {
        alert(`error: ${JSON.stringify(result.error)}`);
      }
    } catch (error) {
      alert("❌ خطا در ارتباط با سرور");
    } finally {
      registerBtn.disabled = false;
      registerBtn.textContent = "ثبت‌نام پرستار";
    }
  } else {
    // ثبت بیمار
    const patientData = {
      firstName: document.getElementById("patientFirstName").value,
      lastName: document.getElementById("patientLastName").value,
      phoneNumber: document.getElementById("patientPhone").value,
      password: document.getElementById("patientPassword").value,
      birthday: document.getElementById("patientBirthday").value,
      rfId: document.getElementById("patientRfid")?.value || null,
      ble: document.getElementById("patientBle")?.value || null,
      fr: document.getElementById("patientFace")?.value || null,
    };

    // اعتبارسنجی
    if (
      !patientData.firstName ||
      !patientData.lastName ||
      !patientData.phoneNumber ||
      !patientData.password ||
      !patientData.birthday
    ) {
      alert("لطفا همه فیلدهای ضروری را پر کنید");
      return;
    }

    registerBtn.disabled = true;
    registerBtn.textContent = "در حال ثبت...";

    try {
      const response = await fetch("/patient", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(patientData),
      });

      const result = await response.json();

      if (response.ok) {
        alert("✅ بیمار با موفقیت ثبت شد");
        // ریست همه چیز
        document
          .querySelectorAll("#patientForm input")
          .forEach((input) => (input.value = ""));
        // هدایت به صفحه لاگین
        setTimeout(() => {
          window.location.href = "/";
        }, 1500);
      } else {
        console.log(result);
        alert(`❌ خطا: ${result.message || "خطا در ثبت"}`);
      }
    } catch (error) {
      console.log(error);
      alert("❌ خطا در ارتباط با سرور");
    } finally {
      registerBtn.disabled = false;
      registerBtn.textContent = "ثبت‌نام بیمار";
    }
  }
}
