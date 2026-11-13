/* ============================================================================
   GeoDev UX Thinking Globe, Icon Actions, Clean PDF & Vision Fix v2.0
   (بدون أي MutationObserver — خفيف وسريع 100% ولا يسبب أي تجميد)
   ============================================================================ */

(function () {
  "use strict";
  if (window.GEOUXVisionPDF_V20) return;
  window.GEOUXVisionPDF_V20 = true;

  const $ = id => document.getElementById(id);

  /* ==========================================================================
     1. تنسيقات CSS لمؤشر الكرة الأرضية وأيقونات الإجراءات الرسمية
     ========================================================================== */
  function injectUXStyles() {
    if ($("geoUXVisionStyles")) return;
    const st = document.createElement("style");
    st.id = "geoUXVisionStyles";
    st.textContent = `
      .gd-thinking-pill {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 10px 14px;
        border-radius: 14px;
        background: color-mix(in srgb, var(--cd, #ffffff) 90%, transparent);
        border: 1px solid var(--ln, #e2e8f0);
        margin: 4px 0;
        min-height: 40px;
      }

      .gd-mini-globe {
        width: 20px;
        height: 20px;
        color: var(--bl, #0284c7);
        flex-shrink: 0;
        animation: gdGlobeSpin 2.5s linear infinite;
      }

      @keyframes gdGlobeSpin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      .gd-thinking-text {
        font-size: 13px;
        font-weight: 700;
        color: var(--mt, #64748b);
        opacity: 0.85;
      }

      .m.a .acts {
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
      }

      .m.a .acts button:hover, .gd-icon-act-btn:hover {
        color: var(--bl, #0284c7) !important;
        border-color: var(--bl, #0284c7) !important;
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
     2. مؤشر الكرة الأرضية ومراحل التفكير الباهتة (بدون MutationObserver)
     ========================================================================== */
  const STAGES = [
    "جاري الاستعلام عن سؤالك...",
    "جاري البحث والتحقق من المعلومات...",
    "جاري الدخول في التفاصيل الهندسية...",
    "جاري صياغة الإجابة..."
  ];

  function updateEmptyBubblesSafely() {
    [$("chat"), $("gisChatBox")].filter(Boolean).forEach(box => {
      box.querySelectorAll(".m.a").forEach(msg => {
        const body = msg.querySelector(".mc") || msg;
        const pill = body.querySelector(".gd-thinking-pill");
        const hasActs = !!msg.querySelector(".acts");

        // حساب النص الفعلي بدون نص المؤشر
        let textLen = 0;
        body.childNodes.forEach(n => {
          if (n === pill) return;
          if (n.nodeType === 1 && n.classList?.contains("acts")) return;
          textLen += (n.textContent || "").trim().length;
        });

        if (textLen === 0 && !hasActs) {
          if (!pill) {
            const el = document.createElement("div");
            el.className = "gd-thinking-pill";
            el.dataset.stage = "0";
            el.innerHTML = `
              <svg class="gd-mini-globe" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>
              <span class="gd-thinking-text">${STAGES[0]}</span>
            `;
            body.appendChild(el);
          } else {
            const nextStage = ((parseInt(pill.dataset.stage || "0", 10) + 1) % STAGES.length);
            pill.dataset.stage = String(nextStage);
            const txtSpan = pill.querySelector(".gd-thinking-text");
            if (txtSpan) txtSpan.textContent = STAGES[nextStage];
          }
        } else if (pill) {
          pill.remove();
        }
      });
    });
  }

  /* ==========================================================================
     3. تحويل أزرار الإجراءات أسفل الرد إلى أيقونات رسمية
     ========================================================================== */
  const ICON_SVGS = {
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>',
    redo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>',
    like: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>',
    dislike: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path></svg>',
    listen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>',
    share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>',
    pdf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M12 18v-6"></path><path d="M9 15l3 3 3-3"></path></svg>'
  };

  function iconifyActionBars() {
    document.querySelectorAll(".m.a .acts").forEach(acts => {
      const msgBubble = acts.closest(".m.a");
      const contentEl = msgBubble?.querySelector(".mc") || msgBubble;

      acts.querySelectorAll("button").forEach(btn => {
        if (btn.dataset.iconified === "1") return;
        const txt = (btn.textContent || "").trim();
        let key = null;

        if (txt.includes("نسخ")) key = "copy";
        else if (txt.includes("إعادة")) key = "redo";
        else if (txt.includes("عدم إعجاب")) key = "dislike";
        else if (txt.includes("إعجاب")) key = "like";
        else if (txt.includes("استماع")) key = "listen";
        else if (txt.includes("مشاركة")) key = "share";
        else if (txt.includes("تحميل") || txt.toLowerCase().includes("pdf")) {
          key = "pdf";
          btn.onclick = e => {
            e.preventDefault();
            e.stopImmediatePropagation();
            window.GEOCleanAndExportPDF(contentEl, "GeoDev-Assistant");
          };
        }

        if (key) {
          btn.dataset.iconified = "1";
          btn.title = txt;
          btn.innerHTML = ICON_SVGS[key];
        }
      });

      if (!acts.querySelector('[data-pdf-btn="1"]')) {
        const pdfBtn = document.createElement("button");
        pdfBtn.type = "button";
        pdfBtn.dataset.iconified = "1";
        pdfBtn.dataset.pdfBtn = "1";
        pdfBtn.title = "تنزيل PDF منسق";
        pdfBtn.innerHTML = ICON_SVGS.pdf;
        pdfBtn.onclick = e => {
          e.preventDefault();
          window.GEOCleanAndExportPDF(contentEl, "GeoDev-Report");
        };
        acts.appendChild(pdfBtn);
      }
    });

    // إضافة أيقونة PDF ونسخ لردود المدرس الذكي
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
          <button type="button" class="gd-icon-act-btn" title="نسخ">${ICON_SVGS.copy}</button>
          <button type="button" class="gd-icon-act-btn" title="تنزيل PDF">${ICON_SVGS.pdf}</button>
        `;
        const [cBtn, pBtn] = bar.querySelectorAll("button");
        cBtn.onclick = () => {
          navigator.clipboard?.writeText(bubble.innerText);
          window.toast && window.toast("تم نسخ الشرح", "success");
        };
        pBtn.onclick = () => window.GEOCleanAndExportPDF(bubble, "GeoDev-Teacher");
        bubble.appendChild(bar);
      });
    }
  }

  /* ==========================================================================
     4. دالة تنظيف وتصدير PDF منسقة (المساعد + المدرس الذكي + الجيوماتكس)
     ========================================================================== */
  window.GEOCleanAndExportPDF = async function (sourceEl, prefix = "GeoDev-Document") {
    if (!sourceEl) return window.toast && window.toast("لا يوجد محتوى لتصديره", "warn");
    if (typeof window.html2pdf !== "function") {
      return window.toast && window.toast("جاري تحميل مكتبة PDF، حاول بعد ثوانٍ...", "info");
    }

    window.toast && window.toast("جاري تجهيز ملف PDF منسق...", "info");

    const clone = sourceEl.cloneNode(true);
    clone.querySelectorAll("button, .acts, .msg-tools, .copy-btn, .gd-thinking-pill, .teacher-avatar, svg").forEach(el => el.remove());

    const container = document.createElement("div");
    container.style.cssText = `
      position: fixed;
      left: -10000px;
      top: 0;
      width: 740px;
      background: #ffffff;
      color: #0f172a;
      direction: rtl;
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
        .gd-pdf-clean * {
          letter-spacing: 0px !important;
          word-spacing: normal !important;
          font-family: 'Cairo', Tahoma, Arial, sans-serif !important;
          color: #1e293b !important;
        }
        .gd-pdf-clean p, .gd-pdf-clean li {
          margin: 0 0 8px !important;
          line-height: 1.95 !important;
          page-break-inside: avoid;
        }
        .gd-pdf-clean table {
          width: 100% !important;
          border-collapse: collapse !important;
          margin: 12px 0 !important;
        }
        .gd-pdf-clean th, .gd-pdf-clean td {
          border: 1px solid #cbd5e1 !important;
          padding: 7px 9px !important;
          text-align: right !important;
        }
        .gd-pdf-clean pre, .gd-pdf-clean code {
          direction: ltr !important;
          text-align: left !important;
          background: #f8fafc !important;
          border: 1px solid #e2e8f0 !important;
          padding: 8px !important;
          font-family: monospace !important;
          white-space: pre-wrap !important;
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
      <div class="gd-pdf-clean">${clone.innerHTML}</div>
    `;

    document.body.appendChild(container);

    try {
      await window.html2pdf().set({
        margin: [12, 12, 12, 12],
        filename: `${prefix}-${Date.now()}.pdf`,
        image: { type: "jpeg", quality: 0.96 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
      }).from(container).save();
      window.toast && window.toast("تم تنزيل ملف PDF بنجاح!", "success");
    } catch (err) {
      window.toast && window.toast("خطأ في PDF: " + err.message, "error");
    } finally {
      container.remove();
    }
  };

  /* ==========================================================================
     5. إصلاح تحليل الصور (Vision API + OCR Fallback)
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

  window.askVision = async function (promptText, imgAtt, onProgress) {
    const user = window.firebase?.auth?.().currentUser;
    if (!user) throw new Error("يرجى تسجيل الدخول أولاً.");
    const token = await window.geoToken();

    const cleanQ = String(promptText || "")
      .replace(/\[مرفقات مرفوعة[\s\S]*$/, "")
      .trim() || "صف محتوى هذه الصورة بالتفصيل واكتشف أي أخطاء بها وكيفية إصلاحها.";

    const { url: smallDataUrl, w, h } = await resizeImg(imgAtt.dataUrl, 960);

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

    if (typeof onProgress === "function") {
      onProgress("جاري فحص الصورة واستخراج النصوص والبيانات الهندسية بداخلها...");
    }

    let extractedText = "";
    try {
      const T = await loadTesseractOCR();
      const res = await T.recognize(smallDataUrl, "ara+eng");
      extractedText = (res?.data?.text || "").trim();
    } catch (_) {}

    const fallbackPrompt = `قام المستخدم برفع صورة (${imgAtt.name || "صورة"} بأبعاد ${w}×${h} بكسل) ويسأل: "${cleanQ}".
${extractedText
  ? `النصوص والأوامر المستخرجة من داخل الصورة هي:\n"""\n${extractedText.slice(0, 3500)}\n"""\nاشرح محتوى الصورة بالتفصيل وحدد أي أخطاء هندسية أو برمجية وخطوات إصلاحها.`
  : `لم يُعثر على نصوص واضحة داخل الصورة. قدّم تحليلاً إرشادياً دقيقاً بناءً على سؤاله ("${cleanQ}").`}`;

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
    if (!res2.ok) throw new Error(data2.error?.message || "تعذر تحليل الصورة حالياً.");
    const finalReply = data2.choices?.[0]?.message?.content || "";
    if (typeof onProgress === "function") onProgress(finalReply);
    return finalReply;
  };

  /* ==========================================================================
     6. التشغيل الخفيف (مؤقت واحد هادئ كل 1.4 ثانية فقط)
     ========================================================================== */
  function initSafe() {
    injectUXStyles();
    iconifyActionBars();

    // ربط أزرار PDF في قسم الجيوماتكس
    const gisSec = $("s-gis");
    if (gisSec) {
      gisSec.querySelectorAll("button").forEach(btn => {
        const txt = (btn.textContent || "").toLowerCase();
        if (txt.includes("pdf") || (btn.id || "").toLowerCase().includes("pdf")) {
          btn.onclick = e => {
            e.preventDefault();
            e.stopImmediatePropagation();
            const chatBox = $("gisChatBox");
            const msgs = chatBox ? chatBox.querySelectorAll(".m.a") : [];
            window.GEOCleanAndExportPDF(msgs.length ? msgs[msgs.length - 1] : chatBox, "GeoDev-Geomatics");
          };
        }
      });
    }

    setInterval(() => {
      updateEmptyBubblesSafely();
      iconifyActionBars();
    }, 1400);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSafe);
  } else {
    initSafe();
  }
})();
