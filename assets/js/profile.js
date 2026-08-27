"use strict";

/*
=========================================================
TASKORA PROFILE
=========================================================
*/

(function () {

  function setProfile(user) {
    user = user || {};

    const name = user.name || "Worker";
    const email = user.email || "—";
    const role = user.role || "worker";

    const created = user.created_at
      ? new Date(user.created_at).toLocaleDateString(undefined, {
          year: "numeric",
          month: "long",
          day: "numeric"
        })
      : "—";

    const prettyRole = String(role)
      .replace(/_/g, " ")
      .replace(/\b\w/g, c => c.toUpperCase());

    const avatar =
      String(name).trim().charAt(0).toUpperCase() || "W";

    const fields = {
      profileAvatar: avatar,
      profileName: name,
      profileFullName: name,
      profileEmail: email,
      profileRole: prettyRole + " Account",
      profileRoleValue: prettyRole,
      profileJoined: created,
      profileUserId: user.id ? "#" + user.id : "—"
    };

    Object.entries(fields).forEach(([id, value]) => {
      const el = document.getElementById(id);

      if (el) {
        el.textContent = value;
      }
    });
  }


  async function loadProfile() {
    let user = {};

    for (const key of ["taskora_user", "user"]) {
      try {
        const stored = localStorage.getItem(key);

        if (stored) {
          const parsed = JSON.parse(stored);

          if (parsed && typeof parsed === "object") {
            user = parsed;
            break;
          }
        }

      } catch (error) {
        console.warn(
          "Invalid stored user:",
          key,
          error
        );
      }
    }


    if (typeof taskoraApi === "function") {

      try {

        const response =
          await taskoraApi("/me", {
            method: "GET"
          });

        if (
          response?.success &&
          response.user
        ) {

          user = response.user;

          localStorage.setItem(
            "taskora_user",
            JSON.stringify(response.user)
          );
        }

      } catch (error) {

        console.warn(
          "Profile API unavailable; using stored account.",
          error
        );
      }
    }

    setProfile(user);
  }


  loadProfile().catch(error => {
    console.error(
      "Profile loading error:",
      error
    );

    setProfile({});
  });

})();


/*
=========================================================
LINKED SOCIAL ACCOUNTS
=========================================================
*/

(function () {

  const limits =
    window.TASKORA_SOCIAL_LIMITS || {
      instagram: 3,
      tiktok: 3,
      youtube: 2,
      facebook: 2,
      x: 2,
      other: 2
    };


  const labels = {
    instagram: "Instagram",
    tiktok: "TikTok",
    youtube: "YouTube",
    facebook: "Facebook",
    x: "X",
    other: "Other"
  };


  const list =
    document.getElementById(
      "socialSlotGroups"
    );

  const message =
    document.getElementById(
      "accountMessage"
    );


  function esc(value) {
    return String(value ?? "")
      .replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      }[character]));
  }


  function show(value) {

    if (message) {
      message.textContent =
        value || "";
    }
  }


  async function loadAccounts() {

    if (!list) return;

    try {

      const response =
        await taskoraApi(
          "/social-accounts"
        );

      const accounts =
        Array.isArray(response?.accounts)
          ? response.accounts
          : [];


      list.innerHTML =
        Object.keys(limits)
          .map(platform => {

            const mine =
              accounts.filter(account =>
                String(
                  account.platform || ""
                ).toLowerCase() === platform
              );


            let slots = "";


            for (
              let i = 0;
              i < limits[platform];
              i++
            ) {

              const account = mine[i];


              if (account) {

                slots += `
                  <div class="social-slot filled">
                    <div>
                      <strong>Slot ${i + 1}</strong>
                      <span>${esc(
                        account.account_name || ""
                      )}</span>
                    </div>

                    <button
                      type="button"
                      onclick="removeSocialAccount(${Number(account.id)})"
                    >
                      Remove
                    </button>
                  </div>
                `;

              } else {

                slots += `
                  <div class="social-slot empty">
                    <div>
                      <strong>Slot ${i + 1}</strong>
                      <span>Available</span>
                    </div>

                    <button
                      type="button"
                      onclick="addSocialAccount('${platform}')"
                    >
                      + Add Account
                    </button>
                  </div>
                `;
              }
            }


            return `
              <div class="social-group">

                <div class="social-group-head">
                  <h3>${labels[platform]}</h3>
                  <span>
                    ${mine.length} / ${limits[platform]}
                  </span>
                </div>

                ${slots}

              </div>
            `;

          })
          .join("");


      show("");

    } catch (error) {

      console.error(
        "Linked accounts error:",
        error
      );

      show(
        error.message ||
        "Unable to load linked accounts."
      );
    }
  }


  window.addSocialAccount =
    async function (platform) {

      const name = prompt(
        "Enter your " +
        labels[platform] +
        " username or account name:"
      );


      if (!name?.trim()) {
        return;
      }


      try {

        const response =
          await taskoraApi(
            "/social-accounts",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body: JSON.stringify({
                platform,
                accountName:
                  name.trim()
              })
            }
          );


        if (!response?.success) {

          throw new Error(
            response?.message ||
            "Unable to add account."
          );
        }


        show(
          "Account added successfully."
        );

        await loadAccounts();

      } catch (error) {

        show(
          error.message ||
          "Unable to add account."
        );
      }
    };


  window.removeSocialAccount =
    async function (id) {

      if (
        typeof TaskoraPopup === "undefined" ||
        !(await TaskoraPopup.confirm(
          "Remove this linked account?"
        ))
      ) {
        return;
      }


      try {

        const response =
          await taskoraApi(
            "/social-accounts/" + id,
            {
              method: "DELETE"
            }
          );


        if (!response?.success) {

          throw new Error(
            response?.message ||
            "Unable to remove account."
          );
        }


        show(
          "Account removed."
        );

        await loadAccounts();

      } catch (error) {

        show(
          error.message ||
          "Unable to remove account."
        );
      }
    };


  loadAccounts();

})();
