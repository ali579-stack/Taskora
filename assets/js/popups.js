(function () {
  "use strict";

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, function (c) {
      return ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      })[c];
    });
  }

  function ensureToastContainer() {
    var container = document.querySelector(".taskora-toast-container");

    if (!container) {
      container = document.createElement("div");
      container.className = "taskora-toast-container";
      container.setAttribute("aria-live", "polite");
      container.setAttribute("aria-atomic", "false");
      document.body.appendChild(container);
    }

    return container;
  }

  function toast(message, type, duration) {
    type = type || "success";
    duration = Number(duration) || 3500;

    var container = ensureToastContainer();

    var toast = document.createElement("div");
    toast.className = "taskora-toast " + type;
    toast.setAttribute("role", type === "error" ? "alert" : "status");

    var icon = {
      success: "✓",
      error: "!",
      warning: "!",
      info: "i"
    }[type] || "✓";

    toast.innerHTML =
      '<span class="taskora-toast-icon" aria-hidden="true">' +
        escapeHtml(icon) +
      '</span>' +
      '<span class="taskora-toast-message">' +
        escapeHtml(message) +
      '</span>' +
      '<button class="taskora-toast-close" type="button" aria-label="Close">' +
        '&times;' +
      '</button>';

    container.appendChild(toast);

    requestAnimationFrame(function () {
      toast.classList.add("is-visible");
    });

    var removed = false;

    function removeToast() {
      if (removed) return;

      removed = true;
      toast.classList.remove("is-visible");
      toast.classList.add("is-removing");

      setTimeout(function () {
        toast.remove();

        if (!container.children.length) {
          container.remove();
        }
      }, 220);
    }

    toast.querySelector(".taskora-toast-close")
      .addEventListener("click", removeToast);

    var timer = setTimeout(removeToast, duration);

    toast.addEventListener("mouseenter", function () {
      clearTimeout(timer);
    });

    return {
      close: removeToast
    };
  }

  function dialog(message, title, buttons) {
    return new Promise(function (resolve) {
      var dialog = document.createElement("dialog");
      dialog.className = "taskora-dialog";

      dialog.innerHTML =
        '<div class="taskora-dialog-inner">' +
          '<h3 class="taskora-dialog-title">' +
            escapeHtml(title || "TASKORA") +
          '</h3>' +
          '<p class="taskora-dialog-message">' +
            escapeHtml(message) +
          '</p>' +
          '<div class="taskora-dialog-actions">' +
            buttons +
          '</div>' +
        '</div>';

      document.body.appendChild(dialog);

      dialog.addEventListener("cancel", function () {
        dialog.close();
      });

      dialog.showModal();

      return dialog;
    });
  }

  window.TaskoraPopup = {

    /*
     * Keep alert() compatible with existing TASKORA code.
     * Alerts are now bottom-right notifications.
     */
    alert: function (message, title) {
      return new Promise(function (resolve) {
        toast(
          title
            ? title + ": " + message
            : message,
          "info",
          4000
        );

        setTimeout(resolve, 0);
      });
    },

    confirm: function (message, title) {
      return new Promise(function (resolve) {
        var dialog = document.createElement("dialog");
        dialog.className = "taskora-dialog";

        dialog.innerHTML =
          '<div class="taskora-dialog-inner">' +
            '<h3 class="taskora-dialog-title">' +
              escapeHtml(title || "Please confirm") +
            '</h3>' +
            '<p class="taskora-dialog-message">' +
              escapeHtml(message) +
            '</p>' +
            '<div class="taskora-dialog-actions">' +
              '<button class="taskora-dialog-cancel" type="button">' +
                'Cancel' +
              '</button>' +
              '<button class="taskora-dialog-confirm" type="button" autofocus>' +
                'Confirm' +
              '</button>' +
            '</div>' +
          '</div>';

        document.body.appendChild(dialog);

        var result = false;

        dialog.querySelector(".taskora-dialog-cancel")
          .addEventListener("click", function () {
            dialog.close();
          });

        dialog.querySelector(".taskora-dialog-confirm")
          .addEventListener("click", function () {
            result = true;
            dialog.close();
          });

        dialog.addEventListener("cancel", function () {
          result = false;
        });

        dialog.addEventListener("close", function () {
          dialog.remove();
          resolve(result);
        });

        dialog.showModal();
      });
    },

    toast: toast,

    success: function (message, duration) {
      return toast(message, "success", duration);
    },

    error: function (message, duration) {
      return toast(message, "error", duration);
    },

    warning: function (message, duration) {
      return toast(message, "warning", duration);
    },

    info: function (message, duration) {
      return toast(message, "info", duration);
    }
  };
})();
