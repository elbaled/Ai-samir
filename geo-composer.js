/* GeoDev Composer Patch v1 — بار الشات بتصميم حديث (حاوية مدورة + أيقونات + زر إرسال دائري)
   الاستخدام: ضع <script src="geo-composer.js"></script> بعد geo-docs.js (آخر باتش) */
(function(){
const ta=$('ui');if(!ta||!ta.closest('.row'))return;

/* ---------- CSS (بنفس متغيرات الثيم) ---------- */
const st=document.createElement('style');st.textContent=`
#cmp{position:relative;margin-top:10px;background:var(--bg);border:1px solid var(--ln);border-radius:24px;padding:10px 12px 8px;box-shadow:0 2px 14px rgba(0,0,0,.22);transition:border-color .2s}
#cmp:focus-within{border-color:var(--bl)}
#cmp textarea{width:100%;background:transparent;border:0;outline:0;box-shadow:none;border-radius:0;padding:4px 4px 8px;margin:0;line-height:1.6;min-height:30px;max-height:160px;resize:none;color:var(--tx)}
#cmpTop{display:flex;flex-direction:column}
#ats{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 6px!important}#ats:empty{display:none}#ats .chip{margin:0}
#cmpBar{display:flex;align-items:center;gap:6px}#cmpBar .sp{flex:1}
#cmpL,#cmpR{display:flex;align-items:center;gap:6px}
.ib{width:40px;height:40px;min-height:40px;border-radius:50%;padding:0;background:transparent;border:1px solid var(--ln);color:var(--mt);display:flex;align-items:center;justify-content:center}
.ib:active{background:var(--cd);color:var(--tx)}
.ib svg,#sendBtn svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
#sendBtn{width:42px;height:42px;min-height:42px;border-radius:50%;padding:0;background:var(--bl);color:#fff;display:flex;align-items:center;justify-content:center;transition:background .2s,opacity .2s}
#sendBtn.off{background:var(--ln);color:var(--mt);opacity:.75}
#sendBtn.stop svg{fill:currentColor}
#engChip{height:36px;min-height:36px;border-radius:18px;padding:0 12px;background:transparent;border:1px solid var(--ln);color:var(--mt);font-size:12px;font-weight:700;display:flex;align-items:center;gap:6px}
#engMenu{position:absolute;bottom:calc(100% + 8px);left:0;right:0;background:var(--cd);border:1px solid var(--ln);border-radius:16px;padding:6px;box-shadow:0 8px 28px rgba(0,0,0,.45);display:none;z-index:25}
#engMenu.on{display:block}
#engMenu button{display:flex;width:100%;align-items:center;gap:10px;text-align:right;background:transparent;color:var(--tx);padding:10px 12px;border-radius:12px;font-weight:400;min-height:48px}
#engMenu button.on{background:var(--bg)}
#engMenu b{font-size:13px}#engMenu small{display:block;font-size:11px;color:var(--mt);margin-top:2px}
#fab{display:none!important}`;
document.head.appendChild(st);

/* ---------- بناء الحاوية ونقل العناصر الحالية (بنفس الـ IDs والـ handlers) ---------- */
const S=p=>`<svg viewBox="0 0 24 24">${p}</svg>`;
const ICON={
  plus:S('<path d="M12 5v14M5 12h14"/>'),
  mic:S('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>'),
  img:S('<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="1.5"/><path d="M21 15l-5-5L5 21"/>'),
  up:S('<path d="M12 19V5M5 12l7-7 7 7"/>'),
  stop:S('<rect x="6" y="6" width="12" height="12" rx="2"/>')
};
const row=ta.closest('.row'),host=row.parentNode,cmp=document.createElement('div');
cmp.id='cmp';
cmp.innerHTML='<div id="engMenu"></div><div id="cmpTop"></div><div id="cmpBar"><div id="cmpL"></div><span class="sp"></span><div id="cmpR"></div></div>';
host.insertBefore(cmp,row);
const top=$('cmpTop'),L=$('cmpL'),R=$('cmpR');

const ats0=$('ats');if(ats0)top.appendChild(ats0);
ta.rows=1;ta.placeholder='اسأل عن أي حاجة…';top.appendChild(ta);

const icon=(b,svg,title)=>{if(!b)return;b.className='ib';b.innerHTML=svg;if(title)b.title=title;L.appendChild(b)};
icon(row.querySelector('button[onclick*="fl"]'),ICON.plus,'إرفاق ملف أو صورة');
icon($('genBtn'),ICON.img,'توليد صورة من الوصف');
icon($('mic'),ICON.mic,'إملاء صوتي');
const fl=$('fl');if(fl)cmp.appendChild(fl);

const chip=document.createElement('button');chip.id='engChip';
chip.onclick=e=>{e.stopPropagation();$('engMenu').classList.toggle('on')};
R.appendChild(chip);
const send0=document.createElement('button');send0.id='sendBtn';send0.className='off';send0.innerHTML=ICON.up;send0.title='إرسال';
R.appendChild(send0);
document.addEventListener('click',e=>{if(!e.target.closest('#engMenu'))$('engMenu').classList.remove('on')});
row.remove();$('engBar')?.remove();

/* ---------- منتقي المحرك (renderEng كانت مستدعاة في الصفحة ومش معرّفة) ---------- */
window.renderEng=function(){
  const E=ENGS[eng]||ENGS.g29;
  chip.innerHTML=`<span>${E.n}</span><span style="font-size:10px">▾</span>`;
  $('engMenu').innerHTML=Object.entries(ENGS).map(([k,v])=>{
    const lock=isEnginePro(k)&&!isPro();
    return `<button class="${k==eng?'on':''}" onclick="geoPick('${k}')"><span style="flex:1"><b>${v.n}</b><small>${v.d}</small></span>${lock?'<span class="pro-b" style="position:static">PRO</span>':''}${k==eng?'<span style="color:var(--gr)">✓</span>':''}</button>`}).join('')};
window.geoPick=k=>{$('engMenu').classList.remove('on');pickEng(k)};

/* ---------- سلوك: نمو تلقائي + حالة الإرسال/الإيقاف ---------- */
let busy=false;
const grow=()=>{ta.style.height='auto';ta.style.height=Math.min(ta.scrollHeight,160)+'px'};
const upd=()=>{
  const has=ta.value.trim()||(typeof AT!=='undefined'&&AT.length)||(window.IMGS&&IMGS.length);
  send0.classList.toggle('off',!busy&&!has);send0.classList.toggle('stop',busy);
  send0.innerHTML=busy?ICON.stop:ICON.up;send0.title=busy?'إيقاف':'إرسال'};
send0.onclick=()=>{if(busy){try{ctl&&ctl.abort()}catch(e){}return}send()};
ta.addEventListener('input',()=>{grow();upd()});
let lv=ta.value;setInterval(()=>{if(ta.value!==lv){lv=ta.value;grow();upd()}},250);

const _send=send;send=function(){if(busy)return;const r=_send();grow();upd();return r};
const _ask=ask;ask=function(p,s){busy=true;upd();return Promise.resolve(_ask(p,s)).finally(()=>{busy=false;upd()})};
const _ats=ats;ats=function(){_ats();upd()};

/* زر ✨ تعديل الثيم اتنقل لقايمة ☰ عشان ما يغطيش زر الإرسال */
document.querySelector('#drw .dm')?.insertAdjacentHTML('afterbegin','<button onclick="toggleDrawer();toggleSelfModify()">✨ تعديل الثيم بالـ AI</button>');

try{renderEng()}catch(e){console.warn(e)}
grow();upd();
})();
