/* ============================================================================
   GeoDev Real PDF Exporter v1.0 (geo-pdf-export.js)
   تصدير إجابات قسم الجيوماتكس (#s-gis) مباشرة كملف .pdf حقيقي ومنسق بالعربية
   دون استخدام window.print() أو تغيير ألوان المنصة
   ============================================================================ */

(function () {
  "use strict";
  if (window.GEOPdfExport) return;
  window.GEOPdfExport = true;

  const $ = id => document.getElementById(id);

  async function downloadDirectPDF(sourceEl, filenamePrefix = "GeoDev-Geomatics") {
    if (!sourceEl) {
      return window.toast && window.toast("لا توجد إجابة لتصديرها حالياً", "warn");
    }

    if (typeof window.html2pdf !== "function") {
      return window.toast && window.toast("جاري تحميل مكتبة PDF، حاول مرة أخرى بعد ثوانٍ", "info");
    }

    window.toast && window.toast("جاري تجهيز وتنزيل ملف PDF...", "info");

    // إنشاء حاوية نظيفة معزولة للتصدير فقط دون لمس ألوان الموقع
    const wrapper = document.createElement("div");
    wrapper.style.cssText = `
      position: fixed;
      left: -9999px;
      top: 0;
      width: 760px;
      background: #ffffff;
      color: #0f172a;
      direction: rtl;
      text-align: right;
      font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif;
      padding: 28px 32px;
      line-height: 1.85;
      font-size: 14px;
    `;

    const dateStr = new Date().toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });

    // استنساخ محتوى الإجابة وتنظيفه من الأزرار الجانبية
    const clone = sourceEl.cloneNode(true);
    clone.querySelectorAll("button, .msg-tools, .copy-btn, svg").forEach(el => el.remove());

    wrapper.innerHTML = `
      <div style="border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <strong style="font-size: 18px; color: #0f172a; display: block;">GeoDev Studio Pro — التقرير الجغرافي والجيوماتكس</strong>
          <span style="font-size: 12px; color: #475569;">إعداد: م. أحمد سمير | منصة الجيوماتكس والمساحة</span>
        </div>
        <div style="font-size: 12px; color: #475569;">${dateStr}</div>
      </div>
      <div style="color: #1e293b; font-size: 14px; line-height: 1.9;">
        ${clone.innerHTML}
      </div>
      <div style="border-top: 1px solid #cbd5e1; margin-top: 24px; padding-top: 10px; font-size: 11px; color: #64748b; text-align: center;">
        تم التوليد والتصدير بواسطة منصة GeoDev Studio Pro
      </div>
    `;

    // تنسيق الجداول والأكواد داخل الـ PDF فقط
    wrapper.querySelectorAll("table").forEach(tbl => {
      tbl.style.cssText = "width:100%;border-collapse:collapse;margin:12px 0;font-size:12.5px;";
    });
    wrapper.querySelectorAll("th, td").forEach(cell => {
      cell.style.cssText = "border:1px solid #cbd5e1;padding:6px 8px;text-align:right;color:#0f172a;";
    });
    wrapper.querySelectorAll("pre, code").forEach(code => {
      code.style.cssText = "background:#f1f5f9;color:#0f172a;padding:6px;border-radius:6px;direction:ltr;text-align:left;font-size:12px;";
    });

    document.body.appendChild(wrapper);

    const opt = {
      margin: [10, 10, 10, 10],
      filename: `${filenamePrefix}-${Date.now()}.pdf`,
      image: { type: "jpeg", quality: 0.96 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
    };

    try {
      await window.html2pdf().set(opt).from(wrapper).save();
      window.toast && window.toast("تم تنزيل ملف PDF بنجاح!", "success");
    } catch (err) {
      window.toast && window.toast("حدث خطأ أثناء إنشاء PDF: " + err.message, "error");
    } finally {
      wrapper.remove();
    }
  }

  // اعتراض أي زر لتنزيل PDF داخل قسم الجيوماتكس لمنع window.print()
  document.addEventListener("click", e => {
    const btn = e.target.closest && e.target.closest("button");
    if (!btn) return;

    const inGisSection = btn.closest("#s-gis");
    const txt = (btn.textContent || "").toLowerCase();
    const isPdfBtn = inGisSection && (txt.includes("pdf") || btn.id?.toLowerCase().includes("pdf"));

    if (isPdfBtn) {
      e.preventDefault();
      e.stopImmediatePropagation();

      // البحث عن آخر إجابة للذكاء الاصطناعي في قسم الجيوماتكس
      const chatBox = $("gisChatBox");
      const messages = chatBox ? chatBox.querySelectorAll(".m.a, .gis-msg.assistant, .ai-msg") : [];
      const targetEl = messages.length ? messages[messages.length - 1] : chatBox;

      downloadDirectPDF(targetEl, "GeoDev-GIS-Report");
    }
  }, true);

  // إتاحة الدالة عالمياً لأي زر مخصص
  window.exportGisAnswerPDF = function (el) {
    const chatBox = $("gisChatBox");
    const messages = chatBox ? chatBox.querySelectorAll(".m.a, .gis-msg.assistant") : [];
    const targetEl = el || (messages.length ? messages[messages.length - 1] : chatBox);
    downloadDirectPDF(targetEl, "GeoDev-GIS-Report");
  };
})();
