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


function signOut() {

  localStorage.removeItem("taskora_token");
  localStorage.removeItem("taskora_user");

  window.location.href = "../login.html";
}


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
    `${TASKORA_API_URL}/login`,
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
    `${TASKORA_API_URL}/register`,
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

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.message || "Registration failed."
    );
  }

  return data;
}

const registerForm = document.getElementById("registerForm");

if (registerForm) {
  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {
      await registerUser(name, email, password);

      if (window.TaskoraPopup?.alert) {
        TaskoraPopup.alert(
          "Your account was created successfully. You can now sign in.",
          "Account Created"
        );
      } else {
        alert("Your account was created successfully. You can now sign in.");
      }

      setTimeout(() => {
        window.location.href = "login.html";
      }, 1200);

    } catch (error) {
      if (window.TaskoraPopup?.alert) {
        TaskoraPopup.alert(
          error.message || "Registration failed.",
          "Registration Error"
        );
      } else {
        alert(error.message || "Registration failed.");
      }
    }
  });
}
