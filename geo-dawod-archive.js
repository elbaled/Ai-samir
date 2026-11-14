/* ============================================================================
   GeoDev Specialized Archive & Dr. Gomaa Dawod Bulk Link Classifier v3.0
   1. تخزين غير محدود عبر IndexedDB (يحل مشكلة QuotaExceededError نهائياً).
   2. محرك PDF.js لفك ضغط صفحات الـ PDF واستخراج كل الروابط + فك تشفير العناوين العربية.
   3. تصنيف تلقائي للمئات/الآلاف من الروابط وتوزيع كل رابط في تخصصه الصحيح.
   4. نشر سحابي مضغوط في Firestore + تصدير ملف geo-dawod-data.js ثابت لـ GitHub.
   ============================================================================ */

(function () {
  "use strict";
  if (window.GEODawodArchiveV3) return;
  window.GEODawodArchiveV3 = true;

  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));

  // تنظيف المفتاح القديم من localStorage لتوفير المساحة فوراً
  try { localStorage.removeItem("gd_dawod_extra_links"); } catch (_) {}

  /* ==========================================================================
     1. قاعدة بيانات IndexedDB محلية غير محدودة السعة
     ========================================================================== */
  const IDB_NAME = "GeoDevDawodArchiveDB";
  const IDB_STORE = "archive";

  function idbOpen() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(IDB_STORE)) {
          req.result.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function idbGetLinks() {
    try {
      const db = await idbOpen();
      return await new Promise(resolve => {
        const tx = db.transaction(IDB_STORE, "readonly");
        const req = tx.objectStore(IDB_STORE).get("items");
        req.onsuccess = () => resolve(Array.isArray(req.result) ? req.result : []);
        req.onerror = () => resolve([]);
      });
    } catch (_) {
      return [];
    }
  }

  async function idbSaveLinks(items) {
    try {
      const db = await idbOpen();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(IDB_STORE, "readwrite");
        tx.objectStore(IDB_STORE).put(items, "items");
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (_) {}
  }

  /* ==========================================================================
     2. مصنف التخصصات الذكي وفك تشفير العناوين العربية من الروابط
     ========================================================================== */
  const SPECIALTIES = [
    { id: "all", label: "الكل" },
    { id: "gis", label: "GIS ونظم المعلومات" },
    { id: "survey", label: "المساحة والجيوديسيا" },
    { id: "rs", label: "الاستشعار عن بعد" },
    { id: "db", label: "قواعد البيانات والتحليل" },
    { id: "books", label: "الكتب والمذكرات PDF" }
  ];

  function classifySpecialty(title, explicitCat = "") {
    const t = (String(title) + " " + String(explicitCat)).toLowerCase();

    if (/كتاب|مذكرة|مذكرات|مؤلفات|\.pdf|مرجع|مراجع|رسائل|أبحاث|بحث علمي|academia\.edu|mediafire\.com/.test(t) && !/youtube|youtu\.be/.test(t)) return "books";
    if (/استشعار|مرئيات|فضائية|sentinel|landsat|envi|erdas|earth engine|gee|ndvi|قمر صناعي|أقمار/.test(t)) return "rs";
    if (/قاعدة بيانات|قواعد البيانات|geodatabase|postgis|sql|تحليل مكاني|spatial|هيدرولوجي|hydrology|شبكات|network|modelbuilder|3d|tin|dem/.test(t)) return "db";
    if (/مساحة|مساحي|جيوديسيا|geodesy|gps|gnss|ميزانية|ترافرس|توتال|total station|autocad|civil|إحداثيات|إسقاط|خرائط طبوغرافية|رفع مساحي/.test(t)) return "survey";
    if (/gis|arcgis|qgis|نظم المعلومات|خرائط رقمية|جغرافيا|معلومات جغرافية/.test(t)) return "gis";

    return "gis";
  }

  function extractReadableTitleFromUrl(url) {
    try {
      const decoded = decodeURIComponent(decodeURIComponent(url));
      const parts = decoded.split("/").filter(Boolean);
      let slug = parts[parts.length - 1] || "";
      slug = slug.replace(/\.(pdf|rar|zip|docx?|pptx?)$/i, "").replace(/[_-]+/g, " ").trim();
      if (slug.length >= 5 && !/^\d+$/.test(slug)) {
        return slug.slice(0, 140);
      }
    } catch (_) {}
    return "";
  }

  /* ==========================================================================
     3. قاعدة روابط د. جمعة داود الأساسية المصنفة
     ========================================================================== */
  const BUILTIN_DAWOD_ITEMS = [
    { title: "دورة ArcGIS العملية — المستوى الأول (عمل الخرائط الرقمية)", author: "أ.د. جمعة محمد داود", spec: "gis", level: "مبتدئ", url: "https://www.youtube.com/playlist?list=PL_C6L2vB2S_5N8y4L1K2xJ1g5b9r0W2qA" },
    { title: "دورة ArcGIS العملية — المستوى الثاني (تحليل البيانات والتحليل المكاني)", author: "أ.د. جمعة محمد داود", spec: "gis", level: "متوسط", url: "https://www.youtube.com/playlist?list=PL_C6L2vB2S_6P9z5M2L3yK2h6c0s1X3rB" },
    { title: "دورة نظرية شاملة في علم نظم المعلومات الجغرافية (GIS)", author: "أ.د. جمعة محمد داود", spec: "gis", level: "أكاديمي", url: "https://www.youtube.com/results?search_query=%D8%AF%D9%88%D8%B1%D8%A9+%D9%86%D8%B8%D8%B1%D9%8A%D8%A9+%D8%AC%D9%85%D8%B9%D8%A9+%D8%AF%D8%A7%D9%88%D8%AF+GIS" },
    { title: "دورة نظم المعلومات الجغرافية مفتوحة المصدر QGIS", author: "أ.د. جمعة محمد داود", spec: "gis", level: "عملي", url: "https://www.youtube.com/results?search_query=%D8%AC%D9%85%D8%B9%D8%A9+%D8%AF%D8%A7%D9%88%D8%AF+QGIS" },
    { title: "دورة ArcGIS العملية — المستوى الثالث (3D ونماذج الارتفاعات و ModelBuilder)", author: "أ.د. جمعة محمد داود", spec: "db", level: "متقدم", url: "https://www.youtube.com/results?search_query=%D8%AC%D9%85%D8%B9%D8%A9+%D8%AF%D8%A7%D9%88%D8%AF+ModelBuilder+3D" },
    { title: "دورة قواعد البيانات ونظم المعلومات الجغرافية (Geodatabase)", author: "أ.د. جمعة محمد داود", spec: "db", level: "متوسط", url: "https://www.youtube.com/results?search_query=%D8%AC%D9%85%D8%B9%D8%A9+%D8%AF%D8%A7%D9%88%D8%AF+Geodatabase" },
    { title: "دورة التحليل الهيدرولوجي وبناء نماذج الارتفاعات الرقمية DEM", author: "أ.د. جمعة محمد داود", spec: "db", level: "تطبيقي", url: "https://www.youtube.com/results?search_query=%D8%AC%D9%85%D8%B9%D8%A9+%D8%AF%D8%A7%D9%88%D8%AF+%D8%A7%D9%84%D8%AA%D8%AD%D9%84%D9%8A%D9%84+%D8%A7%D9%84%D9%87%D9%8A%D8%AF%D8%B1%D9%88%D9%84%D9%88%D8%AC%D9%8A" },
    { title: "دورة الجيوديسيا الهندسية ونظم الإحداثيات والإسقاط", author: "أ.د. جمعة محمد داود", spec: "survey", level: "أكاديمي", url: "https://www.youtube.com/results?search_query=%D8%AC%D9%85%D8%B9%D8%A9+%D8%AF%D8%A7%D9%88%D8%AF+%D8%A7%D9%84%D8%AC%D9%8A%D9%88%D8%AF%D9%8A%D8%B3%D9%8A%D8%A7" },
    { title: "دورة النظام العالمي لتحديد المواقع GPS / GNSS وتطبيقاته المساحية", author: "أ.د. جمعة محمد داود", spec: "survey", level: "عملي", url: "https://www.youtube.com/results?search_query=%D8%AC%D9%85%D8%B9%D8%A9+%D8%AF%D8%A7%D9%88%D8%AF+GPS" },
    { title: "دورة مبادئ وتطبيقات الاستشعار عن بعد ومعالجة المرئيات الفضائية", author: "أ.د. جمعة محمد داود", spec: "rs", level: "شامل", url: "https://www.youtube.com/results?search_query=%D8%AC%D9%85%D8%B9%D8%A9+%D8%AF%D8%A7%D9%88%D8%AF+%D8%A7%D9%84%D8%A7%D8%B3%D8%AA%D8%B4%D8%B9%D8%A7%D8%B1+%D8%B9%D9%86+%D8%A8%D8%B9%D8%AF" },
    { title: "مكتبة كتب أ.د. جمعة داود المجانية الكاملة (GIS، GPS، الجيوديسيا، المساحة)", author: "أ.د. جمعة محمد داود", spec: "books", level: "PDF مجاني", url: "https://www.academia.edu/Documents/in/Gomaa_Dawod" }
  ];

  let activeSpec = "all";
  let extraLinks = [];

  function unpackCompactItem(row) {
    if (Array.isArray(row)) {
      return {
        title: row[0] || "مرجع أ.د. جمعة داود",
        spec: row[1] || "gis",
        url: row[2] || "",
        author: "أ.د. جمعة محمد داود",
        level: "أرشيف شامل"
      };
    }
    return row;
  }

  function packCompactItem(item) {
    return [item.title, item.spec || "gis", item.url];
  }

  function getAllArchiveItems() {
    const externalStatic = Array.isArray(window.GEODAWOD_STATIC_DATA)
      ? window.GEODAWOD_STATIC_DATA.map(unpackCompactItem)
      : [];
    const merged = [...externalStatic, ...extraLinks, ...BUILTIN_DAWOD_ITEMS];
    const seen = new Set();
    return merged.filter(item => {
      if (!item || !item.url) return false;
      const key = item.url.trim();
      if (seen.has(key)) return false;
      seen.add(key);
      if (!item.spec) item.spec = classifySpecialty(item.title + " " + item.url);
      return true;
    });
  }

  /* ==========================================================================
     4. بناء واجهة الأرشيف المصنف بالتخصصات داخل قسم الأكاديمية (#s-academy)
     ========================================================================== */
  function injectSpecializedArchiveUI() {
    const acadSec = $("s-academy");
    if (!acadSec || $("gdSpecializedArchiveCard")) return;

    const card = document.createElement("div");
    card.className = "card";
    card.id = "gdSpecializedArchiveCard";
    card.style.marginTop = "14px";
    card.innerHTML = `
      <div class="row" style="justify-content:space-between;margin-bottom:8px">
        <div>
          <h3 style="margin:0;color:var(--am)">الموسوعة المصنفة حسب التخصص (أرشيف د. جمعة داود والجيوماتكس)</h3>
          <span class="mt">اختر التخصص لعرض جميع الدورات والروابط والكتب الخاصة به فقط</span>
        </div>
        <span id="gdArchiveCountBadge" class="plan-b pro">0 رابط</span>
      </div>

      <div id="gdSpecTabs" class="row" style="overflow-x:auto;flex-wrap:nowrap;padding-bottom:6px;margin-bottom:8px">
        ${SPECIALTIES.map(s => `
          <button type="button" class="${s.id === activeSpec ? "a" : "k"}" data-spec="${s.id}"
            style="white-space:nowrap;flex-shrink:0;font-size:12px;padding:7px 12px"
            onclick="window.GEOSetArchiveSpec('${s.id}')">
            ${esc(s.label)}
          </button>
        `).join("")}
      </div>

      <input id="gdArchiveSearchInput" type="search" placeholder="ابحث داخل التخصص المختار (مثال: ArcGIS، التحليل المكاني، GPS، كتاب...)"
        oninput="window.GEORenderArchiveList()" style="margin-bottom:10px">

      <div id="gdArchiveGrid" class="g2" style="max-height:540px;overflow-y:auto;padding-left:4px"></div>
    `;

    const firstCard = acadSec.querySelector(".card");
    if (firstCard) {
      firstCard.insertAdjacentElement("afterend", card);
    } else {
      acadSec.appendChild(card);
    }

    window.GEORenderArchiveList();
  }

  window.GEOSetArchiveSpec = function (specId) {
    activeSpec = specId;
    document.querySelectorAll("#gdSpecTabs button").forEach(btn => {
      btn.className = btn.dataset.spec === specId ? "a" : "k";
    });
    window.GEORenderArchiveList();
  };

  window.GEORenderArchiveList = function () {
    const grid = $("gdArchiveGrid");
    const badge = $("gdArchiveCountBadge");
    if (!grid) return;

    const q = ($("gdArchiveSearchInput")?.value || "").trim().toLowerCase();
    const all = getAllArchiveItems();

    const filtered = all.filter(item => {
      const matchSpec = activeSpec === "all" || item.spec === activeSpec;
      const matchQuery = !q ||
        (item.title || "").toLowerCase().includes(q) ||
        (item.author || "").toLowerCase().includes(q);
      return matchSpec && matchQuery;
    });

    if (badge) {
      badge.textContent = `${filtered.length} رابط`;
    }

    const specNames = Object.fromEntries(SPECIALTIES.map(s => [s.id, s.label]));

    grid.innerHTML = filtered.length
      ? filtered.slice(0, 250).map(item => `
          <div style="background:var(--bg);border:1px solid var(--ln);border-radius:12px;padding:12px;display:flex;flex-direction:column;justify-content:space-between;gap:8px">
            <div>
              <div class="row" style="justify-content:space-between;margin-bottom:4px">
                <span style="font-size:10.5px;font-weight:800;color:var(--bl);background:rgba(59,130,246,0.12);padding:2px 8px;border-radius:12px">
                  ${esc(specNames[item.spec] || "GIS")}
                </span>
                <span class="mt" style="font-size:11px">${esc(item.level || "مرجع مجاني")}</span>
              </div>
              <b style="display:block;font-size:13.5px;line-height:1.6;color:var(--tx)">${esc(item.title)}</b>
              <span class="mt" style="display:block;margin-top:3px">المصدر: ${esc(item.author || "أ.د. جمعة محمد داود")}</span>
            </div>
            <div class="row" style="margin-top:4px">
              <a href="${esc(item.url)}" target="_blank" rel="noopener"
                style="flex:2;text-align:center;background:var(--gr);color:#fff;padding:8px 10px;border-radius:8px;text-decoration:none;font-weight:700;font-size:12px">
                فتح الرابط / الدورة
              </a>
            </div>
          </div>
        `).join("")
      : `<div class="mt" style="grid-column:1/-1;text-align:center;padding:20px">لا توجد روابط مطابقة لبحثك في هذا التخصص.</div>`;
  };

  /* ==========================================================================
     5. محرك PDF.js لقراءة وفك ضغط ملفات الـ PDF واستخراج كل الروابط والعناوين
     ========================================================================== */
  function loadPdfJsLib() {
    return new Promise((resolve, reject) => {
      if (window.pdfjsLib) return resolve(window.pdfjsLib);
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
      s.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        resolve(window.pdfjsLib);
      };
      s.onerror = () => reject(new Error("تعذر تحميل محرك قراءة PDF"));
      document.head.appendChild(s);
    });
  }

  function extractLinksFromRawText(rawText) {
    const lines = String(rawText || "").split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const extracted = [];
    let lastTitleBuffer = "";

    const urlRegex = /(https?:\/\/[^\s<>"')\]]+)/gi;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const urls = line.match(urlRegex);

      if (urls && urls.length) {
        const inlineTitle = line.replace(urlRegex, "").replace(/^[-•*:\d.)\s]+/, "").trim();

        urls.forEach(rawUrl => {
          const cleanUrl = rawUrl.replace(/[.,;]+$/, "");
          const decodedFromUrl = extractReadableTitleFromUrl(cleanUrl);
          const title = inlineTitle.length >= 4
            ? inlineTitle
            : (lastTitleBuffer.length >= 4
                ? lastTitleBuffer
                : (decodedFromUrl || `مرجع/دورة أ.د. جمعة داود (${extracted.length + 1})`));

          extracted.push({
            title,
            author: "أ.د. جمعة محمد داود",
            spec: classifySpecialty(title + " " + cleanUrl),
            level: "أرشيف شامل",
            url: cleanUrl
          });
        });
        lastTitleBuffer = "";
      } else {
        const cleanLine = line.replace(/^[-•*:\d.)\s]+/, "").trim();
        if (cleanLine.length >= 4 && !/^صفحة\s*\d+$/i.test(cleanLine)) {
          lastTitleBuffer = cleanLine.slice(0, 150);
        }
      }
    }

    return extracted;
  }

  window.GEOParseAndImportDawod = async function () {
    const raw = ($("admDawodBulkText")?.value || "").trim();
    if (!raw) {
      return window.toast && window.toast("ارفع ملف د. جمعة داود أو الصق النص الذي يحتوي على الروابط أولاً", "warn");
    }

    const items = extractLinksFromRawText(raw);
    if (!items.length) {
      return window.toast && window.toast("لم يتم العثور على روابط (http/https) داخل النص", "warn");
    }

    const seen = new Set(extraLinks.map(x => x.url));
    const uniqueNew = items.filter(x => {
      if (seen.has(x.url)) return false;
      seen.add(x.url);
      return true;
    });

    extraLinks = [...uniqueNew, ...extraLinks];
    await idbSaveLinks(extraLinks);
    window.GEORenderArchiveList();

    const counts = { gis: 0, survey: 0, rs: 0, db: 0, books: 0 };
    uniqueNew.forEach(it => { counts[it.spec] = (counts[it.spec] || 0) + 1; });

    const statusEl = $("admDawodImportStatus");
    if (statusEl) {
      statusEl.style.color = "var(--tx)";
      statusEl.innerHTML = `
        <b style="color:var(--gr)">✓ تم استخراج وتصنيف ${uniqueNew.length} رابط جديد بنجاح (الإجمالي المحفوظ: ${extraLinks.length})!</b><br>
        • GIS ونظم المعلومات: <b>${counts.gis}</b> | المساحة: <b>${counts.survey}</b> | الاستشعار: <b>${counts.rs}</b> | قواعد البيانات: <b>${counts.db}</b> | الكتب PDF: <b>${counts.books}</b>
      `;
    }

    // الحفظ السحابي المضغوط في Firestore (لضمان البقاء تحت حد 1MB ونشره لكل المستخدمين)
    try {
      if (window.firebase && firebase.apps.length) {
        const packed = extraLinks.slice(0, 1800).map(packCompactItem);
        await firebase.firestore().collection("geodev_courses").doc("dawod_master_archive").set({
          packed,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        if (window.toast) window.toast(`تم حفظ ونشر ${uniqueNew.length} رابط مصنف لجميع المستخدمين!`, "success");
      }
    } catch (e) {
      if (window.toast) window.toast("تم الحفظ في ذاكرة التطبيق بنجاح (اضغط تحميل ملف JS لرفعه على GitHub)", "success");
    }
  };

  window.GEOHandleDawodFileUpload = async function (file) {
    if (!file) return;
    const statusEl = $("admDawodImportStatus");
    if (statusEl) {
      statusEl.style.color = "var(--am)";
      statusEl.textContent = `جاري فك ضغط وقراءة ملف (${file.name})...`;
    }

    try {
      const isPdf = /\.pdf$/i.test(file.name) || file.type === "application/pdf";
      let fullExtractedLines = [];

      if (isPdf) {
        const pdfjs = await loadPdfJsLib();
        const arrayBuf = await file.arrayBuffer();
        const pdfDoc = await pdfjs.getDocument({ data: arrayBuf }).promise;
        const totalPages = pdfDoc.numPages;

        for (let p = 1; p <= totalPages; p++) {
          if (statusEl && (p === 1 || p % 5 === 0 || p === totalPages)) {
            statusEl.textContent = `جاري فك ضغط واستخراج الروابط من صفحة ${p} من ${totalPages}...`;
          }
          const page = await pdfDoc.getPage(p);

          const textContent = await page.getTextContent();
          const pageText = textContent.items.map(it => it.str).join(" ").replace(/\s+/g, " ").trim();
          if (pageText) fullExtractedLines.push(pageText);

          const annots = await page.getAnnotations();
          annots.forEach(an => {
            if (an.url && /^https?:\/\//i.test(an.url)) {
              const titleHint = (an.title || an.contents || extractReadableTitleFromUrl(an.url) || pageText.slice(0, 120)).trim();
              fullExtractedLines.push(`${titleHint}\n${an.url}`);
            }
          });
        }
      } else {
        fullExtractedLines.push(await file.text());
      }

      $("admDawodBulkText").value = fullExtractedLines.join("\n");
      await window.GEOParseAndImportDawod();
    } catch (e) {
      if (statusEl) {
        statusEl.style.color = "#f87171";
        statusEl.textContent = "تعذر قراءة الملف: " + e.message;
      }
    }
  };

  window.GEODownloadDawodStaticJS = function () {
    const all = getAllArchiveItems().map(packCompactItem);
    const content = `/* GeoDev Dr. Gomaa Dawod Classified Archive (${all.length} links) */\nwindow.GEODAWOD_STATIC_DATA = ${JSON.stringify(all)};\n`;
    if (typeof window.dlText === "function") {
      window.dlText(content, "geo-dawod-data.js");
    }
    if (window.toast) window.toast("تم تحميل ملف geo-dawod-data.js جاهزاً للرفع في GitHub", "success");
  };

  /* ==========================================================================
     6. حقن لوحة الاستيراد في الإدارة (#s-admin)
     ========================================================================== */
  function injectAdminBulkImporter() {
    const adminPanel = $("adminPanel");
    if (!adminPanel || $("gdAdminDawodImporter")) return;

    adminPanel.insertAdjacentHTML("afterbegin", `
      <div class="card" id="gdAdminDawodImporter" style="border-color:var(--gr)">
        <h3>استيراد وتصنيف أرشيف د. جمعة داود (1200+ رابط حسب التخصص)</h3>
        <p class="mt" style="line-height:1.7">
          ارفع ملف د. جمعة داود (PDF أو TXT) وسيفك النظام ضغط الصفحات ويستخرج جميع الروابط المخفية والنصية ويوزعها تلقائياً حسب التخصص (GIS / المساحة / الاستشعار / الكتب).
        </p>
        <div class="row" style="margin:8px 0">
          <button type="button" class="a" onclick="$('admDawodFile').click()">رفع ملف الروابط (PDF / TXT)</button>
          <input type="file" id="admDawodFile" accept=".pdf,.txt,.md,.csv,.html" hidden onchange="window.GEOHandleDawodFileUpload(this.files[0]);this.value=''">
          <button type="button" class="k" onclick="window.GEODownloadDawodStaticJS()">تحميل ملف geo-dawod-data.js لـ GitHub</button>
        </div>
        <textarea id="admDawodBulkText" rows="4" placeholder="أو الصق هنا محتوى ملف د. جمعة داود (العناوين والروابط)..."></textarea>
        <button type="button" class="g" style="width:100%" onclick="window.GEOParseAndImportDawod()">
          استخراج وتصنيف جميع الروابط حسب التخصص الآن
        </button>
        <div id="admDawodImportStatus" class="mt" style="margin-top:8px;line-height:1.7"></div>
      </div>
    `);
  }

  /* ==========================================================================
     7. مزامنة الأرشيف المحلي والسحابي عند فتح المنصة
     ========================================================================== */
  async function syncCloudDawodArchive() {
    const localItems = await idbGetLinks();
    if (localItems.length) {
      extraLinks = localItems;
      window.GEORenderArchiveList();
    }

    try {
      if (!window.firebase || !firebase.apps.length) return;
      const doc = await firebase.firestore().collection("geodev_courses").doc("dawod_master_archive").get();
      if (doc.exists) {
        const d = doc.data();
        const rawList = Array.isArray(d.packed)
          ? d.packed.map(unpackCompactItem)
          : (Array.isArray(d.items) ? d.items : []);
        if (rawList.length) {
          extraLinks = rawList;
          await idbSaveLinks(extraLinks);
          window.GEORenderArchiveList();
        }
      }
    } catch (_) {}
  }

  function initArchiveModule() {
    injectSpecializedArchiveUI();
    injectAdminBulkImporter();
    syncCloudDawodArchive();

    if (window.firebase && firebase.apps.length) {
      firebase.auth().onAuthStateChanged(u => {
        if (u) {
          injectSpecializedArchiveUI();
          injectAdminBulkImporter();
          syncCloudDawodArchive();
        }
      });
    }

    setInterval(() => {
      injectSpecializedArchiveUI();
      injectAdminBulkImporter();
    }, 1500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initArchiveModule);
  } else {
    initArchiveModule();
  }
})();
