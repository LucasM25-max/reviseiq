import React, { useState, useEffect, useRef } from "react";
import { DiagramRenderer, C, I, B, tx, mu, SEMANTIC_COLORS } from "./uiPrimitives.js";
import { uid, stripHtml, getCardState, isCardDue, getRetrievability } from "./learningCore.js";

export function _cleanText(s){return (s||"").toLowerCase().replace(/[^a-z0-9\s]/g," ").replace(/\s+/g," ").trim();}
export function _clozeLooseMatch(correct, input){
  const a=_cleanText(correct), b=_cleanText(input);
  if(!a||!b) return false;
  if(a===b) return true;
  if(a.replace(/s$/,"")===b.replace(/s$/,"")) return true;
  return a.includes(b) || b.includes(a);
}
export function parseClozeText(text){
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

export function ClozeCard({ card, D, onSubmit, DiagramRendererComp }) {
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

export function SequenceCard({ card, D, onSubmit }) {
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

export function QuestionFigure({ figure, D, figureNumber=1, DiagramRendererComp }) {
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

export function ProgressiveDiagram({steps=[],D}){
  const [idx,setIdx]=React.useState(0);
  React.useEffect(()=>setIdx(0),[steps.length]);
  const cur=steps[idx]||null;
  if(!cur) return null;
  return <div style={{...C(D),padding:12}} className="fade-in"><p style={{fontSize:12,marginBottom:8}}>{cur.text}</p>{cur.svg&&<div style={{opacity:1,transition:"opacity .25s"}}><DiagramRenderer diagram={cur.svg} D={D} width={420}/></div>}{idx<steps.length-1&&<button onClick={()=>setIdx(i=>i+1)} style={{marginTop:8,padding:"6px 12px",borderRadius:8,border:"none",background:"#6366f1",color:"#fff"}}>Next</button>}</div>;
}

export function ConceptMap({x,y,relation,D}){
  return <svg viewBox="0 0 360 120" style={{width:"100%",maxWidth:420}}><circle cx="70" cy="60" r="32" fill={D?"#1e293b":"#eef2ff"} stroke="#6366f1"/><circle cx="290" cy="60" r="32" fill={D?"#1e293b":"#eef2ff"} stroke="#6366f1"/><text x="70" y="64" textAnchor="middle" fontSize="12">{x||"X"}</text><text x="290" y="64" textAnchor="middle" fontSize="12">{y||"Y"}</text><line x1="104" y1="60" x2="256" y2="60" stroke="#6366f1" markerEnd="url(#arr)"/><defs><marker id="arr" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#6366f1"/></marker></defs><text x="180" y="48" textAnchor="middle" fontSize="11">{relation||"relates to"}</text></svg>;
}

export function getNodePositions(nodes,w=560,h=360){
  const r=Math.min(w,h)*0.36,cx=w/2,cy=h/2;
  return (nodes||[]).map(function(n,i){
    const a=(Math.PI*2*i)/Math.max(nodes.length,1)-Math.PI/2;
    return {...n,x:cx+r*Math.cos(a),y:cy+r*Math.sin(a)};
  });
}

export function calculateFrontier(graph, masteryMap){
  const m=masteryMap||{};
  const edges=(graph?.edges||[]);
  return (graph?.nodes||[]).filter(function(n){
    const mn=Number(m[n.id]??n.mastery??0);
    if(mn>=70) return false;
    return edges.some(function(e){
      const other=e.from===n.id?e.to:e.to===n.id?e.from:null;
      if(!other) return false;
      const mo=Number(m[other]||0);
      return mo>=70;
    });
  }).map(n=>n.id);
}

export function checkPrerequisites(graph, topicId, masteryMap, threshold){
  const t=threshold==null?60:threshold;
  const edges=(graph?.edges||[]).filter(e=>e.to===topicId&&e.type==="requires");
  const unmet=edges.filter(e=>Number(masteryMap?.[e.from]||0)<t).map(e=>e.from);
  return unmet;
}

export function ProcessCard({card,D}){
  const [idx,setIdx]=React.useState(0);
  const steps=card?.steps||[];
  React.useEffect(()=>setIdx(0),[card?.id]);
  return <div style={{...C(D),padding:12}}><div style={{fontSize:13,fontWeight:700,marginBottom:8}}>{steps[idx]?.label||"Step"}</div><button onClick={()=>setIdx(i=>Math.min(steps.length-1,i+1))} style={{padding:"6px 10px",borderRadius:8,border:"none",background:"#6366f1",color:"#fff"}}>Next Step</button><div style={{marginTop:10,fontSize:12,color:mu(D)}}>{steps.map((s,i)=><div key={i}>{i+1}. {s.label}</div>)}</div></div>;
}

export function SketchCanvas({D}){
  const ref=React.useRef(null); const drawing=React.useRef(false);
  const start=e=>{drawing.current=true; const c=ref.current.getContext("2d"); c.beginPath(); c.moveTo(e.nativeEvent.offsetX,e.nativeEvent.offsetY);};
  const move=e=>{if(!drawing.current)return; const c=ref.current.getContext("2d"); c.lineWidth=2; c.strokeStyle=D?"#e5e7eb":"#111827"; c.lineTo(e.nativeEvent.offsetX,e.nativeEvent.offsetY); c.stroke();};
  const end=()=>{drawing.current=false;};
  return <canvas ref={ref} width={320} height={180} onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end} style={{border:"1px solid #94a3b8",borderRadius:8,background:D?"#0f172a":"#fff",width:"100%",maxWidth:340}}/>;
}

export function GraphCard({card,D}){
  return <div>{card?.graph&&<QuestionFigure figure={card.graph} D={D} figureNumber={1} DiagramRendererComp={DiagramRenderer}/>}<p style={{fontSize:13,marginBottom:8}}>{card?.question||""}</p>{card?.annotation&&<div style={{fontSize:12,color:"#6366f1"}}>↗ {card.annotation.label||"Key point"}</div>}</div>;
}

export async function generateSVGDiagram(content,user){
  const key="gcse:svg:"+(user||"").replace(/\W/g,"-");
  const hash=btoa(unescape(encodeURIComponent(content||""))).slice(0,40);
  try{
    const cache=JSON.parse(localStorage.getItem(key)||"{}");
    if(cache[hash]&&String(cache[hash]).includes("<svg")) return cache[hash];
    let svg="";
    if(typeof window!=="undefined"&&typeof window.generateSVGDiagram==="function"){
      try{svg=await window.generateSVGDiagram(content);}catch(_){}
    }
    if(!svg||!String(svg).includes("<svg")) svg=`<svg xmlns="http://www.w3.org/2000/svg" width="360" height="140"><rect x="10" y="10" width="340" height="120" fill="#eef2ff" stroke="#6366f1"/><text x="24" y="75" font-size="14" fill="#1f2937">${(content||"Diagram").slice(0,36)}</text></svg>`;
    cache[hash]=svg; localStorage.setItem(key,JSON.stringify(cache)); return svg;
  }catch(_){return `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="140"><rect x="10" y="10" width="340" height="120" fill="#eef2ff" stroke="#6366f1"/><text x="24" y="75" font-size="14" fill="#1f2937">Diagram</text></svg>`;}
}

export function KnowledgeGraph({D,user,subjectId,masteryMap,onSelectNode,onGoToPrereq}){
  const [graph,setGraph]=React.useState({nodes:[],edges:[]});
  const [selected,setSelected]=React.useState(null);
  const [name,setName]=React.useState(""); const [from,setFrom]=React.useState(""); const [to,setTo]=React.useState(""); const [etype,setEType]=React.useState("requires");
  React.useEffect(()=>{try{setGraph(JSON.parse(localStorage.getItem(`gcse:graph:${user.replace(/\W/g,"-")}:${subjectId}`)||"{\"nodes\":[],\"edges\":[]}"));}catch(_){setGraph({nodes:[],edges:[]});}},[user,subjectId]);
  const nodes=(graph.nodes||[]).slice(0,50).map(n=>({...n,mastery:Number(masteryMap?.[n.id]??n.mastery??0)}));
  const frontier=calculateFrontier({nodes,edges:graph.edges||[]},masteryMap);
  const pos=React.useMemo(()=>getNodePositions(nodes,560,360),[JSON.stringify(nodes)]);
  const save=(g)=>{setGraph(g); try{localStorage.setItem(`gcse:graph:${user.replace(/\W/g,"-")}:${subjectId}`,JSON.stringify(g));}catch(_){}};
  return <div style={{...C(D),padding:14,marginTop:12}}>
    <h3 style={{fontSize:14,fontWeight:700,marginBottom:8}}>Knowledge Graph</h3>
    <svg viewBox="0 0 560 360" style={{width:"100%",maxWidth:560}}>
      <circle cx="280" cy="180" r="26" fill="#6366f1"/><text x="280" y="185" textAnchor="middle" fill="#fff" fontSize="11">Subject</text>
      {(graph.edges||[]).map((e,i)=>{const a=pos.find(n=>n.id===e.from),b=pos.find(n=>n.id===e.to); if(!a||b)return null; return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#94a3b8" strokeWidth={Math.max(1,Number(e.weight)||1)}/>;})}
      {pos.map((n,i)=>{const col=n.mastery>70?"#16a34a":n.mastery<40?"#9ca3af":"#f59e0b"; const isFront=frontier.includes(n.id); return <g key={i} onClick={()=>{setSelected(n.id); onSelectNode&&onSelectNode(n.id); const unmet=checkPrerequisites(graph,n.id,masteryMap,60); if(unmet.length&&onGoToPrereq)onGoToPrereq(unmet[0],n.id);}}><circle cx={n.x} cy={n.y} r="18" fill={col} stroke={isFront?"#3b82f6":"#1f2937"} strokeWidth={isFront?3:1.5}/><text x={n.x} y={n.y+4} textAnchor="middle" fontSize="9" fill="#fff">{n.name?.slice(0,7)}</text>{Number(n.examFrequency||0)>7&&<text x={n.x+14} y={n.y-12} fontSize="10">⭐</text>}</g>;})}
    </svg>
    <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:6,marginTop:8}}><input value={name} onChange={e=>setName(e.target.value)} placeholder="New node" style={{...I(D,{fontSize:12})}}/><button onClick={()=>{if(!name.trim())return; save({...graph,nodes:[...(graph.nodes||[]),{id:uid(),name:name.trim(),mastery:0,examFrequency:0}]}); setName("");}} style={{padding:"6px 10px"}}>Add</button></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr auto",gap:6,marginTop:6}}>
      <select value={from} onChange={e=>setFrom(e.target.value)} style={{...I(D,{fontSize:12})}}><option value="">From</option>{nodes.map(n=><option key={n.id} value={n.id}>{n.name}</option>)}</select>
      <select value={to} onChange={e=>setTo(e.target.value)} style={{...I(D,{fontSize:12})}}><option value="">To</option>{nodes.map(n=><option key={n.id} value={n.id}>{n.name}</option>)}</select>
      <select value={etype} onChange={e=>setEType(e.target.value)} style={{...I(D,{fontSize:12})}}>{["requires","contrasts","explains","example","caused_by"].map(t=><option key={t}>{t}</option>)}</select>
      <button onClick={()=>{if(!from||!to)return; save({...graph,edges:[...(graph.edges||[]),{from,to,type:etype,weight:1}]});}} style={{padding:"6px 10px"}}>Edge</button>
    </div>
    {selected&&<button onClick={()=>save({...graph,nodes:(graph.nodes||[]).filter(n=>n.id!==selected),edges:(graph.edges||[]).filter(e=>e.from!==selected&&e.to!==selected)})} style={{marginTop:8,fontSize:11}}>Delete selected node</button>}
  </div>;
}

export function GraphEditor(props){ return <KnowledgeGraph {...props}/>; }

export function masteryColor(p){return p>=70?"#16a34a":p>=40?"#f59e0b":"#9ca3af";}

export function buildTreemap(nodes,width,height){
  const arr=[...(nodes||[])].filter(n=>n&&n.contentSize>0).sort((a,b)=>b.contentSize-a.contentSize);
  if(!arr.length) return [];
  const total=arr.reduce((a,n)=>a+n.contentSize,0)||1;
  let x=0,y=0,w=width,h=height,dir=0;
  return arr.map((n,i)=>{
    const frac=n.contentSize/total;
    let rw=w,rh=h;
    if(dir%2===0){rw=Math.max(1,width*frac); const r={...n,x,y,w:rw,h}; x+=rw; w=Math.max(0,width-x); dir++; return r;}
    rh=Math.max(1,height*frac); const r={...n,x,y,w,h:rh}; y+=rh; h=Math.max(0,height-y); dir++; return r;
  });
}

export function MasteryTreemap({nodes=[],D,onSelect}){
  const [tip,setTip]=React.useState(null);
  const layout=React.useMemo(()=>buildTreemap(nodes,900,320),[JSON.stringify(nodes)]);
  if(!nodes.length) return <div style={{...C(D),padding:16,fontSize:13,color:mu(D)}}>No mastery data yet.</div>;
  return <div style={{position:"relative",...C(D),padding:12}}>
    <h3 style={{fontSize:14,fontWeight:700,marginBottom:8}}>Mastery Landscape</h3>
    <svg viewBox="0 0 900 320" style={{width:"100%",height:"auto"}}>
      {layout.map((n,i)=><g key={i} onMouseEnter={()=>setTip(n)} onMouseLeave={()=>setTip(null)} onClick={()=>onSelect&&onSelect(n)}>
        <rect x={n.x} y={n.y} width={n.w} height={n.h} fill={masteryColor(n.mastery||0)} stroke="#fff"/>
        {n.w>80&&n.h>28&&<text x={n.x+6} y={n.y+16} fontSize="11" fill="#fff">{n.name}</text>}
      </g>)}
    </svg>
    {tip&&<div style={{position:"absolute",right:10,top:10,fontSize:11,background:D?"#0f172a":"#fff",border:"1px solid #cbd5e1",padding:"5px 8px",borderRadius:6}}>{tip.name} · {Math.round(tip.mastery||0)}%</div>}
  </div>;
}

export function LearningTimeline({sessions=[],exams=[],subjects=[],D,onSelect}){
  const [tip,setTip]=React.useState(null);
  const data=React.useMemo(()=>{
    if(!sessions.length) return {items:[],min:0,max:1};
    const times=sessions.map(s=>new Date(s.date).getTime());
    const min=Math.min(...times),max=Math.max(...times,min+1);
    const items=sessions.map((s,i)=>({...s,_x:30+((new Date(s.date).getTime()-min)/(max-min||1))*820,_h:Math.min(120,20+Number(s.duration||20))}));
    return {items,min,max};
  },[JSON.stringify(sessions)]);
  if(!sessions.length) return <div style={{...C(D),padding:16,fontSize:13,color:mu(D)}}>No data yet.</div>;
  const bySub={}; sessions.forEach(s=>{bySub[s.subject]=(bySub[s.subject]||0)+Number(s.duration||0);});
  const topSub=Object.entries(bySub).sort((a,b)=>b[1]-a[1])[0];
  return <div style={{...C(D),padding:12,marginTop:12}}>
    <h3 style={{fontSize:14,fontWeight:700,marginBottom:8}}>Learning Timeline</h3>
    <svg viewBox="0 0 900 220" style={{width:"100%",height:"auto"}}>
      <line x1="30" y1="180" x2="860" y2="180" stroke="#94a3b8"/>
      {data.items.map((s,i)=>{const subj=subjects.find(x=>x.name===s.subject||x.id===s.subjectId); const col=subj?.accent||"#6366f1"; return <rect key={i} x={s._x} y={180-s._h} width="10" height={s._h} fill={col} onMouseEnter={()=>setTip(s)} onMouseLeave={()=>setTip(null)} onClick={()=>onSelect&&onSelect(s)}/>;})}
      {exams.map((e,i)=>{const x=30+((new Date(e.date).getTime()-data.min)/((data.max-data.min)||1))*820; return <line key={i} x1={x} y1="20" x2={x} y2="180" stroke="#ef4444" strokeDasharray="4 3"/>;})}
    </svg>
    {tip&&<div style={{fontSize:11,marginTop:6}}>{tip.date} · {tip.subject} · {tip.duration} min</div>}
    <div style={{fontSize:11,color:mu(D),marginTop:6}}>Most studied subject: {topSub?.[0]||"—"}</div>
  </div>;
}

export function SketchnoteCanvas({D,user,subjectId}){
  const key="gcse:sketchnotes:"+user.replace(/\W/g,"-")+":"+subjectId;
  const [data,setData]=React.useState({nodes:[],edges:[]});
  const [mode,setMode]=React.useState("move");
  const [drag,setDrag]=React.useState(null);
  const [sel,setSel]=React.useState(null);
  const [zoom,setZoom]=React.useState(1);
  React.useEffect(()=>{try{setData(JSON.parse(localStorage.getItem(key)||"{\"nodes\":[],\"edges\":[]}"));}catch(_){setData({nodes:[],edges:[]});}},[key]);
  const save=(d)=>{setData(d); try{localStorage.setItem(key,JSON.stringify(d));}catch(_){}};
  const addNode=(type)=>save({...data,nodes:[...data.nodes,{id:uid(),type,x:80+data.nodes.length*18,y:70+data.nodes.length*10,content:type}]});
  const onDown=(id,e)=>{if(mode==="connect"){if(sel&&sel!==id){save({...data,edges:[...data.edges,{from:sel,to:id,label:""}]});setSel(null);}else setSel(id);return;} setDrag({id,ox:e.clientX,oy:e.clientY});};
  const onMove=(e)=>{if(!drag)return; save({...data,nodes:data.nodes.map(n=>n.id===drag.id?{...n,x:n.x+(e.clientX-drag.ox)/zoom,y:n.y+(e.clientY-drag.oy)/zoom}:n)}); setDrag({id:drag.id,ox:e.clientX,oy:e.clientY});};
  const onUp=()=>setDrag(null);
  return <div style={{...C(D),padding:12,marginTop:12}} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}>
    <div style={{display:"flex",gap:6,marginBottom:8}}><button onClick={()=>addNode("rect")}>+ Rect</button><button onClick={()=>addNode("circle")}>+ Circle</button><button onClick={()=>addNode("cloud")}>+ Cloud</button><button onClick={()=>setMode(mode==="connect"?"move":"connect")}>{mode==="connect"?"Move":"Connect"}</button><button onClick={()=>sel&&save({...data,nodes:data.nodes.filter(n=>n.id!==sel),edges:data.edges.filter(e=>e.from!==sel&&e.to!==sel)})}>Delete</button><button onClick={()=>setZoom(z=>Math.min(2,z+0.1))}>+</button><button onClick={()=>setZoom(z=>Math.max(0.6,z-0.1))}>-</button></div>
    <svg viewBox={`0 0 ${600/zoom} ${280/zoom}`} style={{width:"100%",border:"1px solid #cbd5e1",borderRadius:8}}>
      {data.edges.map((e,i)=>{const a=data.nodes.find(n=>n.id===e.from),b=data.nodes.find(n=>n.id===e.to); if(!a||!b)return null; return <g key={i}><line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#94a3b8"/>{e.label&&<text x={(a.x+b.x)/2} y={(a.y+b.y)/2-4} fontSize="10">{e.label}</text>}</g>;})}
      {data.nodes.map(n=><g key={n.id} onMouseDown={e=>onDown(n.id,e)} onClick={()=>setSel(n.id)}>{n.type==="circle"?<circle cx={n.x} cy={n.y} r="24" fill="#dbeafe" stroke={sel===n.id?"#6366f1":"#1e3a8a"}/>:n.type==="cloud"?<path d={`M ${n.x-26} ${n.y} C ${n.x-32} ${n.y-18}, ${n.x-10} ${n.y-30}, ${n.x+8} ${n.y-20} C ${n.x+26} ${n.y-28}, ${n.x+36} ${n.y-6}, ${n.x+22} ${n.y+8} C ${n.x+8} ${n.y+22}, ${n.x-18} ${n.y+20}, ${n.x-26} ${n.y}`} fill="#e9d5ff" stroke={sel===n.id?"#7c3aed":"#6d28d9"}/>:<rect x={n.x-26} y={n.y-16} width="52" height="32" rx="6" fill="#dcfce7" stroke={sel===n.id?"#16a34a":"#166534"}/>}<text x={n.x} y={n.y+4} textAnchor="middle" fontSize="10">{n.content}</text></g>)}
    </svg>
  </div>;
}

export function useMathReady() {
  const [ready, setReady] = useState(typeof window.katex !== "undefined");
  useEffect(() => { if (!ready) window.__onKatexReady(() => setReady(true)); }, []);
  return ready;
}
export function renderMath(src, display=false) {
  if (typeof window.katex === "undefined")
    return <code style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:12,background:"rgba(99,102,241,.12)",padding:"1px 5px",borderRadius:4}}>{src}</code>;
  try { return <span dangerouslySetInnerHTML={{__html:window.katex.renderToString(src,{throwOnError:false,displayMode:display})}}/>; }
  catch(e){ return <code style={{fontFamily:"monospace",fontSize:12}}>{src}</code>; }
}
export function parseLatex(s, mathReady) {
  if (!s) return "";
  s = s.split("\\[").join("$$").split("\\]").join("$$").split("\\(").join("$").split("\\)").join("$");
  if (!mathReady) return s;
  const out=[]; let i=0, cur="";
  while (i < s.length) {
    if (s[i]==="$" && s[i+1]==="$") {
      const end=s.indexOf("$$",i+2);
      if (end>i) { if(cur){out.push(cur);cur="";} out.push(<span key={i} style={{display:"block",textAlign:"center",margin:"4px 0"}}>{renderMath(s.slice(i+2,end),true)}</span>); i=end+2; continue; }
    }
    if (s[i]==="$" && s[i+1]!=="$") {
      const end=s.indexOf("$",i+1);
      if (end>i && end-i<200) { if(cur){out.push(cur);cur="";} out.push(<span key={i}>{renderMath(s.slice(i+1,end))}</span>); i=end+1; continue; }
    }
    cur+=s[i]; i++;
  }
  if (cur) out.push(cur);
  return out.length===0 ? "" : out.length===1 && typeof out[0]==="string" ? out[0] : out;
}

export function ContentBlock({content, D, style={}, fontSize=15}) {
  const mathReady = useMathReady();
  const isHtml = (content||"").trimStart().startsWith("<");
  if (isHtml) return <div className="rich-display" dangerouslySetInnerHTML={{__html:content||""}} style={{fontSize,lineHeight:1.75,color:tx(D),...style}}/>;
  const parsed = parseLatex(content||"", mathReady);
  return <p style={{fontSize,lineHeight:1.75,color:tx(D),whiteSpace:"pre-line",...style}}>{parsed}</p>;
}

export function RichEditor({value, onChange, D, placeholder, minHeight=110}) {
  const ref = useRef(null);
  const inited = useRef(false);
  useEffect(() => { if (!inited.current && ref.current) { ref.current.innerHTML = value||""; inited.current=true; } });
  const exec = (cmd,arg) => { document.execCommand(cmd,false,arg??undefined); if(ref.current)onChange(ref.current.innerHTML); ref.current?.focus(); };
  const insLatex = () => {
    const formula = window.prompt("Enter LaTeX (e.g. x^2+y^2=r^2):"); if (!formula) return;
    let html;
    if (typeof window.katex!=="undefined") {
      try { html=`<span style="display:inline-block;padding:0 2px">${window.katex.renderToString(formula,{throwOnError:false,displayMode:false})}</span>`; }
      catch(e){ html=`<code style="font-family:'IBM Plex Mono',monospace;background:rgba(99,102,241,.13);padding:1px 5px;border-radius:4px;font-size:12px">$${formula}$</code>`; }
    } else { html=`<code style="font-family:'IBM Plex Mono',monospace;background:rgba(99,102,241,.13);padding:1px 5px;border-radius:4px;font-size:12px">$${formula}$</code>`; }
    exec("insertHTML",html);
  };
  const brd=D?"#374151":"#d1d5db";
  const bs={background:"transparent",border:"none",cursor:"pointer",borderRadius:5,padding:"3px 8px",fontSize:13,fontWeight:600,color:tx(D)};
  return (
    <div style={{border:`1.5px solid ${brd}`,borderRadius:10,overflow:"hidden"}}>
      <div style={{display:"flex",gap:2,padding:"5px 8px",background:D?"#1e2537":"#f3f4f6",borderBottom:`1px solid ${brd}`,flexWrap:"wrap",alignItems:"center"}}>
        {[["bold",<b>B</b>],["italic",<i>I</i>],["underline",<u>U</u>]].map(([cmd,lbl])=>(
          <button key={cmd} onMouseDown={e=>{e.preventDefault();exec(cmd);}} style={bs}>{lbl}</button>
        ))}
        <span style={{color:brd,userSelect:"none",padding:"0 2px"}}>|</span>
        <button onMouseDown={e=>{e.preventDefault();exec("insertUnorderedList");}} style={bs}>• List</button>
        <button onMouseDown={e=>{e.preventDefault();exec("insertOrderedList");}} style={bs}>1. List</button>
        <button onMouseDown={e=>{e.preventDefault();exec("formatBlock","h3");}} style={bs}>H3</button>
        <span style={{color:brd,userSelect:"none",padding:"0 2px"}}>|</span>
        <button onMouseDown={e=>{e.preventDefault();insLatex();}} style={{...bs,color:"#6366f1"}} title="Insert LaTeX">∑ LaTeX</button>
        <button onMouseDown={e=>{e.preventDefault();exec("removeFormat");}} style={{...bs,fontSize:11,color:mu(D)}}>Clear</button>
      </div>
      <div ref={ref} contentEditable suppressContentEditableWarning className="rich-body"
        onInput={()=>{if(ref.current)onChange(ref.current.innerHTML);}}
        data-placeholder={placeholder||"Write here…"}
        style={{padding:"12px 14px",background:D?"#1e2537":"#fff",color:tx(D),minHeight,outline:"none",lineHeight:1.75,fontSize:13}}/>
    </div>
  );
}

export function MD({text, D}) {
  const mathReady = useMathReady();
  const lines=(text||"").split("\n"), out=[], tbl=[];
  const flush=()=>{
    if (!tbl.length) return;
    const rows=tbl.filter(l=>!l.match(/^\|[-|: ]+\|$/));
    out.push(<div key={`t${out.length}`} style={{overflowX:"auto",margin:"10px 0"}}><table style={{fontSize:12,borderCollapse:"collapse",width:"100%",color:D?"#e5e7eb":"#374151"}}>
      {rows.map((row,ri)=>{const cells=row.split("|").filter((_,i,a)=>i>0&&i<a.length-1).map(c=>c.trim());const T=ri===0?"th":"td";return <tr key={ri} style={{background:ri===0?(D?"#374151":"#f3f4f6"):""}}>{cells.map((c,ci)=><T key={ci} style={{border:`1px solid ${D?"#4b5563":"#d1d5db"}`,padding:"6px 12px",textAlign:"left"}}>{c}</T>)}</tr>;})}
    </table></div>); tbl.length=0;
  };
  const pb=s=>{
    if(!mathReady) return s.split(/(\*\*[^*]+\*\*|\*[^*\n]+\*)/).map((p,i)=>{if(p.startsWith("**")&&p.endsWith("**"))return (<strong key={i}>{p.slice(2,-2)}</strong>);if(p.startsWith("*")&&p.endsWith("*")&&!p.startsWith("**")&&p.length>2)return (<em key={i}>{p.slice(1,-1)}</em>);return p;});
    const latexParsed=parseLatex(s,mathReady);
    if(typeof latexParsed==="string"){
      return latexParsed.split(/(\*\*[^*]+\*\*)/).map((p,i)=>p.startsWith("**")&&p.endsWith("**")?<strong key={i} style={{color:D?"#fff":"#111827"}}>{p.slice(2,-2)}</strong>:p);
    }
    if(!Array.isArray(latexParsed)) return latexParsed;
    return latexParsed.flatMap((seg,si)=>{
      if(typeof seg!=="string") return [seg];
      return seg.split(/(\*\*[^*]+\*\*)/).map((p,i)=>p.startsWith("**")&&p.endsWith("**")?<strong key={`${si}-${i}`} style={{color:D?"#fff":"#111827"}}>{p.slice(2,-2)}</strong>:p);
    });
  };
  lines.forEach((l,i)=>{
    if(l.startsWith("|")){tbl.push(l);return;} flush();
    if(!l.trim()){out.push(<div key={i} style={{height:6}}/>);return;}
    if(l.match(/^-{3,}$|^\*{3,}$/)){out.push(<hr key={i} style={{border:"none",borderTop:`1px solid ${D?"#374151":"#e5e7eb"}`,margin:"10px 0"}}/>);return;}
    if(l.startsWith("### ")){out.push(<h3 key={i} style={{fontSize:14,fontWeight:700,color:D?"#e5e7eb":"#111827",margin:"14px 0 5px",letterSpacing:"0.01em"}}>{pb(l.slice(4))}</h3>);return;}
    if(l.startsWith("## ")){out.push(<h2 key={i} style={{fontSize:16,fontWeight:700,color:D?"#f3f4f6":"#111827",margin:"16px 0 6px",paddingBottom:4,borderBottom:`1px solid ${D?"#374151":"#e5e7eb"}`}}>{pb(l.slice(3))}</h2>);return;}
    if(l.startsWith("# ")){out.push(<h1 key={i} style={{fontSize:18,fontWeight:800,color:D?"#e8ecf4":"#111827",margin:"18px 0 8px"}}>{pb(l.slice(2))}</h1>);return;}
    if(l.startsWith("• ")||l.startsWith("- ")){const txt=l.startsWith("• ")?l.slice(2):l.slice(2);out.push(<div key={i} style={{display:"flex",gap:8,fontSize:13,lineHeight:1.7,marginBottom:2,color:D?"#d1d5db":"#374151"}}><span style={{marginTop:7,width:4,height:4,borderRadius:"50%",background:"currentColor",flexShrink:0,opacity:0.5}}/><span>{pb(txt)}</span></div>);return;}
    if(l.startsWith("⚠️")){out.push(<div key={i} style={{margin:"8px 0",padding:"10px 14px",borderRadius:8,border:`1px solid ${D?"#92400e":"#fde68a"}`,background:D?"rgba(120,53,15,.25)":"#fffbeb",fontSize:13,color:D?"#fcd34d":"#92400e"}}>{pb(l)}</div>);return;}
    if(l.match(/^\d+\.\s/)){out.push(<div key={i} style={{display:"flex",gap:8,fontSize:13,lineHeight:1.7,marginBottom:2,color:D?"#d1d5db":"#374151"}}><span style={{flexShrink:0,fontFamily:"monospace",fontSize:11,marginTop:2,color:D?"#9ca3af":"#6b7280"}}>{l.match(/^\d+/)[0]}.</span><span>{pb(l.replace(/^\d+\.\s*/,""))}</span></div>);return;}
    out.push(<p key={i} style={{fontSize:15,lineHeight:1.8,marginBottom:4,color:D?"#d1d5db":"#374151"}}>{pb(l)}</p>);
  }); flush();
  return <>{out}</>;
}

export const NOTE_SEC_DEFS = {
  "CORE CONTENT":        {icon:"📚",border:"#6366f1",bg_l:"#eef2ff",bg_d:"rgba(99,102,241,.08)", lbl_l:"#4338ca",lbl_d:"#a5b4fc",selfCheck:false},
  "WORKED EXAMPLE":      {icon:SEMANTIC_COLORS.process.icon,    border:SEMANTIC_COLORS.process.border,    bg_l:SEMANTIC_COLORS.process.bg_l,    bg_d:SEMANTIC_COLORS.process.bg_d,    lbl_l:SEMANTIC_COLORS.process.label_l,    lbl_d:SEMANTIC_COLORS.process.label_d,    selfCheck:false},
  "KEY MISTAKE":         {icon:SEMANTIC_COLORS.mistake.icon,    border:SEMANTIC_COLORS.mistake.border,    bg_l:SEMANTIC_COLORS.mistake.bg_l,    bg_d:SEMANTIC_COLORS.mistake.bg_d,    lbl_l:SEMANTIC_COLORS.mistake.label_l,    lbl_d:SEMANTIC_COLORS.mistake.label_d,    selfCheck:false},
  "COMMON EXAM MISTAKE": {icon:SEMANTIC_COLORS.mistake.icon,    border:SEMANTIC_COLORS.mistake.border,    bg_l:SEMANTIC_COLORS.mistake.bg_l,    bg_d:SEMANTIC_COLORS.mistake.bg_d,    lbl_l:SEMANTIC_COLORS.mistake.label_l,    lbl_d:SEMANTIC_COLORS.mistake.label_d,    selfCheck:false},
  "SELF-CHECK":          {icon:"✅", border:"#10b981",bg_l:"#ecfdf5",bg_d:"rgba(16,185,129,.08)",lbl_l:"#065f46",lbl_d:"#6ee7b7",selfCheck:true},
  "DEFINITION":          {icon:SEMANTIC_COLORS.definition.icon, border:SEMANTIC_COLORS.definition.border, bg_l:SEMANTIC_COLORS.definition.bg_l, bg_d:SEMANTIC_COLORS.definition.bg_d, lbl_l:SEMANTIC_COLORS.definition.label_l, lbl_d:SEMANTIC_COLORS.definition.label_d, selfCheck:false},
  "EQUATION":            {icon:SEMANTIC_COLORS.equation.icon,   border:SEMANTIC_COLORS.equation.border,   bg_l:SEMANTIC_COLORS.equation.bg_l,   bg_d:SEMANTIC_COLORS.equation.bg_d,   lbl_l:SEMANTIC_COLORS.equation.label_l,   lbl_d:SEMANTIC_COLORS.equation.label_d,   selfCheck:false},
  "REQUIRED PRACTICAL":  {icon:SEMANTIC_COLORS.practical.icon,  border:SEMANTIC_COLORS.practical.border,  bg_l:SEMANTIC_COLORS.practical.bg_l,  bg_d:SEMANTIC_COLORS.practical.bg_d,  lbl_l:SEMANTIC_COLORS.practical.label_l,  lbl_d:SEMANTIC_COLORS.practical.label_d,  selfCheck:false},
  "MNEMONIC":            {icon:"🧠",border:"#ec4899",bg_l:"#fdf2f8",bg_d:"rgba(236,72,153,.08)",lbl_l:"#9d174d",lbl_d:"#f9a8d4",selfCheck:false},
};

export function parseNoteBody(body) {
  if (!(body||"").includes("\n## ") && !(body||"").startsWith("## ")) return null;
  const lines2 = body.split("\n");
  const secs = [];
  let cur = null;
  for (const line of lines2) {
    if (line.startsWith("## ")) {
      if (cur) secs.push(cur);
      const hdKey = line.slice(3).trim().toUpperCase();
      const def = NOTE_SEC_DEFS[hdKey] || {icon:"📝",border:"#6b7280",bg_l:"#f9fafb",bg_d:"#1f2937",lbl_l:"#374151",lbl_d:"#d1d5db",selfCheck:false};
      cur = {key:hdKey, heading:line.slice(3).trim(), def, lines2:[], images:[]};
    } else if (cur) {
      cur.lines2.push(line);
    } else {
      if (!secs.length || secs[0].key!=="__pre") secs.unshift({key:"__pre",def:null,lines2:[]});
      secs[0].lines2.push(line);
    }
  }
  if (cur) secs.push(cur);
  return secs.length ? secs : null;
}

export function NoteSec({sec, D, images=[]}) {
  const [open, setOpen] = React.useState(!sec.def?.selfCheck);
  const [lightbox, setLightbox] = React.useState(null);
  const content = (sec.lines2||[]).join("\n").trim();
  if (sec.key==="__pre") return content?<div style={{marginBottom:10}}><MD text={content} D={D}/></div>:null;
  const {def,heading} = sec;
  const borderCol = def?.border||"#6b7280";
  const bgCol = D?(def?.bg_d||"#1f2937"):(def?.bg_l||"#f9fafb");
  const lblCol = D?(def?.lbl_d||"#9ca3af"):(def?.lbl_l||"#374151");
  const bd2 = D?"#2a3347":"#e5e7eb";
  return (
    <div style={{borderRadius:12,overflow:"hidden",border:`1.5px solid ${borderCol}33`,marginBottom:8}}>
      <button onClick={()=>setOpen(v=>!v)}
        style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"9px 14px",
          background:bgCol,borderLeft:`3px solid ${borderCol}`,borderTop:"none",borderRight:"none",borderBottom:"none",cursor:"pointer",textAlign:"left"}}>
        <span style={{fontSize:15,flexShrink:0}}>{def?.icon||"📝"}</span>
        <span style={{flex:1,fontSize:11,fontWeight:700,color:lblCol,textTransform:"uppercase",letterSpacing:"0.07em"}}>{heading}</span>
        {def?.selfCheck&&<span style={{fontSize:10,color:lblCol,background:borderCol+"25",padding:"2px 8px",borderRadius:10,fontWeight:700,marginRight:4}}>Try first!</span>}
        <span style={{fontSize:12,color:lblCol,fontWeight:700,flexShrink:0}}>{open?"▲":"▼"}</span>
      </button>
      {open&&(
        <div className="note-reveal" style={{background:D?"#0d1117":"#fff",borderTop:`1px solid ${borderCol}22`}}>
          {images.length > 0 && (
            <div style={{padding:"8px 16px 0"}}>
              {images.map((img,ii)=>img&&img.image?(
                <div key={ii} style={{marginBottom:10,cursor:"zoom-in",borderRadius:8,overflow:"hidden",position:"relative"}}
                  onClick={()=>setLightbox(img.image)}>
                  <img src={img.image} alt="diagram" style={{maxWidth:"100%",borderRadius:8,display:"block",border:`1px solid ${bd2}`}}/>
                  <div style={{position:"absolute",bottom:6,right:6,background:"rgba(0,0,0,.55)",color:"#fff",fontSize:10,padding:"2px 8px",borderRadius:8,fontWeight:600}}>🔍 Zoom</div>
                </div>
              ):null)}
            </div>
          )}
          <div style={{padding:"12px 16px"}}>
            {def?.selfCheck&&(
              <div style={{padding:"8px 12px",borderRadius:8,background:bgCol,marginBottom:10,fontSize:11,
                color:lblCol,fontStyle:"italic",lineHeight:1.55,border:`1px dashed ${borderCol}55`}}>
                🧠 Cover the notes above and try to recall these from memory before reading.
              </div>
            )}
            <MD text={content} D={D}/>
          </div>
        </div>
      )}
      {lightbox&&(
        <div className="img-lb" onClick={()=>setLightbox(null)}>
          <img src={lightbox} alt="enlarged" style={{maxWidth:"95vw",maxHeight:"90vh",borderRadius:12,boxShadow:"0 30px 80px rgba(0,0,0,.5)"}}/>
          <button onClick={()=>setLightbox(null)} style={{position:"absolute",top:16,right:16,background:"rgba(255,255,255,.15)",color:"#fff",border:"none",borderRadius:"50%",width:36,height:36,fontSize:20,cursor:"pointer",lineHeight:1}}>×</button>
        </div>
      )}
    </div>
  );
}

export function SmartNoteCard({note, D, subjectAccent, canEdit, onEdit, onDelete, onAddVisual}) {
  const [lightbox, setLightbox] = React.useState(null);
  const isHtml = (note.body||"").trimStart().startsWith("<");
  const parsed = !isHtml ? parseNoteBody(note.body||"") : null;
  const bd2 = D?"#2a3347":"#e5e7eb";
  const accentCol = subjectAccent||"#6366f1";
  const isSideBySide = note.layoutMode === "side-by-side" && (note.images||[]).length > 0;

  const sectionImages = (sectionKey) => {
    const allImgs = note.images||[];
    const keyed = allImgs.filter(img => img && img.sectionKey === sectionKey);
    if (keyed.length) return keyed;
    const unassigned = allImgs.filter(img => img && !img.sectionKey);
    if (unassigned.length && parsed) {
      const firstRealSec = parsed.find(s => s.key !== "__pre");
      if (firstRealSec && firstRealSec.key === sectionKey) return unassigned;
    }
    return [];
  };

  const firstTypedSec = parsed ? parsed.find(s => s.key && s.key !== "__pre" && NOTE_SEC_DEFS[s.key]) : null;
  const semanticDef = firstTypedSec ? NOTE_SEC_DEFS[firstTypedSec.key] : null;

  return (
    <div style={{background:D?"#161b27":"#fff",borderRadius:14,border:`1px solid ${bd2}`,overflow:"hidden",marginBottom:14}}>
      <div style={{padding:"12px 18px 10px",background:D?"rgba(255,255,255,.02)":"#fafafa",
        borderBottom:`1px solid ${bd2}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,flex:1,minWidth:0}}>
          <div style={{width:4,height:26,borderRadius:3,background:accentCol,flexShrink:0}}/>
          <h3 style={{fontWeight:700,fontSize:15,color:D?"#e8ecf4":"#111827",flex:1,
            overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{note.heading||note.text||""}</h3>
          {semanticDef&&(
            <span style={{
              display:"inline-flex",alignItems:"center",gap:4,
              fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:20,
              background:D?semanticDef.bg_d:semanticDef.bg_l,
              color:D?semanticDef.lbl_d:semanticDef.lbl_l,
              border:`1px solid ${semanticDef.border}33`,
              textTransform:"uppercase",letterSpacing:"0.06em",flexShrink:0
            }}>
              {semanticDef.icon} {firstTypedSec.key}
            </span>
          )}
        </div>
        {canEdit&&<div style={{display:"flex",gap:6,flexShrink:0,marginLeft:8}}>
          <button onClick={onEdit} style={{background:"none",border:"none",cursor:"pointer",fontSize:13,color:"#6366f1",padding:"2px 6px"}}>✏️</button>
          {!note.diagram&&onAddVisual&&(
            <button onClick={()=>onAddVisual(note)} title="Generate diagram for this note"
              style={{background:"none",border:"none",cursor:"pointer",fontSize:13,color:"#6366f1",padding:"2px 6px"}}>📊</button>
          )}
          <button onClick={onDelete} style={{background:"none",border:"none",cursor:"pointer",fontSize:13,color:"#ef4444",padding:"2px 6px"}}>🗑</button>
        </div>}
      </div>
      <div style={{padding:"14px 18px"}}>
        <div style={isSideBySide ? {display:"grid",gridTemplateColumns:"2fr 1fr",gap:20,alignItems:"start"} : {}}>
          <div>
            {parsed
              ? parsed.map((s,i)=><NoteSec key={i} sec={s} D={D} images={isSideBySide ? [] : sectionImages(s.key)}/>)
              : isHtml
                ? <div dangerouslySetInnerHTML={{__html:note.body}} className="rich-display" style={{color:D?"#d1d5db":"#374151"}}/>
                : <MD text={note.body||note.text||""} D={D}/>
            }
            {!parsed && !isHtml && (note.images||[]).filter(img=>img&&img.image).map((img,ii)=>(
              <div key={ii} style={{marginBottom:12,cursor:"zoom-in",borderRadius:8,overflow:"hidden",position:"relative"}}
                onClick={()=>setLightbox(img.image)}>
                <img src={img.image} alt="diagram" style={{maxWidth:"100%",borderRadius:8,display:"block",border:`1px solid ${bd2}`}}/>
                <div style={{position:"absolute",bottom:6,right:6,background:"rgba(0,0,0,.55)",color:"#fff",fontSize:10,padding:"2px 8px",borderRadius:8,fontWeight:600}}>🔍 Zoom</div>
              </div>
            ))}
          </div>
          {isSideBySide && (
            <div style={{position:"sticky",top:80}}>
              {(note.images||[]).map((img,ii)=>img&&img.image?(
                <img key={ii} src={img.image} alt="" style={{width:"100%",borderRadius:8,marginBottom:10,display:"block",border:`1px solid ${bd2}`}}/>
              ):null)}
            </div>
          )}
        </div>
        {canEdit && note.diagram && (
          <div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${D?"#2a3347":"#e5e7eb"}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <span style={{fontSize:10,fontWeight:700,color:D?"#8896b3":"#9ca3af",textTransform:"uppercase",letterSpacing:"0.06em"}}>
                📊 {note.diagram.type} diagram
              </span>
              {onAddVisual&&(
                <button onClick={()=>onAddVisual({...note,_removeDiagram:true})}
                  style={{fontSize:10,color:mu(D),background:"none",border:"none",cursor:"pointer"}}>
                  ✕ Remove
                </button>
              )}
            </div>
            <DiagramRenderer diagram={note.diagram} D={D} width={660}/>
          </div>
        )}
        {!canEdit && note.diagram && (
          <div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${D?"#2a3347":"#e5e7eb"}`}}>
            <DiagramRenderer diagram={note.diagram} D={D} width={660}/>
          </div>
        )}
      </div>
      {lightbox&&(
        <div className="img-lb" onClick={()=>setLightbox(null)}>
          <img src={lightbox} alt="enlarged" style={{maxWidth:"95vw",maxHeight:"90vh",borderRadius:12,boxShadow:"0 30px 80px rgba(0,0,0,.5)"}}/>
          <button onClick={()=>setLightbox(null)} style={{position:"absolute",top:16,right:16,background:"rgba(255,255,255,.15)",color:"#fff",border:"none",borderRadius:"50%",width:36,height:36,fontSize:20,cursor:"pointer",lineHeight:1}}>×</button>
        </div>
      )}
    </div>
  );
}

export const ANN_COLORS = ["#ef4444","#3b82f6","#16a34a","#f59e0b","#ffffff","#111827"];
export const ANN_TOOLS  = [{id:"label",icon:"🏷",tip:"Label"},{id:"arrow",icon:"↗",tip:"Arrow"},{id:"text",icon:"T",tip:"Text"}];

export function ImageAnnotator({value, onChange, D}) {
  const {image, annotations=[]} = value||{};
  const [tool,setTool]=useState("label"); const [color,setColor]=useState("#ef4444");
  const [dragging,setDragging]=useState(null); const [arrowStart,setArrowStart]=useState(null);
  const [editId,setEditId]=useState(null); const [editText,setEditText]=useState("");
  const containerRef=useRef(null);
  const pct=e=>{const r=containerRef.current.getBoundingClientRect();return{x:Math.max(0,Math.min(100,((e.clientX-r.left)/r.width)*100)),y:Math.max(0,Math.min(100,((e.clientY-r.top)/r.height)*100))};};
  const update=anns=>onChange({...value,annotations:anns});
  const handleContainerClick=e=>{
    if(e.target!==containerRef.current&&!e.target.tagName.match(/IMG|SVG|svg/i)&&!e.target.classList.contains("ann-bg"))return;
    const {x,y}=pct(e);
    if(tool==="arrow"){if(!arrowStart){setArrowStart({x,y});return;}update([...annotations,{id:uid(),type:"arrow",x:arrowStart.x,y:arrowStart.y,x2:x,y2:y,text:"",color}]);setArrowStart(null);return;}
    update([...annotations,{id:uid(),type:tool,x,y,text:tool==="label"?"Label":"Text",color}]);
  };
  const deleteAnn=id=>update(annotations.filter(a=>a.id!==id));
  const updateAnn=(id,patch)=>update(annotations.map(a=>a.id===id?{...a,...patch}:a));
  const handleMouseDown=(e,ann)=>{e.stopPropagation();const r=containerRef.current.getBoundingClientRect();setDragging({id:ann.id,startX:e.clientX,startY:e.clientY,origX:ann.x,origY:ann.y,w:r.width,h:r.height});};
  const handleMouseMove=e=>{if(!dragging)return;const dx=((e.clientX-dragging.startX)/dragging.w)*100,dy=((e.clientY-dragging.startY)/dragging.h)*100;updateAnn(dragging.id,{x:Math.max(0,Math.min(95,dragging.origX+dx)),y:Math.max(0,Math.min(95,dragging.origY+dy))});};
  const handleMouseUp=()=>setDragging(null);
  if(!image)return null;
  return (
    <div style={{userSelect:"none"}}>
      <div style={{display:"flex",gap:8,marginBottom:8,flexWrap:"wrap",alignItems:"center"}}>
        {ANN_TOOLS.map(t=><button key={t.id} onClick={()=>{setTool(t.id);setArrowStart(null);}} title={t.tip} style={{...B(tool===t.id?"#6366f1":"transparent",tool!==t.id,{fontSize:13,padding:"4px 10px",borderColor:D?"#374151":"#d1d5db",color:tool===t.id?"#fff":tx(D)})}}>{t.icon} {t.tip}</button>)}
        <div style={{display:"flex",gap:5,marginLeft:6}}>{ANN_COLORS.map(c=><button key={c} onClick={()=>setColor(c)} style={{width:20,height:20,borderRadius:"50%",background:c,border:color===c?"2px solid #6366f1":"2px solid transparent",cursor:"pointer",flexShrink:0,outline:"none"}}/>)}</div>
        {arrowStart&&<span style={{fontSize:11,color:"#f59e0b",fontStyle:"italic"}}>Click endpoint…</span>}
      </div>
      <div ref={containerRef} className="ann-bg"
        style={{position:"relative",display:"inline-block",width:"100%",cursor:tool==="arrow"&&arrowStart?"crosshair":"cell",borderRadius:8,overflow:"hidden",border:`1.5px solid ${D?"#374151":"#d1d5db"}`}}
        onClick={handleContainerClick} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
        <img src={image} alt="annotated" style={{display:"block",width:"100%",height:"auto",pointerEvents:"none"}}/>
        <svg style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",pointerEvents:"none",overflow:"visible"}}>
          <defs>{ANN_COLORS.map(c=><marker key={c} id={`ah-${c.slice(1)}`} markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill={c}/></marker>)}</defs>
          {annotations.filter(a=>a.type==="arrow").map(a=><line key={a.id} x1={`${a.x}%`} y1={`${a.y}%`} x2={`${a.x2}%`} y2={`${a.y2}%`} stroke={a.color} strokeWidth="2.5" markerEnd={`url(#ah-${a.color.slice(1)})`} style={{pointerEvents:"stroke",cursor:"pointer"}} onClick={e=>{e.stopPropagation();deleteAnn(a.id);}}/>)}
        </svg>
        {annotations.filter(a=>a.type!=="arrow").map(a=>(
          <div key={a.id} className="ann-handle" style={{position:"absolute",left:`${a.x}%`,top:`${a.y}%`,transform:"translate(-4px,-4px)",zIndex:10}} onMouseDown={e=>handleMouseDown(e,a)}>
            {editId===a.id
              ?<input autoFocus value={editText||a.text} onChange={e=>setEditText(e.target.value)} onBlur={()=>{updateAnn(a.id,{text:editText||a.text});setEditId(null);setEditText("");}} onKeyDown={e=>{if(e.key==="Enter"||e.key==="Escape"){updateAnn(a.id,{text:editText||a.text});setEditId(null);setEditText("");}}} style={{background:a.color,color:a.color==="#ffffff"||a.color==="#f59e0b"?"#111":"#fff",border:"none",borderRadius:4,padding:"3px 7px",fontSize:11,fontWeight:700,width:100,outline:"none"}}/>
              :<div style={{display:"flex",alignItems:"center",gap:4}}>
                <div onDoubleClick={()=>{setEditId(a.id);setEditText(a.text);}} style={{background:a.color,color:a.color==="#ffffff"||a.color==="#f59e0b"?"#111":"#fff",borderRadius:4,padding:"3px 8px",fontSize:11,fontWeight:700,whiteSpace:"nowrap",cursor:"pointer",boxShadow:"0 1px 4px rgba(0,0,0,.4)"}}>{a.text||"…"}</div>
                <button onClick={e=>{e.stopPropagation();deleteAnn(a.id);}} style={{background:"rgba(0,0,0,.5)",color:"#fff",border:"none",borderRadius:3,width:14,height:14,fontSize:9,cursor:"pointer",lineHeight:1,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
              </div>}
          </div>
        ))}
      </div>
      <p style={{fontSize:10,color:mu(D),marginTop:4}}>Click image to place · Drag to move · Double-click to edit</p>
    </div>
  );
}

export function ImagePanel({images=[], onChange, D}) {
  const [annotatingIdx,setAI]=useState(null);
  const fileRef=useRef(null);
  const addImage=e=>{Array.from(e.target.files||[]).forEach(f
