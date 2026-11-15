/* ============================================================================
   تفعيل الثيم الفاتح كوضع أساسي + إصلاح تباين ألوان النصوص في المختبر والأقسام
   ============================================================================ */
(function () {
  "use strict";
  if (window.GEOLightThemeDefaultInit) return;
  window.GEOLightThemeDefaultInit = true;

  // 1. فرض الثيم الفاتح كوضع أساسي إذا لم يختر المستخدم الوضع الداكن يدوياً
  function applyDefaultLightTheme() {
    const savedTheme = localStorage.getItem("theme") || localStorage.getItem("gd_theme");
    if (!savedTheme) {
      localStorage.setItem("theme", "light");
      localStorage.setItem("gd_theme", "light");
      document.documentElement.setAttribute("data-theme", "light");
      document.body.classList.remove("dark", "dark-mode", "dark-theme");
      document.body.classList.add("light", "light-mode", "light-theme");

      // الضغط تلقائياً على زر تبديل الثيم في القائمة الجانبية إن كان الموقع يبدأ داكناً
      setTimeout(() => {
        const isDarkBg = getComputedStyle(document.body).backgroundColor === "rgb(17, 21, 28)" ||
                         getComputedStyle(document.body).backgroundColor === "rgb(13, 17, 23)";
        if (isDarkBg) {
          const themeBtn = Array.from(document.querySelectorAll("button, a, div")).find(
            el => (el.textContent || "").includes("الوضع الفاتح") || (el.textContent || "").includes("Light")
          );
          if (themeBtn) themeBtn.click();
        }
      }, 300);
    }
  }

  // 2. حقن تنسيقات تضمن وضوح جميع النصوص والبطاقات في الثيم الفاتح والداكن
  function injectContrastFixes() {
    if (document.getElementById("gdLightContrastFixStyles")) return;
    const style = document.createElement("style");
    style.id = "gdLightContrastFixStyles";
    style.textContent = `
      /* إصلاح ألوان بطاقة خطوات التجهيز داخل المختبر في الثيم الفاتح */
      [data-is-prep-card="1"],
      div[style*="rgba(224, 159, 36, 0.08)"] {
        background: #fffbeb !important;
        border: 1.5px solid #f59e0b !important;
        border-right: 5px solid #d97706 !important;
        color: #1e293b !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06) !important;
      }

      [data-is-prep-card="1"] span,
      [data-is-prep-card="1"] b,
      div[style*="rgba(224, 159, 36, 0.08)"] span,
      div[style*="rgba(224, 159, 36, 0.08)"] b {
        color: #1e293b !important;
      }

      /* الإبقاء على رقم الخطوة باللون الأبيض الواضح داخل الدائرة الذهبية */
      [data-is-prep-card="1"] span[style*="border-radius:50%"],
      div[style*="rgba(224, 159, 36, 0.08)"] span[style*="border-radius:50%"] {
        background: #d97706 !important;
        color: #ffffff !important;
      }

      /* تنسيق وسوم الكود الصغيرة <code> داخل بطاقة الخطوات */
      [data-is-prep-card="1"] code,
      div[style*="rgba(224, 159, 36, 0.08)"] code {
        background: #fef3c7 !important;
        color: #92400e !important;
        padding: 2px 6px !important;
        border-radius: 5px !important;
        font-weight: 700 !important;
        border: 1px solid #fde68a !important;
      }

      /* إصلاح عنوان ووصف قسم "شغل وأجهزة" ليكون واضحاً في الثيم الفاتح */
      #gdWorkDevicesView .gd-wd-title {
        color: #b45309 !important;
      }
      #gdWorkDevicesView .gd-wd-desc,
      #gdWorkDevicesView .gd-wd-desc strong {
        color: #334155 !important;
      }

      /* إذا قام المستخدم بالتبديل للوضع الداكن يدوياً */
      body.dark-mode [data-is-prep-card="1"],
      body.dark [data-is-prep-card="1"],
      [data-theme="dark"] [data-is-prep-card="1"] {
        background: rgba(224, 159, 36, 0.1) !important;
        color: #f3f6fa !important;
      }
      body.dark-mode [data-is-prep-card="1"] span,
      body.dark [data-is-prep-card="1"] span,
      [data-theme="dark"] [data-is-prep-card="1"] span {
        color: #f3f6fa !important;
      }
      body.dark-mode #gdWorkDevicesView .gd-wd-desc,
      body.dark #gdWorkDevicesView .gd-wd-desc,
      [data-theme="dark"] #gdWorkDevicesView .gd-wd-desc {
        color: #cbd5e1 !important;
      }
    `;
    document.head.appendChild(style);
  }

  applyDefaultLightTheme();
  injectContrastFixes();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      applyDefaultLightTheme();
      injectContrastFixes();
    });
  }
})();
