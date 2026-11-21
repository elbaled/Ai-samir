/* ============================================================================
   GeoDev Official Certificate Verification System (V1)
   - فتح نافذة التحقق تلقائياً عند مسح QR Code الشهادة (?verify=GD-...)
   - إتاحة البحث اليدوي بالرقم التسلسلي داخل قسم الأكاديمية بدون اشتراط تسجيل الدخول
   ============================================================================ */
(function () {
  "use strict";
  if (window.GEOCertVerifyInit) return;
  window.GEOCertVerifyInit = true;

  function escapeHTML(val) {
    return String(val ?? "").replace(/[&<>"']/g, ch => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[ch]);
  }

  function getDb() {
    try {
      if (window.firebase && typeof firebase.firestore === "function") {
        return firebase.firestore();
      }
    } catch (_) {}
    return null;
  }

  function waitForFirestore(maxMs = 10000) {
    return new Promise(resolve => {
      const start = Date.now();
      const timer = setInterval(() => {
        const db = getDb();
        if (db && window.firebase && firebase.apps && firebase.apps.length) {
          clearInterval(timer);
          resolve(db);
        } else if (Date.now() - start >= maxMs) {
          clearInterval(timer);
          resolve(null);
        }
      }, 250);
    });
  }

  async function fetchCertificateBySerial(rawSerial) {
    const serial = String(rawSerial || "").trim().toUpperCase();
    if (!serial) throw new Error("يرجى إدخال الرقم التسلسلي للشهادة أولاً.");

    const db = await waitForFirestore(8000);
    if (!db) throw new Error("تعذر الاتصال بقاعدة بيانات التحقق حالياً.");

    const snap = await db.collection("geodev_certificates").doc(serial).get();
    if (!snap.exists) {
      return null;
    }
    return { id: snap.id, ...snap.data() };
  }

  function showVerificationResultModal(serial, certData, errorMessage = "") {
    const existing = document.getElementById("gdCertVerifyModal");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.id = "gdCertVerifyModal";
    overlay.style.cssText = `
      position: fixed; inset: 0; z-index: 999999;
      background: rgba(9, 13, 22, 0.88); backdrop-filter: blur(6px);
      display: flex; align-items: center; justify-content: center;
      padding: 16px; direction: rtl; font-family: inherit;
    `;

    let bodyHTML = "";
    if (errorMessage) {
      bodyHTML = `
        <div style="text-align:center;padding:12px 0;">
          <div style="width:56px;height:56px;border-radius:50%;background:rgba(220,38,38,0.18);border:2px solid #ef4444;color:#f87171;display:grid;place-items:center;margin:0 auto 12px;font-size:26px;font-weight:900;">!</div>
          <h3 style="margin:0 0 8px;color:#f87171;font-size:18px;">تعذر التحقق</h3>
          <p style="margin:0;color:#cbd5e1;font-size:13.5px;line-height:1.7;">${escapeHTML(errorMessage)}</p>
        </div>
      `;
    } else if (!certData) {
      bodyHTML = `
        <div style="text-align:center;padding:12px 0;">
          <div style="width:58px;height:58px;border-radius:50%;background:rgba(220,38,38,0.2);border:2px solid #ef4444;color:#f87171;display:grid;place-items:center;margin:0 auto 12px;font-size:26px;font-weight:900;">✕</div>
          <h3 style="margin:0 0 8px;color:#f87171;font-size:18px;">شهادة غير مسجلة في النظام</h3>
          <p style="margin:0 0 10px;color:#cbd5e1;font-size:13px;line-height:1.75;">
            الرقم التسلسلي <code style="color:#fbbf24;direction:ltr;display:inline-block;">${escapeHTML(serial)}</code> غير مطابق لأي شهادة صادرة من منصة <b>GeoDev</b>.
          </p>
          <div style="font-size:12px;color:#94a3b8;">تأكد من كتابة الرقم كاملاً كما هو موضح أعلى الشهادة.</div>
        </div>
      `;
    } else {
      bodyHTML = `
        <div style="text-align:center;margin-bottom:14px;">
          <div style="width:62px;height:62px;border-radius:50%;background:rgba(22,163,74,0.2);border:2px solid #22c55e;color:#4ade80;display:grid;place-items:center;margin:0 auto 10px;font-size:28px;font-weight:900;">✓</div>
          <div style="display:inline-block;background:rgba(22,163,74,0.18);color:#4ade80;border:1px solid rgba(34,197,94,0.45);padding:4px 12px;border-radius:99px;font-size:12px;font-weight:900;margin-bottom:6px;">
            شهادة رسمية معتمدة وصحيحة 100%
          </div>
          <h3 style="margin:4px 0 0;color:#fbbf24;font-size:18px;font-weight:900;">وثيقة التحقق الرقمي — منصة جيوديف (GeoDev)</h3>
        </div>

        <div style="background:#1e293b;border:1px solid #334155;border-radius:14px;padding:14px;display:flex;flex-direction:column;gap:9px;font-size:13px;">
          <div style="display:flex;justify-content:space-between;gap:10px;border-bottom:1px solid #334155;padding-bottom:7px;">
            <span style="color:#94a3b8;">الرقم التسلسلي:</span>
            <strong style="color:#38bdf8;direction:ltr;">${escapeHTML(certData.serialNumber || serial)}</strong>
          </div>
          <div style="display:flex;justify-content:space-between;gap:10px;border-bottom:1px solid #334155;padding-bottom:7px;">
            <span style="color:#94a3b8;">اسم الطالب (عربي):</span>
            <strong style="color:#f8fafc;">${escapeHTML(certData.studentNameAr || "")}</strong>
          </div>
          <div style="display:flex;justify-content:space-between;gap:10px;border-bottom:1px solid #334155;padding-bottom:7px;">
            <span style="color:#94a3b8;">الاسم (إنجليزي):</span>
            <strong style="color:#fbbf24;direction:ltr;">${escapeHTML(certData.studentNameEn || "")}</strong>
          </div>
          <div style="display:flex;justify-content:space-between;gap:10px;border-bottom:1px solid #334155;padding-bottom:7px;">
            <span style="color:#94a3b8;">البرنامج التدريبي:</span>
            <strong style="color:#f8fafc;">${escapeHTML(certData.trackTitle || certData.trackId || "")}</strong>
          </div>
          <div style="display:flex;justify-content:space-between;gap:10px;border-bottom:1px solid #334155;padding-bottom:7px;">
            <span style="color:#94a3b8;">تاريخ الإصدار:</span>
            <strong style="color:#e2e8f0;">${escapeHTML(certData.issueDateAr || certData.issueDateEn || "")}</strong>
          </div>
          <div style="display:flex;justify-content:space-between;gap:10px;">
            <span style="color:#94a3b8;">جهة الاعتماد:</span>
            <strong style="color:#4ade80;">أكاديمية ومنصة GeoDev — م. أحمد سمير</strong>
          </div>
        </div>
      `;
    }

    overlay.innerHTML = `
      <div style="width:100%;max-width:470px;background:#0f172a;border:2px solid ${certData ? "#22c55e" : "#e09f24"};border-radius:18px;padding:20px;color:#f8fafc;box-shadow:0 24px 60px rgba(0,0,0,0.7);">
        ${bodyHTML}
        <button type="button" id="gdCloseVerifyModalBtn"
          style="width:100%;margin-top:16px;padding:11px;border-radius:11px;border:0;background:#e09f24;color:#090d16;font-weight:900;font-size:14px;cursor:pointer;font-family:inherit;">
          إغلاق نافذة التحقق
        </button>
      </div>
    `;

    document.body.appendChild(overlay);
    const close = () => {
      overlay.remove();
      try {
        const cleanUrl = new URL(window.location.href);
        if (cleanUrl.searchParams.has("verify")) {
          cleanUrl.searchParams.delete("verify");
          window.history.replaceState({}, document.title, cleanUrl.toString());
        }
      } catch (_) {}
    };
    document.getElementById("gdCloseVerifyModalBtn").onclick = close;
    overlay.addEventListener("click", e => {
      if (e.target === overlay) close();
    });
  }

  async function runVerificationFlow(serial) {
    try {
      const cert = await fetchCertificateBySerial(serial);
      showVerificationResultModal(serial, cert, "");
    } catch (err) {
      showVerificationResultModal(serial, null, err.message || "حدث خطأ أثناء فحص الشهادة.");
    }
  }

  // 1. التحقق التلقائي عند فتح الرابط من الـ QR Code (?verify=GD-...)
  function checkUrlForVerifyParam() {
    try {
      const params = new URLSearchParams(window.location.search);
      const verifySerial = params.get("verify");
      if (verifySerial && verifySerial.trim()) {
        runVerificationFlow(verifySerial.trim());
      }
    } catch (_) {}
  }

  // 2. حقن صندوق التحقق اليدوي بالرقم التسلسلي داخل قسم الأكاديمية
  function injectManualVerifyBox() {
    const academySec = document.getElementById("s-academy");
    const statusBox = document.getElementById("academyStatus");
    if (!academySec || !statusBox || document.getElementById("gdPublicVerifyBox")) return;

    const box = document.createElement("div");
    box.id = "gdPublicVerifyBox";
    box.style.cssText = `
      background: linear-gradient(145deg, #0f172a, #182334);
      border: 1.5px solid #38bdf8;
      border-radius: 16px;
      padding: 14px 16px;
      margin-bottom: 16px;
      direction: rtl;
      color: #f8fafc;
    `;
    box.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px;margin-bottom:6px;">
        <strong style="font-size:14.5px;color:#38bdf8;">التحقق من صحة الشهادات الصادرة من منصة GeoDev</strong>
        <span style="font-size:11px;background:rgba(56,189,248,0.15);color:#38bdf8;padding:3px 9px;border-radius:8px;font-weight:800;">Certificate Verification</span>
      </div>
      <p style="margin:0 0 10px;font-size:12px;color:#cbd5e1;line-height:1.65;">
        أدخل الرقم التسلسلي المطبوع أعلى الشهادة (أو امسح رمز QR الموجود عليها) للتأكد من اعتمادها الرسمي:
      </p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <input type="text" id="gdManualCertSerialInput" placeholder="GD-AUTO-XXXXX-2026"
          style="flex:1;min-width:200px;padding:10px 12px;border-radius:10px;border:1.5px solid #334155;background:#090d16;color:#fbbf24;font-weight:900;text-align:center;direction:ltr;text-transform:uppercase;font-family:monospace;">
        <button type="button" id="gdManualCertVerifyBtn"
          style="padding:10px 18px;border-radius:10px;border:0;background:#38bdf8;color:#090d16;font-weight:900;font-size:13px;cursor:pointer;font-family:inherit;">
          فحص واعتماد الشهادة
        </button>
      </div>
    `;

    statusBox.insertAdjacentElement("afterend", box);

    document.getElementById("gdManualCertVerifyBtn").addEventListener("click", async () => {
      const btn = document.getElementById("gdManualCertVerifyBtn");
      const input = document.getElementById("gdManualCertSerialInput");
      const val = input ? input.value.trim() : "";
      if (!val) {
        showVerificationResultModal("", null, "من فضلك اكتب الرقم التسلسلي للشهادة في الخانة أولاً.");
        return;
      }
      btn.disabled = true;
      btn.textContent = "جاري الفحص...";
      await runVerificationFlow(val);
      btn.disabled = false;
      btn.textContent = "فحص واعتماد الشهادة";
    });
  }

  function init() {
    checkUrlForVerifyParam();
    injectManualVerifyBox();

    const obs = new MutationObserver(() => {
      injectManualVerifyBox();
    });
    if (document.body) {
      obs.observe(document.body, { childList: true, subtree: true });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
