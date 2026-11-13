/* ============================================================================
   GeoDev Interactive Onboarding Tour v1.0 (geo-onboarding-tour.js)
   جولة تعريفية تفاعلية بأسهم توجيهية وتنقل تلقائي بين أقسام المنصة للمستخدم الجديد
   ============================================================================ */

(function () {
  "use strict";
  if (window.GEOOnboardingTour) return;
  window.GEOOnboardingTour = true;

  const $ = id => document.getElementById(id);

  /* ==========================================================================
     1. خطوات الجولة التعريفية (8 خطوات متكاملة)
     ========================================================================== */
  const TOUR_STEPS = [
    {
      tab: "agent",
      targetSelector: 'nav button[data-t="agent"]',
      arrowDir: "down",
      badge: "1 / 8 • المساعد الذكي",
      title: "المساعد الذكي الشامل (GeoDev AI)",
      desc: "مساعدك الهندسي والأكاديمي المتكامل؛ يجيب بدقة في الجغرافيا والمساحة والبرمجة والعلوم. يدعم 3 محركات ذكاء اصطناعي (GEO 2.9 السريع، GEO 3.8 المتوازن، و GEO 5.2 ULTRA المرتبط بالبحث الحي في الإنترنت)، كما يقرأ ملفات PDF و Word و Excel ويحلل الصور والخرائط."
    },
    {
      tab: "studio",
      targetSelector: 'nav button[data-t="studio"]',
      arrowDir: "down",
      badge: "2 / 8 • استوديو البرمجة",
      title: "استوديو تصميم المواقع والأكواد",
      desc: "اكتب وصف أي موقع أو تطبيق خرائط تفاعلي (Web GIS) أو لوحة تحكم، وسيقوم الاستوديو بكتابة الكود الكامل مع معاينة حية فورية على الجوال والحاسوب، وإمكانية التعديل المباشر وتصدير المشروع كملف ZIP أو تطبيق PWA."
    },
    {
      tab: "survey",
      targetSelector: 'nav button[data-t="survey"]',
      arrowDir: "down",
      badge: "3 / 8 • المساحة الهندسية",
      title: "مكتب المساحة الهندسية المتكامل",
      desc: "يضم 17 أداة هندسية احترافية: الرفع المساحي على الخريطة وحساب المساحات، تحويل الإحداثيات (UTM / Red, Blue, Purple Belt)، لوحة الكروكي بالخرطوشة والفرز الشرعي وتصدير DXF، الكميات والحفر، المناسيب، المنحنيات، وتصحيح المضلع."
    },
    {
      tab: "gis",
      targetSelector: 'nav button[data-t="gis"]',
      arrowDir: "down",
      badge: "4 / 8 • الجيوماتكس",
      title: "قسم الجيوماتكس والبحث الأكاديمي",
      desc: "مخصص لمتخصصي نظم المعلومات الجغرافية والاستشعار عن بعد؛ يحتوي على أدوات لبناء خطط البحث العلمي (Proposals)، اختيار أنسب الأقمار الصناعية والمؤشرات الطيفية، وتصميم خطوات التحليل المكاني، مع إمكانية تصدير الإجابات كملف PDF منسق."
    },
    {
      tab: "py",
      targetSelector: 'nav button[data-t="py"]',
      arrowDir: "down",
      badge: "5 / 8 • مختبر الأكواد",
      title: "مختبر الأكواد الجغرافي المتقدم",
      desc: "حوّل أي فكرة بالعربية إلى كود برمجي جاهز لبيئات (ArcPy لـ ArcGIS Pro، PyQGIS، Google Earth Engine، و AutoLISP للأوتوكاد) مع شرح مرقم لكيفية تركيب الكود وتشغيله داخل البرنامج، بالإضافة لمحرر تشغيل Python و JavaScript مباشرة."
    },
    {
      tab: "academy",
      targetSelector: 'nav button[data-t="academy"]',
      arrowDir: "down",
      badge: "6 / 8 • الأكاديمية",
      title: "الأكاديمية الجغرافية والمكتبة الشاملة",
      desc: "تجمع مسارات البرامج التدريبية المعتمدة، وموسوعة دورات وكتب أ.د. جمعة داود وكبار المحاضرين، ودليل المنصات البحثية العالمية (بنك المعرفة، USGS، Copernicus) وطرق التحميل منها، بالإضافة إلى المدرس الذكي (GEO Teacher)."
    },
    {
      tab: "agent",
      targetSelector: 'header button[onclick*="toggleDrawer"]',
      arrowDir: "up",
      badge: "7 / 8 • القائمة الجانبية",
      title: "قائمة الحساب والتواصل والاشتراك (☰)",
      desc: "من خلال أيقونة الثلاث شرط في الأعلى يمكنك الوصول إلى: ملفك الشخصي وتعديل صورتك، الدردشة الجماعية لمهندسي المنصة، محادثة الإدارة المباشرة للدعم، وتفعيل كود اشتراك باقة PRO."
    },
    {
      tab: "agent",
      targetSelector: null,
      arrowDir: "none",
      badge: "8 / 8 • جاهز للانطلاق",
      title: "تم تفعيل أسبوع PRO المجاني لحسابك!",
      desc: "جميع أدوات المساحة والذكاء الاصطناعي والمحركات المتقدمة مفتوحة لك الآن مجاناً لمدة 7 أيام كاملة. نتمنى لك تجربة هندسية وبحثية مثمرة في GeoDev Studio Pro."
    }
  ];

  let stepIdx = 0;

  /* ==========================================================================
     2. حقن تنسيقات الـ CSS للبطاقة التعريفية والسهم المضيء
     ========================================================================== */
  function injectTourStyles() {
    if ($("geoTourStyles")) return;
    const st = document.createElement("style");
    st.id = "geoTourStyles";
    st.textContent = `
      #gdTourBackdrop {
        position: fixed;
        inset: 0;
        background: rgba(5, 10, 20, 0.72);
        backdrop-filter: blur(3px);
        -webkit-backdrop-filter: blur(3px);
        z-index: 9990;
        display: none;
        animation: gdTourFade 0.25s ease both;
      }
      #gdTourBackdrop.on { display: block; }

      @keyframes gdTourFade {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      /* تمييز العنصر المشار إليه بالسهم */
      .gd-tour-highlight {
        position: relative !important;
        z-index: 9995 !important;
        box-shadow: 0 0 0 3px var(--am, #f59e0b), 0 0 24px rgba(245, 158, 11, 0.65) !important;
        border-radius: 12px !important;
        background-color: var(--cd, #0f172a) !important;
        color: var(--am, #f59e0b) !important;
        transition: all 0.25s ease !important;
      }

      /* البطاقة التعريفية العائمة */
      #gdTourCard {
        position: fixed;
        z-index: 9998;
        width: min(370px, calc(100vw - 24px));
        background: var(--cd, #0f172a);
        border: 1.5px solid var(--bl, #3b82f6);
        border-radius: 20px;
        padding: 18px 18px 16px;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.65);
        color: var(--tx, #f1f5f9);
        direction: rtl;
        text-align: right;
        transition: top 0.28s cubic-bezier(0.22, 1, 0.36, 1), left 0.28s cubic-bezier(0.22, 1, 0.36, 1), transform 0.28s ease;
      }

      .gd-tour-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
        margin-bottom: 10px;
      }

      .gd-tour-badge {
        background: color-mix(in srgb, var(--bl, #3b82f6) 18%, transparent);
        color: var(--bl, #3b82f6);
        border: 1px solid color-mix(in srgb, var(--bl, #3b82f6) 35%, transparent);
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 11px;
        font-weight: 800;
      }

      .gd-tour-skip {
        background: transparent !important;
        color: var(--mt, #94a3b8) !important;
        padding: 4px 8px !important;
        font-size: 12px !important;
        min-height: 28px !important;
        box-shadow: none !important;
      }

      #gdTourCard h3 {
        margin: 0 0 8px;
        font-size: 16.5px;
        font-weight: 900;
        color: var(--tx, #f1f5f9);
        line-height: 1.5;
      }

      #gdTourCard p {
        margin: 0 0 16px;
        font-size: 13.5px;
        line-height: 1.85;
        color: var(--mt, #cbd5e1);
      }

      .gd-tour-actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .gd-tour-dots {
        display: flex;
        gap: 4px;
        flex: 1;
      }

      .gd-tour-dots i {
        display: block;
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: var(--ln, #334155);
        transition: all 0.2s ease;
      }

      .gd-tour-dots i.on {
        width: 18px;
        border-radius: 6px;
        background: var(--bl, #3b82f6);
      }

      /* السهم المتحرك الذي يشير للأيقونة */
      #gdTourArrow {
        position: fixed;
        z-index: 9999;
        pointer-events: none;
        color: var(--am, #f59e0b);
        filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.6));
        display: none;
      }

      #gdTourArrow.down {
        display: block;
        animation: gdBounceDown 0.9s ease-in-out infinite;
      }

      #gdTourArrow.up {
        display: block;
        animation: gdBounceUp 0.9s ease-in-out infinite;
      }

      @keyframes gdBounceDown {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(8px); }
      }

      @keyframes gdBounceUp {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-8px); }
      }
    `;
    document.head.appendChild(st);
  }

  /* ==========================================================================
     3. بناء عناصر الجولة في الـ DOM وتحديد مواقع البطاقة والسهم بدقة
     ========================================================================== */
  function ensureTourDOM() {
    if ($("gdTourBackdrop")) return;

    document.body.insertAdjacentHTML("beforeend", `
      <div id="gdTourBackdrop"></div>
      <div id="gdTourArrow" aria-hidden="true"></div>
      <div id="gdTourCard" style="display:none" role="dialog" aria-modal="true">
        <div class="gd-tour-top">
          <span class="gd-tour-badge" id="gdTourBadge"></span>
          <button type="button" class="gd-tour-skip" onclick="window.GEOEndTour()">تخطي الجولة ✕</button>
        </div>
        <h3 id="gdTourTitle"></h3>
        <p id="gdTourDesc"></p>
        <div class="gd-tour-actions">
          <div class="gd-tour-dots" id="gdTourDots"></div>
          <button type="button" class="k" id="gdTourPrev" onclick="window.GEOTourStep(-1)">السابق</button>
          <button type="button" class="g" id="gdTourNext" onclick="window.GEOTourStep(1)">التالي</button>
        </div>
      </div>
    `);
  }

  function clearHighlight() {
    document.querySelectorAll(".gd-tour-highlight").forEach(el => {
      el.classList.remove("gd-tour-highlight");
    });
  }

  function positionCardAndArrow(step) {
    const card = $("gdTourCard");
    const arrow = $("gdTourArrow");
    if (!card || !arrow) return;

    clearHighlight();
    arrow.className = "";
    arrow.style.display = "none";

    const target = step.targetSelector ? document.querySelector(step.targetSelector) : null;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cardRect = card.getBoundingClientRect();
    const cw = cardRect.width || Math.min(370, vw - 24);
    const ch = cardRect.height || 230;

    if (!target || step.arrowDir === "none") {
      // توسيط البطاقة في منتصف الشاشة في الخطوة الختامية
      card.style.left = Math.max(12, (vw - cw) / 2) + "px";
      card.style.top = Math.max(20, (vh - ch) / 2) + "px";
      return;
    }

    target.classList.add("gd-tour-highlight");
    const tr = target.getBoundingClientRect();
    const targetCenterX = tr.left + tr.width / 2;

    if (step.arrowDir === "down") {
      // السهم يشير لأسفل نحو شريط التنقل السفلي (أو الجانبي على الديسكتوب)
      if (vw >= 1024 && tr.top < vh - 120) {
        // على شاشة الكمبيوتر القائمة على اليمين
        arrow.innerHTML = `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`;
        arrow.className = "down";
        arrow.style.left = Math.max(12, tr.left - 44) + "px";
        arrow.style.top = (tr.top + tr.height / 2 - 18) + "px";

        card.style.left = Math.max(16, tr.left - cw - 54) + "px";
        card.style.top = Math.max(80, Math.min(vh - ch - 20, tr.top - 40)) + "px";
      } else {
        // على الموبايل القائمة في الأسفل: السهم ينزل من البطاقة نحو الزر
        arrow.innerHTML = `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="4" x2="12" y2="20"></line><polyline points="6 14 12 20 18 14"></polyline></svg>`;
        arrow.className = "down";
        const arrowX = Math.max(16, Math.min(vw - 48, targetCenterX - 18));
        const arrowY = Math.max(60, tr.top - 44);
        arrow.style.left = arrowX + "px";
        arrow.style.top = arrowY + "px";

        const cardLeft = Math.max(12, Math.min(vw - cw - 12, targetCenterX - cw / 2));
        const cardTop = Math.max(68, arrowY - ch - 12);
        card.style.left = cardLeft + "px";
        card.style.top = cardTop + "px";
      }
    } else if (step.arrowDir === "up") {
      // السهم يصعد للأعلى نحو زر الثلاث شرط ☰ في الهيدر
      arrow.innerHTML = `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="20" x2="12" y2="4"></line><polyline points="6 10 12 4 18 10"></polyline></svg>`;
      arrow.className = "up";
      const arrowX = Math.max(16, Math.min(vw - 48, targetCenterX - 18));
      const arrowY = tr.bottom + 8;
      arrow.style.left = arrowX + "px";
      arrow.style.top = arrowY + "px";

      const cardLeft = Math.max(12, Math.min(vw - cw - 12, targetCenterX - cw / 2));
      const cardTop = Math.min(vh - ch - 20, arrowY + 44);
      card.style.left = cardLeft + "px";
      card.style.top = cardTop + "px";
    }
  }

  function renderTourStep() {
    const step = TOUR_STEPS[stepIdx];
    if (!step) return window.GEOEndTour();

    // فتح القسم المرتبط بالخطوة تلقائياً ليرى المستخدم الصفحة تتغير أمامه
    if (step.tab && typeof window.go === "function") {
      window.go(step.tab);
    }

    $("gdTourBackdrop").classList.add("on");
    const card = $("gdTourCard");
    card.style.display = "block";

    $("gdTourBadge").textContent = step.badge;
    $("gdTourTitle").textContent = step.title;
    $("gdTourDesc").textContent = step.desc;

    $("gdTourDots").innerHTML = TOUR_STEPS.map((_, i) =>
      `<i class="${i === stepIdx ? "on" : ""}"></i>`
    ).join("");

    const prevBtn = $("gdTourPrev");
    const nextBtn = $("gdTourNext");
    if (prevBtn) prevBtn.style.display = stepIdx === 0 ? "none" : "inline-flex";
    if (nextBtn) {
      nextBtn.textContent = stepIdx === TOUR_STEPS.length - 1 ? "ابدأ الاستخدام الآن" : "التالي";
    }

    // حساب مكان البطاقة والسهم بعد تحديث النصوص
    requestAnimationFrame(() => positionCardAndArrow(step));
  }

  /* ==========================================================================
     4. دوال التحكم العامة (بدء الجولة، التنقل، الإنهاء)
     ========================================================================== */
  window.GEOStartTour = function () {
    injectTourStyles();
    ensureTourDOM();
    stepIdx = 0;
    renderTourStep();
  };

  window.GEOTourStep = function (delta) {
    const next = stepIdx + delta;
    if (next < 0) return;
    if (next >= TOUR_STEPS.length) {
      return window.GEOEndTour();
    }
    stepIdx = next;
    renderTourStep();
  };

  window.GEOEndTour = function () {
    clearHighlight();
    const bd = $("gdTourBackdrop");
    const card = $("gdTourCard");
    const arrow = $("gdTourArrow");
    if (bd) bd.classList.remove("on");
    if (card) card.style.display = "none";
    if (arrow) { arrow.className = ""; arrow.style.display = "none"; }

    // العودة لقسم المساعد الرئيسي بعد انتهاء الجولة
    if (typeof window.go === "function") window.go("agent");

    // حفظ علامة إتمام الجولة لهذا الحساب حتى لا تظهر تلقائياً في كل دخول
    const email = (sessionStorage.getItem("gd_email") || "guest").toLowerCase();
    localStorage.setItem("gd_tour_done_" + email, "1");
  };

  /* ==========================================================================
     5. التشغيل التلقائي للمستخدم الجديد + إضافة زر في القائمة الجانبية (☰)
     ========================================================================== */
  function addTourButtonToDrawer() {
    const dm = document.querySelector("#drw .dm");
    if (dm && !$("gdDrawerTourBtn")) {
      dm.insertAdjacentHTML("afterbegin", `
        <button id="gdDrawerTourBtn" onclick="toggleDrawer();window.GEOStartTour()">
          جولة تعريفية بالمنصة
        </button>
      `);
    }
  }

  function checkNewUserTour() {
    if (sessionStorage.getItem("gd_auth") !== "1") return;
    const email = (sessionStorage.getItem("gd_email") || "").toLowerCase();
    if (!email) return;

    const doneKey = "gd_tour_done_" + email;
    if (localStorage.getItem(doneKey) === "1") return;

    // تشغيل الجولة تلقائياً بعد استقرار الشاشة الرئيسية بـ 900ms
    setTimeout(() => {
      if (sessionStorage.getItem("gd_auth") === "1" && localStorage.getItem(doneKey) !== "1") {
        window.GEOStartTour();
      }
    }, 900);
  }

  function initTour() {
    injectTourStyles();
    ensureTourDOM();
    addTourButtonToDrawer();

    window.addEventListener("resize", () => {
      const card = $("gdTourCard");
      if (card && card.style.display === "block") {
        positionCardAndArrow(TOUR_STEPS[stepIdx]);
      }
    });

    if (window.firebase && firebase.apps.length) {
      firebase.auth().onAuthStateChanged(u => {
        if (u) {
          addTourButtonToDrawer();
          checkNewUserTour();
        }
      });
    } else {
      checkNewUserTour();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTour);
  } else {
    initTour();
  }
})();
