/* ============================================================================
   GeoDev 7-Day Free Trial & Instant Access Patch v2.0 (geo-trial-week.js)
   1. إلغاء شرط تفعيل البريد الإلكتروني (emailVerified) في المدرس الذكي والبحث والصور.
   2. تفعيل أسبوع PRO مجاني (7 أيام كاملة) فور إنشاء الحساب دون إظهار رسالة انتهاء.
   3. إغلاق أدوات PRO تلقائياً بعد مرور 7 أيام بالضبط من تاريخ إنشاء الحساب.
   ============================================================================ */

(function () {
  "use strict";
  if (window.GEOTrialWeekV2) return;
  window.GEOTrialWeekV2 = true;

  const WEEK_MS = 7 * 86400000; // 7 أيام بالمللي ثانية
  const DAY_MS = 86400000;
  const $ = id => document.getElementById(id);

  /* ==========================================================================
     1. تحديث نص شاشة إنشاء الحساب من "3 أيام" إلى "أسبوع"
     ========================================================================== */
  function updateSignupText() {
    const regP = document.querySelector("#registerForm .au-p");
    if (regP) {
      regP.innerHTML = "أنشئ حسابك واحصل على <b>أسبوع PRO</b> مجانًا (7 أيام كاملة)";
    }
  }

  /* ==========================================================================
     2. إلغاء شرط التحقق من البريد الإلكتروني في المدرس الذكي والبحث الذكي
     ========================================================================== */
  function patchAcademyEngines() {
    const E = window.GEOAcademyEngines;
    const API_URL = window.GEO_API;
    if (!E || !API_URL) return;

    E.teacherChat = async function (messages, subject) {
      const user = window.firebase?.auth?.().currentUser;
      if (!user) throw new Error("يرجى تسجيل الدخول أولاً.");
      if (typeof window.geoToken !== "function") throw new Error("اتصال الحساب غير جاهز.");

      const token = await window.geoToken();
      const systemPrompt = `
أنت GEO Teacher، مدرس أكاديمي ذكي ومحترف داخل منصة GeoDev Studio Pro.
التخصص الحالي: ${String(subject || "الجغرافيا")}
أسلوبك في الإجابة:
- ابدأ بإجابة مباشرة ومنظمة عن سؤال الطالب باستخدام عناوين ونقاط واضحة.
- في مسائل GIS والمساحة، وضّح خطوات الحل والمنطق وراءها.
- عند شرح البرامج، اذكر أسماء الأدوات والقوائم بالإنجليزية.
- في البرمجة، اشرح الكود ثم اشرحه في كتلة مستقلة.
- أجب باللغة العربية مع الاحتفاظ بالمصطلحات التقنية الإنجليزية.`;

      const response = await fetch(API_URL + "/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          messages: [
            { role: "system", content: systemPrompt },
            ...(Array.isArray(messages) ? messages.slice(-12) : [])
          ],
          temperature: 0.5,
          max_tokens: 4000,
          stream: false
        })
      });

      const raw = await response.text();
      let parsed;
      try { parsed = JSON.parse(raw); } catch (_) { throw new Error("تعذر قراءة استجابة المدرس الذكي."); }
      if (!response.ok) throw new Error(parsed.error?.message || "حدث خطأ أثناء الاتصال بمحرك المدرس.");

      const answer = parsed.choices?.[0]?.message?.content || parsed.output || "";
      if (!answer.trim()) throw new Error("المدرس الذكي لم يرجع إجابة نصية.");
      return answer;
    };

    if (typeof E.searchWeb === "function") {
      E.searchWeb = async function (query) {
        const user = window.firebase?.auth?.().currentUser;
        if (!user) throw new Error("يرجى تسجيل الدخول أولاً.");
        const token = await window.geoToken();
        const response = await fetch(API_URL + "/search", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
          body: JSON.stringify({ query })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || "تعذر البحث (" + response.status + ")");
        return data;
      };
    }
  }

  /* ==========================================================================
     3. حساب فترة الأسبوع المجاني (7 أيام من إنشاء الحساب) بدقة
     ========================================================================== */
  function getTrialEndTimestamp() {
    try {
      const u = window.firebase?.auth?.().currentUser;
      const email = (u?.email || sessionStorage.getItem("gd_email") || "").toLowerCase();
      const storageKey = email ? "gd_trial_end_" + email : "";

      // 1. إذا كان لدينا تاريخ إنشاء الحساب في Firebase Metadata
      if (u && u.metadata && u.metadata.creationTime) {
        const createdMs = new Date(u.metadata.creationTime).getTime();
        if (!isNaN(createdMs) && createdMs > 0) {
          const endMs = createdMs + WEEK_MS;
          if (storageKey) localStorage.setItem(storageKey, String(endMs));
          return endMs;
        }
      }

      // 2. إذا كان محفوظاً مسبقاً في localStorage لهذا الحساب
      if (storageKey) {
        const saved = parseInt(localStorage.getItem(storageKey) || "0", 10);
        if (saved > 0) return saved;
      }

      // 3. إذا كان المستخدم سجل الدخول للتو ولم تكتمل metadata بعد، نمنحه 7 أيام من الآن مؤقتاً
      if (sessionStorage.getItem("gd_auth") === "1" && storageKey) {
        const tempEnd = Date.now() + WEEK_MS;
        localStorage.setItem(storageKey, String(tempEnd));
        return tempEnd;
      }

      return 0;
    } catch (_) {
      return 0;
    }
  }

  // تجاوز proLeft لتمنح صلاحية PRO كاملة طوال الـ 7 أيام، وتغلقها بعدها
  window.proLeft = function () {
    if (typeof window.isAdm === "function" && window.isAdm()) return 1e12;
    const now = Date.now();
    const m = typeof window.me === "function" ? window.me() : null;
    const paidUntil = (m && m.proUntil) ? Number(m.proUntil) : 0;
    const trialUntil = getTrialEndTimestamp();
    return Math.max(paidUntil, trialUntil) - now;
  };

  // تحديث نافذة PRO ومنع ظهورها التلقائي المزعج أثناء سريان الأسبوع المجاني
  const _origShowPro = window.showPro;
  window.showPro = function (mode) {
    const left = window.proLeft();
    const isAdmin = typeof window.isAdm === "function" && window.isAdm();

    // إذا كان الدخول تلقائياً (welcome/periodic) والأسبوع المجاني سارٍ، لا تزعج المستخدم بالنافذة
    if ((mode === "welcome" || mode === "periodic") && (left > 0 || isAdmin)) {
      return;
    }

    if (typeof _origShowPro === "function") {
      _origShowPro(mode);
      const trialBox = document.querySelector("#proM .trial");
      if (trialBox) {
        const m = typeof window.me === "function" ? window.me() : null;
        const paid = m && m.proUntil > Date.now();
        if (!paid && left > 0 && !isAdmin) {
          const daysLeft = Math.ceil(left / DAY_MS);
          trialBox.textContent = `تجربة مجانية لمدة أسبوع (7 أيام) — متبقي ${daysLeft} يوم`;
        } else if (left <= 0 && !isAdmin) {
          trialBox.textContent = "انتهى الأسبوع المجاني — فعّل كود اشتراك لفتح أدوات PRO";
        }
      }
    }
  };

  function syncProfileTrialNote() {
    const pe = $("pfEnd");
    if (!pe || (typeof window.isAdm === "function" && window.isAdm())) return;
    const m = typeof window.me === "function" ? window.me() : null;
    if (m && m.proUntil > Date.now()) return;

    const trialEnd = getTrialEndTimestamp();
    if (trialEnd > Date.now()) {
      const days = Math.ceil((trialEnd - Date.now()) / DAY_MS);
      pe.textContent = `أسبوع PRO المجاني فعّال (متبقي ${days} يوم) — ينتهي في: ` + new Date(trialEnd).toLocaleString("ar-EG");
    } else if (trialEnd > 0) {
      pe.textContent = "انتهت فترة الأسبوع المجاني — أدخل كود الاشتراك لتجديد الصلاحية";
    }
  }

  /* ==========================================================================
     4. التشغيل والمراقبة
     ========================================================================== */
  function initTrialPatch() {
    updateSignupText();
    patchAcademyEngines();
    syncProfileTrialNote();

    // إغلاق نافذة انتهاء التجربة إذا كانت قد فتحت بالخطأ قبل اكتمال التحميل
    if (window.proLeft() > 0) {
      document.getElementById("proM")?.remove();
    }

    if (typeof window.refreshUI === "function") {
      window.refreshUI();
    }

    if (window.firebase && firebase.apps.length) {
      firebase.auth().onAuthStateChanged(u => {
        if (u) {
          getTrialEndTimestamp();
          patchAcademyEngines();
          syncProfileTrialNote();
          if (window.proLeft() > 0) document.getElementById("proM")?.remove();
          if (typeof window.refreshUI === "function") window.refreshUI();
        }
      });
    }

    setInterval(syncProfileTrialNote, 3000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTrialPatch);
  } else {
    initTrialPatch();
  }
})();
