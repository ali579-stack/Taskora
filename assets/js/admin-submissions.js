(function () {

  "use strict";


  function money(value) {

    return "€" +
      (Number(value) || 0).toFixed(2);

  }


  function escapeHTML(value) {

    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  }


  function getTable() {

    return document.getElementById(
      "adminSubmissionsTable"
    );

  }


  function showMessage(message) {

    TaskoraPopup.alert(message);

  }


  /* ======================================================
     LOAD SUBMISSIONS
     ====================================================== */

  async function loadSubmissions() {

    const table =
      getTable();


    if (!table) {
      return;
    }


    if (
      typeof taskoraApi !==
      "function"
    ) {

      table.innerHTML = `
        <tr>
          <td colspan="7">
            Backend API is not connected.
          </td>
        </tr>
      `;

      return;

    }


    try {

      const response =
        await taskoraApi(
          "/admin/submissions",
          {
            method: "GET"
          }
        );


      if (
        !response ||
        response.success === false
      ) {

        throw new Error(
          response?.message ||
          "Unable to load submissions."
        );

      }


      const submissions =
        Array.isArray(
          response.submissions
        )
          ? response.submissions
          : [];


      if (!submissions.length) {

        table.innerHTML = `
          <tr>
            <td colspan="7">
              No submissions found.
            </td>
          </tr>
        `;

        return;

      }


      table.innerHTML =
        submissions
          .map(renderSubmission)
          .join("");


    } catch (error) {

      console.error(error);

      table.innerHTML = `
        <tr>
          <td colspan="7">
            Unable to load submissions.
          </td>
        </tr>
      `;

    }

  }


  /* ======================================================
     RENDER
     ====================================================== */

  function renderSubmission(item) {

    const id =
      escapeHTML(
        item.id
      );


    const worker =
      escapeHTML(
        item.workerName ||
        item.worker?.name ||
        "Worker"
      );


    const task =
      escapeHTML(
        item.taskTitle ||
        item.task?.title ||
        "Task"
      );


    const reward =
      money(
        item.reward ||
        item.rewardAmount ||
        0
      );


    const status =
      escapeHTML(
        item.status ||
        "pending"
      );


    const date =
      item.createdAt
        ? new Date(
            item.createdAt
          ).toLocaleString()
        : "-";


    return `

      <tr>

        <td>
          ${worker}
        </td>

        <td>
          ${task}
        </td>

        <td>
          ${reward}
        </td>

        <td>
          ${date}
        </td>

        <td>

          <span
            class="status status-${status}"
          >
            ${status}
          </span>

        </td>

        <td>

          <button
            class="btn btn-outline"
            type="button"
            onclick="TASKORA_ADMIN_SUBMISSIONS.viewProof('${id}')"
          >
            View Proof
          </button>

        </td>

        <td>

          ${
            status === "pending"
              ? `
                <button
                  class="btn btn-primary"
                  type="button"
                  onclick="TASKORA_ADMIN_SUBMISSIONS.approve('${id}')"
                >
                  Approve
                </button>

                <button
                  class="btn btn-danger"
                  type="button"
                  onclick="TASKORA_ADMIN_SUBMISSIONS.reject('${id}')"
                >
                  Reject
                </button>
              `
              : "-"
          }

        </td>

      </tr>

    `;

  }


  /* ======================================================
     VIEW PROOF
     ====================================================== */

  async function viewProof(id) {

    try {

      const response =
        await taskoraApi(
          "/admin/submissions/" +
          encodeURIComponent(id),
          {
            method: "GET"
          }
        );


      if (
        !response ||
        response.success === false
      ) {

        throw new Error(
          response?.message ||
          "Unable to load proof."
        );

      }


      const submission =
        response.submission;


      let message =
        "Task: " +
        (
          submission.taskTitle ||
          "Task"
        );


      message +=
        "\n\nWorker: " +
        (
          submission.workerName ||
          "Worker"
        );


      message +=
        "\n\nProof:";


      message +=
        "\n" +
        (
          submission.proofText ||
          "No text proof."
        );


      if (
        submission.proofUrl
      ) {

        message +=
          "\n\nProof URL:\n" +
          submission.proofUrl;

      }


      TaskoraPopup.alert(message);


    } catch (error) {

      console.error(error);

      showMessage(
        error.message ||
        "Unable to view proof."
      );

    }

  }


  /* ======================================================
     APPROVE
     ====================================================== */

  async function approve(id) {

    const confirmed =
      await TaskoraPopup.confirm(
        "Approve this submission and credit the worker's reward?"
      );


    if (!confirmed) {
      return;
    }


    try {

      const response =
        await taskoraApi(
          "/admin/submissions/" +
          encodeURIComponent(id) +
          "/approve",
          {

            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            }

          }
        );


      if (
        !response ||
        response.success === false
      ) {

        throw new Error(
          response?.message ||
          "Approval failed."
        );

      }


      showMessage(
        "Submission approved successfully."
      );


      loadSubmissions();


    } catch (error) {

      console.error(error);

      showMessage(
        error.message ||
        "Unable to approve submission."
      );

    }

  }


  /* ======================================================
     REJECT
     ====================================================== */

  async function reject(id) {

    const reason =
      window.prompt(
        "Enter rejection reason:"
      );


    if (
      reason === null
    ) {

      return;

    }


    if (
      !reason.trim()
    ) {

      showMessage(
        "A rejection reason is required."
      );

      return;

    }


    try {

      const response =
        await taskoraApi(
          "/admin/submissions/" +
          encodeURIComponent(id) +
          "/reject",
          {

            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body:
              JSON.stringify({
                reason:
                  reason.trim()
              })

          }
        );


      if (
        !response ||
        response.success === false
      ) {

        throw new Error(
          response?.message ||
          "Rejection failed."
        );

      }


      showMessage(
        "Submission rejected."
      );


      loadSubmissions();


    } catch (error) {

      console.error(error);

      showMessage(
        error.message ||
        "Unable to reject submission."
      );

    }

  }


  /* ======================================================
     INITIALIZE
     ====================================================== */

  function initialize() {

    loadSubmissions();

  }


  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      initialize
    );

  } else {

    initialize();

  }


  window.TASKORA_ADMIN_SUBMISSIONS = {

    loadSubmissions,

    viewProof,

    approve,

    reject

  };

})();