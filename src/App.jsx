import '../src/storage.js'
import React, { useState, useEffect, useCallback, useRef } from "react";
import ReactDOM from "react-dom/client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend } from "recharts";

/* ─── FONTS + KATEX ──────────────────────────────────────────────────────────── */
const _fl=document.createElement("link");_fl.rel="stylesheet";
_fl.href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap";
document.head.appendChild(_fl);
const _kl=document.createElement("link");_kl.rel="stylesheet";
_kl.href="https://cdn.jsdelivr.net/npm/katex@0.16.10/dist/katex.min.css";
document.head.appendChild(_kl);
let _katexReady=typeof window.katex!=="undefined";
const _katexCallbacks=[];
window.__onKatexReady=(cb)=>{if(_katexReady)cb();else _katexCallbacks.push(cb);};
const _ks=document.createElement("script");_ks.async=false;
_ks.src="https://cdn.jsdelivr.net/npm/katex@0.16.10/dist/katex.min.js";
_ks.onload=()=>{_katexReady=true;_katexCallbacks.forEach(cb=>cb());_katexCallbacks.length=0;};
document.head.appendChild(_ks);
const _gs=document.createElement("style");
_gs.textContent=`
*{font-family:'IBM Plex Sans',sans-serif;box-sizing:border-box;margin:0;padding:0}
textarea,input,select{font-family:'IBM Plex Sans',sans-serif!important}
@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes flipCard{0%{transform:rotateY(0)}50%{transform:rotateY(90deg)}100%{transform:rotateY(0)}}
@keyframes streakPop{0%{transform:scale(1)}50%{transform:scale(1.25)}100%{transform:scale(1)}}
.fade-in{animation:fadeIn .22s ease forwards}
.slide-up{animation:slideUp .25s ease forwards}
.streak-pop{animation:streakPop .35s ease}
::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#d1d5db;border-radius:4px}
.ann-handle{cursor:move;user-select:none}
.rich-body{outline:none;min-height:80px;line-height:1.75;font-size:13px}
.rich-body b,.rich-body strong{font-weight:700}
.rich-body i,.rich-body em{font-style:italic}
.rich-body u{text-decoration:underline}
.rich-body ul,.rich-body ol{padding-left:20px;margin:3px 0}
.rich-body li{margin-bottom:2px}
.rich-body h3{font-size:14px;font-weight:700;margin:6px 0 3px}
.rich-display{line-height:1.75;font-size:13px}
.rich-display b,.rich-display strong{font-weight:700}
.rich-display i,.rich-display em{font-style:italic}
.rich-display u{text-decoration:underline}
.rich-display ul,.rich-display ol{padding-left:20px;margin:4px 0}
.rich-display li{margin-bottom:2px}
.rich-display h3{font-size:14px;font-weight:700;margin:6px 0 3px}
`;
document.head.appendChild(_gs);

const ADMIN_USER = "lucasm_25@outlook.com";
const isAdmin    = u => u === ADMIN_USER;
// Extract display name from account key (email or plain username)
function getDisplayName(key) {
  if(!key) return "";
  if(key.indexOf("@")!==-1){
    var local=(key.split("@")[0])||key;
    var m=local.match(/^([A-Za-z]+)/);
    if(m) return m[1].charAt(0).toUpperCase()+m[1].slice(1).toLowerCase();
    return local.slice(0,20);
  }
  return key; // plain username — return whole thing
}
const EXAM_BOARDS = ["AQA","Edexcel","Eduqas","OCR","WJEC"];
const DEFAULT_BOARD = "AQA";

// Personal subjects key — stored in personal (non-shared) storage per user
const SK_PERSONAL = u => "gcse:ps:"+u.replace(/\W/g,"-");

const SK = {
  ACCOUNTS:  "gcse:accounts",
  PROG:      u => `gcse:prog:${u.replace(/\W/g,"-")}`,
  CUSTOM:    (sId,b) => `gcse:c:${sId}:${b}`,
  EXTRAS:    (sId,b) => `gcse:e:${sId}:${b}`,
  PAPERS:    (sId,b) => `gcse:p:${sId}:${b}`,
  TIMETABLE: u => `gcse:tt:${u.replace(/\W/g,"-")}`,
  FRIENDS:   u => `gcse:fr:${u.replace(/\W/g,"-")}`,
  FREQS:     u => `gcse:frq:${u.replace(/\W/g,"-")}`,
};
const hashPw = s => btoa(encodeURIComponent(s)).slice(0,32);
const ADMIN_PASS_HASH = hashPw("ReviseIQAdmin");
const ADMIN_SCHOOL = "Gordon's School";

// ── AI: Groq via Vercel proxy (/api/ai) ──────────────────────────────────────
// API key lives in Vercel Environment Variables as GROQ_API_KEY — never in browser code.
// The /api/ai serverless function proxies requests to Groq, eliminating all CORS issues.
var _GROQ_KEY_ALIAS = []; // unused — kept to avoid reference errors in any cached code
const TUTOR_MODELS = [
  {model:"llama-3.3-70b-versatile", label:"Llama 3.3 70B", dailyLimit:999},
];
var _GROQ_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "gemma2-9b-it",
  "mixtral-8x7b-32768",
];
const tutorUsageKey=function(u){return "gcse:tu:"+(u||"").replace(/\W/g,"-")+":"+new Date().toISOString().slice(0,10);};
async function getTutorUsage(u){
  try{var r=await window.storage.get(tutorUsageKey(u),true);return r&&r.value?JSON.parse(r.value):{};} catch(e){return {};}
}
async function incTutorUsage(u,modelName){
  try{var k2=tutorUsageKey(u);var cur=await getTutorUsage(u);cur[modelName]=(cur[modelName]||0)+1;await window.storage.set(k2,JSON.stringify(cur),true);}catch(e){}
}
async function pickTutorModel(u){ return TUTOR_MODELS[0]; }
// (no legacy Gemini stubs needed — all AI goes through _aiRequest → /api/ai → Groq)

// Core caller — calls the /api/ai Vercel proxy, tries each model in order
async function _aiRequest(systemPrompt, messages, maxTokens){
  var tokLimit = (maxTokens && maxTokens > 0) ? maxTokens : 1500;
  var msgs = [];
  if(systemPrompt) msgs.push({role:"system", content:systemPrompt});
  // Detect if any user message has image files attached
  var hasImages = false;
  for(var ci=0;ci<messages.length;ci++){
    var cm=messages[ci];
    if(cm._d && cm._d.files && Array.isArray(cm._d.files)){
      for(var fi2=0;fi2<cm._d.files.length;fi2++){
        if(cm._d.files[fi2].isImage) hasImages=true;
      }
    }
  }
  for(var i=0;i<messages.length;i++){
    var m = messages[i];
    var role = m.role==="assistant"?"assistant":"user";
    var txt = "";
    if(m._d && typeof m._d.text==="string") txt = m._d.text;
    else if(typeof m.content==="string") txt = m.content;
    else if(Array.isArray(m.content)){
      txt = m.content.filter(function(p){return p.type==="text";})
        .map(function(p){return p.text||"";}).join("\n");
    }
    // Append text/PDF file content inline so AI can see it
    if(m._d && m._d.files && Array.isArray(m._d.files)){
      var fileParts = [];
      for(var fi=0;fi<m._d.files.length;fi++){
        var f=m._d.files[fi];
        if(f.isText && f.textContent) fileParts.push("[Uploaded text file: "+f.name+"]\n"+f.textContent);
        else if(f.isPdf) fileParts.push("[Uploaded PDF: "+f.name+" — please analyse the content described by the student]");
        else if(f.isImage){
          // Image handled separately via content array below
        } else if(f.unsupported){
          fileParts.push("[Uploaded file: "+f.name+"]");
        }
      }
      if(fileParts.length) txt = txt ? txt+"\n\n"+fileParts.join("\n\n") : fileParts.join("\n\n");
    }
    if(!txt.trim() && !(m._d && m._d.files && m._d.files.some(function(f){return f.isImage;}))) continue;
    // Build content: if this message has images, use array format
    var msgContent;
    if(m._d && m._d.files && m._d.files.some(function(f){return f.isImage;})){
      var contentArr = [];
      if(txt.trim()) contentArr.push({type:"text",text:txt});
      for(var ii=0;ii<m._d.files.length;ii++){
        var imgF=m._d.files[ii];
        if(imgF.isImage && imgF.data){
          contentArr.push({type:"image_url",image_url:{url:"data:"+imgF.type+";base64,"+imgF.data}});
        }
      }
      msgContent = contentArr;
    } else {
      msgContent = txt;
    }
    // Merge consecutive same-role text-only messages
    if(typeof msgContent==="string" && msgs.length>0 && msgs[msgs.length-1].role===role && typeof msgs[msgs.length-1].content==="string"){
      msgs[msgs.length-1].content += "\n"+msgContent;
    } else {
      msgs.push({role:role, content:msgContent});
    }
  }
  if(!msgs.length || msgs[msgs.length-1].role!=="user"){
    msgs.push({role:"user", content:"Hello"});
  }

  // Use vision-capable model first when images are present, then fall back
  var modelList = hasImages
    ? ["meta-llama/llama-4-scout-17b-16e-instruct","llama-3.2-11b-vision-preview"].concat(_GROQ_MODELS)
    : _GROQ_MODELS;

  var lastErr = new Error("AI unavailable.");
  for(var mi=0; mi<modelList.length; mi++){
    try{
      var resp = await fetch("/api/ai",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:modelList[mi], messages:msgs, max_tokens:tokLimit, temperature:0.7})
      });
      var dat = await resp.json();
      if(dat.error){
        var errMsg = (typeof dat.error==="string")?dat.error:(dat.error.message||"AI error");
        var el = errMsg.toLowerCase();
        if(el.indexOf("model")!==-1&&(el.indexOf("not found")!==-1||el.indexOf("does not exist")!==-1)){
          lastErr=new Error(errMsg); continue; // try next model
        }
        throw new Error(errMsg);
      }
      var text = dat.choices&&dat.choices[0]&&dat.choices[0].message&&dat.choices[0].message.content;
      if(!text){ lastErr=new Error("Empty response from AI"); continue; }
      return text;
    }catch(ex){
      lastErr=ex; continue;
    }
  }
  throw lastErr;
}

// Public API — callAI / callAIChat used throughout the app
async function callAI(prompt, maxTokens){
  return _aiRequest(null, [{role:"user", content:prompt}], maxTokens||1500);
}
async function callAIChat(systemPrompt, messages, maxTokens){
  return _aiRequest(systemPrompt||null, messages, maxTokens||1500);
}
// Legacy aliases so any remaining callGeminiSimple / callGeminiChat calls still work
var callGeminiSimple = callAI;
var callGeminiChat = function(_ignored, systemPrompt, messages){ return callAIChat(systemPrompt, messages); };
// Account format helpers (supports both legacy string and new {h,gki} object)
function getAccHash(acc){return typeof acc==="string"?acc:acc?.h;}
function getAccGki(acc){return typeof acc==="string"?null:(acc?.gki??null);}
function getAccDisplayName(acc){return (acc&&typeof acc==="object"&&acc.displayName)||"";}

const ALL_SUBJECTS = [
  { id:"maths",        name:"Maths",                icon:"📐", accent:"#0ea5e9", light:"#f0f9ff", mid:"#e0f2fe", dk:"#0c4a6e" },
  { id:"eng-lang",     name:"English Language",     icon:"📝", accent:"#f59e0b", light:"#fffbeb", mid:"#fef3c7", dk:"#78350f" },
  { id:"eng-lit",      name:"English Literature",   icon:"📖", accent:"#ec4899", light:"#fdf2f8", mid:"#fce7f3", dk:"#831843" },
  { id:"bio",          name:"Biology",              icon:"🧬", accent:"#10b981", light:"#ecfdf5", mid:"#d1fae5", dk:"#065f46" },
  { id:"chem",         name:"Chemistry",            icon:"⚗️",  accent:"#3b82f6", light:"#eff6ff", mid:"#dbeafe", dk:"#1e3a5f" },
  { id:"phys",         name:"Physics",              icon:"⚡", accent:"#8b5cf6", light:"#f5f3ff", mid:"#ede9fe", dk:"#3b0764" },
  { id:"combined-sci", name:"Combined Science",     icon:"🔬", accent:"#14b8a6", light:"#f0fdfa", mid:"#ccfbf1", dk:"#134e4a" },
  { id:"history",      name:"History",              icon:"🏛️", accent:"#d97706", light:"#fffbeb", mid:"#fef3c7", dk:"#78350f" },
  { id:"geography",    name:"Geography",            icon:"🌍", accent:"#16a34a", light:"#f0fdf4", mid:"#dcfce7", dk:"#14532d" },
  { id:"french",       name:"French",               icon:"🇫🇷", accent:"#2563eb", light:"#eff6ff", mid:"#dbeafe", dk:"#1e3a5f" },
  { id:"spanish",      name:"Spanish",              icon:"🇪🇸", accent:"#dc2626", light:"#fef2f2", mid:"#fee2e2", dk:"#7f1d1d" },
  { id:"german",       name:"German",               icon:"🇩🇪", accent:"#ef4444", light:"#fef2f2", mid:"#fee2e2", dk:"#991b1b" },
  { id:"business",     name:"Business",             icon:"💼", accent:"#0891b2", light:"#ecfeff", mid:"#cffafe", dk:"#164e63" },
  { id:"computing",    name:"Computing",            icon:"💻", accent:"#6366f1", light:"#eef2ff", mid:"#e0e7ff", dk:"#312e81" },
  { id:"dt",           name:"Design & Technology",  icon:"🔧", accent:"#ea580c", light:"#fff7ed", mid:"#ffedd5", dk:"#7c2d12" },
  { id:"drama",        name:"Drama",                icon:"🎭", accent:"#a855f7", light:"#faf5ff", mid:"#f3e8ff", dk:"#581c87" },
  { id:"music",        name:"Music",                icon:"🎵", accent:"#f43f5e", light:"#fff1f2", mid:"#ffe4e6", dk:"#881337" },
  { id:"politics",     name:"Politics",             icon:"🏛️", accent:"#0f766e", light:"#f0fdfa", mid:"#ccfbf1", dk:"#134e4a", _politics:true },
];

const SM2_QUALITY_MAP = [0, 3, 4, 5];
function sm2Next(prev, btnQuality) {
  const q = SM2_QUALITY_MAP[btnQuality] ?? 0;
  let { ef = 2.5, interval = 0, reps = 0 } = (prev && typeof prev === "object") ? prev : {};
  if (q < 3) { reps = 0; interval = 1; }
  else {
    if (reps === 0) interval = 1;
    else if (reps === 1) interval = 6;
    else interval = Math.round(interval * ef);
    reps += 1;
  }
  ef = Math.max(1.3, ef + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  const due = Date.now() + interval * 86400000;
  return { ef, interval, reps, due, lastQ: btnQuality };
}
function getCardState(fcHist, cardId) {
  const v = fcHist[cardId];
  if (v === undefined || v === null) return null;
  if (typeof v === "boolean") return { ef: 2.5, interval: v ? 1 : 1, reps: v ? 1 : 0, due: 0, lastQ: v ? 2 : 0 };
  return v;
}
function isCardDue(fcHist, cardId) {
  const s = getCardState(fcHist, cardId);
  if (!s) return true;
  return Date.now() >= s.due;
}
function previewIntervals(state) {
  return [0,1,2,3].map(q => {
    const n = sm2Next(state, q);
    if (n.interval <= 1) return "today";
    if (n.interval < 7) return `${n.interval}d`;
    if (n.interval < 30) return `${Math.round(n.interval/7)}w`;
    return `${Math.round(n.interval/30)}mo`;
  });
}

function todayStr() { return new Date().toISOString().slice(0,10); }
function calcStreak(activityDates) {
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0,10);
    if (activityDates.has(key)) streak++;
    else if (i > 0) break;
  }
  return streak;
}
function calcLongestStreak(activityDates) {
  if (!activityDates.size) return 0;
  const sorted = [...activityDates].sort();
  let best = 1, cur = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i-1]), curr = new Date(sorted[i]);
    const diff = (curr - prev) / 86400000;
    if (diff === 1) { cur++; best = Math.max(best, cur); } else cur = 1;
  }
  return best;
}

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
        const schoolNorm = school.trim().toLowerCase();
        setEntries(all.filter(e => e.school.trim().toLowerCase() === schoolNorm).sort((a, b) => (b.score||0) - (a.score||0)));
      } catch (_) {}
      setLoading(false);
    })();
  }, [school]);
  return { entries, loading };
}

function SchoolLeaderboard({ user, school, D }) {
  const { entries, loading } = useSchoolLeaderboard(user, school);
  if (!school) return (
    <div style={{marginTop:14,padding:"10px 14px",borderRadius:10,background:D?"#1f2937":"#f3f4f6",fontSize:12,color:D?"#9ca3af":"#6b7280"}}>
      🏫 Add your school during sign-up to see how you rank among classmates.
    </div>
  );
  if (loading) return <div style={{marginTop:14,fontSize:12,color:D?"#6b7280":"#9ca3af"}}>Loading school leaderboard…</div>;
  if (!entries.length) return (
    <div style={{marginTop:14,padding:"10px 14px",borderRadius:10,background:D?"#1f2937":"#f3f4f6",fontSize:12,color:D?"#9ca3af":"#6b7280"}}>
      🏆 No other students from <strong>{school}</strong> yet — invite your classmates!
    </div>
  );
  const mu2 = D ? "#6b7280" : "#9ca3af";
  const tx2 = D ? "#f9fafb" : "#111827";
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

async function markAnswer(q, ans) {
  const prompt = "You are an AQA GCSE examiner. Mark this answer strictly.\n\nQuestion: "+q.text+"\nMax marks: "+q.marks+"\nMark scheme: "+q.markScheme+"\nStudent answer: "+ans+"\n\nRespond ONLY with valid JSON (no markdown):\n{\"score\":0,\"feedback\":\"2-3 sentences\",\"missedPoints\":[\"point\"],\"modelAnswer\":\"ideal answer\",\"examTip\":\"one AQA tip\"}";
  const raw = await callGeminiSimple(prompt, 800);
  const fence = "`"+"`"+"`"; const clean = raw.split(fence+"json").join("").split(fence).join("").trim();
  const s=clean.indexOf("{"), e=clean.lastIndexOf("}");
  return JSON.parse(s>=0&&e>=0?clean.slice(s,e+1):clean);
}

async function blurtAnalyse(notesText, blurtText) {
  const prompt = "You are a GCSE revision coach analysing a blurting exercise.\n\nRevision Notes:\n"+notesText+"\n\nStudent's blurt (from memory):\n"+blurtText+"\n\nRespond ONLY with valid JSON (no markdown, no backticks):\n{\"remembered\":[\"well-recalled point\"],\"missed\":[\"key point they forgot\"],\"partial\":[\"partially recalled point\"],\"feedback\":\"2-sentence encouragement + top tip\",\"score\":75}\n\nScore = % of key concepts the student demonstrated (0-100).";
  const raw = await callGeminiSimple(prompt, 1000);
  const fence = "`"+"`"+"`"; const clean = raw.split(fence+"json").join("").split(fence).join("").trim();
  const s=clean.indexOf("{"), e=clean.lastIndexOf("}");
  return JSON.parse(s>=0&&e>=0?clean.slice(s,e+1):clean);
}

/* ─── MOCK EXAM SPECS ────────────────────────────────────────────────────────── */
const MOCK_SPECS={
  "maths:AQA":[
    {n:"Paper 1 – Non-Calculator",d:90,m:80,paperType:"standard",mcq:0,sh:0,ex:0,free:80,
     desc:"All Maths topics. No calculator. Show all working clearly.",
     skills:["No calculator allowed","Show all working","QWC on some questions"]},
    {n:"Paper 2 – Calculator",d:90,m:80,paperType:"standard",mcq:0,sh:0,ex:0,free:80,
     desc:"Calculator allowed. Problem-solving and reasoning questions included.",
     skills:["Calculator permitted","Problem-solving and reasoning questions"]},
    {n:"Paper 3 – Calculator",d:90,m:80,paperType:"standard",mcq:0,sh:0,ex:0,free:80,
     desc:"Calculator allowed. Synoptic paper assessing all content areas.",
     skills:["Calculator permitted","Synoptic — all topics"]},
  ],
  "maths:Edexcel":[
    {n:"Paper 1 – Non-Calculator",d:90,m:80,paperType:"standard",mcq:0,sh:0,ex:0,free:80,
     markDist:"40% 1-mark, 35% 2-mark, 20% 3-mark, 10% 4-mark, 3% 5–6 mark",
     desc:"1 hour 30 min, 80 marks. Non-calculator. Covers all Higher Tier topics.",
     skills:["No calculator","Show all working","40% 1-mark questions"]},
    {n:"Paper 2 – Calculator",d:90,m:80,paperType:"standard",mcq:0,sh:0,ex:0,free:80,
     markDist:"40% 1-mark, 35% 2-mark, 20% 3-mark, 12% 4-mark, 4% 5–6 mark",
     desc:"1 hour 30 min, 80 marks. Calculator allowed.",
     skills:["Calculator permitted","40% 1-mark questions"]},
    {n:"Paper 3 – Calculator",d:90,m:80,paperType:"standard",mcq:0,sh:0,ex:0,free:80,
     markDist:"35% 1-mark, 35% 2-mark, 25% 3-mark, 15% 4-mark, 5% 5–6 mark",
     desc:"1 hour 30 min, 80 marks. Calculator allowed. Higher proportion of multi-mark questions.",
     skills:["Calculator permitted","Higher proportion 3–6 mark questions"]},
  ],
  "bio:AQA":[
    {n:"Paper 1",d:105,m:100,paperType:"standard",mcq:0,sh:30,ex:5,free:0,
     markDist:"45% 1-mark, 30% 2-mark, 14% 3-mark, 7% 4-mark, 4% 6-mark",
     desc:"1 hr 45 min, 100 marks. Topics 1–4: Cell Biology, Organisation, Infection & Response, Bioenergetics. 10% maths, 15% practical.",
     skills:["~10% maths skills","~15% practical skills","Short-answer and extended writing","No MCQ section"]},
    {n:"Paper 2",d:105,m:100,paperType:"standard",mcq:0,sh:30,ex:5,free:0,
     markDist:"45% 1-mark, 30% 2-mark, 14% 3-mark, 7% 4-mark, 4% 6-mark",
     desc:"1 hr 45 min, 100 marks. Topics 5–7: Homeostasis, Inheritance, Ecology. 10% maths, 15% practical.",
     skills:["~10% maths skills","~15% practical skills","Short-answer and extended writing"]},
  ],
  "chem:AQA":[
    {n:"Paper 1",d:105,m:100,paperType:"standard",mcq:0,sh:30,ex:5,free:0,
     markDist:"45% 1-mark, 30% 2-mark, 14% 3-mark, 7% 4-mark, 4% 6-mark",
     desc:"1 hr 45 min, 100 marks. Topics 1–5: Atomic structure, Bonding, Quantitative chemistry, Chemical changes, Energy changes. ~20% maths.",
     skills:["~20% maths skills","~15% practical skills","No MCQ section"]},
    {n:"Paper 2",d:105,m:100,paperType:"standard",mcq:0,sh:30,ex:5,free:0,
     markDist:"45% 1-mark, 30% 2-mark, 14% 3-mark, 7% 4-mark, 4% 6-mark",
     desc:"1 hr 45 min, 100 marks. Topics 6–10: Rate of reaction, Organic chemistry, Analysing resources.",
     skills:["~20% maths skills","~15% practical skills"]},
  ],
  "phys:AQA":[
    {n:"Paper 1",d:105,m:100,paperType:"standard",mcq:0,sh:30,ex:5,free:0,
     markDist:"45% 1-mark, 30% 2-mark, 14% 3-mark, 7% 4-mark, 4% 6-mark",
     desc:"1 hr 45 min, 100 marks. Topics 1–4: Energy, Electricity, Particle model, Atomic structure. ~30% maths.",
     skills:["~30% maths skills","~15% practical skills","Show all calculations"]},
    {n:"Paper 2",d:105,m:100,paperType:"standard",mcq:0,sh:30,ex:5,free:0,
     markDist:"45% 1-mark, 30% 2-mark, 14% 3-mark, 7% 4-mark, 4% 6-mark",
     desc:"1 hr 45 min, 100 marks. Topics 5–8: Forces, Waves, Electromagnetism, Space Physics.",
     skills:["~30% maths skills","~15% practical skills"]},
  ],
  "bio:Edexcel":[
    {n:"Paper 1",d:105,m:100,paperType:"standard",mcq:10,sh:20,ex:4,free:0,
     desc:"Topics 1–5. Section A: 10 MCQs. Section B: structured questions. ~20% maths, ~25% practical.",
     skills:["10 MCQs (Section A)","~20% maths","~25% practical"]},
    {n:"Paper 2",d:105,m:100,paperType:"standard",mcq:10,sh:20,ex:4,free:0,
     desc:"Topics 1–7 synoptic. 10 MCQs, then structured questions.",
     skills:["10 MCQs","Synoptic across all topics"]},
    {n:"Paper 3",d:75,m:70,paperType:"standard",mcq:5,sh:15,ex:3,free:0,
     desc:"Synoptic paper. Topics 1–7. Focus on data analysis and practical skills.",
     skills:["Synoptic questions","Data interpretation","Practical skills"]},
  ],
  "chem:Edexcel":[
    {n:"Paper 1",d:105,m:100,paperType:"standard",mcq:10,sh:20,ex:4,free:0,
     desc:"Topics 1–6. Section A: 10 MCQs. Section B: structured questions.",
     skills:["10 MCQs","~20% maths","~20% practical"]},
    {n:"Paper 2",d:105,m:100,paperType:"standard",mcq:10,sh:20,ex:4,free:0,
     desc:"Topics 1–9. 10 MCQs then structured questions. Synoptic elements.",
     skills:["10 MCQs","Synoptic","Extended writing on chemistry concepts"]},
  ],
  "phys:Edexcel":[
    {n:"Paper 1",d:105,m:100,paperType:"standard",mcq:10,sh:20,ex:4,free:0,
     desc:"Topics 1–6. Section A: 10 MCQs. Section B: structured questions.",
     skills:["10 MCQs","~30% maths","~15% practical"]},
    {n:"Paper 2",d:105,m:100,paperType:"standard",mcq:10,sh:20,ex:4,free:0,
     desc:"Topics 1–8. Astronomy and Energy resources included.",
     skills:["10 MCQs","~30% maths","Astronomy questions"]},
  ],
  "eng-lang:AQA":[
    {n:"Paper 1 – Explorations in Creative Reading & Writing",d:105,m:80,paperType:"structured",
     paperPrompt:"eng-lang-p1",
     desc:"Section A: Reading unseen literary fiction (40 marks). Section B: Creative writing — description or story opening (40 marks).",
     skills:["Q1: 4×1-mark MCQ retrieval (lines 1–9)","Q2: 8-mark language analysis","Q3: 8-mark structure analysis","Q4: 20-mark critical evaluation","Q5: 40-mark creative writing (24 content + 16 accuracy)"]},
    {n:"Paper 2 – Writers' Viewpoints & Perspectives",d:105,m:80,paperType:"comingSoon",
     desc:"Coming soon — non-fiction reading + transactional writing.",skills:[]},
  ],
  "eng-lit:AQA":[
    {n:"Paper 1 – Shakespeare & 19th-Century Novel",d:105,m:64,paperType:"structured",
     paperPrompt:"eng-lit-p1",
     configFields:[
       {id:"shakespeare",label:"Which Shakespeare play are you studying?",type:"select",
        options:["Macbeth","Romeo and Juliet","The Tempest","The Merchant of Venice","Much Ado About Nothing","Julius Caesar"]},
       {id:"novel",label:"Which 19th-century novel are you studying?",type:"select",
        options:["The Strange Case of Dr Jekyll and Mr Hyde","A Christmas Carol","Great Expectations","Jane Eyre","Frankenstein","Pride and Prejudice","The Sign of Four"]},
     ],
     desc:"Section A: Shakespeare extract + whole text analysis (30+4 AO4 marks). Section B: 19th-century novel (30 marks).",
     skills:["Extract + whole text analysis","AO4: 4 SPaG/context marks (Section A)","Focus on writer's methods","PEE/PETAL structure"]},
    {n:"Paper 2 – Modern Texts & Poetry",d:135,m:96,paperType:"comingSoon",
     desc:"Coming soon — modern prose/drama + anthology poetry + unseen poetry.",skills:[]},
  ],
  "history:AQA":[
    {n:"Paper 1 – Understanding the Modern World",d:105,m:84,paperType:"comingSoon",
     desc:"Coming soon.",skills:[]},
    {n:"Paper 2 – Shaping the Nation (Elizabethan England)",d:105,m:40,paperType:"structured",
     paperPrompt:"history-p2-elizabethan",
     configFields:[
       {id:"britishStudy",label:"British depth study",type:"select",
        options:["Elizabethan England, c1568–1603"],
        note:"Only Elizabethan England is available in this version."},
       {id:"examYear",label:"Which year are you sitting your exam?",type:"select",
        options:["2026","2027","2028"],
        note:"Determines your Historic Environment question (Q4)."},
     ],
     desc:"Section B: Elizabethan England. Q1: Interpretation (8 marks). Q2: Importance (8 marks). Q3: Account (8 marks). Q4: Historic Environment (16 marks).",
     skills:["Q1: Interpretation — 8 marks","Q2: Importance — 8 marks","Q3: Write an account — 8 marks","Q4: Historic Environment essay — 16 marks"]},
  ],
  "geography:AQA":[
    {n:"Paper 1 – Living with the Physical Environment",d:90,m:88,paperType:"standard",mcq:0,sh:9,ex:3,free:0,
     desc:"Natural Hazards, Living World, Physical Landscapes in the UK.",
     skills:["OS map skills","6-mark and 9-mark extended answers","Data interpretation"]},
    {n:"Paper 2 – Challenges in the Human Environment",d:90,m:88,paperType:"standard",mcq:0,sh:9,ex:3,free:0,
     desc:"Urban Issues, Changing Economic World, Resource Management.",
     skills:["Case study questions","6-mark and 9-mark extended answers"]},
    {n:"Paper 3 – Geographical Applications",d:75,m:76,paperType:"standard",mcq:0,sh:5,ex:3,free:0,
     desc:"Issue evaluation + fieldwork questions.",
     skills:["Pre-release stimulus analysis","Fieldwork skills","12-mark decision-making question"]},
  ],
  "french:AQA":[
    {n:"Listening",d:45,m:50,paperType:"comingSoon",desc:"Coming soon.",skills:[]},
    {n:"Reading",d:60,m:60,paperType:"comingSoon",desc:"Coming soon.",skills:[]},
    {n:"Writing",d:75,m:60,paperType:"comingSoon",desc:"Coming soon.",skills:[]},
  ],
  "spanish:AQA":[
    {n:"Listening",d:45,m:50,paperType:"comingSoon",desc:"Coming soon.",skills:[]},
    {n:"Reading",d:60,m:60,paperType:"comingSoon",desc:"Coming soon.",skills:[]},
    {n:"Writing",d:75,m:60,paperType:"comingSoon",desc:"Coming soon.",skills:[]},
  ],
  "german:AQA":[
    {n:"Listening",d:45,m:50,paperType:"comingSoon",desc:"Coming soon.",skills:[]},
    {n:"Reading",d:60,m:60,paperType:"comingSoon",desc:"Coming soon.",skills:[]},
    {n:"Writing",d:75,m:60,paperType:"comingSoon",desc:"Coming soon.",skills:[]},
  ],
  "business:AQA":[
    {n:"Paper 1",d:105,m:100,paperType:"standard",mcq:5,sh:8,ex:3,free:0,
     desc:"Business operations, human resource management, and wider influences.",
     skills:["5×1-mark MCQ","9-mark and 12-mark extended evaluation questions"]},
    {n:"Paper 2",d:105,m:100,paperType:"standard",mcq:5,sh:8,ex:3,free:0,
     desc:"Finance, marketing and external business influences.",
     skills:["5×1-mark MCQ","Extended evaluation questions"]},
  ],
  "computing:AQA":[
    {n:"Paper 1 – Computational Thinking & Programming",d:150,m:80,paperType:"standard",mcq:0,sh:9,ex:2,free:0,
     desc:"Programming, algorithms, computational thinking.",
     skills:["Trace tables","Pseudocode writing","Program design tasks"]},
    {n:"Paper 2 – Computer Systems",d:90,m:80,paperType:"standard",mcq:0,sh:9,ex:2,free:0,
     desc:"Systems architecture, networks, cybersecurity, ethics.",
     skills:["Binary calculations","Network scenarios","Extended explanations"]},
  ],
  "dt:AQA":[
    {n:"Paper 1 – Core Technical Principles",d:90,m:100,paperType:"standard",mcq:20,sh:7,ex:2,free:0,
     desc:"Section A: 20×1-mark MCQs. Section B: core technical principles.",
     skills:["20×1-mark MCQs","Extended design/materials questions"]},
    {n:"Paper 2 – Specialist Technical Principles",d:60,m:80,paperType:"standard",mcq:5,sh:7,ex:2,free:0,
     desc:"Specialist focus area questions.",
     skills:["5 MCQs","8-mark design/evaluation question"]},
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
const getMockSpec=(sId,board)=>{
  const key=`${sId}:${board}`;
  const fallback=MOCK_SPECS[`${sId}:AQA`];
  if(MOCK_SPECS[key])return MOCK_SPECS[key];
  if(fallback)return fallback;
  const subj=ALL_SUBJECTS.find(s=>s.id===sId);
  return [{n:"All papers",d:90,m:80,paperType:"comingSoon",desc:`${board} ${subj?.name||sId} mock papers coming soon.`,skills:[]}];
};

async function generateMockQuestions(subjName,board,paperName,needed,contextNotes,markDist){
  var markPart = markDist ? ("Mark distribution guidance: " + markDist + "\n") : "";
  var needPart = needed.map(function(n){ return "- " + n.count + " x " + n.type + " question(s), " + n.marks + " mark(s) each"; }).join("\n");
  var prompt = "You are an expert GCSE " + subjName + " examiner (" + board + "). Generate additional exam questions for \"" + paperName + "\".\n" +
    markPart +
    "Revision content:\n" + (contextNotes || ("Standard GCSE " + subjName + " content")) + "\n\n" +
    "Generate these questions:\n" + needPart + "\n\n" +
    "IMPORTANT: Use " + board + " GCSE command words. Questions must be exam-quality.\n" +
    "Do NOT include mark allocations in question text.\n" +
    "RESPOND ONLY with a valid JSON array. No markdown, no backticks. Each element:\n" +
    "{\"type\":\"mcq\"|\"short\"|\"extended\",\"text\":\"..\",\"marks\":N,\"year\":\"AI Generated\"}\n" +
    "MCQ: add \"options\":[\"A\",\"B\",\"C\",\"D\"],\"answer\":0,\"explanation\":\"...\"\n" +
    "short/extended: add \"markScheme\":\"DETAILED scheme\",\"sampleAnswer\":\"model answer\"";

  var lastErr = null;
  for (var attempt = 0; attempt < 3; attempt++) {
    try {
      if (attempt > 0) await new Promise(function(res){ setTimeout(res, 800 * attempt); });
      var raw = await callGeminiSimple(prompt, 5000);
      var fence = "`"+"`"+"`"; raw = raw.split(fence+"json").join("").split(fence).join("").trim();
      var start = raw.indexOf("[");
      var end = raw.lastIndexOf("]");
      if (start < 0 || end < 0) {
        var lastBrace = raw.lastIndexOf("}");
        if (lastBrace > 0 && start >= 0) raw = raw.slice(start, lastBrace + 1) + "]";
        else throw new Error("No JSON array in response");
      } else {
        raw = raw.slice(start, end + 1);
      }
      var qs = JSON.parse(raw);
      return Array.isArray(qs) ? qs.map(function(q){ return Object.assign({}, q, {id:"ai-"+uid()}); }) : [];
    } catch(e) { lastErr = e; }
  }
  throw lastErr;
}


async function generateStructuredPaper(subjName,board,paper,config,mergedTopics){
  const notesCtx=mergedTopics.flatMap(t=>t.sections.flatMap(s=>
    (s.notes||[]).map(n=>`${n.heading}: ${stripHtml(n.body)}`)
  )).slice(0,15).join("\n");

  let prompt="";

  if(paper.paperPrompt==="eng-lang-p1"){
    // Two-step generation to avoid JSON truncation: first generate extract, then questions
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

  const rawText=await callGeminiSimple(prompt, 8000);
  const d={content:[{text:rawText}]};
  if(!rawText)throw new Error("Structured paper generation failed");
  let raw=d.content[0].text.replace(/\x60{3}(?:json)?\n?/g,"").trim();
  // Extract JSON from response if wrapped in other text
  if(!raw.startsWith("{")){const m=raw.match(/\{[\s\S]*\}/);if(m)raw=m[0];}
  // Attempt to recover from truncated JSON by finding the last valid closing
  let parsed;
  try{parsed=JSON.parse(raw);}
  catch(parseErr){
    // Try to salvage a partial response — truncate at last complete question
    const lastBrace=raw.lastIndexOf("}");
    const lastBracket=raw.lastIndexOf("]");
    if(lastBracket>0&&lastBrace>0){
      // Try closing the JSON array and object
      const truncated=raw.slice(0,Math.max(lastBracket,lastBrace)+1);
      try{
        // Count open braces/brackets to determine what to close
        let open=0;
        for(const ch of truncated){if(ch==="{")open++;else if(ch==="}") open--;}
        const closing="}".repeat(Math.max(0,open));
        parsed=JSON.parse(truncated+closing);
      }catch(e){throw new Error("Failed to parse AI response. Please try again.");}
    }else throw new Error("Failed to parse AI response. Please try again.");
  }
  return{
    extract:parsed.extract||null,
    extract2:parsed.extract2||null,
    questions:(parsed.questions||[]).map(q=>({...q,id:q.id||`ai-${uid()}`})),
  };
}


/* ─── FRIENDS PANEL ──────────────────────────────────────────────────────────── */
function FriendsPanel({user,D}){
  const [fd,setFD]=useState({friends:[],incoming:[],sent:[]});
  const [lbMap,setLbMap]=useState({});
  const [tab,setFTab]=useState("lb");
  const [search,setSearch]=useState("");
  const [msg,setMsg]=useState("");
  const [busy,setBusy]=useState(false);
  const FRKEY=u=>`gcse:fr:${u.replace(/\W/g,"-")}`;
  const FQKEY=u=>`gcse:frq:${u.replace(/\W/g,"-")}`;
  const bd2=D?"#1f2937":"#e5e7eb";

  const loadFD=async()=>{
    let base={friends:[],incoming:[],sent:[]};
    try{const r=await window.storage.get(FRKEY(user),true);if(r?.value)base=JSON.parse(r.value);}catch(e){}
    try{
      const r=await window.storage.get(FQKEY(user),true);
      if(r?.value){
        const inc=JSON.parse(r.value);
        const merged=[...new Set([...base.incoming,...inc])].filter(u=>!base.friends.includes(u));
        base={...base,incoming:merged};
      }
    }catch(e){}
    setFD(base);
  };

  const saveFD=async d=>{setFD(d);try{await window.storage.set(FRKEY(user),JSON.stringify(d),true);}catch(e){}};

  useEffect(()=>{loadFD();},[]);

  useEffect(()=>{
    const run=async()=>{
      const m={};
      for(const u of [user,...fd.friends]){
        try{const r=await window.storage.get(`gcse:lb:${u.replace(/\W/g,"-")}`,true);if(r?.value)m[u]=JSON.parse(r.value);}catch(e){}
      }
      setLbMap(m);
    };
    run();
  },[fd.friends.join(",")]);// eslint-disable-line

  const sendReq=async()=>{
    const target=search.trim();
    if(!target||target===user){setMsg("Enter a valid username.");return;}
    if(fd.friends.includes(target)){setMsg("Already friends!");return;}
    if(fd.sent.includes(target)){setMsg("Request already sent.");return;}
    setBusy(true);setMsg("");
    try{
      const ar=await window.storage.get("gcse:accounts",true);
      const accs=ar?.value?JSON.parse(ar.value):{};
      if(!accs[target]){setMsg("User not found.");setBusy(false);return;}
      let inc=[];
      try{const qr=await window.storage.get(FQKEY(target),true);if(qr?.value)inc=JSON.parse(qr.value);}catch(e){}
      if(!inc.includes(user)){inc.push(user);await window.storage.set(FQKEY(target),JSON.stringify(inc),true);}
      await saveFD({...fd,sent:[...fd.sent,target]});
      setSearch("");setMsg(`✓ Friend request sent to ${target}!`);
    }catch(e){setMsg("Error: "+e.message);}
    setBusy(false);
  };

  const acceptReq=async req=>{
    const nd={...fd,friends:[...fd.friends,req],incoming:fd.incoming.filter(u=>u!==req)};
    try{
      let rd={friends:[],incoming:[],sent:[]};
      const rr=await window.storage.get(FRKEY(req),true);if(rr?.value)rd=JSON.parse(rr.value);
      await window.storage.set(FRKEY(req),JSON.stringify({...rd,friends:[...rd.friends.filter(u=>u!==user),user],sent:rd.sent.filter(u=>u!==user)}),true);
    }catch(e){}
    try{const sr=await window.storage.get(FQKEY(user),true);if(sr?.value)await window.storage.set(FQKEY(user),JSON.stringify(JSON.parse(sr.value).filter(u=>u!==req)),true);}catch(e){}
    await saveFD(nd);
  };

  const declineReq=async req=>{
    try{const sr=await window.storage.get(FQKEY(user),true);if(sr?.value)await window.storage.set(FQKEY(user),JSON.stringify(JSON.parse(sr.value).filter(u=>u!==req)),true);}catch(e){}
    await saveFD({...fd,incoming:fd.incoming.filter(u=>u!==req)});
  };

  const removeFriend=async fr=>{
    const nd={...fd,friends:fd.friends.filter(u=>u!==fr)};
    try{let rd={friends:[],incoming:[],sent:[]};const rr=await window.storage.get(FRKEY(fr),true);if(rr?.value)rd=JSON.parse(rr.value);await window.storage.set(FRKEY(fr),JSON.stringify({...rd,friends:rd.friends.filter(u=>u!==user)}),true);}catch(e){}
    await saveFD(nd);
  };

  const lb=[user,...fd.friends].map(u=>({u,score:lbMap[u]?.score||0,school:lbMap[u]?.school||""})).sort((a,b)=>b.score-a.score);

  return (
    <div style={{marginTop:14}}>
      <div style={{display:"flex",gap:4,marginBottom:10,flexWrap:"wrap"}}>
        {[["lb","👥 Friends LB"],["add","➕ Add"],["req",`📬 Requests${fd.incoming.length>0?` (${fd.incoming.length})`:""}`]].map(([t,lbl])=>(
          <button key={t} onClick={()=>setFTab(t)} style={{fontSize:11,padding:"4px 10px",borderRadius:20,border:`1.5px solid ${t===tab?"#6366f1":bd2}`,background:t===tab?"#6366f1":"transparent",color:t===tab?"#fff":mu(D),cursor:"pointer",fontWeight:t===tab?600:400}}>
            {lbl}
          </button>
        ))}
      </div>

      {tab==="lb"&&(
        lb.length<=1
          ?<p style={{fontSize:12,color:mu(D),fontStyle:"italic",padding:"4px 0"}}>Add friends to see your friends leaderboard!</p>
          :<div style={{display:"flex",flexDirection:"column",gap:4,maxHeight:320,overflowY:"auto"}}>
            {lb.map((e,i)=>{
              const isMe=e.u===user;
              const medal=i===0?"🥇":i===1?"🥈":i===2?"🥉":null;
              const name=lbMap[e.u]?.displayName||e.u||"";
              return (
                <div key={e.u} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",borderRadius:8,background:isMe?(D?"rgba(99,102,241,.2)":"#eef2ff"):(D?"#1f2937":"#f9fafb"),border:isMe?"1.5px solid #6366f1":"1.5px solid transparent"}}>
                  <span style={{fontSize:12,width:20,textAlign:"center"}}>{medal||<span style={{fontSize:10,color:mu(D)}}>{i+1}</span>}</span>
                  <span style={{flex:1,fontSize:12,fontWeight:isMe?700:400,color:isMe?"#6366f1":tx(D)}}>{name}{isMe?" (you)":""}</span>
                  {e.school&&<span style={{fontSize:10,color:mu(D),overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:80}}>{e.school}</span>}
                  <span style={{fontSize:11,fontWeight:600,color:mu(D),flexShrink:0}}>{e.score} pts</span>
                </div>
              );
            })}
          </div>
      )}

      {tab==="add"&&(
        <div>
          <p style={{fontSize:12,color:mu(D),marginBottom:8}}>Find a friend by their exact username:</p>
          <div style={{display:"flex",gap:8}}>
            <input style={{...I(D,{flex:1})}} placeholder="Username…" value={search} onChange={e=>{setSearch(e.target.value);setMsg("");}} onKeyDown={e=>e.key==="Enter"&&sendReq()}/>
            <button onClick={sendReq} disabled={busy||!search.trim()} style={{...B("#6366f1",false,{padding:"8px 14px",fontSize:12,opacity:busy||!search.trim()?0.4:1,cursor:busy||!search.trim()?"not-allowed":"pointer"})}}>{busy?"…":"Add"}</button>
          </div>
          {msg&&<p style={{fontSize:11,marginTop:5,color:msg.startsWith("✓")?"#16a34a":"#ef4444"}}>{msg}</p>}
          {fd.friends.length>0&&(
            <div style={{marginTop:12}}>
              <p style={{fontSize:11,fontWeight:600,color:mu(D),textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:6}}>Your friends</p>
              {fd.friends.map(fr=>(
                <div key={fr} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0",borderBottom:`1px solid ${bd2}`}}>
                  <span style={{flex:1,fontSize:12,color:tx(D)}}>{fr}</span>
                  <button onClick={()=>removeFriend(fr)} style={{fontSize:10,color:"#ef4444",background:"none",border:"none",cursor:"pointer"}}>Remove</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab==="req"&&(
        <div>
          {!fd.incoming.length&&<p style={{fontSize:12,color:mu(D),fontStyle:"italic"}}>No pending friend requests.</p>}
          {fd.incoming.map(req=>(
            <div key={req} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:8,background:D?"#1f2937":"#f9fafb",marginBottom:6}}>
              <span style={{flex:1,fontSize:13,fontWeight:600,color:tx(D)}}>{req}</span>
              <button onClick={()=>acceptReq(req)} style={{...B("#16a34a",false,{fontSize:11,padding:"4px 10px"})}}>✓ Accept</button>
              <button onClick={()=>declineReq(req)} style={{...B("#ef4444",true,{fontSize:11,padding:"4px 10px"})}}>✕</button>
            </div>
          ))}
          {fd.sent.length>0&&<p style={{fontSize:11,color:mu(D),marginTop:8}}>Sent: {fd.sent.join(", ")}</p>}
          <button onClick={loadFD} style={{marginTop:8,fontSize:11,color:mu(D),background:"none",border:"none",cursor:"pointer"}}>↺ Refresh</button>
        </div>
      )}
    </div>
  );
}

function useMathReady() {
  const [ready, setReady] = useState(typeof window.katex !== "undefined");
  useEffect(() => { if (!ready) window.__onKatexReady(() => setReady(true)); }, []);
  return ready;
}
function renderMath(src, display=false) {
  if (typeof window.katex === "undefined")
    return <code style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:12,background:"rgba(99,102,241,.12)",padding:"1px 5px",borderRadius:4}}>{src}</code>;
  try { return <span dangerouslySetInnerHTML={{__html:window.katex.renderToString(src,{throwOnError:false,displayMode:display})}}/>; }
  catch(e){ return <code style={{fontFamily:"monospace",fontSize:12}}>{src}</code>; }
}
function parseLatex(s, mathReady) {
  if (!s) return "";
  // Normalise backslash-bracket math notation (e.g. from Llama) into $$ / $
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

function ContentBlock({content, D, style={}, fontSize=13}) {
  const mathReady = useMathReady();
  const isHtml = (content||"").trimStart().startsWith("<");
  if (isHtml) return <div className="rich-display" dangerouslySetInnerHTML={{__html:content||""}} style={{fontSize,lineHeight:1.75,color:tx(D),...style}}/>;
  const parsed = parseLatex(content||"", mathReady);
  return <p style={{fontSize,lineHeight:1.75,color:tx(D),whiteSpace:"pre-line",...style}}>{parsed}</p>;
}

function RichEditor({value, onChange, D, placeholder, minHeight=110}) {
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
      <div style={{display:"flex",gap:2,padding:"5px 8px",background:D?"#1f2937":"#f3f4f6",borderBottom:`1px solid ${brd}`,flexWrap:"wrap",alignItems:"center"}}>
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
        style={{padding:"12px 14px",background:D?"#1f2937":"#fff",color:tx(D),minHeight,outline:"none",lineHeight:1.75,fontSize:13}}/>
    </div>
  );
}

function MD({text, D}) {
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
    if(l.startsWith("# ")){out.push(<h1 key={i} style={{fontSize:18,fontWeight:800,color:D?"#f9fafb":"#111827",margin:"18px 0 8px"}}>{pb(l.slice(2))}</h1>);return;}
    if(l.startsWith("• ")||l.startsWith("- ")){const txt=l.startsWith("• ")?l.slice(2):l.slice(2);out.push(<div key={i} style={{display:"flex",gap:8,fontSize:13,lineHeight:1.7,marginBottom:2,color:D?"#d1d5db":"#374151"}}><span style={{marginTop:7,width:4,height:4,borderRadius:"50%",background:"currentColor",flexShrink:0,opacity:0.5}}/><span>{pb(txt)}</span></div>);return;}
    if(l.startsWith("⚠️")){out.push(<div key={i} style={{margin:"8px 0",padding:"10px 14px",borderRadius:8,border:`1px solid ${D?"#92400e":"#fde68a"}`,background:D?"rgba(120,53,15,.25)":"#fffbeb",fontSize:13,color:D?"#fcd34d":"#92400e"}}>{pb(l)}</div>);return;}
    if(l.match(/^\d+\.\s/)){out.push(<div key={i} style={{display:"flex",gap:8,fontSize:13,lineHeight:1.7,marginBottom:2,color:D?"#d1d5db":"#374151"}}><span style={{flexShrink:0,fontFamily:"monospace",fontSize:11,marginTop:2,color:D?"#9ca3af":"#6b7280"}}>{l.match(/^\d+/)[0]}.</span><span>{pb(l.replace(/^\d+\.\s*/,""))}</span></div>);return;}
    out.push(<p key={i} style={{fontSize:13,lineHeight:1.75,marginBottom:4,color:D?"#d1d5db":"#374151"}}>{pb(l)}</p>);
  }); flush();
  return <>{out}</>;
}

const C  = D => ({background:D?"#111827":"#fff", border:`1px solid ${D?"#1f2937":"#e5e7eb"}`, borderRadius:14});
const I  = (D,x={}) => ({width:"100%",background:D?"#1f2937":"#fff",border:`1.5px solid ${D?"#374151":"#d1d5db"}`,borderRadius:10,padding:"10px 14px",fontSize:13,outline:"none",color:D?"#f9fafb":"#111827",...x});
const B  = (color,outline,extra={}) => ({padding:"9px 16px",borderRadius:10,border:outline?`1.5px solid ${color}`:"none",background:outline?"transparent":color,color:outline?color:"#fff",cursor:"pointer",fontSize:13,fontWeight:600,...extra});
const mu = D => D?"#6b7280":"#9ca3af";
const tx = D => D?"#f9fafb":"#111827";
const uid = () => Math.random().toString(36).slice(2,9);
const stripHtml = s => (s||"").replace(/<[^>]*>/g,"").trim();
const GRADES = ["U","1","2","3","4","5","6","7","8","9"];
const pctToGrade = pct => pct>=90?"9":pct>=80?"8":pct>=70?"7":pct>=60?"6":pct>=50?"5":pct>=40?"4":pct>=30?"3":pct>=20?"2":pct>=10?"1":"U";
const gradeColor = g => ({9:"#7c3aed",8:"#2563eb",7:"#0891b2",6:"#16a34a",5:"#65a30d",4:"#ca8a04",3:"#d97706",2:"#ea580c",1:"#dc2626",U:"#9ca3af"})[g]||"#9ca3af";

const ANN_COLORS = ["#ef4444","#3b82f6","#16a34a","#f59e0b","#ffffff","#111827"];
const ANN_TOOLS  = [{id:"label",icon:"🏷",tip:"Label"},{id:"arrow",icon:"↗",tip:"Arrow"},{id:"text",icon:"T",tip:"Text"}];

function ImageAnnotator({value, onChange, D}) {
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

function ImagePanel({images=[], onChange, D}) {
  const [annotatingIdx,setAI]=useState(null);
  const fileRef=useRef(null);
  const addImage=e=>{Array.from(e.target.files||[]).forEach(file=>{const r=new FileReader();r.onload=ev=>onChange([...images,{image:ev.target.result,annotations:[]}]);r.readAsDataURL(file);});e.target.value="";};
  const removeImage=i=>onChange(images.filter((_,idx)=>idx!==i));
  const updateImage=(i,v)=>onChange(images.map((img,idx)=>idx===i?v:img));
  return (
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
        <span style={{fontSize:12,fontWeight:600,color:mu(D)}}>Images &amp; Diagrams</span>
        <button onClick={()=>fileRef.current?.click()} style={{...B("#6366f1",true,{fontSize:11,padding:"4px 10px"})}}>＋ Upload</button>
        <input ref={fileRef} type="file" accept="image/*" multiple style={{display:"none"}} onChange={addImage}/>
      </div>
      {images.length===0&&<p style={{fontSize:12,color:mu(D),fontStyle:"italic"}}>No images. Upload diagrams to annotate.</p>}
      {images.map((img,i)=>(
        <div key={i} style={{...C(D),padding:14,marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <span style={{fontSize:12,fontWeight:600,color:tx(D)}}>Image {i+1}</span>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setAI(annotatingIdx===i?null:i)} style={{...B("#6366f1",true,{fontSize:11,padding:"4px 10px"})}}>{annotatingIdx===i?"✓ Done":"✏️ Annotate"}</button>
              <button onClick={()=>removeImage(i)} style={{...B("#ef4444",true,{fontSize:11,padding:"4px 10px"})}}>Remove</button>
            </div>
          </div>
          {annotatingIdx===i
            ?<ImageAnnotator value={img} onChange={v=>updateImage(i,v)} D={D}/>
            :<div style={{position:"relative",display:"inline-block",width:"100%"}}>
              <img src={img.image} alt="" style={{width:"100%",borderRadius:8,display:"block"}}/>
              {(img.annotations||[]).length>0&&<div style={{position:"absolute",bottom:6,right:6,background:"rgba(0,0,0,.6)",color:"#fff",fontSize:10,padding:"2px 8px",borderRadius:10}}>{img.annotations.length} annotation{img.annotations.length!==1?"s":""}</div>}
            </div>}
        </div>
      ))}
    </div>
  );
}

function AnnotatedImage({img, D}) {
  if (!img?.image) return null;
  const anns=img.annotations||[];
  return (
    <div style={{position:"relative",display:"inline-block",width:"100%",marginBottom:10}}>
      <img src={img.image} alt="" style={{width:"100%",borderRadius:8,display:"block"}}/>
      <svg style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",pointerEvents:"none",overflow:"visible"}}>
        <defs>{ANN_COLORS.map(c=><marker key={c} id={`ro-ah-${c.slice(1)}`} markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill={c}/></marker>)}</defs>
        {anns.filter(a=>a.type==="arrow").map(a=><line key={a.id} x1={`${a.x}%`} y1={`${a.y}%`} x2={`${a.x2}%`} y2={`${a.y2}%`} stroke={a.color} strokeWidth="2.5" markerEnd={`url(#ro-ah-${a.color.slice(1)})`}/>)}
      </svg>
      {anns.filter(a=>a.type!=="arrow").map(a=>(
        <div key={a.id} style={{position:"absolute",left:`${a.x}%`,top:`${a.y}%`,transform:"translate(-4px,-4px)",pointerEvents:"none"}}>
          <div style={{background:a.color,color:a.color==="#ffffff"||a.color==="#f59e0b"?"#111":"#fff",borderRadius:4,padding:"3px 8px",fontSize:11,fontWeight:700,whiteSpace:"nowrap",boxShadow:"0 1px 4px rgba(0,0,0,.4)"}}>{a.text}</div>
        </div>
      ))}
    </div>
  );
}

function CreateModal({mode, D, subjects, onClose, onSave, initialItem}) {
  const isEdit=!!initialItem;
  const def={title:"",subjectId:subjects[0]?.id||"",topicId:"",heading:"",body:"",q:"",a:"",type:"mcq",text:"",marks:1,options:["","","",""],answer:0,explanation:"",markScheme:"",sampleAnswer:"",year:"",images:[]};
  const [f,setF]=useState(()=>!initialItem?def:{...def,...initialItem,options:initialItem.options||["","","",""],images:initialItem.images||[],marks:initialItem.marks??1});
  const set=(k,v)=>setF(p=>({...p,[k]:v}));
  const valid=()=>{
    if(mode==="section")   return f.title.trim()&&f.subjectId;
    if(mode==="subtopic")  return f.title.trim();
    if(mode==="note")      return f.heading.trim()&&stripHtml(f.body);
    if(mode==="flashcard") return stripHtml(f.q)&&stripHtml(f.a);
    if(mode==="question")  return stripHtml(f.text)&&f.marks>0&&(f.type!=="mcq"||f.options.every(o=>o.trim()));
    if(mode==="paper")     return f.year.trim()&&(f.paperUrl?.trim()||f.markSchemeUrl?.trim());
    return false;
  };
  const save=()=>{
    if(!valid())return;
    if(isEdit){
      if(mode==="note")       onSave({...initialItem,heading:f.heading,body:f.body,images:f.images});
      else if(mode==="flashcard") onSave({...initialItem,q:f.q,a:f.a,images:f.images});
      else if(mode==="question"){
        const base={...initialItem,type:f.type,text:f.text,marks:Number(f.marks),year:f.year,images:f.images};
        if(f.type==="mcq") onSave({...base,options:f.options,answer:f.answer,explanation:f.explanation});
        else               onSave({...base,markScheme:f.markScheme,sampleAnswer:f.sampleAnswer});
      }
      return;
    }
    const id=`${mode.slice(0,2)}-${uid()}`;
    if(mode==="section")   onSave({id,src:"admin",subjectId:f.subjectId,topicId:f.topicId,title:f.title,notes:[],flashcards:[],questions:[],subtopics:[]});
    else if(mode==="subtopic") onSave({id,title:f.title,notes:[],flashcards:[],questions:[]});
    else if(mode==="note") onSave({id,heading:f.heading,body:f.body,images:f.images});
    else if(mode==="flashcard") onSave({id,q:f.q,a:f.a,images:f.images});
    else if(mode==="question"){
      const base={id,type:f.type,text:f.text,marks:Number(f.marks),year:f.year,images:f.images};
      if(f.type==="mcq") onSave({...base,options:f.options,answer:f.answer,explanation:f.explanation});
      else               onSave({...base,markScheme:f.markScheme,sampleAnswer:f.sampleAnswer});
    } else if(mode==="paper") onSave({id,year:f.year,title:f.title,paperUrl:f.paperUrl||"",markSchemeUrl:f.markSchemeUrl||"",examinerUrl:f.examinerUrl||""});
  };
  const Lbl=({c})=><label style={{fontSize:11,fontWeight:600,color:mu(D),display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.05em"}}>{c}</label>;
  const Inp=(k,ph)=><input style={I(D)} placeholder={ph} value={f[k]||""} onChange={e=>set(k,e.target.value)}/>;
  const TA=(k,ph,rows=4)=><textarea style={{...I(D,{resize:"vertical"})}} rows={rows} placeholder={ph} value={f[k]||""} onChange={e=>set(k,e.target.value)}/>;
  const Sel=(k,opts,cb)=><select style={I(D)} value={f[k]||""} onChange={e=>{set(k,e.target.value);cb&&cb(e.target.value);}}>{opts.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}</select>;
  const showImages=mode==="note"||mode==="flashcard"||mode==="question";
  const titles={section:isEdit?"Edit Topic":"New Topic",note:isEdit?"Edit Note":"New Note",flashcard:isEdit?"Edit Flashcard":"New Flashcard",question:isEdit?"Edit Question":"New Question",paper:"Add Past Paper",subtopic:isEdit?"Edit Sub-topic":"New Sub-topic"};
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{...C(D),width:"100%",maxWidth:600,maxHeight:"90vh",overflow:"auto",padding:28}} className="slide-up">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
          <h3 style={{fontWeight:700,fontSize:16,color:tx(D)}}>{titles[mode]||mode}</h3>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:mu(D),lineHeight:1}}>×</button>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {mode==="section"&&<>
            <div><Lbl c="Subject"/>{Sel("subjectId",subjects.map(s=>({v:s.id,l:`${s.icon} ${s.name}`})),v=>set("topicId",""))}</div>
            <div><Lbl c="Topic ID (optional)"/>{Inp("topicId","e.g. bio-t1")}</div>
            <div><Lbl c="Topic Title"/>{Inp("title","e.g. Cell Biology")}</div>
          </>}
          {mode==="subtopic"&&<>
            <div><Lbl c="Sub-topic Title"/>{Inp("title","e.g. 4.1.4 Stem Cells")}</div>
          </>}
          {mode==="note"&&<>
            <div><Lbl c="Heading"/>{Inp("heading","e.g. Types of Stem Cells")}</div>
            <div><Lbl c="Content"/><RichEditor value={f.body||""} onChange={v=>set("body",v)} D={D} placeholder="Write revision notes…" minHeight={140}/></div>
          </>}
          {mode==="flashcard"&&<>
            <div><Lbl c="Question"/><RichEditor value={f.q||""} onChange={v=>set("q",v)} D={D} placeholder="Question…" minHeight={100}/></div>
            <div><Lbl c="Answer"/><RichEditor value={f.a||""} onChange={v=>set("a",v)} D={D} placeholder="Answer…" minHeight={100}/></div>
          </>}
          {mode==="question"&&<>
            <div><Lbl c="Type"/>{Sel("type",[{v:"mcq",l:"Multiple Choice"},{v:"short",l:"Short Answer"},{v:"extended",l:"Extended Response"}])}</div>
            <div><Lbl c="Question Text"/><RichEditor value={f.text||""} onChange={v=>set("text",v)} D={D} placeholder="Write the exam question…" minHeight={100}/></div>
            <div style={{display:"flex",gap:12}}>
              <div style={{flex:1}}><Lbl c="Marks"/><input type="number" min={1} max={20} style={{...I(D,{width:90})}} value={f.marks} onChange={e=>set("marks",e.target.value)}/></div>
              <div style={{flex:2}}><Lbl c="Year"/>{Inp("year","e.g. 2023")}</div>
            </div>
            {f.type==="mcq"&&<>
              {["A","B","C","D"].map((ltr,i)=>(
                <div key={i} style={{display:"flex",alignItems:"flex-end",gap:10}}>
                  <div style={{paddingBottom:8,display:"flex",alignItems:"center",gap:6}}>
                    <input type="radio" name="cr" checked={f.answer===i} onChange={()=>set("answer",i)} style={{accentColor:"#6366f1",width:14,height:14}}/>
                    <span style={{fontSize:11,fontFamily:"monospace",color:mu(D)}}>{ltr}</span>
                  </div>
                  <div style={{flex:1}}><input style={I(D)} placeholder={`Option ${ltr}${f.answer===i?" ✓":""}`} value={f.options[i]} onChange={e=>{const o=[...f.options];o[i]=e.target.value;set("options",o);}}/></div>
                </div>
              ))}
              <div><Lbl c="Explanation"/>{TA("explanation","Why is the correct option right?",2)}</div>
            </>}
            {(f.type==="short"||f.type==="extended")&&<>
              <div><Lbl c="Mark Scheme"/><RichEditor value={f.markScheme||""} onChange={v=>set("markScheme",v)} D={D} placeholder="(1) … (2) …" minHeight={100}/></div>
              <div><Lbl c="Model Answer"/><RichEditor value={f.sampleAnswer||""} onChange={v=>set("sampleAnswer",v)} D={D} placeholder="Full model answer…" minHeight={100}/></div>
            </>}
          </>}
          {mode==="paper"&&<>
            <div style={{display:"flex",gap:12}}>
              <div style={{flex:1}}><Lbl c="Year"/>{Inp("year","e.g. 2023")}</div>
              <div style={{flex:2}}><Lbl c="Title"/>{Inp("title","e.g. Paper 1 Higher")}</div>
            </div>
            <div><Lbl c="Past Paper URL"/>{Inp("paperUrl","https://…")}</div>
            <div><Lbl c="Mark Scheme URL"/>{Inp("markSchemeUrl","https://…")}</div>
            <div><Lbl c="Examiner Report URL"/>{Inp("examinerUrl","https://…")}</div>
          </>}
          {showImages&&<div style={{...C(D),padding:14,borderStyle:"dashed"}}><ImagePanel images={f.images} onChange={v=>set("images",v)} D={D}/></div>}
        </div>
        <div style={{display:"flex",gap:10,marginTop:22}}>
          <button onClick={onClose} style={{flex:1,padding:"10px 0",borderRadius:10,border:`1px solid ${D?"#374151":"#d1d5db"}`,background:"transparent",cursor:"pointer",fontSize:13,color:mu(D)}}>Cancel</button>
          <button onClick={save} disabled={!valid()} style={{...B("#6366f1",false,{flex:2,padding:"10px 0",opacity:valid()?1:0.4,cursor:valid()?"pointer":"not-allowed"})}}>{isEdit?`Update ${mode[0].toUpperCase()+mode.slice(1)}`:`Save ${mode[0].toUpperCase()+mode.slice(1)}`}</button>
        </div>
      </div>
    </div>
  );
}

function PastPapersTab({papers=[], onAdd, onDelete, admin, D, accent, board, subjectName}) {
  const bd=D?"#1f2937":"#e5e7eb";
  return (
    <div className="fade-in">
      {admin&&<div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:12,background:D?"#1a1a2e":"#f5f3ff",border:"1.5px solid #6366f1",marginBottom:18}}>
        <span style={{fontSize:11,fontWeight:700,color:"#6366f1"}}>⚡ ADMIN</span>
        <button onClick={onAdd} style={{...B("#6366f1",true,{fontSize:12,padding:"5px 12px"})}}>＋ Add Past Paper</button>
      </div>}
      {papers.length===0
        ?<div style={{...C(D),padding:48,textAlign:"center"}}><p style={{fontSize:28,marginBottom:10}}>📄</p><p style={{fontWeight:700,fontSize:15,marginBottom:4}}>{subjectName} · {board}</p><p style={{fontSize:13,color:mu(D)}}>No past papers added yet.{admin?" Add one above.":""}</p></div>
        :<div style={{...C(D),overflow:"hidden"}}><div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead><tr style={{background:D?"#1f2937":"#f9fafb"}}>{["Year / Paper","Past Paper","Mark Scheme","Examiner Report",...(admin?[""]:[])].map((h,i)=><th key={i} style={{padding:"12px 16px",textAlign:"left",fontWeight:600,color:mu(D),fontSize:11,textTransform:"uppercase",letterSpacing:"0.04em",borderBottom:`1px solid ${bd}`,whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
            <tbody>{papers.map(row=>(
              <tr key={row.id} style={{borderBottom:`1px solid ${bd}`}} onMouseEnter={e=>e.currentTarget.style.background=D?"#1f2937":"#f9fafb"} onMouseLeave={e=>e.currentTarget.style.background=""}>
                <td style={{padding:"12px 16px",fontWeight:600,color:tx(D),whiteSpace:"nowrap"}}>{row.year}{row.title&&<><br/><span style={{fontSize:11,color:mu(D),fontWeight:400}}>{row.title}</span></>}</td>
                {[{url:row.paperUrl,label:"📄 Paper"},{url:row.markSchemeUrl,label:"📋 Mark Scheme"},{url:row.examinerUrl,label:"📝 Report"}].map(({url,label},ci)=>(
                  <td key={ci} style={{padding:"12px 16px"}}>{url?<a href={url} target="_blank" rel="noopener noreferrer" style={{color:accent,textDecoration:"none",fontWeight:600,fontSize:12}}>{label} ↗</a>:<span style={{color:mu(D),fontSize:12}}>—</span>}</td>
                ))}
                {admin&&<td style={{padding:"12px 16px"}}><button onClick={()=>onDelete(row.id)} style={{background:"none",border:"none",cursor:"pointer",fontSize:13,color:"#ef4444",opacity:0.7}}>🗑</button></td>}
              </tr>
            ))}</tbody>
          </table>
        </div></div>}
    </div>
  );
}

/* ─── MASTERY RING ───────────────────────────────────────────────────────── */
function MasteryRing({pct, size, accent}) {
  const r = (size||32)/2 - 4;
  const circ = 2*Math.PI*r;
  const dash = circ*(pct/100);
  return (
    <svg width={size||32} height={size||32} style={{flexShrink:0,transform:"rotate(-90deg)"}}>
      <circle cx={(size||32)/2} cy={(size||32)/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={3}/>
      <circle cx={(size||32)/2} cy={(size||32)/2} r={r} fill="none" stroke={accent||"#10b981"} strokeWidth={3}
        strokeDasharray={circ} strokeDashoffset={circ-dash} strokeLinecap="round"/>
    </svg>
  );
}

/* ─── SR INFO TOOLTIP ────────────────────────────────────────────────────── */
function SRInfoTooltip({D}) {
  const [show,setShow] = React.useState(false);
  return (
    <span style={{position:"relative",display:"inline-block"}}>
      <button onClick={()=>setShow(v=>!v)} style={{background:"none",border:"none",cursor:"pointer",fontSize:12,color:"#6366f1",padding:"0 2px",lineHeight:1}} title="About spaced repetition">ℹ️</button>
      {show&&<div onClick={()=>setShow(false)} style={{position:"fixed",inset:0,zIndex:8000}}/>}
      {show&&<div style={{position:"absolute",bottom:"calc(100% + 6px)",left:"50%",transform:"translateX(-50%)",zIndex:8001,background:D?"#1f2937":"#fff",border:`1px solid ${D?"#374151":"#e5e7eb"}`,borderRadius:10,padding:"12px 14px",width:260,boxShadow:"0 8px 32px rgba(0,0,0,.18)",fontSize:12,lineHeight:1.6,color:D?"#e5e7eb":"#374151"}}>
        <div style={{fontWeight:700,marginBottom:6,color:"#6366f1"}}>⚡ Spaced Repetition</div>
        <p style={{margin:0}}>The <strong>Ebbinghaus forgetting curve</strong> shows memory fades rapidly without review — SR schedules each card just before you forget it, compounding retention with every correct recall.</p>
        <div style={{marginTop:8,fontSize:11,color:D?"#9ca3af":"#6b7280"}}>Rate <em>Again</em> to see it soon · <em>Easy</em> to push it weeks away.</div>
      </div>}
    </span>
  );
}

/* ─── FORECAST BAR ───────────────────────────────────────────────────────── */
function ForecastBar({cards,fcHist,D,accent}) {
  const days = React.useMemo(()=>{
    const arr = [];
    const now = Date.now();
    for(let i=0;i<14;i++){
      const dayStart = now + i*86400000;
      const dayEnd   = dayStart + 86400000;
      const count = cards.filter(c=>{
        const s = getCardState(fcHist,c.id);
        if(!s) return i===0; // unreviewed = due today
        return s.due>=dayStart && s.due<dayEnd;
      }).length;
      const d = new Date(dayStart);
      arr.push({i,label:i===0?"Today":i===1?"Tmrw":d.toLocaleDateString("en-GB",{weekday:"short",day:"numeric"}),count});
    }
    return arr;
  },[cards,fcHist]);
  const max = Math.max(1,...days.map(d=>d.count));
  return (
    <div style={{marginTop:10,padding:"10px 14px",borderRadius:10,background:D?"#111827":"#f9fafb",border:`1px solid ${D?"#1f2937":"#e5e7eb"}`}}>
      <div style={{fontSize:11,fontWeight:600,color:D?"#9ca3af":"#6b7280",marginBottom:8}}>📅 14-day review forecast</div>
      <div style={{display:"flex",gap:4,alignItems:"flex-end",height:40,overflowX:"auto"}}>
        {days.map(({i,label,count})=>(
          <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,minWidth:28,flex:1}}>
            <div style={{fontSize:9,color:count>0?(accent||"#6366f1"):D?"#4b5563":"#d1d5db",fontWeight:count>0?700:400}}>{count||""}</div>
            <div style={{width:"100%",borderRadius:3,background:count>0?(accent||"#6366f1"):D?"#1f2937":"#e5e7eb",height:Math.max(4,Math.round((count/max)*28)),transition:"height .2s",opacity:i===0?1:0.7}}/>
            <div style={{fontSize:8,color:D?"#6b7280":"#9ca3af",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:28,textAlign:"center"}}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── ADMIN IMPORT MODAL ─────────────────────────────────────────────────── */
function ManageAccountsModal({D, accounts, adminUser, onClose, onDelete}) {
  var users = Object.keys(accounts).filter(function(u){ return u!==adminUser; }).sort();
  var bd = D?"#374151":"#e5e7eb";
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:9500,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div onClick={function(e){e.stopPropagation();}} style={{background:D?"#1f2937":"#fff",borderRadius:16,width:500,maxWidth:"96vw",maxHeight:"80vh",display:"flex",flexDirection:"column",boxShadow:"0 30px 80px rgba(0,0,0,.3)"}}>
        <div style={{padding:"18px 22px",borderBottom:"1px solid "+bd,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <h2 style={{fontSize:17,fontWeight:700,margin:0}}>👥 Manage Accounts</h2>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:D?"#9ca3af":"#6b7280"}}>✕</button>
        </div>
        <div style={{padding:"14px 22px",flex:1,overflowY:"auto"}}>
          {users.length===0 && <p style={{color:D?"#9ca3af":"#6b7280",fontSize:13}}>No user accounts yet.</p>}
          {users.map(function(u){ return (
            <div key={u} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",borderRadius:10,border:"1px solid "+bd,marginBottom:8,background:D?"#111827":"#f9fafb"}}>
              <div>
                <div style={{fontWeight:600,fontSize:13,color:D?"#f9fafb":"#111827"}}>{getDisplayName(u)}</div>
                <div style={{fontSize:11,color:D?"#9ca3af":"#6b7280"}}>{u}</div>
              </div>
              <button onClick={function(){if(window.confirm("Delete account for "+u+"? This cannot be undone."))onDelete(u);}}
                style={{padding:"5px 12px",borderRadius:7,border:"1px solid #ef4444",background:"none",color:"#ef4444",fontWeight:600,fontSize:12,cursor:"pointer"}}>
                Delete
              </button>
            </div>
          );})}
        </div>
        <div style={{padding:"12px 22px",borderTop:"1px solid "+bd,textAlign:"right"}}>
          <button onClick={onClose} style={{padding:"8px 20px",borderRadius:10,border:"1px solid "+bd,background:"transparent",color:D?"#e5e7eb":"#374151",cursor:"pointer",fontSize:13}}>Close</button>
        </div>
      </div>
    </div>
  );
}

function ImportModal({D,subjects,onClose,onDone}) {
  const [raw,setRaw] = React.useState("");
  const [status,setStatus] = React.useState(null); // null | "ok" | "err"
  const [msg,setMsg] = React.useState("");
  const [loading,setLoading] = React.useState(false);

  const doImport = async() => {
    setLoading(true); setStatus(null); setMsg("");
    try {
      const data = JSON.parse(raw);
      if(!data||typeof data!=="object"){throw new Error("JSON must be an object");}
      // Support two formats:
      // Format A: { subjects:[{id,board,custom,extras,papers}] }
      // Format B: { id, board, custom, extras, papers }  (single subject)
      const entries = data.subjects ? data.subjects : [data];
      let imported = 0;
      for(const entry of entries){
        const {id,board,custom,extras,papers} = entry;
        if(!id||!board){throw new Error("Each entry needs 'id' and 'board' fields");}
        const subjDef = subjects.find(s=>s.id===id);
        if(!subjDef){throw new Error("Unknown subject id: "+id+". Valid ids: "+subjects.map(s=>s.id).join(", "));}
        // MERGE — never overwrite, only add new items
        if(custom!==undefined){
          let existing=[];
          try{const r=await window.storage.get("gcse:c:"+id+":"+board,true);if(r?.value)existing=JSON.parse(r.value);}catch(_){}
          // Add custom topics whose id isn't already present
          const existingIds=new Set((existing||[]).map(function(c){return c.id;}));
          const merged=(existing||[]).concat((custom||[]).filter(function(c){return !existingIds.has(c.id);}));
          await window.storage.set("gcse:c:"+id+":"+board, JSON.stringify(merged), true);
        }
        if(extras!==undefined){
          let existing={};
          try{const r=await window.storage.get("gcse:e:"+id+":"+board,true);if(r?.value)existing=JSON.parse(r.value);}catch(_){}
          // Merge extras per section: combine arrays, deduplicate by id
          const merged=Object.assign({},existing);
          Object.keys(extras||{}).forEach(function(secId){
            const newItems=extras[secId]||{};
            const ex=existing[secId]||{};
            merged[secId]={};
            ['notes','flashcards','questions'].forEach(function(k){
              const exArr=ex[k]||[];
              const newArr=newItems[k]||[];
              const exIds=new Set(exArr.map(function(x){return x.id;}));
              merged[secId][k]=exArr.concat(newArr.filter(function(x){return !exIds.has(x.id);}));
            });
          });
          await window.storage.set("gcse:e:"+id+":"+board, JSON.stringify(merged), true);
        }
        if(papers!==undefined){
          let existing=[];
          try{const r=await window.storage.get("gcse:p:"+id+":"+board,true);if(r?.value)existing=JSON.parse(r.value);}catch(_){}
          // Add papers whose title+year combo isn't already present
          const exKeys=new Set((existing||[]).map(function(p){return (p.title||"")+(p.year||"");}));
          const merged=(existing||[]).concat((papers||[]).filter(function(p){return !exKeys.has((p.title||"")+(p.year||""));}));
          await window.storage.set("gcse:p:"+id+":"+board, JSON.stringify(merged), true);
        }
        imported++;
      }
      setStatus("ok"); setMsg("✓ Imported "+imported+" subject"+(imported!==1?"s":"")+" successfully. Reload the app to see changes.");
      onDone();
    } catch(e) {
      setStatus("err"); setMsg("Error: "+e.message);
    }
    setLoading(false);
  };

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:9500,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div onClick={e=>e.stopPropagation()} style={{background:D?"#1f2937":"#fff",borderRadius:16,width:600,maxWidth:"96vw",maxHeight:"85vh",display:"flex",flexDirection:"column",boxShadow:"0 30px 80px rgba(0,0,0,.3)"}}>
        <div style={{padding:"18px 22px",borderBottom:`1px solid ${D?"#374151":"#e5e7eb"}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <h2 style={{fontSize:17,fontWeight:700,margin:0}}>📥 Import Revision Data</h2>
            <p style={{fontSize:12,color:D?"#9ca3af":"#6b7280",margin:"4px 0 0"}}>Paste a JSON export below. Will overwrite existing board data for that subject.</p>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:D?"#9ca3af":"#6b7280"}}>✕</button>
        </div>
        <div style={{padding:"16px 22px",flex:1,overflowY:"auto"}}>
          <div style={{marginBottom:10,fontSize:12,color:D?"#9ca3af":"#6b7280",lineHeight:1.6}}>
            <strong>Expected format:</strong>
            <pre style={{marginTop:4,padding:"8px 12px",borderRadius:8,background:D?"#111827":"#f3f4f6",fontSize:11,overflow:"auto"}}>{`{ "id":"maths", "board":"AQA",\n  "custom": [...],  "extras": {...},  "papers": [...] }`}</pre>
            Or wrap multiple subjects: <code>{"{ \"subjects\": [...] }"}</code>
          </div>
          <textarea value={raw} onChange={e=>setRaw(e.target.value)}
            placeholder="Paste JSON here…"
            style={{width:"100%",minHeight:200,borderRadius:10,border:`1px solid ${D?"#374151":"#d1d5db"}`,background:D?"#111827":"#f9fafb",color:D?"#f9fafb":"#111827",padding:"10px 14px",fontSize:12,fontFamily:"monospace",resize:"vertical",boxSizing:"border-box"}}/>
          {status&&<div style={{marginTop:10,padding:"10px 14px",borderRadius:8,background:status==="ok"?"#dcfce7":"#fee2e2",color:status==="ok"?"#15803d":"#b91c1c",fontSize:13}}>{msg}</div>}
        </div>
        <div style={{padding:"14px 22px",borderTop:`1px solid ${D?"#374151":"#e5e7eb"}`,display:"flex",gap:10,justifyContent:"flex-end"}}>
          <button onClick={onClose} style={{padding:"9px 20px",borderRadius:10,border:`1px solid ${D?"#374151":"#d1d5db"}`,background:"transparent",color:D?"#e5e7eb":"#374151",cursor:"pointer",fontSize:13}}>Cancel</button>
          <button onClick={doImport} disabled={!raw.trim()||loading}
            style={{padding:"9px 22px",borderRadius:10,border:"none",background:loading||!raw.trim()?"#a5b4fc":"#6366f1",color:"#fff",cursor:loading||!raw.trim()?"not-allowed":"pointer",fontSize:13,fontWeight:600}}>
            {loading?"Importing…":"Import"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── OFFLINE BANNER ─────────────────────────────────────────────────────── */
function OfflineBanner() {
  return (
    <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:9999,background:"#1f2937",color:"#fff",textAlign:"center",fontSize:12,padding:"8px",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
      <span>📵</span><span>You are offline — AI features won't work until you reconnect.</span>
    </div>
  );
}

/* ─── SHORTCUT MODAL ─────────────────────────────────────────────────────── */
function ShortcutModal({D,onClose}) {
  const shortcuts = [
    ["Flashcard screen",""],
    ["F","Flip flashcard"],
    ["N / →","Next flashcard"],
    ["P / ←","Previous flashcard"],
    ["1","Again (forgot)"],
    ["2","Hard"],
    ["3","Good"],
    ["4","Easy"],
    ["Questions screen",""],
    ["N / →","Next question"],
    ["P / ←","Previous question"],
    ["Global",""],
    ["Cmd+K","Open search"],
    ["?","Toggle this panel"],
  ];
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:9000,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:D?"#1f2937":"#fff",borderRadius:16,padding:28,width:320,maxWidth:"90vw",boxShadow:"0 25px 60px rgba(0,0,0,.25)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
          <h3 style={{fontWeight:700,fontSize:16,color:D?"#f9fafb":"#111827"}}>⌨️ Keyboard Shortcuts</h3>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",fontSize:18,color:D?"#9ca3af":"#6b7280"}}>×</button>
        </div>
        {shortcuts.map(([key,desc],i)=>!desc?(
          <div key={i} style={{fontSize:10,fontWeight:700,letterSpacing:"0.08em",color:"#6366f1",textTransform:"uppercase",marginTop:i>0?14:0,marginBottom:4}}>{key}</div>
        ):(
          <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:`1px solid ${D?"#374151":"#f3f4f6"}`}}>
            <kbd style={{background:D?"#374151":"#f3f4f6",padding:"2px 8px",borderRadius:6,fontSize:12,fontFamily:"monospace",color:D?"#f9fafb":"#1f2937",minWidth:28,textAlign:"center"}}>{key}</kbd>
            <span style={{fontSize:13,color:D?"#d1d5db":"#374151"}}>{desc}</span>
          </div>
        ))}
        <p style={{fontSize:11,color:D?"#6b7280":"#9ca3af",marginTop:14,textAlign:"center"}}>Press ? to close</p>
      </div>
    </div>
  );
}

/* ─── GLOBAL SEARCH MODAL ────────────────────────────────────────────────── */
function SearchModal({D,subjects,allSections,boardData,boardSels,onNavigate,onClose}) {
  const [q,setQ] = React.useState("");
  const inputRef = React.useRef(null);
  React.useEffect(()=>{setTimeout(()=>inputRef.current&&inputRef.current.focus(),50);},[]);

  const results = React.useMemo(()=>{
    const query = q.trim().toLowerCase();
    if(!query) return [];
    const hits = [];
    allSections.forEach(sec=>{
      const subj = subjects.find(s=>s.id===sec.subjectId);
      if(!subj) return;
      const sub = subj.name+" › "+sec.title;
      if(sec.title&&sec.title.toLowerCase().includes(query)){
        hits.push({type:"section",label:sec.title,sub,icon:subj.icon,subj,sec});
      }
      (sec.notes||[]).forEach(n=>{
        if((n.heading||"").toLowerCase().includes(query)||(typeof n.body==="string"&&n.body.toLowerCase().includes(query))){
          hits.push({type:"note",label:n.heading||"Note",sub,icon:"📖",subj,sec});
        }
      });
      (sec.flashcards||[]).forEach(fc=>{
        if((fc.q||"").toLowerCase().includes(query)||(fc.a||"").toLowerCase().includes(query)){
          hits.push({type:"flashcard",label:(fc.q||"").slice(0,60),sub,icon:"🃏",subj,sec,tab:"flashcards"});
        }
      });
      (sec.questions||[]).forEach(qItem=>{
        if((qItem.text||"").toLowerCase().includes(query)){
          hits.push({type:"question",label:(qItem.text||"").slice(0,60),sub,icon:"❓",subj,sec,tab:"questions"});
        }
      });
    });
    return hits.slice(0,12);
  },[q,subjects,allSections]);

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:9000,display:"flex",alignItems:"flex-start",justifyContent:"center",paddingTop:80}}>
      <div onClick={e=>e.stopPropagation()} style={{background:D?"#1f2937":"#fff",borderRadius:14,width:520,maxWidth:"92vw",boxShadow:"0 30px 80px rgba(0,0,0,.3)",overflow:"hidden"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,padding:"14px 16px",borderBottom:`1px solid ${D?"#374151":"#e5e7eb"}`}}>
          <span style={{fontSize:16}}>🔍</span>
          <input ref={inputRef} value={q} onChange={e=>setQ(e.target.value)}
            onKeyDown={e=>{if(e.key==="Escape")onClose();}}
            placeholder="Search notes, flashcards, sections…"
            style={{flex:1,background:"none",border:"none",outline:"none",fontSize:15,color:D?"#f9fafb":"#111827"}}/>
          <span style={{fontSize:11,color:D?"#6b7280":"#9ca3af",background:D?"#374151":"#f3f4f6",padding:"2px 7px",borderRadius:6}}>Esc</span>
        </div>
        {!q&&<div style={{padding:"32px 16px",textAlign:"center",color:D?"#6b7280":"#9ca3af",fontSize:13}}>Start typing to search…</div>}
        {q&&results.length===0&&<div style={{padding:"32px 16px",textAlign:"center",color:D?"#6b7280":"#9ca3af",fontSize:13}}>No results for "{q}"</div>}
        {results.map((r,i)=>(
          <button key={i} onClick={()=>{onNavigate(r);onClose();}}
            style={{display:"flex",alignItems:"flex-start",gap:10,width:"100%",padding:"12px 16px",background:"none",border:"none",cursor:"pointer",textAlign:"left",borderBottom:`1px solid ${D?"#374151":"#f3f4f6"}`,transition:"background .1s"}}
            onMouseEnter={e=>e.currentTarget.style.background=D?"#374151":"#f9fafb"}
            onMouseLeave={e=>e.currentTarget.style.background="none"}>
            <span style={{fontSize:18,flexShrink:0,marginTop:1}}>{r.icon}</span>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:600,color:D?"#f9fafb":"#111827",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.label}</div>
              <div style={{fontSize:11,color:D?"#9ca3af":"#6b7280"}}>{r.sub}</div>
            </div>
            <span style={{fontSize:10,color:"#6366f1",fontWeight:600,background:D?"#312e81":"#eef2ff",padding:"2px 7px",borderRadius:8,flexShrink:0,alignSelf:"center"}}>{r.type}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── MOBILE BOTTOM NAV ──────────────────────────────────────────────────── */
function MobileNav({D,screen,onHome,onMock,onTutor,onTimetable,onDash,onLeaderboards,streak}) {
  const tabs=[
    {id:"home",    icon:"🏠", label:"Home",    fn:onHome},
    {id:"mock",    icon:"📝", label:"Mock",    fn:onMock},
    {id:"tutor",   icon:"🤖", label:"Tutor",   fn:onTutor},
    {id:"dashboard",icon:"📊",label:"Progress",fn:onDash},
    {id:"friends", icon:"🏆", label:"Boards",  fn:onLeaderboards},
  ];
  return (
    <nav style={{position:"fixed",bottom:0,left:0,right:0,height:58,background:D?"#0d1117":"#fff",borderTop:`1px solid ${D?"#1f2937":"#e5e7eb"}`,display:"flex",zIndex:100}}>
      {tabs.map(t=>{
        const active=screen===t.id;
        return (
          <button key={t.id} onClick={t.fn}
            style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2,background:"none",border:"none",cursor:"pointer",color:active?"#6366f1":D?"#6b7280":"#9ca3af",transition:"color .15s"}}>
            <span style={{fontSize:19}}>{t.icon}</span>
            <span style={{fontSize:9,fontWeight:active?700:500}}>{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

/* ─── ONBOARDING WIZARD ──────────────────────────────────────────────────── */
function OnboardingWizard({D,onComplete}) {
  const [step,setStep] = React.useState(1);
  const [board,setBoard] = React.useState("AQA");
  const [examDate,setExamDate] = React.useState("");

  const boardOpts = ["AQA","Edexcel","Eduqas","OCR","WJEC"];

  if(step===1) return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.65)",zIndex:8000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:D?"#1f2937":"#fff",borderRadius:20,padding:32,width:400,maxWidth:"100%",textAlign:"center"}}>
        <div style={{fontSize:40,marginBottom:12}}>🎓</div>
        <h2 style={{fontSize:20,fontWeight:700,marginBottom:6,color:D?"#f9fafb":"#111827"}}>Welcome to ReviseIQ!</h2>
        <p style={{fontSize:14,color:D?"#9ca3af":"#6b7280",marginBottom:24}}>Let's set you up in 2 quick steps.</p>
        <p style={{fontSize:13,fontWeight:600,color:D?"#f9fafb":"#374151",marginBottom:10}}>Step 1 of 2: Which exam board do you mainly use?</p>
        <div style={{display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center",marginBottom:24}}>
          {boardOpts.map(b=>(
            <button key={b} onClick={()=>setBoard(b)}
              style={{padding:"10px 18px",borderRadius:10,border:`2px solid ${b===board?"#6366f1":"#e5e7eb"}`,background:b===board?"#6366f1":"transparent",color:b===board?"#fff":D?"#d1d5db":"#374151",fontWeight:600,fontSize:14,cursor:"pointer"}}>
              {b}
            </button>
          ))}
        </div>
        <button onClick={()=>setStep(2)} style={{background:"#6366f1",color:"#fff",border:"none",borderRadius:12,padding:"12px 32px",fontSize:15,fontWeight:700,cursor:"pointer",width:"100%"}}>
          Continue →
        </button>
      </div>
    </div>
  );

  if(step===2) return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.65)",zIndex:8000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:D?"#1f2937":"#fff",borderRadius:20,padding:32,width:400,maxWidth:"100%",textAlign:"center"}}>
        <div style={{fontSize:40,marginBottom:12}}>📅</div>
        <h2 style={{fontSize:20,fontWeight:700,marginBottom:6,color:D?"#f9fafb":"#111827"}}>When are your exams?</h2>
        <p style={{fontSize:14,color:D?"#9ca3af":"#6b7280",marginBottom:24}}>Step 2 of 2: Add your main exam date (optional — you can skip this).</p>
        <input type="date" value={examDate} onChange={e=>setExamDate(e.target.value)}
          style={{width:"100%",padding:"12px 14px",borderRadius:10,border:`1.5px solid ${D?"#374151":"#e5e7eb"}`,background:D?"#374151":"#f9fafb",color:D?"#f9fafb":"#111827",fontSize:14,marginBottom:20,outline:"none"}}/>
        <div style={{display:"flex",gap:10}}>
          <button onClick={()=>onComplete(board,null)} style={{flex:1,background:"none",color:"#6b7280",border:`1.5px solid ${D?"#374151":"#e5e7eb"}`,borderRadius:12,padding:"12px",fontSize:14,cursor:"pointer"}}>
            Skip
          </button>
          <button onClick={()=>onComplete(board,examDate||null)} style={{flex:2,background:"#6366f1",color:"#fff",border:"none",borderRadius:12,padding:"12px",fontSize:14,fontWeight:700,cursor:"pointer"}}>
            Get Started! 🚀
          </button>
        </div>
      </div>
    </div>
  );

  return null;
}


function Header({user,userDisplayName,D,onDark,onHome,onDash,onTarget,onTimetable,onBlurt,onMock,onTutor,onCoach,onLeaderboards,streak,onSearch,globalOverlays,screen}) {
  const [menuOpen,setMenuOpen] = React.useState(false);
  const isMobile = typeof window!=="undefined" && window.innerWidth<640;
  const navItems = [
    {id:"timetable", icon:"📅", label:"Timetable",  fn:onTimetable},
    {id:"blurting",  icon:"🧠", label:"Blurting",   fn:onBlurt},
    {id:"mock",      icon:"📝", label:"Mock Exam",  fn:onMock},
    {id:"tutor",     icon:"🤖", label:"AI Tutor",   fn:onTutor},
    {id:"coach",     icon:"✍️",  label:"Exam Coach", fn:onCoach},
    {id:"target",    icon:"🎯", label:"Target",     fn:onTarget},
    {id:"dashboard", icon:"📊", label:"Progress",   fn:onDash},
    {id:"friends",   icon:"🏆", label:"Leaderboards",fn:onLeaderboards},
  ];
  const displayName = userDisplayName || getDisplayName(user);
  return (
    <header style={{background:D?"#0d1117":"#fff",borderBottom:`1px solid ${D?"#1f2937":"#e5e7eb"}`,position:"sticky",top:0,zIndex:50}}>
      <div style={{maxWidth:1100,margin:"0 auto",padding:"0 16px",height:54,display:"flex",alignItems:"center",gap:8}}>
        {/* Logo */}
        <button onClick={onHome} style={{fontWeight:800,fontSize:15,background:"none",border:"none",cursor:"pointer",color:tx(D),flexShrink:0,letterSpacing:"-0.01em",paddingRight:8}}>🎓 ReviseIQ</button>

        {/* Search */}
        <button onClick={onSearch} style={{background:D?"#1f2937":"#f3f4f6",border:`1px solid ${D?"#374151":"#e5e7eb"}`,borderRadius:8,padding:"5px 10px",fontSize:12,color:mu(D),cursor:"pointer",display:"flex",alignItems:"center",gap:6,flexShrink:0,transition:"background .15s"}}>
          <span style={{fontSize:13}}>🔍</span>
          {!isMobile&&<span style={{color:D?"#9ca3af":"#6b7280"}}>Search</span>}
          {!isMobile&&<kbd style={{fontSize:10,background:D?"#374151":"#e5e7eb",color:D?"#9ca3af":"#6b7280",padding:"1px 6px",borderRadius:4,fontFamily:"inherit"}}>Ctrl+K</kbd>}
        </button>

        {/* Streak pill */}
        {streak>0&&(
          <div style={{display:"flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:20,background:streak>=7?(D?"#431407":"#fff7ed"):(D?"#1c1917":"#f9fafb"),border:`1.5px solid ${streak>=7?"#f97316":"#d1d5db"}`,flexShrink:0}}>
            <span style={{fontSize:13}}>🔥</span>
            <span style={{fontSize:12,fontWeight:700,color:streak>=7?"#f97316":mu(D)}}>{streak}d</span>
          </div>
        )}

        {/* Desktop nav */}
        {!isMobile&&<nav style={{display:"flex",alignItems:"center",gap:1,flex:1,overflowX:"auto",scrollbarWidth:"none"}}>
          {navItems.map(function(item){
            var active=screen===item.id;
            return (
              <button key={item.id} onClick={item.fn}
                style={{fontSize:12,padding:"6px 9px",background:active?(D?"rgba(99,102,241,.15)":"#eef2ff"):"none",border:"none",borderRadius:7,cursor:"pointer",color:active?"#6366f1":mu(D),whiteSpace:"nowrap",fontWeight:active?600:400,transition:"all .12s",flexShrink:0}}>
                {item.icon} {item.label}
              </button>
            );
          })}
        </nav>}

        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
          {/* Dark mode */}
          <button onClick={onDark} style={{fontSize:15,background:"none",border:"none",cursor:"pointer",color:mu(D),padding:"4px",borderRadius:6}}>{D?"☀️":"🌙"}</button>
          {/* User chip */}
          <div style={{display:"flex",alignItems:"center",gap:6,padding:"4px 10px",borderRadius:20,background:D?"#1f2937":"#f3f4f6",border:`1px solid ${D?"#374151":"#e5e7eb"}`}}>
            <span style={{fontSize:12,fontWeight:600,color:tx(D),maxWidth:isMobile?80:140,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{displayName}</span>
            {isAdmin(user)&&<span style={{fontSize:9,fontWeight:700,background:"#6366f1",color:"#fff",padding:"1px 6px",borderRadius:10,letterSpacing:"0.04em"}}>ADMIN</span>}
          </div>
          {/* Mobile hamburger */}
          {isMobile&&<button onClick={function(){setMenuOpen(function(o){return !o;})}} style={{fontSize:16,background:"none",border:"none",cursor:"pointer",color:mu(D),padding:"4px"}}>☰</button>}
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {isMobile&&menuOpen&&(
        <div style={{position:"absolute",top:54,left:0,right:0,background:D?"#111827":"#fff",borderBottom:`1px solid ${D?"#1f2937":"#e5e7eb"}`,zIndex:49,padding:"8px 12px",display:"flex",flexWrap:"wrap",gap:4}}>
          {navItems.map(function(item){return (
            <button key={item.id} onClick={function(){item.fn();setMenuOpen(false);}}
              style={{fontSize:12,padding:"7px 12px",background:D?"#1f2937":"#f3f4f6",border:"none",borderRadius:8,cursor:"pointer",color:mu(D),whiteSpace:"nowrap"}}>
              {item.icon} {item.label}
            </button>
          );})}
        </div>
      )}
    {globalOverlays}
    </header>
  );
}

function AdminBar({D, actions}) {
  return (
    <div style={{display:"flex",gap:8,padding:"8px 12px",borderRadius:10,background:D?"rgba(99,102,241,.12)":"#eef2ff",border:"1.5px solid #6366f1",marginBottom:16,alignItems:"center",flexWrap:"wrap"}}>
      <span style={{fontSize:10,fontWeight:800,color:"#6366f1",letterSpacing:"0.08em",textTransform:"uppercase",marginRight:4}}>⚡ Admin</span>
      {actions.map(function(a,i){return (
        <button key={i} onClick={a.fn}
          style={{fontSize:12,padding:"5px 14px",borderRadius:7,border:"1.5px solid #6366f1",background:"#6366f1",color:"#fff",cursor:"pointer",fontWeight:600,whiteSpace:"nowrap",transition:"opacity .15s"}}
          onMouseEnter={function(e){e.currentTarget.style.opacity="0.85";}}
          onMouseLeave={function(e){e.currentTarget.style.opacity="1";}}>
          {a.label}
        </button>
      );})}
    </div>
  );
}

function SM2Dots({cards, fcHist, current}) {
  return (
    <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
      {cards.map((c,i)=>{
        const s=getCardState(fcHist,c.id);
        let bg="#d1d5db";
        if(i===current) bg="#6366f1";
        else if(s){ if(s.lastQ===0) bg="#ef4444"; else if(isCardDue(fcHist,c.id)) bg="#f59e0b"; else bg="#10b981"; }
        return <div key={c.id} style={{width:7,height:7,borderRadius:"50%",background:bg,transition:"background .3s"}}/>;
      })}
    </div>
  );
}

function BlurtingScreen({D,subjects,allSections,initSubjId,initSecId,onBack}) {
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
    <div style={{minHeight:"100vh",background:D?"#030712":"#f9fafb",color:tx(D)}} className="fade-in">
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
          {bSec&&sec&&!(sec.notes||[]).length&&<div style={{padding:"9px 13px",borderRadius:9,background:D?"#1f2937":"#fffbeb",border:`1px solid ${D?"#374151":"#fde68a"}`,fontSize:12,color:D?"#fcd34d":"#92400e"}}>⚠️ No notes in this section — AI will still assess your recall but with less accuracy.</div>}
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
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            {res.remembered?.length>0&&<div style={{...C(D),padding:16}}>
              <p style={{fontWeight:700,color:"#16a34a",marginBottom:10,fontSize:13}}>✓ Remembered ({res.remembered.length})</p>
              {res.remembered.map((p,i)=><div key={i} style={{fontSize:12,lineHeight:1.6,padding:"3px 0",borderBottom:`1px solid ${D?"#1f2937":"#f3f4f6"}`,color:tx(D)}}>{p}</div>)}
            </div>}
            {res.missed?.length>0&&<div style={{...C(D),padding:16}}>
              <p style={{fontWeight:700,color:"#ef4444",marginBottom:10,fontSize:13}}>✗ Missed ({res.missed.length})</p>
              {res.missed.map((p,i)=><div key={i} style={{fontSize:12,lineHeight:1.6,padding:"3px 0",borderBottom:`1px solid ${D?"#1f2937":"#f3f4f6"}`,color:tx(D)}}>{p}</div>)}
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

const ACT_DEFS = {
  flashcards:{ icon:"🃏", label:"SM-2 Flashcard Review", navTab:"flashcards", tip:"Spaced repetition (Ebbinghaus, 1885; Cepeda et al., 2006) is the single most efficient revision method.", goal:"Review all due flashcards using the SM-2 Again/Hard/Good/Easy buttons" },
  blurting:  { icon:"🧠", label:"Blurting Exercise", navTab:null, tip:"Free recall forces retrieval and reveals knowledge gaps more effectively than passive re-reading (Karpicke & Roediger, 2008).", goal:"Open the Blurting tool, write everything you know from memory, then review what you missed" },
  questions: { icon:"✏️", label:"Exam Practice Questions", navTab:"questions", tip:"Practice testing improves long-term retention by up to 50% compared to re-reading (Roediger & Karpicke, 2006).", goal:"Attempt all questions without looking at notes, then review mark schemes for missed points" },
  notes:     { icon:"📖", label:"Active Note Review", navTab:"notes", tip:"Passive re-reading has negligible effect on retention. Instead: pause after each heading, cover the notes, and recite key points aloud.", goal:"Read each section of notes, then cover and recite at least 3 key points per heading from memory" },
  target:    { icon:"🎯", label:"Target Test", navTab:null, tip:"Interleaved practice produces superior long-term retention vs. blocked revision (Taylor & Rohrer, 2010).", goal:"Complete a Target Test session focusing on your weakest areas for this subject" },
};

function TimetableScreen({D, subjects, allSections, user, stats, onNav, onBack}) {
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
  const saveRef=useRef(null);
  const Lbl=t=><label style={{fontSize:11,fontWeight:600,color:mu(D),display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.05em"}}>{t}</label>;
  const bd2=D?"#1f2937":"#e5e7eb";
  const today=new Date().toISOString().slice(0,10);
  const secList=allSections.filter(s=>s.subjectId===eSubj);

  useEffect(()=>{
    (async()=>{
      try{
        const r=await window.storage.get(SK.TIMETABLE(user));
        if(r?.value){const d=JSON.parse(r.value);if(d.exams)setExams(d.exams);if(d.sessions)setSessions(d.sessions);if(d.goalMet)setGoalMet(d.goalMet);}
      }catch(_){}
      setLoaded(true);
    })();
  },[]);

  useEffect(()=>{
    if(!loaded)return;
    clearTimeout(saveRef.current);
    saveRef.current=setTimeout(()=>{
      window.storage.set(SK.TIMETABLE(user),JSON.stringify({exams,sessions,goalMet})).catch(()=>{});
    },500);
    return ()=>clearTimeout(saveRef.current);
  },[exams,sessions,goalMet,loaded]);

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

  const generate=()=>{
    if(!exams.length)return;
    const now=new Date();now.setHours(0,0,0,0);
    const WKDY=[["16:00","16:45"],["17:00","17:45"],["18:00","18:45"]];
    const WKND=[["10:00","10:45"],["11:00","11:45"],["14:00","14:45"],["15:00","15:45"]];
    let tidx=0;
    const getSlot=d=>{const s=d.getDay()===0||d.getDay()===6?WKND:WKDY;return s[(tidx++)%s.length];};
    const sorted=[...exams].filter(e=>new Date(e.date+"T00:00:00")>now).sort((a,b)=>a.date.localeCompare(b.date));
    const allSess=[];
    sorted.forEach(exam=>{
      const examDt=new Date(exam.date+"T00:00:00");examDt.setHours(0,0,0,0);
      const daysLeft=Math.round((examDt-now)/86400000);
      if(daysLeft<=0)return;
      const subj=subjects.find(s=>s.id===exam.subjectId);if(!subj)return;
      const pool=exam.sectionId?allSections.filter(s=>s.id===exam.sectionId):allSections.filter(s=>s.subjectId===exam.subjectId);
      const fallback=[{id:null,title:subj.name,flashcards:[],questions:[],notes:[],subjectId:exam.subjectId}];
      const secs=pool.length?pool:fallback;
      const gap=daysLeft<=7?1:daysLeft<=14?2:daysLeft<=30?3:5;
      const dates=[];
      for(let d=0;d<daysLeft&&dates.length<35;d+=gap){const dt=new Date(now);dt.setDate(dt.getDate()+d);dates.push(dt);}
      const db=new Date(examDt);db.setDate(db.getDate()-1);
      if(db>now&&!dates.find(d=>d.toISOString().slice(0,10)===db.toISOString().slice(0,10)))dates.push(db);
      dates.sort((a,b)=>a-b);
      dates.forEach((date,di)=>{
        const sec=secs[di%secs.length];
        const [st,et]=getSlot(date);
        const hasFC=(sec.flashcards||[]).length>0;
        const hasQ=(sec.questions||[]).length>0;
        const hasN=(sec.notes||[]).length>0;
        const isLast=di>=dates.length-2;
        const acts=[];
        if(hasFC)acts.push({...ACT_DEFS.flashcards,navType:"section",sectionId:sec.id,subjectId:exam.subjectId});
        else     acts.push({...ACT_DEFS.blurting,   navType:"blurt",  sectionId:sec.id,subjectId:exam.subjectId});
        if(di%3===0&&hasQ)     acts.push({...ACT_DEFS.questions,navType:"section",sectionId:sec.id,subjectId:exam.subjectId});
        else if(di%3===1)      acts.push({...ACT_DEFS.blurting,  navType:"blurt",  sectionId:sec.id,subjectId:exam.subjectId});
        else if(hasN)          acts.push({...ACT_DEFS.notes,     navType:"section",sectionId:sec.id,subjectId:exam.subjectId});
        else if(hasQ)          acts.push({...ACT_DEFS.questions, navType:"section",sectionId:sec.id,subjectId:exam.subjectId});
        if(isLast)acts.push({...ACT_DEFS.target,navType:"target",subjectId:exam.subjectId,sectionId:null});
        allSess.push({id:`s${uid()}`,examId:exam.id,date:date.toISOString().slice(0,10),startTime:st,endTime:et,subjectId:exam.subjectId,sectionId:sec.id,topicLabel:sec.title,activities:acts});
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
    <div style={{minHeight:"100vh",background:D?"#030712":"#f9fafb",color:tx(D)}} className="fade-in">
      <div style={{maxWidth:900,margin:"0 auto",padding:"32px 24px"}}>
        <button onClick={onBack} style={{fontSize:13,color:mu(D),background:"none",border:"none",cursor:"pointer",marginBottom:20}}>← Back</button>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12,marginBottom:20}}>
          <div><h2 style={{fontSize:22,fontWeight:700,marginBottom:4}}>📅 Revision Timetable</h2>
            <p style={{fontSize:13,color:mu(D)}}>Add your exam dates — we'll build a spaced revision plan.</p></div>
          {totalS>0&&<div style={{fontSize:13,fontWeight:600,color:doneS===totalS?"#16a34a":"#6366f1",padding:"6px 14px",borderRadius:20,background:doneS===totalS?(D?"rgba(22,163,74,0.15)":"#dcfce7"):(D?"rgba(99,102,241,0.15)":"#eef2ff")}}>
            {doneS}/{totalS} sessions done
          </div>}
        </div>

        <div style={{display:"flex",borderBottom:`1px solid ${bd2}`,marginBottom:22,gap:2}}>
          {[["exams","📋 My Exams"],["schedule","📅 Schedule"]].map(([t,lbl])=>(
            <button key={t} onClick={()=>{if(t==="schedule"&&!sessions.length&&exams.length)generate();setTab(t);}}
              style={{padding:"10px 18px",fontSize:13,fontWeight:tab===t?600:400,color:tab===t?"#6366f1":mu(D),background:"none",border:"none",cursor:"pointer",borderBottom:tab===t?"2px solid #6366f1":"2px solid transparent",marginBottom:-1}}>
              {lbl}{t==="schedule"&&exams.length>0&&!sessions.length?<span style={{marginLeft:5,fontSize:10,color:"#f59e0b"}}>⚠ not generated</span>:""}
            </button>
          ))}
        </div>

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
              <button onClick={()=>{generate();setTab("schedule");}}
                style={{...B("#6366f1",false,{marginTop:6,width:"100%",padding:"12px 0",fontSize:14,fontWeight:700})}}>
                Generate Timetable →
              </button>
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
                    <div key={ex.id} style={{display:"flex",alignItems:"center",gap:6,padding:"4px 12px",borderRadius:20,background:D?"#1f2937":"#f3f4f6",border:`1.5px solid ${subj?.accent||"#6366f1"}`}}>
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
                                  <div key={ai} style={{padding:"12px 14px",borderRadius:10,background:D?"#1f2937":"#f9fafb",border:`1.5px solid ${gDone?"#16a34a":(D?"#374151":"#e5e7eb")}`}}>
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
              <div style={{marginTop:8,padding:"11px 16px",borderRadius:12,background:D?"#1f2937":"#f3f4f6",fontSize:12,color:mu(D)}}>
                💡 Sessions are spaced using evidence-based intervals — more frequent as the exam approaches.
              </div>
            </>}
        </div>}
      </div>
    </div>
  );
}

/* ─── MOCK EXAM SCREEN ───────────────────────────────────────────────────────── */
/* ─── MOCK EXAM IMAGE ────────────────────────────────────────────────────────── */
function MockImage({query,D}){
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

// Parse question text — render [IMG: query] tags as MockImage, and format bullet points
function parseQuestionText(text,D,fontSize=14){
  if(!text)return null;
  // Split on [IMG: ...] tags
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


/* ─── MOCK EXAM HELPER COMPONENTS ─────────────────────────────────────────── */
function NumberedExtract({text, D}) {
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
            <span style={{width:32,flexShrink:0,fontSize:10,color:D?"#6b7280":"#9ca3af",userSelect:"none",paddingTop:2,textAlign:"right",paddingRight:8,fontFamily:"monospace"}}>
              {num || ""}
            </span>
            <span style={{flex:1}}>{line || " "}</span>
          </div>
        );
      })}
    </div>
  );
}

function HistoryInterpBlock({text, title, D}) {
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

function GradeBoundaryBar({pct, D}) {
  // Grade boundaries: U<20, 1=20, 2=30, 3=40, 4=50, 5=60, 6=70, 7=78, 8=86, 9=94
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

function MockExamScreen({D,subjects,allSections,boardSels,boardData,user,onBack,onMarkActivity}){
  const [phase,setPhase]=useState("setup"); // setup|configure|generating|exam|marking|results
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
  const [tier,setTier]=useState(""); // "" = not yet chosen, "H" = Higher, "F" = Foundation
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
  // For tier-based subjects, tag papers by tier in their spec or filter by tier label
  const spec=["maths","bio","chem","phys"].includes(selSubj)&&tier
    ?_allSpec.filter(p=>!p.tier||p.tier===tier)
    :_allSpec;
  const paper=spec[Math.min(selPaper,spec.length-1)]||_allSpec[0];
  const fmtTime=s=>`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  const pctTime=paper?.d>0?Math.round((timeLeft/(paper.d*60))*100):0;
  const timeCritical=timeLeft>0&&timeLeft<300;
  const bd2=D?"#1f2937":"#e5e7eb";

  useEffect(()=>{
    if(phase!=="exam")return;
    timerRef.current=setInterval(()=>{
      if(paused) return;
      setTL(function(t){
        if(t<=1){clearInterval(timerRef.current);setTimeout(function(){if(doSubmitRef.current)doSubmitRef.current();},50);return 0;}
        if(t===301 && !warn5shown){ setWarn5shown(true); setWarn5modal(true); }
        return t-1;
      });
    },1000);
    return function(){ clearInterval(timerRef.current); };
  },[phase,paused,warn5shown]);

  // Load exam history when viewing results
  useEffect(function(){
    if(phase!=="results") return;
    try{
      var histKey="gcse:exam-hist:"+(user||"anon")+":"+(selSubj||"")+"-"+(selBoard||"")+"-"+selPaper;
      window.storage.get(histKey).then(function(r){
        try{ if(r&&r.value){var h=JSON.parse(r.value);if(Array.isArray(h))setExamHistory(h);} }catch(e){}
      }).catch(function(){});
    }catch(e){}
  },[phase]); // eslint-disable-line

  const prepare=async(cfg=config)=>{
    setPhase("generating");setGE("");
    try{
      const bd3=boardData[`${selSubj}:${selBoard}`]||{custom:[],extras:{},papers:[]};
      const merged=mergeTopics(subj?.topics||[],bd3.custom,bd3.extras);

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

      // Standard paper: draw from question bank + AI fill
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
          // If we already have some questions, continue with them; otherwise propagate
          if(!picked.length) throw new Error("AI question generation failed: "+genErr.message+". Please check your internet connection and try again.");
          console.warn("AI fill-in failed, using bank questions only:",genErr.message);
        }
      } else if(!picked.length){
        // No questions in bank and no needed specified — generate a generic set
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

  const doSubmit=async()=>{
    clearInterval(timerRef.current);setPhase("marking");
    const fa={...answers};
    const writtenQs=questions.filter(q=>q.type!=="mcq");
    for(const q of writtenQs){
      const a=fa[q.id];
      const ansText=a?.textAns?.trim()||"";
      const hasFile=!!(a?.fileAns);
      if(ansText||hasFile){
        try{const r=await markAnswer(q,ansText||"[student uploaded a handwritten/image answer — please review the uploaded image and mark scheme]");fa[q.id]={...a,result:r};}
        catch(e){fa[q.id]={...a,result:{score:0,feedback:"AI marking unavailable — please self-mark using the mark scheme."}};}
      }else{fa[q.id]={...(a||{}),result:{score:0,feedback:"Not attempted."}};}
    }
    let scored=0,total=0;
    for(const q of questions){
      const m=Number(q.marks)||0;total+=m;
      const a=fa[q.id];
      if(q.type==="mcq"&&a?.selOpt===q.answer)scored+=1;
      else if(a?.result?.score!=null&&!isNaN(Number(a.result.score)))scored+=Number(a.result.score);
    }
    setAnswers(fa);
    var finalPct=total>0?Math.round(scored/total*100):0;
    var finalGrade=pctToGrade(finalPct);
    var finalResults={scored:scored,total:total,pct:finalPct,grade:finalGrade};
    setResults(finalResults);
    // Save exam history (last 5 per paper)
    try{
      var histKey="gcse:exam-hist:"+(user||"anon")+":"+(selSubj||"")+"-"+(selBoard||"")+"-"+selPaper;
      window.storage.get(histKey).then(function(r){
        var hist=[];
        try{ if(r&&r.value) hist=JSON.parse(r.value); }catch(e2){}
        if(!Array.isArray(hist)) hist=[];
        hist.push({date:new Date().toLocaleDateString("en-GB"),scored:scored,total:total,pct:finalPct,grade:finalGrade,paperName:paper&&paper.n});
        if(hist.length>5) hist=hist.slice(hist.length-5);
        window.storage.set(histKey,JSON.stringify(hist));
        setExamHistory(hist);
      }).catch(function(){});
    }catch(histErr){}
    setPhase("results");
  };
  doSubmitRef.current=doSubmit;

  const setAns=(qId,patch)=>setAnswers(p=>({...p,[qId]:{...(p[qId]||{}),...patch}}));
  const answeredCount=questions.length>0?Object.keys(answers).filter(k=>answers[k]?.selOpt!=null||answers[k]?.textAns?.trim()||answers[k]?.fileAns).length:0;

  /* ── SETUP PHASE ── */
  if(phase==="setup")return (
    <div style={{minHeight:"100vh",background:D?"#030712":"#f9fafb"}} className="fade-in">
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
            ?<div style={{padding:"14px 16px",borderRadius:10,background:D?"#1f2937":"#f3f4f6",textAlign:"center",fontSize:13,color:mu(D)}}>🚧 This paper is coming soon to ReviseIQ</div>
            :["maths","bio","chem","phys"].includes(selSubj)&&!tier
              ?<div style={{padding:"12px 14px",borderRadius:10,background:D?"#1f2937":"#f3f4f6",textAlign:"center",fontSize:13,color:mu(D)}}>← Please select a tier above to continue</div>
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

  /* ── CONFIGURE PHASE ── */
  if(phase==="configure")return (
    <div style={{minHeight:"100vh",background:D?"#030712":"#f9fafb"}} className="fade-in">
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

  /* ── GENERATING PHASE ── */
  if(phase==="generating")return (
    <div style={{minHeight:"100vh",background:D?"#030712":"#f9fafb",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{textAlign:"center",padding:40}}>
        <div style={{fontSize:48,marginBottom:16}}>⚙️</div>
        <h3 style={{fontSize:18,fontWeight:700,marginBottom:8,color:tx(D)}}>Generating your mock exam…</h3>
        <p style={{fontSize:13,color:mu(D)}}>ReviseIQ AI is building {paper.n}. This may take up to 30 seconds.</p>
      </div>
    </div>
  );

  /* ── MARKING PHASE ── */
  if(phase==="marking")return (
    <div style={{minHeight:"100vh",background:D?"#030712":"#f9fafb",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{textAlign:"center",padding:40}}>
        <div style={{fontSize:48,marginBottom:16}}>📊</div>
        <h3 style={{fontSize:18,fontWeight:700,marginBottom:8,color:tx(D)}}>Marking your answers…</h3>
        <p style={{fontSize:13,color:mu(D)}}>ReviseIQ AI is evaluating your written responses</p>
      </div>
    </div>
  );

  /* ── RESULTS PHASE ── */
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
    <div style={{minHeight:"100vh",background:D?"#030712":"#f9fafb"}} className="fade-in">
      <div style={{maxWidth:760,margin:"0 auto",padding:"32px 24px"}}>
        <h2 style={{fontSize:22,fontWeight:700,marginBottom:20,color:tx(D)}}>Results</h2>
        <div style={{...C(D),padding:28,textAlign:"center",marginBottom:16,border:"2px solid "+gradeColor(results.grade)}}>
          <div style={{fontSize:64,fontWeight:900,color:gradeColor(results.grade),marginBottom:4,lineHeight:1}}>{results.grade}</div>
          <div style={{fontSize:22,fontWeight:700,marginBottom:6,color:tx(D)}}>{results.scored}/{results.total} marks ({results.pct}%)</div>
          <div style={{fontSize:13,color:mu(D)}}>{subj&&subj.icon} {subj&&subj.name} · {selBoard} · {paper.n}</div>
        </div>

        <GradeBoundaryBar pct={results.pct} D={D}/>

        {/* Exam history chart */}
        {examHistory.length>1&&(
          <div style={{...C(D),padding:16,marginBottom:16}}>
            <div style={{fontSize:12,fontWeight:700,color:tx(D),marginBottom:10}}>Your Progress ({examHistory.length} attempts)</div>
            {examHistory.map(function(h,hi){return(
              <div key={hi} style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
                <span style={{fontSize:10,color:mu(D),width:60,flexShrink:0}}>{h.date}</span>
                <div style={{flex:1,height:14,borderRadius:4,background:D?"#1f2937":"#e5e7eb",overflow:"hidden"}}>
                  <div style={{height:"100%",width:h.pct+"%",background:gradeColor(h.grade),borderRadius:4,transition:"width .4s"}}/>
                </div>
                <span style={{fontSize:11,fontWeight:700,color:gradeColor(h.grade),width:32,textAlign:"right",flexShrink:0}}>{h.grade}</span>
                <span style={{fontSize:10,color:mu(D),width:36,textAlign:"right",flexShrink:0}}>{h.pct}%</span>
              </div>
            );})}
          </div>
        )}

        {/* Action buttons */}
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

        {/* Review mode — side-by-side layout */}
        {reviewMode&&(
          <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:20}}>
            {questions.map(function(q,qi){
              var a=answers[q.id];
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
                        <div style={{padding:"10px 12px",borderRadius:8,background:D?"#1f2937":"#f3f4f6",fontSize:12,color:tx(D),lineHeight:1.65,whiteSpace:"pre-line",minHeight:60}}>{(a&&a.textAns)||"Not attempted"}</div>
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

        {/* Standard Q&A summary (collapsed) */}
        {!reviewMode&&(
          <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:20}}>
            {questions.map(function(q,qi){
              var a=answers[q.id];
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
                    <div style={{marginTop:6,padding:"6px 10px",borderRadius:6,background:D?"#1f2937":"#f3f4f6",fontSize:11,color:tx(D),lineHeight:1.6}}>{a.result.feedback}</div>
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

  /* ── EXAM PHASE ── */
  const q=questions[qIdx];
  if(!q)return null;
  const curAns=answers[q.id]||{};
  const hasExtract=(extract||extract2)&&(paper.paperType==="structured");

  return (
    <div style={{minHeight:"100vh",background:D?"#030712":"#f9fafb",color:tx(D)}} className="fade-in">
      {/* 5-minute warning modal */}
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
      {/* Pause overlay */}
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
      {/* Timer bar */}
      <div style={{position:"sticky",top:0,zIndex:40,background:D?"#0d1117":"#fff",borderBottom:"1px solid "+bd2,padding:"8px 16px"}}>
        <div style={{maxWidth:760,margin:"0 auto",display:"flex",alignItems:"center",gap:12}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:11,color:mu(D),marginBottom:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{subj&&subj.icon} {subj&&subj.name} · {paper.n}</div>
            <div style={{height:4,borderRadius:4,background:D?"#1f2937":"#e5e7eb"}}>
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

      {/* Extract panels */}
      {showExtract&&extract&&(
        <div style={{background:D?"#1f2937":"#fffbeb",borderBottom:`1px solid ${D?"#374151":"#fde68a"}`,padding:"14px 20px",maxHeight:320,overflowY:"auto"}}>
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
        <div style={{background:D?"#1f2937":"#fdf2f8",borderBottom:`1px solid ${D?"#374151":"#fbcfe8"}`,padding:"14px 20px",maxHeight:320,overflowY:"auto"}}>
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
        {/* Split screen extract panel */}
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
        {/* Question nav dots */}
        <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:14}}>
          {questions.map((qq,i)=>{
            const a=answers[qq.id];const done=a?.selOpt!=null||a?.textAns?.trim();
            return (<div key={qq.id} onClick={()=>setQI(i)} title={`Q${i+1} (${qq.marks}mk)`}
              style={{width:9,height:9,borderRadius:"50%",cursor:"pointer",transition:"background .15s",flexShrink:0,
                background:i===qIdx?"#6366f1":done?"#16a34a":(D?"#374151":"#d1d5db")}}/>);
          })}
        </div>

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
          <span style={{fontSize:13,color:mu(D)}}>Question {qIdx+1} of {questions.length}</span>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            {q.section&&<span style={{fontSize:10,fontWeight:700,color:"#6366f1",background:D?"rgba(99,102,241,.15)":"#eef2ff",padding:"2px 8px",borderRadius:10}}>{q.section}</span>}
            <span style={{fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20,background:(subj&&subj.mid)||"#e0e7ff",color:(subj&&subj.dk)||"#312e81"}}>{q.marks} mark{q.marks!==1?"s":""}</span>
          </div>
        </div>
        {(()=>{var totalMarks=questions.reduce(function(s,qq){return s+Number(qq.marks||0);},0);var recSecs=totalMarks>0?Math.round((paper.d*60/totalMarks)*Number(q.marks||0)):0;var recMins=Math.floor(recSecs/60);var recSec=recSecs%60;return totalMarks>0?(<div style={{fontSize:10,color:mu(D),marginBottom:10}}>Suggested time: ~{recMins>0?recMins+"m ":""}{recSec>0?recSec+"s":""}</div>):null;})()}

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
                <div style={{marginBottom:10,padding:"10px 12px",borderRadius:10,background:D?"#1f2937":"#f0fdf4",border:`1px solid ${D?"#374151":"#86efac"}`,display:"flex",alignItems:"center",gap:10}}>
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

        <div style={{display:"flex",gap:10}}>
          <button onClick={()=>setQI(i=>Math.max(0,i-1))} disabled={qIdx===0}
            style={{flex:1,padding:"10px 0",borderRadius:10,border:`1px solid ${bd2}`,background:"transparent",
              color:qIdx===0?mu(D):tx(D),cursor:qIdx===0?"not-allowed":"pointer",fontSize:13}}>← Prev</button>
          <button onClick={()=>qIdx<questions.length-1?setQI(i=>i+1):doSubmit()}
            style={{flex:2,...B(qIdx<questions.length-1?"#6366f1":"#16a34a",false,{fontSize:13,padding:"10px 0"})}}>
            {qIdx<questions.length-1?"Next →":"Submit Exam ✓"}
          </button>
        </div>
        </div>{/* end inner flex child */}
      </div>
    </div>
  );
}


/* ─── AI TUTOR SCREEN ────────────────────────────────────────────────────────── */
function TutorImage({query,D}){
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

function parseTutorContent(text,D){
  const parts=text.split(/\[IMG:\s*([^\]]+)\]/g);
  if(parts.length===1)return (<MD text={text} D={D}/>);
  const out=[];
  for(let i=0;i<parts.length;i++){
    if(i%2===0){if(parts[i].trim())out.push(<MD key={i} text={parts[i]} D={D}/>);}
    else{out.push(<TutorImage key={i} query={parts[i].trim()} D={D}/>);}
  }
  return (<>{out}</>);
}

function AITutorScreen({D,subjects,allSections,boardSels,boardData,user,googleKey,onBack}){
  const [selSubj,setSS]=useState(subjects[0]?.id||"");
  const [selBoard,setSB]=useState("AQA");
  const [selSec,setSec]=useState("");
  const [mode,setMode]=useState("tutor");
  const [messages,setMsgs]=useState([]);
  const [input,setInput]=useState("");
  const [files,setFiles]=useState([]); // {name, type, data, preview, isImage}
  const [sending,setSending]=useState(false);
  const [err,setErr]=useState("");
  const [activeModel,setActiveModel]=useState(TUTOR_MODELS[0]);
  const [listening,setListening]=useState(false);
  const [quizzing,setQuizzing]=useState(false);
  const chatRef=useRef(null);
  const fileRef=useRef(null);
  const subj=subjects.find(function(s){return s.id===selSubj;});
  const secList=allSections.filter(function(s){return s.subjectId===selSubj;});
  const bd2=D?"#1f2937":"#e5e7eb";
  var memKey="gcse:tutor-mem:"+(user||"anon")+":"+selSubj+":"+selBoard;

  // Load conversation memory on subject/board change
  useEffect(function(){
    (function(){
      window.storage.get(memKey).then(function(r){
        try{if(r&&r.value){var saved=JSON.parse(r.value);if(Array.isArray(saved)&&saved.length)setMsgs(saved);}}
        catch(e){}
      }).catch(function(){});
    })();
  },[memKey]); // eslint-disable-line

  var saveMemory=function(msgs){
    try{
      var slim=msgs.slice(-20).map(function(m){return{role:m.role,content:typeof m.content==="string"?m.content:(m._d&&m._d.text||""),_d:{text:m._d&&m._d.text||""}};});
      window.storage.set(memKey,JSON.stringify(slim)).catch(function(){});
    }catch(e){}
  };

  useEffect(function(){if(chatRef.current)chatRef.current.scrollTop=chatRef.current.scrollHeight;},[messages,sending]);

  const reset=function(){setMsgs([]);setInput("");setFiles([]);setErr("");try{window.storage.delete(memKey);}catch(e){}};

  const buildCtx=useCallback(()=>{
    const bd3=boardData[`${selSubj}:${selBoard}`]||{custom:[],extras:{},papers:[]};
    const subjectDef=subjects.find(s=>s.id===selSubj);
    const merged=mergeTopics(subjectDef?.topics||[],bd3.custom,bd3.extras);
    const secs=selSec?merged.flatMap(t=>t.sections).filter(s=>s.id===selSec):merged.flatMap(t=>t.sections);
    const notes=secs.flatMap(s=>(s.notes||[]).map(n=>`### ${n.heading}\n${stripHtml(n.body)}`)).slice(0,20).join("\n\n");
    const fcs=secs.flatMap(s=>(s.flashcards||[]).map(f=>`Q: ${stripHtml(f.q)}\nA: ${stripHtml(f.a)}`)).slice(0,30).join("\n");
    const qs=secs.flatMap(s=>(s.questions||[]).map(q=>`Q(${q.marks}mk): ${stripHtml(q.text)}\nMS: ${stripHtml(q.markScheme||q.sampleAnswer||"")}`)).slice(0,20).join("\n\n");
    return{notes,fcs,qs,hasContent:!!(notes||fcs||qs)};
  },[selSubj,selBoard,selSec,boardData,subjects]);// eslint-disable-line

  const buildSys=()=>{
    const{notes,fcs,qs,hasContent}=buildCtx();
    const sec=allSections.find(s=>s.id===selSec);
    const topicLabel=sec?sec.title:`${subj?.name} (${selBoard})`;
    const imgInstr=`When a diagram, chart or visual aid would genuinely help the student understand a concept, include [IMG: specific descriptive search term] (e.g. [IMG: mitosis stages diagram], [IMG: carbon cycle diagram], [IMG: Macbeth character map]). Only use this for genuinely educational visuals — not decoratively.`;
    const modeInstr=mode==="homework"
      ?`HOMEWORK HELP MODE: The student may upload images, PDFs or other files showing their homework. Walk them through the problem step by step with guiding questions — do NOT just give the answer directly. Encourage independent thinking. Celebrate correct steps warmly.`
      :`TUTOR MODE: Answer questions clearly and enthusiastically. Use examples, analogies and connect to ${selBoard} exam skills. Format responses with headings and bullet points where helpful.`;
    if(!hasContent)return `You are ReviseIQ AI, a warm and expert GCSE ${subj?.name} tutor (${selBoard}). Topic: "${topicLabel}". IMPORTANT: No revision notes have been added yet — tell the student this briefly and draw on your general ${selBoard} GCSE knowledge. ${modeInstr} ${imgInstr} Use ${selBoard} command words. Keep responses focused and clear.`;
    return `You are ReviseIQ AI, a warm and expert GCSE ${subj?.name} tutor (${selBoard}). Topic: "${topicLabel}".

IMPORTANT — CONTENT BOUNDARIES: Only draw on the revision content provided below. If the student asks about something not in these notes, say so clearly and offer to cover what IS in their notes. You may use general ${selBoard} GCSE knowledge ONLY to explain or expand on content that IS in the notes.

=== STUDENT'S REVISION NOTES ===
${notes||"(none added yet)"}

=== FLASHCARDS ===
${fcs||"(none added yet)"}

=== EXAM QUESTIONS & MARK SCHEMES ===
${qs||"(none added yet)"}

${modeInstr}
${imgInstr}
Style: warm, encouraging, clear. Use ## headings and bullet points to organise longer responses. Reference ${selBoard} mark scheme language when relevant.`;
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
      // Unsupported — just record the name
      res({name:file.name,type:file.type,unsupported:true,preview:null});
    }
  });

  const addFiles=async e=>{
    const newFiles=await Promise.all(Array.from(e.target.files||[]).map(readFile));
    setFiles(p=>[...p,...newFiles]);
    e.target.value="";
  };

  const buildApiContent=(text,attachedFiles)=>{
    const parts=[];
    for(const f of attachedFiles){
      if(f.isImage)parts.push({type:"image",source:{type:"base64",media_type:f.type,data:f.data}});
      else if(f.isPdf)parts.push({type:"document",source:{type:"base64",media_type:"application/pdf",data:f.data}});
      else if(f.isText)parts.push({type:"text",text:`[Uploaded text file: ${f.name}]\n${f.textContent}`});
      else parts.push({type:"text",text:`[Uploaded file: ${f.name} — type not directly readable; the student has shared this file with you]`});
    }
    parts.push({type:"text",text:text||"Please help me with the uploaded file(s)."});
    return parts.length===1&&!attachedFiles.length?text:parts;
  };

  // tutorCall: delegates to shared _aiRequest
  const tutorCall = async function(modelDef, systemPrompt, hist) {
    return _aiRequest(systemPrompt||null, hist, 1500);
  };
  // Keep callAI / callAIChat aliases for any remaining callsites
  const callAILocal = async function(modelDef, systemPrompt, hist) { return tutorCall(modelDef, systemPrompt, hist); };

  const send=async()=>{
    if((!input.trim()&&!files.length)||sending)return;
    setSending(true);setErr("");
    try{
    const userText = input || "Please help me with the uploaded file(s).";
    const newMsg={role:"user",content:userText,_d:{text:userText,files:[...files]}};
    const hist=[...messages,newMsg];
    setMsgs(hist);setInput("");setFiles([]);
    // Pick starting model based on daily usage, then cascade through worse models on quota errors
    const chosenModel=await pickTutorModel(user);
    setActiveModel(chosenModel);
    const startIdx=TUTOR_MODELS.findIndex(function(m){return m.model===chosenModel.model;});
    const tryOrder=[...TUTOR_MODELS.slice(startIdx<0?0:startIdx),...TUTOR_MODELS.slice(0,startIdx<0?0:startIdx)];
    var responseText=null; var lastErr="AI unavailable";
    for(var ti=0;ti<tryOrder.length;ti++){
      var modelDef=tryOrder[ti];
      try{
        responseText=await tutorCall(modelDef,buildSys(),hist);
        await incTutorUsage(user,modelDef.model);
        setActiveModel(modelDef);
        break;
      }catch(e){
        lastErr=e.message||"AI error";
        // Only cascade on quota/rate errors; surface other errors immediately
        var isQuota=lastErr.toLowerCase().includes("quota")||lastErr.toLowerCase().includes("429")||lastErr.toLowerCase().includes("rate")||lastErr.toLowerCase().includes("resource_exhausted");
        if(!isQuota) break;
      }
    }
    if(responseText){
      var hcNow=buildCtx();
      var stag=hcNow.hasContent?"notes":"general";
      var newMsgsArr=[...hist,{role:"assistant",content:responseText,_d:{text:responseText,stag:stag,chips:[]}}];
      setMsgs(newMsgsArr);
      saveMemory(newMsgsArr);
      // Fire-and-forget chips (use last/cheapest model)
      var chipModel=TUTOR_MODELS[TUTOR_MODELS.length-1];
      tutorCall(chipModel,'Return ONLY a JSON array of 3 short follow-up questions (max 9 words each). No preamble.',
        [{role:"user",content:"Suggest 3 follow-ups for: "+responseText.slice(0,400)}]
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
    pickTutorModel(user).then(function(chosenModel){
      return tutorCall(chosenModel,buildSys(),[{role:"user",content:promptText}],null).then(function(rt){
        incTutorUsage(user,chosenModel.model);
        setActiveModel(chosenModel);
        var nm=[...hist2,{role:"assistant",content:rt,_d:{text:rt,stag:ctx.hasContent?"notes":"general",chips:["What is the answer to Q1?","Explain Q2 further","Give me 3 more questions"]}}];
        setMsgs(nm);saveMemory(nm);setQuizzing(false);
      });
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
    <div style={{minHeight:"100vh",background:D?"#030712":"#f9fafb",display:"flex",flexDirection:"column",color:tx(D)}} className="fade-in">
      {/* Header controls */}
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
              {messages.length>0&&<button onClick={reset} style={{fontSize:11,color:mu(D),background:"none",border:`1px solid ${bd2}`,borderRadius:8,padding:"4px 10px",cursor:"pointer"}}>↺ New chat</button>}
            </div>
          </div>
          {!hasContent&&<div style={{marginTop:8,padding:"6px 12px",borderRadius:8,background:D?"rgba(245,158,11,.08)":"#fffbeb",border:"1px solid #f59e0b",fontSize:11,color:D?"#fcd34d":"#92400e"}}>⚠️ No revision notes added for this selection — tutor will use general GCSE knowledge.</div>}
        </div>
      </div>

      {/* Chat messages */}
      <div ref={chatRef} style={{flex:1,overflowY:"auto",padding:"16px",display:"flex",flexDirection:"column",gap:14,minHeight:0}}>
        {messages.length===0&&(
          <div style={{textAlign:"center",padding:"48px 20px",color:mu(D),maxWidth:500,margin:"0 auto"}}>
            <div style={{fontSize:52,marginBottom:12}}>🤖</div>
            <p style={{fontWeight:700,fontSize:16,marginBottom:8,color:tx(D)}}>ReviseIQ AI Tutor</p>
            <p style={{fontSize:13,marginBottom:10,lineHeight:1.6}}>{mode==="tutor"?"Ask me anything about your selected topic and I'll explain it clearly with examples, diagrams and exam tips.":"Share your homework by uploading a photo, PDF or file, or paste the question below. I'll walk you through it step by step."}</p>
            <p style={{fontSize:11,color:mu(D)}}>{hasContent?"Drawing from your revision notes and flashcards.":"Using general GCSE knowledge."}</p>
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
                  background:isU?"#6366f1":(D?"#1f2937":"#f3f4f6"),
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
                      style={{fontSize:11,padding:"3px 10px",borderRadius:14,border:"1px solid "+(D?"#374151":"#d1d5db"),background:D?"#1f2937":"#fff",color:mu(D),cursor:"pointer"}}>
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
            <div style={{padding:"10px 14px",borderRadius:"16px 16px 16px 4px",background:D?"#1f2937":"#f3f4f6",fontSize:13,color:mu(D)}}>
              <span>Thinking</span><span style={{animation:"none"}}>…</span>
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div style={{borderTop:`1px solid ${bd2}`,background:D?"#0d1117":"#fff",padding:"10px 16px",flexShrink:0}}>
        <div style={{maxWidth:800,margin:"0 auto"}}>
          {/* File previews */}
          {files.length>0&&(
            <div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap"}}>
              {files.map((f,fi)=>(
                <div key={fi} style={{position:"relative",display:"flex",alignItems:"center",gap:5,padding:"4px 8px",borderRadius:8,background:D?"#1f2937":"#f3f4f6",border:`1px solid ${bd2}`,maxWidth:160}}>
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


/* ─── EXAM TECHNIQUE COACH ───────────────────────────────────────────────── */
const COMMAND_WORDS = [
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

function ExamCoachScreen({D,subjects,allSections,boardSels,boardData,onBack}) {
  const bg=D?"#030712":"#f9fafb", tx2=D?"#f9fafb":"#111827", mu2=D?"#9ca3af":"#6b7280";
  const C2=D?{background:"#111827",border:"1px solid #1f2937",borderRadius:14}:{background:"#fff",border:"1px solid #e5e7eb",borderRadius:14};

  const [selSubj, setSelSubj] = React.useState(subjects[0]?.id||"");
  const [selCW, setSelCW] = React.useState(COMMAND_WORDS[0].word);
  const [phase, setPhase] = React.useState("setup"); // setup | practice | feedback
  const [question, setQuestion] = React.useState("");
  const [loadingQ, setLoadingQ] = React.useState(false);
  const [scaffold, setScaffold] = React.useState({});
  const [submitting, setSubmitting] = React.useState(false);
  const [feedback, setFeedback] = React.useState(null);
  const [errMsg, setErrMsg] = React.useState("");

  const subjDef = subjects.find(function(s){return s.id===selSubj;});
  const board = subjDef ? (boardSels[subjDef.id]||"AQA") : "AQA";
  const cmdDef = COMMAND_WORDS.find(function(c){return c.word===selCW;})||COMMAND_WORDS[0];

  // Build context notes from allSections for selected subject
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
    callGeminiSimple(prompt, 200).then(function(text){
      setQuestion(text.trim());
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
    const notes = getContextNotes();
    const prompt = "You are a "+board+" GCSE "+( subjDef?subjDef.name:"subject")+" examiner marking a structured practice answer.\n\n"+
      "Command word: "+selCW+"\n"+
      "Question: "+question+"\n\n"+
      "Command word guidance: "+cmdDef.tip+"\n\n"+
      "Student's structured answer:\n"+filled+"\n\n"+
      (notes?"Relevant revision content:\n"+notes+"\n\n":"")+
      "Provide feedback in this EXACT JSON format (no markdown, no backticks):\n"+
      "{\"overallBand\":\"Developing|Achieving|Exceeding\",\"score\":\"e.g. 5/8\","+
      "\"strengths\":[\"specific strength 1\",\"specific strength 2\"],"+
      "\"improvements\":[\"specific improvement 1\",\"specific improvement 2\"],"+
      "\"commandWordFeedback\":\"Did they use '"+selCW+"' correctly? Be specific.\","+
      "\"modelAnswer\":\"A concise model answer for this question (3-6 sentences)\","+
      "\"examTip\":\"One targeted "+board+" exam technique tip\"}";
    callGeminiSimple(prompt, 1000).then(function(raw){
      try{
        var fence="`"+"`"+"`"; var clean=raw.split(fence+"json").join("").split(fence).join("").trim();
        var s=clean.indexOf("{"), e=clean.lastIndexOf("}");
        var parsed=JSON.parse(s>=0&&e>=0?clean.slice(s,e+1):clean);
        setFeedback(parsed); setPhase("feedback");
      }catch(ex){ setErrMsg("Could not parse feedback. Please try again."); }
      setSubmitting(false);
    }).catch(function(e){
      setErrMsg("Feedback failed: "+e.message);
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

        {/* Setup panel */}
        <div style={{...C2,padding:22,marginBottom:20}}>
          <div style={{display:"flex",gap:14,flexWrap:"wrap",marginBottom:16}}>
            <div style={{flex:1,minWidth:140}}>
              <label style={{fontSize:11,fontWeight:600,color:mu2,display:"block",marginBottom:6}}>SUBJECT</label>
              <select value={selSubj} onChange={function(e){setSelSubj(e.target.value);reset();}}
                style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid "+(D?"#374151":"#d1d5db"),background:D?"#1f2937":"#fff",color:tx2,fontSize:13}}>
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

          {/* Command word tip */}
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

        {/* Practice phase */}
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
                          style={{width:"100%",minHeight:72,padding:"10px 12px",borderRadius:8,border:"1px solid "+(D?"#374151":"#d1d5db"),background:D?"#1f2937":"#f9fafb",color:tx2,fontSize:13,resize:"vertical",boxSizing:"border-box",fontFamily:"inherit"}}/>
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
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,padding:"14px 18px",borderRadius:12,background:D?"#111827":"#f8fafc",border:"1.5px solid "+bandColor}}>
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

/* ─── TODAY WIDGET ───────────────────────────────────────────────────────── */
function TodayWidget({D,subjects,allSections,fcHist,stats,timetableExams,boardSels,
  onNavigateSection,onNavigateBlurt,onMock}) {
  const now = Date.now();
  const todayDate = new Date().toISOString().slice(0,10);

  // 1. SM-2 due cards per subject
  const dueBySubj = {};
  subjects.forEach(function(s){
    const secs = allSections.filter(function(sec){return sec.subjectId===s.id;});
    var count = 0;
    secs.forEach(function(sec){
      (sec.flashcards||[]).forEach(function(c){
        if(isCardDue(fcHist,c.id)) count++;
      });
    });
    if(count>0) dueBySubj[s.id] = count;
  });

  // 2. Weakest section by question history (worst accuracy with ≥1 attempt)
  var weakestSec = null; var worstPct = 101;
  allSections.forEach(function(sec){
    const wq = stats.weakQ&&stats.weakQ[sec.id];
    if(!wq||!wq.total) return;
    const pct = Math.round(((wq.total - wq.wrong)/wq.total)*100);
    if(pct < worstPct){ worstPct = pct; weakestSec = sec; }
  });

  // 3. Most urgent upcoming exam (soonest future date)
  var urgentExam = null; var minDays = Infinity;
  (timetableExams||[]).forEach(function(exam){
    const dt = new Date(exam.date+"T00:00:00");
    const diff = Math.round((dt - now)/(86400000));
    if(diff>=0 && diff<minDays){ minDays=diff; urgentExam=exam; }
  });

  // Build prioritised action items
  const items = [];

  // Flash cards: pick the subject with the most due cards
  if(Object.keys(dueBySubj).length>0){
    const topSubjId = Object.keys(dueBySubj).sort(function(a,b){return dueBySubj[b]-dueBySubj[a];})[0];
    const topSubj = subjects.find(function(s){return s.id===topSubjId;});
    const count = dueBySubj[topSubjId];
    // Find the section with the most due cards for this subject
    var bestSec=null; var bestCount=0;
    allSections.filter(function(s){return s.subjectId===topSubjId;}).forEach(function(sec){
      var dc=(sec.flashcards||[]).filter(function(c){return isCardDue(fcHist,c.id);}).length;
      if(dc>bestCount){bestCount=dc;bestSec=sec;}
    });
    items.push({
      emoji:"🃏",
      text:"Review "+count+" due "+topSubj.name+" flashcard"+(count!==1?"s":""),
      sub:bestSec?bestSec.title:topSubj.name,
      color:topSubj.accent,
      action:function(){if(bestSec)onNavigateSection(bestSec,"flashcards");}
    });
  }

  // Weak questions area
  if(weakestSec){
    const sec = weakestSec;
    const subj = subjects.find(function(s){return s.id===sec.subjectId;});
    const qCount = (sec.questions||[]).length;
    items.push({
      emoji:"❓",
      text:"Practice "+(qCount>0?qCount+" ":"")+"question"+(qCount!==1?"s":"")+": "+sec.title,
      sub:"Your weakest area · "+worstPct+"% accuracy",
      color:subj?subj.accent:"#ef4444",
      action:function(){onNavigateSection(sec,"questions");}
    });
  }

  // Upcoming exam blurt
  if(urgentExam){
    const eSubj = subjects.find(function(s){return s.id===urgentExam.subjectId;});
    const label = urgentExam.label||(eSubj?eSubj.name:"exam");
    // Find a relevant section for blurting
    const relSec = urgentExam.sectionId
      ? allSections.find(function(s){return s.id===urgentExam.sectionId;})
      : allSections.find(function(s){return s.subjectId===urgentExam.subjectId;});
    const daysLabel = minDays===0?"today":minDays===1?"tomorrow":"in "+minDays+" days";
    items.push({
      emoji:"📅",
      text:"Quick blurt: "+label+" (exam "+daysLabel+")",
      sub:relSec?"Blurting: "+relSec.title:"Exam preparation",
      color:minDays<=3?"#ef4444":minDays<=7?"#f59e0b":"#10b981",
      action:function(){if(relSec)onNavigateBlurt(urgentExam.subjectId,relSec.id);else onMock();}
    });
  }

  // Pad to 3 items if we have fewer — suggest a mock exam
  if(items.length<3){
    items.push({
      emoji:"📝",
      text:"Take a mock exam",
      sub:"Simulate real exam conditions",
      color:"#6366f1",
      action:onMock
    });
  }

  const finalItems = items.slice(0,3);
  if(!finalItems.some(function(i){return i.text!=="Take a mock exam";})) return null; // nothing meaningful to show

  return (
    <div style={{marginBottom:22}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
        <span style={{fontSize:16}}>📋</span>
        <span style={{fontSize:14,fontWeight:700}}>What to revise today</span>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {finalItems.map(function(item,i){
          return (
            <button key={i} onClick={item.action}
              style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderRadius:12,
                background:D?"#111827":"#fff",border:"1.5px solid "+(D?"#1f2937":"#e5e7eb"),
                cursor:"pointer",textAlign:"left",width:"100%",transition:"border-color .15s,transform .1s"}}
              onMouseEnter={function(e){e.currentTarget.style.borderColor=item.color;e.currentTarget.style.transform="translateY(-1px)";}}
              onMouseLeave={function(e){e.currentTarget.style.borderColor=D?"#1f2937":"#e5e7eb";e.currentTarget.style.transform="";}}>
              <div style={{width:32,height:32,borderRadius:8,background:item.color+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>
                {item.emoji}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:600,color:D?"#f9fafb":"#111827",marginBottom:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  <span style={{color:item.color,marginRight:5,fontWeight:700}}>{i+1}.</span>{item.text}
                </div>
                <div style={{fontSize:11,color:D?"#9ca3af":"#6b7280",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.sub}</div>
              </div>
              <span style={{fontSize:12,color:item.color,flexShrink:0}}>→</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── FOOTER ────────────────────────────────────────────────────────────── */
function AppFooter({D, onContact}) {
  var bg2 = D ? "#0d1117" : "#f9fafb";
  var border = D ? "#1f2937" : "#e5e7eb";
  return (
    <footer style={{borderTop:"1px solid "+border,background:bg2,padding:"20px 24px",marginTop:40}}>
      <div style={{maxWidth:960,margin:"0 auto",display:"flex",flexWrap:"wrap",alignItems:"center",justifyContent:"space-between",gap:12}}>
        <div style={{fontSize:12,color:D?"#6b7280":"#9ca3af",lineHeight:1.6}}>
          <span style={{fontWeight:600,color:D?"#9ca3af":"#6b7280"}}>🎓 ReviseIQ</span>
          {" · "}Built with the help of{" "}
          <span style={{color:"#f97316"}}>Claude</span>
          {", AI powered by "}
          <span style={{color:"#10a37f"}}>Llama via Groq</span>
          {" · "}
          <span style={{fontSize:11}}>Not affiliated with Anthropic or Groq.</span>
        </div>
        <button onClick={onContact}
          style={{fontSize:12,fontWeight:600,color:"#6366f1",background:"none",border:"1px solid #6366f1",borderRadius:8,padding:"6px 14px",cursor:"pointer"}}>
          ✉️ Contact Us
        </button>
      </div>
    </footer>
  );
}


/* ─── PERSONAL SUBJECTS ──────────────────────────────────────────────────── */
// Generates a stable ID from a string
function _psId(s){ return (s||"").toLowerCase().replace(/[^a-z0-9]/g,"-").replace(/-+/g,"-").slice(0,30)+"-"+Math.random().toString(36).slice(2,6); }

// Modal: create or edit a personal subject
function CreatePersonalSubjectModal({D, onSave, onClose}) {
  const [name,setName] = React.useState("");
  const [icon,setIcon] = React.useState("📚");
  const [color,setColor] = React.useState("#6366f1");
  var icons = ["📚","🔬","🧮","✍️","🌱","🎨","🏃","🎸","💡","🌍","📷","🍎","💻","🏛️","🎭"];
  var colors = ["#6366f1","#0ea5e9","#10b981","#f59e0b","#ef4444","#a855f7","#ec4899","#0f766e","#d97706","#3b82f6"];
  var bd = D?"#374151":"#e5e7eb";
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:9500,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div onClick={function(e){e.stopPropagation();}} style={{background:D?"#1f2937":"#fff",borderRadius:16,width:440,maxWidth:"96vw",boxShadow:"0 30px 80px rgba(0,0,0,.3)",padding:28}}>
        <h2 style={{fontSize:17,fontWeight:700,marginBottom:18}}>✨ New Personal Subject</h2>
        <div style={{marginBottom:14}}>
          <label style={{fontSize:11,fontWeight:700,color:D?"#9ca3af":"#6b7280",display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.05em"}}>Subject Name *</label>
          <input value={name} onChange={function(e){setName(e.target.value);}} placeholder="e.g. Spanish Vocabulary, Piano Theory…"
            style={{width:"100%",padding:"9px 12px",borderRadius:8,border:"1px solid "+bd,background:D?"#111827":"#f9fafb",color:D?"#f9fafb":"#111827",fontSize:13}}/>
        </div>
        <div style={{marginBottom:14}}>
          <label style={{fontSize:11,fontWeight:700,color:D?"#9ca3af":"#6b7280",display:"block",marginBottom:8,textTransform:"uppercase",letterSpacing:"0.05em"}}>Icon</label>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {icons.map(function(ic){return (
              <button key={ic} onClick={function(){setIcon(ic);}}
                style={{width:36,height:36,borderRadius:8,border:"2px solid "+(ic===icon?color:bd),background:ic===icon?color+"22":"transparent",fontSize:18,cursor:"pointer"}}>
                {ic}
              </button>
            );})}
          </div>
        </div>
        <div style={{marginBottom:22}}>
          <label style={{fontSize:11,fontWeight:700,color:D?"#9ca3af":"#6b7280",display:"block",marginBottom:8,textTransform:"uppercase",letterSpacing:"0.05em"}}>Colour</label>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {colors.map(function(c){return (
              <button key={c} onClick={function(){setColor(c);}}
                style={{width:28,height:28,borderRadius:7,background:c,border:c===color?"3px solid "+c:"2px solid transparent",boxShadow:c===color?"0 0 0 2px white, 0 0 0 4px "+c:"none",cursor:"pointer"}}/>
            );})}
          </div>
        </div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <button onClick={onClose} style={{padding:"9px 18px",borderRadius:10,border:"1px solid "+bd,background:"transparent",color:D?"#e5e7eb":"#374151",cursor:"pointer",fontSize:13}}>Cancel</button>
          <button disabled={!name.trim()} onClick={function(){if(!name.trim())return;onSave({id:_psId(name),name:name.trim(),icon:icon,accent:color,light:color+"18",mid:color+"28",topics:[]});}}
            style={{padding:"9px 20px",borderRadius:10,border:"none",background:name.trim()?"#6366f1":"#d1d5db",color:"#fff",fontWeight:600,fontSize:13,cursor:name.trim()?"pointer":"not-allowed"}}>
            Create Subject
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal: add a topic to a personal subject
function AddPersonalTopicModal({D, onSave, onClose}) {
  const [title,setTitle] = React.useState("");
  var bd = D?"#374151":"#e5e7eb";
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:9500,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div onClick={function(e){e.stopPropagation();}} style={{background:D?"#1f2937":"#fff",borderRadius:16,width:380,maxWidth:"96vw",boxShadow:"0 30px 80px rgba(0,0,0,.3)",padding:28}}>
        <h2 style={{fontSize:16,fontWeight:700,marginBottom:16}}>＋ Add Topic</h2>
        <input autoFocus value={title} onChange={function(e){setTitle(e.target.value);}}
          onKeyDown={function(e){if(e.key==="Enter"&&title.trim())onSave({id:_psId(title),title:title.trim(),notes:[],flashcards:[]});}}
          placeholder="Topic title…"
          style={{width:"100%",padding:"9px 12px",borderRadius:8,border:"1px solid "+bd,background:D?"#111827":"#f9fafb",color:D?"#f9fafb":"#111827",fontSize:13,marginBottom:16}}/>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <button onClick={onClose} style={{padding:"8px 16px",borderRadius:9,border:"1px solid "+bd,background:"transparent",color:D?"#e5e7eb":"#374151",cursor:"pointer",fontSize:13}}>Cancel</button>
          <button disabled={!title.trim()} onClick={function(){if(title.trim())onSave({id:_psId(title),title:title.trim(),notes:[],flashcards:[]});}}
            style={{padding:"8px 16px",borderRadius:9,border:"none",background:title.trim()?"#6366f1":"#d1d5db",color:"#fff",fontWeight:600,fontSize:13,cursor:title.trim()?"pointer":"not-allowed"}}>
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

// Personal subject section screen (notes + flashcards, AI-assisted)
function PersonalSectionScreen({D, subj, topic, user, onBack, onSave}) {
  const [noteText,setNoteText] = React.useState("");
  const [fcFront,setFcFront] = React.useState("");
  const [fcBack,setFcBack] = React.useState("");
  const [aiText,setAiText] = React.useState("");
  const [aiLoading,setAiLoading] = React.useState(false);
  const [aiErr,setAiErr] = React.useState("");
  const [tab,setTab] = React.useState("notes");
  const [flip,setFlip] = React.useState(false);
  const [fcIdx,setFcIdx] = React.useState(0);
  var bd = D?"#374151":"#e5e7eb";
  var tx2 = D?"#f9fafb":"#111827";
  var bg = D?"#111827":"#f9fafb";

  var notes = topic.notes||[];
  var flashcards = topic.flashcards||[];

  function addNote(){
    if(!noteText.trim()) return;
    var n={id:_psId(noteText),text:noteText.trim(),created:Date.now()};
    onSave({...topic,notes:[...notes,n]});
    setNoteText("");
  }

  function deleteNote(id){
    onSave({...topic,notes:notes.filter(function(n){return n.id!==id;})});
  }

  function addFlashcard(){
    if(!fcFront.trim()||!fcBack.trim()) return;
    var fc={id:_psId(fcFront),front:fcFront.trim(),back:fcBack.trim()};
    onSave({...topic,flashcards:[...flashcards,fc]});
    setFcFront(""); setFcBack("");
  }

  function deleteFlashcard(id){
    onSave({...topic,flashcards:flashcards.filter(function(f){return f.id!==id;})});
    if(fcIdx>=flashcards.length-1) setFcIdx(Math.max(0,flashcards.length-2));
  }

  function generateFromText(){
    if(!aiText.trim()) return;
    setAiLoading(true); setAiErr("");
    var topicSnap = topic;
    var notesSnap = notes;
    var flashcardsSnap = flashcards;
    var p;
    if(tab==="notes"){
      p = "You are a study assistant. The user has pasted the following text. Extract the key facts and turn them into clear, concise bullet-point notes. Return ONLY the notes as a plain text list, one point per line starting with \u2022.\n\n"+aiText;
      callGeminiSimple(p, 1200).then(function(result){
        var ls = result.split("\n").filter(function(l){return l.trim();});
        var newNotes = ls.map(function(l){return {id:_psId(l),text:l.replace(/^\u2022\s*/,"").trim(),created:Date.now()};});
        onSave(Object.assign({},topicSnap,{notes:notesSnap.concat(newNotes)}));
        setAiText("");
        setAiLoading(false);
      }).catch(function(e){setAiErr(e.message||"AI error — try again");setAiLoading(false);});
    } else {
      p = "You are a study assistant. The user has pasted the following text. Create 6-10 flashcard question-answer pairs covering the key facts. Return ONLY valid JSON (no markdown): [{\"front\":\"question\",\"back\":\"answer\"}]\n\n"+aiText;
      callGeminiSimple(p, 1200).then(function(raw){
        var s=raw.indexOf("["), e2=raw.lastIndexOf("]");
        if(s<0||e2<0) throw new Error("Could not parse AI response");
        var arr = JSON.parse(raw.slice(s,e2+1));
        var newFcs = arr.map(function(item){return {id:_psId(item.front||"fc"),front:(item.front||"").trim(),back:(item.back||"").trim()};});
        onSave(Object.assign({},topicSnap,{flashcards:flashcardsSnap.concat(newFcs)}));
        setAiText("");
        setAiLoading(false);
      }).catch(function(e){setAiErr(e.message||"AI error — try again");setAiLoading(false);});
    }
  }

  var curFc = flashcards[fcIdx]||null;

  return (
    <div style={{minHeight:"100vh",background:bg,color:tx2}} className="fade-in">
      <div style={{maxWidth:760,margin:"0 auto",padding:"32px 24px"}}>
        <button onClick={onBack} style={{fontSize:13,color:D?"#9ca3af":"#6b7280",background:"none",border:"none",cursor:"pointer",marginBottom:16}}>← Back</button>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}>
          <div style={{width:44,height:44,borderRadius:12,background:subj.accent+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>{subj.icon}</div>
          <div>
            <h2 style={{fontSize:18,fontWeight:700,margin:0}}>{topic.title}</h2>
            <p style={{fontSize:12,color:D?"#9ca3af":"#6b7280",margin:0}}>{subj.name} · Personal</p>
          </div>
        </div>

        <div style={{display:"flex",borderBottom:"1px solid "+bd,marginBottom:20,gap:2}}>
          {[["notes","📖 Notes"],["flashcards","🃏 Flashcards"]].map(function(pair){var t=pair[0],label=pair[1];return (
            <button key={t} onClick={function(){setTab(t);setFlip(false);}}
              style={{padding:"10px 16px",fontSize:13,fontWeight:tab===t?600:400,color:tab===t?subj.accent:D?"#9ca3af":"#6b7280",background:"none",border:"none",cursor:"pointer",borderBottom:tab===t?"2px solid "+subj.accent:"2px solid transparent",marginBottom:-1}}>
              {label}
            </button>
          );})}
        </div>

        {/* AI Generate from text */}
        <div style={{background:D?"#1f2937":"#fff",border:"1px solid "+bd,borderRadius:12,padding:16,marginBottom:20}}>
          <div style={{fontSize:12,fontWeight:700,color:D?"#9ca3af":"#6b7280",marginBottom:8}}>🤖 AI Generate {tab==="notes"?"Notes":"Flashcards"} from Text</div>
          <textarea value={aiText} onChange={function(e){setAiText(e.target.value);}}
            placeholder={"Paste any text, paragraphs or notes here and AI will generate "+( tab==="notes"?"bullet-point notes":"flashcard pairs")+" from it…"}
            rows={3} style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid "+bd,background:D?"#111827":"#f9fafb",color:tx2,fontSize:12,resize:"vertical",boxSizing:"border-box"}}/>
          {aiErr&&<p style={{fontSize:12,color:"#ef4444",margin:"6px 0 0"}}>{aiErr}</p>}
          <button disabled={!aiText.trim()||aiLoading} onClick={generateFromText}
            style={{marginTop:8,padding:"7px 16px",borderRadius:8,border:"none",background:aiText.trim()&&!aiLoading?subj.accent:"#d1d5db",color:"#fff",fontWeight:600,fontSize:12,cursor:aiText.trim()&&!aiLoading?"pointer":"not-allowed"}}>
            {aiLoading?"Generating…":"✨ Generate"}
          </button>
        </div>

        {tab==="notes"&&(
          <div>
            <div style={{display:"flex",gap:8,marginBottom:16}}>
              <input value={noteText} onChange={function(e){setNoteText(e.target.value);}}
                onKeyDown={function(e){if(e.key==="Enter")addNote();}}
                placeholder="Add a note…"
                style={{flex:1,padding:"9px 12px",borderRadius:8,border:"1px solid "+bd,background:D?"#111827":"#f9fafb",color:tx2,fontSize:13}}/>
              <button disabled={!noteText.trim()} onClick={addNote}
                style={{padding:"9px 16px",borderRadius:8,border:"none",background:noteText.trim()?subj.accent:"#d1d5db",color:"#fff",fontWeight:600,fontSize:13,cursor:noteText.trim()?"pointer":"not-allowed"}}>Add</button>
            </div>
            {notes.length===0&&<p style={{fontSize:13,color:D?"#9ca3af":"#6b7280",textAlign:"center",padding:"32px 0"}}>No notes yet. Add one above or use AI to generate from text.</p>}
            {notes.map(function(n){return (
              <div key={n.id} style={{background:D?"#1f2937":"#fff",border:"1px solid "+bd,borderRadius:10,padding:"12px 14px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10}}>
                <p style={{fontSize:13,lineHeight:1.7,margin:0,flex:1,whiteSpace:"pre-wrap"}}>{n.text}</p>
                <button onClick={function(){deleteNote(n.id);}} style={{background:"none",border:"none",color:"#ef4444",cursor:"pointer",fontSize:14,flexShrink:0,padding:"0 4px"}}>✕</button>
              </div>
            );})}
          </div>
        )}

        {tab==="flashcards"&&(
          <div>
            {curFc?(
              <div style={{marginBottom:20}}>
                <div onClick={function(){setFlip(function(f){return !f;});}}
                  style={{cursor:"pointer",background:D?"#1f2937":"#fff",border:"2px solid "+subj.accent,borderRadius:16,padding:"32px 24px",textAlign:"center",minHeight:140,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",marginBottom:12,userSelect:"none"}}>
                  <div style={{fontSize:10,fontWeight:700,color:subj.accent,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>{flip?"Answer":"Question"}</div>
                  <div style={{fontSize:16,fontWeight:600}}>{flip?curFc.back:curFc.front}</div>
                  <div style={{fontSize:11,color:D?"#6b7280":"#9ca3af",marginTop:10}}>Tap to flip</div>
                </div>
                <div style={{display:"flex",gap:10,justifyContent:"space-between",alignItems:"center"}}>
                  <button disabled={fcIdx===0} onClick={function(){setFcIdx(function(i){return i-1;});setFlip(false);}}
                    style={{padding:"7px 16px",borderRadius:8,border:"1px solid "+bd,background:"transparent",color:D?"#e5e7eb":"#374151",cursor:fcIdx===0?"not-allowed":"pointer",opacity:fcIdx===0?0.4:1}}>← Prev</button>
                  <span style={{fontSize:12,color:D?"#9ca3af":"#6b7280"}}>{fcIdx+1} / {flashcards.length}</span>
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={function(){deleteFlashcard(curFc.id);}} style={{padding:"7px 12px",borderRadius:8,border:"1px solid #ef4444",background:"none",color:"#ef4444",cursor:"pointer",fontSize:12}}>Delete</button>
                    <button disabled={fcIdx>=flashcards.length-1} onClick={function(){setFcIdx(function(i){return i+1;});setFlip(false);}}
                      style={{padding:"7px 16px",borderRadius:8,border:"1px solid "+bd,background:"transparent",color:D?"#e5e7eb":"#374151",cursor:fcIdx>=flashcards.length-1?"not-allowed":"pointer",opacity:fcIdx>=flashcards.length-1?0.4:1}}>Next →</button>
                  </div>
                </div>
              </div>
            ):(
              <p style={{fontSize:13,color:D?"#9ca3af":"#6b7280",textAlign:"center",padding:"24px 0"}}>No flashcards yet. Add some below or use AI to generate from text.</p>
            )}
            <div style={{background:D?"#1f2937":"#fff",border:"1px solid "+bd,borderRadius:12,padding:16}}>
              <div style={{fontSize:12,fontWeight:700,color:D?"#9ca3af":"#6b7280",marginBottom:10}}>＋ Add Flashcard</div>
              <input value={fcFront} onChange={function(e){setFcFront(e.target.value);}} placeholder="Front (question / term)"
                style={{width:"100%",padding:"8px 10px",borderRadius:7,border:"1px solid "+bd,background:D?"#111827":"#f9fafb",color:tx2,fontSize:13,marginBottom:8,boxSizing:"border-box"}}/>
              <input value={fcBack} onChange={function(e){setFcBack(e.target.value);}} placeholder="Back (answer / definition)"
                style={{width:"100%",padding:"8px 10px",borderRadius:7,border:"1px solid "+bd,background:D?"#111827":"#f9fafb",color:tx2,fontSize:13,marginBottom:10,boxSizing:"border-box"}}/>
              <button disabled={!fcFront.trim()||!fcBack.trim()} onClick={addFlashcard}
                style={{padding:"8px 16px",borderRadius:8,border:"none",background:fcFront.trim()&&fcBack.trim()?subj.accent:"#d1d5db",color:"#fff",fontWeight:600,fontSize:12,cursor:fcFront.trim()&&fcBack.trim()?"pointer":"not-allowed"}}>
                Add Flashcard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Personal subject screen — lists topics, allows adding new ones
function PersonalSubjectScreen({D, subj, personalSubjects, onBack, onSaveSubjects, user}) {
  const [addTopicOpen,setAddTopicOpen] = React.useState(false);
  const [activeTopic,setActiveTopic] = React.useState(null);
  const [editingName,setEditingName] = React.useState(false);
  const [newName,setNewName] = React.useState(subj.name);
  var bd = D?"#374151":"#e5e7eb";
  var bg = D?"#111827":"#f9fafb";
  var tx2 = D?"#f9fafb":"#111827";

  if(activeTopic){
    function saveTopicData(updated){
      var newSubj = {...subj,topics:subj.topics.map(function(t){return t.id===updated.id?updated:t;})};
      var newPs = personalSubjects.map(function(s){return s.id===subj.id?newSubj:s;});
      onSaveSubjects(newPs);
    }
    return <PersonalSectionScreen D={D} subj={subj} topic={activeTopic} user={user} onBack={function(){setActiveTopic(null);}} onSave={saveTopicData}/>;
  }

  function deleteSelf(){
    if(window.confirm("Delete subject "+subj.name+" and all its content? This cannot be undone."))
      onSaveSubjects(personalSubjects.filter(function(s){return s.id!==subj.id;}));
  }

  function deleteTopic(id){
    var newSubj = {...subj,topics:subj.topics.filter(function(t){return t.id!==id;})};
    onSaveSubjects(personalSubjects.map(function(s){return s.id===subj.id?newSubj:s;}));
  }

  return (
    <div style={{minHeight:"100vh",background:bg,color:tx2}} className="fade-in">
      <div style={{maxWidth:960,margin:"0 auto",padding:"32px 24px"}}>
        <button onClick={onBack} style={{fontSize:13,color:D?"#9ca3af":"#6b7280",background:"none",border:"none",cursor:"pointer",marginBottom:20}}>← My Subjects</button>
        <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:24,flexWrap:"wrap"}}>
          <div style={{width:56,height:56,borderRadius:16,background:subj.accent+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26}}>{subj.icon}</div>
          <div style={{flex:1,minWidth:0}}>
            {editingName?(
              <input autoFocus value={newName} onChange={function(e){setNewName(e.target.value);}}
                onBlur={function(){if(newName.trim()){var ns={...subj,name:newName.trim()};onSaveSubjects(personalSubjects.map(function(s){return s.id===subj.id?ns:s;}));}setEditingName(false);}}
                onKeyDown={function(e){if(e.key==="Enter"){if(newName.trim()){var ns={...subj,name:newName.trim()};onSaveSubjects(personalSubjects.map(function(s){return s.id===subj.id?ns:s;}));}setEditingName(false);}if(e.key==="Escape")setEditingName(false);}}
                style={{fontSize:20,fontWeight:700,border:"2px solid "+subj.accent,borderRadius:8,padding:"4px 10px",background:"transparent",color:tx2,width:"100%"}}/>
            ):(
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <h2 style={{fontSize:22,fontWeight:700,margin:0}}>{subj.name}</h2>
                <button onClick={function(){setEditingName(true);setNewName(subj.name);}} style={{background:"none",border:"1px solid #9ca3af",borderRadius:6,cursor:"pointer",fontSize:12,color:"#9ca3af",padding:"3px 8px"}}>✏️</button>
              </div>
            )}
            <p style={{fontSize:12,color:D?"#9ca3af":"#6b7280",margin:"4px 0 0"}}>Personal Subject · Only visible to you</p>
          </div>
          <button onClick={deleteSelf} style={{padding:"7px 14px",borderRadius:9,border:"1px solid #ef4444",background:"none",color:"#ef4444",fontWeight:600,fontSize:12,cursor:"pointer"}}>Delete Subject</button>
        </div>

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <h3 style={{fontSize:15,fontWeight:700,margin:0}}>Topics</h3>
          <button onClick={function(){setAddTopicOpen(true);}}
            style={{padding:"7px 16px",borderRadius:9,border:"none",background:subj.accent,color:"#fff",fontWeight:600,fontSize:13,cursor:"pointer"}}>＋ Add Topic</button>
        </div>

        {subj.topics.length===0&&<div style={{textAlign:"center",padding:"40px 0",color:D?"#9ca3af":"#6b7280",fontSize:13}}>No topics yet — add one above to get started.</div>}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:12}}>
          {subj.topics.map(function(t){return (
            <div key={t.id} style={{position:"relative"}}>
              <div role="button" tabIndex={0} onClick={function(){setActiveTopic(t);}}
                style={{padding:"14px 16px",borderRadius:12,border:"1.5px solid "+bd,background:"transparent",cursor:"pointer",textAlign:"left",transition:"all .15s",color:tx2}}
                onMouseEnter={function(e){e.currentTarget.style.borderColor=subj.accent;e.currentTarget.style.background=subj.accent+"12";}}
                onMouseLeave={function(e){e.currentTarget.style.borderColor=bd;e.currentTarget.style.background="transparent";}}>
                <div style={{fontWeight:600,fontSize:13,marginBottom:6,paddingRight:28}}>{t.title}</div>
                <div style={{display:"flex",gap:8}}>
                  <span style={{fontSize:11,color:D?"#9ca3af":"#6b7280"}}>📝 {(t.notes||[]).length}</span>
                  <span style={{fontSize:11,color:D?"#9ca3af":"#6b7280"}}>🃏 {(t.flashcards||[]).length}</span>
                </div>
              </div>
              <button onClick={function(){deleteTopic(t.id);}} style={{position:"absolute",top:6,right:6,background:"#fee2e2",border:"1.5px solid #ef4444",borderRadius:5,cursor:"pointer",fontSize:10,color:"#ef4444",padding:"2px 6px",fontWeight:700}}>✕</button>
            </div>
          );})}
        </div>

        {addTopicOpen&&<AddPersonalTopicModal D={D} onClose={function(){setAddTopicOpen(false);}} onSave={function(t){var newSubj={...subj,topics:[...subj.topics,t]};onSaveSubjects(personalSubjects.map(function(s){return s.id===subj.id?newSubj:s;}));setAddTopicOpen(false);}}/>}
      </div>
    </div>
  );
}

/* ─── CONTACT / INBOX SCREEN ─────────────────────────────────────────────── */
var SK_MSGS = "gcse:contact-msgs";

function ContactScreen({D, user, isAdmin, onBack}) {
  var [tab, setTab] = useState(isAdmin ? "inbox" : "send");
  var [year, setYear] = useState("");
  var [msg, setMsg] = useState("");
  var [sent, setSent] = useState(false);
  var [sending, setSending] = useState(false);
  var [msgs, setMsgs] = useState([]);
  var [replyText, setReplyText] = useState({});
  var [replyingSending, setRS] = useState({});
  var bd = D ? "#1f2937" : "#e5e7eb";

  useEffect(function(){
    loadMsgs();
  },[]);

  function loadMsgs(){
    window.storage.get(SK_MSGS, true).then(function(r){
      try{ if(r&&r.value){var arr=JSON.parse(r.value);if(Array.isArray(arr))setMsgs(arr);} }catch(e){}
    }).catch(function(){}); // key simply doesn't exist yet — that's fine
  }

  function handleSend(){
    if(!msg.trim()) return;
    setSending(true);
    var newEntry = {
      id: Math.random().toString(36).slice(2,9),
      from: user,
      name: user,
      yearGroup: year,
      message: msg.trim(),
      timestamp: Date.now(),
      thread: []
    };
    // Read existing messages, then prepend and write back. Handle missing key gracefully.
    var doWrite = function(existing){
      var arr = [newEntry].concat(existing);
      window.storage.set(SK_MSGS, JSON.stringify(arr), true).then(function(){
        setMsgs(arr); setMsg(""); setSent(true); setSending(false);
      }).catch(function(e){ setSending(false); });
    };
    window.storage.get(SK_MSGS, true).then(function(r){
      var existing = [];
      try{ if(r&&r.value){ var p=JSON.parse(r.value); if(Array.isArray(p)) existing=p; } }catch(e){}
      doWrite(existing);
    }).catch(function(){ doWrite([]); });
  }

  function handleReply(msgId){
    var txt = (replyText[msgId]||"").trim();
    if(!txt) return;
    setRS(function(p){return Object.assign({},p,{[msgId]:true});});
    var doWrite = function(existing){
      var updated = existing.map(function(m){
        if(m.id!==msgId) return m;
        return Object.assign({},m,{thread:(m.thread||[]).concat([{from:user,text:txt,timestamp:Date.now()}])});
      });
      window.storage.set(SK_MSGS, JSON.stringify(updated), true).then(function(){
        setMsgs(updated);
        setReplyText(function(p){return Object.assign({},p,{[msgId]:""});});
        setRS(function(p){return Object.assign({},p,{[msgId]:false});});
      }).catch(function(){ setRS(function(p){return Object.assign({},p,{[msgId]:false});}); });
    };
    window.storage.get(SK_MSGS, true).then(function(r){
      var existing=[];
      try{ if(r&&r.value){var p=JSON.parse(r.value);if(Array.isArray(p))existing=p;} }catch(e){}
      doWrite(existing);
    }).catch(function(){ doWrite(msgs); });
  }

  function handleDeleteMsg(msgId){
    var doWrite = function(existing){
      var updated = existing.filter(function(m){ return m.id!==msgId; });
      window.storage.set(SK_MSGS, JSON.stringify(updated), true).then(function(){
        setMsgs(updated);
      }).catch(function(){});
    };
    window.storage.get(SK_MSGS, true).then(function(r){
      var existing=[];
      try{ if(r&&r.value){var p=JSON.parse(r.value);if(Array.isArray(p))existing=p;} }catch(e){}
      doWrite(existing);
    }).catch(function(){ doWrite(msgs); });
  }

  var myMsgs = msgs.filter(function(m){return m.from===user||m.name===user;});
  var bg = D ? "#111827" : "#f9fafb";

  return (
    <div style={{minHeight:"100vh",background:bg,color:D?"#f9fafb":"#111827"}} className="fade-in">
      <div style={{maxWidth:700,margin:"0 auto",padding:"32px 24px"}}>
        <button onClick={onBack} style={{fontSize:13,color:D?"#9ca3af":"#6b7280",background:"none",border:"none",cursor:"pointer",marginBottom:20}}>← Back</button>
        <h2 style={{fontSize:22,fontWeight:700,marginBottom:6}}>✉️ Contact Us</h2>
        <p style={{fontSize:13,color:D?"#9ca3af":"#6b7280",marginBottom:20}}>Got a question, issue or suggestion? Send us a message below.</p>

        {isAdmin && (
          <div style={{display:"flex",gap:8,marginBottom:20}}>
            {["send","inbox"].map(function(t){return (
              <button key={t} onClick={function(){setTab(t);}}
                style={{padding:"7px 18px",borderRadius:8,border:"1.5px solid "+(tab===t?"#6366f1":bd),background:tab===t?"#6366f1":"none",color:tab===t?"#fff":(D?"#d1d5db":"#374151"),fontWeight:600,fontSize:13,cursor:"pointer"}}>
                {t==="send"?"Send Message":"📥 Inbox ("+msgs.length+")"}
              </button>
            );})}
          </div>
        )}

        {tab==="send" && (
          <div style={{background:D?"#1f2937":"#fff",border:"1px solid "+bd,borderRadius:14,padding:24}}>
            {sent ? (
              <div style={{textAlign:"center",padding:"32px 0"}}>
                <div style={{fontSize:40,marginBottom:12}}>✅</div>
                <div style={{fontWeight:700,fontSize:16,marginBottom:6}}>Message sent!</div>
                <div style={{fontSize:13,color:D?"#9ca3af":"#6b7280",marginBottom:20}}>We'll get back to you as soon as possible.</div>
                <button onClick={function(){setSent(false);setMsg("");}}
                  style={{padding:"8px 20px",borderRadius:8,border:"none",background:"#6366f1",color:"#fff",fontWeight:600,fontSize:13,cursor:"pointer"}}>Send another</button>
              </div>
            ) : (
              <div>
                <div style={{marginBottom:14}}>
                  <label style={{fontSize:11,fontWeight:700,color:D?"#9ca3af":"#6b7280",display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.05em"}}>Year group <span style={{fontWeight:400,textTransform:"none"}}>(optional)</span></label>
                  <input value={year} onChange={function(e){setYear(e.target.value);}}
                    placeholder="e.g. Year 11"
                    style={{width:"100%",padding:"9px 12px",borderRadius:8,border:"1px solid "+bd,background:D?"#111827":"#f9fafb",color:D?"#f9fafb":"#111827",fontSize:13}}/>
                </div>
                <div style={{marginBottom:18}}>
                  <label style={{fontSize:11,fontWeight:700,color:D?"#9ca3af":"#6b7280",display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.05em"}}>Message *</label>
                  <textarea value={msg} onChange={function(e){setMsg(e.target.value);}}
                    rows={5} placeholder="Write your message here..."
                    style={{width:"100%",padding:"9px 12px",borderRadius:8,border:"1px solid "+bd,background:D?"#111827":"#f9fafb",color:D?"#f9fafb":"#111827",fontSize:13,resize:"vertical"}}/>
                </div>
                <button onClick={handleSend} disabled={sending||!msg.trim()}
                  style={{padding:"10px 24px",borderRadius:8,border:"none",background:!msg.trim()?"#9ca3af":"#6366f1",color:"#fff",fontWeight:700,fontSize:14,cursor:(!msg.trim()||!name.trim())?"not-allowed":"pointer"}}>
                  {sending?"Sending…":"Send Message"}
                </button>
              </div>
            )}
          </div>
        )}

        {tab==="inbox" && isAdmin && (
          <div>
            {msgs.length===0 && <p style={{color:D?"#9ca3af":"#6b7280",fontSize:13}}>No messages yet.</p>}
            {msgs.map(function(m){return (
              <div key={m.id} style={{background:D?"#1f2937":"#fff",border:"1px solid "+bd,borderRadius:14,padding:20,marginBottom:14}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                  <div>
                    <span style={{fontWeight:700,fontSize:14}}>{m.name}</span>
                    {m.yearGroup&&<span style={{fontSize:12,color:D?"#9ca3af":"#6b7280",marginLeft:8}}>{m.yearGroup}</span>}
                    <span style={{fontSize:11,color:D?"#6b7280":"#9ca3af",marginLeft:8}}>@{m.from}</span>
                  </div>
                  <span style={{fontSize:11,color:D?"#6b7280":"#9ca3af"}}>{new Date(m.timestamp).toLocaleDateString("en-GB",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</span>
                </div>
                <p style={{fontSize:13,lineHeight:1.6,marginBottom:12,whiteSpace:"pre-wrap"}}>{m.message}</p>
                {(m.thread||[]).map(function(r,ri){return (
                  <div key={ri} style={{borderLeft:"3px solid #6366f1",paddingLeft:12,marginBottom:8,marginLeft:8}}>
                    <div style={{fontSize:11,fontWeight:700,color:"#6366f1",marginBottom:3}}>{r.from} · {new Date(r.timestamp).toLocaleDateString("en-GB",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</div>
                    <p style={{fontSize:13,lineHeight:1.6,whiteSpace:"pre-wrap"}}>{r.text}</p>
                  </div>
                );})}
                <div style={{display:"flex",gap:8,marginTop:8}}>
                  <textarea value={replyText[m.id]||""} onChange={function(e){var v=e.target.value;setReplyText(function(p){return Object.assign({},p,{[m.id]:v});});}}
                    rows={2} placeholder="Reply…"
                    style={{flex:1,padding:"7px 10px",borderRadius:8,border:"1px solid "+bd,background:D?"#111827":"#f9fafb",color:D?"#f9fafb":"#111827",fontSize:12,resize:"none"}}/>
                  <button onClick={function(){handleReply(m.id);}} disabled={!!(replyingSending[m.id]||!(replyText[m.id]||"").trim())}
                    style={{padding:"0 16px",borderRadius:8,border:"none",background:"#6366f1",color:"#fff",fontWeight:600,fontSize:12,cursor:"pointer",alignSelf:"flex-end",height:36}}>
                    {replyingSending[m.id]?"…":"Reply"}
                  </button>
                  <button onClick={function(){if(window.confirm("Delete this message?"))handleDeleteMsg(m.id);}}
                    style={{padding:"0 14px",borderRadius:8,border:"1px solid #ef4444",background:"none",color:"#ef4444",fontWeight:600,fontSize:12,cursor:"pointer",alignSelf:"flex-end",height:36}}>
                    🗑
                  </button>
                </div>
              </div>
            );})}
          </div>
        )}

        {!isAdmin && myMsgs.length>0 && (
          <div style={{marginTop:28}}>
            <h3 style={{fontSize:15,fontWeight:700,marginBottom:14}}>Your messages</h3>
            {myMsgs.map(function(m){return (
              <div key={m.id} style={{background:D?"#1f2937":"#fff",border:"1px solid "+bd,borderRadius:12,padding:18,marginBottom:12}}>
                <p style={{fontSize:13,lineHeight:1.6,marginBottom:m.thread&&m.thread.length?10:0,whiteSpace:"pre-wrap"}}>{m.message}</p>
                {(m.thread||[]).map(function(r,ri){return (
                  <div key={ri} style={{borderLeft:"3px solid #10b981",paddingLeft:12,marginTop:8}}>
                    <div style={{fontSize:11,fontWeight:700,color:"#10b981",marginBottom:3}}>Reply from {r.from}</div>
                    <p style={{fontSize:13,lineHeight:1.6,whiteSpace:"pre-wrap"}}>{r.text}</p>
                  </div>
                );})}
              </div>
            );})}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── GLOBAL OVERLAYS ────────────────────────────────────────────────────── */
function GlobalOverlays({D,online,shortcutModal,setShortcutModal,searchOpen,setSearchOpen,onboarding,handleOnboardingComplete,subjects,allSections,boardData,boardSels,handleSearchNavigate,screen,onHome,onMock,onTutor,onTimetable,onDash,onLeaderboards,streak}) {
  const isMobile=typeof window!=="undefined"&&window.innerWidth<640;
  const content=(
    <>
      {!online&&<OfflineBanner/>}
      {shortcutModal&&<ShortcutModal D={D} onClose={()=>setShortcutModal(false)}/>}
      {searchOpen&&<SearchModal D={D} subjects={subjects} allSections={allSections} boardData={boardData} boardSels={boardSels} onNavigate={handleSearchNavigate} onClose={()=>setSearchOpen(false)}/>}
      {onboarding&&<OnboardingWizard D={D} onComplete={handleOnboardingComplete}/>}
      {isMobile&&!["login"].includes(screen)&&<MobileNav D={D} screen={screen} onHome={onHome} onMock={onMock} onTutor={onTutor} onTimetable={onTimetable} onDash={onDash} onLeaderboards={onLeaderboards} streak={streak}/>}
    </>
  );
  return content;
}

/* ─── SECTION COMPLETION DOT ─────────────────────────────────────────────── */
function getSectionDot(sec, fcHist, stats) {
  const cards = sec.flashcards||[];
  const qs = sec.questions||[];
  if(cards.length===0&&qs.length===0) return null;
  const qStats = stats&&stats.weakQ&&stats.weakQ[sec.id];
  const qAttempted = qStats&&qStats.total>0;
  const qPct = qAttempted ? Math.round(((qStats.total-qStats.wrong)/qStats.total)*100) : 0;
  const reviewedCards = cards.filter(c=>fcHist&&fcHist[c.id]!==undefined);
  const dueCards = cards.filter(c=>{if(!fcHist||!fcHist[c.id])return true;const s=fcHist[c.id];return !s||Date.now()>=s.due;});
  const anyReviewed = reviewedCards.length>0;
  const allMastered = cards.length>0&&dueCards.length===0&&reviewedCards.length===cards.length;
  const fcGreen = cards.length===0||allMastered;
  const qGreen = qs.length===0||(qAttempted&&qPct>=70);
  if(fcGreen&&qGreen&&(anyReviewed||qAttempted)) return "#10b981";
  if(!anyReviewed&&!qAttempted) return "#ef4444";
  return "#f59e0b";
}

export default function App() {
  const [user,setUser]       = useState("");
  const [userSchool,setUserSchool] = useState("");
  const [userDisplayName,setUserDisplayName] = useState("");
  const [nameIn,setNameIn]   = useState("");
  const [passIn,setPassIn]   = useState("");
  const [schoolIn,setSchIn]  = useState("");
  const [displayNameIn,setDNIn] = useState("");
  const [authMode,setAM]     = useState("login");
  const [authErr,setAuthE]   = useState("");
  const [accounts,setAccs]   = useState({});
  const [showPass,setShowPass]= useState(false);
  const [userGoogleKey,setGK]= useState("");
  const [screen,setScreen]   = useState("login");
  const [D,setD]             = useState(false);
  const [ready,setReady]     = useState(false);
  const [online,setOnline]   = useState(typeof navigator!=="undefined"?navigator.onLine:true);
  const [searchOpen,setSearchOpen] = useState(false);
  const [shortcutModal,setShortcutModal] = useState(false);
  const [onboarding,setOnboarding] = useState(null);

  const [boardData,setBoardData]   = useState({});
  const [boardSels,setBoardSels]   = useState({});

  const [subIdx,setSubIdx]   = useState(null);
  const [topIdx,setTopIdx]   = useState(null);
  const [secId,setSecId]     = useState(null);
  const [tab,setTab]         = useState("notes");
  const [subjTab,setSubjTab] = useState("sections");

  const [fcIdx,setFcIdx]     = useState(0);
  const [flip,setFlip]       = useState(false);
  const [cramMode,setCramMode] = useState(false);
  const [importOpen,setImportOpen] = useState(false);
  const [manageAccountsOpen,setManageAccountsOpen] = useState(false);
  // Personal subjects — private to each user, not shared
  const [personalSubjects,setPersonalSubjects] = useState([]);
  const [personalScreen,setPersonalScreen] = useState(null); // null | {subjId} | {subjId,secId}
  const [createPersonalOpen,setCreatePersonalOpen] = useState(false);
  const [fcHist,setFCH]      = useState({});

  const [qIdx,setQIdx]       = useState(0);
  const [selOpt,setSelOpt]   = useState(null);
  const [textAns,setTA]      = useState("");
  const [qRes,setQRes]       = useState(null);
  const [marking,setMark]    = useState(false);
  const [showMdl,setSmMdl]   = useState(false);

  const [stats,setStats]     = useState({fcC:0,fcT:0,qS:0,qM:0,weakQ:{},weakFC:{},subjStats:{}});
  const [targetGrades,setTargetGrades] = useState({});

  const [activityDates,setAD] = useState(new Set());
  const [activityCounts,setAC] = useState({});
  const [gradeSnapshots,setGS] = useState([]);
  const [streakPop,setStreakPop] = useState(false);

  const [modal,setModal]     = useState(null);
  const [editingTitle,setEditingTitle] = useState(null); // {id, parentId?, value}
  const [ttSubj,setTTSubj]   = useState(null);
  const [ttItems,setTTI]     = useState([]);
  const [ttIdx,setTTIdx]     = useState(0);
  const [ttRes,setTTRes]     = useState(null);
  const [ttSelOpt,setTTSO]   = useState(null);
  const [ttTextAns,setTTTA]  = useState("");
  const [ttMarking,setTTMk]  = useState(false);

  const [blurtSubjId,setBlurtSubjId] = useState(null);
  const [blurtSecId2,setBlurtSecId2] = useState(null);
  const [tutorSubjId,setTutorSubjId] = useState(null);
  const [timetableExams,setTimetableExams] = useState([]);

  const subjects  = ALL_SUBJECTS;
  const admin     = isAdmin(user);
  const subjDef   = subIdx!=null ? subjects[subIdx] : null;
  const curBoard  = subjDef ? (boardSels[subjDef.id]||DEFAULT_BOARD) : DEFAULT_BOARD;
  const curBKey   = subjDef ? `${subjDef.id}:${curBoard}` : null;
  const curBData  = (curBKey&&boardData[curBKey])||{custom:[],extras:{},papers:[]};
  const curTopics = subjDef ? mergeTopics(subjDef.topics||[], curBData.custom, curBData.extras) : [];
  const curTopic  = topIdx!=null ? curTopics[topIdx] : null;
  const section   = curTopic ? curTopic.sections.find(s=>s.id===secId) : null;

  const streak = calcStreak(activityDates);

  const allSections = subjects.flatMap(s => {
    const b = boardSels[s.id]||DEFAULT_BOARD;
    const bd = boardData[`${s.id}:${b}`]||{custom:[],extras:{},papers:[]};
    const merged = mergeTopics(s.topics||[], bd.custom, bd.extras);
    return merged.flatMap(t => t.sections.map(sec => ({...sec, subjectId:s.id})));
  });

  const getBD = (sId,b) => boardData[`${sId}:${b}`]||{custom:[],extras:{},papers:[]};
  const boardLoadedRef = useRef({});

  const ensureBoardLoaded = useCallback(async(sId,b) => {
    const key=`${sId}:${b}`;
    if (boardLoadedRef.current[key]) return;
    boardLoadedRef.current[key]=true;
    const [rc,re,rp] = await Promise.allSettled([
      window.storage.get(SK.CUSTOM(sId,b),true),
      window.storage.get(SK.EXTRAS(sId,b),true),
      window.storage.get(SK.PAPERS(sId,b),true),
    ]);
    setBoardData(bd=>({...bd,[key]:{
      custom: rc.status==="fulfilled"&&rc.value?.value ? JSON.parse(rc.value.value) : [],
      extras: re.status==="fulfilled"&&re.value?.value ? JSON.parse(re.value.value) : {},
      papers: rp.status==="fulfilled"&&rp.value?.value ? JSON.parse(rp.value.value) : [],
    }}));
  },[]);

  const ensureAllBoardsLoaded = useCallback(async(savedBoardSels={}) => {
    // Load default board for all subjects + any non-default saved board selections
    const toLoad = subjects.flatMap(s => {
      const boards = new Set([DEFAULT_BOARD]);
      const saved = savedBoardSels[s.id];
      if(saved) boards.add(saved);
      return [...boards].map(b => ({sId:s.id, b}));
    });
    await Promise.all(toLoad.map(({sId,b}) => ensureBoardLoaded(sId,b)));
  }, [ensureBoardLoaded]);

  const saveBD = (sId,b,patch) => {
    const key=`${sId}:${b}`;
    setBoardData(prev=>{
      const cur=prev[key]||{custom:[],extras:{},papers:[]};
      const next={...cur,...patch};
      if(patch.custom!==undefined) window.storage.set(SK.CUSTOM(sId,b),JSON.stringify(next.custom),true).catch(()=>{});
      if(patch.extras!==undefined) window.storage.set(SK.EXTRAS(sId,b),JSON.stringify(next.extras),true).catch(()=>{});
      if(patch.papers!==undefined) window.storage.set(SK.PAPERS(sId,b),JSON.stringify(next.papers),true).catch(()=>{});
      return{...prev,[key]:next};
    });
  };

  useEffect(()=>{
    (async()=>{
      let accs={};
      try{const r=await window.storage.get(SK.ACCOUNTS,true);if(r?.value)accs=JSON.parse(r.value);}catch(_){}
      // Always ensure admin account exists with correct credentials
      accs={...accs,[ADMIN_USER]:{h:ADMIN_PASS_HASH,gki:0}};
      try{await window.storage.set(SK.ACCOUNTS,JSON.stringify(accs),true);}catch(_){}
      // Ensure admin has Gordon's School in leaderboard
      try{
        const lbKey=`gcse:lb:${ADMIN_USER.replace(/\W/g,"-")}`;
        const prev=await window.storage.get(lbKey,true);
        const existing=prev?.value?JSON.parse(prev.value):{};
        if(existing.school!==ADMIN_SCHOOL){
          await window.storage.set(lbKey,JSON.stringify({...existing,username:ADMIN_USER,school:ADMIN_SCHOOL,score:existing.score||0}),true);
        }
      }catch(_){}
      setAccs(accs); setReady(true);
    })();
  },[]);

  useEffect(()=>{
    if(!user||!ready)return;
    (async()=>{
      let savedSels={};
      try{
        const r=await window.storage.get(SK.PROG(user),true);
        if(r?.value){
          const p=JSON.parse(r.value);
          if(p.fcHist)  setFCH(p.fcHist);
          if(p.stats)   setStats({fcC:0,fcT:0,qS:0,qM:0,weakQ:{},weakFC:{},subjStats:{},...p.stats});
          if(p.targetGrades) setTargetGrades(p.targetGrades);
          if(p.activityDates) setAD(new Set(p.activityDates));
          if(p.activityCounts) setAC(p.activityCounts);
          if(p.gradeSnapshots) setGS(p.gradeSnapshots);
          if(p.boardSels){setBoardSels(p.boardSels);savedSels=p.boardSels;}
        } else {
          // New user — trigger onboarding
          if(!isAdmin(user)) setOnboarding({step:1,board:"AQA"});
        }
      }catch(_){}
      // Also load timetable exams for the Today widget
      try{
        const tr=await window.storage.get(SK.TIMETABLE(user));
        if(tr?.value){const td=JSON.parse(tr.value);if(td.exams&&Array.isArray(td.exams))setTimetableExams(td.exams);}
      }catch(_){}
      await ensureAllBoardsLoaded(savedSels);
      // Load personal subjects (private to this user)
      try{
        const pr=await window.storage.get(SK_PERSONAL(user),false);
        if(pr?.value){var ps=JSON.parse(pr.value);if(Array.isArray(ps))setPersonalSubjects(ps);}
      }catch(_){}
    })();
  },[user,ready]);

  // Online/offline detection
  useEffect(()=>{
    const go=()=>setOnline(true);
    const goff=()=>setOnline(false);
    window.addEventListener("online",go);
    window.addEventListener("offline",goff);
    return()=>{window.removeEventListener("online",go);window.removeEventListener("offline",goff);};
  },[]);

  const markTodayActive = useCallback(()=>{
    const today=todayStr();
    setAD(prev=>{
      if(prev.has(today)) return prev;
      const next=new Set(prev); next.add(today);
      setStreakPop(true); setTimeout(()=>setStreakPop(false),400);
      return next;
    });
    // Always increment count (for heatmap intensity)
    setAC(prev=>({...prev,[today]:(prev[today]||0)+1}));
  },[]);

  const saveAccounts = async n => { try{await window.storage.set(SK.ACCOUNTS,JSON.stringify(n),true);}catch(_){} };
  const savePersonalSubjects = (ps) => {
    if(!user) return;
    setPersonalSubjects(ps);
    window.storage.set(SK_PERSONAL(user),JSON.stringify(ps),false).catch(()=>{});
  };
  // Global keyboard shortcuts
  useEffect(()=>{
    const handler=(e)=>{
      const tag=document.activeElement?.tagName;
      const typing=["INPUT","TEXTAREA","SELECT"].includes(tag)||document.activeElement?.contentEditable==="true";
      // Cmd+K / Ctrl+K => search
      if((e.metaKey||e.ctrlKey)&&e.key==="k"){e.preventDefault();setSearchOpen(true);return;}
      if(typing)return;
      // ? => shortcut reference
      if(e.key==="?"){setShortcutModal(s=>!s);return;}
      // Section screen shortcuts
      if(screen==="section"){
        if(tab==="flashcards"){
          if(e.key==="f"||e.key==="F"){e.preventDefault();setFlip(v=>!v);return;}
          if(e.key==="ArrowRight"||e.key==="n"||e.key==="N"){e.preventDefault();setFlip(false);setFcIdx(i=>{const cards=section?.flashcards||[];return cards.length>0?(i<cards.length-1?i+1:0):0;});return;}
          if(e.key==="ArrowLeft"||e.key==="p"||e.key==="P"){e.preventDefault();setFlip(false);setFcIdx(i=>{const cards=section?.flashcards||[];return cards.length>0?(i>0?i-1:cards.length-1):0;});return;}
          // 1-4 for SM2 rating (only after flip)
          if(flip&&["1","2","3","4"].includes(e.key)){
            e.preventDefault();
            const q=[0,1,2,3][parseInt(e.key)-1];
            if(section?.flashcards?.length>0){
              const cardId=section.flashcards[Math.min(fcIdx,section.flashcards.length-1)]?.id;
              if(cardId){
                setFCH(prevHist=>{const prevState=getCardState(prevHist,cardId);const next=sm2Next(prevState,q);return{...prevHist,[cardId]:next};});
                const correct=q>=2;
                setStats(s=>{const wfc={...s.weakFC};wfc[secId]={wrong:(wfc[secId]?.wrong||0)+(correct?0:1),total:(wfc[secId]?.total||0)+1};const ss={...s.subjStats};const si=subIdx;const sId=si!=null?subjects[si]?.id:null;if(sId)ss[sId]={...ss[sId],fcC:(ss[sId]?.fcC||0)+(correct?1:0),fcT:(ss[sId]?.fcT||0)+1};return{...s,fcC:s.fcC+(correct?1:0),fcT:s.fcT+1,weakFC:wfc,subjStats:ss};});
                markTodayActive();setFlip(false);setFcIdx(i=>{const cards=section.flashcards||[];return i<cards.length-1?i+1:0;});
              }
            }
            return;
          }
        }
        if(tab==="questions"){
          if(e.key==="ArrowRight"||e.key==="n"||e.key==="N"){e.preventDefault();setQIdx(i=>{const qs=section?.questions||[];return qs.length>0?(i<qs.length-1?i+1:0):0;});setQRes(null);setSelOpt(null);setTA("");return;}
          if(e.key==="ArrowLeft"||e.key==="p"||e.key==="P"){e.preventDefault();setQIdx(i=>{const qs=section?.questions||[];return qs.length>0?(i>0?i-1:qs.length-1):0;});setQRes(null);setSelOpt(null);setTA("");return;}
        }
      }
    };
    window.addEventListener("keydown",handler);
    return()=>window.removeEventListener("keydown",handler);
  },[screen,tab,flip,fcIdx,qIdx,secId,subIdx,section,subjects,markTodayActive]);

  const saveTimer=useRef(null);
  useEffect(()=>{
    if(!user)return;
    clearTimeout(saveTimer.current);
    saveTimer.current=setTimeout(async()=>{
      // Take a grade snapshot (at most one per day)
      const today=todayStr();
      const grades={};
      ALL_SUBJECTS.forEach(function(s){
        const ss=stats.subjStats&&stats.subjStats[s.id];
        if(ss&&ss.qM>0) grades[s.id]=Math.round((ss.qS/ss.qM)*100);
      });
      const hasAnyGrade=Object.keys(grades).length>0;
      setGS(function(prev){
        if(!hasAnyGrade) return prev;
        const filtered=prev.filter(function(s){return s.date!==today;});
        const next=[...filtered,{date:today,grades:grades}].slice(-30);
        return next;
      });
      // Save — we read gradeSnapshots via functional update so use a ref approach
      try{
        const r=await window.storage.get(SK.PROG(user),true);
        const existing=r?.value?JSON.parse(r.value):{};
        const existingSnaps=existing.gradeSnapshots||[];
        const filteredSnaps=existingSnaps.filter(function(s){return s.date!==today;});
        const newSnaps=hasAnyGrade?[...filteredSnaps,{date:today,grades:grades}].slice(-30):filteredSnaps;
        await window.storage.set(SK.PROG(user),JSON.stringify({
          ...existing,
          fcHist,stats,targetGrades,
          activityDates:[...activityDates],
          activityCounts,
          boardSels,
          gradeSnapshots:newSnaps
        }),true);
      }catch(_){}
      if(user){
        const lbKey="gcse:lb:"+user.replace(/\W/g,"-");
        const streakVal=calcStreak(activityDates);
        const score=streakVal*10+activityDates.size*3+(stats.qS||0);
        try{
          const prev=await window.storage.get(lbKey,true);
          const existing=prev?.value?JSON.parse(prev.value):{};
          await window.storage.set(lbKey,JSON.stringify({...existing,username:user,displayName:userDisplayName||existing.displayName||getDisplayName(user),score}),true);
        }catch(_){}
      }
    },600);
    return ()=>clearTimeout(saveTimer.current);
  },[user,userDisplayName,fcHist,stats,targetGrades,activityDates,activityCounts,boardSels]);

  const handleOnboardingComplete = useCallback(async(board, examDate) => {
    setOnboarding(null);
    // Apply board to all subjects
    const newSels = {};
    subjects.forEach(s=>{ newSels[s.id]=board; });
    setBoardSels(newSels);
    await Promise.all(subjects.map(s=>ensureBoardLoaded(s.id,board)));
    // Save board selections
    try{
      const prog = await window.storage.get(SK.PROG(user),true);
      const existing = prog&&prog.value ? JSON.parse(prog.value) : {};
      await window.storage.set(SK.PROG(user), JSON.stringify({...existing, boardSels:newSels}),true);
    }catch(_){}
    // Add exam date to timetable if provided
    if(examDate){
      try{
        const r=await window.storage.get(SK.TIMETABLE(user));
        const tt=r&&r.value?JSON.parse(r.value):[];
        const newEntry={id:"onb-"+Date.now(),type:"exam",title:"Main Exams",date:examDate,subjectId:null};
        await window.storage.set(SK.TIMETABLE(user),JSON.stringify([...tt,newEntry]));
      }catch(_){}
    }
  },[user,subjects,ensureBoardLoaded]);

  const handleSearchNavigate = useCallback((result) => {
    const {subj, sec, tab:secTab} = result;
    if(!subj||!sec) return;
    const si = subjects.findIndex(s=>s.id===subj.id);
    if(si<0) return;
    setSubIdx(si);
    const b = boardSels[subj.id]||DEFAULT_BOARD;
    ensureBoardLoaded(subj.id, b).then(()=>{
      const bd = boardData[subj.id+":"+b]||{custom:[],extras:{},papers:[]};
      const merged = mergeTopics(subj.topics||[], bd.custom, bd.extras);
      const ti = merged.findIndex(t=>t.sections.some(s=>s.id===sec.id));
      if(ti<0) return;
      setTopIdx(ti);
      setSecId(sec.id);
      setTab(secTab||"notes");
      setFcIdx(0); setFlip(false); setQIdx(0); setQRes(null); setSelOpt(null); setTA("");
      setSubjTab("sections");
      setScreen("section");
    });
  },[subjects,boardSels,boardData,ensureBoardLoaded]);


  const findCustomOwner = (custom, sectionId) => {
    const top = (custom||[]).find(cs=>cs.id===sectionId);
    if(top) return {type:"top", cs:top};
    for(const cs of (custom||[])){
      const st=(cs.subtopics||[]).find(s=>s.id===sectionId);
      if(st) return {type:"sub", cs, st};
    }
    return null;
  };

  const addToSection = (sectionId,key,item) => {
    if(!subjDef)return;
    const sId=subjDef.id, b=curBoard;
    setBoardData(prev=>{
      const cur=prev[`${sId}:${b}`]||{custom:[],extras:{},papers:[]};
      const owner=findCustomOwner(cur.custom,sectionId);
      let next;
      if(owner?.type==="top"){
        next={...cur,custom:cur.custom.map(cs=>cs.id!==sectionId?cs:{...cs,[key]:[...(cs[key]||[]),item]})};
        window.storage.set(SK.CUSTOM(sId,b),JSON.stringify(next.custom),true).catch(()=>{});
      } else if(owner?.type==="sub"){
        next={...cur,custom:cur.custom.map(cs=>cs.id!==owner.cs.id?cs:{...cs,subtopics:(cs.subtopics||[]).map(st=>st.id!==sectionId?st:{...st,[key]:[...(st[key]||[]),item]})})};
        window.storage.set(SK.CUSTOM(sId,b),JSON.stringify(next.custom),true).catch(()=>{});
      } else {
        const ne={...cur.extras,[sectionId]:{...cur.extras[sectionId],[key]:[...(cur.extras[sectionId]?.[key]||[]),item]}};
        next={...cur,extras:ne};window.storage.set(SK.EXTRAS(sId,b),JSON.stringify(ne),true).catch(()=>{});
      }
      return{...prev,[`${sId}:${b}`]:next};
    });
    setModal(null);
  };

  const editInSection = (sectionId,key,item) => {
    if(!subjDef)return;
    const sId=subjDef.id, b=curBoard;
    setBoardData(prev=>{
      const cur=prev[`${sId}:${b}`]||{custom:[],extras:{},papers:[]};
      const owner=findCustomOwner(cur.custom,sectionId);
      let next;
      if(owner?.type==="top"){
        next={...cur,custom:cur.custom.map(cs=>cs.id!==sectionId?cs:{...cs,[key]:(cs[key]||[]).map(x=>x.id===item.id?item:x)})};
        window.storage.set(SK.CUSTOM(sId,b),JSON.stringify(next.custom),true).catch(()=>{});
      } else if(owner?.type==="sub"){
        next={...cur,custom:cur.custom.map(cs=>cs.id!==owner.cs.id?cs:{...cs,subtopics:(cs.subtopics||[]).map(st=>st.id!==sectionId?st:{...st,[key]:(st[key]||[]).map(x=>x.id===item.id?item:x)})})};
        window.storage.set(SK.CUSTOM(sId,b),JSON.stringify(next.custom),true).catch(()=>{});
      } else {
        const ne={...cur.extras,[sectionId]:{...cur.extras[sectionId],[key]:(cur.extras[sectionId]?.[key]||[]).map(x=>x.id===item.id?item:x)}};
        next={...cur,extras:ne};window.storage.set(SK.EXTRAS(sId,b),JSON.stringify(ne),true).catch(()=>{});
      }
      return{...prev,[`${sId}:${b}`]:next};
    });
    setModal(null);
  };

  const removeExtra = (sectionId,key,itemId) => {
    const sId=subjDef.id, b=curBoard;
    setBoardData(prev=>{
      const cur=prev[`${sId}:${b}`]||{custom:[],extras:{},papers:[]};
      const owner=findCustomOwner(cur.custom,sectionId);
      let next;
      if(owner?.type==="top"){
        next={...cur,custom:cur.custom.map(cs=>cs.id!==sectionId?cs:{...cs,[key]:(cs[key]||[]).filter(x=>x.id!==itemId)})};
        window.storage.set(SK.CUSTOM(sId,b),JSON.stringify(next.custom),true).catch(()=>{});
      } else if(owner?.type==="sub"){
        next={...cur,custom:cur.custom.map(cs=>cs.id!==owner.cs.id?cs:{...cs,subtopics:(cs.subtopics||[]).map(st=>st.id!==sectionId?st:{...st,[key]:(st[key]||[]).filter(x=>x.id!==itemId)})})};
        window.storage.set(SK.CUSTOM(sId,b),JSON.stringify(next.custom),true).catch(()=>{});
      } else {
        const ne={...cur.extras,[sectionId]:{...cur.extras[sectionId],[key]:(cur.extras[sectionId]?.[key]||[]).filter(x=>x.id!==itemId)}};
        next={...cur,extras:ne};window.storage.set(SK.EXTRAS(sId,b),JSON.stringify(ne),true).catch(()=>{});
      }
      return{...prev,[`${sId}:${b}`]:next};
    });
  };

  const addCustomSection = sec => {
    const sId=sec.subjectId||subjDef?.id; if(!sId)return;
    const b=boardSels[sId]||DEFAULT_BOARD;
    const cur=getBD(sId,b);
    saveBD(sId,b,{custom:[...cur.custom,{...sec,subtopics:sec.subtopics||[]}]});
    setModal(null);
  };

  const addSubtopic = (parentTopicId, subtopic) => {
    if(!subjDef)return;
    const sId=subjDef.id, b=curBoard;
    setBoardData(prev=>{
      const cur=prev[`${sId}:${b}`]||{custom:[],extras:{},papers:[]};
      const next={...cur,custom:cur.custom.map(cs=>cs.id!==parentTopicId?cs:{...cs,subtopics:[...(cs.subtopics||[]),subtopic]})};
      window.storage.set(SK.CUSTOM(sId,b),JSON.stringify(next.custom),true).catch(()=>{});
      return{...prev,[`${sId}:${b}`]:next};
    });
    setModal(null);
  };

  const deleteSubtopic = (parentTopicId, subtopicId) => {
    if(!subjDef)return;
    const sId=subjDef.id, b=curBoard;
    setBoardData(prev=>{
      const cur=prev[`${sId}:${b}`]||{custom:[],extras:{},papers:[]};
      const next={...cur,custom:cur.custom.map(cs=>cs.id!==parentTopicId?cs:{...cs,subtopics:(cs.subtopics||[]).filter(st=>st.id!==subtopicId)})};
      window.storage.set(SK.CUSTOM(sId,b),JSON.stringify(next.custom),true).catch(()=>{});
      return{...prev,[`${sId}:${b}`]:next};
    });
    if(secId===subtopicId){setScreen("subject");setSecId(null);}
  };

  const deleteCustomSec = sId => {
    const b=curBoard;
    setBoardData(prev=>{
      const cur=prev[`${subjDef.id}:${b}`]||{custom:[],extras:{},papers:[]};
      const next={...cur,custom:cur.custom.filter(cs=>cs.id!==sId)};
      window.storage.set(SK.CUSTOM(subjDef.id,b),JSON.stringify(next.custom),true).catch(()=>{});
      return{...prev,[`${subjDef.id}:${b}`]:next};
    });
    if(secId===sId){setScreen("subject");setSecId(null);}
  };

  // Rename a custom topic or subtopic title
  const renameCustomTopic = (topicId, newTitle) => {
    if(!subjDef||!newTitle.trim()) return;
    const sId=subjDef.id, b=curBoard;
    setBoardData(prev=>{
      const cur=prev[sId+":"+b]||{custom:[],extras:{},papers:[]};
      const next={...cur,custom:cur.custom.map(cs=>{
        if(cs.id===topicId) return {...cs,title:newTitle.trim()};
        return cs;
      })};
      window.storage.set(SK.CUSTOM(sId,b),JSON.stringify(next.custom),true).catch(()=>{});
      return{...prev,[sId+":"+b]:next};
    });
  };
  const renameCustomSubtopic = (parentTopicId, subtopicId, newTitle) => {
    if(!subjDef||!newTitle.trim()) return;
    const sId=subjDef.id, b=curBoard;
    setBoardData(prev=>{
      const cur=prev[sId+":"+b]||{custom:[],extras:{},papers:[]};
      const next={...cur,custom:cur.custom.map(cs=>{
        if(cs.id!==parentTopicId) return cs;
        return {...cs,subtopics:(cs.subtopics||[]).map(st=>st.id===subtopicId?{...st,title:newTitle.trim()}:st)};
      })};
      window.storage.set(SK.CUSTOM(sId,b),JSON.stringify(next.custom),true).catch(()=>{});
      return{...prev,[sId+":"+b]:next};
    });
  };

  const addPaper = paper => { const cur=getBD(subjDef.id,curBoard); saveBD(subjDef.id,curBoard,{papers:[...cur.papers,paper]}); setModal(null); };
  const deletePaper = id => { const cur=getBD(subjDef.id,curBoard); saveBD(subjDef.id,curBoard,{papers:cur.papers.filter(p=>p.id!==id)}); };

  const navToSection = (si,ti,sId) => {
    setSubIdx(si);setTopIdx(ti);setSecId(sId);
    setTab("notes");setFcIdx(0);setFlip(false);
    setQIdx(0);setQRes(null);setSelOpt(null);setTA("");setSmMdl(false);
    setScreen("section");
  };

  const selectBoard = async b => {
    if(!subjDef)return;
    setBoardSels(s=>({...s,[subjDef.id]:b}));
    await ensureBoardLoaded(subjDef.id,b);
  };

  const bg=D?"#030712":"#f9fafb", bd2=D?"#1f2937":"#e5e7eb";
  const _goEl=<GlobalOverlays D={D} online={online} shortcutModal={shortcutModal} setShortcutModal={setShortcutModal} searchOpen={searchOpen} setSearchOpen={setSearchOpen} onboarding={onboarding} handleOnboardingComplete={handleOnboardingComplete} subjects={subjects} allSections={allSections} boardData={boardData} boardSels={boardSels} handleSearchNavigate={handleSearchNavigate} screen={screen} onHome={()=>setScreen("home")} onMock={()=>setScreen("mock")} onTutor={()=>{setTutorSubjId(null);setScreen("tutor");}} onTimetable={()=>setScreen("timetable")} onDash={()=>setScreen("dashboard")} onLeaderboards={()=>setScreen("friends")} streak={streak}/>;
const hProps={user,userDisplayName,D,onDark:()=>setD(!D),onHome:()=>setScreen("home"),onDash:()=>setScreen("dashboard"),onTarget:()=>{setTTSubj(null);setScreen("target")},onTimetable:()=>setScreen("timetable"),onBlurt:()=>{setBlurtSubjId(null);setBlurtSecId2(null);setScreen("blurting");},onMock:()=>setScreen("mock"),onTutor:()=>{setTutorSubjId(null);setScreen("tutor");},onCoach:()=>setScreen("coach"),onLeaderboards:()=>setScreen("friends"),streak,onSearch:()=>setSearchOpen(true),globalOverlays:_goEl,screen};

  // Personal subject routing — handled before the main screen router
  if(personalScreen&&personalScreen.subjId){
    var _ps = personalSubjects.find(function(s){return s.id===personalScreen.subjId;});
    if(_ps) return <PersonalSubjectScreen D={D} subj={_ps} personalSubjects={personalSubjects} user={user} onBack={function(){setPersonalScreen(null);}} onSaveSubjects={savePersonalSubjects}/>;
  }

  if(screen==="login"){
    // Accept email OR plain username (letters/numbers/underscores, 3-30 chars)
    const idTrim=nameIn.trim();
    const idLower=idTrim.toLowerCase();
    const isEmail=idLower.indexOf("@")!==-1;
    const emailOk=isEmail&&/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(idLower);
    const usernameOk=!isEmail&&/^[a-zA-Z0-9_]{3,30}$/.test(idTrim);
    const idOk=emailOk||usernameOk;
    const passOk=passIn.length>=4&&passIn.length<=30;
    // On signup: if email given it must be valid; otherwise just need a valid username
    const signupIdOk=authMode==="signup"?(isEmail?emailOk:usernameOk):idOk;
    const canSubmit=signupIdOk&&passOk;

    const handleAuth=()=>{
      if(!canSubmit)return;
      // Normalise key: emails go lowercase, usernames kept as typed
      const u=isEmail?idLower:idTrim;
      const dn=displayNameIn.trim()||getDisplayName(u);
      if(authMode==="signup"){
        if(u===ADMIN_USER){setAuthE("That identifier is reserved.");return;}
        if(accounts[u]){setAuthE("An account with that "+(isEmail?"email":"username")+" already exists.");return;}
        const nonAdminCount=Object.keys(accounts).filter(k=>k!==ADMIN_USER).length;
        const gki=(nonAdminCount%10)+1;
        const n={...accounts,[u]:{h:hashPw(passIn),gki,displayName:dn}};setAccs(n);saveAccounts(n);
        setGK("");
        setUserDisplayName(dn);
        if(schoolIn.trim()){
          const lbKey="gcse:lb:"+u.replace(/\W/g,"-");
          window.storage.set(lbKey,JSON.stringify({username:u,displayName:dn,school:schoolIn.trim(),score:0}),true).catch(()=>{});
          setUserSchool(schoolIn.trim());
        }
        setUser(u);setScreen("home");setAuthE("");setShowPass(false);setDNIn("");
      }else{
        // Login: try exact key first, then case-insensitive search for usernames
        var matchKey=null;
        if(accounts[u]){
          matchKey=u;
        } else {
          // Case-insensitive fallback for old accounts
          var lower=u.toLowerCase();
          var allKeys=Object.keys(accounts);
          for(var ki=0;ki<allKeys.length;ki++){
            if(allKeys[ki].toLowerCase()===lower){matchKey=allKeys[ki];break;}
          }
        }
        if(!matchKey){setAuthE("No account found. Check spelling or sign up.");return;}
        if(getAccHash(accounts[matchKey])!==hashPw(passIn)){setAuthE("Incorrect password.");return;}
        boardLoadedRef.current={};
        setGK("");
        const storedDN=getAccDisplayName(accounts[matchKey])||getDisplayName(matchKey);
        setUserDisplayName(storedDN);
        if(matchKey===ADMIN_USER){
          setUserSchool(ADMIN_SCHOOL);
        }else{
          const lbKey="gcse:lb:"+matchKey.replace(/\W/g,"-");
          window.storage.get(lbKey,true).then(function(r){
            if(r&&r.value){
              try{
                var e=JSON.parse(r.value);
                if(e.school)setUserSchool(e.school);
                if(!e.displayName&&storedDN){
                  window.storage.set(lbKey,JSON.stringify({...e,displayName:storedDN}),true).catch(function(){});
                }
              }catch(ex){}
            }
          }).catch(function(){});
        }
        setUser(matchKey);setScreen("home");setAuthE("");setShowPass(false);
      }
    };

    var idPlaceholder=authMode==="signup"?"Username or email (optional email)":"Email or username";
    var idHint=authMode==="signup"
      ?(isEmail?(emailOk?"":"Enter a valid email"):(!idTrim?"":"3-30 chars: letters, numbers, _"))
      :"";

    return (
      <div style={{minHeight:"100vh",background:D?"#030712":"#f0f4ff",display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
        <div style={{...C(D),width:"100%",maxWidth:400,padding:40,boxShadow:"0 25px 60px rgba(0,0,0,.12)"}}>
          <div style={{textAlign:"center",marginBottom:28}}>
            <div style={{fontSize:48,marginBottom:12}}>🎓</div>
            <h1 style={{fontSize:22,fontWeight:700,color:tx(D),marginBottom:4}}>ReviseIQ</h1>
            <p style={{fontSize:12,color:mu(D)}}>{ALL_SUBJECTS.length} subjects · AI-powered revision</p>
          </div>
          <div style={{display:"flex",background:D?"#1f2937":"#f3f4f6",borderRadius:10,padding:3,marginBottom:22,gap:3}}>
            {["login","signup"].map(function(m){return (
              <button key={m} onClick={function(){setAM(m);setAuthE("");}} style={{flex:1,padding:"9px 0",borderRadius:8,border:"none",background:authMode===m?(D?"#374151":"#fff"):"transparent",fontWeight:authMode===m?600:400,fontSize:13,cursor:"pointer",color:authMode===m?tx(D):mu(D),transition:"all .15s",boxShadow:authMode===m?"0 1px 4px rgba(0,0,0,.08)":"none"}}>
                {m==="login"?"Log In":"Sign Up"}
              </button>
            );})}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:14}}>
            <div>
              <input style={I(D)} placeholder={idPlaceholder} value={nameIn} onChange={function(e){setNameIn(e.target.value);setAuthE("");}} onKeyDown={function(e){if(e.key==="Enter")handleAuth();}} autoCapitalize="off" autoCorrect="off" autoComplete="username" spellCheck="false"/>
              {idHint&&idTrim&&<p style={{fontSize:11,color:"#f59e0b",marginTop:3,marginLeft:2}}>{idHint}</p>}
            </div>
            {authMode==="signup"&&(
              <input style={I(D)} placeholder="Display name (shown on leaderboard)" value={displayNameIn} onChange={function(e){setDNIn(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter")handleAuth();}}/>
            )}
            <input type="password" style={I(D)} placeholder="Password (4–30 characters)" value={passIn} maxLength={30} onChange={function(e){setPassIn(e.target.value);setAuthE("");}} onKeyDown={function(e){if(e.key==="Enter")handleAuth();}}/>
            {authMode==="signup"&&(
              <input style={I(D)} placeholder="School (optional — for leaderboard)" value={schoolIn} onChange={function(e){setSchIn(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter")handleAuth();}}/>
            )}
          </div>
          {authErr&&<p style={{fontSize:12,color:"#ef4444",marginBottom:10,textAlign:"center",background:D?"rgba(239,68,68,.1)":"#fef2f2",padding:"8px 12px",borderRadius:8,border:"1px solid #fca5a5"}}>{authErr}</p>}
          <button disabled={!canSubmit} onClick={handleAuth}
            style={{width:"100%",background:canSubmit?"#6366f1":"#d1d5db",color:"#fff",border:"none",borderRadius:12,padding:"13px 0",fontSize:14,fontWeight:700,cursor:canSubmit?"pointer":"default",transition:"background .2s",letterSpacing:"0.02em"}}>
            {authMode==="login"?"Log In →":"Create Account →"}
          </button>
          {authMode==="login"&&<p style={{fontSize:11,color:mu(D),textAlign:"center",marginTop:10}}>No account? Switch to Sign Up above.</p>}
          <div style={{marginTop:16,display:"flex",gap:5,justifyContent:"center",flexWrap:"wrap"}}>
            {ALL_SUBJECTS.map(function(s){return <span key={s.id} style={{fontSize:11,color:mu(D),background:D?"#1f2937":"#f3f4f6",padding:"2px 8px",borderRadius:20}}>{s.icon}</span>;})}
          </div>
        </div>
      </div>
    );
  }

  if(screen==="timetable"){
    const handleTimetableNav=(act)=>{
      if(act.navType==="target"){
        const si=subjects.findIndex(s=>s.id===act.subjectId);
        setTTSubj(si>=0?si:null);setScreen("target");
      }else if(act.navType==="blurt"){
        setBlurtSubjId(act.subjectId||null);setBlurtSecId2(act.sectionId||null);setScreen("blurting");
      }else if(act.navType==="section"&&act.sectionId){
        const si=subjects.findIndex(s=>s.id===act.subjectId);
        if(si>=0){
          const b=boardSels[subjects[si].id]||DEFAULT_BOARD;
          const bdata=boardData[`${subjects[si].id}:${b}`]||{custom:[],extras:{},papers:[]};
          const merged=mergeTopics(subjects[si].topics||[],bdata.custom,bdata.extras);
          let ti=-1;
          for(let t=0;t<merged.length;t++){if(merged[t].sections.find(s=>s.id===act.sectionId)){ti=t;break;}}
          if(ti>=0){setSubIdx(si);setTopIdx(ti);setSecId(act.sectionId);setTab(act.navTab||"notes");setFcIdx(0);setFlip(false);setQIdx(0);setQRes(null);setSelOpt(null);setTA("");setSmMdl(false);setScreen("section");}
        }
      }
    };
    return (<>
      <Header {...hProps}/>
      <TimetableScreen D={D} subjects={subjects} allSections={allSections} user={user} stats={stats} onNav={handleTimetableNav} onBack={()=>setScreen("home")}/>
    </>);
  }

  if(screen==="blurting") return (<>
    <Header {...hProps}/>
    <BlurtingScreen D={D} subjects={subjects} allSections={allSections} initSubjId={blurtSubjId} initSecId={blurtSecId2} onBack={()=>setScreen("home")}/>
  </>);

  if(screen==="mock") return (<>
    <Header {...hProps}/>
    <MockExamScreen user={user} D={D} subjects={subjects.filter(function(s){return !s._politics;})} allSections={allSections} boardSels={boardSels} boardData={boardData} onBack={()=>setScreen("home")} onMarkActivity={markTodayActive}/>
  </>);

  if(screen==="tutor") return (<>
    <Header {...hProps}/>
    <AITutorScreen D={D} subjects={subjects} allSections={allSections} boardSels={boardSels} boardData={boardData} user={user} googleKey={userGoogleKey} onBack={()=>setScreen("home")}/>
  </>);

  if(screen==="coach") return (<>
    <Header {...hProps}/>
    <ExamCoachScreen D={D} subjects={subjects} allSections={allSections} boardSels={boardSels} boardData={boardData} onBack={()=>setScreen("home")}/>
  </>);

  if(screen==="contact") return (
    <ContactScreen D={D} user={user} isAdmin={admin} onBack={()=>setScreen("home")}/>
  );

  if(screen==="friends") return (
    <div style={{minHeight:"100vh",background:bg,color:tx(D)}} className="fade-in">
      <Header {...hProps}/>
      <div style={{maxWidth:700,margin:"0 auto",padding:"32px 24px"}}>
        <button onClick={()=>setScreen("home")} style={{fontSize:13,color:mu(D),background:"none",border:"none",cursor:"pointer",marginBottom:20}}>← Home</button>
        <h2 style={{fontSize:22,fontWeight:700,marginBottom:4}}>🏆 Leaderboards</h2>
        <p style={{fontSize:13,color:mu(D),marginBottom:24}}>See how you rank at your school and with friends</p>
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div style={{...C(D),padding:22}}>
            <SchoolLeaderboard user={user} school={userSchool} D={D}/>
            {!userSchool&&<p style={{fontSize:12,color:mu(D),marginTop:10}}>You can add your school in Account Settings.</p>}
          </div>
          <div style={{...C(D),padding:22}}>
            <p style={{fontSize:13,fontWeight:700,marginBottom:12,color:tx(D)}}>👥 Friends</p>
            <FriendsPanel user={user} D={D}/>
          </div>
        </div>
      </div>
    </div>
  );

  if(screen==="home") return (
    <div style={{minHeight:"100vh",background:bg,color:tx(D)}} className="fade-in">
      <Header {...hProps}/>
      <div style={{maxWidth:960,margin:"0 auto",padding:"40px 24px"}}>
        <h2 style={{fontSize:24,fontWeight:700,marginBottom:streak>0?16:4}}>Hey {userDisplayName||getDisplayName(user)} 👋</h2>
        {streak>0&&(
          <div style={{...C(D),padding:"18px 22px",marginBottom:22,background:streak>=7?(D?"#1c0d05":"#fff7ed"):undefined,borderColor:streak>=7?"#f97316":undefined}}>
            <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:12}}>
              <div className={streakPop?"streak-pop":""} style={{fontSize:36}}>🔥</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:16,color:streak>=7?"#f97316":tx(D)}}>{streak}-day streak!</div>
                <div style={{fontSize:12,color:mu(D)}}>
                  {streak===1?"Great start — come back tomorrow to keep it going!"
                   :streak<7?`${7-streak} more day${7-streak!==1?"s":""} to hit a full week!`
                   :streak<30?`${30-streak} more day${30-streak!==1?"s":""} to hit a 30-day streak 🏆`
                   :"Incredible consistency — keep it up! 🏆"}
                </div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:11,color:mu(D),marginBottom:2}}>Longest streak</div>
                <div style={{fontWeight:700,fontSize:18,color:mu(D)}}>{calcLongestStreak(activityDates)}d</div>
              </div>
            </div>
            <div style={{display:"flex",gap:3,overflowX:"auto",paddingBottom:2,marginBottom:14}}>
              {(()=>{const weeks=[];const t=new Date();t.setHours(0,0,0,0);const dow=t.getDay()===0?6:t.getDay()-1;const start=new Date(t);start.setDate(start.getDate()-dow-14);for(let w=0;w<3;w++){const week=[];for(let d=0;d<7;d++){const dt=new Date(start);dt.setDate(dt.getDate()+w*7+d);const k=dt.toISOString().slice(0,10);week.push({k,a:activityDates.has(k),t:k===todayStr()});}weeks.push(week);}return weeks.map((wk,wi)=>(
                <div key={wi} style={{display:"flex",flexDirection:"column",gap:3}}>
                  {wk.map(c=><div key={c.k} title={c.k} style={{width:12,height:12,borderRadius:2,background:c.a?(D?"#f97316":"#fb923c"):c.t?(D?"#374151":"#e5e7eb"):(D?"#1f2937":"#f3f4f6"),border:c.t?"2px solid #6366f1":"2px solid transparent"}}/>)}
                </div>
              ));})()}
            </div>
          </div>
        )}

        {admin&&<div style={{borderRadius:12,background:D?"rgba(99,102,241,.1)":"#eef2ff",border:"1.5px solid #6366f1",marginBottom:20,overflow:"hidden"}}>
          <div style={{padding:"10px 16px",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",borderBottom:`1px solid ${D?"rgba(99,102,241,.2)":"#c7d2fe"}`}}>
            <span style={{fontSize:11,fontWeight:800,color:"#6366f1",letterSpacing:"0.08em",textTransform:"uppercase"}}>⚡ Admin Mode</span>
            <span style={{fontSize:12,color:D?"#a5b4fc":"#4338ca",flex:1}}>Navigate into a subject to add topics, notes, flashcards, questions and past papers.</span>
          </div>
          <div style={{padding:"10px 16px",display:"flex",gap:8,flexWrap:"wrap"}}>
            <button onClick={()=>setImportOpen(true)} style={{fontSize:12,padding:"6px 14px",borderRadius:7,border:"1.5px solid #6366f1",background:"#6366f1",color:"#fff",fontWeight:600,cursor:"pointer"}}>📥 Import Data</button>
            <button onClick={()=>setManageAccountsOpen(true)} style={{fontSize:12,padding:"6px 14px",borderRadius:7,border:"1.5px solid #6366f1",background:"transparent",color:"#6366f1",fontWeight:600,cursor:"pointer"}}>👥 Manage Accounts</button>
          </div>
        </div>}
        {importOpen&&<ImportModal D={D} subjects={subjects} onClose={()=>setImportOpen(false)} onDone={()=>{ensureAllBoardsLoaded(boardSels);}}/>}
        {manageAccountsOpen&&<ManageAccountsModal D={D} accounts={accounts} adminUser={ADMIN_USER} onClose={()=>setManageAccountsOpen(false)} onDelete={function(email){var n={...accounts};delete n[email];setAccs(n);saveAccounts(n);}}/>}

        <TodayWidget D={D} subjects={subjects} allSections={allSections} fcHist={fcHist}
          stats={stats} timetableExams={timetableExams} boardSels={boardSels}
          onNavigateSection={function(sec,toTab){
            const si=subjects.findIndex(function(s){return s.id===sec.subjectId;});
            if(si<0)return;
            setSubIdx(si);
            const b=boardSels[subjects[si].id]||DEFAULT_BOARD;
            ensureBoardLoaded(subjects[si].id,b).then(function(){
              const bd=boardData[subjects[si].id+":"+b]||{custom:[],extras:{},papers:[]};
              const merged=mergeTopics(subjects[si].topics||[],bd.custom,bd.extras);
              const ti=merged.findIndex(function(t){return t.sections.some(function(s){return s.id===sec.id;});});
              if(ti<0)return;
              setTopIdx(ti);setSecId(sec.id);setTab(toTab||"flashcards");
              setFcIdx(0);setFlip(false);setQIdx(0);setQRes(null);setSelOpt(null);setTA("");
              setSubjTab("sections");setScreen("section");
            });
          }}
          onNavigateBlurt={function(subjId,secId2){setBlurtSubjId(subjId);setBlurtSecId2(secId2);setScreen("blurting");}}
          onMock={function(){setScreen("mock");}}
        />

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:14}}>
          {subjects.map((s,si)=>{
            const selBoard=boardSels[s.id]||DEFAULT_BOARD;
            const bData=getBD(s.id,selBoard);
            const ss=stats.subjStats?.[s.id];
            const qPct=ss?.qM>0?Math.round((ss.qS/ss.qM)*100):null;
            const predicted=qPct!=null?pctToGrade(qPct):null;
            const target=targetGrades[s.id]||null;
            const customCount=(bData.custom||[]).length;
            return (
              <button key={s.id} onClick={async()=>{setSubIdx(si);setSubjTab("sections");await ensureBoardLoaded(s.id,selBoard);setScreen("subject");}}
                style={{...C(D),padding:22,textAlign:"left",cursor:"pointer",display:"block",width:"100%",transition:"transform .15s,box-shadow .15s",position:"relative"}}
                onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 12px 40px rgba(0,0,0,.1)"}}
                onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow=""}}>
                {predicted&&(
                  <div style={{position:"absolute",top:14,right:14,display:"flex",gap:5,alignItems:"center"}}>
                    {target&&<span style={{fontSize:11,fontWeight:800,color:"#fff",background:gradeColor(target),padding:"2px 8px",borderRadius:8,opacity:0.9}} title={`Target: ${target}`}>🎯{target}</span>}
                    <span style={{fontSize:13,fontWeight:800,color:"#fff",background:gradeColor(predicted),padding:"3px 9px",borderRadius:8}}>{predicted}</span>
                  </div>
                )}
                <div style={{width:44,height:44,borderRadius:12,background:`linear-gradient(135deg,${s.accent},${s.accent}88)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,marginBottom:12}}>{s.icon}</div>
                <div style={{fontWeight:700,fontSize:15,marginBottom:4,paddingRight:predicted?70:0}}>{s.name}</div>
                <div style={{display:"flex",gap:7,flexWrap:"wrap",alignItems:"center"}}>
                  <span style={{fontSize:11,color:mu(D),background:D?"#1f2937":"#f3f4f6",padding:"2px 7px",borderRadius:10}}>{selBoard}</span>
                  {customCount>0&&<span style={{fontSize:11,color:"#6366f1",fontWeight:600}}>+{customCount}</span>}
                  {qPct!=null&&<span style={{fontSize:11,color:mu(D)}}>{qPct}%</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>
      {/* ── My Personal Subjects ── */}
      <div style={{maxWidth:960,margin:"0 auto",padding:"0 24px 32px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,marginTop:8}}>
          <div>
            <h3 style={{fontSize:16,fontWeight:700,margin:0,color:D?"#f9fafb":"#111827"}}>📚 My Subjects</h3>
            <p style={{fontSize:11,color:D?"#6b7280":"#9ca3af",margin:"2px 0 0"}}>Personal content — only visible to you</p>
          </div>
          <button onClick={()=>setCreatePersonalOpen(true)}
            style={{padding:"7px 16px",borderRadius:9,border:"none",background:"#6366f1",color:"#fff",fontWeight:600,fontSize:13,cursor:"pointer"}}>＋ New Subject</button>
        </div>
        {personalSubjects.length===0&&(
          <div style={{padding:"20px 16px",borderRadius:12,border:"1.5px dashed "+(D?"#374151":"#d1d5db"),textAlign:"center",color:D?"#6b7280":"#9ca3af",fontSize:13}}>
            Create personal subjects for anything you want to learn — Spanish vocab, music theory, anything. Only you can see them.
          </div>
        )}
        {personalSubjects.length>0&&(
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:12}}>
            {personalSubjects.map(function(ps){return (
              <button key={ps.id} onClick={()=>setPersonalScreen({subjId:ps.id})}
                style={{...C(D),padding:20,textAlign:"left",cursor:"pointer",display:"block",width:"100%",transition:"transform .15s"}}
                onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";}}
                onMouseLeave={e=>{e.currentTarget.style.transform="";}}>
                <div style={{width:40,height:40,borderRadius:10,background:ps.accent+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,marginBottom:10}}>{ps.icon}</div>
                <div style={{fontWeight:700,fontSize:14,marginBottom:4}}>{ps.name}</div>
                <span style={{fontSize:11,color:mu(D),background:D?"#1f2937":"#f3f4f6",padding:"2px 7px",borderRadius:10}}>{(ps.topics||[]).length} topics</span>
              </button>
            );})}
          </div>
        )}
      </div>
      {createPersonalOpen&&<CreatePersonalSubjectModal D={D} onClose={()=>setCreatePersonalOpen(false)} onSave={function(ns){savePersonalSubjects([...personalSubjects,ns]);setCreatePersonalOpen(false);}}/>}
      <AppFooter D={D} onContact={()=>setScreen("contact")}/>
    </div>
   );
  if(screen==="subject"&&subjDef){
    const subj=subjDef;
    return (
      <div style={{minHeight:"100vh",background:bg,color:tx(D)}} className="fade-in">
        <Header {...hProps}/>
        <div style={{maxWidth:960,margin:"0 auto",padding:"32px 24px"}}>
          <button onClick={()=>setScreen("home")} style={{fontSize:13,color:mu(D),background:"none",border:"none",cursor:"pointer",marginBottom:20}}>← All subjects</button>
          <div style={{display:"flex",alignItems:"flex-start",gap:16,marginBottom:20,flexWrap:"wrap"}}>
            <div style={{width:56,height:56,borderRadius:16,background:`linear-gradient(135deg,${subj.accent},${subj.accent}88)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0}}>{subj.icon}</div>
            <div style={{flex:1,minWidth:0}}>
              <h2 style={{fontSize:22,fontWeight:700,marginBottom:6}}>{subj.name}</h2>
              {!subj._politics&&<div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
                {EXAM_BOARDS.map(b=>(
                  <button key={b} onClick={()=>selectBoard(b)}
                    style={{padding:"4px 12px",borderRadius:20,border:`1.5px solid ${curBoard===b?subj.accent:bd2}`,background:curBoard===b?subj.accent:"transparent",color:curBoard===b?"#fff":mu(D),cursor:"pointer",fontSize:12,fontWeight:curBoard===b?700:400,transition:"all .15s"}}>
                    {b}
                  </button>
                ))}
              </div>}
              {!subj._politics&&(()=>{
                const ss=stats.subjStats?.[subj.id];
                const qPct=ss?.qM>0?Math.round((ss.qS/ss.qM)*100):null;
                const predicted=qPct!=null?pctToGrade(qPct):null;
                const target=targetGrades[subj.id]||null;
                const grades=["9","8","7","6","5","4","3","2","1","U"];
                return (
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {predicted&&<div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",padding:"8px 12px",borderRadius:10,background:D?"rgba(255,255,255,.04)":"rgba(0,0,0,.03)"}}>
                      <span style={{fontSize:11,color:mu(D),fontWeight:600}}>Predicted</span>
                      <span style={{fontSize:20,fontWeight:900,color:"#fff",background:gradeColor(predicted),padding:"3px 13px",borderRadius:9,letterSpacing:"0.04em"}}>{predicted}</span>
                      {qPct!=null&&<span style={{fontSize:11,color:mu(D)}}>{qPct}% · {ss.qM} marks answered</span>}
                      {target&&<span style={{fontSize:12,fontWeight:700,padding:"3px 10px",borderRadius:8,
                        background:parseInt(predicted)>=parseInt(target)||predicted===target?"#dcfce7":"#fef3c7",
                        color:parseInt(predicted)>=parseInt(target)||predicted===target?"#15803d":"#92400e"}}>
                        {predicted===target?"✓ On target!":parseInt(predicted)>parseInt(target)?"🏆 Above target!":`${parseInt(target)-parseInt(predicted)} grade${parseInt(target)-parseInt(predicted)!==1?"s":""} to go`}
                      </span>}
                    </div>}
                    <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                      <span style={{fontSize:11,color:mu(D),flexShrink:0,fontWeight:600}}>🎯 Target:</span>
                      <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
                        {grades.map(g=>{const sel=target===g;const gc=gradeColor(g);return (
                          <button key={g} onClick={()=>setTargetGrades(p=>({...p,[subj.id]:sel?undefined:g}))}
                            style={{width:28,height:28,borderRadius:7,border:`2px solid ${sel?gc:(D?"#374151":"#d1d5db")}`,
                              background:sel?gc:(D?"#111827":"#fff"),
                              color:sel?"#fff":(D?"#6b7280":"#9ca3af"),
                              fontWeight:sel?800:500,fontSize:12,cursor:"pointer",
                              transition:"all .15s",boxShadow:sel?`0 0 0 3px ${gc}33`:""}}>{g}</button>
                        );})}
                        {target&&<span style={{fontSize:11,color:mu(D),alignSelf:"center",marginLeft:4}}>click again to clear</span>}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
          {subj._politics&&<div style={{padding:"12px 16px",borderRadius:12,background:D?"#134e4a22":"#f0fdfa",border:"1.5px solid #0f766e",marginBottom:20,display:"flex",flexWrap:"wrap",alignItems:"center",gap:10}}>
            <span style={{fontSize:18}}>🏛️</span>
            <div style={{flex:1,minWidth:200}}>
              <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginBottom:3}}>
                <span style={{fontWeight:700,fontSize:13,color:"#0f766e"}}>General Political Knowledge</span>
                <span style={{fontSize:11,fontWeight:700,background:"#0f766e",color:"#fff",padding:"2px 8px",borderRadius:20}}>🔄 Updated Weekly</span>
              </div>
              <p style={{fontSize:12,color:D?"#9ca3af":"#6b7280",margin:0}}>This is <strong>not GCSE content</strong> — it's factual, non-biased political awareness for well-rounded world knowledge. Notes only. Use the AI Tutor to explore any topic further.</p>
            </div>
          </div>}
          <div style={{display:"flex",borderBottom:`1px solid ${bd2}`,marginBottom:24,gap:2}}>
            {(subj._politics?[["sections","📚 Topics"]]:[["sections","📚 Topics"],["papers","📄 Past Papers"]]).map(([t,label])=>(
              <button key={t} onClick={()=>setSubjTab(t)} style={{padding:"10px 18px",fontSize:13,fontWeight:subjTab===t?600:400,color:subjTab===t?subj.accent:mu(D),background:"none",border:"none",cursor:"pointer",borderBottom:subjTab===t?`2px solid ${subj.accent}`:"2px solid transparent",marginBottom:-1,transition:"color .15s"}}>{label}</button>
            ))}
          </div>

          {subjTab==="sections"&&(
            <div className="fade-in">
              {admin&&<AdminBar D={D} actions={[{label:`＋ New Topic (${curBoard})`,fn:()=>setModal({mode:"section"})}]}/>}
              {curTopics.length===0&&<div style={{...C(D),padding:48,textAlign:"center"}}><p style={{fontSize:28,marginBottom:10}}>{subj.icon}</p><p style={{fontWeight:700,fontSize:15,marginBottom:4}}>{subj.name} · {curBoard}</p><p style={{fontSize:13,color:mu(D)}}>No topics yet.{admin?" Add one above.":""}</p></div>}
              {curTopics.map((tp,ti)=>{
                if(tp.id==="_admin"&&tp._adminGroups){
                  return tp._adminGroups.map(grp=>(
                    <div key={grp._adminTopicId} style={{...C(D),marginBottom:14,padding:22}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,marginBottom:grp.sections.length>0?14:10,flexWrap:"wrap"}}>
                        {admin&&editingTitle&&editingTitle.id===grp._adminTopicId?(
                          <input autoFocus value={editingTitle.value}
                            onChange={e=>setEditingTitle(t=>({...t,value:e.target.value}))}
                            onBlur={()=>{renameCustomTopic(grp._adminTopicId,editingTitle.value);setEditingTitle(null);}}
                            onKeyDown={e=>{if(e.key==="Enter"){renameCustomTopic(grp._adminTopicId,editingTitle.value);setEditingTitle(null);}if(e.key==="Escape")setEditingTitle(null);}}
                            style={{fontWeight:700,fontSize:15,border:"1.5px solid #6366f1",borderRadius:6,padding:"2px 8px",background:"transparent",color:"inherit",flex:1}}/>
                        ):(
                          <span style={{fontWeight:700,fontSize:15}}>{grp._adminTopicTitle}</span>
                        )}
                        {admin&&<div style={{display:"flex",gap:8,alignItems:"center"}}>
                          {!editingTitle&&<button onClick={()=>setEditingTitle({id:grp._adminTopicId,value:grp._adminTopicTitle})} style={{background:"none",border:"1px solid #9ca3af",borderRadius:7,cursor:"pointer",fontSize:11,color:"#9ca3af",padding:"3px 9px"}}>✏️</button>}
                          <button onClick={()=>setModal({mode:"subtopic",_parentTopicId:grp._adminTopicId})} style={{...B("#6366f1",true,{fontSize:12,padding:"5px 12px"})}}>＋ Sub-topic</button>
                          <button onClick={()=>deleteCustomSec(grp._adminTopicId)} style={{background:"#fee2e2",border:"1.5px solid #ef4444",borderRadius:8,cursor:"pointer",fontSize:12,color:"#ef4444",padding:"5px 10px",fontWeight:700}}>✕ Delete</button>
                        </div>}
                      </div>
                      {grp.sections.length===0&&<p style={{fontSize:12,color:mu(D),fontStyle:"italic",marginTop:4}}>No sub-topics yet — click "＋ Sub-topic" to add one.</p>}
                      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:10}}>
                        {grp.sections.map(sec=>(
                          <div key={sec.id} style={{position:"relative"}}>
                            <div role="button" tabIndex={0}
                              onClick={()=>navToSection(subIdx,ti,sec.id)}
                              onKeyDown={e=>e.key==="Enter"&&navToSection(subIdx,ti,sec.id)}
                              style={{width:"100%",textAlign:"left",padding:"12px 14px",paddingRight:admin?"36px":"14px",borderRadius:12,border:`1.5px solid ${bd2}`,background:"transparent",cursor:"pointer",transition:"all .15s",color:tx(D)}}
                              onMouseEnter={e=>{e.currentTarget.style.borderColor=subj.accent;e.currentTarget.style.background=subj.light}}
                              onMouseLeave={e=>{e.currentTarget.style.borderColor=bd2;e.currentTarget.style.background="transparent"}}>
                              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:6,marginBottom:5}}>
                              {admin&&editingTitle&&editingTitle.id===sec.id?(
                                <input autoFocus value={editingTitle.value}
                                  onClick={e=>e.stopPropagation()}
                                  onChange={e=>setEditingTitle(t=>({...t,value:e.target.value}))}
                                  onBlur={()=>{if(sec._isSubtopic)renameCustomSubtopic(grp._adminTopicId,sec.id,editingTitle.value);else renameCustomTopic(sec.id,editingTitle.value);setEditingTitle(null);}}
                                  onKeyDown={e=>{if(e.key==="Enter"){if(sec._isSubtopic)renameCustomSubtopic(grp._adminTopicId,sec.id,editingTitle.value);else renameCustomTopic(sec.id,editingTitle.value);setEditingTitle(null);}if(e.key==="Escape")setEditingTitle(null);}}
                                  style={{fontSize:13,fontWeight:600,border:"1.5px solid #6366f1",borderRadius:6,padding:"2px 6px",background:"transparent",color:"inherit",width:"100%"}}/>
                              ):(
                                <div style={{fontSize:13,fontWeight:600}}>{sec.title}</div>
                              )}
                              {(()=>{
  const cards=sec.flashcards||[];
  if(!cards.length) return null;
  const mastered=cards.filter(c=>{const s=getCardState(fcHist,c.id);return s&&s.interval>7;}).length;
  const pct=Math.round((mastered/cards.length)*100);
  return <div style={{display:"flex",alignItems:"center",gap:3,flexShrink:0}} title={pct+"% mastered (interval>7d)"}>
    <MasteryRing pct={pct} size={22} accent="#10b981"/>
    <span style={{fontSize:9,color:"#10b981",fontWeight:700}}>{pct}%</span>
  </div>;
})()}
                            </div>
                              <div style={{display:"flex",gap:8}}>
                                <span style={{fontSize:11,color:mu(D)}}>🃏 {(sec.flashcards||[]).length}</span>
                                <span style={{fontSize:11,color:mu(D)}}>❓ {(sec.questions||[]).length}</span>
                              </div>
                            </div>
                            {admin&&<div style={{position:"absolute",top:6,right:6,display:"flex",gap:4}}>
                              {!editingTitle&&<button onClick={e=>{e.stopPropagation();setEditingTitle({id:sec.id,parentId:sec._isSubtopic?grp._adminTopicId:null,value:sec.title});}} style={{background:"none",border:"1px solid #9ca3af",borderRadius:5,cursor:"pointer",fontSize:10,color:"#9ca3af",padding:"2px 5px"}}>✏️</button>}
                              <button
                                onClick={e=>{e.stopPropagation();
                                  if(sec._isSubtopic)deleteSubtopic(grp._adminTopicId,sec.id);
                                  else deleteCustomSec(sec.id);
                                }}
                                style={{background:"#fee2e2",border:"1.5px solid #ef4444",borderRadius:5,cursor:"pointer",fontSize:10,color:"#ef4444",padding:"2px 5px",fontWeight:700}}>✕</button>
                            </div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ));
                }
                return (
                  <div key={tp.id} style={{...C(D),marginBottom:14,padding:22}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
                      {tp.number&&<span style={{fontSize:11,fontFamily:"monospace",color:mu(D),background:D?"#1f2937":"#f3f4f6",padding:"3px 8px",borderRadius:6}}>{tp.number}</span>}
                      <span style={{fontWeight:700,fontSize:15}}>{tp.title}</span>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:10}}>
                      {tp.sections.map(sec=>(
                        <div key={sec.id} style={{position:"relative"}}>
                          <div role="button" tabIndex={0}
                            onClick={()=>navToSection(subIdx,ti,sec.id)}
                            onKeyDown={e=>e.key==="Enter"&&navToSection(subIdx,ti,sec.id)}
                            style={{width:"100%",textAlign:"left",padding:"12px 14px",borderRadius:12,border:`1.5px solid ${bd2}`,background:"transparent",cursor:"pointer",transition:"all .15s",color:tx(D)}}
                            onMouseEnter={e=>{e.currentTarget.style.borderColor=subj.accent;e.currentTarget.style.background=subj.light}}
                            onMouseLeave={e=>{e.currentTarget.style.borderColor=bd2;e.currentTarget.style.background="transparent"}}>
                            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:6,marginBottom:5}}>
                              <div style={{fontSize:13,fontWeight:600}}>{sec.title}</div>
                              {(()=>{
  const cards=sec.flashcards||[];
  if(!cards.length) return null;
  const mastered=cards.filter(c=>{const s=getCardState(fcHist,c.id);return s&&s.interval>7;}).length;
  const pct=Math.round((mastered/cards.length)*100);
  return <div style={{display:"flex",alignItems:"center",gap:3,flexShrink:0}} title={pct+"% mastered (interval>7d)"}>
    <MasteryRing pct={pct} size={22} accent="#10b981"/>
    <span style={{fontSize:9,color:"#10b981",fontWeight:700}}>{pct}%</span>
  </div>;
})()}
                            </div>
                            <div style={{display:"flex",gap:8}}>
                              <span style={{fontSize:11,color:mu(D)}}>🃏 {(sec.flashcards||[]).length}</span>
                              <span style={{fontSize:11,color:mu(D)}}>❓ {(sec.questions||[]).length}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {subjTab==="papers"&&<PastPapersTab papers={curBData.papers} onAdd={()=>setModal({mode:"paper"})} onDelete={deletePaper} admin={admin} D={D} accent={subj.accent} board={curBoard} subjectName={subj.name}/>}
        </div>
        {modal?.mode==="section"&&<CreateModal mode="section" D={D} subjects={subjects} onClose={()=>setModal(null)} onSave={addCustomSection}/>}
        {modal?.mode==="subtopic"&&modal._parentTopicId&&<CreateModal mode="subtopic" D={D} subjects={subjects} onClose={()=>setModal(null)} onSave={st=>addSubtopic(modal._parentTopicId,st)}/>}
        {modal?.mode==="paper"&&<CreateModal mode="paper" D={D} subjects={subjects} onClose={()=>setModal(null)} onSave={addPaper}/>}
      </div>
    );
  }

  if(screen==="section"&&section){
    const subj=subjDef;
    const cards=section.flashcards||[], qs=section.questions||[];
    const safeFcIdx = cards.length > 0 ? Math.min(fcIdx, cards.length-1) : 0;
    const fc = cards.length>0 ? cards[safeFcIdx] : null;
    const q  = qs.length>0   ? qs[Math.min(qIdx,qs.length-1)]       : null;
    const isCustomSec = section.src==="admin";

    const isAdminItem=(key,item)=>{
      if(isCustomSec)return true;
      const extras=curBData.extras?.[section.id];
      return !!(extras?.[key]?.find(x=>x.id===item.id));
    };

    const dueCards = cramMode ? cards : cards.filter(c=>isCardDue(fcHist,c.id));
    const curState = fc ? getCardState(fcHist,fc.id) : null;
    const previews = fc ? previewIntervals(curState) : ["today","today","6d","1w"];

    const doSM2 = (btnQuality) => {
      if(!fc)return;
      const cardId = fc.id;
      markTodayActive();
      if(!cramMode){
        setFCH(prevHist => {
          const prevState = getCardState(prevHist, cardId);
          const next = sm2Next(prevState, btnQuality);
          return {...prevHist, [cardId]: next};
        });
      }
      const correct=btnQuality>=2;
      setStats(s=>{
        const wfc={...s.weakFC};
        wfc[section.id]={wrong:(wfc[section.id]?.wrong||0)+(correct?0:1),total:(wfc[section.id]?.total||0)+1};
        const ss={...s.subjStats};
        ss[subj.id]={...ss[subj.id],fcC:(ss[subj.id]?.fcC||0)+(correct?1:0),fcT:(ss[subj.id]?.fcT||0)+1};
        return{...s,fcC:s.fcC+(correct?1:0),fcT:s.fcT+1,weakFC:wfc,subjStats:ss};
      });
      setFlip(false);
      setFcIdx(i=>{ const next = i < cards.length-1 ? i+1 : 0; return next; });
    };

    const handleDeleteFC=id=>{
      removeExtra(section.id,"flashcards",id);
      setFcIdx(i=>Math.min(i, Math.max(0, cards.length-2)));
      setFlip(false);
    };
    const handleDeleteQ=id=>{removeExtra(section.id,"questions",id);setQIdx(0);setQRes(null);setSelOpt(null);setTA("");setSmMdl(false);};

    const SM2_BTNS = [
      {label:"Again",color:"#ef4444",desc:"Forgot completely",q:0},
      {label:"Hard",color:"#f59e0b",desc:"Struggled",q:1},
      {label:"Good",color:"#3b82f6",desc:"Got it",q:2},
      {label:"Easy",color:"#10b981",desc:"Very easy",q:3},
    ];

    return (
      <div style={{minHeight:"100vh",background:bg,color:tx(D)}} className="fade-in">
        <Header {...hProps}/>
        <div style={{maxWidth:760,margin:"0 auto",padding:"28px 24px"}}>
          <button onClick={()=>setScreen("subject")} style={{fontSize:13,color:mu(D),background:"none",border:"none",cursor:"pointer",marginBottom:16}}>← {subj.name}</button>
          <div style={{marginBottom:20}}>
            <h2 style={{fontSize:18,fontWeight:700,marginBottom:4}}>{section.title}</h2>
            <p style={{fontSize:12,color:mu(D)}}>{subj.name} · {curBoard}</p>
          </div>

          <div style={{display:"flex",borderBottom:`1px solid ${bd2}`,marginBottom:24,gap:2}}>
            {(subj._politics?[["notes","📖 Notes"]]:[["notes","📖 Notes"],["flashcards","🃏 Flashcards"],["questions","❓ Questions"]]).map(([t,label])=>(
              <button key={t} onClick={()=>setTab(t)} style={{padding:"10px 16px",fontSize:13,fontWeight:tab===t?600:400,color:tab===t?subj.accent:mu(D),background:"none",border:"none",cursor:"pointer",borderBottom:tab===t?`2px solid ${subj.accent}`:"2px solid transparent",marginBottom:-1,transition:"color .15s"}}>{label}</button>
            ))}
          </div>

          {tab==="notes"&&(
            <div className="fade-in">
              {admin&&<AdminBar D={D} actions={[{label:"＋ Add Note",fn:()=>setModal({mode:"note",sectionId:section.id})}]}/>}
              {(section.notes||[]).length===0&&<div style={{...C(D),padding:32,textAlign:"center",color:mu(D),fontSize:14}}>No notes yet.{admin?" Add one above.":""}</div>}
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                {(section.notes||[]).map(note=>{
                  const canEdit=admin&&isAdminItem("notes",note);
                  const isHtml=(note.body||"").trimStart().startsWith("<");
                  return (
                    <div key={note.id} style={{...C(D),padding:24}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                        <h3 style={{fontWeight:700,fontSize:15,color:subj.accent,flex:1,marginRight:canEdit?8:0}}>{note.heading}</h3>
                        {canEdit&&<div style={{display:"flex",gap:6,flexShrink:0}}>
                          <button onClick={()=>setModal({mode:"note",sectionId:section.id,initialItem:note})} style={{background:"none",border:"none",cursor:"pointer",fontSize:13,color:"#6366f1"}}>✏️</button>
                          <button onClick={()=>removeExtra(section.id,"notes",note.id)} style={{background:"none",border:"none",cursor:"pointer",fontSize:13,color:"#ef4444"}}>🗑</button>
                        </div>}
                      </div>
                      {isHtml?<div dangerouslySetInnerHTML={{__html:note.body}} className="rich-display" style={{color:tx(D)}}/>:<MD text={note.body} D={D}/>}
                      {(note.images||[]).map((img,ii)=><AnnotatedImage key={ii} img={img} D={D}/>)}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab==="flashcards"&&(
            <div className="fade-in">
              {admin&&<AdminBar D={D} actions={[{label:"＋ Add Flashcard",fn:()=>setModal({mode:"flashcard",sectionId:section.id})}]}/>}
              {cards.length===0&&<div style={{...C(D),padding:32,textAlign:"center",color:mu(D),fontSize:14}}>No flashcards yet.{admin?" Add one above.":""}</div>}
              {fc&&<>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 14px",borderRadius:10,background:D?"#1f2937":"#f3f4f6",marginBottom:8}}>
                  <span style={{fontSize:12,color:mu(D)}}><strong style={{color:cramMode?"#6366f1":dueCards.length>0?"#f59e0b":tx(D)}}>{cramMode?"CRAM":dueCards.length}</strong>{cramMode?" mode":" due"} · {cards.filter(c=>{const s=getCardState(fcHist,c.id);return s&&!isCardDue(fcHist,c.id)&&s.lastQ>=2;}).length} scheduled</span>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <button onClick={()=>{setCramMode(v=>!v);setFcIdx(0);setFlip(false);}} style={{fontSize:10,padding:"3px 9px",borderRadius:8,border:`1.5px solid ${cramMode?"#6366f1":"#d1d5db"}`,background:cramMode?"#6366f1":"transparent",color:cramMode?"#fff":mu(D),cursor:"pointer",fontWeight:cramMode?700:400}} title="Cram mode cycles all cards ignoring SM-2 schedule">🔥 Cram</button>
                    <span style={{fontSize:11,color:mu(D)}}>SM-2</span>
                    <SRInfoTooltip D={D}/>
                  </div>
                </div>

                <ForecastBar cards={cards} fcHist={fcHist} D={D} accent={subj.accent}/>

                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,marginTop:12}}>
                  <span style={{fontSize:13,color:mu(D)}}>{safeFcIdx+1} / {cards.length}</span>
                  <SM2Dots cards={cards} fcHist={fcHist} current={safeFcIdx}/>
                  <span style={{fontSize:12,color:mu(D)}}>{cramMode?"cram":curState ? (curState.reps>0?`${curState.interval}d interval`:"new card") : "new card"}</span>
                </div>

                {admin&&isAdminItem("flashcards",fc)&&(
                  <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginBottom:8}}>
                    <button onClick={()=>setModal({mode:"flashcard",sectionId:section.id,initialItem:fc})} style={{...B("#6366f1",true,{fontSize:12,padding:"5px 12px"})}}>✏️ Edit</button>
                    <button onClick={()=>handleDeleteFC(fc.id)} style={{...B("#ef4444",true,{fontSize:12,padding:"5px 12px"})}}>🗑 Delete</button>
                  </div>
                )}

                <div onClick={()=>setFlip(!flip)}
                  style={{...C(D),padding:32,minHeight:170,display:"flex",flexDirection:"column",justifyContent:"center",cursor:"pointer",textAlign:"center",borderColor:flip?subj.accent:bd2,transition:"border-color .25s",position:"relative"}}>
                  <div style={{fontSize:11,fontWeight:600,letterSpacing:"0.1em",color:flip?subj.accent:mu(D),textTransform:"uppercase",marginBottom:12}}>
                    {flip?"Answer":"Question"}
                    {!flip&&curState&&<span style={{marginLeft:8,fontSize:10,fontWeight:400}}>· EF {curState.ef?.toFixed(1)}</span>}
                  </div>
                  {(fc.images||[]).length>0&&!flip&&fc.images.map((img,ii)=><AnnotatedImage key={ii} img={img} D={D}/>)}
                  <ContentBlock content={flip?fc.a:fc.q} D={D} fontSize={15} style={{color:flip?subj.accent:tx(D),fontWeight:flip?500:400,textAlign:"center"}}/>
                  {!flip&&<p style={{fontSize:11,color:mu(D),marginTop:14}}>Tap to reveal answer</p>}
                </div>

                {flip?(
                  <div style={{marginTop:12}}>
                    <p style={{fontSize:11,color:mu(D),textAlign:"center",marginBottom:8}}>How well did you know this?</p>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
                      {SM2_BTNS.map(btn=>(
                        <button key={btn.q} onClick={()=>doSM2(btn.q)}
                          style={{padding:"10px 4px",borderRadius:12,border:`2px solid ${btn.color}`,background:"transparent",cursor:"pointer",transition:"all .12s",color:btn.color}}
                          onMouseEnter={e=>{e.currentTarget.style.background=btn.color;e.currentTarget.style.color="#fff";}}
                          onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=btn.color;}}>
                          <div style={{fontWeight:700,fontSize:13}}>{btn.label}</div>
                          {!cramMode&&<div style={{fontSize:10,marginTop:2,opacity:0.8}}>{previews[btn.q]}</div>}
                        </button>
                      ))}
                    </div>
                    {!cramMode&&<p style={{fontSize:10,color:mu(D),textAlign:"center",marginTop:6}}>Next review: Again→{previews[0]} · Hard→{previews[1]} · Good→{previews[2]} · Easy→{previews[3]}</p>}
                    {cramMode&&<p style={{fontSize:10,color:"#6366f1",textAlign:"center",marginTop:6}}>🔥 Cram mode — SM-2 scheduling paused, just marking your recall</p>}
                  </div>
                ):(
                  <div style={{display:"flex",gap:12,marginTop:12}}>
                    <button onClick={()=>{setFlip(false);setFcIdx(i=>i>0?i-1:cards.length-1);}} style={{flex:1,padding:"10px 0",borderRadius:12,background:"transparent",border:`1px solid ${bd2}`,color:mu(D),cursor:"pointer",fontSize:13}}>← Prev</button>
                    <button onClick={()=>{setFlip(false);setFcIdx(i=>i<cards.length-1?i+1:0);}} style={{flex:1,padding:"10px 0",borderRadius:12,background:"transparent",border:`1px solid ${bd2}`,color:mu(D),cursor:"pointer",fontSize:13}}>Next →</button>
                  </div>
                )}

                <button onClick={()=>{const cleared={...fcHist};cards.forEach(c=>delete cleared[c.id]);setFCH(cleared);setFcIdx(0);setFlip(false);}}
                  style={{marginTop:14,display:"block",margin:"14px auto 0",fontSize:11,color:mu(D),background:"none",border:"none",cursor:"pointer",textDecoration:"underline"}}>
                  Reset all cards
                </button>
              </>}
            </div>
          )}

          {tab==="questions"&&(
            <div className="fade-in">
              {admin&&<AdminBar D={D} actions={[{label:"＋ Add Question",fn:()=>setModal({mode:"question",sectionId:section.id})}]}/>}
              {qs.length===0&&<div style={{...C(D),padding:32,textAlign:"center",color:mu(D),fontSize:14}}>No questions yet.{admin?" Add one above.":""}</div>}
              {q&&<>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <span style={{fontSize:13,color:mu(D)}}>Question {qIdx+1} of {qs.length}</span>
                  <span style={{fontSize:11,fontWeight:600,padding:"4px 12px",borderRadius:20,background:subj.mid,color:subj.dk}}>{q.marks} mark{q.marks!==1?"s":""}</span>
                </div>

                {admin&&isAdminItem("questions",q)&&(
                  <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginBottom:8}}>
                    <button onClick={()=>setModal({mode:"question",sectionId:section.id,initialItem:q})} style={{...B("#6366f1",true,{fontSize:12,padding:"5px 12px"})}}>✏️ Edit</button>
                    <button onClick={()=>handleDeleteQ(q.id)} style={{...B("#ef4444",true,{fontSize:12,padding:"5px 12px"})}}>🗑 Delete</button>
                  </div>
                )}

                <div style={{...C(D),padding:24,marginBottom:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
                    <span style={{fontSize:11,fontWeight:600,letterSpacing:"0.06em",color:mu(D),textTransform:"uppercase"}}>{q.type==="mcq"?"Multiple Choice":q.type==="short"?"Short Answer":"Extended Response"}</span>
                    {q.year&&<span style={{fontSize:11,color:mu(D)}}>{q.year}</span>}
                  </div>
                  {(q.images||[]).map((img,ii)=><AnnotatedImage key={ii} img={img} D={D}/>)}
                  <ContentBlock content={q.text} D={D} fontSize={14} style={{marginBottom:18}}/>

                  {q.type==="mcq"&&(
                    <div style={{display:"flex",flexDirection:"column",gap:8}}>
                      {q.options.map((opt,oi)=>{
                        const sel=selOpt===oi, correct=oi===q.answer, rev=qRes!=null;
                        let bg2=D?"#1f2937":"#f9fafb",br2=bd2,co2=tx(D);
                        if(rev&&correct){bg2="#dcfce7";br2="#22c55e";co2="#15803d";}
                        else if(rev&&sel&&!correct){bg2="#fee2e2";br2="#ef4444";co2="#b91c1c";}
                        return (
                          <button key={oi} onClick={()=>{if(!qRes){
                            const isCorrect=oi===q.answer;
                            setSelOpt(oi);setQRes(isCorrect?"correct":"wrong");
                            markTodayActive();
                            setStats(s=>{
                              const wq={...s.weakQ};wq[section.id]={wrong:(wq[section.id]?.wrong||0)+(isCorrect?0:1),total:(wq[section.id]?.total||0)+1};
                              const ss={...s.subjStats};ss[subj.id]={...ss[subj.id],qS:(ss[subj.id]?.qS||0)+(isCorrect?1:0),qM:(ss[subj.id]?.qM||0)+1,fcC:ss[subj.id]?.fcC||0,fcT:ss[subj.id]?.fcT||0};
                              return{...s,qS:s.qS+(isCorrect?1:0),qM:s.qM+1,weakQ:wq,subjStats:ss};
                            });
                          }}}
                            style={{textAlign:"left",padding:"11px 16px",borderRadius:10,border:`1.5px solid ${br2}`,background:bg2,cursor:qRes?"default":"pointer",color:co2,fontSize:13,transition:"all .15s"}}>
                            <span style={{fontFamily:"monospace",marginRight:10,fontSize:11}}>{"ABCD"[oi]}.</span>{opt}
                          </button>
                        );
                      })}
                      {qRes&&<div style={{marginTop:8,padding:14,borderRadius:12,background:qRes==="correct"?"#dcfce7":"#fee2e2",border:`1px solid ${qRes==="correct"?"#22c55e":"#ef4444"}`,color:qRes==="correct"?"#15803d":"#b91c1c",fontSize:13}}>
                        <p style={{fontWeight:700,marginBottom:4}}>{qRes==="correct"?"✓ Correct!":"✗ Incorrect"}</p>
                        <p style={{lineHeight:1.65}}>{q.explanation}</p>
                      </div>}
                    </div>
                  )}

                  {(q.type==="short"||q.type==="extended")&&<div>
                    <textarea value={textAns} onChange={e=>setTA(e.target.value)} disabled={!!qRes} rows={q.type==="extended"?7:3}
                      placeholder={`Write your answer here… [${q.marks} mark${q.marks!==1?"s":""}]`}
                      style={{...I(D,{resize:"vertical",lineHeight:1.65})}}/>
                    {!qRes&&(
                      <button onClick={async()=>{
                        if(!textAns.trim())return; setMark(true); markTodayActive();
                        try{
                          const r=await markAnswer(q,textAns);
                          const pct=q.marks>0?r.score/q.marks:0;
                          setQRes(r);
                          setStats(s=>{
                            const wq={...s.weakQ};wq[section.id]={wrong:(wq[section.id]?.wrong||0)+(pct<0.5?1:0),total:(wq[section.id]?.total||0)+1};
                            const ss={...s.subjStats};ss[subj.id]={...ss[subj.id],qS:(ss[subj.id]?.qS||0)+(r.score||0),qM:(ss[subj.id]?.qM||0)+q.marks,fcC:ss[subj.id]?.fcC||0,fcT:ss[subj.id]?.fcT||0};
                            return{...s,qS:s.qS+(r.score||0),qM:s.qM+q.marks,weakQ:wq,subjStats:ss};
                          });
                        }catch(e){setQRes({score:"?",feedback:"ReviseIQ AI unavailable — please try again.",missedPoints:[],modelAnswer:q.sampleAnswer||"",examTip:""});}
                        setMark(false);
                      }} disabled={!textAns.trim()||marking}
                        style={{marginTop:10,width:"100%",background:textAns.trim()&&!marking?"#6366f1":"#9ca3af",color:"#fff",border:"none",borderRadius:12,padding:"12px 0",fontSize:14,fontWeight:600,cursor:textAns.trim()&&!marking?"pointer":"not-allowed"}}>
                        {marking?"⏳ Marking with ReviseIQ AI…":"Submit for ReviseIQ AI Marking →"}
                      </button>
                    )}
                    {qRes&&typeof qRes==="object"&&qRes.feedback&&(
                      <div style={{marginTop:14,...C(D),padding:20,background:D?"#1a1a2e":"#f8f7ff",borderColor:"#6366f1"}} className="fade-in">
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                          <span style={{fontWeight:700,fontSize:15}}>ReviseIQ AI Marking Result</span>
                          <span style={{fontSize:22,fontWeight:800,color:qRes.score>=q.marks*.7?"#16a34a":qRes.score>=q.marks*.4?"#d97706":"#dc2626"}}>{qRes.score}/{q.marks}</span>
                        </div>
                        <p style={{fontSize:13,lineHeight:1.7,color:D?"#d1d5db":"#374151",marginBottom:10}}>{qRes.feedback}</p>
                        {qRes.missedPoints?.length>0&&<div style={{marginBottom:10}}>
                          <p style={{fontSize:12,fontWeight:600,color:"#dc2626",marginBottom:5}}>Missed points:</p>
                          {qRes.missedPoints.map((pt,i)=><div key={i} style={{fontSize:12,color:"#dc2626",display:"flex",gap:6,marginBottom:2}}><span>•</span><span>{pt}</span></div>)}
                        </div>}
                        {qRes.examTip&&<div style={{padding:"9px 12px",borderRadius:10,background:D?"#1e2f4a":"#eff6ff",border:"1px solid #bfdbfe",marginBottom:10}}>
                          <p style={{fontSize:12,color:"#1d4ed8"}}>💡 <strong>Exam tip:</strong> {qRes.examTip}</p>
                        </div>}
                        <button onClick={()=>setSmMdl(!showMdl)} style={{fontSize:12,color:mu(D),background:"none",border:"none",cursor:"pointer",textDecoration:"underline"}}>{showMdl?"Hide":"Show"} model answer</button>
                        {showMdl&&<div style={{marginTop:8,padding:14,borderRadius:10,background:D?"#111827":"#f9fafb",border:`1px solid ${bd2}`,fontSize:13,color:D?"#d1d5db":"#374151",lineHeight:1.7}}>
                          <ContentBlock content={qRes.modelAnswer||q.sampleAnswer||""} D={D} fontSize={13}/>
                        </div>}
                      </div>
                    )}
                  </div>}
                </div>
                {qRes&&(
                  <button onClick={()=>{setQIdx(i=>i<qs.length-1?i+1:0);setQRes(null);setSelOpt(null);setTA("");setSmMdl(false);}}
                    style={{width:"100%",...B(subj.accent,false,{padding:"12px 0",borderRadius:12,fontSize:14})}}>
                    {qIdx<qs.length-1?"Next Question →":"↺ Restart"}
                  </button>
                )}
              </>}
            </div>
          )}
        </div>

        {modal?.mode==="note"&&<CreateModal mode="note" D={D} subjects={subjects} initialItem={modal.initialItem} onClose={()=>setModal(null)} onSave={item=>modal.initialItem?editInSection(modal.sectionId,"notes",item):addToSection(modal.sectionId,"notes",item)}/>}
        {modal?.mode==="flashcard"&&<CreateModal mode="flashcard" D={D} subjects={subjects} initialItem={modal.initialItem} onClose={()=>setModal(null)} onSave={item=>modal.initialItem?editInSection(modal.sectionId,"flashcards",item):addToSection(modal.sectionId,"flashcards",item)}/>}
        {modal?.mode==="question"&&<CreateModal mode="question" D={D} subjects={subjects} initialItem={modal.initialItem} onClose={()=>setModal(null)} onSave={item=>modal.initialItem?editInSection(modal.sectionId,"questions",item):addToSection(modal.sectionId,"questions",item)}/>}
      </div>
    );
  }

  if(screen==="dashboard"){
    const fcPct=stats.fcT>0?Math.round((stats.fcC/stats.fcT)*100):0;
    const qPct=stats.qM>0?Math.round((stats.qS/stats.qM)*100):0;
    const totalCustom=Object.values(boardData).reduce((a,b)=>a+(b.custom?.length||0),0);
    const totalPapers=Object.values(boardData).reduce((a,b)=>a+(b.papers?.length||0),0);
    const longestStreak=calcLongestStreak(activityDates);

    // ── Heatmap (16 weeks, colour-intensity by count) ──────────────────────
    const hmWeeks=[];
    const hmToday=new Date(); hmToday.setHours(0,0,0,0);
    const hmDow=hmToday.getDay()===0?6:hmToday.getDay()-1;
    const hmStart=new Date(hmToday); hmStart.setDate(hmStart.getDate()-hmDow-15*7);
    for(var hw=0;hw<16;hw++){
      const wk=[];
      for(var hd=0;hd<7;hd++){
        const dt=new Date(hmStart); dt.setDate(dt.getDate()+hw*7+hd);
        const k=dt.toISOString().slice(0,10);
        const cnt=activityCounts[k]||0;
        wk.push({k,cnt,isToday:k===todayStr()});
      }
      hmWeeks.push(wk);
    }
    function hmColor(cnt,D){
      if(cnt===0) return D?"#1f2937":"#f3f4f6";
      if(cnt===1) return D?"#7c3aed":"#c4b5fd";
      if(cnt===2) return D?"#6d28d9":"#a78bfa";
      if(cnt>=3)  return D?"#4c1d95":"#7c3aed";
      return D?"#1f2937":"#f3f4f6";
    }
    // Day-month labels for heatmap x-axis
    const hmMonthLabels=[];
    hmWeeks.forEach(function(wk,wi){
      const mo=new Date(wk[0].k+"T12:00:00").toLocaleDateString("en-GB",{month:"short"});
      if(wi===0||mo!==hmMonthLabels[hmMonthLabels.length-1].label){
        hmMonthLabels.push({wi,label:mo});
      }
    });

    // ── Study time estimate ────────────────────────────────────────────────
    const estSecsFc=stats.fcT*30;
    const estSecsQ=stats.qM*180;
    const estTotalMins=Math.round((estSecsFc+estSecsQ)/60);
    const estHrs=Math.floor(estTotalMins/60);
    const estMin=estTotalMins%60;
    const estLabel=estHrs>0?(estHrs+"h "+(estMin>0?estMin+"m":"")):(estMin+"m");

    // ── Grade trajectory chart ─────────────────────────────────────────────
    const subjsWithData=ALL_SUBJECTS.filter(function(s){
      return gradeSnapshots.some(function(snap){return snap.grades&&snap.grades[s.id]!=null;});
    });
    // For display, max 5 subjects (those with most data points)
    const trajSubjs=subjsWithData.slice(0,6);
    const trajData=gradeSnapshots.map(function(snap){
      const pt={date:snap.date.slice(5)};// MM-DD
      trajSubjs.forEach(function(s){
        if(snap.grades&&snap.grades[s.id]!=null){
          // Convert pct to a numeric grade (9=highest) for the chart
          var g=pctToGrade(snap.grades[s.id]);
          var gNum=g==="U"?0:(isNaN(parseInt(g))?0:parseInt(g));
          pt[s.id]=gNum;
        }
      });
      return pt;
    });

    // ── Radar chart data ───────────────────────────────────────────────────
    const radarData=ALL_SUBJECTS.map(function(s){
      const ss=stats.subjStats&&stats.subjStats[s.id];
      const pct=ss&&ss.qM>0?Math.round((ss.qS/ss.qM)*100):0;
      return {subject:s.icon+" "+s.name.split(" ")[0], pct:pct, fullName:s.name};
    });
    const hasRadarData=radarData.some(function(r){return r.pct>0;});

    return (
      <div style={{minHeight:"100vh",background:bg,color:tx(D)}} className="fade-in">
        <Header {...hProps}/>
        <div style={{maxWidth:900,margin:"0 auto",padding:"32px 24px"}}>
          <button onClick={()=>setScreen("home")} style={{fontSize:13,color:mu(D),background:"none",border:"none",cursor:"pointer",marginBottom:24}}>← Home</button>
          <h2 style={{fontSize:22,fontWeight:700,marginBottom:22}}>📊 Progress Dashboard</h2>

          {/* Streak + Heatmap card */}
          <div style={{...C(D),padding:22,marginBottom:18,background:streak>0?(D?"rgba(249,115,22,0.05)":""):undefined,borderColor:streak>=7?"#f97316":undefined}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
              <div>
                <h3 style={{fontWeight:700,fontSize:15,marginBottom:2}}>🔥 Study Streak</h3>
                <p style={{fontSize:12,color:mu(D)}}>Study every day to build your streak!</p>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:40,fontWeight:900,color:streak>=7?"#f97316":streak>0?"#f59e0b":mu(D),lineHeight:1}}>{streak}</div>
                <div style={{fontSize:11,color:mu(D)}}>day streak</div>
              </div>
            </div>
            <div style={{display:"flex",gap:20,marginBottom:16,flexWrap:"wrap"}}>
              {[{icon:"🏆",val:longestStreak,label:"Longest streak"},{icon:"📅",val:activityDates.size,label:"Days studied"},{icon:"📆",val:streak,label:"Current streak"},{icon:"⏱️",val:estLabel||"0m",label:"Study time est."}].map(function(s){return (
                <div key={s.label} style={{textAlign:"center"}}>
                  <div style={{fontSize:20,marginBottom:2}}>{s.icon}</div>
                  <div style={{fontSize:22,fontWeight:800}}>{s.val}</div>
                  <div style={{fontSize:11,color:mu(D)}}>{s.label}</div>
                </div>
              );})}
            </div>

            {/* Intensity heatmap */}
            <div>
              <p style={{fontSize:11,color:mu(D),marginBottom:5,textTransform:"uppercase",letterSpacing:"0.05em",fontWeight:600}}>Activity heatmap — 16 weeks</p>
              <div style={{overflowX:"auto",paddingBottom:4}}>
                <div style={{display:"inline-flex",gap:3,minWidth:"max-content"}}>
                  {hmWeeks.map(function(wk,wi){return (
                    <div key={wi} style={{display:"flex",flexDirection:"column",gap:3}}>
                      {wk.map(function(cell){return (
                        <div key={cell.k}
                          title={cell.k+(cell.cnt>0?" · "+cell.cnt+" session"+(cell.cnt!==1?"s":""):"")}
                          style={{width:13,height:13,borderRadius:2,
                            background:hmColor(cell.cnt,D),
                            border:cell.isToday?"2px solid #6366f1":"2px solid transparent",
                            transition:"background .2s",cursor:"default"}}/>
                      );})}
                    </div>
                  );})}
                  <div style={{marginLeft:6,display:"flex",flexDirection:"column",justifyContent:"space-between",paddingTop:1,paddingBottom:1}}>
                    {["M","W","F","S"].map(function(d){return <span key={d} style={{fontSize:8,color:mu(D),lineHeight:"13px"}}>{d}</span>;})}</div>
                </div>
              </div>
              {/* Legend */}
              <div style={{display:"flex",alignItems:"center",gap:5,marginTop:6}}>
                <span style={{fontSize:10,color:mu(D)}}>Less</span>
                {[0,1,2,3].map(function(n){return <div key={n} style={{width:11,height:11,borderRadius:2,background:hmColor(n,D)}}/>;}) }
                <span style={{fontSize:10,color:mu(D)}}>More</span>
              </div>
            </div>
          </div>

          {/* Stats summary row */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:18}}>
            {[
              {icon:"📚",val:ALL_SUBJECTS.length,label:"Subjects"},
              {icon:"🔄",val:stats.fcT,label:"Cards reviewed"},
              {icon:"✏️",val:totalCustom,label:"Topics added"},
              {icon:"📄",val:totalPapers,label:"Past papers"},
            ].map(function(s,i){return (
              <div key={i} style={{...C(D),padding:18,textAlign:"center"}}>
                <div style={{fontSize:22,marginBottom:5}}>{s.icon}</div>
                <div style={{fontSize:26,fontWeight:800,marginBottom:2}}>{s.val}</div>
                <div style={{fontSize:11,color:mu(D)}}>{s.label}</div>
              </div>
            );})}
          </div>

          {/* Grade trajectory line chart */}
          {trajData.length>=2&&trajSubjs.length>0&&(
            <div style={{...C(D),padding:22,marginBottom:18}}>
              <h3 style={{fontWeight:700,marginBottom:4}}>📈 Grade Trajectory</h3>
              <p style={{fontSize:12,color:mu(D),marginBottom:14}}>Predicted grade per subject over time (1=low, 9=high).</p>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trajData} margin={{top:4,right:12,left:-20,bottom:0}}>
                  <XAxis dataKey="date" tick={{fontSize:10,fill:mu(D)}} tickLine={false} axisLine={false}/>
                  <YAxis domain={[0,9]} ticks={[1,2,3,4,5,6,7,8,9]} tick={{fontSize:10,fill:mu(D)}} tickLine={false} axisLine={false}/>
                  <Tooltip
                    contentStyle={{background:D?"#1f2937":"#fff",border:"1px solid "+(D?"#374151":"#e5e7eb"),borderRadius:8,fontSize:11}}
                    formatter={function(val,name){
                      var s=ALL_SUBJECTS.find(function(s){return s.id===name;});
                      return [val?"Grade "+val:"—", s?s.name:name];
                    }}
                  />
                  {trajSubjs.map(function(s){return (
                    <Line key={s.id} type="monotone" dataKey={s.id} stroke={s.accent}
                      strokeWidth={2} dot={{r:3,fill:s.accent}} connectNulls activeDot={{r:5}}/>
                  );})}
                </LineChart>
              </ResponsiveContainer>
              <div style={{display:"flex",gap:12,flexWrap:"wrap",marginTop:8}}>
                {trajSubjs.map(function(s){return (
                  <span key={s.id} style={{fontSize:11,display:"flex",alignItems:"center",gap:4}}>
                    <span style={{width:10,height:10,borderRadius:"50%",background:s.accent,display:"inline-block"}}/>
                    {s.name}
                  </span>
                );})}
              </div>
            </div>
          )}
          {trajData.length<2&&(
            <div style={{...C(D),padding:22,marginBottom:18,textAlign:"center"}}>
              <p style={{fontSize:13,color:mu(D)}}>📈 <strong>Grade Trajectory</strong> — answer questions across multiple sessions to see your progress over time.</p>
            </div>
          )}

          {/* Radar chart */}
          <div style={{...C(D),padding:22,marginBottom:18}}>
            <h3 style={{fontWeight:700,marginBottom:4}}>🕸️ Subject Strength Radar</h3>
            <p style={{fontSize:12,color:mu(D),marginBottom:14}}>Relative strength across all subjects (question score %).</p>
            {hasRadarData?(
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData} margin={{top:10,right:30,left:30,bottom:10}}>
                  <PolarGrid stroke={D?"#374151":"#e5e7eb"}/>
                  <PolarAngleAxis dataKey="subject" tick={{fontSize:10,fill:tx(D)}}/>
                  <Radar name="Score" dataKey="pct" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={2}/>
                  <Tooltip
                    contentStyle={{background:D?"#1f2937":"#fff",border:"1px solid "+(D?"#374151":"#e5e7eb"),borderRadius:8,fontSize:11}}
                    formatter={function(val,_,props){
                      return [val+"%", props&&props.payload&&props.payload.fullName||"Score"];
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ):(
              <p style={{fontSize:13,color:mu(D),textAlign:"center",padding:"32px 0"}}>Answer some questions to see your radar chart.</p>
            )}
          </div>

          {/* Grades by subject */}
          <div style={{...C(D),padding:24,marginBottom:14}}>
            <h3 style={{fontWeight:700,marginBottom:4}}>🎓 Grades by Subject</h3>
            <p style={{fontSize:13,color:mu(D),marginBottom:16}}>Based on your question scores. Set target grades below.</p>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:10}}>
              {ALL_SUBJECTS.map(function(s,si){
                const ss=stats.subjStats&&stats.subjStats[s.id];
                const qPct2=ss&&ss.qM>0?Math.round((ss.qS/ss.qM)*100):null;
                const predicted=qPct2!=null?pctToGrade(qPct2):null;
                const target=targetGrades[s.id]||null;
                const atOrAbove=predicted&&target&&(parseInt(predicted)>=parseInt(target)||predicted===target);
                const gradeOpts=["9","8","7","6","5","4","3","2","1","U"];
                return (
                  <div key={s.id} style={{...C(D),padding:14}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8,cursor:"pointer"}}
                      onClick={async function(){setSubIdx(si);setSubjTab("sections");const b=boardSels[s.id]||DEFAULT_BOARD;await ensureBoardLoaded(s.id,b);setScreen("subject");}}>
                      <div style={{display:"flex",gap:7,alignItems:"center"}}><span style={{fontSize:18}}>{s.icon}</span><span style={{fontSize:13,fontWeight:600}}>{s.name}</span></div>
                      <div style={{display:"flex",gap:5,alignItems:"center"}}>
                        {target&&<span style={{fontSize:11,fontWeight:800,color:"#fff",background:gradeColor(target),padding:"2px 7px",borderRadius:7}}>🎯{target}</span>}
                        <span style={{fontSize:16,fontWeight:800,color:predicted?gradeColor(predicted):mu(D),background:predicted?gradeColor(predicted)+"22":"transparent",padding:"2px 8px",borderRadius:6}}>{predicted||"—"}</span>
                      </div>
                    </div>
                    {qPct2!=null?(
                      <div>
                        <div style={{height:5,borderRadius:5,background:D?"#1f2937":"#e5e7eb",marginBottom:4}}>
                          <div style={{height:"100%",borderRadius:5,background:gradeColor(predicted||"U"),width:qPct2+"%",transition:"width .6s"}}/>
                        </div>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                          <span style={{fontSize:11,color:mu(D)}}>{qPct2}% · {ss.qM} marks</span>
                          {target&&<span style={{fontSize:11,fontWeight:600,color:atOrAbove?"#16a34a":"#d97706"}}>{atOrAbove?"✓ On track":"Keep going"}</span>}
                        </div>
                      </div>
                    ):<p style={{fontSize:11,color:mu(D),marginBottom:8}}>No questions answered yet</p>}
                    <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
                      {gradeOpts.map(function(g){const sel=target===g;const gc=gradeColor(g);return (
                        <button key={g} onClick={function(){setTargetGrades(function(p){return Object.assign({},p,{[s.id]:sel?undefined:g});});}}
                          style={{width:26,height:26,borderRadius:6,border:"2px solid "+(sel?gc:"transparent"),background:sel?gc:(D?"#1f2937":"#f3f4f6"),color:sel?"#fff":(D?"#9ca3af":"#6b7280"),fontWeight:sel?800:500,fontSize:11,cursor:"pointer",transition:"all .15s"}}>{g}</button>
                      );})}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Weakest areas */}
          {(Object.keys(stats.weakQ||{}).length>0||Object.keys(stats.weakFC||{}).length>0)&&(function(){
            const sIds=[...new Set([...Object.keys(stats.weakQ||{}),...Object.keys(stats.weakFC||{})])];
            const scored=sIds.map(function(sid){
              const wq=(stats.weakQ&&stats.weakQ[sid])||{wrong:0,total:0};
              const wf=(stats.weakFC&&stats.weakFC[sid])||{wrong:0,total:0};
              const score=(wq.wrong*2+wf.wrong)/Math.max(wq.total+wf.total,1);
              return{sid,score,wq,wf};
            }).filter(function(x){return x.wq.total+x.wf.total>0;}).sort(function(a,b){return b.score-a.score;}).slice(0,5);
            if(!scored.length)return null;
            return (
              <div style={{...C(D),padding:22}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                  <h3 style={{fontWeight:700}}>🎯 Weakest Areas</h3>
                  <button onClick={function(){setTTSubj(null);setScreen("target");}} style={{...B("#ef4444",false,{fontSize:12,padding:"7px 14px"})}}>Start Target Test</button>
                </div>
                {scored.map(function(x){return (
                  <div key={x.sid} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 12px",borderRadius:10,background:D?"#1f2937":"#fef2f2",marginBottom:5}}>
                    <span style={{fontSize:13}}>{x.sid}</span>
                    <div style={{display:"flex",gap:12}}>
                      {x.wq.total>0&&<span style={{fontSize:11,color:"#dc2626"}}>Q: {x.wq.wrong}/{x.wq.total}</span>}
                      {x.wf.total>0&&<span style={{fontSize:11,color:"#d97706"}}>FC: {x.wf.wrong}/{x.wf.total}</span>}
                    </div>
                  </div>
                );})}
              </div>
            );
          })()}
        </div>
      </div>
    );
  }

  if(screen==="target"){
    const allSecs=subjects.flatMap((s,si)=>{
      const b=boardSels[s.id]||DEFAULT_BOARD;
      const bdata=getBD(s.id,b);
      const merged=mergeTopics(s.topics||[],bdata.custom,bdata.extras);
      return merged.flatMap((t,ti)=>t.sections.map(sec=>({sec,si,ti,subj:s})));
    });
    const scoredSecs=allSecs.map(({sec,si,ti,subj})=>{
      const wq=stats.weakQ?.[sec.id]||{wrong:0,total:0};
      const wf=stats.weakFC?.[sec.id]||{wrong:0,total:0};
      const attempts=wq.total+wf.total;
      const score=attempts>0?(wq.wrong*2+wf.wrong)/attempts:0;
      return{sec,si,ti,subj,score,attempts,wq,wf};
    }).filter(x=>x.sec.questions?.length>0);
    const filtered=ttSubj!=null?scoredSecs.filter(x=>x.si===ttSubj):scoredSecs;
    const sorted=[...filtered].sort((a,b)=>b.score-a.score||b.attempts-a.attempts);
    const buildQueue=()=>{
      const items=[];
      for(const {sec,subj} of sorted){
        const qs=(sec.questions||[]).slice(0,2);
        qs.forEach(q=>items.push({q,secId:sec.id,secTitle:sec.title,subj}));
      }
      return items.slice(0,15);
    };

    if(ttItems.length>0){
      const item=ttItems[ttIdx];
      const q=item?.q;
      const isLast=ttIdx>=ttItems.length-1;
      if(!item)return null;
      const finishTT=()=>{setTTI([]);setTTIdx(0);setTTRes(null);setTTSO(null);setTTTA("");};
      const nextTT=()=>{setTTIdx(i=>i+1);setTTRes(null);setTTSO(null);setTTTA("");};
      return (
        <div style={{minHeight:"100vh",background:bg,color:tx(D)}} className="fade-in">
          <Header {...hProps}/>
          <div style={{maxWidth:760,margin:"0 auto",padding:"28px 24px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <div>
                <h2 style={{fontSize:18,fontWeight:700,marginBottom:2}}>🎯 Target Test</h2>
                <p style={{fontSize:12,color:mu(D)}}>Question {ttIdx+1} of {ttItems.length} · {item.secTitle}</p>
              </div>
              <button onClick={finishTT} style={{fontSize:12,color:mu(D),background:"none",border:`1px solid ${bd2}`,borderRadius:8,padding:"6px 12px",cursor:"pointer"}}>End Test</button>
            </div>
            <div style={{height:4,borderRadius:4,background:D?"#1f2937":"#e5e7eb",marginBottom:22}}>
              <div style={{height:"100%",borderRadius:4,background:"#ef4444",width:`${(ttIdx/ttItems.length)*100}%`,transition:"width .4s"}}/>
            </div>
            <div style={{...C(D),padding:24,marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
                <span style={{fontSize:11,fontWeight:600,color:mu(D),textTransform:"uppercase",letterSpacing:"0.06em"}}>{q.type==="mcq"?"MCQ":q.type==="short"?"Short Answer":"Extended"}</span>
                <span style={{fontSize:11,fontWeight:600,padding:"3px 10px",borderRadius:20,background:item.subj.mid,color:item.subj.dk}}>{q.marks} mark{q.marks!==1?"s":""}</span>
              </div>
              {(q.images||[]).map((img,ii)=><AnnotatedImage key={ii} img={img} D={D}/>)}
              <ContentBlock content={q.text} D={D} fontSize={14} style={{marginBottom:16}}/>
              {q.type==="mcq"&&(
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {q.options.map((opt,oi)=>{
                    const sel=ttSelOpt===oi,correct=oi===q.answer,rev=ttRes!=null;
                    let bg2=D?"#1f2937":"#f9fafb",br2=bd2,co2=tx(D);
                    if(rev&&correct){bg2="#dcfce7";br2="#22c55e";co2="#15803d";}
                    else if(rev&&sel&&!correct){bg2="#fee2e2";br2="#ef4444";co2="#b91c1c";}
                    return (
                      <button key={oi} onClick={()=>{if(!ttRes){
                        const isCorrect=oi===q.answer;setTTSO(oi);setTTRes(isCorrect?"correct":"wrong");
                        markTodayActive();
                        setStats(s=>{const wq={...s.weakQ};wq[item.secId]={wrong:(wq[item.secId]?.wrong||0)+(isCorrect?0:1),total:(wq[item.secId]?.total||0)+1};return{...s,qS:s.qS+(isCorrect?1:0),qM:s.qM+1,weakQ:wq};});
                      }}} style={{textAlign:"left",padding:"11px 16px",borderRadius:10,border:`1.5px solid ${br2}`,background:bg2,cursor:ttRes?"default":"pointer",color:co2,fontSize:13,transition:"all .15s"}}>
                        <span style={{fontFamily:"monospace",marginRight:10,fontSize:11}}>{"ABCD"[oi]}.</span>{opt}
                      </button>
                    );
                  })}
                  {ttRes&&<div style={{marginTop:8,padding:14,borderRadius:12,background:ttRes==="correct"?"#dcfce7":"#fee2e2",border:`1px solid ${ttRes==="correct"?"#22c55e":"#ef4444"}`,color:ttRes==="correct"?"#15803d":"#b91c1c",fontSize:13}}>
                    <p style={{fontWeight:700,marginBottom:4}}>{ttRes==="correct"?"✓ Correct!":"✗ Incorrect"}</p>
                    <p>{q.explanation}</p>
                  </div>}
                </div>
              )}
              {(q.type==="short"||q.type==="extended")&&<div>
                <textarea value={ttTextAns} onChange={e=>setTTTA(e.target.value)} disabled={!!ttRes} rows={q.type==="extended"?6:3}
                  placeholder={`Write your answer… [${q.marks} mark${q.marks!==1?"s":""}]`} style={{...I(D,{resize:"vertical",lineHeight:1.65})}}/>
                {!ttRes&&<button onClick={async()=>{
                  if(!ttTextAns.trim())return; setTTMk(true); markTodayActive();
                  try{
                    const r=await markAnswer(q,ttTextAns);setTTRes(r);
                    const pct=q.marks>0?r.score/q.marks:0;
                    setStats(s=>{const wq={...s.weakQ};wq[item.secId]={wrong:(wq[item.secId]?.wrong||0)+(pct<0.5?1:0),total:(wq[item.secId]?.total||0)+1};return{...s,qS:s.qS+(r.score||0),qM:s.qM+q.marks,weakQ:wq};});
                  }catch(e){setTTRes({score:"?",feedback:"ReviseIQ AI unavailable — please try again.",missedPoints:[],modelAnswer:q.sampleAnswer||"",examTip:""});}
                  setTTMk(false);
                }} disabled={!ttTextAns.trim()||ttMarking}
                  style={{marginTop:10,width:"100%",background:ttTextAns.trim()&&!ttMarking?"#6366f1":"#9ca3af",color:"#fff",border:"none",borderRadius:12,padding:"11px 0",fontSize:13,fontWeight:600,cursor:ttTextAns.trim()&&!ttMarking?"pointer":"not-allowed"}}>
                  {ttMarking?"⏳ Marking…":"Submit →"}
                </button>}
                {ttRes&&typeof ttRes==="object"&&ttRes.feedback&&(
                  <div style={{marginTop:12,...C(D),padding:18,background:D?"#1a1a2e":"#f8f7ff",borderColor:"#6366f1"}} className="fade-in">
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                      <span style={{fontWeight:700,fontSize:14}}>ReviseIQ AI Marking</span>
                      <span style={{fontSize:20,fontWeight:800,color:ttRes.score>=q.marks*.7?"#16a34a":ttRes.score>=q.marks*.4?"#d97706":"#dc2626"}}>{ttRes.score}/{q.marks}</span>
                    </div>
                    <p style={{fontSize:13,lineHeight:1.65,marginBottom:8}}>{ttRes.feedback}</p>
                    {ttRes.missedPoints?.map((pt,i)=><div key={i} style={{fontSize:12,color:"#dc2626",display:"flex",gap:6,marginBottom:2}}><span>•</span><span>{pt}</span></div>)}
                    {ttRes.examTip&&<div style={{marginTop:8,padding:"8px 12px",borderRadius:8,background:D?"#1e2f4a":"#eff6ff",border:"1px solid #bfdbfe",fontSize:12,color:"#1d4ed8"}}>💡 {ttRes.examTip}</div>}
                  </div>
                )}
              </div>}
            </div>
            {ttRes&&<button onClick={isLast?finishTT:nextTT} style={{width:"100%",...B(isLast?"#10b981":"#ef4444",false,{padding:"12px 0",borderRadius:12,fontSize:14})}}>{isLast?"✓ Complete Test":"Next Question →"}</button>}
          </div>
        </div>
      );
    }

    return (
      <div style={{minHeight:"100vh",background:bg,color:tx(D)}} className="fade-in">
        <Header {...hProps}/>
        <div style={{maxWidth:860,margin:"0 auto",padding:"32px 24px"}}>
          <button onClick={()=>setScreen("home")} style={{fontSize:13,color:mu(D),background:"none",border:"none",cursor:"pointer",marginBottom:20}}>← Home</button>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24,flexWrap:"wrap",gap:12}}>
            <div>
              <h2 style={{fontSize:22,fontWeight:700,marginBottom:4}}>🎯 Target Test</h2>
              <p style={{fontSize:14,color:mu(D)}}>Targets your weakest areas — adapts as you improve</p>
            </div>
            <button onClick={()=>{const q=buildQueue();setTTI(q);setTTIdx(0);setTTRes(null);setTTSO(null);setTTTA("");}} disabled={sorted.length===0}
              style={{...B("#ef4444",false,{fontSize:14,padding:"11px 22px",opacity:sorted.length===0?0.4:1})}}>
              Start Test{ttSubj!=null?` · ${subjects[ttSubj]?.name}`:""}
            </button>
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:22}}>
            <button onClick={()=>setTTSubj(null)} style={{padding:"6px 14px",borderRadius:20,border:`1.5px solid ${ttSubj===null?"#ef4444":bd2}`,background:ttSubj===null?"#ef4444":"transparent",color:ttSubj===null?"#fff":mu(D),cursor:"pointer",fontSize:12,fontWeight:600}}>All subjects</button>
            {subjects.map((s,si)=>(
              <button key={s.id} onClick={()=>setTTSubj(si===ttSubj?null:si)} style={{padding:"6px 14px",borderRadius:20,border:`1.5px solid ${ttSubj===si?s.accent:bd2}`,background:ttSubj===si?s.accent:"transparent",color:ttSubj===si?"#fff":mu(D),cursor:"pointer",fontSize:12,fontWeight:600}}>{s.icon} {s.name}</button>
            ))}
          </div>
          {sorted.length===0
            ?<div style={{...C(D),padding:48,textAlign:"center"}}><p style={{fontSize:32,marginBottom:12}}>📋</p><p style={{fontWeight:700,fontSize:16,marginBottom:6}}>No data yet</p><p style={{fontSize:13,color:mu(D)}}>Answer questions first — Target Test will identify your weak spots.</p></div>
            :<div style={{...C(D),padding:24}}>
              <h3 style={{fontWeight:700,marginBottom:4}}>Weakness Analysis</h3>
              <p style={{fontSize:13,color:mu(D),marginBottom:16}}>Ranked by weakness · Questions weight 2×, flashcards 1×</p>
              {sorted.slice(0,12).map(({sec,subj,score,wq,wf},i)=>{
                const pct=Math.round(score*100);
                const col=pct>60?"#dc2626":pct>30?"#d97706":"#16a34a";
                return (
                  <div key={sec.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:`1px solid ${bd2}`}}>
                    <span style={{fontSize:13,fontWeight:700,color:col,width:28,flexShrink:0}}>#{i+1}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:600,marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{sec.title}</div>
                      <div style={{fontSize:11,color:mu(D)}}>{subj.icon} {subj.name}</div>
                    </div>
                    <div style={{display:"flex",gap:14,flexShrink:0}}>
                      {wq.total>0&&<div style={{textAlign:"center"}}><div style={{fontSize:13,fontWeight:700,color:"#dc2626"}}>{wq.wrong}/{wq.total}</div><div style={{fontSize:10,color:mu(D)}}>Q wrong</div></div>}
                      {wf.total>0&&<div style={{textAlign:"center"}}><div style={{fontSize:13,fontWeight:700,color:"#d97706"}}>{wf.wrong}/{wf.total}</div><div style={{fontSize:10,color:mu(D)}}>FC wrong</div></div>}
                      <div style={{textAlign:"center"}}><div style={{fontSize:13,fontWeight:700,color:col}}>{pct}%</div><div style={{fontSize:10,color:mu(D)}}>weak</div></div>
                    </div>
                  </div>
                );
              })}
            </div>}
        </div>
      </div>
    );
  }

  return null;
}
