/* Аудит полноты раскрытия тем. */
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.join(__dirname,'..'),cdir=path.join(root,'content');
const data={modules:[],topics:[],tasks:[],questions:[],glossary:[]};
const QA={data,defineModule:m=>data.modules.push(m),defineTopic:t=>data.topics.push(t),
 defineTask:t=>data.tasks.push(t),defineQuestion:q=>data.questions.push(q),
 defineGlossary:l=>l.forEach(g=>data.glossary.push(g))};
const sb={QA,console};sb.window=sb;vm.createContext(sb);
for(const f of fs.readdirSync(cdir).filter(f=>f.endsWith('.js')).sort()){
 try{vm.runInContext(fs.readFileSync(path.join(cdir,f),'utf8'),sb,{filename:f});}
 catch(e){console.log('LOAD FAIL',f,e.message);}
}
const len=s=>typeof s==='string'?s.length:0;
const mods=data.modules.map(m=>m.id);
function row(label,val){return label.padEnd(10)+val;}
let thin=[];
console.log('МОДУЛЬ | тем | задач | вопр | ср.теория | ср.ответ | нет answer | нет checklist | нет sources | нет asked');
for(const m of data.modules){
 const ts=data.topics.filter(t=>t.moduleId===m.id);
 const tasks=data.tasks.filter(t=>t.moduleId===m.id);
 const qs=data.questions.filter(q=>q.moduleId===m.id);
 const avgTh=Math.round(ts.reduce((a,t)=>a+len(t.theory),0)/(ts.length||1));
 const avgAns=Math.round(ts.reduce((a,t)=>a+len(t.answer),0)/(ts.length||1));
 const noAns=ts.filter(t=>!t.answer).length;
 const noChk=ts.filter(t=>!t.checklist).length;
 const noSrc=ts.filter(t=>!t.sources).length;
 const noAsk=ts.filter(t=>!t.asked||!t.asked.length).length;
 console.log(m.code.padEnd(5)+'| '+String(ts.length).padStart(3)+' | '+String(tasks.length).padStart(4)+'  | '+String(qs.length).padStart(3)+'  | '+String(avgTh).padStart(8)+'  | '+String(avgAns).padStart(7)+'  | '+String(noAns).padStart(9)+'  | '+String(noChk).padStart(12)+'  | '+String(noSrc).padStart(10)+'  | '+noAsk);
 for(const t of ts){
   const flags=[];
   if(len(t.theory)<450)flags.push('теория '+len(t.theory));
   if(!t.answer)flags.push('нет answer');
   if(!t.mistake)flags.push('нет mistake');
   if(!t.checklist)flags.push('нет checklist');
   if(!t.asked||!t.asked.length)flags.push('нет asked');
   if(flags.length)thin.push(m.code+' '+t.id+' "'+t.title+'": '+flags.join(', '));
 }
}
console.log('\n=== модули без задач/с малым числом задач ===');
for(const m of data.modules){const n=data.tasks.filter(t=>t.moduleId===m.id).length; if(n<3)console.log(m.code+': задач '+n);}
console.log('\n=== темы без практики (нет ни одной задачи с этим topicId) ===');
const withTask=new Set(data.tasks.map(t=>t.topicId).filter(Boolean));
let noPr=0; for(const t of data.topics) if(!withTask.has(t.id)) noPr++;
console.log('тем без прикреплённой задачи: '+noPr+' из '+data.topics.length);
console.log('\n=== ТОНКИЕ ТЕМЫ (теория<450 или нет ключевых полей): '+thin.length+' ===');
thin.forEach(x=>console.log(' - '+x));
console.log('\n=== распределение длины теории ===');
const buckets={'<450':0,'450-800':0,'800-1500':0,'1500-3000':0,'>3000':0};
for(const t of data.topics){const l=len(t.theory); if(l<450)buckets['<450']++;else if(l<800)buckets['450-800']++;else if(l<1500)buckets['800-1500']++;else if(l<3000)buckets['1500-3000']++;else buckets['>3000']++;}
console.log(JSON.stringify(buckets));
