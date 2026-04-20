import React from "react";

export const ALL_SUBJECTS = [
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

export const SEMANTIC_COLORS = {
  definition:  { bg_l:"#f0f9ff", bg_d:"rgba(8,145,178,.1)",  border:"#0891B2", label_l:"#0e7490", label_d:"#67e8f9", icon:"📖" },
  process:     { bg_l:"#ecfdf5", bg_d:"rgba(5,150,105,.1)",  border:"#059669", label_l:"#065f46", label_d:"#6ee7b7", icon:"🔄" },
  equation:    { bg_l:"#f5f3ff", bg_d:"rgba(124,58,237,.1)", border:"#7C3AED", label_l:"#6d28d9", label_d:"#c4b5fd", icon:"🔢" },
  mistake:     { bg_l:"#fffbeb", bg_d:"rgba(217,119,6,.1)",  border:"#D97706", label_l:"#b45309", label_d:"#fcd34d", icon:"⚠️" },
  evaluation:  { bg_l:"#fff1f2", bg_d:"rgba(225,29,72,.1)",  border:"#E11D48", label_l:"#be123c", label_d:"#fda4af", icon:"⚖️" },
  practical:   { bg_l:"#f0fdf4", bg_d:"rgba(22,163,74,.1)",  border:"#16A34A", label_l:"#15803d", label_d:"#86efac", icon:"🧪" },
  example:     { bg_l:"#faf5ff", bg_d:"rgba(147,51,234,.1)", border:"#9333EA", label_l:"#7e22ce", label_d:"#d8b4fe", icon:"💡" },
};

// ── SVG DIAGRAM TEMPLATES ────────────────────────────────────────────────────

export function useAttentionLayer() {
  const [activeId, setActiveId] = React.useState(null);
  const [pulsing, setPulsing] = React.useState(null);
  const props = (id) => ({
    onMouseEnter: () => { setActiveId(id); setPulsing(id); setTimeout(()=>setPulsing(null),300); },
    onMouseLeave: () => setActiveId(null),
    onClick: () => { setActiveId(v=>v===id?null:id); setPulsing(id); setTimeout(()=>setPulsing(null),300); },
    style: { opacity: activeId===null||activeId===id?1:0.45, transition:"opacity .18s ease", cursor:"pointer" },
  });
  const isActive = (id) => activeId === id;
  const isPulsing = (id) => pulsing === id;
  return { activeId, props, isActive, isPulsing };
}

export function ProcessFlowDiagram({ steps=[], accent="#059669", D=false, width=600 }) {
  const { props: attn, isActive, isPulsing } = useAttentionLayer();
  const stepW=110, stepH=54, arrowW=28, gap=arrowW;
  const perRow=Math.max(1,Math.floor((width)/(stepW+gap)));
  const rows=[];
  for(let i=0;i<steps.length;i+=perRow) rows.push(steps.slice(i,i+perRow));
  const svgH=rows.length*(stepH+40)+20;
  const bg=D?"#161b27":"#fff";
  const textCol=D?"#e8ecf4":"#111827";
  const subCol=D?"#8896b3":"#6b7280";
  return (
    <svg viewBox={`0 0 ${width} ${svgH}`} width="100%" style={{display:"block",maxWidth:width}}
      xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Process flow diagram">
      <rect width={width} height={svgH} fill={bg} rx="8"/>
      <defs>
        <marker id="arrow-proc" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill={accent}/>
        </marker>
      </defs>
      {rows.map((row,ri)=>{
        const rowY=ri*(stepH+40)+20;
        const reversed=ri%2===1;
        const displayRow=reversed?[...row].reverse():row;
        const totalRowW=displayRow.length*stepW+(displayRow.length-1)*gap;
        const startX=(width-totalRowW)/2;
        return (
          <g key={ri}>
            {displayRow.map((step,si)=>{
              const x=startX+si*(stepW+gap);
              const stepAccent=step.color||accent;
              const sid=step.id||String(ri*100+si);
              const active=isActive(sid);
              const pulse=isPulsing(sid);
              return (
                <g key={sid} {...attn(sid)}>
                  <rect x={x} y={rowY} width={stepW} height={stepH} rx="8"
                    fill={active?(stepAccent+"55"):(stepAccent+(D?"22":"18"))}
                    stroke={stepAccent} strokeWidth="1.5"
                    style={{transform:pulse?"scale(1.04)":"scale(1)",transition:"transform .15s ease",transformOrigin:`${x+stepW/2}px ${rowY+stepH/2}px`}}/>
                  <text x={x+stepW/2} y={rowY+(step.sublabel?stepH/2-4:stepH/2+5)}
                    textAnchor="middle" fontSize="11" fontWeight="600" fill={textCol}
                    fontFamily="Arial,sans-serif" style={{userSelect:"none"}}>{step.label}</text>
                  {step.sublabel&&<text x={x+stepW/2} y={rowY+stepH/2+12}
                    textAnchor="middle" fontSize="9" fill={subCol}
                    fontFamily="Arial,sans-serif" style={{userSelect:"none"}}>{step.sublabel}</text>}
                  {si<displayRow.length-1&&<line x1={x+stepW+2} y1={rowY+stepH/2}
                    x2={x+stepW+gap-2} y2={rowY+stepH/2}
                    stroke={accent} strokeWidth="1.5" markerEnd="url(#arrow-proc)"/>}
                </g>
              );
            })}
            {ri<rows.length-1&&<line
              x1={reversed?startX+stepW/2:startX+(row.length-1)*(stepW+gap)+stepW/2} y1={rowY+stepH}
              x2={reversed?startX+stepW/2:startX+(row.length-1)*(stepW+gap)+stepW/2} y2={rowY+stepH+30}
              stroke={accent} strokeWidth="1.5" markerEnd="url(#arrow-proc)"/>}
          </g>
        );
      })}
    </svg>
  );
}

export function CycleDiagram({ steps=[], accent="#059669", D=false, size=320 }) {
  const { props: attn, isActive, isPulsing } = useAttentionLayer();
  const cx=size/2, cy=size/2, r=size*0.33, nodeR=size*0.095, n=steps.length;
  const bg=D?"#161b27":"#fff";
  const textCol=D?"#e8ecf4":"#111827";
  const subCol=D?"#8896b3":"#6b7280";
  const positions=steps.map((_,i)=>{
    const angle=(2*Math.PI*i/n)-Math.PI/2;
    return {x:cx+r*Math.cos(angle),y:cy+r*Math.sin(angle),angle};
  });
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" style={{display:"block",maxWidth:size}}
      xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Cycle diagram">
      <rect width={size} height={size} fill={bg} rx="8"/>
      <defs>
        <marker id="arrow-cyc" markerWidth="7" markerHeight="5" refX="6" refY="2.5" orient="auto">
          <polygon points="0 0, 7 2.5, 0 5" fill={accent}/>
        </marker>
      </defs>
      {positions.map((pos,i)=>{
        const next=positions[(i+1)%n];
        const stepAccent=steps[i].color||accent;
        const sid=steps[i].id||String(i);
        const active=isActive(sid);
        const pulse=isPulsing(sid);
        const dx=next.x-pos.x, dy=next.y-pos.y;
        const dist=Math.sqrt(dx*dx+dy*dy);
        const ux=dx/dist, uy=dy/dist;
        const x1=pos.x+ux*(nodeR+2), y1=pos.y+uy*(nodeR+2);
        const x2=next.x-ux*(nodeR+8), y2=next.y-uy*(nodeR+8);
        const midX=(x1+x2)/2-uy*18, midY=(y1+y2)/2+ux*18;
        return (
          <g key={sid}>
            <path d={`M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`}
              fill="none" stroke={accent} strokeWidth="1.5" markerEnd="url(#arrow-cyc)"/>
            <g {...attn(sid)}>
              <circle cx={pos.x} cy={pos.y} r={active?nodeR*1.12:nodeR}
                fill={stepAccent+(D?"28":"20")} stroke={stepAccent} strokeWidth="1.5"
                style={{transition:"r .15s ease"}}/>
              <text x={pos.x} y={pos.y+(steps[i].sublabel?-3:4)}
                textAnchor="middle" fontSize="9" fontWeight="600" fill={textCol}
                fontFamily="Arial,sans-serif" style={{userSelect:"none"}}>{steps[i].label}</text>
              {steps[i].sublabel&&<text x={pos.x} y={pos.y+11}
                textAnchor="middle" fontSize="8" fill={subCol}
                fontFamily="Arial,sans-serif" style={{userSelect:"none"}}>{steps[i].sublabel}</text>}
            </g>
          </g>
        );
      })}
    </svg>
  );
}

export function HierarchyTree({ root=null, accent="#0891B2", D=false, width=560 }) {
  const { props: attn, isActive } = useAttentionLayer();
  if(!root) return null;
  const bg=D?"#161b27":"#fff";
  const textCol=D?"#e8ecf4":"#111827";
  const nodeW=100, nodeH=36, levelGap=60;
  function countLeaves(node){if(!node.children||!node.children.length)return 1;return node.children.reduce((s,c)=>s+countLeaves(c),0);}
  function buildLayout(node,depth,xOffset){
    const leaves=countLeaves(node);
    const nodeX=xOffset+(leaves*nodeW+(leaves-1)*12)/2-nodeW/2;
    const nodeY=depth*(nodeH+levelGap)+20;
    const result=[{node,x:nodeX,y:nodeY,depth}];
    if(node.children){let childX=xOffset;node.children.forEach(child=>{const childLeaves=countLeaves(child);result.push(...buildLayout(child,depth+1,childX));childX+=childLeaves*nodeW+(childLeaves-1)*12+16;});}
    return result;
  }
  const allNodes=buildLayout(root,0,0);
  const maxX=Math.max(...allNodes.map(n=>n.x+nodeW));
  const svgH=(Math.max(...allNodes.map(n=>n.depth))+1)*(nodeH+levelGap)+40;
  const scale=maxX>width-20?(width-20)/maxX:1;
  return (
    <svg viewBox={`0 0 ${width} ${svgH*scale}`} width="100%" style={{display:"block",maxWidth:width}}
      xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Hierarchy diagram">
      <rect width={width} height={svgH*scale} fill={bg} rx="8"/>
      <defs>
        <filter id="node-shadow"><feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.2"/></filter>
      </defs>
      <g transform={`scale(${scale})`}>
        {allNodes.map(({node,x,y,depth},i)=>{
          const nodeAccent=node.color||accent;
          const sid=node.label+String(i);
          const active=isActive(sid);
          const parentNode=allNodes.find(p=>p.node.children&&p.node.children.includes(node)&&p.depth===depth-1);
          return (
            <g key={i}>
              {parentNode&&<line x1={parentNode.x+nodeW/2} y1={parentNode.y+nodeH} x2={x+nodeW/2} y2={y}
                stroke={nodeAccent} strokeWidth="1.2" strokeDasharray={depth>1?"4,2":""} opacity="0.7"/>}
              <g {...attn(sid)}>
                <rect x={x} y={y} width={nodeW} height={nodeH} rx="6"
                  fill={active?(nodeAccent+"44"):(nodeAccent+(D?"22":"18"))}
                  stroke={nodeAccent} strokeWidth="1.5"
                  filter={active?"url(#node-shadow)":undefined}/>
                <text x={x+nodeW/2} y={y+nodeH/2+4}
                  textAnchor="middle" fontSize="10" fontWeight="600" fill={textCol}
                  fontFamily="Arial,sans-serif" style={{userSelect:"none"}}>{node.label}</text>
              </g>
            </g>
          );
        })}
      </g>
    </svg>
  );
}

export function ComparisonGrid({ rows=[], columns=[], data={}, accent="#7C3AED", D=false }) {
  const cellW=90, cellH=38, labelW=120, headerH=42;
  const gridW=labelW+columns.length*cellW+2;
  const gridH=headerH+rows.length*cellH+2;
  const bg=D?"#161b27":"#fff";
  const hdrBg=D?accent+"33":accent+"18";
  const textCol=D?"#e8ecf4":"#111827";
  const subCol=D?"#8896b3":"#6b7280";
  const borderCol=D?"#2a3347":"#e2e8f0";
  return (
    <svg viewBox={`0 0 ${gridW} ${gridH}`} width="100%" style={{display:"block",maxWidth:gridW}}
      xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Comparison grid">
      <rect width={gridW} height={gridH} fill={bg} rx="8" stroke={borderCol} strokeWidth="1"/>
      <rect x={0} y={0} width={labelW} height={headerH} fill={hdrBg}/>
      {columns.map((col,ci)=>(
        <g key={col.id}>
          <rect x={labelW+ci*cellW} y={0} width={cellW} height={headerH} fill={hdrBg}/>
          <line x1={labelW+ci*cellW} y1={0} x2={labelW+ci*cellW} y2={gridH} stroke={borderCol} strokeWidth="1"/>
          <text x={labelW+ci*cellW+cellW/2} y={headerH/2+4}
            textAnchor="middle" fontSize="10" fontWeight="700" fill={textCol}
            fontFamily="Arial,sans-serif" style={{userSelect:"none"}}>{col.label}</text>
        </g>
      ))}
      {rows.map((row,ri)=>{
        const y=headerH+ri*cellH;
        return (
          <g key={row.id}>
            <line x1={0} y1={y} x2={gridW} y2={y} stroke={borderCol} strokeWidth="1"/>
            <rect x={0} y={y} width={labelW} height={cellH} fill={ri%2===0?bg:(D?"rgba(255,255,255,.02)":"rgba(0,0,0,.015)")}/>
            <text x={8} y={y+cellH/2+4} fontSize="10" fontWeight="600" fill={textCol}
              fontFamily="Arial,sans-serif" style={{userSelect:"none"}}>{row.label}</text>
            {columns.map((col,ci)=>{
              const val=data[`${row.id}:${col.id}`];
              let symbol="—", symCol=subCol;
              if(val===true||val==="yes"){symbol="✓";symCol="#059669";}
              else if(val===false||val==="no"){symbol="✗";symCol="#DC2626";}
              else if(val==="partial"){symbol="◑";symCol="#D97706";}
              else if(typeof val==="string"&&val){symbol=val;symCol=textCol;}
              return (
                <g key={col.id}>
                  <rect x={labelW+ci*cellW} y={y} width={cellW} height={cellH} fill={ri%2===0?bg:(D?"rgba(255,255,255,.02)":"rgba(0,0,0,.015)")}/>
                  <text x={labelW+ci*cellW+cellW/2} y={y+cellH/2+4}
                    textAnchor="middle" fontSize={typeof val==="string"&&val.length>2?"9":"12"}
                    fontWeight="600" fill={symCol}
                    fontFamily="Arial,sans-serif" style={{userSelect:"none"}}>{symbol}</text>
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

export function LabelledStructure({ imageUrl=null, labels=[], accent="#0891B2", D=false, width=520, selfTestMode=false, onAllCorrect=null }) {
  const [revealed, setRevealed] = React.useState({});
  const [inputs, setInputs] = React.useState({});
  const [hoveredId, setHoveredId] = React.useState(null);
  const imgH=width*0.65;
  const handleInput=(id,value)=>{
    const next={...inputs,[id]:value};
    setInputs(next);
    const correct=labels.find(l=>l.id===id);
    if(correct&&value.trim().toLowerCase()===correct.label.toLowerCase())
      setRevealed(r=>({...r,[id]:true}));
    if(onAllCorrect&&labels.every(l=>next[l.id]?.trim().toLowerCase()===l.label.toLowerCase()))
      onAllCorrect();
  };
  if(!imageUrl&&!labels.length) return null;
  return (
    <div style={{position:"relative",width:"100%",maxWidth:width,userSelect:"none"}}>
      {imageUrl
        ?<img src={imageUrl} alt="diagram" style={{width:"100%",display:"block",borderRadius:8,border:`1px solid ${D?"#2a3347":"#e5e7eb"}`}}/>
        :<div style={{width:"100%",height:imgH,borderRadius:8,background:D?"#1e2537":"#f3f4f6",border:`1.5px dashed ${D?"#374151":"#d1d5db"}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <span style={{fontSize:12,color:D?"#8896b3":"#9ca3af"}}>Diagram placeholder</span>
        </div>
      }
      {labels.map(label=>{
        const isHovered=hoveredId===label.id;
        const isCorrect=revealed[label.id];
        const labelAccent=isCorrect?"#059669":(isHovered?accent:(D?"#8896b3":"#6b7280"));
        return (
          <div key={label.id}
            style={{position:"absolute",left:`${label.x}%`,top:`${label.y}%`,transform:"translate(-50%,-50%)",zIndex:10}}
            onMouseEnter={()=>setHoveredId(label.id)}
            onMouseLeave={()=>setHoveredId(null)}>
            {selfTestMode&&!isCorrect
              ?<input value={inputs[label.id]||""} onChange={e=>handleInput(label.id,e.target.value)}
                  placeholder="?" style={{width:80,fontSize:10,fontWeight:700,textAlign:"center",padding:"2px 4px",borderRadius:4,border:`1.5px solid ${labelAccent}`,background:D?"#161b27":"#fff",color:D?"#e8ecf4":"#111827",outline:"none"}}/>
              :<div style={{background:isCorrect?"#059669":(isHovered?accent:(D?accent+"44":accent+"22")),
                  color:isCorrect||isHovered?"#fff":(D?"#e8ecf4":"#111827"),
                  border:`1.5px solid ${labelAccent}`,borderRadius:4,padding:"2px 8px",fontSize:10,fontWeight:700,
                  whiteSpace:"nowrap",boxShadow:isHovered?"0 2px 8px rgba(0,0,0,.25)":"none",
                  transition:"all .15s",cursor:"default",
                  transform:isHovered?"scale(1.4)":"scale(1)",
                  opacity:selfTestMode&&!isCorrect?0:1}}>{label.label}</div>
            }
          </div>
        );
      })}
    </div>
  );
}

export function TimelineDiagram({ events=[], accent="#D97706", D=false, width=580 }) {
  const { props: attn, isActive, isPulsing } = useAttentionLayer();
  if(!events.length) return null;
  const bg=D?"#161b27":"#fff";
  const textCol=D?"#e8ecf4":"#111827";
  const subCol=D?"#8896b3":"#6b7280";
  const lineY=80, svgH=170, padX=28;
  const lineX1=padX, lineX2=width-padX, lineLen=lineX2-lineX1, n=events.length;
  return (
    <svg viewBox={`0 0 ${width} ${svgH}`} width="100%"
      style={{display:"block",maxWidth:width,overflow:"visible"}}
      xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Timeline diagram">
      <rect width={width} height={svgH} fill={bg} rx="8"/>
      <line x1={lineX1} y1={lineY} x2={lineX2} y2={lineY} stroke={accent} strokeWidth="2" opacity="0.4"/>
      <polygon points={`${lineX2},${lineY-5} ${lineX2+10},${lineY} ${lineX2},${lineY+5}`} fill={accent} opacity="0.6"/>
      {events.map((ev,i)=>{
        const x=lineX1+(i/Math.max(n-1,1))*lineLen;
        const above=i%2===0;
        const evAccent=ev.color||accent;
        const dotR=ev.important?7:5;
        const sid=ev.id||String(i);
        const active=isActive(sid);
        const pulse=isPulsing(sid);
        return (
          <g key={sid} {...attn(sid)}>
            <line x1={x} y1={lineY-dotR} x2={x} y2={above?lineY-dotR-32:lineY+dotR+32}
              stroke={evAccent} strokeWidth="1.2" opacity="0.6"/>
            <circle cx={x} cy={lineY} r={active?dotR*1.3:dotR}
              fill={evAccent+(D?"cc":"dd")} stroke={evAccent} strokeWidth={ev.important?2:1}
              style={{transition:"r .15s ease"}}/>
            <text x={x} y={above?lineY-dotR-38:lineY+dotR+46}
              textAnchor="middle" fontSize="9" fontWeight="700" fill={textCol}
              fontFamily="Arial,sans-serif" style={{userSelect:"none"}}>{ev.label}</text>
            {ev.date&&<text x={x} y={above?lineY-dotR-26:lineY+dotR+34}
              textAnchor="middle" fontSize="8" fill={evAccent}
              fontFamily="Arial,sans-serif" style={{userSelect:"none"}}>{ev.date}</text>}
            {ev.sublabel&&<text x={x} y={above?lineY-dotR-14:lineY+dotR+22}
              textAnchor="middle" fontSize="8" fill={subCol}
              fontFamily="Arial,sans-serif" style={{userSelect:"none"}}>{ev.sublabel}</text>}
          </g>
        );
      })}
    </svg>
  );
}

export function DiagramRenderer({ diagram, D=false, width=560 }) {
  if(!diagram||!diagram.type) return null;
  const {type,data,accent}=diagram;
  const itemCount = data ? (
    (data.steps||data.events||[]).length ||
    (data.root ? 1 : 0) ||
    ((data.rows||[]).length)
  ) : 0;
  const rendered =
    type==="process"    ? <ProcessFlowDiagram steps={data?.steps||[]} accent={accent} D={D} width={width}/> :
    type==="cycle"      ? <CycleDiagram steps={data?.steps||[]} accent={accent} D={D}/> :
    type==="hierarchy"  ? <HierarchyTree root={data?.root||null} accent={accent} D={D} width={width}/> :
    type==="comparison" ? <ComparisonGrid rows={data?.rows||[]} columns={data?.columns||[]} data={data?.cells||{}} accent={accent} D={D}/> :
    type==="structure"  ? <LabelledStructure imageUrl={data?.imageUrl||null} labels={data?.labels||[]} accent={accent} D={D} width={width}/> :
    type==="timeline"   ? <TimelineDiagram events={data?.events||[]} accent={accent} D={D} width={width}/> :
    null;
  if(!rendered) return null;
  return (
    <div>
      {rendered}
      {itemCount > 2 && (
        <p style={{fontSize:10,color:D?"#8896b3":"#9ca3af",textAlign:"center",marginTop:4,fontStyle:"italic"}}>
          Tap or hover elements to highlight
        </p>
      )}
    </div>
  );
}

// ── CONSTANTS & STYLES ───────────────────────────────────────────────────────
export const C  = D => ({background:D?"#161b27":"#fff", border:`1px solid ${D?"#2a3347":"#e5e7eb"}`, borderRadius:14});
export const I  = (D,x={}) => ({width:"100%",background:D?"#1e2537":"#fff",border:`1.5px solid ${D?"#374151":"#d1d5db"}`,borderRadius:10,padding:"10px 14px",fontSize:13,outline:"none",color:D?"#e8ecf4":"#111827",...x});
export const B  = (color,outline,extra={}) => ({padding:"9px 16px",borderRadius:10,border:outline?`1.5px solid ${color}`:"none",background:outline?"transparent":color,color:outline?color:"#fff",cursor:"pointer",fontSize:13,fontWeight:600,...extra});
export const mu = D => D?"#8896b3":"#9ca3af";
export const tx = D => D?"#e8ecf4":"#111827";
