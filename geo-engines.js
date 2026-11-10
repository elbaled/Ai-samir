/* GeoDev Engines Patch v1 — كل محرك بموديل ومستوى تفكير مختلف
   GEO 2.9  = gpt-oss-20b  (تفكير منخفض، سريع وموجز)
   GEO 3.8  = gpt-oss-120b (تفكير متوسط)
   GEO 5.2  = groq/compound (بحث ويب حقيقي + تنفيذ كود)، وبديله gpt-oss-120b بتفكير عالي
   الاستخدام: ضع <script src="geo-engines.js"></script> آخر باتش (بعد geo-theme.js)
   يحتاج في geo-cf.js السطر:  window.GEO_API=API;window.geoToken=token;  */
(function(){
const DEF='openai/gpt-oss-120b';
const PLAN={
  g29:{model:'openai/gpt-oss-20b',eff:'low',t:.3,max:3000},
  g38:{model:DEF,eff:'medium',t:.6,max:8000},
  g52:{model:'groq/compound',t:.5,max:8192,fb:{model:DEF,eff:'high'}}
};
const clean=t=>t.replace(/<think>[\s\S]*?(<\/think>|$)/g,'').trim();

/* وصف وتعليمات كل محرك (بتظهر في قايمة المحركات وبتتضاف للطلب) */
Object.assign(ENGS.g29,{d:'مجاني • سريع وموجز',note:'أنت GEO 2.9: أجب باختصار شديد ومباشرة (3 إلى 6 أسطر)، بدون تفاصيل زائدة.'});
Object.assign(ENGS.g38,{d:'متوازن • تفكير متوسط',note:'أنت GEO 3.8 FLASH: أجب بتوازن بين السرعة والتفصيل، مع خطوات واضحة وأمثلة عند الحاجة.'});
Object.assign(ENGS.g52,{d:'موسوعي • بحث ويب حقيقي',note:'أنت GEO 5.2 ULTRA: حلّل بعمق. لو السؤال يخص معلومات حديثة أو أرقام أو أخبار ابحث في الويب، واذكر المصادر، وفرّق بين المؤكد وغير المؤكد.'});
try{renderEng()}catch(e){}

let warned=false;
async function run(prompt,o,P,tok){
  const body={model:P.model,messages:[{role:'user',content:prompt}],stream:true,temperature:P.t,max_tokens:P.max};
  if(/gpt-oss/.test(P.model)&&P.eff)body.reasoning_effort=P.eff;
  const res=await fetch(window.GEO_API+'/chat/completions',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+tok},body:JSON.stringify(body),signal:o.signal});
  if(res.status===429)throw Object.assign(new Error('rate_limited'),{code:'rate_limited'});
  if(res.status===401)throw new Error('جلسة الدخول انتهت (401)، سجّل الدخول تاني');
  if(!res.ok){let m='';try{m=(await res.json()).error?.message||''}catch(e){}throw Object.assign(new Error('HTTP '+res.status+(m?' — '+String(m).slice(0,140):'')),{status:res.status})}
  const rd=res.body.getReader(),dc=new TextDecoder();let raw='',buf='',tr=false;
  for(;;){const{value,done}=await rd.read();if(done)break;buf+=dc.decode(value,{stream:true});const ls=buf.split('\n');buf=ls.pop();
    for(const l of ls){if(!l.startsWith('data:'))continue;const d=l.slice(5).trim();if(d==='[DONE]')continue;
      try{const j=JSON.parse(d);if(j.model)window.__used=j.model;const c=j.choices?.[0];
        if(c?.delta?.content){raw+=c.delta.content;o.onText&&o.onText({text:clean(raw)})}
        if(c?.finish_reason==='length')tr=true}catch(e){}}}
  return{text:clean(raw),truncated:tr}}

const _call=callAI;
callAI=async function(prompt,o={}){
  const P=PLAN[eng];
  if(!window.__engCall||!P||(window.__vi&&window.__vi.length)||(o.images&&o.images.length))return _call(prompt,o);
  if(!window.GEO_API||!window.geoToken){if(!warned){warned=true;toast('أضف سطر GEO_API في geo-cf.js عشان المحركات تشتغل بموديلات مختلفة','warn')}return _call(prompt,o)}
  if(!firebase.auth().currentUser?.emailVerified)throw new Error('فعّل بريدك الإلكتروني أولاً (راجع رسالة التحقق)');
  const tok=await window.geoToken();
  window.__req=P.model;
  try{return await run(prompt,o,P,tok)}
  catch(e){
    if(!e.status||[401,429].includes(e.status)||e.status>=500)throw e;
    const fb={...P,...(P.fb||{model:DEF})};
    toast('⚠️ موديل '+P.model+' مش متاح على السيرفر، اتستخدم البديل','warn');
    window.__req=fb.model;return await run(prompt,o,fb,tok)}};

/* في 5.2 البحث الحقيقي بيتم جوه الموديل، فنوقف سياق ويكيبيديا القديم */
const _w=webCtx;
webCtx=function(q){return(window.__engCall&&eng==='g52')?Promise.resolve(''):_w(q)};

const _ask=ask;
ask=function(p,s){
  window.__engCall=true;window.__used=null;window.__req=null;
  return Promise.resolve(_ask(p,s)).finally(()=>{
    window.__engCall=false;
    if(!window.__used)return;
    const last=[...document.querySelectorAll('#chat .m.a')].pop();
    if(last&&!last.querySelector('.eng-ft')){
      const diff=window.__req&&window.__used!==window.__req;
      last.insertAdjacentHTML('beforeend',`<div class="mt eng-ft" style="margin-top:8px;direction:ltr;text-align:left;opacity:.8">⚙️ ${esc(ENGS[eng].n)} · ${esc(window.__used)}${diff?' ⚠️ requested '+esc(window.__req):''}</div>`)}})};

   
/* GEO Academy: Dual AI Engine Bridge */
window.GEOAcademyEngines = {
  async search(query) {
    const user = window.firebase?.auth?.().currentUser;

    if (!user || !user.emailVerified) {
      throw new Error("سجّل الدخول وفعّل بريدك الإلكتروني أولاً.");
    }

    if (!window.GEO_API || !window.geoToken) {
      throw new Error("اتصال محركات الذكاء الاصطناعي غير جاهز.");
    }

    const token = await window.geoToken();

    async function askModel(model, prompt, effort) {
      const body = {
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 7000,
        stream: false
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
        throw new Error("تعذر تشغيل المحرك: HTTP " + response.status);
      }

      const reader = response.body.getReader();
const decoder = new TextDecoder();

let buffer = "";
let result = "";

while (true) {
  const { value, done } = await reader.read();

  if (done) break;

  buffer += decoder.decode(value, { stream: true });

  const lines = buffer.split("\n");
  buffer = lines.pop() || "";

  for (const line of lines) {
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
    } catch (error) {
      continue;
    }
  }
}

if (buffer.trim().startsWith("data:")) {
  const payload = buffer.trim().slice(5).trim();

  if (payload && payload !== "[DONE]") {
    try {
      const chunk = JSON.parse(payload);
      result +=
        chunk.choices?.[0]?.delta?.content ||
        chunk.choices?.[0]?.message?.content ||
        "";
    } catch (error) {}
  }
}

if (!result.trim()) {
  throw new Error("لم تصل نتيجة نصية من المحرك. حاول مرة أخرى.");
}

return result;

    const searchPrompt = `
أنت محرك البحث GEO 5.2 ULTRA.
ابحث على الويب عن كورسات حقيقية مرتبطة بطلب المستخدم.
اهتم بيوتيوب والمواقع الرسمية والمنصات التعليمية.
أرجع أسماء الكورسات وروابطها الأصلية ومصادرها.
لا تخترع روابط أو أسعاراً أو أسماء مدربين.
إذا لم تستطع التحقق من معلومة، اذكر أنها غير مؤكدة.

طلب البحث:
${query}
`;

    const searchResults = await askModel(
      "groq/compound",
      searchPrompt
    );

    const analysisPrompt = `
أنت GEO 3.8 FLASH، محلل نتائج أكاديمية.
حلل نتائج البحث التالية ورتب الكورسات حسب مدى مناسبتها لطلب المستخدم.
اعرض لكل كورس:
العنوان، المنصة، اللغة، المستوى، السعر إذا كان مؤكداً،
ملخصاً قصيراً، والرابط الأصلي.
لا تضف معلومات أو روابط غير موجودة في نتائج البحث.
ميّز بين المجاني والمدفوع وغير المعروف.

طلب المستخدم:
${query}

نتائج GEO 5.2:
${searchResults}
`;

    const analysis = await askModel(
      "openai/gpt-oss-120b",
      analysisPrompt,
      "medium"
    );

    return {
      searchEngine: "groq/compound",
      analysisEngine: "openai/gpt-oss-120b",
      sources: searchResults,
      results: analysis
    };
  }
};

})();
