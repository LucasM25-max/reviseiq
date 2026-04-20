import React, { useEffect, useState } from "react";

const stripHtml = (s) => (s || "").replace(/<[^>]*>/g, "").trim();

function useSchoolLeaderboard(user, school) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!school) return;
    setLoading(true);
    (async () => {
      try {
        const res = await window.storage.list("gcse:lb:", true);
        if (!res?.keys?.length) { setLoading(false); return; }
        const fetched = await Promise.allSettled(res.keys.map(k => window.storage.get(k, true)));
        const all = fetched.filter(r => r.status === "fulfilled" && r.value?.value)
          .map(r => { try { return JSON.parse(r.value.value); } catch(e){ return null; } })
          .filter(e => e && e.username && e.school);
        // Filter to only active accounts
        let activeUsernames = new Set();
        try{const ar2=await window.storage.get("gcse:accounts",true);if(ar2?.value){const accs2=JSON.parse(ar2.value);Object.keys(accs2).forEach(k=>activeUsernames.add(k.toLowerCase()));}}catch(_){}
        const schoolNorm = school.trim().toLowerCase();
        const filtered = activeUsernames.size>0
          ? all.filter(e => e.school.trim().toLowerCase() === schoolNorm && activeUsernames.has(e.username.toLowerCase()))
          : all.filter(e => e.school.trim().toLowerCase() === schoolNorm);
        setEntries(filtered.sort((a, b) => (b.score||0) - (a.score||0)));
      } catch (_) {}
      setLoading(false);
    })();
  }, [school]);
  return { entries, loading };
}

function SchoolLeaderboard({ user, school, D }) {
  const { entries, loading } = useSchoolLeaderboard(user, school);
  if (!school) return (
    <div style={{marginTop:14,padding:"10px 14px",borderRadius:10,background:D?"#1e2537":"#f3f4f6",fontSize:12,color:D?"#9ca3af":"#6b7280"}}>
      🏫 Add your school during sign-up to see how you rank among classmates.
    </div>
  );
  if (loading) return <div style={{marginTop:14,fontSize:12,color:D?"#8896b3":"#9ca3af"}}>Loading school leaderboard…</div>;
  if (!entries.length) return (
    <div style={{marginTop:14,padding:"10px 14px",borderRadius:10,background:D?"#1e2537":"#f3f4f6",fontSize:12,color:D?"#9ca3af":"#6b7280"}}>
      🏆 No other students from <strong>{school}</strong> yet — invite your classmates!
    </div>
  );
  const mu2 = D ? "#8896b3" : "#9ca3af";
  const tx2 = D ? "#e8ecf4" : "#111827";
  return (
    <div style={{marginTop:14}}>
      <p style={{fontSize:11,fontWeight:600,color:mu2,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:8}}>🏫 {school} Leaderboard</p>
      <div style={{display:"flex",flexDirection:"column",gap:4,maxHeight:340,overflowY:"auto",paddingRight:2}}>
        {entries.map((e,i) => {
          const isMe = e.username === user;
          const medal = i===0?"🥇":i===1?"🥈":i===2?"🥉":null;
          const name = e.displayName || e.username || "";
          return (
            <div key={e.username} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 12px",borderRadius:8,
              background:isMe?(D?"rgba(99,102,241,.2)":"#eef2ff"):(D?"#1f2937":"#f9fafb"),
              border:isMe?"1.5px solid #6366f1":"1.5px solid transparent",flexShrink:0}}>
              <span style={{fontSize:13,width:22,textAlign:"center"}}>{medal||<span style={{fontSize:11,color:mu2,fontFamily:"monospace"}}>#{i+1}</span>}</span>
              <span style={{flex:1,fontSize:13,fontWeight:isMe?700:400,color:isMe?"#6366f1":tx2}}>{name}{isMe?" (you)":""}</span>
              <span style={{fontSize:12,fontWeight:600,color:mu2}}>{e.score||0} pts</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function mergeTopics(baseTopics, boardCustom, boardExtras) {
  function expandAdminTopic(cs) {
    const subs = cs.subtopics||[];
    if (subs.length > 0) {
      return subs.map(st => ({
        id: st.id, title: st.title, src: "admin",
        _parentTopicId: cs.id, _parentTopicTitle: cs.title, _isSubtopic: true,
        notes: [...(st.notes||[]), ...(boardExtras[st.id]?.notes||[])],
        flashcards: [...(st.flashcards||[]), ...(boardExtras[st.id]?.flashcards||[])],
        questions: [...(st.questions||[]), ...(boardExtras[st.id]?.questions||[])],
      }));
    }
    return [{ ...cs, _parentTopicId: cs.id, _parentTopicTitle: cs.title, _isSubtopic: false,
      notes: [...(cs.notes||[]), ...(boardExtras[cs.id]?.notes||[])],
      flashcards: [...(cs.flashcards||[]), ...(boardExtras[cs.id]?.flashcards||[])],
      questions: [...(cs.questions||[]), ...(boardExtras[cs.id]?.questions||[])],
    }];
  }
  const topicMap = (baseTopics||[]).map(topic => ({
    ...topic,
    sections: [
      ...topic.sections.map(sec => ({
        ...sec,
        notes: [...(sec.notes||[]), ...(boardExtras[sec.id]?.notes||[])],
        flashcards: [...(sec.flashcards||[]), ...(boardExtras[sec.id]?.flashcards||[])],
        questions: [...(sec.questions||[]), ...(boardExtras[sec.id]?.questions||[])],
      })),
      ...(boardCustom||[]).filter(cs => cs.topicId === topic.id).flatMap(expandAdminTopic),
    ]
  }));
  const loose = (boardCustom||[]).filter(cs => !cs.topicId || !(baseTopics||[]).find(t => t.id === cs.topicId));
  if (loose.length > 0) {
    const groups = [];
    for (const cs of loose) { const expanded = expandAdminTopic(cs); groups.push({ _adminTopicId: cs.id, _adminTopicTitle: cs.title, sections: expanded }); }
    topicMap.push({ id:"_admin", number:"", title:"Topics", sections: groups.flatMap(g=>g.sections), _adminGroups: groups });
  }
  return topicMap;
}

function _cleanText(s){return (s||"").toLowerCase().replace(/[^a-z0-9\s]/g," ").replace(/\s+/g," ").trim();}
function _clozeLooseMatch(correct, input){
  const a=_cleanText(correct), b=_cleanText(input);
  if(!a||!b) return false;
  if(a===b) return true;
  if(a.replace(/s$/,"")===b.replace(/s$/,"")) return true;
  return a.includes(b) || b.includes(a);
}
function parseClozeText(text){
  const parts=[]; let i=0; let bi=0;
  const src=String(text||"");
  while(i<src.length){
    const s=src.indexOf("{{",i);
    if(s===-1){parts.push({type:"text",value:src.slice(i)});break;}
    if(s>i) parts.push({type:"text",value:src.slice(i,s)});
    const e=src.indexOf("}}",s+2);
    if(e===-1){parts.push({type:"text",value:src.slice(s)});break;}
    const ans=src.slice(s+2,e).trim();
    parts.push({type:"blank",answer:ans,index:bi++});
    i=e+2;
  }
  return parts;
}

function ClozeCard({ card, D, onSubmit, DiagramRendererComp }) {
  const parts = React.useMemo(()=>parseClozeText(card?.text||card?.q||""), [card?.text, card?.q]);
  const blanks = React.useMemo(()=>parts.filter(p=>p.type==="blank"), [parts]);
  const [vals,setVals]=React.useState(function(){
    const obj={}; blanks.forEach(function(b){obj[b.index]="";}); return obj;
  });
  const [result,setResult]=React.useState(null);
  React.useEffect(()=>{const obj={}; blanks.forEach(function(b){obj[b.index]="";}); setVals(obj); setResult(null);}, [card?.id, blanks.length]);
  const submit=async()=>{
    const rows = blanks.map(function(b){
      const user=(vals[b.index]||"").trim();
      const correct=(b.answer||"").trim();
      const exact=_cleanText(user)===_cleanText(correct);
      return {user,correct,ok:exact || _clozeLooseMatch(correct,user)};
    });
    const allCorrect = rows.every(r=>r.ok);
    const score = rows.length?Math.round((rows.filter(r=>r.ok).length/rows.length)*100):0;
    const out={allCorrect,score,rows};
    setResult(out);
    if(onSubmit) onSubmit(out);
  };
  return (
    <div style={{borderRadius:12,border:`1.5px solid ${D?"#374151":"#e5e7eb"}`,padding:16,background:D?"#161b27":"#fff"}}>
      {card?.diagram&&<div style={{marginBottom:10}}><DiagramRendererComp diagram={card.diagram} D={D} width={420}/></div>}
      <div style={{lineHeight:2,fontSize:15,color:D?"#e5e7eb":"#111827"}}>
        {parts.map(function(p,idx){
          if(p.type==="text") return <span key={idx}>{p.value}</span>;
          return <input key={idx} value={vals[p.index]||""} onChange={e=>setVals(v=>({...v,[p.index]:e.target.value}))}
            style={{display:"inline-block",minWidth:120,padding:"4px 8px",margin:"0 5px",borderRadius:8,border:`1.5px solid ${D?"#4b5563":"#cbd5e1"}`,background:D?"#0f172a":"#f8fafc",color:D?"#fff":"#111"}}/>;
        })}
      </div>
      <button onClick={submit} style={{marginTop:12,padding:"8px 14px",borderRadius:8,border:"none",background:"#6366f1",color:"#fff",cursor:"pointer",fontWeight:700}}>Check answers</button>
      {result&&<div style={{marginTop:10,fontSize:12,color:result.allCorrect?"#16a34a":"#d97706"}}>{result.allCorrect?"✓ All correct":"Score: "+result.score+"%"}</div>}
    </div>
  );
}

function SequenceCard({ card, D, onSubmit }) {
  const base = React.useMemo(()=>Array.isArray(card?.items)?card.items.filter(Boolean):[], [card?.items]);
  const [order,setOrder]=React.useState([]);
  const [dragIdx,setDragIdx]=React.useState(null);
  const [result,setResult]=React.useState(null);
  React.useEffect(()=>{
    const arr=[...base].sort(()=>Math.random()-0.5);
    setOrder(arr); setResult(null); setDragIdx(null);
  }, [card?.id, base.join("|")]);
  const onDropAt=(idx)=>{
    if(dragIdx===null||dragIdx===idx) return;
    setOrder(prev=>{
      const n=[...prev]; const [m]=n.splice(dragIdx,1); n.splice(idx,0,m); return n;
    });
    setDragIdx(null);
  };
  const grade=()=>{
    const correctPositions = order.reduce((a,it,i)=>a + (it===base[i]?1:0),0);
    const score = base.length?correctPositions/base.length:0;
    const status = score===1 ? "correct" : score>=0.5 ? "partial" : "incorrect";
    const out={status,score,correctPositions,total:base.length};
    setResult(out);
    if(onSubmit) onSubmit(out);
  };
  return (
    <div style={{borderRadius:12,border:`1.5px solid ${D?"#374151":"#e5e7eb"}`,padding:16,background:D?"#161b27":"#fff"}}>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {order.map(function(it,idx){return (
          <div key={it+"-"+idx} draggable
            onDragStart={()=>setDragIdx(idx)} onDragOver={e=>e.preventDefault()} onDrop={()=>onDropAt(idx)}
            style={{padding:"10px 12px",borderRadius:10,border:`1px solid ${D?"#4b5563":"#d1d5db"}`,background:D?"#0f172a":"#f9fafb",cursor:"grab"}}>
            {it}
          </div>
        );})}
      </div>
      <button onClick={grade} style={{marginTop:12,padding:"8px 14px",borderRadius:8,border:"none",background:"#6366f1",color:"#fff",cursor:"pointer",fontWeight:700}}>Check order</button>
      {result&&(
        <div style={{marginTop:10,fontSize:12}}>
          <div style={{fontWeight:700,color:result.status==="correct"?"#16a34a":result.status==="partial"?"#d97706":"#dc2626"}}>
            {result.status.toUpperCase()} · {Math.round(result.score*100)}%
          </div>
          <div style={{marginTop:6,color:D?"#cbd5e1":"#374151"}}>{base.map(function(x,i){return (i+1)+". "+x;}).join(" → ")}</div>
        </div>
      )}
    </div>
  );
}

function QuestionFigure({ figure, D, figureNumber=1, DiagramRendererComp }) {
  if(!figure) return null;
  const w=figure.data?.width||520, h=figure.data?.height||220, pad=28;
  const pts=Array.isArray(figure.data?.points)?figure.data.points:[];
  const minX=Math.min(...pts.map(p=>Number(p.x)||0),0), maxX=Math.max(...pts.map(p=>Number(p.x)||0),1);
  const minY=Math.min(...pts.map(p=>Number(p.y)||0),0), maxY=Math.max(...pts.map(p=>Number(p.y)||0),1);
  const sx=x=>pad+((x-minX)/(maxX-minX||1))*(w-pad*2), sy=y=>h-pad-((y-minY)/(maxY-minY||1))*(h-pad*2);
  const chart = (function(){
    if(figure.type==="photo") return <img src={figure.data?.src||""} alt={figure.caption||"figure"} style={{maxWidth:"100%",borderRadius:10}}/>;
    if(figure.type==="table") return (
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
        <thead><tr>{(figure.data?.headers||[]).map((h2,i)=><th key={i} style={{border:"1px solid #cbd5e1",padding:6,background:D?"#0f172a":"#f8fafc"}}>{h2}</th>)}</tr></thead>
        <tbody>{(figure.data?.rows||[]).map((r,ri)=><tr key={ri}>{r.map((c,ci)=><td key={ci} style={{border:"1px solid #cbd5e1",padding:6}}>{String(c)}</td>)}</tr>)}</tbody>
      </table>
    );
    if(figure.type==="svg"&&figure.data) return <DiagramRendererComp diagram={figure.data} D={D} width={520}/>;
    if(figure.type==="bar"){
      const bars=Array.isArray(figure.data?.bars)?figure.data.bars:[];
      const m=Math.max(...bars.map(b=>Number(b.value)||0),1);
      return <svg viewBox={`0 0 ${w} ${h}`} style={{width:"100%",height:"auto"}}>{bars.map((b,i)=>{const bw=(w-pad*2)/Math.max(bars.length,1)-8; const x=pad+i*(bw+8); const hh=((Number(b.value)||0)/m)*(h-pad*2); return <g key={i}><rect x={x} y={h-pad-hh} width={bw} height={hh} fill="#6366f1"/><text x={x+bw/2} y={h-pad+14} textAnchor="middle" fontSize="10">{b.label||i+1}</text></g>;})}<line x1={pad} y1={h-pad} x2={w-pad} y2={h-pad} stroke="#94a3b8"/></svg>;
    }
    if(figure.type==="line"){
      const lp=Array.isArray(figure.data?.points)?figure.data.points:[];
      const d=lp.map((p,i)=>(i?"L":"M")+sx(Number(p.x)||0)+" "+sy(Number(p.y)||0)).join(" ");
      return <svg viewBox={`0 0 ${w} ${h}`} style={{width:"100%",height:"auto"}}><line x1={pad} y1={h-pad} x2={w-pad} y2={h-pad} stroke="#94a3b8"/><line x1={pad} y1={pad} x2={pad} y2={h-pad} stroke="#94a3b8"/><path d={d} fill="none" stroke="#6366f1" strokeWidth="2"/></svg>;
    }
    if(figure.type==="scatter"){
      const ps=pts;
      return <svg viewBox={`0 0 ${w} ${h}`} style={{width:"100%",height:"auto"}}><line x1={pad} y1={h-pad} x2={w-pad} y2={h-pad} stroke="#94a3b8"/><line x1={pad} y1={pad} x2={pad} y2={h-pad} stroke="#94a3b8"/>{ps.map((p,i)=><circle key={i} cx={sx(Number(p.x)||0)} cy={sy(Number(p.y)||0)} r="4" fill={p.anomaly?"#ef4444":"#6366f1"}/>)}</svg>;
    }
    return null;
  })();
  return (
    <div style={{marginBottom:12,padding:10,borderRadius:10,border:`1px solid ${D?"#374151":"#e5e7eb"}`,background:D?"#111827":"#fff"}}>
      <div style={{fontSize:12,fontWeight:700,marginBottom:6}}>Figure {figureNumber}: {figure.caption||"Untitled"}</div>
      {chart}
      {figure.source&&<div style={{fontSize:11,color:D?"#9ca3af":"#6b7280",marginTop:6}}>Source: {figure.source}</div>}
    </div>
  );
}

function generateWhyPrompt(card){
  if(typeof window!=="undefined"&&typeof window.generateWhyPrompt==="function"){
    try{return window.generateWhyPrompt(card);}catch(_){}
  }
  var src=stripHtml(card?.a||card?.text||card?.q||"");
  var key=(src.split(/\s+/).filter(Boolean).slice(0,4).join(" "))||"this concept";
  return "Why is "+key+" important?";
}
export {
  useSchoolLeaderboard,
  SchoolLeaderboard,
  mergeTopics,
  ClozeCard,
  SequenceCard,
  QuestionFigure,
  generateWhyPrompt,
};
