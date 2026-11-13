/* ============================================================================
   GeoDev Glassy Password Orbit & Verification Animation v1.0 (geo-login-fx.js)
   تأثير بصري احترافي مستوحى من Glassy Verification:
   1. مربعات زجاجية تتفاعل مع كل حرف يكتبه المستخدم في كلمة المرور.
   2. دوران المربعات في مسار دائري (Orbit) عند الضغط على "دخول".
   3. دمج المربعات مع موجة خضراء (Pulse) وعلامة صح عند نجاح التحقق.
   ============================================================================ */

(function () {
  "use strict";
  if (window.GEOLoginFX) return;
  window.GEOLoginFX = true;

  const $ = id => document.getElementById(id);

  /* ==========================================================================
     1. حقن تنسيقات الـ CSS للأنيميشن الزجاجي والدوران والنبضة الخضراء
     ========================================================================== */
  function injectLoginFXStyles() {
    if ($("geoLoginFXStyles")) return;
    const st = document.createElement("style");
    st.id = "geoLoginFXStyles";
    st.textContent = `
      /* حاوية المربعات الزجاجية لكلمة المرور */
      .gd-pw-boxes {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 8px;
        margin: 10px 0 4px;
        min-height: 44px;
        direction: ltr;
        position: relative;
      }

      .gd-pw-box {
        width: 36px;
        height: 40px;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid var(--ln, #334155);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--tx, #f1f5f9);
        font-family: 'Fira Code', monospace;
        font-size: 16px;
        font-weight: 800;
        transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
      }

      .gd-pw-box.filled {
        border-color: var(--am, #f59e0b);
        background: color-mix(in srgb, var(--am, #f59e0b) 12%, transparent);
        box-shadow: 0 0 12px color-mix(in srgb, var(--am, #f59e0b) 25%, transparent);
        transform: translateY(-2px) scale(1.04);
      }

      .gd-pw-box.active {
        border-color: var(--bl, #3b82f6);
        box-shadow: 0 0 0 2px color-mix(in srgb, var(--bl, #3b82f6) 25%, transparent);
      }

      /* طبقة العرض التفاعلي أثناء التحقق (Orbit -> Merge -> Verified) */
      #gdVerifyOverlay {
        position: absolute;
        inset: 0;
        border-radius: 20px;
        background: color-mix(in srgb, var(--cd, #0f172a) 94%, transparent);
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
        z-index: 25;
        display: none;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 20px;
        text-align: center;
        overflow: hidden;
      }

      #gdVerifyOverlay.on {
        display: flex;
        animation: gdFadeIn 0.25s ease both;
      }

      @keyframes gdFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      .gd-orbit-stage {
        position: relative;
        width: 150px;
        height: 150px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 14px;
      }

      /* المربعات الأربعة التي تدور في مدار دائري */
      .gd-orb-item {
        position: absolute;
        width: 38px;
        height: 38px;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.07);
        border: 1.5px solid var(--am, #f59e0b);
        box-shadow: 0 0 15px color-mix(in srgb, var(--am, #f59e0b) 35%, transparent);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-weight: 900;
        font-size: 15px;
        transition: all 0.45s cubic-bezier(0.22, 1, 0.36, 1);
      }

      /* حالة الدوران (Verifying Orbit) */
      .gd-orbit-stage.spinning .gd-orb-ring {
        position: absolute;
        inset: 0;
        animation: gdOrbitSpin 1.15s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
      }

      @keyframes gdOrbitSpin {
        0% { transform: rotate(0deg) scale(1); }
        50% { transform: rotate(180deg) scale(0.92); }
        100% { transform: rotate(360deg) scale(1); }
      }

      .gd-orb-item.p0 { top: 8px; left: 56px; }
      .gd-orb-item.p1 { top: 56px; right: 8px; }
      .gd-orb-item.p2 { bottom: 8px; left: 56px; }
      .gd-orb-item.p3 { top: 56px; left: 8px; }

      /* حالة الاندماج في المركز عند النجاح */
      .gd-orbit-stage.success .gd-orb-item {
        top: 56px !important;
        left: 56px !important;
        right: auto !important;
        bottom: auto !important;
        opacity: 0;
        transform: scale(0.3);
      }

      /* دائرة النجاح الخضراء والموجة الضوئية (Radar Pulse) */
      .gd-success-core {
        position: relative;
        width: 64px;
        height: 64px;
        border-radius: 18px;
        background: linear-gradient(135deg, #10b981, #059669);
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transform: scale(0.4);
        transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        box-shadow: 0 0 28px rgba(16, 185, 129, 0.55);
        z-index: 2;
      }

      .gd-orbit-stage.success .gd-success-core {
        opacity: 1;
        transform: scale(1);
      }

      .gd-pulse-wave {
        position: absolute;
        width: 64px;
        height: 64px;
        border-radius: 50%;
        border: 2px solid #10b981;
        opacity: 0;
        pointer-events: none;
      }

      .gd-orbit-stage.success .gd-pulse-wave {
        animation: gdRadarWave 1.2s ease-out forwards;
      }

      .gd-orbit-stage.success .gd-pulse-wave.w2 {
        animation-delay: 0.25s;
      }

      @keyframes gdRadarWave {
        0% { transform: scale(0.9); opacity: 0.9; }
        100% { transform: scale(2.4); opacity: 0; }
      }

      .gd-verify-title {
        font-size: 18px;
        font-weight: 900;
        color: var(--tx, #fff);
        margin: 0 0 4px;
        transition: color 0.3s ease;
      }

      .gd-verify-title.ok {
        color: #10b981;
      }

      .gd-verify-sub {
        font-size: 12.5px;
        color: var(--mt, #94a3b8);
        margin: 0 0 16px;
      }

      .gd-verify-pill {
        padding: 9px 22px;
        border-radius: 12px;
        font-size: 13px;
        font-weight: 800;
        background: color-mix(in srgb, var(--am, #f59e0b) 20%, transparent);
        color: var(--am, #f59e0b);
        border: 1px solid color-mix(in srgb, var(--am, #f59e0b) 40%, transparent);
        transition: all 0.3s ease;
      }

      .gd-verify-pill.ok {
        background: #10b981;
        color: #fff;
        border-color: #10b981;
        box-shadow: 0 6px 20px rgba(16, 185, 129, 0.35);
      }
    `;
    document.head.appendChild(st);
  }

  /* ==========================================================================
     2. بناء المربعات الزجاجية التفاعلية أسفل حقل كلمة المرور
     ========================================================================== */
  function setupPasswordBoxes() {
    const pwInput = $("pw");
    const card = document.querySelector("#gate .au-card");
    if (!pwInput || !card || $("gdPwBoxes")) return;

    // إضافة شريط الـ 6 مربعات زجاجية تحت حقل كلمة المرور
    const fld = pwInput.closest(".fld");
    if (fld) {
      const boxWrap = document.createElement("div");
      boxWrap.id = "gdPwBoxes";
      boxWrap.className = "gd-pw-boxes";
      boxWrap.setAttribute("aria-hidden", "true");
      boxWrap.innerHTML = Array.from({ length: 6 }, (_, i) =>
        `<div class="gd-pw-box" data-idx="${i}"></div>`
      ).join("");
      fld.appendChild(boxWrap);
    }

    // إضافة طبقة الأنيميشن (Orbit & Verified) داخل بطاقة تسجيل الدخول
    card.style.position = "relative";
    const overlay = document.createElement("div");
    overlay.id = "gdVerifyOverlay";
    overlay.innerHTML = `
      <div class="gd-orbit-stage spinning" id="gdOrbitStage">
        <div class="gd-orb-ring">
          <div class="gd-orb-item p0">•</div>
          <div class="gd-orb-item p1">•</div>
          <div class="gd-orb-item p2">•</div>
          <div class="gd-orb-item p3">•</div>
        </div>
        <div class="gd-pulse-wave"></div>
        <div class="gd-pulse-wave w2"></div>
        <div class="gd-success-core">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
      </div>
      <h4 class="gd-verify-title" id="gdVerifyTitle">جاري التحقق من كلمة المرور...</h4>
      <p class="gd-verify-sub" id="gdVerifySub">تأمين الجلسة والاتصال بحسابك</p>
      <div class="gd-verify-pill" id="gdVerifyPill">Verifying Credentials...</div>
    `;
    card.appendChild(overlay);

    // تحديث المربعات الزجاجية مع كل حرف يكتبه المستخدم
    const syncBoxes = () => {
      const len = pwInput.value.length;
      const isFocused = document.activeElement === pwInput;
      const boxes = document.querySelectorAll("#gdPwBoxes .gd-pw-box");
      boxes.forEach((b, i) => {
        const filled = i < len;
        b.classList.toggle("filled", filled);
        b.classList.toggle("active", isFocused && i === Math.min(len, 5));
        b.textContent = filled ? "•" : "";
      });
    };

    pwInput.addEventListener("input", syncBoxes);
    pwInput.addEventListener("focus", syncBoxes);
    pwInput.addEventListener("blur", syncBoxes);
  }

  /* ==========================================================================
     3. تشغيل تسلسل الأنيميشن عند الضغط على تسجيل الدخول
     ========================================================================== */
  function startVerifyAnimation() {
    const ov = $("gdVerifyOverlay");
    const stage = $("gdOrbitStage");
    const title = $("gdVerifyTitle");
    const sub = $("gdVerifySub");
    const pill = $("gdVerifyPill");
    if (!ov || !stage) return;

    // إعادة ضبط الحالة لوضع الدوران
    stage.classList.remove("success");
    stage.classList.add("spinning");
    title.classList.remove("ok");
    title.textContent = "جاري التحقق من البيانات...";
    sub.textContent = "يتم الآن فحص كلمة المرور وتأمين الدخول";
    pill.classList.remove("ok");
    pill.textContent = "Verifying Password...";
    ov.classList.add("on");
  }

  function completeVerifyAnimation() {
    const stage = $("gdOrbitStage");
    const title = $("gdVerifyTitle");
    const sub = $("gdVerifySub");
    const pill = $("gdVerifyPill");
    if (!stage) return;

    // التحول لوضع الاندماج والدرع الأخضر والموجة الضوئية
    stage.classList.remove("spinning");
    stage.classList.add("success");
    title.classList.add("ok");
    title.textContent = "تم التحقق بنجاح!";
    sub.textContent = "تم تأكيد هويتك — جاري فتح المنصة...";
    pill.classList.add("ok");
    pill.textContent = "✓ Verified & Secured";
  }

  function cancelVerifyAnimation() {
    const ov = $("gdVerifyOverlay");
    if (ov) ov.classList.remove("on");
  }

  // ربط الأنيميشن بدالة login في geo-cf.js
  function hookLoginFunction() {
    const _origLogin = window.login;
    if (typeof _origLogin !== "function" || _origLogin.__fxHooked) return;

    const wrappedLogin = async function () {
      const email = $("em")?.value.trim();
      const pw = $("pw")?.value;
      if (!email || !pw) {
        return _origLogin.apply(this, arguments);
      }

      startVerifyAnimation();

      // إبقاء حركة الدوران ظاهرة لمدة 900ms على الأقل ليشعر المستخدم بالانسيابية
      const minSpinDelay = new Promise(r => setTimeout(r, 900));

      try {
        await Promise.all([_origLogin.apply(this, arguments), minSpinDelay]);

        // إذا نجح الدخول (لم يظهر مربع الخطأ #er) نعرض حركة النجاح الخضراء
        const erBox = $("er");
        const hasError = erBox && erBox.style.display === "block" && erBox.textContent.trim().length > 0;
        if (!hasError && window.firebase?.auth?.().currentUser) {
          completeVerifyAnimation();
          await new Promise(r => setTimeout(r, 850));
          cancelVerifyAnimation();
        } else {
          cancelVerifyAnimation();
        }
      } catch (err) {
        cancelVerifyAnimation();
        throw err;
      }
    };

    wrappedLogin.__fxHooked = true;
    window.login = wrappedLogin;
  }

  function init() {
    injectLoginFXStyles();
    setupPasswordBoxes();
    hookLoginFunction();

    // إعادة الربط بعد تحميل geo-ui.js و geo-cf.js
    setTimeout(() => {
      setupPasswordBoxes();
      hookLoginFunction();
    }, 350);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
