/* ============================================================================
   GeoDev AI Architect (3-Stage 2D/3D/Furnished + Cost) & Heron Triangles Suite
   إضافة أداتين هندسيتين متكاملتين إلى قسم المساحة (#surveyGrid):
   1. الأوتوكاد المعماري الذكي (AutoCAD AI Architect):
      - AI Agent يفهم وصفك المعماري بالعربية (الغرف، الأبواب، السلم، الشوارع، الارتفاع، سمك الحوائط).
      - 3 مراحل رسم: (1) مخطط 2D بالمحاور والأعمدة (2) مجسم 3D بالارتفاع (3) مخطط الفرش والتشطيب.
      - حساب تكلفة البناء حسب الارتفاع (مثلاً 7م) وسمك الحائط (25سم/12سم) + تصدير DXF وصورة.
   2. حساب ورسم المثلثات بطريقة هيرون (Heron Surveying & Drawing):
      - جدول مثلثات الرفعة المساحية + رسم هندسي بالأبعاد والزوايا + الإجمالي بالفدان والقيراط والسهم.
   ============================================================================ */

(function () {
  "use strict";
  if (window.GEOArchitectHeron) return;
  window.GEOArchitectHeron = true;

  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));
  const num = id => parseFloat($(id)?.value) || 0;

  let currentArchStage = "2d"; // '2d' | '3d' | 'furnished'
  let heronTriangles = [
    { a: 30, b: 40, c: 50 }
  ];

  /* ==========================================================================
     1. تعريف الأداتين وحقنهما في قسم المساحة (#surveyGrid)
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
            اكتب مواصفات بيتك بحرية (المساحة، عدد الغرف، اتجاه الباب الرئيسي والخاص، موقع السلم، الشوارع، ارتفاع البناء، وسمك الحوائط) وسيقوم الـ AI بتحليل طلبك وتوزيع الفراغات ورسمها على 3 مراحل:
          </p>
          <textarea id="archPromptText" rows="3" class="c" placeholder="مثال: عاوز أصمم بيت 88 متر (8×11)، أوضتين وريسبشن وصالة وحمام ومطبخ، الباب الرئيسي يفتح على الشارع العمومي والباب الخاص يفتح على الشارع الخاص، والسلم للأدوار العلوية من الشارع الخاص، ارتفاع البناء 7 متر والحائط 25 سم"></textarea>
          <div class="row" style="margin-top:8px">
            <button type="button" class="a" style="flex:2" onclick="window.GEOArchRunAgent()">تحليل الوصف وتوليد التصميم بالـ AI</button>
            <button type="button" class="k" style="flex:1" onclick="window.GEOArchLoadExample88()">مثال 88 م²</button>
          </div>
          <div id="archAgentLog" class="mt" style="margin-top:6px;color:var(--gr);font-weight:700"></div>
        </div>

        <div class="tool-section">
          <h4><i data-lucide="maximize-2"></i> 1. أبعاد قطعة الأرض والحدود (بالمتر)</h4>
          <div class="form-grid">
            <label>الضلع العلوي (الواجهة / بحري) <input id="archTop" type="number" step="any" value="8" class="c"></label>
            <label>الضلع السفلي (الخلفي / قبلي) <input id="archBottom" type="number" step="any" value="8" class="c"></label>
            <label>الضلع الأيمن (شرقي) <input id="archRight" type="number" step="any" value="11" class="c"></label>
            <label>الضلع الأيسر (غربي) <input id="archLeft" type="number" step="any" value="11" class="c"></label>
          </div>
          <div class="form-grid">
            <label>الشارع الرئيسي (الباب الرئيسي) <input id="archMainStreet" class="c" value="شارع عمومي (بحري)"></label>
            <label>الشارع الخاص / الجانبي <input id="archPrivStreet" class="c" value="شارع خاص (غربي)"></label>
          </div>
        </div>

        <div class="tool-section">
          <h4><i data-lucide="sliders"></i> 2. الإعدادات المعمارية والإنشائية</h4>
          <div class="form-grid">
            <label>عدد غرف النوم <input id="archRooms" type="number" min="1" max="6" value="2" class="c"></label>
            <label>عدد الحمامات <input id="archBaths" type="number" min="1" max="4" value="1" class="c"></label>
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

        <!-- أزرار التبديل بين مراحل الرسم الثلاث -->
        <div class="row" style="margin-bottom:10px;background:var(--bg);padding:6px;border-radius:12px;border:1px solid var(--ln)">
          <button type="button" id="btnStage2D" class="a" style="flex:1;font-size:12px" onclick="window.GEOArchSetStage('2d')">1. مخطط 2D إنشائي</button>
          <button type="button" id="btnStage3D" class="k" style="flex:1;font-size:12px" onclick="window.GEOArchSetStage('3d')">2. مجسم 3D بالارتفاع</button>
          <button type="button" id="btnStageFurn" class="k" style="flex:1;font-size:12px" onclick="window.GEOArchSetStage('furnished')">3. التشطيب والفرش</button>
        </div>

        <div style="overflow-x:auto">
          <canvas id="archCanvas" width="840" height="620" style="width:100%;max-width:100%;height:auto;border-radius:14px;border:1px solid var(--ln);background:#08101a"></canvas>
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
     2. AI Architect Agent: تحليل وصف المستخدم وتعبئة الإعدادات المعمارية
     ========================================================================== */
  window.GEOArchLoadExample88 = function () {
    $("archPromptText").value =
      "عاوز أصمم بيت مساحته 88 متر (8×11)، أوضتين وريسبشن وصالة وحمام ومطبخ، الباب الرئيسي يفتح على الشارع العمومي والباب الخاص يفتح على الشارع الخاص، والسلم للأدوار العلوية من الشارع الخاص، ارتفاع البناء من الأساس لغاية فوق 7 متر والحائط 25 سم";
    window.GEOArchRunAgent();
  };

  window.GEOArchRunAgent = async function () {
    const raw = ($("archPromptText")?.value || "").trim();
    if (!raw) {
      return window.toast && window.toast("اكتب مواصفات البيت المطلوب في الخانة أولاً", "warn");
    }

    const logEl = $("archAgentLog");
    if (logEl) logEl.textContent = "جاري تحليل المواصفات المعمارية وتوزيع الفراغات...";

    // 1. استخراج الأبعاد أو المساحة الكلية
    const dimMatch = raw.match(/(\d+(?:\.\d+)?)\s*[×xX*في]\s*(\d+(?:\.\d+)?)/);
    const areaMatch = raw.match(/(\d+(?:\.\d+)?)\s*(?:متر|م²|m2)/i);

    if (dimMatch) {
      const w = parseFloat(dimMatch[1]);
      const h = parseFloat(dimMatch[2]);
      if (w > 2 && h > 2) {
        $("archTop").value = w;
        $("archBottom").value = w;
        $("archRight").value = h;
        $("archLeft").value = h;
      }
    } else if (areaMatch) {
      const area = parseFloat(areaMatch[1]);
      if (area >= 25 && area <= 2000) {
        // اختيار أبعاد متناسقة (مثلاً 88 م² -> 8 × 11)
        let bestW = Math.round(Math.sqrt(area * 0.75));
        if (Math.abs(area - 88) < 1) bestW = 8;
        const bestH = +(area / bestW).toFixed(2);
        $("archTop").value = bestW;
        $("archBottom").value = bestW;
        $("archRight").value = bestH;
        $("archLeft").value = bestH;
      }
    }

    // 2. استخراج عدد الغرف والحمامات
    if (/اوضتين|أوضتين|غرفتين|2\s*غرف|2\s*اوض/.test(raw)) $("archRooms").value = 2;
    else if (/3\s*غرف|ثلاث\s*غرف|تلت\s*اوض|تلات\s*اوض/.test(raw)) $("archRooms").value = 3;
    else if (/4\s*غرف|اربع\s*غرف|أربع\s*غرف/.test(raw)) $("archRooms").value = 4;
    else if (/غرفه\s*واحد|أوضة\s*واحد|1\s*غرف/.test(raw)) $("archRooms").value = 1;

    if (/حمامين|2\s*حمام/.test(raw)) $("archBaths").value = 2;
    else if (/3\s*حمام/.test(raw)) $("archBaths").value = 3;
    else if (/حمام/.test(raw)) $("archBaths").value = 1;

    // 3. استخراج ارتفاع البناء وسمك الحوائط
    const heightMatch = raw.match(/ارتفاع[^0-9]*(\d+(?:\.\d+)?)/) || raw.match(/(\d+(?:\.\d+)?)\s*متر\s*(?:ارتفاع|فوق|لغاية)/);
    if (heightMatch) {
      $("archHeight").value = parseFloat(heightMatch[1]);
    }

    if (/12\s*سم|نصف\s*طوب/.test(raw)) $("archWallThick").value = "12";
    else if (/25\s*سم|طوب\s*كامل/.test(raw)) $("archWallThick").value = "25";

    // 4. استخراج الشوارع ومواقع الأبواب والسلم
    if (raw.includes("الشارع العمومي") || raw.includes("شارع عمومي")) {
      $("archMainStreet").value = "الشارع العمومي (واجهة رئيسية)";
      $("archMainDoorPos").value = "top";
    }
    if (raw.includes("الشارع الخاص") || raw.includes("شارع خاص")) {
      $("archPrivStreet").value = "الشارع الخاص (مدخل جانبي وسلالم)";
      $("archStairPos").value = "left";
    }

    window.GEOArchRenderAll();
    if (logEl) {
      logEl.textContent = "✓ تم تحليل التصميم وتوزيع الغرف والأبواب والسلم وحساب تكلفة البناء بنجاح!";
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
     3. محرك الرسم المعماري (3 مراحل: 2D إنشائي، 3D بالارتفاع، التشطيب والفرش) + التكلفة
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
    const rooms = Math.max(1, Math.min(6, Math.floor(num("archRooms"))));
    const baths = Math.max(1, Math.min(4, Math.floor(num("archBaths"))));
    const heightM = Math.max(3, num("archHeight") || 7);
    const floors = Math.max(1, Math.round(heightM / 3.3));
    const mainDoorPos = $("archMainDoorPos")?.value || "top";
    const stairPos = $("archStairPos")?.value || "left";
    const showAxes = $("archShowAxes")?.value === "1";
    const hasShaft = $("archShaft")?.value === "1";
    const mainStreet = $("archMainStreet")?.value || "شارع عمومي";
    const privStreet = $("archPrivStreet")?.value || "شارع خاص";

    return {
      top, bottom, right, left, W, L, grossArea, netArea,
      wallThickCm, wallM, perim, rooms, baths, heightM, floors,
      mainDoorPos, stairPos, showAxes, hasShaft, mainStreet, privStreet
    };
  }

  // حساب توزيع الغرف النسبي داخل قطعة الأرض (0..1)
  function computeRoomLayout(spec) {
    const zones = [];
    const stairOnLeft = spec.stairPos === "left";

    // 1. الجزء الأمامي (الواجهة الرئيسية - بحري): سلم ومدخل خاص + ريسبشن واستقبال
    const frontH = 0.36;
    const stairW = 0.28;
    if (stairOnLeft) {
      zones.push({ id: "stair", name: "سلم علوي ومدخل خاص", x: 0, y: 0, w: stairW, h: frontH, color: "#a855f7" });
      zones.push({ id: "reception", name: "ريسبشن واستقبال", x: stairW, y: 0, w: 1 - stairW, h: frontH, color: "#14b8a6" });
    } else {
      zones.push({ id: "reception", name: "ريسبشن واستقبال", x: 0, y: 0, w: 1 - stairW, h: frontH, color: "#14b8a6" });
      zones.push({ id: "stair", name: "سلم علوي ومدخل خاص", x: 1 - stairW, y: 0, w: stairW, h: frontH, color: "#a855f7" });
    }

    // 2. الجزء الأوسط: صالة توزيع + مطبخ + حمام + منور
    const midY = frontH;
    const midH = 0.28;
    zones.push({ id: "hall", name: "صالة توزيع", x: 0, y: midY, w: 0.46, h: midH, color: "#38bdf8" });
    zones.push({ id: "kitchen", name: "مطبخ", x: 0.46, y: midY, w: 0.27, h: midH, color: "#f59e0b" });
    if (spec.hasShaft) {
      zones.push({ id: "bath", name: "حمام", x: 0.73, y: midY, w: 0.27, h: midH * 0.65, color: "#06b6d4" });
      zones.push({ id: "shaft", name: "منور", x: 0.73, y: midY + midH * 0.65, w: 0.27, h: midH * 0.35, color: "#64748b" });
    } else {
      zones.push({ id: "bath", name: "حمام", x: 0.73, y: midY, w: 0.27, h: midH, color: "#06b6d4" });
    }

    // 3. الجزء الخلفي (الهادئ - قبلي): غرف النوم
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
        color: "#22d3ee"
      });
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

    // مسح الخلفية ورسم شبكة هندسية
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
      "2d": "المرحلة (1): مخطط أوتوكاد إنشائي 2D (محاور + أعمدة + أبعاد)",
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

    // تحديث تقرير التكلفة والمقايسة
    renderArchCostReport(spec, zones);
  };

  function render2DOrFurnishedPlan(ctx, CW, CH, spec, zones, isFurnished) {
    const maxW = 460, maxH = 380;
    const scale = Math.min(maxW / spec.W, maxH / spec.L);
    const pw = spec.W * scale;
    const ph = spec.L * scale;
    const ox = (CW - pw) / 2;
    const oy = 95 + (maxH - ph) / 2;

    // أسماء الشوارع المحيطة
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
    ctx.fillText(`الواجهة الخلفية (${spec.bottom} م)`, ox + pw / 2, oy + ph + 38);

    // المحاور الإنشائية (Axes)
    if (spec.showAxes) {
      ctx.save();
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = "rgba(148, 163, 184, 0.25)";
      ctx.lineWidth = 1;
      const xTicks = [0, 0.28, 0.5, 0.73, 1];
      const yTicks = [0, 0.36, 0.64, 1];

      xTicks.forEach((t, i) => {
        const ax = ox + t * pw;
        ctx.beginPath(); ctx.moveTo(ax, oy - 18); ctx.lineTo(ax, oy + ph + 18); ctx.stroke();
        ctx.fillStyle = "#64748b"; ctx.font = "10px monospace";
        ctx.fillText(String(i + 1), ax, oy - 21);
      });
      yTicks.forEach((t, i) => {
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

      // أرضية الغرفة
      if (isFurnished) {
        ctx.fillStyle = z.id === "bath" || z.id === "kitchen"
          ? "rgba(6, 182, 212, 0.16)"
          : z.id === "stair"
            ? "rgba(168, 85, 247, 0.18)"
            : "rgba(245, 158, 11, 0.12)";
      } else {
        ctx.fillStyle = "rgba(15, 23, 42, 0.75)";
      }
      ctx.fillRect(rx, ry, rw, rh);

      // رسم الأثاث في المرحلة الثالثة (التشطيب والفرش)
      if (isFurnished) {
        drawFurnitureInZone(ctx, z, rx, ry, rw, rh);
      }

      // الحوائط
      ctx.strokeStyle = z.color;
      ctx.lineWidth = spec.wallThickCm === 25 ? 3 : 2;
      ctx.strokeRect(rx, ry, rw, rh);

      // اسم الفراغ وأبعاده بالمتر
      ctx.textAlign = "center";
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 11.5px Cairo, sans-serif";
      ctx.fillText(z.name, rx + rw / 2, ry + rh / 2 - 4);
      ctx.fillStyle = "#94a3b8";
      ctx.font = "10.5px Fira Code, monospace";
      ctx.fillText(`${realW}×${realH}م`, rx + rw / 2, ry + rh / 2 + 12);
    });

    // رسم الأعمدة الخرسانية عند التقاطعات
    if (spec.showAxes) {
      ctx.fillStyle = "#f59e0b";
      const colsX = [0, 0.28, 0.73, 1];
      const colsY = [0, 0.36, 0.64, 1];
      colsX.forEach(cx => {
        colsY.forEach(cy => {
          ctx.fillRect(ox + cx * pw - 4, oy + cy * ph - 4, 8, 8);
        });
      });
    }

    // رسم الباب الرئيسي (قوس فتح الباب) والباب الخاص
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 2.5;
    const mainDoorX = spec.stairPos === "left" ? ox + pw * 0.45 : ox + pw * 0.25;
    ctx.beginPath();
    ctx.arc(mainDoorX, oy, 18, 0, Math.PI / 2);
    ctx.stroke();
    ctx.fillStyle = "#10b981";
    ctx.font = "bold 10px Cairo, sans-serif";
    ctx.fillText("باب رئيسي", mainDoorX + 12, oy + 14);

    // الباب الخاص على الشارع الخاص (للسلم العلوي)
    const privDoorY = oy + ph * 0.16;
    ctx.strokeStyle = "#a855f7";
    ctx.beginPath();
    ctx.arc(ox, privDoorY, 15, -Math.PI / 2, 0);
    ctx.stroke();
    ctx.fillStyle = "#d8b4fe";
    ctx.fillText("باب خاص", ox + 28, privDoorY + 4);
  }

  function drawFurnitureInZone(ctx, z, rx, ry, rw, rh) {
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.45)";
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 1.2;

    if (z.id.startsWith("room_")) {
      // سرير مزدوج + دولاب
      const bw = Math.min(rw * 0.55, 48), bh = Math.min(rh * 0.52, 56);
      ctx.fillRect(rx + (rw - bw) / 2, ry + 10, bw, bh);
      ctx.strokeRect(rx + (rw - bw) / 2, ry + 10, bw, bh);
      // مخدات
      ctx.strokeRect(rx + (rw - bw) / 2 + 4, ry + 13, bw / 2 - 6, 10);
      ctx.strokeRect(rx + rw / 2 + 2, ry + 13, bw / 2 - 6, 10);
    } else if (z.id === "reception") {
      // طقم كنب + طاولة وسط
      ctx.strokeRect(rx + 12, ry + 14, rw - 24, 14);
      ctx.strokeRect(rx + 12, ry + 32, 14, rh - 48);
      ctx.fillRect(rx + rw / 2 - 18, ry + rh / 2 - 8, 36, 18);
    } else if (z.id === "kitchen") {
      // كاونتر المطبخ حرف L
      ctx.fillRect(rx + 4, ry + 4, rw - 8, 12);
      ctx.fillRect(rx + rw - 16, ry + 4, 12, rh - 12);
    } else if (z.id === "stair") {
      // درجات السلم
      const steps = 8;
      for (let s = 1; s < steps; s++) {
        const sy = ry + (rh / steps) * s;
        ctx.beginPath(); ctx.moveTo(rx + 4, sy); ctx.lineTo(rx + rw - 4, sy); ctx.stroke();
      }
    }
    ctx.restore();
  }

  function render3DIsometricHouse(ctx, CW, CH, spec, zones) {
    // رسم منظور أيزومتري 3D يوضح ارتفاع البناء (مثلاً 7 متر) والحوائط والتقسيم الداخلي
    const isoScale = Math.min(26, 260 / Math.max(spec.W, spec.L));
    const wallHpx = Math.min(130, spec.heightM * 16);
    const cx = CW / 2;
    const cy = CH / 2 + 55;

    const toIso = (x, y, z) => ({
      x: cx + (x - y) * 0.866 * isoScale,
      y: cy + (x + y) * 0.5 * isoScale - z
    });

    const hw = spec.W / 2, hl = spec.L / 2;

    // 1. قاعدة الأرضية (الأساس)
    const p0 = toIso(-hw, -hl, 0);
    const p1 = toIso(hw, -hl, 0);
    const p2 = toIso(hw, hl, 0);
    const p3 = toIso(-hw, hl, 0);

    ctx.fillStyle = "rgba(16, 185, 129, 0.16)";
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.lineTo(p3.x, p3.y);
    ctx.closePath(); ctx.fill(); ctx.stroke();

    // 2. رسم جدران الغرف الداخلية بارتفاع نصف شفاف لإظهار التقسيم من الداخل
    zones.forEach(z => {
      const x1 = -hw + z.x * spec.W;
      const y1 = -hl + z.y * spec.L;
      const x2 = x1 + z.w * spec.W;
      const y2 = y1 + z.h * spec.L;

      const b1 = toIso(x1, y1, 0), b2 = toIso(x2, y1, 0), b3 = toIso(x2, y2, 0), b4 = toIso(x1, y2, 0);
      const t1 = toIso(x1, y1, wallHpx), t2 = toIso(x2, y1, wallHpx), t3 = toIso(x2, y2, wallHpx), t4 = toIso(x1, y2, wallHpx);

      ctx.strokeStyle = z.color;
      ctx.fillStyle = "rgba(56, 189, 248, 0.08)";
      ctx.lineWidth = 1.5;

      // رسم الجدار الخلفي والأيمن للغرفة
      ctx.beginPath();
      ctx.moveTo(b1.x, b1.y); ctx.lineTo(b2.x, b2.y); ctx.lineTo(t2.x, t2.y); ctx.lineTo(t1.x, t1.y);
      ctx.closePath(); ctx.fill(); ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(b2.x, b2.y); ctx.lineTo(b3.x, b3.y); ctx.lineTo(t3.x, t3.y); ctx.lineTo(t2.x, t2.y);
      ctx.closePath(); ctx.fill(); ctx.stroke();

      // تسمية الغرفة داخل الـ 3D
      const center = toIso((x1 + x2) / 2, (y1 + y2) / 2, 12);
      ctx.fillStyle = "#f8fafc";
      ctx.font = "bold 10px Cairo, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(z.name, center.x, center.y);
    });

    // 3. الحواف الخارجية العلوية (السقف) وخط قياس الارتفاع (7 متر)
    const u0 = toIso(-hw, -hl, wallHpx);
    const u1 = toIso(hw, -hl, wallHpx);
    const u2 = toIso(hw, hl, wallHpx);
    const u3 = toIso(-hw, hl, wallHpx);

    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(u0.x, u0.y); ctx.lineTo(u1.x, u1.y); ctx.lineTo(u2.x, u2.y); ctx.lineTo(u3.x, u3.y);
    ctx.closePath(); ctx.stroke();

    // أعمدة الزوايا
    [[p0, u0], [p1, u1], [p2, u2], [p3, u3]].forEach(([b, t]) => {
      ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(t.x, t.y); ctx.stroke();
    });

    // خط بيان الارتفاع (من الأساس للسطح)
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p1.x + 22, p1.y);
    ctx.lineTo(u1.x + 22, u1.y);
    ctx.stroke();
    ctx.fillStyle = "#fca5a5";
    ctx.font = "bold 12px Cairo, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`الارتفاع: ${spec.heightM} م`, u1.x + 28, (p1.y + u1.y) / 2);
  }

  function renderArchCostReport(spec, zones) {
    // حساب كميات وتكلفة البناء التقديرية بناءً على المساحة والارتفاع (7م) وسمك الحائط (25سم/12سم)
    const totalSlabArea = spec.grossArea * spec.floors; // إجمالي مسطح الأسقف والأساسات
    const totalWallsLength = spec.perim * 2.2; // الحوائط الخارجية + القواطيع الداخلية
    const totalWallArea = totalWallsLength * spec.heightM;

    // الطوب: حائط 25 سم يحتاج ~110 طوبة/م² ، حائط 12 سم يحتاج ~55 طوبة/م²
    const bricksPerM2 = spec.wallThickCm === 25 ? 110 : 55;
    const totalBricks = Math.ceil(totalWallArea * bricksPerM2);

    // الخرسانة المسلحة (أساسات + أعمدة + أسقف): ~0.32 م³ لكل متر مسطح من الأدوار
    const rcVolume = totalSlabArea * 0.32;
    const cementTons = +(rcVolume * 0.35 + (totalBricks / 1000) * 0.15).toFixed(2);
    const steelTons = +(rcVolume * 0.095).toFixed(2);
    const sandM3 = +(rcVolume * 0.45 + totalWallArea * 0.03).toFixed(1);
    const gravelM3 = +(rcVolume * 0.8).toFixed(1);

    // متوسط أسعار السوق التقديرية في مصر
    const estCost = Math.round(
      cementTons * 3200 +
      steelTons * 38500 +
      (totalBricks / 1000) * 1800 +
      sandM3 * 180 +
      gravelM3 * 320 +
      totalSlabArea * 950 // مصنعيات وتشطيب أساسي
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
     4. منطق حساب ورسم المثلثات بطريقة هيرون (Heron Surveying & Canvas Plot)
     ========================================================================== */
  function calcHeronMetrics(a, b, c) {
    if (a <= 0 || b <= 0 || c <= 0 || a + b <= c || a + c <= b || b + c <= a) return null;
    const s = (a + b + c) / 2;
    const area = Math.sqrt(Math.max(0, s * (s - a) * (s - b) * (s - c)));
    // حساب الزوايا بقانون جيب التمام
    const angC = (Math.acos(Math.max(-1, Math.min(1, (a * a + b * b - c * c) / (2 * a * b)))) * 180) / Math.PI;
    const angB = (Math.acos(Math.max(-1, Math.min(1, (a * a + c * c - b * b) / (2 * a * c)))) * 180) / Math.PI;
    const angA = 180 - angB - angC;
    return { a, b, c, area, angA, angB, angC };
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
      return window.toast && window.toast("أطوال الأضلاع لا تكوّن مثلثاً صحيحاً (مجموع أي ضلعين يجب أن يكون أكبر من الثالث)", "warn");
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

    // رسم المثلثات بمقياس رسم دقيق على Canvas
    const ctx = cv.getContext("2d");
    const CW = cv.width, CH = cv.height;
    ctx.fillStyle = "#08101a";
    ctx.fillRect(0, 0, CW, CH);

    // شبكة هندسية
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

      // حساب إحداثيات رؤوس المثلث (P1 عند 0,0 و P2 عند c,0 و P3 من تقاطع الدائرتين)
      const x3 = (t.b * t.b + t.c * t.c - t.a * t.a) / (2 * t.c);
      const y3 = Math.sqrt(Math.max(0, t.b * t.b - x3 * x3));

      const minX = Math.min(0, t.c, x3), maxX = Math.max(0, t.c, x3);
      const minY = 0, maxY = y3;
      const triW = maxX - minX || 1;
      const triH = maxY - minY || 1;

      const scale = Math.min((cellW - 90) / triW, (cellH - 85) / triH);
      const midX = (minX + maxX) / 2;
      const midY = (minY + maxY) / 2;

      const toScreen = (px, py) => ({
        x: cx + (px - midX) * scale,
        y: cy - (py - midY) * scale
      });

      const S1 = toScreen(0, 0);
      const S2 = toScreen(t.c, 0);
      const S3 = toScreen(x3, y3);

      // تعبئة ورسم أضلاع المثلث
      ctx.fillStyle = "rgba(16, 185, 129, 0.16)";
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(S1.x, S1.y);
      ctx.lineTo(S2.x, S2.y);
      ctx.lineTo(S3.x, S3.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // كتابة أطوال الأضلاع على منتصف كل ضلع
      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 12px Cairo, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`C = ${t.c} م`, (S1.x + S2.x) / 2, (S1.y + S2.y) / 2 + 16);
      ctx.fillText(`B = ${t.b} م`, (S1.x + S3.x) / 2 - 22, (S1.y + S3.y) / 2 - 4);
      ctx.fillText(`A = ${t.a} م`, (S2.x + S3.x) / 2 + 22, (S2.y + S3.y) / 2 - 4);

      // كتابة اسم المثلث ومساحته في المركز
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 12px Cairo, sans-serif";
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
