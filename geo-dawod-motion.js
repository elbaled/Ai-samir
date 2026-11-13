/* ============================================================================
   GeoDev Dawod Encyclopedia & Smooth Motion Patch v1.0 (geo-dawod-motion.js)
   1. نظام حركة قياسي وسلس (Standard 60fps Smooth UI Motion).
   2. دمج فهرس دورات وكتب ومجلدات أ.د. جمعة داود وكبار المحاضرين في الأكاديمية.
   3. حقن الكورسات والقنوات في الذاكرة المعرفية للمساعد الذكي تلقائياً.
   ============================================================================ */

(function () {
  "use strict";
  if (window.GEODawodMotion) return;
  window.GEODawodMotion = true;

  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));

  /* ==========================================================================
     1. نظام الأنيميشن والحركة القياسية السلسة (Standard Smooth Motion CSS)
     ========================================================================== */
  function injectSmoothMotionCSS() {
    if ($("geoSmoothMotionCSS")) return;
    const st = document.createElement("style");
    st.id = "geoSmoothMotionCSS";
    st.textContent = `
      :root {
        --ease-std: cubic-bezier(0.22, 1, 0.36, 1);
        --dur-fast: 160ms;
        --dur-med: 260ms;
      }

      /* تمرير ناعم في كامل المنصة */
      html, #chat, #gisChatBox, .academy-tabs, .tool-content {
        scroll-behavior: smooth;
      }

      /* انتقال سلس وبسيط عند التنقل بين الأقسام */
      .sec.on {
        animation: gdFadeSlide var(--dur-med) var(--ease-std) both !important;
      }

      @keyframes gdFadeSlide {
        from {
          opacity: 0;
          transform: translateY(6px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      /* استجابة ناعمة وقياسية للكروت والأزرار بدون قفزات مبالغ فيها */
      .card, .dash-card, .academy-card, .code-snippet-card, .gis-academic-btn {
        transition:
          transform var(--dur-fast) var(--ease-std),
          border-color var(--dur-fast) ease,
          box-shadow var(--dur-fast) ease !important;
        will-change: transform;
      }

      .card:hover, .dash-card:hover, .academy-card:hover, .code-snippet-card:hover {
        transform: translateY(-2px) !important;
      }

      .dash-card:hover .dash-icon {
        transform: scale(1.04) !important;
      }

      button, .academy-tab, .academy-btn, .chip {
        transition:
          transform 120ms var(--ease-std),
          background-color var(--dur-fast) ease,
          border-color var(--dur-fast) ease,
          opacity var(--dur-fast) ease !important;
      }

      button:active, .academy-tab:active, .academy-btn:active, .chip:active {
        transform: scale(0.97) !important;
      }

      /* حركة ناعمة للنوافذ المنبثقة (Modals) والقائمة الجانبية */
      .tool-modal.on .tool-content {
        animation: gdModalPop var(--dur-med) var(--ease-std) both !important;
      }

      @keyframes gdModalPop {
        from {
          opacity: 0;
          transform: translateY(10px) scale(0.985);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      #drw {
        transition: transform var(--dur-med) var(--ease-std) !important;
      }

      /* ظهور ناعم للرسائل الجديدة في الشات */
      .m, .teacher-message, .gc-m {
        animation: gdMsgIn 200ms var(--ease-std) both !important;
      }

      @keyframes gdMsgIn {
        from {
          opacity: 0;
          transform: translateY(4px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      /* احترام إعدادات تقليل الحركة في النظام */
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
          animation-duration: 1ms !important;
          transition-duration: 1ms !important;
          scroll-behavior: auto !important;
        }
      }
    `;
    document.head.appendChild(st);
  }

  /* ==========================================================================
     2. قاعدة بيانات دورات ومجلدات أ.د. جمعة داود والمحاضرين (من الملف المرفق)
     ========================================================================== */
  const DAWOD_COURSES = [
    {
      title: "دورة ArcGIS العملية — المستوى الأول (عمل الخرائط الرقمية)",
      instructor: "أ.د. جمعة محمد داود",
      cat: "GIS",
      level: "مبتدئ",
      url: "https://www.youtube.com/playlist?list=PL-2sBQtgS7Y4H8EYoSCvdahCr2VxYz-P_",
      dataUrl: "http://www.mediafire.com/file/0ahdm3s319d8drb/GIS_level_1_Maps.zip",
      dataLabel: "ملفات التدريب (Maps.zip)"
    },
    {
      title: "دورة ArcGIS العملية — المستوى الثاني (تحليل البيانات والتحليل المكاني)",
      instructor: "أ.د. جمعة محمد داود",
      cat: "GIS",
      level: "متوسط",
      url: "https://www.youtube.com/playlist?list=PL-2sBQtgS7Y5WiwUGE033X4v6BMuaYILX",
      dataUrl: "http://www.mediafire.com/file/c39jbcpjjscbbbu/Dawod_SA_Training.rar",
      dataLabel: "ملفات التدريب (Training.rar)"
    },
    {
      title: "دورة ArcGIS العملية — المستوى الثالث (3D، نماذج الارتفاعات، ModelBuilder)",
      instructor: "أ.د. جمعة محمد داود",
      cat: "GIS",
      level: "متقدم",
      url: "https://www.youtube.com/playlist?list=PL-2sBQtgS7Y7lkoo0P7Jlte9lvwuAE1D5"
    },
    {
      title: "دورة نظرية شاملة في علم نظم المعلومات الجغرافية (GIS)",
      instructor: "أ.د. جمعة محمد داود",
      cat: "GIS",
      level: "أكاديمي",
      url: "https://www.youtube.com/playlist?list=PL-2sBQtgS7Y4c_fxh5udTpuVXIGx9cDOe"
    },
    {
      title: "دورة التحليل المكاني في إطار نظم المعلومات الجغرافية",
      instructor: "أ.د. جمعة محمد داود",
      cat: "التحليل المكاني",
      level: "متقدم / باحثين",
      url: "https://www.youtube.com/playlist?list=PL-2sBQtgS7Y47BFrhBw9kKLQcEo_q2glu"
    },
    {
      title: "دورة قواعد البيانات ونظم المعلومات الجغرافية (Geodatabase)",
      instructor: "أ.د. جمعة محمد داود",
      cat: "GIS",
      level: "متوسط",
      url: "https://www.youtube.com/playlist?list=PL-2sBQtgS7Y7rnp3fNM2ndmyNEJxpyj-B"
    },
    {
      title: "دورة المساحة المستوية: الميزانيات وحساب الكميات",
      instructor: "أ.د. جمعة محمد داود",
      cat: "المساحة",
      level: "مبتدئ",
      url: "https://www.youtube.com/playlist?list=PL-2sBQtgS7Y7_YfxfJyz2YrpPrJz4hsuR"
    },
    {
      title: "دورة المساحة الطبوغرافية (الترافرس والثيودوليت والمحطة الشاملة)",
      instructor: "أ.د. جمعة محمد داود",
      cat: "المساحة",
      level: "متوسط",
      url: "https://www.youtube.com/playlist?list=PL-2sBQtgS7Y4dXbKvePD9C4dyG-aVtj6l"
    },
    {
      title: "دورة المساحة الجيوديسية التقليدية وإسقاط الخرائط",
      instructor: "أ.د. جمعة محمد داود",
      cat: "الجيوديسيا",
      level: "متقدم",
      url: "https://www.youtube.com/playlist?list=PL-2sBQtgS7Y4yuTf0_uLaWpo2VGmWAhn3"
    },
    {
      title: "دورة المساحة الجيوديسية المتقدمة (ITRF، الجيويد، والجاذبية الأرضية)",
      instructor: "أ.د. جمعة محمد داود",
      cat: "الجيوديسيا",
      level: "دراسات عليا",
      url: "https://www.youtube.com/playlist?list=PL-2sBQtgS7Y60fbLk-Xnefeq0IIJFj173"
    },
    {
      title: "دورة المساحة التصويرية والاستشعار عن بعد",
      instructor: "أ.د. جمعة محمد داود",
      cat: "الاستشعار عن بعد",
      level: "شامل",
      url: "https://www.youtube.com/playlist?list=PL-2sBQtgS7Y6zQ6ZwQQKh9uBhL_KbKAuv"
    },
    {
      title: "دورة النظام العالمي لتحديد المواقع (GPS / GNSS)",
      instructor: "أ.د. جمعة محمد داود",
      cat: "GPS & GNSS",
      level: "شامل",
      url: "https://www.youtube.com/playlist?list=PL-2sBQtgS7Y6RHFhDiMVJPAaPdKfClcoX"
    },
    {
      title: "دورة الأجهزة المساحية (الميزان، الثيودوليت، التوتال ستيشن، GPS)",
      instructor: "أ.د. جمعة محمد داود",
      cat: "المساحة",
      level: "تطبيقي",
      url: "https://www.youtube.com/playlist?list=PL-2sBQtgS7Y52otbj0lhTe8r6ekoDLHj7"
    },
    {
      title: "دورة المعلومات المكانية من قواعد البيانات العالمية المجانية",
      instructor: "أ.د. جمعة محمد داود",
      cat: "البيانات المكانية",
      level: "باحثين",
      url: "https://www.youtube.com/playlist?list=PL-2sBQtgS7Y5lI6gU2ypTZMCKEZbcIDic"
    },
    {
      title: "سلسلة حلول عملية في الجيوماتكس (PPP، الجيويد، DEM، والمخاطر)",
      instructor: "أ.د. جمعة محمد داود",
      cat: "الجيوماتكس",
      level: "تطبيقي",
      url: "https://www.youtube.com/playlist?list=PL-2sBQtgS7Y7sqVGce94t5EF6C8UcHNsl"
    },
    {
      title: "دورة تحليل وضبط الأرصاد المساحية (نظرية الأخطاء ومعادلات الضبط)",
      instructor: "أ.د. جمعة محمد داود",
      cat: "الجيوديسيا",
      level: "متقدم",
      url: "https://www.youtube.com/playlist?list=PL-2sBQtgS7Y6LTCSMQaetLPfrJJYyn3LX"
    },
    {
      title: "دورة المواصفات المساحية المصرية (الشبكات، التوتال، الميزانيات، الخرائط)",
      instructor: "أ.د. جمعة محمد داود",
      cat: "المساحة",
      level: "مهني",
      url: "https://www.youtube.com/playlist?list=PL-2sBQtgS7Y4FpthkZwOsW78nVDIb2BQH"
    },
    {
      title: "دورة المساحة البحرية والهيدروجرافية",
      instructor: "أ.د. جمعة محمد داود",
      cat: "المساحة البحرية",
      level: "متخصص",
      url: "https://www.youtube.com/playlist?list=PL-2sBQtgS7Y6jshxmUG7Nq-wrek_laxfc"
    },
    {
      title: "دورة احتراف برنامج AutoCAD Civil 3D (66 درس شامل)",
      instructor: "م. هشام فوزي",
      cat: "Civil 3D",
      level: "شامل",
      url: "https://www.youtube.com/playlist?list=PLC8000153DF1EC573"
    },
    {
      title: "دورة حساب كميات الحفر والردم بـ Civil 3D و Excel",
      instructor: "م. هشام فوزي",
      cat: "Civil 3D",
      level: "تطبيقي",
      url: "https://www.youtube.com/playlist?list=PLXrNKFa4BOOnlWQzI7gu92MZUXeddnZqw"
    },
    {
      title: "دورة برنامج Surfer لرسم الخرائط الكنتورية وحساب الكميات",
      instructor: "م. هشام فوزي",
      cat: "الخرائط الكنتورية",
      level: "تطبيقي",
      url: "https://www.youtube.com/playlist?list=PLi5-9SH2ORG1h5VKfAiukaOn7Y3ic0364"
    },
    {
      title: "الدورة الشاملة لتعلم ArcGIS (66 درس) + التحليل الهيدرولوجي",
      instructor: "م. حاتم طارق",
      cat: "GIS",
      level: "من الصفر للاحتراف",
      url: "https://www.youtube.com/playlist?list=PLi5-9SH2ORG2DOFG14EfZle0OLhtyHFu4"
    },
    {
      title: "دورة معالجة المرئيات الفضائية ببرنامج ERDAS Imagine",
      instructor: "أ.د. عبد الحميد النجار",
      cat: "الاستشعار عن بعد",
      level: "تطبيقي",
      url: "https://www.youtube.com/channel/UCB7qWtSNY8xYDYWWUv3KDIw"
    }
  ];

  const DAWOD_REPOSITORIES = [
    {
      title: "مجلد جميع كتب أ.د. جمعة داود المجانية (أكثر من 20 كتاب PDF)",
      desc: "يضم كتب: مبادئ GIS، التحليل المكاني، المساحة، الجيوديسيا، GPS، الأجهزة المساحية، الفيزياء في الجيوماتكس، ومعجم المصطلحات.",
      url: "https://www.mediafire.com/folder/ci4ujfp714bqg/Gomaa_Dawod_Books",
      tag: "كتب د. جمعة داود"
    },
    {
      title: "مجلد الكتب العربية الشاملة في الجغرافيا والمساحة والـ GIS (60+ كتاب)",
      desc: "مكتبة ضخمة تضم كتب د. رشا نوفل، د. وسام الدين محمد، د. محمد الخزامي، د. محمد رشاد الدين، وم. حاتم طارق.",
      url: "https://www.mediafire.com/folder/4iy7qhba26ae3/Books_Ar",
      tag: "مكتبة عربية شاملة"
    },
    {
      title: "مجلد بحوث أ.د. جمعة داود العلمية المنشورة",
      desc: "أبحاث تطبيقية في الجيويد المحلي لمصر، هبوط الدلتا، ارتفاع سطح البحر، وتطبيقات الطاقة الشمسية.",
      url: "https://www.mediafire.com/folder/bdxg32s3dp1mq/Gomaa_Dawod_Papers",
      tag: "أبحاث محكمة"
    },
    {
      title: "مجلد المواد التدريبية وملفات التطبيق العملي (Datasets)",
      desc: "ملفات بيانات وخرائط تدريبية مصاحبة للدورات العملية في ArcGIS والتحليل المكاني.",
      url: "https://www.mediafire.com/folder/17i0fpi0rwtaw/Gomaa_Dawod_Materials",
      tag: "ملفات تدريب"
    },
    {
      title: "مجلد عروض الباوربوينت PDF المحولة من المحاضرات",
      desc: "ملفات PDF مطبوعة ومنظمة لكافة العروض التقديمية المستخدمة في شروحات الفيديو.",
      url: "http://www.mediafire.com/folder/dns0ngvbvalk6/My_Videos_PDF",
      tag: "ملخصات المحاضرات"
    },
    {
      title: "مجلد رسائل الماجستير والدكتوراه بالعربية",
      desc: "عشرات الرسائل الأكاديمية الكاملة بصيغة PDF في الجغرافيا ونظم المعلومات الجغرافية من الجامعات العربية.",
      url: "https://www.mediafire.com/folder/uuox5ldupayn6/Arabic_MSC_Thesis",
      tag: "رسائل جامعية (عربي)"
    },
    {
      title: "مجلد رسائل الماجستير والدكتوراه بالإنجليزية (English Dissertations)",
      desc: "أحدث الرسائل العلمية باللغة الإنجليزية في الجيوماتكس والجيوديسيا والاستشعار عن بعد.",
      url: "https://www.mediafire.com/folder/vbdclcluu0ra2/English_Dissertations",
      tag: "رسائل جامعية (English)"
    },
    {
      title: "مجلدات بحوث التخرج لطلاب الجغرافيا والمساحة",
      desc: "نماذج تطبيقية لمشاريع تخرج متميزة من جامعات القاهرة وحلوان وسوهاج وجنوب الوادي والسودان.",
      url: "https://www.mediafire.com/folder/d1rxbzsi3z9cx/Arabic_BSC_Thesis",
      tag: "مشاريع تخرج"
    },
    {
      title: "مكتبة الـ 130 كتاب أجنبي في فروع الجيوماتكس (Google Drive)",
      desc: "مجموعة مراجع أجنبية شاملة في المساحة والجيوديسيا ونظم المعلومات الجغرافية.",
      url: "https://drive.google.com/drive/mobile/folders/0B1M3M-R-7nxTQ0pjSTdVWW1rc1E",
      tag: "مراجع أجنبية"
    }
  ];

  /* ==========================================================================
     3. حقن الكورسات والمجلدات في واجهة الأكاديمية (المسارات + مكتبة الكتب)
     ========================================================================== */
  let dawodCourseFilter = "";
  let dawodCatFilter = "all";

  function injectDawodCoursesSection() {
    const content = $("academyContent");
    if (!content || $("dawodCoursesSection")) return;

    // التأكد أننا في تبويب الكورسات/المسارات
    const coursesTabActive = document.querySelector('[data-academy-tab="courses"].active');
    if (!coursesTabActive) return;

    const categories = ["all", ...new Set(DAWOD_COURSES.map(c => c.cat))];
    const filtered = DAWOD_COURSES.filter(c => {
      const mCat = dawodCatFilter === "all" || c.cat === dawodCatFilter;
      const q = dawodCourseFilter.trim().toLowerCase();
      const mQ = !q || c.title.toLowerCase().includes(q) || c.instructor.toLowerCase().includes(q) || c.cat.toLowerCase().includes(q);
      return mCat && mQ;
    });

    const html = `
      <div id="dawodCoursesSection" class="academy-card" style="margin-bottom:18px;border:1px solid var(--gr)">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
          <span class="doc-badge green">فهرس الدورات الشامل (23 دورة مجانية معتمدة)</span>
          <span class="academy-muted">أ.د. جمعة داود • م. هشام فوزي • م. حاتم طارق • د. عبد الحميد النجار</span>
        </div>
        <h3 style="margin:10px 0 6px">🎓 موسوعة الدورات التدريبية المتكاملة في الجيوماتكس والمساحة</h3>
        <p class="academy-muted">قوائم تشغيل كاملة ومرتبة من الصفر للاحتراف مع روابط تحميل ملفات التدريب العملية المصاحبة لكل دورة.</p>

        <div class="doc-filter-bar">
          <input id="dawodSearchInput" class="academy-input" placeholder="ابحث باسم الدورة أو المحاضر (مثال: جمعة داود، هشام فوزي، جيوديسيا، Civil 3D)..." value="${esc(dawodCourseFilter)}" oninput="window.GEODawodFilterCourses()">
          <select id="dawodCatSelect" class="academy-input" onchange="window.GEODawodFilterCourses()">
            ${categories.map(cat => `<option value="${esc(cat)}" ${dawodCatFilter === cat ? "selected" : ""}>${cat === "all" ? "كل التخصصات (" + DAWOD_COURSES.length + " دورة)" : esc(cat)}</option>`).join("")}
          </select>
        </div>

        <div class="academy-grid" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,290px),1fr));margin-top:12px">
          ${filtered.map(c => `
            <div class="academy-card" style="background:var(--bg);display:flex;flex-direction:column;justify-content:space-between">
              <div>
                <div style="display:flex;justify-content:space-between;gap:6px;flex-wrap:wrap">
                  <span class="doc-badge">${esc(c.cat)}</span>
                  <span class="doc-badge amber">${esc(c.level)}</span>
                </div>
                <h3 style="margin:10px 0 4px;font-size:15px">${esc(c.title)}</h3>
                <div class="academy-muted">👨‍🏫 المحاضر: <b>${esc(c.instructor)}</b></div>
              </div>
              <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
                <a href="${esc(c.url)}" target="_blank" rel="noopener noreferrer" class="academy-btn" style="flex:1;text-decoration:none;font-size:12px">
                  ▶ فتح قائمة التشغيل
                </a>
                ${c.dataUrl ? `
                  <a href="${esc(c.dataUrl)}" target="_blank" rel="noopener noreferrer" class="academy-btn secondary" style="text-decoration:none;font-size:11.5px">
                    📦 ${esc(c.dataLabel || "ملفات التدريب")}
                  </a>
                ` : ""}
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;

    const proContainer = $("proTracksContainer");
    if (proContainer) {
      proContainer.insertAdjacentHTML("afterend", html);
    } else {
      content.insertAdjacentHTML("afterbegin", html);
    }
  }

  window.GEODawodFilterCourses = function () {
    dawodCourseFilter = $("dawodSearchInput")?.value || "";
    dawodCatFilter = $("dawodCatSelect")?.value || "all";
    const pos = $("dawodSearchInput")?.selectionStart || dawodCourseFilter.length;
    $("dawodCoursesSection")?.remove();
    injectDawodCoursesSection();
    const inp = $("dawodSearchInput");
    if (inp) {
      inp.focus();
      try { inp.setSelectionRange(pos, pos); } catch (_) {}
    }
  };

  function injectDawodReposInBooksTab() {
    const content = $("academyContent");
    if (!content || $("dawodReposSection")) return;

    const booksTabActive = document.querySelector('[data-academy-tab="books-lib"].active');
    if (!booksTabActive) return;

    const repoHtml = `
      <div id="dawodReposSection" class="academy-card" style="margin-bottom:18px;border:1px solid var(--gr)">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
          <span class="doc-badge green">المكتبة الرقمية المساحية المجانية (MediaFire & Drive)</span>
          <span class="academy-muted">تجميع أ.د. جمعة داود — تحميل مباشر بصيغة PDF</span>
        </div>
        <h3 style="margin:10px 0 6px">🗂️ مجلدات الكتب والرسائل العلمية والمواد التدريبية الكاملة</h3>
        <p class="academy-muted">روابط مباشرة للمجلدات الشاملة التي تضم مئات الكتب العربية والأجنبية ورسائل الماجستير والدكتوراه ومشاريع التخرج.</p>

        <div class="academy-grid" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,290px),1fr));margin-top:12px">
          ${DAWOD_REPOSITORIES.map(r => `
            <div class="academy-card" style="background:var(--bg);display:flex;flex-direction:column;justify-content:space-between">
              <div>
                <span class="doc-badge amber">${esc(r.tag)}</span>
                <h3 style="margin:8px 0 4px;font-size:15px">${esc(r.title)}</h3>
                <p style="font-size:13px">${esc(r.desc)}</p>
              </div>
              <a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer" class="academy-btn" style="margin-top:10px;text-decoration:none;font-size:12px">
                📂 فتح المجلد والتحميل المجاني ↗
              </a>
            </div>
          `).join("")}
        </div>
      </div>
    `;

    content.insertAdjacentHTML("afterbegin", repoHtml);
  }

  /* ==========================================================================
     4. تغذية الذاكرة المعرفية للمساعد الذكي (Knowledge Base) بالمحاضرين والروابط
     ========================================================================== */
  function seedExpertKnowledgeBase() {
    try {
      const kb = JSON.parse(localStorage.getItem("gd_kb") || '{"items":[]}');
      if (!Array.isArray(kb.items)) kb.items = [];

      const expertFacts = [
        {
          d: "مرجع معتمد",
          t: "قناة ودورات المهندس هشام فوزي (Civil 3D & Surfer)",
          s: "القناة الرسمية: https://www.youtube.com/user/Fingerprintvideos1/playlists — دورة Civil 3D الشاملة (66 فيديو): https://www.youtube.com/playlist?list=PLC8000153DF1EC573 — دورة حساب كميات الحفر والردم: https://www.youtube.com/playlist?list=PLXrNKFa4BOOnlWQzI7gu92MZUXeddnZqw — دورة برنامج Surfer: https://www.youtube.com/playlist?list=PLi5-9SH2ORG1h5VKfAiukaOn7Y3ic0364"
        },
        {
          d: "مرجع معتمد",
          t: "قناة وكتب ومكتبة أ.د. جمعة محمد داود (GIS & المساحة والجيوديسيا)",
          s: "القناة الرسمية: https://www.youtube.com/c/GomaaDawod — مجلد جميع الكتب المجانية: https://www.mediafire.com/folder/ci4ujfp714bqg/Gomaa_Dawod_Books — مجلد الكتب العربية الشاملة: https://www.mediafire.com/folder/4iy7qhba26ae3/Books_Ar — مجلد الرسائل الجامعية: https://www.mediafire.com/folder/uuox5ldupayn6/Arabic_MSC_Thesis"
        },
        {
          d: "مرجع معتمد",
          t: "قناة ودورات المهندس حاتم طارق (ArcGIS & GIS)",
          s: "دورة ArcGIS الشاملة: https://www.youtube.com/playlist?list=PLi5-9SH2ORG2DOFG14EfZle0OLhtyHFu4 — دورة التحليل الهيدرولوجي: https://www.youtube.com/playlist?list=PLi5-9SH2ORG2S4Tp6fAvdLGEMLbv_LVx2"
        }
      ];

      let updated = false;
      expertFacts.forEach(fact => {
        if (!kb.items.some(x => x.t === fact.t)) {
          kb.items.unshift(fact);
          updated = true;
        }
      });

      if (updated) {
        localStorage.setItem("gd_kb", JSON.stringify(kb));
      }
    } catch (_) {}
  }

  /* ==========================================================================
     5. التشغيل والمراقبة التلقائية
     ========================================================================== */
  function initDawodAndMotion() {
    injectSmoothMotionCSS();
    seedExpertKnowledgeBase();
    injectDawodCoursesSection();
    injectDawodReposInBooksTab();

    const acadSec = $("s-academy");
    if (acadSec) {
      new MutationObserver(() => {
        injectDawodCoursesSection();
        injectDawodReposInBooksTab();
      }).observe(acadSec, { childList: true, subtree: true });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDawodAndMotion);
  } else {
    initDawodAndMotion();
  }
})();
