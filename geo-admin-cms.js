/* ============================================================================
   GeoDev Dynamic Admin CMS v1.0 (geo-admin-cms.js)
   إدارة الكتب والدورات والمحاضرين ديناميكياً من لوحة الإدارة عبر Firebase Firestore
   ============================================================================ */

(function () {
  "use strict";
  if (window.GEOAdminCMS) return;
  window.GEOAdminCMS = true;

  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));

  let dynamicCourses = [];
  let dynamicBooks = [];

  function getDB() {
    return (window.firebase && firebase.apps.length) ? firebase.firestore() : null;
  }

  /* ==========================================================================
     1. جلب الكتب والدورات المنشورة من Firestore
     ========================================================================== */
  async function fetchDynamicContent() {
    const db = getDB();
    if (!db) return;

    try {
      const [cSnap, bSnap] = await Promise.all([
        db.collection("geodev_courses").orderBy("createdAt", "desc").get(),
        db.collection("geodev_books").orderBy("createdAt", "desc").get()
      ]);

      dynamicCourses = cSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      dynamicBooks = bSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      renderDynamicCoursesInAcademy();
      renderDynamicBooksInAcademy();
      renderAdminCMSLists();
    } catch (e) {
      console.warn("CMS Load Warning:", e.message);
    }
  }

  /* ==========================================================================
     2. عرض الدورات والكتب المضافة ديناميكياً داخل الأكاديمية للجميع
     ========================================================================== */
  function renderDynamicCoursesInAcademy() {
    const content = $("academyContent");
    const coursesTabActive = document.querySelector('[data-academy-tab="courses"].active');
    if (!content || !coursesTabActive) return;

    $("gdDynamicCoursesBox")?.remove();
    if (!dynamicCourses.length) return;

    const html = `
      <div id="gdDynamicCoursesBox" class="academy-card" style="margin-bottom:18px;border:1px solid var(--am)">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
          <span class="doc-badge amber">دورات حصرية ومحدثة (${dynamicCourses.length})</span>
          <span class="academy-muted">محتوى مضاف بواسطة إدارة المنصة</span>
        </div>
        <h3 style="margin:10px 0 6px">🌟 أحدث الدورات والمسارات المضافة للمنصة</h3>

        <div class="academy-grid" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,290px),1fr));margin-top:12px">
          ${dynamicCourses.map(c => `
            <div class="academy-card" style="background:var(--bg);display:flex;flex-direction:column;justify-content:space-between">
              <div>
                <div style="display:flex;justify-content:space-between;gap:6px;flex-wrap:wrap">
                  <span class="doc-badge">${esc(c.cat || "GIS")}</span>
                  <span class="doc-badge green">${esc(c.level || "شامل")}</span>
                </div>
                <h3 style="margin:10px 0 4px;font-size:15px">${esc(c.title)}</h3>
                <div class="academy-muted">👨‍🏫 المحاضر: <b>${esc(c.instructor || "محاضر معتمد")}</b></div>
                ${c.desc ? `<p style="font-size:13px;margin-top:6px">${esc(c.desc)}</p>` : ""}
              </div>
              <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
                <a href="${esc(c.url)}" target="_blank" rel="noopener noreferrer" class="academy-btn" style="flex:1;text-decoration:none;font-size:12px">
                  ▶ مشاهدة الدورة ↗
                </a>
                ${c.dataUrl ? `
                  <a href="${esc(c.dataUrl)}" target="_blank" rel="noopener noreferrer" class="academy-btn secondary" style="text-decoration:none;font-size:11.5px">
                    📦 ملفات العمل
                  </a>
                ` : ""}
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;

    content.insertAdjacentHTML("afterbegin", html);
  }

  function renderDynamicBooksInAcademy() {
    const content = $("academyContent");
    const booksTabActive = document.querySelector('[data-academy-tab="books-lib"].active');
    if (!content || !booksTabActive) return;

    $("gdDynamicBooksBox")?.remove();
    if (!dynamicBooks.length) return;

    const html = `
      <div id="gdDynamicBooksBox" class="academy-card" style="margin-bottom:18px;border:1px solid var(--am)">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
          <span class="doc-badge amber">مراجع وكتب مضافة حديثاً (${dynamicBooks.length})</span>
          <span class="academy-muted">تحميل مباشر بصيغة PDF</span>
        </div>
        <h3 style="margin:10px 0 6px">📖 أحدث الكتب والأبحاث المضافة للمكتبة</h3>

        <div class="academy-grid" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,290px),1fr));margin-top:12px">
          ${dynamicBooks.map(b => `
            <div class="academy-card" style="background:var(--bg);display:flex;flex-direction:column;justify-content:space-between">
              <div>
                <div style="display:flex;justify-content:space-between;gap:6px;flex-wrap:wrap">
                  <span class="doc-badge ${b.lang === "en" ? "amber" : "green"}">${b.lang === "en" ? "English" : "عربي"}</span>
                  <span class="academy-muted">${esc(b.cat || "مراجع جغرافية")}</span>
                </div>
                <h3 style="margin:10px 0 4px;font-size:15px">${esc(b.title)}</h3>
                <div class="academy-muted">✍️ المؤلف: <b>${esc(b.author || "-")}</b></div>
                ${b.desc ? `<p style="font-size:13px;margin-top:6px">${esc(b.desc)}</p>` : ""}
              </div>
              <a href="${esc(b.url)}" target="_blank" rel="noopener noreferrer" class="academy-btn" style="margin-top:12px;text-decoration:none;font-size:12px">
                📥 فتح / تحميل الكتاب ↗
              </a>
            </div>
          `).join("")}
        </div>
      </div>
    `;

    content.insertAdjacentHTML("afterbegin", html);
  }

  /* ==========================================================================
     3. بناء واجهة إدارة الكتب والدورات في لوحة الإدارة (#s-admin)
     ========================================================================== */
  function renderAdminCMSLists() {
    const cList = $("cmsCoursesList");
    const bList = $("cmsBooksList");

    if (cList) {
      cList.innerHTML = dynamicCourses.length ? dynamicCourses.map(c => `
        <div style="background:var(--bg);border:1px solid var(--ln);border-radius:10px;padding:9px;margin-bottom:6px;display:flex;justify-content:space-between;align-items:center;gap:8px">
          <div style="min-width:0">
            <b style="font-size:13px;display:block">${esc(c.title)}</b>
            <span class="mt">${esc(c.instructor)} • ${esc(c.cat)}</span>
          </div>
          <button type="button" class="r" style="padding:4px 9px;font-size:11px;min-height:28px" onclick="window.GEOAdminCMSDelete('geodev_courses','${esc(c.id)}')">حذف</button>
        </div>
      `).join("") : `<div class="mt">لا توجد دورات مضافة من الإدارة بعد.</div>`;
    }

    if (bList) {
      bList.innerHTML = dynamicBooks.length ? dynamicBooks.map(b => `
        <div style="background:var(--bg);border:1px solid var(--ln);border-radius:10px;padding:9px;margin-bottom:6px;display:flex;justify-content:space-between;align-items:center;gap:8px">
          <div style="min-width:0">
            <b style="font-size:13px;display:block">${esc(b.title)}</b>
            <span class="mt">${esc(b.author)} • ${b.lang === "en" ? "English" : "عربي"}</span>
          </div>
          <button type="button" class="r" style="padding:4px 9px;font-size:11px;min-height:28px" onclick="window.GEOAdminCMSDelete('geodev_books','${esc(b.id)}')">حذف</button>
        </div>
      `).join("") : `<div class="mt">لا توجد كتب مضافة من الإدارة بعد.</div>`;
    }
  }

  window.GEOAdminCMSAddCourse = async function () {
    const db = getDB();
    if (!db) return window.toast && window.toast("قاعدة البيانات غير متصلة", "error");

    const title = $("cmsCourseTitle")?.value.trim();
    const instructor = $("cmsCourseInst")?.value.trim();
    const cat = $("cmsCourseCat")?.value.trim() || "GIS";
    const level = $("cmsCourseLevel")?.value.trim() || "شامل";
    const url = $("cmsCourseUrl")?.value.trim();
    const dataUrl = $("cmsCourseData")?.value.trim();
    const desc = $("cmsCourseDesc")?.value.trim();

    if (!title || !url) {
      return window.toast && window.toast("أدخل اسم الدورة ورابط التشغيل على الأقل", "warn");
    }

    try {
      await db.collection("geodev_courses").add({
        title, instructor, cat, level, url, dataUrl, desc,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      ["cmsCourseTitle", "cmsCourseInst", "cmsCourseUrl", "cmsCourseData", "cmsCourseDesc"].forEach(id => {
        if ($(id)) $(id).value = "";
      });

      if (window.toast) window.toast("تم نشر الدورة لجميع المستخدمين بنجاح!", "success");
      await fetchDynamicContent();
    } catch (e) {
      if (window.toast) window.toast("تعذر الحفظ: " + e.message, "error");
    }
  };

  window.GEOAdminCMSAddBook = async function () {
    const db = getDB();
    if (!db) return window.toast && window.toast("قاعدة البيانات غير متصلة", "error");

    const title = $("cmsBookTitle")?.value.trim();
    const author = $("cmsBookAuthor")?.value.trim();
    const lang = $("cmsBookLang")?.value || "ar";
    const cat = $("cmsBookCat")?.value.trim() || "GIS";
    const url = $("cmsBookUrl")?.value.trim();
    const desc = $("cmsBookDesc")?.value.trim();

    if (!title || !url) {
      return window.toast && window.toast("أدخل عنوان الكتاب ورابط التحميل على الأقل", "warn");
    }

    try {
      await db.collection("geodev_books").add({
        title, author, lang, cat, url, desc,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      ["cmsBookTitle", "cmsBookAuthor", "cmsBookUrl", "cmsBookDesc"].forEach(id => {
        if ($(id)) $(id).value = "";
      });

      if (window.toast) window.toast("تم نشر الكتاب في المكتبة لجميع المستخدمين!", "success");
      await fetchDynamicContent();
    } catch (e) {
      if (window.toast) window.toast("تعذر الحفظ: " + e.message, "error");
    }
  };

  window.GEOAdminCMSDelete = async function (collectionName, docId) {
    if (!confirm("هل تريد حذف هذا العنصر نهائياً؟")) return;
    const db = getDB();
    if (!db) return;

    try {
      await db.collection(collectionName).doc(docId).delete();
      if (window.toast) window.toast("تم الحذف بنجاح", "info");
      await fetchDynamicContent();
    } catch (e) {
      if (window.toast) window.toast("تعذر الحذف: " + e.message, "error");
    }
  };

  function injectAdminCMSCards() {
    const adminPanel = $("adminPanel");
    if (!adminPanel || $("gdAdminCMSCard")) return;

    const cmsHtml = `
      <div class="card" id="gdAdminCMSCard" style="border-color:var(--gr)">
        <h3>📚 إدارة الدورات والكتب الحصرية (نشر فوري للجميع)</h3>
        <p class="mt" style="line-height:1.7">
          أضف أي دورة تدريبية لمحاضر متعاقد أو كتاب/مرجع علمي جديد، وسيظهر تلقائياً في الأكاديمية لكل المستخدمين.
        </p>

        <details open style="margin-top:10px">
          <summary style="font-weight:800;color:var(--bl)">➕ إضافة دورة تدريبية / محاضر جديد</summary>
          <input id="cmsCourseTitle" placeholder="عنوان الدورة (مثال: احتراف ArcGIS Pro من الصفر)">
          <div class="g2">
            <input id="cmsCourseInst" placeholder="اسم المحاضر (مثال: م. أحمد سمير)">
            <input id="cmsCourseCat" placeholder="التخصص (GIS / مساحة / استشعار / Civil 3D)">
          </div>
          <div class="g2">
            <input id="cmsCourseLevel" placeholder="المستوى (مبتدئ / متقدم / باحثين)">
            <input id="cmsCourseUrl" placeholder="رابط الكورس أو قائمة التشغيل (URL)">
          </div>
          <input id="cmsCourseData" placeholder="رابط ملفات التدريب العملية Datasets (اختياري)">
          <textarea id="cmsCourseDesc" rows="2" placeholder="وصف مختصر لمحتوى الدورة ومميزاتها..."></textarea>
          <button type="button" class="g" style="width:100%;margin-bottom:10px" onclick="window.GEOAdminCMSAddCourse()">نشر الدورة الآن</button>
          <div id="cmsCoursesList"></div>
        </details>

        <hr style="border:0;border-top:1px solid var(--ln);margin:14px 0">

        <details>
          <summary style="font-weight:800;color:var(--am)">📖 إضافة كتاب أو مرجع علمي جديد للمكتبة</summary>
          <input id="cmsBookTitle" placeholder="عنوان الكتاب أو الرسالة العلمية">
          <div class="g2">
            <input id="cmsBookAuthor" placeholder="اسم المؤلف">
            <select id="cmsBookLang">
              <option value="ar">اللغة: عربي</option>
              <option value="en">اللغة: إنجليزي (English)</option>
            </select>
          </div>
          <div class="g2">
            <input id="cmsBookCat" placeholder="التخصص (GIS / مساحة / جغرافيا طبيعية...)">
            <input id="cmsBookUrl" placeholder="رابط التحميل المباشر (MediaFire / Drive / PDF)">
          </div>
          <textarea id="cmsBookDesc" rows="2" placeholder="نبذة مختصرة عن الكتاب..."></textarea>
          <button type="button" class="a" style="width:100%;margin-bottom:10px" onclick="window.GEOAdminCMSAddBook()">نشر الكتاب في المكتبة</button>
          <div id="cmsBooksList"></div>
        </details>
      </div>
    `;

    const kbCard = $("gdKBAdminCard");
    if (kbCard) {
      kbCard.insertAdjacentHTML("beforebegin", cmsHtml);
    } else {
      adminPanel.insertAdjacentHTML("beforeend", cmsHtml);
    }
    renderAdminCMSLists();
  }

  /* ==========================================================================
     4. التشغيل والمراقبة
     ========================================================================== */
  function initCMS() {
    injectAdminCMSCards();
    fetchDynamicContent();

    if (window.firebase && firebase.apps.length) {
      firebase.auth().onAuthStateChanged(u => {
        if (u) fetchDynamicContent();
      });
    }

    const acadSec = $("s-academy");
    if (acadSec) {
      new MutationObserver(() => {
        renderDynamicCoursesInAcademy();
        renderDynamicBooksInAcademy();
      }).observe(acadSec, { childList: true, subtree: true });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCMS);
  } else {
    initCMS();
  }
})();
