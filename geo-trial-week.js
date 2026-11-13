/* ============================================================================
   GeoDev 7-Day Free Trial & Instant Access Patch v1.0 (geo-trial-week.js)
   1. إلغاء شرط تفعيل البريد الإلكتروني (emailVerified) في المدرس الذكي والبحث والصور.
   2. تعديل نص التسجيل من "3 أيام PRO" إلى "أسبوع PRO مجاناً (7 أيام)".
   3. تفعيل صلاحية PRO تلقائياً لمدة 7 أيام من لحظة إنشاء الحساب، وإغلاقها بعد انتهاء الأسبوع.
   ============================================================================ */

(function () {
  "use strict";
  if (window.GEOTrialWeek) return;
  window.GEOTrialWeek = true;

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

    // إعادة تعريف محادثة المدرس الذكي بدون شرط emailVerified
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
- في البرمجة، اشرح الكود ثم اعرضه في كتلة مستقلة.
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

    // إعادة تعريف البحث الذكي بدون شرط emailVerified
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
     3. حساب فترة الأسبوع المجاني (7 أيام من إنشاء الحساب) وإغلاقها بعدها
     ========================================================================== */
  function getTrialEndTimestamp() {
    try {
      const u = window.firebase?.auth?.().currentUser;
      if (u && u.metadata && u.metadata.creationTime) {
        const createdMs = new Date(u.metadata.creationTime).getTime();
        if (!isNaN(createdMs) && createdMs > 0) {
          return createdMs + WEEK_MS;
        }
      }
      // احتياطي من localStorage في حال عدم توفر metadata لحظياً
      const email = (sessionStorage.getItem("gd_email") || "").toLowerCase();
      if (!email) return 0;
      const key = "gd_trial_start_" + email;
      let start = parseInt(localStorage.getItem(key) || "0", 10);
      if (!start && sessionStorage.getItem("gd_auth") === "1") {
        start = Date.now();
        localStorage.setItem(key, String(start));
      }
      return start ? start + WEEK_MS : 0;
    } catch (_) {
      return 0;
    }
  }

  // تجاوز دالة proLeft الأصلية لتعتمد على الـ 7 أيام من تاريخ إنشاء الحساب أو الاشتراك المدفوع
  window.proLeft = function () {
    if (typeof window.isAdm === "function" && window.isAdm()) return 1e12;
    const now = Date.now();
    const m = typeof window.me === "function" ? window.me() : null;
    const paidUntil = (m && m.proUntil) ? Number(m.proUntil) : 0;
    const trialUntil = getTrialEndTimestamp();
    return Math.max(paidUntil, trialUntil) - now;
  };

  // تحديث نافذة PRO لتعرض الأسبوع المجاني (7 أيام) بدلاً من 3 أيام
  const _origShowPro = window.showPro;
  window.showPro = function (mode) {
    if (typeof _origShowPro === "function") {
      _origShowPro(mode);
      const trialBox = document.querySelector("#proM .trial");
      if (trialBox) {
        const left = window.proLeft();
        const m = typeof window.me === "function" ? window.me() : null;
        const paid = m && m.proUntil > Date.now();
        if (!paid && left > 0 && !(typeof window.isAdm === "function" && window.isAdm())) {
          const daysLeft = Math.ceil(left / DAY_MS);
          trialBox.textContent = `تجربة مجانية لمدة أسبوع (7 أيام) — متبقي ${daysLeft} يوم`;
        } else if (left <= 0 && !(typeof window.isAdm === "function" && window.isAdm())) {
          trialBox.textContent = "انتهى الأسبوع المجاني — فعّل كود اشتراك لفتح أدوات PRO";
        }
      }
    }
  };

  // تحديث نص انتهاء الاشتراك في صفحة الملف الشخصي
  function syncProfileTrialNote() {
    const pe = $("pfEnd");
    if (!pe || (typeof window.isAdm === "function" && window.isAdm())) return;
    const m = typeof window.me === "function" ? window.me() : null;
    if (m && m.proUntil > Date.now()) return;

    const trialEnd = getTrialEndTimestamp();
    if (trialEnd > Date.now()) {
      pe.textContent = "فترة أسبوع PRO المجاني تنتهي في: " + new Date(trialEnd).toLocaleString("ar-EG");
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

    if (typeof window.refreshUI === "function") {
      window.refreshUI();
    }

    if (window.firebase && firebase.apps.length) {
      firebase.auth().onAuthStateChanged(() => {
        patchAcademyEngines();
        syncProfileTrialNote();
        if (typeof window.refreshUI === "function") window.refreshUI();
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
