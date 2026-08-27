(function () {
  function initSidebar() {
    const sidebar = document.getElementById("sidebar");
    const menu = document.getElementById("menuButton");
    const close = document.getElementById("sidebarClose");
    const overlay = document.getElementById("sidebarOverlay");

    if (!sidebar || !menu) return;

    function open() {
      sidebar.classList.add("open", "active");
      overlay?.classList.add("active", "show");
      document.body.classList.add("sidebar-open");
    }

    function hide() {
      sidebar.classList.remove("open", "active");
      overlay?.classList.remove("active", "show");
      document.body.classList.remove("sidebar-open");
    }

    menu.onclick = open;
    close && (close.onclick = hide);
    overlay && (overlay.onclick = hide);

    sidebar.querySelectorAll(".nav-item").forEach(item => {
      item.addEventListener("click", () => {
        if (innerWidth <= 900) hide();
      });
    });

    addEventListener("keydown", e => {
      if (e.key === "Escape") hide();
    });

    addEventListener("resize", () => {
      if (innerWidth > 900) hide();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSidebar);
  } else {
    initSidebar();
  }
})();
