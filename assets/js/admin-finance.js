/* =========================================================
   TASKORA ADMIN FINANCE
   ========================================================= */

"use strict";


(function () {


  /* -------------------------------------------------------
     ELEMENTS
  ------------------------------------------------------- */

  const amountInput =
    document.getElementById(
      "taskFundingAmount"
    );

  const resultBox =
    document.getElementById(
      "taskFinanceResult"
    );

  const fundingOutput =
    document.getElementById(
      "financeFunding"
    );

  const feeOutput =
    document.getElementById(
      "financeFee"
    );

  const rewardPoolOutput =
    document.getElementById(
      "financeRewardPool"
    );



  /* -------------------------------------------------------
     FORMAT MONEY
  ------------------------------------------------------- */

  function formatMoney(amount) {

    const value =
      Number(amount) || 0;


    return new Intl.NumberFormat(
      "en-DE",
      {
        style: "currency",
        currency: "USD"
      }
    ).format(value);

  }



  /* -------------------------------------------------------
     CALCULATE FINANCE
  ------------------------------------------------------- */

  window.calculateTaskFinance =
    function calculateTaskFinance() {

      if (!amountInput) {

        console.error(
          "taskFundingAmount element not found."
        );

        return;

      }


      const funding =
        Number(
          amountInput.value
        );


      if (
        !Number.isFinite(funding) ||
        funding <= 0
      ) {

        TaskoraPopup.alert(
          "Please enter a valid funding amount."
        );

        return;

      }


      const feeRate =
        typeof TASKORA_FEE_RATE !==
        "undefined"
          ? TASKORA_FEE_RATE
          : 0.10;


      const fee =
        funding * feeRate;


      const rewardPool =
        funding - fee;


      if (fundingOutput) {

        fundingOutput.textContent =
          formatMoney(funding);

      }


      if (feeOutput) {

        feeOutput.textContent =
          formatMoney(fee);

      }


      if (rewardPoolOutput) {

        rewardPoolOutput.textContent =
          formatMoney(rewardPool);

      }


      if (resultBox) {

        resultBox.style.display =
          "block";

      }

    };



  /* -------------------------------------------------------
     CREATE TASK FINANCE DATA
  ------------------------------------------------------- */

  window.getTaskFinance =
    function getTaskFinance(
      funding
    ) {

      const amount =
        Number(funding);


      if (
        !Number.isFinite(amount) ||
        amount <= 0
      ) {

        throw new Error(
          "Funding amount must be greater than zero."
        );

      }


      const feeRate =
        typeof TASKORA_FEE_RATE !==
        "undefined"
          ? TASKORA_FEE_RATE
          : 0.10;


      const fee =
        amount * feeRate;


      const rewardPool =
        amount - fee;


      return {

        funding: amount,

        feeRate: feeRate,

        fee: fee,

        rewardPool: rewardPool

      };

    };



  /* -------------------------------------------------------
     OPTIONAL BACKEND TASK FUNDING
  ------------------------------------------------------- */

  window.submitTaskFunding =
    async function submitTaskFunding(
      taskId,
      funding
    ) {

      const token =
        typeof getAuthToken ===
        "function"
          ? getAuthToken()
          : null;


      if (!token) {

        throw new Error(
          "Admin authentication required."
        );

      }


      if (
        typeof TASKORA_API_URL ===
        "undefined"
      ) {

        throw new Error(
          "TASKORA API URL is not configured."
        );

      }


      const finance =
        getTaskFinance(
          funding
        );


      const response =
        await fetch(
          TASKORA_API_URL +
          "/admin/tasks/" +
          encodeURIComponent(taskId) +
          "/fund",
          {

            method: "POST",

            headers: {

              "Content-Type":
                "application/json",

              "Authorization":
                "Bearer " + token

            },

            body: JSON.stringify({

              funding:
                finance.funding,

              feeRate:
                finance.feeRate,

              fee:
                finance.fee,

              rewardPool:
                finance.rewardPool

            })

          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.message ||
          "Unable to fund task."
        );

      }


      return data;

    };


})();