const loginForm = document.getElementById("login-form");
const submitBtn = document.querySelector(".submit");
const userTypeInput = document.getElementById("userType");
const userTypeButtons = document.querySelectorAll(".user-type");

// انتخاب نوع کاربر
userTypeButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    userTypeButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    userTypeInput.value = btn.dataset.type; // nurse یا admin
  });
});

// مدیریت ارسال فرم
submitBtn.addEventListener("click", async function (e) {
  e.preventDefault();

  const formData = new FormData(loginForm);

  const loginData = {
    identifier: formData.get("identifier"),
    password: formData.get("password"),
    remember: Boolean(formData.get("remember")),
  };

  const userType = formData.get("userType");
  const endpoint = userType === "admin" ? "/admin/login" : "/nurse/login";

  try {
    const result = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(loginData),
    });

    const response = await result.json();
    console.log(response);
    if (result.ok) {
      const redirect =
        userType === "admin" ? "/admin/dashboard" : "/nurse/dashboard";
      alert(
        `${userType === "admin" ? "ورود مدیر" : "ورود پرستار"} موفقیت آمیز بود!`
      );
      setTimeout(() => (window.location.href = redirect), 1500);
    } else {
      if (response.error.length) {
        alert(response.error);
      } else if (response.error["password"]) {
        alert(response.error["password"]);
      } else if (response.error["identifier"]) {
        alert(response.error["identifier"]);
      }
    }
  } catch (error) {
    console.error("Error:", error);
    alert("خطا در ارتباط با سرور!");
  }
});
