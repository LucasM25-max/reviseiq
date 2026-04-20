import React, { useState, useEffect, useRef, useCallback } from "react";
import { DiagramRenderer, C, I, B, tx, mu, ALL_SUBJECTS } from "./uiPrimitives.js";
import { ContentBlock, MD, AnnotatedImage, QuestionFigure, ProgressiveDiagram, ConceptMap } from "./commonComponents.jsx";
import { uid, stripHtml, updateAdaptiveLevel, updateLadderLevel } from "./learningCore.js";
import { 
  aiServiceMisconceptionExtractor, 
  callGeminiSimple, 
  callAI, 
  aiServiceQuestionGenerator, 
  aiServiceFeedbackRubric, 
  _aiWithRetry, 
  _parseAIJson,
  pickTutorModel,
  incTutorUsage,
  buildTutorSystemPrompt,
  _aiRequest
} from "./aiServices.js";

// Global utilities used by these screens
export const GRADES = ["U","1","2","3","4","5","6","7","8","9"];
export const pctToGrade = pct => pct>=90?"9":pct>=80?"8":pct>=70?"7":pct>=60?"6":pct>=50?"5":pct>=40?"4":pct>=30?"3":pct>=20?"2":pct>=10?"1":"U";
export const gradeColor = g => ({9:"#7c3aed",8:"#2563eb",7:"#0891b2",6:"#16a34a",5:"#65a30d",4:"#ca8a04",3:"#d97706",2:"#ea580c",1:"#dc2626",U:"#9ca3af"})[g]||"#9ca3af";

export async function blurtAnalyse(notesText, blurtText) {
  return aiServiceMisconceptionExtractor(notesText, blurtText);
}

// ─── BLURTING SCREEN ────────────────────────────────────────────────────────
export function BlurtingScreen({D,subjects,allSections,initSubjId,initSecId,onBack}) {
  const [bSubj,setBSubj] = useState(initSubjId||subjects[0]?.id||"");
  const [bSec, setBSec]  = useState(initSecId||"");
  const [blurt,setBlurt] = useState("");
  const [res,  setRes]   = useState(null);
  const [busy, setBusy]  = useState(false);
  const [err,  setErr]   = useState("");
  const secList = allSections.filter(s=>s.subjectId===bSubj);
  const sec = allSections.find(s=>s.id===bSec);
  const notesText=(sec?.notes||[]).map(n=>`## ${n.heading}\n${stripHtml(n.body)}`).join("\n\n")||"(no notes)";
  const canSubmit=blurt.trim().split(/\s+/).filter(Boolean).length>=10&&bSubj;
  const Lbl=t=><label style={{fontSize:11,fontWeight:600,color:mu(D),display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.05em"}}>{t}</label>;
  const submit=async()=>{
    if(!canSubmit||busy)return;
    setBusy(true);setErr("");setRes(null);
    try{setRes(await blurtAnalyse(notesText,blurt));}
    catch(e){setErr("AI analysis unavailable — please try again.");}
    setBusy(false);
  };
  const reset=()=>{setBlurt("");setRes(null);setErr("");};
  return (
    <div style={{minHeight:"100vh",background:D?"#0f1117":"#f9fafb",color:tx(D)}} className="fade-in">
      <div style={{maxWidth:760,margin:"0 auto",padding:"32px 24px"}}>
        <button onClick={onBack} style={{fontSize:13,color:mu(D),background:"none",border:"none",cursor:"pointer",marginBottom:20}}>← Back</button>
        <div style={{marginBottom:22}}>
          <h2 style={{fontSize:22,fontWeight:700,marginBottom:4}}>🧠 Blurting Tool</h2>
          <p style={{fontSize:13,color:mu(D)}}>Write everything you remember — AI reveals your gaps.</p>
        </div>
        <div style={{padding:"12px 16px",borderRadius:12,background:D?"rgba(99,102,241,0.08)":"#f0f9ff",border:"1px solid #6366f1",marginBottom:20,fontSize:12,color:D?"#c7d2fe":"#1e40af",lineHeight:1.65}}>
          💡 <strong>How it works:</strong> Close your notes. Select a topic. Write down <em>everything</em> you can recall — key terms, processes, dates, equations. Don't look anything up. ReviseIQ AI will compare your recall to your notes and pinpoint exactly what to revise.
        </div>
        {!res&&<div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div>{Lbl("Subject")}<select style={I(D)} value={bSubj} onChange={e=>{setBSubj(e.target.value);setBSec("");setRes(null);}}>
              {subjects.map(s=><option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
            </select></div>
            <div>{Lbl("Topic / Section")}<select style={I(D)} value={bSec} onChange={e=>{setBSec(e.target.value);setRes(null);}}>
              <option value="">— Select section (optional) —</option>
              {secList.map(s=><option key={s.id} value={s.id}>{s.title}</option>)}
            </select></div>
          </div>
          {bSec&&sec&&!(sec.notes||[]).length&&<div style={{padding:"9px 13px",borderRadius:9,background:D?"#1e2537":"#fffbeb",border:`1px solid ${D?"#374151":"#fde68a"}`,fontSize:12,color:D?"#fcd34d":"#92400e"}}>⚠️ No notes in this section — AI will still assess your recall but with less accuracy.</div>}
          <div>
            {Lbl("Your blurt — write everything from memory")}
            <textarea value={blurt} onChange={e=>setBlurt(e.target.value)} rows={13}
              placeholder={bSec?`Write down everything you remember about "${sec?.title}"…`:"Select a topic above, then start writing everything you know…"}
              style={{...I(D,{resize:"vertical",lineHeight:1.75})}}/>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
              <span style={{fontSize:11,color:blurt.trim().split(/\s+/).filter(Boolean).length<10?mu(D):"#16a34a"}}>{blurt.trim().split(/\s+/).filter(Boolean).length} words{blurt.trim().split(/\s+/).filter(Boolean).length<10?" (write at least 10)":""}</span>
              {blurt&&<button onClick={reset} style={{fontSize:11,color:mu(D),background:"none",border:"none",cursor:"pointer"}}>Clear</button>}
            </div>
          </div>
          {err&&<p style={{fontSize:12,color:"#ef4444"}}>{err}</p>}
          <button onClick={submit} disabled={!canSubmit||busy}
            style={{...B("#6366f1",false,{padding:"12px 0",fontSize:14,fontWeight:700,width:"100%",opacity:(!canSubmit||busy)?0.4:1,cursor:(!canSubmit||busy)?"not-allowed":"pointer"})}}>
            {busy?"⏳ Analysing your recall…":"Check What I Remembered →"}
          </button>
        </div>}
        {res&&<div className="fade-in" style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{...C(D),padding:22,textAlign:"center",borderColor:res.score>=70?"#16a34a":res.score>=40?"#f59e0b":"#ef4444",borderWidth:2}}>
            <div style={{fontSize:56,fontWeight:800,color:res.score>=70?"#16a34a":res.score>=40?"#d97706":"#ef4444",marginBottom:6}}>{res.score}%</div>
            <div style={{fontSize:15,fontWeight:600,marginBottom:10}}>{res.score>=80?"Excellent recall! 🎉":res.score>=60?"Good effort — a few gaps to fill":res.score>=40?"Keep practising — several areas to review":"Needs work — lots to consolidate"}</div>
            <p style={{fontSize:13,color:mu(D),lineHeight:1.65,maxWidth:500,margin:"0 auto"}}>{res.feedback}</p>
          </div>
          {res.misconceptions&&res.misconceptions.length>0&&(
            <div style={{padding:"14px 16px",borderRadius:12,background:D?"rgba(239,68,68,.1)":"#fef2f2",border:"2px solid #ef4444"}}>
              <p style={{fontWeight:700,color:"#dc2626",marginBottom:8,fontSize:13}}>⚠️ Misconceptions Detected ({res.misconceptions.length}) — fix these first!</p>
              {res.misconceptions.map((p,i)=><div key={i} style={{fontSize:12,lineHeight:1.65,padding:"5px 0",borderBottom:`1px solid ${D?"rgba(239,68,68,.2)":"#fee2e2"}`,color:D?"#fca5a5":"#b91c1c",display:"flex",gap:6}}>
                <span style={{flexShrink:0}}>✗</span><span>{p}</span>
              </div>)}
            </div>
          )}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            {res.remembered?.length>0&&<div style={{...C(D),padding:16}}>
              <p style={{fontWeight:700,color:"#16a34a",marginBottom:10,fontSize:13}}>✓ Remembered ({res.remembered.length})</p>
              {res.remembered.map((p,i)=><div key={i} style={{fontSize:12,lineHeight:1.6,padding:"3px 0",borderBottom:`1px solid ${D?"#1e2537":"#f3f4f6"}`,color:tx(D)}}>{p}</div>)}
            </div>}
            {res.missed?.length>0&&<div style={{...C(D),padding:16}}>
              <p style={{fontWeight:700,color:"#ef4444",marginBottom:10,fontSize:13}}>✗ Missed ({res.missed.length})</p>
              {res.missed.map((p,i)=><div key={i} style={{fontSize:12,lineHeight:1.6,padding:"3px 0",borderBottom:`1px solid ${D?"#1e2537":"#f3f4f6"}`,color:tx(D)}}>{p}</div>)}
            </div>}
          </div>
          {res.partial?.length>0&&<div style={{...C(D),padding:16}}>
            <p style={{fontWeight:700,color:"#d97706",marginBottom:8,fontSize:13}}>◑ Partially recalled ({res.partial.length})</p>
            <div style={{display:"flex",flexDirection:"column",gap:3}}>{res.partial.map((p,i)=><div key={i} style={{fontSize:12,lineHeight:1.6,color:tx(D)}}>{p}</div>)}</div>
          </div>}
          <div style={{display:"flex",gap:10}}>
            <button onClick={reset} style={{flex:2,...B("#6366f1",false,{padding:"11px 0",fontSize:13,fontWeight:700})}}>Try Again</button>
            <button onClick={()=>{setBSec("");setRes(null);setBlurt("");}} style={{flex:1,...B("transparent",true,{padding:"11px 0",fontSize:13,borderColor:D?"#374151":"#d1d5db",color:mu(D)})}}>Different Topic</button>
          </div>
        </div>}
      </div>
    </div>
  );
}

// ─── TIMETABLE SCREEN ───────────────────────────────────────────────────────
export const ACT_DEFS = {
  flashcards:{ icon:"🃏", label:"SM-2 Flashcard Review", navTab:"flashcards", tip:"Spaced repetition (Ebbinghaus, 1885; Cepeda et al., 2006) is the single most efficient revision method.", goal:"Review all due flashcards using the SM-2 Again/Hard/Good/Easy buttons" },
  blurting:  { icon:"🧠", label:"Blurting Exercise", navTab:null, tip:"Free recall forces retrieval and reveals knowledge gaps more effectively than passive re-reading (Karpicke & Roediger, 2008).", goal:"Open the Blurting tool, write everything you know from memory, then review what you missed" },
  questions: { icon:"✏️", label:"Exam Practice Questions", navTab:"questions", tip:"Practice testing improves long-term retention by up to 50% compared to re-reading (Roediger & Karpicke, 2006).", goal:"Attempt all questions without looking at notes, then review mark schemes for missed points" },
  notes:     { icon:"📖", label:"Active Note Review", navTab:"notes", tip:"Passive re-reading has negligible effect on retention. Instead: pause after each heading, cover the notes, and recite key points aloud.", goal:"Read each section of notes, then cover and recite at least 3 key points per heading from memory" },
  target:    { icon:"🎯", label:"Target Test", navTab:null, tip:"Interleaved practice produces superior long-term retention vs. blocked revision (Taylor & Rohrer, 2010).", goal:"Complete a Target Test session focusing on your weakest areas for this subject" },
};

export function TimetableScreen({D, subjects, allSections, user, stats, onNav, onBack}) {
  const [tab,setTab]           = useState("exams");
  const [exams,setExams]       = useState([]);
  const [sessions,setSessions] = useState([]);
  const [goalMet,setGoalMet]   = useState({});
  const [loaded,setLoaded]     = useState(false);
  const [expanded,setExpanded] = useState({});
  const [eSubj,setESubj]       = useState(subjects[0]?.id||"");
  const [eSec,setESec]         = useState("");
  const [eDate,setEDate]       = useState("");
  const [eLabel,setELabel]     = useState("");
  const [schoolTT,setSchoolTT] = useState({
    startTime:"08:30", endTime:"15:30",
    days:[1,2,3,4,5], 
    events:[] 
  });
  const [newEvTitle,setNewEvTitle]     = useState("");
  const [newEvDay,setNewEvDay]         = useState(1);
  const [newEvStart,setNewEvStart]     = useState("09:00");
  const [newEvEnd,setNewEvEnd]         = useState("10:00");
  const saveRef=useRef(null);
  const Lbl=t=><label style={{fontSize:11,fontWeight:600,color:mu(D),display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.05em"}}>{t}</label>;
  const bd2=D?"#2a3347":"#e5e7eb";
  const today=new Date().toISOString().slice(0,10);
  const secList=allSections.filter(s=>s.subjectId===eSubj);
  const DAY_NAMES=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  useEffect(()=>{
    (async()=>{
      try{
        const r=await window.storage.get("gcse:timetable:"+(user||"anon"));
        if(r?.value){const d=JSON.parse(r.value);if(d.exams)setExams(d.exams);if(d.sessions)setSessions(d.sessions);if(d.goalMet)setGoalMet(d.goalMet);if(d.schoolTT)setSchoolTT(d.schoolTT);}
      }catch(_){}
      setLoaded(true);
    })();
  },[]);

  useEffect(()=>{
    if(!loaded)return;
    clearTimeout(saveRef.current);
    saveRef.current=setTimeout(()=>{
      window.storage.set("gcse:timetable:"+(user||"anon"),JSON.stringify({exams,sessions,goalMet,schoolTT})).catch(()=>{});
    },500);
    return ()=>clearTimeout(saveRef.current);
  },[exams,sessions,goalMet,schoolTT,loaded]);

  const addExam=()=>{
    if(!eDate||!eSubj)return;
    const subj=subjects.find(s=>s.id===eSubj);
    const sec=allSections.find(s=>s.id===eSec);
    const label=eLabel||(sec?`${subj?.icon} ${sec.title}`:`${subj?.icon} ${subj?.name}`);
    setExams(p=>[...p,{id:uid(),subjectId:eSubj,sectionId:eSec||null,date:eDate,label}]);
    setEDate("");setELabel("");setESec("");setSessions([]);
  };
  const removeExam=id=>{setExams(p=>p.filter(e=>e.id!==id));setSessions([]);setGoalMet({});};
  const toggleGoal=k=>setGoalMet(p=>({...p,[k]:!p[k]}));
  const toggleExp=id=>setExpanded(p=>({...p,[id]:!p[id]}));
  const sessionDone=s=>s.activities.every((_,ai)=>goalMet[`${s.id}_${ai}`]);
  const fmtD=d=>{const dt=new Date(d+"T12:00:00");return dt.toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short"});};

  const toMins=t=>{const[h,m]=t.split(":").map(Number);return h*60+m;};
  const fromMins=m=>{const h=Math.floor(m/60);const mn=m%60;return `${String(h).padStart(2,"0")}:${String(mn).padStart(2,"0")}`;};

  const getFreeSlots=(date, existingOnDay)=>{
    const dow=date.getDay();
    const isSchoolDay=schoolTT.days.includes(dow);
    const schoolStart=toMins(schoolTT.startTime);
    const schoolEnd=toMins(schoolTT.endTime);
    const candidates=[];
    for(let m=7*60;m+45<=schoolStart&&m+45<=8*60+30;m+=30) candidates.push(m);
    if(isSchoolDay&&schoolEnd>13*60+15) candidates.push(12*60+30);
    const afterStart=isSchoolDay?schoolEnd:15*60;
    for(let m=afterStart;m+45<=21*60;m+=45) candidates.push(m);
    if(!isSchoolDay){
      for(let m=9*60;m+45<=12*60;m+=45) candidates.push(m);
    }
    const blockedRanges=isSchoolDay
      ?[{s:schoolStart,e:schoolEnd},...(schoolTT.events||[]).filter(ev=>ev.day===dow).map(ev=>({s:toMins(ev.startTime),e:toMins(ev.endTime)}))]
      :[];
    const occupiedRanges=(existingOnDay||[]).map(s=>({s:toMins(s.startTime),e:toMins(s.endTime)+45}));

    return candidates
      .filter(m=>{
        const end=m+45;
        for(const r of [...blockedRanges,...occupiedRanges]){
          if(m<r.e&&end>r.s) return false;
        }
        return true;
      })
      .map(m=>({start:fromMins(m),end:fromMins(m+45)}));
  };

  const getWeakSections=(subjectId, sectionPool)=>{
    const weakQ=stats?.weakQ||{};
    const scored=sectionPool.map(sec=>{
      const qs=weakQ[sec.id];
      const pct=qs&&qs.t>0?qs.s/qs.t:null;
      return {sec,pct};
    });
    const withData=scored.filter(x=>x.pct!==null).sort((a,b)=>a.pct-b.pct);
    const withoutData=scored.filter(x=>x.pct===null);
    return [...withData,...withoutData].map(x=>x.sec);
  };

  const generate=()=>{
    if(!exams.length)return;
    const now=new Date();now.setHours(0,0,0,0);
    const sorted=[...exams].filter(e=>new Date(e.date+"T00:00:00")>now).sort((a,b)=>a.date.localeCompare(b.date));
    const allSess=[];
    const sessPerDay={};

    sorted.forEach(exam=>{
      const examDt=new Date(exam.date+"T00:00:00");examDt.setHours(0,0,0,0);
      const daysLeft=Math.round((examDt-now)/86400000);
      if(daysLeft<=0)return;
      const subj=subjects.find(s=>s.id===exam.subjectId);if(!subj)return;
      const pool=exam.sectionId?allSections.filter(s=>s.id===exam.sectionId):allSections.filter(s=>s.subjectId===exam.subjectId);
      const fallback=[{id:null,title:subj.name,flashcards:[],questions:[],notes:[],subjectId:exam.subjectId}];
      const rawPool=pool.length?pool:fallback;
      const secs=getWeakSections(exam.subjectId,rawPool);

      const gap=daysLeft<=7?1:daysLeft<=14?2:daysLeft<=30?3:5;
      const dates=[];
      for(let d=0;d<daysLeft&&dates.length<35;d+=gap){const dt=new Date(now);dt.setDate(dt.getDate()+d);dates.push(dt);}
      const db=new Date(examDt);db.setDate(db.getDate()-1);
      if(db>now&&!dates.find(d=>d.toISOString().slice(0,10)===db.toISOString().slice(0,10)))dates.push(db);
      dates.sort((a,b)=>a-b);

      dates.forEach((date,di)=>{
        const dateStr=date.toISOString().slice(0,10);
        const existing=sessPerDay[dateStr]||[];
        const slots=getFreeSlots(date,existing);
        if(!slots.length)return; 
        const slot=slots[0]; 

        const sec=secs[di%secs.length];
        const hasFC=(sec.flashcards||[]).length>0;
        const hasQ=(sec.questions||[]).length>0;
        const hasN=(sec.notes||[]).length>0;
        const isLast=di>=dates.length-2;

        const weakQ=stats?.weakQ||{};
        const qs=weakQ[sec.id];
        const pct=qs&&qs.t>0?Math.round((qs.s/qs.t)*100):null;
        const weakWarning=pct!==null&&pct<60?` ⚠️ You scored ${pct}% on this topic — prioritise it!`:"";

        const acts=[];
        if(hasFC)acts.push({...ACT_DEFS.flashcards,navType:"section",sectionId:sec.id,subjectId:exam.subjectId,
          tip:`Review flashcards for "${sec.title}".${weakWarning} Try to recall each answer before flipping.`,
          goal:`Complete all flashcards for "${sec.title}" — aim for 80%+ confidence`});
        else acts.push({...ACT_DEFS.blurting,navType:"blurt",sectionId:sec.id,subjectId:exam.subjectId,
          tip:`Blurting for "${sec.title}".${weakWarning} Write down everything you know from memory, then check your notes.`,
          goal:`Fill at least one page blurting "${sec.title}" from memory`});
        if(di%3===0&&hasQ) acts.push({...ACT_DEFS.questions,navType:"section",sectionId:sec.id,subjectId:exam.subjectId,
          tip:`Practice questions on "${sec.title}".${weakWarning} Focus on past-paper style questions.`,
          goal:`Score 70%+ on practice questions for "${sec.title}"`});
        else if(di%3===1) acts.push({...ACT_DEFS.blurting,navType:"blurt",sectionId:sec.id,subjectId:exam.subjectId,
          tip:`Second blurting pass for "${sec.title}".${weakWarning} Compare with your first attempt.`,
          goal:`Identify 3+ things you missed in your first blurting session for "${sec.title}"`});
        else if(hasN) acts.push({...ACT_DEFS.notes,navType:"section",sectionId:sec.id,subjectId:exam.subjectId,
          tip:`Review revision notes for "${sec.title}".${weakWarning} Annotate key terms and definitions.`,
          goal:`Read and annotate all notes for "${sec.title}"`});
        else if(hasQ) acts.push({...ACT_DEFS.questions,navType:"section",sectionId:sec.id,subjectId:exam.subjectId,
          tip:`Practice questions on "${sec.title}".${weakWarning}`,
          goal:`Score 70%+ on questions for "${sec.title}"`});
        if(isLast)acts.push({...ACT_DEFS.target,navType:"target",subjectId:exam.subjectId,sectionId:null,
          tip:`Final exam-style test on ${subj.name}. Test yourself under timed conditions.`,
          goal:`Complete a full Target Test for ${subj.name} — treat it like the real exam`});

        const sess={id:`s${uid()}`,examId:exam.id,date:dateStr,startTime:slot.start,endTime:slot.end,subjectId:exam.subjectId,sectionId:sec.id,topicLabel:sec.title,activities:acts};
        allSess.push(sess);
        sessPerDay[dateStr]=[...(sessPerDay[dateStr]||[]),sess];
      });
    });
    allSess.sort((a,b)=>a.date.localeCompare(b.date)||a.startTime.localeCompare(b.startTime));
    setSessions(allSess);setGoalMet({});
  };

  const grouped={};
  sessions.forEach(s=>{(grouped[s.date]||(grouped[s.date]=[])).push(s);});
  const days=Object.keys(grouped).sort();
  const totalS=sessions.length, doneS=sessions.filter(s=>sessionDone(s)).length;

  return (
    <div style={{minHeight:"100vh",background:D?"#0f1117":"#f9fafb",color:tx(D)}} className="fade-in">
      <div style={{maxWidth:900,margin:"0 auto",padding:"32px 24px"}}>
        <button onClick={onBack} style={{fontSize:13,color:mu(D),background:"none",border:"none",cursor:"pointer",marginBottom:20}}>← Back</button>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12,marginBottom:20}}>
          <div><h2 style={{fontSize:22,fontWeight:700,marginBottom:4}}>📅 Revision Timetable</h2>
            <p style={{fontSize:13,color:mu(D)}}>Add your exam dates — we'll build a spaced revision plan around your school day.</p></div>
          {totalS>0&&<div style={{fontSize:13,fontWeight:600,color:doneS===totalS?"#16a34a":"#6366f1",padding:"6px 14px",borderRadius:20,background:doneS===totalS?(D?"rgba(22,163,74,0.15)":"#dcfce7"):(D?"rgba(99,102,241,0.15)":"#eef2ff")}}>
            {doneS}/{totalS} sessions done
          </div>}
        </div>

        <div style={{display:"flex",borderBottom:`1px solid ${bd2}`,marginBottom:22,gap:2}}>
          {[["exams","📋 My Exams"],["school","🏫 School Day"],["schedule","📅 Schedule"]].map(([t,lbl])=>(
            <button key={t} onClick={()=>{if(t==="schedule"&&!sessions.length&&exams.length)generate();setTab(t);}}
              style={{padding:"10px 18px",fontSize:13,fontWeight:tab===t?600:400,color:tab===t?"#6366f1":mu(D),background:"none",border:"none",cursor:"pointer",borderBottom:tab===t?"2px solid #6366f1":"2px solid transparent",marginBottom:-1}}>
              {lbl}{t==="schedule"&&exams.length>0&&!sessions.length?<span style={{marginLeft:5,fontSize:10,color:"#f59e0b"}}>⚠ not generated</span>:""}
            </button>
          ))}
        </div>

        {tab==="school"&&<div className="fade-in">
          <div style={{...C(D),padding:22,marginBottom:16}}>
            <h3 style={{fontWeight:700,fontSize:15,marginBottom:4}}>🏫 School Day Settings</h3>
            <p style={{fontSize:12,color:mu(D),marginBottom:16}}>Set your school hours so revision sessions are only placed outside them.</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
              <div>{Lbl("School Start")}<input type="time" style={I(D)} value={schoolTT.startTime} onChange={e=>setSchoolTT(p=>({...p,startTime:e.target.value}))}/></div>
              <div>{Lbl("School End")}<input type="time" style={I(D)} value={schoolTT.endTime} onChange={e=>setSchoolTT(p=>({...p,endTime:e.target.value}))}/></div>
            </div>
            <div style={{marginBottom:16}}>
              {Lbl("School Days")}
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {[1,2,3,4,5,6,0].map(d=>{
                  const on=schoolTT.days.includes(d);
                  return <button key={d} onClick={()=>setSchoolTT(p=>({...p,days:on?p.days.filter(x=>x!==d):[...p.days,d].sort()}))}
                    style={{padding:"5px 12px",borderRadius:8,border:`1.5px solid ${on?"#6366f1":bd2}`,background:on?"#6366f1":"transparent",color:on?"#fff":mu(D),fontSize:12,cursor:"pointer",fontWeight:on?600:400}}>
                    {DAY_NAMES[d]}
                  </button>;
                })}
              </div>
            </div>
            <p style={{fontSize:11,color:mu(D),marginBottom:12}}>Optionally add specific lessons or activities that should be kept free (e.g. sports, clubs, lessons with extra study):</p>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"flex-end",marginBottom:12}}>
              <div style={{flex:2,minWidth:120}}>{Lbl("Event name")}<input style={I(D)} placeholder="e.g. Football training" value={newEvTitle} onChange={e=>setNewEvTitle(e.target.value)}/></div>
              <div>{Lbl("Day")}<select style={I(D)} value={newEvDay} onChange={e=>setNewEvDay(Number(e.target.value))}>
                {[1,2,3,4,5,6,0].map(d=><option key={d} value={d}>{DAY_NAMES[d]}</option>)}
              </select></div>
              <div>{Lbl("Start")}<input type="time" style={I(D)} value={newEvStart} onChange={e=>setNewEvStart(e.target.value)}/></div>
              <div>{Lbl("End")}<input type="time" style={I(D)} value={newEvEnd} onChange={e=>setNewEvEnd(e.target.value)}/></div>
              <button onClick={()=>{if(!newEvTitle.trim())return;setSchoolTT(p=>({...p,events:[...p.events,{id:uid(),title:newEvTitle.trim(),day:newEvDay,startTime:newEvStart,endTime:newEvEnd}]}));setNewEvTitle("");}}
                style={{...B("#6366f1",false,{padding:"9px 16px",fontSize:12,fontWeight:700,alignSelf:"flex-end"})}}>+ Add</button>
            </div>
            {(schoolTT.events||[]).length>0&&(
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {schoolTT.events.map(ev=>(
                  <div key={ev.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:8,background:D?"#1e2537":"#f3f4f6"}}>
                    <span style={{fontSize:12,fontWeight:600,color:tx(D),flex:1}}>{ev.title}</span>
                    <span style={{fontSize:11,color:mu(D)}}>{DAY_NAMES[ev.day]} {ev.startTime}–{ev.endTime}</span>
                    <button onClick={()=>setSchoolTT(p=>({...p,events:p.events.filter(e=>e.id!==ev.id)}))} style={{background:"none",border:"none",cursor:"pointer",color:"#ef4444",fontSize:14}}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button onClick={()=>setTab("exams")} style={{...B("#6366f1",false,{width:"100%",padding:"11px 0",fontSize:13,fontWeight:700})}}>← Back to Exams</button>
        </div>}

        {tab==="exams"&&<div className="fade-in">
          <div style={{...C(D),padding:22,marginBottom:16}}>
            <h3 style={{fontWeight:700,fontSize:15,marginBottom:16}}>Add an Exam Date</h3>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
              <div>{Lbl("Subject")}<select style={I(D)} value={eSubj} onChange={e=>{setESubj(e.target.value);setESec("");}}>
                {subjects.map(s=><option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
              </select></div>
              <div>{Lbl("Exam Date")}<input type="date" style={I(D)} value={eDate} min={today} onChange={e=>setEDate(e.target.value)}/></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
              <div>{Lbl("Topic / Section (optional)")}<select style={I(D)} value={eSec} onChange={e=>setESec(e.target.value)}>
                <option value="">— All sections —</option>
                {secList.map(s=><option key={s.id} value={s.id}>{s.title}</option>)}
              </select></div>
              <div>{Lbl("Label (optional)")}<input style={I(D)} placeholder="e.g. Biology Paper 1" value={eLabel} onChange={e=>setELabel(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addExam()}/></div>
            </div>
            <button onClick={addExam} disabled={!eDate||!eSubj}
              style={{...B("#6366f1",false,{width:"100%",padding:"10px 0",fontSize:13,fontWeight:700,opacity:(!eDate||!eSubj)?0.4:1,cursor:(!eDate||!eSubj)?"not-allowed":"pointer"})}}>+ Add Exam Date</button>
          </div>

          {!exams.length
            ?<div style={{...C(D),padding:40,textAlign:"center",color:mu(D)}}><p style={{fontSize:28,marginBottom:8}}>📅</p><p style={{fontSize:14}}>No exams added yet. Add your first exam date above.</p></div>
            :<div style={{display:"flex",flexDirection:"column",gap:8}}>
              <h3 style={{fontWeight:700,fontSize:14,marginBottom:6}}>Your Exams ({exams.length})</h3>
              {[...exams].sort((a,b)=>a.date.localeCompare(b.date)).map(ex=>{
                const subj=subjects.find(s=>s.id===ex.subjectId);
                const dDiff=Math.ceil((new Date(ex.date+"T12:00:00")-new Date())/86400000);
                const col=dDiff<7?"#ef4444":dDiff<21?"#f59e0b":"#16a34a";
                return (
                  <div key={ex.id} style={{...C(D),padding:"12px 16px",display:"flex",alignItems:"center",gap:12}}>
                    <span style={{fontSize:22}}>{subj?.icon}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:600,fontSize:14,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ex.label}</div>
                      <div style={{fontSize:12,color:mu(D)}}>{new Date(ex.date+"T12:00:00").toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</div>
                    </div>
                    <span style={{fontSize:11,fontWeight:700,color:col,background:col+"22",padding:"3px 9px",borderRadius:20,flexShrink:0}}>
                      {dDiff<=0?"Today":dDiff===1?"Tomorrow":`${dDiff} days`}
                    </span>
                    <button onClick={()=>removeExam(ex.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#ef4444",fontSize:18,lineHeight:1,flexShrink:0}}>×</button>
                  </div>
                );
              })}
              <div style={{display:"flex",gap:8,marginTop:6}}>
                <button onClick={()=>setTab("school")} style={{...B("transparent",true,{flex:1,padding:"11px 0",fontSize:13,fontWeight:600,borderColor:bd2,color:mu(D)})}}>🏫 School Day Settings</button>
                <button onClick={()=>{generate();setTab("schedule");}} style={{...B("#6366f1",false,{flex:2,padding:"12px 0",fontSize:14,fontWeight:700})}}>Generate Timetable →</button>
              </div>
            </div>}
        </div>}

        {tab==="schedule"&&<div className="fade-in">
          {!sessions.length
            ?<div style={{...C(D),padding:48,textAlign:"center"}}>
              <p style={{fontSize:28,marginBottom:8}}>📅</p>
              <p style={{fontWeight:600,fontSize:15,marginBottom:6}}>No schedule generated yet</p>
              <p style={{fontSize:13,color:mu(D),marginBottom:16}}>{exams.length?"Click below to generate your personalised timetable.":'Add exam dates first in the "My Exams" tab.'}</p>
              {exams.length>0&&<button onClick={generate} style={{...B("#6366f1",false,{fontSize:13,padding:"10px 22px"})}}>Generate Timetable →</button>}
              {!exams.length&&<button onClick={()=>setTab("exams")} style={{...B("#6366f1",true,{fontSize:13,padding:"10px 22px"})}}>Add Exams →</button>}
            </div>
            :<>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16,alignItems:"center"}}>
                {exams.map(ex=>{
                  const subj=subjects.find(s=>s.id===ex.subjectId);
                  const eSessions=sessions.filter(s=>s.examId===ex.id);
                  const eDone=eSessions.filter(s=>sessionDone(s)).length;
                  const dDiff=Math.ceil((new Date(ex.date+"T12:00:00")-new Date())/86400000);
                  return (
                    <div key={ex.id} style={{display:"flex",alignItems:"center",gap:6,padding:"4px 12px",borderRadius:20,background:D?"#1e2537":"#f3f4f6",border:`1.5px solid ${subj?.accent||"#6366f1"}`}}>
                      <span style={{fontSize:12}}>{subj?.icon}</span>
                      <span style={{fontSize:12,fontWeight:600,color:subj?.accent}}>{ex.label}</span>
                      <span style={{fontSize:10,color:mu(D)}}>{eDone}/{eSessions.length}</span>
                      {dDiff>0&&<span style={{fontSize:10,color:mu(D)}}>· {dDiff}d</span>}
                    </div>
                  );
                })}
                <button onClick={()=>{generate();}} style={{...B("transparent",true,{fontSize:11,padding:"4px 10px",borderColor:D?"#374151":"#d1d5db",color:mu(D),marginLeft:"auto"})}}>↺ Regenerate</button>
              </div>

              {days.map(day=>{
                const daySess=grouped[day];
                const isToday=day===today;
                const isPast=day<today;
                return (
                  <div key={day} style={{marginBottom:14,opacity:isPast?0.6:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                      <span style={{fontWeight:700,fontSize:13,color:isToday?"#6366f1":tx(D)}}>{fmtD(day)}</span>
                      {isToday&&<span style={{fontSize:10,fontWeight:700,color:"#fff",background:"#6366f1",padding:"1px 7px",borderRadius:10}}>TODAY</span>}
                      {isPast&&<span style={{fontSize:10,color:mu(D),fontStyle:"italic"}}>past</span>}
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:6}}>
                      {daySess.map(sess=>{
                        const subj=subjects.find(s=>s.id===sess.subjectId);
                        const done=sessionDone(sess);
                        const actsDone=sess.activities.filter((_,ai)=>goalMet[`${sess.id}_${ai}`]).length;
                        const isExp=!!expanded[sess.id];
                        return (
                          <div key={sess.id} style={{...C(D),overflow:"hidden",borderLeft:`4px solid ${subj?.accent||"#6366f1"}`,opacity:done?0.7:1}}>
                            <div style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px",cursor:"pointer"}} onClick={()=>toggleExp(sess.id)}>
                              <div style={{textAlign:"center",minWidth:50,flexShrink:0}}>
                                <div style={{fontSize:11,fontWeight:700,color:subj?.accent||"#6366f1",fontFamily:"monospace"}}>{sess.startTime}</div>
                                <div style={{fontSize:10,color:mu(D),fontFamily:"monospace"}}>–{sess.endTime}</div>
                              </div>
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{fontWeight:700,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{sess.topicLabel}</div>
                                <div style={{fontSize:11,color:mu(D)}}>{subj?.icon} {subj?.name} · {actsDone}/{sess.activities.length} goal{sess.activities.length!==1?"s":""} met</div>
                              </div>
                              {done?<span style={{fontSize:16,flexShrink:0}}>✅</span>:<div style={{width:32,height:6,borderRadius:3,background:D?"#374151":"#e5e7eb",flexShrink:0,overflow:"hidden"}}><div style={{height:"100%",borderRadius:3,background:subj?.accent||"#6366f1",width:`${(actsDone/sess.activities.length)*100}%`,transition:"width .3s"}}/></div>}
                              <span style={{fontSize:11,color:mu(D),flexShrink:0}}>{isExp?"▲":"▼"}</span>
                            </div>
                            {isExp&&<div style={{padding:"0 14px 14px",display:"flex",flexDirection:"column",gap:8}}>
                              {sess.activities.map((act,ai)=>{
                                const gKey=`${sess.id}_${ai}`;
                                const gDone=!!goalMet[gKey];
                                return (
                                  <div key={ai} style={{padding:"12px 14px",borderRadius:10,background:D?"#1e2537":"#f9fafb",border:`1.5px solid ${gDone?"#16a34a":(D?"#374151":"#e5e7eb")}`}}>
                                    <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
                                      <span style={{fontSize:20,flexShrink:0,marginTop:1}}>{act.icon}</span>
                                      <div style={{flex:1,minWidth:0}}>
                                        <div style={{fontWeight:700,fontSize:13,marginBottom:3}}>{act.label}</div>
                                        <div style={{fontSize:11,color:mu(D),lineHeight:1.55,marginBottom:8}}>{act.tip}</div>
                                        <label style={{display:"flex",alignItems:"flex-start",gap:7,cursor:"pointer",userSelect:"none"}}>
                                          <input type="checkbox" checked={gDone} onChange={()=>toggleGoal(gKey)} style={{accentColor:"#16a34a",width:14,height:14,marginTop:1,flexShrink:0}}/>
                                          <span style={{fontSize:12,color:gDone?"#16a34a":tx(D),fontWeight:gDone?600:400,textDecoration:gDone?"line-through":"none",lineHeight:1.5}}>{act.goal}</span>
                                        </label>
                                      </div>
                                      {(act.navType==="section"&&act.sectionId)||act.navType==="target"||act.navType==="blurt"
                                        ?<button onClick={()=>onNav(act)} style={{...B(subj?.accent||"#6366f1",true,{fontSize:11,padding:"5px 10px",flexShrink:0,whiteSpace:"nowrap"})}}>Go →</button>:null}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              <div style={{marginTop:8,padding:"11px 16px",borderRadius:12,background:D?"#1e2537":"#f3f4f6",fontSize:12,color:mu(D)}}>
                💡 Sessions use spaced intervals and prioritise your weakest topics. Times are placed outside your school day automatically.
              </div>
            </>}
        </div>}
      </div>
    </div>
  );
}

// ─── MOCK EXAM SCREEN ───────────────────────────────────────────────────────
export function MockImage({query,D}){
  const [imgSrc,setImgSrc]=useState(null);
  const [tried,setTried]=useState(false);
  useEffect(()=>{
    const term=query.trim().replace(/\s+/g,"_");
    fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(term)}`)
      .then(r=>r.json())
      .then(d=>{if(d.thumbnail?.source)setImgSrc(d.thumbnail.source);})
      .catch(()=>{})
      .finally(()=>setTried(true));
  },[query]);
  if(!tried)return (<div style={{fontSize:11,color:mu(D),fontStyle:"italic",padding:"4px 0"}}>🔍 Loading diagram: {query}…</div>);
  if(!imgSrc)return (<div style={{padding:"10px 14px",borderRadius:8,background:D?"rgba(99,102,241,.08)":"#f5f3ff",border:`1px dashed ${D?"#4f46e5":"#a5b4fc"}`,fontSize:12,color:D?"#a5b4fc":"#4f46e5",fontStyle:"italic",margin:"8px 0"}}>📊 [Diagram: {query}]</div>);
  return (<div style={{margin:"10px 0"}}><img src={imgSrc} alt={query} style={{maxWidth:"100%",maxHeight:300,borderRadius:8,display:"block",border:`1px solid ${D?"#374151":"#e5e7eb"}`}}/><div style={{fontSize:10,color:mu(D),marginTop:3,fontStyle:"italic"}}>{query}</div></div>);
}

export function parseQuestionText(text,D,fontSize=14){
  if(!text)return null;
  const imgParts=text.split(/\[IMG:\s*([^\]]+)\]/g);
  if(imgParts.length===1){
    return (<div style={{fontSize,lineHeight:1.8,color:tx(D),whiteSpace:"pre-line"}}>{text}</div>);
  }
  const out=[];
  for(let i=0;i<imgParts.length;i++){
    if(i%2===0){
      if(imgParts[i].trim())out.push(<div key={i} style={{fontSize,lineHeight:1.8,color:tx(D),whiteSpace:"pre-line"}}>{imgParts[i]}</div>);
    }else{
      out.push(<MockImage key={i} query={imgParts[i].trim()} D={D}/>);
    }
  }
  return (<>{out}</>);
}

export function NumberedExtract({text, D}) {
  if (!text) return null;
  var lines = text.split("\n");
  var lineNum = 0;
  return (
    <div style={{fontFamily:"Georgia,serif",fontSize:13,lineHeight:1.9,color:D?"#e5e7eb":"#1f2937"}}>
      {lines.map(function(line, i) {
        var isBlank = !line.trim();
        if (!isBlank) lineNum++;
        var num = isBlank ? null : lineNum;
        return (
          <div key={i} style={{display:"flex",gap:0,minHeight:"1.9em"}}>
            <span style={{width:32,flexShrink:0,fontSize:10,color:D?"#8896b3":"#9ca3af",userSelect:"none",paddingTop:2,textAlign:"right",paddingRight:8,fontFamily:"monospace"}}>
              {num || ""}
            </span>
            <span style={{flex:1}}>{line || " "}</span>
          </div>
        );
      })}
    </div>
  );
}

export function HistoryInterpBlock({text, title, D}) {
  return (
    <div style={{border:"2px solid "+(D?"#92400e":"#78350f"),borderRadius:8,overflow:"hidden",marginBottom:14}}>
      <div style={{background:D?"#451a03":"#92400e",color:"#fef3c7",padding:"6px 14px",fontSize:11,fontWeight:700,letterSpacing:"0.08em"}}>
        {title || "SOURCE A"}
      </div>
      <div style={{background:D?"#1c1008":"#fffbeb",padding:"14px 16px",fontSize:13,lineHeight:1.85,color:D?"#fef3c7":"#1c1917",fontFamily:"Georgia,serif",whiteSpace:"pre-wrap"}}>
        {text}
      </div>
    </div>
  );
}

export function GradeBoundaryBar({pct, D}) {
  var boundaries = [
    {grade:"U",min:0,max:19,color:"#6b7280"},
    {grade:"1",min:20,max:29,color:"#ef4444"},
    {grade:"2",min:30,max:39,color:"#f97316"},
    {grade:"3",min:40,max:49,color:"#f59e0b"},
    {grade:"4",min:50,max:59,color:"#eab308"},
    {grade:"5",min:60,max:69,color:"#84cc16"},
    {grade:"6",min:70,max:77,color:"#22c55e"},
    {grade:"7",min:78,max:85,color:"#06b6d4"},
    {grade:"8",min:86,max:93,color:"#6366f1"},
    {grade:"9",min:94,max:100,color:"#a855f7"},
  ];
  var clampedPct = Math.max(0, Math.min(100, pct));
  return (
    <div style={{marginBottom:20}}>
      <div style={{fontSize:11,color:D?"#9ca3af":"#6b7280",marginBottom:6,fontWeight:600}}>Grade Boundaries (estimated)</div>
      <div style={{position:"relative",height:28,borderRadius:8,overflow:"hidden",display:"flex"}}>
        {boundaries.map(function(b) {
          var width = b.max - b.min + 1;
          return (
            <div key={b.grade} title={"Grade "+b.grade+": "+b.min+"%-"+b.max+"%"}
              style={{flex:width,background:b.color,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <span style={{fontSize:10,fontWeight:700,color:"#fff"}}>{b.grade}</span>
            </div>
          );
        })}
        <div style={{position:"absolute",top:0,bottom:0,left:clampedPct+"%",transform:"translateX(-50%)",width:3,background:"#fff",borderRadius:2,boxShadow:"0 0 0 2px #000"}}/>
      </div>
      <div style={{fontSize:10,color:D?"#9ca3af":"#6b7280",marginTop:4,textAlign:"left"}}>
        Your score: {pct}% — approx {boundaries.find(function(b){return clampedPct>=b.min&&clampedPct<=b.max;}) ? boundaries.find(function(b){return clampedPct>=b.min&&clampedPct<=b.max;}).grade : "U"}
      </div>
    </div>
  );
}

// Helper methods from original App.js for generating mock exams
export async function generatePartedPaper(subjName, board, paper, mergedTopics) {
  var notesCtx = mergedTopics.flatMap(function(t){
    return t.sections.flatMap(function(s){
      return (s.notes||[]).map(function(n){ return n.heading+": "+stripHtml(n.body); });
    });
  }).slice(0,12).join("\n");

  var contextBlock = notesCtx
    ? ("Revision content for context:\n" + notesCtx)
    : ("Use standard " + board + " GCSE " + subjName + " content.");

  var numGroups = paper.numGroups || 10;
  var specGuide = paper.specGuide || "";
  var totalMarks = paper.m || 80;

  var prompt = "You are an expert " + board + " GCSE " + subjName + " examiner and paper setter.\n" +
    "Generate a complete, realistic " + board + " GCSE " + subjName + " mock exam: \"" + paper.n + "\".\n\n" +
    "CRITICAL MARKS REQUIREMENT: All parts across all questions MUST total EXACTLY " + totalMarks + " marks. Count carefully.\n" +
    "Time allowed: " + paper.d + " minutes.\n" +
    (paper.markDist ? "Mark distribution: " + paper.markDist + "\n" : "") +
    "\nSPECIFICATION GUIDANCE:\n" + specGuide + "\n" +
    "\nContext (use where relevant):\n" + contextBlock + "\n\n" +
    "Generate exactly " + numGroups + " numbered question groups.\n\n" +
    "STRUCTURE RULES:\n" +
    "- Each group is numbered (1, 2, 3...) and has 2-5 lettered parts: (a), (b), (c), (d), (e)\n" +
    "- Parts escalate in demand: (a) recall/state [1-2 marks] → middle parts describe/apply/calculate [2-4 marks] → final part explain/evaluate [4-9 marks]\n" +
    "- context field: optional shared stimulus (data table, scenario, diagram description, quote) — use empty string if none\n" +
    "- DO NOT include mark allocations in the question text\n" +
    "- Use authentic " + board + " command words: state, name, identify, describe, explain, calculate, evaluate, compare, suggest, justify, assess\n" +
    "- Mark schemes: detailed bullet-point using [1] per mark. Calculations: M1 method + A1 answer. Extended: Level 1-3 or 1-4 descriptors + indicative content\n" +
    "- Cover DIVERSE topics — do not repeat the same topic twice\n" +
    "- Include at least one data-based or graph-based question\n\n" +
    "RESPOND ONLY with a valid JSON array. No markdown, no backticks, no extra text.\n" +
    "Each element:\n" +
    "{\"id\":\"q1\",\"type\":\"structured\",\"number\":1,\"context\":\"stimulus text or empty string\",\"totalMarks\":N,\"parts\":[\n" +
    "  {\"label\":\"(a)\",\"type\":\"short\",\"marks\":1,\"text\":\"State...\",\"markScheme\":\"• Correct answer [1]\"},\n" +
    "  {\"label\":\"(b)\",\"type\":\"short\",\"marks\":3,\"text\":\"Describe...\",\"markScheme\":\"• Point [1]\\n• Point [1]\\n• Point [1]\"},\n" +
    "  {\"label\":\"(c)\",\"type\":\"extended\",\"marks\":6,\"text\":\"Evaluate...\",\"markScheme\":\"Level 3 (5-6): Detailed...\\nLevel 2 (3-4): Some...\\nLevel 1 (1-2): Basic...\\nIndicative content: ...\"}\n" +
    "]}\n" +
    "For MCQ parts also include: \"options\":[\"A text\",\"B text\",\"C text\",\"D text\"],\"answer\":0,\"explanation\":\"why A is correct\"";

  var lastErr = null;
  for (var attempt = 0; attempt < 3; attempt++) {
    try {
      if(attempt > 0) await new Promise(function(res){ setTimeout(res, 1000 * attempt); });
      var raw = await callGeminiSimple(prompt, 7000);
      var fence = "`"+"`"+"`";
      raw = raw.split(fence+"json").join("").split(fence).join("").trim();
      var start = raw.indexOf("[");
      var end   = raw.lastIndexOf("]");
      if(start < 0 || end < 0) throw new Error("No JSON array in response");
      raw = raw.slice(start, end+1);
      var groups = JSON.parse(raw);
      if(!Array.isArray(groups) || !groups.length) throw new Error("Empty array");
      return groups.map(function(g){
        return Object.assign({}, g, {
          id: g.id || ("q" + (g.number || uid())),
          parts: (g.parts||[]).map(function(p){
            return Object.assign({}, p, {id: g.id + "-" + (p.label||uid()).replace(/[^a-z0-9]/gi,"")});
          })
        });
      });
    } catch(e) { lastErr = e; }
  }
  throw lastErr;
}

export const MOCK_SPECS={
  "maths:AQA":[
    {n:"Paper 1 – Non-Calculator",d:90,m:80,paperType:"parted",numGroups:22,
     markDist:"Target EXACTLY 80 marks total. Start with 4–6 groups of 1–3 mark questions (recall/method), then 8–10 groups of 3–5 marks (application/multi-step), finish with 4–6 groups of 5–8 marks (problem-solving/proof). A single 6-mark question should appear at least once.",
     specGuide:"AQA GCSE Maths Higher Tier — Paper 1 Non-Calculator. Cover: Number (fractions, surds, indices, standard form, HCF/LCM), Algebra (expanding brackets, factorising, solving equations/inequalities, sequences, simultaneous equations, quadratics, functions, proof), Ratio/Proportion/Rates (percentage change, direct/inverse proportion, compound interest), Geometry/Measures (angles, area, volume, circle theorems, transformations, vectors, Pythagoras), Probability, Statistics (averages, cumulative frequency, histograms). All questions require written working. At least: one algebraic proof, one geometry question with circle theorems, one statistics interpretation. NO MCQs. Show method marks clearly.",
     desc:"1h 30min, 80 marks. No calculator allowed.",
     skills:["Algebraic proof","Circle theorems","Show-that questions"]},
    {n:"Paper 2 – Calculator",d:90,m:80,paperType:"parted",numGroups:22,
     markDist:"Target EXACTLY 80 marks. Mix 1-mark retrieval, 3-4 mark method, 5-6 mark multi-step reasoning. At least two questions with 5+ marks.",
     specGuide:"AQA GCSE Maths Higher Tier — Paper 2 Calculator. Include: trigonometry (sin/cos/tan, sine rule, cosine rule, 3D trig), bounds and error intervals, financial maths (compound/simple interest, depreciation), graph interpretation (distance-time, velocity-time, quadratic/cubic), reverse percentage, direct/inverse proportion, scatter graphs with correlation, similarity and congruence. Real-world context questions required. All written working shown.",
     desc:"1h 30min, 80 marks. Calculator allowed.",
     skills:["Trigonometry","Bounds","Graph interpretation"]},
    {n:"Paper 3 – Calculator",d:90,m:80,paperType:"parted",numGroups:22,
     markDist:"Target EXACTLY 80 marks. Synoptic — mix topics across questions. At least two 6-mark questions requiring extended multi-step reasoning.",
     specGuide:"AQA GCSE Maths Higher Tier — Paper 3 Calculator. Synoptic paper — questions deliberately mix topics. Include: simultaneous equations (graphical and algebraic), circle theorems, vectors, enlargement/similar shapes, transformations, data analysis (box plots, cumulative frequency, histograms), algebraic fractions, iteration, further quadratics. At least two 6-mark problem-solving questions. Heavier weighting on multi-step reasoning requiring 4+ method steps.",
     desc:"1h 30min, 80 marks. Calculator allowed.",
     skills:["Circle theorems","Vectors","Multi-step reasoning"]},
  ],
  "maths:Edexcel":[
    {n:"Paper 1 – Non-Calculator",d:90,m:80,paperType:"parted",numGroups:22,
     markDist:"Target EXACTLY 80 marks. Start with short 1–2 mark recall questions; build to 4–6 mark problem-solving. Each group should list marks clearly.",
     specGuide:"Edexcel GCSE Maths Higher Tier — Paper 1 Non-Calculator. Cover: indices and surds, algebraic manipulation (expanding, factorising), solving linear and quadratic equations, sequences (nth term arithmetic and geometric), angles (parallel lines, polygons, circle theorems), area and volume (composite shapes, sector/arc), probability trees, averages from frequency tables. At least two groups should start with a 1-mark recall part before extending. NO MCQs.",
     desc:"1h 30min, 80 marks. No calculator allowed.",
     skills:["Surds","Algebraic fractions","Angle proofs"]},
    {n:"Paper 2 – Calculator",d:90,m:80,paperType:"parted",numGroups:22,
     markDist:"Target EXACTLY 80 marks. Include a balance of short (1–3 mark) and longer (4–6 mark) questions.",
     specGuide:"Edexcel GCSE Maths Higher Tier — Paper 2 Calculator. Include: Pythagoras theorem in 2D and 3D, trigonometric ratios and graphs, cumulative frequency and box plots, scatter graphs and lines of best fit, ratio and proportion (recipe problems, map scales), standard form calculations, percentage change and reverse percentages, surface area and volume of prisms/cylinders/cones/spheres.",
     desc:"1h 30min, 80 marks. Calculator allowed.",
     skills:["3D Pythagoras","Cumulative frequency","Standard form"]},
    {n:"Paper 3 – Calculator",d:90,m:80,paperType:"parted",numGroups:22,
     markDist:"Target EXACTLY 80 marks. More 5–6 mark multi-step questions than Papers 1 and 2.",
     specGuide:"Edexcel GCSE Maths Higher Tier — Paper 3 Calculator. More demanding questions. Include: circle theorems (tangent, chord, alternate segment), similar shapes and scale factors (area/volume scale factors), 3D trigonometry, conditional probability and Venn diagrams, set notation, further algebraic proof, transformations of graphs, iteration to find roots. Questions should require students to select and chain methods.",
     desc:"1h 30min, 80 marks. Calculator allowed.",
     skills:["Circle theorems","Conditional probability","Graph transformations"]},
  ],
  "bio:AQA":[
    {n:"Paper 1",d:105,m:100,paperType:"parted",numGroups:9,
     markDist:"Target EXACTLY 100 marks. Section A: one group of exactly 4 MCQ parts (1 mark each, use type:mcq). Section B: 8 groups of structured questions mixing 1-mark recall, 2-mark describe, 3-4 mark explain, ending each group with one 6-mark extended writing question (level-based mark scheme with L1/L2/L3 descriptors). Total MCQ = 4 marks; structured = 96 marks.",
     specGuide:"AQA GCSE Biology Paper 1. Duration 1h 45min. Topics 1–4 only: (1) Cell Biology — cell structure (animal/plant/bacterial), microscopy calculations, mitosis, cell cycle, stem cells, diffusion/osmosis/active transport with calculations; (2) Organisation — digestive system enzymes, food tests, heart/circulatory system, coronary heart disease, cancer, plant tissue/transport; (3) Infection and Response — communicable diseases, bacteria/viruses/fungi/protists, immune system, vaccination, antibiotics, drug development; (4) Bioenergetics — photosynthesis (word/symbol equation, factors, uses of glucose), aerobic/anaerobic respiration, exercise effects, metabolism. Required practicals: osmosis in potatoes, enzyme rate experiments, iodine test, Benedict's test. Include at least 2 maths questions (percentage change, magnification formula). Each group ends with a 6-mark level-based extended writing question.",
     desc:"1h 45min, 100 marks. Topics 1–4: Cell Biology, Organisation, Infection & Response, Bioenergetics.",
     skills:["Extended writing (6 marks)","Maths skills","Required practicals"]},
    {n:"Paper 2",d:105,m:100,paperType:"parted",numGroups:9,
     markDist:"Target EXACTLY 100 marks. Section A: one group of 4 MCQ parts. Section B: 8 groups of structured questions, each ending with one 6-mark extended writing question.",
     specGuide:"AQA GCSE Biology Paper 2. Duration 1h 45min. Topics 5–7 only: (5) Homeostasis and Response — nervous system (CNS/receptors/effectors/reflex arc), hormones (endocrine system, ADH, blood glucose regulation, insulin/glucagon, diabetes, thermoregulation, menstrual cycle, fertility treatment, contraception, plant hormones/tropisms); (6) Inheritance, Variation and Evolution — DNA/genes/chromosomes/alleles, Mendel, genetic diagrams (monohybrid cross, Punnett square, sex determination), variation, mutation, natural selection, Darwin/Wallace, extinction, selective breeding, genetic engineering, cloning; (7) Ecology — ecosystems, food webs/chains, biotic/abiotic factors, adaptations, competition, sampling methods, human impacts on biodiversity, maintaining biodiversity, carbon/water/nitrogen cycles, decomposition, global warming. Include at least 2 maths questions. Each group ends with a 6-mark extended writing question.",
     desc:"1h 45min, 100 marks. Topics 5–7: Homeostasis, Inheritance, Ecology.",
     skills:["Genetic diagrams","Homeostasis mechanisms","Ecology calculations"]},
  ],
  "chem:AQA":[
    {n:"Paper 1",d:105,m:100,paperType:"parted",numGroups:9,
     markDist:"Target EXACTLY 100 marks. One group of 4 MCQ parts (type:mcq). Eight groups of structured questions, each ending with one 6-mark extended writing question. Include at least 3 maths calculation questions.",
     specGuide:"AQA GCSE Chemistry Paper 1. Duration 1h 45min. Topics 1–5: (1) Atomic Structure and Periodic Table — atomic model history, subatomic particles, electron configuration, periodic table groups/periods, Group 1/7/0 properties, transition metals; (2) Bonding/Structure/Properties — ionic/covalent/metallic bonding, giant ionic/simple molecular/giant covalent/metallic structures, allotropes of carbon, polymer properties; (3) Quantitative Chemistry — relative formula mass (Mr), moles, balancing equations, mole calculations (mass/Mr), limiting reactants, % yield, atom economy calculations; (4) Chemical Changes — reactivity series, displacement reactions, extraction of metals, reduction, electrolysis (products at electrodes), acids/bases/neutralisation, making salts; (5) Energy Changes — exothermic/endothermic reactions, bond energies, reaction profiles. Required practicals: electrolysis, titration, temperature change. Maths: at least 2 mole calculation groups.",
     desc:"1h 45min, 100 marks. Topics 1–5: Atomic structure, Bonding, Quantitative chemistry, Chemical changes, Energy.",
     skills:["Mole calculations","Electrolysis","6-mark extended writing"]},
    {n:"Paper 2",d:105,m:100,paperType:"parted",numGroups:9,
     markDist:"Target EXACTLY 100 marks. One group of 4 MCQ parts. Eight structured groups ending each with a 6-mark extended writing question.",
     specGuide:"AQA GCSE Chemistry Paper 2. Duration 1h 45min. Topics 6–10: (6) Rate and Extent of Chemical Change — collision theory, factors affecting rate (temperature/concentration/surface area/catalysts), rate calculations, reversible reactions, Le Chatelier's principle; (7) Organic Chemistry — crude oil/fractional distillation, alkanes (combustion), cracking, alkenes (addition reactions, bromine water test), alcohols, carboxylic acids, condensation polymers, addition polymers; (8) Chemical Analysis — pure substances, paper chromatography (Rf values), gas tests (O2/CO2/H2/Cl2/NH3), flame tests, precipitate tests; (9) Atmospheric Science — evolution of Earth's atmosphere, greenhouse effect, air pollutants; (10) Using Resources — finite/renewable resources, water treatment, Haber process (conditions/equilibrium), life cycle assessment, carbon footprint, alternatives to plastics. Include Rf value calculation and rate of reaction graph analysis.",
     desc:"1h 45min, 100 marks. Topics 6–10: Rates, Organic chemistry, Analysis, Atmosphere, Resources.",
     skills:["Organic chemistry naming","Rate calculations","Haber process"]},
  ],
  "phys:AQA":[
    {n:"Paper 1",d:105,m:100,paperType:"parted",numGroups:9,
     markDist:"Target EXACTLY 100 marks. One group of 4 MCQ parts. Eight structured groups; each group must include at least one calculation with formula/substitution/answer/units. Each group ends with one 6-mark extended writing question.",
     specGuide:"AQA GCSE Physics Paper 1. Duration 1h 45min. Topics 1–4: (1) Energy — energy stores and transfers, conservation of energy, kinetic/gravitational/elastic potential energy calculations (KE=½mv², GPE=mgh, Ee=½ke²), power (P=E/t, P=W/t), efficiency calculations, thermal conductivity, specific heat capacity (Q=mcΔT), required practical; (2) Electricity — current/potential difference/resistance (V=IR), series/parallel circuits, electrical power (P=IV, P=I²R), energy transfer (E=Pt, E=QV), static electricity, electric fields, mains supply, national grid, transformers (Vp/Vs=np/ns); (3) Particle Model of Matter — density (ρ=m/V), states of matter, internal energy, specific heat capacity, specific latent heat (Q=mL), gas pressure/temperature/volume (pV=const, p/T=const); (4) Atomic Structure — nuclear model history, atomic structure, isotopes, radioactive decay (alpha/beta/gamma), nuclear equations, half-life calculations, fission and fusion. Every group MUST show: formula stated → substitution → working → answer with units.",
     desc:"1h 45min, 100 marks. Topics 1–4: Energy, Electricity, Particle model, Atomic structure.",
     skills:["Multi-step calculations","Nuclear equations","Energy efficiency"]},
    {n:"Paper 2",d:105,m:100,paperType:"parted",numGroups:9,
     markDist:"Target EXACTLY 100 marks. One group of 4 MCQ parts. Eight structured groups each with at least one calculation and one 6-mark extended writing question.",
     specGuide:"AQA GCSE Physics Paper 2. Duration 1h 45min. Topics 5–8: (5) Forces — scalar/vector, resultant forces, moments (M=Fd), pressure (p=F/A, p=hρg), distance/speed/velocity/acceleration (v=u+at, v²=u²+2as, s=ut+½at²), Newton's laws, inertia, momentum (p=mv, conservation of momentum), stopping distances, drag; (6) Waves — transverse/longitudinal, wave equation (v=fλ), reflection/refraction/TIR, EM spectrum (properties/uses/dangers), sound, required practical (ripple tank/waves on string); (7) Magnetism and Electromagnetism — magnetic fields, motor effect (F=BIL), Fleming's left-hand rule, induced EMF (generator effect), AC generator, transformers; (8) Space Physics — solar system, life cycle of stars, orbital motion, red-shift/Big Bang evidence. Every calculation group: formula → substitution → working → answer with units.",
     desc:"1h 45min, 100 marks. Topics 5–8: Forces, Waves, Electromagnetism, Space.",
     skills:["Momentum calculations","EM spectrum","Wave equations"]},
  ],
  "bio:Edexcel":[
    {n:"Paper 1",d:105,m:100,paperType:"parted",numGroups:7,
     markDist:"Target EXACTLY 100 marks. Section A: one group of exactly 10 MCQ parts (1 mark each, use type:mcq). Section B: 6 groups of structured questions totalling 90 marks. Mix of 2-mark describe, 3-mark explain, 4-mark analysis, 6-mark extended writing.",
     specGuide:"Edexcel GCSE Biology Paper 1. Duration 1h 45min. Topics 1–5: Key concepts of biology (cells, microscopy, diffusion, osmosis, enzymes), Cells and control (mitosis, cell cycle, stem cells, cancer), Genetics (DNA, meiosis, genetic inheritance, mutation), Natural selection and genetic modification (adaptation, evolution, selective breeding, GMOs), Health, disease and the development of medicines (communicable diseases, non-communicable diseases, drug development). Section A must be exactly 10 MCQs. Section B groups start with short recall and build to 6-mark extended writing. Include at least 2 practical-based questions.",
     desc:"1h 45min, 100 marks. Topics 1–5. Section A: 10 MCQs. Section B: structured questions.",
     skills:["10 MCQs","Genetic inheritance","Extended writing"]},
    {n:"Paper 2",d:105,m:100,paperType:"parted",numGroups:7,
     markDist:"Target EXACTLY 100 marks. One group of 10 MCQ parts. Six structured groups totalling 90 marks. Final group should be a synoptic question linking multiple topics.",
     specGuide:"Edexcel GCSE Biology Paper 2. Duration 1h 45min. Topics 1–7 synoptic: Plant structures and their functions (photosynthesis, transpiration, plant hormones), Animal coordination, control and homeostasis (endocrine system, blood glucose regulation, thermoregulation, kidney/water balance), Exchange and transport in animals (circulatory system, heart, gas exchange, lung structure), Ecosystems and material cycles (food chains/webs, population size, carbon cycle, water cycle, decomposition, biodiversity). Synoptic questions should link topics from Papers 1 and 2. Include data analysis. Section A: 10 MCQs. At least one 6-mark extended writing question.",
     desc:"1h 45min, 100 marks. Topics 1–7 synoptic. Section A: 10 MCQs.",
     skills:["Synoptic questions","Data analysis","Homeostasis"]},
    {n:"Paper 3",d:75,m:70,paperType:"parted",numGroups:5,
     markDist:"Target EXACTLY 70 marks. One group of 5 MCQ parts. Four structured groups; include extended analysis and evaluation questions.",
     specGuide:"Edexcel GCSE Biology Paper 3. Duration 1h 15min. Synoptic — focuses on practical skills, data analysis, and experimental evaluation. Questions reference all 7 topic areas. Section A: 5 MCQs. Section B: 4 structured groups each based on a data set or experimental scenario. Students must: describe patterns in data, suggest explanations, evaluate methods, calculate means/percentages/rates, and draw conclusions. Include at least one question on planning an investigation (variables, controls, reliability).",
     desc:"1h 15min, 70 marks. Synoptic — practical skills and data analysis.",
     skills:["Data analysis","Experimental design","Synoptic reasoning"]},
  ],
  "chem:Edexcel":[
    {n:"Paper 1",d:105,m:100,paperType:"parted",numGroups:7,
     markDist:"Target EXACTLY 100 marks. One group of 10 MCQs. Six structured groups mixing short-answer and calculation questions. At least 3 calculation questions (moles, Mr, percentage yield).",
     specGuide:"Edexcel GCSE Chemistry Paper 1. Duration 1h 45min. Topics 1–6: Atomic structure (Bohr model, electron configuration, isotopes), Periodic Table (groups/periods, Group 1/7/0 properties, transition metals), Structure, bonding and properties of matter (ionic/covalent/metallic, giant/simple structures, allotropes), Quantitative chemistry (moles, Mr, mole calculations, limiting reactants, percentage yield, concentration of solutions), Chemical and ionic equations (balancing, state symbols), Electrolysis (products at electrodes, half equations). Section A: 10 MCQs. Section B: mole calculation questions MUST show formula → substitution → answer → unit.",
     desc:"1h 45min, 100 marks. Topics 1–6. Section A: 10 MCQs. Section B: structured.",
     skills:["Mole calculations","Electrolysis half-equations","Bonding structures"]},
    {n:"Paper 2",d:105,m:100,paperType:"parted",numGroups:7,
     markDist:"Target EXACTLY 100 marks. One group of 10 MCQs. Six structured groups synoptic. Include rate calculations and organic chemistry naming.",
     specGuide:"Edexcel GCSE Chemistry Paper 2. Duration 1h 45min. Topics 1–9 synoptic: Acids, bases and salts (neutralisation, preparing salts, pH), Obtaining and using metals (reactivity series, extracting iron in blast furnace, aluminium by electrolysis, life cycle assessment), Reversible reactions and equilibria (Le Chatelier's principle, Haber process conditions/equilibrium), Organic chemistry (homologous series, alkanes/alkenes/alcohols/carboxylic acids/esters, addition/condensation polymerisation, cracking), Chemical analysis (chromatography Rf values, gas tests, flame tests, precipitate tests), Earth and atmospheric science (atmosphere composition, greenhouse effect, global warming, air pollution). Section A: 10 MCQs. Rf calculation and rate graph interpretation required.",
     desc:"1h 45min, 100 marks. Topics 1–9 synoptic. Section A: 10 MCQs.",
     skills:["Organic naming","Rf calculations","Haber process equilibrium"]},
  ],
  "phys:Edexcel":[
    {n:"Paper 1",d:105,m:100,paperType:"parted",numGroups:7,
     markDist:"Target EXACTLY 100 marks. One group of 10 MCQs. Six structured groups. Every calculation MUST show: formula → substitution → working → answer with units.",
     specGuide:"Edexcel GCSE Physics Paper 1. Duration 1h 45min. Topics 1–6: Motion (distance/displacement/speed/velocity/acceleration, s-t and v-t graphs, equations of motion v=u+at, v²=u²+2as, s=½(u+v)t), Forces and motion (Newton's laws, resultant force, F=ma, weight W=mg, friction, momentum p=mv, conservation of momentum, stopping distances), Conservation of energy (kinetic KE=½mv², gravitational GPE=mgh, elastic Ee=½ke², efficiency, power P=W/t), Waves (wave equation v=fλ, reflection, refraction, EM spectrum, sound), Light and the EM spectrum (absorption/reflection/transmission, colour, uses of EM waves), Radioactivity (atomic structure, nuclear decay, half-life, uses of radiation). Section A: 10 MCQs. All calculations show full working.",
     desc:"1h 45min, 100 marks. Topics 1–6. Section A: 10 MCQs.",
     skills:["Equations of motion","Energy calculations","Half-life"]},
    {n:"Paper 2",d:105,m:100,paperType:"parted",numGroups:7,
     markDist:"Target EXACTLY 100 marks. One group of 10 MCQs. Six structured groups including at least 2 electricity calculation groups and one space/astronomy group.",
     specGuide:"Edexcel GCSE Physics Paper 2. Duration 1h 45min. Topics 1–8 including Astronomy: Astronomy (solar system, lifecycle of stars, red-shift, Big Bang), Energy — resources (renewable/non-renewable, advantages/disadvantages, power station efficiency), Electric circuits (current/voltage/resistance V=IR, series/parallel circuits, power P=IV and P=I²R, energy E=Pt), Static electricity (charge, electric fields, sparking), Magnetism and the motor effect (magnetic fields, F=BIL, Fleming's left-hand rule), Electromagnetic induction (generator effect, AC generator, transformer equation Vp/Vs=np/ns), Particle model (density ρ=m/V, SHC Q=mcΔT, SLH Q=mL, gas laws). Section A: 10 MCQs. All calculations: formula → substitution → answer → unit.",
     desc:"1h 45min, 100 marks. Topics 1–8 including Astronomy. Section A: 10 MCQs.",
     skills:["Transformer calculations","Circuit analysis","Gas laws"]},
  ],
  "eng-lang:AQA":[
    {n:"Paper 1 – Explorations in Creative Reading & Writing",d:105,m:80,paperType:"structured",
     paperPrompt:"eng-lang-p1",
     desc:"1h 45min, 80 marks. Section A: 4 reading questions (40 marks). Section B: creative writing (40 marks).",
     skills:["Reading comprehension","Language analysis","Creative writing"],
     configFields:[]},
    {n:"Paper 2 – Writers' Viewpoints & Perspectives",d:105,m:80,paperType:"comingSoon",
     desc:"Coming soon — non-fiction reading & transactional writing.",skills:[]},
  ],
  "eng-lit:AQA":[
    {n:"Paper 1 – Shakespeare & 19th-Century Novel",d:105,m:64,paperType:"structured",
     paperPrompt:"eng-lit-p1",
     desc:"1h 45min, 64 marks. Section A: Shakespeare (34 marks). Section B: 19th-century novel (30 marks).",
     skills:["Shakespeare analysis","19th-century prose","Level-based mark schemes"],
     configFields:[
       {id:"shakespeare",label:"Shakespeare text",type:"select",options:["Macbeth","Romeo and Juliet","The Tempest","The Merchant of Venice","Much Ado About Nothing","Julius Caesar"],default:"Macbeth"},
       {id:"novel",label:"19th-century novel",type:"select",options:["A Christmas Carol","The Strange Case of Dr Jekyll and Mr Hyde","Great Expectations","Jane Eyre","Frankenstein","Pride and Prejudice","The Sign of Four"],default:"A Christmas Carol"},
     ]},
    {n:"Paper 2 – Modern Texts & Poetry",d:135,m:96,paperType:"comingSoon",
     desc:"Coming soon — modern prose/drama + poetry anthology.",skills:[]},
  ],
  "history:AQA":[
    {n:"Paper 1 – Understanding the Modern World",d:105,m:84,paperType:"comingSoon",
     desc:"Coming soon — Germany, Cold War, and conflict topics.",skills:[]},
    {n:"Paper 2 – Shaping the Nation (Elizabethan England)",d:105,m:40,paperType:"structured",
     paperPrompt:"history-p2-elizabethan",
     desc:"1h 45min, 40 marks. Section B: Elizabethan England c1568–1603 (interpretation, explain, account, historic environment).",
     skills:["Interpretation analysis","Explain significance","Historic environment"],
     configFields:[
       {id:"britishStudy",label:"British depth study",type:"select",options:["Elizabethan England c1568-1603"],default:"Elizabethan England c1568-1603"},
       {id:"examYear",label:"Exam year (affects historic environment question)",type:"select",options:["2026","2027","2028"],default:"2026"},
     ]},
  ],
  "geography:AQA":[
    {n:"Paper 1 – Living with the Physical Environment",d:90,m:88,paperType:"parted",numGroups:4,
     markDist:"Target EXACTLY 88 marks across 3 sections (3 groups of questions + 1 final evaluation). Section A (Natural Hazards) ~30 marks, Section B (Living World) ~30 marks, Section C (UK Physical Landscapes) ~28 marks. Include: 1-mark name/state, 2-mark describe, 4-mark explain, 6-mark extended, and one 9-mark essay with SPaG marks.",
     specGuide:"AQA GCSE Geography Paper 1. 1h 30min, 88 marks. THREE compulsory sections: SECTION A — The Challenge of Natural Hazards: tectonic hazards (plate tectonics, earthquakes, volcanoes — causes, effects, responses, prediction), weather hazards (tropical storms — distribution, causes, effects, responses), climate change (causes, effects, managing). SECTION B — The Living World: ecosystems (food webs, nutrient cycles), tropical rainforests (structure, biodiversity, deforestation causes/effects, sustainable management), hot deserts (adaptations, opportunities, challenges, desertification) OR cold environments. SECTION C — Physical Landscapes in the UK: either coastal landscapes (erosion processes, landforms — headlands/bays/caves/arches/stacks/beaches, coastal management) OR river landscapes (erosion/transportation/deposition, meanders/oxbow lakes/floodplains/deltas, flood management). MUST include: at least one figure-based question ('Describe what Figure X shows'), AQA command words (name/state/describe/explain/assess/to what extent), one 9-mark essay with 3 SPaG marks, one 6-mark evaluation question.",
     desc:"1h 30min, 88 marks. Three sections: Natural Hazards, Living World, UK Physical Landscapes.",
     skills:["Figure analysis","6-mark extended writing","9-mark essay + SPaG"]},
    {n:"Paper 2 – Challenges in the Human Environment",d:90,m:88,paperType:"parted",numGroups:4,
     markDist:"Target EXACTLY 88 marks. Three sections: Section A (Urban Issues) ~30 marks, Section B (Changing Economic World) ~30 marks, Section C (Resource Management) ~28 marks. Same mark distribution pattern as Paper 1 — 1-mark, 2-mark, 4-mark, 6-mark, 9-mark questions.",
     specGuide:"AQA GCSE Geography Paper 2. 1h 30min, 88 marks. THREE compulsory sections: SECTION A — Urban Issues and Challenges: urbanisation trends, megacities, Rio de Janeiro (growth, opportunities/challenges, favelas, improvements) OR UK city case study (regeneration, migration, suburbanisation), sustainable urban development. SECTION B — The Changing Economic World: development gap (measures of development, DTM, Rostow), causes of uneven development, LICs/NEEs (Nigeria case study: location, context, TNCs, international aid, political/social/economic changes), UK economy (post-industrial, science parks, quaternary sector). SECTION C — The Challenge of Resource Management: global distribution of food/water/energy, food supply issues (increasing food production, sustainable food), water supply (deficit/surplus, water transfer, sustainable water), energy supply (fossil fuels vs renewables, UK energy mix). Include case study questions requiring named examples. One 9-mark essay + 3 SPaG marks.",
     desc:"1h 30min, 88 marks. Three sections: Urban Issues, Changing Economic World, Resource Management.",
     skills:["Case study questions","Development gap","9-mark essay + SPaG"]},
    {n:"Paper 3 – Geographical Applications",d:75,m:76,paperType:"parted",numGroups:3,
     markDist:"Target EXACTLY 76 marks. Section A (Issue Evaluation) ~36 marks: starts with 3-4 short questions about a fictional resource booklet then a 12-mark decision/evaluation question. Section B (Fieldwork) ~40 marks: 2 sections on physical and human fieldwork — data collection, presentation techniques, analysis, evaluation. Final question 8 marks.",
     specGuide:"AQA GCSE Geography Paper 3. 1h 15min, 76 marks. SECTION A — Issue Evaluation: create a brief fictional 'pre-release resource booklet' (3 figures: map, graph, photograph description) on an environmental or human geography issue (e.g. coastal management, urban regeneration, sustainable energy). Questions progress: describe Figure 1 (2 marks), explain an issue shown (4 marks), use figures to assess the situation (6 marks), 12-mark decision-making question ('To what extent should [decision]? Use evidence from the resources and your own knowledge' — 9 marks + 3 SPaG). SECTION B — Fieldwork: questions on physical fieldwork (methods of data collection, health/safety, data presentation) and human fieldwork (hypothesis, sampling strategy, data analysis, reliability and validity). Include at least one question requiring students to sketch a graph or describe how they would present data.",
     desc:"1h 15min, 76 marks. Section A: Issue evaluation. Section B: Fieldwork methods.",
     skills:["Resource interpretation","Fieldwork evaluation","12-mark decision question"]},
  ],
  "business:AQA":[
    {n:"Paper 1",d:105,m:90,paperType:"parted",numGroups:5,
     markDist:"Target EXACTLY 90 marks. Group 1: exactly 5 MCQ parts (1 mark each, type:mcq). Groups 2–5: structured questions. Include: one 3-mark question, two 6-mark 'Explain' questions, one 9-mark 'Analyse' question, one 12-mark 'Evaluate/Justify' question with level-based mark scheme (4 levels).",
     specGuide:"AQA GCSE Business Paper 1. 1h 45min, 90 marks. Four topic areas: (1) Business in the Real World — business aims/objectives, stakeholders, business ownership types (sole trader/partnership/ltd/plc/franchise/social enterprise), business plans, location decisions, business growth; (2) Influences on Business — technology impacts, ethical trading, environmental considerations, economic climate, competitive environment, legislation (employment/consumer); (3) Business Operations — production methods (job/batch/flow), lean production (just in time/kaizen/cell production), quality management, procurement, supply chain management; (4) Human Resources — organisational structures (hierarchies, span of control), recruitment and selection, training (on-the-job/off-the-job), motivation theories (Taylor/Maslow/Herzberg), leadership styles, employment law. Group 1: 5 MCQs on key terms. Remaining groups: structured using a named fictional business context. 12-mark evaluation must include: 2+ justified points for, 2+ against, supported overall judgement.",
     desc:"1h 45min, 90 marks. Business operations, HR, and wider influences.",
     skills:["12-mark evaluate question","Motivation theories","Business contexts"]},
    {n:"Paper 2",d:105,m:90,paperType:"parted",numGroups:5,
     markDist:"Target EXACTLY 90 marks. Group 1: 5 MCQs. Groups 2–5: structured. Include financial calculations (revenue/profit/break-even/ARR), one 9-mark 'Analyse', one 12-mark 'Evaluate'.",
     specGuide:"AQA GCSE Business Paper 2. 1h 45min, 90 marks. Three topic areas: (5) Finance — revenue (price × quantity), costs (fixed/variable/total), profit and loss, break-even (contribution/break-even point/margin of safety calculations and graphs), cash flow forecasts, sources of finance (internal/external — loans, shares, retained profit, crowdfunding, trade credit), financial statements (balance sheets, income statements); (6) Marketing — market research (primary/secondary, qualitative/quantitative), segmentation (demographic/geographic/psychographic), marketing mix (4Ps — product lifecycle, pricing strategies, distribution channels, promotional methods), use of digital marketing; (7) External Influences — economic climate (recession/growth, inflation, interest rates, unemployment, exchange rates effect on imports/exports), legislation (consumer law, employment law), environmental and ethical issues, globalisation and international trade. Financial calculations must show formula → working → answer → unit. Break-even point = fixed costs ÷ contribution per unit.",
     desc:"1h 45min, 90 marks. Finance, marketing, external influences.",
     skills:["Break-even calculations","Marketing mix","12-mark evaluate"]},
  ],
  "computing:AQA":[
    {n:"Paper 1 – Computational Thinking & Programming",d:150,m:90,paperType:"parted",numGroups:6,
     markDist:"Target EXACTLY 90 marks. Groups mix: 1-mark recall, 2-mark describe, 4-mark application, 8-mark extended. At least one trace table question, one pseudocode-writing question, one algorithm design question.",
     specGuide:"AQA GCSE Computer Science Paper 1. 2h 30min, 90 marks. Topics: (1) Fundamentals of Algorithms — algorithm design (flowcharts, pseudocode), trace tables (show step-by-step variable changes), searching (linear vs binary — comparison), sorting (bubble, merge, insertion — steps and comparisons), Big O notation (awareness); (2) Programming Fundamentals — variables/constants, data types (integer/real/Boolean/string/char), sequence/selection/iteration, nested structures, string manipulation (length, substring, concatenation), file handling (open/read/write/close), exception handling; (3) Producing Robust Programs — defensive design (input validation, authentication), testing (normal/boundary/erroneous test data, trace tables to detect errors), syntax vs logic errors; (4) Boolean Logic — truth tables (AND/OR/NOT), logic diagrams; (5) Programming Languages — high vs low-level, compilers vs interpreters, IDEs (editor/debugger/translator). Use AQA pseudocode syntax EXACTLY: assignment uses ←, output uses OUTPUT, input uses USERINPUT, loops: FOR i ← 1 TO n, WHILE condition DO, IF/ELSE/ENDIF. Trace table questions MUST show exact column headers and cell values.",
     desc:"2h 30min, 90 marks. Algorithms, programming, Boolean logic, languages.",
     skills:["Trace tables","Pseudocode writing","Algorithm design"]},
    {n:"Paper 2 – Computer Systems",d:90,m:90,paperType:"parted",numGroups:6,
     markDist:"Target EXACTLY 90 marks. Mix 1-mark, 2-mark, 4-mark and 8-mark questions. Include at least one binary/hex conversion calculation and one networking scenario question.",
     specGuide:"AQA GCSE Computer Science Paper 2. 1h 30min, 90 marks. Topics: (1) Systems Architecture — Von Neumann architecture (CPU, ALU, CU, registers: PC/MAR/MDR/ACC), fetch-decode-execute cycle (step by step), factors affecting CPU performance (cores/cache/clock speed), embedded systems; (2) Memory and Storage — RAM vs ROM (volatile/non-volatile), types of secondary storage (HDD/SSD/optical/magnetic), file sizes calculation (bits/bytes/KB/MB/GB), data representation: binary (denary↔binary↔hex conversions, binary addition, overflow, two's complement), character encoding (ASCII/Unicode), images (pixels/colour depth/resolution, file size = width×height×colour depth), sound (sample rate/bit depth/file size); (3) Computer Networks — types (LAN/WAN/PAN), topologies (bus/star/mesh), wired vs wireless, hardware (NIC/hub/switch/router/WAP), protocols (TCP/IP, HTTP/HTTPS, FTP, SMTP, DNS), packet switching (packets/headers/routing), the Internet vs World Wide Web; (4) Network Security — threats (malware/phishing/social engineering/brute force/denial of service/SQL injection), prevention (firewalls/encryption/strong passwords/2FA/access levels); (5) Systems Software — operating system functions (memory management, process management, file management, user interface), utility software; (6) Ethical, Legal, Cultural and Environmental Impacts — Data Protection Act 2018/GDPR, Computer Misuse Act 1990, Copyright Designs and Patents Act 1988, Freedom of Information Act, environmental impact, ethical issues (AI, privacy). Binary/hex questions MUST show full working.",
     desc:"1h 30min, 90 marks. Systems architecture, networks, cybersecurity, data representation, ethics.",
     skills:["Binary/hex conversions","Network protocols","Data Protection Act"]},
  ],
  "dt:AQA":[
    {n:"Paper 1 – Core Technical Principles",d:90,m:100,paperType:"parted",numGroups:5,
     markDist:"Target EXACTLY 100 marks. Group 1: exactly 20 MCQ parts (1 mark each, type:mcq) = 20 marks. Groups 2–5: extended structured questions totalling 80 marks — include 4-mark, 6-mark, and 8-mark questions.",
     specGuide:"AQA GCSE Design and Technology Paper 1. 1h 30min, 100 marks. SECTION A (20 marks): exactly 20 MCQ questions (type:mcq) covering all core technical principles — materials (timber: hardwood/softwood/manufactured boards; metals: ferrous/non-ferrous/alloys; polymers: thermoplastic/thermosetting; textiles: natural/synthetic/blended; papers/boards), forces and stresses (tension/compression/torsion/bending/shear), physical/working/aesthetic properties, scales of production (one-off/batch/mass/continuous), CAD/CAM (CNC router/laser cutter/3D printer — advantages/disadvantages), QA and QC, tolerances. SECTION B (80 marks across 4 groups): (B1) New and emerging technologies — 4 and 6-mark questions on automation, robotics, flexible manufacturing, biotechnology, nano-materials, smart materials, global vs local production, FabLabs; (B2) Energy generation and storage — renewable/non-renewable, energy storage, sustainability, carbon footprint, life cycle assessment; (B3) Designing and making principles — ergonomics, anthropometrics, inclusive design, user-centred design, 8-mark design question (sketch/annotate a product for a given brief); (B4) Material properties and selection — comparing materials for a given application, sustainability (reduce/reuse/recycle), finishes (paint/varnish/electroplating/anodising). The 8-mark design question requires a sketched annotated design solution.",
     desc:"1h 30min, 100 marks. Section A: 20 MCQs. Section B: core technical principles.",
     skills:["20 MCQs","8-mark design question","Material selection"]},
    {n:"Paper 2 – Specialist Technical Principles",d:60,m:80,paperType:"parted",numGroups:4,
     markDist:"Target EXACTLY 80 marks. Group 1: exactly 5 MCQ parts (type:mcq) = 5 marks. Groups 2–4: 3 structured groups totalling 75 marks, mixing 2-mark, 4-mark, 6-mark and 8-mark questions.",
     specGuide:"AQA GCSE Design and Technology Paper 2. 1h, 80 marks. Specialist focus on one materials area (generate questions appropriate for either timber/metals/polymers/textiles/papers/boards/electronic systems). SECTION A (5 marks): 5 MCQ parts on specialist material properties, manufacturing processes, and tools. SECTION B (75 marks across 3 groups): (B1) Specialist material knowledge — properties (physical: density/strength/conductivity/malleability; working: machinability/weldability; aesthetic), selection criteria for a given application, 2-mark and 4-mark questions; (B2) Manufacturing processes for specialist area — forming (casting/forging/press forming for metals; injection moulding/blow moulding for polymers; warp/weft/weaving for textiles), cutting (marking out, sawing, chiselling for timber), joining (welding/soldering/adhesives/screws/bolts), finishing (sanding/painting/lacquering/plating), 4-mark and 6-mark questions; (B3) Evaluation question — 8-mark question: 'Evaluate the suitability of [specialist material] for [given product], considering its properties, manufacturing process, cost and sustainability. Justify your choice.' Level-based mark scheme L1(1-2), L2(3-4), L3(5-6), L4(7-8).",
     desc:"1h, 80 marks. Specialist material focus. Section A: 5 MCQs. Section B: extended.",
     skills:["5 MCQs","Material properties","8-mark evaluate"]},
  ],
  "combined-sci:AQA":[
    {n:"All papers",d:75,m:70,paperType:"comingSoon",desc:"Coming soon — Combined Science Trilogy and Synergy papers.",skills:[]},
  ],
  "drama:AQA":[
    {n:"Written Exam",d:105,m:80,paperType:"comingSoon",desc:"Coming soon — Drama written exam.",skills:[]},
  ],
  "music:AQA":[
    {n:"Written Exam",d:90,m:80,paperType:"comingSoon",desc:"Coming soon — Music written exam.",skills:[]},
  ],
};

export const getMockSpec=(sId,board)=>{
  const key=`${sId}:${board}`;
  const fallback=MOCK_SPECS[`${sId}:AQA`];
  if(MOCK_SPECS[key])return MOCK_SPECS[key];
  if(fallback)return fallback;
  const subj=ALL_SUBJECTS.find(s=>s.id===sId);
  return [{n:"All papers",d:90,m:80,paperType:"comingSoon",desc:`${board} ${subj?.name||sId} mock papers coming soon.`,skills:[]}];
};

export async function generateMockQuestions(subjName,board,paperName,needed,contextNotes,markDist){
  var questions = await aiServiceQuestionGenerator(subjName, board, contextNotes, needed, markDist);
  return questions.map(function(q) {
    return Object.assign({}, q, {
      id: 'ai-' + uid(),
      paperName: paperName || '',
      year: q.year || 'AI Generated',
    });
  });
}

export async function generateStructuredPaper(subjName,board,paper,config,mergedTopics){
  const notesCtx=mergedTopics.flatMap(t=>t.sections.flatMap(s=>
    (s.notes||[]).map(n=>`${n.heading}: ${stripHtml(n.body)}`)
  )).slice(0,15).join("\n");

  let prompt="";

  if(paper.paperPrompt==="eng-lang-p1"){
    prompt=`You are an expert AQA GCSE English Language Paper 1 examiner. Generate a complete mock exam.

STEP 1 — EXTRACT: Write a fictional prose extract of EXACTLY 30 numbered lines from an imaginary 20th/21st-century literary fiction work. It must be vivid, original (NOT from any real published work), and rich with language techniques. Number each line (1, 2, 3...). Make the opening dramatic or atmospheric, the middle developed, and the ending unresolved or tense.

STEP 2 — QUESTIONS (use \n for all line breaks inside text strings, never unescaped quotes):

Q1: Four 1-mark retrieval MCQs about lines 1–9. Each MCQ has exactly 3 options. Include correct answer index (0, 1, or 2).

Q2 (8 marks): "Look in detail at lines [pick a mid-section range].\n[Paste those exact lines here]\nHow does the writer use language here to describe [specific subject from the extract]?\n\nYou could include the writer's choice of:\n• words and phrases\n• language features and techniques\n• sentence forms."
Mark scheme: Detailed AQA-style with 4 levels. Level 4 (7-8): Perceptive, detailed analysis — identifies sophisticated language choices, uses precise subject terminology, convincing and accurate interpretation. Level 3 (5-6): Clear, explained analysis of language — relevant comments on methods, explained effect, accurate terminology. Level 2 (3-4): Some understanding of language — some reference to methods, some awareness of effect. Level 1 (1-2): Simple comment — surface-level observation. Include 3-4 specific indicative examples from the extract showing what would earn high marks.

Q3 (8 marks): "You now need to think about the whole of the source.\nHow has the writer structured the text to interest you as a reader?\n\nYou could write about:\n• what the writer focuses your attention on at the beginning\n• how and why the writer changes this focus as the source develops\n• any other structural features that interest you."
Mark scheme: Level 4 (7-8): Perceptive structural analysis — identifies varied and inventive structural features, analyses how structure creates effect on reader. Level 3 (5-6): Clear explanation of structural choices and effects. Level 2 (3-4): Some awareness of structure. Level 1 (1-2): Simple comment on structure. Indicative content: opening technique used, structural shift point identified, ending technique noted.

Q4 (20 marks): A named critic or fictional reader makes a bold statement about the text (e.g. "A reader once said: 'This text makes the reader feel [emotion].'"). Question: "To what extent do you agree?\n\nIn your response, you could:\n• write about your own impressions of [subject]\n• evaluate how the writer has created these impressions\n• support your ideas with quotations from the text."
Mark scheme: Level 4 (16-20): Perceptive, detailed evaluation — critical, insightful, well-developed. Convincing and accurate textual analysis with judicious references. Level 3 (11-15): Clear, consistent evaluation — explained comments, relevant references, evidence of critical thinking. Level 2 (6-10): Some evaluative comment — some awareness of writer's methods. Level 1 (1-5): Simple, limited comment. Indicative content: 3-4 specific points about the text with example quotations.

Q5 (40 marks — 24 content+organisation, 16 technical accuracy): Offer exactly TWO creative options:\nOption A: Describe a scene or setting inspired by [an image or mood from the extract].\nOption B: Continue the story or write a new story opening on the theme of [theme from extract].
Mark scheme for content (24 marks): Level 4 (19-24): Compelling, convincing writing — sophisticated structural and grammatical features, wide vocabulary, engaging narrative voice. Level 3 (13-18): Clear, consistent writing — crafted with some sophistication, varied vocabulary and structure. Level 2 (7-12): Some success in communicating — some deliberate choices, inconsistent. Level 1 (1-6): Simple, limited. Mark scheme for technical accuracy (16 marks): Level 4 (13-16): Varied and inventive punctuation and sentence structures, wide vocabulary, accurate spelling including complex words. Level 3 (9-12): Generally accurate with some variety. Level 2 (5-8): Some control, errors do not impede. Level 1 (1-4): Simple vocabulary, limited punctuation, frequent errors.

OUTPUT ONLY VALID JSON — all string values use \n for line breaks, NO unescaped double quotes inside strings (use apostrophes instead), NO trailing commas:
{"extract":{"title":"[invent a fictional title]","source":"[fictional author name], [fictional year]","text":"[30 numbered lines of extract, each line ending with \n]"},"questions":[{"id":"q1a","type":"mcq","groupLabel":"Question 1","marks":1,"text":"[MCQ question about lines 1-9]","options":["[option A]","[option B]","[option C]"],"answer":0,"explanation":"[why correct]","year":"AI Generated"},{"id":"q1b","type":"mcq","groupLabel":"Question 1","marks":1,"text":"[MCQ question]","options":["[A]","[B]","[C]"],"answer":1,"explanation":"[why]","year":"AI Generated"},{"id":"q1c","type":"mcq","groupLabel":"Question 1","marks":1,"text":"[MCQ question]","options":["[A]","[B]","[C]"],"answer":0,"explanation":"[why]","year":"AI Generated"},{"id":"q1d","type":"mcq","groupLabel":"Question 1","marks":1,"text":"[MCQ question]","options":["[A]","[B]","[C]"],"answer":2,"explanation":"[why]","year":"AI Generated"},{"id":"q2","type":"extended","marks":8,"text":"[Question 2 full text with pasted lines and bullet points using \n for breaks]","markScheme":"[detailed 4-level mark scheme with indicative content]","sampleAnswer":"","year":"AI Generated"},{"id":"q3","type":"extended","marks":8,"text":"[Question 3 full text with bullet points]","markScheme":"[detailed 4-level mark scheme with indicative content]","sampleAnswer":"","year":"AI Generated"},{"id":"q4","type":"extended","marks":20,"text":"[Question 4 full text with statement and bullet points]","markScheme":"[detailed 4-level mark scheme with indicative content]","sampleAnswer":"","year":"AI Generated"},{"id":"q5","type":"extended","marks":40,"text":"[Question 5 with both options labelled Option A and Option B]\n\n24 marks: Content and Organisation\n16 marks: Technical Accuracy","markScheme":"[detailed mark scheme for content (24) and technical accuracy (16) with level descriptors]","sampleAnswer":"","year":"AI Generated"}]}`;
  }
  else if(paper.paperPrompt==="eng-lit-p1"){
    const shakespeare=config.shakespeare||"Macbeth";
    const novel=config.novel||"A Christmas Carol";
    const shAuthor={"Macbeth":"Shakespeare","Romeo and Juliet":"Shakespeare","The Tempest":"Shakespeare","The Merchant of Venice":"Shakespeare","Much Ado About Nothing":"Shakespeare","Julius Caesar":"Shakespeare"}[shakespeare]||"Shakespeare";
    const nvAuthor={"The Strange Case of Dr Jekyll and Mr Hyde":"Stevenson","A Christmas Carol":"Dickens","Great Expectations":"Dickens","Jane Eyre":"Bronte","Frankenstein":"Shelley","Pride and Prejudice":"Austen","The Sign of Four":"Conan Doyle"}[novel]||"the author";
    const isShakespeare=true;
    prompt=`You are an expert AQA GCSE English Literature Paper 1 examiner. Generate a complete mock exam.

The student is studying:
- Shakespeare: ${shakespeare}
- 19th-century novel: ${novel}

CRITICAL EXTRACT REQUIREMENTS:
1. Shakespeare extract: Write 18-22 lines in authentic Shakespearean verse/prose style, clearly labelled [Act X, Scene Y]. Include stage directions where appropriate. The extract must focus on a key theme or dramatic moment from ${shakespeare}.
2. 19th-century novel extract: Write 28-35 lines in authentic 19th-century prose style mirroring ${nvAuthor}'s voice — formal vocabulary, long sentences, moral weight, vivid description. Clearly labelled [Chapter X or a specific chapter title]. The extract must capture a significant moment relevant to themes of the novel.

Both extracts should be long enough that analysis questions have plenty of material to work with.

SECTION A — SHAKESPEARE QUESTION (34 marks total: 30 AO1/AO2/AO3 + 4 AO4):
"Read the following extract from ${shakespeare} and then answer the question that follows.\nAt this point in the play [brief 1-sentence context].\n\nStarting with this speech/extract, explain how ${shAuthor} presents [choose a key character or theme] as [choose a quality — e.g. consumed by ambition / torn between duty and desire].\n\nWrite about:\n• how ${shAuthor} presents [aspect] in this extract\n• how ${shAuthor} presents [aspect] in the play as a whole\n[30 marks + 4 marks for AO4: spelling, punctuation and grammar]"
Mark scheme for Section A (30 marks AO1/AO2/AO3): Level 4 (25-30): Perceptive, detailed response — insightful personal interpretation; convincing, well-developed textual references; analysing effects of language/form/structure; well-integrated context. Level 3 (19-24): Clear, explained response — explained personal response; relevant well-chosen references; comments on effects of methods; awareness of context shaping meaning. Level 2 (13-18): Some understanding — some supported interpretation; some comments on language/structure; some context awareness. Level 1 (1-12): Simple, limited. AO4 (4 marks): 4 = consistently accurate SPaG, varied sentence structures; 3 = generally accurate; 2 = some control; 1 = limited control. Indicative content: [name 3-4 specific themes/moments from ${shakespeare} a student could discuss — power, gender, loyalty, fate etc. with specific acts/scenes].

SECTION B — 19TH-CENTURY NOVEL QUESTION (30 marks):
"Read the following extract from ${novel} and then answer the question that follows.\nIn this extract, [brief 1-sentence context of what is happening].\n\nStarting with this extract, how does ${nvAuthor} present [choose a key theme or character relevant to the extract]?\n\nWrite about:\n• how ${nvAuthor} presents [theme/character] in this extract\n• how ${nvAuthor} presents [theme/character] in the novel as a whole\n[30 marks]"
Mark scheme for Section B (30 marks): Level 4 (25-30): Perceptive, detailed response — insightful interpretation of writer's craft; precise, well-chosen references; sophisticated analysis of language/structure/form; rich contextual understanding of Victorian/19th-century society. Level 3 (19-24): Clear, explained — explained personal response; relevant references; comments on methods and effects; some context. Level 2 (13-18): Some understanding. Level 1 (1-12): Simple. Indicative content: [name 3-4 specific themes/ideas from ${novel} relevant to the question — e.g. for A Christmas Carol: redemption, poverty, social responsibility, with specific chapters/characters].

OUTPUT ONLY VALID JSON. Use \n for line breaks. NO unescaped double quotes in strings (use apostrophes). NO trailing commas:
{"extract":{"title":"${shakespeare} — Act [X], Scene [Y]","source":"AQA GCSE English Literature","text":"[18-22 lines of Shakespeare extract, using \n for line breaks]"},"extract2":{"title":"${novel} — Chapter [X / title]","source":"AQA GCSE English Literature","text":"[28-35 lines of novel extract, using \n for line breaks]"},"questions":[{"id":"q1","type":"extended","marks":34,"section":"SECTION A: SHAKESPEARE","text":"[Full Section A question as specified above, using \n for line breaks and bullet points]","markScheme":"[Full detailed mark scheme as specified above with all 4 levels and indicative content]","sampleAnswer":"","year":"AI Generated"},{"id":"q2","type":"extended","marks":30,"section":"SECTION B: 19TH-CENTURY NOVEL","text":"[Full Section B question as specified above]","markScheme":"[Full detailed mark scheme as specified above with all 4 levels and indicative content]","sampleAnswer":"","year":"AI Generated"}]}`;
  }
  else if(paper.paperPrompt==="history-p2-elizabethan"){
    const examYear=parseInt(config.examYear)||2026;
    const hEnvLabel=examYear>=2028?"Kenilworth Castle":examYear===2027?"the Spanish Armada":"the Globe Theatre";
    const hEnvQ=examYear>=2028
      ?`How far does a study of Kenilworth Castle support the view that Elizabethan power was primarily expressed through display rather than defence? Explain your answer using your contextual knowledge and what the site reveals about Elizabethan society.`
      :examYear===2027
      ?`How far does a study of the defeat of the Spanish Armada support the view that English leadership was the main factor in England's success? Explain your answer using contextual knowledge about the Armada and English naval strategy.`
      :`How far does a study of the Globe Theatre support the view that Elizabethan theatre was primarily a commercial enterprise rather than a reflection of wider culture? Explain your answer using your contextual knowledge and what the Globe reveals about Elizabethan society.`;
    prompt=`You are an expert AQA GCSE History Paper 2, Section B examiner. Generate a complete mock exam on Elizabethan England, c1568-1603.

Generate a historical interpretation of 60-80 words about an aspect of Elizabethan England (e.g. the role of the monarch, threats to Elizabeth, the lives of ordinary Elizabethans). Attribute it to a fictional historian with a plausible academic citation (e.g. P. Harrison, The Elizabethan Age, 2016).

Then generate exactly 4 questions. IMPORTANT: Do NOT include mark allocations in the question text — these are shown separately.

Q1 (8 marks): "Study Interpretation A. How convincing is Interpretation A about [topic of the interpretation]? Explain your answer based on your contextual knowledge and what it says in Interpretation A."
Mark scheme Q1: Level 4 (7-8): Developed, convincing evaluation — interrogates specific content of the interpretation, tests it against detailed own knowledge, makes a well-reasoned overall judgement. Level 3 (5-6): Explained evaluation — comments on specific content AND uses own knowledge to evaluate, clear judgement. Level 2 (3-4): Some evaluation — makes reference to the interpretation with some supporting knowledge. Level 1 (1-2): Simple comment on the interpretation. Indicative content: [3-4 specific Elizabethan facts that could support/challenge the interpretation — name actual events, dates, people].

Q2 (8 marks): "Explain what was important about [specific Elizabethan event, person or development — e.g. the role of the Privy Council / Mary Queen of Scots / Elizabethan exploration]."
Mark scheme Q2: Level 4 (7-8): Developed explanation — analyses importance with specific supporting knowledge, links to wider context. Level 3 (5-6): Explained importance — valid reason(s) with supporting knowledge. Level 2 (3-4): Some explanation — valid point(s) with some factual support. Level 1 (1-2): Simple, general statement. Indicative content: [3-4 specific points about why this was important with dates/names].

Q3 (8 marks): "Write an account of the ways in which [specific Elizabethan change or sequence of events — e.g. the Northern Earls Rebellion developed / relations between Elizabeth and Parliament changed]."
Mark scheme Q3: Level 4 (7-8): Developed, analytical narrative — explains how and why events developed, identifies links between causes/events/consequences, precise detail. Level 3 (5-6): Explained account — shows how/why with supporting evidence, some analytical language. Level 2 (3-4): Descriptive account with some explanation. Level 1 (1-2): Simple narrative. Indicative content: [3-4 key stages/events in chronological order with specific details].

Q4 (16 marks): "${hEnvQ}"
Mark scheme Q4: Level 4 (13-16): Sustained, developed analysis — analyses how the site reflects/challenges the statement, detailed contextual knowledge integrated throughout, well-reasoned and balanced judgement. Level 3 (9-12): Developed analysis — analyses aspects of the site with contextual knowledge, reaches a supported judgement. Level 2 (5-8): Explained analysis — some use of site knowledge and context, partial judgement. Level 1 (1-4): Simple comment on the site. Indicative content about ${hEnvLabel}: [4-5 specific architectural/historical features of the site that could be used in analysis, with dates and significance].

OUTPUT ONLY VALID JSON. Use \n for line breaks in text. NO unescaped double quotes in strings. NO trailing commas:
{"extract":{"title":"Interpretation A — Elizabethan England, c1568-1603","source":"[Fictional historian name, Book Title, Year]","text":"[60-80 word interpretation]"},"questions":[{"id":"q1","type":"extended","marks":8,"text":"[Q1 full text — no mark allocation]","markScheme":"[Full detailed mark scheme with all 4 levels and indicative content as above]","sampleAnswer":"","year":"AI Generated"},{"id":"q2","type":"extended","marks":8,"text":"[Q2 full text — no mark allocation]","markScheme":"[Full detailed mark scheme with all 4 levels and indicative content as above]","sampleAnswer":"","year":"AI Generated"},{"id":"q3","type":"extended","marks":8,"text":"[Q3 full text — no mark allocation]","markScheme":"[Full detailed mark scheme with all 4 levels and indicative content as above]","sampleAnswer":"","year":"AI Generated"},{"id":"q4","type":"extended","marks":16,"text":"[Q4 full text — no mark allocation]","markScheme":"[Full detailed mark scheme with all 4 levels and indicative content as above]","sampleAnswer":"","year":"AI Generated"}]}`;
  }
  else{
    throw new Error("Unknown paperPrompt: "+paper.paperPrompt);
  }

  const rawText=await callGeminiSimple(prompt,8000);
  if(!rawText)throw new Error("Structured paper generation failed — no response from AI.");

  function sanitiseRaw(s){
    s=s.replace(/```(?:json)?\s*/gi,"").replace(/```/g,"").trim();
    const start=s.indexOf("{");const end=s.lastIndexOf("}");
    if(start>=0&&end>start)s=s.slice(start,end+1);
    s=s.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g,"");
    s=s.replace(/"((?:[^"\\]|\\.)*)"/g,function(_,inner){
      return '"'+inner.replace(/\r?\n/g,"\\n")+'"';
    });
    return s;
  }
  function tryParse(s){try{return JSON.parse(s);}catch(_){return null;}}
  function repairAndParse(s){
    let r=tryParse(s);if(r)return r;
    let open=0,inStr=false,esc=false;
    for(let i=0;i<s.length;i++){
      const c=s[i];
      if(esc){esc=false;continue;}
      if(c==="\\"&&inStr){esc=true;continue;}
      if(c==='"'){inStr=!inStr;continue;}
      if(!inStr){if(c==="{")open++;else if(c==="}")open--;}
    }
    r=tryParse(s+"}".repeat(Math.max(0,open)));if(r)return r;
    const lb=s.lastIndexOf("}");
    if(lb>0){
      r=tryParse(s.slice(0,lb+1));if(r)return r;
      let op2=0;for(const c2 of s.slice(0,lb+1)){if(c2==="{")op2++;else if(c2==="}")op2--;}
      r=tryParse(s.slice(0,lb+1)+"}".repeat(Math.max(0,op2)));if(r)return r;
    }
    return null;
  }
  const parsed=repairAndParse(sanitiseRaw(rawText));
  if(!parsed)throw new Error("Failed to parse AI response — the model returned malformed JSON. Please try again.");
  return{
    extract:parsed.extract||null,
    extract2:parsed.extract2||null,
    questions:(parsed.questions||[]).map(q=>({...q,id:q.id||`ai-${uid()}`})),
  };
}

export function MockExamScreen({D,subjects,allSections,boardSels,boardData,user,onBack,onMarkActivity}){
  const [phase,setPhase]=useState("setup"); 
  const [selSubj,setSS]=useState(subjects[0]?.id||"");
  const [selBoard,setSB]=useState("AQA");
  const [selPaper,setSP]=useState(0);
  const [config,setConfig]=useState({});
  const [questions,setQuestions]=useState([]);
  const [extract,setExtract]=useState(null);
  const [extract2,setExtract2]=useState(null);
  const [showExtract,setShowExtract]=useState(false);
  const [showExtract2,setShowExtract2]=useState(false);
  const [answers,setAnswers]=useState({});
  const [timeLeft,setTL]=useState(0);
  const [qIdx,setQI]=useState(0);
  const [genErr,setGE]=useState("");
  const [results,setResults]=useState(null);
  const [tier,setTier]=useState(""); 
  const [paused,setPaused]=useState(false);
  const [pausesLeft,setPausesLeft]=useState(2);
  const [warn5shown,setWarn5shown]=useState(false);
  const [warn5modal,setWarn5modal]=useState(false);
  const [splitScreen,setSplitScreen]=useState(false);
  const [reviewMode,setReviewMode]=useState(false);
  const [examHistory,setExamHistory]=useState([]);
  const timerRef=useRef(null);
  const doSubmitRef=useRef(null);
  const ansFileRef=useRef(null);
  const subj=subjects.find(s=>s.id===selSubj);
  const _allSpec=getMockSpec(selSubj,selBoard);
  const spec=["maths","bio","chem","phys"].includes(selSubj)&&tier
    ?_allSpec.filter(p=>!p.tier||p.tier===tier)
    :_allSpec;
  const paper=spec[Math.min(selPaper,spec.length-1)]||_allSpec[0];
  const fmtTime=s=>`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  const pctTime=paper?.d>0?Math.round((timeLeft/(paper.d*60))*100):0;
  const timeCritical=timeLeft>0&&timeLeft<300;
  const bd2=D?"#2a3347":"#e5e7eb";

  useEffect(()=>{
    if(phase!=="exam")return;
    let isMounted=true;
    timerRef.current=setInterval(()=>{
      if(!isMounted)return;
      if(paused) return;
      setTL(function(t){
        if(t<=1){clearInterval(timerRef.current);setTimeout(function(){if(isMounted&&doSubmitRef.current)doSubmitRef.current();},50);return 0;}
        if(t===301 && !warn5shown){ setWarn5shown(true); setWarn5modal(true); }
        return t-1;
      });
    },1000);
    return function(){ isMounted=false; clearInterval(timerRef.current); };
  },[phase,paused,warn5shown]);

  useEffect(function(){
    if(phase!=="results") return;
    try{
      var histKey="gcse:exam-hist:"+(user||"anon")+":"+(selSubj||"")+"-"+(selBoard||"")+"-"+selPaper;
      window.storage.get(histKey).then(function(r){
        try{ if(r&&r.value){var h=JSON.parse(r.value);if(Array.isArray(h))setExamHistory(h);} }catch(e){}
      }).catch(function(){});
    }catch(e){}
  },[phase]); 

  const prepare=async(cfg=config)=>{
    setPhase("generating");setGE("");
    try{
      const bd3=boardData[`${selSubj}:${selBoard}`]||{custom:[],extras:{},papers:[]};
      const merged=(subj?.topics||[]).concat(bd3.custom); 

      if(paper.paperType==="structured"){
        var result;
        for(var structAttempt=0;structAttempt<3;structAttempt++){
          try{
            result=await generateStructuredPaper(subj&&subj.name,selBoard,paper,cfg,merged);
            if(result&&result.questions&&result.questions.length) break;
            if(structAttempt<2) await new Promise(function(res){setTimeout(res,800*(structAttempt+1));});
          }catch(structErr){
            if(structAttempt===2) throw structErr;
            await new Promise(function(res){setTimeout(res,800*(structAttempt+1));});
          }
        }
        if(!result||!result.questions||!result.questions.length) throw new Error("No questions generated.");
        setExtract(result.extract||null);
        setExtract2(result.extract2||null);
        setQuestions(result.questions);
        setAnswers({});setQI(0);setTL(paper.d*60);
        onMarkActivity?.();setPhase("exam");
        return;
      }

      if(paper.paperType==="parted"){
        var partedGroups;
        for(var pAttempt=0;pAttempt<3;pAttempt++){
          try{
            partedGroups=await generatePartedPaper(subj&&subj.name,selBoard,paper,merged);
            if(partedGroups&&partedGroups.length) break;
            if(pAttempt<2) await new Promise(function(res){setTimeout(res,1000*(pAttempt+1));});
          }catch(pErr){
            if(pAttempt===2) throw pErr;
            await new Promise(function(res){setTimeout(res,1000*(pAttempt+1));});
          }
        }
        if(!partedGroups||!partedGroups.length) throw new Error("No question groups generated.");
        setExtract(null);setExtract2(null);
        setQuestions(partedGroups);setAnswers({});setQI(0);setTL(paper.d*60);
        onMarkActivity?.();setPhase("exam");
        return;
      }

      const allQ=merged.flatMap(t=>t.sections.flatMap(s=>(s.questions||[]))).sort(()=>Math.random()-0.5);
      const mcqs=allQ.filter(q=>q.type==="mcq");
      const shorts=allQ.filter(q=>q.type==="short"||(q.type==="extended"&&Number(q.marks)<=4));
      const exts=allQ.filter(q=>q.type==="extended"&&Number(q.marks)>4);
      const picked=[];const needed=[];
      const grab=(pool,count,type,marks)=>{
        const take=pool.slice(0,count);picked.push(...take);
        const rem=count-take.length;if(rem>0)needed.push({count:rem,type,marks});
      };
      if((paper.mcq||0)>0)grab(mcqs,paper.mcq,"mcq",1);
      if((paper.sh||0)>0)grab(shorts,paper.sh,"short",3);
      if((paper.ex||0)>0)grab(exts,paper.ex,"extended",6);
      if((paper.free||0)>0){
        const fp=allQ.filter(q=>!picked.find(p=>p.id===q.id));
        picked.push(...fp.slice(0,paper.free));
        const rem=paper.free-fp.length;
        if(rem>0)needed.push({count:Math.min(rem,10),type:"short",marks:3});
      }
      if(needed.length>0){
        try{
          const notesCtx=merged.flatMap(t=>t.sections.flatMap(s=>(s.notes||[]).map(n=>n.heading+": "+stripHtml(n.body)))).slice(0,15).join("\n");
          const gen=await generateMockQuestions(subj?.name,selBoard,paper.n,needed,notesCtx,paper.markDist);
          picked.push(...gen);
        }catch(genErr){
          if(!picked.length) throw new Error("AI question generation failed: "+genErr.message+". Please check your internet connection and try again.");
          console.warn("AI fill-in failed, using bank questions only:",genErr.message);
        }
      } else if(!picked.length){
        try{
          const notesCtx=merged.flatMap(t=>t.sections.flatMap(s=>(s.notes||[]).map(n=>n.heading+": "+stripHtml(n.body)))).slice(0,15).join("\n");
          const fallbackNeeded=[{count:5,type:"mcq",marks:1},{count:4,type:"short",marks:3},{count:1,type:"extended",marks:6}];
          const gen=await generateMockQuestions(subj?.name,selBoard,paper.n,fallbackNeeded,notesCtx,paper.markDist);
          picked.push(...gen);
        }catch(genErr){
          throw new Error("No questions available and AI generation failed: "+genErr.message);
        }
      }
      const final=picked.filter(Boolean).sort(()=>Math.random()-0.5);
      if(!final.length){setGE("No questions available for this paper yet. Add questions in the subject's Flashcards & Questions section, or try a different paper.");setPhase("setup");return;}
      setExtract(null);setExtract2(null);
      setQuestions(final);setAnswers({});setQI(0);setTL(paper.d*60);
      onMarkActivity?.();setPhase("exam");
    }catch(e){setGE("Error: "+e.message);setPhase("setup");}
  };

  const isParted = q => q && q.type==="structured" && Array.isArray(q.parts) && q.parts.length>0;

  const setAns=(qId,patch)=>setAnswers(p=>({...p,[qId]:{...(p[qId]||{}),...patch}}));
  const setPartAns=(gId,pi,patch)=>setAnswers(p=>{
    var cur=p[gId]||{};
    var parts=[...(cur.parts||[])];
    parts[pi]={...(parts[pi]||{}),...patch};
    return {...p,[gId]:{...cur,parts}};
  });
  const getPartAns=(gId,pi)=>(answers[gId]?.parts||[])[pi]||{};

  const answeredCount=questions.length>0?questions.filter(function(q){
    var a=answers[q.id];
    if(isParted(q)){return (a?.parts||[]).some(function(pa){return pa&&(pa.selOpt!=null||pa.textAns?.trim()||pa.fileAns);});}
    return a?.selOpt!=null||a?.textAns?.trim()||a?.fileAns;
  }).length:0;

  // Assuming `markAnswer` delegates to `aiServiceFeedbackRubric` per original file comments
  const doSubmit=async()=>{
    clearInterval(timerRef.current);setPhase("marking");
    var fa={...answers};
    var writtenQs=questions.filter(function(q){return !isParted(q)&&q.type!=="mcq";});
    for(var wi=0;wi<writtenQs.length;wi++){
      var wq=writtenQs[wi];
      var wa=fa[wq.id];
      var ansText=(wa?.textAns||"").trim();
      var hasFile=!!(wa?.fileAns);
      if(ansText||hasFile){
        try{var wr=await aiServiceFeedbackRubric(wq,ansText||"[student uploaded image — see mark scheme]");fa[wq.id]={...wa,result:wr};}
        catch(e){fa[wq.id]={...(wa||{}),result:{score:0,feedback:"AI marking unavailable — self-mark using the mark scheme."}};}
      }else{fa[wq.id]={...(wa||{}),result:{score:0,feedback:"Not attempted."}};}
    }
    var partedQs=questions.filter(isParted);
    for(var gi=0;gi<partedQs.length;gi++){
      var grp=partedQs[gi];
      var gAns=fa[grp.id]||{};
      var newParts=[...(gAns.parts||[])];
      for(var pi=0;pi<grp.parts.length;pi++){
        var part=grp.parts[pi];
        var pAns=newParts[pi]||{};
        if(part.type==="mcq"){
          newParts[pi]={...pAns};
        } else {
          var pText=(pAns.textAns||"").trim();
          var pFile=!!(pAns.fileAns);
          if(pText||pFile){
            try{
              var fakeQ={id:part.id,text:part.text,marks:part.marks,markScheme:part.markScheme};
              var pr=await aiServiceFeedbackRubric(fakeQ,pText||"[student uploaded image — see mark scheme]");
              newParts[pi]={...pAns,result:pr};
            }catch(e){newParts[pi]={...pAns,result:{score:0,feedback:"AI marking unavailable — self-mark using mark scheme."}};}
          } else {
            newParts[pi]={...pAns,result:{score:0,feedback:"Not attempted."}};
          }
        }
      }
      fa[grp.id]={...gAns,parts:newParts};
    }
    var scored=0,total=0;
    for(var si=0;si<questions.length;si++){
      var sq=questions[si];
      var sa=fa[sq.id];
      if(isParted(sq)){
        var sParts=sa?.parts||[];
        for(var spi=0;spi<sq.parts.length;spi++){
          var sp=sq.parts[spi];
          var spa=sParts[spi]||{};
          var m=Number(sp.marks)||0; total+=m;
          if(sp.type==="mcq"&&spa.selOpt===sp.answer) scored+=1;
          else if(spa.result?.score!=null&&!isNaN(Number(spa.result.score))) scored+=Number(spa.result.score);
        }
      } else {
        var m2=Number(sq.marks)||0; total+=m2;
        if(sq.type==="mcq"&&sa?.selOpt===sq.answer) scored+=1;
        else if(sa?.result?.score!=null&&!isNaN(Number(sa.result.score))) scored+=Number(sa.result.score);
      }
    }
    setAnswers(fa);
    var finalPct=total>0?Math.round(scored/total*100):0;
    var finalGrade=pctToGrade(finalPct);
    var finalResults={scored:scored,total:total,pct:finalPct,grade:finalGrade};
    setResults(finalResults);
    try{
      var histKey="gcse:exam-hist:"+(user||"anon")+":"+(selSubj||"")+"-"+(selBoard||"")+"-"+selPaper;
      window.storage.get(histKey).then(function(r){
        var hist=[];
        try{if(r&&r.value)hist=JSON.parse(r.value);}catch(e2){}
        if(!Array.isArray(hist))hist=[];
        hist.push({date:new Date().toLocaleDateString("en-GB"),scored:scored,total:total,pct:finalPct,grade:finalGrade,paperName:paper&&paper.n});
        if(hist.length>5)hist=hist.slice(hist.length-5);
        window.storage.set(histKey,JSON.stringify(hist));
        setExamHistory(hist);
      }).catch(function(){});
    }catch(histErr){}
    setPhase("results");
  };
  doSubmitRef.current=doSubmit;

  if(phase==="setup")return (
    <div style={{minHeight:"100vh",background:D?"#0f1117":"#f9fafb"}} className="fade-in">
      <div style={{maxWidth:700,margin:"0 auto",padding:"32px 24px"}}>
        <button onClick={onBack} style={{fontSize:13,color:mu(D),background:"none",border:"none",cursor:"pointer",marginBottom:20}}>← Back</button>
        <h2 style={{fontSize:22,fontWeight:700,marginBottom:4,color:tx(D)}}>📝 Mock Exam</h2>
        <p style={{fontSize:13,color:mu(D),marginBottom:24}}>Board-specific timed mock exams using your question bank + ReviseIQ AI</p>
        <div style={{...C(D),padding:24,marginBottom:14}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:16}}>
            <div><label style={{fontSize:11,fontWeight:600,color:mu(D),display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.05em"}}>Subject</label>
              <select style={I(D)} value={selSubj} onChange={e=>{setSS(e.target.value);setSP(0);setConfig({});setTier("");}}>
                {subjects.map(s=><option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
              </select></div>
            <div><label style={{fontSize:11,fontWeight:600,color:mu(D),display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.05em"}}>Exam Board</label>
              <select style={I(D)} value={selBoard} onChange={e=>{setSB(e.target.value);setSP(0);setConfig({});}}>
                {["AQA","Edexcel","OCR","Eduqas","WJEC"].map(b=><option key={b} value={b}>{b}</option>)}
              </select></div>
          </div>
          {["maths","bio","chem","phys"].includes(selSubj)&&(
            <div style={{marginBottom:16}}>
              <label style={{fontSize:11,fontWeight:600,color:mu(D),display:"block",marginBottom:8,textTransform:"uppercase",letterSpacing:"0.05em"}}>Tier</label>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                {[["H","Higher Tier","Grade 4–9 • Full content"],["F","Foundation Tier","Grade 1–5 • Core content"]].map(([t,label,sub])=>(
                  <button key={t} onClick={()=>setTier(t)} style={{padding:"12px 16px",borderRadius:10,border:`1.5px solid ${tier===t?"#6366f1":bd2}`,background:tier===t?(D?"rgba(99,102,241,.1)":"#eef2ff"):"transparent",cursor:"pointer",textAlign:"left"}}>
                    <div style={{fontWeight:700,fontSize:13,color:tier===t?"#6366f1":tx(D)}}>{label}</div>
                    <div style={{fontSize:11,color:mu(D),marginTop:2}}>{sub}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div style={{marginBottom:20}}>
            <label style={{fontSize:11,fontWeight:600,color:mu(D),display:"block",marginBottom:8,textTransform:"uppercase",letterSpacing:"0.05em"}}>Select Paper</label>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {spec.map((p,i)=>{
                const isCS=p.paperType==="comingSoon";
                return (
                  <div key={i} onClick={()=>!isCS&&setSP(i)}
                    style={{...C(D),padding:"14px 16px",cursor:isCS?"default":"pointer",
                      borderColor:selPaper===i&&!isCS?"#6366f1":bd2,borderWidth:selPaper===i&&!isCS?2:1,
                      background:selPaper===i&&!isCS?(D?"rgba(99,102,241,.1)":"#eef2ff"):"transparent",
                      opacity:isCS?0.55:1}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <span style={{fontWeight:700,fontSize:14,color:selPaper===i&&!isCS?"#6366f1":tx(D)}}>{p.n}</span>
                        {isCS&&<span style={{fontSize:10,fontWeight:700,background:D?"#374151":"#f3f4f6",color:mu(D),padding:"2px 7px",borderRadius:10}}>Coming Soon</span>}
                      </div>
                      {!isCS&&<div style={{display:"flex",gap:8,flexShrink:0}}>
                        <span style={{fontSize:11,color:mu(D)}}>{p.d} min</span>
                        <span style={{fontSize:11,fontWeight:600,color:subj?.accent||"#6366f1"}}>{p.m} marks</span>
                      </div>}
                    </div>
                    <p style={{fontSize:12,color:mu(D),marginBottom:p.skills?.length?6:0,lineHeight:1.5}}>{p.desc}</p>
                    {p.skills?.length>0&&!isCS&&<div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{p.skills.map((s,si)=><span key={si} style={{fontSize:10,color:D?"#c7d2fe":"#1e40af",background:D?"rgba(99,102,241,.15)":"#eef2ff",padding:"2px 7px",borderRadius:10}}>{s}</span>)}</div>}
                  </div>
                );
              })}
            </div>
          </div>
          {genErr&&<div style={{padding:"10px 14px",borderRadius:8,background:"#fee2e2",border:"1px solid #ef4444",fontSize:12,color:"#b91c1c",marginBottom:12}}>{genErr}</div>}
          {paper.paperType==="comingSoon"
            ?<div style={{padding:"14px 16px",borderRadius:10,background:D?"#1e2537":"#f3f4f6",textAlign:"center",fontSize:13,color:mu(D)}}>🚧 This paper is coming soon to ReviseIQ</div>
            :["maths","bio","chem","phys"].includes(selSubj)&&!tier
              ?<div style={{padding:"12px 14px",borderRadius:10,background:D?"#1e2537":"#f3f4f6",textAlign:"center",fontSize:13,color:mu(D)}}>← Please select a tier above to continue</div>
              :<button onClick={()=>{
                  const cfg={tier};
                  if(paper.configFields?.length){
                    paper.configFields.forEach(f=>{cfg[f.id]=f.options[0];});
                    setConfig(cfg);setPhase("configure");
                  }else{prepare(cfg);}
                }}
                style={{...B("#6366f1",false,{width:"100%",padding:"13px 0",fontSize:14,fontWeight:700})}}>
                Start {paper.n} ({tier==="H"?"Higher":tier==="F"?"Foundation":""}) →
              </button>
          }
          <p style={{fontSize:11,color:mu(D),textAlign:"center",marginTop:8}}>AI will generate extra questions if needed to fill the paper</p>
        </div>
      </div>
    </div>
  );

  if(phase==="configure")return (
    <div style={{minHeight:"100vh",background:D?"#0f1117":"#f9fafb"}} className="fade-in">
      <div style={{maxWidth:600,margin:"0 auto",padding:"32px 24px"}}>
        <button onClick={()=>setPhase("setup")} style={{fontSize:13,color:mu(D),background:"none",border:"none",cursor:"pointer",marginBottom:20}}>← Back</button>
        <h2 style={{fontSize:20,fontWeight:700,marginBottom:4,color:tx(D)}}>📋 Configure Paper</h2>
        <p style={{fontSize:13,color:mu(D),marginBottom:20}}>{paper.n}</p>
        <div style={{...C(D),padding:24}}>
          {paper.configFields.map(field=>(
            <div key={field.id} style={{marginBottom:18}}>
              <label style={{fontSize:12,fontWeight:600,color:mu(D),display:"block",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.05em"}}>{field.label}</label>
              {field.note&&<p style={{fontSize:11,color:mu(D),marginBottom:6,fontStyle:"italic"}}>{field.note}</p>}
              {field.type==="select"&&(
                <select style={I(D)} value={config[field.id]||field.options[0]}
                  onChange={e=>setConfig(p=>({...p,[field.id]:e.target.value}))}>
                  {field.options.map(o=><option key={o} value={o}>{o}</option>)}
                </select>
              )}
            </div>
          ))}
          <button onClick={()=>prepare(config)}
            style={{...B("#6366f1",false,{width:"100%",padding:"13px 0",fontSize:14,fontWeight:700,marginTop:8})}}>
            Generate Paper →
          </button>
        </div>
      </div>
    </div>
  );

  if(phase==="generating")return (
    <div style={{minHeight:"100vh",background:D?"#0f1117":"#f9fafb",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{textAlign:"center",padding:40}}>
        <div style={{fontSize:48,marginBottom:16}}>⚙️</div>
        <h3 style={{fontSize:18,fontWeight:700,marginBottom:8,color:tx(D)}}>Generating your mock exam…</h3>
        <p style={{fontSize:13,color:mu(D)}}>ReviseIQ AI is building {paper.n}. This may take up to 30 seconds.</p>
      </div>
    </div>
  );

  if(phase==="marking")return (
    <div style={{minHeight:"100vh",background:D?"#0f1117":"#f9fafb",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{textAlign:"center",padding:40}}>
        <div style={{fontSize:48,marginBottom:16}}>📊</div>
        <h3 style={{fontSize:18,fontWeight:700,marginBottom:8,color:tx(D)}}>Marking your answers…</h3>
        <p style={{fontSize:13,color:mu(D)}}>ReviseIQ AI is evaluating your written responses</p>
      </div>
    </div>
  );

  var downloadResults=function(){
    var lines=[];
    lines.push("ReviseIQ Mock Exam Results");
    lines.push("Subject: "+(subj&&subj.name)+" ("+selBoard+") — "+paper.n);
    lines.push("Date: "+new Date().toLocaleDateString("en-GB"));
    lines.push("Score: "+results.scored+"/"+results.total+" ("+results.pct+"%) — Grade "+results.grade);
    lines.push("","=".repeat(50),"");
    questions.forEach(function(q,qi){
      var a=answers[q.id];
      var sc=q.type==="mcq"?(a&&a.selOpt===q.answer?1:0):(a&&a.result&&a.result.score);
      lines.push("Q"+(qi+1)+" ("+q.marks+" marks) — Score: "+(sc!=null?sc:"?")+"/"+q.marks);
      lines.push("Question: "+q.text);
      if(q.type==="mcq"){lines.push("Your answer: "+(a&&a.selOpt!=null?q.options[a.selOpt]:"(not answered)"));lines.push("Correct: "+q.options[q.answer]);}
      else{lines.push("Your answer: "+((a&&a.textAns)||"(not answered)"));}
      if(a&&a.result&&a.result.feedback) lines.push("Feedback: "+a.result.feedback);
      if(q.markScheme) lines.push("Mark Scheme: "+q.markScheme);
      lines.push("");
    });
    var blob=new Blob([lines.join("\n")],{type:"text/plain"});
    var url=URL.createObjectURL(blob);
    var a=document.createElement("a");
    a.href=url;a.download="ReviseIQ_"+selBoard+"_"+paper.n.replace(/\s/g,"_")+".txt";
    document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);
  };

  if(phase==="results"&&results)return (
    <div style={{minHeight:"100vh",background:D?"#0f1117":"#f9fafb"}} className="fade-in">
      <div style={{maxWidth:760,margin:"0 auto",padding:"32px 24px"}}>
        <h2 style={{fontSize:22,fontWeight:700,marginBottom:20,color:tx(D)}}>Results</h2>
        <div style={{...C(D),padding:28,textAlign:"center",marginBottom:16,border:"2px solid "+gradeColor(results.grade)}}>
          <div style={{fontSize:64,fontWeight:900,color:gradeColor(results.grade),marginBottom:4,lineHeight:1}}>{results.grade}</div>
          <div style={{fontSize:22,fontWeight:700,marginBottom:6,color:tx(D)}}>{results.scored}/{results.total} marks ({results.pct}%)</div>
          <div style={{fontSize:13,color:mu(D)}}>{subj&&subj.icon} {subj&&subj.name} · {selBoard} · {paper.n}</div>
        </div>

        <GradeBoundaryBar pct={results.pct} D={D}/>

        {examHistory.length>1&&(
          <div style={{...C(D),padding:16,marginBottom:16}}>
            <div style={{fontSize:12,fontWeight:700,color:tx(D),marginBottom:10}}>Your Progress ({examHistory.length} attempts)</div>
            {examHistory.map(function(h,hi){return(
              <div key={hi} style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
                <span style={{fontSize:10,color:mu(D),width:60,flexShrink:0}}>{h.date}</span>
                <div style={{flex:1,height:14,borderRadius:4,background:D?"#2a3347":"#e5e7eb",overflow:"hidden"}}>
                  <div style={{height:"100%",width:h.pct+"%",background:gradeColor(h.grade),borderRadius:4,transition:"width .4s"}}/>
                </div>
                <span style={{fontSize:11,fontWeight:700,color:gradeColor(h.grade),width:32,textAlign:"right",flexShrink:0}}>{h.grade}</span>
                <span style={{fontSize:10,color:mu(D),width:36,textAlign:"right",flexShrink:0}}>{h.pct}%</span>
              </div>
            );})}
          </div>
        )}

        <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
          <button onClick={function(){setReviewMode(function(p){return !p;});}}
            style={{...B(reviewMode?"#6366f1":"transparent",!reviewMode,{fontSize:12,padding:"8px 14px",borderColor:reviewMode?"#6366f1":bd2,color:reviewMode?"#fff":mu(D)})}}>
            {reviewMode?"Close Review":"Review Answers"}
          </button>
          <button onClick={downloadResults}
            style={{...B("transparent",true,{fontSize:12,padding:"8px 14px",borderColor:bd2,color:mu(D)})}}>
            Download Results
          </button>
        </div>

        {reviewMode&&(
          <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:20}}>
            {questions.map(function(q,qi){
              var a=answers[q.id];
              if(isParted(q)){
                var sParts=a?.parts||[];
                var totalQ=0,scoredQ=0;
                (q.parts||[]).forEach(function(pt,pi){var pa=sParts[pi]||{};totalQ+=Number(pt.marks||0);if(pt.type==="mcq"&&pa.selOpt===pt.answer)scoredQ+=1;else if(pa.result?.score!=null&&!isNaN(Number(pa.result.score)))scoredQ+=Number(pa.result.score);});
                var qScCol=scoredQ===0?"#ef4444":scoredQ>=totalQ*0.7?"#16a34a":"#d97706";
                return(
                  <div key={q.id} style={{...C(D),padding:16}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,gap:8}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <div style={{width:28,height:28,borderRadius:"50%",background:"#6366f1",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:13,flexShrink:0}}>{q.number}</div>
                        <span style={{fontSize:12,fontWeight:700,color:tx(D)}}>Question {q.number} — Structured ({q.totalMarks} marks)</span>
                      </div>
                      <span style={{fontSize:14,fontWeight:800,color:qScCol}}>{scoredQ}/{totalQ}</span>
                    </div>
                    {q.context&&q.context.trim()&&<div style={{padding:"10px 12px",borderRadius:8,background:D?"#1e2537":"#fffbeb",fontSize:12,color:tx(D),lineHeight:1.7,marginBottom:10,whiteSpace:"pre-line"}}>{q.context}</div>}
                    <div style={{display:"flex",flexDirection:"column",gap:10}}>
                      {(q.parts||[]).map(function(part,pi){
                        var pAns=sParts[pi]||{};
                        var pSc=part.type==="mcq"?(pAns.selOpt===part.answer?1:0):(pAns.result?.score??null);
                        var pCol=pSc==null?"#9ca3af":pSc===0?"#ef4444":Number(pSc)>=Number(part.marks)*0.7?"#16a34a":"#d97706";
                        return(
                          <div key={pi} style={{padding:"12px 14px",borderRadius:8,background:D?"rgba(99,102,241,.06)":"#f8f9ff",borderLeft:"2px solid #6366f1"}}>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                              <span style={{fontWeight:700,fontSize:13,color:"#6366f1",fontFamily:"monospace"}}>{part.label} <span style={{fontSize:10,fontWeight:400,color:mu(D),fontFamily:"sans-serif"}}>({part.marks} marks)</span></span>
                              <span style={{fontSize:12,fontWeight:800,color:pCol}}>{pSc!=null?pSc+"/"+part.marks:"—/"+part.marks}</span>
                            </div>
                            <div style={{fontSize:12,color:tx(D),marginBottom:8,lineHeight:1.6}}>{parseQuestionText(part.text,D,12)}</div>
                            {part.type==="mcq"?(
                              <div style={{padding:"7px 10px",borderRadius:7,background:pAns.selOpt===part.answer?"#dcfce7":"#fee2e2",fontSize:11,color:pAns.selOpt===part.answer?"#15803d":"#b91c1c"}}>
                                {pAns.selOpt===part.answer?"✓ Correct":"✗ Incorrect"} — correct: {part.options&&part.options[part.answer]}
                              </div>
                            ):(
                              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                                <div>
                                  <div style={{fontSize:9,fontWeight:700,color:mu(D),marginBottom:3,textTransform:"uppercase"}}>Your Answer</div>
                                  <div style={{padding:"8px 10px",borderRadius:7,background:D?"#1e2537":"#f3f4f6",fontSize:11,color:tx(D),lineHeight:1.6,whiteSpace:"pre-line",minHeight:40}}>{pAns.textAns||"Not attempted"}</div>
                                  {pAns.result?.feedback&&<div style={{marginTop:5,padding:"6px 9px",borderRadius:7,background:D?"rgba(99,102,241,.1)":"#eef2ff",fontSize:10,color:tx(D),lineHeight:1.5}}>{pAns.result.feedback}</div>}
                                </div>
                                <div>
                                  <div style={{fontSize:9,fontWeight:700,color:mu(D),marginBottom:3,textTransform:"uppercase"}}>Mark Scheme</div>
                                  <div style={{padding:"8px 10px",borderRadius:7,background:D?"rgba(16,185,129,.08)":"#f0fdf4",border:"1px solid "+(D?"#065f46":"#86efac"),fontSize:10,color:tx(D),lineHeight:1.7,whiteSpace:"pre-line",minHeight:40}}>{part.markScheme||"See teacher"}</div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }
              var isCorr=q.type==="mcq"?(a&&a.selOpt===q.answer):null;
              var sc=q.type==="mcq"?(isCorr?1:0):(a&&a.result&&a.result.score);
              var scCol=sc==null||isNaN(sc)?"#9ca3af":sc===0?"#ef4444":Number(sc)>=Number(q.marks)*0.7?"#16a34a":"#d97706";
              return(
                <div key={q.id} style={{...C(D),padding:16}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:8}}>
                    <span style={{fontSize:12,fontWeight:700,color:tx(D)}}>Q{qi+1} — {q.type==="mcq"?"MCQ":q.type==="short"?"Short":"Extended"} ({q.marks} marks)</span>
                    <span style={{fontSize:14,fontWeight:800,color:scCol}}>{sc!=null&&!isNaN(Number(sc))?sc+"/"+q.marks:"—/"+q.marks}</span>
                  </div>
                  <div style={{marginBottom:10,fontSize:13}}>{parseQuestionText(q.text,D,13)}</div>
                  {q.type==="mcq"?(
                    <div style={{padding:"8px 12px",borderRadius:8,background:isCorr?"#dcfce7":"#fee2e2",fontSize:12,color:isCorr?"#15803d":"#b91c1c"}}>
                      {isCorr?"Correct":"Incorrect"} — correct: {q.options&&q.options[q.answer]}
                      {q.explanation&&<div style={{marginTop:4,fontSize:11,opacity:0.8}}>{q.explanation}</div>}
                    </div>
                  ):(
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                      <div>
                        <div style={{fontSize:10,fontWeight:700,color:mu(D),marginBottom:4,textTransform:"uppercase"}}>Your Answer</div>
                        <div style={{padding:"10px 12px",borderRadius:8,background:D?"#1e2537":"#f3f4f6",fontSize:12,color:tx(D),lineHeight:1.65,whiteSpace:"pre-line",minHeight:60}}>{(a&&a.textAns)||"Not attempted"}</div>
                        {a&&a.result&&a.result.feedback&&<div style={{marginTop:6,padding:"8px 10px",borderRadius:8,background:D?"rgba(99,102,241,.1)":"#eef2ff",fontSize:11,color:tx(D),lineHeight:1.6}}>{a.result.feedback}</div>}
                      </div>
                      <div>
                        <div style={{fontSize:10,fontWeight:700,color:mu(D),marginBottom:4,textTransform:"uppercase"}}>Mark Scheme</div>
                        <div style={{padding:"10px 12px",borderRadius:8,background:D?"rgba(16,185,129,.08)":"#f0fdf4",border:"1px solid "+(D?"#065f46":"#86efac"),fontSize:11,color:tx(D),lineHeight:1.75,whiteSpace:"pre-line",minHeight:60}}>{q.markScheme||q.sampleAnswer||"See teacher"}</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!reviewMode&&(
          <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:20}}>
            {questions.map(function(q,qi){
              var a=answers[q.id];
              if(isParted(q)){
                var sParts=a?.parts||[];
                var totalQ=0,scoredQ=0;
                (q.parts||[]).forEach(function(pt,pi){var pa=sParts[pi]||{};totalQ+=Number(pt.marks||0);if(pt.type==="mcq"&&pa.selOpt===pt.answer)scoredQ+=1;else if(pa.result?.score!=null&&!isNaN(Number(pa.result.score)))scoredQ+=Number(pa.result.score);});
                var qScCol=scoredQ===0?"#ef4444":scoredQ>=totalQ*0.7?"#16a34a":"#d97706";
                var attempted=(a?.parts||[]).some(function(pa){return pa&&(pa.selOpt!=null||pa.textAns?.trim());});
                return(
                  <div key={q.id} style={{...C(D),padding:14}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:6}}>
                      <span style={{fontSize:12,color:mu(D)}}>Q{q.number} · Structured · {q.totalMarks} marks</span>
                      <span style={{fontSize:13,fontWeight:800,color:qScCol}}>{scoredQ}/{totalQ}</span>
                    </div>
                    {!attempted&&<div style={{fontSize:11,color:"#9ca3af",marginTop:3}}>Not attempted</div>}
                  </div>
                );
              }
              var isCorr=q.type==="mcq"?(a&&a.selOpt===q.answer):null;
              var sc=q.type==="mcq"?(isCorr?1:0):(a&&a.result&&a.result.score);
              var scCol=sc==null||isNaN(sc)?"#9ca3af":sc===0?"#ef4444":Number(sc)>=Number(q.marks)*0.7?"#16a34a":"#d97706";
              return(
                <div key={q.id} style={{...C(D),padding:14}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:6}}>
                    <span style={{fontSize:12,color:mu(D)}}>Q{qi+1} · {q.type==="mcq"?"MCQ":q.type==="short"?"Short":"Extended"}</span>
                    <span style={{fontSize:13,fontWeight:800,color:scCol}}>{sc!=null&&!isNaN(Number(sc))?sc+"/"+q.marks:"—/"+q.marks}</span>
                  </div>
                  <div style={{fontSize:12,color:tx(D),marginTop:4,marginBottom:4}}>{parseQuestionText(q.text,D,12)}</div>
                  {q.type==="mcq"&&a&&a.selOpt!=null&&(
                    <div style={{fontSize:11,color:isCorr?"#15803d":"#b91c1c"}}>{isCorr?"✓ Correct":"✗ Incorrect — correct: "+(q.options&&q.options[q.answer])}</div>
                  )}
                  {q.type!=="mcq"&&a&&a.result&&a.result.feedback&&(
                    <div style={{marginTop:6,padding:"6px 10px",borderRadius:6,background:D?"#1e2537":"#f3f4f6",fontSize:11,color:tx(D),lineHeight:1.6}}>{a.result.feedback}</div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div style={{display:"flex",gap:10}}>
          <button onClick={function(){setPhase("setup");setQuestions([]);setAnswers({});setResults(null);setExtract(null);setExtract2(null);setExamHistory([]);setReviewMode(false);setPaused(false);setPausesLeft(2);setWarn5shown(false);setWarn5modal(false);setSplitScreen(false);}}
            style={{flex:1,...B("#6366f1",false,{padding:"12px 0",fontSize:14})}}>Try Another Paper</button>
          <button onClick={onBack}
            style={{flex:1,...B("transparent",true,{padding:"12px 0",fontSize:14,borderColor:bd2,color:mu(D)})}}>Home</button>
        </div>
      </div>
    </div>
  );

  const q=questions[qIdx];
  if(!q)return null;
  const curAns=answers[q.id]||{};
  const hasExtract=(extract||extract2)&&(paper.paperType==="structured");
  const qIsParted=isParted(q);

  return (
    <div style={{minHeight:"100vh",background:D?"#0f1117":"#f9fafb",color:tx(D)}} className="fade-in">
      {warn5modal&&(
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:200,background:"rgba(0,0,0,.65)",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{...C(D),padding:28,maxWidth:320,textAlign:"center",border:"2px solid #f59e0b"}}>
            <div style={{fontSize:40,marginBottom:10}}>⏰</div>
            <h3 style={{fontSize:16,fontWeight:700,color:tx(D),marginBottom:8}}>5 minutes remaining!</h3>
            <p style={{fontSize:13,color:mu(D),marginBottom:16}}>Check your answers and make sure you have attempted all questions.</p>
            <button onClick={function(){setWarn5modal(false);}} style={{...B("#f59e0b",false,{width:"100%",padding:"10px 0",fontSize:14,fontWeight:700})}}>Keep Going</button>
          </div>
        </div>
      )}
      {paused&&(
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:100,background:"rgba(0,0,0,.8)",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{textAlign:"center",color:"#fff"}}>
            <div style={{fontSize:48,marginBottom:12}}>⏸</div>
            <h3 style={{fontSize:18,fontWeight:700,marginBottom:8}}>Timer Paused</h3>
            <p style={{fontSize:13,opacity:0.7,marginBottom:20}}>Pauses remaining: {pausesLeft}</p>
            <button onClick={function(){setPaused(false);}} style={{...B("#6366f1",false,{fontSize:14,padding:"10px 28px",fontWeight:700})}}>Resume</button>
          </div>
        </div>
      )}
      <div style={{position:"sticky",top:0,zIndex:40,background:D?"#0d1117":"#fff",borderBottom:"1px solid "+bd2,padding:"8px 16px"}}>
        <div style={{maxWidth:760,margin:"0 auto",display:"flex",alignItems:"center",gap:12}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:11,color:mu(D),marginBottom:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{subj&&subj.icon} {subj&&subj.name} · {paper.n}</div>
            <div style={{height:4,borderRadius:4,background:D?"#2a3347":"#e5e7eb"}}>
              <div style={{height:"100%",borderRadius:4,background:timeCritical?"#ef4444":"#6366f1",width:pctTime+"%",transition:"width 1s linear"}}/>
            </div>
          </div>
          <div style={{textAlign:"center",flexShrink:0}}>
            <div style={{fontSize:20,fontWeight:800,fontFamily:"monospace",color:timeCritical?"#ef4444":"#6366f1"}}>{fmtTime(timeLeft)}</div>
            <div style={{fontSize:9,color:mu(D)}}>remaining</div>
          </div>
          <div style={{textAlign:"center",flexShrink:0}}>
            <div style={{fontSize:14,fontWeight:700,color:tx(D)}}>{answeredCount}/{questions.length}</div>
            <div style={{fontSize:9,color:mu(D)}}>answered</div>
          </div>
          {pausesLeft>0&&!paused&&<button onClick={function(){if(pausesLeft>0){setPaused(true);setPausesLeft(function(p){return p-1;});}}}
            style={{...B("transparent",true,{fontSize:11,padding:"5px 10px",flexShrink:0,borderColor:bd2,color:mu(D)})}}>
            Pause
          </button>}
          {hasExtract&&!splitScreen&&<button onClick={function(){setShowExtract(function(p){return !p;});}}
            style={{...B(showExtract?"#6366f1":"transparent",!showExtract,{fontSize:11,padding:"5px 10px",flexShrink:0,borderColor:showExtract?"#6366f1":bd2,color:showExtract?"#fff":mu(D)})}}>
            {showExtract?"Hide":"Extract"}
          </button>}
          {hasExtract&&extract&&<button onClick={function(){setSplitScreen(function(p){return !p;});}}
            style={{...B(splitScreen?"#6366f1":"transparent",!splitScreen,{fontSize:11,padding:"5px 10px",flexShrink:0,borderColor:splitScreen?"#6366f1":bd2,color:splitScreen?"#fff":mu(D)})}}>
            {splitScreen?"Single":"Split"}
          </button>}
          {extract2&&<button onClick={function(){setShowExtract2(function(p){return !p;});}}
            style={{...B(showExtract2?"#ec4899":"transparent",!showExtract2,{fontSize:11,padding:"5px 10px",flexShrink:0,borderColor:showExtract2?"#ec4899":bd2,color:showExtract2?"#fff":mu(D)})}}>
            {showExtract2?"Hide":"Extract 2"}
          </button>}
          <button onClick={doSubmit} style={{...B("#ef4444",true,{fontSize:11,padding:"5px 10px",flexShrink:0})}}>Submit</button>
        </div>
      </div>

      {showExtract&&extract&&(
        <div style={{background:D?"#1e2537":"#fffbeb",borderBottom:`1px solid ${D?"#374151":"#fde68a"}`,padding:"14px 20px",maxHeight:320,overflowY:"auto"}}>
          <div style={{maxWidth:760,margin:"0 auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <div>
                <span style={{fontSize:12,fontWeight:700,color:D?"#fcd34d":"#92400e"}}>{extract.title}</span>
                {extract.source&&<span style={{fontSize:11,color:mu(D),marginLeft:8}}>{extract.source}</span>}
              </div>
              <button onClick={()=>setShowExtract(false)} style={{background:"none",border:"none",cursor:"pointer",color:mu(D),fontSize:16}}>×</button>
            </div>
            {paper&&paper.paperPrompt==="history-p2-elizabethan"
              ?<HistoryInterpBlock text={extract.text} title={extract.title} D={D}/>
              :<NumberedExtract text={extract.text} D={D}/>
            }
          </div>
        </div>
      )}
      {showExtract2&&extract2&&(
        <div style={{background:D?"#1e2537":"#fdf2f8",borderBottom:`1px solid ${D?"#374151":"#fbcfe8"}`,padding:"14px 20px",maxHeight:320,overflowY:"auto"}}>
          <div style={{maxWidth:760,margin:"0 auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <div>
                <span style={{fontSize:12,fontWeight:700,color:"#ec4899"}}>{extract2.title}</span>
                {extract2.source&&<span style={{fontSize:11,color:mu(D),marginLeft:8}}>{extract2.source}</span>}
              </div>
              <button onClick={()=>setShowExtract2(false)} style={{background:"none",border:"none",cursor:"pointer",color:mu(D),fontSize:16}}>×</button>
            </div>
            <NumberedExtract text={extract2.text} D={D}/>
          </div>
        </div>
      )}

      <div style={{display:splitScreen?"flex":"block",maxWidth:splitScreen?"100%":760,margin:"0 auto",padding:splitScreen?0:"18px 24px",gap:0}}>
        {splitScreen&&extract&&(
          <div style={{width:"42%",flexShrink:0,borderRight:"1px solid "+bd2,overflowY:"auto",maxHeight:"calc(100vh - 80px)",position:"sticky",top:80,padding:"18px 20px",background:D?"#0d1117":"#fffbeb"}}>
            <div style={{fontSize:11,fontWeight:700,color:D?"#fcd34d":"#92400e",marginBottom:10}}>
              {extract.title}{extract.source?" — "+extract.source:""}
            </div>
            {paper&&paper.paperPrompt==="history-p2-elizabethan"
              ?<HistoryInterpBlock text={extract.text} title={extract.title} D={D}/>
              :<NumberedExtract text={extract.text} D={D}/>
            }
          </div>
        )}
        <div style={{flex:1,padding:"18px 24px",minWidth:0}}>
        <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:14}}>
          {questions.map((qq,i)=>{
            const a=answers[qq.id];
            var done;
            if(isParted(qq)){done=(a?.parts||[]).some(function(pa){return pa&&(pa.selOpt!=null||pa.textAns?.trim()||pa.fileAns);});}
            else{done=a?.selOpt!=null||a?.textAns?.trim()||a?.fileAns;}
            const qMarks=isParted(qq)?qq.totalMarks:qq.marks;
            return (<div key={qq.id} onClick={()=>setQI(i)} title={`Q${i+1} (${qMarks}mk)`}
              style={{width:9,height:9,borderRadius:"50%",cursor:"pointer",transition:"background .15s",flexShrink:0,
                background:i===qIdx?"#6366f1":done?"#16a34a":(D?"#374151":"#d1d5db")}}/>);
          })}
        </div>

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
          <span style={{fontSize:13,color:mu(D)}}>Question {qIdx+1} of {questions.length}</span>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            {q.section&&<span style={{fontSize:10,fontWeight:700,color:"#6366f1",background:D?"rgba(99,102,241,.15)":"#eef2ff",padding:"2px 8px",borderRadius:10}}>{q.section}</span>}
            <span style={{fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20,background:(subj&&subj.mid)||"#e0e7ff",color:(subj&&subj.dk)||"#312e81"}}>{qIsParted?q.totalMarks:q.marks} mark{(qIsParted?q.totalMarks:q.marks)!==1?"s":""}</span>
          </div>
        </div>
        {(()=>{var totalMarks=questions.reduce(function(s,qq){return s+(isParted(qq)?Number(qq.totalMarks||0):Number(qq.marks||0));},0);var qMk=qIsParted?Number(q.totalMarks||0):Number(q.marks||0);var recSecs=totalMarks>0?Math.round((paper.d*60/totalMarks)*qMk):0;var recMins=Math.floor(recSecs/60);var recSec=recSecs%60;return totalMarks>0?(<div style={{fontSize:10,color:mu(D),marginBottom:10}}>Suggested time: ~{recMins>0?recMins+"m ":""}{recSec>0?recSec+"s":""}</div>):null;})()}

        {qIsParted?(
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:32,height:32,borderRadius:"50%",background:"#6366f1",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:15,flexShrink:0}}>{q.number}</div>
              <div style={{fontSize:13,fontWeight:700,color:tx(D)}}>
                {q.year==="AI Generated"&&<span style={{fontSize:10,fontWeight:400,fontStyle:"italic",color:mu(D),marginRight:6}}>AI Generated</span>}
                {q.totalMarks} marks total
              </div>
            </div>
            {q.context&&q.context.trim()&&(
              <div style={{padding:"14px 16px",borderRadius:10,background:D?"#1e2537":"#fffbeb",border:`1px solid ${D?"#374151":"#fde68a"}`,fontSize:13,color:tx(D),lineHeight:1.75,whiteSpace:"pre-line"}}>
                {parseQuestionText(q.context,D,13)}
              </div>
            )}
            {(q.parts||[]).map(function(part,pi){
              var pAns=getPartAns(q.id,pi);
              return (
                <div key={part.id||pi} style={{...C(D),padding:20,borderLeft:"3px solid #6366f1"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10,gap:8,flexWrap:"wrap"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontWeight:800,fontSize:15,color:"#6366f1",fontFamily:"monospace",minWidth:28}}>{part.label}</span>
                      <span style={{fontSize:11,fontWeight:600,color:mu(D),textTransform:"uppercase",letterSpacing:"0.05em"}}>{part.type==="mcq"?"Multiple Choice":part.type==="extended"?"Extended Response":"Short Answer"}</span>
                    </div>
                    <span style={{fontSize:11,fontWeight:700,padding:"2px 9px",borderRadius:20,background:(subj&&subj.mid)||"#e0e7ff",color:(subj&&subj.dk)||"#312e81",flexShrink:0}}>{part.marks} mark{part.marks!==1?"s":""}</span>
                  </div>
                  <div style={{fontSize:13,color:tx(D),marginBottom:12,lineHeight:1.7}}>{parseQuestionText(part.text,D,13)}</div>
                  {part.type==="mcq"?(
                    <div style={{display:"flex",flexDirection:"column",gap:7}}>
                      {(part.options||[]).map(function(opt,oi){
                        var sel=pAns.selOpt===oi;
                        return(
                          <button key={oi} onClick={function(){setPartAns(q.id,pi,{selOpt:oi});}}
                            style={{textAlign:"left",padding:"9px 13px",borderRadius:9,border:`1.5px solid ${sel?"#6366f1":bd2}`,
                              background:sel?(D?"rgba(99,102,241,.15)":"#eef2ff"):"transparent",
                              cursor:"pointer",fontSize:13,color:sel?"#6366f1":tx(D),transition:"border-color .15s,background .15s"}}>
                            <span style={{fontFamily:"monospace",marginRight:9,fontSize:11,opacity:0.7}}>{"ABCD"[oi]}.</span>{opt}
                          </button>
                        );
                      })}
                    </div>
                  ):(
                    <div>
                      <textarea value={pAns.textAns||""} onChange={function(e){setPartAns(q.id,pi,{textAns:e.target.value});}}
                        rows={part.type==="extended"?(part.marks>=6?10:7):4}
                        placeholder="Write your answer here…"
                        style={{...I(D,{resize:"vertical",lineHeight:1.7,width:"100%"})}}/>
                      <p style={{fontSize:10,color:mu(D),marginTop:3}}>📷 Writing on paper? Submit first then self-mark using the mark scheme.</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ):(
        <div style={{...C(D),padding:24,marginBottom:14}}>
          <div style={{fontSize:11,fontWeight:600,color:mu(D),textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:10,display:"flex",gap:8,alignItems:"center"}}>
            <span>{q.type==="mcq"?"Multiple Choice":q.type==="short"?"Short Answer":"Extended Response"}</span>
            {q.year==="AI Generated"&&<span style={{fontSize:9,fontWeight:400,fontStyle:"italic",color:mu(D)}}>AI Generated</span>}
          </div>
          {(q.images||[]).map((img,ii)=><AnnotatedImage key={ii} img={img} D={D}/>)}
          {parseQuestionText(q.text,D,14)}

          {q.type==="mcq"&&(
            <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:12}}>
              {(q.options||[]).map((opt,oi)=>{
                const sel=curAns.selOpt===oi;
                return (
                  <button key={oi} onClick={()=>setAns(q.id,{selOpt:oi})}
                    style={{textAlign:"left",padding:"10px 14px",borderRadius:10,border:`1.5px solid ${sel?"#6366f1":bd2}`,
                      background:sel?(D?"rgba(99,102,241,.15)":"#eef2ff"):"transparent",
                      cursor:"pointer",fontSize:13,color:sel?"#6366f1":tx(D),transition:"border-color .15s,background .15s"}}>
                    <span style={{fontFamily:"monospace",marginRight:10,fontSize:11,opacity:0.7}}>{"ABCD"[oi]}.</span>{opt}
                  </button>
                );
              })}
            </div>
          )}
          {(q.type==="short"||q.type==="extended")&&(
            <div style={{marginTop:12}}>
              <input ref={ansFileRef} type="file" accept="image/*,.pdf" style={{display:"none"}}
                onChange={e=>{
                  const file=e.target.files?.[0];
                  if(!file)return;
                  const reader=new FileReader();
                  reader.onload=ev=>setAns(q.id,{fileAns:{name:file.name,preview:ev.target.result,type:file.type}});
                  reader.readAsDataURL(file);
                  e.target.value="";
                }}/>
              {curAns.fileAns?(
                <div style={{marginBottom:10,padding:"10px 12px",borderRadius:10,background:D?"#1e2537":"#f0fdf4",border:`1px solid ${D?"#374151":"#86efac"}`,display:"flex",alignItems:"center",gap:10}}>
                  {curAns.fileAns.type?.startsWith("image/")
                    ?<img src={curAns.fileAns.preview} alt="" style={{height:60,width:60,objectFit:"cover",borderRadius:6,flexShrink:0}}/>
                    :<span style={{fontSize:20}}>📄</span>
                  }
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:600,color:D?"#86efac":"#15803d",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{curAns.fileAns.name}</div>
                    <div style={{fontSize:10,color:mu(D)}}>Answer uploaded</div>
                  </div>
                  <button onClick={()=>setAns(q.id,{fileAns:null})} style={{background:"#ef4444",color:"#fff",border:"none",borderRadius:"50%",width:18,height:18,fontSize:11,cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
                </div>
              ):null}
              <div style={{display:"flex",gap:8,alignItems:"flex-start"}}>
                <textarea value={curAns.textAns||""} onChange={e=>setAns(q.id,{textAns:e.target.value})}
                  rows={q.type==="extended"?10:5}
                  placeholder={curAns.fileAns?"Optional: add typed notes alongside your uploaded answer":"Write your answer here…"}
                  style={{...I(D,{resize:"vertical",lineHeight:1.7,flex:1})}}/>
                <button onClick={()=>ansFileRef.current?.click()} title="Upload photo of handwritten answer"
                  style={{...B("transparent",true,{fontSize:14,padding:"8px 10px",borderColor:bd2,color:mu(D),flexShrink:0,marginTop:0})}}>📷</button>
              </div>
              <p style={{fontSize:10,color:mu(D),marginTop:4}}>📷 Tip: you can upload a photo of a handwritten answer instead of typing</p>
            </div>
          )}
        </div>
        )}

        <div style={{display:"flex",gap:10}}>
          <button onClick={()=>setQI(i=>Math.max(0,i-1))} disabled={qIdx===0}
            style={{flex:1,padding:"10px 0",borderRadius:10,border:`1px solid ${bd2}`,background:"transparent",
              color:qIdx===0?mu(D):tx(D),cursor:qIdx===0?"not-allowed":"pointer",fontSize:13}}>← Prev</button>
          <button onClick={()=>qIdx<questions.length-1?setQI(i=>i+1):doSubmit()}
            style={{flex:2,...B(qIdx<questions.length-1?"#6366f1":"#16a34a",false,{fontSize:13,padding:"10px 0"})}}>
            {qIdx<questions.length-1?"Next →":"Submit Exam ✓"}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}

// ─── AI TUTOR SCREEN ────────────────────────────────────────────────────────
export function TutorImage({query,D}){
  const [imgSrc,setImgSrc]=useState(null);
  const [tried,setTried]=useState(false);
  useEffect(()=>{
    const term=query.trim().replace(/\s+/g,"_");
    fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(term)}`)
      .then(r=>r.json())
      .then(d=>{if(d.thumbnail?.source)setImgSrc(d.thumbnail.source);})
      .catch(()=>{})
      .finally(()=>setTried(true));
  },[query]);
  if(!tried)return (<div style={{fontSize:11,color:mu(D),fontStyle:"italic",padding:"4px 0"}}>🔍 Loading image: {query}…</div>);
  if(!imgSrc)return (<div style={{fontSize:11,color:mu(D),fontStyle:"italic",padding:"4px 2px",background:D?"rgba(99,102,241,.08)":"#f5f3ff",borderRadius:6,display:"inline-block"}}>📊 {query}</div>);
  return (<div style={{margin:"8px 0"}}><img src={imgSrc} alt={query} style={{maxWidth:"100%",maxHeight:260,borderRadius:8,display:"block"}}/><div style={{fontSize:10,color:mu(D),marginTop:2,fontStyle:"italic"}}>{query} (Wikipedia)</div></div>);
}

export function parseTutorContent(text,D){
  const parts=text.split(/\[IMG:\s*([^\]]+)\]/g);
  if(parts.length===1)return (<MD text={text} D={D}/>);
  const out=[];
  for(let i=0;i<parts.length;i++){
    if(i%2===0){if(parts[i].trim())out.push(<MD key={i} text={parts[i]} D={D}/>);}
    else{out.push(<TutorImage key={i} query={parts[i].trim()} D={D}/>);}
  }
  return (<>{out}</>);
}

export function AITutorScreen({D,subjects,allSections,boardSels,boardData,user,googleKey,onBack}){
  const [selSubj,setSS]=useState(subjects[0]?.id||"");
  const [selBoard,setSB]=useState("AQA");
  const [selSec,setSec]=useState("");
  const [mode,setMode]=useState("tutor");
  const [messages,setMsgs]=useState([]);
  const [input,setInput]=useState("");
  const [files,setFiles]=useState([]); 
  const [sending,setSending]=useState(false);
  const [err,setErr]=useState("");
  const [activeModel,setActiveModel]=useState({model:"llama-3.3-70b-versatile", label:"Llama 3.3 70B", dailyLimit:999});
  const [listening,setListening]=useState(false);
  const [quizzing,setQuizzing]=useState(false);
  const [socraticLevel,setSocraticLevel]=useState(2);
  const chatRef=useRef(null);
  const fileRef=useRef(null);
  const subj=subjects.find(function(s){return s.id===selSubj;});
  const secList=allSections.filter(function(s){return s.subjectId===selSubj;});
  const bd2=D?"#2a3347":"#e5e7eb";
  var memKey="gcse:tutor-mem:"+(user||"anon")+":"+selSubj+":"+selBoard;

  useEffect(function(){
    (function(){
      window.storage.get(memKey).then(function(r){
        try{if(r&&r.value){var saved=JSON.parse(r.value);if(Array.isArray(saved)&&saved.length)setMsgs(saved);}}
        catch(e){}
      }).catch(function(){});
    })();
  },[memKey]);

  var saveMemory=function(msgs){
    try{
      var slim=msgs.slice(-20).map(function(m){
        var files=(m._d&&m._d.files||[]).map(function(f){
          if(f.isImage) return {name:f.name,type:f.type,isImage:true}; 
          if(f.isPdf)  return {name:f.name,type:f.type,isPdf:true};
          return {name:f.name,type:f.type};
        });
        return{role:m.role,content:typeof m.content==="string"?m.content:(m._d&&m._d.text||""),_d:{text:m._d&&m._d.text||"",files:files,stag:m._d&&m._d.stag,chips:m._d&&m._d.chips||[]}};
      });
      window.storage.set(memKey,JSON.stringify(slim)).catch(function(){});
    }catch(e){}
  };

  useEffect(function(){if(chatRef.current)chatRef.current.scrollTop=chatRef.current.scrollHeight;},[messages,sending]);

  const reset=function(){setMsgs([]);setInput("");setFiles([]);setErr("");setSocraticLevel(2);try{window.storage.delete(memKey);}catch(e){}};

  const buildCtx=useCallback(()=>{
    const bd3=boardData[`${selSubj}:${selBoard}`]||{custom:[],extras:{},papers:[]};
    const subjectDef=subjects.find(s=>s.id===selSubj);
    // Simplified context building without mergeTopics to avoid dependency
    const secs=secList.filter(s=>selSec?s.id===selSec:true);
    const notes=secs.flatMap(s=>(s.notes||[]).map(n=>`### ${n.heading}\n${stripHtml(n.body)}`)).slice(0,20).join("\n\n");
    const fcs=secs.flatMap(s=>(s.flashcards||[]).map(f=>`Q: ${stripHtml(f.q)}\nA: ${stripHtml(f.a)}`)).slice(0,30).join("\n");
    const qs=secs.flatMap(s=>(s.questions||[]).map(q=>`Q(${q.marks}mk): ${stripHtml(q.text)}\nMS: ${stripHtml(q.markScheme||q.sampleAnswer||"")}`)).slice(0,20).join("\n\n");
    return{notes,fcs,qs,hasContent:!!(notes||fcs||qs)};
  },[selSubj,selBoard,selSec,boardData,subjects,secList]);

  const buildSys=()=>{
    const{notes,fcs,qs}=buildCtx();
    const ctx={notes,fcs,qs};
    const sec=allSections.find(s=>s.id===selSec);
    const topicLabel=sec?sec.title:`${subj?.name||"Unknown"} (${selBoard})`;
    const effectiveLevel = messages.length >= 12 ? Math.max(0, socraticLevel - 1) : socraticLevel;
    return buildTutorSystemPrompt(ctx, mode, selBoard, subj?.name||"", topicLabel, effectiveLevel);
  };

  const readFile=file=>new Promise((res)=>{
    const r=new FileReader();
    if(file.type.startsWith("image/")){
      r.onload=ev=>res({name:file.name,type:file.type,data:ev.target.result.split(",")[1],preview:ev.target.result,isImage:true});
      r.readAsDataURL(file);
    } else if(file.type==="application/pdf"){
      r.onload=ev=>res({name:file.name,type:"application/pdf",data:ev.target.result.split(",")[1],preview:null,isPdf:true});
      r.readAsDataURL(file);
    } else if(file.type.startsWith("text/")){
      r.onload=ev=>res({name:file.name,type:"text",textContent:ev.target.result,preview:null,isText:true});
      r.readAsText(file);
    } else {
      res({name:file.name,type:file.type,unsupported:true,preview:null});
    }
  });

  const addFiles=async e=>{
    const newFiles=await Promise.all(Array.from(e.target.files||[]).map(readFile));
    setFiles(p=>[...p,...newFiles]);
    e.target.value="";
  };

  const send=async()=>{
    if((!input.trim()&&!files.length)||sending)return;
    setSending(true);setErr("");
    try{
    const userText = input || "Please help me with the uploaded file(s).";
    const newMsg={role:"user",content:userText,_d:{text:userText,files:[...files]}};
    const hist=[...messages,newMsg];
    setMsgs(hist);setInput("");setFiles([]);
    const chosenModel=await pickTutorModel(user);
    setActiveModel(chosenModel);
    
    var responseText=null; var lastErr="AI unavailable";
    try{
      responseText=await _aiRequest(buildSys(),hist,1500);
      await incTutorUsage(user,chosenModel.model);
    }catch(e){
      lastErr=e.message||"AI error";
    }
    
    if(responseText){
      var hcNow=buildCtx();
      var stag=hcNow.hasContent?"notes":"general";
      var newMsgsArr=[...hist,{role:"assistant",content:responseText,_d:{text:responseText,stag:stag,chips:[],socraticLevel:socraticLevel}}];
      setMsgs(newMsgsArr);
      saveMemory(newMsgsArr);
      
      _aiRequest('Return ONLY a JSON array of 3 short follow-up questions (max 9 words each). No preamble.',
        [{role:"user",content:"Suggest 3 follow-ups for: "+responseText.slice(0,400)}], 1500
      ).then(function(raw){
        try{
          var s=raw.indexOf("["),e2=raw.lastIndexOf("]");
          if(s<0||e2<0)return;
          var arr=JSON.parse(raw.slice(s,e2+1));
          if(!Array.isArray(arr))return;
          var chipsArr=arr.slice(0,3).map(function(x){return String(x).slice(0,70);});
          setMsgs(function(p){return p.map(function(m,i){return i===p.length-1?Object.assign({},m,{_d:Object.assign({},m._d,{chips:chipsArr})}):m;});});
        }catch(ex){}
      }).catch(function(){});
    }else{
      setErr(lastErr);
      setMsgs(messages);
    }
    }catch(e){setErr(e.message||"Unexpected error");setMsgs(messages);}
    finally{setSending(false);}
  };

  const{hasContent}=buildCtx();

  var quizMe=function(){
    if(sending||quizzing)return;
    setQuizzing(true);setErr("");
    var ctx=buildCtx();
    var sec=allSections.find(function(s){return s.id===selSec;});
    var topic=sec?(sec.title||"this topic"):(subj?(subj.name+" ("+selBoard+")"):"this topic");
    var promptText="Generate 3 rapid-fire GCSE "+selBoard+" exam-style questions on \""+topic+"\". "+
      (ctx.hasContent?"Use this content: "+ctx.notes.slice(0,800)+" "+ctx.fcs.slice(0,400):" Use general GCSE knowledge.")+
      " Format: 1. [Q] (Answer: [A])  2. [Q] (Answer: [A])  3. [Q] (Answer: [A])  Mix question types. Max 25 words each.";
    var userMsg={role:"user",content:"Quiz me on this topic!",_d:{text:"Quiz me on this topic!",files:[],stag:null,chips:[]}};
    var hist2=[...messages,userMsg];
    setMsgs(hist2);
    _aiRequest(buildSys(),[{role:"user",content:promptText}],1500).then(function(rt){
      var nm=[...hist2,{role:"assistant",content:rt,_d:{text:rt,stag:ctx.hasContent?"notes":"general",chips:["What is the answer to Q1?","Explain Q2 further","Give me 3 more questions"]}}];
      setMsgs(nm);saveMemory(nm);setQuizzing(false);
    }).catch(function(e){setErr("Quiz failed: "+e.message);setMsgs(messages);setQuizzing(false);});
  };

  var startVoice=function(){
    var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){setErr("Voice not supported in this browser.");return;}
    var rec=new SR();
    rec.lang="en-GB";rec.continuous=false;rec.interimResults=false;
    rec.onstart=function(){setListening(true);};
    rec.onend=function(){setListening(false);};
    rec.onerror=function(){setListening(false);};
    rec.onresult=function(ev){var t=ev.results[0]&&ev.results[0][0]&&ev.results[0][0].transcript||"";if(t)setInput(function(p){return p?p+" "+t:t;});};
    rec.start();
  };

  const fileIcon=f=>f.isImage?"🖼️":f.isPdf?"📄":f.isText?"📝":f.name?.endsWith(".pptx")||f.name?.endsWith(".ppt")?"📊":f.name?.endsWith(".docx")||f.name?.endsWith(".doc")?"📝":"📎";

  return (
    <div style={{minHeight:"100vh",background:D?"#0f1117":"#f9fafb",display:"flex",flexDirection:"column",color:tx(D)}} className="fade-in">
      <div style={{borderBottom:`1px solid ${bd2}`,background:D?"#0d1117":"#fff",padding:"10px 16px",flexShrink:0}}>
        <div style={{maxWidth:800,margin:"0 auto"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
            <button onClick={onBack} style={{fontSize:13,color:mu(D),background:"none",border:"none",cursor:"pointer",flexShrink:0}}>← Back</button>
            <h2 style={{fontSize:16,fontWeight:700,color:tx(D),flex:1}}>🤖 ReviseIQ AI Tutor</h2>
            <div style={{display:"flex",gap:6}}>
              {[["tutor","📚 Tutor"],["homework","📝 Homework Help"]].map(([m,lbl])=>(
                <button key={m} onClick={()=>{setMode(m);reset();}}
                  style={{fontSize:11,padding:"5px 12px",borderRadius:20,border:`1.5px solid ${mode===m?"#6366f1":bd2}`,
                    background:mode===m?"#6366f1":"transparent",color:mode===m?"#fff":mu(D),cursor:"pointer",fontWeight:mode===m?700:400}}>{lbl}</button>
              ))}
            </div>
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <select style={{...I(D,{flex:1,minWidth:110,maxWidth:190})}} value={selSubj} onChange={e=>{setSS(e.target.value);setSec("");reset();}}>
              {subjects.map(s=><option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
            </select>
            <select style={{...I(D,{width:92})}} value={selBoard} onChange={e=>{setSB(e.target.value);reset();}}>
              {["AQA","Edexcel","OCR","Eduqas","WJEC"].map(b=><option key={b} value={b}>{b}</option>)}
            </select>
            <select style={{...I(D,{flex:1,minWidth:120})}} value={selSec} onChange={e=>{setSec(e.target.value);reset();}}>
              <option value="">All topics</option>
              {secList.map(s=><option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
            <div style={{display:"flex",alignItems:"center",gap:6,marginLeft:"auto"}}>
              <span title={`Responding with: ${activeModel.label}`} style={{fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:10,background:D?"rgba(16,185,129,.15)":"#ecfdf5",color:"#059669",cursor:"default"}}>{activeModel.label}</span>
              <span title={socraticLevel===2?"Socratic: asks guiding questions before explaining":socraticLevel===1?"Guided: explains then prompts recall":"Direct: gives answers immediately"}
                style={{fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:10,cursor:"pointer",
                  background:socraticLevel===2?(D?"rgba(99,102,241,.2)":"#eef2ff"):socraticLevel===1?(D?"rgba(245,158,11,.15)":"#fffbeb"):(D?"rgba(16,185,129,.12)":"#ecfdf5"),
                  color:socraticLevel===2?"#6366f1":socraticLevel===1?"#d97706":"#059669"}}
                onClick={()=>setSocraticLevel(function(v){return v>0?v-1:2;})}>
                {socraticLevel===2?"🎓 Socratic":socraticLevel===1?"💬 Guided":"⚡ Direct"}
              </span>
              {messages.length>0&&<button onClick={reset} style={{fontSize:11,color:mu(D),background:"none",border:`1px solid ${bd2}`,borderRadius:8,padding:"4px 10px",cursor:"pointer"}}>↺ New chat</button>}
            </div>
          </div>
          {!hasContent&&<div style={{marginTop:8,padding:"6px 12px",borderRadius:8,background:D?"rgba(245,158,11,.08)":"#fffbeb",border:"1px solid #f59e0b",fontSize:11,color:D?"#fcd34d":"#92400e"}}>⚠️ No revision notes added for this selection — tutor will use general GCSE knowledge.</div>}
        </div>
      </div>

      <div ref={chatRef} style={{flex:1,overflowY:"auto",padding:"16px",display:"flex",flexDirection:"column",gap:14,minHeight:0}}>
        {messages.length===0&&(
          <div style={{textAlign:"center",padding:"48px 20px",color:mu(D),maxWidth:500,margin:"0 auto"}}>
            <div style={{fontSize:52,marginBottom:12}}>🤖</div>
            <p style={{fontWeight:700,fontSize:16,marginBottom:8,color:tx(D)}}>ReviseIQ AI Tutor</p>
            <p style={{fontSize:13,marginBottom:10,lineHeight:1.6}}>{mode==="tutor"
              ?"Start by telling me what you already know about the topic — I'll guide you to fill the gaps."
              :"Share your homework by uploading a photo, PDF or file, or paste the question below. I'll ask guiding questions to help you reach the answer yourself."}</p>
            <p style={{fontSize:11,color:mu(D),marginBottom:6}}>{hasContent?"Drawing from your revision notes and flashcards.":"Using general GCSE knowledge."}</p>
            <p style={{fontSize:10,color:mu(D)}}>{socraticLevel===2?"🎓 Socratic mode — I'll ask what you know first":socraticLevel===1?"💬 Guided mode — I'll explain then prompt recall":"⚡ Direct mode — I'll give complete answers"}</p>
          </div>
        )}
        {messages.map(function(m,i){
          var isU=m.role==="user";
          var stag=m._d&&m._d.stag;
          var chips=(m._d&&m._d.chips)||[];
          return (
            <div key={i} style={{display:"flex",flexDirection:"column",alignItems:isU?"flex-end":"flex-start",gap:4}}>
              <div style={{display:"flex",justifyContent:isU?"flex-end":"flex-start",gap:8,width:"100%"}}>
                {!isU&&<div style={{width:30,height:30,borderRadius:"50%",background:"#6366f1",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0,marginTop:2}}>🤖</div>}
                <div style={{maxWidth:"80%",padding:"10px 14px",
                  borderRadius:isU?"16px 16px 4px 16px":"16px 16px 16px 4px",
                  background:isU?"#6366f1":(D?"#1e2537":"#f3f4f6"),
                  color:isU?"#fff":tx(D),fontSize:13,lineHeight:1.7}}>
                  {m._d&&m._d.files&&m._d.files.map(function(f,fi){
                    return f.isImage
                      ?<img key={fi} src={f.preview} alt={f.name} style={{maxWidth:"100%",maxHeight:180,borderRadius:6,marginBottom:6,display:"block"}}/>
                      :<div key={fi} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 8px",borderRadius:6,background:"rgba(255,255,255,.15)",marginBottom:5,fontSize:11}}>
                         <span>{fileIcon(f)}</span><span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.name}</span>
                       </div>;
                  })}
                  {isU
                    ?<p style={{margin:0}}>{m._d&&m._d.text||""}</p>
                    :parseTutorContent(m._d&&m._d.text||m.content||"",D)
                  }
                  {!isU&&stag&&(
                    <div style={{marginTop:6,display:"inline-flex",alignItems:"center",gap:4,padding:"2px 8px",borderRadius:10,fontSize:10,fontWeight:600,
                      background:stag==="notes"?(D?"rgba(16,185,129,.12)":"#d1fae5"):(D?"rgba(99,102,241,.12)":"#ede9fe"),
                      color:stag==="notes"?"#059669":"#7c3aed"}}>
                      {stag==="notes"?"Your notes":"General knowledge"}
                    </div>
                  )}
                </div>
                {isU&&<div style={{width:30,height:30,borderRadius:"50%",background:D?"#374151":"#e5e7eb",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0,marginTop:2}}>👤</div>}
              </div>
              {!isU&&chips.length>0&&(
                <div style={{paddingLeft:38,display:"flex",gap:5,flexWrap:"wrap"}}>
                  {chips.map(function(q,qi){return(
                    <button key={qi} onClick={function(){setInput(q);}}
                      style={{fontSize:11,padding:"3px 10px",borderRadius:14,border:"1px solid "+(D?"#374151":"#d1d5db"),background:D?"#1e2537":"#fff",color:mu(D),cursor:"pointer"}}>
                      {q}
                    </button>
                  );})}
                </div>
              )}
            </div>
          );
        })}
        {sending&&(
          <div style={{display:"flex",gap:8,justifyContent:"flex-start"}}>
            <div style={{width:30,height:30,borderRadius:"50%",background:"#6366f1",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>🤖</div>
            <div style={{padding:"10px 14px",borderRadius:"16px 16px 16px 4px",background:D?"#1e2537":"#f3f4f6",fontSize:13,color:mu(D)}}>
              <span>Thinking</span><span style={{animation:"none"}}>…</span>
            </div>
          </div>
        )}
      </div>

      <div style={{borderTop:`1px solid ${bd2}`,background:D?"#0d1117":"#fff",padding:"10px 16px",flexShrink:0}}>
        <div style={{maxWidth:800,margin:"0 auto"}}>
          {files.length>0&&(
            <div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap"}}>
              {files.map((f,fi)=>(
                <div key={fi} style={{position:"relative",display:"flex",alignItems:"center",gap:5,padding:"4px 8px",borderRadius:8,background:D?"#1e2537":"#f3f4f6",border:`1px solid ${bd2}`,maxWidth:160}}>
                  {f.isImage&&<img src={f.preview} alt="" style={{height:28,width:28,objectFit:"cover",borderRadius:4,flexShrink:0}}/>}
                  {!f.isImage&&<span style={{fontSize:14,flexShrink:0}}>{fileIcon(f)}</span>}
                  <span style={{fontSize:10,color:mu(D),overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.name}</span>
                  <button onClick={()=>setFiles(p=>p.filter((_,i)=>i!==fi))}
                    style={{flexShrink:0,background:"#ef4444",color:"#fff",border:"none",borderRadius:"50%",width:14,height:14,fontSize:9,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1}}>×</button>
                </div>
              ))}
            </div>
          )}
          {err&&<p style={{fontSize:11,color:"#ef4444",marginBottom:6}}>{err}</p>}
          <div style={{display:"flex",gap:6,marginBottom:6}}>
            <button onClick={quizMe} disabled={sending||quizzing}
              style={{...B("#f59e0b",false,{fontSize:11,padding:"4px 12px",fontWeight:700,opacity:(sending||quizzing)?0.5:1,cursor:(sending||quizzing)?"not-allowed":"pointer"})}}>
              {quizzing?"Generating…":"Quiz Me"}
            </button>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
            <input ref={fileRef} type="file" multiple style={{display:"none"}} onChange={addFiles}/>
            <button onClick={function(){if(fileRef.current)fileRef.current.click();}} title="Upload files"
              style={{...B("transparent",true,{fontSize:16,padding:"7px 10px",borderColor:bd2,color:mu(D),flexShrink:0})}}>📎</button>
            <button onClick={startVoice} title={listening?"Listening…":"Voice input"}
              style={{...B(listening?"#ef4444":"transparent",!listening,{fontSize:16,padding:"7px 10px",flexShrink:0,borderColor:listening?"#ef4444":bd2,color:listening?"#ef4444":mu(D)})}}>
              {listening?"●":"🎤"}
            </button>
            <textarea value={input} onChange={function(e){setInput(e.target.value);}} rows={2}
              onKeyDown={function(e){if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}}
              placeholder={listening?"Listening…":mode==="homework"?"Ask a question or describe your homework…":"Ask about this topic…"}
              style={{...I(D,{flex:1,resize:"none",lineHeight:1.6,padding:"8px 12px"})}}/>
            <button onClick={send} disabled={sending||(!input.trim()&&!files.length)}
              style={{...B("#6366f1",false,{padding:"9px 16px",flexShrink:0,fontSize:16,
                opacity:sending||(!input.trim()&&!files.length)?0.4:1,
                cursor:sending||(!input.trim()&&!files.length)?"not-allowed":"pointer"})}}>→</button>
          </div>
          <p style={{fontSize:10,color:mu(D),marginTop:5,textAlign:"center"}}>Using <strong>{activeModel.label}</strong> · May make mistakes — verify with your teacher</p>
        </div>
      </div>
    </div>
  );
}

// ─── EXAM TECHNIQUE COACH ───────────────────────────────────────────────────
export const COMMAND_WORDS = [
  {word:"Explain",boards:["AQA","Edexcel","OCR","WJEC"],tip:"Give clear reasons — use 'because', 'therefore', 'this means'. Chain causes to effects. Don't just describe; show causation.",scaffold:["Point","Reasoning","Evidence","Impact"]},
  {word:"Evaluate",boards:["AQA","Edexcel","OCR","WJEC"],tip:"Weigh up both sides, then commit to a clear judgement. AQA rewards a final 'Overall…' sentence. Don't just list pros and cons.",scaffold:["Argument for","Counter-argument","Evidence for both","Overall judgement"]},
  {word:"Analyse",boards:["AQA","Edexcel","OCR","WJEC"],tip:"Break the topic into components and examine each in depth. Explain the significance of each part. Avoid surface description.",scaffold:["Key component","How it works / why it matters","Evidence","Wider significance"]},
  {word:"Compare",boards:["AQA","Edexcel","OCR","WJEC"],tip:"Identify specific similarities AND differences. Use comparative connectives: 'whereas', 'similarly', 'in contrast'. Link directly — don't write two separate accounts.",scaffold:["Similarity","Difference","Evidence for each","Overall comparison"]},
  {word:"Describe",boards:["AQA","Edexcel","OCR","WJEC"],tip:"Give accurate, detailed features. Use subject-specific vocabulary. A strong description has multiple developed points, not a list.",scaffold:["Feature 1","Feature 2","Feature 3","Supporting detail"]},
  {word:"Assess",boards:["AQA","Edexcel","OCR"],tip:"Weigh up the relative importance or validity. Consider criteria: how much? how significant? how reliable? Reach a reasoned conclusion.",scaffold:["Claim","Supporting evidence","Limitation / counter","Reasoned conclusion"]},
  {word:"Discuss",boards:["AQA","Edexcel","OCR","WJEC"],tip:"Present multiple perspectives with evidence. Don't just list views — evaluate their merit. A conclusion that synthesises the debate gains top marks.",scaffold:["View 1 + evidence","View 2 + evidence","Evaluation of both","Synthesised conclusion"]},
  {word:"Justify",boards:["AQA","Edexcel","OCR"],tip:"Give strong reasons for a decision or position. Anticipate objections and explain why your reasoning outweighs them.",scaffold:["Decision / position","Reason 1 + evidence","Reason 2 + evidence","Why alternative is weaker"]},
  {word:"Examine",boards:["AQA","Edexcel"],tip:"Investigate carefully, looking at different aspects. Similar to Analyse — go beyond surface description to probe causes, effects and significance.",scaffold:["Aspect 1 — detail","Aspect 2 — detail","Relationship between aspects","Overall finding"]},
  {word:"To what extent",boards:["AQA","Edexcel","OCR","WJEC"],tip:"Always take a clear position. Structure: agree partially, then qualify. Your extent should be explicit: 'largely', 'to a limited extent', 'primarily because…'",scaffold:["Main argument (extent)","Supporting evidence","Counter-argument","Qualified conclusion stating extent"]},
];

export function ExamCoachScreen({D,subjects,allSections,boardSels,boardData,onBack}) {
  const bg=D?"#0f1117":"#f9fafb", tx2=D?"#e8ecf4":"#111827", mu2=D?"#9ca3af":"#6b7280";
  const C2=D?{background:"#161b27",border:"1px solid #2a3347",borderRadius:14}:{background:"#fff",border:"1px solid #e5e7eb",borderRadius:14};

  const [selSubj, setSelSubj] = React.useState(subjects[0]?.id||"");
  const [selCW, setSelCW] = React.useState(COMMAND_WORDS[0].word);
  const [phase, setPhase] = React.useState("setup"); 
  const [question, setQuestion] = React.useState("");
  const [loadingQ, setLoadingQ] = React.useState(false);
  const [scaffold, setScaffold] = React.useState({});
  const [submitting, setSubmitting] = React.useState(false);
  const [feedback, setFeedback] = React.useState(null);
  const [errMsg, setErrMsg] = React.useState("");

  const subjDef = subjects.find(function(s){return s.id===selSubj;});
  const board = subjDef ? (boardSels[subjDef.id]||"AQA") : "AQA";
  const cmdDef = COMMAND_WORDS.find(function(c){return c.word===selCW;})||COMMAND_WORDS[0];

  function getContextNotes(){
    const secs = allSections.filter(function(s){return s.subjectId===selSubj;});
    return secs.flatMap(function(s){
      return (s.notes||[]).map(function(n){return n.heading+": "+stripHtml(n.body);});
    }).slice(0,12).join("\n");
  }

  function generateQuestion(){
    setLoadingQ(true); setErrMsg(""); setQuestion(""); setFeedback(null); setScaffold({});
    const notes = getContextNotes();
    const prompt = "You are a "+board+" GCSE "+( subjDef?subjDef.name:"subject")+" examiner.\n"+
      "Generate ONE exam-quality practice question using the command word '"+selCW+"'.\n"+
      (notes?"Base it on this revision content:\n"+notes+"\n\n":"Generate a typical "+board+" GCSE "+( subjDef?subjDef.name:"subject")+" question.\n\n")+
      "Requirements:\n"+
      "- Start the question with '"+selCW+"'\n"+
      "- Use authentic "+board+" GCSE style and command word conventions\n"+
      "- Include a mark allocation (e.g. [6 marks] or [8 marks])\n"+
      "- Make it appropriately challenging for GCSE level\n\n"+
      "Respond ONLY with the question text. No preamble, no explanation.";
    _aiWithRetry(
      function(){ return callAI(prompt, 200).then(function(t){ if(!t||!t.trim()) throw new Error("Empty"); return t.trim(); }); },
      2,
      function(){
        return selCW+" the key factors that influence [a relevant concept in "+( subjDef?subjDef.name:"this subject")+"]. Use specific evidence to support your answer. [6 marks]";
      }
    ).then(function(text){
      setQuestion(text);
      setPhase("practice");
      setLoadingQ(false);
    }).catch(function(e){
      setErrMsg("Could not generate question: "+e.message);
      setLoadingQ(false);
    });
  }

  function submitAnswer(){
    const filled = cmdDef.scaffold.map(function(label,i){return label+": "+(scaffold[i]||"");}).join("\n\n");
    if(!filled.replace(/[:\s]/g,"").trim()){setErrMsg("Please fill in at least one section before submitting.");return;}
    setSubmitting(true); setErrMsg("");
    var marksMatch = question.match(/\[(\d+)\s*marks?\]/i);
    var detectedMarks = marksMatch ? parseInt(marksMatch[1]) : 8;
    var syntheticQ = {
      text:       question,
      marks:      detectedMarks,
      markScheme: 'Assessment criteria: (1) Correct use of command word "'+selCW+'" — '+cmdDef.tip+
                  ' (2) Subject accuracy and relevant content. (3) Clear, developed explanation. Award marks proportionally.',
      sampleAnswer: '',
      type:       detectedMarks >= 6 ? 'extended' : 'short',
      board:      board,
    };
    var structuredAnswer = cmdDef.scaffold.map(function(label,i){
      var val = (scaffold[i]||'').trim();
      return val ? label+': '+val : null;
    }).filter(Boolean).join('\n\n');

    aiServiceFeedbackRubric(syntheticQ, structuredAnswer).then(function(result){
      var scoreNum = result.score || 0;
      var bandMap = {'Not attempted':'Developing','Developing':'Developing','Achieving':'Achieving','Exceeding':'Exceeding'};
      var mapped = {
        overallBand:        bandMap[result.band] || 'Developing',
        score:              scoreNum+'/'+detectedMarks,
        strengths:          result.strengths && result.strengths.length ? result.strengths : ['Attempted a structured response'],
        improvements:       result.missedPoints && result.missedPoints.length ? result.missedPoints : ['Develop your points further with more subject-specific detail'],
        commandWordFeedback:result.feedback || 'Check you have used the command word "'+selCW+'" correctly.',
        modelAnswer:        result.modelAnswer || '',
        examTip:            result.examTip || cmdDef.tip,
      };
      setFeedback(mapped); setPhase("feedback");
      setSubmitting(false);
    }).catch(function(e){
      setFeedback({
        overallBand: 'Developing',
        score: '—/'+detectedMarks,
        strengths: ['Attempted a structured response'],
        improvements: ['AI feedback unavailable — self-assess using the command word guidance below'],
        commandWordFeedback: cmdDef.tip,
        modelAnswer: '',
        examTip: 'Re-read the mark scheme and identify which scaffold sections need more development.',
      });
      setPhase("feedback");
      setSubmitting(false);
    });
  }

  function reset(){setPhase("setup");setQuestion("");setFeedback(null);setScaffold({});setErrMsg("");}

  const bandColor = feedback ? (feedback.overallBand==="Exceeding"?"#10b981":feedback.overallBand==="Achieving"?"#3b82f6":"#f59e0b") : "#6366f1";

  return (
    <div style={{minHeight:"100vh",background:bg,color:tx2}} className="fade-in">
      <div style={{maxWidth:760,margin:"0 auto",padding:"28px 24px"}}>
        <button onClick={onBack} style={{fontSize:13,color:mu2,background:"none",border:"none",cursor:"pointer",marginBottom:20}}>← Home</button>
        <h2 style={{fontSize:22,fontWeight:700,marginBottom:4}}>✍️ Exam Technique Coach</h2>
        <p style={{fontSize:13,color:mu2,marginBottom:24}}>Master command words with structured practice and AI feedback.</p>

        <div style={{...C2,padding:22,marginBottom:20}}>
          <div style={{display:"flex",gap:14,flexWrap:"wrap",marginBottom:16}}>
            <div style={{flex:1,minWidth:140}}>
              <label style={{fontSize:11,fontWeight:600,color:mu2,display:"block",marginBottom:6}}>SUBJECT</label>
              <select value={selSubj} onChange={function(e){setSelSubj(e.target.value);reset();}}
                style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid "+(D?"#374151":"#d1d5db"),background:D?"#1e2537":"#fff",color:tx2,fontSize:13}}>
                {subjects.map(function(s){return <option key={s.id} value={s.id}>{s.icon} {s.name}</option>;})}
              </select>
            </div>
            <div style={{flex:2,minWidth:180}}>
              <label style={{fontSize:11,fontWeight:600,color:mu2,display:"block",marginBottom:6}}>COMMAND WORD</label>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {COMMAND_WORDS.map(function(cw){
                  const sel = selCW===cw.word;
                  return <button key={cw.word} onClick={function(){setSelCW(cw.word);reset();}}
                    style={{padding:"6px 12px",borderRadius:20,border:"1.5px solid "+(sel?"#6366f1":"#d1d5db"),background:sel?"#6366f1":"transparent",color:sel?"#fff":mu2,fontSize:12,cursor:"pointer",fontWeight:sel?600:400,transition:"all .12s"}}>
                    {cw.word}
                  </button>;
                })}
              </div>
            </div>
          </div>

          <div style={{padding:"12px 14px",borderRadius:10,background:D?"#1a1a2e":"#eef2ff",border:"1px solid "+(D?"#312e81":"#c7d2fe"),marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:700,color:"#6366f1",marginBottom:4}}>{board} · {selCW}</div>
            <p style={{fontSize:13,color:D?"#c7d2fe":"#3730a3",margin:0,lineHeight:1.6}}>{cmdDef.tip}</p>
          </div>

          <button onClick={generateQuestion} disabled={loadingQ}
            style={{padding:"10px 22px",borderRadius:10,border:"none",background:loadingQ?"#a5b4fc":"#6366f1",color:"#fff",fontSize:13,fontWeight:600,cursor:loadingQ?"not-allowed":"pointer"}}>
            {loadingQ?"Generating question…":"🎲 Generate Practice Question"}
          </button>
          {errMsg&&phase==="setup"&&<p style={{fontSize:12,color:"#ef4444",marginTop:8}}>{errMsg}</p>}
        </div>

        {phase!=="setup"&&question&&(
          <div style={{...C2,padding:22,marginBottom:20}}>
            <div style={{fontSize:11,fontWeight:700,color:"#6366f1",marginBottom:8}}>PRACTICE QUESTION</div>
            <p style={{fontSize:15,fontWeight:600,lineHeight:1.7,marginBottom:20}}>{question}</p>

            {phase==="practice"&&(
              <>
                <div style={{fontSize:11,fontWeight:700,color:mu2,marginBottom:12}}>SCAFFOLD YOUR ANSWER — {selCW.toUpperCase()} STRUCTURE</div>
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  {cmdDef.scaffold.map(function(label,i){
                    return (
                      <div key={i}>
                        <label style={{fontSize:12,fontWeight:600,color:"#6366f1",display:"block",marginBottom:4}}>{i+1}. {label}</label>
                        <textarea value={scaffold[i]||""} onChange={function(e){setScaffold(function(p){var n=Object.assign({},p);n[i]=e.target.value;return n;});}}
                          placeholder={"Write your "+label.toLowerCase()+" here…"}
                          style={{width:"100%",minHeight:72,padding:"10px 12px",borderRadius:8,border:"1px solid "+(D?"#374151":"#d1d5db"),background:D?"#1e2537":"#f9fafb",color:tx2,fontSize:13,resize:"vertical",boxSizing:"border-box",fontFamily:"inherit"}}/>
                      </div>
                    );
                  })}
                </div>
                {errMsg&&phase==="practice"&&<p style={{fontSize:12,color:"#ef4444",marginTop:8}}>{errMsg}</p>}
                <div style={{display:"flex",gap:10,marginTop:16}}>
                  <button onClick={submitAnswer} disabled={submitting}
                    style={{padding:"10px 22px",borderRadius:10,border:"none",background:submitting?"#a5b4fc":"#6366f1",color:"#fff",fontSize:13,fontWeight:600,cursor:submitting?"not-allowed":"pointer"}}>
                    {submitting?"Getting feedback…":"📬 Submit for Feedback"}
                  </button>
                  <button onClick={reset} style={{padding:"10px 16px",borderRadius:10,border:"1px solid "+(D?"#374151":"#d1d5db"),background:"transparent",color:mu2,fontSize:13,cursor:"pointer"}}>Start over</button>
                </div>
              </>
            )}

            {phase==="feedback"&&feedback&&(
              <div className="fade-in">
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,padding:"14px 18px",borderRadius:12,background:D?"#161b27":"#f8fafc",border:"1.5px solid "+bandColor}}>
                  <div style={{textAlign:"center"}}>
                    <div style={{fontSize:22,fontWeight:800,color:bandColor}}>{feedback.score}</div>
                    <div style={{fontSize:10,color:mu2,fontWeight:600}}>{feedback.overallBand}</div>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:700,color:bandColor,marginBottom:3}}>{feedback.overallBand}</div>
                    <p style={{fontSize:12,color:D?"#c7d2fe":"#4338ca",margin:0,lineHeight:1.5}}>{feedback.commandWordFeedback}</p>
                  </div>
                </div>

                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
                  <div style={{padding:"12px 14px",borderRadius:10,background:D?"#052e16":"#f0fdf4",border:"1px solid "+(D?"#166534":"#bbf7d0")}}>
                    <div style={{fontSize:11,fontWeight:700,color:"#16a34a",marginBottom:6}}>✓ Strengths</div>
                    {(feedback.strengths||[]).map(function(s,i){return <p key={i} style={{fontSize:12,color:D?"#86efac":"#15803d",margin:"0 0 4px",lineHeight:1.5}}>• {s}</p>;})}
                  </div>
                  <div style={{padding:"12px 14px",borderRadius:10,background:D?"#431407":"#fff7ed",border:"1px solid "+(D?"#9a3412":"#fed7aa")}}>
                    <div style={{fontSize:11,fontWeight:700,color:"#ea580c",marginBottom:6}}>↑ Improve</div>
                    {(feedback.improvements||[]).map(function(s,i){return <p key={i} style={{fontSize:12,color:D?"#fdba74":"#c2410c",margin:"0 0 4px",lineHeight:1.5}}>• {s}</p>;})}
                  </div>
                </div>

                <div style={{padding:"12px 14px",borderRadius:10,background:D?"#1a1a2e":"#eef2ff",border:"1px solid "+(D?"#312e81":"#c7d2fe"),marginBottom:12}}>
                  <div style={{fontSize:11,fontWeight:700,color:"#6366f1",marginBottom:4}}>Model Answer</div>
                  <p style={{fontSize:13,color:D?"#c7d2fe":"#3730a3",margin:0,lineHeight:1.65}}>{feedback.modelAnswer}</p>
                </div>

                <div style={{padding:"10px 14px",borderRadius:10,background:D?"#0f172a":"#f8fafc",border:"1px solid "+(D?"#1e293b":"#e2e8f0"),marginBottom:16}}>
                  <span style={{fontSize:11,fontWeight:700,color:mu2}}>💡 Exam tip: </span>
                  <span style={{fontSize:12,color:D?"#e2e8f0":"#475569"}}>{feedback.examTip}</span>
                </div>

                <div style={{display:"flex",gap:10}}>
                  <button onClick={generateQuestion} disabled={loadingQ}
                    style={{padding:"10px 18px",borderRadius:10,border:"none",background:"#6366f1",color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer"}}>
                    🎲 New Question
                  </button>
                  <button onClick={reset} style={{padding:"10px 16px",borderRadius:10,border:"1px solid "+(D?"#374151":"#d1d5db"),background:"transparent",color:mu2,fontSize:13,cursor:"pointer"}}>Change command word</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PRACTICE SESSION SCREEN ────────────────────────────────────────────────
export function PracticeSessionScreen({D, session, onBack, onOpenBlock, onComplete, onReset}) {
  const [done, setDone] = React.useState({});
  const blocks = session?.blocks || [];
  const completeCount = blocks.filter(b => done[b.id]).length;
  const pct = blocks.length ? Math.round((completeCount / blocks.length) * 100) : 0;
  const bd2=D?"#2a3347":"#e5e7eb";

  function toggleDone(id) {
    setDone(prev => {
      const next = {...prev, [id]: !prev[id]};
      const finished = blocks.length>0 && blocks.every(b => next[b.id]);
      if (finished) onComplete && onComplete();
      return next;
    });
  }

  return (
    <div style={{minHeight:"100vh",background:D?"#0f1117":"#f9fafb",color:tx(D)}} className="fade-in">
      <div style={{maxWidth:820,margin:"0 auto",padding:"32px 24px"}}>
        <button onClick={onBack} style={{fontSize:13,color:mu(D),background:"none",border:"none",cursor:"pointer",marginBottom:18}}>← Back</button>
        <h2 style={{fontSize:22,fontWeight:700,marginBottom:4}}>🎯 {session?.missionTitle||"Guided Session"}</h2>
        <p style={{fontSize:13,color:mu(D),marginBottom:16}}>{session?.missionSubtitle||"Complete your recommended study blocks."}</p>
        <div style={{height:8,borderRadius:999,background:D?"#1e2537":"#e5e7eb",overflow:"hidden",marginBottom:16}}>
          <div style={{height:"100%",width:pct+"%",background:"#6366f1",transition:"width .25s ease"}}/>
        </div>
        <p style={{fontSize:12,color:mu(D),marginBottom:18}}>{completeCount}/{blocks.length} blocks complete</p>

        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {blocks.map((b,idx)=>(
            <div key={b.id} style={{...C(D),padding:14,borderColor:done[b.id]?"#16a34a":undefined}}>
              <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"flex-start"}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:11,color:mu(D),marginBottom:4}}>Block {idx+1} · {b.etaMin} min</div>
                  <div style={{fontWeight:700,fontSize:14,marginBottom:3}}>{b.title}</div>
                  <div style={{fontSize:12,color:mu(D)}}>{b.detail}</div>
                </div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <button onClick={()=>onOpenBlock&&onOpenBlock(b)} style={{...B("#6366f1",false,{fontSize:12,padding:"7px 12px"})}}>Open</button>
                  <button onClick={()=>toggleDone(b.id)} style={{...B(done[b.id]?"#16a34a":"transparent",!done[b.id],{fontSize:12,padding:"7px 12px",borderColor:done[b.id]?"#16a34a":bd2,color:done[b.id]?"#fff":mu(D)})}}>
                    {done[b.id]?"Done":"Mark done"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{display:"flex",gap:10,marginTop:18}}>
          <button onClick={onReset} style={{...B("transparent",true,{padding:"10px 14px",fontSize:13,borderColor:bd2,color:mu(D)})}}>Regenerate Plan</button>
          <button onClick={onBack} style={{...B("#111827",false,{padding:"10px 14px",fontSize:13})}}>Return Home</button>
        </div>
      </div>
    </div>
  );
}
```
