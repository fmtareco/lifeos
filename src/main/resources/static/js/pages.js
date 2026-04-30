// ════════════════════════════════════════════════════════
//  PAGE NAVIGATION
// ════════════════════════════════════════════════════════
async function gotoPage(name){
  S.currentPage=name;
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById('page-'+name).classList.add('active');
  document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active',t.dataset.page===name));
  // sync bottom nav on mobile
  document.querySelectorAll('.bnav-item').forEach(t=>t.classList.toggle('active',t.dataset.page===name));
  // always reload fresh data from server before rendering
  await loadAll();
  renderPage(name);
}

function renderPage(name){
  if(name==='today')   renderToday();
  if(name==='kanban')  renderKanban();
  if(name==='score')   renderScore();
  if(name==='history') renderHistory();
  if(name==='config')  renderConfig();
}

// ════════════════════════════════════════════════════════
//  TODAY PAGE
// ════════════════════════════════════════════════════════
function renderToday(){
  S.todayDate = todayISO(); // always use current date
  const td = S.todayDate;
  const dn = new Date(td+'T12:00:00').toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  document.getElementById('today-heading').textContent='Today';
  document.getElementById('today-date-sub').textContent=dn;
  renderAgendaList();
  renderTodaySidebar();
}

function renderAgendaList(){
  const td=S.todayDate;
  const actions=S.actions.filter(a=>a.date===td).sort((a,b)=>a.createdAt-b.createdAt);
  // Merge generated suggestions with manually planned items
  // Planned items that are already logged get removed
  const alreadyLoggedIds=S.actions.filter(a=>a.date===td)
    .map(a=>a.routineId||a.taskId||a.eventId).filter(Boolean);
  S.todayPlanned=S.todayPlanned.filter(p=>{
    const ref=p.routineId||p.taskId;
    return !ref||!alreadyLoggedIds.includes(ref);
  });
  const generated=generateAgendaSuggestions();
  // Remove generated items that are already in planned
  const plannedRefs=new Set(S.todayPlanned.map(p=>p.routineId||p.taskId).filter(Boolean));
  const filteredGen=generated.filter(s=>!(s.routineId&&plannedRefs.has(s.routineId))&&!(s.taskId&&plannedRefs.has(s.taskId)));
  const suggestions=[...S.todayPlanned, ...filteredGen];
  const el=document.getElementById('agenda-list');

  let html='';

  // Logged actions
  if(actions.length>0){
    html+=`<div style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink3);margin-bottom:8px;">Logged today</div>`;
    actions.forEach(a=>{
      const areaId=resolveAreaFromAction(a);
      const color=areaColor(areaId);
      const name=a.label||resolveActionLabel(a);
      const perf=a.performance?`<span style="font-family:var(--font-display);font-style:italic;font-size:15px;color:${scoreColor(a.performance*10)}">${a.performance}</span>`:'';
      const dur=a.durationMin?`<span class="badge">${fmtMin(a.durationMin)}</span>`:'';
      const notes=a.notes?`<div style="font-size:10px;color:var(--ink3);margin-top:3px;">${esc(a.notes)}</div>`:'';
      const type=a.routineId?'routine':a.taskId?'task':a.eventId?'event':'free';
      html+=`<div class="agenda-item ${a.skipped?'skipped':''}">
        <div class="ai-left-bar" style="background:${color}"></div>
        <div class="ai-time">${a.loggedAt||''}<br><span class="badge">${type}</span></div>
        <div class="ai-body">
          <div class="ai-name">${esc(name)}</div>
          ${notes}
          <div class="ai-meta" style="margin-top:4px;">${dur}${perf}</div>
        </div>
        <div class="ai-actions">
          <button class="btn sm ghost" onclick="openLogModalById('${a.id}')" title="edit action">✎ edit</button>
          <button class="btn sm ghost" onclick="deleteAction('${a.id}')">✕</button>
        </div>
      </div>`;
    });
  }

  // Suggestions
  if(suggestions.length>0){
    html+=`<div style="display:flex;align-items:center;justify-content:space-between;margin:16px 0 8px;">
      <span style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink3);">Suggested for today</span>
      <button class="btn sm ghost" onclick="openPlanModal()" style="font-size:10px;padding:3px 8px;">+ plan action</button>
    </div>`;
    suggestions.forEach(s=>{
      const color=areaColor(s.areaId);
      const badge=s.daysLeft<0?`<span class="tag tag-p1">overdue ${Math.abs(s.daysLeft)}d</span>`:
                  s.daysLeft===0?`<span class="tag tag-p1">due today</span>`:
                  s.daysLeft<=3?`<span class="tag tag-p2">in ${s.daysLeft}d</span>`:
                  `<span class="badge">in ${s.daysLeft||''}d</span>`;
      const typeLabel=s.type==='routine'?'routine':s.type==='event'?'event':'task';
      const actLabel=s.activityLabel?` · ${esc(s.activityLabel)}`:'';
      const locLabel=s.locationLabel?`<span class="badge" style="font-size:9px;margin-left:4px">@ ${esc(s.locationLabel)}</span>`:'';
      const tagMap={overdue:`<span class="tag tag-p1">overdue ${Math.abs(s.daysLeft||0)}d</span>`,
        deadline:s.daysLeft===0?'<span class="tag tag-p1">due today</span>':s.daysLeft<=3?`<span class="tag tag-p2">in ${s.daysLeft}d</span>`:`<span class="badge">in ${s.daysLeft}d</span>`,
        event:'<span class="tag tag-p2">today</span>',
        routine:s.daysSince>1?`<span class="badge">${s.daysSince}d ago</span>`:'',
        important:'<span class="tag tag-p3">priority</span>',
        planned:'<span class="badge" style="background:rgba(47,107,200,.12);color:var(--p3)">planned</span>',
        free:'<span class="badge">free</span>'};
      const tagBadge=tagMap[s.tag]||'';
      html+=`<div class="agenda-item" style="opacity:.85;border-style:dashed">
        <div class="ai-left-bar" style="background:${color}"></div>
        <div class="ai-time">
          <span class="badge">${typeLabel}</span>
          <br><span style="font-size:10px;color:var(--ink3)">${fmtMin(s.durationMin)}</span>
        </div>
        <div class="ai-body">
          <div class="ai-name">${esc(s.label)}<span style="font-size:10px;color:var(--ink3)">${actLabel}</span></div>
          <div class="ai-meta" style="margin-top:4px;">${tagBadge}${locLabel}</div>
        </div>
        <div class="ai-actions">
          <button class="btn sm primary"
            onclick="openLogFromSuggestion('${s.tag}','${s.type}','${s.id}',this)"
            data-label="${esc(s.label)}"
            data-area="${s.areaId||''}"
            data-activity="${s.activityId||''}"
            data-dur="${s.durationMin||0}">log</button>
          <button class="btn sm ghost"
            onclick="editSuggestion('${s.tag}','${s.id}')">✎</button>
          <button class="btn sm ghost"
            onclick="${s.tag==='planned'?'removePlan':'skipSuggestion'}('${s.type==='free'||s.tag==='planned'?s.id:s.type}','${s.id}')">✕</button>
        </div>
      </div>`;
    });
  }

  if(!html) html=`<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
      <span style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink3);">Suggested for today</span>
      <button class="btn sm ghost" onclick="openPlanModal()" style="font-size:10px;padding:3px 8px;">+ plan action</button>
    </div>
    <div class="empty">No suggestions yet. Configure routines and tasks, or click "↺ auto-agenda".</div>`;
  el.innerHTML=html;
}

function resolveActionLabel(a){
  if(a.taskId)   { const t=byId(S.tasks,a.taskId);   return t?.label||'Task'; }
  if(a.routineId){ const r=byId(S.routines,a.routineId); return r?.label||'Routine'; }
  if(a.eventId)  { const e=byId(S.events,a.eventId); return e?.label||'Event'; }
  return 'Action';
}

function renderTodaySidebar(){
  const td=S.todayDate;
  const result=computeDayScore(td);

  // period label
  const curPeriod=getPeriodForDate(td);
  const periodEl=document.getElementById('today-period-label');
  if(periodEl) periodEl.textContent=curPeriod.label||'—';

  // location selector
  const locSel=document.getElementById('today-location-sel');
  if(locSel){
    const cur=S.todayLocation||'';
    locSel.innerHTML='<option value="">— anywhere —</option>'+
      S.locations.map(l=>`<option value="${l.id}" ${cur===l.id?'selected':''}>${esc(l.label)}</option>`).join('');
  }

  // big score
  const sv=result.score;
  document.getElementById('score-big').textContent=sv!==null?sv+'':'—';
  document.getElementById('score-big').style.color=scoreColor(sv);
  document.getElementById('score-label').textContent=sv!==null?scoreLetter(sv)+' — '+totalMinLabel(result.totalMin):'no actions logged';
  document.getElementById('day-score-badge').textContent=`day ${sv!==null?sv:'—'}`;
  document.getElementById('day-score-badge').style.color=scoreColor(sv);

  // cursor strip
  const pct=sv!==null?sv:50;
  document.getElementById('score-cursor').style.left=pct+'%';

  // donut canvas
  drawDonut('score-donut',sv);

  // area bars
  const barsEl=document.getElementById('area-balance-bars');
  let barsHtml='';
  S.areas.forEach(a=>{
    const as=result.areaScores[a.id];
    if(!as||as.targetMin===0) return;
    const pct=as.score!==null?as.score:0;
    barsHtml+=`<div class="area-bar-row">
      <div class="area-bar-label" title="${esc(a.label)}">${esc(a.label.split(' ')[0])}</div>
      <div class="area-bar-track"><div class="area-bar-fill" style="width:${pct}%;background:${scoreColor(pct)}"></div></div>
      <div class="area-bar-val">${pct}%</div>
    </div>`;
  });
  barsEl.innerHTML=barsHtml||'<div style="font-size:11px;color:var(--ink3)">Set up balance weights in Configure.</div>';

  // time logged
  const actions=S.actions.filter(a=>a.date===td);
  const totalMin=actions.reduce((s,a)=>s+(a.durationMin||0),0);
  document.getElementById('time-logged-summary').innerHTML=
    `<span style="font-family:var(--font-display);font-style:italic;font-size:20px;">${fmtMin(totalMin)||'0m'}</span> logged<br>
     ${actions.length} action${actions.length!==1?'s':''} recorded`;

  // deadlines
  const upcoming=S.tasks.filter(t=>t.status!=='done'&&t.deadline)
    .map(t=>({...t,du:daysUntil(t.deadline)}))
    .filter(t=>t.du!==null&&t.du<=7)
    .sort((a,b)=>a.du-b.du).slice(0,5);
  const dlEl=document.getElementById('deadlines-widget');
  if(!upcoming.length){ dlEl.innerHTML='<span style="color:var(--ink3)">No urgent deadlines.</span>'; return; }
  dlEl.innerHTML=upcoming.map(t=>`
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <span style="color:var(--ink2)">${esc(t.label)}</span>
      <span class="tag ${t.du<0?'tag-p1':t.du<=2?'tag-p2':'tag-p3'}">${t.du<0?`${Math.abs(t.du)}d overdue`:t.du===0?'today':`${t.du}d`}</span>
    </div>`).join('');
}

function totalMinLabel(m){ return m>0?`${fmtMin(m)} logged`:''; }

function drawDonut(canvasId,val){
  const c=document.getElementById(canvasId);
  if(!c) return;
  const ctx=c.getContext('2d');
  const w=c.width,h=c.height,r=w/2-6,cx=w/2,cy=h/2;
  ctx.clearRect(0,0,w,h);
  const pct=(val||0)/100;
  const color=scoreColor(val);
  // track
  ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2);
  ctx.strokeStyle='#d8d0c4'; ctx.lineWidth=7; ctx.stroke();
  // fill
  if(val!==null){
    ctx.beginPath(); ctx.arc(cx,cy,r,-Math.PI/2,-Math.PI/2+Math.PI*2*pct);
    ctx.strokeStyle=color; ctx.lineWidth=7; ctx.stroke();
  }
}

async function generateAgenda(){
  S.todaySkipped = new Set();
  S.todayDate = todayISO();
  await loadAll();
  renderAgendaList();
  renderTodaySidebar();
  showToast('Agenda refreshed');
}

async function quickLog(type,id,label,durationMin,areaId){
  const action={
    id:uid(), date:S.todayDate,
    label,
    [type+'Id']:id,
    areaId:areaId||null,
    durationMin:durationMin||0,
    performance:null,
    notes:'',
    resources:JSON.stringify([]),
    loggedAt:new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}),
    createdAt:Date.now(),
  };
  await API.saveAction(action);
  if(type==='task'){ const t=byId(S.tasks,id); if(t){ t.status='done'; await API.saveTask(t); } }
  await loadAll();
  renderToday();
  showToast('Logged: '+label);
}

async function deleteAction(id){
  await API.deleteAction(id);
  await loadAll();
  renderToday();
}

function editPlan(id){
  const plan=S.todayPlanned.find(p=>p.id===id);
  if(!plan) return;
  openPlanModal();
  // Pre-fill after modal renders
  setTimeout(()=>{
    const lbl=document.getElementById('mp2-label'); if(lbl) lbl.value=plan.label;
    const area=document.getElementById('mp2-area'); if(area&&plan.areaId) area.value=plan.areaId;
    const dur=document.getElementById('mp2-dur'); if(dur&&plan.durationMin) dur.value=plan.durationMin;
    const typeSel=document.getElementById('mp2-type'); if(typeSel) typeSel.value=plan.routineId?'routine':plan.taskId?'task':'free';
    // Remove old plan entry — savePlan will create a new one
    S.todayPlanned=S.todayPlanned.filter(p=>p.id!==id);
    onPlanTypeChange();
    setTimeout(()=>{
      const ref=document.getElementById('mp2-ref');
      if(ref&&plan.routineId) ref.value=plan.routineId;
      if(ref&&plan.taskId) ref.value=plan.taskId;
    },30);
  },50);
}
function removePlan(id){
  S.todayPlanned=S.todayPlanned.filter(p=>p.id!==id);
  renderAgendaList();
}
function skipSuggestion(type,id){
  S.todaySkipped.add(id);
  showToast('Skipped');
  renderAgendaList();
}

// ════════════════════════════════════════════════════════
//  KANBAN PAGE
// ════════════════════════════════════════════════════════
function renderKanban(){
  // Populate area filter
  const sel=document.getElementById('kanban-area-filter');
  const cur=sel.value||'all';
  sel.innerHTML='<option value="all">All areas</option>'+
    S.areas.map(a=>`<option value="${a.id}" ${cur===a.id?'selected':''}>${esc(a.label)}</option>`).join('');

  const filterArea=sel.value;
  const cols=['todo','doing','done'];
  const colLabels={'todo':'To Do','doing':'In Progress','done':'Done'};

  // Compute day score per col (just overall)
  const dayResult=computeDayScore(S.todayDate);

  let tasks=S.tasks;
  if(filterArea!=='all') tasks=tasks.filter(t=>t.areaId===filterArea);

  let html='';
  cols.forEach(col=>{
    const colTasks=tasks.filter(t=>(t.status||'todo')===col)
      .sort((a,b)=>({p1:0,p2:1,p3:2,'':3}[a.priority]??3)-({p1:0,p2:1,p3:2,'':3}[b.priority]??3));
    const scoreDisp=col==='done'?`<span class="k-score" style="color:${scoreColor(dayResult.score)}">${dayResult.score!==null?dayResult.score+'':'—'}</span>`:'';
    const cards=colTasks.map(t=>{
      const color=areaColor(t.areaId);
      const du=daysUntil(t.deadline);
      const dl=t.deadline?`<span class="tag ${du<0?'tag-p1':du<=2?'tag-p2':'tag-p3'}">${du<0?`⚠ ${Math.abs(du)}d`:du===0?'today':du+'d'}</span>`:'';
      const pBadge=t.priority?`<span class="tag tag-${t.priority}">${{p1:'urgent',p2:'important',p3:'someday'}[t.priority]}</span>`:'';
      const proj=t.projectId?`<span class="badge" style="font-size:9px">${esc(byId(S.projects,t.projectId)?.label||'')}</span>`:'';
      return `<div class="k-card" id="kc-${t.id}" draggable="true"
          ondragstart="kDragStart('${t.id}')" ondragend="kDragEnd()">
        <div class="k-card-name" style="border-left:2px solid ${color};padding-left:7px">${esc(t.label)}</div>
        <div class="k-card-meta">${pBadge}${dl}${proj}</div>
        <div style="display:flex;gap:5px;margin-top:8px;">
          <button class="btn sm ghost" onclick="openTaskModal('${t.id}')">✎</button>
          <button class="btn sm primary" onclick="openLogModal(null,'task','${t.id}')">log</button>
        </div>
      </div>`;
    }).join('');

    html+=`<div class="k-col">
      <div class="k-col-head" style="${col==='todo'?'border-top:2px solid var(--p2)':col==='doing'?'border-top:2px solid var(--p1)':'border-top:2px solid var(--accent3)'}">
        ${colLabels[col]} <span class="badge">${colTasks.length}</span>${col==='done'?scoreDisp:''}
      </div>
      <div class="k-cards k-drop-zone" id="kdrop-${col}"
        ondragover="kDragOver(event,'${col}')" ondrop="kDrop(event,'${col}')"
        ondragleave="kDragLeave(event)">
        ${cards||'<div style="padding:12px;font-size:10px;color:var(--ink3);font-style:italic">drop here</div>'}
      </div>
      <button class="k-add-btn" onclick="openTaskModal(null,'${col}')">+ add task</button>
    </div>`;
  });
  document.getElementById('kanban-wrap').innerHTML=html;
}

function kDragStart(id){ S.kanbanDragId=id; setTimeout(()=>document.getElementById('kc-'+id)?.classList.add('dragging'),0); }
function kDragEnd(){ S.kanbanDragId=null; document.querySelectorAll('.k-card').forEach(c=>c.classList.remove('dragging')); document.querySelectorAll('.k-drop-zone').forEach(z=>z.classList.remove('drag-over')); }
function kDragOver(e,col){ e.preventDefault(); e.currentTarget.classList.add('drag-over'); }
function kDragLeave(e){ e.currentTarget.classList.remove('drag-over'); }
async function kDrop(e,col){
  e.preventDefault(); e.currentTarget.classList.remove('drag-over');
  const id=S.kanbanDragId; if(!id) return;
  const t=byId(S.tasks,id); if(!t) return;
  t.status=col; t.done=col==='done';
  await API.saveTask(t);
  renderKanban();
}

// ════════════════════════════════════════════════════════
//  SCORE PAGE
// ════════════════════════════════════════════════════════
function setScoreView(v){
  S.scoreView=v;
  document.querySelectorAll('.score-nav-item').forEach(el=>el.classList.toggle('active',el.dataset.sv===v));
  renderScore();
}

function renderScore(){
  const el=document.getElementById('score-content');
  const v=S.scoreView;
  const period=S.scorePeriod||'day';

  // gather date range
  const dates=getDatesForPeriod(period);
  const allActions=S.actions.filter(a=>dates.includes(a.date));

  let html=`<div class="period-tabs">
    ${['day','week','month','year'].map(p=>`<div class="period-tab ${period===p?'active':''}" onclick="setScorePeriod('${p}')">${p}</div>`).join('')}
  </div>`;

  if(v==='overview'){
    // Daily scores chart
    html+=`<div style="margin-bottom:24px;">
      <div class="section-head"><h3>Daily scores — ${period}</h3></div>
      <div class="bar-chart" id="score-bar-chart">`;
    dates.slice(-14).forEach(d=>{
      const r=computeDayScore(d);
      const sv=r.score;
      const h=sv!==null?sv:3;
      const dn=new Date(d+'T12:00:00');
      const dl=dn.toLocaleDateString('en-GB',{day:'numeric',month:'short'});
      html+=`<div class="bar-col">
        <div class="bar-val">${sv!==null?sv:'·'}</div>
        <div class="bar-fill" style="height:${h}%;background:${scoreColor(sv)};min-height:4px;width:100%;border-radius:2px 2px 0 0"></div>
        <div class="bar-label">${dl.split(' ')[0]}</div>
      </div>`;
    });
    html+=`</div></div>`;

    // Period summary
    const periodScores=dates.map(d=>computeDayScore(d)).filter(r=>r.score!==null);
    const avg=periodScores.length?Math.round(periodScores.reduce((s,r)=>s+r.score,0)/periodScores.length):null;
    const totalMin=allActions.reduce((s,a)=>s+(a.durationMin||0),0);
    html+=`<div class="grid3" style="margin-bottom:24px;">
      <div class="card" style="text-align:center">
        <div style="font-family:var(--font-display);font-style:italic;font-size:36px;color:${scoreColor(avg)}">${avg!==null?avg:'—'}</div>
        <div style="font-size:10px;color:var(--ink3);text-transform:uppercase;letter-spacing:.1em">avg score</div>
      </div>
      <div class="card" style="text-align:center">
        <div style="font-family:var(--font-display);font-style:italic;font-size:36px;">${fmtMin(totalMin)||'—'}</div>
        <div style="font-size:10px;color:var(--ink3);text-transform:uppercase;letter-spacing:.1em">total logged</div>
      </div>
      <div class="card" style="text-align:center">
        <div style="font-family:var(--font-display);font-style:italic;font-size:36px;">${allActions.length}</div>
        <div style="font-size:10px;color:var(--ink3);text-transform:uppercase;letter-spacing:.1em">actions</div>
      </div>
    </div>`;
  }

  if(v==='areas'){
    html+=`<div class="section-head"><h3>Area breakdown — ${period}</h3></div>`;
    S.areas.forEach(area=>{
      const aActs=allActions.filter(a=>resolveAreaFromAction(a)===area.id);
      const totMin=aActs.reduce((s,a)=>s+(a.durationMin||0),0);
      const avgPerf=aActs.filter(a=>a.performance).length?
        Math.round(aActs.filter(a=>a.performance).reduce((s,a)=>s+a.performance,0)/aActs.filter(a=>a.performance).length*10)/10:null;
      html+=`<div class="card" style="margin-bottom:8px;">
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="width:10px;height:10px;border-radius:50%;background:${area.color};display:inline-block;flex-shrink:0"></span>
          <span style="font-size:13px;">${esc(area.label)}</span>
          <span class="badge" style="margin-left:auto">${fmtMin(totMin)||'0m'}</span>
          ${avgPerf!==null?`<span style="font-family:var(--font-display);font-style:italic;font-size:16px;color:${scoreColor(avgPerf*10)}">${avgPerf}</span>`:''}
        </div>
        ${aActs.length?`<div class="area-bar-track" style="height:6px;margin-top:8px;"><div class="area-bar-fill" style="width:${Math.min(100,totMin/6)}%;background:${area.color}"></div></div>`:''}
        <div style="font-size:10px;color:var(--ink3);margin-top:4px">${aActs.length} action${aActs.length!==1?'s':''}</div>
      </div>`;
    });
  }

  if(v==='activities'){
    html+=`<div class="section-head"><h3>Activity breakdown — ${period}</h3></div>`;
    S.activities.forEach(ac=>{
      const area=byId(S.areas,ac.areaId);
      // find related routine/task actions
      const relRoutines=S.routines.filter(r=>r.activityId===ac.id).map(r=>r.id);
      const acActs=allActions.filter(a=>a.activityId===ac.id||(a.routineId&&relRoutines.includes(a.routineId)));
      const totMin=acActs.reduce((s,a)=>s+(a.durationMin||0),0);
      html+=`<div class="card" style="margin-bottom:8px;">
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="width:8px;height:8px;border-radius:50%;background:${area?.color||'#888'};display:inline-block"></span>
          <span>${esc(ac.label)}</span>
          <span style="font-size:10px;color:var(--ink3)">${esc(area?.label||'')}</span>
          <span class="badge" style="margin-left:auto">${fmtMin(totMin)||'0m'}</span>
        </div>
      </div>`;
    });
  }

  if(v==='balance'){
    html+=`<div class="section-head"><h3>Balance alignment — ${period}</h3></div>`;
    const period2=getPeriodForDate(S.todayDate);
    const weights=getBalanceWeights(period2.id);
    areasToShow.forEach(a=>{
      const wPct=weights[a.id]||0;
      const aActs=allActions.filter(act=>resolveAreaFromAction(act)===a.id);
      const actualMin=aActs.reduce((s,act)=>s+(act.durationMin||0),0);
      const targetMin=(wPct/100)*(period2.availableHours||16)*60*dates.length;
      const ratio=targetMin>0?Math.round(Math.min(200,(actualMin/targetMin)*100)):null;
      if(wPct===0) return;
      html+=`<div class="balance-area-row">
        <div class="bal-area-head">
          <span style="width:8px;height:8px;border-radius:50%;background:${a.color};display:inline-block"></span>
          <span class="bal-area-name">${esc(a.label)}</span>
          <span class="bal-pct">${ratio!==null?ratio+'%':'—'}</span>
        </div>
        <div style="display:flex;gap:8px;font-size:10px;color:var(--ink3)">
          <span>target: ${fmtMin(targetMin)}</span>
          <span>actual: ${fmtMin(actualMin)}</span>
          <span>weight: ${wPct}%</span>
        </div>
        <div class="area-bar-track" style="height:6px;margin-top:6px;">
          <div class="area-bar-fill" style="width:${Math.min(100,ratio||0)}%;background:${scoreColor(ratio||0)}"></div>
        </div>
      </div>`;
    });
  }

  el.innerHTML=html;
}

function setScorePeriod(p){
  S.scorePeriod=p;
  renderScore();
}

function getDatesForPeriod(period){
  const today=S.todayDate;
  const d=new Date(today+'T12:00:00');
  const dates=[];
  if(period==='day') return [today];
  if(period==='week'){ for(let i=6;i>=0;i--){ const dd=new Date(d); dd.setDate(d.getDate()-i); dates.push(dd.toISOString().slice(0,10)); } return dates; }
  if(period==='month'){ for(let i=29;i>=0;i--){ const dd=new Date(d); dd.setDate(d.getDate()-i); dates.push(dd.toISOString().slice(0,10)); } return dates; }
  if(period==='year'){ for(let i=364;i>=0;i--){ const dd=new Date(d); dd.setDate(d.getDate()-i); dates.push(dd.toISOString().slice(0,10)); } return dates; }
  return [today];
}

// ════════════════════════════════════════════════════════
//  HISTORY PAGE
// ════════════════════════════════════════════════════════
function renderHistory(){
  const el=document.getElementById('history-list');
  // collect all unique dates with actions
  const datesWithActions=[...new Set(S.actions.map(a=>a.date))].sort().reverse();
  if(!datesWithActions.length){ el.innerHTML='<div class="empty">No history yet.</div>'; return; }

  let html='';
  datesWithActions.forEach(d=>{
    const acts=S.actions.filter(a=>a.date===d);
    const result=computeDayScore(d);
    const dn=new Date(d+'T12:00:00').toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short',year:'numeric'});
    const totalMin=acts.reduce((s,a)=>s+(a.durationMin||0),0);
    const isToday=d===S.todayDate;
    html+=`<div class="history-row" onclick="toggleHistoryDetail('${d}')">
      <div class="hist-date">${dn}${isToday?'<br><span class="tag tag-p2">today</span>':''}</div>
      <div class="hist-summary">${acts.length} action${acts.length!==1?'s':''} · ${fmtMin(totalMin)||'0m'}</div>
      <div class="hist-score" style="color:${scoreColor(result.score)}">${result.score!==null?result.score:'—'}</div>
    </div>
    <div id="hist-detail-${d}" style="display:none;background:var(--bg3);border:1px solid var(--line);border-top:none;margin-bottom:5px;">
      ${acts.map(a=>`<div class="log-entry">
        <div class="log-time">${a.loggedAt||''}</div>
        <div class="log-name">${esc(a.label||resolveActionLabel(a))}</div>
        <div class="log-dur">${a.durationMin?fmtMin(a.durationMin):''}</div>
        ${a.performance!==null&&a.performance!==undefined?`<div class="log-perf" style="color:${scoreColor(a.performance*10)}">${a.performance}</div>`:''}
        <button class="btn sm ghost" style="padding:2px 6px;font-size:10px;flex-shrink:0" onclick="openLogModalById('${a.id}')">✎</button>
      </div>`).join('')}
    </div>`;
  });
  el.innerHTML=html;
}

function toggleHistoryDetail(d){
  const el=document.getElementById('hist-detail-'+d);
  if(el) el.style.display=el.style.display==='none'?'block':'none';
}

// ════════════════════════════════════════════════════════
