
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
أنت GEO 5.2 ULTRA، محرك بحث عن الكورسات.

ابحث على الويب عن كورسات حقيقية تطابق طلب المستخدم.
اهتم بـ YouTube والمنصات التعليمية والمواقع الرسمية.
أدرج روابط المصادر الأصلية فقط.
لا تخترع أسماء أو روابط أو أسعاراً.
وضح إذا كانت المعلومات غير مؤكدة.

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
