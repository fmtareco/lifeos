//  EXPORT MD
// ════════════════════════════════════════════════════════
function exportMD(){
  let md = '# lifeOS — ' + S.todayDate + '\n\n';

  // ── Configuration ──────────────────────────────────────
  md += '## Configuration\n\n';

  // Locations
  if(S.locations.length){
    md += '### Locations\n\n';
    S.locations.forEach(l => {
      md += '- **' + l.label + '**' + (l.type?' ('+l.type+')':'') + (l.address?' · '+l.address:'') + (l.description?' — '+l.description:'') + '\n';
    });
    md += '\n';
  }

  // Periods
  if(S.periods.length){
    md += '### Periods\n\n';
    S.periods.forEach(p => {
      const daysStr = p.dayTypes ? p.dayTypes.split(',').filter(Boolean).join(', ') : 'manual';
      md += '- **' + p.label + '** · ' + p.availableHours + 'h/day · days: ' + (daysStr||'(none)') + (p.description?' — '+p.description:'') + '\n';
    });
    md += '\n';
  }

  // Areas → Activities → Projects/Tasks/Routines
  S.areas.forEach(a => {
    md += '### ' + a.label + '\n\n';
    const acts = S.activities.filter(x => x.areaId === a.id);
    if(acts.length){
      acts.forEach(ac => {
        const freq = ac.goalsNum && ac.goalsPeriod ? ac.goalsNum + 'x/' + ac.goalsPeriod : (ac.goals||'');
        const acLocs = (ac.locationIds||'').split(',').filter(Boolean).map(id=>byId(S.locations,id)?.label).filter(Boolean).join(', ');
        md += '#### Activity: ' + ac.label + (freq?' [goal: '+freq+']':'') + '\n';
        if(ac.description) md += ac.description + '\n';
        if(acLocs) md += 'Locations: ' + acLocs + '\n';
        md += '\n';

        // Projects
        S.projects.filter(p => p.activityId === ac.id).forEach(p => {
          const pLocs = (p.locationIds||'').split(',').filter(Boolean).map(id=>byId(S.locations,id)?.label).filter(Boolean).join(', ');
          md += '##### Project: ' + p.label + ' [' + (p.status||'todo') + ']' + (p.deadline?' · due '+p.deadline:'') + '\n';
          if(p.description) md += p.description + '\n';
          if(p.goals) md += 'Goals: ' + p.goals + '\n';
          if(pLocs) md += 'Locations: ' + pLocs + '\n';
          if(p.dependsOnProjectId){ const dep=byId(S.projects,p.dependsOnProjectId); if(dep) md+='Depends on: '+dep.label+'\n'; }
          // Tasks
          S.tasks.filter(t => t.projectId === p.id).forEach(t => {
            const status = t.status==='done'?'[x]':'[ ]';
            md += '- '+status+' **'+t.label+'**'+(t.priority?' ['+t.priority+']':'')+(t.deadline?' · due '+t.deadline:'')+(t.estimatedMin?' · ~'+t.estimatedMin+'min':'')+'\n';
            if(t.description) md += '  '+t.description+'\n';
            if(t.dependsOnTaskId){ const dep=byId(S.tasks,t.dependsOnTaskId); if(dep) md+='  🔒 depends on: '+dep.label+'\n'; }
            if(t.activationDate) md+='  active from: '+t.activationDate+'\n';
          });
          md += '\n';
        });

        // Routines
        S.routines.filter(r => r.activityId === ac.id).forEach(r => {
          const rLoc = r.locationId?byId(S.locations,r.locationId)?.label:'';
          const rPer = (r.applicablePeriods||'').split(',').filter(Boolean).map(id=>byId(S.periods,id)?.label).filter(Boolean).join(', ');
          md += '- Routine: **'+r.label+'**'+(r.freqNum&&r.freqPeriod?' · '+r.freqNum+'x/'+r.freqPeriod:'')+(r.durationMin?' · '+r.durationMin+'min':'')+(rLoc?' @ '+rLoc:'')+(rPer?' · periods: '+rPer:'')+'\n';
          if(r.description) md += '  '+r.description+'\n';
        });
      });
    }
    // Tasks not linked to a project (area-level tasks)
    const looseTasks = S.tasks.filter(t=>t.areaId===a.id&&!t.projectId);
    if(looseTasks.length){
      md += '#### Loose tasks\n';
      looseTasks.forEach(t=>{
        md += '- ['+(t.status==='done'?'x':' ')+'] '+t.label+(t.deadline?' · due '+t.deadline:'')+'\n';
      });
      md += '\n';
    }
    // Events
    S.events.filter(ev=>ev.areaId===a.id).forEach(ev=>{
      const freqStr=ev.frequency==='weekly'?'weekly ('+['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][ev.dayOfWeek]+')':ev.frequency==='once'?'once ('+ev.date+')':ev.frequency||'';
      md += '- Event: **'+ev.label+'** · '+freqStr+(ev.durationMin?' · '+ev.durationMin+'min':'')+'\n';
    });
    md += '\n';
  });

  // ── Balance ────────────────────────────────────────────
  md += '## Balance Weights\n\n';
  S.periods.forEach(per => {
    md += '### ' + per.label + ' (' + per.availableHours + 'h)\n';
    const weights = S.balance.filter(b => b.periodId === per.id);
    weights.sort((a,b) => b.weightPct - a.weightPct).forEach(b => {
      const area = areaOf(b.areaId);
      if(area && b.weightPct > 0) md += '- ' + area.label + ': ' + b.weightPct + '% (' + Math.round(b.weightPct/100*per.availableHours*60) + ' min)\n';
    });
    md += '\n';
  });

  // ── Today's agenda ─────────────────────────────────────
  const suggestions = generateAgendaSuggestions();
  if(suggestions.length){
    md += '## Agenda — ' + S.todayDate + '\n\n';
    suggestions.forEach(s => {
      const area = areaOf(s.areaId);
      const dl = s.daysLeft !== undefined ? ' · ' + (s.daysLeft < 0 ? Math.abs(s.daysLeft) + 'd overdue' : s.daysLeft + 'd left') : '';
      md += '- [ ] ' + s.label + ' (' + s.type + ')' + (area ? ' · ' + area.label : '') + dl + '\n';
    });
    md += '\n';
  }

  // ── History log ────────────────────────────────────────
  md += '## History Log\n\n';
  const datesWithActions = [...new Set(S.actions.map(a => a.date))].sort().reverse();
  datesWithActions.forEach(d => {
    const acts = S.actions.filter(a => a.date === d);
    const result = computeDayScore(d);
    md += '### ' + d + '  (score: ' + (result.score !== null ? result.score : '—') + ')\n\n';
    acts.forEach(a => {
      const name = a.label || resolveActionLabel(a);
      const dur  = a.durationMin ? ' · ' + fmtMin(a.durationMin) : '';
      const perf = a.performance ? ' · perf: ' + a.performance + '/10' : '';
      const notes = a.notes ? '\n  > ' + a.notes : '';
      md += '- [' + (a.skipped ? 'skipped' : 'x') + '] ' + name + dur + perf + notes + '\n';
    });
    md += '\n';
  });

  const blob = new Blob([md], {type:'text/markdown'});
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'lifeos-' + S.todayDate + '.md';
  link.click();
  URL.revokeObjectURL(link.href);
  showToast('Exported lifeos.md');
}

// ════════════════════════════════════════════════════════
//  EXPORT XLSX  (SheetJS)
// ════════════════════════════════════════════════════════
function exportXLSX(){
  if(typeof XLSX === 'undefined'){ showToast('SheetJS not loaded yet — try again in a moment'); return; }
  // Safe resource parser helper
  function safeRes(raw){ try{ const r=typeof raw==='string'?JSON.parse(raw||'[]'):(Array.isArray(raw)?raw:[]); return r.map(x=>x.url+(x.desc?' — '+x.desc:'')).join(' | '); }catch(e){return '';} }

  const wb = XLSX.utils.book_new();

  // ── palette helpers ──────────────────────────────────
  const DARK  = { fgColor:{ rgb:'0F0E0C' } };
  const HDR_FILL = { fgColor:{ rgb:'1E1B17' } };
  const ACC   = { fgColor:{ rgb:'C8873A' } };
  const RED   = { fgColor:{ rgb:'C84B2F' } };
  const AMB   = { fgColor:{ rgb:'D4872A' } };
  const GRN   = { fgColor:{ rgb:'7A9E7E' } };

  function hdrStyle(rgb){ return { font:{bold:true,color:{rgb:'E8E0D0'}}, fill:{patternType:'solid',fgColor:{rgb:rgb||'252118'}}, alignment:{horizontal:'center',vertical:'center'}, border:{bottom:{style:'thin',color:{rgb:'3A342A'}}} }; }
  function cellStyle(bold){ return { font:{bold:!!bold,color:{rgb:'E8E0D0'}}, fill:{patternType:'solid',fgColor:{rgb:'1A1714'}}, border:{bottom:{style:'thin',color:{rgb:'2E2A22'}} } }; }
  function scoreStyle(score){
    const rgb = score>=75?'7A9E7E':score>=45?'C8963A':'C84B2F';
    return { font:{bold:true,italic:true,color:{rgb}}, fill:{patternType:'solid',fgColor:{rgb:'1A1714'}} };
  }
  function setColWidths(ws, widths){ ws['!cols'] = widths.map(w=>({wch:w})); }

  // ── Sheet 1: History Log ─────────────────────────────
  {
    const rows = [];
    rows.push(['Date','Day Score','Action','Type','Area','Activity','Duration (min)','Performance','Notes','Resources']);

    const dates = [...new Set(S.actions.map(a=>a.date))].sort().reverse();
    dates.forEach(d => {
      const acts = S.actions.filter(a=>a.date===d).sort((a,b)=>a.createdAt-b.createdAt);
      const result = computeDayScore(d);
      acts.forEach(a => {
        const areaId  = resolveAreaFromAction(a);
        const area    = areaOf(areaId);
        const type    = a.routineId?'routine':a.taskId?'task':a.eventId?'event':'free';
        const activityId = a.routineId ? byId(S.routines,a.routineId)?.activityId : a.activityId;
        const activity = activityOf(activityId);
        const resources = safeRes(a.resources);
        rows.push([
          d,
          result.score!==null ? result.score : '',
          a.label || resolveActionLabel(a),
          type,
          area?.label || '',
          activity?.label || '',
          a.durationMin || '',
          a.performance || '',
          a.notes || '',
          resources
        ]);
      });
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    // style header row
    const hdrCols = ['A','B','C','D','E','F','G','H','I','J'];
    hdrCols.forEach(c => {
      const cell = ws[c+'1'];
      if(cell) cell.s = hdrStyle('252118');
    });
    // style score cells
    for(let r=2; r<=rows.length; r++){
      const cell = ws['B'+r];
      if(cell && cell.v !== '') cell.s = scoreStyle(cell.v);
    }
    setColWidths(ws, [12,10,36,10,20,18,14,12,30,40]);
    ws['!freeze'] = {xSplit:0, ySplit:1};
    XLSX.utils.book_append_sheet(wb, ws, 'History Log');
  }

  // ── Sheet 2: Daily Scores Summary ───────────────────
  {
    const rows = [];
    rows.push(['Date','Weekday','Period','Score','Grade','Total Min','Actions','Work %','Finance %','Home %','Health %','Growth %','Social %','Culture %','Leisure %']);

    const dates = [...new Set(S.actions.map(a=>a.date))].sort().reverse();
    dates.forEach(d => {
      const result  = computeDayScore(d);
      const period  = getPeriodForDate(d);
      const dn      = new Date(d+'T12:00:00');
      const weekday = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][dn.getDay()];
      const asPct   = a => result.areaScores[a]?.score ?? '';
      rows.push([
        d, weekday, period.label,
        result.score!==null ? result.score : '',
        result.score!==null ? scoreLetter(result.score) : '',
        result.totalMin || 0,
        S.actions.filter(a=>a.date===d).length,
        asPct('work'), asPct('finance'), asPct('home'), asPct('health'),
        asPct('growth'), asPct('social'), asPct('culture'), asPct('leisure')
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    setColWidths(ws, [12,11,14,8,7,10,9,8,9,8,9,8,8,9,8]);
    ws['!freeze'] = {xSplit:0, ySplit:1};
    XLSX.utils.book_append_sheet(wb, ws, 'Daily Scores');
  }

  // ── Sheet 3: Tasks ───────────────────────────────────
  {
    const rows = [];
    rows.push(['ID','Label','Description','Area','Project','Priority','Status','Deadline','Est. Min','Resources']);
    S.tasks.forEach(t => {
      const area = areaOf(t.areaId);
      const proj = byId(S.projects, t.projectId);
      const resources = safeRes(t.resources);
      rows.push([
        t.id, t.label, t.description||'',
        area?.label||'', proj?.label||'',
        t.priority?{p1:'Urgent',p2:'Important',p3:'Someday'}[t.priority]:'',
        t.status||'todo', t.deadline||'',
        t.estimatedMin||'', resources
      ]);
    });
    const ws = XLSX.utils.aoa_to_sheet(rows);
    setColWidths(ws, [16,30,40,18,22,12,10,12,9,40]);
    ws['!freeze'] = {xSplit:0, ySplit:1};
    XLSX.utils.book_append_sheet(wb, ws, 'Tasks');
  }

  // ── Sheet 4: Projects ────────────────────────────────
  {
    const rows = [];
    rows.push(['ID','Label','Area','Status','Deadline','Goals','Description']);
    S.projects.forEach(p => {
      const area = areaOf(p.areaId);
      rows.push([p.id, p.label, area?.label||'', p.status||'', p.deadline||'', p.goals||'', p.description||'']);
    });
    const ws = XLSX.utils.aoa_to_sheet(rows);
    setColWidths(ws, [16,28,18,10,12,32,42]);
    ws['!freeze'] = {xSplit:0, ySplit:1};
    XLSX.utils.book_append_sheet(wb, ws, 'Projects');
  }

  // ── Sheet 5: Routines & Events ───────────────────────
  {
    const rows = [];
    rows.push(['Type','ID','Label','Area','Activity','Frequency','Duration (min)','Description','Resources']);
    S.routines.forEach(r => {
      const ac   = activityOf(r.activityId);
      const area = areaOf(ac?.areaId);
      const res  = safeRes(r.resources);
      rows.push(['routine', r.id, r.label, area?.label||'', ac?.label||'', r.frequency||'', r.durationMin||'', r.description||'', res]);
    });
    S.events.forEach(ev => {
      const area = areaOf(ev.areaId);
      const freq = ev.frequency==='weekly'?`weekly (${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][ev.dayOfWeek]||'?'})`:ev.frequency==='once'?`once (${ev.date})`:ev.frequency||'';
      const res  = safeRes(ev.resources);
      rows.push(['event', ev.id, ev.label, area?.label||'', '', freq, ev.durationMin||'', ev.description||'', res]);
    });
    const ws = XLSX.utils.aoa_to_sheet(rows);
    setColWidths(ws, [9,16,28,18,18,18,13,36,40]);
    ws['!freeze'] = {xSplit:0, ySplit:1};
    XLSX.utils.book_append_sheet(wb, ws, 'Routines & Events');
  }

  // ── Sheet 6: Balance Config ──────────────────────────
  {
    const rows = [];
    rows.push(['Period','Available Hours/Day','Area','Weight %','Target Min/Day']);
    S.periods.forEach(per => {
      const weights = S.balance.filter(b=>b.periodId===per.id);
      S.areas.forEach(a => {
        const w = weights.find(b=>b.areaId===a.id);
        const pct = w?.weightPct||0;
        const targetMin = Math.round(pct/100*(per.availableHours||16)*60);
        rows.push([per.label, per.availableHours, a.label, pct, targetMin]);
      });
    });
    const ws = XLSX.utils.aoa_to_sheet(rows);
    setColWidths(ws, [16,18,22,12,14]);
    ws['!freeze'] = {xSplit:0, ySplit:1};
    XLSX.utils.book_append_sheet(wb, ws, 'Balance Config');
  }

  // ── Write & download ─────────────────────────────────
  // ── Sheet 7: Activities Config ───────────────────────
  {
    const rows=[['Area','Activity','Goals','Description']];
    S.areas.forEach(a=>{
      S.activities.filter(x=>x.areaId===a.id).forEach(ac=>{
        const freq=ac.goalsNum&&ac.goalsPeriod?ac.goalsNum+'x/'+ac.goalsPeriod:(ac.goals||'');
        rows.push([a.label,ac.label,freq,ac.description||'']);
      });
    });
    const ws=XLSX.utils.aoa_to_sheet(rows);
    setColWidths(ws,[20,24,14,40]);
    ws['!freeze']={xSplit:0,ySplit:1};
    XLSX.utils.book_append_sheet(wb,ws,'Activities');
  }

  // ── Sheet 8: Today's Agenda ───────────────────────────
  {
    const rows=[['Type','Label','Area','Duration (min)','Deadline','Days Left']];
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
    suggestions.forEach(s=>{
      const area=areaOf(s.areaId);
      rows.push([s.type,s.label,area?.label||'',s.durationMin||'',
        s.daysLeft!==undefined?(new Date(new Date().getTime()+s.daysLeft*86400000).toISOString().slice(0,10)):'',
        s.daysLeft!==undefined?s.daysLeft:''
      ]);
    });
    const ws=XLSX.utils.aoa_to_sheet(rows);
    setColWidths(ws,[10,36,18,14,12,10]);
    ws['!freeze']={xSplit:0,ySplit:1};
    XLSX.utils.book_append_sheet(wb,ws,'Today Agenda');
  }

  // ── Sheet 9: Locations ────────────────────────────────
  {
    const rows=[['ID','Label','Type','Address','Description']];
    S.locations.forEach(l=>rows.push([l.id,l.label,l.type||'',l.address||'',l.description||'']));
    const ws=XLSX.utils.aoa_to_sheet(rows);
    setColWidths(ws,[16,24,12,30,40]);
    XLSX.utils.book_append_sheet(wb,ws,'Locations');
  }

  try {
    XLSX.writeFile(wb, 'lifeos-'+S.todayDate+'.xlsx');
    showToast('↓ Exported lifeos.xlsx');
  } catch(e) {
    showToast('Export error: '+e.message);
    console.error('XLSX export error:', e);
  }
}
