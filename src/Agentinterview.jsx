import { useState, useRef, useEffect, useCallback } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/* ── Palette (matches MockAI dark theme) ─────────────────────────────────── */
const P = {
  bg:"#07070d", s1:"#0c0c16", s2:"#10101c", card:"#131320",
  b1:"#1e1e32", b2:"#2a2a42",
  v1:"#5b21b6", v2:"#7c3aed", v3:"#8b5cf6", v4:"#a78bfa",
  vglow:"#7c3aed14",
  txt:"#c8c4e0", muted:"#524e6a", white:"#edeaff",
  green:"#34d399", red:"#f87171", amber:"#fbbf24",
  indigo:"#818cf8", rose:"#c084b8", orange:"#fb923c",
  cyan:"#22d3ee",
};

const sv  = (v,f=0)  => v!=null&&!isNaN(+v)?+v:f;
const ss  = (v,f="") => v!=null?String(v):f;
const sa  = v        => Array.isArray(v)?v:[];
const so  = v        => v&&typeof v==="object"&&!Array.isArray(v)?v:{};
const rnd = v        => Math.round(sv(v));
const clamp = (v,lo,hi) => Math.max(lo,Math.min(hi,v));
const gradeCol = g => ({"A+":P.green,"A":P.green,"B":P.v4,"C":P.amber,"D":P.orange,"F":P.red})[g]||P.muted;
const scoreCol = s => s>=75?P.green:s>=50?P.amber:P.red;
const fmt = s => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

const ROLES = [
  {id:"Machine Learning Engineer",  icon:"🤖", color:P.v4},
  {id:"Data Scientist",             icon:"📊", color:P.indigo},
  {id:"Software Engineer",          icon:"💻", color:P.cyan},
  {id:"Data Engineer",              icon:"🔧", color:P.amber},
  {id:"AI/ML Researcher",           icon:"🔬", color:P.rose},
  {id:"Frontend Developer",         icon:"🎨", color:P.green},
  {id:"Backend Developer",          icon:"⚙️", color:P.orange},
  {id:"Full Stack Developer",       icon:"🌐", color:P.v3},
  {id:"DevOps Engineer",            icon:"🚀", color:P.cyan},
  {id:"Product Manager",            icon:"📋", color:P.amber},
];

/* ── Waveform ─────────────────────────────────────────────────────────────── */
function Waveform({analyser,active}){
  const ref=useRef(null),raf=useRef(null);
  useEffect(()=>{
    const cv=ref.current; if(!cv) return;
    const ctx=cv.getContext("2d"),W=cv.width,H=cv.height;
    const bg=()=>{
      ctx.fillStyle=P.s1;ctx.fillRect(0,0,W,H);
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
      ctx.strokeStyle=P.v4;ctx.lineWidth=2;
      for(let i=0;i<data.length;i++){const x=i*s,y=(data[i]/255)*H;i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);}
      ctx.stroke();ctx.shadowBlur=0;
    };
    draw();return()=>cancelAnimationFrame(raf.current);
  },[active,analyser]);
  return <canvas ref={ref} width={800} height={70}
    style={{width:"100%",height:70,display:"block",background:P.s1,borderRadius:8}}/>;
}

/* ── Score bar ────────────────────────────────────────────────────────────── */
function ScoreBar({label,value,color}){
  const col=color||scoreCol(value);
  return <div style={{marginBottom:8}}>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
      <span style={{fontSize:10.5,color:P.txt}}>{label}</span>
      <span style={{fontSize:10,color:col,fontWeight:700,fontFamily:"'DM Mono',monospace"}}>{value}/100</span>
    </div>
    <div style={{background:P.b1,borderRadius:99,height:5,overflow:"hidden"}}>
      <div style={{width:`${clamp(value,0,100)}%`,height:"100%",
        background:`linear-gradient(90deg,${col}80,${col})`,borderRadius:99,
        transition:"width 1.2s cubic-bezier(.16,1,.3,1)"}}/>
    </div>
  </div>;
}

/* ── Hiring badge ─────────────────────────────────────────────────────────── */
function HiringBadge({likelihood}){
  const cfg={
    "Strong Yes":{color:P.green, bg:P.green+"18", icon:"✓✓"},
    "Yes":       {color:P.green, bg:P.green+"12", icon:"✓"},
    "Maybe":     {color:P.amber, bg:P.amber+"12", icon:"~"},
    "No":        {color:P.red,   bg:P.red+"12",   icon:"✗"},
  }[likelihood]||{color:P.muted,bg:P.b1,icon:"?"};
  return <div style={{display:"inline-flex",alignItems:"center",gap:8,
    background:cfg.bg,border:`1px solid ${cfg.color}40`,borderRadius:10,padding:"10px 18px"}}>
    <span style={{fontSize:20,fontWeight:900,color:cfg.color,fontFamily:"'DM Mono',monospace"}}>{cfg.icon}</span>
    <div>
      <div style={{fontSize:8,color:P.muted,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace"}}>Hiring Likelihood</div>
      <div style={{fontSize:16,fontWeight:800,color:cfg.color}}>{likelihood}</div>
    </div>
  </div>;
}

/* ════════════ SETUP SCREEN ══════════════════════════════════════════════════ */
function SetupScreen({onStart}){
  const [role, setRole]   = useState("");
  const [diff, setDiff]   = useState("medium");
  const [numQ, setNumQ]   = useState(5);
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    if(!role) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/agent/start`, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({role, difficulty:diff, num_questions:numQ})
      });
      if(!res.ok) throw new Error("Failed to start");
      const data = await res.json();
      onStart({role, difficulty:diff, numQuestions:numQ, firstQuestion:data.question, firstContext:data.context});
    } catch(e){
      alert("Failed to start agent: "+e.message);
    } finally { setLoading(false); }
  };

  return (
    <div style={{minHeight:"100vh",background:P.bg,display:"flex",alignItems:"center",justifyContent:"center",
      fontFamily:"'Outfit','Segoe UI',system-ui,sans-serif",padding:24}}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>
      <div style={{position:"fixed",inset:0,pointerEvents:"none",
        background:`radial-gradient(ellipse 60% 40% at 20% 10%,${P.v1}20,transparent),radial-gradient(ellipse 40% 30% at 80% 90%,${P.v2}10,transparent)`}}/>

      <div style={{position:"relative",zIndex:1,width:"100%",maxWidth:800}}>
        {/* Header */}
        <div style={{textAlign:"center",marginBottom:40}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:8,background:P.v2+"18",
            border:`1px solid ${P.v2}40`,borderRadius:99,padding:"6px 16px",marginBottom:20}}>
            <span style={{fontSize:14}}>🤖</span>
            <span style={{fontSize:10,color:P.v4,fontWeight:700,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace"}}>
              AI Interview Agent
            </span>
          </div>
          <div style={{fontSize:38,fontWeight:900,color:P.white,letterSpacing:-1.5,lineHeight:1.1,marginBottom:10}}>
            Practice with an AI
            <span style={{background:`linear-gradient(90deg,${P.v3},${P.rose})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",display:"block"}}>
              Interview Coach
            </span>
          </div>
          <div style={{fontSize:13,color:P.muted,maxWidth:500,margin:"0 auto",lineHeight:1.7}}>
            Powered by Claude AI — asks dynamic questions, evaluates your answers in real-time, and gives detailed coaching feedback.
          </div>
        </div>

        {/* Role Picker */}
        <div style={{background:P.card,border:`1px solid ${P.b1}`,borderRadius:16,padding:24,marginBottom:16}}>
          <div style={{fontSize:11,color:P.muted,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:14}}>
            Step 1 — Choose Your Role
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8}}>
            {ROLES.map(r=>(
              <div key={r.id} onClick={()=>setRole(r.id)} style={{
                background:role===r.id?r.color+"18":P.s2,
                border:`1px solid ${role===r.id?r.color+"60":P.b1}`,
                borderRadius:10,padding:"12px 8px",cursor:"pointer",textAlign:"center",
                transition:"all .2s",position:"relative",overflow:"hidden"}}>
                {role===r.id&&<div style={{position:"absolute",top:0,left:0,right:0,height:2,background:r.color}}/>}
                <div style={{fontSize:20,marginBottom:5}}>{r.icon}</div>
                <div style={{fontSize:9.5,color:role===r.id?r.color:P.muted,fontWeight:role===r.id?700:400,
                  lineHeight:1.3,textAlign:"center"}}>{r.id}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Config */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:24}}>
          {/* Difficulty */}
          <div style={{background:P.card,border:`1px solid ${P.b1}`,borderRadius:16,padding:20}}>
            <div style={{fontSize:11,color:P.muted,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:12}}>
              Step 2 — Difficulty
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {[["easy","🟢","Beginner","Fundamental concepts"],
                ["medium","🟡","Intermediate","Practical knowledge"],
                ["hard","🔴","Advanced","Deep expertise"]].map(([id,dot,label,desc])=>(
                <div key={id} onClick={()=>setDiff(id)} style={{
                  display:"flex",alignItems:"center",gap:12,padding:"10px 14px",
                  background:diff===id?P.vglow:P.s2,border:`1px solid ${diff===id?P.v2+"60":P.b1}`,
                  borderRadius:9,cursor:"pointer",transition:"all .2s"}}>
                  <span style={{fontSize:14}}>{dot}</span>
                  <div>
                    <div style={{fontSize:11,color:diff===id?P.white:P.txt,fontWeight:diff===id?700:400}}>{label}</div>
                    <div style={{fontSize:9.5,color:P.muted}}>{desc}</div>
                  </div>
                  {diff===id&&<div style={{marginLeft:"auto",width:6,height:6,borderRadius:"50%",background:P.v4}}/>}
                </div>
              ))}
            </div>
          </div>

          {/* Num questions */}
          <div style={{background:P.card,border:`1px solid ${P.b1}`,borderRadius:16,padding:20}}>
            <div style={{fontSize:11,color:P.muted,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:12}}>
              Step 3 — Number of Questions
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {[[3,"Quick Practice","~10 minutes"],[5,"Standard Session","~20 minutes"],[8,"Full Interview","~35 minutes"],[10,"Deep Dive","~45 minutes"]].map(([n,label,time])=>(
                <div key={n} onClick={()=>setNumQ(n)} style={{
                  display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",
                  background:numQ===n?P.vglow:P.s2,border:`1px solid ${numQ===n?P.v2+"60":P.b1}`,
                  borderRadius:9,cursor:"pointer",transition:"all .2s"}}>
                  <div>
                    <span style={{fontSize:20,fontWeight:900,color:numQ===n?P.v4:P.muted,fontFamily:"'DM Mono',monospace",marginRight:10}}>{n}</span>
                    <span style={{fontSize:11,color:numQ===n?P.white:P.txt,fontWeight:numQ===n?600:400}}>{label}</span>
                  </div>
                  <span style={{fontSize:9.5,color:P.muted}}>{time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Start Button */}
        <button onClick={handleStart} disabled={!role||loading} style={{
          width:"100%",padding:"18px",borderRadius:14,border:"none",cursor:role?"pointer":"not-allowed",
          background:role?`linear-gradient(135deg,${P.v1},${P.v2})`:"#1e1e32",
          color:role?"#fff":P.muted,fontSize:15,fontWeight:800,fontFamily:"inherit",
          boxShadow:role?`0 8px 32px ${P.v2}40`:"none",transition:"all .3s",
          display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
          {loading
            ? <><span style={{animation:"spin 1s linear infinite",display:"inline-block"}}>⟳</span> Starting Agent...</>
            : <><span style={{fontSize:18}}>🤖</span> Start AI Interview{role?` — ${role}`:""}</>
          }
        </button>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/* ════════════ QUESTION CARD ══════════════════════════════════════════════════ */
function QuestionCard({question,context,number,total,role}){
  return (
    <div style={{background:P.card,border:`1px solid ${P.v2}40`,borderRadius:16,padding:22,
      position:"relative",overflow:"hidden",marginBottom:16}}>
      <div style={{position:"absolute",inset:0,background:`radial-gradient(ellipse at 0% 50%,${P.v2}08,transparent 60%)`,pointerEvents:"none"}}/>
      <div style={{position:"absolute",top:0,left:0,right:0,height:2,
        background:`linear-gradient(90deg,${P.v2},${P.v4}50,transparent)`}}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,position:"relative",zIndex:1}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{background:P.v2,borderRadius:7,padding:"4px 10px",fontSize:10,fontWeight:800,
            color:"#fff",fontFamily:"'DM Mono',monospace"}}>Q{number}</div>
          <span style={{fontSize:9,color:P.muted,letterSpacing:1.5,textTransform:"uppercase",fontFamily:"'DM Mono',monospace"}}>{role}</span>
        </div>
        <span style={{fontSize:9,color:P.muted,fontFamily:"'DM Mono',monospace"}}>{number} of {total}</span>
      </div>
      <div style={{fontSize:16,fontWeight:700,color:P.white,lineHeight:1.6,marginBottom:context?10:0,position:"relative",zIndex:1}}>
        {question}
      </div>
      {context&&<div style={{fontSize:11,color:P.v4,background:P.vglow,borderRadius:8,padding:"8px 12px",
        border:`1px solid ${P.v2}30`,lineHeight:1.6,position:"relative",zIndex:1}}>
        💡 {context}
      </div>}
    </div>
  );
}

/* ════════════ EVALUATION CARD ═══════════════════════════════════════════════ */
function EvaluationCard({evaluation,question,answer,number}){
  const {scores,grade,verdict,what_was_good,what_was_missing,ideal_answer_hints,follow_up_tip}=evaluation;
  const gc=gradeCol(grade);
  return (
    <div style={{background:P.card,border:`1px solid ${gc}30`,borderRadius:16,overflow:"hidden",marginBottom:12}}>
      <div style={{position:"absolute" /* relative parent needed */}}/>
      {/* Header */}
      <div style={{background:P.s2,padding:"14px 18px",borderBottom:`1px solid ${P.b1}`,
        display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{fontSize:36,fontWeight:900,color:gc,fontFamily:"'DM Mono',monospace",lineHeight:1}}>{grade}</div>
          <div>
            <div style={{fontSize:10,color:P.muted,letterSpacing:1.5,textTransform:"uppercase",fontFamily:"'DM Mono',monospace"}}>Q{number} Score</div>
            <div style={{fontSize:20,fontWeight:900,color:gc,fontFamily:"'DM Mono',monospace"}}>{scores.overall}<span style={{fontSize:10,color:P.muted,fontWeight:400}}>/100</span></div>
          </div>
        </div>
        <div style={{fontSize:12,color:P.txt,lineHeight:1.5,maxWidth:400,textAlign:"right"}}>{verdict}</div>
      </div>

      <div style={{padding:18}}>
        {/* Score breakdown */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
          <div style={{background:P.s2,borderRadius:10,padding:12}}>
            <div style={{fontSize:8,color:P.muted,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:10}}>Score Breakdown</div>
            <ScoreBar label="Technical Accuracy"    value={scores.technical_accuracy}/>
            <ScoreBar label="Completeness"          value={scores.completeness}/>
            <ScoreBar label="Clarity"               value={scores.clarity}/>
            <ScoreBar label="Depth"                 value={scores.depth}/>
            <ScoreBar label="Real-World Application" value={scores.real_world_application}/>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {/* What was good */}
            <div style={{background:P.green+"0a",border:`1px solid ${P.green}20`,borderRadius:10,padding:12,flex:1}}>
              <div style={{fontSize:8,color:P.green,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:8}}>What Was Good</div>
              {sa(what_was_good).map((s,i)=>(
                <div key={i} style={{display:"flex",gap:7,marginBottom:5}}>
                  <span style={{color:P.green,fontSize:10,flexShrink:0,marginTop:1}}>✓</span>
                  <span style={{fontSize:10.5,color:P.txt,lineHeight:1.6}}>{s}</span>
                </div>
              ))}
            </div>
            {/* What was missing */}
            <div style={{background:P.red+"0a",border:`1px solid ${P.red}20`,borderRadius:10,padding:12,flex:1}}>
              <div style={{fontSize:8,color:P.red,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:8}}>What Was Missing</div>
              {sa(what_was_missing).map((s,i)=>(
                <div key={i} style={{display:"flex",gap:7,marginBottom:5}}>
                  <span style={{color:P.red,fontSize:10,flexShrink:0,marginTop:1}}>→</span>
                  <span style={{fontSize:10.5,color:P.txt,lineHeight:1.6}}>{s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Ideal answer hints */}
        {sa(ideal_answer_hints).length>0&&(
          <div style={{background:P.vglow,border:`1px solid ${P.v2}30`,borderRadius:10,padding:12,marginBottom:10}}>
            <div style={{fontSize:8,color:P.v4,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:8}}>Key Points to Include</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
              {sa(ideal_answer_hints).map((h,i)=>(
                <div key={i} style={{display:"flex",gap:7,background:P.s2,borderRadius:7,padding:"7px 9px"}}>
                  <span style={{color:P.v4,fontSize:9,fontFamily:"'DM Mono',monospace",fontWeight:700,flexShrink:0}}>{String(i+1).padStart(2,"0")}</span>
                  <span style={{fontSize:10.5,color:P.txt,lineHeight:1.6}}>{h}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Coaching tip */}
        {follow_up_tip&&(
          <div style={{background:P.amber+"0a",border:`1px solid ${P.amber}25`,borderRadius:9,padding:"9px 12px",
            display:"flex",gap:9}}>
            <span style={{fontSize:13,flexShrink:0}}>💡</span>
            <span style={{fontSize:10.5,color:P.txt,lineHeight:1.7}}><strong style={{color:P.amber}}>Tip:</strong> {follow_up_tip}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════ FINAL REPORT ══════════════════════════════════════════════════ */
function FinalReport({report,history,role,difficulty,onRestart}){
  const gc=gradeCol(report.overall_grade);
  const catColors=[P.v4,P.green,P.indigo,P.amber,P.rose];
  return (
    <div style={{minHeight:"100vh",background:P.bg,color:P.txt,
      fontFamily:"'Outfit','Segoe UI',system-ui,sans-serif",padding:24}}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>
      <div style={{position:"fixed",inset:0,pointerEvents:"none",
        background:`radial-gradient(ellipse 60% 40% at 15% 0%,${P.v1}18,transparent),radial-gradient(ellipse 40% 30% at 85% 100%,${P.v2}0e,transparent)`}}/>

      <div style={{position:"relative",zIndex:1,maxWidth:1000,margin:"0 auto"}}>
        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24,
          background:P.s1+"ee",border:`1px solid ${P.b1}`,borderRadius:14,padding:"14px 20px",backdropFilter:"blur(12px)"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:36,height:36,borderRadius:10,background:`linear-gradient(135deg,${P.v1},${P.v2})`,
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🤖</div>
            <div>
              <div style={{fontSize:16,fontWeight:800,color:P.white}}>AI Interview Complete</div>
              <div style={{fontSize:9,color:P.muted,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace"}}>
                {role} · {difficulty} difficulty · {history.length} questions
              </div>
            </div>
          </div>
          <button onClick={onRestart} style={{background:P.vglow,border:`1px solid ${P.v2}50`,
            color:P.v4,borderRadius:10,padding:"9px 18px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
            ↺ New Interview
          </button>
        </div>

        {/* Grade Hero */}
        <div style={{background:P.card,border:`1px solid ${gc}35`,borderRadius:16,padding:24,marginBottom:16,
          display:"grid",gridTemplateColumns:"auto 1fr auto",gap:20,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",inset:0,background:`radial-gradient(ellipse at 0% 50%,${gc}0d,transparent 60%)`,pointerEvents:"none"}}/>
          <div style={{textAlign:"center",zIndex:1}}>
            <div style={{fontSize:72,fontWeight:900,fontFamily:"'DM Mono',monospace",color:gc,lineHeight:1,letterSpacing:-3}}>{report.overall_grade}</div>
            <div style={{fontSize:28,fontWeight:900,color:gc,fontFamily:"'DM Mono',monospace",marginTop:4}}>
              {report.overall_score}<span style={{fontSize:13,color:P.muted,fontWeight:400}}>/100</span>
            </div>
          </div>
          <div style={{zIndex:1}}>
            <div style={{fontSize:14,fontWeight:700,color:P.white,lineHeight:1.6,marginBottom:10}}>{report.session_verdict}</div>
            <HiringBadge likelihood={report.hiring_likelihood}/>
            <div style={{fontSize:11,color:P.muted,marginTop:8,lineHeight:1.6}}>{report.hiring_reason}</div>
          </div>
          {/* Category scores */}
          <div style={{zIndex:1,minWidth:180}}>
            {Object.entries(so(report.category_scores)).map(([cat,score],i)=>(
              <div key={cat} style={{marginBottom:8}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                  <span style={{fontSize:9.5,color:P.muted}}>{cat}</span>
                  <span style={{fontSize:9.5,color:catColors[i%5],fontFamily:"'DM Mono',monospace",fontWeight:700}}>{score}</span>
                </div>
                <div style={{background:P.b1,borderRadius:99,height:4,overflow:"hidden"}}>
                  <div style={{width:`${clamp(sv(score),0,100)}%`,height:"100%",background:catColors[i%5],borderRadius:99}}/>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
          {/* Strengths */}
          <div style={{background:P.card,border:`1px solid ${P.green}25`,borderRadius:14,padding:18}}>
            <div style={{fontSize:9,color:P.green,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:12}}>Top Strengths</div>
            {sa(report.top_strengths).map((s,i)=>(
              <div key={i} style={{display:"flex",gap:9,padding:"8px 10px",background:P.green+"0a",borderRadius:8,border:`1px solid ${P.green}20`,marginBottom:7}}>
                <span style={{color:P.green,fontSize:11,flexShrink:0,fontWeight:800}}>✓</span>
                <span style={{fontSize:11,color:P.txt,lineHeight:1.6}}>{s}</span>
              </div>
            ))}
          </div>
          {/* Critical gaps */}
          <div style={{background:P.card,border:`1px solid ${P.red}25`,borderRadius:14,padding:18}}>
            <div style={{fontSize:9,color:P.red,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:12}}>Critical Gaps</div>
            {sa(report.critical_gaps).map((s,i)=>(
              <div key={i} style={{display:"flex",gap:9,padding:"8px 10px",background:P.red+"0a",borderRadius:8,border:`1px solid ${P.red}20`,marginBottom:7}}>
                <span style={{color:P.red,fontSize:11,flexShrink:0,fontWeight:800}}>!</span>
                <span style={{fontSize:11,color:P.txt,lineHeight:1.6}}>{s}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Learning roadmap */}
        <div style={{background:P.card,border:`1px solid ${P.v2}30`,borderRadius:14,padding:18,marginBottom:16}}>
          <div style={{fontSize:9,color:P.v4,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:14}}>Learning Roadmap — Study These Next</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {sa(report.learning_roadmap).map((item,i)=>(
              <div key={i} style={{display:"flex",gap:10,background:P.vglow,borderRadius:9,padding:"10px 12px",border:`1px solid ${P.b2}`}}>
                <span style={{color:P.v4,fontFamily:"'DM Mono',monospace",fontSize:11,fontWeight:800,flexShrink:0,minWidth:22}}>{String(i+1).padStart(2,"0")}</span>
                <span style={{fontSize:11,color:P.txt,lineHeight:1.6}}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Q&A Review */}
        <div style={{background:P.card,border:`1px solid ${P.b1}`,borderRadius:14,padding:18}}>
          <div style={{fontSize:9,color:P.muted,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:14}}>
            Full Q&A Review — {history.length} Questions
          </div>
          {history.map((item,i)=>(
            <div key={i} style={{borderBottom:`1px solid ${P.b1}`,paddingBottom:14,marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                <div style={{display:"flex",gap:8,alignItems:"center",flex:1}}>
                  <span style={{background:P.v2,borderRadius:5,padding:"2px 8px",fontSize:9,fontWeight:800,
                    color:"#fff",fontFamily:"'DM Mono',monospace",flexShrink:0}}>Q{i+1}</span>
                  <span style={{fontSize:12,color:P.white,fontWeight:600,lineHeight:1.5}}>{item.question}</span>
                </div>
                {item.evaluation&&(
                  <div style={{display:"flex",gap:6,alignItems:"center",flexShrink:0,marginLeft:12}}>
                    <span style={{fontSize:18,fontWeight:900,color:gradeCol(item.evaluation.grade),fontFamily:"'DM Mono',monospace"}}>{item.evaluation.grade}</span>
                    <span style={{fontSize:11,color:gradeCol(item.evaluation.grade),fontFamily:"'DM Mono',monospace"}}>{item.evaluation.scores?.overall}/100</span>
                  </div>
                )}
              </div>
              <div style={{fontSize:10.5,color:P.v4,background:P.s1,borderRadius:8,padding:"9px 12px",
                fontStyle:"italic",lineHeight:1.8,border:`1px solid ${P.b1}`}}>
                {item.answer||"No answer recorded"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ════════════ MAIN AGENT INTERVIEW SCREEN ═══════════════════════════════════ */
function AgentInterviewScreen({config, onRestart}){
  const {role, difficulty, numQuestions, firstQuestion, firstContext} = config;

  const [currentQ,   setCurrentQ]   = useState(firstQuestion);
  const [currentCtx, setCurrentCtx] = useState(firstContext);
  const [qNumber,    setQNumber]    = useState(1);
  const [history,    setHistory]    = useState([]);
  const [status,     setStatus]     = useState("idle"); // idle|recording|processing|evaluated|done
  const [blob,       setBlob]       = useState(null);
  const [transcript, setTranscript] = useState("");
  const [evaluation, setEvaluation] = useState(null);
  const [recTime,    setRecTime]    = useState(0);
  const [analyser,   setAnalyser]   = useState(null);
  const [loadMsg,    setLoadMsg]    = useState("");
  const [finalReport,setFinalReport]= useState(null);
  const [err,        setErr]        = useState("");

  const mrRef=useRef(null),chunksRef=useRef([]),streamRef=useRef(null);
  const timerRef=useRef(null),actxRef=useRef(null);
  const bottomRef=useRef(null);

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); },[history,status]);

  const isRec = status==="recording";
  const isProc = status==="processing";

  const startRec = useCallback(async()=>{
    setErr("");setBlob(null);setTranscript("");setEvaluation(null);
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
    }catch{setErr("Microphone access denied.");}
  },[]);

  const stopRec = useCallback(()=>{
    mrRef.current?.stop();
    streamRef.current?.getTracks().forEach(t=>t.stop());
    actxRef.current?.close();
    clearInterval(timerRef.current);
    setAnalyser(null);
    setStatus("idle");
  },[]);

  const submitAnswer = useCallback(async(blobToUse)=>{
    if(!blobToUse) return;
    setStatus("processing");setErr("");
    const steps=["Transcribing your answer…","Analyzing content…","Evaluating with AI…","Generating feedback…"];
    let si=0;setLoadMsg(steps[0]);
    const t=setInterval(()=>{si=Math.min(si+1,steps.length-1);setLoadMsg(steps[si]);},2500);
    try{
      // Step 1: STT via existing backend
      const fd=new FormData();
      fd.append("audio_file",blobToUse,"recording.webm");
      fd.append("question",currentQ);
      fd.append("category","Agent Interview");
      fd.append("session_id",`agent_${Date.now()}`);
      const analyzeRes=await fetch(`${API}/analyze`,{method:"POST",body:fd});
      if(!analyzeRes.ok) throw new Error("Transcription failed");
      const analyzeData=await analyzeRes.json();
      const transcriptText=analyzeData?.stt?.transcript||"";
      setTranscript(transcriptText);

      // Step 2: Agent evaluation
      const convHistory=history.map(h=>({
        question:h.question,
        answer:h.answer,
        overall:h.evaluation?.scores?.overall||60
      }));
      const evalRes=await fetch(`${API}/agent/evaluate`,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          role, difficulty,
          question:currentQ,
          answer:transcriptText,
          question_number:qNumber,
          total_questions:numQuestions,
          conversation_history:convHistory
        })
      });
      if(!evalRes.ok) throw new Error("Evaluation failed");
      const evalData=await evalRes.json();
      setEvaluation(evalData);

      const newHistory=[...history,{
        question:currentQ,
        answer:transcriptText,
        evaluation:evalData,
        qNumber
      }];
      setHistory(newHistory);

      if(evalData.is_complete){
        // Generate final report
        setLoadMsg("Generating final report…");
        const reportRes=await fetch(`${API}/agent/report`,{
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify({
            role,difficulty,
            conversation_history:newHistory.map(h=>({
              question:h.question,
              answer:h.answer,
              overall:h.evaluation?.scores?.overall||60
            }))
          })
        });
        if(reportRes.ok){
          const reportData=await reportRes.json();
          setFinalReport(reportData);
          setStatus("done");
        }
      } else {
        setCurrentQ(evalData.next_question||"");
        setCurrentCtx(evalData.next_context||"");
        setQNumber(n=>n+1);
        setStatus("evaluated");
      }
    }catch(e){
      setErr(e.message);
      setStatus("idle");
    }finally{
      clearInterval(t);setLoadMsg("");
    }
  },[currentQ,qNumber,numQuestions,history,role,difficulty]);

  // Auto-submit when blob is ready
  useEffect(()=>{
    if(blob&&status==="idle") submitAnswer(blob);
  },[blob]);

  const handleStop = ()=>{
    stopRec();
    // blob will be set via onstop → triggers useEffect
  };

  if(finalReport){
    return <FinalReport report={finalReport} history={history} role={role} difficulty={difficulty} onRestart={onRestart}/>;
  }

  return (
    <div style={{height:"100vh",background:P.bg,color:P.txt,display:"flex",flexDirection:"column",
      fontFamily:"'Outfit','Segoe UI',system-ui,sans-serif",overflow:"hidden"}}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>
      <div style={{position:"fixed",inset:0,pointerEvents:"none",
        background:`radial-gradient(ellipse 60% 40% at 15% 0%,${P.v1}18,transparent)`}}/>

      {/* Header */}
      <header style={{position:"relative",zIndex:10,background:P.s1+"ee",
        borderBottom:`1px solid ${P.b1}`,padding:"0 20px",
        display:"flex",alignItems:"center",justifyContent:"space-between",height:52,
        backdropFilter:"blur(12px)",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:30,height:30,borderRadius:8,background:`linear-gradient(135deg,${P.v1},${P.v2})`,
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>🤖</div>
          <div>
            <div style={{fontSize:14,fontWeight:800,color:P.white}}>AI Interview Agent</div>
            <div style={{fontSize:8,color:P.muted,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace"}}>{role} · {difficulty}</div>
          </div>
        </div>
        {/* Progress dots */}
        <div style={{display:"flex",gap:5,alignItems:"center"}}>
          {Array.from({length:numQuestions}).map((_,i)=>{
            const done=i<history.length;
            const cur=i===history.length;
            const col=done?(history[i]?.evaluation?.scores?.overall>=75?P.green:P.amber):cur?P.v4:P.b2;
            return <div key={i} style={{width:cur?24:8,height:8,borderRadius:4,background:col,
              transition:"all .3s",boxShadow:cur?`0 0 10px ${P.v4}80`:"none"}}/>;
          })}
          <span style={{fontSize:9,color:P.muted,fontFamily:"'DM Mono',monospace",marginLeft:6}}>
            {history.length}/{numQuestions}
          </span>
        </div>
        <button onClick={onRestart} style={{background:"transparent",border:`1px solid ${P.b2}`,
          color:P.muted,borderRadius:8,padding:"6px 14px",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>
          ↺ Restart
        </button>
      </header>

      {/* Main content */}
      <div style={{flex:1,overflowY:"auto",padding:20,position:"relative",zIndex:1}}>
        {/* Past Q&A */}
        {history.map((item,i)=>(
          <div key={i} style={{marginBottom:16}}>
            <QuestionCard question={item.question} number={item.qNumber} total={numQuestions} role={role}/>
            {/* Transcript */}
            <div style={{background:P.s1,border:`1px solid ${P.b1}`,borderRadius:10,padding:"10px 14px",marginBottom:10}}>
              <div style={{fontSize:8,color:P.muted,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:6}}>Your Answer</div>
              <div style={{fontSize:11,color:P.v4,lineHeight:1.8,fontStyle:"italic"}}>{item.answer||"No answer recorded"}</div>
            </div>
            {item.evaluation&&<EvaluationCard evaluation={item.evaluation} question={item.question} answer={item.answer} number={item.qNumber}/>}
          </div>
        ))}

        {/* Current question */}
        {status!=="done"&&(
          <div>
            <QuestionCard question={currentQ} context={currentCtx} number={qNumber} total={numQuestions} role={role}/>

            {/* Recording area */}
            <div style={{background:P.card,border:`1px solid ${isRec?P.v2+"60":P.b1}`,borderRadius:14,padding:18,marginBottom:16,
              position:"relative",overflow:"hidden"}}>
              {isRec&&<div style={{position:"absolute",top:0,left:0,right:0,height:2,
                background:`linear-gradient(90deg,${P.v2},${P.v4},${P.v2})`,
                animation:"slide 2s linear infinite"}}/>}

              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  {isRec&&<div style={{width:8,height:8,borderRadius:"50%",background:P.red,
                    animation:"blink 1s ease-in-out infinite",boxShadow:`0 0 12px ${P.red}`}}/>}
                  <span style={{fontSize:11,color:isRec?P.white:P.muted,fontWeight:isRec?700:400}}>
                    {isRec?"Recording your answer…":isProc?loadMsg:"Ready to record"}
                  </span>
                </div>
                {isRec&&<span style={{fontSize:12,color:P.red,fontFamily:"'DM Mono',monospace",fontWeight:700}}>{fmt(recTime)}</span>}
              </div>

              <Waveform analyser={analyser} active={isRec}/>

              <div style={{display:"flex",gap:10,marginTop:14}}>
                {!isRec&&!isProc&&(
                  <button onClick={startRec} style={{
                    flex:1,padding:"14px",borderRadius:11,border:"none",cursor:"pointer",
                    background:`linear-gradient(135deg,${P.v1},${P.v2})`,color:"#fff",
                    fontSize:13,fontWeight:700,fontFamily:"inherit",
                    boxShadow:`0 4px 20px ${P.v2}40`,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                    <span style={{fontSize:16}}>🎙</span> Start Recording
                  </button>
                )}
                {isRec&&(
                  <button onClick={handleStop} style={{
                    flex:1,padding:"14px",borderRadius:11,border:`2px solid ${P.red}`,cursor:"pointer",
                    background:P.red+"18",color:P.red,fontSize:13,fontWeight:700,fontFamily:"inherit",
                    display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                    <span style={{fontSize:16}}>⏹</span> Stop & Submit Answer
                  </button>
                )}
                {isProc&&(
                  <div style={{flex:1,padding:"14px",borderRadius:11,background:P.vglow,
                    border:`1px solid ${P.v2}40`,display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
                    <span style={{animation:"spin 1s linear infinite",display:"inline-block",fontSize:16}}>⟳</span>
                    <span style={{fontSize:12,color:P.v4,fontWeight:600}}>{loadMsg||"Processing…"}</span>
                  </div>
                )}
              </div>
              {err&&<div style={{marginTop:10,fontSize:11,color:P.red,background:P.red+"12",borderRadius:7,padding:"7px 10px"}}>{err}</div>}
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      <style>{`
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes slide{from{background-position:0 0}to{background-position:200% 0}}
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:${P.bg}}
        ::-webkit-scrollbar-thumb{background:${P.b2};border-radius:3px}
        button{font-family:inherit;transition:opacity .15s,transform .1s}button:hover{opacity:.85}button:active{transform:scale(.97)}
      `}</style>
    </div>
  );
}

/* ════════════ EXPORTED ROOT COMPONENT ══════════════════════════════════════ */
export default function AgentInterview({onBack}){
  const [config, setConfig] = useState(null);

  if(!config){
    return (
      <div>
        <SetupScreen onStart={setConfig}/>
        {onBack&&(
          <button onClick={onBack} style={{
            position:"fixed",top:20,left:20,zIndex:100,
            background:"transparent",border:`1px solid #1e1e32`,
            color:"#524e6a",borderRadius:8,padding:"7px 14px",
            fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>
            ← Back to MockAI
          </button>
        )}
      </div>
    );
  }

  return (
    <AgentInterviewScreen
      config={config}
      onRestart={()=>setConfig(null)}
    />
  );
}