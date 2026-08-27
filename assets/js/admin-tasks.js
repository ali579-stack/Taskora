/* =========================================================
   TASKORA — ADMIN TASK MANAGEMENT
   File: assets/js/admin-tasks.js
   ========================================================= */

(function () {

  "use strict";


  /* =======================================================
     CONFIG
     ======================================================= */

  const TASKORA_FEE_RATE = 0.10;

  const CURRENCY = "€";


  /* =======================================================
     HELPERS
     ======================================================= */

  function money(value) {

    const number = Number(value) || 0;

    return (
      CURRENCY +
      number.toFixed(2)
    );

  }


  function getElement(id) {

    return document.getElementById(id);

  }


  function showMessage(message, type = "info") {

    const element =
      getElement("createTaskMessage");

    if (!element) {
      return;
    }

    element.textContent = message;

    element.className =
      "form-message " +
      "form-message-" +
      type;

  }


  /* =======================================================
     CALCULATE FINANCE
     ======================================================= */

  function calculateFinance() {

    const funding =
      Number(
        getElement("taskFunding")?.value
      );

    const workers =
      Number(
        getElement("taskWorkers")?.value
      );


    if (
      !Number.isFinite(funding) ||
      funding <= 0
    ) {

      resetFinance();

      return null;

    }


    if (
      !Number.isInteger(workers) ||
      workers <= 0
    ) {

      resetFinance();

      return null;

    }


    /*
      TASKORA takes the configured platform fee.

      Example:

      Funding       €100
      Fee 10%        €10
      Worker pool    €90
    */

    const fee =
      funding * TASKORA_FEE_RATE;


    const rewardPool =
      funding - fee;


    const rewardPerWorker =
      rewardPool / workers;


    getElement(
      "createFunding"
    ).textContent =
      money(funding);


    getElement(
      "createFee"
    ).textContent =
      money(fee);


    getElement(
      "createRewardPool"
    ).textContent =
      money(rewardPool);


    getElement(
      "createRewardPerWorker"
    ).textContent =
      money(rewardPerWorker);


    return {

      fundingAmount: funding,

      platformFee: fee,

      rewardPool: rewardPool,

      workers: workers,

      rewardPerWorker: rewardPerWorker

    };

  }


  function resetFinance() {

    const funding =
      getElement("createFunding");

    const fee =
      getElement("createFee");

    const pool =
      getElement("createRewardPool");

    const perWorker =
      getElement(
        "createRewardPerWorker"
      );


    if (funding) {
      funding.textContent = money(0);
    }

    if (fee) {
      fee.textContent = money(0);
    }

    if (pool) {
      pool.textContent = money(0);
    }

    if (perWorker) {
      perWorker.textContent = money(0);
    }

  }


  /* =======================================================
     VALIDATE TASK
     ======================================================= */

  function validateTask() {

    const title =
      getElement("taskTitle")?.value.trim();

    const type =
      getElement("taskType")?.value;

    const description =
      getElement(
        "taskDescription"
      )?.value.trim();

    const workers =
      Number(
        getElement("taskWorkers")?.value
      );

    const funding =
      Number(
        getElement("taskFunding")?.value
      );


    if (!title) {

      showMessage(
        "Please enter a task title.",
        "error"
      );

      return false;

    }


    if (!type) {

      showMessage(
        "Please select a task type.",
        "error"
      );

      return false;

    }


    if (!description) {

      showMessage(
        "Please enter a task description.",
        "error"
      );

      return false;

    }


    if (
      !Number.isInteger(workers) ||
      workers <= 0
    ) {

      showMessage(
        "Enter a valid number of workers.",
        "error"
      );

      return false;

    }


    if (
      !Number.isFinite(funding) ||
      funding <= 0
    ) {

      showMessage(
        "Enter a valid funding amount.",
        "error"
      );

      return false;

    }


    const finance =
      calculateFinance();


    if (!finance) {

      showMessage(
        "Unable to calculate task finance.",
        "error"
      );

      return false;

    }


    if (
      finance.rewardPerWorker <= 0
    ) {

      showMessage(
        "Reward per worker must be greater than zero.",
        "error"
      );

      return false;

    }


    return true;

  }


  /* =======================================================
     BUILD TASK DATA
     ======================================================= */

  function getTaskData() {

    const finance =
      calculateFinance();


    return {

      title:
        getElement("taskTitle")
          ?.value
          .trim(),

      type:
        getElement("taskType")
          ?.value,

      description:
        getElement(
          "taskDescription"
        )
          ?.value
          .trim(),

      url:
        getElement("taskUrl")
          ?.value
          .trim() || null,

      workers:
        Number(
          getElement(
            "taskWorkers"
          )?.value
        ),

      fundingAmount:
        finance.fundingAmount,

      platformFee:
        finance.platformFee,

      rewardPool:
        finance.rewardPool,

      rewardPerWorker:
        finance.rewardPerWorker,

      timerSeconds:
        Number(
          getElement(
            "taskTimer"
          )?.value
        ) || 300,

      proofRequired:
        getElement(
          "proofRequired"
        )?.value === "yes",

      status:
        "published"

    };

  }


  /* =======================================================
     CREATE TASK
     ======================================================= */

  async function createTask(event) {

    event.preventDefault();


    if (!validateTask()) {
      return;
    }


    const task =
      getTaskData();


    const submitButton =
      document.querySelector(
        "#createTaskForm button[type='submit']"
      );


    if (submitButton) {

      submitButton.disabled = true;

      submitButton.textContent =
        "Publishing...";

    }


    try {

      /*
        apiRequest() is expected to be
        provided by config.js.

        Backend endpoint:

        POST /admin/tasks
      */

      if (
        typeof taskoraApi !==
        "function"
      ) {

        showMessage(
          "Task form is ready, but the backend API is not connected yet.",
          "error"
        );

        return;

      }


      const response =
        await taskoraApi(
          "/admin/tasks",
          {

            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body:
              JSON.stringify(task)

          }
        );


      if (
        !response ||
        response.success === false
      ) {

        throw new Error(
          response?.message ||
          "Task could not be created."
        );

      }


      showMessage(
        "Task published successfully.",
        "success"
      );


      loadTasks();


      document
        .getElementById(
          "createTaskForm"
        )
        ?.reset();


      resetFinance();


    } catch (error) {

      console.error(
        "TASKORA task creation error:",
        error
      );


      showMessage(
        error.message ||
        "Unable to publish task.",
        "error"
      );


    } finally {

      if (submitButton) {

        submitButton.disabled =
          false;

        submitButton.textContent =
          "Publish Task";

      }

    }

  }


  /* =======================================================
     LOAD TASKS
     ======================================================= */

  async function loadTasks() {

    const table =
      getElement(
        "adminTasksTable"
      );


    if (!table) {
      return;
    }


    if (
      typeof taskoraApi !==
      "function"
    ) {

      table.innerHTML = `
        <tr>
          <td colspan="5">
            Backend not connected.
          </td>
        </tr>
      `;

      return;

    }


    try {

      const response =
        await taskoraApi(
          "/admin/tasks",
          {
            method: "GET"
          }
        );


      const tasks =
        Array.isArray(
          response?.tasks
        )
          ? response.tasks
          : [];


      if (!tasks.length) {

        table.innerHTML = `
          <tr>
            <td colspan="5">
              No tasks found.
            </td>
          </tr>
        `;

        return;

      }


      table.innerHTML =
        tasks
          .map(renderTaskRow)
          .join("");


    } catch (error) {

      console.error(
        "TASKORA task loading error:",
        error
      );


      table.innerHTML = `
        <tr>
          <td colspan="5">
            Unable to load tasks.
          </td>
        </tr>
      `;

    }

  }


  /* =======================================================
     RENDER TASK ROW
     ======================================================= */

  function renderTaskRow(task) {

    const title =
      escapeHTML(
        task.title || "Untitled"
      );


    const type =
      escapeHTML(
        task.type || "-"
      );


    const reward =
      money(
        task.rewardPerWorker || 0
      );


    const workers =
      Number(
        task.workers ||
        task.totalWorkers ||
        0
      );


    const status =
      escapeHTML(
        task.status || "pending"
      );


    return `

      <tr>

        <td>
          ${title}
        </td>

        <td>
          ${type}
        </td>

        <td>
          ${reward}
        </td>

        <td>
          ${workers}
        </td>

        <td>
          <span class="status status-${status}">
            ${status}
          </span>
        </td>

      </tr>

    `;

  }


  /* =======================================================
     ESCAPE HTML
     ======================================================= */

  function escapeHTML(value) {

    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  }


  /* =======================================================
     EVENT LISTENERS
     ======================================================= */

  function initialize() {

    const form =
      getElement(
        "createTaskForm"
      );


    const calculateButton =
      getElement(
        "calculateTaskButton"
      );


    const fundingInput =
      getElement(
        "taskFunding"
      );


    const workersInput =
      getElement(
        "taskWorkers"
      );


    if (form) {

      form.addEventListener(
        "submit",
        createTask
      );

    }


    if (calculateButton) {

      calculateButton.addEventListener(
        "click",
        function () {

          const result =
            calculateFinance();


          if (result) {

            showMessage(
              "Reward calculation updated.",
              "success"
            );

          }

        }
      );

    }


    if (fundingInput) {

      fundingInput.addEventListener(
        "input",
        calculateFinance
      );

    }


    if (workersInput) {

      workersInput.addEventListener(
        "input",
        calculateFinance
      );

    }


    loadTasks();

  }


  /* =======================================================
     START
     ======================================================= */

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


  /* =======================================================
     PUBLIC API
     ======================================================= */

  window.TASKORA_ADMIN_TASKS = {

    calculateFinance,

    loadTasks,

    createTask

  };


})();