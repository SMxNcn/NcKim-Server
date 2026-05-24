(function () {
  "use strict";

  const $app = document.getElementById("app");
  let modsData = [];
  let currentTab = "home";
  let scrollPos = 0;
  let isTransitioning = false;

  function findMod(id) {
    return modsData.find((m) => m.id === id);
  }

  function tabContentHTML() {
    if (currentTab === "home") {
      return renderHero(modsData.length) + renderModGrid(modsData);
    } else if (currentTab === "fun") {
      return renderFunTab();
    }
    return "";
  }

  function attachCardHandlers() {
    document.querySelectorAll(".mod-card").forEach((card) => {
      card.addEventListener("click", () => {
        const modId = card.dataset.modId;
        const mod = findMod(modId);
        if (mod) openModal(mod);
      });
    });
  }

  function renderPage() {
    $app.innerHTML = `
      ${renderNavbar(currentTab)}
      <div class="tab-content" id="tab-content">${tabContentHTML()}</div>
      ${renderFooter()}
    `;
    attachCardHandlers();
    positionNavIndicator();
  }

  function updateNavbarTab(tab) {
    document.querySelectorAll(".nav-link").forEach((link) => {
      const match = link.getAttribute("onclick")?.match(/switchTab\('(\w+)'\)/);
      link.classList.toggle("active", match?.[1] === tab);
    });
  }

  function positionNavIndicator() {
    const indicator = document.getElementById("nav-indicator");
    const activeLink = document.querySelector(".nav-link.active");
    if (indicator && activeLink) {
      indicator.style.left = activeLink.offsetLeft + "px";
      indicator.style.width = activeLink.offsetWidth + "px";
    }
  }

  window.switchTab = function (tab) {
    if (isTransitioning || tab === currentTab) return;
    isTransitioning = true;

    updateNavbarTab(tab);
    positionNavIndicator();

    const tc = document.getElementById("tab-content");
    tc.classList.add("fade-out");

    setTimeout(() => {
      currentTab = tab;
      tc.innerHTML = tabContentHTML();
      attachCardHandlers();
      tc.classList.remove("fade-out");
      isTransitioning = false;
    }, 250);

    const url = tab === "home" ? "/" : "/fun";
    history.pushState(null, "", url);
    window.scrollTo(0, 0);
  };

  window.addEventListener("popstate", () => {
    const path = window.location.pathname.replace(/\/+$/, "") || "/";
    const tab = path === "/fun" ? "fun" : "home";
    if (tab !== currentTab && !isTransitioning) {
      switchTab(tab);
    }
  });

  function openModal(mod) {
    scrollPos = window.scrollY;
    document.body.style.overflow = "hidden";

    const existing = document.getElementById("modal-overlay");
    if (existing) existing.remove();

    const wrapper = document.createElement("div");
    wrapper.innerHTML = renderModalDetail(mod);
    const overlay = wrapper.firstElementChild;
    document.body.appendChild(overlay);

    // Force reflow so initial state renders, then transition in
    void overlay.offsetHeight;
    overlay.classList.add("active");
  }

  function closeModalNow() {
    const overlay = document.getElementById("modal-overlay");
    if (!overlay) return;

    const windowEl = overlay.querySelector(".modal-window");
    if (windowEl) windowEl.classList.add("closing");

    overlay.classList.remove("active");

    setTimeout(() => {
      overlay.remove();
      document.body.style.overflow = "";
      window.scrollTo(0, scrollPos);
    }, 350);
  }

  window.closeModal = function (event) {
    if (event && event.target && event.target.id !== "modal-overlay") return;
    closeModalNow();
  };

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModalNow();
  });

  function updateNavbar() {
    const navbar = document.querySelector(".navbar");
    if (navbar) {
      navbar.classList.toggle("scrolled", window.scrollY > 20);
    }
  }

  async function init() {
    const path = window.location.pathname.replace(/\/+$/, "") || "/";
    currentTab = path === "/fun" ? "fun" : "home";

    const versions = await fetchModVersions();
    const versionMap = {};
    versions.forEach((v) => {
      versionMap[v.id] = v.version;
    });

    modsData = MODS.map((m) => ({
      ...m,
      version: versionMap[m.id] || m.version || "0.0.0",
    }));

    renderPage();
    updateNavbar();
    document.addEventListener("scroll", updateNavbar, { passive: true });
    window.addEventListener("resize", positionNavIndicator);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
