/* ============================================================================
   استطلاع الرأي العام للمستخدمين المسجلين + شريط النتائج العلوي المباشر
   - يظهر بعد تسجيل الدخول فقط
   - يحفظ الأصوات في ذاكرة المنصة السحابية (Firestore) ليراها الجميع
   - يسمح للمستخدم بتبديل اختياره مع تعديل النسب تلقائياً (30% أساسيات / 0% AI كبداية)
   ============================================================================ */
(function () {
  "use strict";
  if (window.GEOAutocadPollV2Init) return;
  window.GEOAutocadPollV2Init = true;

  const ADMIN_EMAIL = "eng.ahmedsamir.gis@gmail.com";
  const POLL_DOC_ID = "autocad_start_poll_v1";
  const LOCAL_COUNTS_KEY = "gd_autocad_poll_counts_v2";

  let currentUser = null;
  let isAdminUser = false;
  let userChoice = ""; // 'basics' | 'ai' | ''
  let isSavingVote = false;

  // القيم السحابية المشتركة بين جميع المستخدمين
  let pollState = JSON.parse(localStorage.getItem(LOCAL_COUNTS_KEY) || "null") || {
    basicsVotes: 0,
    aiVotes: 0
  };

  function calculatePercentages() {
    const bVotes = Math.max(0, Number(pollState.basicsVotes || 0));
    const aVotes = Math.max(0, Number(pollState.aiVotes || 0));
    const totalNewVotes = bVotes + aVotes;

    if (totalNewVotes === 0) {
      return { basicsPct: 30, aiPct: 0, totalVotes: 0 };
    }

    const effectiveBasics = 30 + bVotes;
    const effectiveAi = 0 + aVotes;
    const effectiveTotal = effectiveBasics + effectiveAi;

    const basicsPct = Math.round((effectiveBasics / effectiveTotal) * 100);
    const aiPct = 100 - basicsPct;

    return { basicsPct, aiPct, totalVotes: totalNewVotes };
  }

  function injectStyles() {
    if (document.getElementById("gdAutocadPollV2Styles")) return;
    const style = document.createElement("style");
    style.id = "gdAutocadPollV2Styles";
    style.textContent = `
      /* الشريط العلوي الدائم بعد التصويت */
      #gdAutocadTopPollBar {
        position: sticky;
        top: 0;
        z-index: 9980;
        background: linear-gradient(90deg, #0f172a 0%, #1e293b 100%);
        color: #f8fafc;
        border-bottom: 2px solid #e09f24;
        padding: 8px 12px;
        font-size: 12px;
        direction: rtl;
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 8px;
        box-shadow: 0 4px 12px rgba(15, 23, 42, 0.25);
      }
      .gd-top-poll-stats {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;
        font-weight: 800;
      }
      .gd-top-poll-pill {
        background: rgba(224, 159, 36, 0.16);
        border: 1px solid rgba(224, 159, 36, 0.45);
        color: #fbbf24;
        padding: 3px 9px;
        border-radius: 99px;
        font-size: 11.5px;
      }
      .gd-top-poll-pill.ai-pill {
        background: rgba(34, 197, 94, 0.16);
        border-color: rgba(34, 197, 94, 0.45);
        color: #4ade80;
      }
      .gd-top-poll-edit-btn {
        background: #e09f24;
        color: #0f172a;
        border: none;
        border-radius: 8px;
        padding: 4px 10px;
        font-size: 11px;
        font-weight: 900;
        cursor: pointer;
        font-family: inherit;
      }

      /* نافذة التصويت المنبثقة */
      #gdAutocadPollOverlay {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.78);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        z-index: 10060;
        direction: rtl;
        text-align: right;
        font-family: inherit;
      }
      .gd-poll-card {
        background: #ffffff;
        border: 2px solid #e09f24;
        border-radius: 20px;
        width: 100%;
        max-width: 440px;
        padding: 20px 18px;
        box-shadow: 0 20px 45px rgba(15, 23, 42, 0.35);
        color: #0f172a;
      }
      .gd-poll-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: #fffbeb;
        color: #b45309;
        border: 1px solid #f59e0b;
        padding: 4px 11px;
        border-radius: 99px;
        font-size: 11.5px;
        font-weight: 900;
        margin-bottom: 10px;
      }
      .gd-poll-title {
        margin: 0 0 6px;
        font-size: 18px;
        font-weight: 900;
        color: #0f172a;
      }
      .gd-poll-sub {
        margin: 0 0 15px;
        font-size: 13px;
        color: #475569;
        line-height: 1.5;
      }
      .gd-poll-option {
        position: relative;
        border: 2px solid #cbd5e1;
        border-radius: 14px;
        padding: 13px 14px;
        margin-bottom: 11px;
        cursor: pointer;
        overflow: hidden;
        background: #f8fafc;
        transition: all 0.2s ease;
        user-select: none;
      }
      .gd-poll-option:hover {
        border-color: #e09f24;
        background: #fffbeb;
      }
      .gd-poll-option.selected {
        border-color: #16a34a;
        background: #f0fdf4;
      }
      .gd-poll-bar-fill {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        background: rgba(224, 159, 36, 0.22);
        z-index: 0;
        transition: width 0.4s ease;
      }
      .gd-poll-option.selected .gd-poll-bar-fill {
        background: rgba(22, 163, 74, 0.18);
      }
      .gd-poll-option-content {
        position: relative;
        z-index: 1;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }
      .gd-poll-option-label {
        font-size: 14px;
        font-weight: 900;
        color: #0f172a;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .gd-poll-radio {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        border: 2px solid #64748b;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        background: #ffffff;
      }
      .gd-poll-option.selected .gd-poll-radio {
        border-color: #16a34a;
        background: #16a34a;
      }
      .gd-poll-option.selected .gd-poll-radio::after {
        content: "";
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #ffffff;
      }
      .gd-poll-pct {
        font-size: 14px;
        font-weight: 900;
        color: #b45309;
        background: #ffffff;
        padding: 3px 9px;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
        min-width: 48px;
        text-align: center;
      }
      .gd-poll-option.selected .gd-poll-pct {
        color: #15803d;
        border-color: #86efac;
      }
      .gd-poll-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        margin-top: 14px;
        padding-top: 10px;
        border-top: 1px solid #e2e8f0;
      }
      .gd-poll-close-btn {
        background: #0f172a;
        color: #e09f24;
        border: none;
        border-radius: 10px;
        padding: 9px 18px;
        font-size: 13px;
        font-weight: 900;
        cursor: pointer;
        font-family: inherit;
      }

      body.dark-mode .gd-poll-card,
      [data-theme="dark"] .gd-poll-card {
        background: #171c26;
        color: #ffffff;
      }
      body.dark-mode .gd-poll-title,
      body.dark-mode .gd-poll-option-label,
      [data-theme="dark"] .gd-poll-title,
      [data-theme="dark"] .gd-poll-option-label {
        color: #ffffff;
      }
      body.dark-mode .gd-poll-option,
      [data-theme="dark"] .gd-poll-option {
        background: #10141c;
        border-color: #2a3242;
      }
    `;
    document.head.appendChild(style);
  }

  function getFirestoreDb() {
    try {
      if (window.firebase && typeof firebase.firestore === "function") {
        return firebase.firestore();
      }
    } catch (_) {}
    return null;
  }

  // رسم الشريط العلوي الدائم بعد التصويت
  function renderTopResultsBar() {
    if (!currentUser) {
      const existing = document.getElementById("gdAutocadTopPollBar");
      if (existing) existing.remove();
      return;
    }

    let bar = document.getElementById("gdAutocadTopPollBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "gdAutocadTopPollBar";
      document.body.prepend(bar);
    }

    const { basicsPct, aiPct } = calculatePercentages();
    const myChoiceText =
      userChoice === "basics"
        ? "اختيارك: أساسيات الأوتوكاد"
        : userChoice === "ai"
        ? "اختيارك: كورس ربط الـ AI"
        : "لم تختر بعد";

    bar.innerHTML = `
      <div class="gd-top-poll-stats">
        <span>📊 تصويت الأوتوكاد:</span>
        <span class="gd-top-poll-pill">أساسيات الأوتوكاد المساحي: ${basicsPct}%</span>
        <span class="gd-top-poll-pill ai-pill">ربط الـ AI بالأوتوكاد: ${aiPct}%</span>
      </div>
      <div style="display:flex;align-items:center;gap:6px;">
        <span style="font-size:11px;color:#cbd5e1;">(${myChoiceText})</span>
        <button type="button" class="gd-top-poll-edit-btn" onclick="window.GEOAutocadPollActions.openModal()">
          تغيير اختياري
        </button>
      </div>
    `;
  }

  // مزامنة الأصوات واختيار المستخدم مع قاعدة بيانات المنصة السحابية
  function subscribeCloudPoll() {
    const db = getFirestoreDb();
    if (!db || !currentUser) return;

    // 1. الاستماع لإجمالي الأصوات العامة في المنصة
    db.collection("geodev_polls")
      .doc(POLL_DOC_ID)
      .onSnapshot(
        doc => {
          if (doc.exists) {
            const data = doc.data() || {};
            pollState.basicsVotes = Math.max(0, Number(data.basicsVotes || 0));
            pollState.aiVotes = Math.max(0, Number(data.aiVotes || 0));
            localStorage.setItem(LOCAL_COUNTS_KEY, JSON.stringify(pollState));
          }
          renderTopResultsBar();
          const overlay = document.getElementById("gdAutocadPollOverlay");
          if (overlay && overlay.style.display !== "none") renderPollModal();
        },
        () => {}
      );

    // 2. قراءة اختيار هذا المستخدم المحفوظ في حسابه
    db.collection("geodev_polls")
      .doc(POLL_DOC_ID)
      .collection("voters")
      .doc(currentUser.uid)
      .get()
      .then(doc => {
        if (doc.exists && doc.data() && doc.data().choice) {
          userChoice = doc.data().choice;
          localStorage.setItem(`gd_poll_choice_${currentUser.uid}`, userChoice);
          renderTopResultsBar();
        } else {
          // إذا لم يسبق له التصويت في حسابه، نفتح له نافذة التصويت تلقائياً
          openPollModal();
        }
      })
      .catch(() => {
        userChoice = localStorage.getItem(`gd_poll_choice_${currentUser.uid}`) || "";
        if (!userChoice) openPollModal();
        renderTopResultsBar();
      });
  }

  // التصويت أو تبديل الاختيار وحفظه في ذاكرة المنصة العامة
  async function voteOrSwitch(newChoice) {
    if (!currentUser || isSavingVote) return;
    if (userChoice === newChoice) return; // نفس الاختيار الحالي

    const prevChoice = userChoice;
    userChoice = newChoice;
    localStorage.setItem(`gd_poll_choice_${currentUser.uid}`, newChoice);

    // تحديث الأرقام محلياً فوراً لتجربة سريعة
    if (prevChoice === "basics") pollState.basicsVotes = Math.max(0, pollState.basicsVotes - 1);
    if (prevChoice === "ai") pollState.aiVotes = Math.max(0, pollState.aiVotes - 1);

    if (newChoice === "basics") pollState.basicsVotes += 1;
    if (newChoice === "ai") pollState.aiVotes += 1;

    localStorage.setItem(LOCAL_COUNTS_KEY, JSON.stringify(pollState));
    renderPollModal();
    renderTopResultsBar();

    // حفظ التغيير في Firestore عبر Transaction لضمان دقة العداد للجميع
    const db = getFirestoreDb();
    if (!db) return;

    isSavingVote = true;
    try {
      const pollRef = db.collection("geodev_polls").doc(POLL_DOC_ID);
      const voterRef = pollRef.collection("voters").doc(currentUser.uid);

      await db.runTransaction(async tx => {
        const pollSnap = await tx.get(pollRef);
        const voterSnap = await tx.get(voterRef);

        const currentData = pollSnap.exists ? pollSnap.data() : { basicsVotes: 0, aiVotes: 0 };
        let b = Math.max(0, Number(currentData.basicsVotes || 0));
        let a = Math.max(0, Number(currentData.aiVotes || 0));

        const cloudPrevChoice = voterSnap.exists ? voterSnap.data().choice : "";
        if (cloudPrevChoice === "basics") b = Math.max(0, b - 1);
        if (cloudPrevChoice === "ai") a = Math.max(0, a - 1);

        if (newChoice === "basics") b += 1;
        if (newChoice === "ai") a += 1;

        tx.set(pollRef, { basicsVotes: b, aiVotes: a, updatedAt: Date.now() }, { merge: true });
        tx.set(voterRef, {
          choice: newChoice,
          email: currentUser.email || "",
          updatedAt: Date.now()
        });
      });
    } catch (err) {
      console.warn("Firestore poll sync error:", err);
    } finally {
      isSavingVote = false;
    }
  }

  async function resetPollAdmin() {
    if (!isAdminUser || !confirm("هل تريد تصفير أصوات الاستطلاع للجميع وإعادتها لنقطة البداية (30% / 0%)؟")) return;
    pollState = { basicsVotes: 0, aiVotes: 0 };
    userChoice = "";
    if (currentUser) localStorage.removeItem(`gd_poll_choice_${currentUser.uid}`);
    localStorage.setItem(LOCAL_COUNTS_KEY, JSON.stringify(pollState));
    renderPollModal();
    renderTopResultsBar();

    const db = getFirestoreDb();
    if (db) {
      try {
        await db.collection("geodev_polls").doc(POLL_DOC_ID).set({
          basicsVotes: 0,
          aiVotes: 0,
          updatedAt: Date.now()
        });
        if (currentUser) {
          await db.collection("geodev_polls").doc(POLL_DOC_ID).collection("voters").doc(currentUser.uid).delete();
        }
      } catch (_) {}
    }
  }

  function openPollModal() {
    if (!currentUser) return;
    let overlay = document.getElementById("gdAutocadPollOverlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "gdAutocadPollOverlay";
      document.body.appendChild(overlay);
    }
    overlay.style.display = "flex";
    renderPollModal();
  }

  function closePollModal() {
    const overlay = document.getElementById("gdAutocadPollOverlay");
    if (overlay) overlay.style.display = "none";
    renderTopResultsBar();
  }

  function renderPollModal() {
    const overlay = document.getElementById("gdAutocadPollOverlay");
    if (!overlay) return;

    const { basicsPct, aiPct } = calculatePercentages();

    overlay.innerHTML = `
      <div class="gd-poll-card">
        <div class="gd-poll-badge">📢 استطلاع رأي عام للأعضاء</div>
        <h3 class="gd-poll-title">عاوزين نبدأ إيه في الأوتوكاد؟</h3>
        <p class="gd-poll-sub">
          ${
            userChoice
              ? "✔ تم حفظ اختيارك في المنصة. يمكنك الضغط على الخيار الآخر في أي وقت لتبديل رأيك:"
              : "اختر مسار البداية المناسب لك ليتم اعتماده في الشروحات:"
          }
        </p>

        <div class="gd-poll-option ${userChoice === "basics" ? "selected" : ""}"
          onclick="window.GEOAutocadPollActions.vote('basics')">
          <div class="gd-poll-bar-fill" style="width: ${basicsPct}%;"></div>
          <div class="gd-poll-option-content">
            <span class="gd-poll-option-label">
              <span class="gd-poll-radio"></span>
              <span>1. أساسيات الأوتوكاد المساحي</span>
            </span>
            <span class="gd-poll-pct">${basicsPct}%</span>
          </div>
        </div>

        <div class="gd-poll-option ${userChoice === "ai" ? "selected" : ""}"
          onclick="window.GEOAutocadPollActions.vote('ai')">
          <div class="gd-poll-bar-fill" style="width: ${aiPct}%;"></div>
          <div class="gd-poll-option-content">
            <span class="gd-poll-option-label">
              <span class="gd-poll-radio"></span>
              <span>2. بداية كورس ربط الـ AI بالأوتوكاد</span>
            </span>
            <span class="gd-poll-pct">${aiPct}%</span>
          </div>
        </div>

        <div class="gd-poll-footer">
          <span style="font-size:11.5px;color:#64748b;font-weight:700;">
            ${userChoice ? "محفوظ في حسابك ✓" : "اضغط للاختيار"}
          </span>
          <div style="display:flex;gap:6px;align-items:center;">
            ${
              isAdminUser
                ? `<button type="button" onclick="window.GEOAutocadPollActions.reset()"
                    style="background:#dc2626;color:#fff;border:none;border-radius:9px;padding:7px 10px;font-size:11px;font-weight:800;cursor:pointer;font-family:inherit;">
                    تصفير (أدمن)
                  </button>`
                : ""
            }
            <button type="button" class="gd-poll-close-btn" onclick="window.GEOAutocadPollActions.close()">
              متابعة للمنصة
            </button>
          </div>
        </div>
      </div>
    `;
  }

  window.GEOAutocadPollActions = {
    vote: voteOrSwitch,
    openModal: openPollModal,
    close: closePollModal,
    reset: resetPollAdmin
  };

  function watchAuth() {
    const check = () => {
      if (window.firebase && firebase.apps && firebase.apps.length) {
        firebase.auth().onAuthStateChanged(user => {
          currentUser = user || null;
          isAdminUser = !!(user && user.email && user.email.toLowerCase() === ADMIN_EMAIL);

          if (!currentUser) {
            // إخفاء النافذة والشريط تماماً قبل تسجيل الدخول
            const overlay = document.getElementById("gdAutocadPollOverlay");
            if (overlay) overlay.style.display = "none";
            const bar = document.getElementById("gdAutocadTopPollBar");
            if (bar) bar.remove();
            return;
          }

          userChoice = localStorage.getItem(`gd_poll_choice_${currentUser.uid}`) || "";
          renderTopResultsBar();
          subscribeCloudPoll();
        });
        return true;
      }
      return false;
    };

    if (!check()) {
      const iv = setInterval(() => {
        if (check()) clearInterval(iv);
      }, 400);
      setTimeout(() => clearInterval(iv), 12000);
    }
  }

  function init() {
    injectStyles();
    watchAuth();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
