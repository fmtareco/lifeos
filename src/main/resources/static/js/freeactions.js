//  FREE ACTIONS (localStorage-persisted action templates)
// ════════════════════════════════════════════════════════
function saveFreeActions(){
  localStorage.setItem('lifeos-free-actions', JSON.stringify(S.freeActions));
}

function renderCfgFreeActions(areaId, activityId){
  const filtered = S.freeActions.filter(f =>
    (!areaId || f.areaId===areaId) &&
    (!activityId || f.activityId===activityId)
  );
  const area = areaId ? areaOf(areaId) : null;
  const act  = activityId ? activityOf(activityId) : null;
  const title = act ? act.label : area ? area.label : 'All';

  openModal(`<div class="modal-title">Free Actions — ${esc(title)}<button onclick="closeModal()">✕</button></div>
  <div style="font-size:11px;color:var(--ink3);margin-bottom:12px;">Named actions not tied to a routine or task. Used by the auto-agenda and the Plan modal.</div>
  <div id="fa-list" style="display:flex;flex-direction:column;gap:5px;margin-bottom:12px;max-height:240px;overflow-y:auto;">
    ${filtered.map(f=>`<div style="display:flex;align-items:center;gap:8px;padding:7px 10px;background:var(--bg3);border-radius:var(--r);font-size:12px;">
      <span style="flex:1">${esc(f.label)}</span>
      ${f.durationMin?`<span class="badge">${f.durationMin}min</span>`:''}
      <button class="btn sm ghost" onclick="openFreeActionForm('${f.id}')">✎</button>
      <button class="btn sm danger" onclick="deleteFreeAction('${f.id}')">✕</button>
    </div>`).join('')||'<div style="font-size:11px;color:var(--ink3);font-style:italic">None yet.</div>'}
  </div>
  <div style="border-top:1px solid var(--line);padding-top:12px;">
    <div style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink3);margin-bottom:8px;">Add / edit</div>
    <div id="fa-form">
      <input type="hidden" id="fa-id">
      <div class="field"><label>Label</label><input type="text" id="fa-label" placeholder="e.g. Read article"></div>
      <div class="grid2">
        <div class="field"><label>Area</label>
          <select id="fa-area" onchange="onFAAreaChange()">
            <option value="">—</option>${areaOptions(areaId||'')}
          </select></div>
        <div class="field"><label>Activity</label>
          <select id="fa-activity">
            <option value="">—</option>${activityOptions(activityId||'', areaId||null)}
          </select></div>
      </div>
      <div class="grid2">
        <div class="field"><label>Est. duration (min)</label><input type="number" id="fa-dur" min="0" placeholder="0" value=""></div>
        <div class="field"><label>Description</label><input type="text" id="fa-desc" placeholder="optional"></div>
      </div>
    </div>
  </div>
  <div class="modal-actions">
    <button class="btn" onclick="closeModal()">close</button>
    <button class="btn primary" onclick="saveFreeAction()">save action</button>
  </div>`);
}

function onFAAreaChange(){
  const areaId=document.getElementById('fa-area')?.value||null;
  const actSel=document.getElementById('fa-activity');
  if(actSel) actSel.innerHTML='<option value="">—</option>'+activityOptions('',areaId);
}

function openFreeActionForm(id){
  const f=S.freeActions.find(x=>x.id===id);
  if(!f) return;
  const idEl=document.getElementById('fa-id'); if(idEl) idEl.value=f.id;
  const lbl=document.getElementById('fa-label'); if(lbl) lbl.value=f.label;
  const area=document.getElementById('fa-area'); if(area){ area.value=f.areaId||''; onFAAreaChange(); }
  const act=document.getElementById('fa-activity'); if(act) setTimeout(()=>act.value=f.activityId||'',20);
  const dur=document.getElementById('fa-dur'); if(dur) dur.value=f.durationMin||'';
  const desc=document.getElementById('fa-desc'); if(desc) desc.value=f.description||'';
}

function saveFreeAction(){
  const id=document.getElementById('fa-id')?.value||uid();
  const label=document.getElementById('fa-label')?.value.trim();
  if(!label){ showToast('Label required'); return; }
  const fa={
    id, label,
    areaId:document.getElementById('fa-area')?.value||null,
    activityId:document.getElementById('fa-activity')?.value||null,
    durationMin:parseInt(document.getElementById('fa-dur')?.value)||0,
    description:document.getElementById('fa-desc')?.value.trim()||'',
  };
  S.freeActions=S.freeActions.filter(f=>f.id!==id);
  S.freeActions.push(fa);
  saveFreeActions();
  // Re-render the list inline
  const listEl=document.getElementById('fa-list');
  if(listEl){
    const areaId=document.getElementById('fa-area')?.value||null;
    const actId=document.getElementById('fa-activity')?.value||null;
    const filtered=S.freeActions.filter(f=>(!areaId||f.areaId===areaId)&&(!actId||f.activityId===actId));
    listEl.innerHTML=filtered.map(f=>`<div style="display:flex;align-items:center;gap:8px;padding:7px 10px;background:var(--bg3);border-radius:var(--r);font-size:12px;">
      <span style="flex:1">${esc(f.label)}</span>
      ${f.durationMin?`<span class="badge">${f.durationMin}min</span>`:''}
      <button class="btn sm ghost" onclick="openFreeActionForm('${f.id}')">✎</button>
      <button class="btn sm danger" onclick="deleteFreeAction('${f.id}')">✕</button>
    </div>`).join('')||'<div style="font-size:11px;color:var(--ink3);font-style:italic">None yet.</div>';
  }
  // Reset form
  const idEl=document.getElementById('fa-id'); if(idEl) idEl.value='';
  const lbl=document.getElementById('fa-label'); if(lbl) lbl.value='';
  showToast('Free action saved');
}

function deleteFreeAction(id){
  S.freeActions=S.freeActions.filter(f=>f.id!==id);
  saveFreeActions();
  const el=document.querySelector(`[onclick*="deleteFreeAction('${id}')"]`);
  if(el) el.closest('div[style]')?.remove();
}

// ── GENERIC DELETE ──
async function deleteEntity(store,id){
  if(!confirm('Delete this item?')) return;
  // map store name to API method
  const apiDel = {areas:'deleteArea',activities:'deleteActivity',projects:'deleteProject',
    tasks:'deleteTask',routines:'deleteRoutine',events:'deleteEvent',
    locations:'deleteLocation',periods:'deletePeriod',balance:'deleteBalance',actions:'deleteAction'};
  await API[apiDel[store]](id);
  S[store]=S[store].filter(x=>x.id!==id);
  closeModal();
  renderPage(S.currentPage);
  showToast('Deleted');
}

// ════════════════════════════════════════════════════════
