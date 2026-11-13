/* ============================================================================
   GeoDev Multimodal Vision & Animated Voice Bar v1.0 (geo-multimodal-voice.js)
   1. زر (+) في المدرس الذكي لرفع الصور (AutoCAD / GIS / الخرائط) والملفات.
   2. تحليل بصري هندسي للصور لاكتشاف الأخطاء وشرح خطوات الإصلاح في المساعد والمدرس.
   3. زر سماعة/ميكروفون بموجات صوتية متحركة (Animated Sound Bars) في المدرس والمساعد.
   ============================================================================ */

(function () {
  "use strict";
  if (window.GEOMultimodalVoice) return;
  window.GEOMultimodalVoice = true;

  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));

  // حالة مرفقات المدرس الذكي
  let teacherAttachment = null; // { type: 'image'|'file', name, dataUrl?, text? }

  /* ==========================================================================
     1. تنسيقات CSS للموجات الصوتية المتحركة وقائمة الـ (+)
     ========================================================================== */
  function injectMultimodalCSS() {
    if ($("geoMultimodalCSS")) return;
    const st = document.createElement("style");
    st.id = "geoMultimodalCSS";
    st.textContent = `
      /* زر السماعة/الصوت وموجات الصوت المتحركة */
      .gd-voice-btn {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 3px;
        min-width: 40px;
        height: 40px;
        border-radius: 12px;
        border: 1px solid var(--ln, #334155);
        background: var(--bg, #0b1120);
        color: var(--tx, #f1f5f9);
        cursor: pointer;
        transition: all 0.2s ease;
        flex-shrink: 0;
      }

      .gd-voice-btn.listening {
        background: rgba(239, 68, 68, 0.14) !important;
        border-color: #ef4444 !important;
        color: #ef4444 !important;
        padding: 0 10px;
        box-shadow: 0 0 14px rgba(239, 68, 68, 0.28);
      }

      /* شرط الصوت المتحركة (Sound Equalizer Bars) */
      .gd-sound-bars {
        display: none;
        align-items: center;
        gap: 2.5px;
        height: 16px;
      }

      .gd-voice-btn.listening .gd-sound-bars {
        display: inline-flex;
      }

      .gd-sound-bars i {
        display: block;
        width: 3px;
        height: 6px;
        border-radius: 3px;
        background: #ef4444;
        animation: gdSoundWave 0.75s ease-in-out infinite;
      }

      .gd-sound-bars i:nth-child(1) { animation-delay: 0.0s; }
      .gd-sound-bars i:nth-child(2) { animation-delay: 0.15s; }
      .gd-sound-bars i:nth-child(3) { animation-delay: 0.3s; }
      .gd-sound-bars i:nth-child(4) { animation-delay: 0.12s; }

      @keyframes gdSoundWave {
        0%, 100% { height: 4px; }
        50% { height: 16px; }
      }

      /* قائمة البلس (+) للمدرس الذكي */
      .gd-plus-wrap {
        position: relative;
        flex-shrink: 0;
      }

      .gd-plus-menu {
        position: absolute;
        bottom: calc(100% + 8px);
        right: 0;
        min-width: 195px;
        background: var(--cd, #0f172a);
        border: 1px solid var(--ln, #334155);
        border-radius: 14px;
        padding: 6px;
        box-shadow: 0 14px 32px rgba(0, 0, 0, 0.45);
        z-index: 60;
        display: none;
        flex-direction: column;
        gap: 4px;
      }

      .gd-plus-menu.on {
        display: flex;
        animation: gdPopUp 0.18s ease both;
      }

      @keyframes gdPopUp {
        from { opacity: 0; transform: translateY(6px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .gd-plus-item {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        padding: 9px 11px;
        border-radius: 10px;
        background: transparent !important;
        color: var(--tx, #f1f5f9) !important;
        font-size: 13px !important;
        font-weight: 700 !important;
        text-align: right;
        justify-content: flex-start !important;
        min-height: 36px !important;
      }

      .gd-plus-item:hover {
        background: color-mix(in srgb, var(--bl, #3b82f6) 15%, transparent) !important;
        color: var(--bl, #3b82f6) !important;
      }

      /* شريط معاينة المرفق في المدرس الذكي */
      .gd-teacher-att-bar {
        display: none;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 8px 12px;
        margin-bottom: 8px;
        border-radius: 12px;
        background: color-mix(in srgb, var(--bl, #3b82f6) 10%, var(--bg, #0b1120));
        border: 1px solid color-mix(in srgb, var(--bl, #3b82f6) 35%, transparent);
        font-size: 12.5px;
      }

      .gd-teacher-att-bar.on {
        display: flex;
      }

      .gd-teacher-att-thumb {
        width: 42px;
        height: 42px;
        border-radius: 8px;
        object-fit: cover;
        border: 1px solid var(--ln);
      }
    `;
    document.head.appendChild(st);
  }

  /* ==========================================================================
     2. محرك الصوت الموحد بالموجات المتحركة (للمساعد العام والمدرس الذكي)
     ========================================================================== */
  let activeRec = null;
  let activeBtn = null;

  function toggleSpeechInput(targetInputId, btnEl) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      return window.toast && window.toast("متصفحك لا يدعم الإدخال الصوتي المباشر", "warn");
    }

    // إيقاف التسجيل إذا كان يعمل حالياً
    if (activeRec) {
      try { activeRec.stop(); } catch (_) {}
      if (activeBtn) activeBtn.classList.remove("listening");
      const wasSame = activeBtn === btnEl;
      activeRec = null;
      activeBtn = null;
      if (wasSame) return;
    }

    const inp = $(targetInputId);
    if (!inp) return;

    const rec = new SR();
    rec.lang = "ar-EG";
    rec.interimResults = true;
    rec.continuous = false;

    const baseText = inp.value ? inp.value + " " : "";
    activeRec = rec;
    activeBtn = btnEl;
    btnEl.classList.add("listening");

    rec.onresult = ev => {
      let transcript = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        transcript += ev.results[i][0].transcript;
      }
      inp.value = baseText + transcript;
      inp.dispatchEvent(new Event("input"));
    };

    rec.onerror = () => {
      btnEl.classList.remove("listening");
      activeRec = null;
      activeBtn = null;
    };

    rec.onend = () => {
      btnEl.classList.remove("listening");
      activeRec = null;
      activeBtn = null;
    };

    try {
      rec.start();
      if (window.toast) window.toast("تحدث الآن... يتم تحويل صوتك لنص", "info");
    } catch (_) {
      btnEl.classList.remove("listening");
    }
  }

  // ترقية زر الميكروفون في شريط المساعد العام (#micBtn) ليحتوي على شرط الصوت المتحركة
  function upgradeAgentVoiceButton() {
    const micBtn = $("micBtn");
    if (!micBtn || micBtn.dataset.waveUpgraded) return;
    micBtn.dataset.waveUpgraded = "1";
    micBtn.classList.add("gd-voice-btn");
    micBtn.innerHTML = `
      <i data-lucide="headphones"></i>
      <span class="gd-sound-bars" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
    `;
    micBtn.onclick = e => {
      e.preventDefault();
      e.stopImmediatePropagation();
      toggleSpeechInput("q", micBtn);
    };
    if (window.lucide) window.lucide.createIcons({ root: micBtn });
  }

  /* ==========================================================================
     3. محرك تحليل الصور والملفات بالذكاء الاصطناعي (Vision & File Analyzer)
     ========================================================================== */
  function resizeImageToDataUrl(file, maxSide = 1280) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          let w = img.width, h = img.height;
          if (w > maxSide || h > maxSide) {
            const ratio = Math.min(maxSide / w, maxSide / h);
            w = Math.round(w * ratio);
            h = Math.round(h * ratio);
          }
          const cv = document.createElement("canvas");
          cv.width = w;
          cv.height = h;
          cv.getContext("2d").drawImage(img, 0, 0, w, h);
          resolve(cv.toDataURL("image/jpeg", 0.86));
        };
        img.onerror = reject;
        img.src = reader.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function analyzeImageWithVisionAI(dataUrl, userQuestion, subjectContext = "الهندسة والمساحة و GIS") {
    const user = window.firebase?.auth?.().currentUser;
    if (!user) throw new Error("يرجى تسجيل الدخول أولاً.");
    const token = await window.geoToken();

    const promptText = `
أنت خبير هندسي وأكاديمي في (${subjectContext}) داخل منصة GeoDev Studio Pro.
قام المستخدم برفع هذه الصورة ويسأل: "${userQuestion || "حلل هذه الصورة بالتفصيل واكتشف أي أخطاء موجودة بها وكيفية إصلاحها"}"

المطلوب في إجابتك بشكل منظم وعملي:
1. **قراءة وتحليل محتوى الصورة:** صف بدقة ما يظهر في الصورة (لوحة AutoCAD / Civil 3D، خريطة ArcGIS / QGIS، مسألة مساحية، أو كود برمجي).
2. **تحديد الأخطاء أو المشكلات بدقة:** اذكر مكان الخطأ أو الخلل الفني الموجود في الرسمة أو الإعدادات أو الحسابات.
3. **خطوات الإصلاح العملية:** اشرح بالترتيب كيف يقوم المستخدم بإصلاح الخطأ (مع ذكر أسماء الأوامر والأدوات بالإنجليزية مثل TRIM, EXTEND, AUDIT, OVERKILL, PROJECT, GEOREFERENCING).
أجب بالعربية الواضحة والمنظمة.`;

    // المحاولة مع نموذج الرؤية البصرية في Worker
    const visionModels = [
      "meta-llama/llama-4-scout-17b-16e-instruct",
      "llama-3.2-90b-vision-preview",
      "gpt-4o-mini"
    ];

    let lastErr = "تعذر تحليل الصورة";
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
                { type: "text", text: promptText },
                { type: "image_url", image_url: { url: dataUrl } }
              ]
            }],
            temperature: 0.3,
            max_tokens: 3500
          })
        });

        const data = await res.json().catch(() => ({}));
        if (res.ok && data.choices?.[0]?.message?.content) {
          return data.choices[0].message.content;
        }
        lastErr = data.error?.message || `HTTP ${res.status}`;
      } catch (e) {
        lastErr = e.message;
      }
    }
    throw new Error("تعذر تحليل الصورة حالياً: " + lastErr);
  }

  // ربط تحليل الصور في المساعد العام (#s-agent) أيضاً عندما يرفع المستخدم صورة في AT
  const _origAsk = window.ask;
  if (typeof _origAsk === "function") {
    window.ask = async function (prompt, shown) {
      const imgAtt = Array.isArray(window.AT) ? window.AT.find(x => x.kind === "image" && x.dataUrl) : null;
      if (imgAtt) {
        const userText = shown || prompt;
        // نضيف توجيه هندسي لتحليل الأخطاء في الصور المرفوعة في المساعد العام
        const visionHint = "\n\n(ملاحظة: إذا كانت الصورة المرفقة تحتوي على رسمة AutoCAD أو Civil 3D أو خريطة GIS أو كود، حدد مكان الخطأ بدقة واشرح خطوات إصلاحه بالأوامر والأدوات).";
        return _origAsk(prompt + visionHint, userText);
      }
      return _origAsk(prompt, shown);
    };
  }

  /* ==========================================================================
     4. ترقية واجهة شات المدرس الذكي (زر + لرفع الصور والملفات + زر السماعة)
     ========================================================================== */
  function clearTeacherAttachment() {
    teacherAttachment = null;
    const bar = $("gdTeacherAttBar");
    if (bar) {
      bar.classList.remove("on");
      bar.innerHTML = "";
    }
    if ($("gdTeacherImgInput")) $("gdTeacherImgInput").value = "";
    if ($("gdTeacherFileInput")) $("gdTeacherFileInput").value = "";
  }

  function showTeacherAttachmentPreview() {
    const bar = $("gdTeacherAttBar");
    if (!bar || !teacherAttachment) return;

    bar.classList.add("on");
    if (teacherAttachment.type === "image") {
      bar.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;min-width:0">
          <img src="${teacherAttachment.dataUrl}" class="gd-teacher-att-thumb" alt="صورة مرفقة">
          <div style="min-width:0">
            <b style="display:block;color:var(--bl)">صورة جاهزة للتحليل البصري</b>
            <span class="academy-muted" style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(teacherAttachment.name)}</span>
          </div>
        </div>
        <button type="button" class="r" style="padding:4px 10px;min-height:30px;font-size:11.5px" onclick="window.GEOClearTeacherAtt()">حذف</button>
      `;
    } else {
      bar.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px;min-width:0">
          <i data-lucide="file-text" style="color:var(--am)"></i>
          <div style="min-width:0">
            <b style="display:block;color:var(--am)">ملف مرفق للمناقشة</b>
            <span class="academy-muted">${esc(teacherAttachment.name)}</span>
          </div>
        </div>
        <button type="button" class="r" style="padding:4px 10px;min-height:30px;font-size:11.5px" onclick="window.GEOClearTeacherAtt()">حذف</button>
      `;
      if (window.lucide) window.lucide.createIcons({ root: bar });
    }
  }

  window.GEOClearTeacherAtt = clearTeacherAttachment;

  async function handleTeacherImageSelect(file) {
    if (!file) return;
    try {
      if (window.toast) window.toast("جاري تجهيز الصورة للتحليل...", "info");
      const dataUrl = await resizeImageToDataUrl(file);
      teacherAttachment = { type: "image", name: file.name, dataUrl };
      showTeacherAttachmentPreview();
    } catch (e) {
      if (window.toast) window.toast("تعذر قراءة الصورة: " + e.message, "error");
    }
  }

  async function handleTeacherFileSelect(file) {
    if (!file) return;
    try {
      let content = "";
      if (typeof window.readFileText === "function") {
        const res = await window.readFileText(file);
        content = typeof res === "string" ? res : (res?.text || "");
      } else {
        content = await file.text();
      }
      teacherAttachment = {
        type: "file",
        name: file.name,
        text: String(content || "").slice(0, 12000)
      };
      showTeacherAttachmentPreview();
      if (window.toast) window.toast("تم إرفاق الملف بنجاح", "success");
    } catch (e) {
      if (window.toast) window.toast("تعذر قراءة الملف: " + e.message, "error");
    }
  }

  function enhanceTeacherChatUI() {
    const inputRow = document.querySelector("#academyContent .teacher-input-row");
    const textarea = $("academyTeacherInput");
    const sendBtn = $("academyTeacherSendBtn");
    if (!inputRow || !textarea || !sendBtn || inputRow.dataset.multimodalReady) return;
    inputRow.dataset.multimodalReady = "1";

    // شريط المعاينة فوق شريط الإدخال
    const attBar = document.createElement("div");
    attBar.id = "gdTeacherAttBar";
    attBar.className = "gd-teacher-att-bar";
    inputRow.parentNode.insertBefore(attBar, inputRow);

    // إضافة زر (+) لرفع الصور والملفات وزر السماعة بالموجات المتحركة
    const controlsHTML = `
      <div class="gd-plus-wrap">
        <button type="button" id="gdTeacherPlusBtn" class="gd-voice-btn" title="إرفاق صورة أو ملف" aria-label="إرفاق">
          <i data-lucide="plus"></i>
        </button>
        <div id="gdTeacherPlusMenu" class="gd-plus-menu">
          <button type="button" class="gd-plus-item" onclick="$('gdTeacherImgInput').click();$('gdTeacherPlusMenu').classList.remove('on')">
            <i data-lucide="image"></i>
            <span>رفع صورة (AutoCAD / خريطة)</span>
          </button>
          <button type="button" class="gd-plus-item" onclick="$('gdTeacherFileInput').click();$('gdTeacherPlusMenu').classList.remove('on')">
            <i data-lucide="file-up"></i>
            <span>رفع ملف (PDF / Word / كود)</span>
          </button>
        </div>
        <input type="file" id="gdTeacherImgInput" accept="image/*" hidden>
        <input type="file" id="gdTeacherFileInput" accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.xls,.py,.js,.json,.html,.css,.lsp" hidden>
      </div>

      <button type="button" id="gdTeacherVoiceBtn" class="gd-voice-btn" title="تحدث بالصوت" aria-label="إدخال صوتي">
        <i data-lucide="headphones"></i>
        <span class="gd-sound-bars" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
      </button>
    `;

    inputRow.insertAdjacentHTML("afterbegin", controlsHTML);

    if (window.lucide) {
      window.lucide.createIcons({ root: inputRow, attrs: { "stroke-width": 1.85 } });
    }

    // أحداث القائمة والملفات والصوت
    $("gdTeacherPlusBtn").onclick = e => {
      e.stopPropagation();
      $("gdTeacherPlusMenu").classList.toggle("on");
    };

    document.addEventListener("click", () => {
      $("gdTeacherPlusMenu")?.classList.remove("on");
    });

    $("gdTeacherImgInput").onchange = e => handleTeacherImageSelect(e.target.files?.[0]);
    $("gdTeacherFileInput").onchange = e => handleTeacherFileSelect(e.target.files?.[0]);

    $("gdTeacherVoiceBtn").onclick = () => {
      toggleSpeechInput("academyTeacherInput", $("gdTeacherVoiceBtn"));
    };

    // اعتراض الإرسال في المدرس الذكي لدعم تحليل الصور والملفات
    sendBtn.addEventListener("click", async e => {
      if (!teacherAttachment) return; // إذا لا يوجد مرفق نترك الإرسال النصي العادي يعمل

      e.preventDefault();
      e.stopImmediatePropagation();

      const msgBox = $("academyTeacherMessages");
      const subject = $("academyTeacherSubject")?.value || "الهندسة والمساحة و GIS";
      const userQuestion = textarea.value.trim() || (teacherAttachment.type === "image"
        ? "حلل هذه الصورة واكتشف الأخطاء الموجودة بها وكيفية إصلاحها"
        : `لخّص واشرح محتوى الملف المرفق (${teacherAttachment.name})`);

      const currentAtt = { ...teacherAttachment };
      textarea.value = "";
      clearTeacherAttachment();
      sendBtn.disabled = true;

      // عرض رسالة المستخدم مع الصورة المصغرة في شات المدرس
      if (msgBox) {
        msgBox.insertAdjacentHTML("beforeend", `
          <div class="teacher-message user">
            <div class="teacher-bubble">
              ${currentAtt.type === "image"
                ? `<img src="${currentAtt.dataUrl}" style="max-width:220px;border-radius:10px;display:block;margin-bottom:8px">`
                : `<div style="font-size:11.5px;opacity:0.85;margin-bottom:4px">📎 ${esc(currentAtt.name)}</div>`}
              <div>${esc(userQuestion)}</div>
            </div>
          </div>
          <div class="teacher-message assistant" id="gdTeacherVisionLoading">
            <div class="teacher-avatar"><i data-lucide="cpu"></i></div>
            <div class="teacher-bubble">جاري فحص وتحليل ${currentAtt.type === "image" ? "الصورة" : "الملف"} هندسياً...</div>
          </div>
        `);
        if (window.lucide) window.lucide.createIcons({ root: msgBox });
        msgBox.scrollTop = msgBox.scrollHeight;
      }

      try {
        let replyText = "";
        if (currentAtt.type === "image") {
          replyText = await analyzeImageWithVisionAI(currentAtt.dataUrl, userQuestion, subject);
        } else {
          const combinedPrompt = `${userQuestion}\n\n[محتوى الملف المرفق: ${currentAtt.name}]:\n${currentAtt.text}`;
          replyText = await window.GEOAcademyEngines.teacherChat(
            [{ role: "user", content: combinedPrompt }],
            subject
          );
        }

        $("gdTeacherVisionLoading")?.remove();
        if (msgBox) {
          const rendered = typeof window.renderMarkdown === "function"
            ? window.renderMarkdown(replyText)
            : esc(replyText).replace(/\n/g, "<br>");
          msgBox.insertAdjacentHTML("beforeend", `
            <div class="teacher-message assistant">
              <div class="teacher-avatar"><i data-lucide="cpu"></i></div>
              <div class="teacher-bubble">${rendered}</div>
            </div>
          `);
          if (window.lucide) window.lucide.createIcons({ root: msgBox });
          msgBox.scrollTop = msgBox.scrollHeight;
        }
      } catch (err) {
        $("gdTeacherVisionLoading")?.remove();
        if (msgBox) {
          msgBox.insertAdjacentHTML("beforeend", `
            <div class="teacher-message assistant">
              <div class="teacher-avatar"><i data-lucide="alert-triangle"></i></div>
              <div class="teacher-bubble" style="color:#f87171">${esc(err.message)}</div>
            </div>
          `);
        }
      } finally {
        sendBtn.disabled = false;
      }
    }, true);
  }

  /* ==========================================================================
     5. التشغيل والمراقبة المستمرة
     ========================================================================== */
  function initMultimodalVoice() {
    injectMultimodalCSS();
    upgradeAgentVoiceButton();
    enhanceTeacherChatUI();

    const acadSec = $("s-academy");
    if (acadSec) {
      new MutationObserver(() => {
        enhanceTeacherChatUI();
      }).observe(acadSec, { childList: true, subtree: true });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMultimodalVoice);
  } else {
    initMultimodalVoice();
  }
})();
