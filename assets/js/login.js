/* =========================================================
   TASKORA LOGIN PAGE
   ========================================================= */

"use strict";


const loginForm =
  document.getElementById("loginForm");


if (loginForm) {

  loginForm.addEventListener(
    "submit",
    async function(event) {

      event.preventDefault();


      const email =
        document.getElementById(
          "loginEmail"
        ).value;


      const password =
        document.getElementById(
          "loginPassword"
        ).value;



      try {


        const result =
          await loginUser(
            email,
            password
          );



        if (
          result.user.role === "admin"
        ) {

          window.location.href =
            "admin/admin.html";

        } else {

          window.location.href =
            "dashboard/dashboard.html";

        }



      } catch(error) {


        TaskoraPopup.alert(
          error.message
        );


      }


    }
  );

}