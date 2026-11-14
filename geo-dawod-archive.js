/* ============================================================================
   GeoDev Specialized Archive (GIS + AutoCAD + Civil 3D Only) v4.0
   1. استخراج وإضافة محتوى GIS و AutoCAD و Civil 3D فقط وتجاهل أي روابط أخرى.
   2. تخزين غير محدود عبر IndexedDB + مزامنة سحابية في Firestore.
   3. محرك PDF.js لفك ضغط صفحات الـ PDF وفك تشفير العناوين العربية من الروابط.
   ============================================================================ */

(function () {
  "use strict";
  if (window.GEODawodArchiveV4) return;
  window.GEODawodArchiveV4 = true;

  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));

  try { localStorage.removeItem("gd_dawod_extra_links"); } catch (_) {}

  /* ==========================================================================
     1. قاعدة بيانات IndexedDB محلية غير محدودة السعة
     ========================================================================== */
  const IDB_NAME = "GeoDevGisCadArchiveDB";
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
     2. الفلتر والمصنف الصارم: يقبل (GIS / AutoCAD / Civil 3D) فقط
     ========================================================================== */
  const SPECIALTIES = [
    { id: "all", label: "الكل (GIS & CAD & Civil 3D)" },
    { id: "gis", label: "GIS ونظم المعلومات الجغرافية" },
    { id: "cad", label: "AutoCAD & Civil 3D" }
  ];

  const CAD_CIVIL_REGEX = /(autocad|auto\s*cad|أوتوكاد|اوتوكاد|اتوكاد|civil\s*3d|civil3d|سيفيل|سيفل|autolisp|lisp|\.dwg|\.dxf|المكتب\s*الفني|حصر\s*الكميات|شبكات\s*المياه|تصميم\s*الطرق)/i;
  const GIS_REGEX = /(gis|arcgis|arc\s*gis|arcmap|arcpro|qgis|نظم\s*المعلومات\s*الجغرافية|معلومات\s*جغرافية|خرائط\s*رقمية|التحليل\s*المكاني|geodatabase|modelbuilder|model\s*builder|spatial\s*analysis|hydrology|تحليل\s*هيدرولوجي|نظم\s*المعلومات)/i;

  function detectAllowedSpecialty(text) {
    const t = String(text || "").toLowerCase();
    if (CAD_CIVIL_REGEX.test(t)) return "cad";
    if (GIS_REGEX.test(t)) return "gis";
    return null; // خارج نطاق GIS و AutoCAD و Civil 3D -> يتم استبعاده
  }

  function extractReadableTitleFromUrl(url) {
    try {
      const decoded = decodeURIComponent(decodeURIComponent(url));
      const parts = decoded.split("/").filter(Boolean);
      let slug = parts[parts.length - 1] || "";
      slug = slug.replace(/\.(pdf|rar|zip|docx?|pptx?|dwg|dxf)$/i, "").replace(/[_-]+/g, " ").trim();
      if (slug.length >= 4 && !/^\d+$/.test(slug)) {
        return slug.slice(0, 140);
      }
    } catch (_) {}
    return "";
  }

  /* ==========================================================================
     3. الروابط الأساسية المعتمدة في (GIS + AutoCAD + Civil 3D)
     ========================================================================== */
  const BUILTIN_ITEMS = [
    { title: "دورة ArcGIS العملية — المستوى الأول (عمل الخرائط الرقمية)", author: "أ.د. جمعة محمد داود", spec: "gis", level: "مبتدئ", url: "https://www.youtube.com/playlist?list=PL_C6L2vB2S_5N8y4L1K2xJ1g5b9r0W2qA" },
    { title: "دورة ArcGIS العملية — المستوى الثاني (تحليل البيانات والتحليل المكاني)", author: "أ.د. جمعة محمد داود", spec: "gis", level: "متوسط", url: "https://www.youtube.com/playlist?list=PL_C6L2vB2S_6P9z5M2L3yK2h6c0s1X3rB" },
    { title: "دورة ArcGIS العملية — المستوى الثالث (3D ونماذج الارتفاعات و ModelBuilder)", author: "أ.د. جمعة محمد داود", spec: "gis", level: "متقدم", url: "https://www.youtube.com/results?search_query=%D8%AC%D9%85%D8%B9%D8%A9+%D8%AF%D8%A7%D9%88%D8%AF+ModelBuilder+3D" },
    { title: "دورة قواعد البيانات ونظم المعلومات الجغرافية (Geodatabase)", author: "أ.د. جمعة محمد داود", spec: "gis", level: "متوسط", url: "https://www.youtube.com/results?search_query=%D8%AC%D9%85%D8%B9%D8%A9+%D8%AF%D8%A7%D9%88%D8%AF+Geodatabase" },
    { title: "دورة نظرية شاملة في علم نظم المعلومات الجغرافية (GIS)", author: "أ.د. جمعة محمد داود", spec: "gis", level: "أكاديمي", url: "https://www.youtube.com/results?search_query=%D8%AF%D9%88%D8%B1%D8%A9+%D9%86%D8%B8%D8%B1%D9%8A%D8%A9+%D8%AC%D9%85%D8%B9%D8%A9+%D8%AF%D8%A7%D9%88%D8%AF+GIS" },
    { title: "دورة نظم المعلومات الجغرافية مفتوحة المصدر QGIS", author: "أ.د. جمعة محمد داود", spec: "gis", level: "عملي", url: "https://www.youtube.com/results?search_query=%D8%AC%D9%85%D8%B9%D8%A9+%D8%AF%D8%A7%D9%88%D8%AF+QGIS" },
    { title: "كورس Civil 3D الكامل للمساحة وتصميم الطرق والكميات", author: "م. هشام فوزي", spec: "cad", level: "تطبيقي", url: "https://www.youtube.com/results?search_query=%D9%83%D9%88%D8%B1%D8%B3+Civil+3D+%D9%87%D8%B4%D8%A7%D9%85+%D9%81%D9%88%D8%B2%D9%8A" },
    { title: "كورس AutoCAD الاحترافي للمهندسين والمساحين", author: "م. هشام فوزي", spec: "cad", level: "أساسي", url: "https://www.youtube.com/results?search_query=%D9%83%D9%88%D8%B1%D8%B3+AutoCAD+%D9%87%D8%B4%D8%A7%D9%85+%D9%81%D9%88%D8%B2%D9%8A" }
  ];

  let activeSpec = "all";
  let extraLinks = [];

  function unpackCompactItem(row) {
    if (Array.isArray(row)) {
      return {
        title: row[0] || "مرجع GIS / CAD",
        spec: row[1] || "gis",
        url: row[2] || "",
        author: "أرشيف GeoDev",
        level: "معتمد"
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
    const merged = [...externalStatic, ...extraLinks, ...BUILTIN_ITEMS];
    const seen = new Set();

    return merged.filter(item => {
      if (!item || !item.url) return false;
      const key = item.url.trim();
      if (seen.has(key)) return false;

      // التأكد من أن العنصر ينتمي لـ GIS أو AutoCAD أو Civil 3D فقط
      const detected = item.spec === "cad" || item.spec === "gis"
        ? item.spec
        : detectAllowedSpecialty(item.title + " " + item.url);
      if (!detected) return false;

      item.spec = detected;
      seen.add(key);
      return true;
    });
  }

  /* ==========================================================================
     4. واجهة التصفية والتبويبات داخل الأكاديمية (#s-academy)
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
          <h3 style="margin:0;color:var(--am)">مكتبة وروابط GIS و AutoCAD و Civil 3D</h3>
          <span class="mt">محتوى مفلتر ومصنف خصيصاً لتخصصات نظم المعلومات الجغرافية والأوتوكاد والسيفيل</span>
        </div>
        <span id="gdArchiveCountBadge" class="plan-b pro">0 رابط</span>
      </div>

      <div id="gdSpecTabs" class="row" style="overflow-x:auto;flex-wrap:nowrap;padding-bottom:6px;margin-bottom:8px">
        ${SPECIALTIES.map(s => `
          <button type="button" class="${s.id === activeSpec ? "a" : "k"}" data-spec="${s.id}"
            style="white-space:nowrap;flex-shrink:0;font-size:12px;padding:7px 14px"
            onclick="window.GEOSetArchiveSpec('${s.id}')">
            ${esc(s.label)}
          </button>
        `).join("")}
      </div>

      <input id="gdArchiveSearchInput" type="search" placeholder="ابحث داخل GIS أو AutoCAD أو Civil 3D (مثال: ArcGIS، QGIS، Civil 3D، طرق، كميات...)"
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

    if (badge) badge.textContent = `${filtered.length} رابط`;

    grid.innerHTML = filtered.length
      ? filtered.slice(0, 300).map(item => `
          <div style="background:var(--bg);border:1px solid var(--ln);border-radius:12px;padding:12px;display:flex;flex-direction:column;justify-content:space-between;gap:8px">
            <div>
              <div class="row" style="justify-content:space-between;margin-bottom:4px">
                <span style="font-size:10.5px;font-weight:800;color:${item.spec === "cad" ? "var(--am)" : "var(--bl)"};background:rgba(59,130,246,0.12);padding:2px 8px;border-radius:12px">
                  ${item.spec === "cad" ? "AutoCAD & Civil 3D" : "GIS ونظم المعلومات"}
                </span>
                <span class="mt" style="font-size:11px">${esc(item.level || "معتمد")}</span>
              </div>
              <b style="display:block;font-size:13.5px;line-height:1.6;color:var(--tx)">${esc(item.title)}</b>
              <span class="mt" style="display:block;margin-top:3px">المصدر: ${esc(item.author || "أ.د. جمعة محمد داود")}</span>
            </div>
            <div class="row" style="margin-top:4px">
              <a href="${esc(item.url)}" target="_blank" rel="noopener"
                style="flex:1;text-align:center;background:var(--gr);color:#fff;padding:8px 10px;border-radius:8px;text-decoration:none;font-weight:700;font-size:12px">
                فتح الدورة / الرابط
              </a>
            </div>
          </div>
        `).join("")
      : `<div class="mt" style="grid-column:1/-1;text-align:center;padding:20px">لا توجد روابط مطابقة لبحثك.</div>`;
  };

  /* ==========================================================================
     5. محرك PDF.js واستخراج روابط (GIS + AutoCAD + Civil 3D) فقط
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

  function extractGisAndCadLinksOnly(rawText) {
    const lines = String(rawText || "").split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const extracted = [];
    let skippedCount = 0;
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
                : (decodedFromUrl || ""));

          // فحص: هل الرابط أو عنوانه يخص GIS أو AutoCAD أو Civil 3D؟
          const spec = detectAllowedSpecialty(title + " " + decodedFromUrl + " " + cleanUrl);
          if (!spec) {
            skippedCount++;
            return;
          }

          extracted.push({
            title: title || (spec === "cad" ? "دورة AutoCAD / Civil 3D" : "دورة/مرجع GIS ونظم المعلومات"),
            author: "أ.د. جمعة محمد داود",
            spec,
            level: spec === "cad" ? "CAD / Civil 3D" : "GIS",
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

    return { extracted, skippedCount };
  }

  window.GEOParseAndImportDawod = async function () {
    const raw = ($("admDawodBulkText")?.value || "").trim();
    if (!raw) {
      return window.toast && window.toast("ارفع ملف الروابط (PDF / TXT) أو الصق النص أولاً", "warn");
    }

    const { extracted, skippedCount } = extractGisAndCadLinksOnly(raw);
    if (!extracted.length) {
      return window.toast && window.toast("لم يتم العثور على روابط خاصة بـ GIS أو AutoCAD أو Civil 3D", "warn");
    }

    const seen = new Set(extraLinks.map(x => x.url));
    const uniqueNew = extracted.filter(x => {
      if (seen.has(x.url)) return false;
      seen.add(x.url);
      return true;
    });

    extraLinks = [...uniqueNew, ...extraLinks];
    await idbSaveLinks(extraLinks);
    window.GEORenderArchiveList();

    const gisCount = uniqueNew.filter(x => x.spec === "gis").length;
    const cadCount = uniqueNew.filter(x => x.spec === "cad").length;

    const statusEl = $("admDawodImportStatus");
    if (statusEl) {
      statusEl.style.color = "var(--tx)";
      statusEl.innerHTML = `
        <b style="color:var(--gr)">✓ تم استخراج وإضافة ${uniqueNew.length} رابط متخصص بنجاح!</b><br>
        • قسم <b>GIS ونظم المعلومات</b>: <b>${gisCount}</b> رابط | قسم <b>AutoCAD & Civil 3D</b>: <b>${cadCount}</b> رابط<br>
        <span class="mt">(تم استبعاد ${skippedCount} رابط من التخصصات الأخرى تلقائياً)</span>
      `;
    }

    try {
      if (window.firebase && firebase.apps.length) {
        const packed = extraLinks.slice(0, 2000).map(packCompactItem);
        await firebase.firestore().collection("geodev_courses").doc("dawod_master_archive").set({
          packed,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        if (window.toast) window.toast(`تم نشر ${uniqueNew.length} رابط (GIS / AutoCAD / Civil 3D) للجميع!`, "success");
      }
    } catch (_) {
      if (window.toast) window.toast("تم الحفظ في ذاكرة المنصة بنجاح", "success");
    }
  };

  window.GEOHandleDawodFileUpload = async function (file) {
    if (!file) return;
    const statusEl = $("admDawodImportStatus");
    if (statusEl) {
      statusEl.style.color = "var(--am)";
      statusEl.textContent = `جاري فك ضغط وفحص ملف (${file.name}) لاستخراج GIS و AutoCAD و Civil 3D فقط...`;
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
            statusEl.textContent = `جاري فحص صفحة ${p} من ${totalPages} لفلترة GIS و AutoCAD و Civil 3D...`;
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
    const content = `/* GeoDev Filtered Archive: GIS + AutoCAD + Civil 3D (${all.length} links) */\nwindow.GEODAWOD_STATIC_DATA = ${JSON.stringify(all)};\n`;
    if (typeof window.dlText === "function") {
      window.dlText(content, "geo-dawod-data.js");
    }
    if (window.toast) window.toast("تم تحميل ملف geo-dawod-data.js المفلتر بنجاح", "success");
  };

  /* ==========================================================================
     6. حقن لوحة الاستيراد في الإدارة (#s-admin)
     ========================================================================== */
  function injectAdminBulkImporter() {
    const adminPanel = $("adminPanel");
    if (!adminPanel || $("gdAdminDawodImporter")) return;

    adminPanel.insertAdjacentHTML("afterbegin", `
      <div class="card" id="gdAdminDawodImporter" style="border-color:var(--gr)">
        <h3>استيراد محتوى GIS و AutoCAD و Civil 3D فقط</h3>
        <p class="mt" style="line-height:1.7">
          ارفع ملف د. جمعة داود (PDF أو TXT) وسيفك النظام ضغط الصفحات ويجلب روابط <b>GIS</b> و <b>AutoCAD</b> و <b>Civil 3D</b> فقط ويتجاهل ما عداها، ثم يضيفها للأكاديمية تلقائياً.
        </p>
        <div class="row" style="margin:8px 0">
          <button type="button" class="a" onclick="$('admDawodFile').click()">رفع ملف الروابط (PDF / TXT)</button>
          <input type="file" id="admDawodFile" accept=".pdf,.txt,.md,.csv,.html" hidden onchange="window.GEOHandleDawodFileUpload(this.files[0]);this.value=''">
          <button type="button" class="k" onclick="window.GEODownloadDawodStaticJS()">تحميل ملف geo-dawod-data.js لـ GitHub</button>
        </div>
        <textarea id="admDawodBulkText" rows="4" placeholder="أو الصق هنا قائمة العناوين والروابط لفلترة GIS و AutoCAD و Civil 3D..."></textarea>
        <button type="button" class="g" style="width:100%" onclick="window.GEOParseAndImportDawod()">
          فلترة وإضافة GIS و AutoCAD و Civil 3D الآن
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
          extraLinks = rawList.filter(it => detectAllowedSpecialty(it.title + " " + it.url));
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
