/* =========================================================
   TASKORA FRONTEND CONFIG
   ========================================================= */

"use strict";

const TASKORA_API_URL = "/api";

const TASKORA_CURRENCY = "EUR";
const TASKORA_CURRENCY_SYMBOL = "€";

const TASKORA_FEE_RATE = 0.10;

const TASKORA_MIN_WITHDRAWAL = 5.00;


/* =========================================================
   SOCIAL ACCOUNT LIMITS
   ========================================================= */

const TASKORA_SOCIAL_LIMITS = {
  instagram: 3,
  tiktok: 3,
  youtube: 2,
  facebook: 2,
  x: 2,
  other: 2
};


/* =========================================================
   API HELPER
   ========================================================= */

async function taskoraApi(
  endpoint,
  options = {}
) {

  const token =
    localStorage.getItem("taskora_token");

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };


  if (token) {
    headers.Authorization =
      `Bearer ${token}`;
  }


  const response =
    await fetch(
      TASKORA_API_URL + endpoint,
      {
        ...options,
        headers
      }
    );


  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }


  if (!response.ok) {

    throw new Error(
      data?.message ||
      "Request failed."
    );

  }


  return data;
}
/* TASKORA API GLOBAL */
window.taskoraApi = taskoraApi;
