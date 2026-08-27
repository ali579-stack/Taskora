/* =========================================================
   TASKORA LOGIN PAGE
   ========================================================= */

"use strict";


const loginForm =
  document.getElementById("loginForm");


if (loginForm) {
  loginForm.addEventListener(
    "submit",
    async function(event) {

      event.preventDefault();

      const email =
        document.getElementById("loginEmail").value.trim();

      const password =
        document.getElementById("loginPassword").value;

      try {

        const result = await loginUser(
          email,
          password
        );

        TaskoraPopup.success(
          "Login successful.",
          1800
        );

        setTimeout(function () {

          if (result.user.role === "admin") {
            window.location.href = "admin/admin.html";
          } else {
            window.location.href =
              "dashboard/dashboard.html";
          }

        }, 700);

      } catch (error) {

        console.error("Login error:", error);

        TaskoraPopup.error(
          error.message ||
          "Incorrect email or password."
        );
      }
    }
  );
}