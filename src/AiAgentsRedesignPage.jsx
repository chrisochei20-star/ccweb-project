import { useState } from "react";

const C = {
  bg:"#080C18",surface:"#0D1425",card:"#111827",border:"#1E2D4A",
  cyan:"#00D4FF",cyanDim:"#0099BB",violet:"#7C3AED",violetGlow:"#9D5FF5",
  amber:"#F59E0B",green:"#10B981",red:"#EF4444",
  textPrimary:"#F0F6FF",textSecondary:"#8BA3C4",textMuted:"#4A6080",
};

const AGENTS=[
  {id:1,name:"Market Scout",icon:"📊",status:"active",description:"Scans 50+ crypto exchanges for arbitrage opportunities in real-time",tasks:142,accuracy:94,category:"Trading"},
  {id:2,name:"Content Brain",icon:"✍️",status:"active",description:"Generates Web3 educational content, tweets, and newsletter drafts automatically",tasks:89,accuracy:98,category:"Content"},
  {id:3,name:"Lead Hunter",icon:"🎯",status:"idle",description:"Finds and qualifies potential academy students from social platforms",tasks:56,accuracy:87,category:"Growth"},
  {id:4,name:"Support Bot",icon:"💬",status:"active",description:"Handles community questions 24/7 with context-aware crypto answers",tasks:310,accuracy:92,category:"Support"},
  {id:5,name:"On-Chain Watcher",icon:"🔗",status:"active",description:"Monitors wallet movements and DeFi protocol changes for alerts",tasks:203,accuracy:99,category:"Security"},
  {id:6,name:"Trend Analyst",icon:"📈",status:"idle",description:"Synthesizes Twitter, Telegram, and Reddit signals into weekly briefings",tasks:31,accuracy:88,category:"Research"},
];

function StatusDot({status}){
  const colors={active:C.green,idle:C.amber,paused:C.red};
  return <span style={{display:"inline-block",width:8,height:8,borderRadius:"50%",background:colors[status]||C.textMuted,boxShadow:`0 0 6px ${colors[status]}88`}}/>;
}

export default function AiAgentsRedesignPage(){
  const [filter,setFilter]=useState("All");
  const [agents,setAgents]=useState(AGENTS);
  const categories=["All","Trading","Content","Growth","Support","Security","Research"];
  const filtered=filter==="All"?agents:agents.filter(a=>a.category===filter);

  function toggleAgent(id){
    setAgents(prev=>prev.map(a=>a.id===id?{...a,status:a.status==="active"?"idle":"active"}:a));
  }

  return(
    <section style={{padding:"0 0 2rem"}}>
      <header className="page-header">
        <span className="pill">BUILD — AI Agent Operator</span>
        <h1 className="section-title">AI Agents</h1>
        <p className="muted">Autonomous agents running 24/7 — research, automate, grow, support.</p>
      </header>

      {/* Stats row */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:20}}>
        {[
          {label:"Active",value:agents.filter(a=>a.status==="active").length,color:C.green},
          {label:"Tasks Done",value:agents.reduce((s,a)=>s+a.tasks,0).toLocaleString(),color:C.cyan},
          {label:"Avg Accuracy",value:Math.round(agents.reduce((s,a)=>s+a.accuracy,0)/agents.length)+"%",color:C.violet},
        ].map((s,i)=>(
          <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"12px 10px",textAlign:"center"}}>
            <div style={{fontSize:20,fontWeight:800,color:s.color}}>{s.value}</div>
            <div style={{fontSize:11,color:C.textMuted}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter pills */}
      <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:8,marginBottom:16,scrollbarWidth:"none"}}>
        {categories.map(c=>(
          <button key={c} onClick={()=>setFilter(c)} style={{
            padding:"5px 12px",borderRadius:20,border:`1px solid ${filter===c?C.cyan:C.border}`,
            background:filter===c?`${C.cyan}22`:"transparent",
            color:filter===c?C.cyan:C.textSecondary,
            fontSize:12,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap",
          }}>{c}</button>
        ))}
      </div>

      {/* Agent cards */}
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {filtered.map(agent=>(
          <article key={agent.id} className="panel" style={{padding:16}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{
                  width:44,height:44,borderRadius:12,
                  background:`${C.violet}22`,border:`1px solid ${C.violet}44`,
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,
                }}>{agent.icon}</div>
                <div>
                  <div style={{fontWeight:700,color:C.textPrimary,fontSize:15}}>{agent.name}</div>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginTop:3}}>
                    <StatusDot status={agent.status}/>
                    <span style={{fontSize:11,color:C.textMuted,textTransform:"capitalize"}}>{agent.status}</span>
                    <span style={{background:`${C.violet}22`,color:C.violetGlow,border:`1px solid ${C.violet}33`,borderRadius:6,padding:"1px 7px",fontSize:10,fontWeight:700}}>{agent.category}</span>
                  </div>
                </div>
              </div>
              <button onClick={()=>toggleAgent(agent.id)} style={{
                padding:"5px 14px",borderRadius:8,
                background:agent.status==="active"?`${C.red}22`:`${C.green}22`,
                border:`1px solid ${agent.status==="active"?C.red:C.green}44`,
                color:agent.status==="active"?C.red:C.green,
                fontSize:11,fontWeight:700,cursor:"pointer",
              }}>{agent.status==="active"?"Pause":"Run"}</button>
            </div>
            <p style={{margin:"0 0 12px",fontSize:13,color:C.textSecondary,lineHeight:1.6}}>{agent.description}</p>
            <div style={{display:"flex",gap:20,alignItems:"center"}}>
              <div>
                <div style={{fontSize:18,fontWeight:800,color:C.cyan}}>{agent.tasks}</div>
                <div style={{fontSize:10,color:C.textMuted}}>Tasks</div>
              </div>
              <div>
                <div style={{fontSize:18,fontWeight:800,color:C.green}}>{agent.accuracy}%</div>
                <div style={{fontSize:10,color:C.textMuted}}>Accuracy</div>
              </div>
              <div style={{flex:1}}>
                <div style={{height:4,borderRadius:2,background:C.border}}>
                  <div style={{height:"100%",borderRadius:2,width:`${agent.accuracy}%`,background:C.green}}/>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
