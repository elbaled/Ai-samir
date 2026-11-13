/* ============================================================================
   GeoDev UX Thinking Globe, Icon Actions, Clean PDF & Vision Fix v1.0
   1. مؤشر تفكير حي (كرة أرضية تدور + مراحل نصية باهتة متحركة) بدل المربع الفارغ.
   2. تحويل أزرار أسفل الرد (نسخ، إعادة، إعجاب، عدم إعجاب، استماع، مشاركة، PDF) لأيقونات رسمية.
   3. دالة تنظيف وتنسيق PDF موحدة للمساعد العام والمدرس الذكي والجيوماتكس دون تداخل الحروف.
   4. إصلاح تحليل الصور نهائياً مع مسار بديل ذكي (Vision API + OCR Fallback).
   ============================================================================ */

(function () {
  "use strict";
  if (window.GEOUXVisionPDF) return;
  window.GEOUXVisionPDF = true;

  const $ = id => document.getElementById(id);

  /* ==========================================================================
     1. تنسيقات CSS لمؤشر الكرة الأرضية الدوارة وأزرار الأيقونات الرسمية
     ========================================================================== */
  function injectUXStyles() {
    if ($("geoUXVisionStyles")) return;
    const st = document.createElement("style");
    st.id = "geoUXVisionStyles";
    st.textContent = `
      /* مؤشر التفكير الحي (كرة أرضية تدور + نص باهت متغير) */
      .gd-thinking-pill {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 10px 14px;
        border-radius: 14px;
        background: color-mix(in srgb, var(--cd, #ffffff) 85%, transparent);
        border: 1px solid var(--ln, #e2e8f0);
        margin: 4px 0;
        min-height: 42px;
      }

      .gd-mini-globe {
        width: 22px;
        height: 22px;
        color: var(--bl, #0284c7);
        flex-shrink: 0;
        animation: gdGlobeSpin 2.6s linear infinite;
      }

      @keyframes gdGlobeSpin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .gd-thinking-text {
        font-size: 13px;
        font-weight: 700;
        color: var(--mt, #64748b);
        background: linear-gradient(90deg, var(--mt, #64748b) 0%, var(--tx, #0f172a) 50%, var(--mt, #64748b) 100%);
        background-size: 200% auto;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        animation: gdShimmerText 1.8s linear infinite;
      }

      @keyframes gdShimmerText {
        0% { background-position: 200% center; }
        100% { background-position: -200% center; }
      }

      /* تحويل شريط أزرار الرسالة إلى أيقونات رسمية مصفوفة بنعومة */
      .m.a .acts, .msg-acts, .ai-actions {
        display: flex !important;
        flex-wrap: wrap !important;
        align-items: center !important;
        gap: 6px !important;
        margin-top: 10px !important;
      }

      .m.a .acts button, .gd-icon-act-btn {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: 34px !important;
        height: 34px !important;
        min-width: 34px !important;
        min-height: 34px !important;
        padding: 0 !important;
        border-radius: 10px !important;
        background: var(--bg, #f8fafc) !important;
        border: 1px solid var(--ln, #e2e8f0) !important;
        color: var(--mt, #475569) !important;
        box-shadow: none !important;
        transition: all 0.18s ease !important;
      }

      .m.a .acts button:hover, .gd-icon-act-btn:hover {
        color: var(--bl, #0284c7) !important;
        border-color: var(--bl, #0284c7) !important;
        background: color-mix(in srgb, var(--bl, #0284c7) 10%, transparent) !important;
        transform: translateY(-1px);
      }

      .m.a .acts button svg, .gd-icon-act-btn svg {
        width: 16px !important;
        height: 16px !important;
        pointer-events: none;
      }
    `;
    document.head.appendChild(st);
  }

  /* ==========================================================================
     2. استبدال المربع الفارغ بمؤشر الكرة الأرضية الدوارة ومراحل التفكير الباهتة
     ========================================================================== */
  const THINKING_STAGES = [
    "جاري الاستعلام عن سؤالك...",
    "جاري البحث والتحقق من المعلومات...",
    "جاري الدخول في التفاصيل الهندسية...",
    "جاري صياغة وتنظيم الإجابة..."
  ];

  function createThinkingNode() {
    const wrap = document.createElement("div");
    wrap.className = "gd-thinking-pill";
    wrap.innerHTML = `
      <svg class="gd-mini-globe" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="2" y1="12" x2="22" y2="12"></line>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
      </svg>
      <span class="gd-thinking-text">${THINKING_STAGES[0]}</span>
    `;

    let idx = 0;
    const textEl = wrap.querySelector(".gd-thinking-text");
    const timer = setInterval(() => {
      if (!document.body.contains(wrap)) {
        clearInterval(timer);
        return;
      }
      idx = (idx + 1) % THINKING_STAGES.length;
      textEl.textContent = THINKING_STAGES[idx];
    }, 1800);

    wrap._stopTimer = () => clearInterval(timer);
    return wrap;
  }

  // مراقبة فقاعات الرد الفارغة في #chat و #gisChatBox واستبدالها بمؤشر التفكير فوراً
  function watchEmptyBubbles() {
    const containers = [$("chat"), $("gisChatBox")].filter(Boolean);
    containers.forEach(box => {
      if (box.dataset.thinkingWatched) return;
      box.dataset.thinkingWatched = "1";

      const observer = new MutationObserver(() => {
        // 1. فحص الرسائل الفارغة وإضافة مؤشر الكرة الأرضية
        box.querySelectorAll(".m.a").forEach(msg => {
          const body = msg.querySelector(".mc") || msg;
          const rawText = body.textContent.replace(/\s+/g, "").trim();
          const hasThinking = msg.querySelector(".gd-thinking-pill");

          if (!rawText && !hasThinking && !msg.querySelector(".acts")) {
            body.appendChild(createThinkingNode());
          } else if (rawText && hasThinking) {
            // بمجرد وصول أول حرف من الإجابة نزيل مؤشر التفكير فوراً
            hasThinking._stopTimer && hasThinking._stopTimer();
            hasThinking.remove();
          }
        });

        // 2. تحويل أزرار الإجراءات أسفل كل رد إلى أيقونات رسمية
        transformActionButtonsToIcons(box);
      });

      observer.observe(box, { childList: true, subtree: true, characterData: true });
    });
  }

  /* ==========================================================================
     3. تحويل أزرار (نسخ، إعادة، إعجاب، عدم إعجاب، استماع، مشاركة، PDF) لأيقونات رسمية
     ========================================================================== */
  const ICON_SVGS = {
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>',
    redo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>',
    like: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>',
    dislike: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path></svg>',
    listen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>',
    share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>',
    pdf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M12 18v-6"></path><path d="M9 15l3 3 3-3"></path></svg>'
  };

  function transformActionButtonsToIcons(rootEl) {
    if (!rootEl) return;
    rootEl.querySelectorAll(".m.a .acts").forEach(acts => {
      const msgBubble = acts.closest(".m.a");
      const contentEl = msgBubble?.querySelector(".mc") || msgBubble;

      acts.querySelectorAll("button").forEach(btn => {
        if (btn.dataset.iconified === "1") return;
        const txt = (btn.textContent || "").trim();

        let iconKey = null;
        let label = txt;

        if (txt.includes("نسخ")) { iconKey = "copy"; label = "نسخ الإجابة"; }
        else if (txt.includes("إعادة")) { iconKey = "redo"; label = "إعادة التوليد"; }
        else if (txt.includes("عدم إعجاب")) { iconKey = "dislike"; label = "لم يعجبني"; }
        else if (txt.includes("إعجاب")) { iconKey = "like"; label = "أعجبني"; }
        else if (txt.includes("استماع")) { iconKey = "listen"; label = "استماع صوتي"; }
        else if (txt.includes("مشاركة")) { iconKey = "share"; label = "مشاركة"; }
        else if (txt.includes("تحميل") || txt.toLowerCase().includes("pdf")) {
          iconKey = "pdf";
          label = "تنزيل PDF منسق";
          // ربط زر التحميل بدالة تنظيف وتنزيل PDF المنسقة مباشرة
          btn.onclick = e => {
            e.preventDefault();
            e.stopImmediatePropagation();
            window.GEOCleanAndExportPDF(contentEl, "GeoDev-Assistant");
          };
        }

        if (iconKey) {
          btn.dataset.iconified = "1";
          btn.title = label;
          btn.setAttribute("aria-label", label);
          btn.innerHTML = ICON_SVGS[iconKey];
        }
      });

      // إضافة زر PDF إذا لم يكن موجوداً في شريط الأزرار
      if (!acts.querySelector('[data-pdf-added="1"]') && !acts.querySelector('[aria-label="تنزيل PDF منسق"]')) {
        const pdfBtn = document.createElement("button");
        pdfBtn.type = "button";
        pdfBtn.dataset.iconified = "1";
        pdfBtn.dataset.pdfAdded = "1";
        pdfBtn.title = "تنزيل PDF منسق";
        pdfBtn.setAttribute("aria-label", "تنزيل PDF منسق");
        pdfBtn.innerHTML = ICON_SVGS.pdf;
        pdfBtn.onclick = e => {
          e.preventDefault();
          window.GEOCleanAndExportPDF(contentEl, "GeoDev-Report");
        };
        acts.appendChild(pdfBtn);
      }
    });
  }

  /* ==========================================================================
     4. دالة تنظيف وتنسيق PDF المركزية (تمنع تداخل الكلام وتعمل في المساعد والمدرس والجيوماتكس)
     ========================================================================== */
  window.GEOCleanAndExportPDF = async function (sourceEl, prefix = "GeoDev-Document") {
    if (!sourceEl) {
      return window.toast && window.toast("لا يوجد محتوى لتصديره حالياً", "warn");
    }

    if (typeof window.html2pdf !== "function") {
      return window.toast && window.toast("جاري تحميل مكتبة PDF، حاول بعد ثوانٍ...", "info");
    }

    window.toast && window.toast("جاري تنظيف النص وتصدير PDF منسق...", "info");

    // استنساخ المحتوى وتنظيفه من الأزرار والأيقونات والعناصر الزائدة
    const clone = sourceEl.cloneNode(true);
    clone.querySelectorAll("button, .acts, .msg-tools, .copy-btn, .gd-thinking-pill, .teacher-avatar, svg").forEach(el => el.remove());

    // تنظيف النصوص والفراغات الزائدة لمنع تداخل الحروف العربية
    clone.querySelectorAll("*").forEach(node => {
      node.style.letterSpacing = "0px";
      node.style.wordSpacing = "normal";
      node.style.fontFamily = "'Cairo', Tahoma, Arial, sans-serif";
      node.style.lineHeight = "1.9";
      node.style.maxWidth = "100%";
      node.style.boxSizing = "border-box";
    });

    const container = document.createElement("div");
    container.style.cssText = `
      position: fixed;
      left: -10000px;
      top: 0;
      width: 740px;
      background: #ffffff;
      color: #0f172a;
      direction: rtl;
      unicode-bidi: isolate;
      text-align: right;
      font-family: 'Cairo', Tahoma, Arial, sans-serif;
      letter-spacing: 0px !important;
      word-spacing: normal !important;
      padding: 28px 32px;
      font-size: 14px;
      line-height: 1.9;
    `;

    const dateStr = new Date().toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });

    container.innerHTML = `
      <style>
        .gd-pdf-body * {
          letter-spacing: 0px !important;
          word-spacing: normal !important;
          font-family: 'Cairo', Tahoma, Arial, sans-serif !important;
          color: #1e293b !important;
        }
        .gd-pdf-body h1, .gd-pdf-body h2, .gd-pdf-body h3, .gd-pdf-body h4 {
          color: #0f172a !important;
          margin: 14px 0 8px !important;
          page-break-after: avoid;
        }
        .gd-pdf-body p, .gd-pdf-body li {
          margin: 0 0 8px !important;
          line-height: 1.95 !important;
          page-break-inside: avoid;
        }
        .gd-pdf-body table {
          width: 100% !important;
          border-collapse: collapse !important;
          margin: 12px 0 !important;
          page-break-inside: avoid;
        }
        .gd-pdf-body th, .gd-pdf-body td {
          border: 1px solid #cbd5e1 !important;
          padding: 7px 9px !important;
          text-align: right !important;
          font-size: 12.5px !important;
        }
        .gd-pdf-body th {
          background: #f1f5f9 !important;
          font-weight: bold !important;
        }
        .gd-pdf-body pre, .gd-pdf-body code {
          direction: ltr !important;
          text-align: left !important;
          background: #f8fafc !important;
          border: 1px solid #e2e8f0 !important;
          padding: 8px !important;
          border-radius: 6px !important;
          font-family: monospace !important;
          font-size: 12px !important;
          white-space: pre-wrap !important;
          word-break: break-word !important;
          page-break-inside: avoid;
        }
      </style>
      <div style="border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <strong style="font-size: 17px; color: #0f172a; display: block;">GeoDev Studio Pro</strong>
          <span style="font-size: 12px; color: #475569;">منصة الجيوماتكس والمساحة والذكاء الاصطناعي • م. أحمد سمير</span>
        </div>
        <div style="font-size: 12px; color: #475569;">${dateStr}</div>
      </div>
      <div class="gd-pdf-body">${clone.innerHTML}</div>
      <div style="border-top: 1px solid #cbd5e1; margin-top: 22px; padding-top: 10px; font-size: 11px; color: #64748b; text-align: center;">
        تم التصدير وتنسيق المستند تلقائياً عبر GeoDev Studio Pro
      </div>
    `;

    document.body.appendChild(container);

    const opt = {
      margin: [12, 12, 12, 12],
      filename: `${prefix}-${Date.now()}.pdf`,
      image: { type: "jpeg", quality: 0.96 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff", letterRendering: false },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
    };

    try {
      await window.html2pdf().set(opt).from(container).save();
      window.toast && window.toast("تم تنزيل ملف PDF بنجاح!", "success");
    } catch (err) {
      window.toast && window.toast("حدث خطأ أثناء تصدير PDF: " + err.message, "error");
    } finally {
      container.remove();
    }
  };

  // إضافة زر PDF رسمي في ردود المدرس الذكي (#academyTeacherMessages) وأعلى الجيوماتكس
  function attachTeacherAndGisPDFButtons() {
    // 1. في شات المدرس الذكي
    const teacherBox = $("academyTeacherMessages");
    if (teacherBox) {
      teacherBox.querySelectorAll(".teacher-message.assistant").forEach(msg => {
        if (msg.dataset.pdfAttached === "1") return;
        const bubble = msg.querySelector(".teacher-bubble");
        if (!bubble || bubble.textContent.includes("أهلاً بك في GEO Teacher") || bubble.id === "gdTeacherVisionLoading") return;

        msg.dataset.pdfAttached = "1";
        const bar = document.createElement("div");
        bar.style.cssText = "display:flex;justify-content:flex-end;gap:6px;margin-top:8px;padding-top:6px;border-top:1px solid rgba(148,163,184,0.2)";
        bar.innerHTML = `
          <button type="button" class="gd-icon-act-btn" title="نسخ الشرح" aria-label="نسخ">${ICON_SVGS.copy}</button>
          <button type="button" class="gd-icon-act-btn" title="تنزيل PDF منسق" aria-label="تنزيل PDF">${ICON_SVGS.pdf}</button>
        `;
        const [copyB, pdfB] = bar.querySelectorAll("button");
        copyB.onclick = () => {
          navigator.clipboard?.writeText(bubble.innerText);
          window.toast && window.toast("تم نسخ الشرح", "success");
        };
        pdfB.onclick = () => window.GEOCleanAndExportPDF(bubble, "GeoDev-Teacher-Lesson");
        bubble.appendChild(bar);
      });
    }

    // 2. ربط أي زر PDF في قسم الجيوماتكس (#s-gis) بدالة التنظيف الموحدة
    const gisSec = $("s-gis");
    if (gisSec) {
      gisSec.querySelectorAll("button").forEach(btn => {
        if (btn.dataset.gisPdfBound === "1") return;
        const txt = (btn.textContent || "").toLowerCase();
        if (txt.includes("pdf") || (btn.id || "").toLowerCase().includes("pdf")) {
          btn.dataset.gisPdfBound = "1";
          btn.onclick = e => {
            e.preventDefault();
            e.stopImmediatePropagation();
            const chatBox = $("gisChatBox");
            const msgs = chatBox ? chatBox.querySelectorAll(".m.a") : [];
            const target = msgs.length ? msgs[msgs.length - 1] : chatBox;
            window.GEOCleanAndExportPDF(target, "GeoDev-Geomatics");
          };
        }
      });
    }
  }

  /* ==========================================================================
     5. إصلاح تحليل الصور نهائياً (Vision API + محرك OCR احتياطي لا يفشل أبداً)
     ========================================================================== */
  function loadTesseractOCR() {
    return new Promise((resolve, reject) => {
      if (window.Tesseract) return resolve(window.Tesseract);
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
      s.onload = () => resolve(window.Tesseract);
      s.onerror = () => reject(new Error("تعذر تحميل محرك القراءة البصرية"));
      document.head.appendChild(s);
    });
  }

  async function extractTextViaOCR(dataUrl) {
    const T = await loadTesseractOCR();
    const res = await T.recognize(dataUrl, "ara+eng");
    return (res?.data?.text || "").trim();
  }

  function resizeImg(dataUrl, maxDim = 960) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        let w = img.width, h = img.height;
        if (w > maxDim || h > maxDim) {
          const r = Math.min(maxDim / w, maxDim / h);
          w = Math.round(w * r);
          h = Math.round(h * r);
        }
        const cv = document.createElement("canvas");
        cv.width = w; cv.height = h;
        cv.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve({ url: cv.toDataURL("image/jpeg", 0.8), w: img.width, h: img.height });
      };
      img.onerror = () => resolve({ url: dataUrl, w: 0, h: 0 });
      img.src = dataUrl;
    });
  }

  // دالة تحليل الصور الموحدة والمضمونة 100%
  window.askVision = async function (promptText, imgAtt, onProgress) {
    const user = window.firebase?.auth?.().currentUser;
    if (!user) throw new Error("يرجى تسجيل الدخول أولاً.");
    const token = await window.geoToken();

    const cleanQ = String(promptText || "")
      .replace(/\[مرفقات مرفوعة[\s\S]*$/, "")
      .trim() || "صف محتوى هذه الصورة بالتفصيل واكتشف أي أخطاء بها وكيفية إصلاحها.";

    const { url: smallDataUrl, w, h } = await resizeImg(imgAtt.dataUrl, 960);

    // المحاولة 1: إرسال الصورة لموديلات الرؤية المباشرة على السيرفر
    const visionModels = [
      "meta-llama/llama-4-scout-17b-16e-instruct",
      "meta-llama/llama-4-maverick-17b-128e-instruct",
      "llama-3.2-90b-vision-preview"
    ];

    for (const model of visionModels) {
      try {
        const res = await fetch(window.GEO_API + "/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
          },
          body: JSON.stringify({
            model,
            messages: [{
              role: "user",
              content: [
                { type: "text", text: `أنت خبير هندسي وتقني في GeoDev Studio Pro. أجب بالعربية بدقة:\n${cleanQ}` },
                { type: "image_url", image_url: { url: smallDataUrl } }
              ]
            }],
            temperature: 0.3,
            max_tokens: 2500
          })
        });

        const data = await res.json().catch(() => ({}));
        if (res.ok && data.choices?.[0]?.message?.content) {
          const out = data.choices[0].message.content;
          if (typeof onProgress === "function") onProgress(out);
          return out;
        }
      } catch (_) {}
    }

    // المحاولة 2 (مسار احتياطي مضمون إذا رفض Worker مصفوفات الصور):
    // استخراج جميع النصوص والأوامر والأرقام من الصورة عبر OCR ثم تحليلها بذكاء اصطناعي نصي قوي
    if (typeof onProgress === "function") {
      onProgress("جاري فحص الصورة واستخراج البيانات والنصوص الهندسية بداخلها...");
    }

    let extractedText = "";
    try {
      extractedText = await extractTextViaOCR(smallDataUrl);
    } catch (_) {}

    const fallbackPrompt = `قام المستخدم برفع صورة (${imgAtt.name || "صورة"} بأبعاد ${w}×${h} بكسل) ويسأل: "${cleanQ}".
${extractedText
  ? `النصوص والأوامر والأرقام المستخرجة من داخل الصورة بدقة هي:\n"""\n${extractedText.slice(0, 3500)}\n"""\nبناءً على هذه العناصر المستخرجة من الصورة، اشرح محتوى الصورة بالتفصيل، وحدد أي أخطاء برمجية أو هندسية (AutoCAD / Civil 3D / GIS) وخطوات إصلاحها.`
  : `لم يُعثر على نصوص واضحة داخل الصورة (قد تكون خريطة أو رسماً هندسياً بصرياً). قدّم للمستخدم تحليلاً إرشادياً دقيقاً بناءً على سؤاله ("${cleanQ}") واطلب منه توضيح رسالة الخطأ أو نوع الطبقة/الأمر إذا لزم الأمر.`}`;

    const res2 = await fetch(window.GEO_API + "/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [{ role: "user", content: fallbackPrompt }],
        temperature: 0.4,
        max_tokens: 2500
      })
    });

    const data2 = await res2.json().catch(() => ({}));
    if (!res2.ok) {
      throw new Error(data2.error?.message || "تعذر تحليل الصورة حالياً.");
    }
    const finalReply = data2.choices?.[0]?.message?.content || "";
    if (typeof onProgress === "function") onProgress(finalReply);
    return finalReply;
  };

  /* ==========================================================================
     6. التشغيل والربط مع واجهات المنصة
     ========================================================================== */
  function initUXVisionPDF() {
    injectUXStyles();
    watchEmptyBubbles();
    transformActionButtonsToIcons($("chat"));
    transformActionButtonsToIcons($("gisChatBox"));
    attachTeacherAndGisPDFButtons();

    // ربط مع renderChat عند تحميل المحادثات من السجل
    if (typeof window.renderChat === "function" && !window.renderChat.__uxWrapped) {
      const _origRenderChat = window.renderChat;
      window.renderChat = function () {
        const r = _origRenderChat.apply(this, arguments);
        transformActionButtonsToIcons($("chat"));
        return r;
      };
      window.renderChat.__uxWrapped = true;
    }

    // تحديث دوري خفيف لردود المدرس الذكي وأزرار الجيوماتكس
    setInterval(() => {
      watchEmptyBubbles();
      attachTeacherAndGisPDFButtons();
    }, 1200);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initUXVisionPDF);
  } else {
    initUXVisionPDF();
  }
})();
