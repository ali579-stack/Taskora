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

  window.TaskoraPopup = {
    alert: function (message, title) {
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
              '<button class="taskora-dialog-confirm" autofocus>OK</button>' +
            '</div>' +
          '</div>';

        document.body.appendChild(dialog);

        dialog.querySelector("button").addEventListener("click", function () {
          dialog.close();
        });

        dialog.addEventListener("close", function () {
          dialog.remove();
          resolve();
        });

        dialog.showModal();
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
              '<button class="taskora-dialog-cancel">Cancel</button>' +
              '<button class="taskora-dialog-confirm">Confirm</button>' +
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

        dialog.addEventListener("close", function () {
          dialog.remove();
          resolve(result);
        });

        dialog.showModal();
      });
    },

    toast: function (message, type, duration) {
      var toast = document.createElement("div");
      toast.className = "taskora-toast " + (type || "success");
      toast.textContent = message;

      document.body.appendChild(toast);

      setTimeout(function () {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(8px)";
        setTimeout(function () {
          toast.remove();
        }, 180);
      }, duration || 3000);
    }
  };
})();
