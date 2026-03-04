import { useState, useRef, useEffect, useCallback } from "react";

const API = "http://localhost:5000/api";
const C = {
  bg:"#060810",surface:"#0c0f1a",card:"#101420",border:"#1a2035",
  blue:"#38bdf8",blueDim:"#0c3a5e",blueGlow:"#38bdf815",
  amber:"#fbbf24",green:"#4ade80",red:"#f87171",purple:"#c084fc",
  orange:"#fb923c",cyan:"#22d3ee",pink:"#f472b6",teal:"#2dd4bf",
  text:"#cbd5e1",muted:"#475569",white:"#f8fafc",
};
const sv   = (v,f=0)  => (v!=null&&!isNaN(Number(v)))?Number(v):f;
const ss   = (v,f="") => v!=null?String(v):f;
const sa   = (v)      => Array.isArray(v)?v:[];
const so   = (v)      => (v&&typeof v==="object"&&!Array.isArray(v))?v:{};
const p100 = (v)      => Math.round(sv(v));
const fmt  = s => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
const fmtMs= ms=> ms<1000?`${Math.round(ms)}ms`:`${(ms/1000).toFixed(2)}s`;
const clamp= (v,lo,hi)=>Math.max(lo,Math.min(hi,v));
const catColor  = c=>({Personal:C.blue,Behavioral:C.green,Technical:C.purple,Situational:C.orange})[c]||C.blue;
const scoreColor= s=>s>=75?C.green:s>=50?C.amber:C.red;
const gradeColor= g=>({"A+":C.green,"A":C.green,"B":C.cyan,"C":C.amber,"D":C.orange,"F":C.red})[g]||C.muted;
const wpmColor  = w=>w>170?C.red:w<100?C.amber:C.green;
const emojiEmo  = e=>({"happy":"😊","neutral":"😐","fear":"😰","angry":"😠","sad":"😔","surprise":"😲","disgust":"🤢"})[e]||"😐";
const FILLERS   = new Set(["um","uh","like","basically","literally","actually","you know","sort of","kind of","i mean","right","okay so","so"]);
const SESSION_ID= `s_${Date.now()}`;

function Waveform({analyser,active}){
  const ref=useRef(null),raf=useRef(null);
  useEffect(()=>{
    const cv=ref.current;if(!cv)return;
    const ctx=cv.getContext("2d"),W=cv.width,H=cv.height;
    const grid=()=>{ctx.fillStyle=C.surface;ctx.fillRect(0,0,W,H);ctx.strokeStyle=C.border;ctx.lineWidth=1;for(let x=0;x<W;x+=55){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}for(let y=0;y<H;y+=24){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}};
    if(!active||!analyser){grid();ctx.strokeStyle=C.blueDim;ctx.lineWidth=1.5;ctx.setLineDash([4,6]);ctx.beginPath();ctx.moveTo(0,H/2);ctx.lineTo(W,H/2);ctx.stroke();ctx.setLineDash([]);return;}
    const data=new Uint8Array(analyser.frequencyBinCount);
    const draw=()=>{raf.current=requestAnimationFrame(draw);analyser.getByteTimeDomainData(data);grid();ctx.shadowColor=C.blue;ctx.shadowBlur=10;ctx.strokeStyle=C.blue;ctx.lineWidth=2.5;ctx.beginPath();const s=W/data.length;for(let i=0;i<data.length;i++){const x=i*s,y=(data[i]/255)*H;i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);}ctx.stroke();ctx.shadowBlur=0;};
    draw();return()=>cancelAnimationFrame(raf.current);
  },[active,analyser]);
  return <canvas ref={ref} width={680} height={88} style={{width:"100%",height:88,display:"block",borderRadius:8,background:C.surface}}/>;
}

function RadarChart({dimensions}){
  const dims=sa(dimensions);if(!dims.length)return null;
  const cx=130,cy=130,R=90,n=dims.length;
  const pts=dims.map((_,i)=>{const a=(Math.PI*2*i/n)-Math.PI/2;return{cos:Math.cos(a),sin:Math.sin(a)};});
  const poly=dims.map((d,i)=>{const r=(sv(d.score)/100)*R;return`${cx+pts[i].cos*r},${cy+pts[i].sin*r}`;}).join(" ");
  const cols=[C.blue,C.green,C.amber,C.teal,C.purple];
  return(
    <svg width={260} height={260} viewBox="0 0 260 260" style={{overflow:"visible"}}>
      {[20,40,60,80,100].map(p=><polygon key={p} fill="none" stroke={C.border} strokeWidth="0.8" points={pts.map(pt=>`${cx+pt.cos*(p/100)*R},${cy+pt.sin*(p/100)*R}`).join(" ")}/>)}
      {pts.map((p,i)=><line key={i} x1={cx} y1={cy} x2={cx+p.cos*R} y2={cy+p.sin*R} stroke={C.border} strokeWidth="0.8"/>)}
      <polygon points={poly} fill={C.blue+"28"} stroke={C.blue} strokeWidth="2"/>
      {dims.map((d,i)=>{const r=(sv(d.score)/100)*R;return<circle key={i} cx={cx+pts[i].cos*r} cy={cy+pts[i].sin*r} r={4} fill={cols[i%5]} stroke={C.bg} strokeWidth="2"/>;})}
      {dims.map((d,i)=>{
        const lx=cx+pts[i].cos*(R+26),ly=cy+pts[i].sin*(R+26);
        const words=ss(d.label,"?").split(" ");
        return(<text key={i} textAnchor="middle" fill={cols[i%5]} fontSize="9" fontWeight="700" fontFamily="system-ui">
          {words.map((w,wi)=><tspan key={wi} x={lx} y={ly+(wi===0?0:wi*11)}>{w}</tspan>)}
        </text>);
      })}
    </svg>
  );
}

function Gauge({value=0,label,color=C.blue,size=84}){
  const r=30,circ=2*Math.PI*r,p=clamp(sv(value),0,100);
  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
      <svg width={size} height={size} viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={r} fill="none" stroke={C.border} strokeWidth="6"/>
        <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={`${circ*(p/100)} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 36 36)" style={{transition:"stroke-dasharray 1.2s"}}/>
        <text x="36" y="41" textAnchor="middle" fill={color} fontSize="12" fontWeight="900" fontFamily="monospace">{Math.round(p)}</text>
      </svg>
      <span style={{fontSize:9,color:C.muted,textAlign:"center",maxWidth:76,lineHeight:1.3}}>{label}</span>
    </div>
  );
}

function Bar({label,value,max=100,unit="",color=C.blue,note=""}){
  const v=sv(value),p=clamp((v/max)*100,0,100);
  return(
    <div style={{marginBottom:10}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
        <span style={{fontSize:11,color:C.text}}>{label}</span>
        <span style={{fontSize:10,color:C.muted,fontFamily:"monospace"}}>{v<10?v.toFixed(2):Math.round(v)}{unit}{note&&<span style={{color:C.border,marginLeft:5}}>{note}</span>}</span>
      </div>
      <div style={{background:C.border,borderRadius:99,height:6,overflow:"hidden"}}>
        <div style={{width:`${p}%`,height:"100%",background:`linear-gradient(90deg,${color},${color}99)`,borderRadius:99,transition:"width 1.2s"}}/>
      </div>
    </div>
  );
}

const InfoRow=({label,value,color=C.text})=>(
  <div style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`1px solid ${C.border}`}}>
    <span style={{fontSize:11,color:C.muted}}>{label}</span>
    <span style={{fontSize:11,color,fontWeight:700,fontFamily:"monospace",textTransform:"capitalize"}}>{value}</span>
  </div>
);

const Card=({children,style={},glow})=>(
  <div style={{background:C.card,border:`1px solid ${glow?glow+"44":C.border}`,borderRadius:14,padding:16,boxShadow:glow?`0 0 20px ${glow}12`:"none",...style}}>{children}</div>
);

const SHead=({icon,text,badge})=>(
  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
    <span style={{fontSize:15}}>{icon}</span>
    <h3 style={{margin:0,fontSize:12,fontWeight:800,color:C.text,flex:1}}>{text}</h3>
    {badge&&<span style={{fontSize:9,color:C.muted,background:C.surface,border:`1px solid ${C.border}`,borderRadius:99,padding:"2px 8px"}}>{badge}</span>}
  </div>
);

function WordHighlight({text}){
  if(!text)return<span style={{color:C.muted,fontSize:11}}>(empty)</span>;
  return(
    <div style={{lineHeight:2,fontSize:12}}>
      {text.split(/\s+/).filter(Boolean).map((w,i)=>{
        const fil=FILLERS.has(w.toLowerCase().replace(/[^a-z]/g,""));
        return<span key={i} style={{display:"inline-block",margin:"2px 3px",padding:"2px 7px",borderRadius:5,fontFamily:"monospace",fontSize:11,background:fil?C.red+"25":C.blueGlow,color:fil?C.red:C.blue,border:`1px solid ${fil?C.red+"44":C.border}`}}>{w}</span>;
      })}
    </div>
  );
}

function FeedbackTab({feedback}){
  const fb=so(feedback);
  const grade=ss(fb.grade,"?"),overall=sv(fb.overall_score);
  const verdict=ss(fb.verdict,"—"),priority=ss(fb.priority_focus,"—");
  const dims=sa(fb.dimensions),strengths=sa(fb.strengths);
  const improvements=sa(fb.improvements),tips=sa(fb.tips);
  const gc=gradeColor(grade);
  const cols=[C.blue,C.green,C.amber,C.teal,C.purple];
  return(
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      <Card glow={gc} style={{display:"flex",gap:20,alignItems:"center",padding:20,flexWrap:"wrap"}}>
        <div style={{textAlign:"center",flexShrink:0}}>
          <div style={{fontSize:58,fontWeight:900,fontFamily:"monospace",color:gc,textShadow:`0 0 28px ${gc}55`,lineHeight:1}}>{grade}</div>
          <div style={{fontSize:10,color:C.muted,marginTop:4}}>Grade</div>
          <div style={{fontSize:26,fontWeight:900,color:gc,fontFamily:"monospace",marginTop:6}}>{Math.round(overall)}<span style={{fontSize:13,color:C.muted}}>/100</span></div>
        </div>
        <div style={{flex:1,minWidth:180}}>
          <div style={{fontSize:14,fontWeight:800,color:C.white,marginBottom:10,lineHeight:1.5}}>{verdict}</div>
          <div style={{fontSize:11,color:C.muted,background:C.surface,borderRadius:9,padding:"10px 14px",border:`1px solid ${C.border}`}}>
            🎯 <b style={{color:gc}}>Priority: </b><span style={{color:C.text}}>{priority}</span>
          </div>
        </div>
      </Card>

      <div style={{display:"grid",gridTemplateColumns:"260px 1fr",gap:12}}>
        <Card style={{display:"flex",alignItems:"center",justifyContent:"center",padding:8}}>
          <RadarChart dimensions={dims}/>
        </Card>
        <Card>
          <SHead icon="📊" text="Dimension Scores"/>
          {dims.map((d,i)=>(
            <div key={i} style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                <span style={{fontSize:11,color:C.text,fontWeight:600}}>{ss(d.label,"?")}</span>
                <span style={{display:"flex",gap:8,fontSize:10,fontFamily:"monospace"}}>
                  <span style={{color:gradeColor(ss(d.grade,"?")),fontWeight:800}}>{ss(d.grade,"?")}</span>
                  <span style={{color:C.muted}}>{p100(d.score)}/100</span>
                  <span style={{color:C.border}}>×{sv(d.weight)}%</span>
                </span>
              </div>
              <div style={{background:C.border,borderRadius:99,height:6,overflow:"hidden",marginBottom:4}}>
                <div style={{width:`${clamp(sv(d.score),0,100)}%`,height:"100%",background:`linear-gradient(90deg,${cols[i%5]},${cols[i%5]}99)`,borderRadius:99,transition:"width 1.2s"}}/>
              </div>
              <div style={{fontSize:10,color:C.muted}}>{ss(d.feedback,"")}</div>
            </div>
          ))}
        </Card>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Card glow={C.green}>
          <SHead icon="✅" text="Strengths" badge={`${strengths.length}`}/>
          {strengths.length===0&&<div style={{color:C.muted,fontSize:11}}>Keep practising!</div>}
          {strengths.map((s,i)=>(
            <div key={i} style={{display:"flex",gap:9,padding:"7px 10px",background:C.green+"0f",borderRadius:8,border:`1px solid ${C.green}22`,marginBottom:6}}>
              <span style={{color:C.green,flexShrink:0}}>✓</span>
              <span style={{fontSize:11,color:C.text,lineHeight:1.5}}>{s}</span>
            </div>
          ))}
        </Card>
        <Card glow={C.orange}>
          <SHead icon="⚠️" text="Areas to Improve" badge={`${improvements.length}`}/>
          {improvements.length===0&&<div style={{color:C.muted,fontSize:11}}>Great job!</div>}
          {improvements.map((s,i)=>(
            <div key={i} style={{display:"flex",gap:9,padding:"7px 10px",background:C.orange+"0f",borderRadius:8,border:`1px solid ${C.orange}22`,marginBottom:6}}>
              <span style={{color:C.orange,flexShrink:0}}>→</span>
              <span style={{fontSize:11,color:C.text,lineHeight:1.5}}>{s}</span>
            </div>
          ))}
        </Card>
      </div>

      <Card glow={C.blue}>
        <SHead icon="💡" text="Actionable Tips" badge={`${tips.length}`}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {tips.length===0&&<div style={{color:C.muted,fontSize:11}}>No tips generated.</div>}
          {tips.map((tip,i)=>(
            <div key={i} style={{display:"flex",gap:9,padding:"9px 12px",background:C.blueGlow,borderRadius:9,border:`1px solid ${C.blueDim}`}}>
              <span style={{color:C.blue,fontFamily:"monospace",fontSize:11,flexShrink:0,fontWeight:800}}>0{i+1}</span>
              <span style={{fontSize:11,color:C.text,lineHeight:1.5}}>{tip}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Results({result,tab,setTab}){
  if(!result)return null;
  try{
    const stt=so(result.stt),audio=so(result.audio);
    const nlp=so(result.nlp),facial=so(result.facial),fb=so(result.feedback);
    const scores=so(audio.scores),rhythm=so(audio.rhythm),pitch=so(audio.pitch),energy=so(audio.energy);
    const segs=sa(stt.segments),emos=so(facial.emotions);
    const fillers=sa(nlp.filler_words_found),entities=sa(nlp.named_entities);
    const dur=Math.max(sv(stt.duration_s,1),1);
    const gc=gradeColor(ss(fb.grade,"?"));
    return(
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8}}>
          {[["M01","Words",sv(stt.word_count),C.blue],["M02","Delivery",p100(scores.delivery_clarity),C.amber],["M03","Language",p100(nlp.nlp_overall_score),C.purple],["M04","Facial",p100(facial.confidence_score),C.teal],["M05","Overall",p100(fb.overall_score),gc]].map(([mod,lbl,val,col])=>(
            <Card key={mod} glow={col} style={{textAlign:"center",padding:12}}>
              <div style={{fontSize:8,color:C.muted,textTransform:"uppercase",letterSpacing:2,marginBottom:4}}>{mod}</div>
              <div style={{fontSize:28,fontWeight:900,color:col,fontFamily:"monospace",textShadow:`0 0 10px ${col}55`}}>{val}</div>
              <div style={{color:C.muted,fontSize:9,marginTop:2}}>{lbl}</div>
            </Card>
          ))}
        </div>
        <div style={{textAlign:"center",fontSize:10,color:C.muted}}>
          All 5 modules in <b style={{color:C.cyan,fontFamily:"monospace"}}>{fmtMs(sv(result.total_time_s)*1000)}</b>
          &nbsp;·&nbsp;Grade: <b style={{color:gc,fontSize:13}}>{ss(fb.grade,"?")}</b>
          &nbsp;·&nbsp;{ss(fb.verdict,"")}
        </div>
        <div style={{display:"flex",gap:4,background:C.surface,borderRadius:11,padding:4,border:`1px solid ${C.border}`}}>
          {[["feedback","💡 Feedback","green"],["stt","🎤 Transcript","blue"],["audio","🔊 Audio","amber"],["nlp","🧠 Language","purple"],["facial","📸 Facial","teal"]].map(([k,l,col])=>(
            <button key={k} onClick={()=>setTab(k)} style={{flex:1,background:tab===k?C.card:"transparent",border:`1px solid ${tab===k?C[col]:C.border}`,color:tab===k?C[col]:C.muted,borderRadius:8,padding:"7px 4px",fontSize:10,fontWeight:700,cursor:"pointer",transition:"all .2s"}}>{l}</button>
          ))}
        </div>

        {tab==="feedback"&&<FeedbackTab feedback={fb}/>}

        {tab==="stt"&&(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
              {[["Words",sv(stt.word_count),C.blue],["Segs",segs.length,C.cyan],["Dur",`${sv(stt.duration_s)}s`,C.purple],["Device",ss(stt.device_used,"?"),C.amber]].map(([l,v,col])=>(
                <div key={l} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:9,padding:"8px 11px",textAlign:"center",minWidth:70}}>
                  <div style={{fontSize:16,fontWeight:900,color:col,fontFamily:"monospace"}}>{v}</div>
                  <div style={{fontSize:9,color:C.muted,marginTop:2}}>{l}</div>
                </div>
              ))}
            </div>
            <Card><SHead icon="✏️" text="Transcript" badge="fillers in red"/><WordHighlight text={ss(stt.transcript)}/></Card>
            {segs.length>0&&(
              <Card><SHead icon="⏱️" text="Segments" badge={`${segs.length}`}/>
                <div style={{position:"relative",height:18,background:C.surface,borderRadius:5,overflow:"hidden",marginBottom:9,border:`1px solid ${C.border}`}}>
                  {segs.map((s,i)=><div key={i} style={{position:"absolute",left:`${(sv(s.start)/dur)*100}%`,width:`${Math.max(((sv(s.end)-sv(s.start))/dur)*100,0.5)}%`,height:"100%",background:i%2===0?C.blueDim+"cc":C.blue+"33"}}/>)}
                </div>
                <div style={{maxHeight:150,overflowY:"auto",display:"flex",flexDirection:"column",gap:4}}>
                  {segs.map((s,i)=>(
                    <div key={i} style={{display:"flex",gap:9,background:C.surface,borderRadius:6,padding:"5px 9px",border:`1px solid ${C.border}`}}>
                      <span style={{fontSize:9,color:C.blue,fontFamily:"monospace",whiteSpace:"nowrap",minWidth:88}}>{sv(s.start).toFixed(1)}→{sv(s.end).toFixed(1)}s</span>
                      <span style={{fontSize:11,color:C.text,lineHeight:1.5}}>{ss(s.text)}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {tab==="audio"&&(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <Card><SHead icon="🎯" text="Delivery Scores"/>
              <div style={{display:"flex",justifyContent:"space-around",flexWrap:"wrap",gap:9}}>
                <Gauge value={scores.pitch_score}     label="Pitch"     color={C.cyan}/>
                <Gauge value={scores.energy_score}    label="Energy"    color={C.amber}/>
                <Gauge value={scores.rhythm_score}    label="Rhythm"    color={C.orange}/>
                <Gauge value={scores.stability_score} label="Stability" color={C.green}/>
              </div>
            </Card>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <Card glow={C.cyan}><SHead icon="🎵" text="Pitch"/>
                <Bar label="Mean Hz"   value={pitch.mean_hz}        max={400} unit=" Hz" color={C.cyan}/>
                <Bar label="Variation" value={pitch.variation_score} max={100}           color={C.cyan} note={sv(pitch.variation_score)<20?"monotone":sv(pitch.variation_score)>70?"expressive":"natural"}/>
              </Card>
              <Card glow={C.amber}><SHead icon="⚡" text="Energy"/>
                <Bar label="Mean RMS" value={sv(energy.mean_rms)*1000} max={150} unit=" m" color={C.amber}/>
                <Bar label="Score"    value={energy.energy_score}      max={100}            color={C.amber} note={sv(energy.energy_score)<30?"quiet":sv(energy.energy_score)>75?"loud":"moderate"}/>
              </Card>
            </div>
            <Card glow={C.orange}><SHead icon="⏱️" text="Rhythm"/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div>
                  <Bar label="WPM"     value={rhythm.estimated_wpm} max={220} unit=" WPM" color={wpmColor(sv(rhythm.estimated_wpm))} note={sv(rhythm.estimated_wpm)>170?"fast":sv(rhythm.estimated_wpm)<100?"slow":"ideal"}/>
                  <Bar label="Silence" value={rhythm.silence_ratio} max={100} unit="%"    color={C.orange}/>
                </div>
                <div>
                  <InfoRow label="Pauses"    value={`${sv(rhythm.pause_count)}`}  color={sv(rhythm.pause_count)>8?C.red:C.green}/>
                  <InfoRow label="Avg Pause" value={`${sv(rhythm.avg_pause_s)}s`}/>
                  <InfoRow label="Max Pause" value={`${sv(rhythm.max_pause_s)}s`} color={sv(rhythm.max_pause_s)>3?C.red:C.text}/>
                </div>
              </div>
            </Card>
          </div>
        )}

        {tab==="nlp"&&(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <Card><SHead icon="🎯" text="Language Scores"/>
              <div style={{display:"flex",justifyContent:"space-around",flexWrap:"wrap",gap:9}}>
                <Gauge value={nlp.relevance_score}       label="Relevance"  color={C.blue}/>
                <Gauge value={nlp.content_quality_score} label="Content"    color={C.purple}/>
                <Gauge value={nlp.fluency_score}         label="Fluency"    color={C.green}/>
                <Gauge value={nlp.grammar_score}         label="Grammar"    color={C.cyan}/>
                <Gauge value={nlp.vocabulary_score}      label="Vocabulary" color={C.pink}/>
              </div>
            </Card>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <Card glow={C.purple}><SHead icon="🧠" text="Semantic"/>
                <Bar label="Relevance" value={nlp.relevance_score}       max={100} color={C.blue}/>
                <Bar label="Content"   value={nlp.content_quality_score} max={100} color={C.purple}/>
                <InfoRow label="Sim. to Q"     value={sv(nlp.similarity_to_question).toFixed(3)}/>
                <InfoRow label="Sim. to Ideal" value={sv(nlp.similarity_to_ideal).toFixed(3)}/>
              </Card>
              <Card glow={C.green}><SHead icon="📐" text="Text Stats"/>
                <InfoRow label="Words"        value={sv(nlp.word_count)}/>
                <InfoRow label="Sentences"    value={sv(nlp.sentence_count)}/>
                <InfoRow label="Avg Sent Len" value={`${sv(nlp.avg_sentence_length)}w`}    color={sv(nlp.avg_sentence_length)>30?C.red:C.green}/>
                <InfoRow label="TTR"          value={sv(nlp.type_token_ratio).toFixed(3)}  color={sv(nlp.type_token_ratio)>0.6?C.green:C.amber}/>
                <InfoRow label="Fillers"      value={`${sv(nlp.filler_word_count)}`}         color={sv(nlp.filler_word_count)>3?C.red:C.green}/>
              </Card>
            </div>
            {fillers.length>0&&<Card><SHead icon="🚩" text="Filler Words"/><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{fillers.map((w,i)=><span key={i} style={{background:C.red+"22",color:C.red,border:`1px solid ${C.red}44`,borderRadius:99,padding:"3px 11px",fontSize:11,fontWeight:700}}>{w}</span>)}</div></Card>}
            {entities.length>0&&<Card><SHead icon="🏷️" text="Named Entities" badge={`${entities.length}`}/><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{entities.map((e,i)=><span key={i} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,padding:"3px 9px",fontSize:10,color:C.text}}>{ss(e.text)} <span style={{color:C.muted}}>({ss(e.label)})</span></span>)}</div></Card>}
          </div>
        )}

        {tab==="facial"&&(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <Card><SHead icon="🎯" text="Facial Scores"/>
              <div style={{display:"flex",justifyContent:"space-around",flexWrap:"wrap",gap:9}}>
                <Gauge value={facial.confidence_score}       label="Confidence"  color={C.teal}/>
                <Gauge value={facial.eye_contact_score}      label="Eye Contact" color={C.blue}/>
                <Gauge value={facial.behavioral_stability}   label="Stability"   color={C.green}/>
                <Gauge value={100-sv(facial.stress_level)}   label="Calmness"    color={C.purple}/>
              </div>
            </Card>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <Card glow={C.teal}><SHead icon="📸" text="Session Stats"/>
                <InfoRow label="Frames"        value={`${sv(facial.frame_count)}`}/>
                <InfoRow label="Face Detected" value={`${sv(facial.face_detected_ratio)}%`} color={sv(facial.face_detected_ratio)>70?C.green:C.red}/>
                <InfoRow label="Emotion"       value={`${emojiEmo(ss(facial.dominant_emotion))} ${ss(facial.dominant_emotion)}`}/>
                <InfoRow label="Confidence"    value={`${p100(facial.confidence_score)}/100`}  color={scoreColor(sv(facial.confidence_score))}/>
                <InfoRow label="Stress"        value={`${p100(facial.stress_level)}/100`}       color={sv(facial.stress_level)>50?C.red:C.green}/>
                <InfoRow label="Eye Contact"   value={`${p100(facial.eye_contact_score)}/100`}  color={scoreColor(sv(facial.eye_contact_score))}/>
              </Card>
              <Card glow={C.purple}><SHead icon="😊" text="Emotions"/>
                {Object.keys(emos).length===0&&<div style={{color:C.muted,fontSize:11}}>No face detected</div>}
                {Object.entries(emos).sort((a,b)=>b[1]-a[1]).map(([e,v])=>(
                  <Bar key={e} label={`${emojiEmo(e)} ${e}`} value={v} max={100} unit="%" color={e==="happy"?C.green:e==="neutral"?C.cyan:e==="fear"?C.red:e==="angry"?C.orange:C.muted}/>
                ))}
              </Card>
            </div>
          </div>
        )}
      </div>
    );
  }catch(err){
    console.error("Results render error:",err);
    return<div style={{background:C.red+"15",border:`1px solid ${C.red}44`,borderRadius:12,padding:20,color:C.red}}>
      <b>⚠ Render error: {err.message}</b><br/>
      <small style={{color:C.muted}}>Open browser console (F12) for full details</small>
    </div>;
  }
}

export default function App(){
  const [status,setStatus]=useState("idle"),[recTime,setRecTime]=useState(0);
  const [blob,setBlob]=useState(null),[result,setResult]=useState(null);
  const [err,setErr]=useState(""),[backend,setBackend]=useState(null);
  const [analyser,setAnalyser]=useState(null),[tab,setTab]=useState("feedback");
  const [loadStep,setLoad]=useState(""),[questions,setQs]=useState([]);
  const [selQ,setSelQ]=useState(null),[filterCat,setFilter]=useState("All");
  const [liveEmo,setLiveEmo]=useState(null),[framesSent,setFrames]=useState(0);
  const [camOk,setCamOk]=useState(false);
  const mrRef=useRef(null),chunksRef=useRef([]),streamRef=useRef(null);
  const timerRef=useRef(null),actxRef=useRef(null);
  const videoRef=useRef(null),camStreamRef=useRef(null);
  const frameTimerRef=useRef(null),canvasRef=useRef(null);

  useEffect(()=>{
    fetch(`${API}/health`).then(r=>r.json()).then(setBackend).catch(()=>setBackend(null));
    fetch(`${API}/questions`).then(r=>r.json()).then(d=>{setQs(d.questions);setSelQ(d.questions[0]);}).catch(()=>{
      const fb=[{id:1,category:"Personal",question:"Tell me about yourself."},{id:2,category:"Behavioral",question:"Describe a difficult situation you handled."},{id:3,category:"Technical",question:"Walk me through a technical project."},{id:4,category:"Situational",question:"How would you handle a disagreement with your manager?"}];
      setQs(fb);setSelQ(fb[0]);
    });
  },[]);

  const cats=["All",...new Set(questions.map(q=>q.category))];
  const filteredQs=filterCat==="All"?questions:questions.filter(q=>q.category===filterCat);

  const sendFrame=useCallback(async()=>{
    if(!videoRef.current||!canvasRef.current)return;
    const cv=canvasRef.current,vd=videoRef.current;
    cv.width=320;cv.height=240;cv.getContext("2d").drawImage(vd,0,0,320,240);
    const b64=cv.toDataURL("image/jpeg",0.7).split(",")[1];
    const fd=new FormData();fd.append("frame",b64);fd.append("session_id",SESSION_ID);
    try{const r=await fetch(`${API}/frame`,{method:"POST",body:fd});if(r.ok){const d=await r.json();setLiveEmo(d);setFrames(n=>n+1);}}catch{}
  },[]);

  const startRec=useCallback(async()=>{
    setErr("");setResult(null);setBlob(null);setLiveEmo(null);setFrames(0);
    try{
      const ms=await navigator.mediaDevices.getUserMedia({audio:true});
      streamRef.current=ms;
      const actx=new AudioContext();actxRef.current=actx;
      const src=actx.createMediaStreamSource(ms),an=actx.createAnalyser();
      an.fftSize=1024;src.connect(an);setAnalyser(an);
      chunksRef.current=[];
      const mr=new MediaRecorder(ms,{mimeType:"audio/webm;codecs=opus"});
      mr.ondataavailable=e=>{if(e.data.size>0)chunksRef.current.push(e.data);};
      mr.onstop=()=>setBlob(new Blob(chunksRef.current,{type:"audio/webm"}));
      mrRef.current=mr;mr.start(200);setStatus("recording");setRecTime(0);
      timerRef.current=setInterval(()=>setRecTime(t=>t+1),1000);
      try{
        const cs=await navigator.mediaDevices.getUserMedia({video:{width:320,height:240}});
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

  const analyze=useCallback(async()=>{
    if(!blob)return;
    setStatus("processing");setErr("");
    const steps=["🔄 Converting…","🎤 Whisper…","🔊 Librosa…","🧠 NLP…","📸 DeepFace…","💡 Feedback…","📊 Done!"];
    let i=0;setLoad(steps[0]);
    const t=setInterval(()=>{i=Math.min(i+1,steps.length-1);setLoad(steps[i]);},2000);
    try{
      const fd=new FormData();
      fd.append("audio_file",blob,"recording.webm");
      fd.append("question",selQ?.question||"Tell me about yourself.");
      fd.append("category",selQ?.category||"Personal");
      fd.append("session_id",SESSION_ID);
      const res=await fetch(`${API}/analyze`,{method:"POST",body:fd});
      if(!res.ok)throw new Error((await res.json()).detail||"Server error");
      const data=await res.json();
      console.log("✅ API result:",data);
      setResult(data);setStatus("done");setTab("feedback");
    }catch(e){setErr(e.message);setStatus("error");}
    finally{clearInterval(t);setLoad("");}
  },[blob,selQ]);

  const reset=()=>{setStatus("idle");setBlob(null);setResult(null);setErr("");setRecTime(0);setLoad("");setLiveEmo(null);setFrames(0);setCamOk(false);};
  const gc=result?.feedback?gradeColor(ss(result.feedback.grade,"?")):C.muted;

  return(
    <div style={{minHeight:"100vh",background:C.bg,color:C.text,fontFamily:"'Segoe UI',system-ui,sans-serif"}}>
      <div style={{position:"fixed",inset:0,pointerEvents:"none",background:"radial-gradient(ellipse at 10% 30%,#38bdf808,transparent 50%),radial-gradient(ellipse at 90% 10%,#c084fc06,transparent 50%)"}}/>
      <div style={{position:"relative",maxWidth:1240,margin:"0 auto",padding:"18px 14px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10,marginBottom:18}}>
          <div>
            <div style={{fontSize:10,color:C.muted,letterSpacing:3,textTransform:"uppercase",marginBottom:3}}>MockAI · M01+M02+M03+M04+M05</div>
            <h1 style={{margin:0,fontSize:24,fontWeight:900,letterSpacing:-1,background:`linear-gradient(90deg,${C.blue},${C.purple},${C.pink},${C.teal},${C.green})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Mock Interview AI</h1>
            <p style={{margin:"3px 0 0",fontSize:10,color:C.muted}}>Whisper · Librosa · Sentence-Transformers · spaCy · DeepFace · MediaPipe · Feedback Engine</p>
          </div>
          <div style={{background:C.surface,border:`1px solid ${backend?C.blueDim:C.red+"44"}`,borderRadius:11,padding:"8px 12px",fontSize:10,minWidth:178}}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:backend?C.green:C.red,boxShadow:`0 0 6px ${backend?C.green:C.red}`}}/>
              <b style={{color:backend?C.green:C.red,fontSize:11}}>{backend?"All 5 Modules Online":"Backend Offline"}</b>
            </div>
            {backend&&<>
              <div style={{color:C.muted}}>🎤 Whisper · {backend.device}</div>
              <div style={{color:C.muted}}>🔊 Librosa · 🧠 ST+spaCy</div>
              <div style={{color:C.muted}}>📸 DeepFace+MediaPipe</div>
              <div style={{color:C.green}}>💡 Feedback Engine v5</div>
            </>}
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"210px 1fr 190px",gap:14}}>
          <div>
            <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:2,marginBottom:8}}>Questions</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:9}}>
              {cats.map(c=><button key={c} onClick={()=>setFilter(c)} style={{background:filterCat===c?catColor(c)+"22":"transparent",border:`1px solid ${filterCat===c?catColor(c):C.border}`,color:filterCat===c?catColor(c):C.muted,borderRadius:99,padding:"2px 9px",fontSize:10,fontWeight:700,cursor:"pointer"}}>{c}</button>)}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:"76vh",overflowY:"auto"}}>
              {filteredQs.map(q=>(
                <div key={q.id} onClick={()=>{setSelQ(q);reset();}} style={{background:selQ?.id===q.id?`${catColor(q.category)}12`:C.card,border:`1px solid ${selQ?.id===q.id?catColor(q.category):C.border}`,borderRadius:11,padding:"9px 11px",cursor:"pointer",transition:"all .2s"}}>
                  <div style={{fontSize:11,color:C.text,lineHeight:1.5,marginBottom:5}}>{q.question}</div>
                  <span style={{fontSize:9,color:catColor(q.category),background:catColor(q.category)+"18",border:`1px solid ${catColor(q.category)}33`,borderRadius:99,padding:"1px 7px",fontWeight:700}}>{q.category}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {selQ&&<div style={{background:C.card,border:`1px solid ${catColor(selQ.category)}44`,borderRadius:12,padding:"11px 15px",borderLeft:`3px solid ${catColor(selQ.category)}`}}>
              <div style={{fontSize:9,color:catColor(selQ.category),fontWeight:800,textTransform:"uppercase",letterSpacing:1.5,marginBottom:4}}>{selQ.category}</div>
              <div style={{fontSize:15,fontWeight:800,color:C.white,lineHeight:1.5}}>{selQ.question}</div>
            </div>}
            <div style={{border:`1px solid ${status==="recording"?C.blue:C.border}`,borderRadius:12,overflow:"hidden",boxShadow:status==="recording"?`0 0 20px ${C.blueGlow}`:"none",transition:"all .4s"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 11px",background:C.surface,borderBottom:`1px solid ${C.border}`}}>
                <div style={{display:"flex",gap:5}}>{["#ff5f57","#febc2e","#28c840"].map(c=><div key={c} style={{width:8,height:8,borderRadius:"50%",background:c}}/>)}</div>
                <span style={{fontSize:10,color:C.muted}}>{status==="recording"?`⏺ ${fmt(recTime)} · 📸 ${framesSent} frames`:status==="processing"?loadStep:"waveform · idle"}</span>
                <span style={{fontSize:9,color:C.muted}}>16kHz</span>
              </div>
              <Waveform analyser={analyser} active={status==="recording"}/>
            </div>
            <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
              {status!=="recording"
                ?<button onClick={startRec} style={{background:C.blueDim,border:`1px solid ${C.blue}`,color:C.blue,borderRadius:8,padding:"9px 20px",fontSize:12,fontWeight:700,cursor:"pointer"}}>⏺  Start Recording</button>
                :<button onClick={stopRec}  style={{background:C.red+"22",border:`1px solid ${C.red}`,color:C.red,borderRadius:8,padding:"9px 20px",fontSize:12,fontWeight:700,cursor:"pointer"}}>⏹  Stop  {fmt(recTime)}</button>}
              {blob&&status!=="recording"&&status!=="processing"&&<button onClick={analyze} style={{background:`linear-gradient(135deg,${C.blue}22,${C.purple}22)`,border:`1px solid ${C.blue}`,color:C.blue,borderRadius:8,padding:"9px 20px",fontSize:12,fontWeight:700,cursor:"pointer"}}>🚀  Analyse All 5 Modules</button>}
              {status==="processing"&&<div style={{border:`1px solid ${C.blueDim}`,borderRadius:8,padding:"9px 17px",fontSize:11,color:C.blue,display:"flex",alignItems:"center",gap:8}}><span style={{animation:"spin 1s linear infinite",display:"inline-block"}}>◌</span>{loadStep}</div>}
              {(blob||result)&&status!=="recording"&&status!=="processing"&&<button onClick={reset} style={{background:"transparent",border:`1px solid ${C.border}`,color:C.muted,borderRadius:8,padding:"9px 15px",fontSize:11,cursor:"pointer"}}>↺  Reset</button>}
            </div>
            {err&&<div style={{background:C.red+"15",border:`1px solid ${C.red}44`,borderRadius:9,padding:"9px 13px",fontSize:12,color:C.red}}>⚠  {err}</div>}
            {blob&&status==="idle"&&!result&&<div style={{background:C.blueGlow,border:`1px solid ${C.blueDim}`,borderRadius:9,padding:"9px 13px",fontSize:12,color:C.blue}}>✓  Ready ({(blob.size/1024).toFixed(1)} KB) — click <b>Analyse All 5 Modules</b></div>}
            {result&&status==="done"&&<Results result={result} tab={tab} setTab={setTab}/>}
            {status==="idle"&&!result&&!blob&&<Card><SHead icon="📖" text="How to use"/>
              {[["01","Pick a question","Left panel"],["02","Start Recording","Mic + webcam on"],["03","Speak 30–60s","Natural pace"],["04","Analyse","All 5 modules run"],["05","Feedback tab","Grade · Radar · Tips"]].map(([n,t,d])=>(
                <div key={n} style={{display:"flex",gap:10,marginBottom:9}}>
                  <span style={{fontFamily:"monospace",fontSize:10,color:C.blue,background:C.blueGlow,borderRadius:5,padding:"2px 8px",flexShrink:0}}>{n}</span>
                  <div><div style={{fontSize:11,color:C.text,fontWeight:700}}>{t}</div><div style={{fontSize:10,color:C.muted,marginTop:1}}>{d}</div></div>
                </div>
              ))}
            </Card>}
          </div>

          <div>
            <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:2,marginBottom:8}}>Live Webcam</div>
            <div style={{background:C.card,border:`1px solid ${status==="recording"&&camOk?C.teal:C.border}`,borderRadius:12,overflow:"hidden",marginBottom:9,transition:"all .4s"}}>
              <video ref={videoRef} muted playsInline style={{width:"100%",display:"block",filter:status==="recording"?"none":"brightness(0.3)",minHeight:140,background:"#000"}}/>
              <canvas ref={canvasRef} style={{display:"none"}}/>
            </div>
            {liveEmo&&status==="recording"&&liveEmo.face_detected&&(
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                <div style={{display:"flex",alignItems:"center",gap:7,background:C.card,border:`1px solid ${C.teal}44`,borderRadius:9,padding:"7px 10px"}}>
                  <span style={{fontSize:20}}>{emojiEmo(ss(liveEmo.dominant_emotion))}</span>
                  <div>
                    <div style={{fontSize:11,color:C.teal,fontWeight:700,textTransform:"capitalize"}}>{ss(liveEmo.dominant_emotion)}</div>
                    <div style={{fontSize:10,color:C.muted}}>{p100(so(liveEmo.emotions)[liveEmo.dominant_emotion]||0)}%</div>
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
                  {[["Conf",p100(liveEmo.confidence_score),C.teal],["Eyes",p100(liveEmo.eye_contact_score),C.blue]].map(([l,v,col])=>(
                    <div key={l} style={{background:C.surface,borderRadius:7,padding:"6px",textAlign:"center"}}>
                      <div style={{fontSize:14,fontWeight:900,color:col,fontFamily:"monospace"}}>{v}</div>
                      <div style={{fontSize:9,color:C.muted}}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {result&&status==="done"&&(
              <div style={{background:C.card,border:`1px solid ${gc}44`,borderRadius:12,padding:14,textAlign:"center",marginTop:4}}>
                <div style={{fontSize:44,fontWeight:900,fontFamily:"monospace",color:gc,lineHeight:1}}>{ss(result.feedback?.grade,"?")}</div>
                <div style={{fontSize:24,fontWeight:900,color:gc,fontFamily:"monospace",margin:"4px 0"}}>{p100(result.feedback?.overall_score)}</div>
                <div style={{fontSize:9,color:C.muted,marginBottom:8}}>/100 overall</div>
                {[["M02",p100(result.audio?.scores?.delivery_clarity),C.amber],["M03",p100(result.nlp?.nlp_overall_score),C.purple],["M04",p100(result.facial?.confidence_score),C.teal]].map(([m,v,col])=>(
                  <div key={m} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:`1px solid ${C.border}`}}>
                    <span style={{fontSize:9,color:C.muted}}>{m}</span>
                    <span style={{fontSize:9,color:col,fontWeight:700,fontFamily:"monospace"}}>{v}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}*{box-sizing:border-box;}::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-track{background:${C.bg};}::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px;}button:hover{opacity:.85;}`}</style>
    </div>
  );
}