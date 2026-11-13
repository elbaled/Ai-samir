/* ============================================================================
   GeoDev AI Brain, Fallback & Clean Formatting v2.0 (geo-ai-brain.js)
   1. فصل سؤال المستخدم النظيف عن السياق المعرفي ونتائج البحث (لا يظهر في الفقاعة).
   2. معالجة خطأ HTTP 502/503/504 في GEO 5.2 ULTRA والتحويل التلقائي للنموذج البديل.
   3. تحسين تنسيق وستايل الإجابات في الشات العام لتكون منظمة واحترافية.
   ============================================================================ */

(function () {
  "use strict";
  if (window.GEOAIBrainV2) return;
  window.GEOAIBrainV2 = true;

  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));

  /* ==========================================================================
     1. تنسيق وستايل احترافي لإجابات المساعد العام (Clean Assistant Typography)
     ========================================================================== */
  function injectCleanChatStyle() {
    if ($("geoCleanChatStyle")) return;
    const st = document.createElement("style");
    st.id = "geoCleanChatStyle";
    st.textContent = `
      #chat .m.u {
        max-width: 85%;
        margin-right: auto;
        margin-left: 0;
        border-radius: 18px 18px 4px 18px !important;
        padding: 11px 15px !important;
        font-size: 14px !important;
        line-height: 1.75 !important;
      }
      #chat .m.a {
        width: 100% !important;
        max-width: 100% !important;
        padding: 10px 4px 16px !important;
        font-size: 14.5px !important;
        line-height: 1.95 !important;
        color: var(--tx) !important;
      }
      #chat .m.a h1, #chat .m.a h2, #chat .m.a h3 {
        color: var(--tx);
        font-weight: 800;
        margin: 18px 0 8px;
        line-height: 1.5;
      }
      #chat .m.a h2 {
        font-size: 17px;
        padding-bottom: 6px;
        border-bottom: 1px solid var(--ln);
      }
      #chat .m.a h3 { font-size: 15.5px; color: var(--bl); }
      #chat .m.a p { margin: 8px 0; }
      #chat .m.a ul, #chat .m.a ol {
        padding-right: 22px;
        margin: 8px 0;
      }
      #chat .m.a li {
        margin: 6px 0;
        line-height: 1.85;
      }
      #chat .m.a a {
        color: var(--bl);
        font-weight: 700;
        text-decoration: underline;
        word-break: break-word;
      }
      #chat .m.a blockquote {
        margin: 12px 0;
        padding: 10px 14px;
        border-right: 3px solid var(--bl);
        background: color-mix(in srgb, var(--bl) 8%, transparent);
        border-radius: 8px;
      }
      #chat .m.a table {
        width: 100%;
        border-collapse: collapse;
        margin: 12px 0;
        display: block;
        overflow-x: auto;
        font-size: 13px;
      }
      #chat .m.a th {
        background: color-mix(in srgb, var(--bl) 15%, var(--cd));
        color: var(--bl);
        font-weight: 800;
        padding: 8px 10px;
      }
      #chat .m.a td {
        padding: 8px 10px;
      }
    `;
    document.head.appendChild(st);
  }

  /* ==========================================================================
     2. البحث في الذاكرة المعرفية المحلية (gd_kb)
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
        .slice(0, 4);

      if (!scored.length) return "";

      return "\n\n[معلومات مرجعية مؤكدة من قاعدة بيانات المنصة — استخدمها إذا كانت مرتبطة بالسؤال]:\n" +
        scored.map(x => `- ${x.it.t}: ${x.it.s}`).join("\n");
    } catch (_) {
      return "";
    }
  }

  /* ==========================================================================
     3. الجسر المباشر لمحرك البحث الحقيقي Tavily (/search في Cloudflare Worker)
     ========================================================================== */
  async function fetchRealWebSearch(query) {
    if (!window.GEO_API || typeof window.geoToken !== "function") return "";
    const user = window.firebase?.auth?.().currentUser;
    if (!user) return "";

    try {
      const token = await window.geoToken();
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 7000);

      const res = await fetch(window.GEO_API + "/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },
        body: JSON.stringify({ query: query.slice(0, 300) }),
        signal: ctrl.signal
      });
      clearTimeout(timer);

      if (!res.ok) return "";
      const data = await res.json().catch(() => null);
      if (!data || !Array.isArray(data.results) || !data.results.length) return "";

      const formatted = data.results.slice(0, 4).map((r, i) =>
        `[${i + 1}] ${r.title || ""} (${r.url || ""}): ${(r.content || "").slice(0, 260)}`
      ).join("\n");

      return `\n\n[نتائج بحث الويب الحية عبر Tavily — اعتمد على هذه الروابط الحقيقية]:\n` +
        (data.answer ? `ملخص: ${data.answer}\n` : "") +
        formatted;
    } catch (_) {
      return "";
    }
  }

  /* ==========================================================================
     4. إصلاح خطأ HTTP 502 في GEO 5.2 ULTRA (التحويل التلقائي للنموذج البديل)
     ========================================================================== */
  const _origCallAI = window.callAI;
  if (typeof _origCallAI === "function") {
    window.callAI = async function (prompt, o = {}) {
      try {
        return await _origCallAI(prompt, o);
      } catch (err) {
        const msg = String(err?.message || "");
        // إذا حدث 502/503/504 في 5.2 ULTRA (groq/compound)، نحول فوراً إلى gpt-oss-120b
        if (/HTTP 50[234]|rate_limited/i.test(msg) && window.eng === "g52") {
          window.__engCall = false; // تجاوز groq/compound واستخدام المسار المباشر المستقر
          if (typeof window.toast === "function") {
            window.toast("تم التحويل للمحرك البديل المستقر...", "info");
          }
          return await _origCallAI(prompt, {
            ...o,
            cfgOverride: { model: "openai/gpt-oss-120b" }
          });
        }
        throw err;
      }
    };
  }

  /* ==========================================================================
     5. تمرير السياق للذكاء الاصطناعي مع إبقاء فقاعة سؤال المستخدم نظيفة تماماً
     ========================================================================== */
  const _origAsk = window.ask;
  if (typeof _origAsk === "function") {
    window.ask = async function (prompt, shown) {
      // الحفاظ على نص سؤال المستخدم الأصلي نظيفاً للعرض في الشات
      const cleanUserText = shown || prompt;

      const isCodeReq = /(?:اكتب\s*كود|كود|برمج|صمم|تصميم|موقع|صفحة|html|css|js\b|python|sql|civil|autolisp)/i.test(cleanUserText);
      const isGreeting = /^(?:اهلا|أهلا|مرحبا|مرحبًا|السلام عليكم|ازيك|كيف حالك|شكرا|شكرًا)[\s!؟.]*$/i.test(cleanUserText.trim());

      let aiPrompt = prompt;
      const currentEng = window.eng || "g29";

      if (!isCodeReq && !isGreeting && (!window.AT || !window.AT.length)) {
        const kbHit = getKBContext(cleanUserText);
        if (currentEng === "g52") {
          const liveSearch = await fetchRealWebSearch(cleanUserText);
          if (kbHit || liveSearch) {
            aiPrompt += kbHit + liveSearch;
          }
        } else if (kbHit) {
          aiPrompt += kbHit;
        }
      }

      // تعليمات تنظيم وتنسيق الرد للموديل
      aiPrompt += "\n\n(التزم بتنظيم الإجابة في فقرات قصيرة وعناوين واضحة ونقاط مرتبة وروابط مباشرة قابلة للنقر، وتجنب الجداول الطويلة غير الضرورية على شاشة الموبايل).";

      // نمرر aiPrompt للموديل، و cleanUserText للعرض في فقاعة المستخدم
      return _origAsk(aiPrompt, cleanUserText);
    };
  }

  /* ==========================================================================
     6. لوحة إدارة الذاكرة المعرفية في قسم الإدارة (#s-admin)
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
    items.unshift({ d: new Date().toISOString().slice(0, 10), t: title, s: summary });
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
        <input id="kbNewTitle" placeholder="العنوان أو الكلمات المفتاحية (مثال: كورس تحليل الشبكات Network Analyst)">
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
    injectCleanChatStyle();
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
