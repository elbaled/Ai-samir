/* ============================================================================
   GeoDev 7-Day Unified Trial & Zero-Popup System v5.1
   1. توحيد الحساب بين شارة الهيدر (PRO) وشريط العدّاد (7 أيام -> 6 أيام -> مقفول).
   2. تقليص الفترة التجريبية الافتراضية (30 يوماً عند التسجيل) إلى 7 أيام تلقائياً.
   3. منع ظهور نافذة الاشتراك (#proM) تلقائياً نهائياً (تظهر فقط عند الضغط على أداة PRO).
   4. إبقاء المحرك الأساسي GEO 2.9 مجانياً وقصر 3.8 / 5.2 على PRO.
   ============================================================================ */

(function () {
  "use strict";
  if (window.GEOTrialWeekV51) return;
  window.GEOTrialWeekV51 = true;

  const WEEK_MS = 7 * 86400000;   // 7 أيام
  const MONTH_MS = 30 * 86400000; // 30 يوماً (الفترة الافتراضية القديمة للسيرفر)
  const DAY_MS = 86400000;
  const $ = id => document.getElementById(id);

  let userClickedProTrigger = false;

  document.addEventListener("click", e => {
    const target = e.target.closest && e.target.closest("button, .dash-card, .eng-opt, [onclick*='showPro'], [onclick*='openTool']");
    if (target) {
      userClickedProTrigger = true;
      setTimeout(() => { userClickedProTrigger = false; }, 1200);
    }
  }, true);

  /* ==========================================================================
     1. توحيد نهاية الصلاحية (7 أيام للتجربة، أو المدة الممنوحة من الأدمن/الكود)
     ========================================================================== */
  function getAccountCreationMs() {
    const u = window.firebase?.auth?.().currentUser;
    if (u && u.metadata && u.metadata.creationTime) {
      const ms = new Date(u.metadata.creationTime).getTime();
      if (!isNaN(ms) && ms > 0) return ms;
    }
    const m = typeof window.me === "function" ? window.me() : null;
    if (m && m.createdAt) {
      const fsMs = m.createdAt.toMillis ? m.createdAt.toMillis() : new Date(m.createdAt).getTime();
      if (!isNaN(fsMs) && fsMs > 0) return fsMs;
    }
    return 0;
  }

  function getUnifiedEndTimestamp() {
    try {
      const u = window.firebase?.auth?.().currentUser;
      const m = typeof window.me === "function" ? window.me() : null;
      const email = (u?.email || m?.email || sessionStorage.getItem("gd_email") || "").toLowerCase();
      const storageKey = email ? "gd_trial_end_v51_" + email : "";

      const createdMs = getAccountCreationMs();
      const rawServerEnd = Number(m?.proUntil || m?.pro_until || m?.trial_end || 0);

      // إذا كان السيرفر قد أعطى 30 يوماً تلقائياً لحظة إنشاء الحساب، نقلصها إلى 7 أيام من الإنشاء
      if (createdMs > 0 && rawServerEnd > 0) {
        const isDefaultSignupMonth = Math.abs(rawServerEnd - (createdMs + MONTH_MS)) < 3600000;
        const effectiveEnd = isDefaultSignupMonth ? (createdMs + WEEK_MS) : rawServerEnd;
        if (storageKey) localStorage.setItem(storageKey, String(effectiveEnd));
        return effectiveEnd;
      }

      if (createdMs > 0) {
        const endMs = createdMs + WEEK_MS;
        if (storageKey) localStorage.setItem(storageKey, String(endMs));
        return endMs;
      }

      if (rawServerEnd > 0) return rawServerEnd;

      if (storageKey) {
        const saved = parseInt(localStorage.getItem(storageKey) || "0", 10);
        if (saved > 0) return saved;
      }

      return null;
    } catch (_) {
      return null;
    }
  }

  window.proLeft = function () {
    if (typeof window.isAdm === "function" && window.isAdm()) return 1e12;
    const endMs = getUnifiedEndTimestamp();
    if (endMs === null) {
      return sessionStorage.getItem("gd_auth") === "1" ? WEEK_MS : 0;
    }
    return endMs - Date.now();
  };

  /* ==========================================================================
     2. منع ظهور نافذة الاشتراك (#proM) تلقائياً
     ========================================================================== */
  const _origShowPro = window.showPro;
  window.showPro = function (mode) {
    const left = window.proLeft();
    const isAdmin = typeof window.isAdm === "function" && window.isAdm();

    if (!userClickedProTrigger || mode === "welcome" || mode === "periodic") {
      return;
    }

    if (typeof _origShowPro === "function") {
      _origShowPro(mode);
      const trialBox = document.querySelector("#proM .trial");
      if (trialBox) {
        if (left > 0 && !isAdmin) {
          const daysLeft = Math.max(1, Math.ceil(left / DAY_MS));
          trialBox.textContent = `معك ${daysLeft} ${daysLeft === 1 ? "يوم" : "أيام"} متبقية في تجربة PRO المجانية`;
        } else if (left <= 0 && !isAdmin) {
          trialBox.textContent = "انتهت فترة الـ 7 أيام — فعّل كود اشتراك لفتح أدوات PRO";
        }
      }
    }
  };

  /* ==========================================================================
     3. شريط العدّاد التنازلي المتطابق مع شارة الهيدر
     ========================================================================== */
  function updateTrialCountdownBanner() {
    const isAdmin = typeof window.isAdm === "function" && window.isAdm();
    const u = window.firebase?.auth?.().currentUser;
    if (!u || isAdmin) {
      $("gdTrialStrip")?.remove();
      return;
    }

    const endMs = getUnifiedEndTimestamp();
    if (endMs === null) return;

    const leftMs = endMs - Date.now();
    const daysLeft = Math.ceil(leftMs / DAY_MS);

    let strip = $("gdTrialStrip");
    if (!strip) {
      const header = document.querySelector("header") || document.body;
      strip = document.createElement("div");
      strip.id = "gdTrialStrip";
      strip.style.cssText = `
        width: 100%;
        padding: 6px 14px;
        font-size: 12px;
        font-weight: 700;
        text-align: center;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        border-bottom: 1px solid var(--ln, #334155);
        background: var(--cd, #0f172a);
        color: var(--tx, #f1f5f9);
        z-index: 20;
      `;
      header.insertAdjacentElement("afterend", strip);
    }

    if (daysLeft > 0) {
      const dayWord = daysLeft === 1 ? "يوم واحد" : daysLeft === 2 ? "يومان" : daysLeft <= 10 ? `${daysLeft} أيام` : `${daysLeft} يوماً`;
      strip.innerHTML = `
        <span style="color:var(--am,#f59e0b)">●</span>
        <span>معك <b>${dayWord}</b> في تجربة PRO المجانية وبعدها يُقفل الـ PRO تلقائياً</span>
      `;
    } else {
      strip.innerHTML = `
        <span style="color:var(--mt,#94a3b8)">●</span>
        <span>انتهت فترة الـ 7 أيام وقُفل الـ PRO — تعمل الآن على الباقة المجانية (GEO 2.9)</span>
        <button type="button" class="a" style="padding:2px 10px;min-height:24px;font-size:11px;border-radius:8px" onclick="window.showPro()">تفعيل</button>
      `;
    }
  }

  /* ==========================================================================
     4. فرض المحرك الأساسي GEO 2.9 لغير المشتركين في PRO
     ========================================================================== */
  function enforceEngineTier() {
    const isAdmin = typeof window.isAdm === "function" && window.isAdm();
    const hasPro = isAdmin || window.proLeft() > 0;

    try {
      const ctl = JSON.parse(localStorage.getItem("gd_ctl") || "{}");
      let changed = false;
      if (ctl["e:g29"] !== "free") { ctl["e:g29"] = "free"; changed = true; }
      if (!ctl["e:g38"]) { ctl["e:g38"] = "pro"; changed = true; }
      if (!ctl["e:g52"]) { ctl["e:g52"] = "pro"; changed = true; }
      if (changed) localStorage.setItem("gd_ctl", JSON.stringify(ctl));
    } catch (_) {}

    if (!hasPro) {
      if (window.eng && window.eng !== "g29") {
        if (typeof window.setEng === "function") {
          window.setEng("g29");
        } else {
          window.eng = "g29";
          localStorage.setItem("gd_eng", "g29");
        }
      }
      const engLbl = $("engLbl");
      if (engLbl && engLbl.textContent !== "GEO 2.9") engLbl.textContent = "GEO 2.9";
      document.querySelectorAll("#engMenu .eng-opt").forEach(btn => {
        btn.classList.toggle("on", btn.dataset.e === "g29");
      });
    }
  }

  const _origSetEng = window.setEng;
  window.setEng = function (e) {
    const isAdmin = typeof window.isAdm === "function" && window.isAdm();
    const hasPro = isAdmin || window.proLeft() > 0;
    if ((e === "g38" || e === "g52") && !hasPro) {
      userClickedProTrigger = true;
      if (typeof window.showPro === "function") window.showPro();
      return;
    }
    if (typeof _origSetEng === "function") return _origSetEng.apply(this, arguments);
  };

  /* ==========================================================================
     5. تحديث شاشة الإدارة ("الحسابات المسجلة") وزر المنح إلى 7 أيام
     ========================================================================== */
  function parseDMY(str) {
    const m = String(str).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!m) return null;
    return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  }

  function formatDMY(dateObj) {
    const d = String(dateObj.getDate()).padStart(2, "0");
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const y = dateObj.getFullYear();
    return `${d}/${m}/${y}`;
  }

  function patchAdminAccountsUI() {
    const adminSec = $("s-admin") || $("adminPanel");
    if (!adminSec) return;

    adminSec.querySelectorAll("button").forEach(btn => {
      if (btn.dataset.weekBtnPatched === "1") return;
      const txt = (btn.textContent || "").trim();
      if (txt.includes("30 يوم")) {
        btn.dataset.weekBtnPatched = "1";
        btn.textContent = txt.replace(/30\s*يوماً?/g, "7 أيام");
        const rawOnclick = btn.getAttribute("onclick");
        if (rawOnclick && rawOnclick.includes("30")) {
          btn.setAttribute("onclick", rawOnclick.replace(/\b30\b/g, "7"));
        }
      }
    });

    const walker = document.createTreeWalker(adminSec, NodeFilter.SHOW_TEXT, null);
    let node;
    while ((node = walker.nextNode())) {
      const val = node.nodeValue || "";
      if (!val.includes("فترة تجريبية حتى") || !val.includes("تاريخ التسجيل:")) continue;
      const match = val.match(/فترة تجريبية حتى\s*(\d{1,2}\/\d{1,2}\/\d{4})\s*-\s*تاريخ التسجيل:\s*(\d{1,2}\/\d{1,2}\/\d{4})/);
      if (match) {
        const endD = parseDMY(match[1]);
        const regD = parseDMY(match[2]);
        if (endD && regD) {
          const diffDays = Math.round((endD - regD) / DAY_MS);
          if (diffDays >= 27 && diffDays <= 32) {
            const weekEnd = new Date(regD.getTime() + WEEK_MS);
            node.nodeValue = val.replace(match[1], formatDMY(weekEnd));
          }
        }
      }
    }
  }

  /* ==========================================================================
     6. التشغيل والمراقبة
     ========================================================================== */
  function initTrialWeekV51() {
    const regP = document.querySelector("#registerForm .au-p");
    if (regP) {
      regP.innerHTML = "أنشئ حسابك واحصل على <b>7 أيام PRO</b> مجانًا وبعدها يُقفل الـ PRO تلقائياً";
    }

    document.getElementById("proM")?.remove();

    enforceEngineTier();
    updateTrialCountdownBanner();
    patchAdminAccountsUI();
    if (typeof window.refreshUI === "function") window.refreshUI();

    if (window.firebase && firebase.apps.length) {
      firebase.auth().onAuthStateChanged(u => {
        if (u) {
          document.getElementById("proM")?.remove();
          getUnifiedEndTimestamp();
          enforceEngineTier();
          updateTrialCountdownBanner();
          patchAdminAccountsUI();
          if (typeof window.refreshUI === "function") window.refreshUI();
        }
      });
    }

    setInterval(() => {
      enforceEngineTier();
      updateTrialCountdownBanner();
      patchAdminAccountsUI();
      if (typeof window.refreshUI === "function") window.refreshUI();
    }, 2000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTrialWeekV51);
  } else {
    initTrialWeekV51();
  }
})();
