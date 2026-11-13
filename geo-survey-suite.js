/* ============================================================================
   GeoDev Complete Survey & Engineering Suite v1.0 (geo-survey-suite.js)
   إضافة منظومة أدوات المسّاح الرقمي المتكاملة إلى قسم المساحة (#s-survey):
   1. لوحة الكروكي المساحي المعتمد بالخرطوشة + الفرز الشرعي + تصدير DXF وصورة.
   2. تقسيم الأنصبة والمسطحات (مواريث شرعية / حصص).
   3. حاسبة كميات مواد البناء والتسعير والمقايسة التقديرية.
   4. كشف وتوقيع علامات الملكية والحدود (Stakeout).
   5. إدارة حسابات ومصاريف وعمال المشاريع المساحية.
   ============================================================================ */

(function () {
  "use strict";
  if (window.GEOSurveySuite) return;
  window.GEOSurveySuite = true;

  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));
  const num = id => parseFloat($(id)?.value) || 0;

  /* ==========================================================================
     1. تعريف الأدوات الجديدة وإضافتها لشبكة المساحة
     ========================================================================== */
  const NEW_SURVEY_TOOLS = [
    {
      id: "kroki",
      icon: "file-spreadsheet",
      title: "لوحة الكروكي والفرز الشرعي",
      desc: "رسم كروكي بالخرطوشة والجيران وتصدير DXF",
      body: `
        <div class="tool-section">
          <h4><i data-lucide="clipboard-list"></i> بيانات الخرطوشة والموقع</h4>
          <div class="form-grid">
            <label>اسم المالك <input id="krOwner" class="c" placeholder="مثال: الحاج محمد عبد القادر"></label>
            <label>المهندس المسّاح <input id="krEng" class="c" value="م. أحمد سمير"></label>
            <label>الموقع / الحوض <input id="krLoc" class="c" placeholder="مثال: حوض الزهور - المنيا"></label>
            <label>التاريخ <input id="krDate" class="c" value="${new Date().toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}"></label>
          </div>
        </div>

        <div class="tool-section">
          <h4><i data-lucide="maximize-2"></i> الأضلاع الأربعة (بالمتر) والقطر</h4>
          <div class="form-grid">
            <label>بحري (أعلى) <input id="krN" type="number" step="any" value="40" class="c"></label>
            <label>قبلي (أسفل) <input id="krS" type="number" step="any" value="40" class="c"></label>
            <label>شرقي (يمين) <input id="krE" type="number" step="any" value="25" class="c"></label>
            <label>غربي (يسار) <input id="krW" type="number" step="any" value="25" class="c"></label>
          </div>
          <div class="form-grid">
            <label>القطر (اختياري للأرض غير القائمة) <input id="krDiag" type="number" step="any" value="0" class="c"></label>
            <label>زاوية انحراف الشمال (درجة) <input id="krNorth" type="number" step="any" value="0" class="c"></label>
          </div>
        </div>

        <div class="tool-section">
          <h4><i data-lucide="compass"></i> الجيران (الحدود الأربعة)</h4>
          <div class="form-grid">
            <label>الحد البحري <input id="krNeighN" class="c" value="شارع عمومي"></label>
            <label>الحد القبلي <input id="krNeighS" class="c" placeholder="اسم الجار القبلي"></label>
            <label>الحد الشرقي <input id="krNeighE" class="c" placeholder="اسم الجار الشرقي"></label>
            <label>الحد الغربي <input id="krNeighW" class="c" placeholder="اسم الجار الغربي"></label>
          </div>
        </div>

        <div class="tool-section">
          <h4><i data-lucide="users"></i> الفرز الشرعي وتقسيم المواريث (اختياري)</h4>
          <div class="form-grid">
            <label>عدد الذكور <input id="krMales" type="number" min="0" value="0" class="c"></label>
            <label>عدد الإناث <input id="krFemales" type="number" min="0" value="0" class="c"></label>
          </div>
          <label>اتجاه الفرز على الرسم
            <select id="krSplitDir" class="c">
              <option value="v">فرز طولي (رأسي)</option>
              <option value="h">فرز عرضي (أفقي)</option>
            </select>
          </label>
        </div>

        <div class="row" style="margin-top:10px">
          <button type="button" class="g" style="flex:2" onclick="window.GEOSurveyRenderKroki()">رسم اللوحة وحساب الفرز</button>
          <button type="button" class="a" style="flex:1" onclick="window.GEOSurveyExportKrokiDXF()">تصدير DXF</button>
          <button type="button" class="k" style="flex:1" onclick="window.GEOSurveySaveKrokiPNG()">حفظ صورة</button>
        </div>

        <div style="margin-top:14px;overflow-x:auto">
          <canvas id="krokiCanvas" width="820" height="620" style="width:100%;max-width:100%;height:auto;border-radius:12px;border:1px solid var(--ln);background:#0b131e"></canvas>
        </div>
        <div id="krokiReport" class="result-box"></div>
      `
    },
    {
      id: "shares",
      icon: "pie-chart",
      title: "تقسيم الأنصبة والمسطحات",
      desc: "توزيع المساحات بالفدان والقيراط والسهم",
      body: `
        <div class="tool-section">
          <h4><i data-lucide="layers"></i> إجمالي المساحة المطلوب تقسيمها</h4>
          <div class="form-grid">
            <label>فدان <input id="shFed" type="number" step="any" value="0" class="c"></label>
            <label>قيراط <input id="shQir" type="number" step="any" value="0" class="c"></label>
            <label>سهم <input id="shSah" type="number" step="any" value="0" class="c"></label>
            <label>أو بالمتر المربع مباشرة (m²) <input id="shM2" type="number" step="any" value="0" class="c"></label>
          </div>
        </div>

        <div class="tool-section">
          <h4><i data-lucide="divide-circle"></i> طريقة التقسيم</h4>
          <select id="shMode" class="c" onchange="$('shCustomRow').style.display=this.value==='custom'?'block':'none';$('shShariaRow').style.display=this.value==='sharia'?'grid':'none'">
            <option value="sharia">تقسيم شرعي (للذكر مثل حظ الأنثيين)</option>
            <option value="equal">تقسيم بالتساوي على عدد شركاء</option>
            <option value="custom">تقسيم بنسب مئوية أو أسهم مخصصة</option>
          </select>

          <div id="shShariaRow" class="form-grid" style="margin-top:8px">
            <label>عدد الذكور <input id="shMales" type="number" min="0" value="1" class="c"></label>
            <label>عدد الإناث <input id="shFemales" type="number" min="0" value="1" class="c"></label>
          </div>

          <div id="shCustomRow" style="display:none;margin-top:8px">
            <label>اكتب اسم كل شريك وحصته في سطر (مثال: أحمد 2 أو محمد 50%)
              <textarea id="shCustomList" rows="4" class="c" placeholder="أحمد  2&#10;محمود  1&#10;سارة  1"></textarea>
            </label>
          </div>

          <button type="button" class="g" style="width:100%;margin-top:10px" onclick="window.GEOSurveyCalcShares()">احسب الأنصبة بدقة</button>
          <div id="shResult" class="result-box"></div>
        </div>
      `
    },
    {
      id: "materials",
      icon: "blocks",
      title: "كميات مواد البناء والتسعير",
      desc: "حساب الخرسانة والحديد والطوب والتكلفة",
      body: `
        <div class="tool-section">
          <h4><i data-lucide="package-check"></i> حساب كميات وتكلفة البنود الإنشائية</h4>
          <label>نوع البند الإنشائي
            <select id="matType" class="c" onchange="window.GEOSurveyMatChanged()">
              <option value="rc">خرسانة مسلحة (قواعد / أعمدة / أسقف)</option>
              <option value="pc">خرسانة عادية (فرشة نظافة / دكة)</option>
              <option value="brick">مباني طوب (حوائط سمك 12 أو 25 سم)</option>
              <option value="plaster">محارة / بياض أسمنتي</option>
            </select>
          </label>

          <div class="form-grid">
            <label id="matQtyLabel">الكمية (متر مكعب م³) <input id="matQty" type="number" step="any" value="10" class="c"></label>
            <label id="matIronLabel">نسبة الحديد (كجم / م³) <input id="matIron" type="number" step="any" value="100" class="c"></label>
          </div>

          <h4 style="margin-top:12px"><i data-lucide="banknote"></i> أسعار السوق التقديرية (جنيه مصري)</h4>
          <div class="form-grid">
            <label>سعر طن الأسمنت <input id="prCement" type="number" value="3200" class="c"></label>
            <label>سعر طن الحديد <input id="prSteel" type="number" value="38500" class="c"></label>
            <label>سعر متر الرمل <input id="prSand" type="number" value="180" class="c"></label>
            <label>سعر متر الزلط / السن <input id="prGravel" type="number" value="320" class="c"></label>
          </div>

          <button type="button" class="a" style="width:100%;margin-top:10px" onclick="window.GEOSurveyCalcMaterials()">احسب الكميات والتكلفة الإجمالية</button>
          <div id="matResult" class="result-box"></div>
        </div>
      `
    },
    {
      id: "stakeout",
      icon: "map-pin",
      title: "كشف علامات الملكية والتوقيع",
      desc: "تحديد اتجاه ومسافة الوصول للنقطة المفقودة",
      body: `
        <div class="tool-section">
          <h4><i data-lucide="crosshair"></i> التوجيه نحو علامة الحد (Stakeout / Setting Out)</h4>
          <p class="mt">أدخل إحداثيات نقطة العلامة المطلوبة (Target) وإحداثيات وقوفك الحالية (أو التقطها بالـ GPS) لمعرفة المسافة والاتجاه الدقيق.</p>

          <div class="form-grid">
            <label>Target E (شرقي العلامة) <input id="stTarE" type="number" step="any" class="c" placeholder="مثال: 672500.50"></label>
            <label>Target N (شمالي العلامة) <input id="stTarN" type="number" step="any" class="c" placeholder="مثال: 3109800.25"></label>
          </div>

          <div class="form-grid">
            <label>Current E (شرقي موقعك) <input id="stCurE" type="number" step="any" class="c" placeholder="مثال: 672485.00"></label>
            <label>Current N (شمالي موقعك) <input id="stCurN" type="number" step="any" class="c" placeholder="مثال: 3109770.00"></label>
          </div>

          <div class="row" style="margin-top:8px">
            <button type="button" class="k" style="flex:1" onclick="window.GEOSurveyGetGPSStakeout()">التقاط موقعي الحالي (GPS -> UTM)</button>
            <button type="button" class="g" style="flex:1" onclick="window.GEOSurveyCalcStakeout()">احسب التوجيه والمسافة</button>
          </div>
          <div id="stResult" class="result-box"></div>
        </div>
      `
    },
    {
      id: "ledger",
      icon: "wallet",
      title: "حسابات ومصاريف المشاريع",
      desc: "إدارة يوميات العمال والمعدات وصافي الربح",
      body: `
        <div class="tool-section">
          <h4><i data-lucide="receipt"></i> دفتر حسابات ومصروفات المشروع المساحي</h4>
          <div class="form-grid">
            <label>اسم المشروع / العميل <input id="ldProjName" class="c" placeholder="رفع مساحي 50 فدان - المنيا"></label>
            <label>قيمة التعاقد الإجمالية (جنيه) <input id="ldBudget" type="number" step="any" value="0" class="c" oninput="window.GEOSurveyRenderLedger()"></label>
          </div>

          <div class="row" style="margin-top:8px">
            <input id="ldItemDesc" style="flex:2;margin:0" placeholder="البند (يوميات عمال، إيجار توتال، انتقالات...)">
            <input id="ldItemCost" type="number" style="flex:1;margin:0" placeholder="المبلغ">
            <button type="button" class="g" onclick="window.GEOSurveyAddExpense()">إضافة</button>
          </div>

          <div id="ldSummary" class="result-box" style="display:block;margin-top:12px"></div>
          <div id="ldList" style="margin-top:10px;max-height:240px;overflow-y:auto"></div>
          <button type="button" class="k" style="width:100%;margin-top:10px" onclick="window.GEOSurveyExportLedgerCSV()">تصدير كشف الحساب (CSV)</button>
        </div>
      `
    }
  ];

  /* ==========================================================================
     2. حقن النوافذ والكروت في شبكة المساحة (#surveyGrid)
     ========================================================================== */
  function mountSurveyTools() {
    const grid = $("surveyGrid");
    if (!grid) return;

    // إنشاء الـ Modals في body إذا لم تكن موجودة
    NEW_SURVEY_TOOLS.forEach(t => {
      if (!$(`modal-${t.id}`)) {
        document.body.insertAdjacentHTML("beforeend", `
          <div id="modal-${t.id}" class="tool-modal">
            <div class="tool-content" style="${t.id === 'kroki' ? 'max-width:860px' : ''}">
              <div class="tool-header">
                <h3><i data-lucide="${t.icon}"></i> ${esc(t.title)}</h3>
                <button class="close-btn" aria-label="إغلاق" onclick="closeTool('${t.id}')">✕</button>
              </div>
              <div class="tool-body">${t.body}</div>
            </div>
          </div>
        `);
      }

      // إضافة الكارت لشبكة المساحة إذا لم يكن مضافاً
      if (!grid.querySelector(`[onclick="openTool('${t.id}')"]`)) {
        grid.insertAdjacentHTML("beforeend", `
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
     3. منطق لوحة الكروكي المساحي المعتمد والفرز الشرعي + تصدير DXF وصورة
     ========================================================================== */
  function m2ToFeddanStr(m2) {
    const FED = 4200.833;
    const totalSahm = (m2 / FED) * 24 * 24;
    const f = Math.floor(totalSahm / 576);
    const remAfterF = totalSahm - f * 576;
    const q = Math.floor(remAfterF / 24);
    const s = remAfterF - q * 24;
    return `${f} فدان ، ${q} قيراط ، ${s.toFixed(2)} سهم`;
  }

  window.GEOSurveyRenderKroki = function () {
    const a = num("krN"), b = num("krS"), c = num("krE"), d = num("krW"), diag = num("krDiag");
    if (a <= 0 || b <= 0 || c <= 0 || d <= 0) {
      return window.toast && window.toast("يرجى إدخال أطوال الأضلاع الأربعة بشكل صحيح", "warn");
    }

    // حساب المساحة (إذا وجد قطر نحسب بمثلثين هيرون، وإلا بمتوسط الأضلاع المتقابلة)
    let area = 0;
    if (diag > 0 && a + c > diag && b + d > diag) {
      const s1 = (a + c + diag) / 2, s2 = (b + d + diag) / 2;
      area = Math.sqrt(Math.max(0, s1 * (s1 - a) * (s1 - c) * (s1 - diag))) +
             Math.sqrt(Math.max(0, s2 * (s2 - b) * (s2 - d) * (s2 - diag)));
    } else {
      area = ((a + b) / 2) * ((c + d) / 2);
    }
    const perim = a + b + c + d;

    const owner = $("krOwner")?.value.trim() || "غير محدد";
    const eng = $("krEng")?.value.trim() || "م. أحمد سمير";
    const loc = $("krLoc")?.value.trim() || "غير محدد";
    const date = $("krDate")?.value.trim() || "";
    const northAng = num("krNorth");

    const nN = $("krNeighN")?.value.trim() || "-";
    const nS = $("krNeighS")?.value.trim() || "-";
    const nE = $("krNeighE")?.value.trim() || "-";
    const nW = $("krNeighW")?.value.trim() || "-";

    const males = Math.max(0, Math.floor(num("krMales")));
    const females = Math.max(0, Math.floor(num("krFemales")));
    const totalShares = males * 2 + females;
    const splitDir = $("krSplitDir")?.value || "v";

    // رسم اللوحة على Canvas
    const cv = $("krokiCanvas");
    if (!cv) return;
    const ctx = cv.getContext("2d");
    const W = cv.width, H = cv.height;

    // الخلفية والشبكة الهندسية
    ctx.fillStyle = "#0b131e";
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "#162436";
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 25) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 25) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // إطار اللوحة الخارجي
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 2;
    ctx.strokeRect(12, 12, W - 24, H - 24);

    // ترويسة اللوحة
    ctx.fillStyle = "#10b981";
    ctx.font = "bold 16px Cairo, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("لوحة الكروكي المساحي والخرطوشة المعتمدة", W - 28, 38);
    ctx.textAlign = "left";
    ctx.fillStyle = "#f59e0b";
    ctx.fillText(`المساحة: ${area.toFixed(2)} م²`, 28, 38);

    // رسم سهم الشمال
    ctx.save();
    ctx.translate(75, 110);
    ctx.rotate((northAng * Math.PI) / 180);
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, 26, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = "#10b981";
    ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(8, 8); ctx.lineTo(0, 2); ctx.lineTo(-8, 8); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.fillStyle = "#94a3b8";
    ctx.font = "12px Cairo, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`شمال (${northAng}°)`, 75, 152);

    // رسم شكل الأرض في المنتصف
    const maxW = 420, maxH = 260;
    const avgW = (a + b) / 2, avgH = (c + d) / 2;
    const scale = Math.min(maxW / avgW, maxH / avgH);
    const rw = avgW * scale, rh = avgH * scale;
    const rx = (W - rw) / 2, ry = 115 + (maxH - rh) / 2;

    ctx.fillStyle = "rgba(16, 185, 129, 0.12)";
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 3;
    ctx.fillRect(rx, ry, rw, rh);
    ctx.strokeRect(rx, ry, rw, rh);

    // رسم خطوط الفرز الشرعي إن وجدت
    if (totalShares > 0) {
      let acc = 0;
      const heirs = [];
      for (let i = 1; i <= males; i++) heirs.push({ label: `ذكر (${i})`, weight: 2, color: "rgba(16,185,129,0.2)" });
      for (let i = 1; i <= females; i++) heirs.push({ label: `أنثى (${i})`, weight: 1, color: "rgba(139,92,246,0.2)" });

      heirs.forEach((h, idx) => {
        const ratio = h.weight / totalShares;
        const partArea = area * ratio;
        ctx.fillStyle = h.color;

        if (splitDir === "v") {
          const px = rx + acc * rw;
          const pw = ratio * rw;
          ctx.fillRect(px, ry, pw, rh);
          if (idx > 0) {
            ctx.save(); ctx.setLineDash([6, 4]); ctx.strokeStyle = "#e2e8f0"; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(px, ry); ctx.lineTo(px, ry + rh); ctx.stroke(); ctx.restore();
          }
          ctx.fillStyle = "#fff"; ctx.font = "bold 13px Cairo, sans-serif"; ctx.textAlign = "center";
          ctx.fillText(h.label, px + pw / 2, ry + rh / 2 - 6);
          ctx.fillStyle = "#fbbf24"; ctx.font = "12px Fira Code, monospace";
          ctx.fillText(`${partArea.toFixed(1)} m²`, px + pw / 2, ry + rh / 2 + 14);
        } else {
          const py = ry + acc * rh;
          const ph = ratio * rh;
          ctx.fillRect(rx, py, rw, ph);
          if (idx > 0) {
            ctx.save(); ctx.setLineDash([6, 4]); ctx.strokeStyle = "#e2e8f0"; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(rx, py); ctx.lineTo(rx + rw, py); ctx.stroke(); ctx.restore();
          }
          ctx.fillStyle = "#fff"; ctx.font = "bold 13px Cairo, sans-serif"; ctx.textAlign = "center";
          ctx.fillText(`${h.label} (${partArea.toFixed(1)} m²)`, rx + rw / 2, py + ph / 2 + 4);
        }
        acc += ratio;
      });
    }

    // كتابة الأبعاد والجيران على الجهات الأربع
    ctx.textAlign = "center";
    // بحري
    ctx.fillStyle = "#38bdf8"; ctx.font = "bold 13px Cairo, sans-serif";
    ctx.fillText(`بحري: ${a} م`, rx + rw / 2, ry - 10);
    ctx.fillStyle = "#94a3b8"; ctx.font = "12px Cairo, sans-serif";
    ctx.fillText(`جار: ${nN}`, rx + rw / 2, ry - 27);
    // قبلي
    ctx.fillStyle = "#38bdf8"; ctx.font = "bold 13px Cairo, sans-serif";
    ctx.fillText(`قبلي: ${b} م`, rx + rw / 2, ry + rh + 20);
    ctx.fillStyle = "#94a3b8"; ctx.font = "12px Cairo, sans-serif";
    ctx.fillText(`جار: ${nS}`, rx + rw / 2, ry + rh + 37);
    // شرقي
    ctx.textAlign = "left";
    ctx.fillStyle = "#38bdf8"; ctx.font = "bold 13px Cairo, sans-serif";
    ctx.fillText(`شرقي: ${c} م`, rx + rw + 12, ry + rh / 2 - 4);
    ctx.fillStyle = "#94a3b8"; ctx.font = "12px Cairo, sans-serif";
    ctx.fillText(`جار: ${nE}`, rx + rw + 12, ry + rh / 2 + 14);
    // غربي
    ctx.textAlign = "right";
    ctx.fillStyle = "#38bdf8"; ctx.font = "bold 13px Cairo, sans-serif";
    ctx.fillText(`غربي: ${d} م`, rx - 12, ry + rh / 2 - 4);
    ctx.fillStyle = "#94a3b8"; ctx.font = "12px Cairo, sans-serif";
    ctx.fillText(`جار: ${nW}`, rx - 12, ry + rh / 2 + 14);

    // رسم جدول الخرطوشة السفلي
    const boxY = 485, boxH = 110;
    ctx.strokeStyle = "#10b981"; ctx.lineWidth = 1.5;
    ctx.strokeRect(24, boxY, W - 48, boxH);
    const colW = (W - 48) / 3;
    ctx.beginPath();
    ctx.moveTo(24 + colW, boxY); ctx.lineTo(24 + colW, boxY + boxH);
    ctx.moveTo(24 + colW * 2, boxY); ctx.lineTo(24 + colW * 2, boxY + boxH);
    ctx.stroke();

    // العمود الأيمن: بيانات المالك والموقع
    ctx.textAlign = "right";
    ctx.fillStyle = "#f59e0b"; ctx.font = "bold 13px Cairo, sans-serif";
    ctx.fillText(`المالك: ${owner}`, W - 36, boxY + 28);
    ctx.fillStyle = "#e2e8f0"; ctx.font = "12px Cairo, sans-serif";
    ctx.fillText(`الموقع: ${loc}`, W - 36, boxY + 54);
    ctx.fillStyle = "#94a3b8";
    ctx.fillText(`التاريخ: ${date}`, W - 36, boxY + 80);

    // العمود الأوسط: المساحة والمحيط
    ctx.fillStyle = "#10b981"; ctx.font = "bold 13px Cairo, sans-serif";
    ctx.fillText(`المساحة: ${area.toFixed(2)} م²`, W - 36 - colW, boxY + 28);
    ctx.fillStyle = "#fbbf24"; ctx.font = "11.5px Cairo, sans-serif";
    ctx.fillText(m2ToFeddanStr(area), W - 36 - colW, boxY + 54);
    ctx.fillStyle = "#e2e8f0"; ctx.font = "12px Cairo, sans-serif";
    ctx.fillText(`المحيط: ${perim.toFixed(2)} م`, W - 36 - colW, boxY + 80);

    // العمود الأيسر: المهندس المساح
    ctx.fillStyle = "#94a3b8"; ctx.font = "12px Cairo, sans-serif";
    ctx.fillText("المسّاح القائم بالرفع:", W - 36 - colW * 2, boxY + 28);
    ctx.fillStyle = "#ffffff"; ctx.font = "bold 15px Cairo, sans-serif";
    ctx.fillText(eng, W - 36 - colW * 2, boxY + 56);
    ctx.fillStyle = "#10b981"; ctx.font = "11px Cairo, sans-serif";
    ctx.fillText("GeoDev Studio Pro", W - 36 - colW * 2, boxY + 82);

    // تقرير نصي أسفل اللوحة
    let repHtml = `<h4>تقرير الكروكي المساحي</h4>
      <p><b>المساحة الكلية:</b> ${area.toFixed(2)} م² (${m2ToFeddanStr(area)}) | <b>المحيط:</b> ${perim.toFixed(2)} م</p>`;
    if (totalShares > 0) {
      const mArea = area * (2 / totalShares);
      const fArea = area * (1 / totalShares);
      repHtml += `<hr><p><b>توزيع الفرز الشرعي (للذكر مثل حظ الأنثيين):</b></p>`;
      if (males > 0) repHtml += `<p>• نصيب الذكر الواحد: <b>${mArea.toFixed(2)} م²</b> (${m2ToFeddanStr(mArea)})</p>`;
      if (females > 0) repHtml += `<p>• نصيب الأنثى الواحدة: <b>${fArea.toFixed(2)} م²</b> (${m2ToFeddanStr(fArea)})</p>`;
    }
    $("krokiReport").style.display = "block";
    $("krokiReport").innerHTML = repHtml;
  };

  window.GEOSurveySaveKrokiPNG = function () {
    const cv = $("krokiCanvas");
    if (!cv) return;
    const a = document.createElement("a");
    a.href = cv.toDataURL("image/png");
    a.download = "GeoDev-Kroki-" + Date.now() + ".png";
    a.click();
    if (window.toast) window.toast("تم حفظ صورة الكروكي بنجاح", "success");
  };

  window.GEOSurveyExportKrokiDXF = function () {
    const a = num("krN"), b = num("krS"), c = num("krE"), d = num("krW");
    if (a <= 0 || c <= 0) return window.toast && window.toast("أدخل الأضلاع أولاً", "warn");
    const w = (a + b) / 2, h = (c + d) / 2;
    const dxf = [
      "0", "SECTION", "2", "ENTITIES",
      "0", "LWPOLYLINE", "8", "BOUNDARY", "90", "4", "70", "1",
      "10", "0", "20", "0",
      "10", w.toFixed(3), "20", "0",
      "10", w.toFixed(3), "20", h.toFixed(3),
      "10", "0", "20", h.toFixed(3),
      "0", "ENDSEC", "0", "EOF"
    ].join("\n");
    if (typeof window.dlText === "function") window.dlText(dxf, "GeoDev-Kroki-" + Date.now() + ".dxf");
    if (window.toast) window.toast("تم تصدير ملف DXF للأوتوكاد", "success");
  };

  /* ==========================================================================
     4. منطق تقسيم الأنصبة والمسطحات
     ========================================================================== */
  window.GEOSurveyCalcShares = function () {
    const FED = 4200.833, QIR = FED / 24, SAH = QIR / 24;
    let totalM2 = num("shM2");
    if (totalM2 <= 0) {
      totalM2 = num("shFed") * FED + num("shQir") * QIR + num("shSah") * SAH;
    }
    if (totalM2 <= 0) return window.toast && window.toast("أدخل المساحة بالفدان/القيراط/السهم أو بالمتر المربع", "warn");

    const mode = $("shMode").value;
    let rows = "";

    if (mode === "sharia") {
      const m = Math.max(0, Math.floor(num("shMales")));
      const f = Math.max(0, Math.floor(num("shFemales")));
      const tot = m * 2 + f;
      if (tot <= 0) return window.toast && window.toast("أدخل عدد الذكور أو الإناث", "warn");
      if (m > 0) {
        const area = totalM2 * (2 / tot);
        rows += `<tr><td>الذكر الواحد (عدد ${m})</td><td>${area.toFixed(2)} m²</td><td>${m2ToFeddanStr(area)}</td></tr>`;
      }
      if (f > 0) {
        const area = totalM2 * (1 / tot);
        rows += `<tr><td>الأنثى الواحدة (عدد ${f})</td><td>${area.toFixed(2)} m²</td><td>${m2ToFeddanStr(area)}</td></tr>`;
      }
    } else if (mode === "equal") {
      const n = parseInt(prompt("أدخل عدد الشركاء للتقسيم بالتساوي:", "2")) || 0;
      if (n <= 0) return;
      const area = totalM2 / n;
      rows += `<tr><td>نصيب الفرد الواحد (من ${n})</td><td>${area.toFixed(2)} m²</td><td>${m2ToFeddanStr(area)}</td></tr>`;
    } else {
      const lines = ($("shCustomList").value || "").trim().split(/\n/).filter(Boolean);
      const parsed = lines.map(l => {
        const parts = l.trim().split(/[\s,;]+/);
        const val = parseFloat(parts.pop().replace("%", "")) || 0;
        return { name: parts.join(" ") || "شريك", val };
      }).filter(x => x.val > 0);
      const sumW = parsed.reduce((s, x) => s + x.val, 0);
      if (sumW <= 0) return window.toast && window.toast("أدخل أسماء وحصص الشركاء بشكل صحيح", "warn");
      rows = parsed.map(p => {
        const area = totalM2 * (p.val / sumW);
        return `<tr><td>${esc(p.name)}</td><td>${area.toFixed(2)} m²</td><td>${m2ToFeddanStr(area)}</td></tr>`;
      }).join("");
    }

    $("shResult").style.display = "block";
    $("shResult").innerHTML = `
      <h4>نتائج توزيع الأنصبة والمسطحات</h4>
      <p><b>إجمالي المساحة:</b> ${totalM2.toFixed(2)} m² (${m2ToFeddanStr(totalM2)})</p>
      <table class="pt">
        <thead><tr><th>المستحق / الشريك</th><th>المساحة (m²)</th><th>بالفدان والقيراط والسهم</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  };

  /* ==========================================================================
     5. منطق حاسبة كميات مواد البناء والتسعير
     ========================================================================== */
  window.GEOSurveyMatChanged = function () {
    const t = $("matType").value;
    $("matIronLabel").style.display = t === "rc" ? "flex" : "none";
    $("matQtyLabel").childNodes[0].nodeValue = (t === "brick" || t === "plaster") ? "المساحة (متر مربع م²) " : "الكمية (متر مكعب م³) ";
  };

  window.GEOSurveyCalcMaterials = function () {
    const t = $("matType").value;
    const qty = num("matQty");
    if (qty <= 0) return window.toast && window.toast("أدخل الكمية بشكل صحيح", "warn");

    const pCem = num("prCement"), pStl = num("prSteel"), pSnd = num("prSand"), pGrv = num("prGravel");
    let cementTons = 0, steelTons = 0, sandM3 = 0, gravelM3 = 0, bricksCount = 0, notes = "";

    if (t === "rc") {
      cementTons = qty * 0.35; // 7 شكاير للمتر المكعب
      sandM3 = qty * 0.4;
      gravelM3 = qty * 0.8;
      steelTons = (qty * num("matIron")) / 1000;
      notes = `معدل 350 كجم أسمنت/م³ + ${num("matIron")} كجم حديد/م³`;
    } else if (t === "pc") {
      cementTons = qty * 0.25; // 5 شكاير للمتر المكعب
      sandM3 = qty * 0.4;
      gravelM3 = qty * 0.8;
      notes = "معدل 250 كجم أسمنت/م³ للخرسانة العادية";
    } else if (t === "brick") {
      bricksCount = Math.ceil(qty * 55); // 55 طوبة للمتر المربع شامل الهالك
      cementTons = (qty / 1000) * 15 * 0.05; // شيكارة لكل 70 طوبة تقريباً
      sandM3 = (qty / 20) * 1.0;
      notes = "معدل 55 طوبة للمتر المربع (حائط نصف طوبة 12 سم شامل الهالك)";
    } else if (t === "plaster") {
      cementTons = (qty / 35) * 0.35;
      sandM3 = qty * 0.025;
      notes = "متوسط سمك محارة 2 سم شامل الطرطشة والبؤج";
    }

    const totalCost = cementTons * pCem + steelTons * pStl + sandM3 * pSnd + gravelM3 * pGrv;

    $("matResult").style.display = "block";
    $("matResult").innerHTML = `
      <h4>مقايسة الكميات والتكلفة التقديرية</h4>
      <p class="mt">${notes}</p>
      <table class="pt">
        <thead><tr><th>البند / الخامة</th><th>الكمية المطلوبة</th><th>التكلفة التقديرية</th></tr></thead>
        <tbody>
          <tr><td>الأسمنت</td><td>${cementTons.toFixed(2)} طن (${Math.ceil(cementTons * 20)} شيكارة)</td><td>${(cementTons * pCem).toLocaleString()} ج.م</td></tr>
          ${steelTons > 0 ? `<tr><td>حديد التسليح</td><td>${steelTons.toFixed(3)} طن (${(steelTons * 1000).toFixed(0)} كجم)</td><td>${(steelTons * pStl).toLocaleString()} ج.م</td></tr>` : ""}
          <tr><td>الرمل</td><td>${sandM3.toFixed(2)} م³</td><td>${(sandM3 * pSnd).toLocaleString()} ج.م</td></tr>
          ${gravelM3 > 0 ? `<tr><td>الزلط / السن</td><td>${gravelM3.toFixed(2)} م³</td><td>${(gravelM3 * pGrv).toLocaleString()} ج.م</td></tr>` : ""}
          ${bricksCount > 0 ? `<tr><td>الطوب</td><td>${bricksCount.toLocaleString()} طوبة</td><td>حسب سعر الألف</td></tr>` : ""}
        </tbody>
      </table>
      <p style="margin-top:10px;font-size:15px"><b>إجمالي تكلفة الخامات:</b> <span style="color:var(--gr)">${Math.round(totalCost).toLocaleString()} جنيه مصري</span></p>
    `;
  };

  /* ==========================================================================
     6. منطق كشف علامات الملكية والتوقيع (Stakeout)
     ========================================================================== */
  window.GEOSurveyGetGPSStakeout = function () {
    if (!navigator.geolocation) return window.toast && window.toast("GPS غير مدعوم", "warn");
    window.toast && window.toast("جاري التقاط موقعك وتحويله لـ UTM...", "info");
    navigator.geolocation.getCurrentPosition(p => {
      if (typeof window.utmConv === "function") {
        const u = window.utmConv(p.coords.latitude, p.coords.longitude);
        $("stCurE").value = u.e.toFixed(3);
        $("stCurN").value = u.n.toFixed(3);
        window.toast && window.toast("تم تحديث إحداثيات موقعك بنجاح", "success");
      }
    }, e => window.toast && window.toast(e.message, "error"), { enableHighAccuracy: true });
  };

  window.GEOSurveyCalcStakeout = function () {
    const tE = num("stTarE"), tN = num("stTarN"), cE = num("stCurE"), cN = num("stCurN");
    if (!tE || !tN || !cE || !cN) return window.toast && window.toast("أدخل إحداثيات العلامة وموقعك الحالي", "warn");

    const dE = tE - cE;
    const dN = tN - cN;
    const dist = Math.hypot(dE, dN);
    let az = (Math.atan2(dE, dN) * 180) / Math.PI;
    if (az < 0) az += 360;

    const dirNS = dN >= 0 ? `تحرك شمالاً (North): ${Math.abs(dN).toFixed(3)} م` : `تحرك جنوباً (South): ${Math.abs(dN).toFixed(3)} م`;
    const dirEW = dE >= 0 ? `تحرك شرقاً (East): ${Math.abs(dE).toFixed(3)} م` : `تحرك غرباً (West): ${Math.abs(dE).toFixed(3)} م`;

    $("stResult").style.display = "block";
    $("stResult").innerHTML = `
      <h4>بيانات التوجيه للوصول إلى علامة الحد</h4>
      <p><b>المسافة الأفقية المباشرة:</b> <span style="color:var(--gr);font-size:16px">${dist.toFixed(3)} متر</span></p>
      <p><b>زاوية الانحراف من الشمال (Azimuth):</b> <b>${az.toFixed(3)}°</b></p>
      <hr>
      <p>• ${dirNS}</p>
      <p>• ${dirEW}</p>
    `;
  };

  /* ==========================================================================
     7. منطق إدارة حسابات ومصاريف المشاريع المساحية
     ========================================================================== */
  const LEDGER_KEY = "gd_survey_ledger";
  const getLedger = () => { try { return JSON.parse(localStorage.getItem(LEDGER_KEY) || "[]"); } catch (_) { return []; } };
  const saveLedger = arr => localStorage.setItem(LEDGER_KEY, JSON.stringify(arr));

  window.GEOSurveyRenderLedger = function () {
    const list = getLedger();
    const budget = num("ldBudget");
    const totalExp = list.reduce((s, x) => s + (Number(x.cost) || 0), 0);
    const net = budget - totalExp;

    if ($("ldSummary")) {
      $("ldSummary").innerHTML = `
        <p><b>إجمالي المصروفات:</b> <span style="color:#f87171">${totalExp.toLocaleString()} ج.م</span> | 
        <b>المتبقي / صافي الربح:</b> <span style="color:var(--gr)">${net.toLocaleString()} ج.م</span></p>
      `;
    }

    if ($("ldList")) {
      $("ldList").innerHTML = list.length ? list.map((item, idx) => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;background:var(--bg);border:1px solid var(--ln);border-radius:8px;margin-bottom:6px">
          <div>
            <b style="font-size:13px">${esc(item.desc)}</b>
            <span class="mt" style="display:block">${esc(item.date)}</span>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <b style="color:var(--am)">${Number(item.cost).toLocaleString()} ج.م</b>
            <button type="button" class="r" style="padding:2px 8px;min-height:26px" onclick="window.GEOSurveyDelExpense(${idx})">×</button>
          </div>
        </div>
      `).join("") : `<div class="mt">لا توجد مصروفات مسجلة بعد.</div>`;
    }
  };

  window.GEOSurveyAddExpense = function () {
    const desc = $("ldItemDesc")?.value.trim();
    const cost = num("ldItemCost");
    if (!desc || cost <= 0) return window.toast && window.toast("أدخل وصف البند والمبلغ", "warn");
    const list = getLedger();
    list.unshift({ desc, cost, date: new Date().toLocaleDateString("ar-EG") });
    saveLedger(list);
    $("ldItemDesc").value = "";
    $("ldItemCost").value = "";
    window.GEOSurveyRenderLedger();
  };

  window.GEOSurveyDelExpense = function (idx) {
    const list = getLedger();
    list.splice(idx, 1);
    saveLedger(list);
    window.GEOSurveyRenderLedger();
  };

  window.GEOSurveyExportLedgerCSV = function () {
    const list = getLedger();
    if (!list.length) return window.toast && window.toast("لا توجد بيانات للتصدير", "warn");
    const proj = $("ldProjName")?.value.trim() || "مشروع مساحي";
    const csv = "\uFEFFالمشروع,البند,المبلغ,التاريخ\n" +
      list.map(x => `"${proj}","${x.desc}",${x.cost},"${x.date}"`).join("\n");
    if (typeof window.dlText === "function") window.dlText(csv, "Survey-Ledger-" + Date.now() + ".csv");
  };

  /* ==========================================================================
     8. التشغيل والربط مع شبكة المساحة
     ========================================================================== */
  function initSuite() {
    mountSurveyTools();
    window.GEOSurveyRenderLedger();

    // ربط مع renderSurveyGrid الأصلية لضمان بقاء الكروت عند إعادة الرسم
    if (typeof window.renderSurveyGrid === "function") {
      const _origRender = window.renderSurveyGrid;
      window.renderSurveyGrid = function () {
        _origRender.apply(this, arguments);
        mountSurveyTools();
      };
    }

    // رسم الكروكي الافتراضي عند فتح نافذته
    if (typeof window.openTool === "function") {
      const _origOpen = window.openTool;
      window.openTool = function (id) {
        _origOpen.apply(this, arguments);
        if (id === "kroki") setTimeout(() => window.GEOSurveyRenderKroki(), 80);
        if (id === "ledger") window.GEOSurveyRenderLedger();
      };
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSuite);
  } else {
    initSuite();
  }
})();
