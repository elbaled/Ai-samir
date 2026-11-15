/* ============================================================================
   إضافة قسم "شغل وأجهزة" تلقائياً في الشريط السفلي بجانب "المساحة" (محدّث)
   ============================================================================ */
(function () {
  "use strict";
  if (window.GEOWorkDevicesTabInit) return;
  window.GEOWorkDevicesTabInit = true;

  function injectWorkDevicesStyles() {
    if (document.getElementById("gdWorkDevicesStyles")) return;
    const style = document.createElement("style");
    style.id = "gdWorkDevicesStyles";
    style.textContent = `
      @keyframes gdGearRotate {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      @keyframes gdGearRotateReverse {
        0% { transform: rotate(360deg); }
        100% { transform: rotate(0deg); }
      }
      #gdWorkDevicesView {
        display: none;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 48px 20px 100px;
        min-height: 62vh;
        direction: rtl;
        color: #f3f6fa;
      }
      #gdWorkDevicesView.active {
        display: flex;
      }
      /* إجبار عدم تفعيل أي تبويب آخر أثناء فتح "شغل وأجهزة" */
      body.gd-wd-open nav .active:not(#gdWorkDevicesNavBtn),
      body.gd-wd-open nav .on:not(#gdWorkDevicesNavBtn),
      body.gd-wd-open footer .active:not(#gdWorkDevicesNavBtn),
      body.gd-wd-open footer .on:not(#gdWorkDevicesNavBtn),
      body.gd-wd-open [class*="nav"] .active:not(#gdWorkDevicesNavBtn),
      body.gd-wd-open [class*="nav"] .on:not(#gdWorkDevicesNavBtn),
      body.gd-wd-open [class*="bottom"] .active:not(#gdWorkDevicesNavBtn),
      body.gd-wd-open [class*="bottom"] .on:not(#gdWorkDevicesNavBtn) {
        color: #8b949e !important;
        border-top-color: transparent !important;
        border-bottom-color: transparent !important;
        background: transparent !important;
        box-shadow: none !important;
      }
      /* تنسيق التبويب الجديد عند تفعيله فقط */
      #gdWorkDevicesNavBtn.gd-wd-active {
        color: #e0531f !important;
        border-top: 2px solid #e0531f !important;
        background: rgba(224, 83, 31, 0.08) !important;
      }
      #gdWorkDevicesNavBtn:not(.gd-wd-active) {
        color: #8b949e !important;
        border-color: transparent !important;
        background: transparent !important;
      }
      .gd-wd-gears-wrap {
        position: relative;
        width: 130px;
        height: 130px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 22px;
      }
      .gd-wd-gear-main {
        color: #e09f24;
        filter: drop-shadow(0 0 18px rgba(224, 159, 36, 0.35));
        animation: gdGearRotate 7s linear infinite;
      }
      .gd-wd-gear-sub {
        position: absolute;
        bottom: 6px;
        left: 8px;
        color: #38bdf8;
        filter: drop-shadow(0 0 12px rgba(56, 189, 248, 0.3));
        animation: gdGearRotateReverse 5s linear infinite;
      }
      .gd-wd-badge-icon {
        position: absolute;
        top: 4px;
        right: 6px;
        background: #171c26;
        border: 1.5px solid #e09f24;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
      }
      .gd-wd-title {
        margin: 0 0 10px;
        font-size: 22px;
        font-weight: 900;
        color: #e09f24;
      }
      .gd-wd-desc {
        margin: 0;
        font-size: 13.5px;
        color: #94a3b8;
        max-width: 340px;
        line-height: 1.7;
      }
    `;
    document.head.appendChild(style);
  }

  function setupWorkDevicesTab() {
    if (document.getElementById("gdWorkDevicesNavBtn")) return;

    const allButtons = Array.from(document.querySelectorAll("button, a, .nav-item, [data-tab]"));
    const surveyBtn = allButtons.find(
      el => (el.textContent || "").trim().includes("المساحة") &&
      el.closest("nav, footer, [class*='nav'], [class*='bottom'], [id*='nav']")
    );

    if (!surveyBtn) return;

    // استنساخ زر "المساحة" وتنظيف جميع سمات التفعيل والارتباط منه
    const newBtn = surveyBtn.cloneNode(true);
    newBtn.id = "gdWorkDevicesNavBtn";
    newBtn.classList.remove("active", "on", "selected", "current");
    newBtn.removeAttribute("onclick");
    newBtn.removeAttribute("data-tab");
    newBtn.removeAttribute("data-view");
    newBtn.removeAttribute("data-target");
    newBtn.removeAttribute("aria-selected");

    const customIconSvg = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="display:block;margin:0 auto 2px;">
        <path d="M5 10a7 7 0 0 1 14 0v1H5v-1z" fill="rgba(224,159,36,0.2)"/>
        <path d="M3 11h18"/>
        <path d="M12 3v4"/>
        <rect x="9" y="13" width="6" height="4" rx="1"/>
        <circle cx="12" cy="15" r="1"/>
        <path d="M12 17v4"/>
        <path d="M10 17l-3 4"/>
        <path d="M14 17l3 4"/>
      </svg>
    `;

    const svgEl = newBtn.querySelector("svg, i, span:first-child");
    if (svgEl) {
      svgEl.outerHTML = customIconSvg;
    }

    const walker = document.createTreeWalker(newBtn, NodeFilter.SHOW_TEXT, null, false);
    let node;
    while ((node = walker.nextNode())) {
      if (node.nodeValue && node.nodeValue.includes("المساحة")) {
        node.nodeValue = node.nodeValue.replace("المساحة", "شغل وأجهزة");
      }
    }

    // وضع الزر بجانب "المساحة"
    surveyBtn.insertAdjacentElement("afterend", newBtn);

    const mainContainer = document.querySelector("main, .main-content, #app, .container") || document.body;
    const viewDiv = document.createElement("div");
    viewDiv.id = "gdWorkDevicesView";
    viewDiv.innerHTML = `
      <div class="gd-wd-gears-wrap">
        <div class="gd-wd-badge-icon" title="مساحة وأجهزة">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e09f24" stroke-width="2">
            <path d="M5 10a7 7 0 0 1 14 0v1H5v-1z"/>
            <path d="M3 11h18"/>
            <rect x="9" y="13" width="6" height="4" rx="1"/>
            <path d="M10 17l-3 4M14 17l3 4M12 17v4"/>
          </svg>
        </div>
        <svg class="gd-wd-gear-main" width="84" height="84" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
        <svg class="gd-wd-gear-sub" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      </div>
      <h2 class="gd-wd-title">جاري تصميم القسم...</h2>
      <p class="gd-wd-desc">نعمل حالياً على تجهيز قسم <strong>شغل وأجهزة</strong> لتوفير أحدث فرص العمل المساحية وأدوات وأجهزة الرفع والـ Total Station. انتظرونا قريباً!</p>
    `;
    mainContainer.appendChild(viewDiv);

    const navContainer = surveyBtn.parentElement;
    const siblingTabs = Array.from(navContainer.children).filter(el => el !== newBtn);

    // عند الضغط على "شغل وأجهزة"
    newBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopImmediatePropagation();

      document.body.classList.add("gd-wd-open");
      siblingTabs.forEach(btn => btn.classList.remove("active", "on", "selected", "current"));
      newBtn.classList.add("gd-wd-active");

      Array.from(mainContainer.children).forEach(child => {
        if (
          child !== viewDiv &&
          !child.contains(navContainer) &&
          child.id !== "gdApkFloatingBanner" &&
          child.id !== "gdGiveawayFloatingCard"
        ) {
          if (child.style.display !== "none") {
            child.dataset.prevDisplay = child.style.display || "block";
            child.style.display = "none";
          }
        }
      });
      viewDiv.classList.add("active");
    }, true);

    // عند الضغط على أي قسم آخر (بما فيها المساحة)
    siblingTabs.forEach(btn => {
      btn.addEventListener("click", () => {
        document.body.classList.remove("gd-wd-open");
        newBtn.classList.remove("gd-wd-active", "active", "on", "selected", "current");
        viewDiv.classList.remove("active");

        Array.from(mainContainer.children).forEach(child => {
          if (child !== viewDiv && child.dataset.prevDisplay) {
            child.style.display = child.dataset.prevDisplay === "block" ? "" : child.dataset.prevDisplay;
            delete child.dataset.prevDisplay;
          }
        });
      }, true);
    });
  }

  function init() {
    injectWorkDevicesStyles();
    setupWorkDevicesTab();
    setTimeout(setupWorkDevicesTab, 800);
    setTimeout(setupWorkDevicesTab, 2000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
