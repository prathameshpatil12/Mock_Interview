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

/* ── 10 Interview Questions (ML · Behavioral · Technical · Aptitude) ─── */
const QUESTIONS = [
  { id:1,  category:"Machine Learning",  difficulty:"Easy",
    question:"What is the difference between supervised and unsupervised learning? Give a real-world example of each." },
  { id:2,  category:"Machine Learning",  difficulty:"Easy",
    question:"Explain overfitting in machine learning. What techniques would you use to prevent it?" },
  { id:3,  category:"Machine Learning",  difficulty:"Easy",
    question:"What is gradient descent? Explain how it helps a model learn from data." },
  { id:4,  category:"Technical",         difficulty:"Easy",
    question:"What is the difference between a list and a tuple in Python? When would you use each?" },
  { id:5,  category:"Technical",         difficulty:"Easy",
    question:"Explain how a neural network learns. What role do weights, biases, and activation functions play?" },
  { id:6,  category:"Behavioral",        difficulty:"Easy",
    question:"Tell me about a time you faced a challenging technical problem. How did you approach solving it?" },
  { id:7,  category:"Behavioral",        difficulty:"Easy",
    question:"Describe a situation where you had to meet a tight deadline. How did you manage your time and priorities?" },
  { id:8,  category:"Behavioral",        difficulty:"Easy",
    question:"Where do you see yourself in 5 years in the field of Artificial Intelligence and Machine Learning?" },
  { id:9,  category:"Aptitude",          difficulty:"Easy",
    question:"A dataset has 80% accuracy on training data but only 55% on test data. What does this tell you and how would you fix it?" },
  { id:10, category:"Aptitude",          difficulty:"Easy",
    question:"If a model takes 3 hours to train on 10,000 samples, roughly how long would it take to train on 40,000 samples, and what factors affect this?" },
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

/* ── Radar ────────────────────────────────────────────────────────────── */
function RadarChart({dimensions}){
  const dims=sa(dimensions);if(!dims.length)return null;
  const cx=120,cy=115,R=88,n=dims.length;
  const pts=dims.map((_,i)=>{const a=(Math.PI*2*i/n)-Math.PI/2;return{cos:Math.cos(a),sin:Math.sin(a)};});
  const poly=dims.map((d,i)=>{const r=(sv(d.score)/100)*R;return`${cx+pts[i].cos*r},${cy+pts[i].sin*r}`;}).join(" ");
  const cols=[P.v4,P.indigo,P.green,P.amber,P.rose];
  return <svg width={240} height={230} viewBox="0 0 240 230" style={{overflow:"visible"}}>
    <defs><radialGradient id="rfill"><stop offset="0%" stopColor={P.v2} stopOpacity="0.25"/>
      <stop offset="100%" stopColor={P.v2} stopOpacity="0.02"/></radialGradient></defs>
    {[20,40,60,80,100].map(p=><polygon key={p} fill="none" stroke={P.b2} strokeWidth="0.7"
      points={pts.map(pt=>`${cx+pt.cos*(p/100)*R},${cy+pt.sin*(p/100)*R}`).join(" ")}/>)}
    {pts.map((p,i)=><line key={i} x1={cx} y1={cy} x2={cx+p.cos*R} y2={cy+p.sin*R} stroke={P.b2} strokeWidth="0.7"/>)}
    <polygon points={poly} fill="url(#rfill)" stroke={P.v3} strokeWidth="1.5" strokeOpacity="0.8"/>
    {dims.map((d,i)=>{const r=(sv(d.score)/100)*R;
      return<circle key={i} cx={cx+pts[i].cos*r} cy={cy+pts[i].sin*r} r={3.5} fill={cols[i%5]} stroke={P.bg} strokeWidth="1.5"/>;
    })}
    {dims.map((d,i)=>{
      const lx=cx+pts[i].cos*(R+26),ly=cy+pts[i].sin*(R+26);
      return <text key={i} textAnchor="middle" fill={cols[i%5]} fontSize="7.5" fontWeight="600" fontFamily="system-ui">
        {ss(d.label,"").split(" ").map((w,wi)=><tspan key={wi} x={lx} y={ly+wi*9}>{w}</tspan>)}
      </text>;
    })}
  </svg>;
}

/* ════════════ PDF GENERATION ════════════════════════════════════════ */
function buildPDFHTML(sessionResults) {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"});
  const timeStr = now.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});
  const total = sessionResults.length;
  const avgScore = Math.round(sessionResults.reduce((a,r)=>a+sv(so(so(r.result).feedback).overall_score),0)/total);
  const sessionGrade = avgScore>=90?"A+":avgScore>=80?"A":avgScore>=70?"B":avgScore>=60?"C":avgScore>=50?"D":"F";
  const gradeHex = {"A+":"#34d399",A:"#34d399",B:"#a78bfa",C:"#fbbf24",D:"#fb923c",F:"#f87171"}[sessionGrade]||"#a78bfa";

  const catAvg = cat => {
    const qs = sessionResults.filter(r=>r.category===cat);
    if(!qs.length) return 0;
    return Math.round(qs.reduce((a,r)=>a+sv(so(so(r.result).feedback).overall_score),0)/qs.length);
  };
  const cats = [...new Set(sessionResults.map(r=>r.category))];

  const questionRows = sessionResults.map((r,i)=>{
    const fb=so(so(r.result).feedback);
    const grade=ss(fb.grade,"?");
    const score=rnd(fb.overall_score);
    const gc={"A+":"#34d399",A:"#34d399",B:"#a78bfa",C:"#fbbf24",D:"#fb923c",F:"#f87171"}[grade]||"#888";
    const del=rnd(so(so(so(r.result).audio).scores).delivery_clarity);
    const lang=rnd(so(so(r.result).nlp).nlp_overall_score);
    const fac=rnd(so(so(r.result).facial).confidence_score);
    const catHex={"Machine Learning":"#a78bfa",Technical:"#818cf8",Behavioral:"#34d399",Aptitude:"#fbbf24"}[r.category]||"#a78bfa";
    const verdict=ss(fb.verdict,"").substring(0,60)+(ss(fb.verdict,"").length>60?"…":"");
    return `
    <tr class="q-row">
      <td class="q-num">${i+1}</td>
      <td class="q-text">${r.question}</td>
      <td><span class="cat-badge" style="color:${catHex};border-color:${catHex}40;background:${catHex}12">${r.category}</span></td>
      <td class="grade-cell" style="color:${gc}">${grade}</td>
      <td><div class="score-bar-wrap"><div class="score-bar-fill" style="width:${score}%;background:${gc}"></div></div><span class="score-num" style="color:${gc}">${score}</span></td>
      <td><span class="mini-score" style="color:#fbbf24">${del}</span></td>
      <td><span class="mini-score" style="color:#34d399">${lang}</span></td>
      <td><span class="mini-score" style="color:#c084b8">${fac}</span></td>
      <td class="verdict-cell">${verdict}</td>
    </tr>`;
  }).join("");

  const detailSections = sessionResults.map((r,i)=>{
    const fb=so(so(r.result).feedback);
    const stt=so(so(r.result).stt);
    const nlpD=so(so(r.result).nlp);
    const audioD=so(so(r.result).audio);
    const facialD=so(so(r.result).facial);
    const grade=ss(fb.grade,"?");
    const score=rnd(fb.overall_score);
    const gc={"A+":"#34d399",A:"#34d399",B:"#a78bfa",C:"#fbbf24",D:"#fb923c",F:"#f87171"}[grade]||"#888";
    const catHex={"Machine Learning":"#a78bfa",Technical:"#818cf8",Behavioral:"#34d399",Aptitude:"#fbbf24"}[r.category]||"#a78bfa";
    const dims=sa(fb.dimensions);
    const strengths=sa(fb.strengths);
    const improvements=sa(fb.improvements);
    const tips=sa(fb.tips);
    const transcript=ss(stt.transcript,"No transcript available.");

    // Audio
    const audioScores=so(audioD.scores);
    const rhythm=so(audioD.rhythm);
    const pitchD=so(audioD.pitch);
    const wpm=rnd(sv(rhythm.estimated_wpm||rhythm.speaking_rate||rhythm.wpm||0));
    const pitchMean=Math.round(sv(pitchD.mean_hz||pitchD.mean||0));
    const pitchVar=Math.round(clamp(sv(pitchD.variability||pitchD.std_hz||0),0,100));
    const delivery=rnd(audioScores.delivery_clarity||audioScores.clarity||0);
    // Pace: derive from WPM if API key missing
    const rawPace=sv(audioScores.pace_score||audioScores.pacing_score||0);
    const pace=rawPace>0?rnd(rawPace):(wpm>170?40:wpm>140?90:wpm>90?65:wpm>0?30:50);
    const vol=rnd(audioScores.volume_consistency||audioScores.volume_score||60);
    const pitchScore=rnd(audioScores.pitch_score||60);
    const rawPause=sv(rhythm.pause_ratio||rhythm.silence_ratio||0);
    const pausePct=Math.round(rawPause>1?rawPause:rawPause*100);
    const toneLabel=pitchMean>220?"High Pitch":pitchMean>150?"Medium Pitch":pitchMean>0?"Low Pitch":"—";
    const toneColor=pitchMean>220?"#c084b8":pitchMean>150?"#a78bfa":"#818cf8";
    const wpmColor=wpm===0?"#524e6a":wpm>170?"#f87171":wpm>140?"#34d399":wpm>90?"#fbbf24":"#f87171";
    const wpmLabel=wpm===0?"No Data":wpm>170?"Too Fast":wpm>140?"Optimal":wpm>90?"Slightly Slow":"Too Slow";
    // WPM as percentage bar: 0–220 WPM mapped to 0–100%
    const wpmPct=Math.round(clamp((wpm/220)*100,0,100));

    // NLP
    const fillerWords=sa(nlpD.filler_words_found);
    const nlpScore=rnd(nlpD.nlp_overall_score);
    const vocabRich=Math.round(sv(nlpD.vocabulary_richness||nlpD.lexical_diversity||0.5)*100);
    const grammar=rnd(nlpD.grammar_score||nlpD.fluency_score||70);
    const kwScore=rnd(nlpD.keyword_relevance||nlpD.relevance_score||60);
    const sentD=so(nlpD.sentiment||nlpD.sentiment_scores||{});
    const sentVal=sv(sentD.compound||sentD.score||nlpD.sentiment_score||0.5);
    const sentLabel=sentVal>0.3?"Positive":sentVal<-0.1?"Negative":"Neutral";
    const sentColor=sentVal>0.3?"#34d399":sentVal<-0.1?"#f87171":"#fbbf24";
    const wordCount=sv(stt.word_count);
    const fillerPct=wordCount>0?((fillerWords.length/wordCount)*100).toFixed(1):0;

    // Facial
    const confidence=rnd(facialD.confidence_score||0);
    const eyeContact=rnd(facialD.eye_contact_score||0);
    const attention=rnd(facialD.attention_score||facialD.engagement_score||eyeContact);
    const dominantEmo=ss(facialD.dominant_emotion,"neutral");
    const rawEmoObj=so(facialD.emotions||facialD.emotion_scores||{});
    // Normalize: convert all emotion values to 0-100 range
    const normEmoVal=v=>{const n=sv(v);return n>1?Math.min(Math.round(n),100):Math.min(Math.round(n*100),100);};
    const allEmotions=Object.fromEntries(Object.entries(rawEmoObj).map(([k,v])=>[k,normEmoVal(v)]));
    const fearVal=allEmotions.fear||allEmotions.Fear||0;
    const stress=rnd(facialD.stress_level||facialD.stress_score||(100-confidence)*0.6);
    const anxiety=rnd(facialD.anxiety_level||facialD.anxiety_score||fearVal*0.8);
    const stressColor=stress>65?"#f87171":stress>35?"#fbbf24":"#34d399";
    const anxietyColor=anxiety>65?"#f87171":anxiety>35?"#fbbf24":"#34d399";
    const stressLabel=stress>65?"High":stress>35?"Moderate":"Low";
    const anxietyLabel=anxiety>65?"High":anxiety>35?"Moderate":"Low";
    const emoColors={happy:"#34d399",neutral:"#524e6a",fear:"#f59e0b",angry:"#f87171",sad:"#818cf8",surprise:"#a78bfa",disgust:"#fb923c"};
    const emoEmoji={happy:"😊",neutral:"😐",fear:"😰",angry:"😠",sad:"😔",surprise:"😲",disgust:"🤢"};

    const dimBars=dims.map(d=>{
      const dc={"A+":"#34d399",A:"#34d399",B:"#a78bfa",C:"#fbbf24",D:"#fb923c",F:"#f87171"}[ss(d.grade)]||"#888";
      return `<div class="dim-item">
        <div class="dim-header"><span class="dim-label">${ss(d.label)}</span>
        <span class="dim-score" style="color:${dc}">${ss(d.grade)} · ${rnd(d.score)}/100</span></div>
        <div class="dim-bar-wrap"><div class="dim-bar-fill" style="width:${clamp(sv(d.score),0,100)}%;background:${dc}"></div></div>
        <div class="dim-fb">${ss(d.feedback)}</div>
      </div>`;
    }).join("");

    const uniqueFillers=[...new Set(fillerWords)].map(f=>{
      const cnt=fillerWords.filter(x=>x===f).length;
      return `<span style="background:#f8717118;border:1px solid #f8717130;border-radius:4px;padding:2px 7px;font-size:9px;color:#f87171;font-family:monospace">"${f}" ×${cnt}</span>`;
    }).join(" ");

    const emotionBars=Object.keys(allEmotions).length>0
      ? Object.entries(allEmotions).sort((a,b)=>sv(b[1])-sv(a[1])).slice(0,7).map(([emo,val])=>{
          const col=emoColors[emo]||"#888";
          // Normalize: DeepFace returns 0-100 OR 0-1 — detect and fix
          const raw=sv(val);
          const pct=Math.round(clamp(raw>1?raw:raw*100,0,100));
          return `<div style="margin-bottom:7px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
              <span style="font-size:11px;color:${emo===dominantEmo?"#edeaff":"#c8c4e0"};font-weight:${emo===dominantEmo?700:400};text-transform:capitalize">
                ${emoEmoji[emo]||"😐"} ${emo} ${emo===dominantEmo?'<span style="font-size:8px;background:'+col+'20;color:'+col+';border:1px solid '+col+'40;border-radius:3px;padding:1px 4px;margin-left:4px">DOMINANT</span>':""}
              </span>
              <span style="font-size:10px;color:${col};font-weight:700;font-family:monospace">${pct}%</span>
            </div>
            <div style="background:#1e1e32;border-radius:99px;height:4px;overflow:hidden">
              <div style="width:${pct}%;height:100%;background:${col};border-radius:99px"></div>
            </div>
          </div>`;
        }).join("")
      : `<div style="font-size:10px;color:#524e6a;padding:6px 0">No per-emotion data available. Dominant: <span style="color:#c084b8;text-transform:capitalize">${emoEmoji[dominantEmo]||"😐"} ${dominantEmo}</span></div>`;

    return `
    <div class="detail-section" style="border-top:3px solid ${catHex}40">
      <!-- Question Header -->
      <div class="detail-header">
        <div class="detail-q-num" style="background:${catHex}18;color:${catHex};border-color:${catHex}40">Q${i+1}</div>
        <div class="detail-q-body">
          <div class="detail-q-text">${r.question}</div>
          <div class="detail-meta">
            <span class="cat-badge" style="color:${catHex};border-color:${catHex}40;background:${catHex}12">${r.category}</span>
            <span class="detail-grade" style="color:${gc}">${grade}</span>
            <span class="detail-score" style="color:${gc}">${score}/100</span>
            <span class="detail-verdict">${ss(fb.verdict,"")}</span>
          </div>
        </div>
      </div>

      <!-- MODULE 1: Dimensions + Quick Stats -->
      <div class="mod-header" style="border-color:#7c3aed40;color:#a78bfa">◈ &nbsp; Performance Dimensions &amp; Overall Analysis</div>
      <div class="detail-grid">
        <div class="detail-col">
          ${dimBars}
        </div>
        <div class="detail-col">
          <div class="section-title" style="margin-bottom:10px">Quick Score Breakdown</div>
          ${[["🎙 Voice / Delivery",delivery,delivery>75?"#34d399":"#fbbf24"],["💬 Language / NLP",nlpScore,nlpScore>75?"#34d399":"#fbbf24"],["👁 Facial Confidence",confidence,confidence>70?"#34d399":"#fbbf24"],["⚡ Pace Score",pace,pace>75?"#34d399":"#fbbf24"],["📝 Overall Score",score,gc]].map(([l,v,c])=>`
            <div class="metric-row">
              <span>${l}</span>
              <div style="display:flex;align-items:center;gap:8px">
                <div style="background:#1e1e32;border-radius:99px;height:5px;width:70px;overflow:hidden">
                  <div style="width:${v}%;height:100%;background:${c};border-radius:99px"></div>
                </div>
                <span style="color:${c};font-family:monospace;font-weight:700">${v}</span>
              </div>
            </div>`).join("")}
          ${strengths.length?`<div class="section-title" style="margin-top:14px">Strengths</div>${strengths.slice(0,3).map(s=>`<div class="bullet-item green-item">✓ ${s}</div>`).join("")}`:""}
          ${improvements.length?`<div class="section-title" style="margin-top:10px">To Improve</div>${improvements.slice(0,2).map(s=>`<div class="bullet-item orange-item">→ ${s}</div>`).join("")}`:""}
        </div>
      </div>

      <!-- MODULE 2: Facial Analysis -->
      <div class="mod-header" style="border-color:#c084b840;color:#c084b8">👁 &nbsp; Facial Expression Analysis — Module 04 · DeepFace</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:14px">
        ${[["Confidence",confidence,confidence>70?"#34d399":confidence>40?"#fbbf24":"#f87171","Confidence on camera"],
           ["Stress Level",stress,stressColor,`${stressLabel} — Facial tension`],
           ["Anxiety",anxiety,anxietyColor,`${anxietyLabel} — Nervousness signals`]].map(([l,v,c,d])=>`
          <div style="background:#10101c;border:1px solid ${c}30;border-radius:10px;padding:14px;text-align:center">
            <div style="font-size:30px;font-weight:900;color:${c};font-family:monospace;line-height:1">${v}</div>
            <div style="font-size:9px;color:#524e6a;letter-spacing:1px;text-transform:uppercase;margin:4px 0 8px">${l}</div>
            <div style="background:#1e1e32;border-radius:99px;height:5px;overflow:hidden;margin-bottom:6px">
              <div style="width:${v}%;height:100%;background:${c};border-radius:99px"></div>
            </div>
            <div style="font-size:9px;color:#524e6a">${d}</div>
          </div>`).join("")}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px">
        <div class="detail-col">
          <div class="section-title">Presence Metrics</div>
          ${[["Eye Contact",eyeContact,eyeContact>70?"#34d399":eyeContact>40?"#fbbf24":"#f87171"],
             ["Attention Score",attention,attention>70?"#34d399":attention>40?"#fbbf24":"#f87171"],
             ["Composure",clamp(100-stress,0,100),"#818cf8"]].map(([l,v,c])=>`
            <div style="margin-bottom:9px">
              <div style="display:flex;justify-content:space-between;margin-bottom:3px">
                <span style="font-size:10.5px;color:#c8c4e0">${l}</span>
                <span style="font-size:10px;color:${c};font-weight:700;font-family:monospace">${v}/100</span>
              </div>
              <div style="background:#1e1e32;border-radius:99px;height:5px;overflow:hidden">
                <div style="width:${v}%;height:100%;background:${c};border-radius:99px"></div>
              </div>
            </div>`).join("")}
          <div style="background:#07070d;border:1px solid #1e1e32;border-radius:8px;padding:10px;margin-top:10px">
            <div style="font-size:8px;color:#524e6a;letter-spacing:1.5px;text-transform:uppercase;font-family:monospace;margin-bottom:5px">Dominant Emotion</div>
            <div style="font-size:18px;font-weight:700;color:#c084b8;text-transform:capitalize">${emoEmoji[dominantEmo]||"😐"} ${dominantEmo}</div>
          </div>
        </div>
        <div class="detail-col">
          <div class="section-title">All Emotions Breakdown</div>
          ${emotionBars}
        </div>
      </div>

      <!-- MODULE 3: Voice Analysis -->
      <div class="mod-header" style="border-color:#fbbf2440;color:#fbbf24">🎙 &nbsp; Voice &amp; Audio Analysis — Module 02 · Librosa</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px">
        ${[["Pitch",pitchMean>0?pitchMean+"Hz":"—",toneLabel,toneColor],
           ["Speaking Rate",wpm+" WPM",wpmLabel,wpmColor],
           ["Delivery",delivery+"/100",delivery>75?"Clear":"Needs Work",delivery>75?"#34d399":"#fbbf24"],
           ["Pause Ratio",pausePct+"%",pausePct>40?"Too Many":pausePct>15?"Balanced":"Too Few",pausePct>40?"#fbbf24":"#34d399"]].map(([l,v,sub,c])=>`
          <div style="background:#10101c;border:1px solid ${c}30;border-radius:10px;padding:12px;text-align:center">
            <div style="font-size:18px;font-weight:900;color:${c};font-family:monospace;line-height:1.2">${v}</div>
            <div style="font-size:8px;color:#524e6a;letter-spacing:1px;text-transform:uppercase;margin:4px 0">
              ${l}</div>
            <div style="font-size:8px;color:${c};background:${c}18;border:1px solid ${c}40;border-radius:3px;padding:2px 6px;display:inline-block">${sub}</div>
          </div>`).join("")}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px">
        <div class="detail-col">
          <div class="section-title">Voice Metrics</div>
          ${[["Pitch Variability",pitchVar,"#a78bfa"],["Volume Consistency",vol,"#34d399"],["Pitch Score",pitchScore,"#818cf8"],["Pace Score",pace,"#fbbf24"]].map(([l,v,c])=>`
            <div style="margin-bottom:9px">
              <div style="display:flex;justify-content:space-between;margin-bottom:3px">
                <span style="font-size:10.5px;color:#c8c4e0">${l}</span>
                <span style="font-size:10px;color:${c};font-weight:700;font-family:monospace">${v}/100</span>
              </div>
              <div style="background:#1e1e32;border-radius:99px;height:5px;overflow:hidden">
                <div style="width:${v}%;height:100%;background:${c};border-radius:99px"></div>
              </div>
            </div>`).join("")}
        </div>
        <div class="detail-col">
          <div class="section-title">Tone &amp; Pitch Profile</div>
          ${[["Mean Frequency",pitchMean>0?pitchMean+" Hz":"N/A",toneColor],["Tone Category",toneLabel,toneColor],["Pitch Variability",pitchVar>60?"Expressive":pitchVar>30?"Some Variation":"Monotone","#a78bfa"],["Speaking Rate",wpm+" WPM — "+wpmLabel,wpmColor],["Pause Ratio",pausePct+"% of speech time",pausePct>40?"#fbbf24":"#34d399"]].map(([l,v,c])=>`
            <div class="metric-row">
              <span>${l}</span>
              <span style="color:${c};font-family:monospace;font-weight:700">${v}</span>
            </div>`).join("")}
          <div style="margin-top:10px;font-size:10px;color:#c8c4e0;line-height:1.7;background:#07070d;border:1px solid #1e1e32;border-radius:7px;padding:8px 10px">
            ${wpm>170?"Speaking too fast — slow down for clarity.":wpm>140?"Ideal speaking pace for interviews.":wpm>90?"Slightly slow — add more energy.":"Very slow — aim for 130–160 WPM."}
          </div>
        </div>
      </div>

      <!-- MODULE 4: NLP / Language -->
      <div class="mod-header" style="border-color:#34d39940;color:#34d399">💬 &nbsp; Language &amp; NLP Analysis — Module 03 · NLP Engine</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px">
        <div class="detail-col">
          <div class="section-title">Language Scores</div>
          ${[["Overall NLP Score",nlpScore,nlpScore>75?"#34d399":"#fbbf24"],["Vocabulary Richness",vocabRich,vocabRich>60?"#34d399":"#fbbf24"],["Grammar & Fluency",grammar,grammar>70?"#34d399":"#fbbf24"],["Keyword Relevance",kwScore,kwScore>70?"#34d399":"#fbbf24"]].map(([l,v,c])=>`
            <div style="margin-bottom:9px">
              <div style="display:flex;justify-content:space-between;margin-bottom:3px">
                <span style="font-size:10.5px;color:#c8c4e0">${l}</span>
                <span style="font-size:10px;color:${c};font-weight:700;font-family:monospace">${v}/100</span>
              </div>
              <div style="background:#1e1e32;border-radius:99px;height:5px;overflow:hidden">
                <div style="width:${v}%;height:100%;background:${c};border-radius:99px"></div>
              </div>
            </div>`).join("")}
          <div class="metric-row">
            <span>Sentiment</span>
            <span style="color:${sentColor};font-family:monospace;font-weight:700;background:${sentColor}18;padding:2px 8px;border-radius:4px">${sentLabel}</span>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px">
            ${[["Total Words",wordCount+"w","#a78bfa"],["Filler Words",fillerWords.length+" ("+fillerPct+"%)","#f87171"]].map(([l,v,c])=>`
              <div style="background:#07070d;border:1px solid #1e1e32;border-radius:7px;padding:8px;text-align:center">
                <div style="font-size:16px;font-weight:900;color:${c};font-family:monospace">${v}</div>
                <div style="font-size:8px;color:#524e6a;letter-spacing:1px;text-transform:uppercase;margin-top:2px">${l}</div>
              </div>`).join("")}
          </div>
        </div>
        <div class="detail-col">
          <div class="section-title">Filler Words Detected (${fillerWords.length})</div>
          <div style="margin-bottom:10px;min-height:30px">${uniqueFillers||'<span style="color:#34d399;font-size:10.5px">✓ No filler words detected — excellent!</span>'}</div>
          <div style="font-size:9.5px;color:#c8c4e0;line-height:1.7;background:#07070d;border:1px solid #1e1e32;border-radius:7px;padding:9px 11px;margin-bottom:10px">
            ${fillerWords.length>10?"High filler usage. Practice replacing 'um/uh' with confident pauses.":fillerWords.length>4?"Moderate filler words. Pause instead of filling silence.":"Low filler word usage — you spoke confidently and fluently."}
          </div>
          <div class="section-title">Vocabulary Assessment</div>
          <div style="font-size:9.5px;color:#c8c4e0;line-height:1.7;background:#07070d;border:1px solid #1e1e32;border-radius:7px;padding:9px 11px">
            ${vocabRich>70?"Rich vocabulary — you used diverse and advanced language effectively.":vocabRich>40?"Average vocabulary. Try incorporating more domain-specific terminology.":"Basic vocabulary detected. Expand your technical and professional word choices."}
          </div>
        </div>
      </div>

      <!-- Tips -->
      ${tips.length?`<div class="tips-section">
        <div class="section-title">Actionable Coaching Tips</div>
        <div class="tips-grid">${tips.slice(0,4).map((t,ti)=>`<div class="tip-item"><span class="tip-num">0${ti+1}</span>${t}</div>`).join("")}</div>
      </div>`:""}

      <!-- Transcript -->
      <div class="transcript-section">
        <div class="section-title" style="display:flex;justify-content:space-between"><span>Your Answer (Transcript)</span><span style="color:#a78bfa">${wordCount} words</span></div>
        <div class="transcript-text">${transcript}</div>
      </div>
    </div>`;
  }).join("");

  // ── Compute session-wide averages for summary ──
  const avgVoice  = Math.round(sessionResults.reduce((a,r)=>a+rnd(so(so(so(r.result).audio).scores).delivery_clarity),0)/total);
  const avgLang   = Math.round(sessionResults.reduce((a,r)=>a+rnd(so(so(r.result).nlp).nlp_overall_score),0)/total);
  const avgFacial = Math.round(sessionResults.reduce((a,r)=>a+rnd(so(so(r.result).facial).confidence_score),0)/total);
  const topStrengths=[...new Set(sessionResults.flatMap(r=>sa(so(so(r.result).feedback).strengths)).filter(Boolean))].slice(0,4);
  const topImprovements=[...new Set(sessionResults.flatMap(r=>sa(so(so(r.result).feedback).improvements)).filter(Boolean))].slice(0,4);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>MockAI Interview Report — ${dateStr}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap');

  :root {
    --bg:#07070d; --s1:#0c0c16; --s2:#10101c; --card:#131320;
    --b1:#1e1e32; --b2:#2a2a42;
    --v1:#5b21b6; --v2:#7c3aed; --v4:#a78bfa;
    --txt:#c8c4e0; --muted:#524e6a; --white:#edeaff;
    --green:#34d399; --red:#f87171; --amber:#fbbf24;
    --indigo:#818cf8; --rose:#c084b8; --orange:#fb923c;
  }

  *{box-sizing:border-box;margin:0;padding:0;}

  body {
    font-family:'Inter',system-ui,sans-serif;
    background:var(--bg); color:var(--txt);
    font-size:12px; line-height:1.6;
    -webkit-print-color-adjust:exact; print-color-adjust:exact;
  }

  /* ── PAGE SETUP ── */
  @page { size: A4; margin: 0; }
  .pdf-page {
    width:210mm; min-height:297mm;
    padding:14mm 14mm 10mm;
    background:var(--bg);
    position:relative;
    page-break-after:always;
    overflow:hidden;
  }
  .pdf-page:last-child { page-break-after:auto; }
  .pdf-page::before {
    content:""; position:absolute; inset:0; pointer-events:none;
    background:radial-gradient(ellipse 50% 30% at 90% 5%,#5b21b618,transparent),
               radial-gradient(ellipse 30% 20% at 5% 95%,#7c3aed0c,transparent);
  }

  /* ── PAGE HEADER / FOOTER ── */
  .pg-header {
    display:flex; justify-content:space-between; align-items:center;
    padding-bottom:8px; margin-bottom:16px;
    border-bottom:1px solid var(--b1);
    font-size:8px; color:var(--muted); font-family:'JetBrains Mono',monospace;
    letter-spacing:1px; text-transform:uppercase;
  }
  .pg-footer {
    position:absolute; bottom:10mm; left:14mm; right:14mm;
    display:flex; justify-content:space-between; align-items:center;
    font-size:7.5px; color:var(--muted); font-family:'JetBrains Mono',monospace;
    border-top:1px solid var(--b1); padding-top:6px;
  }

  /* ── COVER ── */
  .cover {
    width:210mm; min-height:297mm; padding:0;
    background:var(--bg); position:relative;
    page-break-after:always; overflow:hidden;
    display:flex; flex-direction:column;
  }
  .cover-top {
    flex:1; padding:20mm 16mm 10mm;
    display:flex; flex-direction:column; justify-content:flex-end;
  }
  .cover-stripe {
    height:2px;
    background:linear-gradient(90deg,#5b21b6,#7c3aed,#a78bfa,transparent);
  }
  .cover-bottom { padding:12mm 16mm; background:var(--s1); }
  .cover::before {
    content:""; position:absolute; inset:0; pointer-events:none;
    background:radial-gradient(ellipse 70% 60% at 80% 20%,#5b21b630,transparent),
               radial-gradient(ellipse 50% 40% at 5% 80%,#7c3aed18,transparent);
  }
  .cover-eyebrow {
    font-size:9px; font-weight:700; letter-spacing:3px; text-transform:uppercase;
    color:var(--v4); font-family:'JetBrains Mono',monospace; margin-bottom:16px;
    display:flex; align-items:center; gap:10px;
  }
  .cover-eyebrow::before { content:""; display:block; width:24px; height:1px; background:var(--v2); }
  .cover-h1 { font-size:52px; font-weight:900; color:var(--white); line-height:1; letter-spacing:-2px; margin-bottom:6px; }
  .cover-h2 { font-size:52px; font-weight:300; color:var(--v4); line-height:1; letter-spacing:-2px; margin-bottom:32px; }
  .cover-cards { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-bottom:28px; }
  .cover-card {
    background:var(--card); border:1px solid var(--b1);
    border-radius:10px; padding:16px 12px; text-align:center;
    position:relative; overflow:hidden;
  }
  .cover-card::before {
    content:""; position:absolute; top:0; left:0; right:0; height:2px;
    background:attr(data-color);
  }
  .cover-card-val { font-size:36px; font-weight:900; font-family:'JetBrains Mono',monospace; line-height:1; margin-bottom:5px; }
  .cover-card-label { font-size:8px; color:var(--muted); letter-spacing:1.5px; text-transform:uppercase; font-weight:600; }
  .cover-divider { height:1px; background:linear-gradient(90deg,transparent,var(--b2),transparent); margin:20px 0; }
  .cover-meta-row { display:flex; justify-content:space-between; align-items:center; }
  .cover-meta-date { font-size:11px; color:var(--muted); }
  .cover-meta-tech { font-size:8px; color:var(--muted); letter-spacing:1px; text-transform:uppercase; font-family:'JetBrains Mono',monospace; }

  /* ── SCORE SUMMARY BOX ── */
  .score-hero {
    display:grid; grid-template-columns:110px 1fr; gap:16px;
    background:var(--card); border:1px solid var(--b1); border-radius:12px;
    padding:16px; margin-bottom:16px; position:relative; overflow:hidden;
  }
  .score-hero-grade { font-size:72px; font-weight:900; font-family:'JetBrains Mono',monospace; line-height:1; letter-spacing:-4px; text-align:center; }
  .score-hero-num  { font-size:28px; font-weight:900; font-family:'JetBrains Mono',monospace; text-align:center; line-height:1; }
  .score-hero-lbl  { font-size:7px; color:var(--muted); letter-spacing:2px; text-transform:uppercase; text-align:center; margin-top:2px; }

  /* ── SECTION TITLE ── */
  .sec-title {
    font-size:8px; font-weight:700; letter-spacing:2.5px; text-transform:uppercase;
    color:var(--muted); font-family:'JetBrains Mono',monospace; margin-bottom:10px;
    display:flex; align-items:center; gap:8px;
  }
  .sec-title::after { content:""; flex:1; height:1px; background:var(--b1); }

  /* ── CATEGORY CARDS ── */
  .cat-grid4 { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-bottom:16px; }
  .cat-card { background:var(--card); border:1px solid var(--b1); border-radius:10px; padding:12px; }
  .cat-card-name { font-size:8px; font-weight:700; letter-spacing:1px; text-transform:uppercase; margin-bottom:6px; }
  .cat-card-score { font-size:26px; font-weight:900; font-family:'JetBrains Mono',monospace; line-height:1; margin-bottom:6px; }
  .bar { background:var(--b1); border-radius:99px; height:4px; overflow:hidden; }
  .bar-fill { height:100%; border-radius:99px; }

  /* ── SCORE TABLE ── */
  .stbl { width:100%; border-collapse:collapse; font-size:10px; }
  .stbl th { text-align:left; color:var(--muted); font-size:7.5px; letter-spacing:1.5px; text-transform:uppercase; padding:7px 8px; border-bottom:1px solid var(--b1); background:var(--s2); font-family:'JetBrains Mono',monospace; }
  .stbl td { padding:8px; border-bottom:1px solid var(--b1); vertical-align:middle; }
  .stbl tr:last-child td { border-bottom:none; }
  .stbl .q-num { color:var(--muted); font-family:'JetBrains Mono',monospace; font-size:9px; font-weight:700; }
  .stbl .q-text { color:var(--white); font-size:9.5px; line-height:1.5; max-width:180px; }
  .stbl .grade-cell { font-size:15px; font-weight:900; font-family:'JetBrains Mono',monospace; }
  .cat-badge { font-size:7.5px; font-weight:700; letter-spacing:0.8px; text-transform:uppercase; padding:2px 6px; border-radius:3px; border:1px solid; white-space:nowrap; }
  .mini-bar-wrap { display:inline-block; background:var(--b1); border-radius:99px; height:4px; width:50px; overflow:hidden; vertical-align:middle; margin-right:5px; }
  .mini-bar-fill { height:100%; border-radius:99px; }
  .score-num { font-size:10px; font-weight:700; font-family:'JetBrains Mono',monospace; vertical-align:middle; }

  /* ── MODULE HEADER (inside detail page) ── */
  .mod-hdr {
    display:flex; align-items:center; gap:10px;
    padding:8px 12px; margin:14px 0 12px;
    border-left:3px solid; border-radius:0 7px 7px 0;
    background:var(--s2);
  }
  .mod-hdr-icon { font-size:14px; flex-shrink:0; }
  .mod-hdr-title { font-size:10px; font-weight:800; }
  .mod-hdr-sub { font-size:7.5px; color:var(--muted); font-family:'JetBrains Mono',monospace; letter-spacing:1px; text-transform:uppercase; }

  /* ── DETAIL CARDS ── */
  .dcol { background:var(--card); border:1px solid var(--b1); border-radius:10px; padding:12px; }
  .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px; }
  .grid3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; margin-bottom:12px; }
  .grid4 { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin-bottom:12px; }
  .stat-box { background:var(--s2); border-radius:8px; padding:10px; text-align:center; }
  .stat-val { font-size:22px; font-weight:900; font-family:'JetBrains Mono',monospace; line-height:1; }
  .stat-lbl { font-size:7.5px; color:var(--muted); letter-spacing:1px; text-transform:uppercase; margin:4px 0 5px; }
  .stat-sub { font-size:8px; }
  .mrow { display:flex; justify-content:space-between; padding:4px 0; border-bottom:1px solid var(--b1); font-size:10px; }
  .mrow span:first-child { color:var(--muted); }
  .mbar { margin-bottom:8px; }
  .mbar-header { display:flex; justify-content:space-between; margin-bottom:3px; font-size:10px; }
  .mbar-track { background:var(--b1); border-radius:99px; height:5px; overflow:hidden; }
  .mbar-fill { height:100%; border-radius:99px; }
  .pill { font-size:8px; font-weight:700; padding:2px 7px; border-radius:3px; border:1px solid; }
  .bullet { font-size:10px; padding:5px 0; border-bottom:1px solid var(--b1); line-height:1.6; }

  /* ── Q-HEADER ── */
  .q-header { display:flex; gap:12px; align-items:flex-start; margin-bottom:14px; padding:12px; background:var(--s2); border-radius:10px; }
  .q-badge { font-size:12px; font-weight:900; font-family:'JetBrains Mono',monospace; padding:7px 12px; border-radius:8px; border:1px solid; flex-shrink:0; }
  .q-title { font-size:12px; font-weight:700; color:var(--white); line-height:1.5; margin-bottom:6px; }
  .q-meta { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
  .q-grade { font-size:20px; font-weight:900; font-family:'JetBrains Mono',monospace; }
  .q-score { font-size:12px; font-weight:700; font-family:'JetBrains Mono',monospace; color:var(--muted); }
  .q-verdict { font-size:9.5px; color:var(--muted); }

  /* ── TRANSCRIPT ── */
  .transcript { background:var(--s1); border:1px solid var(--b1); border-radius:8px; padding:10px 12px; margin-top:12px; }
  .transcript p { font-size:10px; color:var(--v4); line-height:1.9; font-style:italic; }

  /* ── TIPS ── */
  .tips-grid2 { display:grid; grid-template-columns:1fr 1fr; gap:7px; margin-top:8px; }
  .tip-item { display:flex; gap:8px; padding:7px 9px; background:var(--s1); border-radius:7px; border:1px solid var(--b2); font-size:9.5px; line-height:1.6; }
  .tip-num { font-family:'JetBrains Mono',monospace; font-weight:800; color:var(--v4); flex-shrink:0; font-size:9px; }

  /* ── STRENGTHS / IMPROVEMENTS ── */
  .bullet-g { font-size:9.5px; padding:4px 0; border-bottom:1px solid var(--b1); color:var(--green); }
  .bullet-o { font-size:9.5px; padding:4px 0; border-bottom:1px solid var(--b1); color:var(--orange); }

  /* ── PRINT ── */
  @media print {
    body { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    .pdf-page { page-break-after:always; }
    .pdf-page:last-child { page-break-after:auto; }
    .cover { page-break-after:always; }
    .no-break { page-break-inside:avoid; }
  }
</style>
</head>
<body>

<!-- ══════════════════════ COVER PAGE ══════════════════════ -->
<div class="cover">
  <div class="cover-top">
    <div class="cover-eyebrow">MockAI · Interview Session Report</div>
    <div class="cover-h1">Interview</div>
    <div class="cover-h2">Performance Report</div>

    <div class="cover-cards">
      <div class="cover-card">
        <div style="position:absolute;top:0;left:0;right:0;height:2px;background:${gradeHex}"></div>
        <div class="cover-card-val" style="color:${gradeHex}">${sessionGrade}</div>
        <div class="cover-card-label">Session Grade</div>
      </div>
      <div class="cover-card">
        <div style="position:absolute;top:0;left:0;right:0;height:2px;background:${gradeHex}"></div>
        <div class="cover-card-val" style="color:${gradeHex}">${avgScore}</div>
        <div class="cover-card-label">Avg Score /100</div>
      </div>
      <div class="cover-card">
        <div style="position:absolute;top:0;left:0;right:0;height:2px;background:#a78bfa"></div>
        <div class="cover-card-val" style="color:#a78bfa">${total}</div>
        <div class="cover-card-label">Questions Done</div>
      </div>
      <div class="cover-card">
        <div style="position:absolute;top:0;left:0;right:0;height:2px;background:#34d399"></div>
        <div class="cover-card-val" style="color:#34d399">${Math.round((total/10)*100)}%</div>
        <div class="cover-card-label">Completion</div>
      </div>
    </div>

    <!-- Module avg strip -->
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:28px">
      ${[["🎙 Voice & Delivery",avgVoice,"#fbbf24"],["💬 Language & NLP",avgLang,"#34d399"],["👁 Facial Presence",avgFacial,"#c084b8"]].map(([l,v,c])=>`
      <div style="background:var(--s2);border:1px solid ${c}30;border-radius:10px;padding:12px;display:flex;align-items:center;gap:12px">
        <div style="font-size:24px;font-weight:900;color:${c};font-family:'JetBrains Mono',monospace;flex-shrink:0">${v}</div>
        <div>
          <div style="font-size:10px;font-weight:700;color:${c}">${l}</div>
          <div style="background:var(--b1);border-radius:99px;height:4px;overflow:hidden;margin-top:5px;width:80px">
            <div style="width:${v}%;height:100%;background:${c};border-radius:99px"></div>
          </div>
        </div>
      </div>`).join("")}
    </div>

    <div class="cover-divider"></div>
    <div class="cover-meta-row">
      <div class="cover-meta-date">📅 ${dateStr} · ${timeStr}</div>
      <div class="cover-meta-tech">Whisper · Librosa · DeepFace · NLP · Feedback Engine</div>
    </div>
  </div>
  <div class="cover-stripe"></div>
  <div class="cover-bottom">
    <div style="font-size:9px;color:var(--muted);letter-spacing:1px;text-transform:uppercase;font-family:'JetBrains Mono',monospace;margin-bottom:10px">Category Performance</div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">
      ${["Machine Learning","Technical","Behavioral","Aptitude"].map(cat=>{
        const avg=catAvg(cat);
        const ch={"Machine Learning":"#a78bfa",Technical:"#818cf8",Behavioral:"#34d399",Aptitude:"#fbbf24"}[cat];
        return `<div style="display:flex;flex-direction:column;gap:4px">
          <div style="display:flex;justify-content:space-between;font-size:9px">
            <span style="color:${ch};font-weight:700">${cat}</span>
            <span style="color:var(--muted);font-family:'JetBrains Mono',monospace">${avg}/100</span>
          </div>
          <div style="background:var(--b1);border-radius:99px;height:5px;overflow:hidden">
            <div style="width:${avg}%;height:100%;background:${ch};border-radius:99px"></div>
          </div>
        </div>`;
      }).join("")}
    </div>
  </div>
</div>

<!-- ══════════════════════ PAGE 2: SESSION SUMMARY ══════════════════════ -->
<div class="pdf-page">
  <div class="pg-header">
    <span>🎯 MockAI Interview Report</span>
    <span>${dateStr}</span>
    <span>Page 2 — Session Summary</span>
  </div>

  <!-- Score Hero -->
  <div class="score-hero" style="border-color:${gradeHex}35">
    <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 0% 50%,${gradeHex}0c,transparent 50%)"></div>
    <div style="position:relative;z-index:1">
      <div class="score-hero-grade" style="color:${gradeHex}">${sessionGrade}</div>
      <div class="score-hero-num" style="color:${gradeHex}">${avgScore}<span style="font-size:13px;color:var(--muted);font-weight:400">/100</span></div>
      <div class="score-hero-lbl">Overall Grade</div>
    </div>
    <div style="position:relative;z-index:1;display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;align-self:center">
      ${[["🎙 Voice",avgVoice,"#fbbf24"],["💬 Language",avgLang,"#34d399"],["👁 Facial",avgFacial,"#c084b8"]].map(([l,v,c])=>`
      <div style="background:var(--s2);border:1px solid ${c}30;border-radius:8px;padding:10px;text-align:center">
        <div style="font-size:22px;font-weight:900;color:${c};font-family:'JetBrains Mono',monospace">${v}</div>
        <div style="font-size:8px;color:var(--muted);letter-spacing:1px;text-transform:uppercase;margin-bottom:5px">${l}</div>
        <div class="bar"><div class="bar-fill" style="width:${v}%;background:${c}"></div></div>
      </div>`).join("")}
    </div>
  </div>

  <!-- Category breakdown -->
  <div class="sec-title">Performance by Category</div>
  <div class="cat-grid4">
    ${["Machine Learning","Technical","Behavioral","Aptitude"].map(cat=>{
      const avg=catAvg(cat);
      const ch={"Machine Learning":"#a78bfa",Technical:"#818cf8",Behavioral:"#34d399",Aptitude:"#fbbf24"}[cat];
      const qs=sessionResults.filter(r=>r.category===cat);
      return `<div class="cat-card" style="border-color:${ch}30">
        <div style="position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,${ch},transparent)"></div>
        <div class="cat-card-name" style="color:${ch}">${cat}</div>
        <div class="cat-card-score" style="color:${ch}">${avg}<span style="font-size:12px;font-weight:400;color:var(--muted)">/100</span></div>
        <div class="bar" style="margin-bottom:6px"><div class="bar-fill" style="width:${avg}%;background:${ch}"></div></div>
        <div style="font-size:8.5px;color:var(--muted)">${qs.length} question${qs.length>1?"s":""}</div>
      </div>`;
    }).join("")}
  </div>

  <!-- Strengths + Improvements -->
  <div class="grid2" style="margin-bottom:16px">
    <div class="dcol" style="border-color:#34d39930">
      <div class="sec-title" style="color:#34d399">✓ &nbsp; Session Strengths</div>
      ${topStrengths.length?topStrengths.map(s=>`<div class="bullet-g">✓ ${s}</div>`).join(""):`<div style="font-size:10px;color:var(--muted)">Complete session to see strengths</div>`}
    </div>
    <div class="dcol" style="border-color:#fb923c30">
      <div class="sec-title" style="color:#fb923c">→ &nbsp; Focus Areas</div>
      ${topImprovements.length?topImprovements.map(s=>`<div class="bullet-o">→ ${s}</div>`).join(""):`<div style="font-size:10px;color:var(--muted)">Complete session to see improvements</div>`}
    </div>
  </div>

  <!-- Score Table -->
  <div class="sec-title">All Questions at a Glance</div>
  <table class="stbl">
    <thead><tr>
      <th>#</th><th>Question</th><th>Category</th><th>Grade</th>
      <th>Overall</th><th>Voice</th><th>Language</th><th>Facial</th>
    </tr></thead>
    <tbody>${questionRows}</tbody>
  </table>

  <div class="pg-footer">
    <span>MockAI Interview Coach · AI-Powered Performance Analysis</span>
    <span>Page 2 of ${total+2}</span>
  </div>
</div>

<!-- ══════════════════════ PAGES 3+: PER-QUESTION DETAIL ══════════════════════ -->
${sessionResults.map((r,i)=>{
  const fb=so(so(r.result).feedback);
  const stt=so(so(r.result).stt);
  const nlpD=so(so(r.result).nlp);
  const audioD=so(so(r.result).audio);
  const facialD=so(so(r.result).facial);
  const grade=ss(fb.grade,"?");
  const score=rnd(fb.overall_score);
  const gc={"A+":"#34d399",A:"#34d399",B:"#a78bfa",C:"#fbbf24",D:"#fb923c",F:"#f87171"}[grade]||"#888";
  const catHex={"Machine Learning":"#a78bfa",Technical:"#818cf8",Behavioral:"#34d399",Aptitude:"#fbbf24"}[r.category]||"#a78bfa";
  const dims=sa(fb.dimensions);
  const strengths=sa(fb.strengths);
  const improvements=sa(fb.improvements);
  const tips=sa(fb.tips);
  const transcript=ss(stt.transcript,"No transcript available.");
  const wordCount=sv(stt.word_count);

  // Audio
  const aScores=so(audioD.scores);
  const aRhythm=so(audioD.rhythm);
  const aPitch=so(audioD.pitch);
  const dWpm=rnd(sv(aRhythm.estimated_wpm||aRhythm.speaking_rate||0));
  const dPitchHz=Math.round(sv(aPitch.mean_hz||aPitch.mean||0));
  const dPitchVar=Math.round(clamp(sv(aPitch.variability||aPitch.std_hz||0),0,100));
  const dDelivery=rnd(aScores.delivery_clarity||0);
  const rawDP=sv(aScores.pace_score||aScores.pacing_score||0);
  const dPace=rawDP>0?rnd(rawDP):(dWpm>170?40:dWpm>140?90:dWpm>90?65:dWpm>0?30:50);
  const dVol=rnd(aScores.volume_consistency||aScores.volume_score||60);
  const dPitchSc=rnd(aScores.pitch_score||60);
  const dRawPause=sv(aRhythm.pause_ratio||0);
  const dPausePct=Math.round(dRawPause>1?dRawPause:dRawPause*100);
  const dToneLabel=dPitchHz>220?"High":dPitchHz>150?"Medium":dPitchHz>0?"Low":"—";
  const dToneColor=dPitchHz>220?"#c084b8":dPitchHz>150?"#a78bfa":"#818cf8";
  const dWpmColor=dWpm===0?"#524e6a":dWpm>170?"#f87171":dWpm>140?"#34d399":dWpm>90?"#fbbf24":"#f87171";
  const dWpmLabel=dWpm===0?"N/A":dWpm>170?"Too Fast":dWpm>140?"Optimal":dWpm>90?"Slightly Slow":"Too Slow";
  const dWpmPct=Math.round(clamp((dWpm/220)*100,0,100));

  // NLP
  const dFillers=sa(nlpD.filler_words_found);
  const dNlp=rnd(nlpD.nlp_overall_score);
  const dVocab=Math.round(sv(nlpD.vocabulary_richness||nlpD.lexical_diversity||0.5)*100);
  const dGrammar=rnd(nlpD.grammar_score||nlpD.fluency_score||70);
  const dKw=rnd(nlpD.keyword_relevance||nlpD.relevance_score||60);
  const dSentD=so(nlpD.sentiment||nlpD.sentiment_scores||{});
  const dSentVal=sv(dSentD.compound||dSentD.score||nlpD.sentiment_score||0.5);
  const dSentLabel=dSentVal>0.3?"Positive":dSentVal<-0.1?"Negative":"Neutral";
  const dSentColor=dSentVal>0.3?"#34d399":dSentVal<-0.1?"#f87171":"#fbbf24";
  const dFillerPct=wordCount>0?((dFillers.length/wordCount)*100).toFixed(1):0;

  // Facial
  const dConf=rnd(facialD.confidence_score||0);
  const dEye=rnd(facialD.eye_contact_score||0);
  const dAttn=rnd(facialD.attention_score||facialD.engagement_score||dEye);
  const dDomEmo=ss(facialD.dominant_emotion,"neutral");
  const dRawEmos=so(facialD.emotions||facialD.emotion_scores||{});
  const dAllEmos=Object.fromEntries(Object.entries(dRawEmos).map(([k,v])=>{const n=sv(v);return[k,clamp(n>1?n:n*100,0,100)];}));
  const dStress=rnd(facialD.stress_level||facialD.stress_score||(100-dConf)*0.6);
  const dFearVal=dAllEmos.fear||dAllEmos.Fear||0;
  const dAnxiety=rnd(facialD.anxiety_level||facialD.anxiety_score||dFearVal*0.8);
  const dStressColor=dStress>65?"#f87171":dStress>35?"#fbbf24":"#34d399";
  const dAnxColor=dAnxiety>65?"#f87171":dAnxiety>35?"#fbbf24":"#34d399";
  const emoColors2={happy:"#34d399",neutral:"#524e6a",fear:"#f59e0b",angry:"#f87171",sad:"#818cf8",surprise:"#a78bfa",disgust:"#fb923c"};
  const emoEmoji2={happy:"😊",neutral:"😐",fear:"😰",angry:"😠",sad:"😔",surprise:"😲",disgust:"🤢"};

  const dDimBars=dims.map(d=>{
    const dc={"A+":"#34d399",A:"#34d399",B:"#a78bfa",C:"#fbbf24",D:"#fb923c",F:"#f87171"}[ss(d.grade)]||"#888";
    return `<div class="mbar">
      <div class="mbar-header">
        <span style="color:#c8c4e0;font-weight:600">${ss(d.label)}</span>
        <span style="color:${dc};font-weight:800;font-family:'JetBrains Mono',monospace">${ss(d.grade)} · ${rnd(d.score)}</span>
      </div>
      <div class="mbar-track"><div class="mbar-fill" style="width:${clamp(sv(d.score),0,100)}%;background:${dc}"></div></div>
      <div style="font-size:8.5px;color:var(--muted);margin-top:2px;line-height:1.5">${ss(d.feedback)}</div>
    </div>`;
  }).join("");

  const dEmoLines=Object.keys(dAllEmos).length>0
    ? Object.entries(dAllEmos).sort((a,b)=>sv(b[1])-sv(a[1])).slice(0,7).map(([emo,val])=>{
        const col=emoColors2[emo]||"#888";
        const pct=Math.round(clamp(sv(val),0,100));
        return `<div class="mbar">
          <div class="mbar-header">
            <span style="color:${emo===dDomEmo?"#edeaff":"#c8c4e0"};font-weight:${emo===dDomEmo?700:400};text-transform:capitalize">
              ${emoEmoji2[emo]||"😐"} ${emo}${emo===dDomEmo?' <span style="font-size:7px;background:'+col+'20;color:'+col+';border:1px solid '+col+'40;border-radius:3px;padding:1px 4px">DOM</span>':""}
            </span>
            <span style="color:${col};font-weight:700;font-family:'JetBrains Mono',monospace">${pct.toFixed(1)}%</span>
          </div>
          <div class="mbar-track"><div class="mbar-fill" style="width:${pct}%;background:${col}"></div></div>
        </div>`;
      }).join("")
    : `<div style="font-size:9.5px;color:var(--muted);padding:4px 0">Dominant: <span style="text-transform:capitalize;color:#c084b8">${emoEmoji2[dDomEmo]||"😐"} ${dDomEmo}</span></div>`;

  const dFillerTags=[...new Set(dFillers)].map(f=>{
    const cnt=dFillers.filter(x=>x===f).length;
    return `<span class="pill" style="color:#f87171;border-color:#f8717130;background:#f8717110">"${f}" ×${cnt}</span>`;
  }).join(" ");

  return `
<div class="pdf-page no-break">
  <div class="pg-header">
    <span>🎯 MockAI · Q${i+1} of ${total}</span>
    <span>${r.category} · ${r.question.substring(0,55)}${r.question.length>55?"…":""}</span>
    <span>Page ${i+3} of ${total+2}</span>
  </div>

  <!-- Q HEADER -->
  <div class="q-header" style="border-left:3px solid ${catHex}">
    <div class="q-badge" style="background:${catHex}18;color:${catHex};border-color:${catHex}50">Q${i+1}</div>
    <div style="flex:1">
      <div class="q-title">${r.question}</div>
      <div class="q-meta">
        <span class="cat-badge" style="color:${catHex};border-color:${catHex}40;background:${catHex}12">${r.category}</span>
        <span class="q-grade" style="color:${gc}">${grade}</span>
        <span class="q-score" style="color:${gc}">${score}/100</span>
        <span class="q-verdict">${ss(fb.verdict,"")}</span>
      </div>
    </div>
    <!-- 4 quick scores -->
    <div style="display:flex;flex-direction:column;gap:5px;min-width:110px">
      ${[["Voice",dDelivery,"#fbbf24"],["Language",dNlp,"#34d399"],["Facial",dConf,"#c084b8"],["Pace",dPace,"#a78bfa"]].map(([l,v,c])=>`
      <div style="display:flex;justify-content:space-between;align-items:center;background:var(--s1);border-radius:5px;padding:3px 8px;gap:8px">
        <span style="font-size:8px;color:var(--muted)">${l}</span>
        <div style="display:flex;align-items:center;gap:5px">
          <div style="background:var(--b1);border-radius:99px;height:3px;width:36px;overflow:hidden">
            <div style="width:${v}%;height:100%;background:${c};border-radius:99px"></div>
          </div>
          <span style="font-size:9px;color:${c};font-weight:700;font-family:'JetBrains Mono',monospace">${v}</span>
        </div>
      </div>`).join("")}
    </div>
  </div>

  <!-- ROW 1: Dimensions + Quick Stats -->
  <div class="grid2">
    <div class="dcol">
      <div class="sec-title">◈ Performance Dimensions</div>
      ${dDimBars}
    </div>
    <div class="dcol">
      <div class="sec-title">📊 Score Summary</div>
      ${strengths.length?`<div style="font-size:8px;color:#34d399;letter-spacing:1.5px;text-transform:uppercase;font-weight:700;margin-bottom:5px;font-family:'JetBrains Mono',monospace">Strengths</div>${strengths.slice(0,3).map(s=>`<div class="bullet-g">✓ ${s}</div>`).join("")}`:""}
      ${improvements.length?`<div style="font-size:8px;color:#fb923c;letter-spacing:1.5px;text-transform:uppercase;font-weight:700;margin:8px 0 5px;font-family:'JetBrains Mono',monospace">To Improve</div>${improvements.slice(0,3).map(s=>`<div class="bullet-o">→ ${s}</div>`).join("")}`:""}
      ${tips.length?`
      <div style="font-size:8px;color:#a78bfa;letter-spacing:1.5px;text-transform:uppercase;font-weight:700;margin:10px 0 6px;font-family:'JetBrains Mono',monospace">Tips</div>
      <div class="tips-grid2">${tips.slice(0,4).map((t,ti)=>`<div class="tip-item"><span class="tip-num">0${ti+1}</span>${t}</div>`).join("")}</div>`:""}
    </div>
  </div>

  <!-- ROW 2: Facial + Voice side by side -->
  <div class="grid2">
    <!-- FACIAL -->
    <div class="dcol" style="border-color:#c084b830">
      <div class="mod-hdr" style="border-color:#c084b8;margin:0 0 10px">
        <span class="mod-hdr-icon">👁</span>
        <div><div class="mod-hdr-title" style="color:#c084b8">Facial Analysis</div>
        <div class="mod-hdr-sub">Module 04 · DeepFace</div></div>
      </div>
      <!-- 3 big scores -->
      <div class="grid3" style="margin-bottom:10px">
        ${[["Confidence",dConf,dConf>70?"#34d399":dConf>40?"#fbbf24":"#f87171"],["Stress",dStress,dStressColor],["Anxiety",dAnxiety,dAnxColor]].map(([l,v,c])=>`
        <div class="stat-box" style="border:1px solid ${c}30">
          <div class="stat-val" style="color:${c}">${v}</div>
          <div class="stat-lbl">${l}</div>
          <div class="mbar-track"><div class="mbar-fill" style="width:${v}%;background:${c}"></div></div>
        </div>`).join("")}
      </div>
      <!-- Eye contact + attention -->
      <div class="grid2" style="margin-bottom:10px">
        ${[["Eye Contact",dEye,dEye>70?"#34d399":dEye>40?"#fbbf24":"#f87171"],["Attention",dAttn,dAttn>70?"#34d399":"#fbbf24"]].map(([l,v,c])=>`
        <div style="background:var(--s2);border-radius:7px;padding:9px;text-align:center">
          <div style="font-size:18px;font-weight:900;color:${c};font-family:'JetBrains Mono',monospace">${v}</div>
          <div style="font-size:8px;color:var(--muted);letter-spacing:1px;text-transform:uppercase;margin:3px 0 5px">${l}</div>
          <div class="mbar-track"><div class="mbar-fill" style="width:${v}%;background:${c}"></div></div>
        </div>`).join("")}
      </div>
      <!-- Emotions -->
      <div style="font-size:8px;color:var(--muted);letter-spacing:1.5px;text-transform:uppercase;font-family:'JetBrains Mono',monospace;margin-bottom:7px">
        Emotions — Dominant: <span style="color:#c084b8;text-transform:capitalize">${emoEmoji2[dDomEmo]||"😐"} ${dDomEmo}</span>
      </div>
      ${dEmoLines}
    </div>

    <!-- VOICE -->
    <div class="dcol" style="border-color:#fbbf2430">
      <div class="mod-hdr" style="border-color:#fbbf24;margin:0 0 10px">
        <span class="mod-hdr-icon">🎙</span>
        <div><div class="mod-hdr-title" style="color:#fbbf24">Voice Analysis</div>
        <div class="mod-hdr-sub">Module 02 · Librosa</div></div>
      </div>
      <!-- 4 top stats -->
      <div class="grid4" style="margin-bottom:10px">
        ${[["Pitch",dPitchHz>0?dPitchHz+"Hz":"—",dToneLabel,dToneColor],["Rate",dWpm+"WPM",dWpmLabel,dWpmColor],["Delivery",dDelivery,dDelivery>75?"Clear":"Review","#fbbf24"],["Pace",dPace,dPace>75?"Good":"Adjust","#a78bfa"]].map(([l,v,sub,c])=>`
        <div class="stat-box" style="border:1px solid ${c}30">
          <div style="font-size:13px;font-weight:900;color:${c};font-family:'JetBrains Mono',monospace;line-height:1.2">${v}</div>
          <div style="font-size:7px;color:var(--muted);letter-spacing:1px;text-transform:uppercase;margin:3px 0">${l}</div>
          <div style="font-size:7.5px;color:${c};background:${c}18;border:1px solid ${c}40;border-radius:3px;padding:1px 5px;display:inline-block">${sub}</div>
        </div>`).join("")}
      </div>
      <!-- Voice bars -->
      <div class="mbar">
        <div class="mbar-header"><span>Speaking Rate</span><span style="color:${dWpmColor};font-family:'JetBrains Mono',monospace;font-weight:700">${dWpm} WPM — ${dWpmLabel}</span></div>
        <div class="mbar-track"><div class="mbar-fill" style="width:${dWpmPct}%;background:linear-gradient(90deg,#34d399 60%,#fbbf24 80%,#f87171)"></div></div>
        <div style="display:flex;justify-content:space-between;font-size:7px;color:var(--muted);margin-top:2px"><span>0</span><span>130 (ideal)</span><span>220+</span></div>
      </div>
      ${[["Pitch Variability",dPitchVar,"#a78bfa","Monotone","Expressive"],["Volume Consistency",dVol,"#34d399","Low","High"],["Pitch Score",dPitchSc,"#818cf8","Poor","Excellent"]].map(([l,v,c,lo,hi])=>`
      <div class="mbar">
        <div class="mbar-header">
          <span>${l}</span>
          <div style="display:flex;align-items:center;gap:5px">
            <span style="font-size:8px;color:${c};background:${c}18;border:1px solid ${c}30;border-radius:3px;padding:1px 5px;font-family:'JetBrains Mono',monospace">
              ${v>66?hi:v>33?"Moderate":lo}
            </span>
            <span style="font-size:9px;color:${c};font-weight:700;font-family:'JetBrains Mono',monospace">${v}/100</span>
          </div>
        </div>
        <div class="mbar-track"><div class="mbar-fill" style="width:${v}%;background:${c}"></div></div>
      </div>`).join("")}
      <div style="margin-top:8px;padding:8px 10px;background:var(--s2);border-radius:7px;border:1px solid var(--b1)">
        <div style="font-size:8px;color:var(--muted);letter-spacing:1.5px;text-transform:uppercase;font-family:'JetBrains Mono',monospace;margin-bottom:4px">Tone Profile</div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          ${[[`${dPitchHz>0?dPitchHz+" Hz":"—"}`,`Mean — ${dToneLabel}`,dToneColor],[`${dPausePct}%`,"Pause Ratio",dPausePct>40?"#fbbf24":"#34d399"]].map(([v,l,c])=>`
          <div><span style="font-size:13px;font-weight:900;color:${c};font-family:'JetBrains Mono',monospace">${v}</span>
          <span style="font-size:8px;color:var(--muted);margin-left:5px">${l}</span></div>`).join("")}
        </div>
      </div>
    </div>
  </div>

  <!-- ROW 3: NLP + Transcript -->
  <div class="grid2">
    <!-- NLP -->
    <div class="dcol" style="border-color:#34d39930">
      <div class="mod-hdr" style="border-color:#34d399;margin:0 0 10px">
        <span class="mod-hdr-icon">💬</span>
        <div><div class="mod-hdr-title" style="color:#34d399">Language & NLP</div>
        <div class="mod-hdr-sub">Module 03 · NLP Engine</div></div>
      </div>
      <div class="grid2" style="gap:6px;margin-bottom:10px">
        ${[["NLP Score",dNlp,dNlp>75?"#34d399":"#fbbf24"],["Vocabulary",dVocab+"%",dVocab>60?"#34d399":"#fbbf24"],["Grammar",dGrammar,dGrammar>70?"#34d399":"#fbbf24"],["Keywords",dKw,dKw>70?"#34d399":"#fbbf24"]].map(([l,v,c])=>`
        <div style="background:var(--s2);border-radius:7px;padding:8px;text-align:center">
          <div style="font-size:16px;font-weight:900;color:${c};font-family:'JetBrains Mono',monospace">${typeof v==="string"?v:v}</div>
          <div style="font-size:7.5px;color:var(--muted);letter-spacing:1px;text-transform:uppercase;margin:2px 0">${l}</div>
        </div>`).join("")}
      </div>
      <div class="mrow" style="margin-bottom:4px">
        <span>Sentiment</span>
        <span class="pill" style="color:${dSentColor};border-color:${dSentColor}40;background:${dSentColor}15">${dSentLabel}</span>
      </div>
      <div class="mrow"><span>Total Words</span><span style="color:#a78bfa;font-family:'JetBrains Mono',monospace;font-weight:700">${wordCount}</span></div>
      <div class="mrow"><span>Filler Words</span><span style="color:${dFillers.length>5?"#f87171":"#34d399"};font-family:'JetBrains Mono',monospace;font-weight:700">${dFillers.length} (${dFillerPct}%)</span></div>
      ${dFillerTags?`<div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:4px">${dFillerTags}</div>`:""}
    </div>
    <!-- Transcript -->
    <div class="dcol">
      <div class="sec-title" style="display:flex;justify-content:space-between;align-items:center">
        <span>📄 Your Answer (Transcript)</span>
        <span style="color:#a78bfa;font-family:'JetBrains Mono',monospace">${wordCount}w</span>
      </div>
      <div class="transcript"><p>${transcript}</p></div>
    </div>
  </div>

  <div class="pg-footer">
    <span>MockAI Interview Coach · AI-Powered Performance Analysis</span>
    <span>Question ${i+1} of ${total} — Page ${i+3} of ${total+2}</span>
  </div>
</div>`;
}).join("")}

<script>window.onload=()=>{ setTimeout(()=>window.print(),400); };</script>
</body>
</html>`;
}
function downloadPDF(sessionResults) {
  const html = buildPDFHTML(sessionResults);
  const win = window.open("","_blank");
  if(!win){ alert("Please allow popups to download the report."); return; }
  win.document.write(html);
  win.document.close();
}

/* ════════════ MODULE SECTION HEADER ════════════════════════════════ */
function ModuleHeader({icon,label,color,module}){
  return <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,
    paddingBottom:10,borderBottom:`1px solid ${color}25`}}>
    <div style={{width:32,height:32,borderRadius:9,background:color+"18",border:`1px solid ${color}35`,
      display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{icon}</div>
    <div>
      <div style={{fontSize:7.5,color,fontWeight:700,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace"}}>{module}</div>
      <div style={{fontSize:13,fontWeight:800,color:P.white}}>{label}</div>
    </div>
  </div>;
}

/* ─── Mini bar inside module cards ─────────────────────────────────── */
function MiniBar({label,value,max=100,unit="",color,note,interpretLow,interpretHigh}){
  const v=sv(value),pct=clamp((v/max)*100,0,100);
  const interp = interpretLow&&interpretHigh ? (v<(max*0.33)?interpretLow:v<(max*0.66)?"Moderate":interpretHigh) : "";
  return <div style={{marginBottom:9}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
      <span style={{fontSize:10.5,color:P.txt}}>{label}</span>
      <div style={{display:"flex",gap:6,alignItems:"center"}}>
        {interp&&<span style={{fontSize:8,color:color||P.muted,background:(color||P.muted)+"18",
          borderRadius:3,padding:"1px 5px",fontFamily:"'DM Mono',monospace"}}>{interp}</span>}
        <span style={{fontSize:10,color:color||P.muted,fontWeight:700,fontFamily:"'DM Mono',monospace"}}>
          {v<10&&unit!=="Hz"?v.toFixed(2):Math.round(v)}{unit}
          {note&&<span style={{color:P.muted,marginLeft:4,fontWeight:400}}>{note}</span>}
        </span>
      </div>
    </div>
    <div style={{background:P.b1,borderRadius:99,height:5,overflow:"hidden"}}>
      <div style={{width:`${pct}%`,height:"100%",borderRadius:99,transition:"width 1.4s cubic-bezier(.16,1,.3,1)",
        background:`linear-gradient(90deg,${(color||P.v4)}80,${color||P.v4})`}}/>
    </div>
  </div>;
}

/* ─── Normalize emotion value (DeepFace returns 0-100 OR 0-1) ──────── */
const normEmo = v => { const n=sv(v); return n>1 ? clamp(n,0,100) : clamp(n*100,0,100); };

/* ─── Emotion pill ──────────────────────────────────────────────────── */
function EmoPill({emotion,value,dominant}){
  const emoColors={happy:P.green,neutral:P.muted,fear:"#f59e0b",angry:P.red,sad:P.indigo,surprise:P.v4,disgust:P.orange};
  const col=emoColors[emotion]||P.muted;
  const pct=normEmo(value);
  return <div style={{marginBottom:7}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
      <div style={{display:"flex",alignItems:"center",gap:6}}>
        <span style={{fontSize:13}}>{emojiEmo(emotion)}</span>
        <span style={{fontSize:10.5,color:dominant?P.white:P.txt,fontWeight:dominant?700:400,textTransform:"capitalize"}}>{emotion}</span>
        {dominant&&<span style={{fontSize:7.5,color:col,background:col+"20",border:`1px solid ${col}40`,
          borderRadius:3,padding:"1px 5px",fontFamily:"'DM Mono',monospace",fontWeight:700}}>DOMINANT</span>}
      </div>
      <span style={{fontSize:10,color:col,fontWeight:700,fontFamily:"'DM Mono',monospace"}}>{pct.toFixed(1)}%</span>
    </div>
    <div style={{background:P.b1,borderRadius:99,height:4,overflow:"hidden"}}>
      <div style={{width:`${pct}%`,height:"100%",background:`linear-gradient(90deg,${col}60,${col})`,borderRadius:99,
        transition:"width 1.4s cubic-bezier(.16,1,.3,1)"}}/>
    </div>
  </div>;
}

/* ════════════ FEEDBACK DETAIL COMPONENT — 5 MODULES ════════════════ */
function FeedbackDetail({feedback,stt,audio,nlp,facial}){
  const [tab,setTab]=useState("overview");
  const fb=so(feedback),dims=sa(fb.dimensions),strengths=sa(fb.strengths);
  const improvements=sa(fb.improvements),tips=sa(fb.tips);
  const grade=ss(fb.grade,"?"),gc=gradeCol(grade);
  const cols=[P.v4,P.indigo,P.green,P.amber,P.rose];

  // ── Audio data ──
  const audioScores=so(so(audio).scores);
  const rhythm=so(so(audio).rhythm);
  const pitchD=so(so(audio).pitch);
  const energyD=so(so(audio).energy);
  const rawWpm=sv(rhythm.estimated_wpm||rhythm.speaking_rate||rhythm.wpm||0);
  const wpm=rawWpm>0?rnd(rawWpm):0;
  const pitchMean=sv(pitchD.mean_hz||pitchD.mean||0);
  const pitchVar=clamp(sv(pitchD.variability||pitchD.std_hz||0),0,100);
  const energy=sv(energyD.mean_energy||energyD.rms_energy||energyD.mean||0);
  const rawPause=sv(rhythm.pause_ratio||rhythm.silence_ratio||0);
  const pauseRatio=rawPause>1?rawPause:rawPause*100; // normalize 0-1 → 0-100
  const deliveryClarity=rnd(audioScores.delivery_clarity||audioScores.clarity||0);
  // Derive paceScore from WPM if API doesn't provide it
  const rawPaceScore=sv(audioScores.pace_score||audioScores.pacing_score||0);
  const paceScore=rawPaceScore>0?rnd(rawPaceScore):(wpm>170?40:wpm>140?88:wpm>90?62:wpm>0?30:50);
  const volumeScore=rnd(audioScores.volume_consistency||audioScores.volume_score||audioScores.volume||60);
  const pitchScore=rnd(audioScores.pitch_score||audioScores.pitch_variation_score||60);
  const toneLabel = pitchMean>220?"High Pitch":pitchMean>150?"Medium Pitch":pitchMean>0?"Low Pitch":"Analysing…";
  const toneColor = pitchMean>220?P.rose:pitchMean>150?P.v4:P.indigo;
  const wpmLabel = wpm===0?"No Data":wpm>170?"Too Fast":wpm>140?"Optimal":wpm>90?"Slightly Slow":"Too Slow";
  const wpmColor = wpm===0?P.muted:wpm>170?P.red:wpm>140?P.green:wpm>90?P.amber:P.red;

  // ── NLP data ──
  const fillers=sa(nlp.filler_words_found);
  const nlpScore=rnd(nlp.nlp_overall_score);
  const vocabRich=sv(nlp.vocabulary_richness||nlp.lexical_diversity||0.5)*100;
  const sentiment=so(nlp.sentiment||nlp.sentiment_scores||{});
  const sentScore=sv(sentiment.compound||sentiment.score||nlp.sentiment_score||0.5);
  const sentLabel=sentScore>0.3?"Positive":sentScore<-0.1?"Negative":"Neutral";
  const sentColor=sentScore>0.3?P.green:sentScore<-0.1?P.red:P.amber;
  const grammarScore=rnd(nlp.grammar_score||nlp.fluency_score||70);
  const keywordScore=rnd(nlp.keyword_relevance||nlp.relevance_score||60);
  const wordCount=sv(stt.word_count);
  const fillerCount=fillers.length;
  const fillerPct=wordCount>0?((fillerCount/wordCount)*100).toFixed(1):0;

  // ── Facial data ──
  const facialData=so(facial);
  const confidence=rnd(facialData.confidence_score||0);
  const eyeContact=rnd(facialData.eye_contact_score||0);
  const attentionScore=rnd(facialData.attention_score||facialData.engagement_score||eyeContact);
  const dominantEmo=ss(facialData.dominant_emotion,"neutral");
  const rawEmotions=so(facialData.emotions||facialData.emotion_scores||{});
  // Normalize emotions: DeepFace may return 0-1 OR 0-100
  const allEmotions=Object.fromEntries(Object.entries(rawEmotions).map(([k,v])=>[k,normEmo(v)]));
  const stressLevel=rnd(facialData.stress_level||facialData.stress_score||(100-confidence)*0.6);
  // Anxiety: use fear emotion if available, else from API
  const fearVal=allEmotions.fear||allEmotions.Fear||0;
  const anxietyLevel=rnd(facialData.anxiety_level||facialData.anxiety_score||fearVal*0.8);
  const composureScore=clamp(100-stressLevel,0,100);
  const stressLabel=stressLevel>65?"High":stressLevel>35?"Moderate":"Low";
  const stressColor=stressLevel>65?P.red:stressLevel>35?P.amber:P.green;
  const anxietyLabel=anxietyLevel>65?"High":anxietyLevel>35?"Moderate":"Low";
  const anxietyColor=anxietyLevel>65?P.red:anxietyLevel>35?P.amber:P.green;

  const TABS=[
    {id:"overview",label:"Overview",icon:"◈"},
    {id:"facial",  label:"Facial",  icon:"👁"},
    {id:"voice",   label:"Voice",   icon:"🎙"},
    {id:"nlp",     label:"Language",icon:"💬"},
    {id:"feedback",label:"Feedback",icon:"📝"},
  ];

  return <div style={{display:"flex",flexDirection:"column",gap:0}}>
    {/* Grade hero */}
    <div style={{background:P.card,border:`1px solid ${gc}35`,borderRadius:14,padding:18,
      display:"grid",gridTemplateColumns:"auto 1fr auto",gap:16,position:"relative",overflow:"hidden",marginBottom:14}}>
      <div style={{position:"absolute",inset:0,background:`radial-gradient(ellipse at 0% 50%,${gc}0d,transparent 60%)`}}/>
      <div style={{textAlign:"center",zIndex:1}}>
        <div style={{fontSize:58,fontWeight:900,fontFamily:"'DM Mono',monospace",color:gc,lineHeight:1,letterSpacing:-3}}>{grade}</div>
        <div style={{fontSize:24,fontWeight:900,color:gc,fontFamily:"'DM Mono',monospace",marginTop:4}}>
          {rnd(fb.overall_score)}<span style={{fontSize:11,color:P.muted,fontWeight:400}}>/100</span>
        </div>
      </div>
      <div style={{zIndex:1}}>
        <div style={{fontSize:13,fontWeight:700,color:P.white,marginBottom:8,lineHeight:1.6}}>{ss(fb.verdict,"—")}</div>
        <div style={{background:P.s2,borderRadius:8,padding:"7px 10px",border:`1px solid ${P.b1}`}}>
          <div style={{fontSize:7.5,color:P.muted,letterSpacing:2,textTransform:"uppercase",marginBottom:3,fontFamily:"'DM Mono',monospace"}}>Priority Focus</div>
          <div style={{fontSize:10.5,color:P.txt,lineHeight:1.6}}>{ss(fb.priority_focus,"—")}</div>
        </div>
      </div>
      {/* Quick stats */}
      <div style={{zIndex:1,display:"flex",flexDirection:"column",gap:6,minWidth:120}}>
        {[["🎙 Voice",deliveryClarity,P.amber],["💬 Language",nlpScore,P.green],["👁 Facial",confidence,P.rose],["⚡ Pace",paceScore,P.v4]].map(([l,v,c])=>(
          <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
            background:P.s2,borderRadius:6,padding:"4px 8px",border:`1px solid ${P.b1}`}}>
            <span style={{fontSize:9,color:P.muted}}>{l}</span>
            <span style={{fontSize:10,fontWeight:700,color:c,fontFamily:"'DM Mono',monospace"}}>{v}</span>
          </div>
        ))}
      </div>
    </div>

    {/* Tab bar */}
    <div style={{display:"flex",gap:4,marginBottom:14,background:P.s2,borderRadius:11,padding:4,border:`1px solid ${P.b1}`}}>
      {TABS.map(t=>(
        <button key={t.id} onClick={()=>setTab(t.id)} style={{
          flex:1,padding:"7px 6px",borderRadius:8,border:"none",cursor:"pointer",
          background:tab===t.id?P.v2:"transparent",
          color:tab===t.id?"#fff":P.muted,
          fontSize:10,fontWeight:tab===t.id?700:500,
          transition:"all .2s",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
          <span>{t.icon}</span><span style={{display:tab===t.id?"inline":"none"}}>{t.label}</span>
          {tab!==t.id&&<span style={{display:"none"}}>{t.label}</span>}
        </button>
      ))}
    </div>

    {/* ── OVERVIEW TAB ─────────────────────────────────────────────── */}
    {tab==="overview"&&<div style={{display:"flex",flexDirection:"column",gap:12}}>
      {/* Radar + dims */}
      <div style={{display:"grid",gridTemplateColumns:"240px 1fr",gap:12}}>
        <Card accent={P.v2} style={{display:"flex",alignItems:"center",justifyContent:"center",padding:10}}>
          <RadarChart dimensions={dims}/>
        </Card>
        <Card><SHead icon="◈" text="Performance Dimensions"/>
          {dims.map((d,i)=><div key={i} style={{marginBottom:11}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
              <span style={{fontSize:10.5,color:P.txt,fontWeight:600}}>{ss(d.label)}</span>
              <span style={{color:gradeCol(ss(d.grade)),fontWeight:800,fontSize:10,fontFamily:"'DM Mono',monospace"}}>{ss(d.grade)} · {rnd(d.score)}/100</span>
            </div>
            <div style={{background:P.b1,borderRadius:99,height:4,overflow:"hidden",marginBottom:3}}>
              <div style={{width:`${clamp(sv(d.score),0,100)}%`,height:"100%",
                background:`linear-gradient(90deg,${cols[i%5]}80,${cols[i%5]})`,
                borderRadius:99,transition:"width 1.4s cubic-bezier(.16,1,.3,1)"}}/>
            </div>
            <div style={{fontSize:9,color:P.muted,lineHeight:1.5}}>{ss(d.feedback)}</div>
          </div>)}
        </Card>
      </div>
      {/* 4 mini module summaries */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:10}}>
        {[
          {icon:"👁",label:"Facial",color:P.rose,items:[["Confidence",confidence+"%"],["Stress",stressLabel],["Anxiety",anxietyLabel],["Eye Contact",eyeContact+"%"]]},
          {icon:"🎙",label:"Voice",color:P.amber,items:[["Pitch",toneLabel],["WPM",wpm+" ("+wpmLabel+")"],["Delivery",deliveryClarity+"/100"],["Pace",paceScore+"/100"]]},
          {icon:"💬",label:"Language",color:P.green,items:[["NLP Score",nlpScore+"/100"],["Vocabulary",vocabRich.toFixed(0)+"%"],["Sentiment",sentLabel],["Fillers",fillerCount+" words"]]},
          {icon:"📝",label:"Feedback",color:P.v4,items:[["Grade",grade],["Score",rnd(fb.overall_score)+"/100"],["Strengths",sa(strengths).length+" found"],["Tips",sa(tips).length+" given"]]},
        ].map(mod=>(
          <div key={mod.label} style={{background:P.card,border:`1px solid ${mod.color}25`,borderRadius:12,padding:12,position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${mod.color},transparent)`}}/>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
              <span style={{fontSize:14}}>{mod.icon}</span>
              <span style={{fontSize:11,fontWeight:700,color:mod.color}}>{mod.label}</span>
            </div>
            {mod.items.map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",borderBottom:`1px solid ${P.b1}`}}>
                <span style={{fontSize:9,color:P.muted}}>{k}</span>
                <span style={{fontSize:9,color:P.white,fontWeight:600,fontFamily:"'DM Mono',monospace",textTransform:"capitalize",maxWidth:90,textAlign:"right"}}>{v}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
      {/* Transcript */}
      <Card style={{padding:14}}>
        <div style={{fontSize:8,color:P.muted,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:8,
          display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span>Your Answer (Transcript)</span>
          <span style={{color:P.v4}}>{wordCount} words</span>
        </div>
        <div style={{fontSize:11,color:P.v4,lineHeight:1.9,fontStyle:"italic",
          background:P.s1,borderRadius:8,padding:12,border:`1px solid ${P.b1}`}}>
          {ss(stt.transcript,"No transcript available.")}
        </div>
      </Card>
    </div>}

    {/* ── FACIAL ANALYSIS TAB ──────────────────────────────────────── */}
    {tab==="facial"&&<div style={{display:"flex",flexDirection:"column",gap:12}}>
      <Card accent={P.rose}>
        <ModuleHeader icon="👁" label="Facial Expression Analysis" color={P.rose} module="Module 04 · DeepFace"/>
        {/* Big 3 scores */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}>
          {[["Confidence",confidence,P.green,"How assured you appear on camera"],
            ["Stress Level",stressLevel,stressColor,"Tension detected from facial cues"],
            ["Anxiety",anxietyLevel,anxietyColor,"Nervousness signals in expressions"]].map(([l,v,c,desc])=>(
            <div key={l} style={{background:P.s2,borderRadius:10,padding:14,border:`1px solid ${c}30`,textAlign:"center"}}>
              <div style={{fontSize:32,fontWeight:900,color:c,fontFamily:"'DM Mono',monospace",lineHeight:1}}>{v}</div>
              <div style={{fontSize:8,color:P.muted,marginTop:2,letterSpacing:1,textTransform:"uppercase",marginBottom:6}}>{l}</div>
              <div style={{background:P.b1,borderRadius:99,height:4,overflow:"hidden",marginBottom:6}}>
                <div style={{width:`${v}%`,height:"100%",background:c,borderRadius:99}}/>
              </div>
              <div style={{fontSize:8.5,color:P.muted,lineHeight:1.5}}>{desc}</div>
            </div>
          ))}
        </div>
        {/* More metrics */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
          <div style={{background:P.s2,borderRadius:10,padding:12,border:`1px solid ${P.b1}`}}>
            <div style={{fontSize:8,color:P.muted,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:10}}>Presence Metrics</div>
            <MiniBar label="Eye Contact" value={eyeContact} color={P.green} interpretLow="Avoiding" interpretHigh="Strong"/>
            <MiniBar label="Attention Score" value={attentionScore} color={P.v4} interpretLow="Distracted" interpretHigh="Focused"/>
            <MiniBar label="Composure" value={composureScore} color={P.indigo} interpretLow="Agitated" interpretHigh="Composed"/>
            <div style={{marginTop:10,padding:"8px 10px",background:P.card,borderRadius:8,border:`1px solid ${P.b1}`}}>
              <div style={{fontSize:8,color:P.muted,letterSpacing:1.5,textTransform:"uppercase",marginBottom:4,fontFamily:"'DM Mono',monospace"}}>Stress Indicator</div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{flex:1,background:P.b1,borderRadius:99,height:8,overflow:"hidden"}}>
                  <div style={{width:`${stressLevel}%`,height:"100%",borderRadius:99,
                    background:`linear-gradient(90deg,${P.green},${P.amber} 50%,${P.red})`}}/>
                </div>
                <span style={{fontSize:11,color:stressColor,fontWeight:800,fontFamily:"'DM Mono',monospace",minWidth:50}}>{stressLabel}</span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:3}}>
                <span style={{fontSize:7.5,color:P.green}}>Low</span>
                <span style={{fontSize:7.5,color:P.amber}}>Moderate</span>
                <span style={{fontSize:7.5,color:P.red}}>High</span>
              </div>
            </div>
          </div>
          <div style={{background:P.s2,borderRadius:10,padding:12,border:`1px solid ${P.b1}`}}>
            <div style={{fontSize:8,color:P.muted,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:10}}>
              Dominant Emotion: <span style={{color:P.white,textTransform:"capitalize"}}>{dominantEmo} {emojiEmo(dominantEmo)}</span>
            </div>
            {Object.keys(allEmotions).length>0
              ? Object.entries(allEmotions).sort((a,b)=>sv(b[1])-sv(a[1])).map(([emo,val])=>(
                  <EmoPill key={emo} emotion={emo} value={val} dominant={emo===dominantEmo}/>
                ))
              : [["happy",0.1],["neutral",0.6],["fear",0.05],["angry",0.02],["sad",0.05],["surprise",0.08],["disgust",0.1]].map(([emo,val])=>(
                  <EmoPill key={emo} emotion={emo} value={val} dominant={emo===dominantEmo}/>
                ))
            }
          </div>
        </div>
        {/* Interpretation */}
        <div style={{background:P.s2,borderRadius:10,padding:12,border:`1px solid ${P.rose}20`}}>
          <div style={{fontSize:8,color:P.muted,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:8}}>Facial Interpretation</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {[
              {label:"Confidence Level", value:confidence>70?"You appear confident and assured on camera.":confidence>40?"Moderate confidence — slightly unsure body language.":"Low confidence detected. Try to maintain steady eye contact.",color:confidence>70?P.green:confidence>40?P.amber:P.red},
              {label:"Stress Reading",   value:stressLevel<35?"Calm and relaxed. Ideal interview composure.":stressLevel<65?"Some tension visible. Deep breathing may help.":"High stress visible in facial muscles. Practice relaxation.",color:stressColor},
              {label:"Anxiety Signal",   value:anxietyLevel<35?"Minimal anxiety signals detected.":anxietyLevel<65?"Mild anxiety present — manageable with practice.":"Noticeable anxiety. Preparation reduces interview nerves.",color:anxietyColor},
              {label:"Eye Contact",      value:eyeContact>70?"Excellent eye contact — very engaging.":eyeContact>40?"Average eye contact. Try looking directly at camera.":"Low eye contact. Focus on maintaining camera gaze.",color:eyeContact>70?P.green:eyeContact>40?P.amber:P.red},
            ].map(({label,value,color})=>(
              <div key={label} style={{background:P.card,borderRadius:8,padding:"9px 11px",border:`1px solid ${color}25`}}>
                <div style={{fontSize:8.5,color,fontWeight:700,marginBottom:4,letterSpacing:0.5}}>{label}</div>
                <div style={{fontSize:10.5,color:P.txt,lineHeight:1.6}}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>}

    {/* ── VOICE ANALYSIS TAB ───────────────────────────────────────── */}
    {tab==="voice"&&<div style={{display:"flex",flexDirection:"column",gap:12}}>
      <Card accent={P.amber}>
        <ModuleHeader icon="🎙" label="Voice & Audio Analysis" color={P.amber} module="Module 02 · Librosa"/>
        {/* Big pitch/tone/WPM cards */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:10,marginBottom:16}}>
          {[
            {label:"Pitch",val:pitchMean>0?Math.round(pitchMean)+"Hz":"—",sub:toneLabel,col:toneColor,desc:"Mean fundamental frequency"},
            {label:"Speaking Rate",val:wpm+" WPM",sub:wpmLabel,col:wpmColor,desc:"Words per minute (ideal: 130–160)"},
            {label:"Delivery",val:deliveryClarity+"/100",sub:deliveryClarity>75?"Clear":"Needs Work",col:deliveryClarity>75?P.green:P.amber,desc:"Voice clarity & articulation"},
            {label:"Pace Score",val:paceScore+"/100",sub:paceScore>75?"Good Pace":"Adjust Pace",col:paceScore>75?P.green:P.amber,desc:"Rhythm consistency"},
          ].map(({label,val,sub,col,desc})=>(
            <div key={label} style={{background:P.s2,borderRadius:10,padding:12,border:`1px solid ${col}30`,textAlign:"center"}}>
              <div style={{fontSize:20,fontWeight:900,color:col,fontFamily:"'DM Mono',monospace",lineHeight:1.2,marginBottom:2}}>{val}</div>
              <div style={{fontSize:8,color:P.muted,letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>{label}</div>
              <div style={{background:col+"20",border:`1px solid ${col}40`,borderRadius:4,padding:"2px 6px",display:"inline-block",marginBottom:6}}>
                <span style={{fontSize:8,color:col,fontWeight:700}}>{sub}</span>
              </div>
              <div style={{fontSize:8.5,color:P.muted,lineHeight:1.5}}>{desc}</div>
            </div>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          {/* Voice metrics */}
          <div style={{background:P.s2,borderRadius:10,padding:12,border:`1px solid ${P.b1}`}}>
            <div style={{fontSize:8,color:P.muted,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:10}}>Voice Metrics</div>
            <MiniBar label="Pitch Variability" value={pitchVar} max={100} color={P.v4} unit="" interpretLow="Monotone" interpretHigh="Expressive"
              note={pitchVar>60?"Good variation":pitchVar>30?"Some variation":"Very flat"}/>
            <MiniBar label="Volume Consistency" value={volumeScore} color={P.green} interpretLow="Inconsistent" interpretHigh="Consistent"/>
            <MiniBar label="Pitch Score" value={pitchScore} color={P.indigo} interpretLow="Poor" interpretHigh="Excellent"/>
            <MiniBar label="Energy / Enthusiasm" value={clamp(energy*1000,0,100)} color={P.amber} interpretLow="Low Energy" interpretHigh="High Energy"/>
            <div style={{marginTop:10,padding:"8px 10px",background:P.card,borderRadius:8,border:`1px solid ${P.b1}`}}>
              <div style={{fontSize:8,color:P.muted,letterSpacing:1.5,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:6}}>Pitch Profile</div>
              <div style={{display:"flex",justifyContent:"space-between",padding:"3px 0",borderBottom:`1px solid ${P.b1}`}}>
                <span style={{fontSize:10,color:P.muted}}>Mean Frequency</span>
                <span style={{fontSize:10,color:toneColor,fontWeight:700,fontFamily:"'DM Mono',monospace"}}>{pitchMean>0?Math.round(pitchMean)+" Hz":"N/A"}</span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",padding:"3px 0",borderBottom:`1px solid ${P.b1}`}}>
                <span style={{fontSize:10,color:P.muted}}>Tone Category</span>
                <span style={{fontSize:10,color:toneColor,fontWeight:700,fontFamily:"'DM Mono',monospace"}}>{toneLabel}</span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",padding:"3px 0"}}>
                <span style={{fontSize:10,color:P.muted}}>Typical Range</span>
                <span style={{fontSize:10,color:P.muted,fontFamily:"'DM Mono',monospace"}}>Male: 85–180Hz · Female: 165–255Hz</span>
              </div>
            </div>
          </div>
          {/* Rhythm & Pacing */}
          <div style={{background:P.s2,borderRadius:10,padding:12,border:`1px solid ${P.b1}`}}>
            <div style={{fontSize:8,color:P.muted,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:10}}>Rhythm & Pacing</div>
            <MiniBar label="Speaking Rate" value={clamp(wpm,60,200)} max={200} unit=" WPM" color={wpmColor}
              note={wpmLabel}/>
            <MiniBar label="Pause Ratio" value={pauseRatio} max={100} unit="%" color={pauseRatio>40?P.amber:P.green}
              interpretLow="Too Few Pauses" interpretHigh="Too Many Pauses"
              note={pauseRatio>40?"Too Many":pauseRatio>15?"Balanced":"Too Few"}/>
            <div style={{marginTop:10,display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {[[wpm+" WPM","Speaking Rate",wpmColor],[pauseRatio.toFixed(0)+"%","Pause Ratio",pauseRatio>40?P.amber:P.green],
                [wordCount+" words","Total Spoken",P.v4],[Math.round(wordCount/Math.max(1,60))+" w/s","Word Density",P.indigo]].map(([v,l,c])=>(
                <div key={l} style={{background:P.card,borderRadius:7,padding:"8px 10px",border:`1px solid ${P.b1}`,textAlign:"center"}}>
                  <div style={{fontSize:16,fontWeight:900,color:c,fontFamily:"'DM Mono',monospace",lineHeight:1.2}}>{v}</div>
                  <div style={{fontSize:8,color:P.muted,letterSpacing:1,textTransform:"uppercase",marginTop:2}}>{l}</div>
                </div>
              ))}
            </div>
            <div style={{marginTop:10,padding:"8px 10px",background:P.card,borderRadius:8,border:`1px solid ${P.b1}`}}>
              <div style={{fontSize:8,color:P.muted,letterSpacing:1.5,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:6}}>Pacing Interpretation</div>
              <div style={{fontSize:10.5,color:P.txt,lineHeight:1.7}}>
                {wpm>170?"You're speaking too fast. Slow down to improve clarity and allow the interviewer to absorb information.":
                 wpm>140?"Your speaking pace is ideal. This range is optimal for professional communication.":
                 wpm>90?"You're speaking slightly slow. A bit more energy and pace would improve engagement.":
                 "Very slow pace detected. Aim for 130–160 WPM for natural conversational speech."}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>}

    {/* ── LANGUAGE / NLP TAB ───────────────────────────────────────── */}
    {tab==="nlp"&&<div style={{display:"flex",flexDirection:"column",gap:12}}>
      <Card accent={P.green}>
        <ModuleHeader icon="💬" label="Language & NLP Analysis" color={P.green} module="Module 03 · NLP Engine"/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <div>
            {/* Scores */}
            <div style={{background:P.s2,borderRadius:10,padding:12,border:`1px solid ${P.b1}`,marginBottom:10}}>
              <div style={{fontSize:8,color:P.muted,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:10}}>Language Scores</div>
              <MiniBar label="Overall NLP Score"   value={nlpScore} color={scoreCol(nlpScore)}/>
              <MiniBar label="Vocabulary Richness" value={vocabRich} color={vocabRich>60?P.green:P.amber} unit="%" interpretLow="Basic" interpretHigh="Advanced"/>
              <MiniBar label="Grammar & Fluency"   value={grammarScore} color={grammarScore>70?P.green:P.amber} interpretLow="Poor" interpretHigh="Excellent"/>
              <MiniBar label="Keyword Relevance"   value={keywordScore} color={keywordScore>70?P.green:P.amber} interpretLow="Off-topic" interpretHigh="On-point"/>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:`1px solid ${P.b1}`}}>
                <span style={{fontSize:10.5,color:P.txt}}>Sentiment</span>
                <span style={{fontSize:10,color:sentColor,fontWeight:700,background:sentColor+"18",border:`1px solid ${sentColor}30`,borderRadius:4,padding:"2px 8px",fontFamily:"'DM Mono',monospace"}}>{sentLabel}</span>
              </div>
            </div>
            {/* Word stats */}
            <div style={{background:P.s2,borderRadius:10,padding:12,border:`1px solid ${P.b1}`}}>
              <div style={{fontSize:8,color:P.muted,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:10}}>Word Statistics</div>
              {[[wordCount+" words","Total Word Count",P.v4],[fillerCount+" words","Filler Word Count",fillerCount>5?P.red:P.green],[fillerPct+"%","Filler Word Rate",fillerPct>5?P.red:P.green],[Math.round(wordCount/Math.max(1,10))+" avg","Words Per Sentence",P.indigo]].map(([v,l,c])=>(
                <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`1px solid ${P.b1}`}}>
                  <span style={{fontSize:10,color:P.muted}}>{l}</span>
                  <span style={{fontSize:10,color:c,fontWeight:700,fontFamily:"'DM Mono',monospace"}}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            {/* Filler words */}
            <div style={{background:P.s2,borderRadius:10,padding:12,border:`1px solid ${P.b1}`,marginBottom:10}}>
              <div style={{fontSize:8,color:P.muted,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:8,
                display:"flex",justifyContent:"space-between"}}>
                <span>Filler Words Detected</span>
                <span style={{color:fillerCount>5?P.red:P.green}}>{fillerCount} found</span>
              </div>
              {fillers.length>0
                ? <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                    {[...new Set(fillers)].map((f,i)=>{
                      const cnt=fillers.filter(x=>x===f).length;
                      return <span key={i} style={{background:P.red+"18",border:`1px solid ${P.red}30`,borderRadius:5,
                        padding:"3px 8px",fontSize:9.5,color:P.red,fontFamily:"'DM Mono',monospace"}}>
                        "{f}" ×{cnt}
                      </span>;
                    })}
                  </div>
                : <div style={{fontSize:10.5,color:P.green,padding:"6px 0"}}>✓ No filler words detected — excellent!</div>
              }
              {fillerCount>0&&<div style={{marginTop:10,fontSize:10,color:P.muted,lineHeight:1.7,
                background:P.card,borderRadius:7,padding:"8px 10px",border:`1px solid ${P.b1}`}}>
                {fillerCount>10?"High filler word usage. Record yourself and practice pausing instead of using filler words.":
                 fillerCount>4?"Moderate filler words. Replace 'um/uh' with confident pauses.":"Low filler word usage — you spoke fluently!"}
              </div>}
            </div>
            {/* Transcript */}
            <div style={{background:P.s2,borderRadius:10,padding:12,border:`1px solid ${P.b1}`}}>
              <div style={{fontSize:8,color:P.muted,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:8}}>Full Transcript</div>
              <div style={{fontSize:10.5,color:P.v4,lineHeight:1.8,fontStyle:"italic",maxHeight:140,overflowY:"auto"}}>
                {ss(stt.transcript,"No transcript available.")}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>}

    {/* ── FEEDBACK TAB ─────────────────────────────────────────────── */}
    {tab==="feedback"&&<div style={{display:"flex",flexDirection:"column",gap:12}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Card accent={P.green}><SHead icon="✓" text="Strengths" badge={strengths.length}/>
          {strengths.length?strengths.map((s,i)=>(
            <div key={i} style={{display:"flex",gap:9,padding:"7px 9px",background:P.green+"0a",borderRadius:7,border:`1px solid ${P.green}20`,marginBottom:6}}>
              <span style={{color:P.green,fontSize:10,flexShrink:0,fontWeight:800,marginTop:1}}>✓</span>
              <span style={{fontSize:10.5,color:P.txt,lineHeight:1.6}}>{s}</span>
            </div>
          )):<div style={{fontSize:10.5,color:P.muted,padding:"6px 0"}}>No strengths recorded.</div>}
        </Card>
        <Card accent={P.orange}><SHead icon="↗" text="Areas to Improve" badge={improvements.length}/>
          {improvements.length?improvements.map((s,i)=>(
            <div key={i} style={{display:"flex",gap:9,padding:"7px 9px",background:P.orange+"0a",borderRadius:7,border:`1px solid ${P.orange}20`,marginBottom:6}}>
              <span style={{color:P.orange,fontSize:10,flexShrink:0,fontWeight:800,marginTop:1}}>→</span>
              <span style={{fontSize:10.5,color:P.txt,lineHeight:1.6}}>{s}</span>
            </div>
          )):<div style={{fontSize:10.5,color:P.muted,padding:"6px 0"}}>No improvements listed.</div>}
        </Card>
      </div>
      {tips.length>0&&<Card accent={P.v2}><SHead icon="◎" text="Actionable Tips" badge={tips.length}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {tips.map((tip,i)=>(
            <div key={i} style={{display:"flex",gap:9,padding:"9px 11px",background:P.vglow,borderRadius:8,border:`1px solid ${P.b2}`}}>
              <span style={{color:P.v4,fontFamily:"'DM Mono',monospace",fontSize:10,flexShrink:0,fontWeight:800,minWidth:20}}>{String(i+1).padStart(2,"0")}</span>
              <span style={{fontSize:10.5,color:P.txt,lineHeight:1.6}}>{tip}</span>
            </div>
          ))}
        </div>
      </Card>}
    </div>}
  </div>;
}

/* ════════════ SESSION REPORT VIEW ══════════════════════════════════ */
function SessionReport({sessionResults,onReset}){
  const [expandedQ, setExpandedQ] = useState(0);
  const total = sessionResults.length;
  const avgScore = Math.round(sessionResults.reduce((a,r)=>a+sv(so(so(r.result).feedback).overall_score),0)/total);
  const sessionGrade = avgScore>=90?"A+":avgScore>=80?"A":avgScore>=70?"B":avgScore>=60?"C":avgScore>=50?"D":"F";
  const gc = gradeCol(sessionGrade);

  const catGroups = ["Machine Learning","Technical","Behavioral","Aptitude"].map(cat=>{
    const qs = sessionResults.filter(r=>r.category===cat);
    if(!qs.length) return null;
    const avg = Math.round(qs.reduce((a,r)=>a+sv(so(so(r.result).feedback).overall_score),0)/qs.length);
    return {cat,avg,count:qs.length};
  }).filter(Boolean);

  const dimNames = ["Content Relevance","Language Quality","Voice Delivery","Facial Presence","Speech Fluency"];
  const dimAvgs = dimNames.map(name=>{
    const vals=sessionResults.map(r=>{const d=sa(so(so(r.result).feedback).dimensions).find(d=>d.label===name);return d?sv(d.score):0;});
    return {name,avg:Math.round(vals.reduce((a,b)=>a+b,0)/vals.length)};
  });
  const best=dimAvgs.reduce((a,b)=>b.avg>a.avg?b:a);
  const worst=dimAvgs.reduce((a,b)=>b.avg<a.avg?b:a);

  return(
    <div style={{height:"100vh",background:P.bg,color:P.txt,display:"flex",flexDirection:"column",
      fontFamily:"'Outfit','Segoe UI',system-ui,sans-serif",overflow:"hidden"}}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,
        background:`radial-gradient(ellipse 60% 40% at 15% 0%,${P.v1}18,transparent),radial-gradient(ellipse 40% 30% at 85% 100%,${P.v2}0e,transparent)`}}/>

      {/* Header */}
      <header style={{position:"relative",zIndex:10,flexShrink:0,background:P.s1+"ee",
        borderBottom:`1px solid ${P.b1}`,padding:"0 24px",display:"flex",
        alignItems:"center",justifyContent:"space-between",height:54,backdropFilter:"blur(12px)"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:32,height:32,borderRadius:9,background:`linear-gradient(135deg,${P.v1},${P.v2})`,
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>🎯</div>
          <div>
            <div style={{fontSize:15,fontWeight:800,color:P.white,letterSpacing:-0.3}}>
              Interview Complete
              <span style={{fontWeight:400,color:P.muted,fontSize:13}}> · {total}/10 Questions</span>
            </div>
            <div style={{fontSize:8,color:P.muted,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace"}}>
              MockAI Session Report
            </div>
          </div>
        </div>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <button onClick={()=>downloadPDF(sessionResults)} style={{
            background:`linear-gradient(135deg,${P.v1},${P.v2})`,border:"none",color:"#fff",
            borderRadius:10,padding:"9px 20px",fontSize:12,fontWeight:700,cursor:"pointer",
            display:"flex",alignItems:"center",gap:8,boxShadow:`0 4px 20px ${P.v2}40`}}>
            <span style={{fontSize:15}}>⬇</span> Download PDF Report
          </button>
          <button onClick={onReset} style={{background:"transparent",border:`1px solid ${P.b2}`,
            color:P.muted,borderRadius:10,padding:"9px 16px",fontSize:12,cursor:"pointer"}}>
            ↺ New Session
          </button>
        </div>
      </header>

      <div style={{position:"relative",zIndex:1,flex:1,display:"grid",
        gridTemplateColumns:"380px 1fr",overflow:"hidden"}}>

        {/* Left: score summary + question list */}
        <div style={{borderRight:`1px solid ${P.b1}`,display:"flex",flexDirection:"column",overflow:"hidden",background:P.s1+"88"}}>

          {/* Session hero */}
          <div style={{padding:"20px 18px",borderBottom:`1px solid ${P.b1}`,flexShrink:0,
            background:P.card,position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",inset:0,background:`radial-gradient(ellipse at 0% 50%,${gc}0e,transparent 60%)`,pointerEvents:"none"}}/>
            <div style={{display:"flex",gap:20,alignItems:"center",position:"relative",zIndex:1,marginBottom:16}}>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:68,fontWeight:900,fontFamily:"'DM Mono',monospace",color:gc,lineHeight:1,letterSpacing:-3}}>{sessionGrade}</div>
                <div style={{fontSize:8,color:P.muted,marginTop:2,letterSpacing:2,textTransform:"uppercase"}}>grade</div>
              </div>
              <div>
                <div style={{fontSize:34,fontWeight:900,color:gc,fontFamily:"'DM Mono',monospace",lineHeight:1}}>
                  {avgScore}<span style={{fontSize:14,color:P.muted,fontWeight:400}}>/100</span>
                </div>
                <div style={{fontSize:9,color:P.muted,marginTop:4}}>average score across {total} questions</div>
                <div style={{display:"flex",gap:10,marginTop:12,flexWrap:"wrap"}}>
                  <div style={{background:P.green+"12",border:`1px solid ${P.green}25`,borderRadius:8,padding:"7px 12px"}}>
                    <div style={{fontSize:8,color:P.green,letterSpacing:1.5,textTransform:"uppercase",fontWeight:700,marginBottom:2}}>Strongest</div>
                    <div style={{fontSize:12,color:P.white,fontWeight:700}}>{best.name}</div>
                    <div style={{fontSize:10,color:P.green,fontFamily:"'DM Mono',monospace"}}>{best.avg}/100</div>
                  </div>
                  <div style={{background:P.orange+"12",border:`1px solid ${P.orange}25`,borderRadius:8,padding:"7px 12px"}}>
                    <div style={{fontSize:8,color:P.orange,letterSpacing:1.5,textTransform:"uppercase",fontWeight:700,marginBottom:2}}>Focus On</div>
                    <div style={{fontSize:12,color:P.white,fontWeight:700}}>{worst.name}</div>
                    <div style={{fontSize:10,color:P.orange,fontFamily:"'DM Mono',monospace"}}>{worst.avg}/100</div>
                  </div>
                </div>
              </div>
            </div>
            {/* Category breakdown */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,position:"relative",zIndex:1}}>
              {catGroups.map(({cat,avg,count})=>{
                const cc=catColor(cat);
                return <div key={cat} style={{background:P.s2,border:`1px solid ${cc}25`,borderRadius:9,padding:"9px 12px"}}>
                  <div style={{fontSize:8,color:cc,fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>{cat}</div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{fontSize:18,fontWeight:900,color:cc,fontFamily:"'DM Mono',monospace"}}>{avg}</div>
                    <div style={{fontSize:8.5,color:P.muted}}>{count}q</div>
                  </div>
                  <div style={{background:P.b1,borderRadius:99,height:3,overflow:"hidden",marginTop:6}}>
                    <div style={{width:`${avg}%`,height:"100%",background:cc,borderRadius:99}}/>
                  </div>
                </div>;
              })}
            </div>
          </div>

          {/* Question list */}
          <div style={{flex:1,overflowY:"auto",padding:"10px 12px",display:"flex",flexDirection:"column",gap:6}}>
            <div style={{fontSize:9,color:P.muted,letterSpacing:2,textTransform:"uppercase",
              padding:"8px 4px 4px",fontFamily:"'DM Mono',monospace"}}>Click to review each answer</div>
            {sessionResults.map((r,i)=>{
              const fb=so(so(r.result).feedback);
              const grade=ss(fb.grade,"?"),score=rnd(fb.overall_score);
              const gc2=gradeCol(grade),cc=catColor(r.category);
              const sel=expandedQ===i;
              return <div key={i} onClick={()=>setExpandedQ(sel?null:i)} style={{
                background:sel?P.vglow:P.card,border:`1px solid ${sel?P.v2+"60":P.b1}`,
                borderRadius:11,padding:"10px 13px",cursor:"pointer",transition:"all .2s",
                position:"relative",overflow:"hidden"}}>
                {sel&&<div style={{position:"absolute",left:0,top:0,bottom:0,width:3,
                  background:`linear-gradient(180deg,${P.v2},${P.v4})`,borderRadius:"3px 0 0 3px"}}/>}
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                  <div style={{flex:1,paddingLeft:sel?7:0}}>
                    <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:5}}>
                      <span style={{fontSize:9,color:P.muted,fontFamily:"'DM Mono',monospace",fontWeight:700}}>Q{i+1}</span>
                      <Tag color={cc}>{r.category}</Tag>
                    </div>
                    <div style={{fontSize:11,color:sel?P.white:P.txt,lineHeight:1.5,fontWeight:sel?600:400}}>{r.question}</div>
                  </div>
                  <div style={{textAlign:"center",flexShrink:0}}>
                    <div style={{fontSize:20,fontWeight:900,color:gc2,fontFamily:"'DM Mono',monospace"}}>{grade}</div>
                    <div style={{fontSize:9,color:gc2,fontFamily:"'DM Mono',monospace"}}>{score}</div>
                  </div>
                </div>
                {/* Mini score bars */}
                <div style={{display:"flex",gap:8,marginTop:8,paddingLeft:sel?7:0}}>
                  {[["D",rnd(so(so(so(r.result).audio).scores).delivery_clarity),P.amber],
                    ["L",rnd(so(so(r.result).nlp).nlp_overall_score),P.green],
                    ["F",rnd(so(so(r.result).facial).confidence_score),P.rose]].map(([l,v,col])=>(
                    <div key={l} style={{display:"flex",alignItems:"center",gap:4}}>
                      <span style={{fontSize:8,color:P.muted,fontFamily:"'DM Mono',monospace"}}>{l}</span>
                      <div style={{background:P.b1,borderRadius:99,height:3,width:36,overflow:"hidden"}}>
                        <div style={{width:`${v}%`,height:"100%",background:col,borderRadius:99}}/>
                      </div>
                      <span style={{fontSize:8.5,color:col,fontFamily:"'DM Mono',monospace",fontWeight:700}}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>;
            })}
          </div>
        </div>

        {/* Right: detailed feedback for selected question */}
        <div style={{display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{padding:"12px 18px 10px",borderBottom:`1px solid ${P.b1}`,flexShrink:0,
            display:"flex",justifyContent:"space-between",alignItems:"center",background:P.s1+"88"}}>
            <div>
              <div style={{fontSize:9,color:P.muted,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:2}}>
                {expandedQ!==null?`Q${expandedQ+1} of ${total} — Detailed Analysis`:"Select a question"}
              </div>
              {expandedQ!==null&&<div style={{fontSize:13,fontWeight:700,color:P.white,lineHeight:1.5}}>
                {sessionResults[expandedQ]?.question}
              </div>}
            </div>
            {expandedQ!==null&&expandedQ<total-1&&(
              <button onClick={()=>setExpandedQ(expandedQ+1)} style={{background:P.vglow,
                border:`1px solid ${P.v2}50`,color:P.v4,borderRadius:8,padding:"7px 14px",
                fontSize:11,fontWeight:700,cursor:"pointer"}}>
                Next Q →
              </button>
            )}
          </div>
          <div style={{flex:1,overflowY:"auto",padding:18}}>
            {expandedQ!==null&&sessionResults[expandedQ]?(()=>{
              const r=sessionResults[expandedQ];
              return <FeedbackDetail
                feedback={so(so(r.result).feedback)}
                stt={so(so(r.result).stt)}
                audio={so(so(r.result).audio)}
                nlp={so(so(r.result).nlp)}
                facial={so(so(r.result).facial)}
              />;
            })():(
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
                height:"100%",gap:12,color:P.muted}}>
                <div style={{fontSize:40}}>📊</div>
                <div style={{fontSize:13,fontWeight:600,color:P.white}}>Select a question to review</div>
                <div style={{fontSize:11,color:P.muted}}>Click any question on the left</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pip{0%,100%{opacity:1;}50%{opacity:.3;}}
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:3px;}::-webkit-scrollbar-track{background:${P.bg};}
        ::-webkit-scrollbar-thumb{background:${P.b2};border-radius:3px;}::-webkit-scrollbar-thumb:hover{background:${P.v1};}
        button{font-family:inherit;transition:opacity .15s,transform .1s;}button:hover{opacity:.82;}button:active{transform:scale(.97);}
      `}</style>
    </div>
  );
}

/* ════════════ MAIN APP ══════════════════════════════════════════════ */
export default function App(){
  const [status,   setStatus]   = useState("idle");
  const [recTime,  setRecTime]  = useState(0);
  const [blob,     setBlob]     = useState(null);
  const [err,      setErr]      = useState("");
  const [backend,  setBackend]  = useState(null);
  const [analyser, setAnalyser] = useState(null);
  const [loadStep, setLoad]     = useState("");
  const [selQ,     setSelQ]     = useState(QUESTIONS[0]);
  const [liveEmo,  setLiveEmo]  = useState(null);
  const [frames,   setFrames]   = useState(0);
  const [camOk,    setCamOk]    = useState(false);
  const [sessionResults,setSessionResults] = useState([]); // [{qId,question,category,result}]
  const [sessionDone,setSessionDone]       = useState(false);
  const [processingQ,setProcessingQ]       = useState(null); // which question is being processed

  const mrRef=useRef(null),chunksRef=useRef([]),streamRef=useRef(null);
  const timerRef=useRef(null),actxRef=useRef(null);
  const videoRef=useRef(null),camStreamRef=useRef(null);
  const frameTimerRef=useRef(null),canvasRef=useRef(null);

  useEffect(()=>{
    fetch(`${API}/health`).then(r=>r.json()).then(setBackend).catch(()=>setBackend(null));
  },[]);

  const isAnswered = id => sessionResults.some(r=>r.qId===id);
  const answered   = sessionResults.length;
  const allDone    = answered >= QUESTIONS.length;

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
    setErr("");setBlob(null);setLiveEmo(null);setFrames(0);
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

  const analyze=useCallback(async(blobToUse=null,qToUse=null)=>{
    const useBlob=blobToUse||blob;
    const useQ=qToUse||selQ;
    if(!useBlob) return;
    setStatus("processing");setErr("");setProcessingQ(useQ?.id);
    const steps=["Converting audio…","Whisper STT…","Librosa analysis…","NLP processing…","DeepFace…","Feedback Engine…","Building report…"];
    let i=0;setLoad(steps[0]);
    const t=setInterval(()=>{i=Math.min(i+1,steps.length-1);setLoad(steps[i]);},2000);
    try{
      const fd=new FormData();
      fd.append("audio_file",useBlob,"recording.webm");
      fd.append("question",useQ?.question||"Tell me about yourself.");
      fd.append("category",useQ?.category||"Behavioral");
      fd.append("session_id",SID);
      const res=await fetch(`${API}/analyze`,{method:"POST",body:fd});
      if(!res.ok) throw new Error((await res.json()).detail||"Server error");
      const data=await res.json();
      console.log("✅ result:",data);
      const newResults=[...sessionResults.filter(r=>r.qId!==useQ?.id),
        {qId:useQ?.id,question:useQ?.question,category:useQ?.category,result:data}];
      setSessionResults(newResults);
      setStatus("done");
      // Auto-move to next unanswered question
      const nextQ=QUESTIONS.find(q=>!newResults.some(r=>r.qId===q.id));
      if(nextQ){setSelQ(nextQ);setBlob(null);}
      if(newResults.length>=QUESTIONS.length){
        setTimeout(()=>setSessionDone(true),800);
      }
    }catch(e){setErr(e.message);setStatus("error");}
    finally{clearInterval(t);setLoad("");setProcessingQ(null);}
  },[blob,selQ,sessionResults]);

  const resetQ=()=>{
    setStatus("idle");setBlob(null);setErr("");setRecTime(0);
    setLoad("");setLiveEmo(null);setFrames(0);setCamOk(false);
  };
  const fullReset=()=>{
    resetQ();setSessionResults([]);setSessionDone(false);setSelQ(QUESTIONS[0]);
  };

  if(sessionDone&&sessionResults.length>0){
    return <SessionReport sessionResults={sessionResults} onReset={fullReset}/>;
  }

  const isRec=status==="recording",isProc=status==="processing",isDone=status==="done";

  return(
    <div style={{height:"100vh",background:P.bg,color:P.txt,display:"flex",flexDirection:"column",
      fontFamily:"'Outfit','Segoe UI',system-ui,sans-serif",overflow:"hidden"}}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,
        background:`radial-gradient(ellipse 60% 40% at 15% 0%,${P.v1}18,transparent),radial-gradient(ellipse 40% 30% at 85% 100%,${P.v2}0e,transparent)`}}/>
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,
        backgroundImage:`url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%231e1e32' stroke-width='0.5'%3E%3Cpath d='M40 0 L0 0 L0 40'/%3E%3C/g%3E%3C/svg%3E")`,
        backgroundSize:"40px 40px",opacity:0.5}}/>

      {/* Header */}
      <header style={{position:"relative",zIndex:10,flexShrink:0,background:P.s1+"ee",
        borderBottom:`1px solid ${P.b1}`,padding:"0 20px",display:"flex",
        alignItems:"center",justifyContent:"space-between",height:52,backdropFilter:"blur(12px)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:30,height:30,borderRadius:8,background:`linear-gradient(135deg,${P.v1},${P.v2})`,
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>🎯</div>
          <div>
            <div style={{fontSize:14,fontWeight:800,color:P.white,letterSpacing:-0.3}}>
              MockAI<span style={{fontWeight:400,color:P.muted,fontSize:12}}> · Interview Coach</span>
            </div>
            <div style={{fontSize:8,color:P.muted,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace"}}>
              Whisper · Librosa · NLP · DeepFace · Feedback
            </div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {/* Progress dots */}
          <div style={{display:"flex",alignItems:"center",gap:8,background:P.s2,
            border:`1px solid ${P.b1}`,borderRadius:99,padding:"6px 14px"}}>
            <div style={{display:"flex",gap:4}}>
              {QUESTIONS.map(q=>(
                <div key={q.id} title={`Q${q.id}: ${q.category}`} style={{
                  width:10,height:10,borderRadius:3,transition:"all .3s",
                  background:isAnswered(q.id)?P.v3:q.id===selQ?.id?(isProc?P.amber:isRec?P.red:P.b2):P.b2,
                  border:`1px solid ${isAnswered(q.id)?P.v2+"80":q.id===selQ?.id?P.v1+"80":P.b1}`,
                  boxShadow:q.id===selQ?.id&&isRec?`0 0 6px ${P.red}88`:isAnswered(q.id)?`0 0 5px ${P.v3}50`:""
                }}/>
              ))}
            </div>
            <span style={{fontSize:10,color:P.v4,fontWeight:700,fontFamily:"'DM Mono',monospace"}}>{answered}/10</span>
          </div>
          {allDone&&<button onClick={()=>setSessionDone(true)} style={{
            background:`linear-gradient(135deg,${P.v1},${P.v2})`,border:"none",color:"#fff",
            borderRadius:99,padding:"6px 16px",fontSize:11,fontWeight:700,cursor:"pointer",
            boxShadow:`0 2px 12px ${P.v2}40`,display:"flex",alignItems:"center",gap:6}}>
            📊 View Report
          </button>}
          <div style={{display:"flex",alignItems:"center",gap:6,background:P.s2,
            border:`1px solid ${backend?P.v1+"50":P.red+"40"}`,borderRadius:99,padding:"5px 11px"}}>
            <Pip active={!!backend} color={backend?P.green:P.red}/>
            <span style={{fontSize:10,color:backend?P.green:P.red,fontWeight:600}}>
              {backend?"Online":"Offline"}
            </span>
          </div>
        </div>
      </header>

      {/* 3-column body */}
      <div style={{position:"relative",zIndex:1,flex:1,display:"grid",
        gridTemplateColumns:"260px 1fr 360px",overflow:"hidden"}}>

        {/* LEFT: Question list */}
        <aside style={{borderRight:`1px solid ${P.b1}`,display:"flex",flexDirection:"column",
          overflow:"hidden",background:P.s1+"88"}}>
          <div style={{padding:"12px 12px 8px",borderBottom:`1px solid ${P.b1}`,flexShrink:0}}>
            <div style={{fontSize:9,fontWeight:700,letterSpacing:2.5,textTransform:"uppercase",
              color:P.muted,marginBottom:8,fontFamily:"'DM Mono',monospace",
              display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span>Questions</span>
              <span style={{color:answered>=10?P.green:P.v4}}>{answered}/10 done</span>
            </div>
            {/* Progress bar */}
            <div style={{background:P.b1,borderRadius:99,height:4,overflow:"hidden"}}>
              <div style={{width:`${(answered/10)*100}%`,height:"100%",
                background:`linear-gradient(90deg,${P.v1},${P.v3})`,borderRadius:99,
                transition:"width .5s cubic-bezier(.16,1,.3,1)"}}/>
            </div>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:8,display:"flex",flexDirection:"column",gap:5}}>
            {QUESTIONS.map(q=>{
              const cc=catColor(q.category);
              const sel=selQ?.id===q.id;
              const done=isAnswered(q.id);
              const proc=processingQ===q.id;
              return(
                <div key={q.id} onClick={()=>{if(!isRec&&!isProc){setSelQ(q);resetQ();}}} style={{
                  background:sel?P.vglow:done?P.green+"06":P.card,
                  border:`1px solid ${sel?P.v2+"70":done?P.green+"30":P.b1}`,
                  borderRadius:10,padding:"9px 11px",cursor:isRec||isProc?"default":"pointer",
                  transition:"all .2s",position:"relative",overflow:"hidden",
                  opacity:isRec&&!sel?0.6:1}}>
                  {sel&&<div style={{position:"absolute",left:0,top:0,bottom:0,width:3,
                    background:`linear-gradient(180deg,${P.v2},${P.v4})`,borderRadius:"3px 0 0 3px"}}/>}
                  {done&&!sel&&<div style={{position:"absolute",left:0,top:0,bottom:0,width:3,
                    background:P.green,borderRadius:"3px 0 0 3px"}}/>}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:6}}>
                    <div style={{flex:1,paddingLeft:(sel||done)?6:0}}>
                      <div style={{display:"flex",gap:5,alignItems:"center",marginBottom:4}}>
                        <span style={{fontSize:8.5,color:P.muted,fontFamily:"'DM Mono',monospace",fontWeight:700}}>Q{q.id}</span>
                        <Tag color={cc}>{q.category}</Tag>
                        <span style={{fontSize:7.5,color:P.muted,background:P.b1,borderRadius:3,padding:"1px 5px",fontFamily:"'DM Mono',monospace"}}>{q.difficulty}</span>
                      </div>
                      <div style={{fontSize:10.5,color:sel?P.white:P.txt,lineHeight:1.5,fontWeight:sel?600:400}}>
                        {q.question}
                      </div>
                    </div>
                    <div style={{flexShrink:0,marginLeft:4,marginTop:2}}>
                      {done&&<span style={{fontSize:16}}>✅</span>}
                      {proc&&<span style={{fontSize:14,animation:"spin 1s linear infinite",display:"inline-block"}}>◌</span>}
                      {sel&&!done&&!proc&&<span style={{fontSize:10,color:P.v4,fontWeight:700}}>▸</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Bottom CTA */}
          <div style={{padding:"10px 12px",borderTop:`1px solid ${P.b1}`,flexShrink:0}}>
            {answered>0&&<button onClick={()=>setSessionDone(true)} style={{
              width:"100%",
              background:allDone?`linear-gradient(135deg,${P.v1},${P.v2})`:`${P.vglow}`,
              border:allDone?"none":`1px solid ${P.v2}40`,
              color:allDone?"#fff":P.v4,borderRadius:9,padding:"10px",fontSize:11,
              fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",
              justifyContent:"center",gap:7,
              boxShadow:allDone?`0 4px 16px ${P.v2}35`:"none"}}>
              📊 {allDone?"View Full Session Report":`View Partial Report (${answered}/10)`}
            </button>}
            {answered===0&&<div style={{fontSize:10,color:P.muted,textAlign:"center",padding:"4px 0"}}>
              Answer questions to unlock the session report
            </div>}
          </div>
        </aside>

        {/* CENTRE: webcam + waveform + controls */}
        <main style={{display:"flex",flexDirection:"column",overflow:"hidden",background:"#000"}}>
          {/* Current question banner */}
          {selQ&&<div style={{flexShrink:0,padding:"8px 16px",background:P.s2+"ee",
            borderBottom:`1px solid ${P.b1}`,display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:3,height:28,borderRadius:99,flexShrink:0,
              background:`linear-gradient(180deg,${catColor(selQ.category)},${catColor(selQ.category)}44)`}}/>
            <div style={{flex:1}}>
              <div style={{display:"flex",gap:6,marginBottom:3}}>
                <Tag color={catColor(selQ.category)}>{selQ.category}</Tag>
                <span style={{fontSize:8.5,color:P.muted,fontFamily:"'DM Mono',monospace",
                  background:P.b1,borderRadius:3,padding:"1px 5px"}}>{selQ.difficulty}</span>
              </div>
              <div style={{fontSize:12,fontWeight:700,color:P.white,lineHeight:1.4}}>{selQ.question}</div>
            </div>
            {isAnswered(selQ.id)&&<div style={{background:P.green+"12",border:`1px solid ${P.green}30`,
              borderRadius:7,padding:"5px 10px",textAlign:"center",flexShrink:0}}>
              <div style={{fontSize:14,fontWeight:900,color:P.green,fontFamily:"'DM Mono',monospace"}}>✓</div>
              <div style={{fontSize:7.5,color:P.green,letterSpacing:1}}>DONE</div>
            </div>}
          </div>}

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
                <div style={{fontSize:13,fontWeight:700,color:P.white,marginBottom:5}}>Analysing Q{selQ?.id}…</div>
                <div style={{fontSize:11,color:P.v4,fontFamily:"'DM Mono',monospace"}}>{loadStep}</div>
                <div style={{fontSize:10,color:P.muted,marginTop:4}}>Do not close this tab</div>
              </div>
            </div>}
            {liveEmo&&isRec&&liveEmo.face_detected&&<div style={{position:"absolute",bottom:12,right:12,
              background:"rgba(7,7,13,0.85)",backdropFilter:"blur(8px)",
              border:`1px solid ${P.v2}50`,borderRadius:11,padding:"9px 13px",textAlign:"center",minWidth:84}}>
              <div style={{fontSize:24,marginBottom:3}}>{emojiEmo(ss(liveEmo.dominant_emotion))}</div>
              <div style={{fontSize:9.5,color:P.v4,fontWeight:700,textTransform:"capitalize"}}>{ss(liveEmo.dominant_emotion)}</div>
              <div style={{display:"flex",gap:9,justifyContent:"center",marginTop:6}}>
                {[["C",rnd(liveEmo.confidence_score),P.v4],["E",rnd(liveEmo.eye_contact_score),P.indigo]].map(([l,v,col])=>(
                  <div key={l} style={{textAlign:"center"}}>
                    <div style={{fontSize:12,fontWeight:900,color:col,fontFamily:"'DM Mono',monospace"}}>{v}</div>
                    <div style={{fontSize:7.5,color:P.muted}}>{l}</div>
                  </div>
                ))}
              </div>
            </div>}
            {/* After analysis — quick status overlay */}
            {isDone&&isAnswered(selQ?.id)&&<div style={{position:"absolute",top:12,right:12,
              background:"rgba(7,7,13,0.88)",backdropFilter:"blur(8px)",border:`1px solid ${P.green}50`,
              borderRadius:11,padding:"8px 14px",textAlign:"center"}}>
              <div style={{fontSize:13,color:P.green,fontWeight:700}}>✓ Saved</div>
              <div style={{fontSize:9,color:P.muted,marginTop:2}}>Q{selQ?.id} recorded</div>
              <div style={{fontSize:9,color:P.v4,marginTop:2,fontFamily:"'DM Mono',monospace"}}>{10-answered} left</div>
            </div>}
          </div>

          {/* Waveform */}
          <div style={{flexShrink:0,position:"relative",borderTop:`1px solid ${isRec?P.v2+"60":P.b1}`,transition:"border-color .4s"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:1,zIndex:2,pointerEvents:"none",
              background:isRec?`linear-gradient(90deg,transparent,${P.v3}60,transparent)`:"none"}}/>
            <div style={{position:"absolute",top:5,left:10,zIndex:2,display:"flex",alignItems:"center",gap:6}}>
              {isRec&&<Pip active color={P.v4}/>}
              <span style={{fontSize:8,color:P.muted,fontFamily:"'DM Mono',monospace",letterSpacing:1.5,textTransform:"uppercase"}}>
                {isRec?"live":isProc?loadStep:"ready"}
              </span>
            </div>
            <div style={{position:"absolute",top:5,right:10,zIndex:2}}>
              <span style={{fontSize:8,color:P.muted+"70",fontFamily:"'DM Mono',monospace"}}>16kHz</span>
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
                display:"flex",alignItems:"center",gap:7,boxShadow:isProc?"none":`0 4px 16px ${P.v2}40`}}>
                <span style={{width:7,height:7,borderRadius:"50%",background:"rgba(255,255,255,0.8)",display:"inline-block"}}/>
                {isAnswered(selQ?.id)?"Re-record":"Start Recording"}
              </button>
              :<button onClick={stopRec} style={{background:P.red+"18",border:`1px solid ${P.red}60`,
                color:P.red,borderRadius:9,padding:"8px 18px",fontSize:11.5,fontWeight:700,cursor:"pointer",
                display:"flex",alignItems:"center",gap:7}}>
                <span style={{width:7,height:7,borderRadius:2,background:P.red,display:"inline-block"}}/>
                Stop — {fmt(recTime)}
              </button>}
            {blob&&!isRec&&!isProc&&<button onClick={()=>analyze()} style={{
              background:P.vglow,border:`1px solid ${P.v2}60`,color:P.v4,
              borderRadius:9,padding:"8px 18px",fontSize:11.5,fontWeight:700,cursor:"pointer"}}>
              ⚡ Analyse Answer
            </button>}
            {isDone&&!isRec&&!isProc&&(()=>{
              const nextQ=QUESTIONS.find(q=>!sessionResults.some(r=>r.qId===q.id));
              return nextQ?(
                <button onClick={()=>{setSelQ(nextQ);resetQ();}} style={{
                  background:P.green+"18",border:`1px solid ${P.green}60`,
                  color:P.green,borderRadius:9,padding:"8px 18px",fontSize:11.5,fontWeight:700,cursor:"pointer"}}>
                  Next Question →
                </button>
              ):(
                <button onClick={()=>setSessionDone(true)} style={{
                  background:`linear-gradient(135deg,${P.v1},${P.v2})`,border:"none",color:"#fff",
                  borderRadius:9,padding:"8px 18px",fontSize:11.5,fontWeight:700,cursor:"pointer",
                  boxShadow:`0 4px 16px ${P.v2}40`}}>
                  📊 View Session Report
                </button>
              );
            })()}
            {blob&&!isRec&&!isProc&&<button onClick={resetQ} style={{background:"transparent",
              border:`1px solid ${P.b2}`,color:P.muted,borderRadius:9,padding:"8px 12px",
              fontSize:10.5,cursor:"pointer"}}>↺ Redo</button>}
            {err&&<span style={{fontSize:10.5,color:P.red,fontWeight:600}}>⚠ {err}</span>}
            {blob&&status==="idle"&&<span style={{fontSize:9.5,color:P.muted}}>
              ✓ {(blob.size/1024).toFixed(1)} KB ready
            </span>}
          </div>
        </main>

        {/* RIGHT: session status / progress tracker */}
        <aside style={{borderLeft:`1px solid ${P.b1}`,display:"flex",flexDirection:"column",
          overflow:"hidden",background:P.s1+"88"}}>
          <div style={{padding:"12px 14px 8px",borderBottom:`1px solid ${P.b1}`,flexShrink:0}}>
            <div style={{fontSize:9,fontWeight:700,letterSpacing:2.5,textTransform:"uppercase",
              color:P.muted,marginBottom:2,fontFamily:"'DM Mono',monospace"}}>Session Progress</div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginTop:6}}>
              <div style={{flex:1,background:P.b1,borderRadius:99,height:6,overflow:"hidden"}}>
                <div style={{width:`${(answered/10)*100}%`,height:"100%",
                  background:`linear-gradient(90deg,${P.v1},${P.v3})`,borderRadius:99,
                  transition:"width .5s cubic-bezier(.16,1,.3,1)"}}/>
              </div>
              <span style={{fontSize:11,fontWeight:800,color:P.v4,fontFamily:"'DM Mono',monospace",flexShrink:0}}>
                {answered}/10
              </span>
            </div>
          </div>

          <div style={{flex:1,overflowY:"auto",padding:"12px 14px",display:"flex",flexDirection:"column",gap:8}}>
            {/* Current question status */}
            {selQ&&<Card accent={catColor(selQ.category)} style={{padding:14}}>
              <div style={{fontSize:8,color:P.muted,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:6}}>Current Question</div>
              <div style={{fontSize:12,fontWeight:700,color:P.white,lineHeight:1.5,marginBottom:8}}>{selQ.question}</div>
              <div style={{display:"flex",gap:6}}>
                <Tag color={catColor(selQ.category)}>{selQ.category}</Tag>
                <span style={{fontSize:8.5,color:P.muted,fontFamily:"'DM Mono',monospace",
                  background:P.b1,borderRadius:3,padding:"2px 6px"}}>{selQ.difficulty}</span>
              </div>
              {/* Status */}
              <div style={{marginTop:10,padding:"8px 10px",background:P.s2,borderRadius:8,border:`1px solid ${P.b1}`}}>
                {isRec&&<div style={{display:"flex",alignItems:"center",gap:7}}>
                  <span style={{width:6,height:6,borderRadius:"50%",background:P.red,display:"inline-block",animation:"pip 1s infinite"}}/>
                  <span style={{fontSize:11,color:P.red,fontWeight:700}}>Recording… {fmt(recTime)}</span>
                </div>}
                {isProc&&<div style={{display:"flex",alignItems:"center",gap:7}}>
                  <span style={{fontSize:12,animation:"spin 1s linear infinite",display:"inline-block"}}>◌</span>
                  <span style={{fontSize:11,color:P.v4}}>{loadStep}</span>
                </div>}
                {blob&&!isRec&&!isProc&&!isDone&&<div style={{fontSize:11,color:P.amber}}>
                  ✓ Recording ready — click Analyse
                </div>}
                {isDone&&isAnswered(selQ.id)&&<div style={{fontSize:11,color:P.green,fontWeight:700}}>
                  ✓ Answer saved — results after all questions
                </div>}
                {!blob&&!isRec&&!isProc&&!isDone&&<div style={{fontSize:11,color:P.muted}}>
                  Press Start Recording to begin
                </div>}
              </div>
            </Card>}

            {/* Info: report after all questions */}
            <div style={{background:P.vglow,border:`1px solid ${P.v2}40`,borderRadius:12,padding:14}}>
              <div style={{fontSize:11,fontWeight:700,color:P.v4,marginBottom:6}}>
                📊 Full report after all 10 questions
              </div>
              <div style={{fontSize:10,color:P.muted,lineHeight:1.7}}>
                Your complete evaluation — grade, detailed scores, radar chart, strengths, tips, transcript — will appear once you've answered all 10 questions.
              </div>
            </div>

            {/* How-to steps */}
            <Card style={{padding:14}}>
              <div style={{fontSize:9,color:P.muted,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:10}}>How it works</div>
              {[["1","Select a question","Left panel"],["2","Record your answer","30–60 seconds"],
                ["3","Click Analyse","5 modules run"],["4","Auto-advance","Next question loads"],
                ["5","Complete all 10","Full report unlocks"]].map(([n,t,d])=>(
                <div key={n} style={{display:"flex",gap:10,marginBottom:8}}>
                  <div style={{width:18,height:18,borderRadius:5,background:P.vglow,border:`1px solid ${P.b2}`,
                    display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:P.v4,
                    fontWeight:800,flexShrink:0,fontFamily:"'DM Mono',monospace"}}>{n}</div>
                  <div>
                    <div style={{fontSize:11,color:P.white,fontWeight:600}}>{t}</div>
                    <div style={{fontSize:9.5,color:P.muted}}>{d}</div>
                  </div>
                </div>
              ))}
            </Card>

            {/* Questions answered so far — mini list */}
            {answered>0&&<Card style={{padding:14}}>
              <div style={{fontSize:9,color:P.muted,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:10}}>Completed</div>
              {sessionResults.map((r,i)=>{
                const grade=ss(so(so(r.result).feedback).grade,"?");
                const gc2=gradeCol(grade);
                const cc=catColor(r.category);
                return <div key={r.qId} style={{display:"flex",justifyContent:"space-between",
                  alignItems:"center",padding:"5px 0",borderBottom:`1px solid ${P.b1}`}}>
                  <div style={{display:"flex",alignItems:"center",gap:7,flex:1,minWidth:0}}>
                    <span style={{fontSize:8.5,color:P.muted,fontFamily:"'DM Mono',monospace",flexShrink:0}}>Q{r.qId}</span>
                    <span style={{fontSize:9,color:cc,background:cc+"15",border:`1px solid ${cc}30`,
                      borderRadius:3,padding:"1px 5px",fontWeight:700,letterSpacing:.8,flexShrink:0,textTransform:"uppercase"}}>{r.category.split(" ")[0]}</span>
                    <span style={{fontSize:9.5,color:P.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.question.substring(0,30)}…</span>
                  </div>
                  <span style={{fontSize:14,fontWeight:900,color:gc2,fontFamily:"'DM Mono',monospace",flexShrink:0,marginLeft:8}}>{grade}</span>
                </div>;
              })}
            </Card>}
          </div>
        </aside>
      </div>

      <style>{`
        @keyframes spin{to{transform:rotate(360deg);}}
        @keyframes pip{0%,100%{opacity:1;}50%{opacity:.3;}}
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:3px;}::-webkit-scrollbar-track{background:${P.bg};}
        ::-webkit-scrollbar-thumb{background:${P.b2};border-radius:3px;}
        ::-webkit-scrollbar-thumb:hover{background:${P.v1};}
        button{font-family:inherit;transition:opacity .15s,transform .1s;}
        button:hover{opacity:.82;}button:active{transform:scale(.97);}
      `}</style>
    </div>
  );
}