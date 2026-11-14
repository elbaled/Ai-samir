/* ============================================================================
   GeoDev Specialized Courses & Archive v5.0 (GIS + AutoCAD + Civil 3D)
   1. تصميم كروت احترافية مربعة لكل كورس:
      (العنوان + التقديم/المحاضر + المصدر/المنصة + تفاصيل الكورس + زر كبير للدخول).
   2. إضافة جميع كورسات ArcGIS Pro المجانية (GeoSteps Academy، د. رشا نوفل،
      م. حاتم طارق، أ.د. جمعة داود، Esri Academy).
   3. تنظيف ذكي لملفات PDF يزيل الرموز والهاشات ويستخرج المحاضر والمنصة والتفاصيل تلقائياً.
   4. ربط مباشر مع الباحث الذكي عن الكورسات في الأكاديمية.
   ============================================================================ */

(function () {
  "use strict";
  if (window.GEODawodArchiveV5) return;
  window.GEODawodArchiveV5 = true;

  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));

  /* ==========================================================================
     1. قاعدة بيانات IndexedDB (مع تنظيف أي بيانات خام غير نظيفة من الإصدار السابق)
     ========================================================================== */
  const IDB_NAME = "GeoDevGisCadArchiveDB_V5";
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
     2. دوال التنظيف الذكي واكتشاف المحاضر والمنصة والتفاصيل
     ========================================================================== */
  function normalizeForSearch(str) {
    return String(str || "")
      .toLowerCase()
      .replace(/[\u064B-\u065F]/g, "")
      .replace(/[أإآ]/g, "ا")
      .replace(/ة/g, "ه")
      .replace(/ى/g, "ي")
      .replace(/arc\s*gis/g, "arcgis")
      .replace(/auto\s*cad/g, "autocad")
      .replace(/civil\s*3d/g, "civil3d")
      .replace(/geo\s*steps/g, "geosteps")
      .replace(/\s+/g, " ")
      .trim();
  }

  const SPECIALTIES = [
    { id: "all", label: "الكل (GIS & AutoCAD & Civil 3D)" },
    { id: "arcgis_pro", label: "كورسات ArcGIS Pro" },
    { id: "gis", label: "GIS ونظم المعلومات" },
    { id: "cad", label: "AutoCAD & Civil 3D" }
  ];

  const CAD_CIVIL_REGEX = /(autocad|auto\s*cad|أوتوكاد|اوتوكاد|اتوكاد|civil\s*3d|civil3d|سيفيل|سيفل|autolisp|lisp|\.dwg|\.dxf|المكتب\s*الفني|حصر\s*الكميات|تصميم\s*الطرق)/i;
  const ARCGIS_PRO_REGEX = /(arcgis\s*pro|arc\s*gis\s*pro|arcpro)/i;
  const GIS_REGEX = /(gis|arcgis|arc\s*gis|arcmap|qgis|نظم\s*المعلومات\s*الجغرافية|معلومات\s*جغرافية|خرائط\s*رقمية|التحليل\s*المكاني|geodatabase|modelbuilder|spatial\s*analysis|hydrology|تحليل\s*هيدرولوجي)/i;

  function detectSpecialty(text) {
    const t = String(text || "").toLowerCase();
    if (CAD_CIVIL_REGEX.test(t)) return "cad";
    if (ARCGIS_PRO_REGEX.test(t)) return "arcgis_pro";
    if (GIS_REGEX.test(t)) return "gis";
    return null;
  }

  function detectPlatformFromUrl(url) {
    const u = String(url || "").toLowerCase();
    if (u.includes("geostepsacademy.com")) return "منصة GeoSteps Academy";
    if (u.includes("youtube.com") || u.includes("youtu.be")) return "YouTube (يوتيوب)";
    if (u.includes("esri.com")) return "منصة Esri Academy";
    if (u.includes("mediafire.com")) return "MediaFire (ملفات تدريبية)";
    if (u.includes("drive.google.com")) return "Google Drive";
    if (u.includes("academia.edu")) return "منصة Academia.edu";
    return "منصة تعليمية / رابط مباشر";
  }

  function detectInstructorFromText(text) {
    const t = String(text || "");
    if (/رشا\s*نوفل/i.test(t)) return "د. رشا نوفل";
    if (/أحمد\s*محمود|عبد\s*الواحد|geosteps/i.test(t)) return "م. أحمد محمود عبد الواحد";
    if (/حاتم\s*طارق/i.test(t)) return "م. حاتم طارق";
    if (/هشام\s*فوزي/i.test(t)) return "م. هشام فوزي";
    if (/فهد\s*الأحمدي|فهد\s*الاحمدي/i.test(t)) return "د. فهد الأحمدي";
    if (/جمعة\s*داود|جمعة\s*محمد\s*داود/i.test(t)) return "أ.د. جمعة محمد داود";
    const m = t.match(/(?:تقديم|إعداد|للدكتور|المهندس|د\.|م\.|أ\.د\.)\s*([^\n،:()\-]{4,35})/);
    if (m && m[1]) return m[0].trim();
    return "أ.د. جمعة محمد داود / نخبة المحاضرين";
  }

  // تنظيف النص المستخرج من PDF من الهاشات الطويلة والرموز غير المقروءة
  function cleanRawPdfSnippet(raw) {
    return String(raw || "")
      .replace(/[A-F0-9]{20,}/gi, " ") // حذف سلاسل Hex الطويلة مثل FFFB8202...
      .replace(/%[0-9A-F]{2}/gi, " ")   // حذف ترميز الروابط
      .replace(/https?:\/\/\S+/gi, " ")
      .replace(/فهرس\s*محتويات\s*صفحة\s*\d+/gi, " ")
      .replace(/[_=~*#]{2,}/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function extractReadableTitleFromUrl(url) {
    try {
      const decoded = decodeURIComponent(decodeURIComponent(url));
      const parts = decoded.split("/").filter(Boolean);
      let slug = parts[parts.length - 1] || "";
      slug = slug.replace(/\.(pdf|rar|zip|docx?|pptx?|dwg|dxf)$/i, "").replace(/[_-]+/g, " ").trim();
      slug = cleanRawPdfSnippet(slug);
      if (slug.length >= 5 && !/^\d+$/.test(slug)) return slug.slice(0, 110);
    } catch (_) {}
    return "";
  }

  /* ==========================================================================
     3. مكتبة كورسات ArcGIS Pro المجانية الشاملة (GeoSteps + YouTube + Esri + GIS + CAD)
     ========================================================================== */
  const CURATED_FREE_COURSES = [
    {
      title: "كورس تعلم برنامج ArcGIS Pro من البداية للاحتراف",
      instructor: "م. أحمد محمود عبد الواحد",
      source: "منصة GeoSteps Academy",
      spec: "arcgis_pro",
      details: "مسار تدريبي تطبيقي متكامل (91 درساً عملياً) يبدأ من واجهة ArcGIS Pro وإدارة قواعد البيانات الجغرافية، مروراً بالترميز والإخراج الفني للخرائط، وحتى أدوات التحليل المكاني والشبكي.",
      url: "https://geostepsacademy.com/course/learning-arcgis-pro-from-beginning-to-professional/"
    },
    {
      title: "كورس ArcGIS Pro — شرح 100 أداة من أدوات ArcToolbox بالتطبيق العملي",
      instructor: "د. رشا نوفل",
      source: "YouTube (يوتيوب)",
      spec: "arcgis_pro",
      details: "شرح تطبيقي مفصل لأهم 100 أداة تحليل مكاني ومعالجة بيانات في صندوق أدوات ArcToolbox على برنامج ArcGIS Pro (إعداد طلاب دبلوم جامعة عين شمس).",
      url: "https://www.youtube.com/results?search_query=%D8%B1%D8%B4%D8%A7+%D9%86%D9%88%D9%81%D9%84+ArcGIS+Pro+ArcToolbox"
    },
    {
      title: "الدورة الشاملة لتعلم برنامج ArcGIS Pro من الصفر إلى الاحتراف",
      instructor: "م. حاتم طارق",
      source: "YouTube (يوتيوب)",
      spec: "arcgis_pro",
      details: "سلسلة دروس مجانية باللغة العربية تغطي أساسيات ArcGIS Pro، بناء الطبقات، الإرجاع الجغرافي (Georeferencing)، التحليل الهيدرولوجي، وإخراج الخرائط الاحترافية.",
      url: "https://www.youtube.com/results?search_query=%D8%AD%D8%A7%D8%AA%D9%85+%D8%B7%D8%A7%D8%B1%D9%82+ArcGIS+Pro"
    },
    {
      title: "أساسيات ArcGIS Pro والتحليل المكاني (مسار تدريبي مجاني)",
      instructor: "فريق تدريب Esri",
      source: "منصة Esri Academy",
      spec: "arcgis_pro",
      details: "دورة تفاعلية مجانية رسمية من شركة Esri تشمل ملفات التدريب العملية حول ArcGIS Pro Basics، إدارة البيانات المكانية، والـ Spatial Analysis.",
      url: "https://www.esri.com/training/catalog/search/"
    },
    {
      title: "كورس التحليل المكاني والشبكي المتقدم في ArcGIS Pro",
      instructor: "منصة GeoSteps & YouTube",
      source: "YouTube (يوتيوب)",
      spec: "arcgis_pro",
      details: "تطبيقات متقدمة في تحليل الشبكات (Network Analysis)، نمذجة الملاءمة المكانية (Suitability Modeling)، واستخدام ModelBuilder داخل ArcGIS Pro.",
      url: "https://www.youtube.com/results?search_query=ArcGIS+Pro+Network+Analysis+ModelBuilder+%D8%B9%D8%B1%D8%A8%D9%8A"
    },
    {
      title: "دورة ArcGIS العملية — المستوى الأول (عمل الخرائط الرقمية)",
      instructor: "أ.د. جمعة محمد داود",
      source: "YouTube (يوتيوب)",
      spec: "gis",
      details: "تأسيس عملي شامل في نظم المعلومات الجغرافية، إنشاء الطبقات، الإرجاع الجغرافي، الجداول الوصفية، وتصميم الخرائط الرقمية.",
      url: "https://www.youtube.com/playlist?list=PL_C6L2vB2S_5N8y4L1K2xJ1g5b9r0W2qA"
    },
    {
      title: "دورة ArcGIS العملية — المستوى الثاني (التحليل المكاني)",
      instructor: "أ.د. جمعة محمد داود",
      source: "YouTube (يوتيوب)",
      spec: "gis",
      details: "شرح أدوات التحليل المكاني (Buffer, Clip, Intersect, Union)، التحليل الإحصائي المكاني، وتطبيقات اتخاذ القرار الجغرافي.",
      url: "https://www.youtube.com/playlist?list=PL_C6L2vB2S_6P9z5M2L3yK2h6c0s1X3rB"
    },
    {
      title: "دورة ArcGIS العملية — المستوى الثالث (3D ونماذج الارتفاعات و ModelBuilder)",
      instructor: "أ.د. جمعة محمد داود",
      source: "YouTube (يوتيوب)",
      spec: "gis",
      details: "بناء نماذج الارتفاعات الرقمية (DEM / TIN)، التحليل الهيدرولوجي للأحواض المائية، وأتمتة العمليات باستخدام ModelBuilder.",
      url: "https://www.youtube.com/results?search_query=%D8%AC%D9%85%D8%B9%D8%A9+%D8%AF%D8%A7%D9%88%D8%AF+ModelBuilder+3D"
    },
    {
      title: "دورة نظم المعلومات الجغرافية مفتوحة المصدر QGIS",
      instructor: "أ.د. جمعة محمد داود",
      source: "YouTube (يوتيوب)",
      spec: "gis",
      details: "شرح متكامل لبرنامج QGIS المجاني مفتوح المصدر، التعامل مع البيانات المتجهة والشبكية، والإضافات الهندسية (Plugins).",
      url: "https://www.youtube.com/results?search_query=%D8%AC%D9%85%D8%B9%D8%A9+%D8%AF%D8%A7%D9%88%D8%AF+QGIS"
    },
    {
      title: "كورس Civil 3D الكامل للمساحة وتصميم الطرق وحساب الكميات",
      instructor: "م. هشام فوزي",
      source: "YouTube (يوتيوب)",
      spec: "cad",
      details: "شرح عملي شامل لبرنامج Autodesk Civil 3D يشمل استيراد نقاط الرفع المساحي، عمل السطوح (Surfaces)، تصميم المسارات والبروفايل، وحساب كميات الحفر والردم.",
      url: "https://www.youtube.com/results?search_query=%D9%83%D9%88%D8%B1%D8%B3+Civil+3D+%D9%87%D8%B4%D8%A7%D9%85+%D9%81%D9%88%D8%B2%D9%8A"
    },
    {
      title: "كورس AutoCAD الاحترافي للمهندسين والمساحين والمكتب الفني",
      instructor: "م. هشام فوزي",
      source: "YouTube (يوتيوب)",
      spec: "cad",
      details: "تعلم الرسم الهندسي الدقيق على AutoCAD، التعامل مع الإحداثيات، الليسبات المساحية (AutoLISP)، وتجهيز اللوحات التنفيذية.",
      url: "https://www.youtube.com/results?search_query=%D9%83%D9%88%D8%B1%D8%B3+AutoCAD+%D9%87%D8%B4%D8%A7%D9%85+%D9%81%D9%88%D8%B2%D9%8A"
    }
  ];

  let activeSpec = "all";
  let extraLinks = [];

  function unpackCompactItem(row) {
    if (Array.isArray(row)) {
      return {
        title: row[0] || "دورة تدريبية",
        spec: row[1] || "gis",
        url: row[2] || "",
        instructor: row[3] || detectInstructorFromText(row[0] || ""),
        source: row[4] || detectPlatformFromUrl(row[2] || ""),
        details: row[5] || "مرجع ودورة تدريبية مجانية في نظم المعلومات الجغرافية والهندسة المساحية."
      };
    }
    return row;
  }

  function packCompactItem(item) {
    return [
      item.title,
      item.spec || "gis",
      item.url,
      item.instructor || "",
      item.source || "",
      (item.details || "").slice(0, 220)
    ];
  }

  function getAllArchiveItems() {
    const externalStatic = Array.isArray(window.GEODAWOD_STATIC_DATA)
      ? window.GEODAWOD_STATIC_DATA.map(unpackCompactItem)
      : [];
    const merged = [...CURATED_FREE_COURSES, ...externalStatic, ...extraLinks];
    const seen = new Set();

    return merged.filter(item => {
      if (!item || !item.url) return false;
      const key = item.url.trim();
      if (seen.has(key)) return false;

      const detected = item.spec === "cad" || item.spec === "gis" || item.spec === "arcgis_pro"
        ? item.spec
        : detectSpecialty((item.title || "") + " " + (item.details || "") + " " + item.url);
      if (!detected) return false;

      item.spec = detected;
      if (!item.instructor) item.instructor = detectInstructorFromText((item.title || "") + " " + (item.details || ""));
      if (!item.source) item.source = detectPlatformFromUrl(item.url);
      if (!item.details) item.details = "دورة تدريبية ومرجع تطبيقي مجاني في التخصص.";
      seen.add(key);
      return true;
    });
  }

  /* ==========================================================================
     4. تصميم الكروت المربعة الاحترافية داخل قسم الأكاديمية (#s-academy)
     ========================================================================== */
  function injectCourseCardStyles() {
    if ($("gdCourseCardStyles")) return;
    const st = document.createElement("style");
    st.id = "gdCourseCardStyles";
    st.textContent = `
      .gd-course-box {
        background: var(--bg);
        border: 1px solid var(--ln);
        border-radius: 16px;
        padding: 16px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: 12px;
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
        transition: transform 0.2s ease, border-color 0.2s ease;
      }
      .gd-course-box:hover {
        border-color: var(--bl);
        transform: translateY(-2px);
      }
      .gd-course-title {
        font-size: 15px;
        font-weight: 900;
        color: var(--tx);
        line-height: 1.55;
        margin: 0;
      }
      .gd-course-meta {
        display: flex;
        flex-direction: column;
        gap: 5px;
        font-size: 12.5px;
        color: var(--mt);
      }
      .gd-course-meta b {
        color: var(--tx);
        font-weight: 700;
      }
      .gd-course-details {
        background: color-mix(in srgb, var(--cd) 85%, transparent);
        border: 1px solid var(--ln);
        border-radius: 10px;
        padding: 10px 12px;
        font-size: 12.5px;
        line-height: 1.75;
        color: var(--tx);
      }
      .gd-course-cta {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        width: 100%;
        padding: 12px 16px;
        border-radius: 12px;
        background: linear-gradient(135deg, var(--gr), #059669);
        color: #ffffff !important;
        font-size: 13.5px;
        font-weight: 800;
        text-decoration: none;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
        transition: opacity 0.2s ease;
      }
      .gd-course-cta:hover {
        opacity: 0.92;
      }
    `;
    document.head.appendChild(st);
  }

  function injectSpecializedArchiveUI() {
    const acadSec = $("s-academy");
    if (!acadSec || $("gdSpecializedArchiveCard")) return;

    injectCourseCardStyles();

    const card = document.createElement("div");
    card.className = "card";
    card.id = "gdSpecializedArchiveCard";
    card.style.marginTop = "14px";
    card.innerHTML = `
      <div class="row" style="justify-content:space-between;margin-bottom:8px">
        <div>
          <h3 style="margin:0;color:var(--am)">مكتبة الكورسات المجانية (ArcGIS Pro & GIS & AutoCAD & Civil 3D)</h3>
          <span class="mt">تصفح الكورسات المجانية من GeoSteps Academy ويوتيوب وEsri ومكتبة أ.د. جمعة داود</span>
        </div>
        <span id="gdArchiveCountBadge" class="plan-b pro">0 كورس</span>
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

      <input id="gdArchiveSearchInput" type="search" placeholder="ابحث باسم الكورس أو المحاضر أو المنصة (مثال: ArcGIS Pro، رشا نوفل، GeoSteps، Civil 3D...)"
        oninput="window.GEORenderArchiveList()" style="margin-bottom:12px">

      <div id="gdArchiveGrid" class="g2" style="max-height:680px;overflow-y:auto;padding-left:4px"></div>
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

    const normQ = normalizeForSearch($("gdArchiveSearchInput")?.value || "");
    const qTokens = normQ ? normQ.split(" ").filter(Boolean) : [];
    const all = getAllArchiveItems();

    const filtered = all.filter(item => {
      const matchSpec = activeSpec === "all" ||
        item.spec === activeSpec ||
        (activeSpec === "gis" && item.spec === "arcgis_pro");
      if (!matchSpec) return false;
      if (!qTokens.length) return true;

      const haystack = normalizeForSearch(`${item.title || ""} ${item.instructor || ""} ${item.source || ""} ${item.details || ""}`);
      return qTokens.every(tok => haystack.includes(tok));
    });

    if (badge) badge.textContent = `${filtered.length} كورس`;

    const badgeLabels = {
      arcgis_pro: "كورس ArcGIS Pro",
      gis: "GIS ونظم المعلومات",
      cad: "AutoCAD & Civil 3D"
    };

    grid.innerHTML = filtered.length
      ? filtered.slice(0, 300).map(item => `
          <div class="gd-course-box">
            <div style="display:flex;flex-direction:column;gap:8px">
              <div class="row" style="justify-content:space-between">
                <span style="font-size:11px;font-weight:800;color:${item.spec === "cad" ? "var(--am)" : "var(--bl)"};background:rgba(59,130,246,0.12);padding:3px 10px;border-radius:12px">
                  ${esc(badgeLabels[item.spec] || "كورس GIS")}
                </span>
                <span style="font-size:11px;font-weight:700;color:var(--gr)">مجاني 100%</span>
              </div>

              <h4 class="gd-course-title">${esc(item.title)}</h4>

              <div class="gd-course-meta">
                <div><b>تقديم:</b> ${esc(item.instructor)}</div>
                <div><b>المصدر / المنصة:</b> ${esc(item.source)}</div>
              </div>

              <div class="gd-course-details">
                <b style="color:var(--am);display:block;margin-bottom:2px">تفاصيل الكورس:</b>
                ${esc(item.details)}
              </div>
            </div>

            <a href="${esc(item.url)}" target="_blank" rel="noopener" class="gd-course-cta">
              الدخول للكورس / افتح الرابط ↗
            </a>
          </div>
        `).join("")
      : `<div class="mt" style="grid-column:1/-1;text-align:center;padding:24px">لا توجد كورسات مطابقة لبحثك.</div>`;
  };

  /* ==========================================================================
     5. ربط الكورسات المجانية مع الباحث الذكي عن الكورسات (GEOAcademyEngines)
     ========================================================================== */
  function hookSmartCourseSearch() {
    const E = window.GEOAcademyEngines;
    if (!E || E.__dawodArcGisHooked) return;
    E.__dawodArcGisHooked = true;

    const origSearch = E.searchCourses || E.smartCourseSearch;
    if (typeof origSearch !== "function") return;

    const enhancedSearch = async function (query) {
      const normQ = normalizeForSearch(query);
      const qTokens = normQ ? normQ.split(" ").filter(Boolean) : [];
      const localMatches = getAllArchiveItems().filter(item => {
        if (!qTokens.length) return false;
        const hay = normalizeForSearch(`${item.title} ${item.instructor} ${item.source} ${item.details}`);
        return qTokens.some(t => t.length > 2 && hay.includes(t));
      }).slice(0, 6);

      let aiResult = { answer: "", results: [] };
      try {
        aiResult = await origSearch.apply(this, arguments);
      } catch (err) {
        if (!localMatches.length) throw err;
      }

      if (localMatches.length) {
        const cardsMd = localMatches.map(c =>
          `### ${c.title}\n- **تقديم:** ${c.instructor}\n- **المصدر:** ${c.source}\n- **التفاصيل:** ${c.details}\n- **رابط الكورس المجاني:** [الدخول للكورس مباشرة](${c.url})`
        ).join("\n\n---\n\n");

        aiResult.answer = `## كورسات مجانية مطابقة من مكتبة المنصة و GeoSteps و YouTube:\n\n${cardsMd}\n\n---\n\n${aiResult.answer || ""}`;
      }

      return aiResult;
    };

    if (E.searchCourses) E.searchCourses = enhancedSearch;
    if (E.smartCourseSearch) E.smartCourseSearch = enhancedSearch;
  }

  /* ==========================================================================
     6. محرك PDF.js الذكي (ينظف النصوص ويفصل العنوان عن المحاضر والمنصة والتفاصيل)
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

  function extractCleanCoursesFromText(rawText) {
    const lines = String(rawText || "").split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const extracted = [];
    let skippedCount = 0;
    let contextBuffer = "";

    const urlRegex = /(https?:\/\/[^\s<>"')\]]+)/gi;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const urls = line.match(urlRegex);

      if (urls && urls.length) {
        const inlineRaw = cleanRawPdfSnippet(line.replace(urlRegex, ""));
        const cleanContext = cleanRawPdfSnippet(contextBuffer);

        urls.forEach(rawUrl => {
          const cleanUrl = rawUrl.replace(/[.,;]+$/, "");
          const urlSlug = extractReadableTitleFromUrl(cleanUrl);
          const fullCombined = `${inlineRaw} ${cleanContext} ${urlSlug}`.trim();

          const spec = detectSpecialty(fullCombined + " " + cleanUrl);
          if (!spec) {
            skippedCount++;
            return;
          }

          const instructor = detectInstructorFromText(fullCombined);
          const source = detectPlatformFromUrl(cleanUrl);

          // استخراج عنوان قصير نظيف (أول جملة مفيدة بحد أقصى 95 حرف)
          let shortTitle = inlineRaw.length >= 6
            ? inlineRaw
            : (urlSlug.length >= 6 ? urlSlug : cleanContext);
          shortTitle = shortTitle.split(/[،.|:-]/)[0].trim().slice(0, 95);
          if (shortTitle.length < 6) {
            shortTitle = spec === "arcgis_pro"
              ? "كورس ArcGIS Pro تطبيقي"
              : (spec === "cad" ? "كورس AutoCAD / Civil 3D" : "كورس نظم المعلومات الجغرافية GIS");
          }

          // استخراج تفاصيل الكورس (بحد أقصى 220 حرف بدون رموز)
          const detailsText = (cleanContext || inlineRaw || "دورة تدريبية ومرجع عملي مجاني في نظم المعلومات الجغرافية والهندسة المساحية.")
            .slice(0, 220);

          extracted.push({
            title: shortTitle,
            instructor,
            source,
            spec,
            details: detailsText,
            url: cleanUrl
          });
        });

        contextBuffer = "";
      } else {
        const cleaned = cleanRawPdfSnippet(line);
        if (cleaned.length >= 5 && !/^صفحة\s*\d+$/i.test(cleaned)) {
          contextBuffer = cleaned.slice(0, 240);
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

    const { extracted, skippedCount } = extractCleanCoursesFromText(raw);
    if (!extracted.length) {
      return window.toast && window.toast("لم يتم العثور على كورسات خاصة بـ GIS أو ArcGIS Pro أو AutoCAD أو Civil 3D", "warn");
    }

    const seen = new Set(extraLinks.map(x => x.url));
    const added = extracted.filter(x => {
      if (seen.has(x.url)) return false;
      seen.add(x.url);
      return true;
    });

    extraLinks = [...added, ...extraLinks];
    await idbSaveLinks(extraLinks);
    window.GEORenderArchiveList();

    const statusEl = $("admDawodImportStatus");
    if (statusEl) {
      statusEl.style.color = "var(--tx)";
      statusEl.innerHTML = `
        <b style="color:var(--gr)">✓ تم استخراج وتنسيق ${added.length} كورس في بطاقات نظيفة بنجاح!</b><br>
        <span class="mt">(تم استبعاد ${skippedCount} رابط خارج التخصص تلقائياً)</span>
      `;
    }

    try {
      if (window.firebase && firebase.apps.length) {
        const packed = extraLinks.slice(0, 1500).map(packCompactItem);
        await firebase.firestore().collection("geodev_courses").doc("dawod_master_archive").set({
          packed,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        if (window.toast) window.toast(`تم نشر ${added.length} كورس منسق لجميع المستخدمين!`, "success");
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
      statusEl.textContent = `جاري فك ضغط وتنظيف ملف (${file.name})...`;
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
            statusEl.textContent = `جاري فحص وتنظيف صفحة ${p} من ${totalPages}...`;
          }
          const page = await pdfDoc.getPage(p);

          const textContent = await page.getTextContent();
          const pageText = cleanRawPdfSnippet(textContent.items.map(it => it.str).join(" "));
          if (pageText) fullExtractedLines.push(pageText);

          const annots = await page.getAnnotations();
          annots.forEach(an => {
            if (an.url && /^https?:\/\//i.test(an.url)) {
              const titleHint = cleanRawPdfSnippet(an.title || an.contents || extractReadableTitleFromUrl(an.url) || pageText.slice(0, 140));
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
    const content = `/* GeoDev Courses Archive (${all.length} items) */\nwindow.GEODAWOD_STATIC_DATA = ${JSON.stringify(all)};\n`;
    if (typeof window.dlText === "function") {
      window.dlText(content, "geo-dawod-data.js");
    }
    if (window.toast) window.toast("تم تحميل ملف geo-dawod-data.js المنسق", "success");
  };

  /* ==========================================================================
     7. حقن لوحة الاستيراد في الإدارة (#s-admin)
     ========================================================================== */
  function injectAdminBulkImporter() {
    const adminPanel = $("adminPanel");
    if (!adminPanel || $("gdAdminDawodImporter")) return;

    adminPanel.insertAdjacentHTML("afterbegin", `
      <div class="card" id="gdAdminDawodImporter" style="border-color:var(--gr)">
        <h3>استيراد وتنسيق كورسات GIS و ArcGIS Pro و AutoCAD و Civil 3D</h3>
        <p class="mt" style="line-height:1.7">
          ارفع ملف الروابط (PDF أو TXT) وسينظف النظام النصوص ويستخرج العنوان واسم المحاضر والمنصة والتفاصيل تلقائياً في كروت مربعة احترافية.
        </p>
        <div class="row" style="margin:8px 0">
          <button type="button" class="a" onclick="$('admDawodFile').click()">رفع ملف الروابط (PDF / TXT)</button>
          <input type="file" id="admDawodFile" accept=".pdf,.txt,.md,.csv,.html" hidden onchange="window.GEOHandleDawodFileUpload(this.files[0]);this.value=''">
          <button type="button" class="k" onclick="window.GEODownloadDawodStaticJS()">تحميل ملف geo-dawod-data.js لـ GitHub</button>
        </div>
        <textarea id="admDawodBulkText" rows="4" placeholder="أو الصق هنا قائمة الكورسات والروابط..."></textarea>
        <button type="button" class="g" style="width:100%" onclick="window.GEOParseAndImportDawod()">
          استخراج وتنسيق الكورسات الآن
        </button>
        <div id="admDawodImportStatus" class="mt" style="margin-top:8px;line-height:1.7"></div>
      </div>
    `);
  }

  /* ==========================================================================
     8. المزامنة والتشغيل
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
          extraLinks = rawList.filter(it => detectSpecialty((it.title || "") + " " + (it.url || "")));
          await idbSaveLinks(extraLinks);
          window.GEORenderArchiveList();
        }
      }
    } catch (_) {}
  }

  function initArchiveModule() {
    injectSpecializedArchiveUI();
    injectAdminBulkImporter();
    hookSmartCourseSearch();
    syncCloudDawodArchive();

    if (window.firebase && firebase.apps.length) {
      firebase.auth().onAuthStateChanged(u => {
        if (u) {
          injectSpecializedArchiveUI();
          injectAdminBulkImporter();
          hookSmartCourseSearch();
          syncCloudDawodArchive();
        }
      });
    }

    setInterval(() => {
      injectSpecializedArchiveUI();
      injectAdminBulkImporter();
      hookSmartCourseSearch();
    }, 1500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initArchiveModule);
  } else {
    initArchiveModule();
  }
})();
