"use strict";

/* =========================================================
   TASKORA AUTH
   ========================================================= */

function getTaskoraToken() {
  return localStorage.getItem("taskora_token");
}


function requireLogin() {

  const token = getTaskoraToken();

  if (!token) {
    window.location.href = "../login.html";
    return false;
  }

  return true;
}


window.signOut = function signOut() {
  localStorage.removeItem("taskora_token");
  localStorage.removeItem("taskora_user");

  sessionStorage.setItem(
    "taskora_logout_message",
    "You have been signed out successfully."
  );

  window.location.href = "../login.html";
};

function getCurrentUser() {

  const user =
    localStorage.getItem("taskora_user");

  if (!user) {
    return null;
  }

  try {
    return JSON.parse(user);
  } catch {
    return null;
  }
}
async function loginUser(email, password) {
  const response = await fetch(
    `${TASKORA_API_URL}/api/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        password
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.message || "Login failed."
    );
  }

  localStorage.setItem(
    "taskora_token",
    data.token
  );

  localStorage.setItem(
    "taskora_user",
    JSON.stringify(data.user)
  );

  return data;
}

async function registerUser(name, email, password) {
  const response = await fetch(
    `${TASKORA_API_URL}/api/register`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        name,
        email,
        password
      })
    }
  );

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    const error = new Error(
      data?.message || "Registration failed."
    );

    error.status = response.status;
    error.code = data?.code || "";

    throw error;
  }

  return data;
}


const registerForm =
  document.getElementById("registerForm");


if (registerForm) {

  registerForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();


      const name =
        document
          .getElementById("name")
          .value
          .trim();


      const email =
        document
          .getElementById("email")
          .value
          .trim();


      const password =
        document
          .getElementById("password")
          .value;


      /*
       * INVALID REGISTRATION DETAILS
       */

      if (!name || !email || !password) {

        TaskoraPopup.error(
          "Invalid registration details.",
          4000
        );

        return;
      }


      /*
       * PASSWORD VALIDATION
       */

      if (password.length < 8) {

        TaskoraPopup.error(
          "Password validation error: password must be at least 8 characters.",
          4500
        );

        return;
      }


      try {

        await registerUser(
          name,
          email,
          password
        );


        /*
         * REGISTRATION SUCCESSFUL
         */

        TaskoraPopup.success(
          "Registration successful.",
          2200
        );


        /*
         * Preserve existing registration flow.
         * User still goes to login.html.
         */

        setTimeout(() => {

          window.location.href =
            "login.html";

        }, 1200);


      } catch (error) {

        console.error(
          "Registration error:",
          error
        );


        const message =
          String(
            error?.message || ""
          ).toLowerCase();


        /*
         * EMAIL ALREADY EXISTS
         */

        if (
          error?.status === 409 ||
          message.includes("already exists") ||
          message.includes("email exists") ||
          message.includes("email already")
        ) {

          TaskoraPopup.error(
            "Email already exists.",
            4500
          );

          return;
        }


        /*
         * PASSWORD VALIDATION ERRORS
         */

        if (
          message.includes("password") &&
          (
            message.includes("valid") ||
            message.includes("weak") ||
            message.includes("length") ||
            message.includes("character") ||
            message.includes("required")
          )
        ) {

          TaskoraPopup.error(
            error.message ||
            "Password validation error.",
            4500
          );

          return;
        }


        /*
         * INVALID REGISTRATION DETAILS
         */

        if (
          error?.status === 400 ||
          error?.status === 422
        ) {

          TaskoraPopup.error(
            error.message ||
            "Invalid registration details.",
            4500
          );

          return;
        }


        /*
         * SERVER ERROR
         */

        if (
          error?.status >= 500 ||
          !navigator.onLine
        ) {

          TaskoraPopup.error(
            "Server error. Please try again later.",
            5000
          );

          return;
        }


        /*
         * FALLBACK
         */

        TaskoraPopup.error(
          error.message ||
          "Server error. Please try again later.",
          5000
        );
      }
    }
  );
}
