// Generic utilities
export const uid = () => (typeof crypto!=="undefined"&&crypto.randomUUID) ? crypto.randomUUID().replace(/-/g,"").slice(0,9) : Math.random().toString(36).slice(2,9);
export const stripHtml = s => (s||"").replace(/<[^>]*>/g,"").trim();
export function _cleanText(s){return (s||"").toLowerCase().replace(/[^a-z0-9\s]/g," ").replace(/\s+/g," ").trim();}

// Account format helpers (supports both legacy string and new {h,gki} object)
export function getAccHash(acc){return typeof acc==="string"?acc:acc?.h;}
export function getAccGki(acc){return typeof acc==="string"?null:(acc?.gki??null);}
export function getAccDisplayName(acc){return (acc&&typeof acc==="object"&&acc.displayName)||"";}

export const GRADES = ["U","1","2","3","4","5","6","7","8","9"];
export const pctToGrade = pct => pct>=90?"9":pct>=80?"8":pct>=70?"7":pct>=60?"6":pct>=50?"5":pct>=40?"4":pct>=30?"3":pct>=20?"2":pct>=10?"1":"U";

// Generates a stable ID from a string for personal subjects
export function _psId(s){ return (s||"").toLowerCase().replace(/[^a-z0-9]/g,"-").replace(/-+/g,"-").slice(0,30)+"-"+Math.random().toString(36).slice(2,6); }

// ── FSRS 4.5 Algorithm ──
export const FSRS_PARAMS = {
  w: [0.4072,1.1829,3.1262,15.4722,7.2102,0.5316,1.0651,0.0589,1.5330,
      0.1544,1.0070,1.9395,0.1100,0.2900,2.2700,0.1500,2.9898,0.5100,0.1400],
  requestRetention: 0.90,
  maximumInterval: 36500,
};

export function fsrsInitialStability(g) {
  return Math.max(FSRS_PARAMS.w[g - 1], 0.1);
}

export function fsrsInitialDifficulty(g) {
  return Math.min(Math.max(
    FSRS_PARAMS.w[4] - Math.exp(FSRS_PARAMS.w[5] * (g - 1)) + 1,
    1), 10);
}

export function fsrsRetrievability(stability, elapsedDays) {
  if (!stability || stability <= 0) return 0;
  return Math.pow(1 + elapsedDays / (9 * stability), -1);
}

export function fsrsNextInterval(stability) {
  const { requestRetention, maximumInterval } = FSRS_PARAMS;
  const interval = (stability / Math.log(requestRetention)) * Math.log(0.9);
  return Math.min(Math.max(Math.round(Math.abs(interval)), 1), maximumInterval);
}

export function fsrsNextDifficulty(d, g) {
  const w = FSRS_PARAMS.w;
  const delta = -w[6] * (g - 3);
  return Math.min(Math.max(
    d + delta * ((10 - d) / 9),
    1), 10);
}

export function fsrsNextStabilityAfterRecall(d, s, r, g) {
  const w = FSRS_PARAMS.w;
  return s * (
    Math.exp(w[8]) *
    (11 - d) *
    Math.pow(s, -w[9]) *
    (Math.exp(w[10] * (1 - r)) - 1) *
    (g === 2 ? w[15] : 1) *
    (g === 4 ? w[16] : 1) + 1
  );
}

export function fsrsNextStabilityAfterForgetting(d, s, r) {
  const w = FSRS_PARAMS.w;
  return w[11] *
    Math.pow(d, -w[12]) *
    (Math.pow(s + 1, w[13]) - 1) *
    Math.exp(w[14] * (1 - r));
}

export function fsrsNext(prevState, rating) {
  const now = Date.now();
  if (!prevState || !prevState.stability) {
    const s = fsrsInitialStability(rating);
    const d = fsrsInitialDifficulty(rating);
    const interval = rating === 1 ? 1 : rating === 2 ? 1 : fsrsNextInterval(s);
    return {
      stability: s, difficulty: d, reps: 1, lapses: 0,
      state: rating === 1 ? 1 : 2,
      lastReview: now, due: now + interval * 86400000, interval, lastRating: rating,
    };
  }
  const { stability, difficulty, reps, lapses, lastReview } = prevState;
  const elapsedDays = Math.max(0, (now - (lastReview || now)) / 86400000);
  const r = fsrsRetrievability(stability, elapsedDays);
  const d = fsrsNextDifficulty(difficulty || 5, rating);
  let nextStability, nextInterval, nextState, nextLapses;
  if (rating === 1) {
    nextStability = fsrsNextStabilityAfterForgetting(d, stability, r);
    nextInterval = 1; nextState = 3; nextLapses = (lapses || 0) + 1;
  } else {
    nextStability = fsrsNextStabilityAfterRecall(d, stability, r, rating);
    nextInterval = fsrsNextInterval(nextStability);
    nextState = 2; nextLapses = lapses || 0;
  }
  return {
    stability: Math.max(nextStability, 0.1), difficulty: d,
    reps: (reps || 0) + 1, lapses: nextLapses, state: nextState,
    lastReview: now, due: now + nextInterval * 86400000,
    interval: nextInterval, lastRating: rating,
  };
}

export function getCardState(fcHist, cardId) {
  const v = fcHist[cardId];
  if (v === undefined || v === null) return null;
  if (typeof v === 'boolean') return null;
  return v;
}

export function isCardDue(fcHist, cardId) {
  const s = getCardState(fcHist, cardId);
  if (!s) return true;
  return Date.now() >= s.due;
}

export function previewIntervals(state) {
  return [1, 2, 3, 4].map(rating => {
    const next = fsrsNext(state, rating);
    const d = next.interval;
    if (d <= 1) return 'today';
    if (d < 7) return `${d}d`;
    if (d < 30) return `${Math.round(d / 7)}w`;
    return `${Math.round(d / 30)}mo`;
  });
}

export function getRetrievability(fcHist, cardId) {
  const s = getCardState(fcHist, cardId);
  if (!s || !s.stability) return null;
  const elapsedDays = (Date.now() - (s.lastReview || Date.now())) / 86400000;
  return Math.round(fsrsRetrievability(s.stability, elapsedDays) * 100);
}

// ── Streaks & Dates ──
export function todayStr() { return new Date().toISOString().slice(0,10); }

export function calcStreak(activityDates) {
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

export function calcLongestStreak(activityDates) {
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

// ── Adaptive & Ladder Logic ──
export function inferDifficulty(q){
  if(q?.difficulty>=1&&q?.difficulty<=5) return q.difficulty;
  var m=Number(q?.marks||1);
  var t=(q?.text||"").toLowerCase();
  var d=m>=8?5:m>=6?4:m>=4?3:m>=2?2:1;
  if(/evaluate|assess|justify/.test(t)) d=Math.min(5,d+1);
  if(/describe|explain|analyse|compare/.test(t)) d=Math.min(5,d+0.5);
  return Math.max(1,Math.min(5,Math.round(d)));
}

export function selectAdaptiveQuestions(list,user,subjectId){
  var arr=(list||[]).map(function(q){return {...q,difficulty:inferDifficulty(q)};});
  if(!user||!subjectId) return arr;
  try{
    var key="gcse:difficultyLevel:"+user.replace(/\W/g,"-")+":"+subjectId;
    var lv=Number(localStorage.getItem(key)||3); if(!lv) lv=3;
    var easy=arr.filter(q=>q.difficulty<lv), mid=arr.filter(q=>q.difficulty===lv), hard=arr.filter(q=>q.difficulty>lv);
    var pick=[],max=Math.min(20,arr.length);
    while(pick.length<max&&(easy.length||mid.length||hard.length)){
      var r=Math.random();
      var pool=r<0.2?easy:r<0.9?mid:hard;
      if(!pool.length) pool=mid.length?mid:(hard.length?hard:easy);
      if(!pool.length) break;
      pick.push(pool.shift());
    }
    return pick.length?pick:arr;
  }catch(_){return arr;}
}

export function updateAdaptiveLevel(user,subjectId,isCorrect){
  if(!user||!subjectId) return;
  try{
    var kH="gcse:difficultyHist:"+user.replace(/\W/g,"-")+":"+subjectId;
    var hist=JSON.parse(localStorage.getItem(kH)||"[]");
    hist=[...hist.slice(-19),isCorrect?1:0];
    localStorage.setItem(kH,JSON.stringify(hist));
    var acc=hist.reduce((a,b)=>a+b,0)/Math.max(hist.length,1);
    var key="gcse:difficultyLevel:"+user.replace(/\W/g,"-")+":"+subjectId;
    var lv=Number(localStorage.getItem(key)||3)||3;
    if(acc>=0.7) lv=Math.min(5,lv+1); else if(acc<0.45) lv=Math.max(1,lv-1);
    localStorage.setItem(key,String(lv));
  }catch(_){}
}

export function getLadderLevel(user,topicId){
  if(!user||!topicId) return 1;
  try{return Math.max(1,Math.min(5,Number(localStorage.getItem("gcse:ladder:"+user.replace(/\W/g,"-")+":"+topicId)||1)||1));}catch(_){return 1;}
}

export function updateLadderLevel(user,topicId,correct){
  if(!user||!topicId) return 1;
  var cur=getLadderLevel(user,topicId);
  var next=Math.max(1,Math.min(5,cur+(correct?1:-1)));
  try{localStorage.setItem("gcse:ladder:"+user.replace(/\W/g,"-")+":"+topicId,String(next));}catch(_){}
  return next;
}

export function verifyExplanation(content, studentExplanation){
  if(typeof window!=="undefined"&&typeof window.verifyExplanation==="function"){
    try{return window.verifyExplanation(content, studentExplanation);}catch(_){}
  }
  var c=_cleanText(stripHtml(content||"")); var s=_cleanText(studentExplanation||"");
  var kws=[...new Set(c.split(" ").filter(w=>w.length>4))].slice(0,10);
  var hit=kws.filter(k=>s.includes(k));
  return {
    correct: s.length>30 ? "You explained key ideas clearly." : "Good start.",
    missing: hit.length<Math.max(2,Math.floor(kws.length/3)) ? "Add detail on: "+kws.slice(0,3).join(", ") : "Add one concrete example."
  };
}

export function generateTransferQuestion(originalQuestion){
  if(typeof window!=="undefined"&&typeof window.generateTransferQuestion==="function"){
    try{return window.generateTransferQuestion(originalQuestion);}catch(_){}
  }
  var q={...(originalQuestion||{})};
  var t=(q.text||"").replace(/\b(\d+)\b/g,function(m){return String(Number(m)+1);});
  return {...q,id:"tr-"+uid(),text:"Apply It: "+(t||"Use this idea in a new context."),_transfer:true};
}

// ── Session Generation ──
export function getWeekKey(d){
  var dt=new Date(d||Date.now()); var onejan=new Date(dt.getFullYear(),0,1); var day=Math.floor((dt-onejan)/86400000);
  return dt.getFullYear()+"-W"+Math.ceil((day+onejan.getDay()+1)/7);
}

export function generateWeeklyPlan(user, subjects, allSections, fcHist, stats, timetableExams){
  var week=getWeekKey();
  var key="gcse:weeklyPlan:"+(user||"").replace(/\W/g,"-")+":"+week;
  try{var ex=JSON.parse(localStorage.getItem(key)||"null"); if(ex&&Array.isArray(ex)) return ex;}catch(_){}
  var due=allSections.flatMap(s=>(s.flashcards||[]).filter(c=>isCardDue(fcHist,c.id)).map(()=>s.title)).slice(0,3);
  var weak=Object.entries(stats?.weakQ||{}).sort((a,b)=>(b[1]?.wrong||0)-(a[1]?.wrong||0)).slice(0,3).map(x=>x[0]);
  var examSoon=(timetableExams||[]).slice().sort((a,b)=>a.date.localeCompare(b.date))[0];
  var base=["Review due flashcards"+(due[0]?" ("+due[0]+")":""),"Do 10 mixed questions"+(weak[0]?" on "+weak[0]:""),examSoon?"Exam prep for "+(examSoon.label||"upcoming exam"):"Revise weakest topic"];
  var days=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
  var plan=days.map(function(d,i){return {day:d,tasks:[base[i%base.length]]};});
  try{localStorage.setItem(key,JSON.stringify(plan));}catch(_){}
  return plan;
}

export function generateSessionOptions(user, subjectId, allSections, stats, fcHist){
  var secs=allSections.filter(s=>s.subjectId===subjectId);
  var due=secs.find(s=>(s.flashcards||[]).some(c=>isCardDue(fcHist,c.id)));
  var weakId=Object.entries(stats?.weakQ||{}).sort((a,b)=>(b[1]?.wrong||0)-(a[1]?.wrong||0))[0]?.[0];
  var weak=secs.find(s=>s.id===weakId)||secs[0];
  return [
    {title:"Due Card Sprint",description:"Clear due flashcards in "+(due?.title||"this topic"),action:{type:"flashcards",sectionId:due?.id}},
    {title:"Weak Spot Drill",description:"Target weaker questions in "+(weak?.title||"your topic"),action:{type:"questions",sectionId:weak?.id}},
    {title:"Mixed Focus",description:"Blend flashcards + exam questions",action:{type:"target"}},
    {title:"Interleaved Session",description:"Round-robin mixed topics for stronger transfer",action:{type:"interleaved",subjectId:subjectId}}
  ];
}

export function generateInterleavedSession(subjectId, allSections){
  var secs=(allSections||[]).filter(function(s){return s.subjectId===subjectId;});
  var byTopic={};
  secs.forEach(function(sec){
    var t=sec.topicId||sec.id;
    if(!byTopic[t]) byTopic[t]=[];
    (sec.flashcards||[]).forEach(function(c){byTopic[t].push({kind:"flashcard",sectionId:sec.id,topicId:t,item:c});});
    (sec.questions||[]).forEach(function(q){byTopic[t].push({kind:"question",sectionId:sec.id,topicId:t,item:q});});
  });
  var topicIds=Object.keys(byTopic).filter(function(t){return byTopic[t].length>0;}).slice(0,8);
  if(topicIds.length<3) return [];
  var idx=0; var out=[]; var lastTopic=null; var guard=0;
  while(guard<2000){
    guard++;
    var nonEmpty=topicIds.filter(function(t){return byTopic[t]&&byTopic[t].length;});
    if(!nonEmpty.length) break;
    var pick=nonEmpty[idx%nonEmpty.length];
    idx++;
    if(pick===lastTopic&&nonEmpty.length>1){
      pick=nonEmpty.find(function(t){return t!==lastTopic;})||pick;
    }
    var next=(byTopic[pick]||[]).shift();
    if(!next) continue;
    out.push(next);
    lastTopic=pick;
  }
  return out;
}

// ── Card Variants ──
export function getVariantStorageKey(user, cardId){
  return "gcse:variants:"+String(user||"anon").replace(/\W/g,"-")+":"+String(cardId||"");
}

export function simpleParaphrase(text){
  var s=String(text||"");
  var map={
    "explain":"describe","describe":"outline","define":"state clearly","because":"since","therefore":"so","important":"significant",
    "process":"sequence","increase":"rise","decrease":"fall","difference":"distinction","causes":"leads to","effect":"impact"
  };
  Object.keys(map).forEach(function(k){
    var re=new RegExp("\\b"+k+"\\b","gi");
    s=s.replace(re,function(m){ return m===m.toUpperCase()?map[k].toUpperCase():map[k];});
  });
  return s;
}

export async function generateParaphrasedCard(card){
  var base=String(card?.q||card?.text||"");
  if(!base.trim()) return "";
  if(typeof window!=="undefined"&&typeof window.generateParaphrase==="function"){
    try{
      var ai=await window.generateParaphrase(base, card);
      if(ai&&String(ai).trim()) return String(ai).trim();
    }catch(_){}
  }
  return simpleParaphrase(base);
}

export function readCardVariants(user, cardId){
  try{
    var arr=JSON.parse(localStorage.getItem(getVariantStorageKey(user,cardId))||"[]");
    return Array.isArray(arr)?arr:[];
  }catch(_){return [];}
}

export async function ensureCardVariantCached(user, card, reviewCount, stability){
  if(!card||reviewCount<3||Number(stability||0)<=7) return null;
  var existing=readCardVariants(user, card.id);
  if(existing.length) return existing[0];
  var text=await generateParaphrasedCard(card);
  if(!text||text.trim()===String(card.q||card.text||"").trim()) return null;
  var variant={text:text,createdAt:new Date().toISOString()};
  try{ localStorage.setItem(getVariantStorageKey(user,card.id), JSON.stringify([variant])); }catch(_){}
  return variant;
}

export function maybeUseVariantText(user, card, reviewCount, stability){
  if(!card||reviewCount<3||Number(stability||0)<=7) return null;
  var variants=readCardVariants(user,card.id);
  if(!variants.length) return null;
  var p=Math.random();
  if(p<0.3 || p>0.5) return null;
  return variants[0]?.text||null;
}

// ── Progress Reports & Groups ──
export function buildProgressSummary(userData){
  if(typeof window!=="undefined"&&typeof window.generateSummary==="function"){
    try{ return window.generateSummary(userData); }catch(_){}
  }
  var weak=(userData.weakestTopics||[]).slice(0,3).join(", ")||"None identified";
  return "You are on a "+(userData.streak||0)+" day streak, studied "+(userData.totalDaysStudied||0)+" days, attempted "+(userData.questionsAttempted||0)+" questions, and your readiness score is "+(userData.readinessScore||0)+"%. Focus next on: "+weak+".";
}

export function generateProgressReport(userData){
  var summary=buildProgressSummary(userData);
  var w=window.open("","_blank","width=900,height=700");
  if(!w) return false;
  var html='<!doctype html><html><head><title>ReviseIQ Progress Report</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#111}h1{margin-bottom:0}table{border-collapse:collapse;width:100%;margin-top:14px}td,th{border:1px solid #ddd;padding:8px;text-align:left}.muted{color:#666}</style></head><body><h1>ReviseIQ Progress Report</h1><p class=\"muted\">Generated '+new Date().toLocaleString()+'</p><table><tr><th>Metric</th><th>Value</th></tr><tr><td>Current streak</td><td>'+(userData.streak||0)+'</td></tr><tr><td>Total days studied</td><td>'+(userData.totalDaysStudied||0)+'</td></tr><tr><td>Questions attempted</td><td>'+(userData.questionsAttempted||0)+'</td></tr><tr><td>Weakest topics</td><td>'+((userData.weakestTopics||[]).join(", ")||"None")+'</td></tr><tr><td>Readiness score</td><td>'+(userData.readinessScore||0)+'%</td></tr></table><h3>Summary</h3><p>'+String(summary).replace(/</g,"&lt;")+'</p></body></html>';
  w.document.open(); w.document.write(html); w.document.close();
  setTimeout(function(){try{w.print();}catch(_){}},120);
  return true;
}

export function getGroupKey(groupId){ return "gcse:groups:"+String(groupId||"default").replace(/\W/g,"-"); }

export function loadGroup(groupId){
  try{
    var g=JSON.parse(localStorage.getItem(getGroupKey(groupId))||"null");
    if(g&&Array.isArray(g.members)&&Array.isArray(g.leaderboard)) return g;
  }catch(_){}
  return {members:[],leaderboard:[]};
}

export function saveGroup(groupId, group){
  try{localStorage.setItem(getGroupKey(groupId),JSON.stringify(group));}catch(_){}
}

export function upsertGroupScore(groupId, user, deltaQuestions, streak){
  var g=loadGroup(groupId);
  if(g.members.indexOf(user)<0) g.members.push(user);
  var lb=g.leaderboard||[];
  var i=lb.findIndex(function(x){return x.user===user;});
  if(i<0) lb.push({user:user,totalQuestions:Math.max(0,deltaQuestions||0),streak:Math.max(0,streak||0)});
  else{
    lb[i]={...lb[i],totalQuestions:Math.max(0,(lb[i].totalQuestions||0)+(deltaQuestions||0)),streak:Math.max(lb[i].streak||0,streak||0)};
  }
  lb.sort(function(a,b){ return (b.totalQuestions-a.totalQuestions) || (b.streak-a.streak); });
  g.leaderboard=lb;
  saveGroup(groupId,g);
  return g;
}

export function createPeerQuiz(data){
  var id="pq-"+uid();
  var row={id:id,creator:data.creator||"",recipient:data.recipient||"",questions:Array.isArray(data.questions)?data.questions:[],answers:[],score:null,timeTaken:null,createdAt:new Date().toISOString()};
  try{localStorage.setItem("gcse:peerQuiz:"+id,JSON.stringify(row));}catch(_){}
  return id;
}

export function submitPeerQuiz(id, answers, score, timeTaken){
  var key="gcse:peerQuiz:"+id;
  try{
    var row=JSON.parse(localStorage.getItem(key)||"null");
    if(!row) return false;
    row.answers=Array.isArray(answers)?answers:[];
    row.score=Number(score||0);
    row.timeTaken=Number(timeTaken||0);
    row.completedAt=new Date().toISOString();
    localStorage.setItem(key,JSON.stringify(row));
    return true;
  }catch(_){return false;}
}

export function mergeTopics(baseTopics, boardCustom, boardExtras) {
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

export function detectCardType(q) {
  const t = (q||"").toLowerCase();
  if(/calculat|how many|work out|find the|compute|show.*work/.test(t)) return {label:"Calculate",color:"#7c3aed",icon:"🔢"};
  if(/why|explain|because|reason|suggest why/.test(t))                 return {label:"Explain",  color:"#0891b2",icon:"💡"};
  if(/compare|difference|similar|contrast/.test(t))                    return {label:"Compare",  color:"#d97706",icon:"⚖️"};
  if(/predict|suggest|what would|likely|effect of/.test(t))            return {label:"Apply",    color:"#16a34a",icon:"🔬"};
  if(/evaluat|assess|extent|justify|argue/.test(t))                    return {label:"Evaluate", color:"#dc2626",icon:"⭐"};
  return {label:"Recall",color:"#6366f1",icon:"📝"};
}

// Note: CW_MAP and AO_COLORS are moved to uiPrimitives.js in the next step, but detect functions stay here.
export function detectCW(text, cwMap) {
  const t = (text||"").toLowerCase();
  for (const [cw,data] of Object.entries(cwMap)) {
    if (t.startsWith(cw+" ")||t.includes(" "+cw+" ")||t.includes("\n"+cw+" "))
      return {word:cw,...data};
  }
  return null;
}

export function detectAOLabel(q, cwMap, aoColors) {
  if (q.ao && aoColors[q.ao]) return q.ao;
  const cw = detectCW(q.text||"", cwMap);
  if (cw) return cw.ao;
  if (q.type==="extended") return "AO3";
  if (q.type==="short")    return "AO2";
  return "AO1";
}

export function autoHints(q, cwMap) {
  if (q.hints && Array.isArray(q.hints) && q.hints.length>=3) return q.hints;
  const cw = detectCW(q.text||"", cwMap);
  const h1 = cw?`Strategy: ${cw.tip}`:"Think carefully: what command word is used and what type of answer does it require?";
  const msLines = (q.markScheme||"").split("\n").filter(l=>l.trim()&&!l.match(/^Level|^Award|^Do not/i));
  const h2 = msLines.length>0
    ? `Subject clue: think about — ${msLines[0].replace(/[•()\[\]0-9.]+/g,"").trim().slice(0,90)}`
    : "Review your notes on this topic before attempting.";
  const h3 = msLines.length>0
    ? `First mark: ${msLines[0].replace(/[•()\[\]0-9.]+/g,"").trim()}`
    : q.markScheme?`Mark scheme starts: ${q.markScheme.slice(0,100)}…`:"Check key definitions in your notes.";
  return [h1,h2,h3];
}
