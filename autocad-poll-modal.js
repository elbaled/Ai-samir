/* ============================================================================
   استطلاع الرأي العام لجميع المستخدمين عند فتح المنصة:
   "عاوزين نبدأ إيه في الأوتوكاد؟"
   - الخيار 1: أساسيات الأوتوكاد المساحي (يبدأ من 30% ويتزايد بعد ذلك)
   - الخيار 2: بداية كورس ربط الـ AI بالأوتوكاد (يبدأ من 0% ويتزايد بعد ذلك)
   ============================================================================ */
(function () {
  "use strict";
  if (window.GEOAutocadPollInit) return;
  window.GEOAutocadPollInit = true;

  const ADMIN_EMAIL = "eng.ahmedsamir.gis@gmail.com";
  const POLL_DOC_ID = "autocad_start_poll_v1";
  const LOCAL_VOTE_KEY = "gd_autocad_poll_choice_v1";
  const LOCAL_COUNTS_KEY = "gd_autocad_poll_counts_v1";

  // القيم الابتدائية: 30% للخيار الأول و 0% للخيار الثاني
  let pollState = JSON.parse(localStorage.getItem(LOCAL_COUNTS_KEY) || "null") || {
    basicsVotes: 0, // تُضاف فوق قاعدة الـ 30%
    aiVotes: 0      // تبدأ من 0% وتزيد مع كل صوت
  };

  let userChoice = localStorage.getItem(LOCAL_VOTE_KEY) || ""; // 'basics' | 'ai' | ''
  let isAdminUser = false;

  // حساب النسب المئوية بحيث يبدأ الخيار الأول من 30% والثاني من 0% ثم يتحركان بدقة مع الأصوات
  function calculatePercentages() {
    const bVotes = Number(pollState.basicsVotes || 0);
    const aVotes = Number(pollState.aiVotes || 0);
    const totalNewVotes = bVotes + aVotes;

    if (totalNewVotes === 0) {
      return { basicsPct: 30, aiPct: 0, totalVotes: 0 };
    }

    // توزيع الـ 70% المتبقية + الأصوات الجديدة بحيث يبدأ الأول من 30% والثاني من 0%
    // كل صوت جديد للأساسيات يرفعها فوق 30%، وكل صوت للـ AI يرفعه من 0%
    const effectiveBasics = 30 + bVotes;
    const effectiveAi = 0 + aVotes;
    const effectiveTotal = effectiveBasics + effectiveAi;

    const basicsPct = Math.round((effectiveBasics / effectiveTotal) * 100);
    const aiPct = 100 - basicsPct;

    return { basicsPct, aiPct, totalVotes: totalNewVotes };
  }

  function injectStyles() {
    if (document.getElementById("gdAutocadPollStyles")) return;
    const style = document.createElement("style");
    style.id = "gdAutocadPollStyles";
    style.textContent = `
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
        animation: gdPollFadeIn 0.25s ease;
      }
      @keyframes gdPollFadeIn {
        from { opacity: 0; transform: scale(0.96); }
        to { opacity: 1; transform: scale(1); }
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
        position: relative;
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
        line-height: 1.4;
      }
      .gd-poll-sub {
        margin: 0 0 16px;
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
      .gd-poll-option:hover:not(.voted-locked) {
        border-color: #e09f24;
        background: #fffbeb;
      }
      .gd-poll-option.selected {
        border-color: #16a34a;
        background: #f0fdf4;
      }
      .gd-poll-option.voted-locked {
        cursor: default;
      }
      .gd-poll-bar-fill {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        background: rgba(224, 159, 36, 0.22);
        z-index: 0;
        transition: width 0.45s ease;
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

      /* التوافق مع الوضع الداكن */
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
      body.dark-mode .gd-poll-sub,
      [data-theme="dark"] .gd-poll-sub {
        color: #cbd5e1;
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

  function syncPollFromCloud() {
    const db = getFirestoreDb();
    if (!db) return;

    try {
      db.collection("geodev_polls")
        .doc(POLL_DOC_ID)
        .onSnapshot(
          doc => {
            if (doc.exists) {
              const data = doc.data() || {};
              pollState.basicsVotes = Number(data.basicsVotes || 0);
              pollState.aiVotes = Number(data.aiVotes || 0);
              localStorage.setItem(LOCAL_COUNTS_KEY, JSON.stringify(pollState));
              renderPollModal();
            }
          },
          () => {}
        );
    } catch (_) {}
  }

  async function submitVote(choice) {
    // منع التصويت أكثر من مرة لنفس المستخدم
    if (userChoice) return;

    userChoice = choice;
    localStorage.setItem(LOCAL_VOTE_KEY, choice);

    if (choice === "basics") {
      pollState.basicsVotes = Number(pollState.basicsVotes || 0) + 1;
    } else if (choice === "ai") {
      pollState.aiVotes = Number(pollState.aiVotes || 0) + 1;
    }
    localStorage.setItem(LOCAL_COUNTS_KEY, JSON.stringify(pollState));
    renderPollModal();

    // تحديث العداد في Firestore لجميع المستخدمين
    const db = getFirestoreDb();
    if (db && firebase.firestore && firebase.firestore.FieldValue) {
      try {
        const inc = firebase.firestore.FieldValue.increment(1);
        await db
          .collection("geodev_polls")
          .doc(POLL_DOC_ID)
          .set(
            choice === "basics"
              ? { basicsVotes: inc, updatedAt: Date.now() }
              : { aiVotes: inc, updatedAt: Date.now() },
            { merge: true }
          );
      } catch (_) {}
    }
  }

  async function resetPollAdmin() {
    if (!isAdminUser || !confirm("هل تريد تصفير أصوات الاستطلاع وإعادتها لنقطة البداية (30% / 0%)؟")) return;
    pollState = { basicsVotes: 0, aiVotes: 0 };
    userChoice = "";
    localStorage.removeItem(LOCAL_VOTE_KEY);
    localStorage.setItem(LOCAL_COUNTS_KEY, JSON.stringify(pollState));
    renderPollModal();

    const db = getFirestoreDb();
    if (db) {
      try {
        await db.collection("geodev_polls").doc(POLL_DOC_ID).set({
          basicsVotes: 0,
          aiVotes: 0,
          updatedAt: Date.now()
        });
      } catch (_) {}
    }
  }

  function closePollModal() {
    const overlay = document.getElementById("gdAutocadPollOverlay");
    if (overlay) overlay.style.display = "none";
    sessionStorage.setItem("gd_autocad_poll_dismissed_session", "1");
  }

  function renderPollModal() {
    let overlay = document.getElementById("gdAutocadPollOverlay");
    if (!overlay) {
      // إذا سبق للمستخدم التصويت وأغلق الرسالة في هذه الجلسة لا نزعجه
      if (userChoice && sessionStorage.getItem("gd_autocad_poll_dismissed_session") === "1") return;
      overlay = document.createElement("div");
      overlay.id = "gdAutocadPollOverlay";
      document.body.appendChild(overlay);
    }

    const { basicsPct, aiPct } = calculatePercentages();
    const hasVoted = Boolean(userChoice);

    overlay.innerHTML = `
      <div class="gd-poll-card">
        <div class="gd-poll-badge">📢 استطلاع رأي عام للمهندسين والطلاب</div>
        <h3 class="gd-poll-title">عاوزين نبدأ إيه في الأوتوكاد؟</h3>
        <p class="gd-poll-sub">
          ${hasVoted ? "✔ شكراً لمشاركتك! تم تسجيل اختيارك بنجاح وهذه هي النتائج الحالية:" : "اختر مساراً واحداً فقط لنبدأ به الشروحات التطبيقية في المنصة:"}
        </p>

        <div class="gd-poll-option ${userChoice === "basics" ? "selected" : ""} ${hasVoted ? "voted-locked" : ""}"
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

        <div class="gd-poll-option ${userChoice === "ai" ? "selected" : ""} ${hasVoted ? "voted-locked" : ""}"
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
            ${hasVoted ? "اختيار واحد فقط لكل مستخدم" : "اضغط على اختيارك للتصويت"}
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
              ${hasVoted ? "متابعة للمنصة" : "تخطي"}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  window.GEOAutocadPollActions = {
    vote: submitVote,
    close: closePollModal,
    reset: resetPollAdmin
  };

  function watchAdmin() {
    const check = () => {
      if (window.firebase && firebase.apps && firebase.apps.length) {
        firebase.auth().onAuthStateChanged(user => {
          isAdminUser = !!(user && user.email && user.email.toLowerCase() === ADMIN_EMAIL);
          const overlay = document.getElementById("gdAutocadPollOverlay");
          if (overlay && overlay.style.display !== "none") renderPollModal();
        });
        return true;
      }
      return false;
    };
    if (!check()) {
      const iv = setInterval(() => {
        if (check()) clearInterval(iv);
      }, 400);
      setTimeout(() => clearInterval(iv), 10000);
    }
  }

  function init() {
    injectStyles();
    watchAdmin();
    syncPollFromCloud();
    // إظهار الرسالة العامة بعد ثانية واحدة من فتح المنصة
    setTimeout(renderPollModal, 1000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
