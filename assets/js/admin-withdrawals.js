/* =========================================================
   TASKORA ADMIN WITHDRAWALS
   ========================================================= */

"use strict";

(function () {

  const table =
    document.getElementById("adminWithdrawalsTable");

  const pendingCount =
    document.getElementById("adminPendingWithdrawals");

  const pendingAmount =
    document.getElementById("adminPendingAmount");

  const processingCount =
    document.getElementById("adminProcessingWithdrawals");

  const completedCount =
    document.getElementById("adminCompletedWithdrawals");


  function money(value) {

    return new Intl.NumberFormat("en-DE", {
      style: "currency",
      currency: "EUR"
    }).format(Number(value) || 0);

  }


  function escapeHTML(value) {

    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  }


  function statusClass(status) {

    const value =
      String(status || "")
        .toLowerCase();

    if (value === "approved" || value === "completed") {
      return "status-approved";
    }

    if (value === "rejected") {
      return "status-rejected";
    }

    return "status-pending";

  }


  function renderSummary(withdrawals) {

    let pending = 0;
    let processing = 0;
    let completed = 0;
    let amount = 0;


    withdrawals.forEach(function (item) {

      const status =
        String(item.status || "")
          .toLowerCase();

      const value =
        Number(item.amount) || 0;


      if (status === "pending") {

        pending++;
        amount += value;

      }

      else if (status === "processing") {

        processing++;

      }

      else if (
        status === "completed" ||
        status === "approved"
      ) {

        completed++;

      }

    });


    if (pendingCount) {
      pendingCount.textContent = pending;
    }

    if (pendingAmount) {
      pendingAmount.textContent = money(amount);
    }

    if (processingCount) {
      processingCount.textContent = processing;
    }

    if (completedCount) {
      completedCount.textContent = completed;
    }

  }


  function renderTable(withdrawals) {

    if (!table) {
      return;
    }


    if (!withdrawals.length) {

      table.innerHTML = `
        <tr>
          <td colspan="7">
            No withdrawal requests found.
          </td>
        </tr>
      `;

      return;

    }


    table.innerHTML =
      withdrawals.map(function (item) {

        const id =
          escapeHTML(item.id);

        const worker =
          escapeHTML(
            item.workerName ||
            item.worker ||
            "Worker"
          );

        const amount =
          money(item.amount);

        const method =
          escapeHTML(
            item.method ||
            "—"
          );

        const account =
          escapeHTML(
            item.account ||
            "—"
          );

        const status =
          escapeHTML(
            item.status ||
            "pending"
          );

        const date =
          escapeHTML(
            item.createdAt ||
            item.date ||
            "—"
          );


        return `
          <tr>

            <td>${worker}</td>

            <td>${amount}</td>

            <td>${method}</td>

            <td>${account}</td>

            <td>
              <span class="status ${statusClass(status)}">
                ${status}
              </span>
            </td>

            <td>${date}</td>

            <td>

              <button
                class="btn btn-outline"
                type="button"
                onclick="processWithdrawal('${id}', 'processing')"
              >
                Process
              </button>

              <button
                class="btn btn-primary"
                type="button"
                onclick="processWithdrawal('${id}', 'completed')"
              >
                Complete
              </button>

              <button
                class="btn btn-outline"
                type="button"
                onclick="processWithdrawal('${id}', 'rejected')"
              >
                Reject
              </button>

            </td>

          </tr>
        `;

      }).join("");

  }


  async function loadWithdrawals() {

    if (!table) {
      return;
    }


    const token =
      typeof getAuthToken === "function"
        ? getAuthToken()
        : null;


    if (!token) {

      table.innerHTML = `
        <tr>
          <td colspan="7">
            Admin authentication required.
          </td>
        </tr>
      `;

      return;

    }


    if (
      typeof TASKORA_API_URL ===
      "undefined"
    ) {

      table.innerHTML = `
        <tr>
          <td colspan="7">
            TASKORA API is not configured.
          </td>
        </tr>
      `;

      return;

    }


    try {

      const response =
        await fetch(
          TASKORA_API_URL +
          "/admin/withdrawals",
          {
            method: "GET",

            headers: {
              "Authorization":
                "Bearer " + token,

              "Content-Type":
                "application/json"
            }
          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.message ||
          "Unable to load withdrawals."
        );

      }


      const withdrawals =
        Array.isArray(data)
          ? data
          : (
              Array.isArray(data.withdrawals)
                ? data.withdrawals
                : []
            );


      renderSummary(withdrawals);

      renderTable(withdrawals);

    }

    catch (error) {

      console.error(
        "Withdrawal loading error:",
        error
      );


      table.innerHTML = `
        <tr>
          <td colspan="7">
            Unable to load withdrawals.
          </td>
        </tr>
      `;

    }

  }


  window.processWithdrawal =
    async function processWithdrawal(
      withdrawalId,
      status
    ) {

      if (!withdrawalId) {
        return;
      }


      const token =
        typeof getAuthToken === "function"
          ? getAuthToken()
          : null;


      if (!token) {

        TaskoraPopup.alert(
          "Admin authentication required."
        );

        return;

      }


      if (
        typeof TASKORA_API_URL ===
        "undefined"
      ) {

        TaskoraPopup.alert(
          "TASKORA API is not configured."
        );

        return;

      }


      const confirmation =
        await TaskoraPopup.confirm(
          "Change this withdrawal to " +
          status +
          "?"
        );


      if (!confirmation) {
        return;
      }


      try {

        const response =
          await fetch(
            TASKORA_API_URL +
            "/admin/withdrawals/" +
            encodeURIComponent(
              withdrawalId
            ),
            {

              method: "PATCH",

              headers: {

                "Content-Type":
                  "application/json",

                "Authorization":
                  "Bearer " + token

              },

              body: JSON.stringify({
                status: status
              })

            }
          );


        const data =
          await response.json();


        if (!response.ok) {

          throw new Error(
            data.message ||
            "Unable to update withdrawal."
          );

        }


        await loadWithdrawals();

      }

      catch (error) {

        console.error(
          "Withdrawal update error:",
          error
        );


        TaskoraPopup.alert(
          error.message ||
          "Unable to update withdrawal."
        );

      }

    };


  window.loadAdminWithdrawals =
    loadWithdrawals;


  document.addEventListener(
    "DOMContentLoaded",
    function () {

      loadWithdrawals();

    }
  );

})();