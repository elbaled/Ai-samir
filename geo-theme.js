/* GeoDev Claude Theme v1 — ثيم بأسلوب Claude (دافئ: كريمي فاتح / فحمي داكن + لون طيني) مع وضع تلقائي
   الاستخدام: ضع <script src="geo-theme.js"></script> بعد geo-composer.js (آخر باتش) */
(function(){
const MK='gd_mode',VARS=['bg','cd','ln','bl','gr','am','mt','tx'],root=document.documentElement;

const css=document.createElement('style');css.id='claude-theme';
css.textContent=`
:root,:root[data-mode=dark]{--bg:#1F1E1D;--cd:#2B2A27;--ln:#3F3D39;--bl:#CC6847;--gr:#7FB07A;--am:#E0A940;--mt:#A5A298;--tx:#F0EEE6}
:root[data-mode=light]{--bg:#F5F4EE;--cd:#FFFFFF;--ln:#E3E0D5;--bl:#B95635;--gr:#4C7F50;--am:#B7791F;--mt:#6B685F;--tx:#1F1E1D}
header h1{background:none;-webkit-background-clip:initial;background-clip:initial;color:var(--tx)}
.k{background:var(--ln);color:var(--tx)}
nav button.on{background:color-mix(in srgb,var(--bl) 16%,transparent);color:var(--bl)}
.dash-icon,.tri-hint{background:color-mix(in srgb,var(--bl) 12%,transparent)}
#drw .dm button{color:var(--tx)}#drw .dm .r{color:#fff}
#chat,#gisChatBox{background:transparent;box-shadow:none}
.m{border-radius:16px}
.m.a{background:transparent;border-color:transparent}
.m.u{background:var(--ln);border-color:transparent;color:var(--tx)}
.m pre{background:#1F1E1D;border-color:#3F3D39;color:#E6E3D8}
.m pre code{color:#BFE0AE}
.m :not(pre)>code{background:var(--ln);color:var(--tx);padding:1px 6px;border-radius:5px}
.m td,.m th{border-color:var(--ln)}
.card{border-radius:14px}
:root[data-mode=light] .card{box-shadow:0 1px 2px rgba(60,50,30,.06)}
:root[data-mode=light] #cmp{box-shadow:0 2px 10px rgba(60,50,30,.08)}
:root[data-mode=light] .tool-modal{background:rgba(31,30,29,.45)}`;
document.head.appendChild(css);

const getMode=()=>localStorage.getItem(MK)||'auto';
const sys=()=>matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
const LABEL={auto:'المظهر: تلقائي',light:'المظهر: فاتح',dark:'المظهر: داكن'};

function apply(reset){
  const m=getMode(),r=m==='auto'?sys():m;
  if(reset){VARS.forEach(k=>root.style.removeProperty('--'+k));localStorage.removeItem('gd_theme')}
  root.dataset.mode=r;root.style.colorScheme=r;
  document.querySelector('meta[name=color-scheme]')?.setAttribute('content',r);
  let t=document.querySelector('meta[name=theme-color]');
  if(!t){t=document.createElement('meta');t.name='theme-color';document.head.appendChild(t)}
  t.content=getComputedStyle(root).getPropertyValue('--cd').trim()||'#2B2A27';
  const b=document.getElementById('modeBtn');if(b)b.textContent=LABEL[m]}

/* مرة واحدة فقط: شيل الثيم الأخضر القديم المحفوظ عشان الثيم الجديد يبقى الأساسي */
if(!localStorage.getItem('gd_cl')){localStorage.setItem('gd_cl','1');VARS.forEach(k=>root.style.removeProperty('--'+k));localStorage.removeItem('gd_theme')}

window.geoMode=()=>{const o=['auto','light','dark'];localStorage.setItem(MK,o[(o.indexOf(getMode())+1)%3]);apply(true)};
document.querySelector('#drw .dm')?.insertAdjacentHTML('afterbegin','<button id="modeBtn" onclick="geoMode()"></button>');
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{if(getMode()==='auto')apply(false)});

/* زر "افتراضي" في نافذة يرجّع الثيم الأساسي بدل ما يطلب من الـ AI */
const chip=document.querySelector('#selfModModal .chips label:last-child');
if(chip){chip.textContent='الثيم الأساسي';chip.setAttribute('onclick',"$('selfModInput').value='رجوع للثيم الأساسي'")}
const _asm=applySelfModify;
applySelfModify=function(btn){
  if(/رجوع|افتراضي/.test($('selfModInput').value)){apply(true);toast('تمت العودة إلى المظهر الأساسي','success');toggleSelfModify();$('selfModInput').value='';return}
  return _asm(btn)};

apply(false);
})();
