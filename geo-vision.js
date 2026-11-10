/* GeoDev Vision Patch v1 — رفع الصور + تحليلها + توليد الصور + تحليل الخريطة
   الاستخدام: ضع <script src="geo-vision.js"></script> بعد سطر geo-cf.js وقبل سكربت الـ serviceWorker */
(function(){
const VK='gd_vis_cfg',MAXI=3;
const vcfg=()=>{try{return{model:'',genBase:'',genKey:'',genModel:'',...JSON.parse(localStorage.getItem(VK)||'{}')}}catch(e){return{model:'',genBase:'',genKey:'',genModel:''}}};
const VMODEL={groq:'qwen/qwen3.8-27b',openai:'gpt-4o-mini',gemini:'gemini-2.0-flash',openrouter:'google/gemini-2.0-flash-001'};
const clean=t=>t.replace(/<think>[\s\S]*?(<\/think>|$)/g,'').trim();
window.IMGS=[];

/* ---------- ضغط الصورة وتحويلها Base64 ---------- */
function packImg(file,max=1280){return new Promise((ok,no)=>{const r=new FileReader();r.onerror=no;r.onload=()=>{const i=new Image();i.onerror=no;i.onload=()=>{const k=Math.min(1,max/Math.max(i.width,i.height)),c=document.createElement('canvas');c.width=Math.round(i.width*k);c.height=Math.round(i.height*k);const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(i,0,0,c.width,c.height);ok(c.toDataURL('image/jpeg',.85))};i.src=r.result};r.readAsDataURL(file)})}
function addImg(url,n){if(IMGS.length>=MAXI)IMGS.shift();IMGS.push({n,url});ats()}

const _att=attach;
attach=async function(fs){const rest=[];for(const f of fs){if(f.type.startsWith('image/')){try{addImg(await packImg(f),f.name)}catch(e){toast('تعذر قراءة الصورة: '+f.name,'error')}}else rest.push(f)}await _att(rest);ats()};
const _ats=ats;
ats=function(){_ats();$('ats').insertAdjacentHTML('beforeend',IMGS.map((a,i)=>`<span class="chip"><img src="${a.url}" style="width:28px;height:28px;object-fit:cover;border-radius:6px"> ${esc(a.n)} <b onclick="IMGS.splice(${i},1);ats()">×</b></span>`).join(''))};
const _nc=newChat;
newChat=function(){IMGS.length=0;_nc();ats()};

/* ---------- إرسال الصور للموديل (OpenAI-compatible vision) ---------- */
const _call=callAI;
callAI=async function(prompt,o={}){
  const imgs=(o.images&&o.images.length&&typeof o.images[0]==='string')?o.images:(window.__vi||[]);
  const c=o.cfgOverride||getCfg();
  if(!imgs.length||c.provider==='claude')return _call(prompt,o);
  if(!c.key)throw new Error('تحليل الصور يحتاج API Key في إعدادات AI');
  const base=(c.base||PROVIDERS[c.provider].base).replace(/\/$/,''),model=vcfg().model||VMODEL[c.provider]||c.model;
  const content=[{type:'text',text:prompt},...imgs.map(u=>({type:'image_url',image_url:{url:u}}))];
  const res=await fetch(base+'/chat/completions',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+c.key},body:JSON.stringify({model,messages:[{role:'user',content}],stream:true,temperature:.4,max_tokens:parseInt(localStorage.getItem('gd_max_tokens')||'8000')}),signal:o.signal});
  if(res.status===429)throw Object.assign(new Error('rate_limited'),{code:'rate_limited'});
  if(res.status===401)throw new Error('مفتاح مرفوض (401)');
  if(!res.ok){let m='';try{m=(await res.json()).error?.message||''}catch(e){}throw new Error('HTTP '+res.status+(m?' — '+m.slice(0,140):'')+' (موديل الرؤية: '+model+')')}
  const rd=res.body.getReader(),dc=new TextDecoder();let raw='',buf='',tr=false;
  for(;;){const{value,done}=await rd.read();if(done)break;buf+=dc.decode(value,{stream:true});const ls=buf.split('\n');buf=ls.pop();
    for(const l of ls){if(!l.startsWith('data:'))continue;const d=l.slice(5).trim();if(d==='[DONE]')continue;
      try{const j=JSON.parse(d).choices?.[0];if(j?.delta?.content){raw+=j.delta.content;o.onText&&o.onText({text:clean(raw)})}if(j?.finish_reason==='length')tr=true}catch(e){}}}
  return{text:clean(raw),truncated:tr}};

const _ask=ask;
ask=function(p,s){
  const n=IMGS.length;
  if(n){window.__vi=IMGS.map(x=>x.url);p+='\n\n(مرفق '+n+' صورة. حلّلها بدقة: وصف المحتوى، النصوص، الخرائط، الإحداثيات، المعالم. اذكر ما تراه فعلاً فقط ولا تخمّن.)'}
  const pr=_ask(p,s);
  if(n){const u=[...document.querySelectorAll('#chat .m.u')].pop();if(u)u.insertAdjacentHTML('afterbegin',IMGS.map(x=>`<img src="${x.url}" style="max-width:100%;max-height:160px;border-radius:8px;display:block;margin-bottom:6px">`).join(''))}
  return Promise.resolve(pr).finally(()=>{window.__vi=null})};

/* ---------- توليد الصور ---------- */
async function genImage(p){
  const vc=vcfg();let en=p;
  try{const r=await callAIWithRetry('حوّل وصف الصورة التالي إلى prompt إنجليزي تفصيلي (الأسلوب، الإضاءة، التكوين) في سطر واحد فقط بدون أي شرح:\n'+p,{tier:'quick'});const t=(r.text||'').trim();if(t)en=t.slice(0,700)}catch(e){}
  if(vc.genBase&&vc.genKey){
    const r=await fetch(vc.genBase.replace(/\/$/,'')+'/images/generations',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+vc.genKey},body:JSON.stringify({model:vc.genModel,prompt:en,n:1,size:'1024x1024'})});
    if(!r.ok)throw new Error('فشل التوليد HTTP '+r.status);
    const d=(await r.json()).data?.[0];if(!d)throw new Error('رد فارغ من خدمة التوليد');
    return{src:d.b64_json?'data:image/png;base64,'+d.b64_json:d.url,prompt:en}}
  const u='https://image.pollinations.ai/prompt/'+encodeURIComponent(en)+'?model='+(vc.genModel||'flux')+'&width=1024&height=1024&nologo=true&seed='+Math.floor(Math.random()*1e6);
  try{const r=await fetch(u);if(!r.ok)throw 0;return{src:URL.createObjectURL(await r.blob()),prompt:en}}
  catch(e){await new Promise((ok,no)=>{const i=new Image();i.onload=ok;i.onerror=()=>no(new Error('خدمة التوليد المجانية غير متاحة الآن'));i.src=u});return{src:u,prompt:en}}}
async function genFlow(p){
  go('agent');addMsg('u',esc('🎨 '+p));const el=addMsg('a','⏳ جاري توليد الصورة...');
  try{const g=await genImage(p);
    el.innerHTML=`<img src="${g.src}" style="max-width:100%;border-radius:10px;display:block"><div class="row" style="margin-top:8px"><button class="k" onclick="dlGen(this)">⬇️ تحميل</button><button class="k" onclick="useGen(this)">🔍 حلّلها</button></div><div class="mt" style="margin-top:6px;direction:ltr;text-align:left">${esc(g.prompt)}</div>`;
  }catch(e){el.innerHTML='❌ '+esc(e.message||String(e))}
  $('chat').scrollTop=1e9}
window.dlGen=b=>{const i=b.closest('.m').querySelector('img'),a=document.createElement('a');a.href=i.src;a.download='geodev-'+Date.now()+'.png';document.body.appendChild(a);a.click();a.remove()};
window.useGen=async b=>{try{const i=b.closest('.m').querySelector('img');addImg(await packImg(await(await fetch(i.src)).blob()),'generated.jpg');toast('✅ الصورة جاهزة — اسأل عنها','success')}catch(e){toast('تعذر استخدام الصورة','error')}};
window.genBtn=()=>{const v=$('ui').value.trim();if(!v)return toast('اكتب وصف الصورة ثم اضغط 🎨','warn');$('ui').value='';genFlow(v)};

const GEN=/(ارسم|ول+د|اعمل|انشئ|أنشئ|صمم|اصنع|سوي|generate|create|draw|make)\s*(لي|لنا)?\s*(صورة|صوره|لوجو|شعار|بوستر|رسمة|رسمه|image|picture|logo|poster|illustration)/i;
const _send=send;
send=function(){
  const v=$('ui').value.trim();
  if(v&&(GEN.test(v)||/^\s*ارسم/.test(v))){$('ui').value='';return genFlow(v)}
  if(!v&&!AT.length&&IMGS.length){return ask('حلّل الصورة المرفقة بالتفصيل')}
  return _send()};

/* ---------- تحليل الخريطة (لقطة + بيانات مساحية) ---------- */
initMap=function(){
  if(map)return;
  map=L.map('map').setView([28.1099,30.7503],10);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'',crossOrigin:'anonymous'}).addTo(map);
  grp=L.featureGroup().addTo(map);map.on('click',e=>addPt(e.latlng.lat,e.latlng.lng));setTimeout(()=>map.invalidateSize(),200)};
let snapTiles=0;
function snap(withTiles){
  const m=$('map'),W=m.clientWidth,H=m.clientHeight,R=m.getBoundingClientRect(),c=document.createElement('canvas');c.width=W;c.height=H;
  const x=c.getContext('2d'),P=p=>map.latLngToContainerPoint(p);snapTiles=0;
  x.fillStyle='#e5e7eb';x.fillRect(0,0,W,H);
  if(withTiles)m.querySelectorAll('img.leaflet-tile-loaded').forEach(t=>{const r=t.getBoundingClientRect();x.drawImage(t,r.left-R.left,r.top-R.top,r.width,r.height);snapTiles++});
  if(pts.length>1){x.beginPath();pts.forEach((p,i)=>{const q=P(p);i?x.lineTo(q.x,q.y):x.moveTo(q.x,q.y)});if(pts.length>2){x.closePath();x.fillStyle='rgba(245,158,11,.25)';x.fill()}x.strokeStyle='#f59e0b';x.lineWidth=3;x.stroke()}
  pts.forEach((p,i)=>{const q=P(p);x.beginPath();x.arc(q.x,q.y,7,0,7);x.fillStyle='#3b82f6';x.fill();x.strokeStyle='#fff';x.lineWidth=2;x.stroke();x.fillStyle='#000';x.font='bold 13px sans-serif';x.fillText(i+1,q.x+9,q.y-9)});
  return c.toDataURL('image/jpeg',.85)}
function mapInfo(){
  const b=map.getBounds(),cn=map.getCenter();
  let s=`مركز الخريطة: ${cn.lat.toFixed(5)}, ${cn.lng.toFixed(5)} | zoom ${map.getZoom()}\nحدود العرض: S${b.getSouth().toFixed(4)} W${b.getWest().toFixed(4)} N${b.getNorth().toFixed(4)} E${b.getEast().toFixed(4)}\nعدد النقاط: ${pts.length} | الطول: ${$('pl').textContent} | المحيط: ${$('pp').textContent} | المساحة: ${$('pa').textContent}\n`;
  if($('pf').style.display!=='none')s+=$('pf').innerText.replace(/\n/g,' | ')+'\n';
  pts.slice(0,60).forEach((p,i)=>{let u={e:0,n:0},seg='';try{u=utmConv(p[0],p[1])}catch(e){}
    if(i){const q=pts[i-1],a=[q[1],q[0]],z=[p[1],p[0]];seg=` | من السابقة: ${turf.distance(a,z,{units:'meters'}).toFixed(2)}م، انحراف ${((turf.bearing(a,z)+360)%360).toFixed(2)}°`}
    s+=`#${i+1}: ${p[0].toFixed(6)}, ${p[1].toFixed(6)} | UTM E${u.e.toFixed(1)} N${u.n.toFixed(1)}${seg}\n`});
  return s}
window.analyzeMap=function(){
  if(!map)return toast('افتح الخريطة أولاً','warn');
  let url=null;try{url=snap(true)}catch(e){try{url=snap(false)}catch(e2){}}
  IMGS.length=0;if(url)addImg(url,'map.jpg');
  const q=`حلّل لقطة الخريطة المرفقة (من شاشة الرفع المساحي) مع البيانات التالية. ${snapTiles?'اللقطة فيها خلفية الخريطة.':'اللقطة بدون خلفية الخريطة (النقاط والحدود فقط).'}\nاشرح: طبيعة المنطقة (عمران/زراعة/صحراء/مياه/طرق) لو الخلفية ظاهرة، شكل القطعة وأضلاعها ونسبها، أي أخطاء أو ملاحظات مساحية محتملة، واقتراحات (تقسيم، وصول، حدود).\n\n${mapInfo()}`;
  closeTool('map');go('agent');ask(q,'🗺️ تحليل الخريطة الحالية')};

/* ---------- واجهة + إعدادات ---------- */
(function ui(){
  $('mic')?.insertAdjacentHTML('afterend','<button class="k" id="genBtn" title="توليد صورة من الوصف" onclick="genBtn()">🎨</button>');
  document.querySelector('#modal-map .tool-body>.row>span.row')?.insertAdjacentHTML('beforeend','<button class="a" onclick="analyzeMap()">🤖 حلّل</button>');
  $('ui')?.addEventListener('paste',e=>{const fs=[...(e.clipboardData?.files||[])].filter(f=>f.type.startsWith('image/'));if(fs.length){e.preventDefault();attach(fs)}});
  const ch=$('chat');if(ch){ch.addEventListener('dragover',e=>e.preventDefault());ch.addEventListener('drop',e=>{e.preventDefault();attach(e.dataTransfer.files)})}
  const v=vcfg();
  $('adminPanel')?.insertAdjacentHTML('beforeend',`<div class="card"><h3>🖼️ الصور (تحليل + توليد)</h3>
  <div class="mt">موديل الرؤية (فاضي = الافتراضي حسب المزود)</div><input id="vModel" class="c" value="${esc(v.model)}" placeholder="qwen/qwen3.8-27b">
  <div class="mt">توليد الصور: سيبه فاضي لاستخدام Pollinations المجاني، أو اكتب API متوافق مع OpenAI</div>
  <input id="vGBase" class="c" value="${esc(v.genBase)}" placeholder="Base URL مثال: https://api.openai.com/v1">
  <input id="vGKey" class="c" value="${esc(v.genKey)}" placeholder="API Key للتوليد" autocomplete="off">
  <input id="vGModel" class="c" value="${esc(v.genModel)}" placeholder="موديل التوليد (flux / gpt-image-1 ...)">
  <button class="g" style="width:100%" onclick="localStorage.setItem('${VK}',JSON.stringify({model:\$('vModel').value.trim(),genBase:\$('vGBase').value.trim(),genKey:\$('vGKey').value.trim(),genModel:\$('vGModel').value.trim()}));toast('✅ تم الحفظ','success')">💾 حفظ إعدادات الصور</button></div>`);
  ats();
})();
})();
