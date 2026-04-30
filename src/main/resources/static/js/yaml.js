//  EXPORT YAML (full configuration)
// ════════════════════════════════════════════════════════
function exportYAML(){
  function yamlStr(s){ return s?'"'+String(s).replace(/"/g,'\\"')+'"':'""'; }
  function yamlVal(v){
    if(v===null||v===undefined) return 'null';
    if(typeof v==='number') return String(v);
    if(typeof v==='boolean') return String(v);
    return yamlStr(v);
  }
  function indent(s,n){ return s.split('\r\n').map(l=>l?'  '.repeat(n)+l:l).join('\r\n'); }

  let y = '# lifeOS configuration export\r\n# generated: '+S.todayDate+'\r\n\n';

  y += 'areas:\r\n';
  S.areas.forEach(a => {
    y += '  - id: '+yamlStr(a.id)+'\r\n';
    y += '    label: '+yamlStr(a.label)+'\r\n';
    y += '    color: '+yamlStr(a.color)+'\r\n';
  });

  y += '\r\nlocations:\n';
  if(!S.locations.length) y += '  []\r\n';
  S.locations.forEach(l => {
    y += '  - id: '+yamlStr(l.id)+'\r\n';
    y += '    label: '+yamlStr(l.label)+'\r\n';
    if(l.type)    y += '    type: '+yamlStr(l.type)+'\r\n';
    if(l.address) y += '    address: '+yamlStr(l.address)+'\r\n';
    if(l.description) y += '    description: '+yamlStr(l.description)+'\r\n';
  });

  y += '\r\nperiods:\n';
  S.periods.forEach(p => {
    y += '  - id: '+yamlStr(p.id)+'\r\n';
    y += '    label: '+yamlStr(p.label)+'\r\n';
    y += '    availableHours: '+yamlVal(p.availableHours)+'\r\n';
    y += '    dayTypes: '+yamlStr(p.dayTypes||'')+'\r\n';
    if(p.description) y += '    description: '+yamlStr(p.description)+'\r\n';
  });

  y += '\r\nbalance:\n';
  S.periods.forEach(per => {
    y += '  '+per.label+':\r\n';
    S.areas.forEach(a => {
      const b = S.balance.find(x=>x.periodId===per.id&&x.areaId===a.id);
      y += '    '+a.label+': '+(b?.weightPct||0)+'\r\n';
    });
  });

  y += '\r\nactivities:\n';
  S.activities.forEach(ac => {
    const area = areaOf(ac.areaId);
    y += '  - id: '+yamlStr(ac.id)+'\r\n';
    y += '    label: '+yamlStr(ac.label)+'\r\n';
    y += '    area: '+yamlStr(area?.label||ac.areaId||'')+'\r\n';
    if(ac.description) y += '    description: '+yamlStr(ac.description)+'\r\n';
    if(ac.goalsNum)    y += '    goalsNum: '+ac.goalsNum+'\r\n';
    if(ac.goalsPeriod) y += '    goalsPeriod: '+yamlStr(ac.goalsPeriod)+'\r\n';
    if(ac.locationIds){ const locs=(ac.locationIds).split(',').filter(Boolean).map(id=>byId(S.locations,id)?.label).filter(Boolean); if(locs.length) y += '    locations: ['+locs.map(l=>yamlStr(l)).join(', ')+']\r\n'; }
  });

  y += '\r\nroutines:\n';
  S.routines.forEach(r => {
    const ac = activityOf(r.activityId);
    const area = areaOf(ac?.areaId);
    const loc = r.locationId?byId(S.locations,r.locationId):null;
    const perLabels = (r.applicablePeriods||'').split(',').filter(Boolean).map(id=>byId(S.periods,id)?.label).filter(Boolean);
    y += '  - id: '+yamlStr(r.id)+'\r\n';
    y += '    label: '+yamlStr(r.label)+'\r\n';
    if(area)  y += '    area: '+yamlStr(area.label)+'\r\n';
    if(ac)    y += '    activity: '+yamlStr(ac.label)+'\r\n';
    if(r.description) y += '    description: '+yamlStr(r.description)+'\r\n';
    y += '    frequency: '+yamlVal(r.freqNum||1)+' x '+yamlStr(r.freqPeriod||r.frequency||'day')+'\r\n';
    if(r.durationMin) y += '    durationMin: '+r.durationMin+'\r\n';
    if(r.dayOfWeek!==null&&r.dayOfWeek!==undefined) y += '    dayOfWeek: '+['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][r.dayOfWeek]+'\r\n';
    if(r.dayOfMonth)  y += '    dayOfMonth: '+r.dayOfMonth+'\r\n';
    if(loc)   y += '    location: '+yamlStr(loc.label)+'\r\n';
    if(perLabels.length) y += '    applicablePeriods: ['+perLabels.map(l=>yamlStr(l)).join(', ')+']\r\n';
  });

  y += '\r\nevents:\n';
  if(!S.events.length) y += '  []\r\n';
  S.events.forEach(ev => {
    const area = areaOf(ev.areaId);
    y += '  - id: '+yamlStr(ev.id)+'\r\n';
    y += '    label: '+yamlStr(ev.label)+'\r\n';
    if(area) y += '    area: '+yamlStr(area.label)+'\r\n';
    if(ev.description) y += '    description: '+yamlStr(ev.description)+'\r\n';
    y += '    frequency: '+yamlStr(ev.frequency||'once')+'\r\n';
    if(ev.durationMin) y += '    durationMin: '+ev.durationMin+'\r\n';
    if(ev.date) y += '    date: '+yamlStr(ev.date)+'\r\n';
    if(ev.dayOfWeek!==null&&ev.dayOfWeek!==undefined) y += '    dayOfWeek: '+['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][ev.dayOfWeek]+'\r\n';
    if(ev.dayOfMonth) y += '    dayOfMonth: '+ev.dayOfMonth+'\r\n';
  });

  y += '\r\nprojects:\n';
  S.projects.forEach(p => {
    const area = areaOf(p.areaId);
    const act = activityOf(p.activityId);
    const dep = byId(S.projects, p.dependsOnProjectId);
    const pLocs = (p.locationIds||'').split(',').filter(Boolean).map(id=>byId(S.locations,id)?.label).filter(Boolean);
    y += '  - id: '+yamlStr(p.id)+'\r\n';
    y += '    label: '+yamlStr(p.label)+'\r\n';
    y += '    status: '+yamlStr(p.status||'todo')+'\r\n';
    if(area) y += '    area: '+yamlStr(area.label)+'\r\n';
    if(act)  y += '    activity: '+yamlStr(act.label)+'\r\n';
    if(p.deadline) y += '    deadline: '+yamlStr(p.deadline)+'\r\n';
    if(p.goals) y += '    goals: '+yamlStr(p.goals)+'\r\n';
    if(p.description) y += '    description: '+yamlStr(p.description)+'\r\n';
    if(dep)  y += '    dependsOn: '+yamlStr(dep.label)+'\r\n';
    if(pLocs.length) y += '    locations: ['+pLocs.map(l=>yamlStr(l)).join(', ')+']\r\n';
    const tasks = S.tasks.filter(t=>t.projectId===p.id);
    if(tasks.length){
      y += '    tasks:\r\n';
      tasks.forEach(t => {
        y += '      - label: '+yamlStr(t.label)+'\r\n';
        y += '        status: '+yamlStr(t.status||'todo')+'\r\n';
        if(t.priority)    y += '        priority: '+yamlStr(t.priority)+'\r\n';
        if(t.deadline)    y += '        deadline: '+yamlStr(t.deadline)+'\r\n';
        if(t.estimatedMin)y += '        estimatedMin: '+t.estimatedMin+'\r\n';
        if(t.description) y += '        description: '+yamlStr(t.description)+'\r\n';
        if(t.activationDate) y += '        activationDate: '+yamlStr(t.activationDate)+'\r\n';
        if(t.dependsOnTaskId){ const dep=byId(S.tasks,t.dependsOnTaskId); if(dep) y+='        dependsOn: '+yamlStr(dep.label)+'\r\n'; }
      });
    }
  });

  const blob = new Blob([y], {type:'text/yaml;charset=utf-8'});
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'lifeos-config-'+S.todayDate+'.yaml';
  link.click();
  URL.revokeObjectURL(link.href);
  showToast('↓ Exported lifeos-config.yaml');
}

// ════════════════════════════════════════════════════════
//  IMPORT YAML
// ════════════════════════════════════════════════════════
function triggerYAMLImport(){
  const inp = document.createElement('input');
  inp.type='file'; inp.accept='.yaml,.yml';
  inp.onchange = async e => {
    const file = e.target.files[0]; if(!file) return;
    const text = await file.text();
    openModal(`<div class="modal-title">Import YAML<button onclick="closeModal()">✕</button></div>
    <div style="font-size:12px;color:var(--ink2);margin-bottom:16px;">
      This will import from <strong>${esc(file.name)}</strong>.<br>
      <span style="color:var(--danger)">Existing data will NOT be deleted.</span> Items with matching IDs will be updated; new ones will be created.
    </div>
    <div class="modal-actions">
      <button class="btn" onclick="closeModal()">cancel</button>
      <button class="btn primary" id="yaml-import-confirm-btn">import</button>
    </div>`);
  // Store text on button to avoid huge onclick attribute
  setTimeout(()=>{
    const btn=document.getElementById('yaml-import-confirm-btn');
    if(btn){ btn._yamlText=text; btn.onclick=()=>confirmYAMLImport(btn._yamlText); }
  },10);
  };
  inp.click();
}

async function confirmYAMLImport(yamlText){
  closeModal();
  if(!yamlText||!yamlText.trim()){ showToast('Empty file'); return; }

  showToast('Importing…', 30000);
  let imported=0, errors=0;

  try {
    // Simple line-by-line YAML parser for our known structure
    // Supports the exact format we export
    const lines = yamlText.replace(/\r/g,'').split('\n');
    let currentSection = '';
    let currentItem = null;
    let currentProject = null;
    let currentTask = null;
    const areaMap = {};   // label -> id
    const actMap  = {};   // label -> id
    const locMap  = {};   // label -> id
    const perMap  = {};   // label -> id
    const projMap = {};   // label -> id
    const taskMap = {};   // label -> id

    // Build lookup maps from existing data
    S.areas.forEach(a=>{ areaMap[a.label]=a.id; });
    S.activities.forEach(a=>{ actMap[a.label]=a.id; });
    S.locations.forEach(l=>{ locMap[l.label]=l.id; });
    S.periods.forEach(p=>{ perMap[p.label]=p.id; });
    S.projects.forEach(p=>{ projMap[p.label]=p.id; });
    S.tasks.forEach(t=>{ taskMap[t.label]=t.id; });

    function unquote(s){ return s?s.replace(/^["']|["']$/g,'').replace(/\\"/g,'"'):''; }
    function parseVal(s){ const v=s.trim(); if(v==='null') return null; if(v==='true') return true; if(v==='false') return false; const n=Number(v); if(!isNaN(n)&&v!=='') return n; return unquote(v); }

    async function saveItem(section, item){
      if(!item||!item.id) return;
      try {
        if(section==='areas'){ await API.saveArea(item); if(!byId(S.areas,item.id)) S.areas.push(item); else Object.assign(byId(S.areas,item.id),item); areaMap[item.label]=item.id; }
        else if(section==='locations'){ await API.saveLocation(item); if(!byId(S.locations,item.id)) S.locations.push(item); else Object.assign(byId(S.locations,item.id),item); locMap[item.label]=item.id; }
        else if(section==='periods'){ await API.savePeriod(item); if(!byId(S.periods,item.id)) S.periods.push(item); else Object.assign(byId(S.periods,item.id),item); perMap[item.label]=item.id; }
        else if(section==='activities'){ await API.saveActivity(item); if(!byId(S.activities,item.id)) S.activities.push(item); else Object.assign(byId(S.activities,item.id),item); actMap[item.label]=item.id; }
        else if(section==='routines'){ await API.saveRoutine(item); if(!byId(S.routines,item.id)) S.routines.push(item); else Object.assign(byId(S.routines,item.id),item); }
        else if(section==='events'){ await API.saveEvent(item); if(!byId(S.events,item.id)) S.events.push(item); else Object.assign(byId(S.events,item.id),item); }
        else if(section==='projects'){ await API.saveProject(item); if(!byId(S.projects,item.id)) S.projects.push(item); else Object.assign(byId(S.projects,item.id),item); projMap[item.label]=item.id; }
        else if(section==='tasks'){ await API.saveTask(item); if(!byId(S.tasks,item.id)) S.tasks.push(item); else Object.assign(byId(S.tasks,item.id),item); taskMap[item.label]=item.id; }
        imported++;
      } catch(e){ errors++; console.warn('Import error for',item,e.message); }
    }

    for(let i=0; i<lines.length; i++){
      const raw = lines[i];
      const line = raw.trimEnd();
      if(!line||line.startsWith('#')) continue;

      // Top-level section
      if(/^[a-z]/.test(line)&&line.endsWith(':')){
        if(currentItem) await saveItem(currentSection, currentItem);
        if(currentTask) await saveItem('tasks', currentTask);
        currentItem=null; currentTask=null; currentProject=null;
        currentSection=line.slice(0,-1);
        continue;
      }

      const indent2 = raw.match(/^( *)/)[1].length;

      // New top-level list item (2 spaces indent, starts with -)
      if(indent2===2&&line.trimStart().startsWith('- ')){
        if(currentItem) await saveItem(currentSection, currentItem);
        if(currentTask) await saveItem('tasks', currentTask);
        currentTask=null;
        const kv=line.trimStart().slice(2);
        currentItem={id:uid()};
        if(kv.includes(': ')){ const [k,...vs]=kv.split(': '); currentItem[k.trim()]=parseVal(vs.join(': ')); }
        continue;
      }

      // Nested task item (6 spaces)
      if(indent2===6&&line.trimStart().startsWith('- ')&&currentSection==='projects'){
        if(currentTask) await saveItem('tasks', currentTask);
        currentTask={id:uid(), projectId:currentItem?.id, areaId:currentItem?.areaId, status:'todo'};
        const kv=line.trimStart().slice(2);
        if(kv.includes(': ')){ const [k,...vs]=kv.split(': '); currentTask[k.trim()]=parseVal(vs.join(': ')); }
        continue;
      }

      // Key: value lines
      const kvMatch = line.match(/^( +)([a-zA-Z_]+): (.*)$/);
      if(kvMatch){
        const [,sp,key,val]=kvMatch;
        const depth=sp.length;
        const parsed=parseVal(val);

        if(depth<=4&&currentItem&&!currentTask){
          // Resolve label references to IDs
          if(key==='area'&&typeof parsed==='string') currentItem.areaId=areaMap[parsed]||parsed;
          else if(key==='activity'&&typeof parsed==='string') currentItem.activityId=actMap[parsed]||parsed;
          else if(key==='location'&&typeof parsed==='string') currentItem.locationId=locMap[parsed]||parsed;
          else if(key==='dependsOn'&&currentSection==='projects') currentItem.dependsOnProjectId=projMap[parsed]||null;
          else currentItem[key]=parsed;
        } else if(depth>=6&&currentTask){
          if(key==='dependsOn') currentTask.dependsOnTaskId=taskMap[parsed]||null;
          else currentTask[key]=parsed;
        }
      }
    }
    // Save last items
    if(currentTask) await saveItem('tasks', currentTask);
    if(currentItem) await saveItem(currentSection, currentItem);

    showToast(`Import complete: ${imported} items saved${errors>0?' ('+errors+' errors, see console)':''}`);
    await loadAll();
    renderPage(S.currentPage);
  } catch(e){
    showToast('Import failed: '+e.message);
    console.error('YAML import error:', e);
  }
}
