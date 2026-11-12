/* GeoDev Academy Extras v1
   - أيقونة الأكاديمية الرسمية (Lucide) بدل الإيموجي
   - ربط المدرس الذكي بتحكم الأدمن (مجاني / PRO / مقفول)
   - زر + (صورة / كاميرا / ملف) وزر الميكروفون في شريط المدرس الذكي
   ضعه بعد geo-academy-engines.js:  <script src="geo-academy-extras.js"></script> */
(function () {
  "use strict";
  if (window.GEOAcademyExtras) return;
  window.GEOAcademyExtras = true;

  const $ = id => document.getElementById(id);
  const say = (m, t) => { try { if (typeof window.toast === "function") window.toast(m, t || "info"); } catch (_) {} };
  const MAX_FILES = 4, MAX_TEXT = 60000, MAX_IMG = 8 * 1024 * 1024;
  const TEXT_RE = /\.(txt|md|csv|json|geojson|kml|gpx|xml|py|js|html|css|sql|ya?ml)$/i;
  const TEXT_ACCEPT = ".txt,.md,.csv,.json,.geojson,.kml,.gpx,.xml,.py,.js,.html,.css,.sql,.yaml,.yml";

  let pending = [];
  let rec = null;

  /* ---------- أيقونات Lucide ---------- */
  function paint(root) {
    try {
      if (window.lucide && typeof window.lucide.createIcons === "function") {
        window.lucide.createIcons({ root: root || document, attrs: { "stroke-width": 1.8 } });
      }
    } catch (_) {}
  }

  /* ---------- تنسيق ---------- */
  function injectCss() {
    if ($("academyExtrasCss")) return;
    const s = document.createElement("style");
    s.id = "academyExtrasCss";
    s.textContent = `
#s-academy .academy-header h2 svg{width:27px;height:27px;color:#7dd3fc;flex:0 0 auto}
#s-academy .tc-row{position:relative;display:flex;align-items:flex-end;gap:8px;margin-bottom:9px}
#s-academy .teacher-composer .tc-row textarea{flex:1 1 auto;min-width:0;margin:0;min-height:58px;max-height:170px}
#s-academy .teacher-composer .tc-ic{flex:0 0 46px;width:46px;height:46px;min-height:46px;padding:0;border-radius:13px;display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--ln,var(--border,#334155));background:var(--bg,#101827);color:var(--tx,#e8edf7);cursor:pointer;transition:background .15s,border-color .15s}
#s-academy .teacher-composer .tc-ic svg{width:21px;height:21px}
#s-academy .teacher-composer .tc-ic:active{transform:scale(.95)}
#s-academy .teacher-composer .tc-ic[aria-expanded="true"]{background:#176b87;border-color:#176b87;color:#fff}
#s-academy .teacher-composer .tc-mic.rec{background:#dc2626;border-color:#dc2626;color:#fff;animation:tcPulse 1.2s ease-in-out infinite}
@keyframes tcPulse{0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,.5)}50%{box-shadow:0 0 0 9px rgba(220,38,38,0)}}
#s-academy .tc-menu{position:absolute;bottom:calc(100% + 8px);right:0;z-index:30;min-width:220px;padding:6px;border-radius:14px;background:var(--cd,var(--card,#182334));border:1px solid var(--ln,var(--border,#334155));box-shadow:0 14px 34px rgba(0,0,0,.45)}
#s-academy .tc-menu[hidden]{display:none}
#s-academy .teacher-composer .tc-menu button{width:100%;min-height:46px;display:flex;align-items:center;justify-content:flex-start;gap:11px;padding:0 12px;border:0;border-radius:10px;background:none;color:inherit;font:inherit;font-weight:600;text-align:right;cursor:pointer}
#s-academy .teacher-composer .tc-menu button:hover,#s-academy .teacher-composer .tc-menu button:focus-visible{background:rgba(56,189,248,.12)}
#s-academy .tc-menu svg{width:19px;height:19px;color:#38bdf8;flex:0 0 auto}
#s-academy .tc-chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:9px}
#s-academy .tc-chips:empty{display:none}
#s-academy .tc-chip{display:inline-flex;align-items:center;gap:6px;max-width:100%;padding:5px 6px 5px 11px;border-radius:20px;background:rgba(56,189,248,.12);border:1px solid rgba(56,189,248,.25);font-size:12px}
#s-academy .tc-chip svg{width:14px;height:14px;flex:0 0 auto;color:#38bdf8}
#s-academy .tc-chip span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:46vw}
#s-academy .teacher-composer .tc-chip button{width:22px;height:22px;min-height:0;padding:0;border:0;border-radius:50%;background:rgba(148,163,184,.2);color:inherit;font-size:13px;line-height:1;cursor:pointer}
#s-academy .tc-att{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;font-size:12px;opacity:.85}
#s-academy .tc-att b{font-weight:600;padding:3px 9px;border-radius:14px;background:rgba(148,163,184,.18)}
@media(prefers-reduced-motion:reduce){#s-academy .teacher-composer .tc-mic.rec{animation:none}}
`;
    document.head.appendChild(s);
  }

  /* ---------- 1) الأيقونة الرسمية ---------- */
  function fixNav() {
    const btn = document.querySelector('nav button[data-t="academy"]');
    if (btn && !btn.querySelector(".nav-icon")) {
      btn.innerHTML = '<span class="nav-icon"><i data-lucide="graduation-cap"></i></span>الأكاديمية';
      paint(btn);
    }
    const h2 = document.querySelector("#s-academy .academy-header h2");
    if (h2 && !h2.querySelector("svg,i")) {
      h2.innerHTML = '<i data-lucide="graduation-cap"></i> الأكاديمية الجغرافية';
      paint(h2);
    }
  }

  /* ---------- 2) تحكم الأدمن في المدرس الذكي ---------- */
  function teacherState() {
    return typeof window.geoFeatureState === "function" ? window.geoFeatureState("teacher") : "free";
  }
  function gate() {
    const s = teacherState();
    if (s === "off") { say("المدرس الذكي مغلق حالياً", "warn"); return false; }
    if (s === "pro" && typeof window.needPro === "function" && window.needPro()) return false;
    return true;
  }
  function syncTab() {
    const tab = document.querySelector('[data-academy-tab="teacher"]');
    if (tab) tab.style.display = teacherState() === "off" ? "none" : "";
  }
  document.addEventListener("click", e => {
    const t = e.target && e.target.closest && e.target.closest('[data-academy-tab="teacher"],#academyTeacherSend');
    if (t && !gate()) { e.preventDefault(); e.stopImmediatePropagation(); }
  }, true);
  document.addEventListener("geo:cfg", syncTab);

  /* ---------- المرفقات ---------- */
  function drawChips() {
    const box = document.querySelector("#s-academy .tc-chips");
    if (!box) return;
    box.textContent = "";
    pending.forEach((a, i) => {
      const chip = document.createElement("span");
      chip.className = "tc-chip";
      chip.innerHTML = '<i data-lucide="' + (a.kind === "image" ? "image" : "file-text") + '"></i>';
      const name = document.createElement("span");
      name.textContent = a.name;
      const del = document.createElement("button");
      del.type = "button";
      del.setAttribute("aria-label", "حذف المرفق");
      del.textContent = "×";
      del.addEventListener("click", () => { pending.splice(i, 1); drawChips(); });
      chip.append(name, del);
      box.appendChild(chip);
    });
    paint(box);
  }

  async function addFiles(list) {
    for (const f of Array.from(list || [])) {
      if (pending.length >= MAX_FILES) { say("الحد الأقصى " + MAX_FILES + " مرفقات في الرسالة", "warn"); break; }
      if (f.type && f.type.startsWith("image/")) {
        if (f.size > MAX_IMG) { say("الصورة كبيرة جداً: " + f.name, "warn"); continue; }
        pending.push({ kind: "image", name: f.name || "صورة", file: f });
      } else if (TEXT_RE.test(f.name || "")) {
        try {
          pending.push({ kind: "text", name: f.name, text: (await f.text()).slice(0, MAX_TEXT) });
        } catch (_) { say("تعذر قراءة الملف: " + f.name, "error"); }
      } else {
        say("نوع الملف غير مدعوم: " + (f.name || ""), "warn");
      }
    }
    drawChips();
  }

  /* ---------- الصوت (إملاء بالعربية) ---------- */
  function toggleVoice(btn, ta) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return say("التعرف على الصوت غير مدعوم في هذا المتصفح", "warn");
    if (rec) { try { rec.stop(); } catch (_) {} return; }
    const r = new SR();
    rec = r;
    r.lang = "ar-EG";
    r.interimResults = true;
    r.continuous = false;
    const base = ta.value ? ta.value.replace(/\s*$/, " ") : "";
    let finalText = "";
    r.onstart = () => { btn.classList.add("rec"); btn.setAttribute("aria-pressed", "true"); say("جاري الاستماع... تحدث الآن", "info"); };
    r.onresult = e => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) finalText += res[0].transcript + " "; else interim += res[0].transcript;
      }
      ta.value = (base + finalText + interim).trim();
    };
    r.onerror = e => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") say("اسمح للمتصفح باستخدام الميكروفون", "error");
      else if (e.error !== "no-speech" && e.error !== "aborted") say("تعذر التعرف على الصوت (" + e.error + ")", "error");
    };
    r.onend = () => { btn.classList.remove("rec"); btn.setAttribute("aria-pressed", "false"); rec = null; };
    try { r.start(); } catch (err) { rec = null; say((err && err.message) || "تعذر تشغيل الميكروفون", "error"); }
  }

  /* ---------- 3) شريط المدرس: + والميكروفون ---------- */
  function enhanceComposer() {
    const box = document.querySelector("#s-academy .teacher-composer:not([data-tc])");
    if (!box) return;
    const ta = box.querySelector("textarea");
    if (!ta) return;
    box.dataset.tc = "1";

    const row = document.createElement("div");
    row.className = "tc-row";
    ta.parentNode.insertBefore(row, ta);

    const plus = document.createElement("button");
    plus.type = "button";
    plus.className = "tc-ic tc-plus";
    plus.setAttribute("aria-label", "إرفاق صورة أو ملف");
    plus.setAttribute("aria-haspopup", "true");
    plus.setAttribute("aria-expanded", "false");
    plus.innerHTML = '<i data-lucide="plus"></i>';

    const mic = document.createElement("button");
    mic.type = "button";
    mic.className = "tc-ic tc-mic";
    mic.setAttribute("aria-label", "التحدث بالصوت");
    mic.setAttribute("aria-pressed", "false");
    mic.innerHTML = '<i data-lucide="mic"></i>';

    const menu = document.createElement("div");
    menu.className = "tc-menu";
    menu.hidden = true;
    menu.innerHTML =
      '<button type="button" data-pick="gallery"><i data-lucide="image"></i>صورة من المعرض</button>' +
      '<button type="button" data-pick="camera"><i data-lucide="camera"></i>التقاط صورة</button>' +
      '<button type="button" data-pick="file"><i data-lucide="file-text"></i>ملف نصي</button>';

    const chips = document.createElement("div");
    chips.className = "tc-chips";

    const mk = (accept, capture) => {
      const i = document.createElement("input");
      i.type = "file"; i.hidden = true; i.multiple = !capture; i.accept = accept;
      if (capture) i.setAttribute("capture", "environment");
      i.addEventListener("change", () => { addFiles(i.files); i.value = ""; });
      return i;
    };
    const inputs = { gallery: mk("image/*"), camera: mk("image/*", true), file: mk(TEXT_ACCEPT) };

    row.append(plus, ta, mic, menu, inputs.gallery, inputs.camera, inputs.file);
    box.insertBefore(chips, row);

    const closeMenu = () => { menu.hidden = true; plus.setAttribute("aria-expanded", "false"); };
    plus.addEventListener("click", () => {
      const open = menu.hidden;
      menu.hidden = !open;
      plus.setAttribute("aria-expanded", String(open));
    });
    menu.addEventListener("click", e => {
      const b = e.target.closest("[data-pick]");
      if (!b) return;
      closeMenu();
      inputs[b.dataset.pick].click();
    });
    mic.addEventListener("click", () => toggleVoice(mic, ta));
    box.addEventListener("keydown", e => { if (e.key === "Escape") closeMenu(); });
    document.addEventListener("click", e => { if (!menu.hidden && !e.target.closest(".tc-menu,.tc-plus")) closeMenu(); });

    paint(row);
    drawChips();
  }

  /* ---------- إرسال المرفقات مع سؤال المدرس ---------- */
  async function describeImages(files) {
    if (typeof window.callAI !== "function") throw new Error("محرك قراءة الصور غير متصل");
    const r = await window.callAI(
      "اقرأ الصورة بدقة. انسخ أي نص أو أرقام أو معادلات أو جداول ظاهرة فيها كما هي، ثم صف المحتوى الجغرافي أو الهندسي أو الخريطة أو الرسم (العناصر والرموز والقيم). اكتب بالعربية بإيجاز ودون تخمين.",
      { images: files, tier: "quick" }
    );
    const t = String((r && r.text) || "").trim();
    if (!t) throw new Error("لم أتمكن من قراءة الصورة");
    return t.slice(0, 6000);
  }

  async function buildExtra(att) {
    let t = "";
    const texts = att.filter(a => a.kind === "text");
    if (texts.length) t += "\n\n[ملفات مرفقة من الطالب]\n" + texts.map(f => "### " + f.name + "\n```\n" + f.text + "\n```").join("\n");
    const imgs = att.filter(a => a.kind === "image");
    if (imgs.length) t += "\n\n[وصف الصور المرفقة من الطالب]\n" + await describeImages(imgs.map(i => i.file));
    return t;
  }

  function markBubble(att) {
    const bubbles = document.querySelectorAll("#academyTeacherMessages .teacher-user .teacher-bubble");
    const b = bubbles[bubbles.length - 1];
    if (!b || b.querySelector(".tc-att")) return;
    const wrap = document.createElement("div");
    wrap.className = "tc-att";
    att.forEach(a => { const s = document.createElement("b"); s.textContent = a.name; wrap.appendChild(s); });
    b.appendChild(wrap);
  }

  function hookEngine() {
    const E = window.GEOAcademyEngines;
    if (!E || typeof E.teacherChat !== "function") return false;
    if (E.teacherChat.__extras) return true;
    const orig = E.teacherChat.bind(E);
    const wrapped = async function (messages, subject, ...rest) {
      const att = pending.slice();
      if (!att.length) return orig(messages, subject, ...rest);
      markBubble(att);
      const extra = await buildExtra(att);
      const copy = messages.map(m => Object.assign({}, m));
      const last = copy[copy.length - 1];
      if (last && last.role === "user") last.content = String(last.content || "") + extra;
      const answer = await orig(copy, subject, ...rest);
      pending = [];
      drawChips();
      return answer;
    };
    wrapped.__extras = true;
    try { E.teacherChat = wrapped; } catch (_) { return false; }
    return true;
  }

  /* ---------- تشغيل ---------- */
  function refresh() {
    injectCss();
    fixNav();
    syncTab();
    enhanceComposer();
    hookEngine();
  }

  function watch() {
    refresh();
    const sec = $("s-academy");
    if (!sec) { if (watch.n++ < 20) setTimeout(watch, 500); return; }
    let q = false;
    const go = () => { if (q) return; q = true; requestAnimationFrame(() => { q = false; refresh(); }); };
    new MutationObserver(go).observe(sec, { childList: true, subtree: true });
    const nav = document.querySelector("nav");
    if (nav) new MutationObserver(go).observe(nav, { childList: true });
  }
  watch.n = 0;

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", watch);
  else watch();
})();
