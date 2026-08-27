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
