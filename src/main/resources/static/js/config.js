// ════════════════════════════════════════════════════════
//  CONFIG PAGE
// ════════════════════════════════════════════════════════
function setCfgPanel(name){
  S.cfgPanel=name;
  document.querySelectorAll('.cfg-nav-item').forEach(el=>el.classList.toggle('active',el.dataset.cp===name));
  document.querySelectorAll('.cfg-panel').forEach(el=>el.classList.remove('active'));
  document.getElementById('cfg-'+name).classList.add('active');
  // keep mobile dropdown in sync
  const mob=document.getElementById('cfg-mobile-nav');
  if(mob) mob.value=name;
  renderCfgPanel(name);
}

function setCfgAreaFilter(areaId){
  S.cfgAreaFilter=areaId;
  S.cfgLocationFilter='all';  // reset location filter when area changes
  const sel=document.getElementById('cfg-area-filter');
  if(sel) sel.value=areaId;
  const locSel=document.getElementById('cfg-location-filter');
  if(locSel) locSel.value='all';
  renderCfgPanel(S.cfgPanel);
}

function renderConfig(){
  const sel=document.getElementById('cfg-area-filter');
  if(sel){
    sel.innerHTML='<option value="all">All areas</option>'+
      S.areas.map(a=>`<option value="${a.id}" ${S.cfgAreaFilter===a.id?'selected':''}>`+
        a.label.replace(/&/g,'&amp;')+'</option>').join('');
  }
  const locSel=document.getElementById('cfg-location-filter');
  if(locSel){
    locSel.innerHTML='<option value="all">All locations</option>'+
      S.locations.map(l=>`<option value="${l.id}" ${S.cfgLocationFilter===l.id?'selected':''}>`+
        l.label.replace(/&/g,'&amp;')+'</option>').join('');
    locSel.value=S.cfgLocationFilter||'all';
  }
  renderCfgPanel(S.cfgPanel);
}

function renderCfgPanel(name){
  try {
  // Use arrow functions so each panel renderer is looked up at call time
  // (avoids "not defined" errors from cross-file references)
  const fns={
    areas:      ()=>renderCfgAreas(),
    activities: ()=>renderCfgActivities(),
    projects:   ()=>renderCfgProjects(),
    tasks:      ()=>renderCfgTasks(),
    routines:   ()=>renderCfgRoutines(),
    events:     ()=>renderCfgEvents(),
    locations:  ()=>renderCfgLocations(),
    balance:    ()=>renderCfgBalance(),
    periods:    ()=>renderCfgPeriods(),
    freeactions:()=>{ if(typeof renderCfgFreeActions==='function') renderCfgFreeActions(); },
  };
  fns[name]?.();
  } catch(e){ console.error('renderCfgPanel('+name+') error:', e); if(typeof showToast==='function') showToast('Panel error: '+e.message); }
}

// ── AREAS ──
function renderCfgAreas(){
  const el=document.getElementById('cfg-areas');
  if(!el){ console.error('Element not found'); return; }
  el.innerHTML=`<div class="section-head"><h3>Areas</h3>
    <button class="btn sm primary" onclick="openAreaModal(null)" style="margin-left:auto">+ area</button></div>
  <div class="entity-list">
    ${S.areas.map(a=>`<div class="entity-row">
      <span style="width:10px;height:10px;border-radius:50%;background:${a.color};display:inline-block;flex-shrink:0"></span>
      <div class="entity-row-main"><div class="entity-row-name">${esc(a.label)}</div></div>
      <div class="entity-actions">
        <button class="btn sm ghost" onclick="openAreaModal('${a.id}')">✎</button>
        <button class="btn sm danger" onclick="deleteEntity('areas','${a.id}')">✕</button>
      </div>
    </div>`).join('')||'<div class="empty">No areas defined.</div>'}
  </div>`;
}

// ── ACTIVITIES ──
function renderCfgActivities(){
  const el=document.getElementById('cfg-activities');
  if(!el){ console.error('Element not found'); return; }
  const af=S.cfgAreaFilter;
  const lf=S.cfgLocationFilter||'all';
  let filtered=S.activities.filter(a=>af==='all'||a.areaId===af);
  if(lf!=='all') filtered=filtered.filter(a=>{ const locs=(a.locationIds||'').split(',').filter(Boolean); return locs.length===0||locs.includes(lf); });
  el.innerHTML=`<div class="section-head"><h3>Activities</h3>${af!=='all'?`<span class="badge" style="background:${areaColor(af)}1a;color:${areaColor(af)}">${esc(areaOf(af)?.label||'')}</span>`:''}
    <button class="btn sm primary" onclick="openActivityModal(null)" style="margin-left:auto">+ activity</button></div>
  <div class="entity-list">
    ${filtered.map(a=>{
      const area=byId(S.areas,a.areaId);
      const goalsLabel = a.goalsNum && a.goalsPeriod ? `${a.goalsNum}× / ${a.goalsPeriod}` : esc(a.goals||'');
      return `<div class="entity-row">
        <div class="entity-row-main">
          <div class="entity-row-name">${esc(a.label)}</div>
          <div class="entity-row-meta">${area?`<span style="color:${area.color}">${esc(area.label)}</span>`:'no area'}${goalsLabel?' · '+goalsLabel:''}</div>
        </div>
        <div class="entity-actions">
          <button class="btn sm ghost" onclick="renderCfgFreeActions('${a.areaId}','${a.id}')">⚡ free</button>
          <button class="btn sm ghost" onclick="openActivityModal('${a.id}')">✎</button>
          <button class="btn sm danger" onclick="deleteEntity('activities','${a.id}')">✕</button>
        </div>
      </div>`;}).join('')||`<div class="empty">No activities${af!=='all'?' in this area':''}.</div>`}
  </div>`;
}

// ── PROJECTS ──
function renderCfgProjects(){
  const el=document.getElementById('cfg-projects');
  if(!el){ console.error('Element not found'); return; }
  const af=S.cfgAreaFilter;
  const lf=S.cfgLocationFilter||'all';
  const acFilter=S.cfgActivityFilter||'all';
  let filtered=S.projects.filter(p=>af==='all'||p.areaId===af);
  if(acFilter!=='all') filtered=filtered.filter(p=>p.activityId===acFilter);
  if(lf!=='all') filtered=filtered.filter(p=>{ const locs=(p.locationIds||'').split(',').filter(Boolean); return locs.length===0||locs.includes(lf); });
  // activity filter dropdown (scoped to area filter)
  const actsForArea = af==='all'?S.activities:S.activities.filter(a=>a.areaId===af);
  const acFilterHtml=`<select onchange="S.cfgActivityFilter=this.value;renderCfgProjects()" style="font-size:11px;padding:4px 8px;margin-left:8px;">
    <option value="all">All activities</option>
    ${actsForArea.map(a=>`<option value="${a.id}" ${acFilter===a.id?'selected':''}>${esc(a.label)}</option>`).join('')}
  </select>`;
  el.innerHTML=`<div class="section-head"><h3>Projects</h3>${af!=='all'?`<span class="badge" style="background:${areaColor(af)}1a;color:${areaColor(af)}">${esc(areaOf(af)?.label||'')}</span>`:''}
    ${acFilterHtml}
    <button class="btn sm primary" onclick="openProjectModal(null)" style="margin-left:auto">+ project</button></div>
  <div class="entity-list">
    ${filtered.map(p=>{
      const area=byId(S.areas,p.areaId);
      const act=byId(S.activities,p.activityId);
      const du=daysUntil(p.deadline);
      const depProj=byId(S.projects,p.dependsOnProjectId);
      const STATUS_LABELS={todo:'To Do',doing:'In Progress',done:'Done',suspended:'Suspended',waiting:'Waiting'};
      return `<div class="entity-row">
        <div class="entity-row-main">
          <div class="entity-row-name">${esc(p.label)}</div>
          <div class="entity-row-meta">
            ${area?`<span style="color:${area.color}">${esc(area.label)}</span>`:''}
            ${act?` · <span style="color:var(--ink2)">${esc(act.label)}</span>`:''}
            ${p.deadline?` · <span class="${du<0?'tag tag-p1':''}">${fmtDate(p.deadline)}</span>`:''}
            ${depProj?` · depends: ${esc(depProj.label)}`:''}
          </div>
        </div>
        <div class="entity-actions">
          <span class="badge">${STATUS_LABELS[p.status]||esc(p.status||'todo')}</span>
          <button class="btn sm ghost" onclick="openProjectModal('${p.id}')">✎</button>
          <button class="btn sm danger" onclick="deleteEntity('projects','${p.id}')">✕</button>
        </div>
      </div>`;}).join('')||`<div class="empty">No projects${af!=='all'?' in this area':''}.</div>`}
  </div>`;
}

// ── TASKS ──
function renderCfgTasks(){
  const el=document.getElementById('cfg-tasks');
  if(!el){ console.error('Element not found'); return; }
  const af=S.cfgAreaFilter;
  const pjFilter=S.cfgProjectFilter||'all';
  const lf=S.cfgLocationFilter||'all';
  let filtered=S.tasks.filter(t=>{
    if(af!=='all'&&t.areaId!==af) return false;
    if(pjFilter!=='all'&&t.projectId!==pjFilter) return false;
    if(lf!=='all'){
      const proj=byId(S.projects,t.projectId);
      const tLocs=(proj?.locationIds||'').split(',').filter(Boolean); if(tLocs.length>0&&!tLocs.includes(lf)) return false;
    }
    return true;
  });
  const projsForArea = af==='all'?S.projects:S.projects.filter(p=>p.areaId===af);
  const pjFilterHtml=`<select onchange="S.cfgProjectFilter=this.value;renderCfgTasks()" style="font-size:11px;padding:4px 8px;margin-left:8px;">
    <option value="all">All projects</option>
    ${projsForArea.map(p=>`<option value="${p.id}" ${pjFilter===p.id?'selected':''}>${esc(p.label)}</option>`).join('')}
  </select>`;
  el.innerHTML=`<div class="section-head"><h3>Tasks</h3>${af!=='all'?`<span class="badge" style="background:${areaColor(af)}1a;color:${areaColor(af)}">${esc(areaOf(af)?.label||'')}</span>`:''}
    ${pjFilterHtml}
    <button class="btn sm primary" onclick="openTaskModal(null)" style="margin-left:auto">+ task</button></div>
  <div class="entity-list">
    ${filtered.map(t=>{
      const proj=byId(S.projects,t.projectId);
      const act=proj?byId(S.activities,proj.activityId):null;
      const area=byId(S.areas,t.areaId||(proj?.areaId));
      const depTask=byId(S.tasks,t.dependsOnTaskId);
      const du=daysUntil(t.deadline);
      const duAct=t.activationDate?daysUntil(t.activationDate):null;
      return `<div class="entity-row">
        <div class="entity-row-main">
          <div class="entity-row-name">${esc(t.label)}</div>
          <div class="entity-row-meta">
            ${area?`<span style="color:${area.color}">${esc(area.label)}</span>`:''}
            ${proj?` · ${esc(proj.label)}`:''}
            ${act?` · ${esc(act.label)}`:''}
            ${t.deadline?` · ${du<0?`<span style="color:var(--danger)">overdue ${Math.abs(du)}d</span>`:fmtDate(t.deadline)}`:''}
            ${depTask?` · 🔒 ${esc(depTask.label)}`:''}
            ${t.activationDate&&duAct!==null&&duAct>0?` · active in ${duAct}d`:''}
          </div>
        </div>
        <div class="entity-actions">
          ${t.priority?`<span class="tag tag-${t.priority}">${{p1:'urgent',p2:'important',p3:'someday'}[t.priority]}</span>`:''}
          <span class="badge">${t.status||'todo'}</span>
          <button class="btn sm ghost" onclick="openTaskModal('${t.id}')">✎</button>
          <button class="btn sm danger" onclick="deleteEntity('tasks','${t.id}')">✕</button>
        </div>
      </div>`;}).join('')||`<div class="empty">No tasks${af!=='all'?' in this area':''}.</div>`}
  </div>`;
}

// ── ROUTINES ──
function renderCfgRoutines(){
  const el=document.getElementById('cfg-routines');
  if(!el){ console.error('Element not found'); return; }
  const af=S.cfgAreaFilter;
  const lf=S.cfgLocationFilter||'all';
  const rActFilter=S.cfgRoutineActFilter||'all';
  const actsForArea = af==='all'?S.activities:S.activities.filter(a=>a.areaId===af);
  const filtered=S.routines.filter(r=>{
    const ac=byId(S.activities,r.activityId);
    if(af!=='all'&&ac?.areaId!==af) return false;
    if(rActFilter!=='all'&&r.activityId!==rActFilter) return false;
    if(lf!=='all'&&r.locationId&&r.locationId!==lf) return false;
    return true;
  });
  const rActFilterHtml=`<select onchange="S.cfgRoutineActFilter=this.value;renderCfgRoutines()" style="font-size:11px;padding:4px 8px;margin-left:8px;">
    <option value="all">All activities</option>
    ${actsForArea.map(a=>`<option value="${a.id}" ${rActFilter===a.id?'selected':''}>${esc(a.label)}</option>`).join('')}
  </select>`;
  el.innerHTML=`<div class="section-head"><h3>Routines</h3>${af!=='all'?`<span class="badge" style="background:${areaColor(af)}1a;color:${areaColor(af)}">${esc(areaOf(af)?.label||'')}</span>`:''}
    ${rActFilterHtml}
    <button class="btn sm primary" onclick="openRoutineModal(null)" style="margin-left:auto">+ routine</button></div>
  <div class="entity-list">
    ${filtered.map(r=>{
      const ac=byId(S.activities,r.activityId);
      const area=byId(S.areas,ac?.areaId);
      const ev=byId(S.events,r.eventId);
      const freqLabel=r.freqNum&&r.freqPeriod?`${r.freqNum}× / ${r.freqPeriod}`:esc(r.frequency||'');
      const apArr2=(typeof r.applicablePeriods==='string'?r.applicablePeriods.split(','):(r.applicablePeriods||[])).filter(Boolean);
      const periodsLabel=apArr2.length?apArr2.map(id=>byId(S.periods,id)?.label||id).join(', '):'all periods';
      return `<div class="entity-row">
        <div class="entity-row-main">
          <div class="entity-row-name">${esc(r.label)}</div>
          <div class="entity-row-meta">
            ${area?`<span style="color:${area.color}">${esc(area.label)}</span>`:''}
            ${ac?` · ${esc(ac.label)}`:''}
            · ${freqLabel} · ${fmtMin(r.durationMin)}
            ${ev?` · on event: ${esc(ev.label)}`:''}
            · ${periodsLabel}
          </div>
        </div>
        <div class="entity-actions">
          <button class="btn sm ghost" onclick="openRoutineModal('${r.id}')">✎</button>
          <button class="btn sm danger" onclick="deleteEntity('routines','${r.id}')">✕</button>
        </div>
      </div>`;}).join('')||`<div class="empty">No routines${af!=='all'?' in this area':''}.</div>`}
  </div>`;
}

// ── EVENTS ──
function renderCfgEvents(){
  const el=document.getElementById('cfg-events');
  if(!el){ console.error('Element not found'); return; }
  const af=S.cfgAreaFilter;
  const filtered=S.events.filter(ev=>af==='all'||ev.areaId===af);
  el.innerHTML=`<div class="section-head"><h3>Events</h3>${af!=='all'?`<span class="badge" style="background:${areaColor(af)}1a;color:${areaColor(af)}">${esc(areaOf(af)?.label||'')}</span>`:''}
    <button class="btn sm primary" onclick="openEventModal(null)" style="margin-left:auto">+ event</button></div>
  <div class="entity-list">
    ${filtered.map(ev=>{
      const area=byId(S.areas,ev.areaId);
      const freqLabel=ev.frequency==='weekly'?`weekly (${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][ev.dayOfWeek]||'?'})`:ev.frequency==='once'?`once (${fmtDate(ev.date)})`:esc(ev.frequency||'');
      return `<div class="entity-row">
        <div class="entity-row-main">
          <div class="entity-row-name">${esc(ev.label)}</div>
          <div class="entity-row-meta">
            ${area?`<span style="color:${area.color}">${esc(area.label)}</span>`:''}
            · ${freqLabel} · ${fmtMin(ev.durationMin)}
          </div>
        </div>
        <div class="entity-actions">
          <button class="btn sm ghost" onclick="openEventModal('${ev.id}')">✎ edit</button>
          <button class="btn sm danger" onclick="deleteEntity('events','${ev.id}')">✕</button>
        </div>
      </div>`;}).join('')||`<div class="empty">No events${af!=='all'?' in this area':''}.</div>`}
  </div>`;
}

// ── PERIODS ──
function renderCfgPeriods(){
  const el=document.getElementById('cfg-periods');
  if(!el){ console.error('Element not found'); return; }
  const daysAll=['mon','tue','wed','thu','fri','sat','sun'];
  el.innerHTML=`<div class="section-head"><h3>Periods</h3>
    <button class="btn sm primary" onclick="openPeriodModal(null)" style="margin-left:auto">+ period</button></div>
  <div class="entity-list">
    ${S.periods.map(p=>{
      const daysDisplay=Array.isArray(p.dayTypes)?p.dayTypes.join(', '):(p.dayTypes||'');
      return `<div class="entity-row">
        <div class="entity-row-main">
          <div class="entity-row-name">${esc(p.label)}</div>
          <div class="entity-row-meta">${p.availableHours}h available · days: ${daysDisplay||'(none/manual)'}</div>
        </div>
        <div class="entity-actions">
          <button class="btn sm ghost" onclick="openPeriodModal('${p.id}')">✎</button>
          <button class="btn sm danger" onclick="deleteEntity('periods','${p.id}')">✕</button>
        </div>
      </div>`;}).join('')||'<div class="empty">No periods defined.</div>'}
  </div>`;
}

// ── BALANCE ──
function renderCfgBalance(){
  const el=document.getElementById('cfg-balance');
  if(!el){ console.error('Element not found'); return; }
  const af=S.cfgAreaFilter;
  const selPer=S.cfgBalancePeriod||'all';

  // Period selector
  const perOpts=`<option value="all">All periods</option>`+S.periods.map(p=>`<option value="${p.id}" ${selPer===p.id?'selected':''}>${esc(p.label)}</option>`).join('');
  let html=`<div class="section-head"><h3>Balance Weights</h3>
    <select onchange="S.cfgBalancePeriod=this.value;renderCfgBalance()" style="font-size:11px;padding:4px 8px;margin-left:8px;">${perOpts}</select>
  </div>
  <div style="font-size:11px;color:var(--ink3);margin-bottom:16px;line-height:1.6">
    % of available daily hours per area. Total should sum to 100%.
  </div>`;

  const areasToShow = af==='all' ? S.areas : S.areas.filter(a=>a.id===af);
  const periodsToShow = selPer==='all' ? S.periods : S.periods.filter(p=>p.id===selPer);

  // If area filter active + all periods: show cross-period comparison table
  if(af!=='all'&&selPer==='all'){
    const area=areaOf(af);
    html+=`<div style="font-family:var(--font-display);font-style:italic;font-size:15px;color:${area?.color||'#888'};margin-bottom:12px;">${esc(area?.label||'')} — all periods</div>`;
    S.periods.forEach(per=>{
      const row=S.balance.find(b=>b.periodId===per.id&&b.areaId===af);
      const val=row?.weightPct||0;
      const allWeights=S.balance.filter(b=>b.periodId===per.id);
      const total=allWeights.reduce((s,b)=>s+(b.weightPct||0),0);
      const totalClass=Math.abs(total-100)<=2?'weight-ok':Math.abs(total-100)<=10?'weight-warn':'weight-err';
      const minsDay=Math.round(val/100*(per.availableHours||16)*60);
      html+=`<div class="balance-area-row">
        <div class="bal-area-head">
          <span class="bal-area-name">${esc(per.label)}</span>
          <span class="bal-pct" id="balpct-${per.id}-${af}">${val}%</span>
          <span class="${totalClass}" style="font-size:10px;margin-left:8px">total: ${total}%</span>
        </div>
        <div style="display:flex;gap:8px;align-items:center;margin-top:4px;">
          <input type="range" min="0" max="100" value="${val}"
            id="balrange-${per.id}-${af}"
            oninput="updateBalanceWeight('${per.id}','${af}',this.value,${per.availableHours||16},'range')"
            style="flex:1">
          <input type="number" min="0" max="${Math.round((per.availableHours||16)*60)}" value="${minsDay}"
            id="balmins-${per.id}-${af}"
            oninput="updateBalanceWeight('${per.id}','${af}',this.value,${per.availableHours||16},'mins')"
            style="width:60px;font-size:11px;padding:3px 6px;">
          <span style="font-size:10px;color:var(--ink3);width:24px">min</span>
        </div>
      </div>`;
    });
    el.innerHTML=html; return;
  }

  periodsToShow.forEach(per=>{
    const weights=S.balance.filter(b=>b.periodId===per.id);
    const total=weights.reduce((s,b)=>s+(b.weightPct||0),0);
    const totalClass=Math.abs(total-100)<=2?'weight-ok':Math.abs(total-100)<=10?'weight-warn':'weight-err';
    html+=`<div style="margin-bottom:24px;border:1px solid var(--line);border-radius:var(--r);overflow:hidden;">
      <div style="padding:12px 14px;background:var(--bg3);border-bottom:1px solid var(--line);">
        <div style="font-family:var(--font-display);font-style:italic;font-size:16px;color:var(--ink2);">${esc(per.label)}</div>
        <div class="weight-total" style="margin-top:6px;margin-bottom:0;border:none;padding:0;background:none;">
          <span>Total: </span><span class="${totalClass}" id="baltotal-${per.id}-main">${total}%</span>
          <span style="color:var(--ink3)">${Math.abs(total-100)<=2?' ✓ balanced':total>100?' ('+( total-100)+'% over)':' ('+(100-total)+'% under)'}</span>
        </div>
      </div>
      <div style="max-height:320px;overflow-y:auto;padding:8px 14px;">`;
    areasToShow.forEach(a=>{
      const row=weights.find(b=>b.areaId===a.id);
      const val=row?.weightPct||0;
      const minsPerDay=Math.round(val/100*(per.availableHours||16)*60);
      html+=`<div class="balance-area-row">
        <div class="bal-area-head">
          <span style="width:8px;height:8px;border-radius:50%;background:${a.color};display:inline-block"></span>
          <span class="bal-area-name">${esc(a.label)}</span>
          <span class="bal-pct" id="balpct-${per.id}-${a.id}">${val}%</span>
        </div>
        <div style="display:flex;gap:8px;align-items:center;margin-top:4px;">
          <input type="range" min="0" max="100" value="${val}"
            id="balrange-${per.id}-${a.id}"
            oninput="updateBalanceWeight('${per.id}','${a.id}',this.value,${per.availableHours||16},'range')"
            style="flex:1">
          <input type="number" min="0" max="${Math.round((per.availableHours||16)*60)}" value="${minsPerDay}"
            id="balmins-${per.id}-${a.id}"
            oninput="updateBalanceWeight('${per.id}','${a.id}',this.value,${per.availableHours||16},'mins')"
            style="width:60px;font-size:11px;padding:3px 6px;">
          <span style="font-size:10px;color:var(--ink3);width:24px">min</span>
        </div>
      </div>`;
    });
    html+='</div></div>';
  });
  el.innerHTML=html;
}

async function updateBalanceWeight(periodId,areaId,rawVal,availHours,inputType){
  availHours=availHours||16;
  let pct;
  if(inputType==='mins'){
    const mins=parseInt(rawVal)||0;
    pct=Math.round(mins/(availHours*60)*100);
  } else {
    pct=parseInt(rawVal)||0;
  }
  pct=Math.max(0,Math.min(100,pct));
  // check total won't exceed 100 — cap this area at remainder
  const others=S.balance.filter(b=>b.periodId===periodId&&b.areaId!==areaId).reduce((s,b)=>s+(b.weightPct||0),0);
  if(pct+others>100) pct=Math.max(0,100-others);
  // update display immediately
  const pctEl=document.getElementById('balpct-'+periodId+'-'+areaId);
  if(pctEl) pctEl.textContent=pct+'%';
  const rangeEl=document.getElementById('balrange-'+periodId+'-'+areaId);
  if(rangeEl) rangeEl.value=pct;
  const minsEl=document.getElementById('balmins-'+periodId+'-'+areaId);
  const newMins=Math.round(pct/100*availHours*60);
  if(minsEl) minsEl.value=newMins;
  const id='b-'+periodId+'-'+areaId;
  const existing=byId(S.balance,id);
  if(existing){ existing.weightPct=pct; await API.saveBalance(existing); }
  else{ const obj={id,periodId,areaId,weightPct:pct}; S.balance.push(obj); await API.saveBalance(obj); }
  // re-render just the total indicator without full re-render (avoids slider focus loss)
  const weights=S.balance.filter(b=>b.periodId===periodId);
  const total=weights.reduce((s,b)=>s+(b.weightPct||0),0);
  const tc=Math.abs(total-100)<=2?'weight-ok':Math.abs(total-100)<=10?'weight-warn':'weight-err';
  // update any visible total indicators for this period
  document.querySelectorAll('[id^="baltotal-'+periodId+'"]').forEach(el=>{
    el.className=tc; el.textContent=total+'%';
  });
}

// ════════════════════════════════════════════════════════


// ── LOCATIONS ──
function renderCfgLocations(){
  const el=document.getElementById('cfg-locations');
  if(!el) return;
  el.innerHTML=`<div class="section-head"><h3>Locations</h3>
    <button class="btn sm primary" onclick="openLocationModal(null)" style="margin-left:auto">+ location</button></div>
  <div class="entity-list">
    ${S.locations.map(l=>`<div class="entity-row">
      <div class="entity-row-main">
        <div class="entity-row-name">${esc(l.label)}</div>
        <div class="entity-row-meta">${esc(l.type||'')}${l.address?' · '+esc(l.address):''}</div>
      </div>
      <div class="entity-actions">
        <button class="btn sm ghost" onclick="openLocationModal('${l.id}')">✎</button>
        <button class="btn sm danger" onclick="deleteEntity('locations','${l.id}')">✕</button>
      </div>
    </div>`).join('')||'<div class="empty">No locations defined yet.</div>'}
  </div>`;
}

function openLocationModal(id){
  const l=id?byId(S.locations,id):null;
  openModal(`<div class="modal-title">${l?'Edit location':'New location'}<button onclick="closeModal()">✕</button></div>
  <div class="field"><label>Label</label><input type="text" id="ml-label" value="${esc(l?.label||'')}"></div>
  <div class="grid2">
    <div class="field"><label>Type</label>
      <select id="ml-type">
        <option value="">—</option>
        ${['home','office','gym','outdoor','online','other'].map(t=>`<option value="${t}" ${l?.type===t?'selected':''}>${t}</option>`).join('')}
      </select></div>
    <div class="field"><label>Address / URL</label><input type="text" id="ml-address" value="${esc(l?.address||'')}"></div>
  </div>
  <div class="field"><label>Description</label><textarea id="ml-desc" rows="2">${esc(l?.description||'')}</textarea></div>
  <div class="modal-actions">
    ${l?`<button class="btn danger" onclick="deleteEntity('locations','${l.id}')">delete</button>`:''}
    <button class="btn" onclick="closeModal()">cancel</button>
    <button class="btn primary" onclick="saveLocation('${id||''}')">save</button>
  </div>`);
}

async function saveLocation(existingId){
  try {
    const label=document.getElementById('ml-label').value.trim();
    if(!label){ showToast('Label is required'); return; }
    const loc={id:existingId||uid(),label,
      type:document.getElementById('ml-type').value||null,
      address:document.getElementById('ml-address').value.trim(),
      description:document.getElementById('ml-desc').value.trim()};
    await API.saveLocation(loc);
    if(existingId) S.locations=S.locations.filter(l=>l.id!==existingId);
    S.locations.push(loc);
    closeModal(); renderCfgPanel('locations'); showToast('Location saved');
  } catch(e){ showToast('Error: '+e.message); console.error(e); }
}
