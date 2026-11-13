/* ============================================================================
   GeoDev Performance, Smooth Auto-Scroll & Full Tools Control v1.0
   1. القضاء على التهنيج في الإجابات الطويلة (Throttled Rendering).
   2. نزول تلقائي سلس يحترم تمرير المستخدم اليدوي (Smart Auto-Scroll).
   3. إضافة كافة الأدوات والأقسام الجديدة للوحة تحكم الأدمن (مجاني / PRO / مقفول).
   ============================================================================ */

(function () {
  "use strict";
  if (window.GEOPerfControl) return;
  window.GEOPerfControl = true;

  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));

  /* ==========================================================================
     1. تحسين الأداء والنزول السلس أثناء كتابة الإجابات الطويلة
     ========================================================================== */
  function injectPerfStyles() {
    if ($("geoPerfStyles")) return;
    const st = document.createElement("style");
    st.id = "geoPerfStyles";
    st.textContent = `
      /* تعطيل smooth scroll البرمجي أثناء البث لمنع تداخل الطوابير */
      #chat.streaming, #gisChatBox.streaming, #academyTeacherMessages.streaming {
        scroll-behavior: auto !important;
      }
      /* إيقاف الرسم الثقيل للكرة الأرضية أثناء الإجابات الطويلة لتخفيف الحمل على الموبايل */
      .gd-cw.gd-live canvas {
        display: none !important;
      }
      /* تحسين عزل الرسم للرسائل الطويلة */
      .m.a {
        contain: content;
      }
    `;
    document.head.appendChild(st);
  }

  // تتبع هل المستخدم سحب الشاشة للأعلى يدوياً أم لا
  function setupSmartScroll(boxId) {
    const box = $(boxId);
    if (!box || box.dataset.smartScroll) return;
    box.dataset.smartScroll = "1";
    box._userScrolledUp = false;

    box.addEventListener("scroll", () => {
      const distFromBottom = box.scrollHeight - box.scrollTop - box.clientHeight;
      // إذا ابتعد المستخدم عن القاع بأكثر من 90 بكسل نعتبره يقرأ للأعلى
      box._userScrolledUp = distFromBottom > 90;
    }, { passive: true });
  }

  function smoothScrollBottom(box) {
    if (!box || box._userScrolledUp) return;
    box.scrollTop = box.scrollHeight;
  }

  // اعتراض دالة ask لتطبيق التحديث المجمع (Batched Rendering) والنزول السلس
  const _origAsk = window.ask;
  if (typeof _origAsk === "function") {
    window.ask = async function (prompt, shown) {
      const chatBox = $("chat");
      setupSmartScroll("chat");
      if (chatBox) {
        chatBox._userScrolledUp = false;
        chatBox.classList.add("streaming");
        smoothScrollBottom(chatBox);
      }

      // تجميع التحديثات النصية كل 75ms بدلاً من كل حرف لمنع تجمد المتصفح
      const _origCallAIWithRetry = window.callAIWithRetry;
      if (typeof _origCallAIWithRetry === "function" && !_origCallAIWithRetry.__throttled) {
        const wrappedRetry = async function (p, opts = {}, onStatus) {
          if (opts && (typeof opts.onChunk === "function" || typeof opts.onText === "function")) {
            const origChunk = opts.onChunk;
            const origText = opts.onText;
            let pendingChunk = "";
            let latestFull = "";
            let scheduled = false;

            const flush = () => {
              scheduled = false;
              if (pendingChunk && origChunk) {
                origChunk({ text: pendingChunk, fullText: latestFull });
                pendingChunk = "";
              }
              if (latestFull && origText) {
                origText({ text: latestFull });
              }
              smoothScrollBottom($("chat"));
              smoothScrollBottom($("gisChatBox"));
            };

            opts = {
              ...opts,
              onChunk: origChunk ? ({ text, fullText }) => {
                pendingChunk += text;
                latestFull = fullText;
                if (!scheduled) {
                  scheduled = true;
                  setTimeout(flush, 75);
                }
              } : undefined,
              onText: origText ? ({ text }) => {
                latestFull = text;
                if (!scheduled) {
                  scheduled = true;
                  setTimeout(flush, 75);
                }
              } : undefined
            };
          }
          return await _origCallAIWithRetry(p, opts, onStatus);
        };
        wrappedRetry.__throttled = true;
        window.callAIWithRetry = wrappedRetry;
      }

      try {
        return await _origAsk(prompt, shown);
      } finally {
        if (chatBox) {
          chatBox.classList.remove("streaming");
          setTimeout(() => smoothScrollBottom(chatBox), 60);
        }
      }
    };
  }

  // تحسين النزول السلس في شات الجيوماتكس أيضاً
  const _origGisSend = window.gisSend;
  if (typeof _origGisSend === "function") {
    window.gisSend = async function () {
      const box = $("gisChatBox");
      setupSmartScroll("gisChatBox");
      if (box) {
        box._userScrolledUp = false;
        box.classList.add("streaming");
      }
      try {
        return await _origGisSend.apply(this, arguments);
      } finally {
        if (box) {
          box.classList.remove("streaming");
          setTimeout(() => smoothScrollBottom(box), 60);
        }
      }
    };
  }

  /* ==========================================================================
     2. توسيع تحكم الأدمن الكامل في جميع أدوات وأقسام المنصة (مجاني / PRO / مقفول)
     ========================================================================== */
  const EXTRA_CONTROL_GROUPS = [
    ["أدوات المساحة المضافة", [
      ["t:kroki", "لوحة الكروكي والفرز الشرعي"],
      ["t:shares", "تقسيم الأنصبة والمسطحات"],
      ["t:materials", "كميات مواد البناء والتسعير"],
      ["t:stakeout", "كشف علامات الملكية والتوقيع"],
      ["t:ledger", "حسابات ومصاريف المشاريع"]
    ]],
    ["الأكاديمية والبحث العلمي", [
      ["s:academy", "قسم الأكاديمية بالكامل"],
      ["f:acad_courses", "تبويب المسارات والدورات"],
      ["f:acad_research", "تبويب المنصات البحثية"],
      ["f:acad_books", "تبويب مكتبة الكتب"],
      ["f:acad_smart", "الباحث الذكي عن الكورسات"],
      ["f:teacher", "المدرس الذكي (GEO Teacher)"]
    ]],
    ["أدوات المختبر والجيوماتكس المتقدمة", [
      ["f:code_gen", "مولّد الأكواد الجغرافية (Text-to-Code)"],
      ["f:code_lib", "مكتبة الأكواد الجاهزة المشروحة"],
      ["f:gis_academic", "أدوات الباحث الأكاديمي (Proposal / Sensors)"]
    ]]
  ];

  function getCtlConfig() {
    try { return JSON.parse(localStorage.getItem("gd_ctl") || "{}") || {}; } catch (_) { return {}; }
  }

  function getState(id) {
    const cfg = getCtlConfig();
    if (cfg[id]) return cfg[id];
    // الافتراضي للأدوات الجديدة: مجاني (free) إلا إذا غيره الأدمن
    return "free";
  }

  function isAdminUser() {
    return sessionStorage.getItem("gd_role") === "admin";
  }

  function isLockedOff(id) {
    return !isAdminUser() && getState(id) === "off";
  }

  function isProOnly(id) {
    return !isAdminUser() && getState(id) === "pro";
  }

  // حقن المجموعات الجديدة داخل كارت "التحكم في الأدوات والأقسام" في لوحة الأدمن
  function injectAdminExtraControls() {
    const ctlCard = $("gdCtl");
    if (!ctlCard || $("gdExtraCtlMounted")) return;

    const saveBtn = ctlCard.querySelector("button.g");
    if (!saveBtn) return;

    const container = document.createElement("div");
    container.id = "gdExtraCtlMounted";
    container.style.marginTop = "8px";

    container.innerHTML = EXTRA_CONTROL_GROUPS.map(([groupTitle, items]) => `
      <b style="display:block;margin-top:10px;color:var(--bl)">${esc(groupTitle)}</b>
      ${items.map(([id, label]) => {
        const cur = getState(id);
        return `
          <div class="ctl-row">
            <label>${esc(label)}</label>
            <select data-ctl="${esc(id)}">
              <option value="free" ${cur === "free" ? "selected" : ""}>مجاني</option>
              <option value="pro" ${cur === "pro" ? "selected" : ""}>PRO</option>
              <option value="off" ${cur === "off" ? "selected" : ""}>مقفول</option>
            </select>
          </div>
        `;
      }).join("")}
    `).join("");

    saveBtn.parentNode.insertBefore(container, saveBtn);
  }

  // تطبيق الصلاحيات (مجاني / PRO / مقفول) على جميع الأدوات والأقسام الجديدة فوراً
  function enforceAllControls() {
    // 1. إخفاء الأقسام المقفولة من شريط التنقل
    const acadNav = document.querySelector('nav button[data-t="academy"]');
    if (acadNav) acadNav.style.display = isLockedOff("s:academy") ? "none" : "";

    // 2. تحديث حالة كروت المساحة الـ 5 الجديدة
    ["kroki", "shares", "materials", "stakeout", "ledger"].forEach(tid => {
      const card = document.querySelector(`#surveyGrid .dash-card[onclick="openTool('${tid}')"]`);
      if (!card) return;
      const state = getState("t:" + tid);
      card.querySelectorAll(".pro-b").forEach(b => b.remove());
      card.style.opacity = "1";
      card.style.display = "";

      if (state === "off") {
        if (isAdminUser()) {
          card.style.opacity = "0.45";
          card.insertAdjacentHTML("afterbegin", '<span class="pro-b" style="background:#991b1b">مقفول</span>');
        } else {
          card.style.display = "none";
        }
      } else if (state === "pro") {
        card.insertAdjacentHTML("afterbegin", '<span class="pro-b">PRO</span>');
      }
    });

    // 3. تحديث تبويبات الأكاديمية
    const tabMap = {
      "courses": "f:acad_courses",
      "research-hub": "f:acad_research",
      "books-lib": "f:acad_books",
      "smart-search": "f:acad_smart",
      "teacher": "f:teacher"
    };
    Object.entries(tabMap).forEach(([tabKey, ctlKey]) => {
      const btn = document.querySelector(`[data-academy-tab="${tabKey}"]`);
      if (btn) btn.style.display = isLockedOff(ctlKey) ? "none" : "";
    });

    // 4. إخفاء أقسام المختبر والجيوماتكس إذا كانت مقفولة
    const codeGenCard = $("gisCodePrompt")?.closest(".card");
    if (codeGenCard) codeGenCard.style.display = isLockedOff("f:code_gen") ? "none" : "";

    const codeLibCard = document.querySelector(".code-lab-grid")?.closest(".card");
    if (codeLibCard) codeLibCard.style.display = isLockedOff("f:code_lib") ? "none" : "";

    const acadStudio = $("gisAcademicStudio");
    if (acadStudio) acadStudio.style.display = isLockedOff("f:gis_academic") ? "none" : "";
  }

  // اعتراض النقر على الأدوات والأزرار للتحقق من حالة PRO أو مقفول
  document.addEventListener("click", e => {
    // التحقق من تبويبات الأكاديمية
    const tab = e.target.closest && e.target.closest("[data-academy-tab]");
    if (tab) {
      const map = {
        "courses": "f:acad_courses",
        "research-hub": "f:acad_research",
        "books-lib": "f:acad_books",
        "smart-search": "f:acad_smart",
        "teacher": "f:teacher"
      };
      const key = map[tab.dataset.academyTab];
      if (key) {
        if (isLockedOff(key)) {
          e.preventDefault(); e.stopImmediatePropagation();
          return window.toast && window.toast("هذا القسم مغلق حالياً من الإدارة", "warn");
        }
        if (isProOnly(key) && typeof window.needPro === "function" && window.needPro()) {
          e.preventDefault(); e.stopImmediatePropagation();
          return;
        }
      }
    }

    // التحقق من أزرار الباحث الأكاديمي في الجيوماتكس
    const acadBtn = e.target.closest && e.target.closest(".gis-academic-btn");
    if (acadBtn) {
      if (isLockedOff("f:gis_academic")) {
        e.preventDefault(); e.stopImmediatePropagation();
        return window.toast && window.toast("هذه الأداة مغلقة حالياً", "warn");
      }
      if (isProOnly("f:gis_academic") && typeof window.needPro === "function" && window.needPro()) {
        e.preventDefault(); e.stopImmediatePropagation();
        return;
      }
    }

    // التحقق من زر توليد الأكواد الجغرافية
    const codeGenBtn = e.target.closest && e.target.closest("#gisCodeGenBtn");
    if (codeGenBtn) {
      if (isLockedOff("f:code_gen")) {
        e.preventDefault(); e.stopImmediatePropagation();
        return window.toast && window.toast("مولّد الأكواد مغلق حالياً", "warn");
      }
      if (isProOnly("f:code_gen") && typeof window.needPro === "function" && window.needPro()) {
        e.preventDefault(); e.stopImmediatePropagation();
        return;
      }
    }
  }, true);

  // ربط حفظ الإعدادات في لوحة الأدمن بتحديث الواجهة فوراً
  const _origSaveCtl = window.saveCtl;
  if (typeof _origSaveCtl === "function") {
    window.saveCtl = async function () {
      await _origSaveCtl.apply(this, arguments);
      enforceAllControls();
    };
  }

  const _origApplyCfg = window.applyCfg;
  if (typeof _origApplyCfg === "function") {
    window.applyCfg = function () {
      _origApplyCfg.apply(this, arguments);
      injectAdminExtraControls();
      enforceAllControls();
    };
  }

  function initPerfAndControl() {
    injectPerfStyles();
    setupSmartScroll("chat");
    setupSmartScroll("gisChatBox");
    injectAdminExtraControls();
    enforceAllControls();

    // إعادة تطبيق الضوابط بعد تحميل جميع الباتشات
    setTimeout(() => {
      injectAdminExtraControls();
      enforceAllControls();
    }, 600);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPerfAndControl);
  } else {
    initPerfAndControl();
  }
})();
