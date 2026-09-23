(function () {
  const content = document.getElementById("content");

  function normalizePath(p) {
    return (p || "/").replace(/index\.html$/i, "").replace(/\/+$/, "/");
  }

  function setActiveNav(pathname) {
    const current = normalizePath(pathname);
    document.querySelectorAll(".nav-links a[data-nav], .mobile-menu a[data-nav]").forEach(a => {
      a.classList.remove("active");
      const href = a.getAttribute("href") || "";
      const hrefPath = new URL(href, location.href).pathname;
      if (normalizePath(hrefPath) === current) a.classList.add("active");
    });
  }

  function scrollToHash(hash) {
    if (!hash) return;
    const id = hash.startsWith("#") ? hash : "#" + hash;
    const el = document.querySelector(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function loadPage(url, push) {
    if (!content) { window.location.href = url; return; }
    content.classList.add("is-loading");
    try {
      const res = await fetch(url, { credentials: "same-origin" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, "text/html");
      const next = doc.getElementById("content");
      if (!next) return (window.location.href = url);

      content.innerHTML = next.innerHTML;
      document.title = doc.title || document.title;

      if (push) history.pushState({}, "", url);

      const hash = new URL(url, location.origin).hash;
      if (hash) {
        requestAnimationFrame(() => scrollToHash(hash));
      } else {
        window.scrollTo({ top: 0, left: 0 });
      }

      setActiveNav(location.pathname);
      applyLanguage(currentLang());
    } catch (e) {
      window.location.href = url;
    } finally {
      requestAnimationFrame(() => content.classList.remove("is-loading"));
    }
  }

  document.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a) return;

    const href = a.getAttribute("href");
    if (!href) return;

    // 純頁內錨點：#timeline
    if (href.startsWith("#")) {
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        history.pushState(null, "", href);
      }
      return;
    }

    // 站內頁面（+ hash），只攔截標註 data-nav 的連結
    if (a.hasAttribute("data-nav")) {
      e.preventDefault();
      loadPage(href, true);
    }
  });

  window.addEventListener("popstate", () => {
    loadPage(location.pathname + location.search + location.hash, false);
  });

  setActiveNav(location.pathname);
  if (location.hash) requestAnimationFrame(() => scrollToHash(location.hash));

  // ---- 手機版下拉選單 ----
  const menuBtn = document.getElementById("menuBtn");
  const mobileMenu = document.getElementById("mobileMenu");
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener("click", () => {
      mobileMenu.classList.toggle("open");
    });
    mobileMenu.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (a) mobileMenu.classList.remove("open");
    });
  }

  // ---- 中英文切換 ----
  function currentLang() {
    return localStorage.getItem("lang") || "zh";
  }

  function applyLanguage(lang) {
    document.documentElement.lang = lang === "en" ? "en" : "zh-Hant";
    document.querySelectorAll("[data-en]").forEach(el => {
      if (el.dataset.zh === undefined) el.dataset.zh = el.innerHTML;
      el.innerHTML = lang === "en" ? el.getAttribute("data-en") : el.dataset.zh;
    });
    document.querySelectorAll(".lang-toggle").forEach(btn => {
      btn.textContent = lang === "en" ? "中" : "EN";
      btn.setAttribute("aria-label", lang === "en" ? "切換成中文" : "Switch to English");
    });
    localStorage.setItem("lang", lang);
  }

  document.querySelectorAll(".lang-toggle").forEach(btn => {
    btn.addEventListener("click", () => {
      applyLanguage(currentLang() === "en" ? "zh" : "en");
    });
  });

  applyLanguage(currentLang());
})();
