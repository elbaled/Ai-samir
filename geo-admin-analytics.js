/* ============================================================================
   GeoDev User Activity, Time Tracking & Search History Analytics v1.0
   1. تتبع وقت عمل كل حساب (اليوم، الإجمالي، عدد مرات الفتح، ومتوسط الجلسة).
   2. تحديد القسم الأكثر اهتماماً لكل مستخدم (المساحة، الجيوماتكس، المساعد، البرمجة، الأكاديمية).
   3. تسجيل سجل البحث والأسئلة الكامل (المساعد + الجيوماتكس + الأكاديمية) والأدوات المستخدمة.
   4. لوحة تحليلات تفاعلية داخل الإدارة (#adminPanel) مع نافذة فحص تفصيلية لكل حساب.
   ============================================================================ */

(function () {
  "use strict";
  if (window.GEOAdminAnalytics) return;
  window.GEOAdminAnalytics = true;

  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));

  const COLLECTION = "gd_user_activity";
  const SECTION_NAMES = {
    agent: "المساعد الذكي",
    studio: "البرمجة والتصميم",
    survey: "المساحة الهندسية",
    gis: "الجيوماتكس والخرائط",
    py: "مختبر الأكواد",
    academy: "الأكاديمية الجغرافية",
    profile: "الملف الشخصي"
  };

  const todayKey = () => new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  function formatDuration(sec) {
    sec = Math.max(0, Math.floor(Number(sec) || 0));
    if (sec < 60) return `${sec} ثانية`;
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    if (h > 0) return `${h} ساعة و ${m} دقيقة`;
    return `${m} دقيقة`;
  }

  function formatShortTime(sec) {
    sec = Math.max(0, Math.floor(Number(sec) || 0));
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return h > 0 ? `${h}س ${m}د` : `${m} د`;
  }

  /* ==========================================================================
     1. محرك تتبع وقت المستخدم ونشاطه في الخلفية (يعمل لكل المستخدمين)
     ========================================================================== */
  let localBuffer = {
    pendingSec: 0,
    pendingOpens: 0,
    sectionSecs: {},
    sectionVisits: {},
    logs: [],
    dirty: false
  };

  let currentSection = "agent";
  let lastTickMs = Date.now();
  let sessionCounted = false;

  function getCurrentUserInfo() {
    const u = window.firebase?.auth?.().currentUser;
    const email = (u?.email || sessionStorage.getItem("gd_email") || "").trim().toLowerCase();
    const name = u?.displayName || sessionStorage.getItem("gd_name") || (email ? email.split("@")[0] : "");
    const uid = u?.uid || "";
    return { email, name, uid };
  }

  function recordActivityLog(type, source, text) {
    const clean = String(text || "").trim();
    if (!clean || clean.length < 2) return;
    localBuffer.logs.unshift({
      type,   // 'search' | 'prompt' | 'tool' | 'section'
      source, // اسم القسم أو الأداة
      text: clean.slice(0, 260),
      at: Date.now(),
      day: todayKey()
    });
    if (localBuffer.logs.length > 60) localBuffer.logs.length = 60;
    localBuffer.dirty = true;
  }

  // نبضة كل 15 ثانية لحساب وقت الشغل الفعلي أثناء فتح الصفحة
  setInterval(() => {
    const { email } = getCurrentUserInfo();
    if (!email || document.hidden) {
      lastTickMs = Date.now();
      return;
    }

    const now = Date.now();
    const deltaSec = Math.min(30, Math.round((now - lastTickMs) / 1000));
    lastTickMs = now;

    if (deltaSec > 0) {
      localBuffer.pendingSec += deltaSec;
      localBuffer.sectionSecs[currentSection] = (localBuffer.sectionSecs[currentSection] || 0) + deltaSec;
      if (!sessionCounted) {
        sessionCounted = true;
        localBuffer.pendingOpens += 1;
      }
      localBuffer.dirty = true;
    }
  }, 15000);

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      lastTickMs = Date.now();
    } else {
      flushAnalyticsToCloud();
    }
  });

  // مزامنة البيانات المجمعة إلى Firestore كل 45 ثانية أو عند حدوث نشاط مهم
  async function flushAnalyticsToCloud() {
    if (!localBuffer.dirty) return;
    const { email, name, uid } = getCurrentUserInfo();
    if (!email || !window.firebase || !firebase.apps.length) return;

    const addSec = localBuffer.pendingSec;
    const addOpens = localBuffer.pendingOpens;
    const addSecBySection = { ...localBuffer.sectionSecs };
    const addVisitsBySection = { ...localBuffer.sectionVisits };
    const newLogs = [...localBuffer.logs];

    // تصفير المخزن المؤقت قبل الإرسال
    localBuffer.pendingSec = 0;
    localBuffer.pendingOpens = 0;
    localBuffer.sectionSecs = {};
    localBuffer.sectionVisits = {};
    localBuffer.logs = [];
    localBuffer.dirty = false;

    try {
      const db = firebase.firestore();
      const docId = email.replace(/[^a-z0-9@._-]/g, "_");
      const ref = db.collection(COLLECTION).doc(docId);
      const day = todayKey();

      await db.runTransaction(async tx => {
        const snap = await tx.get(ref);
        const prev = snap.exists ? snap.data() : {};

        const prevDaily = prev.daily || {};
        const todayData = prevDaily[day] || { sec: 0, opens: 0 };
        todayData.sec = (todayData.sec || 0) + addSec;
        todayData.opens = (todayData.opens || 0) + addOpens;
        prevDaily[day] = todayData;

        // الاحتفاظ بآخر 30 يوماً فقط لتقليل حجم الوثيقة
        const sortedDays = Object.keys(prevDaily).sort().slice(-30);
        const prunedDaily = {};
        sortedDays.forEach(d => { prunedDaily[d] = prevDaily[d]; });

        const secMap = { ...(prev.sectionSecs || {}) };
        Object.entries(addSecBySection).forEach(([k, v]) => {
          secMap[k] = (secMap[k] || 0) + v;
        });

        const visMap = { ...(prev.sectionVisits || {}) };
        Object.entries(addVisitsBySection).forEach(([k, v]) => {
          visMap[k] = (visMap[k] || 0) + v;
        });

        const mergedLogs = [...newLogs, ...(Array.isArray(prev.logs) ? prev.logs : [])].slice(0, 200);

        tx.set(ref, {
          email,
          name: name || prev.name || email.split("@")[0],
          uid: uid || prev.uid || "",
          totalSec: (prev.totalSec || 0) + addSec,
          totalOpens: (prev.totalOpens || 0) + addOpens,
          daily: prunedDaily,
          sectionSecs: secMap,
          sectionVisits: visMap,
          logs: mergedLogs,
          lastSection: currentSection,
          lastActiveAt: Date.now()
        }, { merge: true });
      });
    } catch (_) {
      // في حال انقطاع الإنترنت، نحفظ محلياً كنسخة احتياطية
      try {
        const key = "gd_local_analytics_" + email;
        const old = JSON.parse(localStorage.getItem(key) || "{}");
        old.logs = [...newLogs, ...(old.logs || [])].slice(0, 100);
        old.totalSec = (old.totalSec || 0) + addSec;
        localStorage.setItem(key, JSON.stringify(old));
      } catch (__) {}
    }
  }

  setInterval(flushAnalyticsToCloud, 45000);

  /* ==========================================================================
     2. ربط المستشعرات مع الأقسام، الأدوات، الشات، والبحث في الأكاديمية
     ========================================================================== */
  function attachActivityHooks() {
    // 1. تتبع التنقل بين الأقسام
    if (typeof window.go === "function" && !window.go.__analyticsHooked) {
      const _origGo = window.go;
      window.go = function (tab) {
        if (tab && SECTION_NAMES[tab]) {
          currentSection = tab;
          localBuffer.sectionVisits[tab] = (localBuffer.sectionVisits[tab] || 0) + 1;
          localBuffer.dirty = true;
        }
        return _origGo.apply(this, arguments);
      };
      window.go.__analyticsHooked = true;
    }

    // 2. تتبع فتح الأدوات الهندسية
    if (typeof window.openTool === "function" && !window.openTool.__analyticsHooked) {
      const _origOpenTool = window.openTool;
      window.openTool = function (toolId) {
        const modalTitle = document.querySelector(`#modal-${toolId} .tool-header h3`)?.textContent?.trim() || toolId;
        recordActivityLog("tool", "قسم المساحة", `فتح أداة: ${modalTitle}`);
        flushAnalyticsToCloud();
        return _origOpenTool.apply(this, arguments);
      };
      window.openTool.__analyticsHooked = true;
    }

    // 3. تتبع الأسئلة في المساعد العام
    if (typeof window.ask === "function" && !window.ask.__analyticsHooked) {
      const _origAsk = window.ask;
      window.ask = function (prompt, shown) {
        const q = shown || prompt;
        if (q && q !== "استكمال") {
          recordActivityLog("prompt", "المساعد الذكي", q);
          flushAnalyticsToCloud();
        }
        return _origAsk.apply(this, arguments);
      };
      window.ask.__analyticsHooked = true;
    }

    // 4. تتبع الأسئلة في شات الجيوماتكس
    if (typeof window.gisSend === "function" && !window.gisSend.__analyticsHooked) {
      const _origGisSend = window.gisSend;
      window.gisSend = function () {
        const q = ($("gisInput")?.value || "").trim();
        if (q) {
          recordActivityLog("prompt", "شات الجيوماتكس (GIS)", q);
          flushAnalyticsToCloud();
        }
        return _origGisSend.apply(this, arguments);
      };
      window.gisSend.__analyticsHooked = true;
    }

    // 5. تتبع البحث في الأكاديمية والكورسات
    let searchDebounce = null;
    document.addEventListener("input", e => {
      const t = e.target;
      if (!t) return;
      if (t.id === "gdArchiveSearchInput" || t.id === "academyCourseSearch" || t.id === "academySmartQuery") {
        clearTimeout(searchDebounce);
        searchDebounce = setTimeout(() => {
          const val = (t.value || "").trim();
          if (val.length >= 3) {
            recordActivityLog("search", "الأكاديمية والكورسات", `بحث عن: "${val}"`);
            flushAnalyticsToCloud();
          }
        }, 1600);
      }
    }, true);
  }

  /* ==========================================================================
     3. لوحة التحليلات وسجل المستخدمين داخل قسم الإدارة (#adminPanel)
     ========================================================================== */
  let cachedUsersAnalytics = [];

  function getTopSectionInfo(secSecs = {}, secVisits = {}) {
    let bestKey = "agent";
    let bestScore = -1;
    Object.keys(SECTION_NAMES).forEach(k => {
      if (k === "profile") return;
      const score = (secSecs[k] || 0) + (secVisits[k] || 0) * 15;
      if (score > bestScore) {
        bestScore = score;
        bestKey = k;
      }
    });
    return {
      key: bestKey,
      label: bestScore > 0 ? SECTION_NAMES[bestKey] : "لم يُحدد بعد"
    };
  }

  function injectAdminAnalyticsCard() {
    const adminPanel = $("adminPanel");
    if (!adminPanel || $("gdUserAnalyticsCard")) return;

    const dashCard = $("gdDash");
    const targetAnchor = dashCard || adminPanel.firstElementChild;

    targetAnchor.insertAdjacentHTML("afterend", `
      <div class="card" id="gdUserAnalyticsCard" style="border-color:var(--bl)">
        <div class="row" style="justify-content:space-between;margin-bottom:8px">
          <div>
            <h3 style="margin:0;color:var(--bl)">تحليلات نشاط الحسابات وسجل البحث التفصيلي</h3>
            <span class="mt">متابعة مدة شغل كل حساب اليوم والمتوسط والقسم المفضل وسجل البحث الكامل</span>
          </div>
          <button type="button" class="a" onclick="window.GEOAdminLoadAnalytics()">تحديث البيانات</button>
        </div>

        <!-- ملخص عام لمتوسطات المنصة -->
        <div id="gdAnalyticsOverview" class="st" style="margin-bottom:12px"></div>

        <input id="gdAnalyticsSearchUser" type="search" placeholder="ابحث بالبريد الإلكتروني أو اسم المستخدم أو القسم المفضل..."
          oninput="window.GEOAdminRenderUsersAnalytics()" style="margin-bottom:10px">

        <div id="gdAnalyticsUsersList" style="display:flex;flex-direction:column;gap:10px;max-height:560px;overflow-y:auto"></div>
      </div>
    `);

    window.GEOAdminLoadAnalytics();
  }

  window.GEOAdminLoadAnalytics = async function () {
    const listEl = $("gdAnalyticsUsersList");
    if (listEl) listEl.innerHTML = `<div class="mt">جاري تحميل بيانات النشاط وسجل البحث من الخادم...</div>`;

    await flushAnalyticsToCloud();

    try {
      if (!window.firebase || !firebase.apps.length) return;
      const snap = await firebase.firestore().collection(COLLECTION).orderBy("lastActiveAt", "desc").limit(150).get();
      cachedUsersAnalytics = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      window.GEOAdminRenderUsersAnalytics();
    } catch (e) {
      if (listEl) {
        listEl.innerHTML = `<div class="mt" style="color:#f87171">تعذر جلب السجلات السحابية (${esc(e.message)}). تأكد من صلاحيات Firestore لمجموعة <code>gd_user_activity</code>.</div>`;
      }
    }
  };

  window.GEOAdminRenderUsersAnalytics = function () {
    const listEl = $("gdAnalyticsUsersList");
    const overEl = $("gdAnalyticsOverview");
    if (!listEl) return;

    const day = todayKey();
    const q = ($("gdAnalyticsSearchUser")?.value || "").trim().toLowerCase();

    // حساب الإحصائيات العامة
    let activeTodayUsers = 0;
    let totalTodaySec = 0;
    let totalAllSec = 0;
    let totalAllOpens = 0;
    const globalSectionScores = {};

    cachedUsersAnalytics.forEach(u => {
      const td = u.daily?.[day] || { sec: 0, opens: 0 };
      if (td.sec > 0 || td.opens > 0) activeTodayUsers++;
      totalTodaySec += td.sec || 0;
      totalAllSec += u.totalSec || 0;
      totalAllOpens += Math.max(1, u.totalOpens || 1);

      Object.entries(u.sectionSecs || {}).forEach(([k, v]) => {
        globalSectionScores[k] = (globalSectionScores[k] || 0) + v;
      });
    });

    const avgSessionAll = totalAllOpens > 0 ? Math.round(totalAllSec / totalAllOpens) : 0;
    const topGlobalSec = getTopSectionInfo(globalSectionScores, {});

    if (overEl) {
      overEl.innerHTML = `
        <div><div class="mt">نشطون اليوم</div><b style="color:var(--gr)">${activeTodayUsers} حساب</b></div>
        <div><div class="mt">شغل اليوم</div><b style="color:var(--bl)">${formatShortTime(totalTodaySec)}</b></div>
        <div><div class="mt">متوسط الجلسة</div><b style="color:var(--am)">${formatShortTime(avgSessionAll)}</b></div>
        <div><div class="mt">أكثر قسم نشاطاً</div><b style="color:var(--tx);font-size:11.5px">${esc(topGlobalSec.label)}</b></div>
      `;
    }

    const filtered = cachedUsersAnalytics.filter(u => {
      if (!q) return true;
      const topSec = getTopSectionInfo(u.sectionSecs, u.sectionVisits).label;
      return (u.email || "").toLowerCase().includes(q) ||
             (u.name || "").toLowerCase().includes(q) ||
             topSec.toLowerCase().includes(q);
    });

    if (!filtered.length) {
      listEl.innerHTML = `<div class="mt" style="text-align:center;padding:16px">لا توجد سجلات نشاط مسجلة بعد. سيبدأ التسجيل تلقائياً بمجرد تصفح المستخدمين للمنصة.</div>`;
      return;
    }

    listEl.innerHTML = filtered.map((u, idx) => {
      const td = u.daily?.[day] || { sec: 0, opens: 0 };
      const opensCount = Math.max(1, u.totalOpens || 1);
      const avgSec = Math.round((u.totalSec || 0) / opensCount);
      const topSec = getTopSectionInfo(u.sectionSecs, u.sectionVisits);
      const logsCount = Array.isArray(u.logs) ? u.logs.length : 0;
      const lastSeen = u.lastActiveAt ? new Date(u.lastActiveAt).toLocaleString("ar-EG") : "غير معروف";

      return `
        <div style="background:var(--bg);border:1px solid var(--ln);border-radius:12px;padding:12px">
          <div class="row" style="justify-content:space-between;margin-bottom:6px">
            <div>
              <b style="color:var(--tx);font-size:14px">${esc(u.name || "مستخدم")}</b>
              <div class="mt c" style="font-size:11.5px">${esc(u.email)}</div>
            </div>
            <span style="font-size:11px;font-weight:800;background:rgba(59,130,246,0.14);color:var(--bl);padding:3px 10px;border-radius:12px">
              القسم المفضل: ${esc(topSec.label)}
            </span>
          </div>

          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px;font-size:12px;background:var(--cd);padding:8px 10px;border-radius:8px;border:1px solid var(--ln);margin-bottom:8px">
            <div>مدة الشغل اليوم: <b style="color:var(--gr)">${formatDuration(td.sec)}</b> (${td.opens || 0} فتح)</div>
            <div>متوسط الجلسة: <b style="color:var(--am)">${formatDuration(avgSec)}</b></div>
            <div>إجمالي الشغل الكلي: <b>${formatDuration(u.totalSec || 0)}</b></div>
            <div>آخر تواجد: <span class="mt">${lastSeen}</span></div>
          </div>

          <button type="button" class="g" style="width:100%;font-size:12px" onclick="window.GEOAdminInspectUser('${esc(u.id)}')">
            عرض سجل البحث والأسئلة الكامل (${logsCount} نشاط مسجل) ↗
          </button>
        </div>
      `;
    }).join("");
  };

  /* ==========================================================================
     4. نافذة الفحص التفصيلي لحساب محدد (كل ما بحث عنه + نسب اهتمامه بالأقسام)
     ========================================================================== */
  window.GEOAdminInspectUser = function (userId) {
    const u = cachedUsersAnalytics.find(x => x.id === userId);
    if (!u) return;

    $("gdInspectUserModal")?.remove();

    const day = todayKey();
    const td = u.daily?.[day] || { sec: 0, opens: 0 };
    const opensCount = Math.max(1, u.totalOpens || 1);
    const avgSec = Math.round((u.totalSec || 0) / opensCount);
    const logs = Array.isArray(u.logs) ? u.logs : [];

    // حساب نسب الاهتمام بكل قسم
    const secEntries = Object.keys(SECTION_NAMES)
      .filter(k => k !== "profile")
      .map(k => ({
        key: k,
        name: SECTION_NAMES[k],
        sec: u.sectionSecs?.[k] || 0,
        visits: u.sectionVisits?.[k] || 0
      }))
      .sort((a, b) => (b.sec + b.visits * 15) - (a.sec + a.visits * 15));

    const totalSecSum = secEntries.reduce((s, x) => s + x.sec, 0) || 1;

    const barsHtml = secEntries.map(s => {
      const pct = Math.min(100, Math.round((s.sec / totalSecSum) * 100));
      return `
        <div style="margin-bottom:6px">
          <div class="row" style="justify-content:space-between;font-size:12px;margin-bottom:2px">
            <b>${esc(s.name)}</b>
            <span class="mt">${formatShortTime(s.sec)} (${pct}%) • ${s.visits} زيارة</span>
          </div>
          <div style="height:7px;background:var(--bg);border-radius:6px;overflow:hidden;border:1px solid var(--ln)">
            <div style="height:100%;width:${pct}%;background:var(--bl)"></div>
          </div>
        </div>
      `;
    }).join("");

    const renderLogsRows = (filterText = "") => {
      const fq = filterText.trim().toLowerCase();
      const list = logs.filter(l => !fq || (l.text || "").toLowerCase().includes(fq) || (l.source || "").toLowerCase().includes(fq));
      if (!list.length) return `<div class="mt" style="padding:12px;text-align:center">لا توجد عمليات بحث مطابقة.</div>`;

      return list.map(l => {
        const badgeColor = l.type === "search" ? "var(--am)" : (l.type === "tool" ? "var(--gr)" : "var(--bl)");
        const typeLabel = l.type === "search" ? "بحث" : (l.type === "tool" ? "أداة" : "سؤال AI");
        const timeStr = l.at ? new Date(l.at).toLocaleString("ar-EG") : "";
        return `
          <div style="background:var(--bg);border:1px solid var(--ln);border-radius:10px;padding:10px;margin-bottom:8px">
            <div class="row" style="justify-content:space-between;margin-bottom:4px">
              <span style="font-size:10.5px;font-weight:800;color:${badgeColor}">[${typeLabel}] ${esc(l.source || "")}</span>
              <span class="mt" style="font-size:10.5px">${timeStr}</span>
            </div>
            <div style="font-size:13px;line-height:1.65;color:var(--tx);word-break:break-word">${esc(l.text)}</div>
          </div>
        `;
      }).join("");
    };

    document.body.insertAdjacentHTML("beforeend", `
      <div id="gdInspectUserModal" class="tool-modal on" style="z-index:130" onclick="if(event.target===this)this.remove()">
        <div class="tool-content" style="max-width:720px">
          <div class="tool-header">
            <h3>تقرير نشاط الحساب: ${esc(u.name || u.email)}</h3>
            <button class="close-btn" onclick="$('gdInspectUserModal').remove()">✕</button>
          </div>
          <div class="tool-body">
            <div class="st" style="margin-bottom:12px">
              <div><div class="mt">شغل اليوم</div><b style="color:var(--gr)">${formatShortTime(td.sec)}</b></div>
              <div><div class="mt">مرات الفتح اليوم</div><b>${td.opens || 0}</b></div>
              <div><div class="mt">متوسط الجلسة</div><b style="color:var(--am)">${formatShortTime(avgSec)}</b></div>
              <div><div class="mt">إجمالي الشغل</div><b style="color:var(--bl)">${formatShortTime(u.totalSec || 0)}</b></div>
            </div>

            <div class="tool-section">
              <h4>نسب اهتمام الحساب بأقسام المنصة</h4>
              ${barsHtml}
            </div>

            <div class="tool-section">
              <div class="row" style="justify-content:space-between;margin-bottom:8px">
                <h4 style="margin:0">سجل البحث والأسئلة والأدوات (${logs.length})</h4>
                <button type="button" class="k" style="padding:4px 10px;min-height:28px;font-size:11px" onclick="window.GEOAdminExportUserReport('${esc(u.id)}')">تصدير التقرير</button>
              </div>
              <input id="gdInspectLogFilter" type="search" placeholder="ابحث داخل سجل هذا المستخدم..." style="margin-bottom:8px">
              <div id="gdInspectLogsContainer" style="max-height:340px;overflow-y:auto">
                ${renderLogsRows("")}
              </div>
            </div>
          </div>
        </div>
      </div>
    `);

    const filterInput = $("gdInspectLogFilter");
    if (filterInput) {
      filterInput.oninput = () => {
        $("gdInspectLogsContainer").innerHTML = renderLogsRows(filterInput.value);
      };
    }
  };

  window.GEOAdminExportUserReport = function (userId) {
    const u = cachedUsersAnalytics.find(x => x.id === userId);
    if (!u) return;
    const lines = [
      `تقرير نشاط المستخدم: ${u.name} (${u.email})`,
      `إجمالي وقت العمل: ${formatDuration(u.totalSec || 0)}`,
      `عدد مرات فتح المنصة: ${u.totalOpens || 0}`,
      `----------------------------------------`,
      `سجل البحث والنشاط الكامل:`,
      ...(u.logs || []).map(l => `[${new Date(l.at).toLocaleString("ar-EG")}] (${l.source}) ${l.text}`)
    ];
    if (typeof window.dlText === "function") {
      window.dlText(lines.join("\n"), `user-activity-${u.email}.txt`);
    }
  };

  /* ==========================================================================
     5. التشغيل والربط مع لوحة الإدارة
     ========================================================================== */
  function initAnalytics() {
    attachActivityHooks();
    injectAdminAnalyticsCard();

    if (typeof window.adminLoad === "function" && !window.adminLoad.__analyticsHooked) {
      const _origAdminLoad = window.adminLoad;
      window.adminLoad = function () {
        const r = _origAdminLoad.apply(this, arguments);
        injectAdminAnalyticsCard();
        window.GEOAdminLoadAnalytics();
        return r;
      };
      window.adminLoad.__analyticsHooked = true;
    }

    setInterval(() => {
      attachActivityHooks();
      injectAdminAnalyticsCard();
    }, 2000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAnalytics);
  } else {
    initAnalytics();
  }
})();
