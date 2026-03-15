import { useState, useRef, useEffect, useCallback } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/* ── Palette ──────────────────────────────────────────────────────────── */
const P = {
  bg:"#07070d", s1:"#0c0c16", s2:"#10101c", card:"#131320",
  b1:"#1e1e32", b2:"#2a2a42",
  v1:"#5b21b6", v2:"#7c3aed", v3:"#8b5cf6", v4:"#a78bfa",
  vglow:"#7c3aed14",
  txt:"#c8c4e0", muted:"#524e6a", white:"#edeaff",
  green:"#34d399", red:"#f87171", amber:"#fbbf24",
  indigo:"#818cf8", rose:"#c084b8", orange:"#fb923c",
};

/* ── Roles for setup screen ───────────────────────────────────────────── */
const ROLES = [
  {id:"Machine Learning Engineer", icon:"🤖", color:P.v4},
  {id:"Data Scientist",            icon:"📊", color:P.indigo},
  {id:"Software Engineer",         icon:"💻", color:"#22d3ee"},
  {id:"Data Engineer",             icon:"🔧", color:P.amber},
  {id:"AI/ML Researcher",          icon:"🔬", color:P.rose},
  {id:"Frontend Developer",        icon:"🎨", color:P.green},
  {id:"Backend Developer",         icon:"⚙️", color:P.orange},
  {id:"Full Stack Developer",      icon:"🌐", color:P.v3},
  {id:"DevOps Engineer",           icon:"🚀", color:"#22d3ee"},
  {id:"Product Manager",           icon:"📋", color:P.amber},
];

/* ── Helpers ──────────────────────────────────────────────────────────── */
const sv  = (v,f=0)  => v!=null&&!isNaN(+v)?+v:f;
const ss  = (v,f="") => v!=null?String(v):f;
const sa  = v        => Array.isArray(v)?v:[];
const so  = v        => v&&typeof v==="object"&&!Array.isArray(v)?v:{};
const rnd = v        => Math.round(sv(v));
const fmt = s => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
const clamp = (v,lo,hi) => Math.max(lo,Math.min(hi,v));
const catColor = c => ({"Machine Learning":P.v4,Technical:P.indigo,Behavioral:P.green,Aptitude:P.amber})[c]||P.v4;
const gradeCol = g => ({"A+":P.green,A:P.green,B:P.v4,C:P.amber,D:P.orange,F:P.red})[g]||P.muted;
const scoreCol = s => s>=75?P.green:s>=50?P.amber:P.red;
const wpmCol   = w => w>170?P.red:w<100?P.amber:P.green;
const emojiEmo = e => ({happy:"😊",neutral:"😐",fear:"😰",angry:"😠",sad:"😔",surprise:"😲",disgust:"🤢"})[e]||"😐";
const FILLERS  = new Set(["um","uh","like","basically","literally","actually","you know","sort of","kind of","i mean","right","okay so","so"]);
const SID      = `s_${Date.now()}`;

/* ── Responsive breakpoint hook ───────────────────────────────────────── */
function useBreakpoint(){
  const [bp,setBp]=useState(()=>({
    isMobile: window.innerWidth<640,
    isTablet: window.innerWidth>=640&&window.innerWidth<1024,
    isDesktop:window.innerWidth>=1024,
    w:window.innerWidth
  }));
  useEffect(()=>{
    const handler=()=>setBp({
      isMobile: window.innerWidth<640,
      isTablet: window.innerWidth>=640&&window.innerWidth<1024,
      isDesktop:window.innerWidth>=1024,
      w:window.innerWidth
    });
    window.addEventListener("resize",handler);
    return ()=>window.removeEventListener("resize",handler);
  },[]);
  return bp;
}

/* ════════════ MOCKAI LOGO SVG ════════════════════════════════════════ */
function MockAILogo({size=32}){
  const s=size;
  return(
    <svg width={s} height={s} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{flexShrink:0,display:"block"}}>
      {/* Outer glow ring */}
      <circle cx="20" cy="20" r="19" fill="url(#bg)" stroke="url(#ring)" strokeWidth="1"/>
      {/* Brain circuit paths */}
      <path d="M12 20 C12 14 16 11 20 11 C24 11 28 14 28 20 C28 26 24 29 20 29 C16 29 12 26 12 20Z"
        fill="none" stroke="url(#grad1)" strokeWidth="1.2" strokeLinecap="round"/>
      {/* Left lobe */}
      <path d="M20 11 C18 8 13 8 12 12 C11 15 13 17 15 17"
        fill="none" stroke="url(#grad1)" strokeWidth="1.2" strokeLinecap="round"/>
      {/* Right lobe */}
      <path d="M20 11 C22 8 27 8 28 12 C29 15 27 17 25 17"
        fill="none" stroke="url(#grad2)" strokeWidth="1.2" strokeLinecap="round"/>
      {/* Bottom connector */}
      <path d="M15 24 C15 27 17 29 20 29 C23 29 25 27 25 24"
        fill="none" stroke="url(#grad2)" strokeWidth="1.2" strokeLinecap="round"/>
      {/* Circuit dots — nodes */}
      <circle cx="20" cy="11" r="1.8" fill="#a78bfa"/>
      <circle cx="12" cy="20" r="1.5" fill="#7c3aed"/>
      <circle cx="28" cy="20" r="1.5" fill="#7c3aed"/>
      <circle cx="15" cy="17" r="1.3" fill="#8b5cf6"/>
      <circle cx="25" cy="17" r="1.3" fill="#8b5cf6"/>
      <circle cx="20" cy="29" r="1.8" fill="#a78bfa"/>
      {/* Center AI spark */}
      <circle cx="20" cy="20" r="3" fill="url(#spark)"/>
      <circle cx="20" cy="20" r="1.5" fill="white" opacity="0.9"/>
      {/* Horizontal circuit lines */}
      <line x1="13.5" y1="20" x2="17" y2="20" stroke="#5b21b6" strokeWidth="0.8" strokeLinecap="round"/>
      <line x1="23" y1="20" x2="26.5" y2="20" stroke="#5b21b6" strokeWidth="0.8" strokeLinecap="round"/>
      {/* Vertical circuit lines */}
      <line x1="20" y1="12.8" x2="20" y2="17" stroke="#5b21b6" strokeWidth="0.8" strokeLinecap="round"/>
      <line x1="20" y1="23" x2="20" y2="27.2" stroke="#5b21b6" strokeWidth="0.8" strokeLinecap="round"/>
      {/* Diagonal accents */}
      <line x1="14.5" y1="14.5" x2="17.5" y2="17.5" stroke="#7c3aed" strokeWidth="0.7" strokeLinecap="round" opacity="0.7"/>
      <line x1="25.5" y1="14.5" x2="22.5" y2="17.5" stroke="#7c3aed" strokeWidth="0.7" strokeLinecap="round" opacity="0.7"/>
      <defs>
        <radialGradient id="bg" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#1e1432"/>
          <stop offset="100%" stopColor="#0c0c16"/>
        </radialGradient>
        <linearGradient id="ring" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.8"/>
          <stop offset="100%" stopColor="#5b21b6" stopOpacity="0.3"/>
        </linearGradient>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a78bfa"/>
          <stop offset="100%" stopColor="#7c3aed"/>
        </linearGradient>
        <linearGradient id="grad2" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#8b5cf6"/>
          <stop offset="100%" stopColor="#a78bfa"/>
        </linearGradient>
        <radialGradient id="spark" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#c4b5fd"/>
          <stop offset="100%" stopColor="#7c3aed"/>
        </radialGradient>
      </defs>
    </svg>
  );
}

/* ════════════ PRIMITIVE UI COMPONENTS ═══════════════════════════════ */
function Tag({children,color=P.v4}){
  return <span style={{fontSize:9,fontWeight:700,letterSpacing:1.2,textTransform:"uppercase",
    color,background:color+"18",border:`1px solid ${color}30`,borderRadius:4,
    padding:"2px 8px",fontFamily:"'DM Mono',monospace"}}>{children}</span>;
}
function Pip({active,color=P.green}){
  return <span style={{display:"inline-block",width:6,height:6,borderRadius:"50%",
    background:active?color:P.muted,boxShadow:active?`0 0 8px ${color}88`:"none",
    animation:active?"pip 2s ease-in-out infinite":"none"}}/>;
}
function Card({children,style={},accent}){
  return <div style={{background:P.card,border:`1px solid ${accent?accent+"40":P.b1}`,
    borderRadius:14,padding:16,position:"relative",overflow:"hidden",...style}}>
    {accent&&<div style={{position:"absolute",top:0,left:0,right:0,height:1,
      background:`linear-gradient(90deg,${accent}80,${accent}20,transparent)`}}/>}
    {children}
  </div>;
}
function SHead({icon,text,badge}){
  return <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
    <div style={{width:26,height:26,borderRadius:7,background:P.vglow,border:`1px solid ${P.b2}`,
      display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0}}>{icon}</div>
    <span style={{fontSize:12,fontWeight:700,color:P.white,flex:1}}>{text}</span>
    {badge!=null&&<span style={{fontSize:9,color:P.muted,background:P.s1,border:`1px solid ${P.b1}`,
      borderRadius:99,padding:"2px 8px",fontFamily:"'DM Mono',monospace"}}>{badge}</span>}
  </div>;
}
function InfoRow({label,value,color=P.txt}){
  return <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
    padding:"5px 0",borderBottom:`1px solid ${P.b1}`}}>
    <span style={{fontSize:10.5,color:P.muted}}>{label}</span>
    <span style={{fontSize:10.5,color,fontWeight:700,fontFamily:"'DM Mono',monospace",textTransform:"capitalize"}}>{value}</span>
  </div>;
}
function Gauge({value=0,label,color=P.v4,size=80}){
  const r=28,circ=2*Math.PI*r,p=clamp(sv(value),0,100);
  return <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
    <svg width={size} height={size} viewBox="0 0 66 66">
      <circle cx="33" cy="33" r={r} fill="none" stroke={P.b2} strokeWidth="5"/>
      <circle cx="33" cy="33" r={r} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={`${circ*(p/100)} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 33 33)" style={{transition:"stroke-dasharray 1.4s cubic-bezier(.16,1,.3,1)"}}/>
      <text x="33" y="38" textAnchor="middle" fill={color} fontSize="11" fontWeight="800"
        fontFamily="'DM Mono',monospace">{Math.round(p)}</text>
    </svg>
    <span style={{fontSize:9,color:P.muted,textAlign:"center",maxWidth:70,lineHeight:1.3}}>{label}</span>
  </div>;
}
function Bar({label,value,max=100,unit="",color=P.v4,note=""}){
  const v=sv(value),p=clamp((v/max)*100,0,100);
  return <div style={{marginBottom:10}}>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
      <span style={{fontSize:11,color:P.txt}}>{label}</span>
      <span style={{fontSize:10,color:P.muted,fontFamily:"'DM Mono',monospace"}}>
        {v<10?v.toFixed(2):Math.round(v)}{unit}
        {note&&<span style={{color:P.b2,marginLeft:6}}>{note}</span>}
      </span>
    </div>
    <div style={{background:P.b1,borderRadius:99,height:4,overflow:"hidden"}}>
      <div style={{width:`${p}%`,height:"100%",background:`linear-gradient(90deg,${color}99,${color})`,
        borderRadius:99,transition:"width 1.4s cubic-bezier(.16,1,.3,1)"}}/>
    </div>
  </div>;
}

/* ── Waveform ─────────────────────────────────────────────────────────── */
function Waveform({analyser,active,height=90}){
  const ref=useRef(null),raf=useRef(null);
  useEffect(()=>{
    const cv=ref.current; if(!cv) return;
    const ctx=cv.getContext("2d"),W=cv.width,H=cv.height;
    const bg=()=>{
      ctx.fillStyle=P.s1;ctx.fillRect(0,0,W,H);
      ctx.strokeStyle=P.b1+"88";ctx.lineWidth=0.5;
      for(let x=0;x<W;x+=44){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
      for(let y=0;y<H;y+=22){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
    };
    if(!active||!analyser){
      bg();ctx.strokeStyle=P.v1+"50";ctx.lineWidth=1;ctx.setLineDash([4,10]);
      ctx.beginPath();ctx.moveTo(0,H/2);ctx.lineTo(W,H/2);ctx.stroke();ctx.setLineDash([]);return;
    }
    const data=new Uint8Array(analyser.frequencyBinCount);
    const draw=()=>{
      raf.current=requestAnimationFrame(draw);analyser.getByteTimeDomainData(data);bg();
      const s=W/data.length;
      ctx.beginPath();
      for(let i=0;i<data.length;i++){const x=i*s,y=(data[i]/255)*H;i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);}
      ctx.lineTo(W,H/2);ctx.lineTo(0,H/2);ctx.closePath();
      const g=ctx.createLinearGradient(0,0,0,H);
      g.addColorStop(0,P.v2+"44");g.addColorStop(1,P.v2+"08");
      ctx.fillStyle=g;ctx.fill();
      ctx.beginPath();ctx.shadowColor=P.v3;ctx.shadowBlur=10;
      ctx.strokeStyle=P.v4;ctx.lineWidth=1.8;
      for(let i=0;i<data.length;i++){const x=i*s,y=(data[i]/255)*H;i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);}
      ctx.stroke();ctx.shadowBlur=0;
    };
    draw();return()=>cancelAnimationFrame(raf.current);
  },[active,analyser]);
  return <canvas ref={ref} width={900} height={height}
    style={{width:"100%",height,display:"block",background:P.s1}}/>;
}

/* ════════════ SETUP SCREEN ══════════════════════════════════════════════ */
function SetupScreen({onStart,backend}){
  const [role,setRole]=useState("");
  const [diff,setDiff]=useState("medium");
  const [numQ,setNumQ]=useState(5);
  const [loading,setLoading]=useState(false);
  const {isMobile,isTablet}=useBreakpoint();
  const [err,setErr]=useState("");

  const start=async()=>{
    if(!role) return;
    setLoading(true);setErr("");
    try{
      const res=await fetch(`${API}/agent/start`,{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({role,difficulty:diff,num_questions:numQ})
      });
      if(!res.ok) throw new Error((await res.json()).detail||"Agent failed");
      const data=await res.json();
      onStart({role,difficulty:diff,numQuestions:numQ,
        firstQuestion:data.question,firstContext:data.context});
    }catch(e){setErr(e.message);}
    finally{setLoading(false);}
  };

  return(
    <div style={{minHeight:"100vh",background:P.bg,color:P.txt,display:"flex",
      alignItems:"center",justifyContent:"center",padding:24,
      fontFamily:"'Outfit','Segoe UI',system-ui,sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>
      <div style={{position:"fixed",inset:0,pointerEvents:"none",
        background:`radial-gradient(ellipse 60% 40% at 20% 10%,${P.v1}20,transparent),radial-gradient(ellipse 40% 30% at 80% 90%,${P.v2}10,transparent)`}}/>
      <div style={{position:"relative",zIndex:1,width:"100%",maxWidth:820}}>
        {/* Header */}
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:10,background:P.v2+"18",
            border:`1px solid ${P.v2}40`,borderRadius:99,padding:"8px 20px",marginBottom:20}}>
            <MockAILogo size={22}/>
            <span style={{fontSize:10,color:P.v4,fontWeight:700,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace"}}>AI-Powered Interview</span>
          </div>
          <div style={{fontSize:34,fontWeight:900,color:P.white,letterSpacing:-1.5,lineHeight:1.1,marginBottom:8}}>
            Configure Your Interview
          </div>
          <div style={{fontSize:12,color:P.muted,maxWidth:480,margin:"0 auto",lineHeight:1.7}}>
            AI agent generates dynamic questions · ML models analyse voice, face & language · Combined report with coaching
          </div>
          {/* Feature pills */}
          <div style={{display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center",marginTop:14}}>
            {[["🎙","Whisper STT"],["📊","Librosa Voice"],["👁","DeepFace"],["💬","NLP Analysis"],["🤖","AI Evaluation"]].map(([icon,label])=>(
              <div key={label} style={{background:P.card,border:`1px solid ${P.b1}`,borderRadius:99,padding:"4px 12px",
                display:"flex",alignItems:"center",gap:6,fontSize:10,color:P.muted}}>
                <span>{icon}</span><span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Role Picker */}
        <div style={{background:P.card,border:`1px solid ${P.b1}`,borderRadius:14,padding:20,marginBottom:14}}>
          <div style={{fontSize:10,color:P.muted,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:14}}>
            Step 1 — Choose Role
          </div>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":isTablet?"repeat(3,1fr)":"repeat(5,1fr)",gap:8}}>
            {ROLES.map(r=>(
              <div key={r.id} onClick={()=>setRole(r.id)} style={{
                background:role===r.id?r.color+"18":P.s2,
                border:`1px solid ${role===r.id?r.color+"60":P.b1}`,
                borderRadius:10,padding:"12px 8px",cursor:"pointer",textAlign:"center",
                transition:"all .2s",position:"relative",overflow:"hidden"}}>
                {role===r.id&&<div style={{position:"absolute",top:0,left:0,right:0,height:2,background:r.color}}/>}
                <div style={{fontSize:20,marginBottom:5}}>{r.icon}</div>
                <div style={{fontSize:9,color:role===r.id?r.color:P.muted,fontWeight:role===r.id?700:400,lineHeight:1.3}}>{r.id}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:14,marginBottom:20}}>
          {/* Difficulty */}
          <div style={{background:P.card,border:`1px solid ${P.b1}`,borderRadius:14,padding:18}}>
            <div style={{fontSize:10,color:P.muted,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:12}}>Step 2 — Difficulty</div>
            <div style={{display:"flex",flexDirection:"column",gap:7}}>
              {[["easy","🟢","Beginner","Basic concepts"],
                ["medium","🟡","Intermediate","Practical knowledge"],
                ["hard","🔴","Advanced","Deep expertise"]].map(([id,dot,label,desc])=>(
                <div key={id} onClick={()=>setDiff(id)} style={{
                  display:"flex",alignItems:"center",gap:10,padding:"9px 12px",
                  background:diff===id?P.vglow:P.s2,border:`1px solid ${diff===id?P.v2+"60":P.b1}`,
                  borderRadius:9,cursor:"pointer",transition:"all .2s"}}>
                  <span style={{fontSize:13}}>{dot}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:11,color:diff===id?P.white:P.txt,fontWeight:diff===id?700:400}}>{label}</div>
                    <div style={{fontSize:9,color:P.muted}}>{desc}</div>
                  </div>
                  {diff===id&&<div style={{width:6,height:6,borderRadius:"50%",background:P.v4,flexShrink:0}}/>}
                </div>
              ))}
            </div>
          </div>
          {/* Num questions */}
          <div style={{background:P.card,border:`1px solid ${P.b1}`,borderRadius:14,padding:18}}>
            <div style={{fontSize:10,color:P.muted,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:12}}>Step 3 — Questions</div>
            <div style={{display:"flex",flexDirection:"column",gap:7}}>
              {[[3,"Quick Practice","~10 min"],[5,"Standard","~20 min"],[8,"Full Interview","~35 min"],[10,"Deep Dive","~45 min"]].map(([n,label,time])=>(
                <div key={n} onClick={()=>setNumQ(n)} style={{
                  display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 12px",
                  background:numQ===n?P.vglow:P.s2,border:`1px solid ${numQ===n?P.v2+"60":P.b1}`,
                  borderRadius:9,cursor:"pointer",transition:"all .2s"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:18,fontWeight:900,color:numQ===n?P.v4:P.muted,fontFamily:"'DM Mono',monospace"}}>{n}</span>
                    <span style={{fontSize:11,color:numQ===n?P.white:P.txt,fontWeight:numQ===n?600:400}}>{label}</span>
                  </div>
                  <span style={{fontSize:9,color:P.muted}}>{time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {err&&<div style={{background:P.red+"12",border:`1px solid ${P.red}30`,borderRadius:9,
          padding:"10px 14px",fontSize:11,color:P.red,marginBottom:14}}>{err}</div>}

        <button onClick={start} disabled={!role||loading||!backend} style={{
          width:"100%",padding:"16px",borderRadius:12,border:"none",
          cursor:role&&!loading&&backend?"pointer":"not-allowed",
          background:role&&backend?`linear-gradient(135deg,${P.v1},${P.v2})`:"#1e1e32",
          color:role&&backend?"#fff":P.muted,fontSize:14,fontWeight:800,fontFamily:"inherit",
          boxShadow:role&&backend?`0 8px 32px ${P.v2}40`:"none",transition:"all .3s",
          display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
          {loading
            ? <><span style={{animation:"spin 1s linear infinite",display:"inline-block"}}>⟳</span> Starting AI Interview...</>
            : !backend
              ? "⚠️ Backend Offline — Start backend first"
              : <><span style={{fontSize:18}}>🚀</span> Start AI Interview{role?` — ${role}`:""}</>
          }
        </button>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/* ════════════ COMBINED RESULT PANEL ════════════════════════════════════ */
function CombinedResult({result,qNumber}){
  const [tab,setTab]=useState("ai");
  const ml=so(result.mlResult);
  const ai=so(result.agentEval);
  const scores=so(ai.scores);
  const fb=so(ml.feedback);
  const dims=sa(fb.dimensions);
  const stt=so(ml.stt);
  const audio=so(ml.audio);
  const nlp=so(ml.nlp);
  const facial=so(ml.facial);
  const audioScores=so(so(audio).scores);
  const rhythm=so(so(audio).rhythm);
  const pitchD=so(so(audio).pitch);
  // ── Fix: multiple fallback keys for wpm ──
  const wpm=rnd(rhythm.estimated_wpm||rhythm.speaking_rate||rhythm.wpm||rhythm.words_per_minute||0);
  const pitchMean=Math.round(sv(pitchD.mean_hz||pitchD.mean||0));
  const pitchVar=rnd(pitchD.variability||pitchD.std_hz||pitchD.variation||0);
  const delivery=rnd(audioScores.delivery_clarity||audioScores.delivery||0);
  const paceScore=rnd(audioScores.pace_score||audioScores.pacing_score||(wpm>170?40:wpm>140?90:wpm>90?65:wpm>0?50:0));
  const volScore=rnd(audioScores.volume_consistency||audioScores.volume_score||audioScores.loudness_score||60);
  const pitchScore=rnd(audioScores.pitch_score||audioScores.pitch_variation_score||60);
  const pauseRatio=Math.round(sv(rhythm.pause_ratio||rhythm.silence_ratio||0)*100);
  const fillers=sa(nlp.filler_words_found);
  const nlpScore=rnd(nlp.nlp_overall_score||nlp.overall_score||0);
  const vocabRich=Math.round(sv(nlp.vocabulary_richness||nlp.lexical_diversity||0.5)*100);
  const grammar=rnd(nlp.grammar_score||nlp.fluency_score||70);
  const kwScore=rnd(nlp.keyword_relevance||nlp.relevance_score||60);
  const confidence=rnd(facial.confidence_score||0);
  const eyeContact=rnd(facial.eye_contact_score||0);
  const stressRaw=rnd(facial.stress_level||facial.stress_score||(100-confidence)*0.6);
  const stress=clamp(stressRaw,0,100);
  const dominantEmo=ss(facial.dominant_emotion,"neutral");
  // ── Fix: normalize emotions — DeepFace returns 0-100, not 0-1 ──
  const rawEmos=so(facial.emotions||facial.emotion_scores||{});
  const emoVals=Object.values(rawEmos).map(v=>sv(v));
  const maxEmo=emoVals.length?Math.max(...emoVals):0;
  // if max > 1 → already 0-100 scale; if max <= 1 → 0-1 scale, multiply by 100
  const emoScale=maxEmo>1?1:100;
  const allEmotions=Object.fromEntries(Object.entries(rawEmos).map(([k,v])=>[k,clamp(sv(v)*emoScale,0,100)]));
  const grade=ss(ai.grade||fb.grade,"?");
  const gc=gradeCol(grade);
  const overallScore=rnd(scores.overall||fb.overall_score||0);
  const wpmColor=wpm===0?P.muted:wpm>170?P.red:wpm>140?P.green:wpm>90?P.amber:P.red;
  const wpmLabel=wpm===0?"No Data":wpm>170?"Too Fast":wpm>140?"Optimal":wpm>90?"Slightly Slow":"Too Slow";
  const toneLabel=pitchMean>220?"High Pitch":pitchMean>150?"Medium Pitch":pitchMean>0?"Low Pitch":"—";
  const toneColor=pitchMean>220?P.rose:pitchMean>150?P.v4:P.indigo;
  const stressColor=stress>65?P.red:stress>35?P.amber:P.green;

  const TABS=[
    {id:"ai",    label:"AI Feedback", icon:"🤖"},
    {id:"voice", label:"Voice",       icon:"🎙"},
    {id:"facial",label:"Facial",      icon:"👁"},
    {id:"lang",  label:"Language",    icon:"💬"},
  ];

  return(
    <div style={{display:"flex",flexDirection:"column",gap:12,padding:"14px 14px 14px",overflowY:"auto",flex:1}}>
      {/* Grade hero */}
      <div style={{background:P.card,border:`1px solid ${gc}30`,borderRadius:14,padding:16,
        display:"grid",gridTemplateColumns:"auto 1fr",gap:14,position:"relative",overflow:"hidden",flexShrink:0}}>
        <div style={{position:"absolute",inset:0,background:`radial-gradient(ellipse at 0% 50%,${gc}0d,transparent 60%)`,pointerEvents:"none"}}/>
        <div style={{textAlign:"center",zIndex:1}}>
          <div style={{fontSize:52,fontWeight:900,fontFamily:"'DM Mono',monospace",color:gc,lineHeight:1,letterSpacing:-2}}>{grade}</div>
          <div style={{fontSize:20,fontWeight:900,color:gc,fontFamily:"'DM Mono',monospace",marginTop:4}}>
            {overallScore}<span style={{fontSize:10,color:P.muted,fontWeight:400}}>/100</span>
          </div>
        </div>
        <div style={{zIndex:1}}>
          <div style={{fontSize:12,fontWeight:700,color:P.white,lineHeight:1.5,marginBottom:8}}>{ss(ai.verdict||fb.verdict,"—")}</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {[["🎙",delivery,P.amber,"Voice"],["💬",nlpScore,P.green,"NLP"],["👁",confidence,P.rose,"Face"],["⚡",rnd(scores.technical_accuracy)||rnd(fb.overall_score),P.v4,"Content"]].map(([icon,val,col,label])=>(
              <div key={label} style={{background:P.s2,border:`1px solid ${P.b1}`,borderRadius:7,padding:"4px 8px",display:"flex",alignItems:"center",gap:5}}>
                <span style={{fontSize:9}}>{icon}</span>
                <span style={{fontSize:9,color:P.muted}}>{label}</span>
                <span style={{fontSize:10,fontWeight:700,color:col,fontFamily:"'DM Mono',monospace"}}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{display:"flex",gap:4,background:P.s2,borderRadius:10,padding:3,border:`1px solid ${P.b1}`,flexShrink:0}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            flex:1,padding:"6px 4px",borderRadius:7,border:"none",cursor:"pointer",
            background:tab===t.id?P.v2:"transparent",
            color:tab===t.id?"#fff":P.muted,fontSize:10,fontWeight:tab===t.id?700:400,
            transition:"all .2s",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
            <span>{t.icon}</span><span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* AI Feedback Tab */}
      {tab==="ai"&&<div style={{display:"flex",flexDirection:"column",gap:10}}>
        {/* Score bars */}
        <div style={{background:P.card,border:`1px solid ${P.b1}`,borderRadius:11,padding:13}}>
          <div style={{fontSize:8,color:P.muted,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:10}}>AI Score Breakdown</div>
          {[["Technical Accuracy",scores.technical_accuracy||0,P.v4],
            ["Completeness",scores.completeness||0,P.indigo],
            ["Clarity",scores.clarity||0,P.green],
            ["Depth",scores.depth||0,P.amber],
            ["Real-World Application",scores.real_world_application||0,P.rose]].map(([label,val,col])=>(
            <div key={label} style={{marginBottom:9}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                <span style={{fontSize:10,color:P.txt}}>{label}</span>
                <span style={{fontSize:9.5,color:col,fontWeight:700,fontFamily:"'DM Mono',monospace"}}>{rnd(val)}/100</span>
              </div>
              <div style={{background:P.b1,borderRadius:99,height:4,overflow:"hidden"}}>
                <div style={{width:`${clamp(rnd(val),0,100)}%`,height:"100%",
                  background:`linear-gradient(90deg,${col}80,${col})`,borderRadius:99,
                  transition:"width 1.2s cubic-bezier(.16,1,.3,1)"}}/>
              </div>
            </div>
          ))}
        </div>
        {/* What was good */}
        {sa(ai.what_was_good).length>0&&<div style={{background:P.green+"0a",border:`1px solid ${P.green}25`,borderRadius:10,padding:12}}>
          <div style={{fontSize:8,color:P.green,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:8}}>What Was Good</div>
          {sa(ai.what_was_good).map((s,i)=>(
            <div key={i} style={{display:"flex",gap:7,marginBottom:6}}>
              <span style={{color:P.green,fontSize:10,flexShrink:0,marginTop:1}}>✓</span>
              <span style={{fontSize:10.5,color:P.txt,lineHeight:1.6}}>{s}</span>
            </div>
          ))}
        </div>}
        {/* What was missing */}
        {sa(ai.what_was_missing).length>0&&<div style={{background:P.red+"0a",border:`1px solid ${P.red}25`,borderRadius:10,padding:12}}>
          <div style={{fontSize:8,color:P.red,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:8}}>What Was Missing</div>
          {sa(ai.what_was_missing).map((s,i)=>(
            <div key={i} style={{display:"flex",gap:7,marginBottom:6}}>
              <span style={{color:P.red,fontSize:10,flexShrink:0,marginTop:1}}>→</span>
              <span style={{fontSize:10.5,color:P.txt,lineHeight:1.6}}>{s}</span>
            </div>
          ))}
        </div>}
        {/* Coaching tip */}
        {ai.follow_up_tip&&<div style={{background:P.amber+"0a",border:`1px solid ${P.amber}25`,borderRadius:9,padding:"9px 12px",display:"flex",gap:8}}>
          <span style={{fontSize:13,flexShrink:0}}>💡</span>
          <span style={{fontSize:10.5,color:P.txt,lineHeight:1.7}}><strong style={{color:P.amber}}>Tip: </strong>{ai.follow_up_tip}</span>
        </div>}
        {/* ML dimensions */}
        {dims.length>0&&<div style={{background:P.card,border:`1px solid ${P.b1}`,borderRadius:11,padding:13}}>
          <div style={{fontSize:8,color:P.muted,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:10}}>ML Evaluation Dimensions</div>
          {dims.map((d,i)=>{
            const cols=[P.v4,P.indigo,P.green,P.amber,P.rose];
            return <div key={i} style={{marginBottom:9}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                <span style={{fontSize:10,color:P.txt}}>{ss(d.label)}</span>
                <span style={{fontSize:9.5,color:gradeCol(ss(d.grade)),fontWeight:700,fontFamily:"'DM Mono',monospace"}}>{ss(d.grade)} · {rnd(d.score)}</span>
              </div>
              <div style={{background:P.b1,borderRadius:99,height:4,overflow:"hidden"}}>
                <div style={{width:`${clamp(sv(d.score),0,100)}%`,height:"100%",
                  background:cols[i%5],borderRadius:99}}/>
              </div>
              <div style={{fontSize:9,color:P.muted,marginTop:2}}>{ss(d.feedback)}</div>
            </div>;
          })}
        </div>}
      </div>}

      {/* Voice Tab */}
      {tab==="voice"&&<div style={{display:"flex",flexDirection:"column",gap:10}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {[["Pitch",pitchMean>0?pitchMean+"Hz":"—",toneLabel,toneColor],
            ["Speaking Rate",wpm>0?wpm+" WPM":"No Data",wpmLabel,wpmColor],
            ["Delivery",delivery>0?delivery+"/100":"No Data",delivery>75?"Clear":delivery>0?"Needs Work":"—",delivery>75?P.green:P.amber],
            ["Pace Score",paceScore>0?paceScore+"/100":"Derived",paceScore>75?"Good":"Adjust",paceScore>75?P.green:P.amber]].map(([label,val,sub,col])=>(
            <div key={label} style={{background:P.card,border:`1px solid ${col}25`,borderRadius:10,padding:12,textAlign:"center"}}>
              <div style={{fontSize:16,fontWeight:900,color:col,fontFamily:"'DM Mono',monospace",lineHeight:1.2}}>{val}</div>
              <div style={{fontSize:8,color:P.muted,letterSpacing:1,textTransform:"uppercase",marginTop:3}}>{label}</div>
              {sub&&<div style={{fontSize:9,color:col,marginTop:4,background:col+"18",borderRadius:4,padding:"2px 6px",display:"inline-block"}}>{sub}</div>}
            </div>
          ))}
        </div>
        <div style={{background:P.card,border:`1px solid ${P.b1}`,borderRadius:11,padding:13}}>
          <div style={{fontSize:8,color:P.muted,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:10}}>Voice Metrics</div>
          {[["Pitch Variability",pitchVar,P.v4,"Monotone","Expressive"],
            ["Volume Consistency",volScore,P.green,"Inconsistent","Consistent"],
            ["Pitch Score",pitchScore,P.indigo,"Poor","Excellent"],
            ["Pause Ratio",pauseRatio,pauseRatio>40?P.amber:P.green,"Too Few","Too Many"]].map(([label,val,col,lo,hi])=>(
            <div key={label} style={{marginBottom:9}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                <span style={{fontSize:10,color:P.txt}}>{label}</span>
                <div style={{display:"flex",gap:5,alignItems:"center"}}>
                  <span style={{fontSize:8,color:col,background:col+"18",borderRadius:3,padding:"1px 5px"}}>
                    {val<33?lo:val>66?hi:"Moderate"}
                  </span>
                  <span style={{fontSize:9.5,color:col,fontWeight:700,fontFamily:"'DM Mono',monospace"}}>{val}%</span>
                </div>
              </div>
              <div style={{background:P.b1,borderRadius:99,height:5,overflow:"hidden"}}>
                <div style={{width:`${clamp(val,0,100)}%`,height:"100%",
                  background:`linear-gradient(90deg,${col}70,${col})`,borderRadius:99,
                  transition:"width 1.2s cubic-bezier(.16,1,.3,1)"}}/>
              </div>
            </div>
          ))}
          {/* WPM gauge */}
          <div style={{marginTop:10,background:P.s2,borderRadius:8,padding:"10px 12px",border:`1px solid ${P.b1}`}}>
            <div style={{fontSize:8,color:P.muted,letterSpacing:1.5,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:6}}>Speaking Rate</div>
            <div style={{position:"relative",background:P.b1,borderRadius:99,height:8,overflow:"hidden",marginBottom:4}}>
              <div style={{position:"absolute",inset:0,background:`linear-gradient(90deg,${P.red},${P.amber} 30%,${P.green} 55%,${P.amber} 80%,${P.red})`,opacity:0.3}}/>
              {wpm>0&&<div style={{position:"absolute",top:0,bottom:0,width:4,borderRadius:2,background:"#fff",
                left:`${clamp((wpm/220)*100,0,96)}%`,transform:"translateX(-50%)",transition:"left 1s"}}/>}
            </div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:8,color:P.muted}}>
              <span>Slow</span><span style={{color:P.green,fontWeight:700}}>Optimal 130-160</span><span>Fast</span>
            </div>
            <div style={{fontSize:11,color:wpmColor,fontWeight:700,marginTop:6,textAlign:"center"}}>
              {wpm>0?`${wpm} WPM — ${wpmLabel}`:"WPM data not available"}
            </div>
          </div>
        </div>
      </div>}

      {/* Facial Tab */}
      {tab==="facial"&&<div style={{display:"flex",flexDirection:"column",gap:10}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
          {[["Confidence",confidence,confidence>70?P.green:confidence>40?P.amber:P.red,"Low","High"],
            ["Stress Level",stress,stressColor,"Calm","High Stress"],
            ["Eye Contact",eyeContact,eyeContact>70?P.green:eyeContact>40?P.amber:P.red,"Poor","Strong"]].map(([label,val,col,lo,hi])=>(
            <div key={label} style={{background:P.card,border:`1px solid ${col}25`,borderRadius:10,padding:12,textAlign:"center"}}>
              <div style={{fontSize:28,fontWeight:900,color:col,fontFamily:"'DM Mono',monospace",lineHeight:1}}>{val}</div>
              <div style={{fontSize:8,color:P.muted,letterSpacing:1,textTransform:"uppercase",margin:"4px 0 6px"}}>{label}</div>
              <div style={{background:P.b1,borderRadius:99,height:5,overflow:"hidden",marginBottom:4}}>
                <div style={{width:`${clamp(val,0,100)}%`,height:"100%",background:col,borderRadius:99,transition:"width 1.2s cubic-bezier(.16,1,.3,1)"}}/>
              </div>
              <div style={{fontSize:8,color:col}}>{val<35?lo:val>70?hi:"Moderate"}</div>
            </div>
          ))}
        </div>
        {/* Stress meter */}
        <div style={{background:P.card,border:`1px solid ${stressColor}25`,borderRadius:10,padding:12}}>
          <div style={{fontSize:8,color:P.muted,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:8}}>Stress Indicator</div>
          <div style={{position:"relative",background:P.b1,borderRadius:99,height:10,overflow:"hidden",marginBottom:5}}>
            <div style={{position:"absolute",inset:0,background:`linear-gradient(90deg,${P.green},${P.amber} 50%,${P.red})`,opacity:0.4}}/>
            <div style={{position:"absolute",top:1,bottom:1,width:8,borderRadius:4,background:"#fff",
              left:`${clamp(stress,2,92)}%`,transform:"translateX(-50%)",transition:"left 1s"}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:8,color:P.muted,marginBottom:6}}>
            <span style={{color:P.green}}>Calm</span><span>Moderate</span><span style={{color:P.red}}>High Stress</span>
          </div>
          <div style={{fontSize:10.5,color:P.txt,lineHeight:1.6}}>
            {stress<35?"✅ Low stress detected — you appear calm and composed.":
             stress<65?"⚠️ Moderate stress visible — practice deep breathing before interviews.":
             "❌ High stress detected — tension visible in facial expressions. Try relaxation exercises."}
          </div>
        </div>
        {/* Emotions breakdown */}
        <div style={{background:P.card,border:`1px solid ${P.b1}`,borderRadius:11,padding:13}}>
          <div style={{fontSize:8,color:P.muted,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:10}}>
            All Emotions · Dominant: <span style={{color:P.white,textTransform:"capitalize"}}>{emojiEmo(dominantEmo)} {dominantEmo}</span>
          </div>
          {Object.keys(allEmotions).length>0
            ? Object.entries(allEmotions).sort((a,b)=>sv(b[1])-sv(a[1])).map(([emo,val])=>{
                const emoColors={happy:P.green,neutral:P.muted,fear:P.amber,angry:P.red,sad:P.indigo,surprise:P.v4,disgust:P.orange};
                const col=emoColors[emo]||P.muted;
                const pct=Math.round(clamp(sv(val),0,100));
                return <div key={emo} style={{marginBottom:8}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:2}}>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <span style={{fontSize:13}}>{emojiEmo(emo)}</span>
                      <span style={{fontSize:10,color:emo===dominantEmo?P.white:P.txt,textTransform:"capitalize",fontWeight:emo===dominantEmo?700:400}}>{emo}</span>
                      {emo===dominantEmo&&<span style={{fontSize:7.5,color:col,background:col+"20",border:`1px solid ${col}40`,borderRadius:3,padding:"1px 5px",fontFamily:"'DM Mono',monospace",fontWeight:700}}>DOMINANT</span>}
                    </div>
                    <span style={{fontSize:9.5,color:col,fontWeight:700,fontFamily:"'DM Mono',monospace"}}>{pct}%</span>
                  </div>
                  <div style={{background:P.b1,borderRadius:99,height:4,overflow:"hidden"}}>
                    <div style={{width:`${pct}%`,height:"100%",background:`linear-gradient(90deg,${col}60,${col})`,borderRadius:99,transition:"width 1.2s cubic-bezier(.16,1,.3,1)"}}/>
                  </div>
                </div>;
              })
            : <div style={{fontSize:10.5,color:P.muted,padding:"8px 0",textAlign:"center"}}>
                No emotion data — face not detected during recording
              </div>
          }
        </div>
      </div>}

      {/* Language Tab */}
      {tab==="lang"&&<div style={{display:"flex",flexDirection:"column",gap:10}}>
        <div style={{background:P.card,border:`1px solid ${P.b1}`,borderRadius:11,padding:13}}>
          <div style={{fontSize:8,color:P.muted,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:10}}>Language Scores</div>
          {[["NLP Overall",nlpScore,scoreCol(nlpScore)],
            ["Vocabulary Richness",Math.round(sv(nlp.vocabulary_richness||nlp.lexical_diversity||0.5)*100),P.green],
            ["Grammar & Fluency",rnd(nlp.grammar_score||nlp.fluency_score||70),P.v4],
            ["Keyword Relevance",rnd(nlp.keyword_relevance||nlp.relevance_score||60),P.amber]].map(([label,val,col])=>(
            <div key={label} style={{marginBottom:9}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                <span style={{fontSize:10,color:P.txt}}>{label}</span>
                <span style={{fontSize:9.5,color:col,fontWeight:700,fontFamily:"'DM Mono',monospace"}}>{val}/100</span>
              </div>
              <div style={{background:P.b1,borderRadius:99,height:4,overflow:"hidden"}}>
                <div style={{width:`${clamp(val,0,100)}%`,height:"100%",background:col,borderRadius:99}}/>
              </div>
            </div>
          ))}
        </div>
        <div style={{background:P.card,border:`1px solid ${P.b1}`,borderRadius:11,padding:13}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
            <div style={{fontSize:8,color:P.muted,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace"}}>Filler Words</div>
            <span style={{fontSize:9.5,color:fillers.length>5?P.red:P.green,fontFamily:"'DM Mono',monospace"}}>{fillers.length} found</span>
          </div>
          {fillers.length>0
            ? <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                {[...new Set(fillers)].map(f=>{
                  const cnt=fillers.filter(x=>x===f).length;
                  return <span key={f} style={{background:P.red+"18",border:`1px solid ${P.red}30`,
                    borderRadius:5,padding:"3px 8px",fontSize:9.5,color:P.red,fontFamily:"'DM Mono',monospace"}}>
                    "{f}" ×{cnt}
                  </span>;
                })}
              </div>
            : <div style={{fontSize:10.5,color:P.green}}>✓ No filler words detected!</div>
          }
        </div>
        <div style={{background:P.s1,border:`1px solid ${P.b1}`,borderRadius:10,padding:12}}>
          <div style={{fontSize:8,color:P.muted,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:6,
            display:"flex",justifyContent:"space-between"}}>
            <span>Transcript</span>
            <span style={{color:P.v4}}>{sv(stt.word_count)} words</span>
          </div>
          <div style={{fontSize:10.5,color:P.v4,lineHeight:1.8,fontStyle:"italic"}}>{ss(stt.transcript,"No transcript available.")}</div>
        </div>
      </div>}
    </div>
  );
}

/* ════════════ FINAL REPORT ══════════════════════════════════════════════ */
/* ── SVG Radar Chart ────────────────────────────────────────────────────── */
function RadarChart({labels,values,colors,size=220}){
  const n=labels.length;if(!n) return null;
  const cx=size/2,cy=size/2,R=size*0.36;
  const pts=labels.map((_,i)=>{const a=(Math.PI*2*i/n)-Math.PI/2;return{cos:Math.cos(a),sin:Math.sin(a)};});
  const poly=values.map((v,i)=>{const r=(clamp(v,0,100)/100)*R;return`${cx+pts[i].cos*r},${cy+pts[i].sin*r}`;}).join(" ");
  return <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{overflow:"visible"}}>
    <defs>
      <radialGradient id="rfill2"><stop offset="0%" stopColor={P.v2} stopOpacity="0.3"/>
        <stop offset="100%" stopColor={P.v2} stopOpacity="0.03"/></radialGradient>
    </defs>
    {[20,40,60,80,100].map(p=><polygon key={p} fill="none" stroke={P.b2} strokeWidth="0.7"
      points={pts.map(pt=>`${cx+pt.cos*(p/100)*R},${cy+pt.sin*(p/100)*R}`).join(" ")}/>)}
    {pts.map((p,i)=><line key={i} x1={cx} y1={cy} x2={cx+p.cos*R} y2={cy+p.sin*R} stroke={P.b2} strokeWidth="0.7"/>)}
    <polygon points={poly} fill="url(#rfill2)" stroke={P.v3} strokeWidth="1.5" strokeOpacity="0.9"/>
    {values.map((v,i)=>{const r=(clamp(v,0,100)/100)*R;
      return <circle key={i} cx={cx+pts[i].cos*r} cy={cy+pts[i].sin*r} r={3.5}
        fill={colors[i%colors.length]} stroke={P.bg} strokeWidth="1.5"/>;
    })}
    {labels.map((label,i)=>{
      const lx=cx+pts[i].cos*(R+22),ly=cy+pts[i].sin*(R+22);
      const words=label.split(" ");
      return <text key={i} textAnchor="middle" fill={colors[i%colors.length]} fontSize="7.5" fontWeight="600" fontFamily="system-ui">
        {words.map((w,wi)=><tspan key={wi} x={lx} y={ly+wi*9}>{w}</tspan>)}
      </text>;
    })}
  </svg>;
}

/* ── Bar Chart SVG ──────────────────────────────────────────────────────── */
function BarChart({data,height=120}){
  const w=36,gap=12,pl=8;
  const total=data.length*(w+gap);
  return <svg width={total+pl} height={height+30} style={{overflow:"visible"}}>
    {data.map(({label,value,color},i)=>{
      const bh=Math.round((clamp(value,0,100)/100)*height);
      const x=pl+i*(w+gap);
      return <g key={i}>
        <rect x={x} y={height-bh+5} width={w} height={bh} rx={4} fill={color+"40"} stroke={color} strokeWidth="1"/>
        <text x={x+w/2} y={height-bh} textAnchor="middle" fill={color} fontSize="9" fontWeight="700" fontFamily="monospace">{value}</text>
        {label.split(" ").map((word,wi)=>(
          <text key={wi} x={x+w/2} y={height+16+wi*10} textAnchor="middle" fill={P.muted} fontSize="7.5" fontFamily="system-ui">{word}</text>
        ))}
      </g>;
    })}
  </svg>;
}

/* ── PDF Generator ──────────────────────────────────────────────────────── */
function buildFinalPDF(r,combinedResults,role,difficulty,avgVoice,avgNLP,avgFacial,avgAgent){
  const now=new Date();
  const dateStr=now.toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"});
  const timeStr=now.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});
  const gc={"A+":"#34d399",A:"#34d399",B:"#a78bfa",C:"#fbbf24",D:"#fb923c",F:"#f87171"}[r.overall_grade]||"#a78bfa";
  const hlColor={"Strong Yes":"#34d399",Yes:"#34d399",Maybe:"#fbbf24",No:"#f87171"}[r.hiring_likelihood]||"#524e6a";

  const questionRows=combinedResults.map((cr,i)=>{
    const aiGrade=ss(so(cr.agentEval).grade,"?");
    const aiScore=rnd(so(so(cr.agentEval).scores).overall);
    const mlScore=rnd(so(so(cr.mlResult).feedback).overall_score);
    const gc2={"A+":"#34d399",A:"#34d399",B:"#a78bfa",C:"#fbbf24",D:"#fb923c",F:"#f87171"}[aiGrade]||"#888";
    const wpm=rnd(so(so(so(cr.mlResult).audio).rhythm).estimated_wpm||so(so(so(cr.mlResult).audio).rhythm).speaking_rate||0);
    const conf=rnd(so(so(cr.mlResult).facial).confidence_score||0);
    const fillers=sa(so(so(cr.mlResult).nlp).filler_words_found).length;
    return `<tr style="border-bottom:1px solid #1e1e32">
      <td style="padding:9px 8px;color:#524e6a;font-family:monospace;font-size:10px">${i+1}</td>
      <td style="padding:9px 8px;color:#edeaff;font-size:10.5px;max-width:220px;line-height:1.5">${cr.question}</td>
      <td style="padding:9px 8px;font-size:16px;font-weight:900;color:${gc2};font-family:monospace;text-align:center">${aiGrade}</td>
      <td style="padding:9px 8px;color:${gc2};font-family:monospace;font-size:11px;text-align:center">${aiScore||mlScore}</td>
      <td style="padding:9px 8px;color:${wpm>170?"#f87171":wpm>140?"#34d399":wpm>90?"#fbbf24":"#524e6a"};font-family:monospace;font-size:10px;text-align:center">${wpm>0?wpm+" WPM":"—"}</td>
      <td style="padding:9px 8px;color:${conf>70?"#34d399":conf>40?"#fbbf24":"#f87171"};font-family:monospace;font-size:10px;text-align:center">${conf}</td>
      <td style="padding:9px 8px;color:${fillers>5?"#f87171":"#34d399"};font-family:monospace;font-size:10px;text-align:center">${fillers}</td>
    </tr>`;
  }).join("");

  const catScoresHTML=Object.entries(so(r.category_scores)).map(([cat,score],i)=>{
    const cols=["#a78bfa","#34d399","#818cf8","#fbbf24","#c084b8"];
    const col=cols[i%5];
    return `<div style="margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;margin-bottom:4px">
        <span style="font-size:11px;color:#c8c4e0">${cat}</span>
        <span style="font-size:11px;color:${col};font-weight:700;font-family:monospace">${score}/100</span>
      </div>
      <div style="background:#1e1e32;border-radius:99px;height:6px;overflow:hidden">
        <div style="width:${clamp(sv(score),0,100)}%;height:100%;background:${col};border-radius:99px"></div>
      </div>
    </div>`;
  }).join("");

  const mlBarsHTML=[["🎙 Voice",avgVoice,"#fbbf24"],["💬 Language",avgNLP,"#34d399"],["👁 Facial",avgFacial,"#c084b8"],["🤖 AI Content",avgAgent,"#a78bfa"]].map(([label,val,col])=>`
    <div style="margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;margin-bottom:3px">
        <span style="font-size:10.5px;color:#c8c4e0">${label}</span>
        <span style="font-size:10px;color:${col};font-weight:700;font-family:monospace">${val}/100</span>
      </div>
      <div style="background:#1e1e32;border-radius:99px;height:5px;overflow:hidden">
        <div style="width:${val}%;height:100%;background:${col};border-radius:99px"></div>
      </div>
    </div>`).join("");

  const strengthsHTML=sa(r.top_strengths).map(s=>`<div style="display:flex;gap:8px;padding:7px 9px;background:#34d39908;border:1px solid #34d39920;border-radius:7px;margin-bottom:6px"><span style="color:#34d399;flex-shrink:0">✓</span><span style="font-size:10.5px;color:#c8c4e0;line-height:1.6">${s}</span></div>`).join("");
  const gapsHTML=sa(r.critical_gaps).map(s=>`<div style="display:flex;gap:8px;padding:7px 9px;background:#f8717108;border:1px solid #f8717120;border-radius:7px;margin-bottom:6px"><span style="color:#f87171;flex-shrink:0">!</span><span style="font-size:10.5px;color:#c8c4e0;line-height:1.6">${s}</span></div>`).join("");
  const roadmapHTML=sa(r.learning_roadmap).map((item,i)=>`<div style="display:flex;gap:9px;background:#7c3aed10;border-radius:8px;padding:9px 11px;border:1px solid #2a2a42;margin-bottom:7px"><span style="color:#a78bfa;font-family:monospace;font-size:10px;font-weight:800;flex-shrink:0;min-width:20px">${String(i+1).padStart(2,"0")}</span><span style="font-size:10.5px;color:#c8c4e0;line-height:1.6">${item}</span></div>`).join("");

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/>
<title>MockAI Interview Report — ${dateStr}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',system-ui,sans-serif;background:#07070d;color:#c8c4e0;line-height:1.6;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{padding:44px 52px;max-width:1050px;margin:0 auto}
.cover{min-height:100vh;display:flex;flex-direction:column;justify-content:center;padding:60px 72px;background:radial-gradient(ellipse 70% 60% at 80% 20%,#5b21b622,transparent),radial-gradient(ellipse 50% 40% at 10% 80%,#7c3aed12,transparent)}
.section-break{page-break-before:always}
h2{font-size:20px;font-weight:800;color:#edeaff;margin-bottom:16px;padding-bottom:10px;border-bottom:1px solid #1e1e32}
.card{background:#131320;border:1px solid #1e1e32;border-radius:12px;padding:18px;margin-bottom:14px}
table{width:100%;border-collapse:collapse;font-size:11px}
th{text-align:left;color:#524e6a;font-size:8px;letter-spacing:1.5px;text-transform:uppercase;padding:8px;border-bottom:1px solid #1e1e32;background:#10101c;font-family:monospace}
@media print{body{print-color-adjust:exact}.cover{page-break-after:always}.section-break{page-break-before:always}}
</style></head><body>

<div class="cover">
  <div style="display:inline-flex;align-items:center;gap:8px;background:#a78bfa18;border:1px solid #a78bfa30;border-radius:99px;padding:6px 16px;font-size:10px;color:#a78bfa;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:28px;width:fit-content">🎯 MockAI · Interview Report</div>
  <div style="font-size:48px;font-weight:900;color:#edeaff;letter-spacing:-2px;line-height:1.05;margin-bottom:6px">Interview<br/>Performance<br/>Analysis</div>
  <div style="font-size:18px;font-weight:300;color:#a78bfa;margin-bottom:40px">${role} · ${difficulty} Difficulty · ${combinedResults.length} Questions</div>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:40px">
    ${[["Grade",r.overall_grade,gc],["Score",r.overall_score+"/100",gc],["Questions",combinedResults.length,"#a78bfa"],["Hiring",r.hiring_likelihood,hlColor]].map(([l,v,c])=>`
    <div style="background:#131320;border:1px solid #1e1e32;border-radius:12px;padding:18px 14px;text-align:center;position:relative;overflow:hidden">
      <div style="position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,${c},${c}44,transparent)"></div>
      <div style="font-size:28px;font-weight:900;color:${c};font-family:monospace;line-height:1;margin-bottom:5px">${v}</div>
      <div style="font-size:9px;color:#524e6a;letter-spacing:1.5px;text-transform:uppercase">${l}</div>
    </div>`).join("")}
  </div>
  <div style="height:1px;background:linear-gradient(90deg,transparent,#2a2a42,transparent);margin-bottom:28px"></div>
  <div style="display:flex;justify-content:space-between;align-items:center">
    <div style="font-size:11px;color:#524e6a">📅 ${dateStr} · ${timeStr}</div>
    <div style="font-size:9px;color:#524e6a;letter-spacing:1px;text-transform:uppercase">Whisper · Librosa · DeepFace · NLP · AI Agent</div>
  </div>
</div>

<div class="page section-break">
  <h2>📊 Session Summary</h2>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">
    <div class="card">
      <div style="font-size:8px;color:#524e6a;letter-spacing:2px;text-transform:uppercase;font-family:monospace;margin-bottom:12px">Module Averages</div>
      ${mlBarsHTML}
    </div>
    <div class="card">
      <div style="font-size:8px;color:#524e6a;letter-spacing:2px;text-transform:uppercase;font-family:monospace;margin-bottom:12px">AI Category Scores</div>
      ${catScoresHTML}
    </div>
  </div>
  <div class="card" style="background:#0c0c16;border-color:#7c3aed30">
    <div style="font-size:8px;color:#a78bfa;letter-spacing:2px;text-transform:uppercase;font-family:monospace;margin-bottom:8px">Session Verdict</div>
    <div style="font-size:12px;color:#edeaff;line-height:1.7">${r.session_verdict}</div>
    <div style="margin-top:10px;display:inline-flex;align-items:center;gap:8px;background:${hlColor}18;border:1px solid ${hlColor}40;border-radius:8px;padding:6px 14px">
      <span style="font-size:13px;font-weight:800;color:${hlColor}">${r.hiring_likelihood}</span>
      <span style="font-size:9px;color:#524e6a">· ${r.hiring_reason}</span>
    </div>
  </div>

  <h2 style="margin-top:24px">📋 Question Breakdown</h2>
  <div class="card" style="padding:0;overflow:hidden">
    <table>
      <thead><tr>
        <th>#</th><th>Question</th><th style="text-align:center">Grade</th>
        <th style="text-align:center">Score</th><th style="text-align:center">WPM</th>
        <th style="text-align:center">Confidence</th><th style="text-align:center">Fillers</th>
      </tr></thead>
      <tbody>${questionRows}</tbody>
    </table>
  </div>
</div>

<div class="page section-break">
  <h2>💪 Strengths & 🚧 Gaps</h2>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px">
    <div class="card" style="border-color:#34d39930">
      <div style="font-size:8px;color:#34d399;letter-spacing:2px;text-transform:uppercase;font-family:monospace;margin-bottom:12px">Top Strengths</div>
      ${strengthsHTML}
    </div>
    <div class="card" style="border-color:#f8717130">
      <div style="font-size:8px;color:#f87171;letter-spacing:2px;text-transform:uppercase;font-family:monospace;margin-bottom:12px">Critical Gaps</div>
      ${gapsHTML}
    </div>
  </div>

  <h2>🗺️ Learning Roadmap</h2>
  <div class="card" style="border-color:#7c3aed30">
    <div style="font-size:8px;color:#a78bfa;letter-spacing:2px;text-transform:uppercase;font-family:monospace;margin-bottom:14px">Study These Next</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      ${roadmapHTML}
    </div>
  </div>
</div>

${combinedResults.map((cr,i)=>{
  const aiGrade=ss(so(cr.agentEval).grade,"?");
  const aiScore=rnd(so(so(cr.agentEval).scores).overall);
  const gc2={"A+":"#34d399",A:"#34d399",B:"#a78bfa",C:"#fbbf24",D:"#fb923c",F:"#f87171"}[aiGrade]||"#888";
  const transcript=ss(so(so(cr.mlResult).stt).transcript,"No transcript.");
  const wpm=rnd(so(so(so(cr.mlResult).audio).rhythm).estimated_wpm||so(so(so(cr.mlResult).audio).rhythm).speaking_rate||0);
  const conf=rnd(so(so(cr.mlResult).facial).confidence_score||0);
  const stress=rnd(so(so(cr.mlResult).facial).stress_level||(100-conf)*0.6);
  const fillers=sa(so(so(cr.mlResult).nlp).filler_words_found);
  const nlpSc=rnd(so(so(cr.mlResult).nlp).nlp_overall_score||0);
  const delivery=rnd(so(so(so(cr.mlResult).audio).scores).delivery_clarity||0);
  const good=sa(so(cr.agentEval).what_was_good);
  const missing=sa(so(cr.agentEval).what_was_missing);
  const tip=ss(so(cr.agentEval).follow_up_tip,"");
  return `<div class="page section-break">
  <div style="display:flex;gap:14px;align-items:flex-start;margin-bottom:18px;padding:14px;background:#131320;border:1px solid ${gc2}30;border-radius:12px">
    <div style="text-align:center;flex-shrink:0">
      <div style="font-size:52px;font-weight:900;color:${gc2};font-family:monospace;line-height:1">${aiGrade}</div>
      <div style="font-size:20px;font-weight:900;color:${gc2};font-family:monospace">${aiScore}/100</div>
    </div>
    <div>
      <div style="font-size:8px;color:#524e6a;letter-spacing:2px;text-transform:uppercase;font-family:monospace;margin-bottom:5px">Question ${i+1} of ${combinedResults.length}</div>
      <div style="font-size:14px;font-weight:700;color:#edeaff;line-height:1.5;margin-bottom:8px">${cr.question}</div>
      <div style="font-size:11px;color:#c8c4e0">${ss(so(cr.agentEval).verdict,"")}</div>
    </div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px;margin-bottom:14px">
    ${[["🎙 Delivery",delivery,"#fbbf24"],["💬 NLP",nlpSc,"#34d399"],["👁 Confidence",conf,"#c084b8"],["⚡ WPM",wpm>0?wpm:"—","#818cf8"]].map(([l,v,c])=>`
    <div style="background:#10101c;border:1px solid ${c}25;border-radius:9px;padding:12px;text-align:center">
      <div style="font-size:18px;font-weight:900;color:${c};font-family:monospace;line-height:1">${v}</div>
      <div style="font-size:8px;color:#524e6a;letter-spacing:1px;text-transform:uppercase;margin-top:4px">${l}</div>
    </div>`).join("")}
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
    <div class="card" style="border-color:#34d39930">
      <div style="font-size:8px;color:#34d399;letter-spacing:2px;text-transform:uppercase;font-family:monospace;margin-bottom:8px">What Was Good</div>
      ${good.map(s=>`<div style="display:flex;gap:7px;margin-bottom:6px"><span style="color:#34d399;flex-shrink:0">✓</span><span style="font-size:10.5px;color:#c8c4e0;line-height:1.6">${s}</span></div>`).join("")}
    </div>
    <div class="card" style="border-color:#f8717130">
      <div style="font-size:8px;color:#f87171;letter-spacing:2px;text-transform:uppercase;font-family:monospace;margin-bottom:8px">What Was Missing</div>
      ${missing.map(s=>`<div style="display:flex;gap:7px;margin-bottom:6px"><span style="color:#f87171;flex-shrink:0">→</span><span style="font-size:10.5px;color:#c8c4e0;line-height:1.6">${s}</span></div>`).join("")}
    </div>
  </div>
  ${tip?`<div class="card" style="border-color:#fbbf2430;display:flex;gap:9px;padding:10px 14px">
    <span style="font-size:14px;flex-shrink:0">💡</span>
    <span style="font-size:10.5px;color:#c8c4e0;line-height:1.7"><strong style="color:#fbbf24">Coaching Tip: </strong>${tip}</span>
  </div>`:""}
  <div class="card" style="margin-top:10px;background:#0c0c16">
    <div style="font-size:8px;color:#524e6a;letter-spacing:2px;text-transform:uppercase;font-family:monospace;margin-bottom:7px;display:flex;justify-content:space-between">
      <span>Your Answer (Transcript)</span>
      ${fillers.length>0?`<span style="color:#f87171">⚠️ ${fillers.length} filler word${fillers.length>1?"s":""}</span>`:"<span style='color:#34d399'>✓ No filler words</span>"}
    </div>
    <div style="font-size:10.5px;color:#a78bfa;line-height:1.8;font-style:italic">${transcript}</div>
  </div>
</div>`;}).join("")}

<div class="page">
  <div style="margin-top:40px;padding-top:18px;border-top:1px solid #1e1e32;display:flex;justify-content:space-between;font-size:10px;color:#524e6a;font-family:monospace">
    <span>MockAI Interview Coach · AI-Powered Performance Analysis</span>
    <span>Generated ${dateStr} · ${timeStr}</span>
  </div>
</div>
<script>window.onload=()=>window.print();</script>
</body></html>`;
}

function downloadFinalPDF(agentReport,combinedResults,role,difficulty,avgVoice,avgNLP,avgFacial,avgAgent){
  const html=buildFinalPDF(agentReport,combinedResults,role,difficulty,avgVoice,avgNLP,avgFacial,avgAgent);
  const win=window.open("","_blank");
  if(!win){alert("Please allow popups to download the report.");return;}
  win.document.write(html);
  win.document.close();
}

function FinalReport({agentReport,combinedResults,role,difficulty,onRestart}){
  const [expandedQ,setExpandedQ]=useState(null);
  const [view,setView]=useState("summary"); // "summary" | "question"
  const {isMobile,isTablet}=useBreakpoint();
  const r=so(agentReport);
  const catColors=[P.v4,P.green,P.indigo,P.amber,P.rose];
  const n=Math.max(combinedResults.length,1);

  const avgVoice  = Math.round(combinedResults.reduce((a,cr)=>a+rnd(so(so(so(cr.mlResult).audio).scores).delivery_clarity),0)/n);
  const avgNLP    = Math.round(combinedResults.reduce((a,cr)=>a+rnd(so(so(cr.mlResult).nlp).nlp_overall_score),0)/n);
  const avgFacial = Math.round(combinedResults.reduce((a,cr)=>a+rnd(so(so(cr.mlResult).facial).confidence_score),0)/n);
  const avgAgent  = Math.round(combinedResults.reduce((a,cr)=>a+sv(so(cr.agentEval?.scores).overall),0)/n);

  // Compute fallback overall if API returned 0
  const computedOverall = Math.round((avgAgent*0.4)+(avgNLP*0.25)+(avgVoice*0.2)+(avgFacial*0.15));
  const displayScore = sv(r.overall_score)>0 ? sv(r.overall_score) : computedOverall;
  const displayGrade = sv(r.overall_score)>0 ? ss(r.overall_grade,"?") :
    displayScore>=90?"A+":displayScore>=80?"A":displayScore>=70?"B":displayScore>=60?"C":displayScore>=50?"D":"F";
  const gc=gradeCol(displayGrade);
  const avgWPM    = Math.round(combinedResults.reduce((a,cr)=>a+rnd(so(so(so(cr.mlResult).audio).rhythm).estimated_wpm||so(so(so(cr.mlResult).audio).rhythm).speaking_rate||0),0)/n);
  const avgStress = Math.round(combinedResults.reduce((a,cr)=>{const conf=rnd(so(so(cr.mlResult).facial).confidence_score||0);return a+rnd(so(so(cr.mlResult).facial).stress_level||(100-conf)*0.6);},0)/n);
  const hlColor={"Strong Yes":P.green,Yes:P.green,Maybe:P.amber,No:P.red}[r.hiring_likelihood]||P.muted;

  const radarLabels=["Voice","Language","Facial","AI Content","Delivery"];
  const radarValues=[avgVoice,avgNLP,avgFacial,avgAgent,avgVoice];
  const radarColors=[P.amber,P.green,P.rose,P.v4,P.indigo];

  return(
    <div style={{height:"100vh",background:P.bg,color:P.txt,display:"flex",flexDirection:"column",
      fontFamily:"'Outfit','Segoe UI',system-ui,sans-serif",overflow:"hidden"}}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>
      <div style={{position:"fixed",inset:0,pointerEvents:"none",
        background:`radial-gradient(ellipse 60% 40% at 15% 0%,${P.v1}18,transparent)`}}/>

      {/* Header */}
      <header style={{position:"relative",zIndex:10,background:P.s1+"ee",borderBottom:`1px solid ${P.b1}`,
        padding:`0 ${isMobile?12:24}px`,display:"flex",alignItems:"center",justifyContent:"space-between",
        height:isMobile?48:54,backdropFilter:"blur(12px)",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <MockAILogo size={isMobile?28:32}/>
          <div>
            <div style={{fontSize:isMobile?12:15,fontWeight:800,color:P.white}}>Interview Complete</div>
            {!isMobile&&<div style={{fontSize:8,color:P.muted,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace"}}>
              {role} · {difficulty} · {combinedResults.length} questions
            </div>}
          </div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <button onClick={()=>downloadFinalPDF(r,combinedResults,role,difficulty,avgVoice,avgNLP,avgFacial,avgAgent)}
            style={{background:`linear-gradient(135deg,${P.v1},${P.v2})`,border:"none",color:"#fff",
              borderRadius:9,padding:isMobile?"7px 12px":"8px 18px",fontSize:isMobile?10:12,fontWeight:700,
              cursor:"pointer",display:"flex",alignItems:"center",gap:6,
              boxShadow:`0 4px 20px ${P.v2}40`,fontFamily:"inherit"}}>
            <span style={{fontSize:12}}>⬇</span>{isMobile?"PDF":"Download PDF"}
          </button>
          <button onClick={onRestart} style={{background:P.vglow,border:`1px solid ${P.v2}50`,
            color:P.v4,borderRadius:9,padding:isMobile?"7px 12px":"8px 16px",
            fontSize:isMobile?10:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
            ↺{isMobile?"":" New"}
          </button>
        </div>
      </header>

      <div style={{position:"relative",zIndex:1,flex:1,
        display:isMobile?"flex":"grid",
        flexDirection:isMobile?"column":"row",
        gridTemplateColumns:isMobile?"none":isTablet?"280px 1fr":"320px 1fr",
        overflow:"hidden"}}>
        {/* Left sidebar — full width on mobile as top section */}
        <div style={{
          borderRight:isMobile?"none":`1px solid ${P.b1}`,
          borderBottom:isMobile?`1px solid ${P.b1}`:"none",
          display:"flex",flexDirection:"column",
          overflow:isMobile?"visible":"hidden",
          flexShrink:isMobile?0:undefined,
          background:P.s1+"88"}}>
          {/* Grade hero */}
          <div style={{padding:"16px",borderBottom:`1px solid ${P.b1}`,flexShrink:0,
            background:P.card,position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",inset:0,background:`radial-gradient(ellipse at 0% 50%,${gc}0e,transparent 60%)`,pointerEvents:"none"}}/>
            <div style={{display:"flex",gap:14,alignItems:"center",position:"relative",zIndex:1,marginBottom:12}}>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:60,fontWeight:900,fontFamily:"'DM Mono',monospace",color:gc,lineHeight:1,letterSpacing:-3}}>{displayGrade}</div>
                <div style={{fontSize:8,color:P.muted,letterSpacing:2,textTransform:"uppercase"}}>grade</div>
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:26,fontWeight:900,color:gc,fontFamily:"'DM Mono',monospace",lineHeight:1}}>
                  {displayScore}<span style={{fontSize:12,color:P.muted,fontWeight:400}}>/100</span>
                </div>
                <div style={{fontSize:9,color:P.muted,marginTop:4,lineHeight:1.6}}>{ss(r.session_verdict,"").substring(0,80)}…</div>
                <div style={{marginTop:8,display:"inline-flex",alignItems:"center",gap:6,
                  background:hlColor+"18",border:`1px solid ${hlColor}40`,borderRadius:7,padding:"4px 10px"}}>
                  <span style={{fontSize:11,fontWeight:800,color:hlColor}}>{r.hiring_likelihood}</span>
                  <span style={{fontSize:8,color:P.muted}}>Hire Likelihood</span>
                </div>
              </div>
            </div>
            {/* Module avg mini bars */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,position:"relative",zIndex:1}}>
              {[["🎙 Voice",avgVoice,P.amber],["💬 NLP",avgNLP,P.green],["👁 Face",avgFacial,P.rose],["🤖 AI",avgAgent,P.v4]].map(([label,val,col])=>(
                <div key={label} style={{background:P.s2,border:`1px solid ${col}20`,borderRadius:8,padding:"7px 8px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                    <span style={{fontSize:9,color:P.muted}}>{label}</span>
                    <span style={{fontSize:10,fontWeight:700,color:col,fontFamily:"'DM Mono',monospace"}}>{val}</span>
                  </div>
                  <div style={{background:P.b1,borderRadius:99,height:3,overflow:"hidden"}}>
                    <div style={{width:`${val}%`,height:"100%",background:col,borderRadius:99}}/>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* View toggle */}
          <div style={{padding:"8px 12px",borderBottom:`1px solid ${P.b1}`,flexShrink:0,display:"flex",gap:6}}>
            {[["summary","📊 Summary"],["question","❓ Questions"]].map(([id,label])=>(
              <button key={id} onClick={()=>{setView(id);setExpandedQ(null);}} style={{
                flex:1,padding:"6px",borderRadius:7,border:"none",cursor:"pointer",
                background:view===id?P.v2:"transparent",color:view===id?"#fff":P.muted,
                fontSize:10,fontWeight:view===id?700:400,fontFamily:"inherit",transition:"all .2s"}}>
                {label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{flex:1,overflowY:"auto",padding:"10px 12px"}}>
            {view==="summary"&&<>
              {/* Category scores — use fallback computed from ML+AI averages if API returned 0 */}
              <div style={{fontSize:8,color:P.muted,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:8}}>AI Category Scores</div>
              {(()=>{
                const cats=so(r.category_scores);
                // If all zeros (API bug), compute from module averages
                const allZero=Object.values(cats).every(v=>sv(v)===0);
                const fallback={
                  "Technical Knowledge": avgAgent,
                  "Communication": Math.round((avgNLP+avgVoice)/2),
                  "Problem Solving": avgAgent,
                  "Practical Experience": Math.round((avgAgent+avgNLP)/2),
                  "Overall Readiness": Math.round((avgAgent+avgVoice+avgNLP+avgFacial)/4)
                };
                const display=allZero?fallback:cats;
                return Object.entries(display).map(([cat,score],i)=>(
                  <div key={cat} style={{marginBottom:8}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                      <span style={{fontSize:10,color:P.txt}}>{cat}</span>
                      <span style={{fontSize:9.5,color:catColors[i%5],fontFamily:"'DM Mono',monospace",fontWeight:700}}>{rnd(sv(score))}/100</span>
                    </div>
                    <div style={{background:P.b1,borderRadius:99,height:4,overflow:"hidden"}}>
                      <div style={{width:`${clamp(rnd(sv(score)),0,100)}%`,height:"100%",background:catColors[i%5],borderRadius:99,transition:"width 1.2s cubic-bezier(.16,1,.3,1)"}}/>
                    </div>
                  </div>
                ));
              })()}
              {/* WPM / Stress avg */}
              <div style={{fontSize:8,color:P.muted,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:8,marginTop:14}}>Session Averages</div>
              {[["Avg Speaking Rate",avgWPM>0?avgWPM+" WPM":"—",avgWPM>170?P.red:avgWPM>140?P.green:P.amber],
                ["Avg Stress Level",avgStress+"%",avgStress>65?P.red:avgStress>35?P.amber:P.green],
                ["Avg Confidence",avgFacial+"/100",avgFacial>70?P.green:P.amber],
                ["Avg NLP Score",avgNLP+"/100",scoreCol(avgNLP)]].map(([l,v,c])=>(
                <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`1px solid ${P.b1}`}}>
                  <span style={{fontSize:10,color:P.muted}}>{l}</span>
                  <span style={{fontSize:10,color:c,fontWeight:700,fontFamily:"'DM Mono',monospace"}}>{v}</span>
                </div>
              ))}
            </>}

            {view==="question"&&<>
              <div style={{fontSize:8,color:P.muted,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:8}}>Click to review each answer</div>
              {combinedResults.map((cr,i)=>{
                const aiGrade=ss(so(cr.agentEval).grade,"?");
                const aiScore=sv(so(cr.agentEval?.scores).overall)||rnd(so(so(cr.mlResult).feedback).overall_score)||0;
                const gc2=gradeCol(aiGrade);
                const sel=expandedQ===i;
                return <div key={i} onClick={()=>setExpandedQ(sel?null:i)} style={{
                  background:sel?P.vglow:P.card,border:`1px solid ${sel?P.v2+"60":P.b1}`,
                  borderRadius:10,padding:"9px 11px",cursor:"pointer",marginBottom:6,
                  position:"relative",overflow:"hidden"}}>
                  {sel&&<div style={{position:"absolute",left:0,top:0,bottom:0,width:3,background:`linear-gradient(180deg,${P.v2},${P.v4})`}}/>}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:6}}>
                    <div style={{flex:1,paddingLeft:sel?7:0}}>
                      <div style={{fontSize:8.5,color:P.muted,fontFamily:"'DM Mono',monospace",marginBottom:3}}>Q{i+1}</div>
                      <div style={{fontSize:10,color:sel?P.white:P.txt,lineHeight:1.4,fontWeight:sel?600:400}}>{cr.question.substring(0,60)}…</div>
                    </div>
                    <div style={{textAlign:"center",flexShrink:0}}>
                      <div style={{fontSize:18,fontWeight:900,color:gc2,fontFamily:"'DM Mono',monospace"}}>{aiGrade}</div>
                      <div style={{fontSize:8.5,color:gc2,fontFamily:"'DM Mono',monospace"}}>{aiScore}</div>
                    </div>
                  </div>
                </div>;
              })}
            </>}
          </div>
        </div>

        {/* Right: main content area */}
        <div style={{display:"flex",flexDirection:"column",overflow:"hidden"}}>
          {/* Show question detail if selected */}
          {view==="question"&&expandedQ!==null&&combinedResults[expandedQ]
            ? <>
                <div style={{padding:"12px 20px",borderBottom:`1px solid ${P.b1}`,flexShrink:0,background:P.s1+"88"}}>
                  <div style={{fontSize:13,fontWeight:700,color:P.white,lineHeight:1.5}}>{combinedResults[expandedQ].question}</div>
                </div>
                <CombinedResult result={combinedResults[expandedQ]} qNumber={expandedQ+1}/>
              </>
            : <div style={{flex:1,overflowY:"auto",padding:isMobile?14:22}}>
                {/* Charts row */}
                <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"auto 1fr",gap:16,marginBottom:18}}>
                  {!isMobile&&<div style={{background:P.card,border:`1px solid ${P.b1}`,borderRadius:14,padding:16,display:"flex",flexDirection:"column",alignItems:"center"}}>
                    <div style={{fontSize:8,color:P.muted,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:8}}>Performance Radar</div>
                    <RadarChart labels={radarLabels} values={radarValues} colors={radarColors} size={isTablet?170:200}/>
                  </div>}
                  <div style={{background:P.card,border:`1px solid ${P.b1}`,borderRadius:14,padding:16}}>
                    <div style={{fontSize:8,color:P.muted,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:14}}>Per-Question Scores</div>
                    <div style={{overflowX:"auto"}}>
                      <BarChart height={isMobile?80:100} data={combinedResults.map((cr,i)=>({
                        label:`Q${i+1}`,
                        value:sv(so(cr.agentEval?.scores).overall)||rnd(so(so(cr.mlResult).feedback).overall_score)||0,
                        color:gradeCol(ss(so(cr.agentEval).grade||so(so(cr.mlResult).feedback).grade,"?"))
                      }))}/>
                    </div>
                    <div style={{display:"flex",gap:12,marginTop:8,flexWrap:"wrap"}}>
                      {combinedResults.map((cr,i)=>{
                        const score=sv(so(cr.agentEval?.scores).overall)||rnd(so(so(cr.mlResult).feedback).overall_score)||0;
                        const gc2=gradeCol(ss(so(cr.agentEval).grade,"?"));
                        return <div key={i} style={{display:"flex",alignItems:"center",gap:5}}>
                          <div style={{width:8,height:8,borderRadius:2,background:gc2}}/>
                          <span style={{fontSize:9,color:P.muted,fontFamily:"'DM Mono',monospace"}}>Q{i+1}: <span style={{color:gc2}}>{score}</span></span>
                        </div>;
                      })}
                    </div>
                  </div>
                </div>

                {/* Module breakdown chart */}
                <div style={{background:P.card,border:`1px solid ${P.b1}`,borderRadius:14,padding:16,marginBottom:18}}>
                  <div style={{fontSize:8,color:P.muted,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:14}}>Module Performance Breakdown</div>
                  <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)",gap:10}}>
                    {[["🎙 Voice\nDelivery",avgVoice,P.amber,avgVoice>75?"Excellent":avgVoice>50?"Good":"Needs Work"],
                      ["💬 Language\nQuality",avgNLP,P.green,avgNLP>75?"Strong":avgNLP>50?"Average":"Weak"],
                      ["👁 Facial\nPresence",avgFacial,P.rose,avgFacial>70?"Confident":avgFacial>40?"Moderate":"Nervous"],
                      ["🤖 AI\nContent",avgAgent,P.v4,avgAgent>75?"Excellent":avgAgent>50?"Adequate":"Poor"]].map(([label,val,col,interp])=>(
                      <div key={label} style={{background:P.s2,border:`1px solid ${col}25`,borderRadius:10,padding:isMobile?10:14,textAlign:"center"}}>
                        <div style={{fontSize:isMobile?22:28,fontWeight:900,color:col,fontFamily:"'DM Mono',monospace",lineHeight:1,marginBottom:4}}>{val}</div>
                        <div style={{fontSize:7.5,color:P.muted,letterSpacing:1,textTransform:"uppercase",marginBottom:6,whiteSpace:"pre-line"}}>{label}</div>
                        <div style={{background:P.b1,borderRadius:99,height:4,overflow:"hidden",marginBottom:5}}>
                          <div style={{width:`${val}%`,height:"100%",background:`linear-gradient(90deg,${col}70,${col})`,borderRadius:99}}/>
                        </div>
                        <div style={{fontSize:8.5,color:col,background:col+"18",borderRadius:4,padding:"2px 6px",display:"inline-block"}}>{interp}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Strengths + Gaps */}
                <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:14,marginBottom:18}}>
                  <div style={{background:P.card,border:`1px solid ${P.green}25`,borderRadius:13,padding:16}}>
                    <div style={{fontSize:8,color:P.green,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:10}}>✓ Top Strengths</div>
                    {(()=>{
                      const topLevel=sa(r.top_strengths).filter(Boolean);
                      const perQ=[...new Set(combinedResults.flatMap(cr=>sa(so(cr.agentEval).what_was_good)).filter(Boolean))].slice(0,4);
                      const strengths=topLevel.length>0?topLevel:perQ;
                      return strengths.length>0
                        ? strengths.map((s,i)=>(
                            <div key={i} style={{display:"flex",gap:8,padding:"7px 9px",background:P.green+"0a",borderRadius:7,border:`1px solid ${P.green}20`,marginBottom:6}}>
                              <span style={{color:P.green,fontSize:10,flexShrink:0}}>✓</span>
                              <span style={{fontSize:10.5,color:P.txt,lineHeight:1.6}}>{s}</span>
                            </div>
                          ))
                        : <div style={{fontSize:10.5,color:P.muted,padding:"8px 0",fontStyle:"italic"}}>Complete more questions to see strengths</div>;
                    })()}
                  </div>
                  <div style={{background:P.card,border:`1px solid ${P.red}25`,borderRadius:13,padding:16}}>
                    <div style={{fontSize:8,color:P.red,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:10}}>! Critical Gaps</div>
                    {(()=>{
                      const topLevel=sa(r.critical_gaps).filter(Boolean);
                      const perQ=[...new Set(combinedResults.flatMap(cr=>sa(so(cr.agentEval).what_was_missing)).filter(Boolean))].slice(0,4);
                      const gaps=topLevel.length>0?topLevel:perQ;
                      return gaps.length>0
                        ? gaps.map((s,i)=>(
                            <div key={i} style={{display:"flex",gap:8,padding:"7px 9px",background:P.red+"0a",borderRadius:7,border:`1px solid ${P.red}20`,marginBottom:6}}>
                              <span style={{color:P.red,fontSize:10,flexShrink:0}}>!</span>
                              <span style={{fontSize:10.5,color:P.txt,lineHeight:1.6}}>{s}</span>
                            </div>
                          ))
                        : <div style={{fontSize:10.5,color:P.muted,padding:"8px 0",fontStyle:"italic"}}>No major gaps identified</div>;
                    })()}
                  </div>
                </div>

                {/* Session verdict */}
                <div style={{background:P.card,border:`1px solid ${P.v2}30`,borderRadius:13,padding:16,marginBottom:18}}>
                  <div style={{fontSize:8,color:P.v4,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:8}}>Overall Assessment</div>
                  <div style={{fontSize:12,color:P.white,lineHeight:1.8,marginBottom:12}}>{r.session_verdict}</div>
                  <div style={{display:"flex",alignItems:"center",gap:10,background:hlColor+"12",border:`1px solid ${hlColor}30`,borderRadius:9,padding:"10px 14px"}}>
                    <span style={{fontSize:15,fontWeight:900,color:hlColor}}>{r.hiring_likelihood}</span>
                    <span style={{fontSize:11,color:P.txt,lineHeight:1.6}}>{r.hiring_reason}</span>
                  </div>
                </div>

                {/* Learning Roadmap */}
                <div style={{background:P.card,border:`1px solid ${P.v2}30`,borderRadius:13,padding:16}}>
                  <div style={{fontSize:8,color:P.v4,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:12}}>🗺️ Learning Roadmap</div>
                  <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:8}}>
                    {sa(r.learning_roadmap).map((item,i)=>(
                      <div key={i} style={{display:"flex",gap:9,background:P.vglow,borderRadius:9,padding:"10px 12px",border:`1px solid ${P.b2}`}}>
                        <span style={{color:P.v4,fontFamily:"'DM Mono',monospace",fontSize:10,fontWeight:800,flexShrink:0,minWidth:22}}>{String(i+1).padStart(2,"0")}</span>
                        <span style={{fontSize:10.5,color:P.txt,lineHeight:1.6}}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
          }
        </div>
      </div>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:#2a2a42;border-radius:3px}button{font-family:inherit;transition:opacity .15s}button:hover{opacity:.85}`}</style>
    </div>
  );
}
/* ════════════ MOBILE INTERVIEW LAYOUT ══════════════════════════════════ */
function MobileInterviewLayout({
  isMobile,status,isRec,isProc,isDone,answered,total,qNumber,
  currentQ,currentCtx,combinedResults,latestResult,
  loadStep,recTime,frames,camOk,liveEmo,blob,err,
  videoRef,canvasRef,analyser,startRec,stopRec,analyze,generateReport,
  setStatus,setBlob,setErr,setRecTime,setLoad,agentConfig,fullReset,backend
}){
  const [mobileTab,setMobileTab]=useState("record"); // record | results | progress

  // Auto-switch to results tab when a new analysis completes
  useEffect(()=>{
    if(latestResult&&isDone) setMobileTab("results");
  },[latestResult]);

  return(
    <div style={{position:"relative",zIndex:1,flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      {/* Mobile tab bar */}
      <div style={{display:"flex",background:P.s1,borderBottom:`1px solid ${P.b1}`,flexShrink:0}}>
        {[["record","🎙","Record"],["results","📊","Results"],["progress","📋","Progress"]].map(([id,icon,label])=>(
          <button key={id} onClick={()=>setMobileTab(id)} style={{
            flex:1,padding:"11px 4px",border:"none",cursor:"pointer",
            background:mobileTab===id?P.vglow:"transparent",
            borderBottom:`2px solid ${mobileTab===id?P.v2:"transparent"}`,
            color:mobileTab===id?P.v4:P.muted,
            fontSize:11,fontWeight:mobileTab===id?700:400,
            display:"flex",flexDirection:"column",alignItems:"center",gap:2,
            fontFamily:"inherit",transition:"all .2s"}}>
            <span style={{fontSize:16}}>{icon}</span>
            <span>{label}</span>
            {id==="results"&&latestResult&&<span style={{width:6,height:6,borderRadius:"50%",background:P.green,display:"block"}}/>}
          </button>
        ))}
      </div>

      {/* RECORD TAB */}
      {mobileTab==="record"&&<div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>

        {/* Question card — compact */}
        <div style={{padding:"10px 14px",background:P.s2,borderBottom:`1px solid ${P.b1}`,flexShrink:0}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{background:P.v2,borderRadius:5,padding:"2px 8px",fontSize:9,fontWeight:800,
                color:"#fff",fontFamily:"'DM Mono',monospace"}}>Q{qNumber}</div>
              <div style={{fontSize:8,color:P.muted,fontFamily:"'DM Mono',monospace"}}>of {total}</div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <div style={{background:P.v2+"20",border:`1px solid ${P.v2}40`,borderRadius:5,
                padding:"2px 8px",fontSize:9,color:P.v4,fontFamily:"'DM Mono',monospace",textTransform:"capitalize"}}>
                {agentConfig?.difficulty}
              </div>
              {/* Compact progress dots */}
              <div style={{display:"flex",gap:3}}>
                {Array.from({length:total}).map((_,i)=>(
                  <div key={i} style={{width:i<answered?14:i===answered?10:6,height:6,borderRadius:3,
                    background:i<answered?P.green:i===answered?P.v4:P.b2,transition:"all .3s"}}/>
                ))}
              </div>
            </div>
          </div>
          <div style={{fontSize:isMobile?12:13,fontWeight:700,color:P.white,lineHeight:1.4}}>{currentQ}</div>
          {currentCtx&&<div style={{fontSize:9.5,color:P.v4,marginTop:4,lineHeight:1.4}}>💡 {currentCtx}</div>}
        </div>

        {/* WEBCAM — Square on mobile (1:1), fills remaining space on tablet */}
        <div style={{
          position:"relative",
          background:"#000",
          overflow:"hidden",
          ...(isMobile
            ? {flexShrink:0, width:"100%", aspectRatio:"1/1"}
            : {flex:1, width:"100%", minHeight:0}
          )
        }}>
          {/* Recording border glow */}
          {isRec&&<div style={{position:"absolute",inset:0,zIndex:3,pointerEvents:"none",
            boxShadow:`inset 0 0 0 3px ${P.red}80`,borderRadius:0,
            animation:"recglow 1.5s ease-in-out infinite"}}/>}

          <video ref={videoRef} muted playsInline style={{
            width:"100%",height:"100%",
            objectFit:"cover",
            display:"block",
            filter:isRec?"none":"brightness(0.1) saturate(0)",
            transition:"filter .6s ease"}}/>
          <canvas ref={canvasRef} style={{display:"none"}}/>

          {/* Idle state — camera placeholder */}
          {!isRec&&!isProc&&<div style={{position:"absolute",inset:0,display:"flex",
            flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10,
            background:"linear-gradient(180deg,#07070d,#0c0c16)"}}>
            <div style={{width:60,height:60,borderRadius:"50%",background:P.vglow,
              border:`2px solid ${P.v2}40`,display:"flex",alignItems:"center",
              justifyContent:"center",fontSize:26}}>📹</div>
            <span style={{fontSize:11,color:P.muted,textAlign:"center",lineHeight:1.6}}>
              Camera activates<br/>when you start recording
            </span>
          </div>}

          {/* Recording timer badge */}
          {isRec&&<div style={{position:"absolute",top:12,left:12,zIndex:4,
            display:"flex",alignItems:"center",gap:6,
            background:"rgba(7,7,13,0.88)",backdropFilter:"blur(8px)",
            borderRadius:99,padding:"5px 12px",border:`1px solid ${P.red}50`}}>
            <span style={{width:7,height:7,borderRadius:"50%",background:P.red,
              display:"inline-block",animation:"pip 1s ease-in-out infinite"}}/>
            <span style={{fontSize:13,fontWeight:800,color:"#fff",fontFamily:"'DM Mono',monospace"}}>{fmt(recTime)}</span>
          </div>}

          {/* Face emotion overlay — bottom left */}
          {liveEmo&&isRec&&liveEmo.face_detected&&<div style={{
            position:"absolute",bottom:12,left:12,zIndex:4,
            background:"rgba(7,7,13,0.88)",backdropFilter:"blur(8px)",
            border:`1px solid ${P.v2}50`,borderRadius:12,
            padding:"8px 14px",display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:22}}>{emojiEmo(ss(liveEmo.dominant_emotion))}</span>
            <div>
              <div style={{fontSize:11,color:P.v4,fontWeight:700,textTransform:"capitalize"}}>
                {ss(liveEmo.dominant_emotion)}
              </div>
              <div style={{display:"flex",gap:8,marginTop:2}}>
                {[["C",rnd(liveEmo.confidence_score),P.v4],["E",rnd(liveEmo.eye_contact_score),P.green]].map(([l,v,c])=>(
                  <div key={l} style={{display:"flex",alignItems:"center",gap:3}}>
                    <span style={{fontSize:8,color:P.muted}}>{l}</span>
                    <span style={{fontSize:10,color:c,fontWeight:700,fontFamily:"'DM Mono',monospace"}}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>}

          {/* Processing overlay */}
          {isProc&&<div style={{position:"absolute",inset:0,zIndex:4,display:"flex",
            flexDirection:"column",alignItems:"center",justifyContent:"center",gap:14,
            background:"rgba(7,7,13,0.94)",backdropFilter:"blur(4px)"}}>
            <svg width="52" height="52" viewBox="0 0 44 44" style={{animation:"spin 1.2s linear infinite"}}>
              <circle cx="22" cy="22" r="18" fill="none" stroke={P.b2} strokeWidth="3"/>
              <circle cx="22" cy="22" r="18" fill="none" stroke={P.v3} strokeWidth="3"
                strokeDasharray="60 54" strokeLinecap="round"/>
            </svg>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:14,fontWeight:700,color:P.white,marginBottom:5}}>Analysing…</div>
              <div style={{fontSize:12,color:P.v4,fontFamily:"'DM Mono',monospace"}}>{loadStep}</div>
            </div>
          </div>}
        </div>

        {/* Waveform — compact */}
        <div style={{flexShrink:0,borderTop:`1px solid ${isRec?P.v2+"80":P.b1}`,
          background:isRec?P.vglow:"transparent",transition:"all .4s"}}>
          <Waveform analyser={analyser} active={isRec} height={isMobile?52:64}/>
        </div>

        {/* Controls */}
        <div style={{padding:"10px 14px",background:P.s1+"f8",borderTop:`1px solid ${P.b1}`,
          display:"flex",gap:8,alignItems:"center",flexShrink:0}}>
          {status!=="recording"
            ?<button onClick={startRec} disabled={isProc} style={{
              flex:1,background:isProc?"transparent":`linear-gradient(135deg,${P.v1},${P.v2})`,
              border:isProc?`1px solid ${P.b2}`:"none",color:isProc?P.muted:"#fff",
              borderRadius:11,padding:"13px",fontSize:14,fontWeight:700,cursor:isProc?"not-allowed":"pointer",
              display:"flex",alignItems:"center",justifyContent:"center",gap:8,fontFamily:"inherit",
              boxShadow:isProc?"none":`0 4px 20px ${P.v2}55`}}>
              {isProc
                ? <><span style={{animation:"spin 1s linear infinite",display:"inline-block",fontSize:16}}>⟳</span> {loadStep||"Processing…"}</>
                : <><span style={{width:9,height:9,borderRadius:"50%",background:"rgba(255,255,255,0.95)",display:"inline-block"}}/> Start Recording</>
              }
            </button>
            :<button onClick={stopRec} style={{flex:1,background:P.red+"18",border:`2px solid ${P.red}70`,
              color:P.red,borderRadius:11,padding:"13px",fontSize:14,fontWeight:700,cursor:"pointer",
              display:"flex",alignItems:"center",justifyContent:"center",gap:8,fontFamily:"inherit",
              boxShadow:`0 4px 16px ${P.red}30`}}>
              <span style={{width:9,height:9,borderRadius:2,background:P.red,display:"inline-block"}}/>
              Stop — {fmt(recTime)}
            </button>}
          {blob&&!isRec&&!isProc&&<>
            <button onClick={()=>{analyze();}} style={{
              flex:1,background:`linear-gradient(135deg,${P.v1},${P.v2})`,border:"none",
              color:"#fff",borderRadius:11,padding:"13px",fontSize:14,fontWeight:700,
              cursor:"pointer",fontFamily:"inherit",boxShadow:`0 4px 20px ${P.v2}55`,
              display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
              ⚡ Analyse Answer
            </button>
            <button onClick={()=>{setStatus("idle");setBlob(null);setErr("");setRecTime(0);setLoad("");}}
              style={{background:"transparent",border:`1px solid ${P.b2}`,color:P.muted,
              borderRadius:11,padding:"13px 16px",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>
              ↺
            </button>
          </>}
          {err&&<div style={{width:"100%",fontSize:11,color:P.red,background:P.red+"12",
            borderRadius:8,padding:"9px 12px",marginTop:4}}>⚠ {err}</div>}
        </div>

        {/* Green CTA when results ready */}
        {isDone&&latestResult&&<div style={{padding:"8px 14px",
          background:`linear-gradient(90deg,${P.green}12,${P.green}08)`,
          borderTop:`1px solid ${P.green}30`,flexShrink:0}}>
          <button onClick={()=>setMobileTab("results")} style={{width:"100%",
            background:`linear-gradient(135deg,${P.green}25,${P.green}15)`,
            border:`1px solid ${P.green}50`,color:P.green,borderRadius:10,padding:"11px",
            fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",
            display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
            📊 View Analysis Results →
          </button>
        </div>}
      </div>}

      {/* RESULTS TAB */}
      {mobileTab==="results"&&<div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {latestResult
          ? <CombinedResult result={latestResult} qNumber={qNumber-1}/>
          : <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",
              justifyContent:"center",padding:24,gap:12,color:P.muted,textAlign:"center"}}>
              <div style={{fontSize:40}}>📊</div>
              <div style={{fontSize:14,fontWeight:600,color:P.white}}>No results yet</div>
              <div style={{fontSize:11,color:P.muted,lineHeight:1.7}}>
                Record and analyse your answer to see detailed feedback here
              </div>
              <button onClick={()=>setMobileTab("record")} style={{background:P.vglow,
                border:`1px solid ${P.v2}50`,color:P.v4,borderRadius:9,padding:"10px 20px",
                fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",marginTop:8}}>
                🎙 Go to Record
              </button>
            </div>
        }
      </div>}

      {/* PROGRESS TAB */}
      {mobileTab==="progress"&&<div style={{flex:1,overflowY:"auto",padding:14}}>
        {/* Stats row */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
          {[["Questions Done",`${answered}/${total}`,P.v4],
            ["Difficulty",agentConfig?.difficulty||"—",P.amber],
            ["Role",agentConfig?.role?.split(" ")[0]||"—",P.indigo],
            ["Status",isRec?"Recording":isProc?"Analysing":"Ready",isRec?P.red:isProc?P.amber:P.green]
          ].map(([l,v,c])=>(
            <div key={l} style={{background:P.card,border:`1px solid ${P.b1}`,borderRadius:10,padding:"12px"}}>
              <div style={{fontSize:8,color:P.muted,letterSpacing:1.5,textTransform:"uppercase",marginBottom:4}}>{l}</div>
              <div style={{fontSize:16,fontWeight:800,color:c,textTransform:"capitalize"}}>{v}</div>
            </div>
          ))}
        </div>
        {/* Answered questions list */}
        {combinedResults.length>0&&<>
          <div style={{fontSize:8,color:P.muted,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:8}}>Answered Questions</div>
          {combinedResults.map((cr,i)=>{
            const aiGrade=ss(so(cr.agentEval).grade,"?");
            const aiScore=sv(so(cr.agentEval?.scores).overall)||rnd(so(so(cr.mlResult).feedback).overall_score)||0;
            const gc2=gradeCol(aiGrade);
            return <div key={i} style={{background:P.card,border:`1px solid ${P.b1}`,borderRadius:10,
              padding:"11px 13px",marginBottom:8,position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",left:0,top:0,bottom:0,width:3,background:gc2}}/>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,paddingLeft:8}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:8,color:P.muted,fontFamily:"'DM Mono',monospace",marginBottom:3}}>Q{i+1}</div>
                  <div style={{fontSize:11,color:P.txt,lineHeight:1.4}}>{cr.question.substring(0,80)}…</div>
                </div>
                <div style={{textAlign:"center",flexShrink:0}}>
                  <div style={{fontSize:20,fontWeight:900,color:gc2,fontFamily:"'DM Mono',monospace"}}>{aiGrade}</div>
                  {aiScore>0&&<div style={{fontSize:9,color:gc2,fontFamily:"'DM Mono',monospace"}}>{aiScore}</div>}
                </div>
              </div>
            </div>;
          })}
        </>}
        {answered===0&&<div style={{textAlign:"center",color:P.muted,padding:"30px 20px",fontSize:11}}>
          Answer questions to see your progress
        </div>}
        {answered>0&&<button onClick={()=>generateReport(combinedResults)} style={{
          width:"100%",background:`linear-gradient(135deg,${P.v1},${P.v2})`,border:"none",
          color:"#fff",borderRadius:10,padding:"14px",fontSize:13,fontWeight:700,
          cursor:"pointer",fontFamily:"inherit",marginTop:8,
          boxShadow:`0 4px 20px ${P.v2}40`}}>
          📊 Generate Full Report ({answered}/{total})
        </button>}
      </div>}
    </div>
  );
}

/* ════════════ MAIN APP ══════════════════════════════════════════════════ */
export default function App(){
  const {isMobile,isTablet,isDesktop}=useBreakpoint();
  const [status,     setStatus]     = useState("idle");
  const [recTime,    setRecTime]    = useState(0);
  const [blob,       setBlob]       = useState(null);
  const [err,        setErr]        = useState("");
  const [backend,    setBackend]    = useState(null);
  const [analyser,   setAnalyser]   = useState(null);
  const [loadStep,   setLoad]       = useState("");
  const [liveEmo,    setLiveEmo]    = useState(null);
  const [frames,     setFrames]     = useState(0);
  const [camOk,      setCamOk]      = useState(false);

  // Agent session state
  const [agentConfig,    setAgentConfig]    = useState(null);   // {role,difficulty,numQuestions}
  const [currentQ,       setCurrentQ]       = useState("");     // current question text
  const [currentCtx,     setCurrentCtx]     = useState("");     // context hint
  const [qNumber,        setQNumber]        = useState(1);
  const [combinedResults,setCombinedResults]= useState([]);     // [{question,mlResult,agentEval}]
  const [latestResult,   setLatestResult]   = useState(null);   // result for current panel
  const [finalReport,    setFinalReport]    = useState(null);   // agent final report
  const [sessionDone,    setSessionDone]    = useState(false);

  const mrRef=useRef(null),chunksRef=useRef([]),streamRef=useRef(null);
  const timerRef=useRef(null),actxRef=useRef(null);
  const videoRef=useRef(null),camStreamRef=useRef(null);
  const frameTimerRef=useRef(null),canvasRef=useRef(null);

  useEffect(()=>{
    fetch(`${API}/health`).then(r=>r.json()).then(setBackend).catch(()=>setBackend(null));
  },[]);

  const sendFrame=useCallback(async()=>{
    if(!videoRef.current||!canvasRef.current) return;
    const cv=canvasRef.current,vd=videoRef.current;
    cv.width=320;cv.height=240;
    cv.getContext("2d").drawImage(vd,0,0,320,240);
    const b64=cv.toDataURL("image/jpeg",0.7).split(",")[1];
    const fd=new FormData();fd.append("frame",b64);fd.append("session_id",SID);
    try{const r=await fetch(`${API}/frame`,{method:"POST",body:fd});
      if(r.ok){const d=await r.json();setLiveEmo(d);setFrames(n=>n+1);}}catch{}
  },[]);

  const startRec=useCallback(async()=>{
    setErr("");setBlob(null);setLiveEmo(null);setFrames(0);setLatestResult(null);
    try{
      const ms=await navigator.mediaDevices.getUserMedia({audio:true});
      streamRef.current=ms;
      const actx=new AudioContext();actxRef.current=actx;
      const src=actx.createMediaStreamSource(ms);
      const an=actx.createAnalyser();an.fftSize=1024;src.connect(an);setAnalyser(an);
      chunksRef.current=[];
      const mr=new MediaRecorder(ms,{mimeType:"audio/webm;codecs=opus"});
      mr.ondataavailable=e=>{if(e.data.size>0)chunksRef.current.push(e.data);};
      mr.onstop=()=>setBlob(new Blob(chunksRef.current,{type:"audio/webm"}));
      mrRef.current=mr;mr.start(200);
      setStatus("recording");setRecTime(0);
      timerRef.current=setInterval(()=>setRecTime(t=>t+1),1000);
      try{
        const cs=await navigator.mediaDevices.getUserMedia({video:{width:1280,height:720}});
        camStreamRef.current=cs;
        if(videoRef.current){videoRef.current.srcObject=cs;videoRef.current.play();}
        setCamOk(true);frameTimerRef.current=setInterval(sendFrame,2500);
      }catch{setCamOk(false);}
    }catch{setErr("Microphone access denied.");}
  },[sendFrame]);

  const stopRec=useCallback(()=>{
    mrRef.current?.stop();streamRef.current?.getTracks().forEach(t=>t.stop());
    actxRef.current?.close();clearInterval(timerRef.current);setAnalyser(null);
    camStreamRef.current?.getTracks().forEach(t=>t.stop());
    clearInterval(frameTimerRef.current);setStatus("idle");
  },[]);

  const analyze=useCallback(async(blobToUse)=>{
    const useBlob=blobToUse||blob;
    if(!useBlob||!agentConfig) return;
    setStatus("processing");setErr("");
    const steps=["Converting audio…","Whisper STT…","Librosa analysis…","NLP processing…","DeepFace…","AI Evaluation…","Building report…"];
    let i=0;setLoad(steps[0]);
    const t=setInterval(()=>{i=Math.min(i+1,steps.length-1);setLoad(steps[i]);},2000);
    try{
      // Step 1: ML pipeline
      const fd=new FormData();
      fd.append("audio_file",useBlob,"recording.webm");
      fd.append("question",currentQ);
      fd.append("category",agentConfig.role);
      fd.append("session_id",SID);
      const mlRes=await fetch(`${API}/analyze`,{method:"POST",body:fd});
      if(!mlRes.ok) throw new Error((await mlRes.json()).detail||"ML analysis failed");
      const mlData=await mlRes.json();
      const transcript=mlData?.stt?.transcript||"";

      // Step 2: Agent evaluation (in parallel with ML was already started)
      setLoad("AI Evaluation…");
      const prevHistory=combinedResults.map(cr=>({
        question:cr.question,
        answer:ss(so(so(cr.mlResult).stt).transcript,""),
        overall:sv(so(cr.agentEval?.scores).overall)||sv(so(so(cr.mlResult).feedback).overall_score)||70
      }));
      const agentRes=await fetch(`${API}/agent/evaluate`,{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          role:agentConfig.role,
          difficulty:agentConfig.difficulty,
          question:currentQ,
          answer:transcript,
          question_number:qNumber,
          total_questions:agentConfig.numQuestions,
          conversation_history:prevHistory
        })
      });
      if(!agentRes.ok) throw new Error((await agentRes.json()).detail||"Agent evaluation failed");
      const agentData=await agentRes.json();

      // Combine results
      const combined={question:currentQ,mlResult:mlData,agentEval:agentData};
      const newResults=[...combinedResults,combined];
      setCombinedResults(newResults);
      setLatestResult(combined);
      setStatus("done");

      if(agentData.is_complete){
        // Generate final report
        setLoad("Generating final report…");
        const reportRes=await fetch(`${API}/agent/report`,{
          method:"POST",headers:{"Content-Type":"application/json"},
          body:JSON.stringify({
            role:agentConfig.role,
            difficulty:agentConfig.difficulty,
            conversation_history:newResults.map(cr=>({
              question:cr.question,
              answer:ss(so(so(cr.mlResult).stt).transcript,""),
              overall:sv(so(cr.agentEval?.scores).overall)||sv(so(so(cr.mlResult).feedback).overall_score)||70
            }))
          })
        });
        if(reportRes.ok){
          const reportData=await reportRes.json();
          setFinalReport(reportData);
          setTimeout(()=>setSessionDone(true),800);
        }
      } else {
        // Load next question
        if(agentData.next_question){
          setCurrentQ(agentData.next_question);
          setCurrentCtx(agentData.next_context||"");
          setQNumber(n=>n+1);
          setBlob(null);
        }
      }
    }catch(e){setErr(e.message);setStatus("error");}
    finally{clearInterval(t);setLoad("");}
  },[blob,currentQ,qNumber,agentConfig,combinedResults]);

  // Generate report from any set of results (for partial too)
  const generateReport=useCallback(async(results)=>{
    if(!results.length||!agentConfig) return;
    setLoad("Generating report…");
    try{
      const reportRes=await fetch(`${API}/agent/report`,{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          role:agentConfig.role,
          difficulty:agentConfig.difficulty,
          conversation_history:results.map(cr=>({
            question:cr.question,
            answer:ss(so(so(cr.mlResult).stt).transcript,""),
            overall:sv(so(cr.agentEval?.scores).overall)||sv(so(so(cr.mlResult).feedback).overall_score)||70
          }))
        })
      });
      if(reportRes.ok){
        const data=await reportRes.json();
        setFinalReport(data);
        setSessionDone(true);
      }
    }catch(e){setErr("Report failed: "+e.message);}
    finally{setLoad("");}
  },[agentConfig]);

  const fullReset=()=>{
    setStatus("idle");setBlob(null);setErr("");setRecTime(0);setLoad("");
    setLiveEmo(null);setFrames(0);setCamOk(false);setAgentConfig(null);
    setCurrentQ("");setCurrentCtx("");setQNumber(1);setCombinedResults([]);
    setLatestResult(null);setFinalReport(null);setSessionDone(false);
  };

  // Session done → show final report
  if(sessionDone&&finalReport){
    return <FinalReport agentReport={finalReport} combinedResults={combinedResults}
      role={agentConfig?.role||""} difficulty={agentConfig?.difficulty||""} onRestart={fullReset}/>;
  }

  // Setup screen
  if(!agentConfig){
    return <SetupScreen backend={backend} onStart={cfg=>{
      setAgentConfig(cfg);
      setCurrentQ(cfg.firstQuestion);
      setCurrentCtx(cfg.firstContext);
      setQNumber(1);
    }}/>;
  }

  const isRec=status==="recording",isProc=status==="processing",isDone=status==="done";
  const answered=combinedResults.length;
  const total=agentConfig.numQuestions;

  return(
    <div style={{height:"100vh",background:P.bg,color:P.txt,display:"flex",flexDirection:"column",
      fontFamily:"'Outfit','Segoe UI',system-ui,sans-serif",overflow:"hidden"}}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,
        background:`radial-gradient(ellipse 60% 40% at 15% 0%,${P.v1}18,transparent),radial-gradient(ellipse 40% 30% at 85% 100%,${P.v2}0e,transparent)`}}/>
      {!isMobile&&<div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,
        backgroundImage:`url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%231e1e32' stroke-width='0.5'%3E%3Cpath d='M40 0 L0 0 L0 40'/%3E%3C/g%3E%3C/svg%3E")`,
        backgroundSize:"40px 40px",opacity:0.5}}/>}

      {/* Header */}
      <header style={{position:"relative",zIndex:10,flexShrink:0,background:P.s1+"ee",
        borderBottom:`1px solid ${P.b1}`,padding:`0 ${isMobile?12:20}px`,display:"flex",
        alignItems:"center",justifyContent:"space-between",height:isMobile?48:52,backdropFilter:"blur(12px)"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <MockAILogo size={isMobile?26:30}/>
          <div>
            <div style={{fontSize:isMobile?12:14,fontWeight:800,color:P.white,letterSpacing:-0.3}}>
              MockAI{!isMobile&&<span style={{fontWeight:400,color:P.muted,fontSize:12}}> · {agentConfig.role}</span>}
            </div>
            {!isMobile&&<div style={{fontSize:7.5,color:P.muted,letterSpacing:1.5,textTransform:"uppercase",fontFamily:"'DM Mono',monospace"}}>
              {agentConfig.difficulty} · AI-Powered Interview
            </div>}
          </div>
        </div>
        {/* Progress dots */}
        <div style={{display:"flex",gap:4,alignItems:"center"}}>
          {Array.from({length:total}).map((_,i)=>{
            const done=i<answered;
            const cur=i===answered;
            const col=done?P.green:cur?P.v4:P.b2;
            return <div key={i} style={{width:cur?(isMobile?14:20):6,height:6,borderRadius:3,background:col,
              transition:"all .3s",boxShadow:cur?`0 0 8px ${P.v4}80`:"none"}}/>;
          })}
          <span style={{fontSize:9,color:P.muted,fontFamily:"'DM Mono',monospace",marginLeft:4}}>
            {answered}/{total}
          </span>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {!isMobile&&<div style={{display:"flex",alignItems:"center",gap:5,background:P.s2,
            border:`1px solid ${backend?P.v1+"50":P.red+"40"}`,borderRadius:99,padding:"4px 10px"}}>
            <Pip active={!!backend} color={backend?P.green:P.red}/>
            <span style={{fontSize:9.5,color:backend?P.green:P.red,fontWeight:600}}>
              {backend?"Online":"Offline"}
            </span>
          </div>}
          <button onClick={fullReset} style={{background:"transparent",border:`1px solid ${P.b2}`,
            color:P.muted,borderRadius:7,padding:isMobile?"5px 10px":"6px 14px",
            fontSize:isMobile?10:11,cursor:"pointer",fontFamily:"inherit"}}>
            ↺{isMobile?"":" Restart"}
          </button>
        </div>
      </header>

      {/* RESPONSIVE BODY */}
      {isMobile||isTablet
        /* ─── MOBILE / TABLET: tabbed single-column ─── */
        ? <MobileInterviewLayout
            isMobile={isMobile}
            status={status}
            isRec={isRec} isProc={isProc} isDone={isDone}
            answered={answered} total={total} qNumber={qNumber}
            currentQ={currentQ} currentCtx={currentCtx}
            combinedResults={combinedResults} latestResult={latestResult}
            loadStep={loadStep} recTime={recTime} frames={frames} camOk={camOk}
            liveEmo={liveEmo} blob={blob} err={err}
            videoRef={videoRef} canvasRef={canvasRef} analyser={analyser}
            startRec={startRec} stopRec={stopRec} analyze={analyze}
            generateReport={generateReport}
            setStatus={setStatus} setBlob={setBlob} setErr={setErr}
            setRecTime={setRecTime} setLoad={setLoad}
            agentConfig={agentConfig} fullReset={fullReset} backend={backend}
          />
        /* ─── DESKTOP: original 3-column ─── */
        : <div style={{position:"relative",zIndex:1,flex:1,display:"grid",
            gridTemplateColumns:"260px 1fr 360px",overflow:"hidden"}}>

            {/* LEFT: completed questions */}
            <aside style={{borderRight:`1px solid ${P.b1}`,display:"flex",flexDirection:"column",
              overflow:"hidden",background:P.s1+"88"}}>
              <div style={{padding:"12px 12px 8px",borderBottom:`1px solid ${P.b1}`,flexShrink:0}}>
                <div style={{fontSize:9,fontWeight:700,letterSpacing:2.5,textTransform:"uppercase",
                  color:P.muted,marginBottom:6,fontFamily:"'DM Mono',monospace",
                  display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span>Progress</span>
                  <span style={{color:P.v4}}>{answered}/{total} done</span>
                </div>
                <div style={{background:P.b1,borderRadius:99,height:4,overflow:"hidden"}}>
                  <div style={{width:`${(answered/total)*100}%`,height:"100%",
                    background:`linear-gradient(90deg,${P.v1},${P.v3})`,borderRadius:99,
                    transition:"width .5s cubic-bezier(.16,1,.3,1)"}}/>
                </div>
              </div>

              {/* Current question */}
              <div style={{padding:"10px 12px",borderBottom:`1px solid ${P.b1}`,flexShrink:0,
                background:P.vglow}}>
                <div style={{fontSize:8,color:P.v4,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:6,
                  display:"flex",justifyContent:"space-between"}}>
                  <span>Current — Q{qNumber}</span>
                  <span style={{color:P.muted}}>{agentConfig.difficulty}</span>
                </div>
                <div style={{fontSize:11,color:P.white,fontWeight:600,lineHeight:1.5,marginBottom:currentCtx?8:0}}>{currentQ}</div>
                {currentCtx&&<div style={{fontSize:10,color:P.v4,background:P.s2,borderRadius:7,
                  padding:"6px 9px",border:`1px solid ${P.b2}`,lineHeight:1.5}}>
                  💡 {currentCtx}
                </div>}
              </div>

              {/* Answered questions */}
              <div style={{flex:1,overflowY:"auto",padding:8,display:"flex",flexDirection:"column",gap:5}}>
                {combinedResults.length===0
                  ? <div style={{padding:"20px 10px",textAlign:"center",color:P.muted,fontSize:10,lineHeight:1.7}}>
                      Answer the current question to see it here
                    </div>
                  : combinedResults.map((cr,i)=>{
                      const aiGrade=ss(so(cr.agentEval).grade,"?");
                      const aiScore=sv(so(cr.agentEval?.scores).overall)||rnd(so(so(cr.mlResult).feedback).overall_score)||0;
                      const gc2=gradeCol(aiGrade);
                      return(
                        <div key={i} style={{background:P.card,border:`1px solid ${P.b1}`,
                          borderRadius:10,padding:"9px 11px",position:"relative",overflow:"hidden"}}>
                          <div style={{position:"absolute",left:0,top:0,bottom:0,width:3,background:gc2}}/>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:6,paddingLeft:7}}>
                            <div style={{flex:1}}>
                              <div style={{fontSize:8.5,color:P.muted,fontFamily:"'DM Mono',monospace",marginBottom:3}}>Q{i+1} ✓</div>
                              <div style={{fontSize:10,color:P.txt,lineHeight:1.4}}>{cr.question.substring(0,55)}…</div>
                            </div>
                            <div style={{textAlign:"center",flexShrink:0}}>
                              <div style={{fontSize:16,fontWeight:900,color:gc2,fontFamily:"'DM Mono',monospace"}}>{aiGrade}</div>
                              {aiScore>0&&<div style={{fontSize:8,color:gc2,fontFamily:"'DM Mono',monospace"}}>{aiScore}</div>}
                            </div>
                          </div>
                        </div>
                      );
                    })
                }
              </div>
              {answered>0&&<div style={{padding:"10px 12px",borderTop:`1px solid ${P.b1}`,flexShrink:0}}>
                <button onClick={()=>generateReport(combinedResults)} disabled={!!loadStep} style={{
                  width:"100%",background:loadStep?"transparent":P.vglow,border:`1px solid ${P.v2}40`,
                  color:loadStep?P.muted:P.v4,borderRadius:9,padding:"9px",fontSize:10,fontWeight:700,
                  cursor:loadStep?"not-allowed":"pointer",fontFamily:"inherit",
                  display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                  {loadStep
                    ? <><span style={{animation:"spin 1s linear infinite",display:"inline-block"}}>⟳</span> {loadStep}</>
                    : <>📊 View Report ({answered}/{total})</>
                  }
                </button>
              </div>}
            </aside>

            {/* CENTRE: webcam + waveform + controls */}
            <main style={{display:"flex",flexDirection:"column",overflow:"hidden",background:"#000"}}>
              {/* Question banner */}
              <div style={{flexShrink:0,padding:"8px 16px",background:P.s2+"ee",
                borderBottom:`1px solid ${P.b1}`,display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:3,height:28,borderRadius:99,flexShrink:0,
                  background:`linear-gradient(180deg,${P.v3},${P.v4}44)`}}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:8,color:P.muted,fontFamily:"'DM Mono',monospace",
                    letterSpacing:1.5,textTransform:"uppercase",marginBottom:3}}>
                    Question {qNumber} of {total} · {agentConfig.role}
                  </div>
                  <div style={{fontSize:12,fontWeight:700,color:P.white,lineHeight:1.4}}>{currentQ}</div>
                  {currentCtx&&<div style={{fontSize:10,color:P.v4,marginTop:3}}>💡 {currentCtx}</div>}
                </div>
                <div style={{background:P.v2+"18",border:`1px solid ${P.v2}40`,borderRadius:7,
                  padding:"5px 10px",textAlign:"center",flexShrink:0}}>
                  <div style={{fontSize:14,fontWeight:900,color:P.v4,fontFamily:"'DM Mono',monospace"}}>Q{qNumber}</div>
                  <div style={{fontSize:7.5,color:P.muted,letterSpacing:1}}>/{total}</div>
                </div>
              </div>
              {/* Webcam */}
              <div style={{flex:1,position:"relative",overflow:"hidden",background:"#000",minHeight:0}}>
                <video ref={videoRef} muted playsInline style={{width:"100%",height:"100%",objectFit:"cover",
                  display:"block",filter:isRec?"none":"brightness(0.12) saturate(0.2)",transition:"filter .6s ease"}}/>
                <canvas ref={canvasRef} style={{display:"none"}}/>
                {isRec&&<div style={{position:"absolute",inset:0,pointerEvents:"none",
                  background:`radial-gradient(ellipse at 50% 50%,transparent 55%,${P.v1}22 100%)`}}/>}
                {!isRec&&!isProc&&<div style={{position:"absolute",inset:0,display:"flex",
                  flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10}}>
                  <div style={{width:56,height:56,borderRadius:"50%",background:P.vglow,
                    border:`1px solid ${P.v2}40`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>📹</div>
                  <span style={{fontSize:11,color:P.muted}}>Camera activates on record</span>
                </div>}
                {isRec&&<div style={{position:"absolute",top:12,left:12,display:"flex",alignItems:"center",
                  gap:8,background:"rgba(7,7,13,0.8)",backdropFilter:"blur(8px)",
                  border:`1px solid ${P.b2}`,borderRadius:99,padding:"5px 12px"}}>
                  <span style={{width:7,height:7,borderRadius:"50%",background:P.red,display:"inline-block",animation:"pip 1s ease-in-out infinite"}}/>
                  <span style={{fontSize:12,fontWeight:700,color:P.white,fontFamily:"'DM Mono',monospace"}}>{fmt(recTime)}</span>
                  {camOk&&<span style={{fontSize:9,color:P.muted,fontFamily:"'DM Mono',monospace"}}>· {frames}f</span>}
                </div>}
                {isProc&&<div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",
                  alignItems:"center",justifyContent:"center",gap:14,
                  background:"rgba(7,7,13,0.9)",backdropFilter:"blur(4px)"}}>
                  <svg width="44" height="44" viewBox="0 0 44 44" style={{animation:"spin 1.2s linear infinite"}}>
                    <circle cx="22" cy="22" r="18" fill="none" stroke={P.b2} strokeWidth="3"/>
                    <circle cx="22" cy="22" r="18" fill="none" stroke={P.v3} strokeWidth="3" strokeDasharray="60 54" strokeLinecap="round"/>
                  </svg>
                  <div style={{textAlign:"center"}}>
                    <div style={{fontSize:13,fontWeight:700,color:P.white,marginBottom:5}}>Analysing Q{qNumber}…</div>
                    <div style={{fontSize:11,color:P.v4,fontFamily:"'DM Mono',monospace"}}>{loadStep}</div>
                  </div>
                </div>}
                {liveEmo&&isRec&&liveEmo.face_detected&&<div style={{position:"absolute",bottom:12,right:12,
                  background:"rgba(7,7,13,0.85)",backdropFilter:"blur(8px)",
                  border:`1px solid ${P.v2}50`,borderRadius:11,padding:"9px 13px",textAlign:"center",minWidth:84}}>
                  <div style={{fontSize:24,marginBottom:3}}>{emojiEmo(ss(liveEmo.dominant_emotion))}</div>
                  <div style={{fontSize:9.5,color:P.v4,fontWeight:700,textTransform:"capitalize"}}>{ss(liveEmo.dominant_emotion)}</div>
                </div>}
              </div>
              {/* Waveform */}
              <div style={{flexShrink:0,position:"relative",borderTop:`1px solid ${isRec?P.v2+"60":P.b1}`}}>
                <div style={{position:"absolute",top:5,left:10,zIndex:2,display:"flex",alignItems:"center",gap:6}}>
                  {isRec&&<Pip active color={P.v4}/>}
                  <span style={{fontSize:8,color:P.muted,fontFamily:"'DM Mono',monospace",letterSpacing:1.5,textTransform:"uppercase"}}>
                    {isRec?"live":isProc?loadStep:"ready"}
                  </span>
                </div>
                <Waveform analyser={analyser} active={isRec} height={84}/>
              </div>
              {/* Controls */}
              <div style={{flexShrink:0,padding:"10px 16px",background:P.s1+"f0",
                borderTop:`1px solid ${P.b1}`,display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                {status!=="recording"
                  ?<button onClick={startRec} disabled={isProc} style={{
                    background:isProc?"transparent":`linear-gradient(135deg,${P.v1},${P.v2})`,
                    border:isProc?`1px solid ${P.b2}`:"none",
                    color:isProc?P.muted:"#fff",borderRadius:9,padding:"8px 18px",
                    fontSize:11.5,fontWeight:700,cursor:isProc?"not-allowed":"pointer",
                    display:"flex",alignItems:"center",gap:7,boxShadow:isProc?"none":`0 4px 16px ${P.v2}40`,fontFamily:"inherit"}}>
                    <span style={{width:7,height:7,borderRadius:"50%",background:"rgba(255,255,255,0.8)",display:"inline-block"}}/>
                    Start Recording
                  </button>
                  :<button onClick={stopRec} style={{background:P.red+"18",border:`1px solid ${P.red}60`,
                    color:P.red,borderRadius:9,padding:"8px 18px",fontSize:11.5,fontWeight:700,cursor:"pointer",
                    display:"flex",alignItems:"center",gap:7,fontFamily:"inherit"}}>
                    <span style={{width:7,height:7,borderRadius:2,background:P.red,display:"inline-block"}}/>
                    Stop — {fmt(recTime)}
                  </button>}
                {blob&&!isRec&&!isProc&&<button onClick={()=>analyze()} style={{
                  background:P.vglow,border:`1px solid ${P.v2}60`,color:P.v4,
                  borderRadius:9,padding:"8px 18px",fontSize:11.5,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                  ⚡ Analyse Answer
                </button>}
                {blob&&!isRec&&!isProc&&<button onClick={()=>{setStatus("idle");setBlob(null);setErr("");setRecTime(0);setLoad("");}} style={{
                  background:"transparent",border:`1px solid ${P.b2}`,color:P.muted,
                  borderRadius:9,padding:"8px 12px",fontSize:10.5,cursor:"pointer",fontFamily:"inherit"}}>
                  ↺ Redo
                </button>}
                {err&&<span style={{fontSize:10.5,color:P.red,fontWeight:600}}>⚠ {err}</span>}
                {blob&&status==="idle"&&<span style={{fontSize:9.5,color:P.muted}}>
                  ✓ {(blob.size/1024).toFixed(1)} KB ready
                </span>}
              </div>
            </main>

            {/* RIGHT: live results panel */}
            <aside style={{borderLeft:`1px solid ${P.b1}`,display:"flex",flexDirection:"column",
              overflow:"hidden",background:P.s1+"88"}}>
              <div style={{padding:"10px 14px",borderBottom:`1px solid ${P.b1}`,flexShrink:0}}>
                <div style={{fontSize:9,fontWeight:700,letterSpacing:2.5,textTransform:"uppercase",
                  color:P.muted,fontFamily:"'DM Mono',monospace",display:"flex",justifyContent:"space-between"}}>
                  <span>Live Analysis</span>
                  {latestResult&&<span style={{color:P.green}}>Q{qNumber-1} complete</span>}
                </div>
              </div>
              {latestResult
                ? <CombinedResult result={latestResult} qNumber={qNumber-1}/>
                : <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",
                    justifyContent:"center",padding:24,gap:12,color:P.muted}}>
                    <div style={{fontSize:36}}>📊</div>
                    <div style={{fontSize:12,fontWeight:600,color:P.white,textAlign:"center"}}>Analysis appears here</div>
                    <div style={{fontSize:10,color:P.muted,textAlign:"center",lineHeight:1.7}}>
                      After each answer: voice pitch, pace, facial expressions, grammar, AI feedback
                    </div>
                  </div>
              }
            </aside>
          </div>
      }

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pip{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes recglow{0%,100%{opacity:0.5}50%{opacity:1}}
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:${P.bg}}
        ::-webkit-scrollbar-thumb{background:${P.b2};border-radius:3px}
        button{font-family:inherit;transition:opacity .15s,transform .1s}
        button:hover{opacity:.82}button:active{transform:scale(.97)}
      `}</style>
    </div>
  );
}