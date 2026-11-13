/* ============================================================================
   GeoDev AI Architect v2.0 (True AI Agent + Smart Architectural Proportioning)
   & Heron Triangles Surveying Suite
   ============================================================================ */

(function () {
  "use strict";
  if (window.GEOArchitectHeron_V2) return;
  window.GEOArchitectHeron_V2 = true;

  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));
  const num = id => parseFloat($(id)?.value) || 0;

  let currentArchStage = "2d"; // '2d' | '3d' | 'furnished'
  let heronTriangles = [{ a: 30, b: 40, c: 50 }];

  /* ==========================================================================
     1. واجهة الأداتين في قسم المساحة (#surveyGrid)
     ========================================================================== */
  const ARCHITECT_HERON_TOOLS = [
    {
      id: "ai-architect",
      icon: "building-2",
      title: "الأوتوكاد المعماري الذكي (AI)",
      desc: "تصميم البيوت 2D و 3D والفرش + تكلفة البناء",
      body: `
        <div class="tool-section" style="border-color:var(--am)">
          <h4><i data-lucide="bot"></i> مساعد التصميم المعماري الذكي (AI Architect Agent)</h4>
          <p class="mt" style="line-height:1.7">
            اكتب فكرة تصميم بيتك بحرية (المساحة أو الأبعاد، الغرف، موقع الباب الرئيسي والخاص، موقع السلم، الشوارع، الارتفاع، وسمك الحوائط):
          </p>
          <textarea id="archPromptText" rows="3" class="c" placeholder="مثال: عاوز أصمم بيت 88 متر (8×11)، أوضتين وريسبشن وصالة وحمام ومطبخ، الباب الرئيسي على الشارع العمومي والباب الخاص على الشارع الخاص، والسلم للأدوار العلوية من الشارع الخاص، ارتفاع البناء 7 متر والحائط 25 سم"></textarea>
          <div class="row" style="margin-top:8px">
            <button type="button" id="archAgentBtn" class="a" style="flex:2" onclick="window.GEOArchRunAgent()">تحليل الوصف وتصميم اللوحة بالـ AI</button>
            <button type="button" class="k" style="flex:1" onclick="window.GEOArchLoadExample88()">مثال 88 م²</button>
          </div>
          <div id="archAgentLog" style="margin-top:8px;font-size:12.5px;line-height:1.7;color:var(--gr)"></div>
        </div>

        <div class="tool-section">
          <h4><i data-lucide="maximize-2"></i> 1. أبعاد قطعة الأرض والحدود (بالمتر)</h4>
          <div class="form-grid">
            <label>الضلع العلوي (الواجهة الرئيسية) <input id="archTop" type="number" step="any" value="8" class="c"></label>
            <label>الضلع السفلي (الواجهة الخلفية) <input id="archBottom" type="number" step="any" value="8" class="c"></label>
            <label>الضلع الأيمن (يمين) <input id="archRight" type="number" step="any" value="11" class="c"></label>
            <label>الضلع الأيسر (يسار / الشارع الخاص) <input id="archLeft" type="number" step="any" value="11" class="c"></label>
          </div>
          <div class="form-grid">
            <label>اسم الشارع الرئيسي (العلوي) <input id="archMainStreet" class="c" value="الشارع العمومي (بحري)"></label>
            <label>اسم الشارع الجانبي (الأيسر) <input id="archPrivStreet" class="c" value="الشارع الخاص (غربي)"></label>
          </div>
        </div>

        <div class="tool-section">
          <h4><i data-lucide="sliders"></i> 2. الإعدادات المعمارية والإنشائية</h4>
          <div class="form-grid">
            <label>عدد غرف النوم <input id="archRooms" type="number" min="1" max="5" value="2" class="c"></label>
            <label>عدد الحمامات <input id="archBaths" type="number" min="1" max="3" value="1" class="c"></label>
            <label>ارتفاع البناء الكلي (من الأساس للسطح - م) <input id="archHeight" type="number" step="0.5" value="7" class="c"></label>
            <label>سمك الحوائط الخارجية
              <select id="archWallThick" class="c">
                <option value="25" selected>25 سم (طوب كامل)</option>
                <option value="12">12 سم (نصف طوبة)</option>
              </select>
            </label>
          </div>
          <div class="form-grid">
            <label>موقع الباب الرئيسي
              <select id="archMainDoorPos" class="c">
                <option value="top" selected>الواجهة الرئيسية (الشارع العمومي)</option>
                <option value="right">الضلع الأيمن</option>
                <option value="left">الضلع الأيسر</option>
                <option value="bottom">الواجهة الخلفية</option>
              </select>
            </label>
            <label>موقع الباب الخاص والسلم العلوي
              <select id="archStairPos" class="c">
                <option value="left" selected>الجانب الأيسر (الشارع الخاص)</option>
                <option value="right">الجانب الأيمن</option>
                <option value="top">الواجهة الأمامية</option>
                <option value="bottom">الواجهة الخلفية</option>
              </select>
            </label>
          </div>
          <div class="form-grid">
            <label>إظهار المحاور والأعمدة
              <select id="archShowAxes" class="c">
                <option value="1" selected>إظهار المحاور والأعمدة</option>
                <option value="0">إخفاء المحاور</option>
              </select>
            </label>
            <label>منور التهوية
              <select id="archShaft" class="c">
                <option value="1" selected>إضافة منور خدمة</option>
                <option value="0">بدون منور</option>
              </select>
            </label>
          </div>
        </div>

        <div class="row" style="margin:10px 0">
          <button type="button" class="g" style="flex:2" onclick="window.GEOArchRenderAll()">توليد اللوحة وحساب التكلفة</button>
          <button type="button" class="a" style="flex:1" onclick="window.GEOArchExportDXF()">تصدير DXF</button>
          <button type="button" class="k" style="flex:1" onclick="window.GEOArchSavePNG()">حفظ صورة</button>
        </div>

        <div class="row" style="margin-bottom:10px;background:var(--bg);padding:6px;border-radius:12px;border:1px solid var(--ln)">
          <button type="button" id="btnStage2D" class="a" style="flex:1;font-size:12px" onclick="window.GEOArchSetStage('2d')">1. مخطط 2D إنشائي</button>
          <button type="button" id="btnStage3D" class="k" style="flex:1;font-size:12px" onclick="window.GEOArchSetStage('3d')">2. مجسم 3D بالارتفاع</button>
          <button type="button" id="btnStageFurn" class="k" style="flex:1;font-size:12px" onclick="window.GEOArchSetStage('furnished')">3. التشطيب والفرش</button>
        </div>

        <div style="overflow-x:auto">
          <canvas id="archCanvas" width="840" height="640" style="width:100%;max-width:100%;height:auto;border-radius:14px;border:1px solid var(--ln);background:#08101a"></canvas>
        </div>

        <div id="archCostReport" class="result-box" style="display:block;margin-top:12px"></div>
      `
    },
    {
      id: "heron-triangles",
      icon: "triangle",
      title: "المساحات ورسم المثلثات (هيرون)",
      desc: "رفع الأراضي غير المنتظمة ورسم المثلثات بالأبعاد",
      body: `
        <div class="tool-section">
          <h4><i data-lucide="plus-circle"></i> إضافة مثلث جديد للرفعة المساحية</h4>
          <div class="form-grid">
            <label>الضلع الأول (A) بالمتر <input id="hrA" type="number" step="any" value="30" class="c"></label>
            <label>الضلع الثاني (B) بالمتر <input id="hrB" type="number" step="any" value="40" class="c"></label>
            <label>الضلع الثالث / الوتر (C) <input id="hrC" type="number" step="any" value="50" class="c"></label>
          </div>
          <div class="row" style="margin-top:8px">
            <button type="button" class="a" style="flex:2" onclick="window.GEOHeronAdd()">+ إضافة المثلث</button>
            <button type="button" class="r" style="flex:1" onclick="window.GEOHeronClear()">مسح الكل</button>
          </div>
        </div>

        <div class="tool-section">
          <h4><i data-lucide="table"></i> جدول المثلثات المضافة</h4>
          <div style="overflow-x:auto">
            <table class="pt">
              <thead>
                <tr>
                  <th>#</th>
                  <th>ضلع A</th>
                  <th>ضلع B</th>
                  <th>ضلع C</th>
                  <th>المساحة (م²)</th>
                  <th>حذف</th>
                </tr>
              </thead>
              <tbody id="heronTableBody"></tbody>
            </table>
          </div>
        </div>

        <div class="tool-section">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <h4 style="margin:0"><i data-lucide="compass"></i> لوحة رسم المثلثات بالأبعاد والزوايا</h4>
            <div class="row" style="margin:0">
              <button type="button" class="k" style="padding:4px 10px;min-height:30px;font-size:11.5px" onclick="window.GEOHeronExportDXF()">DXF</button>
              <button type="button" class="k" style="padding:4px 10px;min-height:30px;font-size:11.5px" onclick="window.GEOHeronSavePNG()">صورة</button>
            </div>
          </div>
          <canvas id="heronCanvas" width="800" height="440" style="width:100%;max-width:100%;height:auto;border-radius:12px;border:1px solid var(--ln);background:#08101a"></canvas>
        </div>

        <div id="heronTotalBox" class="result-box" style="display:block;margin-top:10px"></div>
      `
    }
  ];

  function mountArchitectAndHeron() {
    const grid = $("surveyGrid");
    if (!grid) return;

    ARCHITECT_HERON_TOOLS.forEach(t => {
      if (!$(`modal-${t.id}`)) {
        document.body.insertAdjacentHTML("beforeend", `
          <div id="modal-${t.id}" class="tool-modal">
            <div class="tool-content" style="max-width:880px">
              <div class="tool-header">
                <h3><i data-lucide="${t.icon}"></i> ${esc(t.title)}</h3>
                <button class="close-btn" aria-label="إغلاق" onclick="closeTool('${t.id}')">✕</button>
              </div>
              <div class="tool-body">${t.body}</div>
            </div>
          </div>
        `);
      }

      if (!grid.querySelector(`[onclick="openTool('${t.id}')"]`)) {
        grid.insertAdjacentHTML("afterbegin", `
          <div class="dash-card" onclick="openTool('${t.id}')">
            <div class="dash-icon"><i data-lucide="${t.icon}"></i></div>
            <div class="dash-text">
              <b>${esc(t.title)}</b>
              <span>${esc(t.desc)}</span>
            </div>
            <div class="dash-arrow">❮</div>
          </div>
        `);
      }
    });

    if (window.lucide && typeof window.lucide.createIcons === "function") {
      window.lucide.createIcons({ attrs: { "stroke-width": 1.8 } });
    }
  }

  /* ==========================================================================
     2. AI Architect Agent (تحليل الوصف بالذكاء الاصطناعي + Fallback محلي)
     ========================================================================== */
  window.GEOArchLoadExample88 = function () {
    $("archPromptText").value =
      "عاوز أصمم بيت مساحته 88 متر (8×11)، أوضتين وريسبشن وصالة وحمام ومطبخ، الباب الرئيسي يفتح على الشارع العمومي والباب الخاص يفتح على الشارع الخاص، والسلم للأدوار العلوية من الشارع الخاص، ارتفاع البناء من الأساس لغاية فوق 7 متر والحائط 25 سم";
    window.GEOArchRunAgent();
  };

  function localParseArchPrompt(raw) {
    const dimMatch = raw.match(/(\d+(?:\.\d+)?)\s*[×xX*في]\s*(\d+(?:\.\d+)?)/);
    const areaMatch = raw.match(/(\d+(?:\.\d+)?)\s*(?:متر|م²|m2)/i);

    let width = num("archTop") || 8;
    let length = num("archRight") || 11;

    if (dimMatch) {
      width = parseFloat(dimMatch[1]);
      length = parseFloat(dimMatch[2]);
    } else if (areaMatch) {
      const area = parseFloat(areaMatch[1]);
      if (area >= 25 && area <= 2000) {
        width = Math.abs(area - 88) < 1 ? 8 : Math.round(Math.sqrt(area * 0.75));
        length = +(area / width).toFixed(2);
      }
    }

    let rooms = 2;
    if (/اوضتين|أوضتين|غرفتين|2\s*غرف|2\s*اوض/.test(raw)) rooms = 2;
    else if (/3\s*غرف|ثلاث\s*غرف|تلت\s*اوض|تلات\s*اوض/.test(raw)) rooms = 3;
    else if (/4\s*غرف|اربع\s*غرف|أربع\s*غرف/.test(raw)) rooms = 4;
    else if (/غرفه\s*واحد|أوضة\s*واحد|1\s*غرف/.test(raw)) rooms = 1;

    let baths = /حمامين|2\s*حمام/.test(raw) ? 2 : 1;
    const hMatch = raw.match(/ارتفاع[^0-9]*(\d+(?:\.\d+)?)/) || raw.match(/(\d+(?:\.\d+)?)\s*متر\s*(?:ارتفاع|فوق|لغاية)/);
    const height = hMatch ? parseFloat(hMatch[1]) : (num("archHeight") || 7);
    const wallThick = /12\s*سم|نصف\s*طوب/.test(raw) ? "12" : "25";

    const mainStreet = raw.includes("الشارع العمومي") || raw.includes("شارع عمومي")
      ? "الشارع العمومي (الواجهة الرئيسية)"
      : ($("archMainStreet")?.value || "الشارع العمومي");
    const privStreet = raw.includes("الشارع الخاص") || raw.includes("شارع خاص")
      ? "الشارع الخاص (مدخل السلم العلوي)"
      : ($("archPrivStreet")?.value || "الشارع الخاص");

    const stairPos = raw.includes("اليمين") || raw.includes("شرقي") ? "right" : "left";

    return { width, length, rooms, baths, height, wallThick, mainStreet, privStreet, stairPos, note: "" };
  }

  window.GEOArchRunAgent = async function () {
    const raw = ($("archPromptText")?.value || "").trim();
    if (!raw) {
      return window.toast && window.toast("اكتب مواصفات البيت المطلوب في الخانة أولاً", "warn");
    }

    const logEl = $("archAgentLog");
    const btn = $("archAgentBtn");
    if (btn) btn.disabled = true;
    if (logEl) {
      logEl.style.color = "var(--am)";
      logEl.textContent = "جاري تحليل المواصفات المعمارية بواسطة المهندس الذكي...";
    }

    let parsed = localParseArchPrompt(raw);

    // محاولة استخراج JSON من محرك الـ AI الحقيقي في المنصة لفهم أدق تفاصيل الوصف
    try {
      const user = window.firebase?.auth?.().currentUser;
      if (user && typeof window.geoToken === "function" && window.GEO_API) {
        const token = await window.geoToken();
        const sys = `أنت مهندس معماري مصري خبير. استخرج من وصف المستخدم البيانات التالية بصيغة JSON فقط بدون أي نص إضافي:
{"width": رقم عرض الواجهة بالمتر, "length": رقم العمق بالمتر, "rooms": عدد غرف النوم (1-5), "baths": عدد الحمامات (1-3), "height": ارتفاع المبنى الكلي بالمتر, "wallThick": "25" أو "12", "mainStreet": "اسم الشارع الرئيسي", "privStreet": "اسم الشارع الخاص", "stairPos": "left" أو "right", "advice": "ملاحظة معمارية قصيرة أو سؤال استكمالي للمستخدم"}`;

        const res = await fetch(window.GEO_API + "/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
          body: JSON.stringify({
            model: "openai/gpt-oss-120b",
            messages: [
              { role: "system", content: sys },
              { role: "user", content: raw }
            ],
            temperature: 0.2,
            max_tokens: 600
          })
        });
        const data = await res.json().catch(() => ({}));
        const content = data.choices?.[0]?.message?.content || "";
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const aiObj = JSON.parse(jsonMatch[0]);
          if (aiObj.width > 2) parsed.width = Number(aiObj.width);
          if (aiObj.length > 2) parsed.length = Number(aiObj.length);
          if (aiObj.rooms >= 1) parsed.rooms = Number(aiObj.rooms);
          if (aiObj.baths >= 1) parsed.baths = Number(aiObj.baths);
          if (aiObj.height >= 2.5) parsed.height = Number(aiObj.height);
          if (aiObj.wallThick === "12" || aiObj.wallThick === "25") parsed.wallThick = String(aiObj.wallThick);
          if (aiObj.mainStreet) parsed.mainStreet = String(aiObj.mainStreet);
          if (aiObj.privStreet) parsed.privStreet = String(aiObj.privStreet);
          if (aiObj.stairPos === "left" || aiObj.stairPos === "right") parsed.stairPos = aiObj.stairPos;
          if (aiObj.advice) parsed.note = String(aiObj.advice);
        }
      }
    } catch (_) {}

    // تعبئة الحقول بالقيم المستخرجة
    $("archTop").value = parsed.width;
    $("archBottom").value = parsed.width;
    $("archRight").value = parsed.length;
    $("archLeft").value = parsed.length;
    $("archRooms").value = parsed.rooms;
    $("archBaths").value = parsed.baths;
    $("archHeight").value = parsed.height;
    $("archWallThick").value = parsed.wallThick;
    $("archMainStreet").value = parsed.mainStreet;
    $("archPrivStreet").value = parsed.privStreet;
    $("archStairPos").value = parsed.stairPos;

    window.GEOArchRenderAll();

    if (btn) btn.disabled = false;
    if (logEl) {
      logEl.style.color = "var(--gr)";
      logEl.innerHTML = `✓ تم تصميم المخطط (${parsed.width}×${parsed.length} م = ${(parsed.width * parsed.length).toFixed(1)} م² | ارتفاع ${parsed.height} م | حوائط ${parsed.wallThick} سم).` +
        (parsed.note ? `<br><span style="color:var(--bl)">ملاحظة المهندس الذكي: ${esc(parsed.note)}</span>` : "");
    }
  };

  window.GEOArchSetStage = function (stage) {
    currentArchStage = stage;
    $("btnStage2D").className = stage === "2d" ? "a" : "k";
    $("btnStage3D").className = stage === "3d" ? "a" : "k";
    $("btnStageFurn").className = stage === "furnished" ? "a" : "k";
    window.GEOArchRenderAll();
  };

  /* ==========================================================================
     3. محرك التوزيع المعماري الذكي (يتكيف تلقائياً مع الأرض الطولية أو العرضية)
     ========================================================================== */
  function getArchSpecs() {
    const top = Math.max(3, num("archTop"));
    const bottom = Math.max(3, num("archBottom"));
    const right = Math.max(3, num("archRight"));
    const left = Math.max(3, num("archLeft"));
    const W = (top + bottom) / 2;
    const L = (right + left) / 2;
    const grossArea = W * L;
    const wallThickCm = parseInt($("archWallThick")?.value || "25", 10);
    const wallM = wallThickCm / 100;
    const perim = top + bottom + right + left;
    const netArea = Math.max(10, grossArea - perim * wallM * 0.85);
    const rooms = Math.max(1, Math.min(5, Math.floor(num("archRooms"))));
    const baths = Math.max(1, Math.min(3, Math.floor(num("archBaths"))));
    const heightM = Math.max(3, num("archHeight") || 7);
    const floors = Math.max(1, Math.round(heightM / 3.3));
    const mainDoorPos = $("archMainDoorPos")?.value || "top";
    const stairPos = $("archStairPos")?.value || "left";
    const showAxes = $("archShowAxes")?.value === "1";
    const hasShaft = $("archShaft")?.value === "1";
    const mainStreet = $("archMainStreet")?.value || "الشارع العمومي";
    const privStreet = $("archPrivStreet")?.value || "الشارع الخاص";

    return {
      top, bottom, right, left, W, L, grossArea, netArea,
      wallThickCm, wallM, perim, rooms, baths, heightM, floors,
      mainDoorPos, stairPos, showAxes, hasShaft, mainStreet, privStreet
    };
  }

  function computeRoomLayout(spec) {
    const zones = [];
    const stairOnLeft = spec.stairPos === "left";
    const isWide = spec.W > spec.L * 1.15; // هل الأرض عريضة على الواجهة أم عميقة للداخل؟

    if (isWide) {
      // توزيع للأرض العريضة: قسم الاستقبال يمين/يسار وقسم النوم والخدمات في النصف الآخر
      const recW = 0.48;
      const privW = 1 - recW;
      const recX = stairOnLeft ? privW : 0;
      const privX = stairOnLeft ? 0 : recW;

      // السلم والباب الخاص على الشارع الخاص + الريسبشن على الواجهة
      zones.push({ id: "stair", name: "سلم علوي ومدخل خاص", x: stairOnLeft ? 0 : 0.72, y: 0, w: 0.28, h: 0.42, color: "#a855f7", door: "left" });
      zones.push({ id: "reception", name: "ريسبشن واستقبال", x: recX, y: 0, w: recW, h: 0.56, color: "#14b8a6", door: "top" });
      zones.push({ id: "hall", name: "صالة توزيع", x: recX, y: 0.56, w: recW * 0.55, h: 0.44, color: "#38bdf8", door: "top" });
      zones.push({ id: "kitchen", name: "مطبخ", x: recX + recW * 0.55, y: 0.56, w: recW * 0.45, h: 0.44, color: "#f59e0b", door: "left" });

      // الحمام والمنور + غرف النوم
      const bathH = 0.34;
      zones.push({ id: "bath", name: "حمام", x: stairOnLeft ? 0.28 : recW, y: 0, w: privW - 0.28, h: spec.hasShaft ? bathH * 0.68 : bathH, color: "#06b6d4", door: "bottom" });
      if (spec.hasShaft) {
        zones.push({ id: "shaft", name: "منور", x: stairOnLeft ? 0.28 : recW, y: bathH * 0.68, w: privW - 0.28, h: bathH * 0.32, color: "#64748b" });
      }

      const backY = 0.42;
      const backH = 1 - backY;
      const rw = privW / spec.rooms;
      for (let i = 0; i < spec.rooms; i++) {
        zones.push({
          id: `room_${i + 1}`,
          name: `غرفة نوم (${i + 1})`,
          x: privX + i * rw,
          y: backY,
          w: rw,
          h: backH,
          color: "#22d3ee",
          door: "top"
        });
      }
    } else {
      // توزيع للأرض الطولية القياسية (مثل 8 × 11 م = 88 م²)
      const frontH = 0.35;
      const stairW = 0.30;
      if (stairOnLeft) {
        zones.push({ id: "stair", name: "سلم علوي ومدخل خاص", x: 0, y: 0, w: stairW, h: frontH, color: "#a855f7", door: "left" });
        zones.push({ id: "reception", name: "ريسبشن واستقبال", x: stairW, y: 0, w: 1 - stairW, h: frontH, color: "#14b8a6", door: "top" });
      } else {
        zones.push({ id: "reception", name: "ريسبشن واستقبال", x: 0, y: 0, w: 1 - stairW, h: frontH, color: "#14b8a6", door: "top" });
        zones.push({ id: "stair", name: "سلم علوي ومدخل خاص", x: 1 - stairW, y: 0, w: stairW, h: frontH, color: "#a855f7", door: "right" });
      }

      const midY = frontH;
      const midH = 0.28;
      zones.push({ id: "hall", name: "صالة توزيع", x: 0, y: midY, w: 0.44, h: midH, color: "#38bdf8", door: "top" });
      zones.push({ id: "kitchen", name: "مطبخ", x: 0.44, y: midY, w: 0.28, h: midH, color: "#f59e0b", door: "left" });
      if (spec.hasShaft) {
        zones.push({ id: "bath", name: "حمام", x: 0.72, y: midY, w: 0.28, h: midH * 0.65, color: "#06b6d4", door: "left" });
        zones.push({ id: "shaft", name: "منور", x: 0.72, y: midY + midH * 0.65, w: 0.28, h: midH * 0.35, color: "#64748b" });
      } else {
        zones.push({ id: "bath", name: "حمام", x: 0.72, y: midY, w: 0.28, h: midH, color: "#06b6d4", door: "left" });
      }

      const backY = frontH + midH;
      const backH = 1 - backY;
      const rw = 1 / spec.rooms;
      for (let i = 0; i < spec.rooms; i++) {
        zones.push({
          id: `room_${i + 1}`,
          name: `غرفة نوم (${i + 1})`,
          x: i * rw,
          y: backY,
          w: rw,
          h: backH,
          color: "#22d3ee",
          door: "top"
        });
      }
    }

    return zones;
  }

  window.GEOArchRenderAll = function () {
    const spec = getArchSpecs();
    const zones = computeRoomLayout(spec);
    const cv = $("archCanvas");
    if (!cv) return;
    const ctx = cv.getContext("2d");
    const CW = cv.width, CH = cv.height;

    ctx.fillStyle = "#08101a";
    ctx.fillRect(0, 0, CW, CH);
    ctx.strokeStyle = "#111f30";
    ctx.lineWidth = 1;
    for (let x = 0; x < CW; x += 24) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CH); ctx.stroke(); }
    for (let y = 0; y < CH; y += 24) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CW, y); ctx.stroke(); }

    // ترويسة اللوحة
    ctx.fillStyle = "#10b981";
    ctx.font = "bold 15px Cairo, sans-serif";
    ctx.textAlign = "right";
    const stageTitles = {
      "2d": "المرحلة (1): مخطط أوتوكاد إنشائي 2D (محاور + أعمدة + أبواب + أبعاد)",
      "3d": `المرحلة (2): مجسم هيكلي ثلاثي الأبعاد 3D (ارتفاع ${spec.heightM} م / ${spec.floors} أدوار)`,
      "furnished": "المرحلة (3): مخطط التشطيب والفرش المعماري النهائي"
    };
    ctx.fillText(stageTitles[currentArchStage], CW - 24, 32);

    ctx.textAlign = "left";
    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 13px Cairo, sans-serif";
    ctx.fillText(`المساحة: ${spec.grossArea.toFixed(1)} م² | الصافية: ${spec.netArea.toFixed(1)} م²`, 24, 32);

    if (currentArchStage === "3d") {
      render3DIsometricHouse(ctx, CW, CH, spec, zones);
    } else {
      render2DOrFurnishedPlan(ctx, CW, CH, spec, zones, currentArchStage === "furnished");
    }

    renderArchCostReport(spec, zones);
  };

  function drawDoorSwing(ctx, x, y, side, color = "#10b981") {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    const r = 14;
    ctx.beginPath();
    if (side === "top") {
      ctx.moveTo(x, y); ctx.lineTo(x, y + r);
      ctx.arc(x, y, r, 0, Math.PI / 2);
    } else if (side === "left") {
      ctx.moveTo(x, y); ctx.lineTo(x + r, y);
      ctx.arc(x, y, r, -Math.PI / 2, 0);
    } else if (side === "right") {
      ctx.moveTo(x, y); ctx.lineTo(x - r, y);
      ctx.arc(x, y, r, Math.PI, Math.PI * 1.5);
    } else {
      ctx.moveTo(x, y); ctx.lineTo(x, y - r);
      ctx.arc(x, y, r, -Math.PI / 2, 0);
    }
    ctx.stroke();
    ctx.restore();
  }

  function render2DOrFurnishedPlan(ctx, CW, CH, spec, zones, isFurnished) {
    const maxW = 470, maxH = 390;
    const scale = Math.min(maxW / spec.W, maxH / spec.L);
    const pw = spec.W * scale;
    const ph = spec.L * scale;
    const ox = (CW - pw) / 2;
    const oy = 95 + (maxH - ph) / 2;

    // أسماء الشوارع المحيطة متوافقة تماماً مع المدخلات
    ctx.textAlign = "center";
    ctx.fillStyle = "#f59e0b";
    ctx.font = "bold 13px Cairo, sans-serif";
    ctx.fillText(`▲ ${spec.mainStreet} (${spec.top} م)`, ox + pw / 2, oy - 34);

    ctx.save();
    ctx.translate(ox - 42, oy + ph / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = "#a855f7";
    ctx.fillText(`${spec.privStreet} (${spec.left} م)`, 0, 0);
    ctx.restore();

    ctx.fillStyle = "#94a3b8";
    ctx.font = "12px Cairo, sans-serif";
    ctx.fillText(`الحد الخلفي (${spec.bottom} م)`, ox + pw / 2, oy + ph + 36);

    // المحاور الإنشائية (Axes)
    if (spec.showAxes) {
      ctx.save();
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = "rgba(148, 163, 184, 0.25)";
      ctx.lineWidth = 1;
      [0, 0.30, 0.72, 1].forEach((t, i) => {
        const ax = ox + t * pw;
        ctx.beginPath(); ctx.moveTo(ax, oy - 18); ctx.lineTo(ax, oy + ph + 18); ctx.stroke();
        ctx.fillStyle = "#64748b"; ctx.font = "10px monospace";
        ctx.fillText(String(i + 1), ax, oy - 21);
      });
      [0, 0.35, 0.63, 1].forEach((t, i) => {
        const ay = oy + t * ph;
        ctx.beginPath(); ctx.moveTo(ox - 18, ay); ctx.lineTo(ox + pw + 18, ay); ctx.stroke();
        ctx.fillStyle = "#64748b"; ctx.font = "10px monospace";
        ctx.fillText(String.fromCharCode(65 + i), ox - 24, ay + 3);
      });
      ctx.restore();
    }

    // رسم الغرف والفراغات
    zones.forEach(z => {
      const rx = ox + z.x * pw;
      const ry = oy + z.y * ph;
      const rw = z.w * pw;
      const rh = z.h * ph;
      const realW = (z.w * spec.W).toFixed(2);
      const realH = (z.h * spec.L).toFixed(2);

      if (isFurnished) {
        ctx.fillStyle = z.id === "bath" || z.id === "kitchen"
          ? "rgba(6, 182, 212, 0.16)"
          : z.id === "stair"
            ? "rgba(168, 85, 247, 0.18)"
            : "rgba(245, 158, 11, 0.12)";
      } else {
        ctx.fillStyle = "rgba(15, 23, 42, 0.78)";
      }
      ctx.fillRect(rx, ry, rw, rh);

      if (isFurnished) {
        drawFurnitureInZone(ctx, z, rx, ry, rw, rh);
      }

      ctx.strokeStyle = z.color;
      ctx.lineWidth = spec.wallThickCm === 25 ? 3 : 2;
      ctx.strokeRect(rx, ry, rw, rh);

      // رسم قوس فتح الباب لكل غرفة
      if (z.door === "top") drawDoorSwing(ctx, rx + rw * 0.35, ry, "top", z.color);
      else if (z.door === "left") drawDoorSwing(ctx, rx, ry + rh * 0.45, "left", z.color);
      else if (z.door === "right") drawDoorSwing(ctx, rx + rw, ry + rh * 0.45, "right", z.color);

      // كتابة اسم الغرفة وأبعادها بالمتر
      ctx.textAlign = "center";
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 11.5px Cairo, sans-serif";
      ctx.fillText(z.name, rx + rw / 2, ry + rh / 2 - 4);
      ctx.fillStyle = "#94a3b8";
      ctx.font = "10.5px Fira Code, monospace";
      ctx.fillText(`${realW}×${realH}م`, rx + rw / 2, ry + rh / 2 + 12);
    });

    // رسم الأعمدة الخرسانية
    if (spec.showAxes) {
      ctx.fillStyle = "#f59e0b";
      [0, 0.30, 0.72, 1].forEach(cx => {
        [0, 0.35, 0.63, 1].forEach(cy => {
          ctx.fillRect(ox + cx * pw - 4, oy + cy * ph - 4, 8, 8);
        });
      });
    }

    // تسمية الباب الرئيسي والباب الخاص بوضوح
    const mainDoorX = spec.stairPos === "left" ? ox + pw * 0.52 : ox + pw * 0.25;
    ctx.fillStyle = "#10b981";
    ctx.font = "bold 11px Cairo, sans-serif";
    ctx.fillText("▼ الباب الرئيسي", mainDoorX, oy - 6);

    const privDoorY = oy + ph * 0.16;
    ctx.fillStyle = "#d8b4fe";
    ctx.fillText("باب خاص ◄", ox - 28, privDoorY);
  }

  function drawFurnitureInZone(ctx, z, rx, ry, rw, rh) {
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.45)";
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 1.2;

    if (z.id.startsWith("room_")) {
      const bw = Math.min(rw * 0.55, 48), bh = Math.min(rh * 0.52, 56);
      ctx.fillRect(rx + (rw - bw) / 2, ry + 12, bw, bh);
      ctx.strokeRect(rx + (rw - bw) / 2, ry + 12, bw, bh);
      ctx.strokeRect(rx + (rw - bw) / 2 + 4, ry + 15, bw / 2 - 6, 9);
      ctx.strokeRect(rx + rw / 2 + 2, ry + 15, bw / 2 - 6, 9);
    } else if (z.id === "reception") {
      ctx.strokeRect(rx + 12, ry + 14, rw - 24, 14);
      ctx.strokeRect(rx + 12, ry + 32, 14, rh - 48);
      ctx.fillRect(rx + rw / 2 - 18, ry + rh / 2 - 8, 36, 18);
    } else if (z.id === "kitchen") {
      ctx.fillRect(rx + 4, ry + 4, rw - 8, 12);
      ctx.fillRect(rx + rw - 16, ry + 4, 12, rh - 12);
    } else if (z.id === "stair") {
      const steps = 8;
      for (let s = 1; s < steps; s++) {
        const sy = ry + (rh / steps) * s;
        ctx.beginPath(); ctx.moveTo(rx + 4, sy); ctx.lineTo(rx + rw - 4, sy); ctx.stroke();
      }
    }
    ctx.restore();
  }

  function render3DIsometricHouse(ctx, CW, CH, spec, zones) {
    const isoScale = Math.min(25, 250 / Math.max(spec.W, spec.L));
    const wallHpx = Math.min(130, spec.heightM * 16);
    const cx = CW / 2;
    const cy = CH / 2 + 55;

    const toIso = (x, y, z) => ({
      x: cx + (x - y) * 0.866 * isoScale,
      y: cy + (x + y) * 0.5 * isoScale - z
    });

    const hw = spec.W / 2, hl = spec.L / 2;
    const p0 = toIso(-hw, -hl, 0), p1 = toIso(hw, -hl, 0), p2 = toIso(hw, hl, 0), p3 = toIso(-hw, hl, 0);

    ctx.fillStyle = "rgba(16, 185, 129, 0.16)";
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.lineTo(p3.x, p3.y);
    ctx.closePath(); ctx.fill(); ctx.stroke();

    zones.forEach(z => {
      const x1 = -hw + z.x * spec.W, y1 = -hl + z.y * spec.L;
      const x2 = x1 + z.w * spec.W, y2 = y1 + z.h * spec.L;

      const b1 = toIso(x1, y1, 0), b2 = toIso(x2, y1, 0), b3 = toIso(x2, y2, 0);
      const t1 = toIso(x1, y1, wallHpx), t2 = toIso(x2, y1, wallHpx), t3 = toIso(x2, y2, wallHpx);

      ctx.strokeStyle = z.color;
      ctx.fillStyle = "rgba(56, 189, 248, 0.08)";
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.moveTo(b1.x, b1.y); ctx.lineTo(b2.x, b2.y); ctx.lineTo(t2.x, t2.y); ctx.lineTo(t1.x, t1.y);
      ctx.closePath(); ctx.fill(); ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(b2.x, b2.y); ctx.lineTo(b3.x, b3.y); ctx.lineTo(t3.x, t3.y); ctx.lineTo(t2.x, t2.y);
      ctx.closePath(); ctx.fill(); ctx.stroke();

      const center = toIso((x1 + x2) / 2, (y1 + y2) / 2, 12);
      ctx.fillStyle = "#f8fafc";
      ctx.font = "bold 10px Cairo, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(z.name, center.x, center.y);
    });

    const u0 = toIso(-hw, -hl, wallHpx), u1 = toIso(hw, -hl, wallHpx), u2 = toIso(hw, hl, wallHpx), u3 = toIso(-hw, hl, wallHpx);
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(u0.x, u0.y); ctx.lineTo(u1.x, u1.y); ctx.lineTo(u2.x, u2.y); ctx.lineTo(u3.x, u3.y);
    ctx.closePath(); ctx.stroke();

    [[p0, u0], [p1, u1], [p2, u2], [p3, u3]].forEach(([b, t]) => {
      ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(t.x, t.y); ctx.stroke();
    });

    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p1.x + 22, p1.y); ctx.lineTo(u1.x + 22, u1.y);
    ctx.stroke();
    ctx.fillStyle = "#fca5a5";
    ctx.font = "bold 12px Cairo, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`الارتفاع: ${spec.heightM} م`, u1.x + 28, (p1.y + u1.y) / 2);
  }

  function renderArchCostReport(spec, zones) {
    const totalSlabArea = spec.grossArea * spec.floors;
    const totalWallsLength = spec.perim * 2.2;
    const totalWallArea = totalWallsLength * spec.heightM;

    const bricksPerM2 = spec.wallThickCm === 25 ? 110 : 55;
    const totalBricks = Math.ceil(totalWallArea * bricksPerM2);

    const rcVolume = totalSlabArea * 0.32;
    const cementTons = +(rcVolume * 0.35 + (totalBricks / 1000) * 0.15).toFixed(2);
    const steelTons = +(rcVolume * 0.095).toFixed(2);
    const sandM3 = +(rcVolume * 0.45 + totalWallArea * 0.03).toFixed(1);
    const gravelM3 = +(rcVolume * 0.8).toFixed(1);

    const estCost = Math.round(
      cementTons * 3200 +
      steelTons * 38500 +
      (totalBricks / 1000) * 1800 +
      sandM3 * 180 +
      gravelM3 * 320 +
      totalSlabArea * 950
    );

    const roomsList = zones.map(z =>
      `<span style="display:inline-block;background:var(--bg);border:1px solid var(--ln);padding:3px 8px;border-radius:8px;margin:2px;font-size:11.5px">${esc(z.name)}: <b>${(z.w * spec.W).toFixed(1)}×${(z.h * spec.L).toFixed(1)}م</b></span>`
    ).join("");

    $("archCostReport").innerHTML = `
      <h4>التقرير الهندسي ومقايسة البناء (ارتفاع ${spec.heightM} م • حوائط ${spec.wallThickCm} سم)</h4>
      <p><b>إجمالي المسطح:</b> ${spec.grossArea.toFixed(2)} م² | <b>عدد الأدوار المحسوبة:</b> ${spec.floors} أدوار (ارتفاع كلي ${spec.heightM} م)</p>
      <div style="margin:8px 0">${roomsList}</div>
      <table class="pt">
        <thead><tr><th>البند الهندسي</th><th>الكمية التقديرية</th><th>ملاحظات التنفيذ</th></tr></thead>
        <tbody>
          <tr><td>الطوب (${spec.wallThickCm} سم)</td><td><b>${totalBricks.toLocaleString()} طوبة</b></td><td>شامل الحوائط الخارجية والقواطيع بارتفاع ${spec.heightM} م</td></tr>
          <tr><td>الأسمنت البورتلاندي</td><td><b>${cementTons} طن</b> (${Math.ceil(cementTons * 20)} شيكارة)</td><td>للخرسانات والمونة والمحارة</td></tr>
          <tr><td>حديد التسليح</td><td><b>${steelTons} طن</b> (${Math.round(steelTons * 1000)} كجم)</td><td>قواعد وأعمدة وأسقف (${spec.floors} أدوار)</td></tr>
          <tr><td>الرمل والزلط</td><td><b>${sandM3} م³ رمل</b> + <b>${gravelM3} م³ زلط</b></td><td>شامل الخرسانة والمباني</td></tr>
        </tbody>
      </table>
      <p style="margin-top:10px;font-size:15px"><b>التكلفة الإجمالية التقديرية (هيكل + مباني + مصنعيات):</b> <span style="color:var(--gr)">${estCost.toLocaleString()} جنيه مصري</span></p>
    `;
  }

  window.GEOArchSavePNG = function () {
    const cv = $("archCanvas");
    if (!cv) return;
    const a = document.createElement("a");
    a.href = cv.toDataURL("image/png");
    a.download = `GeoDev-Architect-${currentArchStage}-${Date.now()}.png`;
    a.click();
  };

  window.GEOArchExportDXF = function () {
    const spec = getArchSpecs();
    const zones = computeRoomLayout(spec);
    const lines = ["0", "SECTION", "2", "ENTITIES"];

    zones.forEach(z => {
      const x1 = +(z.x * spec.W).toFixed(3);
      const y1 = +((1 - z.y - z.h) * spec.L).toFixed(3);
      const x2 = +((z.x + z.w) * spec.W).toFixed(3);
      const y2 = +((1 - z.y) * spec.L).toFixed(3);

      lines.push(
        "0", "LWPOLYLINE", "8", "WALLS", "90", "4", "70", "1",
        "10", String(x1), "20", String(y1),
        "10", String(x2), "20", String(y1),
        "10", String(x2), "20", String(y2),
        "10", String(x1), "20", String(y2),
        "0", "TEXT", "8", "LABELS", "10", String(((x1 + x2) / 2).toFixed(2)), "20", String(((y1 + y2) / 2).toFixed(2)), "40", "0.35", "1", z.name
      );
    });

    lines.push("0", "ENDSEC", "0", "EOF");
    if (typeof window.dlText === "function") {
      window.dlText(lines.join("\n"), `GeoDev-House-Plan-${Date.now()}.dxf`);
    }
    if (window.toast) window.toast("تم تصدير المخطط المعماري بصيغة DXF بالطبقات", "success");
  };

  /* ==========================================================================
     4. حساب ورسم المثلثات بطريقة هيرون (Heron Surveying & Canvas Plot)
     ========================================================================== */
  function calcHeronMetrics(a, b, c) {
    if (a <= 0 || b <= 0 || c <= 0 || a + b <= c || a + c <= b || b + c <= a) return null;
    const s = (a + b + c) / 2;
    const area = Math.sqrt(Math.max(0, s * (s - a) * (s - b) * (s - c)));
    return { a, b, c, area };
  }

  function m2ToEgyptianUnits(m2) {
    const FED = 4200.833;
    const totalSahm = (m2 / FED) * 576;
    const f = Math.floor(totalSahm / 576);
    const rem = totalSahm - f * 576;
    const q = Math.floor(rem / 24);
    const s = rem - q * 24;
    return `${f} فدان ، ${q} قيراط ، ${s.toFixed(2)} سهم`;
  }

  window.GEOHeronAdd = function () {
    const a = num("hrA"), b = num("hrB"), c = num("hrC");
    if (!calcHeronMetrics(a, b, c)) {
      return window.toast && window.toast("أطوال الأضلاع لا تكوّن مثلثاً صحيحاً", "warn");
    }
    heronTriangles.push({ a, b, c });
    window.GEOHeronRender();
  };

  window.GEOHeronRemove = function (idx) {
    heronTriangles.splice(idx, 1);
    window.GEOHeronRender();
  };

  window.GEOHeronClear = function () {
    heronTriangles = [];
    window.GEOHeronRender();
  };

  window.GEOHeronRender = function () {
    const tbody = $("heronTableBody");
    const totalBox = $("heronTotalBox");
    const cv = $("heronCanvas");
    if (!tbody || !cv) return;

    const validList = heronTriangles.map((t, i) => ({ idx: i, ...calcHeronMetrics(t.a, t.b, t.c) })).filter(x => x.area);
    const totalArea = validList.reduce((sum, x) => sum + x.area, 0);

    tbody.innerHTML = validList.length
      ? validList.map((t, i) => `
          <tr>
            <td>مثلث (${i + 1})</td>
            <td>${t.a}</td>
            <td>${t.b}</td>
            <td>${t.c}</td>
            <td><b>${t.area.toFixed(2)} م²</b></td>
            <td><button type="button" class="r" style="padding:2px 8px;min-height:26px" onclick="window.GEOHeronRemove(${t.idx})">×</button></td>
          </tr>
        `).join("")
      : `<tr><td colspan="6" class="mt">أضف مثلثاً لحساب مساحته ورسمه بالأبعاد</td></tr>`;

    if (totalBox) {
      totalBox.innerHTML = `
        <h4 style="color:var(--bl)">إجمالي المثلثات: ${totalArea.toFixed(2)} م²</h4>
        <p style="color:var(--am);font-weight:800;font-size:15px">${m2ToEgyptianUnits(totalArea)}</p>
      `;
    }

    const ctx = cv.getContext("2d");
    const CW = cv.width, CH = cv.height;
    ctx.fillStyle = "#08101a";
    ctx.fillRect(0, 0, CW, CH);

    ctx.strokeStyle = "#111f30";
    ctx.lineWidth = 1;
    for (let x = 0; x < CW; x += 25) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CH); ctx.stroke(); }
    for (let y = 0; y < CH; y += 25) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CW, y); ctx.stroke(); }

    if (!validList.length) return;

    const cols = validList.length === 1 ? 1 : 2;
    const rows = Math.ceil(validList.length / cols);
    const cellW = CW / cols;
    const cellH = CH / rows;

    validList.forEach((t, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = col * cellW + cellW / 2;
      const cy = row * cellH + cellH / 2 + 12;

      const x3 = (t.b * t.b + t.c * t.c - t.a * t.a) / (2 * t.c);
      const y3 = Math.sqrt(Math.max(0, t.b * t.b - x3 * x3));

      const minX = Math.min(0, t.c, x3), maxX = Math.max(0, t.c, x3);
      const triW = maxX - minX || 1;
      const triH = y3 || 1;

      const scale = Math.min((cellW - 90) / triW, (cellH - 85) / triH);
      const midX = (minX + maxX) / 2;
      const midY = y3 / 2;

      const toScreen = (px, py) => ({
        x: cx + (px - midX) * scale,
        y: cy - (py - midY) * scale
      });

      const S1 = toScreen(0, 0), S2 = toScreen(t.c, 0), S3 = toScreen(x3, y3);

      ctx.fillStyle = "rgba(16, 185, 129, 0.16)";
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(S1.x, S1.y); ctx.lineTo(S2.x, S2.y); ctx.lineTo(S3.x, S3.y);
      ctx.closePath(); ctx.fill(); ctx.stroke();

      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 12px Cairo, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`C = ${t.c} م`, (S1.x + S2.x) / 2, (S1.y + S2.y) / 2 + 16);
      ctx.fillText(`B = ${t.b} م`, (S1.x + S3.x) / 2 - 22, (S1.y + S3.y) / 2 - 4);
      ctx.fillText(`A = ${t.a} م`, (S2.x + S3.x) / 2 + 22, (S2.y + S3.y) / 2 - 4);

      ctx.fillStyle = "#ffffff";
      ctx.fillText(`مثلث (${i + 1})`, (S1.x + S2.x + S3.x) / 3, (S1.y + S2.y + S3.y) / 3 - 4);
      ctx.fillStyle = "#10b981";
      ctx.fillText(`${t.area.toFixed(2)} م²`, (S1.x + S2.x + S3.x) / 3, (S1.y + S2.y + S3.y) / 3 + 12);
    });
  };

  window.GEOHeronSavePNG = function () {
    const cv = $("heronCanvas");
    if (!cv) return;
    const a = document.createElement("a");
    a.href = cv.toDataURL("image/png");
    a.download = `GeoDev-Heron-Triangles-${Date.now()}.png`;
    a.click();
  };

  window.GEOHeronExportDXF = function () {
    const validList = heronTriangles.map(t => calcHeronMetrics(t.a, t.b, t.c)).filter(x => x && x.area);
    if (!validList.length) return;
    const lines = ["0", "SECTION", "2", "ENTITIES"];
    let offsetX = 0;

    validList.forEach(t => {
      const x3 = (t.b * t.b + t.c * t.c - t.a * t.a) / (2 * t.c);
      const y3 = Math.sqrt(Math.max(0, t.b * t.b - x3 * x3));
      lines.push(
        "0", "LWPOLYLINE", "8", "TRIANGLES", "90", "3", "70", "1",
        "10", offsetX.toFixed(3), "20", "0",
        "10", (offsetX + t.c).toFixed(3), "20", "0",
        "10", (offsetX + x3).toFixed(3), "20", y3.toFixed(3)
      );
      offsetX += t.c + 10;
    });

    lines.push("0", "ENDSEC", "0", "EOF");
    if (typeof window.dlText === "function") {
      window.dlText(lines.join("\n"), `GeoDev-Heron-${Date.now()}.dxf`);
    }
  };

  /* ==========================================================================
     5. التشغيل والربط مع شبكة المساحة
     ========================================================================== */
  function initArchitectHeron() {
    mountArchitectAndHeron();

    if (typeof window.renderSurveyGrid === "function") {
      const _origRender = window.renderSurveyGrid;
      window.renderSurveyGrid = function () {
        _origRender.apply(this, arguments);
        mountArchitectAndHeron();
      };
    }

    if (typeof window.openTool === "function") {
      const _origOpen = window.openTool;
      window.openTool = function (id) {
        _origOpen.apply(this, arguments);
        if (id === "ai-architect") setTimeout(() => window.GEOArchRenderAll(), 80);
        if (id === "heron-triangles") setTimeout(() => window.GEOHeronRender(), 80);
      };
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initArchitectHeron);
  } else {
    initArchitectHeron();
  }
})();
