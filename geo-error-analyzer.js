/**
 * أداة محلل أخطاء البرامج المساحية و GIS (تصميم مخصص + اعتراض تلقائي للـ prompt القديم)
 * GeoDev Studio Pro
 */

(function () {
  let selectedGeoErrorImageBase64 = null;
  let selectedGeoErrorMimeType = null;

  // 1. حقن التصميم والنافذة في الصفحة
  function initGeoErrorModalUI() {
    if (document.getElementById('geoErrorModal')) return;

    const modalHTML = `
      <style>
        .geo-modal-overlay {
          position: fixed;
          top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(30, 25, 22, 0.78);
          backdrop-filter: blur(5px);
          z-index: 99999;
          display: none;
          align-items: center;
          justify-content: center;
          padding: 15px;
          box-sizing: border-box;
        }
        .geo-modal-box {
          background: #e8e1d7;
          border: 2px solid #8c5a44;
          border-radius: 18px;
          width: 100%;
          max-width: 440px;
          box-shadow: 0 20px 45px rgba(0, 0, 0, 0.35);
          overflow: hidden;
          font-family: inherit;
          direction: rtl;
          animation: geoModalPop 0.25s ease-out;
        }
        @keyframes geoModalPop {
          from { transform: scale(0.92); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .geo-modal-header {
          background: linear-gradient(135deg, #8c5a44, #6e4432);
          color: #fff;
          padding: 14px 18px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .geo-modal-header h3 { margin: 0; font-size: 16px; font-weight: bold; }
        .geo-close-btn { background: none; border: none; color: #fff; font-size: 24px; cursor: pointer; line-height: 1; }
        .geo-modal-body { padding: 18px; color: #3d2c24; }
        .geo-modal-body label { display: block; font-weight: bold; margin-bottom: 8px; font-size: 14px; }
        .geo-modal-body textarea {
          width: 100%; padding: 12px; border-radius: 10px; border: 1.5px solid #bfa99a;
          background: #f7f4f0; color: #2b1e18; font-family: inherit; font-size: 14px;
          resize: vertical; box-sizing: border-box;
        }
        .geo-modal-body textarea:focus { outline: none; border-color: #8c5a44; }
        .geo-upload-section { margin-top: 15px; padding-top: 14px; border-top: 1px dashed #bfa99a; }
        .geo-upload-buttons { display: flex; gap: 10px; }
        .geo-btn-secondary {
          flex: 1; background: #dfd5c7; border: 1.5px solid #8c5a44; color: #5e3a2a;
          padding: 10px 8px; border-radius: 10px; text-align: center; cursor: pointer;
          font-size: 13px; font-weight: bold; user-select: none;
        }
        .geo-preview-box {
          display: none; margin-top: 12px; position: relative; border-radius: 10px;
          overflow: hidden; border: 1.5px solid #8c5a44; background: #1a1a1a;
        }
        .geo-preview-box img { max-height: 160px; width: 100%; object-fit: contain; display: block; }
        .geo-remove-img-btn {
          position: absolute; top: 8px; left: 8px; background: rgba(190, 35, 35, 0.92);
          color: #fff; border: none; border-radius: 6px; padding: 4px 10px; font-size: 12px; cursor: pointer;
        }
        .geo-modal-footer { padding: 12px 18px 18px; display: flex; gap: 10px; }
        .geo-btn-primary {
          flex: 2; background: #8c5a44; color: #fff; border: none; padding: 12px;
          border-radius: 10px; font-weight: bold; font-size: 14px; cursor: pointer;
        }
        .geo-btn-cancel {
          flex: 1; background: transparent; border: 1.5px solid #8c5a44; color: #8c5a44;
          padding: 12px; border-radius: 10px; font-weight: bold; font-size: 14px; cursor: pointer;
        }
      </style>

      <div id="geoErrorModal" class="geo-modal-overlay">
        <div class="geo-modal-box">
          <div class="geo-modal-header">
            <h3>🛠️ محلل أخطاء البرامج المساحية و GIS</h3>
            <button type="button" onclick="window.closeGeoErrorModal()" class="geo-close-btn">&times;</button>
          </div>
          <div class="geo-modal-body">
            <label for="geoErrorText">صف المشكلة أو اكتب كود الخطأ (مثل Error 999999):</label>
            <textarea id="geoErrorText" rows="3" placeholder="اكتب تفاصيل المشكلة في ArcGIS أو QGIS أو AutoCAD Civil 3D..."></textarea>
            <div class="geo-upload-section">
              <label>أو أرفق لقطة شاشة / صورة للخطأ من شاشة الكمبيوتر:</label>
              <div class="geo-upload-buttons">
                <label for="geoImageGallery" class="geo-btn-secondary">🖼️ اختيار صورة</label>
                <input type="file" id="geoImageGallery" accept="image/*" style="display: none;">
                <label for="geoImageCamera" class="geo-btn-secondary">📷 تصوير بالكاميرا</label>
                <input type="file" id="geoImageCamera" accept="image/*" capture="environment" style="display: none;">
              </div>
              <div id="geoImagePreviewContainer" class="geo-preview-box">
                <img id="geoImagePreview" src="" alt="معاينة الخطأ">
                <button type="button" onclick="window.removeGeoImage()" class="geo-remove-img-btn">حذف ✕</button>
              </div>
            </div>
          </div>
          <div class="geo-modal-footer">
            <button type="button" onclick="window.submitGeoErrorAnalysis()" class="geo-btn-primary">تحليل وحل المشكلة 🚀</button>
            <button type="button" onclick="window.closeGeoErrorModal()" class="geo-btn-cancel">إلغاء</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.getElementById('geoImageGallery').addEventListener('change', handleGeoImageSelect);
    document.getElementById('geoImageCamera').addEventListener('change', handleGeoImageSelect);
  }

  function handleGeoImageSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    selectedGeoErrorMimeType = file.type;
    const reader = new FileReader();
    reader.onload = function (e) {
      document.getElementById('geoImagePreview').src = e.target.result;
      document.getElementById('geoImagePreviewContainer').style.display = 'block';
      selectedGeoErrorImageBase64 = e.target.result.split(',')[1];
    };
    reader.readAsDataURL(file);
  }

  window.openGeoErrorModal = function () {
    initGeoErrorModalUI();
    document.getElementById('geoErrorText').value = '';
    window.removeGeoImage();
    document.getElementById('geoErrorModal').style.display = 'flex';
  };

  window.closeGeoErrorModal = function () {
    const modal = document.getElementById('geoErrorModal');
    if (modal) modal.style.display = 'none';
  };

  window.removeGeoImage = function () {
    selectedGeoErrorImageBase64 = null;
    selectedGeoErrorMimeType = null;
    const gal = document.getElementById('geoImageGallery');
    const cam = document.getElementById('geoImageCamera');
    const prev = document.getElementById('geoImagePreviewContainer');
    if (gal) gal.value = '';
    if (cam) cam.value = '';
    if (prev) prev.style.display = 'none';
  };

  window.submitGeoErrorAnalysis = function () {
    const errorText = document.getElementById('geoErrorText').value.trim();
    if (!errorText && !selectedGeoErrorImageBase64) {
      alert('يرجى كتابة وصف المشكلة أو تصوير/رفع صورة للخطأ أولاً.');
      return;
    }

    const imgData = selectedGeoErrorImageBase64;
    const imgMime = selectedGeoErrorMimeType;
    window.closeGeoErrorModal();

    const promptMessage = `بصفتك خبير نظم معلومات جغرافية (GIS) ومساحة، قم بتحليل المشكلة أو رسالة الخطأ التالية في برامج (ArcGIS Pro / ArcMap / QGIS / AutoCAD Civil 3D) وقدم السبب الجذري وخطوات الحل العملية بالترتيب:\n\n${errorText || 'يرجى تحليل رسالة الخطأ الظاهرة في الصورة المرفقة وحلها بدقة.'}`;

    if (typeof window.onGeoErrorSubmit === 'function') {
      window.onGeoErrorSubmit(promptMessage, imgData, imgMime);
    } else {
      alert('تم تجهيز التحليل، يرجى ربط دالة الإرسال window.onGeoErrorSubmit');
    }
  };

  // 2. السحر هنا: اعتراض دالة prompt القديمة تلقائياً بدون لمس الكود القديم!
  const originalPrompt = window.prompt;
  window.prompt = function (message, defaultValue) {
    if (message && (message.includes('صف المشكلة') || message.includes('رسالة الخطأ') || message.includes('ArcGIS'))) {
      window.openGeoErrorModal();
      return null; // إلغاء المربع الأسود القديم فوراً
    }
    return originalPrompt.apply(this, arguments);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGeoErrorModalUI);
  } else {
    initGeoErrorModalUI();
  }
})();
