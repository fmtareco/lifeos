//  MODAL SYSTEM
// ════════════════════════════════════════════════════════
function openModal(html){ document.getElementById('modal-box').innerHTML=html; document.getElementById('modal-overlay').classList.add('open'); }
function closeModal(){ document.getElementById('modal-overlay').classList.remove('open'); }
// Track where mousedown started so we don't close modal on text-selection drags
let _modalMouseDownOnOverlay = false;
document.addEventListener('DOMContentLoaded',()=>{
  const overlay=document.getElementById('modal-overlay');
  if(overlay){
    overlay.addEventListener('mousedown', e=>{
      _modalMouseDownOnOverlay = (e.target === overlay);
    });
  }
});
function closeModalOnOverlay(e){
  // Only close if BOTH mousedown AND click landed on the overlay background
  // This prevents closing when user selects text inside the modal
  if(_modalMouseDownOnOverlay && e.target===document.getElementById('modal-overlay')){
    closeModal();
  }
  _modalMouseDownOnOverlay = false;
}

// area selects helper
function areaOptions(selected){ return S.areas.map(a=>`<option value="${a.id}" ${selected===a.id?'selected':''}>${esc(a.label)}</option>`).join(''); }
function locationOptions(selected){
  return '<option value="">— none —</option>'+S.locations.map(l=>`<option value="${l.id}" ${selected===l.id?'selected':''}>${esc(l.label)}</option>`).join('');
}
function locationChips(idsCsv){
  if(!idsCsv) return '';
  return idsCsv.split(',').map(id=>{ const l=locationOf(id); return l?`<span class="badge">${esc(l.label)}</span>`:'' }).join(' ');
}
function activityOptions(selected,areaId){ 
  const list = areaId ? S.activities.filter(a=>a.areaId===areaId) : S.activities;
  return list.map(a=>`<option value="${a.id}" ${selected===a.id?'selected':''}>${esc(a.label)}</option>`).join(''); 
}
function projectOptions(selected){ return '<option value="">— none —</option>'+S.projects.map(p=>`<option value="${p.id}" ${selected===p.id?'selected':''}>${esc(p.label)}</option>`).join(''); }
function taskOptions(selected){ return S.tasks.map(t=>`<option value="${t.id}" ${selected===t.id?'selected':''}>${esc(t.label)}</option>`).join(''); }
function routineOptions(selected){ return S.routines.map(r=>`<option value="${r.id}" ${selected===r.id?'selected':''}>${esc(r.label)}</option>`).join(''); }
function eventOptions(selected){ return S.events.map(e=>`<option value="${e.id}" ${selected===e.id?'selected':''}>${esc(e.label)}</option>`).join(''); }

// ── LOG ACTION MODAL ──
function editTaskFromProject(btn){
  const id=btn.dataset.taskEdit;
  closeModal();
  setTimeout(()=>openTaskModal(id),50);
}
async function addTaskFromProject(btn){
  // Save current project form values first
  await saveProject(btn.dataset.projId||'');
  S.cfgProjectFilter=btn.dataset.projId;
  setTimeout(()=>openTaskModal(null),80);
}
// ── PLAN ACTION MODAL (add to agenda without logging) ──
function openPlanModal(){
  openModal(`<div class="modal-title">Add to agenda<button onclick="closeModal()">✕</button></div>
  <div style="font-size:11px;color:var(--ink3);margin-bottom:12px;">Add an action to today's suggested agenda. You can log it later.</div>
  <div class="field"><label>Label</label>
    <input type="text" id="mp2-label" placeholder="what do you plan to do?"></div>
  <div class="grid2">
    <div class="field"><label>Area</label>
      <select id="mp2-area" onchange="onPlanAreaChange()">
        <option value="">— any —</option>${areaOptions('')}
      </select></div>
    <div class="field"><label>Activity</label>
      <select id="mp2-activity">
        <option value="">— any —</option>
      </select></div>
  </div>
  <div class="grid2">
    <div class="field"><label>Type</label>
      <select id="mp2-type" onchange="onPlanTypeChange()">
        <option value="free">Free action</option>
        <option value="routine">Routine</option>
        <option value="task">Task</option>
      </select></div>
    <div class="field" id="mp2-ref-field" style="display:none"><label>Reference</label>
      <select id="mp2-ref"></select></div>
  </div>
  <div class="field"><label>Est. duration (min)</label>
    <input type="number" id="mp2-dur" min="0" placeholder="0" style="width:100px"></div>
  <div class="modal-actions">
    <button class="btn" onclick="closeModal()">cancel</button>
    <button class="btn primary" onclick="savePlan()">add to agenda</button>
  </div>`);
}
function onPlanAreaChange(){
  const areaId=document.getElementById('mp2-area').value||null;
  const actSel=document.getElementById('mp2-activity');
  const cur=actSel.value;
  actSel.innerHTML='<option value="">— any —</option>'+activityOptions(cur,areaId);
  onPlanTypeChange();
}
function onPlanTypeChange(){
  const t=document.getElementById('mp2-type').value;
  const areaId=document.getElementById('mp2-area').value||null;
  const actId=document.getElementById('mp2-activity').value||null;
  const ref=document.getElementById('mp2-ref');
  const field=document.getElementById('mp2-ref-field');
  if(t==='free'){
    // Show free action templates as reference
    let freeItems=S.freeActions;
    if(areaId) freeItems=freeItems.filter(f=>f.areaId===areaId);
    if(actId)  freeItems=freeItems.filter(f=>f.activityId===actId);
    if(freeItems.length){
      field.style.display='';
      ref.innerHTML='<option value="">— custom —</option>'+freeItems.map(f=>`<option value="${f.id}">${esc(f.label)}</option>`).join('');
      // Auto-fill label when selected
      ref.onchange=()=>{
        const fa=S.freeActions.find(x=>x.id===ref.value);
        if(fa){
          const lbl=document.getElementById('mp2-label'); if(lbl) lbl.value=fa.label;
          const dur=document.getElementById('mp2-dur'); if(dur&&fa.durationMin) dur.value=fa.durationMin;
        }
      };
    } else {
      field.style.display='none';
    }
    return;
  }
  field.style.display='';
  if(t==='routine'){
    let items=S.routines;
    if(areaId) items=items.filter(r=>{ const ac=byId(S.activities,r.activityId); return ac?.areaId===areaId; });
    if(actId)  items=items.filter(r=>r.activityId===actId);
    ref.innerHTML=items.map(r=>`<option value="${r.id}">${esc(r.label)}</option>`).join('');
  } else {
    let items=S.tasks.filter(t=>t.status!=='done');
    if(areaId) items=items.filter(t=>t.areaId===areaId);
    if(actId)  items=items.filter(t=>t.activityId===actId);
    ref.innerHTML=items.map(t=>`<option value="${t.id}">${esc(t.label)}</option>`).join('');
  }
}
function savePlan(){
  const label=document.getElementById('mp2-label').value.trim();
  const type=document.getElementById('mp2-type').value;
  const refId=type!=='free'?document.getElementById('mp2-ref').value||null:null;
  const areaId=document.getElementById('mp2-area').value||null;
  const actId=document.getElementById('mp2-activity').value||null;
  const dur=parseInt(document.getElementById('mp2-dur').value)||0;
  // Resolve label from ref if blank
  let finalLabel=label;
  if(!finalLabel&&refId){
    if(type==='routine') finalLabel=byId(S.routines,refId)?.label||'Planned';
    else finalLabel=byId(S.tasks,refId)?.label||'Planned';
  }
  if(!finalLabel){ showToast('Please enter a label'); return; }
  // Resolve areaId from ref
  let resolvedArea=areaId;
  if(!resolvedArea&&refId){
    if(type==='routine'){ const ac=byId(S.activities,byId(S.routines,refId)?.activityId); resolvedArea=ac?.areaId; }
    else if(type==='task'){ resolvedArea=byId(S.tasks,refId)?.areaId; }
  }
  const actLabel=byId(S.activities,actId)?.label||
    (type==='routine'?byId(S.activities,byId(S.routines,refId)?.activityId)?.label:'');
  S.todayPlanned.push({
    id:'plan-'+uid(), label:finalLabel, type,
    routineId:type==='routine'?refId:null,
    taskId:type==='task'?refId:null,
    areaId:resolvedArea, activityLabel:actLabel,
    durationMin:dur, tag:'planned', priority:3.5,
  });
  closeModal();
  renderAgendaList();
  showToast('Added to agenda');
}

function openLogFromSuggestion(tag, type, id, btn){
  const label    = btn ? btn.dataset.label    : '';
  const areaId   = btn ? btn.dataset.area     : '';
  const actId    = btn ? btn.dataset.activity : '';
  const dur      = btn ? parseInt(btn.dataset.dur||'0') : 0;

  if(tag==='planned'||tag==='free'){
    openLogModal(null,'free',null);
    setTimeout(()=>{
      const el=document.getElementById('m-label');
      if(el&&label){ el.value=label; el.dataset.autofilled='false'; }
      const areaSel=document.getElementById('m-area-sel');
      const actSel =document.getElementById('m-activity-sel');
      if(areaSel&&areaId) areaSel.value=areaId;
      if(actSel&&actId)   actSel.value=actId;
      const durEl=document.getElementById('m-dur');
      if(durEl&&dur) durEl.value=dur;
      // Remove from planned list
      S.todayPlanned=S.todayPlanned.filter(p=>p.id!==id);
      S.freeActions=S.freeActions; // free actions stay persistent
    },80);
  } else {
    openLogModal(null,type,id);
  }
}
function editSuggestion(tag, id){
  if(tag==='planned'||tag==='free') editPlan(id);
  else openLogModal(null, tag==='routine'?'routine':tag==='event'?'event':'task', id);
}
function openLogModalById(id){
  const a=byId(S.actions,id);
  if(a) openLogModal(a);
  else showToast('Action not found');
}
function openLogModal(existingAction, defaultType, defaultId){
  const a=existingAction||{};
  const isEdit=!!a.id;
  openModal(`<div class="modal-title">
    ${isEdit?'Edit action':'Log action'}
    <button onclick="closeModal()">✕</button>
  </div>
  <div class="field"><label>Label / what did you do?</label>
    <input type="text" id="m-label" value="${esc(a.label||'')}" placeholder="describe the action…"></div>
  <div class="grid2">
    <div class="field"><label>Type</label>
      <select id="m-type" onchange="onLogTypeChange()">
        <option value="free" ${(!a.routineId&&!a.taskId&&!a.eventId)?'selected':''}>Free / other</option>
        <option value="routine" ${a.routineId?'selected':''}>Routine</option>
        <option value="task"    ${a.taskId?'selected':''}>Task</option>
        <option value="event"   ${a.eventId?'selected':''}>Event</option>
      </select></div>
    <div class="field" id="m-ref-field" style="display:none"><label>Reference</label>
      <select id="m-ref" onchange="onLogRefChange()"></select></div>
  </div>
  <div class="grid2" id="m-filter-row">
    <div class="field"><label>Filter area</label>
      <select id="m-filter-area" onchange="onLogTypeChange()">
        <option value="">All areas</option>${areaOptions('')}
      </select></div>
    <div class="field"><label>Filter activity</label>
      <select id="m-filter-activity" onchange="onLogTypeChange()">
        <option value="">All activities</option>
      </select></div>
  </div>
  <!-- Context info (shown for routine/task/event, hidden for free) -->
  <div id="m-task-context" style="display:none;background:var(--bg3);border:1px solid var(--line);padding:8px 12px;border-radius:var(--r);font-size:11px;color:var(--ink2);margin-bottom:8px;"></div>
  <!-- Area / activity selects (shown for free actions, hidden when ref resolves them) -->
  <div class="grid2" id="m-area-row">
    <div class="field"><label>Area</label>
      <select id="m-area-sel"><option value="">— auto —</option>${areaOptions(a.areaId||'')}</select></div>
    <div class="field"><label>Activity</label>
      <select id="m-activity-sel"><option value="">— auto —</option>${activityOptions(a.activityId||'')}</select></div>
  </div>
  <div class="grid2">
    <div class="field"><label>Date</label>
      <input type="date" id="m-date" value="${a.date||S.todayDate}"></div>
    <div class="field" id="m-done-field" style="display:none;align-items:center;gap:8px;padding-top:20px;">
      <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12px;">
        <input type="checkbox" id="m-mark-done"> Mark task as <strong>Done</strong>
      </label>
    </div>
  </div>
  <div class="grid2">
    <div class="field"><label>Duration (minutes)</label>
      <input type="number" id="m-dur" min="0" value="${a.durationMin||''}" placeholder="0"></div>
    <div class="field"><label>Performance (1–10)</label>
      <input type="number" id="m-perf" min="1" max="10" value="${a.performance||''}" placeholder="—"></div>
  </div>
  <div class="field"><label>Notes / context</label>
    <textarea id="m-notes" rows="3">${esc(a.notes||'')}</textarea></div>
  <div class="field"><label>Resources (URL — description, one per line)</label>
    <textarea id="m-resources" rows="2">${(()=>{try{const res=typeof a.resources==='string'?JSON.parse(a.resources||'[]'):(a.resources||[]);return res.map(r=>r.url+(r.desc?' \u2014 '+r.desc:'')).join('\n');}catch(e){return '';}})()}</textarea></div>
  <div class="modal-actions">
    ${isEdit?`<button class="btn danger" onclick="deleteAction('${a.id}')">delete</button>`:''}
    <button class="btn" onclick="closeModal()">cancel</button>
    <button class="btn primary" onclick="saveLogAction('${a.id||''}')">save</button>
  </div>`);
  // pre-fill type/ref
  const type=a.routineId?'routine':a.taskId?'task':a.eventId?'event':'free';
  document.getElementById('m-type').value=defaultType||type;
  setTimeout(()=>{
    onLogTypeChange();
    if(defaultId&&defaultType){
      setTimeout(()=>{
        const sel=document.getElementById('m-ref');
        if(sel){ sel.value=defaultId; onLogRefChange(); }
      },60);
    }
  },10);
}

function onLogTypeChange(){
  const t=document.getElementById('m-type').value;
  const ref=document.getElementById('m-ref');
  const field=document.getElementById('m-ref-field');
  const filterArea=document.getElementById('m-filter-area')?.value||'';
  const filterAct=document.getElementById('m-filter-activity')?.value||'';
  const filterRow=document.getElementById('m-filter-row');

  // Update activity filter based on area
  const actSel=document.getElementById('m-filter-activity');
  if(actSel){
    const curAct=actSel.value;
    const acts=filterArea?S.activities.filter(a=>a.areaId===filterArea):S.activities;
    actSel.innerHTML='<option value="">All activities</option>'+acts.map(a=>`<option value="${a.id}" ${curAct===a.id?'selected':''}>${esc(a.label)}</option>`).join('');
  }

  // For free actions: show area/activity selects
  const areaRow2=document.getElementById('m-area-row');
  if(t==='free'){
    field.style.display='none';
    if(filterRow) filterRow.style.display='none';
    if(areaRow2) areaRow2.style.display='';
    return;
  }
  if(areaRow2) areaRow2.style.display='none'; // hidden for ref types (resolved automatically)
  if(filterRow) filterRow.style.display='';
  field.style.display='';

  if(t==='routine'){
    let items=S.routines;
    if(filterArea) items=items.filter(r=>{ const ac=byId(S.activities,r.activityId); return ac?.areaId===filterArea; });
    if(filterAct)  items=items.filter(r=>r.activityId===filterAct);
    ref.innerHTML=items.map(r=>`<option value="${r.id}">${esc(r.label)}</option>`).join('');
  } else if(t==='task'){
    let items=S.tasks.filter(t=>t.status!=='done');
    if(filterArea) items=items.filter(t=>t.areaId===filterArea);
    if(filterAct)  items=items.filter(t=>t.activityId===filterAct);
    ref.innerHTML=items.map(t=>`<option value="${t.id}">${esc(t.label)}</option>`).join('');
  } else if(t==='event'){
    let items=S.events;
    if(filterArea) items=items.filter(e=>e.areaId===filterArea);
    ref.innerHTML=items.map(e=>`<option value="${e.id}">${esc(e.label)}</option>`).join('');
  }
  if(!ref.value && ref.options.length>0) ref.value=ref.options[0].value;
  onLogRefChange();
}

function onLogRefChange(){
  const t=document.getElementById('m-type')?.value;
  const refSel=document.getElementById('m-ref');
  const refId=refSel?.value;
  const ctxEl=document.getElementById('m-task-context');
  const doneField=document.getElementById('m-done-field');

  if(!refId||t==='free'){
    if(ctxEl) ctxEl.style.display='none';
    if(doneField) doneField.style.display='none';
    return;
  }

  let name='';
  let ctxHtml='';

  if(t==='routine'){
    const r=byId(S.routines,refId);
    name=r?.label||'';
    const ac=byId(S.activities,r?.activityId);
    const area=byId(S.areas,ac?.areaId);
    const loc=r?.locationId?byId(S.locations,r.locationId):null;
    if(ac||area) ctxHtml=`<span style="color:${area?.color||'var(--ink3)'}">${esc(area?.label||'')}</span>${ac?' · '+esc(ac.label):''}${loc?' · @ '+esc(loc.label):''}`;
    if(doneField) doneField.style.display='none';
  } else if(t==='task'){
    const tk=byId(S.tasks,refId);
    name=tk?.label||'';
    const proj=byId(S.projects,tk?.projectId);
    const area=byId(S.areas,tk?.areaId||proj?.areaId);
    const act=byId(S.activities,tk?.activityId||proj?.activityId);
    ctxHtml=`<span style="color:${area?.color||'var(--ink3)'}">${esc(area?.label||'')}</span>${act?' · '+esc(act.label):''}${proj?' · 📁 '+esc(proj.label):''}`;
    if(tk?.estimatedMin) ctxHtml+=` · ~${tk.estimatedMin} min`;
    if(tk?.deadline) ctxHtml+=` · due ${tk.deadline}`;
    // Show "mark done" checkbox
    if(doneField){
      doneField.style.display='flex';
      const cb=document.getElementById('m-mark-done');
      if(cb) cb.checked=tk?.status==='done';
    }
  } else if(t==='event'){
    const ev=byId(S.events,refId);
    name=ev?.label||'';
    const area=byId(S.areas,ev?.areaId);
    ctxHtml=`<span style="color:${area?.color||'var(--ink3)'}">${esc(area?.label||'')}</span>`;
    if(doneField) doneField.style.display='none';
  }

  if(ctxEl){ ctxEl.innerHTML=ctxHtml; ctxEl.style.display=ctxHtml?'':'none'; }

  // Sync area/activity selects and toggle their visibility
  const areaRow=document.getElementById('m-area-row');
  const areaSel=document.getElementById('m-area-sel');
  const actSel2=document.getElementById('m-activity-sel');
  if(t==='free'){
    if(areaRow) areaRow.style.display='';
  } else {
    // For routine/task/event: auto-resolve area/activity
    if(areaRow) areaRow.style.display='none';
    // Still populate so saveLogAction can read them
    let autoArea=null, autoAct=null;
    if(t==='routine'){ const r=byId(S.routines,refId); const ac=byId(S.activities,r?.activityId); autoArea=ac?.areaId; autoAct=ac?.id; }
    else if(t==='task'){ const tk=byId(S.tasks,refId); const proj=byId(S.projects,tk?.projectId); autoArea=tk?.areaId||proj?.areaId; autoAct=tk?.activityId||proj?.activityId; }
    else if(t==='event'){ const ev=byId(S.events,refId); autoArea=ev?.areaId; }
    if(areaSel&&autoArea) areaSel.value=autoArea;
    if(actSel2&&autoAct)  actSel2.value=autoAct;
  }

  // Auto-fill label
  const labelEl=document.getElementById('m-label');
  if(labelEl&&(!labelEl.value||labelEl.dataset.autofilled==='true')){
    labelEl.value=name;
    labelEl.dataset.autofilled='true';
  }
}

async function saveLogAction(existingId){
  const type=document.getElementById('m-type').value;
  const ref=document.getElementById('m-ref').value;
  const label=document.getElementById('m-label').value.trim()||document.getElementById('m-ref')?.options?.[document.getElementById('m-ref').selectedIndex]?.text||'Action';
  const dur=parseInt(document.getElementById('m-dur').value)||0;
  const perf=parseFloat(document.getElementById('m-perf').value)||null;
  const notes=document.getElementById('m-notes').value.trim();
  const date=document.getElementById('m-date').value||S.todayDate;
  const areaId=document.getElementById('m-area-sel')?.value||null;
  const activityId=document.getElementById('m-activity-sel')?.value||null;
  const resRaw=document.getElementById('m-resources').value.trim();
  const resources=resRaw?resRaw.split('\n').map(l=>{ const p=l.split('—'); return {url:p[0].trim(),desc:(p[1]||'').trim()}; }).filter(r=>r.url):[]; 

  // Resolve areaId from selected routine/task if not overridden
  let resolvedAreaId = areaId;
  let resolvedActivityId = activityId;
  if(!resolvedAreaId){
    if(type==='routine'){ const r=byId(S.routines,ref); const ac=byId(S.activities,r?.activityId); resolvedAreaId=ac?.areaId||null; resolvedActivityId=resolvedActivityId||ac?.id; }
    else if(type==='task'){ const t=byId(S.tasks,ref); const proj=byId(S.projects,t?.projectId); resolvedAreaId=t?.areaId||proj?.areaId||null; resolvedActivityId=resolvedActivityId||t?.activityId||proj?.activityId; }
    else if(type==='event'){ const ev=byId(S.events,ref); resolvedAreaId=ev?.areaId||null; }
  }
  const action={
    id:existingId||uid(),
    label, date,
    routineId:type==='routine'?ref:null,
    taskId:   type==='task'   ?ref:null,
    eventId:  type==='event'  ?ref:null,
    areaId:resolvedAreaId,
    activityId:resolvedActivityId||null,
    durationMin:dur, performance:perf, notes,
    resources:JSON.stringify(resources),
    loggedAt:new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}),
    createdAt:existingId?S.actions.find(a=>a.id===existingId)?.createdAt||Date.now():Date.now(),
  };

  await API.saveAction(action);
  if(existingId) S.actions=S.actions.filter(a=>a.id!==existingId);
  S.actions.push(action);

  // mark task done if checkbox checked
  if(type==='task'&&ref){
    const markDone=document.getElementById('m-mark-done')?.checked;
    const t=byId(S.tasks,ref);
    if(t&&markDone&&t.status!=='done'){ t.status='done'; await API.saveTask(t); }
  }

  closeModal();
  // Reload all data then re-render so agenda reflects new action
  await loadAll();
  renderPage(S.currentPage);
  showToast('Action saved');
}

// ── TASK MODAL ──
function openTaskModal(id, defaultStatus){
  const t=id?byId(S.tasks,id):null;
  const preArea=t?.areaId||(S.cfgAreaFilter!=='all'?S.cfgAreaFilter:'');
  const preAct=t?.activityId||(S.cfgActivityFilter&&S.cfgActivityFilter!=='all'?S.cfgActivityFilter:'');
  const preProj=t?.projectId||(S.cfgProjectFilter&&S.cfgProjectFilter!=='all'?S.cfgProjectFilter:'');
  // activities for preArea, projects for preAct
  const taskActOpts='<option value="">—</option>'+activityOptions(preAct,preArea||null);
  const taskProjOpts='<option value="">—</option>'+S.projects.filter(p=>(!preArea||p.areaId===preArea)&&(!preAct||p.activityId===preAct)).map(p=>`<option value="${p.id}" ${preProj===p.id?'selected':''}>${esc(p.label)}</option>`).join('');
  const depTaskOpts='<option value="">— none —</option>'+S.tasks.filter(x=>x.id!==id).map(x=>`<option value="${x.id}" ${t?.dependsOnTaskId===x.id?'selected':''}>${esc(x.label)}</option>`).join('');
  openModal(`<div class="modal-title">${t?'Edit task':'New task'}<button onclick="closeModal()">✕</button></div>
  <div class="field"><label>Label</label><input type="text" id="mt-label" value="${esc(t?.label||'')}"></div>
  <div class="field"><label>Description</label><textarea id="mt-desc">${esc(t?.description||'')}</textarea></div>
  <div class="field"><label>Area</label>
    <select id="mt-area" onchange="onTaskAreaChange()">
      <option value="">—</option>${areaOptions(preArea)}
    </select></div>
  <div class="grid2">
    <div class="field"><label>Activity</label>
      <select id="mt-activity" onchange="onTaskActivityChange()">
        ${taskActOpts}
      </select></div>
    <div class="field"><label>Project</label>
      <select id="mt-project" id="mt-project">
        ${taskProjOpts}
      </select></div>
  </div>
  <div class="grid2">
    <div class="field"><label>Priority</label>
      <select id="mt-pri">
        <option value="">—</option>
        <option value="p1" ${t?.priority==='p1'?'selected':''}>Urgent</option>
        <option value="p2" ${t?.priority==='p2'?'selected':''}>Important</option>
        <option value="p3" ${t?.priority==='p3'?'selected':''}>Someday</option>
      </select></div>
    <div class="field"><label>Status</label>
      <select id="mt-status">
        <option value="todo"  ${(t?.status||defaultStatus||'todo')==='todo' ?'selected':''}>To Do</option>
        <option value="doing" ${(t?.status||defaultStatus||'')==='doing'?'selected':''}>In Progress</option>
        <option value="done"  ${(t?.status||'')==='done' ?'selected':''}>Done</option>
      </select></div>
  </div>
  <div class="grid2">
    <div class="field"><label>Deadline</label><input type="date" id="mt-deadline" value="${t?.deadline||''}"></div>
    <div class="field"><label>Est. duration (min)</label><input type="number" id="mt-dur" value="${t?.estimatedMin||''}" placeholder="0"></div>
  </div>
  <div class="grid2">
    <div class="field"><label>Depends on task</label><select id="mt-dep-task">${depTaskOpts}</select></div>
    <div class="field"><label>Activation date (not before)</label><input type="date" id="mt-activation" value="${t?.activationDate||''}"></div>
  </div>
  <div class="field"><label>Resources (URL — description, one per line)</label>
    <textarea id="mt-res" rows="2">${(()=>{try{const res=typeof t?.resources==='string'?JSON.parse(t.resources||'[]'):(t?.resources||[]);return res.map(r=>r.url+(r.desc?' \u2014 '+r.desc:'')).join('\n');}catch(e){return '';}})()}</textarea></div>
  <div class="modal-actions">
    ${t?`<button class="btn danger" onclick="deleteEntity('tasks','${t.id}')">delete</button>`:''}
    <button class="btn" onclick="closeModal()">cancel</button>
    <button class="btn primary" onclick="saveTask('${id||''}')">save</button>
  </div>`);
}

function onTaskAreaChange(){
  const areaId=document.getElementById('mt-area').value||null;
  const actSel=document.getElementById('mt-activity');
  actSel.innerHTML='<option value="">—</option>'+activityOptions('',areaId);
  onTaskActivityChange();
}
function onTaskActivityChange(){
  const areaId=document.getElementById('mt-area').value||null;
  const actId=document.getElementById('mt-activity').value||null;
  const projSel=document.getElementById('mt-project');
  const projs=S.projects.filter(p=>(!areaId||p.areaId===areaId)&&(!actId||p.activityId===actId));
  projSel.innerHTML='<option value="">—</option>'+projs.map(p=>`<option value="${p.id}">${esc(p.label)}</option>`).join('');
}
async function saveTask(existingId){
  try {
    const label=document.getElementById('mt-label').value.trim();
    if(!label){ showToast('Label is required'); return; }
    const resRaw=document.getElementById('mt-res').value.trim();
    const resources=resRaw?resRaw.split('\n').map(l=>{ const parts=l.split(' — '); return {url:parts[0].trim(),desc:(parts[1]||'').trim()}; }).filter(r=>r.url):[];
    const projectId=document.getElementById('mt-project').value||null;
    const activityId=document.getElementById('mt-activity').value||null;
    const proj=byId(S.projects,projectId);
    const task={
      id:existingId||uid(), label,
      description:document.getElementById('mt-desc').value.trim(),
      projectId,
      activityId: activityId||proj?.activityId||null,
      areaId:document.getElementById('mt-area').value||proj?.areaId||null,
      priority:document.getElementById('mt-pri').value||null,
      status:document.getElementById('mt-status').value||'todo',
      deadline:document.getElementById('mt-deadline').value||'',
      activationDate:document.getElementById('mt-activation').value||'',
      estimatedMin:parseInt(document.getElementById('mt-dur').value)||0,
      dependsOnTaskId:document.getElementById('mt-dep-task').value||null,
      resources: JSON.stringify(resources),
    };
    await API.saveTask(task);
    if(existingId) S.tasks=S.tasks.filter(t=>t.id!==existingId);
    S.tasks.push(task);
    closeModal();
    renderCfgPanel('tasks');
    showToast('Task saved');
  } catch(e) { showToast('Error saving task: '+e.message); console.error(e); }
}

// ── AREA MODAL ──
function openAreaModal(id){
  const a=id?byId(S.areas,id):null;
  openModal(`<div class="modal-title">${a?'Edit area':'New area'}<button onclick="closeModal()">✕</button></div>
  <div class="field"><label>Label</label><input type="text" id="ma-label" value="${esc(a?.label||'')}"></div>
  <div class="field"><label>Colour</label><input type="text" id="ma-color" value="${a?.color||'#888888'}" placeholder="#c84b2f"></div>
  <div class="modal-actions">
    <button class="btn" onclick="closeModal()">cancel</button>
    <button class="btn primary" onclick="saveArea('${id||''}')">save</button>
  </div>`);
}
async function saveArea(existingId){
  const area={id:existingId||uid(),label:document.getElementById('ma-label').value.trim(),color:document.getElementById('ma-color').value.trim()||'#888',icon:'◈'};
  await API.saveArea(area);
  if(existingId) S.areas=S.areas.filter(a=>a.id!==existingId);
  S.areas.push(area);
  closeModal(); renderCfgPanel('areas'); showToast('Area saved');
}

// ── MULTI-SELECT COMBO HELPER ──
// Renders a <select multiple> with select-all/none buttons
function multiSelectWidget(items, selId, selectedArr, emptyMsg, height){
  if(!items||items.length===0) return `<span style="font-size:11px;color:var(--ink3)">${emptyMsg||'None defined yet.'}</span>`;
  height = height||'80px';
  return `<div>
    <div style="display:flex;gap:6px;margin-bottom:4px;">
      <button type="button" class="btn sm ghost" onclick="selectAllOpts('#${selId}',true)">select all</button>
      <button type="button" class="btn sm ghost" onclick="selectAllOpts('#${selId}',false)">deselect all</button>
    </div>
    <select id="${selId}" multiple style="width:100%;height:${height};font-size:12px;padding:4px;">
      ${items.map(item=>`<option value="${item.id}" ${selectedArr.includes(item.id)?'selected':''}>${esc(item.label)}</option>`).join('')}
    </select>
    <div style="font-size:10px;color:var(--ink3);margin-top:3px;">Hold Ctrl/Cmd to select multiple</div>
  </div>`;
}
function selectAllOpts(selector, state){
  document.querySelectorAll(selector+' option').forEach(o=>o.selected=state);
}
function getMultiSelectValues(selId){
  const el=document.getElementById(selId);
  if(!el) return [];
  return [...el.options].filter(o=>o.selected).map(o=>o.value);
}

// ── MULTI-CHECK WIDGET HELPER ──
function multiCheckWidget(items, cbClass, selectedArr, emptyMsg){
  if(!items||items.length===0) return `<span style="font-size:11px;color:var(--ink3)">${emptyMsg||'None defined yet.'}</span>`;
  return `<div>
    <div style="display:flex;gap:6px;margin-bottom:6px;">
      <button type="button" class="btn sm ghost" onclick="toggleAllCb('.${cbClass}',true)">select all</button>
      <button type="button" class="btn sm ghost" onclick="toggleAllCb('.${cbClass}',false)">deselect all</button>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:4px;">
      ${items.map(item=>`<label style="display:flex;align-items:center;gap:5px;font-size:11px;cursor:pointer;padding:4px 6px;background:var(--bg3);border-radius:var(--r);">
        <input type="checkbox" class="${cbClass}" value="${item.id}" ${selectedArr.includes(item.id)?'checked':''}> ${esc(item.label)}
      </label>`).join('')}
    </div>
  </div>`;
}
function toggleAllCb(selector, state){
  document.querySelectorAll(selector).forEach(cb=>cb.checked=state);
}

// ── ACTIVITY MODAL ──
function openActivityModal(id){
  const a=id?byId(S.activities,id):null;
  // pre-select area from filter if creating new
  const preArea=a?.areaId||(S.cfgAreaFilter!=='all'?S.cfgAreaFilter:'');
  const PERIODS_LIST=['day','week','month','quarter','year'];  // already correct
  openModal(`<div class="modal-title">${a?'Edit activity':'New activity'}<button onclick="closeModal()">✕</button></div>
  <div class="field"><label>Label</label><input type="text" id="mac-label" value="${esc(a?.label||'')}"></div>
  <div class="field"><label>Area</label><select id="mac-area"><option value="">—</option>${areaOptions(preArea)}</select></div>
  <div class="field"><label>Description</label><textarea id="mac-desc">${esc(a?.description||'')}</textarea></div>
  <div class="field"><label>Goals</label>
    <div style="display:flex;gap:8px;align-items:center;">
      <input type="number" id="mac-goals-num" min="1" value="${a?.goalsNum||''}" placeholder="e.g. 3" style="width:80px">
      <span style="color:var(--ink3);font-size:12px;">× per</span>
      <select id="mac-goals-period" style="flex:1">
        <option value="">— period —</option>
        ${PERIODS_LIST.map(p=>`<option value="${p}" ${a?.goalsPeriod===p?'selected':''}>${p}</option>`).join('')}
      </select>
    </div>
  </div>
  <div class="field"><label>Locations</label>
    ${multiSelectWidget(S.locations,'mac-loc-sel',(a?.locationIds||'').split(',').filter(Boolean),'No locations yet — add them in the Locations panel.')}
  </div>
  ${a?`
  <div class="divider"></div>
  <div class="field"><label style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink3);">Projects in this activity</label>
    <div style="display:flex;flex-direction:column;gap:4px;margin-top:6px;">
      ${S.projects.filter(p=>p.activityId===a.id).map(p=>`
        <div style="display:flex;align-items:center;gap:8px;padding:5px 8px;background:var(--bg3);border-radius:var(--r);font-size:11px;">
          <span style="flex:1">${esc(p.label)}</span>
          <span class="badge">${p.status||'todo'}</span>
        </div>`).join('')||'<span style="font-size:11px;color:var(--ink3);font-style:italic">none</span>'}
    </div>
  </div>
  <div class="field"><label style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink3);">Routines in this activity</label>
    <div style="display:flex;flex-direction:column;gap:4px;margin-top:6px;">
      ${S.routines.filter(r=>r.activityId===a.id).map(r=>`
        <div style="padding:5px 8px;background:var(--bg3);border-radius:var(--r);font-size:11px;">
          ${esc(r.label)} <span style="color:var(--ink3)">${r.freqNum&&r.freqPeriod?r.freqNum+'× / '+r.freqPeriod:esc(r.frequency||'')}</span>
        </div>`).join('')||'<span style="font-size:11px;color:var(--ink3);font-style:italic">none</span>'}
    </div>
  </div>`:''}
  <div class="modal-actions">
    ${a?`<button class="btn danger" onclick="deleteEntity('activities','${a.id}')">delete</button>`:''}
    <button class="btn" onclick="closeModal()">cancel</button>
    <button class="btn primary" onclick="saveActivity('${id||''}')">save</button>
  </div>`);
}
async function saveActivity(existingId){
  const label=document.getElementById('mac-label').value.trim();
  const areaId=document.getElementById('mac-area').value||null;
  if(!label){ showToast('Label is required'); return; }
  // uniqueness check within area
  const duplicate=S.activities.find(a=>a.label.toLowerCase()===label.toLowerCase()&&a.areaId===areaId&&a.id!==existingId);
  if(duplicate){ showToast('An activity with this name already exists in this area'); return; }
  const goalsNum=parseInt(document.getElementById('mac-goals-num').value)||null;
  const goalsPeriod=document.getElementById('mac-goals-period').value||null;
  const locationIds=getMultiSelectValues('mac-loc-sel').join(',');
  const ac={id:existingId||uid(),label,areaId,
    description:document.getElementById('mac-desc').value.trim(),
    goalsNum,goalsPeriod,goals:goalsNum&&goalsPeriod?goalsNum+'x/'+goalsPeriod:'',
    locationIds};
  await API.saveActivity(ac);
  // reload from server to get persisted goalsNum/goalsPeriod
  S.activities = await API.getActivities();
  closeModal(); renderCfgPanel('activities'); showToast('Activity saved');
}

// ── PROJECT MODAL ──
function openProjectModal(id){
  const p=id?byId(S.projects,id):null;
  const preArea=p?.areaId||(S.cfgAreaFilter!=='all'?S.cfgAreaFilter:'');
  const preAct=p?.activityId||(S.cfgActivityFilter&&S.cfgActivityFilter!=='all'?S.cfgActivityFilter:'');
  // activities filtered to selected area (dynamic on area change)
  const actOpts='<option value="">—</option>'+activityOptions(preAct, preArea||null);
  // dep projects: same activity, or same area if no activity
  const depProjects=S.projects.filter(x=>x.id!==id&&(
    (preAct&&x.activityId===preAct)||(preArea&&x.areaId===preArea)||(!preAct&&!preArea)
  ));
  const depOpts='<option value="">— none —</option>'+depProjects.map(x=>`<option value="${x.id}" ${p?.dependsOnProjectId===x.id?'selected':''}>${esc(x.label)}</option>`).join('');
  openModal(`<div class="modal-title">${p?'Edit project':'New project'}<button onclick="closeModal()">✕</button></div>
  <div class="field"><label>Label</label><input type="text" id="mp-label" value="${esc(p?.label||'')}"></div>
  <div class="field"><label>Description</label><textarea id="mp-desc">${esc(p?.description||'')}</textarea></div>
  <div class="field"><label>Goals</label><input type="text" id="mp-goals" value="${esc(p?.goals||'')}"></div>
  <div class="grid2">
    <div class="field"><label>Area</label>
      <select id="mp-area" onchange="onProjectAreaChange()" >
        <option value="">—</option>${areaOptions(preArea)}
      </select></div>
    <div class="field"><label>Activity</label>
      <select id="mp-activity" onchange="onProjectActivityChange()">
        ${actOpts}
      </select></div>
  </div>
  <div class="grid2">
    <div class="field"><label>Status</label>
      <select id="mp-status">
        <option value="todo"       ${(p?.status||'todo')==='todo'      ?'selected':''}>To Do</option>
        <option value="doing"      ${p?.status==='doing'     ?'selected':''}>In Progress</option>
        <option value="waiting"    ${p?.status==='waiting'   ?'selected':''}>Waiting</option>
        <option value="suspended"  ${p?.status==='suspended' ?'selected':''}>Suspended</option>
        <option value="done"       ${p?.status==='done'      ?'selected':''}>Done</option>
      </select></div>
    <div class="field"><label>Deadline</label><input type="date" id="mp-deadline" value="${p?.deadline||''}"></div>
  </div>
  <div class="field"><label>Depends on project</label><select id="mp-depends">${depOpts}</select></div>
  <div class="field"><label>Locations</label>
    ${multiSelectWidget(S.locations,'mp-loc-sel',(p?.locationIds||'').split(',').filter(Boolean),'No locations yet — add them in the Locations panel.')}
  </div>
  ${p?`
  <div class="divider"></div>
  <div class="field"><label style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink3);">Tasks in this project</label>
    <div style="display:flex;flex-direction:column;gap:4px;margin-top:6px;max-height:160px;overflow-y:auto;">
      ${S.tasks.filter(t=>t.projectId===p.id).sort((a,b)=>({p1:0,p2:1,p3:2,'':3}[a.priority]??3)-({p1:0,p2:1,p3:2,'':3}[b.priority]??3)).map(t=>`
        <div style="display:flex;align-items:center;gap:8px;padding:5px 8px;background:var(--bg3);border-radius:var(--r);font-size:11px;">
          <span style="flex:1">${esc(t.label)}</span>
          ${t.priority?`<span class="tag tag-${t.priority}" style="font-size:8px">${{p1:'urgent',p2:'important',p3:'someday'}[t.priority]}</span>`:''}
          <span class="badge">${t.status||'todo'}</span>
          <button class="btn sm ghost" style="padding:2px 6px;font-size:10px" data-task-edit="${t.id}" onclick="editTaskFromProject(this)">✎</button>
        </div>`).join('')||'<span style="font-size:11px;color:var(--ink3);font-style:italic">none</span>'}
    </div>
    <button class="btn sm primary" style="margin-top:8px" data-proj-id="${p.id}" onclick="addTaskFromProject(this)">+ add task to this project</button>
  </div>`:''}
  <div class="modal-actions">
    ${p?`<button class="btn danger" onclick="deleteEntity('projects','${p.id}')">delete</button>`:''}
    <button class="btn" onclick="closeModal()">cancel</button>
    <button class="btn primary" onclick="saveProject('${id||''}')">save</button>
  </div>`);
}
function onProjectAreaChange(){
  const areaId=document.getElementById('mp-area').value||null;
  const actSel=document.getElementById('mp-activity');
  const cur=actSel.value;
  actSel.innerHTML='<option value="">—</option>'+activityOptions(cur,areaId);
  onProjectActivityChange();
}
function onProjectActivityChange(){
  const areaId=document.getElementById('mp-area').value||null;
  const actId=document.getElementById('mp-activity').value||null;
  const depSel=document.getElementById('mp-depends');
  if(depSel){
    const deps=S.projects.filter(x=>areaId?x.areaId===areaId:true);
    depSel.innerHTML='<option value="">— none —</option>'+deps.map(x=>`<option value="${x.id}">${esc(x.label)}</option>`).join('');
  }
  // Auto-set location(s) from activity
  if(actId){
    const act=byId(S.activities,actId);
    if(act?.locationIds){
      const locSel=document.getElementById('mp-loc-sel');
      if(locSel){
        const actLocs=act.locationIds.split(',').filter(Boolean);
        [...locSel.options].forEach(o=>{ o.selected=actLocs.includes(o.value); });
      }
    }
  }
}
async function saveProject(existingId){
  const proj={id:existingId||uid(),
    label:document.getElementById('mp-label').value.trim(),
    description:document.getElementById('mp-desc').value.trim(),
    goals:document.getElementById('mp-goals').value.trim(),
    areaId:document.getElementById('mp-area').value||null,
    activityId:document.getElementById('mp-activity').value||null,
    status:document.getElementById('mp-status').value||'todo',
    deadline:document.getElementById('mp-deadline').value||'',
    dependsOnProjectId:document.getElementById('mp-depends').value||null,
    locationIds:getMultiSelectValues('mp-loc-sel').join(',')};
  await API.saveProject(proj);
  if(existingId) S.projects=S.projects.filter(p=>p.id!==existingId);
  S.projects.push(proj);
  closeModal(); renderCfgPanel('projects'); showToast('Project saved');
}

// ── ROUTINE MODAL ──
function openRoutineModal(id){
  const r=id?byId(S.routines,id):null;
  const preArea=r?byId(S.activities,r.activityId)?.areaId||'':(S.cfgAreaFilter!=='all'?S.cfgAreaFilter:'');
  const preAct=r?.activityId||(S.cfgRoutineActFilter&&S.cfgRoutineActFilter!=='all'?S.cfgRoutineActFilter:'');
  const FREQ_PERIODS=['day','week','month','quarter','year'];
  const apArr=Array.isArray(r?.applicablePeriods)?r.applicablePeriods:(typeof r?.applicablePeriods==='string'?r.applicablePeriods.split(',').filter(Boolean):[]);
  const eventOpts='<option value="">— none (use frequency) —</option>'+S.events.map(ev=>`<option value="${ev.id}" ${r?.eventId===ev.id?'selected':''}>${esc(ev.label)}</option>`).join('');
  const actOptsFiltered='<option value="">—</option>'+activityOptions(preAct, preArea||null);
  openModal(`<div class="modal-title">${r?'Edit routine':'New routine'}<button onclick="closeModal()">✕</button></div>
  <div class="field"><label>Label</label><input type="text" id="mr-label" value="${esc(r?.label||'')}"></div>
  <div class="grid2">
    <div class="field"><label>Area</label>
      <select id="mr-area" onchange="onRoutineAreaChange()">
        <option value="">—</option>${areaOptions(preArea)}
      </select></div>
    <div class="field"><label>Activity</label>
      <select id="mr-activity" onchange="onRoutineActivityChange()">${actOptsFiltered}</select></div>
  </div>
  <div class="field"><label>Description</label><textarea id="mr-desc">${esc(r?.description||'')}</textarea></div>
  <div class="grid2">
    <div class="field"><label>Frequency</label>
      <div style="display:flex;gap:6px;align-items:center;">
        <input type="number" id="mr-freq-num" min="1" value="${r?.freqNum||1}" style="width:64px">
        <span style="color:var(--ink3);font-size:12px;">× per</span>
        <select id="mr-freq-period" onchange="onRoutineFreqChange()" style="flex:1">
          ${FREQ_PERIODS.map(p=>`<option value="${p}" ${(r?.freqPeriod||'day')===p?'selected':''}>${p}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="field"><label>Duration (min)</label><input type="number" id="mr-dur" value="${r?.durationMin||''}" placeholder="30"></div>
  </div>
  <div id="mr-dow-wrap" class="field" style="display:none"><label>Preferred day of week</label>
    <select id="mr-dow">
      ${['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map((d,i)=>`<option value="${i}" ${r?.dayOfWeek===i?'selected':''}>${d}</option>`).join('')}
    </select>
  </div>
  <div id="mr-dom-wrap" class="field" style="display:none"><label>Preferred day of month (1–31)</label>
    <input type="number" id="mr-dom" min="1" max="31" value="${r?.dayOfMonth||1}" style="width:80px">
  </div>
  <div id="mr-doy-wrap" class="field" style="display:none"><label>Preferred date (month/day)</label>
    <div style="display:flex;gap:8px;">
      <select id="mr-doy-month" style="flex:1">
        ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m,i)=>`<option value="${i+1}" ${r?.yearMonth===i+1?'selected':''}>${m}</option>`).join('')}
      </select>
      <input type="number" id="mr-doy-day" min="1" max="31" value="${r?.yearDay||1}" style="width:70px" placeholder="day">
    </div>
  </div>
  <div class="field"><label>Trigger event (instead of frequency)</label><select id="mr-event">${eventOpts}</select></div>
  <div class="field"><label>Applicable periods <span style="font-size:10px;color:var(--ink3);font-weight:normal;">(empty = applies to all)</span></label>
    ${multiSelectWidget(S.periods,'mr-period-sel',apArr,'No periods defined yet.','70px')}
  </div>
  <div class="field"><label>Resources (URL — description, one per line)</label><textarea id="mr-res" rows="2">${(()=>{try{const res=typeof r?.resources==='string'?JSON.parse(r.resources||'[]'):(r?.resources||[]);return res.map(rv=>rv.url+(rv.desc?' — '+rv.desc:'')).join('\n');}catch(e){return '';}})()}</textarea></div>
  <div class="field"><label>Location</label>
    <select id="mr-location">
      <option value="">— none —</option>
      ${S.locations.map(l=>`<option value="${l.id}" ${r?.locationId===l.id?'selected':''}>${esc(l.label)}</option>`).join('')}
    </select>
  </div>
  <div class="modal-actions">
    ${r?`<button class="btn danger" onclick="deleteEntity('routines','${r.id}')">delete</button>`:''}
    <button class="btn" onclick="closeModal()">cancel</button>
    <button class="btn primary" onclick="saveRoutine('${id||''}')">save</button>
  </div>`);
  setTimeout(()=>{ onRoutineFreqChange(); onRoutineActivityChange(); }, 20);
}
function onRoutineAreaChange(){
  const areaId=document.getElementById('mr-area').value||null;
  const actSel=document.getElementById('mr-activity');
  actSel.innerHTML='<option value="">—</option>'+activityOptions('',areaId);
  onRoutineActivityChange();
}
function onRoutineActivityChange(){
  const actId=document.getElementById('mr-activity')?.value||null;
  if(!actId) return;
  const act=byId(S.activities,actId);
  if(act?.locationIds){
    const firstLoc=act.locationIds.split(',').filter(Boolean)[0]||'';
    const locSel=document.getElementById('mr-location');
    if(locSel&&firstLoc) locSel.value=firstLoc;
  }
}
function onRoutineFreqChange(){
  const p=document.getElementById('mr-freq-period').value;
  const numEl=document.getElementById('mr-freq-num');
  const isOnce=parseInt(numEl?.value||1)===1;
  document.getElementById('mr-dow-wrap').style.display = p==='week'&&isOnce?'':'none';
  document.getElementById('mr-dom-wrap').style.display = p==='month'&&isOnce?'':'none';
  document.getElementById('mr-doy-wrap').style.display = p==='year'&&isOnce?'':'none';
}
async function saveRoutine(existingId){
  try {
    if(!document.getElementById('mr-label')){ showToast('Form is closed'); return; }
    const label=document.getElementById('mr-label').value.trim();
    if(!label){ showToast('Label is required'); return; }
    const resRaw=document.getElementById('mr-res').value.trim();
    const resources=resRaw?resRaw.split('\n').map(l=>{ const parts=l.split(' — '); return {url:parts[0].trim(),desc:(parts[1]||'').trim()}; }).filter(r=>r.url):[];
    const freqNum=parseInt(document.getElementById('mr-freq-num').value)||1;
    const freqPeriod=document.getElementById('mr-freq-period').value||'day';
    const applicablePeriods=getMultiSelectValues('mr-period-sel');
    const routine={
      id:existingId||uid(), label,
      activityId:document.getElementById('mr-activity').value||null,
      description:document.getElementById('mr-desc').value.trim(),
      freqNum, freqPeriod,
      frequency:freqNum+'x-'+freqPeriod,
      durationMin:parseInt(document.getElementById('mr-dur').value)||30,
      eventId:document.getElementById('mr-event').value||null,
      applicablePeriods: Array.isArray(applicablePeriods)?applicablePeriods.join(','):applicablePeriods,
      locationId: document.getElementById('mr-location')?.value||null,
      dayOfWeek:  freqPeriod==='week' ?parseInt(document.getElementById('mr-dow')?.value)||null:null,
      dayOfMonth: freqPeriod==='month'?parseInt(document.getElementById('mr-dom')?.value)||null:null,
      yearMonth:  freqPeriod==='year' ?parseInt(document.getElementById('mr-doy-month')?.value)||null:null,
      yearDay:    freqPeriod==='year' ?parseInt(document.getElementById('mr-doy-day')?.value)||null:null,
      resources: JSON.stringify(resources)
    };
    await API.saveRoutine(routine);
    if(existingId) S.routines=S.routines.filter(r=>r.id!==existingId);
    S.routines.push(routine);
    closeModal(); renderCfgPanel('routines'); showToast('Routine saved');
  } catch(e) { showToast('Error saving routine: '+e.message); console.error(e); }
}

// ── EVENT MODAL ──
function openEventModal(id){
  const ev=id?byId(S.events,id):null;
  const preArea=ev?.areaId||(S.cfgAreaFilter!=='all'?S.cfgAreaFilter:'');
  openModal(`<div class="modal-title">${ev?'Edit event':'New event'}<button onclick="closeModal()">✕</button></div>
  <div class="field"><label>Label</label><input type="text" id="mev-label" value="${esc(ev?.label||'')}"></div>
  <div class="field"><label>Area</label><select id="mev-area"><option value="">—</option>${areaOptions(preArea)}</select></div>
  <div class="field"><label>Description</label><textarea id="mev-desc">${esc(ev?.description||'')}</textarea></div>
  <div class="grid2">
    <div class="field"><label>Frequency</label>
      <select id="mev-freq" onchange="onEventFreqChange()">
        <option value="once"    ${(ev?.frequency||'once')==='once'   ?'selected':''}>Once / planned</option>
        <option value="weekly"  ${ev?.frequency==='weekly' ?'selected':''}>Weekly</option>
        <option value="monthly" ${ev?.frequency==='monthly'?'selected':''}>Monthly</option>
        <option value="yearly"  ${ev?.frequency==='yearly' ?'selected':''}>Yearly</option>
      </select></div>
    <div class="field"><label>Duration (min)</label><input type="number" id="mev-dur" value="${ev?.durationMin||60}"></div>
  </div>
  <div id="mev-date-wrap" class="field"><label>Date</label>
    <input type="date" id="mev-date" value="${ev?.date||''}"></div>
  <div id="mev-dow-wrap" class="field"><label>Day of week</label>
    <select id="mev-dow">
      ${['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map((d,i)=>`<option value="${i}" ${ev?.dayOfWeek===i?'selected':''}>${d}</option>`).join('')}
    </select></div>
  <div id="mev-dom-wrap" class="field"><label>Day of month</label>
    <input type="number" id="mev-dom" min="1" max="31" value="${ev?.dayOfMonth||1}"></div>
  <div class="field"><label>Resources (URL — description, one per line)</label>
    <textarea id="mev-res" rows="2">${(ev?.resources||[]).map(r=>r.url+(r.desc?' \u2014 '+r.desc:'')).join('\n')}</textarea></div>
  <div class="modal-actions">
    ${ev?`<button class="btn danger" onclick="deleteEntity('events','${ev.id}')">delete</button>`:''}
    <button class="btn" onclick="closeModal()">cancel</button>
    <button class="btn primary" onclick="saveEvent('${id||''}')">save</button>
  </div>`);
  onEventFreqChange();
}
function onEventFreqChange(){
  const f=document.getElementById('mev-freq').value;
  document.getElementById('mev-date-wrap').style.display = f==='once'||f==='yearly'?'':'none';
  document.getElementById('mev-dow-wrap').style.display  = f==='weekly'?'':'none';
  document.getElementById('mev-dom-wrap').style.display  = f==='monthly'?'':'none';
}
async function saveEvent(existingId){
  try {
    const label=document.getElementById('mev-label').value.trim();
    if(!label){ showToast('Label is required'); return; }
    const freq=document.getElementById('mev-freq').value;
    const resRaw=document.getElementById('mev-res').value.trim();
    const resources=resRaw?resRaw.split('\n').map(l=>{ const parts=l.split(' — '); return {url:parts[0].trim(),desc:(parts[1]||'').trim()}; }).filter(r=>r.url):[];
    const ev={
      id:existingId||uid(), label,
      areaId:document.getElementById('mev-area').value||null,
      description:document.getElementById('mev-desc').value.trim(),
      frequency:freq,
      durationMin:parseInt(document.getElementById('mev-dur').value)||60,
      date:freq==='once'?(document.getElementById('mev-date').value||''):'',
      dayOfWeek:freq==='weekly'?parseInt(document.getElementById('mev-dow').value):null,
      dayOfMonth:freq==='monthly'?parseInt(document.getElementById('mev-dom').value||'1'):null,
      resources: JSON.stringify(resources)
    };
    await API.saveEvent(ev);
    if(existingId) S.events=S.events.filter(e=>e.id!==existingId);
    S.events.push(ev);
    closeModal(); renderCfgPanel('events'); showToast('Event saved');
  } catch(e) { showToast('Error saving event: '+e.message); console.error(e); }
}

// ── PERIOD MODAL ──
function openPeriodModal(id){
  const p=id?byId(S.periods,id):null;
  const days=['mon','tue','wed','thu','fri','sat','sun'];
  const checkboxes=days.map(d=>`<label style="display:flex;align-items:center;gap:5px;font-size:11px;cursor:pointer;">
    <input type="checkbox" id="mper-${d}" ${(Array.isArray(p?.dayTypes)?p.dayTypes:(p?.dayTypes||'').split(',')).includes(d)?'checked':''}> ${d.charAt(0).toUpperCase()+d.slice(1)}
  </label>`).join('');
  openModal(`<div class="modal-title">${p?'Edit period':'New period'}<button onclick="closeModal()">✕</button></div>
  <div class="field"><label>Label</label><input type="text" id="mper-label" value="${esc(p?.label||'')}"></div>
  <div class="field"><label>Description</label><textarea id="mper-desc" rows="2">${esc(p?.description||'')}</textarea></div>
  <div class="field"><label>Available hours/day</label><input type="number" id="mper-hrs" value="${p?.availableHours||16}" min="1" max="24"></div>
  <div class="field"><label>Day types</label><div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:4px">${checkboxes}</div></div>
  <div class="modal-actions">
    ${p?`<button class="btn danger" onclick="deleteEntity('periods','${p.id}')">delete</button>`:''}
    <button class="btn" onclick="closeModal()">cancel</button>
    <button class="btn primary" onclick="savePeriod('${id||''}')">save</button>
  </div>`);
}
async function savePeriod(existingId){
  try {
    const label=document.getElementById('mper-label').value.trim();
    if(!label){ showToast('Label is required'); return; }
    const days=['mon','tue','wed','thu','fri','sat','sun'];
    const dayTypes=days.filter(d=>document.getElementById('mper-'+d)?.checked);
    const per={id:existingId||uid(),label,
      description:document.getElementById('mper-desc').value.trim(),
      availableHours:parseFloat(document.getElementById('mper-hrs').value)||16,
      dayTypes: dayTypes.join(',')};  // store as comma-string to match DB
    await API.savePeriod(per);
    if(existingId) S.periods=S.periods.filter(p=>p.id!==existingId);
    S.periods.push(per);
    closeModal(); renderCfgPanel('periods'); showToast('Period saved');
  } catch(e) { showToast('Error saving period: '+e.message); console.error(e); }
}


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


// ════════════════════════════════════════════════════════
