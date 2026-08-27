(function () {

  "use strict";


  function money(value) {

    return "$" +
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


  function statusClass(status) {

    return (
      "status-" +
      String(status || "pending")
        .toLowerCase()
    );

  }


  async function loadMySubmissions() {

    const table =
      document.getElementById(
        "workerSubmissionsTable"
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
            Backend API is not connected.
          </td>
        </tr>
      `;

      return;

    }


    try {

      const response =
        await taskoraApi(
          "/submissions/me",
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
            <td colspan="5">
              No submissions yet.
            </td>
          </tr>
        `;

        return;

      }


      table.innerHTML =
        submissions
          .map(function (item) {

            const task =
              escapeHTML(
                item.taskTitle ||
                item.task?.title ||
                "Task"
              );


            const date =
              item.createdAt
                ? new Date(
                    item.createdAt
                  ).toLocaleDateString()
                : "-";


            const reward =
              money(
                item.reward ||
                item.rewardAmount ||
                0
              );


            const status =
              String(
                item.status ||
                "pending"
              )
              .toLowerCase();


            return `

              <tr>

                <td>
                  ${task}
                </td>

                <td>
                  ${date}
                </td>

                <td>
                  ${reward}
                </td>

                <td>

                  <span
                    class="status ${statusClass(status)}"
                  >
                    ${escapeHTML(status)}
                  </span>

                </td>

                <td>

                  ${
                    status === "rejected"
                      ? escapeHTML(
                          item.rejectionReason ||
                          "-"
                        )
                      : "-"
                  }

                </td>

              </tr>

            `;

          })
          .join("");


    } catch (error) {

      console.error(error);

      table.innerHTML = `
        <tr>
          <td colspan="5">
            Unable to load submissions.
          </td>
        </tr>
      `;

    }

  }


  function initialize() {

    loadMySubmissions();

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


  window.TASKORA_SUBMISSIONS = {

    loadMySubmissions

  };

})();