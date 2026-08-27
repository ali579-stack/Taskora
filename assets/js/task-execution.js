/* =========================================================
   TASKORA — WORKER TASK EXECUTION
   ========================================================= */

(function () {

  "use strict";


  let task = null;

  let timer = null;

  let remainingSeconds = 0;

  let taskStarted = false;


  /* =======================================================
     HELPERS
     ======================================================= */

  function get(id) {

    return document.getElementById(id);

  }


  function money(value) {

    return "$" +
      (Number(value) || 0).toFixed(2);

  }


  function showMessage(message, type = "info") {

    const element =
      get("taskMessage");

    if (!element) {
      return;
    }

    element.textContent = message;

    element.className =
      "form-message form-message-" +
      type;

  }


  function getTaskId() {

    const params =
      new URLSearchParams(
        window.location.search
      );

    return params.get("id");

  }


  /* =======================================================
     LOAD TASK
     ======================================================= */

  async function loadTask() {

    const taskId =
      getTaskId();


    if (!taskId) {

      showMessage(
        "No task was selected.",
        "error"
      );

      return;

    }


    if (
      typeof taskoraApi !==
      "function"
    ) {

      showMessage(
        "Backend API is not connected yet.",
        "error"
      );

      return;

    }


    try {

      const response =
        await taskoraApi(
          "/tasks/" +
          encodeURIComponent(taskId),
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
          "Unable to load task."
        );

      }


      task =
        response.task;


      if (!task) {

        throw new Error(
          "Task was not found."
        );

      }


      renderTask();

      startTaskTimer();


    } catch (error) {

      console.error(error);

      showMessage(
        error.message ||
        "Unable to load task.",
        "error"
      );

    }

  }


  /* =======================================================
     RENDER
     ======================================================= */

  function renderTask() {

    get("taskTitle").textContent =
      task.title || "Task";


    get("taskDescription").textContent =
      task.description || "";


    get("taskInstructions").textContent =
      task.description ||
      "Complete the task as instructed.";


    get("taskReward").textContent =
      money(
        task.rewardPerWorker ||
        task.reward ||
        0
      );


    const seconds =
      Number(
        task.timerSeconds ||
        task.timer ||
        300
      );


    get("taskDuration").textContent =
      Math.ceil(seconds / 60) +
      " min";


    get("taskProofStatus").textContent =
      task.proofRequired === false
        ? "Optional"
        : "Required";


    if (task.url) {

      const container =
        get("taskLinkContainer");

      const link =
        get("taskLink");


      link.href =
        task.url;


      container.style.display =
        "block";

    }

  }


  /* =======================================================
     START TIMER
     ======================================================= */

  function startTaskTimer() {

    if (taskStarted) {
      return;
    }


    taskStarted = true;


    remainingSeconds =
      Number(
        task.timerSeconds ||
        task.timer ||
        300
      );


    updateTimer();


    timer =
      setInterval(
        function () {

          remainingSeconds--;

          updateTimer();


          if (
            remainingSeconds <= 0
          ) {

            stopTimer();

            showMessage(
              "Time has expired. You can no longer submit this task.",
              "error"
            );


            const button =
              get(
                "submitTaskButton"
              );


            if (button) {

              button.disabled =
                true;

              button.textContent =
                "Time Expired";

            }

          }

        },
        1000
      );

  }


  function updateTimer() {

    const minutes =
      Math.floor(
        remainingSeconds / 60
      );


    const seconds =
      remainingSeconds % 60;


    const formatted =
      String(minutes)
        .padStart(2, "0") +
      ":" +
      String(seconds)
        .padStart(2, "0");


    const timerElement =
      get("taskTimer");


    if (timerElement) {

      timerElement.textContent =
        formatted;

    }

  }


  function stopTimer() {

    if (timer) {

      clearInterval(timer);

      timer = null;

    }

  }


  /* =======================================================
     SUBMIT TASK
     ======================================================= */

  async function submitTask(event) {

    event.preventDefault();


    if (!task) {

      showMessage(
        "Task is not loaded.",
        "error"
      );

      return;

    }


    if (
      remainingSeconds <= 0
    ) {

      showMessage(
        "The task timer has expired.",
        "error"
      );

      return;

    }


    const proofText =
      get("proofText")
        ?.value
        .trim() || "";


    const proofUrl =
      get("proofUrl")
        ?.value
        .trim() || "";


    const proofRequired =
      task.proofRequired !== false;


    if (
      proofRequired &&
      !proofText &&
      !proofUrl
    ) {

      showMessage(
        "Please provide proof before submitting.",
        "error"
      );

      return;

    }


    const button =
      get("submitTaskButton");


    if (button) {

      button.disabled =
        true;

      button.textContent =
        "Submitting...";

    }


    try {

      if (
        typeof taskoraApi !==
        "function"
      ) {

        throw new Error(
          "Backend API is not connected yet."
        );

      }


      const response =
        await taskoraApi(
          "/submissions",
          {

            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body:
              JSON.stringify({

                taskId:
                  task.id ||
                  getTaskId(),

                proof:
                  JSON.stringify({
                    proofText,
                    proofUrl,
                    completedAt:
                      new Date().toISOString()
                  })

              })

          }
        );


      if (
        !response ||
        response.success === false
      ) {

        throw new Error(
          response?.message ||
          "Submission failed."
        );

      }


      stopTimer();


      showMessage(
        "Task submitted successfully. Your submission is now pending review.",
        "success"
      );


      if (button) {

        button.disabled =
          true;

        button.textContent =
          "Submitted";

      }


      setTimeout(
        function () {

          window.location.href =
            "dashboard.html#submissions";

        },
        1800
      );


    } catch (error) {

      console.error(
        "TASKORA submission error:",
        error
      );


      showMessage(
        error.message ||
        "Unable to submit task.",
        "error"
      );


      if (button) {

        button.disabled =
          false;

        button.textContent =
          "Submit Task";

      }

    }

  }


  /* =======================================================
     INITIALIZE
     ======================================================= */

  function initialize() {

    const form =
      get("taskSubmissionForm");


    if (form) {

      form.addEventListener(
        "submit",
        submitTask
      );

    }


    loadTask();

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


  window.TASKORA_TASK =
    {
      loadTask,
      submitTask,
      startTaskTimer,
      stopTimer
    };


})();