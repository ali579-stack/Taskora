"use strict";

/*
 * TASKORA — REAL DASHBOARD EARNINGS
 * Never use hard-coded/fake earnings.
 */

(function () {
  const money = (value) => {
    const n = Number(value);
    return "$" + (Number.isFinite(n) ? n : 0).toFixed(2);
  };

  async function loadRealEarnings() {
    const token = localStorage.getItem("taskora_token");

    if (!token) {
      return;
    }

    try {
      const response = await fetch(
        TASKORA_API_URL + "/earnings/summary",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token
          }
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data?.message || "Unable to load earnings."
        );
      }

      const earnings = data.earnings || {};

      const totalEarned =
        Number(earnings.totalEarned || 0);

      const available =
        Number(earnings.available || 0);

      const withdrawn =
        Number(earnings.withdrawn || 0);

      /*
       * Pending earnings are calculated from real
       * pending task submissions, not fake HTML.
       */
      let pending = 0;

      try {
        const submissionsResponse = await fetch(
          TASKORA_API_URL + "/submissions/my",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + token
            }
          }
        );

        if (submissionsResponse.ok) {
          const submissionsData =
            await submissionsResponse.json();

          const submissions =
            submissionsData.submissions ||
            submissionsData.data ||
            [];

          pending = submissions
            .filter(function (item) {
              return String(item.status || "")
                .toLowerCase() === "pending";
            })
            .reduce(function (sum, item) {
              return sum + Number(item.reward || 0);
            }, 0);
        }
      } catch (error) {
        console.warn(
          "Could not load pending submissions:",
          error
        );
      }

      /*
       * Dashboard top statistics.
       */
      const availableEl =
        document.getElementById(
          "dashboardAvailableBalance"
        );

      const pendingEl =
        document.getElementById(
          "dashboardPendingBalance"
        );

      const totalEl =
        document.getElementById(
          "dashboardTotalEarnings"
        );

      if (availableEl) {
        availableEl.textContent =
          money(available);
      }

      if (pendingEl) {
        pendingEl.textContent =
          money(pending);
      }

      if (totalEl) {
        totalEl.textContent =
          money(totalEarned);
      }

      /*
       * Earnings section.
       *
       * The first three earnings-card values are:
       * Total Earned
       * Available
       * Pending
       */
      const earningsSection =
        document.getElementById("earnings");

      if (earningsSection) {
        const cards =
          earningsSection.querySelectorAll(
            ".earnings-card"
          );

        if (cards.length > 0) {
          const values =
            cards[0].querySelectorAll("strong");

          if (values[0]) {
            values[0].textContent =
              money(totalEarned);
          }

          if (values[1]) {
            values[1].textContent =
              money(available);
          }

          if (values[2]) {
            values[2].textContent =
              money(pending);
          }
        }
      }

      /*
       * Withdrawal balance.
       */
      const withdrawalBalance =
        document.getElementById(
          "withdrawAvailableBalance"
        );

      if (withdrawalBalance) {
        withdrawalBalance.textContent =
          money(available);
      }

      console.log(
        "TASKORA real earnings loaded:",
        {
          totalEarned,
          available,
          pending,
          withdrawn
        }
      );

    } catch (error) {
      console.error(
        "Real earnings loading error:",
        error
      );
    }
  }

  /*
   * Make available to other dashboard code.
   */
  window.loadRealEarnings =
    loadRealEarnings;

  /*
   * Load after DOM is ready.
   */
  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      loadRealEarnings
    );
  } else {
    loadRealEarnings();
  }

})();
