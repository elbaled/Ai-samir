/* GeoDev Docs Patch v1 — قراءة PDF / Word / Excel وإرسالها للـ AI
   الاستخدام: ضع <script src="geo-docs.js"></script> بعد geo-vision.js */
(function(){
const CDN='https://cdnjs.cloudflare.com/ajax/libs/',MAXC=40000;
const L={};
const load=(k,u)=>L[k]||(L[k]=new Promise((ok,no)=>{const s=document.createElement('script');s.src=u;s.onload=ok;s.onerror=()=>{delete L[k];no(new Error('تعذر تحميل مكتبة '+k+' — تأكد من الإنترنت'))};document.head.appendChild(s)}));

/* PDF: نص + (لو الملف ممسوح ضوئياً أو العربي مقلوب) صور أول 3 صفحات لموديل الرؤية */
async function readPdf(f){
  await load('pdf',CDN+'pdf.js/3.11.174/pdf.min.js');
  pdfjsLib.GlobalWorkerOptions.workerSrc=CDN+'pdf.js/3.11.174/pdf.worker.min.js';
  const d=await pdfjsLib.getDocument({data:await f.arrayBuffer()}).promise,n=Math.min(d.numPages,40);
  let t='';
  for(let i=1;i<=n;i++){const c=await(await d.getPage(i)).getTextContent();t+=`\n--- صفحة ${i} ---\n`+c.items.map(x=>x.str+(x.hasEOL?'\n':' ')).join('')}
  const body=t.replace(/--- صفحة \d+ ---/g,'').trim();
  const weak=body.length<40*n||(body.match(/[\uFB50-\uFEFF]/g)||[]).length>body.length*.2;
  let img=0;
  if(weak){
    for(let i=1;i<=Math.min(3,d.numPages);i++){
      const p=await d.getPage(i),v=p.getViewport({scale:1.5}),c=document.createElement('canvas');c.width=v.width;c.height=v.height;
      await p.render({canvasContext:c.getContext('2d'),viewport:v}).promise;
      while(IMGS.length>=3)IMGS.shift();
      IMGS.push({n:f.name+' ص'+i,url:c.toDataURL('image/jpeg',.8)});img++}
  }
  return{t:t.normalize('NFKC'),note:`${d.numPages} صفحة${d.numPages>n?' (قُرئ أول '+n+')':''}${img?' — أُرفقت أول '+img+' صفحات كصور للتحليل البصري':''}`}}

async function readDocx(f){
  await load('mammoth',CDN+'mammoth/1.6.0/mammoth.browser.min.js');
  return{t:(await mammoth.extractRawText({arrayBuffer:await f.arrayBuffer()})).value,note:'Word'}}

async function readXlsx(f){
  await load('xlsx',CDN+'xlsx/0.18.5/xlsx.full.min.js');
  const wb=XLSX.read(await f.arrayBuffer(),{type:'array'});
  return{t:wb.SheetNames.map(n=>`### ورقة: ${n}\n`+XLSX.utils.sheet_to_csv(wb.Sheets[n]).split('\n').slice(0,300).join('\n')).join('\n\n'),note:wb.SheetNames.length+' ورقة (أول 300 صف لكل ورقة)'}}

const _a=attach;
attach=async function(fs){
  const rest=[];
  for(const f of fs){
    const m=f.name.match(/\.(pdf|docx|xlsx|xls)$/i);
    if(!m){rest.push(f);continue}
    toast('⏳ جاري قراءة '+f.name,'info');
    try{
      const e=m[1].toLowerCase(),r=await(e=='pdf'?readPdf(f):e=='docx'?readDocx(f):readXlsx(f));
      if(!r.t.trim()&&!IMGS.length)throw new Error('لا يوجد نص قابل للقراءة');
      AT.push({n:f.name,t:r.t.slice(0,MAXC)});
      toast('✅ '+f.name+' — '+r.note,'success');
    }catch(err){toast('❌ '+f.name+': '+(err.message||err),'error')}
  }
  await _a(rest);ats()};

const fl=$('fl');if(fl)fl.accept+=',.pdf,.docx,.xlsx,.xls';
})();
