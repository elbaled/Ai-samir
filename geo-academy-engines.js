
/* GEO Academy - Independent Dual AI Engine */

(function () {
  "use strict";

  async function askModel(model, prompt, effort) {
    const user = window.firebase?.auth?.().currentUser;

    if (!user || !user.emailVerified) {
      throw new Error("سجّل الدخول وفعّل بريدك الإلكتروني أولاً.");
    }

    if (!window.GEO_API || typeof window.geoToken !== "function") {
      throw new Error("اتصال محركات الذكاء الاصطناعي غير جاهز.");
    }

    const token = await window.geoToken();

    const body = {
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 7000,
      stream: true
    };

    if (effort) body.reasoning_effort = effort;

    const response = await fetch(
      window.GEO_API + "/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token
        },
        body: JSON.stringify(body)
      }
    );

    if (!response.ok) {
      throw new Error("خطأ المحرك: HTTP " + response.status);
    }

    const raw = await response.text();
    let result = "";

    try {
      const data = JSON.parse(raw);
      result = data.choices?.[0]?.message?.content || "";
    } catch (e) {
      for (const line of raw.split(/\r?\n/)) {
        const trimmed = line.trim();

        if (!trimmed.startsWith("data:")) continue;

        const payload = trimmed.slice(5).trim();

        if (!payload || payload === "[DONE]") continue;

        try {
          const chunk = JSON.parse(payload);
          const choice = chunk.choices?.[0];

          result +=
            choice?.delta?.content ||
            choice?.message?.content ||
            "";
        } catch (_) {}
      }
    }

    if (!result.trim()) {
      throw new Error("المحرك لم يرجع نتيجة نصية.");
    }

    return result;
  }

  window.GEOAcademyEngines = {
    async search(query) {
      if (!query || !query.trim()) {
        throw new Error("اكتب موضوع البحث أولاً.");
      }

      const searchPrompt = `
أنت محرك بحث أكاديمي محترف تستخدم البحث الفعلي على الويب.

مهمتك العثور على كورسات حقيقية موجودة بالفعل.

قواعد إلزامية:
1. لا تنشئ أسماء قنوات أو كورسات من عندك.
2. لا تخمن أي رابط.
3. لا تكتب رابط قناة عامة باعتباره رابط كورس.
4. ابحث عن صفحة الكورس أو قائمة التشغيل الأصلية مباشرة.
5. أعط الأولوية لنتائج YouTube وقوائم التشغيل الفعلية والمواقع الرسمية.
6. لا تذكر سعراً إلا إذا كان موضحاً في المصدر.
7. لا تذكر أن الكورس مجاني إلا إذا أكد المصدر ذلك.
8. لا تستخدم روابط بحث عامة بدلاً من رابط الكورس.
9. لا تعرض أي نتيجة لا تستطيع تحديد مصدرها.
10. إذا لم تجد نتائج موثوقة، قل ذلك بوضوح.

لكل نتيجة اكتب:
- اسم الكورس الحقيقي.
- اسم الجهة أو القناة.
- رابط صفحة الكورس الأصلية.
- اللغة.
- المستوى.
- حالة السعر إذا كانت معلومة.
- دليل مختصر من المصدر.

أخرج الروابط كما ظهرت في نتائج البحث الفعلية دون تعديلها.

طلب المستخدم:
${query}
`;

      const sources = await askModel(
        "groq/compound",
        searchPrompt
      );

      const analysisPrompt = `
أنت GEO 3.8 FLASH، محلل نتائج أكاديمية.

رتب نتائج البحث حسب مناسبتها لطلب المستخدم.
اعرض لكل كورس:
- اسم الكورس
- المنصة
- اللغة
- المستوى
- مجاني أو مدفوع أو غير معروف
- ملخص مختصر
- الرابط الأصلي

لا تخترع أي معلومات أو روابط.
إذا لم تتوفر معلومة فاكتب غير محدد.

طلب المستخدم:
${query}

نتائج البحث:
${sources}
`;

      const results = await askModel(
        "openai/gpt-oss-120b",
        analysisPrompt,
        "medium"
      );

      return {
        searchEngine: "groq/compound",
        analysisEngine: "openai/gpt-oss-120b",
        sources,
        results
      };
    }
  };

})();
