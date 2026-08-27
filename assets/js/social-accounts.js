const SOCIAL_LIMITS = {
  instagram: 3,
  tiktok: 3,
  youtube: 2,
  facebook: 2,
  x: 2,
  other: 2
};

const MAX_LINKED_ACCOUNTS = 14;


async function loadSocialAccounts() {
  try {

    const response = await fetch(
      `${TASKORA_API_URL}/social-accounts`,
      {
        credentials: "include"
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to load accounts.");
    }

    renderSocialAccounts(data.accounts);

  } catch (error) {

    console.error("Social accounts error:", error);

  }
}


function renderSocialAccounts(accounts) {

  const list =
    document.getElementById("linkedAccountsList");

  const count =
    document.getElementById("linkedAccountsCount");

  if (!list) return;

  count.textContent =
    `${accounts.length} / ${MAX_LINKED_ACCOUNTS}`;

  list.innerHTML = "";

  Object.keys(SOCIAL_LIMITS).forEach(platform => {

    const platformAccounts =
      accounts.filter(
        account => account.platform === platform
      );

    const card =
      document.createElement("div");

    card.className = "task-card";

    card.innerHTML = `
      <div class="task-card-top">

        <span class="task-category">
          ${platform}
        </span>

        <span>
          ${platformAccounts.length} /
          ${SOCIAL_LIMITS[platform]}
        </span>

      </div>

      <h3>${platform}</h3>

      <p>
        Link your ${platform} account.
      </p>

      ${
        platformAccounts.length > 0
          ? platformAccounts.map(account => `
              <div style="margin:10px 0;">

                <strong>
                  ${escapeHtml(account.account_name)}
                </strong>

                <br>

                <small>
                  ${escapeHtml(account.verification_status)}
                </small>

                <br>

                <button
                  type="button"
                  class="btn btn-outline"
                  style="margin-top:8px;"
                  onclick="deleteSocialAccount(${account.id})"
                >
                  Remove
                </button>

              </div>
            `).join("")
          : "<p>No account linked.</p>"
      }

      ${
        platformAccounts.length < SOCIAL_LIMITS[platform]
          ? `
            <button
              type="button"
              class="btn btn-primary btn-full"
              onclick="addSocialAccount('${platform}')"
            >
              Add Account
            </button>
          `
          : ""
      }
    `;

    list.appendChild(card);

  });
}


async function addSocialAccount(platform) {

  const accountName =
    prompt(
      `Enter your ${platform} username/account name:`
    );

  if (!accountName) return;

  try {

    const data = await taskoraApi(
      "/social-accounts",
      {
        method: "POST",

        body: JSON.stringify({
          platform: platform,
          accountName: accountName
        })
      }
    );

    TaskoraPopup.alert(
      data.message ||
      "Account added successfully."
    );

    loadSocialAccounts();

  } catch (error) {

    console.error(error);

    TaskoraPopup.alert(
      error.message ||
      "Unable to connect to server."
    );

  }
}

async function deleteSocialAccount(id) {

  if (
    !(await TaskoraPopup.confirm(
      "Remove this linked account?"
    ))
  ) {
    return;
  }

  try {

    const data = await taskoraApi(
      `/social-accounts/${id}`,
      {
        method: "DELETE"
      }
    );

    TaskoraPopup.success(
      data.message || "Account removed successfully."
    );

    loadSocialAccounts();

  } catch (error) {

    console.error(error);

    TaskoraPopup.error(
      error.message ||
      "Unable to remove account."
    );
  }
}
