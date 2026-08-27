"use strict";

/* =========================================================
   TASKORA WITHDRAWALS
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  const form =
    document.getElementById("withdrawalForm");

  const message =
    document.getElementById("withdrawalMessage");

  const table =
    document.getElementById("withdrawalsTable");

  const balance =
    document.getElementById("withdrawAvailableBalance");


  loadPlatformSettings();

  if (!form) {
    return;
  }



  let currencySymbol = "$";
  let minimumWithdrawal = TASKORA_MIN_WITHDRAWAL;

  async function loadFinanceSettings() {
    try {
      const data = await taskoraApi("/settings/platform");

      const settings = data.settings || {};

      minimumWithdrawal =
        Number(settings.minimum_withdrawal || minimumWithdrawal);

      currencySymbol =
        settings.currency === "USD" ? "$" : "$";

    } catch (error) {
      console.error("Finance settings error:", error);
    }
  }

  /* =======================================================
     LOAD WITHDRAWALS
  ======================================================= */

  
async function loadPlatformSettings(){
  try {
    const data = await taskoraApi("/settings/platform");

    const settings = data.settings || {};

    currencySymbol =
      settings.currency === "USD" ? "$" : "$";

    minimumWithdrawal =
      Number(settings.minimum_withdrawal || 5);

    const minEl =
      document.getElementById("minimumWithdrawalDisplay");

    if(minEl){
      minEl.textContent =
        currencySymbol +
        minimumWithdrawal.toFixed(2);
    }

  } catch(error){
    console.error("Settings load failed", error);
  }
}


async function loadWithdrawals() {

    if (!table) {
      return;
    }

    try {

      const data =
        await taskoraApi("/withdrawals/mine");

      const withdrawals =
        data.withdrawals || [];

      table.innerHTML = "";

      if (!withdrawals.length) {

        table.innerHTML = `
          <tr>
            <td colspan="5">
              No withdrawals yet.
            </td>
          </tr>
        `;

        return;
      }


      withdrawals.forEach((withdrawal) => {

        const row =
          document.createElement("tr");

        row.innerHTML = `
          <td>
            \$${Number(withdrawal.amount || 0).toFixed(2)}
          </td>

          <td>
            ${escapeHtml(withdrawal.method || "-")}
          </td>

          <td>
            ${escapeHtml(withdrawal.account_reference || "-")}
          </td>

          <td>
            <span class="status status-${escapeHtml(
              withdrawal.status || "pending"
            )}">
              ${escapeHtml(
                withdrawal.status || "pending"
              )}
            </span>
          </td>

          <td>
            ${formatDate(withdrawal.requested_at)}
          </td>
        `;

        table.appendChild(row);

      });

    } catch (error) {

      table.innerHTML = `
        <tr>
          <td colspan="5">
            Unable to load withdrawals.
          </td>
        </tr>
      `;

      console.error(
        "Withdrawal loading error:",
        error
      );

    }

  }


  /* =======================================================
     SUBMIT WITHDRAWAL
  ======================================================= */

  form.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();

      hideMessage();


      const amount =
        Number(
          document.getElementById(
            "withdrawAmount"
          )?.value
        );

      const method =
        document.getElementById(
          "withdrawMethod"
        )?.value;

      const account =
        document.getElementById(
          "withdrawAccount"
        )?.value
        .trim();


      if (
        !Number.isFinite(amount) ||
        amount < minimumWithdrawal
      ) {

        showMessage(
          `Minimum withdrawal is ${currencySymbol}${minimumWithdrawal.toFixed(2)}.`,
          "error"
        );

        return;
      }


      if (!method || !account) {

        showMessage(
          "Please complete all withdrawal fields.",
          "error"
        );

        return;
      }


      const submitButton =
        form.querySelector(
          'button[type="submit"]'
        );


      if (submitButton) {

        submitButton.disabled = true;
        submitButton.textContent =
          "Processing...";

      }


      try {

        await taskoraApi(
          "/withdrawals",
          {
            method: "POST",

            body: JSON.stringify({
              amount,
              method,
              accountReference: account
            })
          }
        );


        showMessage(
          "Withdrawal request submitted successfully.",
          "success"
        );


        form.reset();

        await loadFinanceSettings();
  loadWithdrawals();


      } catch (error) {

        showMessage(
          error.message ||
          "Unable to submit withdrawal request.",
          "error"
        );


      } finally {

        if (submitButton) {

          submitButton.disabled = false;
          submitButton.textContent =
            "Request Withdrawal";

        }

      }

    }
  );


  /* =======================================================
     MESSAGE
     ======================================================= */

  function showMessage(
    text,
    type
  ) {

    if (!message) {
      return;
    }

    message.hidden = false;

    message.textContent = text;

    message.style.padding = "12px";
    message.style.borderRadius = "8px";

    if (type === "success") {

      message.style.background =
        "#dcfce7";

      message.style.color =
        "#166534";

    } else {

      message.style.background =
        "#fee2e2";

      message.style.color =
        "#991b1b";

    }

  }


  function hideMessage() {

    if (message) {
      message.hidden = true;
      message.textContent = "";
    }

  }


  /* =======================================================
     HELPERS
     ======================================================= */

  function escapeHtml(value) {

    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  }


  function formatDate(value) {

    if (!value) {
      return "-";
    }

    const date =
      new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric"
      }
    );

  }


  /* =======================================================
     INITIAL LOAD
     ======================================================= */

  loadFinanceSettings();
  loadWithdrawals();

});