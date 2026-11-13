/* ============================================================================
   GeoDev AI Brain & Real Search Bridge v1.0 (geo-ai-brain.js)
   1. ربط المساعد العام و GEO 5.2 ULTRA بمحرك البحث الحقيقي (/search - Tavily).
   2. دمج الذاكرة المعرفية المتخصصة (gd_kb) تلقائياً في كل استفسار بالمساعد العام.
   3. بناء واجهة إدارة الذاكرة المعرفية داخل لوحة الإدارة (#s-admin).
   ============================================================================ */

(function () {
  "use strict";
  if (window.GEOAIBrain) return;
  window.GEOAIBrain = true;

  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));

  /* ==========================================================================
     1. البحث في الذاكرة المعرفية المحلية (gd_kb)
     ========================================================================== */
  const norm = s => String(s || "").toLowerCase()
    .replace(/[\u064B-\u065F]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي");

  const toks = s => norm(s)
    .split(/[^\p{L}\p{N}]+/u)
    .filter(w => w.length > 2)
    .map(w => w.replace(/^(وال|بال|لل|ال)/, ""));

  function getKBContext(query) {
    try {
      const kb = JSON.parse(localStorage.getItem("gd_kb") || '{"items":[]}');
      const items = Array.isArray(kb.items) ? kb.items : [];
      if (!items.length) return "";

      const qt = new Set(toks(query));
      const scored = items.map(it => {
        const words = toks((it.t || "") + " " + (it.s || ""));
        const matches = words.filter(w => qt.has(w)).length;
        return { it, matches };
      }).filter(x => x.matches > 0)
        .sort((a, b) => b.matches - a.matches)
        .slice(0, 6);

      if (!scored.length) return "";

      return "\n\n[معلومات مؤكدة من الذاكرة المعرفية الخاصة بمنصة GeoDev — اعتمد عليها كحقائق أساسية في إجابتك]:\n" +
        scored.map(x => `- ${x.it.t}: ${x.it.s}`).join("\n");
    } catch (_) {
      return "";
    }
  }

  /* ==========================================================================
     2. الجسر المباشر لمحرك البحث الحقيقي Tavily (/search في Cloudflare Worker)
     ========================================================================== */
  async function fetchRealWebSearch(query) {
    if (!window.GEO_API || typeof window.geoToken !== "function") return "";
    const user = window.firebase?.auth?.().currentUser;
    if (!user) return "";

    try {
      const token = await window.geoToken();
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 8500);

      const res = await fetch(window.GEO_API + "/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },
        body: JSON.stringify({ query: query.slice(0, 350) }),
        signal: ctrl.signal
      });
      clearTimeout(timer);

      if (!res.ok) return "";
      const data = await res.json().catch(() => null);
      if (!data || !Array.isArray(data.results) || !data.results.length) return "";

      const formatted = data.results.slice(0, 5).map((r, i) =>
        `[${i + 1}] العنوان: ${r.title || ""}\nالرابط: ${r.url || ""}\nالمقتطف: ${(r.content || "").slice(0, 350)}`
      ).join("\n\n");

      return `\n\n[نتائج البحث الحي من الإنترنت عبر محرك Tavily — استخدم الروابط والمعلومات الحقيقية التالية في إجابتك ولا تقل لا يوجد دليل إذا كانت الإجابة موجودة هنا]:\n` +
        (data.answer ? `ملخص محرك البحث: ${data.answer}\n\n` : "") +
        formatted;
    } catch (_) {
      return "";
    }
  }

  /* ==========================================================================
     3. ترقية الدالة webCtx و ask لدمج الذاكرة المعرفية + البحث الحي
     ========================================================================== */
  const _origWebCtx = window.webCtx;
  window.webCtx = async function (q) {
    const kbText = getKBContext(q);
    let webText = await fetchRealWebSearch(q);

    // إذا لم يرجع Tavily نتائج (مثلاً بسبب انتهاء الحصة اليومية)، نستخدم البحث الاحتياطي القديم
    if (!webText && typeof _origWebCtx === "function") {
      try {
        webText = await Promise.race([
          _origWebCtx(q),
          new Promise(r => setTimeout(() => r(""), 5000))
        ]);
      } catch (_) {}
    }

    return kbText + webText;
  };

  // حقن السياق المعرفي والبحثي في المساعد العام حتى في المحركات المتوازنة عند السؤال عن أشخاص أو قنوات أو معلومات حديثة
  const _origAsk = window.ask;
  if (typeof _origAsk === "function") {
    window.ask = async function (prompt, shown) {
      const displayQuery = shown || prompt;
      const isCodeReq = /(?:اكتب\s*كود|كود|برمج|صمم|تصميم|موقع|صفحة|html|css|js\b|python|sql|civil|autolisp)/i.test(displayQuery);
      const isGreeting = /^(?:اهلا|أهلا|مرحبا|مرحبًا|السلام عليكم|ازيك|كيف حالك|شكرا|شكرًا)[\s!؟.]*$/i.test(displayQuery.trim());

      let enrichedPrompt = prompt;
      const currentEng = window.eng || "g29";

      // لو المحرك هو 5.2 ULTRA أو السؤال عن معلومات/قنوات/كتب/أشخاص ومش كود أو تحية
      if (!isCodeReq && !isGreeting && (!window.AT || !window.AT.length)) {
        const kbHit = getKBContext(displayQuery);
        if (currentEng === "g52") {
          // في 5.2 نضمن تنفيذ البحث الحقيقي حتى لو النموذج رجع للبديل gpt-oss-120b
          const liveSearch = await fetchRealWebSearch(displayQuery);
          if (kbHit || liveSearch) {
            enrichedPrompt += kbHit + liveSearch;
          }
        } else if (kbHit) {
          // في 2.9 و 3.8 نحقن الذاكرة المعرفية المعتمدة فوراً لسرعة الرد ودقته
          enrichedPrompt += kbHit;
        }
      }

      return _origAsk(enrichedPrompt, shown);
    };
  }

  /* ==========================================================================
     4. بناء واجهة إدارة الذاكرة المعرفية داخل لوحة الإدارة (#s-admin)
     ========================================================================== */
  function getKBItems() {
    try {
      const kb = JSON.parse(localStorage.getItem("gd_kb") || '{"items":[]}');
      return Array.isArray(kb.items) ? kb.items : [];
    } catch (_) {
      return [];
    }
  }

  function saveKBItems(items) {
    localStorage.setItem("gd_kb", JSON.stringify({ items }));
  }

  function renderKBAdminList() {
    const box = $("kbAdminList");
    if (!box) return;
    const items = getKBItems();
    if (!items.length) {
      box.innerHTML = `<div class="mt">لا توجد عناصر محفوظة في الذاكرة المعرفية بعد.</div>`;
      return;
    }

    box.innerHTML = items.map((it, idx) => `
      <div style="background:var(--bg);border:1px solid var(--ln);border-radius:10px;padding:10px;margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
          <b style="color:var(--bl);font-size:13px">${esc(it.t || "معلومة")}</b>
          <button type="button" class="r" style="padding:3px 9px;font-size:11px;min-height:26px" onclick="window.GEOAIBrainDeleteKB(${idx})">حذف</button>
        </div>
        <div class="mt" style="margin-top:4px;line-height:1.7;overflow-wrap:anywhere">${esc(it.s || "")}</div>
      </div>
    `).join("");
  }

  window.GEOAIBrainAddKB = function () {
    const title = $("kbNewTitle")?.value.trim();
    const summary = $("kbNewSummary")?.value.trim();
    if (!title || !summary) {
      return window.toast && window.toast("اكتب العنوان والتفاصيل أو الروابط أولاً", "warn");
    }
    const items = getKBItems();
    items.unshift({
      d: new Date().toISOString().slice(0, 10),
      t: title,
      s: summary
    });
    saveKBItems(items);
    $("kbNewTitle").value = "";
    $("kbNewSummary").value = "";
    renderKBAdminList();
    if (window.toast) window.toast("تمت إضافة المعلومة لذاكرة الذكاء الاصطناعي بنجاح", "success");
  };

  window.GEOAIBrainDeleteKB = function (index) {
    const items = getKBItems();
    items.splice(index, 1);
    saveKBItems(items);
    renderKBAdminList();
    if (window.toast) window.toast("تم الحذف من الذاكرة المعرفية", "info");
  };

  function injectAdminKBPanel() {
    const adminPanel = $("adminPanel");
    if (!adminPanel || $("gdKBAdminCard")) return;

    const cardHtml = `
      <div class="card" id="gdKBAdminCard" style="border-color:var(--bl)">
        <h3>🧠 الذاكرة المعرفية المخصصة للمساعد الذكي (Knowledge Base)</h3>
        <p class="mt" style="line-height:1.7">
          أضف هنا أسماء المحاضرين، قنوات اليوتيوب المعتمدة، روابط المكتبات، أو أي معلومات تخصصية تريد أن يجيب بها المساعد الذكي فوراً وبدقة 100%.
        </p>
        <input id="kbNewTitle" placeholder="العنوان أو الكلمات المفتاحية (مثال: قناة المهندس هشام فوزي Civil 3D)">
        <textarea id="kbNewSummary" rows="3" placeholder="التفاصيل والروابط المباشرة التي سيستخدمها المساعد في إجابته..."></textarea>
        <button type="button" class="g" style="width:100%;margin-bottom:12px" onclick="window.GEOAIBrainAddKB()">
          ➕ حفظ في ذاكرة الذكاء الاصطناعي
        </button>
        <div id="kbAdminList" style="max-height:280px;overflow-y:auto"></div>
      </div>
    `;

    const sysCard = $("adminSys")?.closest(".card");
    if (sysCard) {
      sysCard.insertAdjacentHTML("beforebegin", cardHtml);
    } else {
      adminPanel.insertAdjacentHTML("beforeend", cardHtml);
    }
    renderKBAdminList();
  }

  function init() {
    injectAdminKBPanel();
    if (typeof window.adminLoad === "function") {
      const _al = window.adminLoad;
      window.adminLoad = function () {
        _al.apply(this, arguments);
        injectAdminKBPanel();
        renderKBAdminList();
      };
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
