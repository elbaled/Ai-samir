/**
 * نظام النوافذ المنبثقة الموحد وتحليل الصور لجميع أدوات الجيوماتكس
 * GeoDev Studio Pro
 */
(function () {
  let selectedGeoImageBase64 = null;
  let selectedGeoMimeType = null;
  let selectedGeoFile = null;
  let currentToolPromptPrefix = "";

  // 1. حقن التصميم والنافذة الموحدة في الصفحة
  function initGeoModalUI() {
    if (document.getElementById('geoUniversalModal')) return;

    const modalHTML = `
      <style>
        .geo-modal-overlay {
          position: fixed;
          top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(30, 25, 22, 0.78);
          backdrop-filter: blur(5px);
          z-index: 999999;
          display: none;
          align-items: center;
          justify-content: center;
          padding: 15px;
          box-sizing: border-box;
        }
        .geo-modal-box {
          background: #ebe4db;
          border: 2px solid #8c5a44;
          border-radius: 20px;
          width: 100%;
          max-width: 440px;
          box-shadow: 0 20px 45px rgba(0, 0, 0, 0.35);
          overflow: hidden;
          font-family: inherit;
          direction: rtl;
          animation: geoModalPop 0.22s ease-out;
        }
        @keyframes geoModalPop {
          from { transform: scale(0.92); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .geo-modal-header {
          background: #8c5a44;
          color: #fff;
          padding: 15px 18px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .geo-modal-header h3 { margin: 0; font-size: 16px; font-weight: bold; display: flex; align-items: center; gap: 8px; }
        .geo-close-btn { background: none; border: none; color: #fff; font-size: 24px; cursor: pointer; line-height: 1; padding: 0 5px; }
        .geo-modal-body { padding: 18px; color: #3d2c24; }
        .geo-modal-body label { display: block; font-weight: bold; margin-bottom: 10px; font-size: 14px; line-height: 1.5; }
        .geo-modal-body textarea {
          width: 100%; padding: 12px; border-radius: 12px; border: 1.5px solid #8c5a44;
          background: #f9f6f2; color: #2b1e18; font-family: inherit; font-size: 14px;
          resize: vertical; box-sizing: border-box;
        }
        .geo-modal-body textarea:focus { outline: none; box-shadow: 0 0 0 3px rgba(140, 90, 68, 0.2); }
        .geo-upload-section { margin-top: 15px; padding-top: 14px; border-top: 1px dashed #bfa99a; }
        .geo-upload-buttons { display: flex; gap: 10px; }
        .geo-btn-secondary {
          flex: 1; background: #e3d9cc; border: 1.5px solid #8c5a44; color: #5e3a2a;
          padding: 10px 8px; border-radius: 12px; text-align: center; cursor: pointer;
          font-size: 13px; font-weight: bold; user-select: none;
        }
        .geo-preview-box {
          display: none; margin-top: 12px; position: relative; border-radius: 12px;
          overflow: hidden; border: 1.5px solid #8c5a44; background: #1a1a1a;
        }
        .geo-preview-box img { max-height: 160px; width: 100%; object-fit: contain; display: block; }
        .geo-remove-img-btn {
          position: absolute; top: 8px; left: 8px; background: rgba(190, 35, 35, 0.92);
          color: #fff; border: none; border-radius: 6px; padding: 4px 10px; font-size: 12px; cursor: pointer;
        }
        .geo-modal-footer { padding: 10px 18px 18px; display: flex; gap: 10px; }
        .geo-btn-primary {
          flex: 2; background: #8c5a44; color: #fff; border: none; padding: 12px;
          border-radius: 12px; font-weight: bold; font-size: 14px; cursor: pointer;
        }
        .geo-btn-cancel {
          flex: 1; background: transparent; border: 1.5px solid #8c5a44; color: #8c5a44;
          padding: 12px; border-radius: 12px; font-weight: bold; font-size: 14px; cursor: pointer;
        }
      </style>

      <div id="geoUniversalModal" class="geo-modal-overlay">
        <div class="geo-modal-box">
          <div class="geo-modal-header">
            <h3 id="geoModalTitle"> أداة التحليل الذكي</h3>
            <button type="button" onclick="window.closeGeoModal()" class="geo-close-btn">&times;</button>
          </div>
          <div class="geo-modal-body">
            <label id="geoModalLabel" for="geoModalInput">أدخل التفاصيل المطلوبة:</label>
            <textarea id="geoModalInput" rows="3" placeholder="اكتب هنا..."></textarea>
            
            <div id="geoUploadSection" class="geo-upload-section">
              <label>إرفاق صورة أو لقطة شاشة للتحليل (اختياري):</label>
              <div class="geo-upload-buttons">
                <label for="geoImageGallery" class="geo-btn-secondary">اختيار صورة</label>
                <input type="file" id="geoImageGallery" accept="image/*" style="display: none;">
                <label for="geoImageCamera" class="geo-btn-secondary"> تصوير بالكاميرا</label>
                <input type="file" id="geoImageCamera" accept="image/*" capture="environment" style="display: none;">
              </div>
              <div id="geoImagePreviewContainer" class="geo-preview-box">
                <img id="geoImagePreview" src="" alt="معاينة الصورة">
                <button type="button" onclick="window.removeGeoImage()" class="geo-remove-img-btn">حذف ✕</button>
              </div>
            </div>
          </div>
          <div class="geo-modal-footer">
            <button type="button" id="geoSubmitBtn" onclick="window.submitGeoUniversalModal()" class="geo-btn-primary">تنفيذ التحليل </button>
            <button type="button" onclick="window.closeGeoModal()" class="geo-btn-cancel">إلغاء</button>
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
    selectedGeoFile = file;
    selectedGeoMimeType = file.type;
    const reader = new FileReader();
    reader.onload = function (e) {
      document.getElementById('geoImagePreview').src = e.target.result;
      document.getElementById('geoImagePreviewContainer').style.display = 'block';
      selectedGeoImageBase64 = e.target.result.split(',')[1];
    };
    reader.readAsDataURL(file);
  }

  window.closeGeoModal = function () {
    const modal = document.getElementById('geoUniversalModal');
    if (modal) modal.style.display = 'none';
  };

  window.removeGeoImage = function () {
    selectedGeoFile = null;
    selectedGeoImageBase64 = null;
    selectedGeoMimeType = null;
    const gal = document.getElementById('geoImageGallery');
    const cam = document.getElementById('geoImageCamera');
    const prev = document.getElementById('geoImagePreviewContainer');
    if (gal) gal.value = '';
    if (cam) cam.value = '';
    if (prev) prev.style.display = 'none';
  };

  // 2. تخصيص عنوان النافذة ونوع البرومبت حسب الكارت اللي المستخدم ضغط عليه
  window.openGeoCustomPrompt = function (originalMessage) {
    initGeoModalUI();
    document.getElementById('geoModalInput').value = '';
    window.removeGeoImage();

    const titleEl = document.getElementById('geoModalTitle');
    const labelEl = document.getElementById('geoModalLabel');
    const inputEl = document.getElementById('geoModalInput');
    const submitBtn = document.getElementById('geoSubmitBtn');

    labelEl.textContent = originalMessage;

    if (originalMessage.includes('رسالة الخطأ') || originalMessage.includes('ArcGIS')) {
      titleEl.innerHTML = ' محلل أخطاء البرامج المساحية و GIS';
      inputEl.placeholder = 'اكتب تفاصيل الخطأ في ArcGIS أو QGIS أو Civil 3D...';
      submitBtn.textContent = 'تحليل وحل المشكلة ';
      currentToolPromptPrefix = 'بصفتك خبير نظم معلومات جغرافية (GIS) ومساحة، قم بتحليل المشكلة أو رسالة الخطأ التالية وقدم السبب الجذري وخطوات الحل العملية بالترتيب:\n\n';
    } else if (originalMessage.includes('الظاهرة') || originalMessage.includes('الاستشعار')) {
      titleEl.innerHTML = ' مستشار اختيار المرئيات والمؤشرات';
      inputEl.placeholder = 'مثال: رصد الزحف العمراني، دراسة الملوحة، أو الجزر الحرارية...';
      submitBtn.textContent = 'توليد التوصية العلمية ';
      currentToolPromptPrefix = 'بصفتك خبير استشعار عن بعد (Remote Sensing)، حدد أنسب قمر صناعي، الدقة المكانية والطيفية، والمؤشر الطيفي بمعادلته الرياضية لدراسة الظاهرة التالية:\n\n';
    } else if (originalMessage.includes('خطة بحث') || originalMessage.includes('موضوع البحث') || originalMessage.includes('عنوان')) {
      titleEl.innerHTML = ' بناء خطة بحث علمي (Proposal)';
      inputEl.placeholder = 'اكتب عنوان أو فكرة البحث الجغرافي / المساحي...';
      submitBtn.textContent = 'بناء خطة البحث ';
      currentToolPromptPrefix = 'بصفتك مستشاراً أكاديمياً في الجغرافيا والجيوماتكس، قم ببناء خطة بحث علمي متكاملة (مشكلة البحث، الأهداف، الفرضيات، المنهجية، والبيانات المكانية المطلوبة) حول الموضوع التالي:\n\n';
    } else if (originalMessage.includes('سير العمل') || originalMessage.includes('التحليل المكاني')) {
      titleEl.innerHTML = ' مصمم خريطة سير العمل (GIS Workflow)';
      inputEl.placeholder = 'اكتب هدف التحليل المكاني المطلوب تنفيذه...';
      submitBtn.textContent = 'تصميم خطوات العمل ;
      currentToolPromptPrefix = 'بصفتك محلل نظم معلومات جغرافية محترف، ابنِ خطوات التحليل المكاني بالترتيب بأسماء الأدوات الفعلية داخل ArcGIS Pro و QGIS لتحقيق الهدف التالي:\n\n';
    } else {
      titleEl.innerHTML = '🌐 مساعد الجيوماتكس المتخصص';
      inputEl.placeholder = 'اكتب تفاصيل طلبك هنا...';
      submitBtn.textContent = 'إرسال للتحليل ';
      currentToolPromptPrefix = 'بصفتك خبير في الجيوماتكس والمساحة ونظم المعلومات الجغرافية، أجب بدقة ومنهجية عن الطلب التالي:\n\n';
    }

    document.getElementById('geoUniversalModal').style.display = 'flex';
  };

  // 3. إرسال البيانات إلى الشات الرئيسي بشكل مؤكد
  window.submitGeoUniversalModal = function () {
    const userText = document.getElementById('geoModalInput').value.trim();
    if (!userText && !selectedGeoImageBase64) {
      alert('يرجى كتابة المطلوب أو إرفاق صورة أولاً.');
      return;
    }

    const fileObj = selectedGeoFile;
    const imgData = selectedGeoImageBase64;
    const imgMime = selectedGeoMimeType;
    window.closeGeoModal();

    const finalPrompt = currentToolPromptPrefix + (userText || 'يرجى تحليل الصورة المرفقة وتقديم الحل والشرح الكامل.');

    // أ) ربط الصورة بمدخل الصور الأساسي في الموقع (إن وجدت)
    if (fileObj) {
      const allFileInputs = Array.from(document.querySelectorAll('input[type="file"]'))
        .filter(inp => inp.id !== 'geoImageGallery' && inp.id !== 'geoImageCamera');
      
      if (allFileInputs.length > 0) {
        const dt = new DataTransfer();
        dt.items.add(fileObj);
        allFileInputs[0].files = dt.files;
        allFileInputs[0].dispatchEvent(new Event('change', { bubbles: true }));
      }
      window.currentImageBase64 = imgData;
      window.currentImageMime = imgMime;
    }

    // ب) الانتقال لتبويب "المساعد" (أول زر في الشريط السفلي على اليمين)
    const navItems = Array.from(document.querySelectorAll('button, div, a, li'));
    const assistantTab = navItems.find(el => el.textContent && el.textContent.trim() === 'المساعد');
    if (assistantTab) {
      assistantTab.click();
    }

    // ج) البحث عن مربع كتابة الشات الظاهر ووضع النص فيه وإرساله
    setTimeout(() => {
      const textboxes = Array.from(document.querySelectorAll('textarea, input[type="text"]'))
        .filter(el => el.id !== 'geoModalInput' && el.offsetParent !== null);

      if (textboxes.length > 0) {
        const chatBox = textboxes[textboxes.length - 1]; // غالباً مربع الشات في الأسفل
        chatBox.value = finalPrompt;
        chatBox.dispatchEvent(new Event('input', { bubbles: true }));
        chatBox.dispatchEvent(new Event('change', { bubbles: true }));

        // البحث عن زر الإرسال المجاور لمربع الشات أو ضغط Enter
        const parentContainer = chatBox.closest('div, form') || document.body;
        const buttons = Array.from(parentContainer.querySelectorAll('button'))
          .filter(btn => btn.offsetParent !== null && !btn.id.startsWith('geo'));

        if (buttons.length > 0) {
          // الضغط على آخر زر في شريط الإدخال (زر الإرسال)
          buttons[buttons.length - 1].click();
        } else {
          chatBox.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
        }
      } else if (typeof window.sendMessage === 'function') {
        window.sendMessage(finalPrompt);
      }
    }, 350);
  };

  // 4. اعتراض جميع نوافذ prompt في الموقع وتوحيدها بالتصميم الجديد
  const originalPrompt = window.prompt;
  window.prompt = function (message, defaultValue) {
    if (message && typeof message === 'string') {
      window.openGeoCustomPrompt(message);
      return null;
    }
    return originalPrompt.apply(this, arguments);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGeoModalUI);
  } else {
    initGeoModalUI();
  }
})();
