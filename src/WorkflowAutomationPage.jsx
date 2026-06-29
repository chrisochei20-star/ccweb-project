import { useState } from "react";

const C = {
  bg:"#080C18",card:"#111827",border:"#1E2D4A",
  cyan:"#00D4FF",cyanDim:"#0099BB",violet:"#7C3AED",violetGlow:"#9D5FF5",
  amber:"#F59E0B",green:"#10B981",red:"#EF4444",
  textPrimary:"#F0F6FF",textSecondary:"#8BA3C4",textMuted:"#4A6080",
};

const WORKFLOWS=[
  {id:1,name:"New User Onboarding",trigger:"User Registration",steps:5,runs:1240,lastRun:"3m ago",status:"active",successRate:97},
  {id:2,name:"Course Completion Reward",trigger:"Course Finished",steps:3,runs:880,lastRun:"12m ago",status:"active",successRate:100},
  {id:3,name:"Marketplace Order Flow",trigger:"Order Placed",steps:7,runs:432,lastRun:"1h ago",status:"active",successRate:94},
  {id:4,name:"Weekly Leaderboard",trigger:"Every Sunday 00:00",steps:4,runs:12,lastRun:"6d ago",status:"scheduled",successRate:100},
  {id:5,name:"Airdrop Campaign",trigger:"Manual / API",steps:6,runs:3,lastRun:"2d ago",status:"paused",successRate:100},
];

function StatusDot({status}){
  const colors={active:C.green,idle:C.amber,paused:C.red,scheduled:C.cyan};
  return <span style={{display:"inline-block",width:8,height:8,borderRadius:"50%",background:colors[status]||C.textMuted,boxShadow:`0 0 6px ${colors[status]}88`}}/>;
}

export default function WorkflowAutomationPage(){
  const [flows,setFlows]=useState(WORKFLOWS);

  function toggleFlow(id){
    setFlows(prev=>prev.map(f=>f.id===id?{...f,status:f.status==="paused"?"active":"paused"}:f));
  }

  const totalRuns=flows.reduce((s,f)=>s+f.runs,0);
  const avgSuccess=Math.round(flows.reduce((s,f)=>s+f.successRate,0)/flows.length);
  const activeCount=flows.filter(f=>f.status==="active").length;

  return(
    <section style={{padding:"0 0 2rem"}}>
      <header className="page-header">
        <span className="pill">BUILD — Automation</span>
        <h1 className="section-title">Workflow Automation</h1>
        <p className="muted">Compose triggers and actions. Extend with <code style={{color:C.violetGlow,background:`${C.violet}22`,padding:"1px 6px",borderRadius:4}}>/api/v1/agents/run</code> when authenticated.</p>
      </header>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
        {[
          {label:"Total Runs",value:totalRuns.toLocaleString(),icon:"⚡",color:C.cyan},
          {label:"Avg Success",value:avgSuccess+"%",icon:"✅",color:C.green},
          {label:"Active Flows",value:activeCount,icon:"🔄",color:C.violet},
          {label:"Workflows",value:flows.length,icon:"🗂",color:C.amber},
        ].map((s,i)=>(
          <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"12px 14px",display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:22}}>{s.icon}</span>
            <div>
              <div style={{fontSize:20,fontWeight:800,color:s.color}}>{s.value}</div>
              <div style={{fontSize:11,color:C.textMuted}}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Add button */}
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:14}}>
        <button style={{
          padding:"8px 18px",borderRadius:10,
          background:`${C.cyan}22`,border:`1px solid ${C.cyan}44`,
          color:C.cyan,fontSize:12,fontWeight:700,cursor:"pointer",
        }}>+ New Workflow</button>
      </div>

      {/* Workflow list */}
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {flows.map(wf=>(
          <article key={wf.id} className="panel" style={{padding:16}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                  <StatusDot status={wf.status}/>
                  <span style={{fontWeight:700,fontSize:15,color:C.textPrimary}}>{wf.name}</span>
                </div>
                <div style={{fontSize:12,color:C.textMuted,marginBottom:10}}>
                  Trigger: <span style={{color:C.amber}}>{wf.trigger}</span> · {wf.steps} steps
                </div>
                <div style={{display:"flex",gap:14}}>
                  <span style={{fontSize:12,color:C.textSecondary}}><span style={{color:C.cyan,fontWeight:700}}>{wf.runs.toLocaleString()}</span> runs</span>
                  <span style={{fontSize:12,color:C.textSecondary}}><span style={{color:C.green,fontWeight:700}}>{wf.successRate}%</span> success</span>
                  <span style={{fontSize:12,color:C.textMuted}}>Last: {wf.lastRun}</span>
                </div>
              </div>
              <div style={{display:"flex",gap:6}}>
                <button style={{
                  width:32,height:32,borderRadius:8,border:`1px solid ${C.border}`,
                  background:"transparent",color:C.textSecondary,fontSize:14,cursor:"pointer",
                }}>✏️</button>
                <button onClick={()=>toggleFlow(wf.id)} style={{
                  width:32,height:32,borderRadius:8,
                  border:`1px solid ${wf.status==="paused"?C.green+"44":C.amber+"44"}`,
                  background:wf.status==="paused"?`${C.green}22`:`${C.amber}22`,
                  color:wf.status==="paused"?C.green:C.amber,
                  fontSize:14,cursor:"pointer",
                }}>{wf.status==="paused"?"▶":"⏸"}</button>
              </div>
            </div>
            <div style={{marginTop:12,height:3,borderRadius:2,background:C.border}}>
              <div style={{height:"100%",borderRadius:2,width:`${wf.successRate}%`,background:C.green}}/>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
