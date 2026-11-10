
/* =========================================================
   GEO Academy Engines
   Tavily Real Web Search + Groq AI Analysis
   ========================================================= */

(function () {
  "use strict";

  const API_URL = window.GEO_API;

  /* ---------- Firebase Authentication ---------- */

  async function getAuthToken() {
    const user = window.firebase?.auth?.().currentUser;

    if (!user || !user.emailVerified) {
      throw new Error(
        "سجّل الدخول وفعّل بريدك الإلكتروني أولاً."
      );
    }

    if (typeof window.geoToken !== "function") {
      throw new Error(
        "اتصال الحساب غير جاهز. حدّث الصفحة وحاول مرة أخرى."
      );
    }

    return await window.geoToken();
  }

  /* ---------- Tavily Web Search ---------- */

  async function searchWeb(query) {
    if (!API_URL) {
      throw new Error("عنوان Cloudflare Worker غير مضبوط.");
    }

    const token = await getAuthToken();

    const response = await fetch(
      API_URL + "/search",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },
        body: JSON.stringify({
          query: query
        })
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errors = {
        unauthorized: "انتهت جلسة الدخول. سجّل الدخول مرة أخرى.",
        verify_email: "فعّل بريدك الإلكتروني أولاً.",
        search_quota: "وصلت إلى الحد اليومي للبحث.",
        search_not_configured: "محرك البحث غير مضبوط في Cloudflare.",
        bad_query: "عبارة البحث غير صحيحة.",
        server_error: "حدث خطأ في خادم البحث."
      };

      throw new Error(
        errors[data.error] ||
        data.message ||
        "تعذر البحث. رمز الخطأ: " + response.status
      );
    }

    if (!Array.isArray(data.results)) {
      throw new Error("تنسيق نتائج البحث غير صحيح.");
    }

    return data;
  }

  /* ---------- Prepare Search Sources ---------- */

  function formatSources(data) {
    return data.results.map((item, index) => {
      return [
        "المصدر رقم " + (index + 1),
        "العنوان: " + (item.title || ""),
        "الرابط: " + (item.url || ""),
        "المحتوى: " + (item.content || "")
      ].join("\n");
    }).join("\n\n-------------------\n\n");
  }

  /* ---------- Groq AI Analysis ---------- */

  async function analyzeResults(query, data) {
    const token = await getAuthToken();

    const sources = formatSources(data);

    const prompt = `
أنت مساعد أكاديمي متخصص في الجغرافيا والجيوماتكس والمساحة والبرمجة.

طلب المستخدم:
${query}

ملخص محرك البحث:
${data.answer || "لا يوجد ملخص."}

نتائج البحث:
${sources}

المطلوب:

1. حلل نتائج البحث الحقيقية فقط.
2. أجب باللغة العربية إذا كان السؤال بالعربية.
3. احتفظ بالمصطلحات التقنية بالإنجليزية.
4. لا تخترع كورسات أو مواقع أو روابط.
5. لا تدّع أن الكورس مجاني إلا إذا كان المصدر يؤكد ذلك.
6. وضّح نوع كل نتيجة: كورس، مقال، مرجع، فيديو، أو موقع.
7. اعرض اسم الموقع والرابط الأصلي.
8. اذكر المعلومات غير المتوفرة بوضوح.
9. رتّب النتائج حسب ارتباطها بطلب المستخدم.
10. لا تنسب معلومات إلى مصدر لم يذكرها.

اعرض إجابة منظمة وسهلة القراءة على الهاتف.
`;

    const response = await fetch(
      API_URL + "/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-20b",
          messages: [
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 5000,
          stream: false
        })
      }
    );

    const raw = await response.text();

    if (!response.ok) {
      let error = {};

      try {
        error = JSON.parse(raw);
      } catch (_) {}

      throw new Error(
        error.error === "quota"
          ? "وصلت إلى الحد اليومي لرسائل الذكاء الاصطناعي."
          : "تعذر تحليل نتائج البحث."
      );
    }

    let result;

    try {
      const parsed = JSON.parse(raw);

      result =
        parsed.choices?.[0]?.message?.content ||
        parsed.output ||
        "";
    } catch (_) {
      throw new Error(
        "لم يتمكن محرك الذكاء الاصطناعي من قراءة النتيجة."
      );
    }

    if (!result.trim()) {
      throw new Error("محرك التحليل لم يرجع نتيجة نصية.");
    }

    return result;
  }

  /* ---------- Main Academy Search ---------- */

  async function academySearch(query) {
    query = String(query || "").trim();

    if (!query) {
      throw new Error("اكتب موضوع البحث أولاً.");
    }

    if (query.length > 500) {
      throw new Error("عبارة البحث طويلة جدًا.");
    }

    // 1. البحث الحقيقي في الويب
    const webData = await searchWeb(query);

    // 2. تحليل النتائج بالذكاء الاصطناعي
    const analysis = await analyzeResults(
      query,
      webData
    );

    // 3. إرجاع النتائج للواجهة
    return {
      success: true,

      query: query,

      engine: "Tavily",

      analysis: analysis,

      answer: webData.answer || "",

      results: webData.results.map(item => ({
        title: item.title || "",
        url: item.url || "",
        content: item.content || "",
        score: item.score || 0
      })),

      usage: webData.usage || null
    };
  }

  /* ---------- Public API ---------- */

  window.GEOAcademyEngines = {
    search: academySearch,
    searchWeb: searchWeb,
    analyzeResults: analyzeResults
  };

})();
