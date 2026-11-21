/* ============================================================================
   GeoDev CAD & GIS Code Studio (V1)
   - مكتبة قوالب AutoLISP جاهزة للمكتب الفني المساحي
   - تصدير وتحميل أي كود مولّد بصيغة (.lsp) للأوتوكاد أو (.py) لـ ArcGIS/QGIS مباشرة
   ============================================================================ */
(function () {
  "use strict";
  if (window.GEOCodeStudioV1Init) return;
  window.GEOCodeStudioV1Init = true;

  const readyLispTemplates = [
    {
      id: "lisp_export_xyz",
      title: "استخراج إحداثيات النقاط (E, N, Z) إلى ملف CSV",
      command: "EXPXYZ",
      desc: "يستخرج إحداثيات جميع النقاط (Point) المحددة في اللوحة ويحفظها في ملف CSV يفتح على Excel مباشرة.",
      code: `(defun c:EXPXYZ (/ ss i ent pt fname f)
  (setq ss (ssget '((0 . "POINT"))))
  (if ss
    (progn
      (setq fname (getfiled "حفظ ملف الإحداثيات" "Coordinates" "csv" 1))
      (if fname
        (progn
          (setq f (open fname "w"))
          (write-line "Point_ID,Easting_X,Northing_Y,Elevation_Z" f)
          (setq i 0)
          (repeat (sslength ss)
            (setq ent (entget (ssname ss i)))
            (setq pt (cdr (assoc 10 ent)))
            (write-line
              (strcat (itoa (1+ i)) "," (rtos (car pt) 2 4) "," (rtos (cadr pt) 2 4) "," (rtos (caddr pt) 2 3))
              f
            )
            (setq i (1+ i))
          )
          (close f)
          (princ (strcat "\\n[GeoDev] تم تصدير " (itoa i) " نقطة بنجاح إلى: " fname))
        )
      )
    )
    (princ "\\n[GeoDev] لم يتم تحديد أي نقاط (Point).")
  )
  (princ)
)`
    },
    {
      id: "lisp_auto_area",
      title: "حساب وكتابة مساحة الأشكال المغلقة (m²)",
      command: "GDAREA",
      desc: "يحسب مساحة أي Polyline مغلق ويكتب المساحة بالمتر المربع في منتصف الشكل تلقائياً.",
      code: `(defun c:GDAREA (/ ss i ent obj areaVal minPt maxPt insPt txtHeight)
  (vl-load-com)
  (setq ss (ssget '((0 . "LWPOLYLINE"))))
  (if ss
    (progn
      (setq txtHeight (getreal "\\nأدخل ارتفاع النص [افتراضي 1.5]: "))
      (if (null txtHeight) (setq txtHeight 1.5))
      (setq i 0)
      (repeat (sslength ss)
        (setq obj (vlax-ename->vla-object (ssname ss i)))
        (setq areaVal (vla-get-Area obj))
        (vla-GetBoundingBox obj 'minPt 'maxPt)
        (setq minPt (vlax-safearray->list minPt))
        (setq maxPt (vlax-safearray->list maxPt))
        (setq insPt (list (/ (+ (car minPt) (car maxPt)) 2.0) (/ (+ (cadr minPt) (cadr maxPt)) 2.0) 0.0))
        (entmake (list
          '(0 . "TEXT")
          (cons 10 insPt)
          (cons 40 txtHeight)
          (cons 1 (strcat "Area = " (rtos areaVal 2 2) " m2"))
        ))
        (setq i (1+ i))
      )
      (princ (strcat "\\n[GeoDev] تم حساب وكتابة مساحة " (itoa i) " شكل."))
    )
    (princ "\\n[GeoDev] اختر أشكال Polyline مغلقة أولاً.")
  )
  (princ)
)`
    },
    {
      id: "lisp_auto_num",
      title: "الترقيم التسلسلي التلقائي للنقاط والمحطات",
      command: "GDNUM",
      desc: "يضع أرقاماً متسلسلة (1, 2, 3...) في أي نقطة تضغط عليها بالماوس داخل اللوحة.",
      code: `(defun c:GDNUM (/ startNum stepNum txtH pt)
  (setq startNum (getint "\\nأدخل رقم البداية [1]: "))
  (if (null startNum) (setq startNum 1))
  (setq txtH (getreal "\\nأدخل ارتفاع الرقم [1.5]: "))
  (if (null txtH) (setq txtH 1.5))
  (while (setq pt (getpoint (strcat "\\nحدد موقع النقطة رقم (" (itoa startNum) "): ")))
    (entmake (list
      '(0 . "TEXT")
      (cons 10 pt)
      (cons 40 txtH)
      (cons 1 (itoa startNum))
    ))
    (setq startNum (1+ startNum))
  )
  (princ "\\n[GeoDev] تم إنهاء الترقيم.")
  (princ)
)`
    },
    {
      id: "lisp_total_len",
      title: "حساب إجمالي أطوال الخطوط والبولي لاين",
      command: "GDLEN",
      desc: "يجمع أطوال جميع الخطوط (Line / Polyline / Arc) المحددة دفعة واحدة ويعرض المجموع.",
      code: `(defun c:GDLEN (/ ss i obj totalLen)
  (vl-load-com)
  (setq ss (ssget '((0 . "LINE,LWPOLYLINE,ARC,CIRCLE"))))
  (if ss
    (progn
      (setq totalLen 0.0 i 0)
      (repeat (sslength ss)
        (setq obj (vlax-ename->vla-object (ssname ss i)))
        (setq totalLen (+ totalLen (vlax-curve-getDistAtParam obj (vlax-curve-getEndParam obj))))
        (setq i (1+ i))
      )
      (alert (strcat "GeoDev CAD Studio\\n\\nعدد العناصر المحددة: " (itoa i) "\\nإجمالي الأطوال: " (rtos totalLen 2 3) " متر"))
    )
    (princ "\\n[GeoDev] لم يتم تحديد خطوط.")
  )
  (princ)
)`
    }
  ];

  function escapeHTML(str) {
    return String(str ?? "").replace(/[&<>"']/g, ch => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[ch]);
  }

  function downloadTextFile(filename, content) {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function injectStyles() {
    if (document.getElementById("gdCodeStudioStyles")) return;
    const style = document.createElement("style");
    style.id = "gdCodeStudioStyles";
    style.textContent = `
      #gdLispStudioBox {
        direction: rtl;
        text-align: right;
        background: linear-gradient(145deg, #0f172a, #182334);
        border: 1.5px solid #e09f24;
        border-radius: 18px;
        padding: 16px;
        margin: 14px 0;
        color: #f8fafc;
        box-shadow: 0 10px 26px rgba(0, 0, 0, 0.2);
      }
      .gd-cs-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 10px;
      }
      .gd-cs-title {
        margin: 0;
        font-size: 16.5px;
        font-weight: 900;
        color: #fbbf24;
      }
      .gd-cs-badge {
        background: rgba(56, 189, 248, 0.16);
        color: #38bdf8;
        border: 1px solid rgba(56, 189, 248, 0.4);
        padding: 3px 10px;
        border-radius: 8px;
        font-size: 11px;
        font-weight: 800;
      }
      .gd-cs-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
        gap: 10px;
        margin-top: 12px;
      }
      .gd-cs-card {
        background: #090d16;
        border: 1px solid #334155;
        border-radius: 13px;
        padding: 12px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: 8px;
      }
      .gd-cs-cmd {
        display: inline-block;
        background: rgba(224, 159, 36, 0.16);
        color: #fbbf24;
        border: 1px solid rgba(224, 159, 36, 0.4);
        padding: 2px 8px;
        border-radius: 6px;
        font-size: 11.5px;
        font-weight: 900;
        direction: ltr;
      }
      .gd-cs-actions {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      }
      .gd-cs-btn {
        flex: 1;
        min-width: 95px;
        padding: 8px 10px;
        border-radius: 9px;
        border: none;
        font-size: 12px;
        font-weight: 800;
        cursor: pointer;
        font-family: inherit;
      }
      .gd-cs-btn.dl { background: #e09f24; color: #090d16; }
      .gd-cs-btn.cp { background: #1e293b; color: #38bdf8; border: 1px solid #334155; }
      .gd-export-code-bar {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-top: 8px;
      }
    `;
    document.head.appendChild(style);
  }

  function mountLispStudioInProgrammingSection() {
    const progSec =
      document.getElementById("s-code") ||
      document.getElementById("s-prog") ||
      document.getElementById("s-programming") ||
      Array.from(document.querySelectorAll(".sec")).find(s => (s.textContent || "").includes("AutoLISP"));

    if (!progSec || document.getElementById("gdLispStudioBox")) return;

    const box = document.createElement("div");
    box.id = "gdLispStudioBox";
    box.innerHTML = `
      <div class="gd-cs-header">
        <h3 class="gd-cs-title">مكتبة الليسبات المساحية الجاهزة للتحميل المباشر (.LSP)</h3>
        <span class="gd-cs-badge">GeoDev CAD Studio</span>
      </div>
      <p style="margin:0;font-size:12.5px;color:#cbd5e1;line-height:1.7;">
        حمّل ملف الليسب بصيغة <code>.lsp</code> مباشرة، ثم اكتب داخل AutoCAD أو Civil 3D أمر <code>AP</code> لتحميل الملف واكتب اختصار الأمر لتشغيله فوراً:
      </p>

      <div class="gd-cs-grid">
        ${readyLispTemplates
          .map(
            tpl => `
          <div class="gd-cs-card">
            <div>
              <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:6px;">
                <span class="gd-cs-cmd">Command: ${escapeHTML(tpl.command)}</span>
              </div>
              <h4 style="margin:0 0 5px;font-size:14px;color:#f8fafc;">${escapeHTML(tpl.title)}</h4>
              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">${escapeHTML(tpl.desc)}</p>
            </div>
            <div class="gd-cs-actions">
              <button type="button" class="gd-cs-btn dl" data-dl-lisp="${escapeHTML(tpl.id)}">تحميل ملف .LSP</button>
              <button type="button" class="gd-cs-btn cp" data-cp-lisp="${escapeHTML(tpl.id)}">نسخ الكود</button>
            </div>
          </div>
        `
          )
          .join("")}
      </div>
    `;

    progSec.prepend(box);
  }

  // إضافة أزرار تصدير (.lsp / .py) تحت أي صندوق كود يولده الذكاء الاصطناعي في المنصة
  function attachExportButtonsToGeneratedCodeBlocks() {
    document.querySelectorAll("pre").forEach(pre => {
      if (pre.dataset.gdExportAttached) return;
      const codeText = pre.textContent || "";
      if (codeText.trim().length < 25) return;

      pre.dataset.gdExportAttached = "1";
      const isLisp = /\(defun\s+/i.test(codeText);
      const isPython = /(import\s+arcpy|import\s+geopandas|def\s+\w+\()/i.test(codeText);

      const bar = document.createElement("div");
      bar.className = "gd-export-code-bar";

      if (isLisp) {
        bar.innerHTML = `<button type="button" class="gd-cs-btn dl" data-export-pre="lsp">حفظ وتصدير كملف AutoCAD (.lsp)</button>`;
      } else if (isPython) {
        bar.innerHTML = `<button type="button" class="gd-cs-btn dl" data-export-pre="py">حفظ وتصدير كملف Python (.py)</button>`;
      } else {
        bar.innerHTML = `
          <button type="button" class="gd-cs-btn dl" data-export-pre="lsp">تصدير كملف .LSP</button>
          <button type="button" class="gd-cs-btn cp" data-export-pre="py">تصدير كملف .PY</button>
        `;
      }

      pre.insertAdjacentElement("afterend", bar);
    });
  }

  function bindEvents() {
    document.addEventListener("click", e => {
      const dlBtn = e.target.closest("[data-dl-lisp]");
      if (dlBtn) {
        const tpl = readyLispTemplates.find(t => t.id === dlBtn.dataset.dlLisp);
        if (tpl) {
          downloadTextFile(`GeoDev_${tpl.command}.lsp`, tpl.code);
          if (typeof window.toast === "function") {
            window.toast(`تم تحميل ملف GeoDev_${tpl.command}.lsp بنجاح.`, "success");
          }
        }
        return;
      }

      const cpBtn = e.target.closest("[data-cp-lisp]");
      if (cpBtn) {
        const tpl = readyLispTemplates.find(t => t.id === cpBtn.dataset.cpLisp);
        if (tpl && navigator.clipboard) {
          navigator.clipboard.writeText(tpl.code).catch(() => {});
          if (typeof window.toast === "function") {
            window.toast(`تم نسخ كود الليسب (${tpl.command}) بنجاح.`, "success");
          }
        }
        return;
      }

      const expBtn = e.target.closest("[data-export-pre]");
      if (expBtn) {
        const ext = expBtn.dataset.exportPre === "py" ? "py" : "lsp";
        const pre = expBtn.parentElement?.previousElementSibling;
        if (pre && pre.tagName === "PRE") {
          downloadTextFile(`GeoDev_Script_${Date.now()}.${ext}`, pre.textContent || "");
          if (typeof window.toast === "function") {
            window.toast(`تم تصدير الملف بصيغة .${ext} بنجاح.`, "success");
          }
        }
      }
    });
  }

  function init() {
    injectStyles();
    bindEvents();
    mountLispStudioInProgrammingSection();
    attachExportButtonsToGeneratedCodeBlocks();

    const obs = new MutationObserver(() => {
      mountLispStudioInProgrammingSection();
      attachExportButtonsToGeneratedCodeBlocks();
    });
    if (document.body) {
      obs.observe(document.body, { childList: true, subtree: true });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
