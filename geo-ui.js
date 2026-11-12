/* GeoDev UI v1 — شاشة دخول احترافية + إنترو
   ضعه بعد geo-cf.js:  <script src="geo-ui.js"></script> */
(function(){
const $=id=>document.getElementById(id);

/* ---------- CSS ---------- */
const css=`
@keyframes gdUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes gdSpin{to{transform:rotate(360deg)}}
@keyframes gdMer{from{transform:scaleX(1)}to{transform:scaleX(-1)}}
@keyframes gdPulse{0%{transform:scale(1);opacity:.9}100%{transform:scale(4.5);opacity:0}}
@keyframes gdLoad{to{transform:none}}

.globe{display:block;margin:0 auto;color:var(--bl)}
.globe .mer{transform-box:fill-box;transform-origin:center;animation:gdMer 6s linear infinite}
.globe .pulse{transform-box:fill-box;transform-origin:center;animation:gdPulse 2s ease-out infinite}

/* ===== Intro ===== */
#gdIntro{position:fixed;inset:0;z-index:300;display:flex;align-items:center;justify-content:center;background:var(--bg);transition:opacity .6s,visibility .6s;cursor:pointer}
#gdIntro.out{opacity:0;visibility:hidden}
#gdIntro .in-bg{position:absolute;inset:0;background:radial-gradient(circle at 50% 38%,rgba(59,130,246,.25),transparent 55%),radial-gradient(circle at 50% 90%,rgba(16,185,129,.12),transparent 50%)}
#gdIntro .in-c{position:relative;text-align:center;padding:0 24px}
#gdIntro .globe{width:150px;height:150px;animation:gdUp .9s cubic-bezier(.16,1,.3,1) both}
#gdIntro h1{margin:18px 0 6px;font-size:30px;font-weight:900;color:var(--tx);animation:gdUp .9s .25s both}
#gdIntro h1 span{color:var(--bl)}
#gdIntro p{margin:0;color:var(--mt);font-size:13px;letter-spacing:.5px;animation:gdUp .9s .45s both}
#gdIntro .in-bar{width:160px;height:3px;background:var(--ln);border-radius:3px;margin:26px auto 0;overflow:hidden;animation:gdUp .9s .6s both}
#gdIntro .in-bar i{display:block;height:100%;background:linear-gradient(90deg,var(--bl),var(--gr));transform:translateX(100%);animation:gdLoad 2.1s .6s ease-in-out forwards}
#gdIntro .in-skip{position:absolute;top:calc(14px + env(safe-area-inset-top,0px));left:14px;background:rgba(148,163,184,.14);color:var(--mt);padding:8px 14px;border-radius:20px;font-size:12px}
#gdIntro .in-by{position:absolute;bottom:calc(20px + env(safe-area-inset-bottom,0px));left:0;right:0;text-align:center;color:var(--mt);font-size:11px}

/* ===== Login ===== */
#gate{padding:0!important;align-items:stretch!important;justify-content:stretch!important;overflow-y:auto;-webkit-overflow-scrolling:touch}
#gate .au{width:100%;min-height:100%;display:grid;grid-template-columns:1fr;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}
#gate .au-brand{position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;padding:26px 20px 8px;text-align:center}
#gate .au-bg{position:absolute;inset:0;background:radial-gradient(60% 55% at 25% 20%,rgba(59,130,246,.22),transparent 70%),radial-gradient(50% 45% at 85% 90%,rgba(16,185,129,.16),transparent 70%)}
#gate .au-bg::after{content:"";position:absolute;inset:0;background-image:linear-gradient(rgba(148,163,184,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(148,163,184,.07) 1px,transparent 1px);background-size:34px 34px;-webkit-mask-image:radial-gradient(circle at 50% 40%,#000,transparent 75%);mask-image:radial-gradient(circle at 50% 40%,#000,transparent 75%)}
#gate .au-bc{position:relative;max-width:430px;width:100%}
#gate .au-bc .globe{width:88px;height:88px;animation:gdUp .8s both}
#gate .au-bc h2{margin:10px 0 4px;font-size:22px;font-weight:900;color:var(--tx)}
#gate .au-bc h2 span{color:var(--bl)}
#gate .au-sub{margin:0;color:var(--mt);font-size:12.5px;line-height:1.7}
#gate .au-feat{display:none;list-style:none;margin:30px 0 0;padding:0;text-align:right}
#gate .au-feat li{display:flex;gap:14px;align-items:center;margin-bottom:16px}
#gate .au-feat b{width:44px;height:44px;flex:none;display:flex;align-items:center;justify-content:center;border-radius:12px;background:rgba(59,130,246,.12);border:1px solid var(--ln);color:var(--bl)}
#gate .au-feat span{display:block;font-size:14px;font-weight:700;color:var(--tx)}
#gate .au-feat small{display:block;font-size:11.5px;color:var(--mt);font-weight:400;margin-top:2px}
#gate .au-form{display:flex;align-items:center;justify-content:center;padding:14px 14px 26px}
#gate .au-card{width:100%;max-width:400px;background:var(--cd);border:1px solid var(--ln);border-radius:20px;padding:22px 20px;box-shadow:0 20px 50px rgba(0,0,0,.35);animation:gdUp .7s .1s both}
#gate .au-tabs{display:grid;grid-template-columns:1fr 1fr;background:var(--bg);border:1px solid var(--ln);border-radius:12px;padding:4px;margin-bottom:18px}
#gate .au-tabs button{background:none;color:var(--mt);padding:10px;border-radius:9px;font-size:13px;font-weight:700;min-height:0}
#gate .au-tabs button.on{background:var(--bl);color:#fff}
#gate .au-card h3{margin:0 0 4px;font-size:19px;color:var(--tx)}
#gate .au-p{margin:0 0 16px;color:var(--mt);font-size:13px;line-height:1.7}
#gate .au-p b{color:var(--am)}
#gate .fld{margin-bottom:12px}
#gate .fld label{display:block;font-size:12px;color:var(--mt);margin-bottom:6px;font-weight:700}
#gate .fld .in{position:relative}
#gate .fld .ic{position:absolute;left:12px;top:50%;transform:translateY(-50%);font-size:15px;opacity:.7;pointer-events:none}
#gate .fld .in.rtl .ic{left:auto;right:12px}
#gate .fld input{width:100%;height:46px;margin:0;padding:0 40px 0 38px;border-radius:12px;direction:ltr;text-align:left;background:var(--bg);border:1px solid var(--ln);color:var(--tx);font-size:15px;transition:.2s}
#gate .fld .in.rtl input{direction:rtl;text-align:right;padding:0 38px 0 12px}
#gate .fld input:focus{outline:0;border-color:var(--bl);box-shadow:0 0 0 3px rgba(59,130,246,.22)}
#gate .fld .eye{position:absolute;right:4px;top:50%;transform:translateY(-50%);background:none;color:var(--mt);padding:8px 10px;font-size:16px;min-height:0;border-radius:8px}
#gate .fld small{display:block;color:var(--mt);font-size:11px;margin-top:5px}
#gate .au-err{background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.4);color:#fca5a5;padding:9px 12px;border-radius:10px;font-size:12.5px;margin:0 0 12px;line-height:1.6}
#gate .au-row{display:flex;justify-content:flex-start;margin:-2px 0 14px}
#gate .au-link{color:var(--bl);font-size:12.5px;text-decoration:none;font-weight:700}
#gate .au-btn{position:relative;width:100%;height:48px;border-radius:12px;font-size:15px;font-weight:900;color:#fff;background:linear-gradient(135deg,var(--bl),#2563eb);box-shadow:0 8px 20px rgba(59,130,246,.28)}
#gate .au-btn.gr{background:linear-gradient(135deg,var(--gr),#059669);box-shadow:0 8px 20px rgba(16,185,129,.25)}
#gate .au-btn:disabled{opacity:.75;cursor:wait}
#gate .au-btn.ld{color:transparent}
#gate .au-btn.ld::after{content:"";position:absolute;inset:0;margin:auto;width:20px;height:20px;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:gdSpin .7s linear infinite}
#gate .au-or{display:flex;align-items:center;gap:10px;color:var(--mt);font-size:12px;margin:14px 0}
#gate .au-or::before,#gate .au-or::after{content:"";flex:1;height:1px;background:var(--ln)}
#gate .au-g{width:100%;height:46px;border-radius:12px;background:#fff;color:#1f2937;border:1px solid #e5e7eb;font-size:14px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:10px}
#gate .au-g svg{width:18px;height:18px;flex:none}
#gate .au-note{font-size:11.5px;color:var(--mt);text-align:center;margin:12px 0 0;line-height:1.7}
#gate .au-foot{text-align:center;color:var(--mt);font-size:11px;margin-top:16px}

@media(min-width:900px){
  #gate .au{grid-template-columns:1.05fr .95fr}
  #gate .au-brand{padding:48px}
  #gate .au-bc .globe{width:210px;height:210px}
  #gate .au-bc h2{font-size:34px;margin-top:18px}
  #gate .au-sub{font-size:15px}
  #gate .au-feat{display:block}
  #gate .au-form{padding:32px}
  #gate .au-card{padding:28px 26px}
}
@media(min-width:900px) and (max-height:720px){#gate .au-bc .globe{width:150px;height:150px}#gate .au-feat{margin-top:18px}#gate .au-feat li{margin-bottom:10px}}
@media(prefers-reduced-motion:reduce){
  .globe .mer,.globe .pulse{animation:none}
  #gdIntro *,#gate .au-card{animation-duration:.01s!important;animation-delay:0s!important}
}`;
const st=document.createElement("style");st.textContent=css;document.head.appendChild(st);

/* ---------- الكرة الأرضية (SVG متحرك) ---------- */
function globe(){
  const mer=[0,1,2,3].map(i=>`<ellipse class="mer" cx="100" cy="100" rx="80" ry="80" style="animation-delay:${-i*1.5}s"/>`).join("");
  return `<svg class="globe" viewBox="0 0 200 200" aria-hidden="true">
   <defs><radialGradient id="gdGg" cx="35%" cy="30%"><stop offset="0" stop-color="#3b82f6" stop-opacity=".38"/><stop offset="1" stop-color="#3b82f6" stop-opacity="0"/></radialGradient></defs>
   <circle cx="100" cy="100" r="80" fill="url(#gdGg)"/>
   <g fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round">
     <circle cx="100" cy="100" r="80"/>
     <path opacity=".55" d="M30.7 60H169.3M22.5 80H177.5M20 100H180M22.5 120H177.5M30.7 140H169.3"/>
     <g opacity=".7">${mer}</g>
   </g>
   <circle cx="128" cy="78" r="3.5" fill="#10b981"/>
   <circle class="pulse" cx="128" cy="78" r="3.5" fill="none" stroke="#10b981" stroke-width="1.5"/>
  </svg>`;
}

/* ---------- الإنترو ---------- */
function intro(){
  if(sessionStorage.getItem("gd_intro"))return;
  sessionStorage.setItem("gd_intro","1");
  const d=document.createElement("div");d.id="gdIntro";
  d.innerHTML=`<div class="in-bg"></div><div class="in-c">${globe()}<h1>GeoDev <span>Studio Pro</span></h1><p>جيوماتكس • جغرافيا • مساحة • تصميم</p><div class="in-bar"><i></i></div></div><button class="in-skip" type="button">تخطّي</button><div class="in-by">م. أحمد سمير</div>`;
  document.body.appendChild(d);
  let done=false;
  const end=()=>{if(done)return;done=true;d.classList.add("out");setTimeout(()=>d.remove(),700)};
  d.addEventListener("click",end);
  setTimeout(end,matchMedia("(prefers-reduced-motion:reduce)").matches?900:2900);
}
intro();

/* ---------- شاشة الدخول ---------- */
const GSVG='<svg viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>';
const gBtn=`<button type="button" class="au-g" onclick="googleLogin()">${GSVG}<span>المتابعة بحساب Google</span></button>`;

const g=$("gate");
if(g){
  g.innerHTML=`<div class="au">
   <aside class="au-brand"><div class="au-bg"></div>
    <div class="au-bc">${globe()}
      <h2>GeoDev <span>Studio Pro</span></h2>
      <p class="au-sub">منصتك المتكاملة للجيوماتكس والمساحة والبرمجة</p>
      <ul class="au-feat">
        <li><b><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 20 12 4l9 16z"/></svg></b><div><span>أدوات مساحية دقيقة</span><small>UTM • Red Belt • COGO • مثلثات</small></div></li>
        <li><b><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z"/></svg></b><div><span>مساعد ذكي بمعرفة محدّثة يومياً</span><small>جغرافيا • برمجة • تصميم</small></div></li>
        <li><b><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/></svg></b><div><span>رفع مساحي وخرائط تفاعلية</span><small>GeoJSON • حساب المساحات بالفدان</small></div></li>
        <li><b><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m8 8-4 4 4 4M16 8l4 4-4 4"/></svg></b><div><span>استوديو توليد مواقع وأكواد</span><small>معاينة فورية وتصدير ZIP / PWA</small></div></li>
      </ul>
    </div></aside>

   <div class="au-form"><div class="au-card">
    <div class="au-tabs"><button id="tabL" type="button" class="on" onclick="toggleAuth(false)">تسجيل الدخول</button><button id="tabR" type="button" onclick="toggleAuth(true)">حساب جديد</button></div>

    <div id="loginForm">
      <h3>تسجيل الدخول</h3><p class="au-p">سجّل دخولك لمتابعة عملك</p>
      <div class="fld"><label for="em">البريد الإلكتروني</label><div class="in"><span class="ic"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg></span><input id="em" type="email" inputmode="email" autocomplete="username" placeholder="name@example.com" onkeydown="if(event.key=='Enter')login()"></div></div>
      <div class="fld"><label for="pw">كلمة المرور</label><div class="in"><span class="ic"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg></span><input id="pw" type="password" autocomplete="current-password" placeholder="••••••••" onkeydown="if(event.key=='Enter')login()"><button type="button" class="eye" onclick="gdEye('pw',this)" aria-label="إظهار كلمة المرور"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg></button></div></div>
      <div class="au-row"><a href="#" class="au-link" onclick="window.forgot&&forgot();return false">نسيت كلمة المرور؟</a></div>
      <div id="er" class="au-err" style="display:none" role="alert"></div>
      <button id="btnLogin" type="button" class="au-btn" onclick="login()">دخول</button>
      <div class="au-or"><span>أو</span></div>
      ${gBtn}
    </div>

    <div id="registerForm" style="display:none">
      <h3>إنشاء حساب جديد</h3><p class="au-p">أنشئ حسابك واحصل على <b>3 أيام PRO</b> مجانًا</p>
      <div class="fld"><label for="regName">الاسم</label><div class="in rtl"><span class="ic"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 20c1-4 4-6 8-6s7 2 8 6"/></svg></span><input id="regName" type="text" autocomplete="name" placeholder="الاسم بالكامل"></div></div>
      <div class="fld"><label for="regEmail">البريد الإلكتروني</label><div class="in"><span class="ic"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg></span><input id="regEmail" type="email" inputmode="email" autocomplete="email" placeholder="name@example.com"></div></div>
      <div class="fld"><label for="regPw">كلمة المرور</label><div class="in"><span class="ic"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg></span><input id="regPw" type="password" autocomplete="new-password" placeholder="8 أحرف على الأقل" onkeydown="if(event.key=='Enter')register()"><button type="button" class="eye" onclick="gdEye('regPw',this)" aria-label="إظهار كلمة المرور"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg></button></div></div>
      <div id="regEr" class="au-err" style="display:none" role="alert"></div>
      <button id="btnReg" type="button" class="au-btn gr" onclick="register()">إنشاء الحساب</button>
      <p class="au-note">هنبعتلك رسالة على بريدك لتفعيل الحساب</p>
      <div class="au-or"><span>أو</span></div>
      ${gBtn}
    </div>

    <div class="au-foot">GeoDev Studio Pro • م. أحمد سمير</div>
   </div></div>
  </div>`;
}

window.toggleAuth=function(reg){
  $("loginForm").style.display=reg?"none":"block";
  $("registerForm").style.display=reg?"block":"none";
  $("tabL").classList.toggle("on",!reg);$("tabR").classList.toggle("on",!!reg);
  $("er").style.display="none";$("regEr").style.display="none";
};
const EYE=`<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>`,EYEOFF=`<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3l18 18"/><path d="M10.6 6.1A10 10 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3.2 4"/><path d="M6.6 6.6A17 17 0 0 0 2 12s4 7 10 7a10 10 0 0 0 4-.8"/></svg>`;
window.gdEye=function(id,b){const i=$(id),s=i.type==="password";i.type=s?"text":"password";b.innerHTML=s?EYEOFF:EYE};

/* حالة التحميل على زرار الدخول والتسجيل */
function busy(fn,btn){
  const f=window[fn];if(!f)return;
  window[fn]=async function(){
    const b=$(btn);if(b){b.disabled=true;b.classList.add("ld")}
    try{return await f.apply(this,arguments)}
    finally{if(b){b.disabled=false;b.classList.remove("ld")}}
  };
}
busy("login","btnLogin");busy("register","btnReg");
})();
