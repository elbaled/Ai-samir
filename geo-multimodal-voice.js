/* ============================================================================
   GeoDev Multimodal Vision Fix & Teacher Voice/Plus Bar v2.0
   1. إصلاح خطأ HTTP 400 في تحليل الصور بالمساعد العام (استبدال qwen3.8-27b بموديلات الرؤية العاملة).
   2. إضافة زر (+) لرفع الصور والملفات وزر السماعة بموجات الصوت المتحركة داخل المدرس الذكي.
   3. ترقية زر الصوت في المساعد العام ليحتوي على شرط الصوت المتحركة.
   ============================================================================ */

(function () {
  "use strict";
  if (window.GEOMultimodalVoiceV2) return;
  window.GEOMultimodalVoiceV2 = true;

  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));

  let teacherAttachment = null; // { type: 'image'|'file', name, dataUrl?, text? }

  /* ==========================================================================
     1. تنسيقات CSS للموجات الصوتية المتحركة وشريط أدوات المدرس الذكي
     ========================================================================== */
  function injectMultimodalCSS() {
    if ($("geoMultimodalCSS")) return;
    const st = document.createElement("style");
    st.id = "geoMultimodalCSS";
    st.textContent = `
      .gd-voice-btn {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        min-width: 42px;
        height: 42px;
        border-radius: 12px;
        border: 1px solid var(--ln, #334155);
        background: var(--bg, #0b1120);
        color: var(--tx, #f1f5f9);
        cursor: pointer;
        transition: all 0.2s ease;
        flex-shrink: 0;
        padding: 0 10px;
      }

      .gd-voice-btn.listening {
        background: rgba(239, 68, 68, 0.14) !important;
        border-color: #ef4444 !important;
        color: #ef4444 !important;
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
        animation: gdSoundWave 0.7s ease-in-out infinite;
      }

      .gd-sound-bars i:nth-child(1) { animation-delay: 0.0s; }
      .gd-sound-bars i:nth-child(2) { animation-delay: 0.15s; }
      .gd-sound-bars i:nth-child(3) { animation-delay: 0.3s; }
      .gd-sound-bars i:nth-child(4) { animation-delay: 0.12s; }

      @keyframes gdSoundWave {
        0%, 100% { height: 4px; }
        50% { height: 16px; }
      }

      /* شريط الأدوات أسفل مربع كتابة المدرس الذكي */
      .gd-teacher-tools-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 8px;
      }

      .gd-plus-wrap {
        position: relative;
        flex-shrink: 0;
      }

      .gd-plus-menu {
        position: absolute;
        bottom: calc(100% + 8px);
        right: 0;
        min-width: 215px;
        background: var(--cd, #0f172a);
        border: 1px solid var(--ln, #334155);
        border-radius: 14px;
        padding: 6px;
        box-shadow: 0 14px 32px rgba(0, 0, 0, 0.45);
        z-index: 90;
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
        width: 44px;
        height: 44px;
        border-radius: 8px;
        object-fit: cover;
        border: 1px solid var(--ln);
      }
    `;
    document.head.appendChild(st);
  }

  /* ==========================================================================
     2. محرك الصوت بالموجات المتحركة (للمساعد العام والمدرس الذكي)
     ========================================================================== */
  let activeRec = null;
  let activeBtn = null;

  function toggleSpeechInput(targetInputId, btnEl) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      return window.toast && window.toast("متصفحك لا يدعم الإدخال الصوتي المباشر", "warn");
    }

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
     3. إصلاح تحليل الصور (تجاوز خطأ qwen/qwen3.8-27b HTTP 400 نهائياً)
     ========================================================================== */
  function compressDataUrl(dataUrl, maxSide = 1024) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        let w = img.width, h = img.height;
        if (w > maxSide || h > maxSide) {
          const r = Math.min(maxSide / w, maxSide / h);
          w = Math.round(w * r);
          h = Math.round(h * r);
        }
        const cv = document.createElement("canvas");
        cv.width = w;
        cv.height = h;
        cv.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(cv.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }

  function resizeFileToDataUrl(file, maxSide = 1024) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => resolve(await compressDataUrl(reader.result, maxSide));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function runVisionRequest(rawDataUrl, userQuestion, contextHint = "") {
    const user = window.firebase?.auth?.().currentUser;
    if (!user) throw new Error("يرجى تسجيل الدخول أولاً.");
    const token = await window.geoToken();
    const cleanDataUrl = await compressDataUrl(rawDataUrl, 1024);

    const promptText = `
أنت خبير هندسي وتقني ذكي في منصة GeoDev Studio Pro.
${contextHint ? `التخصص: ${contextHint}` : ""}
سؤال المستخدم حول الصورة: "${userQuestion || "صف محتوى هذه الصورة بالتفصيل، وإذا كان بها أي خطأ هندسي أو برمجي حدده واشرح طريقة إصلاحه."}"

أجب باللغة العربية بشكل واضح ومنظم:
- اشرح ما يظهر في الصورة بدقة.
- إذا كانت الصورة لبرنامج هندسي (مثل AutoCAD أو Civil 3D أو ArcGIS أو QGIS) أو كود برمجي، حدد مكان الخطأ أو المشكلة واذكر خطوات الإصلاح بالترتيب مع أسماء الأوامر بالإنجليزية.`;

    // قائمة موديلات الرؤية المدعومة بالتسلسل (بدلاً من qwen3.8-27b المعطل)
    const VISION_MODELS = [
      "meta-llama/llama-4-scout-17b-16e-instruct",
      "meta-llama/llama-4-maverick-17b-128e-instruct",
      "llama-3.2-90b-vision-preview",
      "llama-3.2-11b-vision-preview",
      "gpt-4o-mini"
    ];

    let lastError = "تعذر تحليل الصورة";

    for (const model of VISION_MODELS) {
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
                { type: "image_url", image_url: { url: cleanDataUrl } }
              ]
            }],
            temperature: 0.3,
            max_tokens: 3000
          })
        });

        const raw = await res.text();
        let data = {};
        try { data = JSON.parse(raw); } catch (_) {}

        if (res.ok && data.choices?.[0]?.message?.content) {
          return data.choices[0].message.content;
        }
        lastError = data.error?.message || `HTTP ${res.status}`;
      } catch (e) {
        lastError = e.message;
      }
    }

    throw new Error("تعذر تحليل الصورة على السيرفر: " + lastError);
  }

  // استبدال دالة askVision في geo-vision.js لإصلاح الخطأ في المساعد العام فوراً
  window.askVision = async function (promptText, imgAtt, onProgress) {
    const cleanPrompt = String(promptText || "").replace(/\[مرفقات مرفوعة[\s\S]*$/, "").trim();
    const reply = await runVisionRequest(imgAtt.dataUrl, cleanPrompt);
    if (typeof onProgress === "function") onProgress(reply);
    return reply;
  };

  /* ==========================================================================
     4. تركيب زر (+) وزر السماعة في شات المدرس الذكي (الصورة 2)
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

  window.GEOClearTeacherAtt = clearTeacherAttachment;

  function showTeacherAttachmentPreview() {
    const bar = $("gdTeacherAttBar");
    if (!bar || !teacherAttachment) return;

    bar.classList.add("on");
    if (teacherAttachment.type === "image") {
      bar.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;min-width:0">
          <img src="${teacherAttachment.dataUrl}" class="gd-teacher-att-thumb" alt="صورة مرفقة">
          <div style="min-width:0">
            <b style="display:block;color:var(--bl)">صورة جاهزة للتحليل</b>
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

  async function handleTeacherImageSelect(file) {
    if (!file) return;
    try {
      if (window.toast) window.toast("جاري تجهيز الصورة...", "info");
      const dataUrl = await resizeFileToDataUrl(file);
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
    const textarea = $("academyTeacherInput");
    const sendBtn = $("academyTeacherSendBtn");
    if (!textarea || !sendBtn) return;

    const parentBox = textarea.parentElement;
    if (!parentBox || parentBox.dataset.multimodalMounted === "1") return;
    parentBox.dataset.multimodalMounted = "1";

    // 1. شريط معاينة المرفقات فوق مربع النص
    const attBar = document.createElement("div");
    attBar.id = "gdTeacherAttBar";
    attBar.className = "gd-teacher-att-bar";
    parentBox.insertBefore(attBar, textarea);

    // 2. صف الأزرار (+ لرفع الصور/الملفات + السماعة الصوتية + زر الإرسال)
    const toolsRow = document.createElement("div");
    toolsRow.className = "gd-teacher-tools-row";
    toolsRow.innerHTML = `
      <div class="gd-plus-wrap">
        <button type="button" id="gdTeacherPlusBtn" class="gd-voice-btn" title="إضافة صورة أو ملف" aria-label="إضافة">
          <i data-lucide="plus"></i>
        </button>
        <div id="gdTeacherPlusMenu" class="gd-plus-menu">
          <button type="button" class="gd-plus-item" onclick="$('gdTeacherImgInput').click();$('gdTeacherPlusMenu').classList.remove('on')">
            <i data-lucide="image"></i>
            <span>رفع صورة (رسمة / خريطة)</span>
          </button>
          <button type="button" class="gd-plus-item" onclick="$('gdTeacherFileInput').click();$('gdTeacherPlusMenu').classList.remove('on')">
            <i data-lucide="file-up"></i>
            <span>رفع ملف (PDF / Word / كود)</span>
          </button>
        </div>
        <input type="file" id="gdTeacherImgInput" accept="image/*" hidden>
        <input type="file" id="gdTeacherFileInput" accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.xls,.py,.js,.json,.html,.css,.lsp" hidden>
      </div>

      <button type="button" id="gdTeacherVoiceBtn" class="gd-voice-btn" title="تحدث بالصوت" aria-label="تحدث بالصوت">
        <i data-lucide="headphones"></i>
        <span class="gd-sound-bars" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
      </button>
    `;

    // وضع زر الإرسال بجانب زر (+) وزر السماعة في صف واحد منسق
    sendBtn.style.flex = "1";
    sendBtn.style.margin = "0";
    parentBox.insertBefore(toolsRow, sendBtn);
    toolsRow.appendChild(sendBtn);

    if (window.lucide) {
      window.lucide.createIcons({ root: toolsRow, attrs: { "stroke-width": 1.85 } });
    }

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

    // اعتراض الإرسال عند وجود صورة أو ملف مرفق
    sendBtn.addEventListener("click", async e => {
      if (!teacherAttachment) return;

      e.preventDefault();
      e.stopImmediatePropagation();

      const msgBox = $("academyTeacherMessages");
      const subject = $("academyTeacherSubject")?.value || "الجغرافيا والمساحة و GIS";
      const userQuestion = textarea.value.trim() || (teacherAttachment.type === "image"
        ? "حلل هذه الصورة بالتفصيل واكتشف أي أخطاء بها وكيفية إصلاحها"
        : `اشرح ولخّص محتوى الملف المرفق (${teacherAttachment.name})`);

      const currentAtt = { ...teacherAttachment };
      textarea.value = "";
      clearTeacherAttachment();
      sendBtn.disabled = true;

      if (msgBox) {
        msgBox.insertAdjacentHTML("beforeend", `
          <div class="teacher-message user">
            <div class="teacher-bubble">
              ${currentAtt.type === "image"
                ? `<img src="${currentAtt.dataUrl}" style="max-width:220px;border-radius:10px;display:block;margin-bottom:8px">`
                : `<div style="font-size:11.5px;opacity:0.85;margin-bottom:4px">ملف: ${esc(currentAtt.name)}</div>`}
              <div>${esc(userQuestion)}</div>
            </div>
          </div>
          <div class="teacher-message assistant" id="gdTeacherVisionLoading">
            <div class="teacher-avatar"><i data-lucide="cpu"></i></div>
            <div class="teacher-bubble">جاري تحليل ${currentAtt.type === "image" ? "الصورة" : "الملف"} بدقة...</div>
          </div>
        `);
        if (window.lucide) window.lucide.createIcons({ root: msgBox });
        msgBox.scrollTop = msgBox.scrollHeight;
      }

      try {
        let replyText = "";
        if (currentAtt.type === "image") {
          replyText = await runVisionRequest(currentAtt.dataUrl, userQuestion, subject);
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
  function initAll() {
    injectMultimodalCSS();
    upgradeAgentVoiceButton();
    enhanceTeacherChatUI();

    // مراقب دوري لضمان تركيب الأزرار في المدرس الذكي بمجرد فتح التبويب
    setInterval(() => {
      upgradeAgentVoiceButton();
      enhanceTeacherChatUI();
    }, 600);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }
})();
