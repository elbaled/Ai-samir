/* ============================================================================
   GeoDev 7-Day Free Trial, Engine Access & Instant Auth Patch v3.0
   1. جعل محرك GEO 2.9 هو المحرك الأساسي الافتراضي للمستخدمين العاديين والجدد.
   2. قصر محركي GEO 3.8 FLASH و GEO 5.2 ULTRA على أصحاب صلاحية PRO فقط.
   3. إلغاء شرط تفعيل البريد الإلكتروني (emailVerified) في المدرس الذكي والبحث.
   4. تفعيل أسبوع PRO مجاني (7 أيام) للحسابات الجديدة من تاريخ إنشائها.
   ============================================================================ */

(function () {
  "use strict";
  if (window.GEOTrialWeekV3) return;
  window.GEOTrialWeekV3 = true;

  const WEEK_MS = 7 * 86400000; // 7 أيام بالمللي ثانية
  const DAY_MS = 86400000;
  const $ = id => document.getElementById(id);

  /* ==========================================================================
     1. فرض المحرك الأساسي GEO 2.9 للمستخدمين غير المشتركين في PRO
     ========================================================================== */
  function enforceEngineTier() {
    const isAdmin = typeof window.isAdm === "function" && window.isAdm();
    const hasPro = isAdmin || window.proLeft() > 0;

    // التأكد في إعدادات التحكم أن g29 مجاني، و g38 و g52 مقفولين على PRO
    try {
      const ctl = JSON.parse(localStorage.getItem("gd_ctl") || "{}");
      let changed = false;
      if (ctl["e:g29"] !== "free") { ctl["e:g29"] = "free"; changed = true; }
      if (!ctl["e:g38"]) { ctl["e:g38"] = "pro"; changed = true; }
      if (!ctl["e:g52"]) { ctl["e:g52"] = "pro"; changed = true; }
      if (changed) localStorage.setItem("gd_ctl", JSON.stringify(ctl));
    } catch (_) {}

    // إذا كان المستخدم عادياً (بدون PRO) والمحرك المختار حالياً هو 3.8 أو 5.2، نرجعه فوراً لـ GEO 2.9
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
      if (engLbl && engLbl.textContent !== "GEO 2.9") {
        engLbl.textContent = "GEO 2.9";
      }
      document.querySelectorAll("#engMenu .eng-opt").forEach(btn => {
        btn.classList.toggle("on", btn.dataset.e === "g29");
      });
    }
  }

  // اعتراض اختيار المحرك لمنع تشغيل 3.8 أو 5.2 بدون PRO
  const _origSetEng = window.setEng;
  window.setEng = function (e) {
    const isAdmin = typeof window.isAdm === "function" && window.isAdm();
    const hasPro = isAdmin || window.proLeft() > 0;
    if ((e === "g38" || e === "g52") && !hasPro) {
      if (typeof window.showPro === "function") window.showPro();
      return;
    }
    if (typeof _origSetEng === "function") {
      return _origSetEng.apply(this, arguments);
    }
  };

  /* ==========================================================================
     2. تحديث نص شاشة إنشاء الحساب من "3 أيام" إلى "أسبوع"
     ========================================================================== */
  function updateSignupText() {
    const regP = document.querySelector("#registerForm .au-p");
    if (regP) {
      regP.innerHTML = "أنشئ حسابك واحصل على <b>أسبوع PRO</b> مجانًا (7 أيام كاملة)";
    }
  }

  /* ==========================================================================
     3. إلغاء شرط التحقق من البريد الإلكتروني في المدرس الذكي والبحث الذكي
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
     4. حساب فترة الأسبوع المجاني (7 أيام من إنشاء الحساب) بدقة
     ========================================================================== */
  function getTrialEndTimestamp() {
    try {
      const u = window.firebase?.auth?.().currentUser;
      const email = (u?.email || sessionStorage.getItem("gd_email") || "").toLowerCase();
      const storageKey = email ? "gd_trial_end_" + email : "";

      if (u && u.metadata && u.metadata.creationTime) {
        const createdMs = new Date(u.metadata.creationTime).getTime();
        if (!isNaN(createdMs) && createdMs > 0) {
          const endMs = createdMs + WEEK_MS;
          if (storageKey) localStorage.setItem(storageKey, String(endMs));
          return endMs;
        }
      }

      if (storageKey) {
        const saved = parseInt(localStorage.getItem(storageKey) || "0", 10);
        if (saved > 0) return saved;
      }

      return 0;
    } catch (_) {
      return 0;
    }
  }

  window.proLeft = function () {
    if (typeof window.isAdm === "function" && window.isAdm()) return 1e12;
    const now = Date.now();
    const m = typeof window.me === "function" ? window.me() : null;
    const paidUntil = (m && m.proUntil) ? Number(m.proUntil) : 0;
    const trialUntil = getTrialEndTimestamp();
    return Math.max(paidUntil, trialUntil) - now;
  };

  const _origShowPro = window.showPro;
  window.showPro = function (mode) {
    const left = window.proLeft();
    const isAdmin = typeof window.isAdm === "function" && window.isAdm();

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
     5. التشغيل والمراقبة المستمرة
     ========================================================================== */
  function initTrialPatch() {
    updateSignupText();
    patchAcademyEngines();
    enforceEngineTier();
    syncProfileTrialNote();

    if (typeof window.refreshUI === "function") {
      window.refreshUI();
    }

    if (window.firebase && firebase.apps.length) {
      firebase.auth().onAuthStateChanged(u => {
        if (u) {
          getTrialEndTimestamp();
          patchAcademyEngines();
          enforceEngineTier();
          syncProfileTrialNote();
          if (window.proLeft() > 0) document.getElementById("proM")?.remove();
          if (typeof window.refreshUI === "function") window.refreshUI();
        }
      });
    }

    setInterval(() => {
      enforceEngineTier();
      syncProfileTrialNote();
    }, 2000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTrialPatch);
  } else {
    initTrialPatch();
  }
})();
