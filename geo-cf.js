/* GeoDev × Firebase Auth × Cloudflare Worker — v2 */
(function(){
const CFG={
  apiKey:"AIzaSyBrGugO1vEK1wH_iFwfv0S8ufFwN2W0mZc",
  authDomain:"ahmed-f7248.firebaseapp.com",
  projectId:"ahmed-f7248",
  appId:"1:781857834627:web:630847182a4b5eebe4bdb6"
};
const API="https://fancy-king-30f2geodev-ai.123456789012345678o01234567898.workers.dev";
window.GEO_API=API;window.geoToken=token;
firebase.initializeApp(CFG);
const auth=firebase.auth();

// تنظيف أي بقايا قديمة (مفاتيح / باسوردات / أكواد محلية)
// تم إيقاف الحذف التلقائي للبيانات المحلية.
// سنحافظ على البيانات القديمة إلى أن نتحقق من ترحيلها بأمان.

const ERR={
 "auth/invalid-credential":"البريد أو كلمة المرور غير صحيحة","auth/wrong-password":"البريد أو كلمة المرور غير صحيحة",
 "auth/user-not-found":"البريد أو كلمة المرور غير صحيحة","auth/email-already-in-use":"هذا البريد مسجل بالفعل",
 "auth/weak-password":"كلمة المرور ضعيفة","auth/invalid-email":"بريد غير صالح","auth/too-many-requests":"محاولات كثيرة، انتظر قليلاً",
 "auth/network-request-failed":"مشكلة في الاتصال بالإنترنت"};
const em2=c=>ERR[c]||"حدث خطأ، حاول مرة أخرى";

/* ---------- الدخول / التسجيل ---------- */
window.login=async function(){
  const e=$("er");
  try{await auth.signInWithEmailAndPassword($("em").value.trim().toLowerCase(),$("pw").value);e.style.display="none";$("pw").value=""}
  catch(x){e.style.display="block";e.textContent=em2(x.code)}
};
window.register=async function(){
  const name=$("regName").value.trim(),email=$("regEmail").value.trim().toLowerCase(),pw=$("regPw").value,er=$("regEr");
  const bad=t=>{er.style.display="block";er.textContent=t};
  if(!name||!email||!pw)return bad("اكتب الاسم والبريد وكلمة المرور");
  if(email===ADMIN_EMAIL)return bad("هذا البريد مخصص للأدمن فقط");
  if(pw.length<8)return bad("كلمة المرور 8 أحرف على الأقل");
  try{
    const c=await auth.createUserWithEmailAndPassword(email,pw);
    await c.user.updateProfile({displayName:name});
    sessionStorage.setItem("gd_name",name);personalize();refreshUI();
    await c.user.sendEmailVerification();
    toast("📧 أرسلنا رسالة تفعيل على بريدك. فعّله لتستخدم الذكاء الاصطناعي","success");
  }catch(x){bad(em2(x.code))}
};
window.googleLogin=async function(){
  const p=new firebase.auth.GoogleAuthProvider();
  try{await auth.signInWithPopup(p)}
  catch(x){
    if(["auth/popup-blocked","auth/operation-not-supported-in-this-environment"].includes(x.code))return auth.signInWithRedirect(p);
    if(!["auth/popup-closed-by-user","auth/cancelled-popup-request"].includes(x.code))toast("❌ "+em2(x.code),"error");
  }
};
window.forgot=async function(){
  const e=$("em").value.trim();if(!e)return toast("اكتب بريدك أولاً","warn");
  try{await auth.sendPasswordResetEmail(e);toast("📧 تم إرسال رابط إعادة التعيين","success")}catch(x){toast("❌ "+em2(x.code),"error")}
};
window.logout=async function(){
  await auth.signOut();
  sessionStorage.clear();
  location.reload();
};
/* ---------- بيانات الخطة من الـ Worker ---------- */
async function token(force){
  let u=auth.currentUser;if(!u)throw new Error("سجّل الدخول أولاً");
  if(!u.emailVerified){await u.reload();u=auth.currentUser;if(u.emailVerified)force=true}
  return u.getIdToken(!!force);
}
async function refreshProfile(){
  const u=auth.currentUser;if(!u)return;
  try{
    const r=await fetch(API+"/me",{headers:{Authorization:"Bearer "+await token()}});
    if(!r.ok)return;
    const d=await r.json(),email=(u.email||"").toLowerCase();
    sessionStorage.setItem("gd_role",d.admin?"admin":"user");
    // نسخة للعرض فقط. الصلاحية الحقيقية بتتفحص في السيرفر
    localStorage.setItem("gd_users",JSON.stringify([{name:u.displayName||email.split("@")[0],email,proUntil:d.proUntil||0,trialEnd:d.trialEnd||0}]));
    personalize();refreshUI();
    if(document.getElementById("proM"))showPro("info");
  }catch(e){}
}
document.addEventListener("visibilitychange",()=>{if(!document.hidden)refreshProfile()});

auth.onAuthStateChanged(async u=>{
  if(!u){["auth","role","name","email"].forEach(k=>sessionStorage.removeItem("gd_"+k));localStorage.removeItem("gd_users");gate();return}
  const email=(u.email||"").toLowerCase(),was=sessionStorage.getItem("gd_auth")==="1";
  sessionStorage.setItem("gd_auth","1");sessionStorage.setItem("gd_role","user");
  sessionStorage.setItem("gd_email",email);sessionStorage.setItem("gd_name",u.displayName||email.split("@")[0]);
  gate();
  await refreshProfile();
  was?(personalize(),refreshUI()):afterLogin();
});

/* ---------- كل طلبات الـ AI تمر عبر الـ Worker ---------- */
const _call=window.callAI;
window.callAI=async function(prompt,o={}){
  const key=await token();
  if(!auth.currentUser.emailVerified)throw new Error("فعّل بريدك الإلكتروني أولاً (راجع رسالة التحقق)");
  const model=(o.cfgOverride&&o.cfgOverride.model)||"openai/gpt-oss-120b";
  return _call(prompt,{...o,cfgOverride:{provider:"custom",base:API,model,key,backupKey:"",backupModel:""}});
};
window.aiSettings=()=>toast("الذكاء الاصطناعي يعمل عبر السيرفر الآمن","info");

/* ---------- أكواد الاشتراك ---------- */
async function post(path,data){
  const r=await fetch(API+path,{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+await token()},body:JSON.stringify(data)});
  const j=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(j.error||"فشل");
  return j;
}
window.redeem=async function(id){
  const code=($(id).value||"").trim().toUpperCase();if(!code)return;
  try{
    const r=await post("/redeem",{code});
    document.getElementById("proM")?.remove();
    await refreshProfile();
    toast("🎉 تم تفعيل PRO لمدة "+r.days+" يوم","success");
  }catch(e){toast(e.message==="used"?"❌ الكود مستخدم من قبل":"❌ كود غير صحيح","error")}
};
let shown=[];
window.listCodes=function(){const e=$("cdList");if(e)e.innerHTML=shown.map(x=>`<div>${x.c} — ${x.d} يوم</div>`).join("")||"الأكواد المولّدة بتظهر هنا (وبتتحفظ في D1 ← جدول codes)"};
window.genCodes=async function(){
  try{
    const r=await post("/genCodes",{days:parseInt($("cdDays").value)||30,n:parseInt($("cdN").value)||1});
    shown=r.codes.concat(shown);listCodes();
  }catch(e){toast("❌ "+e.message,"error")}
};
window.adminLogin=function(){
  if(sessionStorage.getItem("gd_role")==="admin"){
    adminAuthed=true;$("adminGate").style.display="none";$("adminPanel").style.display="block";adminLoad();toast("✅ أهلاً في لوحة الأدمن","success");
  }else toast("❌ للأدمن فقط","error");
};

/* ---------- شات الجيوماتكس + الذاكرة المعرفية ---------- */
const norm=s=>s.toLowerCase().replace(/[\u064B-\u065F]/g,"").replace(/[أإآ]/g,"ا").replace(/ة/g,"ه").replace(/ى/g,"ي");
const toks=s=>norm(s).split(/[^\p{L}\p{N}]+/u).filter(w=>w.length>2).map(w=>w.replace(/^(وال|بال|لل|ال)/,""));
async function gisCtx(q){
  const day=new Date().toLocaleDateString("ar-EG",{weekday:"long",year:"numeric",month:"long",day:"numeric"});
  let c=`\n\nتاريخ اليوم: ${day}.\nلو في معلومات حديثة مرتبطة بالجغرافيا أو الجيوماتكس استخدمها، ولو غير مؤكدة قل ذلك ولا تخترع أخباراً.`;
  let kb;try{kb=JSON.parse(localStorage.getItem("gd_kb")||"null")}catch(e){}
  const qt=new Set(toks(q));
  const hits=((kb&&kb.items)||[]).map(it=>({it,m:toks(it.t+" "+it.s).filter(w=>qt.has(w)).length}))
    .filter(x=>x.m>0).sort((a,b)=>b.m-a.m).slice(0,5).map(x=>x.it);
  if(hits.length)c+="\nمن الذاكرة المعرفية:\n"+hits.map(h=>`- [${h.d}] ${h.t}: ${h.s}`).join("\n");
  try{c+=await Promise.race([webCtx(q.slice(0,200)),new Promise(r=>setTimeout(()=>r(""),6000))])}catch(e){}
  return c;
}
window.gisSend=async function(){
  if(isFeaturePro("gis_chat")&&needPro())return;
  const v=$("gisInput").value.trim();if(!v)return;
  $("gisInput").value="";
  addMsg("u",esc(v),"gisChatBox");
  const el=addMsg("a","⏳ جاري البحث الجغرافي...","gisChatBox");
  try{
    const r=await callAIWithRetry(v,{
      sysPrompt:SYS_GIS+await gisCtx(v),tier:"quick",
      onText:({text})=>{el.innerHTML=md(text);$("gisChatBox").scrollTop=1e9}
    });
    el.innerHTML=`<div class="gis-content-text">${md(r.text)}</div>`;
    const b=document.createElement("button");b.className="k";
    b.style.cssText="margin-top:12px;width:100%;display:flex;align-items:center;justify-content:center;gap:8px";
    b.innerHTML="📄 تحميل الإجابة كـ PDF";b.onclick=()=>downloadGISPDF(el);el.appendChild(b);
    $("gisChatBox").scrollTop=1e9;
  }catch(e){el.innerHTML="❌ "+esc(e.message||"خطأ")}
};

/* رابط "نسيت كلمة المرور" تحت زر Google */
const g=document.querySelector("#loginForm button.k");
g&&g.insertAdjacentHTML("afterend",'<a href="#" onclick="forgot();return false" style="color:var(--mt);display:block;margin-top:10px;font-size:12px;text-decoration:none">نسيت كلمة المرور؟</a>');
})();
