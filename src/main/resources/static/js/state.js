'use strict';
// ════════════════════════════════════════════════════════
//  STATE
// ════════════════════════════════════════════════════════
const S = {
  areas:[],activities:[],projects:[],tasks:[],
  routines:[],events:[],periods:[],balance:[],actions:[],locations:[],
  todayDate: todayISO(),
  currentPage:'today',
  cfgPanel:'areas',
  cfgAreaFilter:'all',
  cfgActivityFilter:'all',
  cfgProjectFilter:'all',
  cfgRoutineActFilter:'all',
  cfgBalancePeriod:'all',
  cfgLocationFilter:'all',
  scoreView:'overview',
  scorePeriod:'day',
  kanbanDragId:null,
  todayLocation:null,
  todaySkipped:new Set(),
  todayPlanned:[],
  freeActions:JSON.parse(localStorage.getItem('lifeos-free-actions')||'[]'),
};

function todayISO(){ return new Date().toISOString().slice(0,10); }

// ════════════════════════════════════════════════════════
//  LOAD ALL FROM API
// ════════════════════════════════════════════════════════
async function loadAll(){
  const [areas,activities,projects,tasks,routines,events,periods,balance,actions] = await Promise.all([
    API.getAreas(), API.getActivities(), API.getProjects(), API.getTasks(),
    API.getRoutines(), API.getEvents(), API.getPeriods(), API.getBalance(),
    API.getActions(),
  ]);
  S.areas=areas; S.activities=activities; S.projects=projects; S.tasks=tasks;
  S.routines=routines; S.events=events; S.periods=periods; S.balance=balance;
  S.actions=actions;
  try { S.locations = await API.getLocations(); } catch(e) { S.locations=[]; }
}

// ════════════════════════════════════════════════════════
//  UTILITIES
// ════════════════════════════════════════════════════════
function uid(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,6); }
function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function fmt(x){ return String(x||''); }
function fmtDate(iso){ if(!iso) return ''; const d=new Date(iso+'T12:00:00'); return d.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}); }
function fmtMin(m){ if(!m) return ''; const h=Math.floor(m/60),mn=m%60; return h>0?`${h}h${mn>0?mn+'m':''}`:`${mn}m`; }
function dayOfWeek(iso){ return new Date(iso+'T12:00:00').getDay(); }
function daysUntil(iso){ if(!iso) return null; return Math.round((new Date(iso)-new Date(todayISO()+'T12:00:00'))/(86400000)); }
function byId(arr,id){ return arr.find(x=>x.id===id); }
function areaOf(id){ return byId(S.areas,id); }
function areaColor(id){ return areaOf(id)?.color||'#888'; }
function activityOf(id){ return byId(S.activities,id); }
function locationOf(id){ return byId(S.locations,id); }

function showToast(msg,dur=2200){
  const t=document.getElementById('toast');
  t.textContent=msg; t.classList.add('show');
  clearTimeout(t._t); t._t=setTimeout(()=>t.classList.remove('show'),dur);
}

// ════════════════════════════════════════════════════════
//  SCORING ENGINE  (client-side, using loaded state)
// ════════════════════════════════════════════════════════
function getPeriodForDate(iso){
  const dow=['sun','mon','tue','wed','thu','fri','sat'][new Date(iso+'T12:00:00').getDay()];
  return S.periods.find(p=>p.dayTypes&&p.dayTypes.split(',').includes(dow)) || S.periods[0] || {id:'_',availableHours:16};
}

function getBalanceWeights(periodId){
  const map={};
  S.balance.filter(b=>b.periodId===periodId).forEach(b=>{ map[b.areaId]=b.weightPct||0; });
  return map;
}

function computeDayScore(isoDate){
  const acts=S.actions.filter(a=>a.date===isoDate);
  if(acts.length===0) return {score:null,areaScores:{},totalMin:0};
  const period=getPeriodForDate(isoDate);
  const weights=getBalanceWeights(period.id);
  const totalAvailMin=(period.availableHours||16)*60;
  const areaMin={},areaPerf={},areaCount={};
  S.areas.forEach(a=>{ areaMin[a.id]=0; areaPerf[a.id]=0; areaCount[a.id]=0; });
  acts.forEach(act=>{
    const areaId=resolveAreaFromAction(act); if(!areaId) return;
    areaMin[areaId]=(areaMin[areaId]||0)+(act.durationMin||0);
    areaPerf[areaId]=(areaPerf[areaId]||0)+(act.performance||5);
    areaCount[areaId]=(areaCount[areaId]||0)+1;
  });
  const areaScores={};
  let weightedTotal=0,weightSum=0;
  S.areas.forEach(a=>{
    const wPct=weights[a.id]||0;
    if(wPct===0){ areaScores[a.id]={score:null,targetMin:0,actualMin:areaMin[a.id]||0}; return; }
    const targetMin=(wPct/100)*totalAvailMin;
    const actualMin=areaMin[a.id]||0;
    const avgPerf=areaCount[a.id]>0?areaPerf[a.id]/areaCount[a.id]:5;
    const combined=Math.min(1,actualMin/targetMin)*0.6+(avgPerf/10)*0.4;
    areaScores[a.id]={score:Math.round(combined*100),targetMin,actualMin,avgPerf:Math.round(avgPerf*10)/10};
    weightedTotal+=combined*wPct; weightSum+=wPct;
  });
  const overall=weightSum>0?Math.round(weightedTotal/weightSum):0;
  const totalMin=acts.reduce((s,a)=>s+(a.durationMin||0),0);
  return {score:overall,areaScores,totalMin,period};
}

function resolveAreaFromAction(act){
  if(act.areaId) return act.areaId;
  if(act.taskId){ const t=byId(S.tasks,act.taskId); if(t) return t.areaId; }
  if(act.routineId){ const r=byId(S.routines,act.routineId); if(r){ const ac=byId(S.activities,r.activityId); if(ac) return ac.areaId; } }
  if(act.eventId){ const e=byId(S.events,act.eventId); if(e) return e.areaId; }
  return null;
}

function scoreColor(s){
  if(s===null||s===undefined) return 'var(--ink3)';
  if(s>=75) return 'var(--score-a)';
  if(s>=45) return 'var(--score-b)';
  return 'var(--score-c)';
}
function scoreLetter(s){
  if(s===null||s===undefined) return '—';
  if(s>=85) return 'A'; if(s>=70) return 'B'; if(s>=50) return 'C'; if(s>=30) return 'D';
  return 'F';
}

// ════════════════════════════════════════════════════════
//  AUTO-AGENDA SUGGESTIONS  (client-side)
// ════════════════════════════════════════════════════════
function generateAgendaSuggestions(){
  const today     = S.todayDate;
  const dow       = new Date(today+'T12:00:00').getDay(); // 0=Sun
  const todayDate = new Date(today+'T12:00:00').getDate();
  const curPeriod = getPeriodForDate(today);
  const curLoc    = S.todayLocation||null;

  // IDs already logged or explicitly skipped today
  const alreadyLogged = S.actions.filter(a=>a.date===today)
    .map(a=>a.routineId||a.eventId||a.taskId).filter(Boolean);
  const skipped = S.todaySkipped||new Set();

  // Helper: is routine due today based on freqNum/freqPeriod or legacy frequency
  function routineDueToday(r){
    // Check applicable periods — if set, only suggest in matching period
    if(r.applicablePeriods){
      const apIds=(typeof r.applicablePeriods==='string'?r.applicablePeriods.split(','):(r.applicablePeriods||[])).filter(Boolean);
      if(apIds.length>0&&!apIds.includes(curPeriod.id)) return false;
    }
    // Check location — if set, only suggest when at that location
    if(r.locationId&&curLoc&&r.locationId!==curLoc) return false;

    // Triggered by event (skip frequency check)
    if(r.eventId) return false;

    const freq  = r.frequency||'';
    const fNum  = r.freqNum||1;
    const fPer  = r.freqPeriod||'day';

    // New format: freqNum x freqPeriod
    if(fPer==='day')     return true;      // every day
    if(fPer==='week'){
      // suggest on preferred day if set, else on Monday
      const prefDay = typeof r.dayOfWeek==='number' ? r.dayOfWeek : 1;
      return fNum===1 ? dow===prefDay : [1,3,5].slice(0,fNum).includes(dow);
    }
    if(fPer==='month'){
      const prefDate = r.dayOfMonth||1;
      return fNum===1 ? todayDate===prefDate : todayDate<=fNum*7&&dow===1;
    }
    // Legacy strings
    if(freq==='daily')                              return true;
    if(freq==='3x-week'&&[1,3,5].includes(dow))    return true;
    if(freq==='2x-week'&&[2,4].includes(dow))       return true;
    if(freq==='weekly'&&dow===1)                    return true;
    return false;
  }

  // Helper: how long since this routine was last performed
  function daysSinceRoutine(routineId){
    const last=S.actions.filter(a=>a.routineId===routineId).sort((a,b)=>b.createdAt-a.createdAt)[0];
    if(!last) return 999;
    return Math.floor((Date.now()-last.createdAt)/86400000);
  }

  const suggestions=[];

  // 1. OVERDUE TASKS — highest priority
  S.tasks.filter(t=>t.status!=='done').forEach(t=>{
    if(alreadyLogged.includes(t.id)||skipped.has(t.id)) return;
    if(t.activationDate&&daysUntil(t.activationDate)>0) return; // not yet active
    if(t.dependsOnTaskId){ const dep=byId(S.tasks,t.dependsOnTaskId); if(dep&&dep.status!=='done') return; } // blocked
    const du=daysUntil(t.deadline);
    if(du!==null&&du<0){
      const proj=byId(S.projects,t.projectId);
      const act=activityOf(t.activityId||(proj?.activityId));
      suggestions.push({type:'task',id:t.id,label:t.label,
        durationMin:t.estimatedMin||60,areaId:t.areaId||proj?.areaId,
        activityId:act?.id,activityLabel:act?.label,
        priority:-1,daysLeft:du,tag:'overdue'});
    }
  });

  // 2. EVENTS today
  S.events.forEach(e=>{
    if(alreadyLogged.includes(e.id)||skipped.has(e.id)) return;
    let due=false;
    if(e.frequency==='weekly'&&typeof e.dayOfWeek==='number'&&e.dayOfWeek===dow) due=true;
    if(e.frequency==='once'&&e.date===today) due=true;
    if(e.frequency==='monthly'&&e.dayOfMonth===todayDate) due=true;
    if(e.frequency==='yearly'&&e.date&&e.date.slice(5)===today.slice(5)) due=true;
    if(due) suggestions.push({type:'event',id:e.id,label:e.label,
      durationMin:e.durationMin||60,areaId:e.areaId,priority:0,tag:'event'});
  });

  // 3. TASKS due soon (0–7 days)
  S.tasks.filter(t=>t.status!=='done').forEach(t=>{
    if(alreadyLogged.includes(t.id)||skipped.has(t.id)) return;
    if(t.activationDate&&daysUntil(t.activationDate)>0) return;
    if(t.dependsOnTaskId){ const dep=byId(S.tasks,t.dependsOnTaskId); if(dep&&dep.status!=='done') return; }
    const du=daysUntil(t.deadline);
    if(du!==null&&du>=0&&du<=7){
      const proj=byId(S.projects,t.projectId);
      const act=activityOf(t.activityId||(proj?.activityId));
      suggestions.push({type:'task',id:t.id,label:t.label,
        durationMin:t.estimatedMin||60,areaId:t.areaId||proj?.areaId,
        activityId:act?.id,activityLabel:act?.label,
        priority:t.priority==='p1'?1:t.priority==='p2'?2:3,daysLeft:du,tag:'deadline'});
    }
  });

  // 4. ROUTINES due today
  S.routines.forEach(r=>{
    if(alreadyLogged.includes(r.id)||skipped.has(r.id)) return;
    if(!routineDueToday(r)) return;
    const act=activityOf(r.activityId);
    const loc=r.locationId?byId(S.locations,r.locationId):null;
    const daysSince=daysSinceRoutine(r.id);
    // Boost priority if overdue (not done in longer than expected)
    const expectedDays=r.freqNum&&r.freqPeriod==='week'?7/r.freqNum:r.freqPeriod==='month'?30/r.freqNum:1;
    const overdueFactor=daysSince>expectedDays*1.5?0:0; // bump to front if skipped
    suggestions.push({type:'routine',id:r.id,label:r.label,
      durationMin:r.durationMin,areaId:act?.areaId,
      activityId:act?.id,activityLabel:act?.label,
      locationLabel:loc?.label,
      priority:4+overdueFactor,tag:'routine',daysSince});
  });

  // 5. TASKS with no deadline (p1/p2, not done)
  S.tasks.filter(t=>t.status!=='done'&&!t.deadline&&(t.priority==='p1'||t.priority==='p2')).forEach(t=>{
    if(alreadyLogged.includes(t.id)||skipped.has(t.id)) return;
    if(t.activationDate&&daysUntil(t.activationDate)>0) return;
    if(t.dependsOnTaskId){ const dep=byId(S.tasks,t.dependsOnTaskId); if(dep&&dep.status!=='done') return; }
    const proj=byId(S.projects,t.projectId);
    const act=activityOf(t.activityId||(proj?.activityId));
    suggestions.push({type:'task',id:t.id,label:t.label,
      durationMin:t.estimatedMin||60,areaId:t.areaId||proj?.areaId,
      activityId:act?.id,activityLabel:act?.label,
      priority:t.priority==='p1'?5:6,tag:'important'});
  });

  // 6. FREE ACTIONS matching current period/location
  S.freeActions.forEach(fa=>{
    if(skipped.has(fa.id)) return;
    // Don't show if already logged today
    const alreadyLoggedFA=S.actions.filter(a=>a.date===today&&a.label===fa.label).length>0;
    if(alreadyLoggedFA) return;
    if(curLoc && fa.locationId && fa.locationId!==curLoc) return;
    suggestions.push({type:'free',id:fa.id,label:fa.label,
      durationMin:fa.durationMin,areaId:fa.areaId,
      activityId:fa.activityId,activityLabel:activityOf(fa.activityId)?.label,
      priority:7,tag:'free'});
  });

  suggestions.sort((a,b)=>a.priority-b.priority);
  return suggestions;
}

// ════════════════════════════════════════════════════════
//  CLOCK
// ════════════════════════════════════════════════════════
function tickClock(){
  const now=new Date();
  document.getElementById('clock').textContent=
    String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
}

// ════════════════════════════════════════════════════════
//  BOOT
// ════════════════════════════════════════════════════════
let _modalMouseDownOnOverlay = false;

async function boot(){
  S.todayDate = todayISO();
  try {
    await loadAll();
  } catch(e) {
    document.body.innerHTML='<div style="padding:40px;font-family:monospace;color:#c84b2f">'+
      '<h2>Cannot connect to lifeOS server</h2><p>Make sure Spring Boot is running on port 8080.</p>'+
      '<pre>'+e.message+'</pre></div>';
    return;
  }
  // Populate kanban area filter
  const sel=document.getElementById('kanban-area-filter');
  if(sel) sel.innerHTML='<option value="all">All areas</option>'+
    S.areas.map(a=>'<option value="'+a.id+'">'+esc(a.label)+'</option>').join('');
  // Attach modal mousedown tracker
  const overlay=document.getElementById('modal-overlay');
  if(overlay) overlay.addEventListener('mousedown',e=>{
    _modalMouseDownOnOverlay=(e.target===overlay);
  });
  tickClock();
  setInterval(tickClock,30000);
  // Render today with fresh data — this is the key fix for agenda on start
  S.todayDate = todayISO();
  renderToday();
}

window.addEventListener('DOMContentLoaded', boot);
