package com.lifeos.controller;

import com.lifeos.model.*;
import com.lifeos.repository.*;
import com.lifeos.service.AgendaService;
import com.lifeos.service.ScoreEngine;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

// ════════════════════════════════════════════════════════
//  AREA
// ════════════════════════════════════════════════════════
@RestController @RequestMapping("/api/areas") @RequiredArgsConstructor
class AreaController {
    private final AreaRepository repo;
    @GetMapping         public List<Area>               getAll()                    { return repo.findAll(); }
    @GetMapping("/{id}") public ResponseEntity<Area>    getOne(@PathVariable String id) { return repo.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build()); }
    @PutMapping("/{id}") public Area                    save  (@PathVariable String id, @RequestBody Area body) { body.setId(id); return repo.save(body); }
    @DeleteMapping("/{id}") public ResponseEntity<Void> delete(@PathVariable String id) { repo.deleteById(id); return ResponseEntity.noContent().build(); }
}

// ════════════════════════════════════════════════════════
//  ACTIVITY
// ════════════════════════════════════════════════════════
@RestController @RequestMapping("/api/activities") @RequiredArgsConstructor
class ActivityController {
    private final ActivityRepository repo;
    @GetMapping             public List<Activity>              getAll()                         { return repo.findAll(); }
    @GetMapping("/{id}")    public ResponseEntity<Activity>    getOne(@PathVariable String id)  { return repo.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build()); }
    @PutMapping("/{id}")    public Activity                    save  (@PathVariable String id, @RequestBody Activity body) { body.setId(id); return repo.save(body); }
    @DeleteMapping("/{id}") public ResponseEntity<Void>        delete(@PathVariable String id)  { repo.deleteById(id); return ResponseEntity.noContent().build(); }
}

// ════════════════════════════════════════════════════════
//  PROJECT
// ════════════════════════════════════════════════════════
@RestController @RequestMapping("/api/projects") @RequiredArgsConstructor
class ProjectController {
    private final ProjectRepository repo;
    @GetMapping             public List<Project>              getAll()                          { return repo.findAll(); }
    @GetMapping("/{id}")    public ResponseEntity<Project>    getOne(@PathVariable String id)   { return repo.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build()); }
    @PutMapping("/{id}")    public Project                    save  (@PathVariable String id, @RequestBody Project body) { body.setId(id); return repo.save(body); }
    @DeleteMapping("/{id}") public ResponseEntity<Void>       delete(@PathVariable String id)   { repo.deleteById(id); return ResponseEntity.noContent().build(); }
}

// ════════════════════════════════════════════════════════
//  TASK
// ════════════════════════════════════════════════════════
@RestController @RequestMapping("/api/tasks") @RequiredArgsConstructor
class TaskController {
    private final TaskRepository repo;
    @GetMapping             public List<Task>              getAll()                          { return repo.findAll(); }
    @GetMapping("/{id}")    public ResponseEntity<Task>    getOne(@PathVariable String id)   { return repo.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build()); }
    @PutMapping("/{id}")    public Task                    save  (@PathVariable String id, @RequestBody Task body) { body.setId(id); return repo.save(body); }
    @DeleteMapping("/{id}") public ResponseEntity<Void>    delete(@PathVariable String id)   { repo.deleteById(id); return ResponseEntity.noContent().build(); }
}

// ════════════════════════════════════════════════════════
//  ROUTINE
// ════════════════════════════════════════════════════════
@RestController @RequestMapping("/api/routines") @RequiredArgsConstructor
class RoutineController {
    private final RoutineRepository repo;
    @GetMapping             public List<Routine>              getAll()                            { return repo.findAll(); }
    @GetMapping("/{id}")    public ResponseEntity<Routine>    getOne(@PathVariable String id)     { return repo.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build()); }
    @PutMapping("/{id}")    public Routine                    save  (@PathVariable String id, @RequestBody Routine body) { body.setId(id); return repo.save(body); }
    @DeleteMapping("/{id}") public ResponseEntity<Void>       delete(@PathVariable String id)     { repo.deleteById(id); return ResponseEntity.noContent().build(); }
}

// ════════════════════════════════════════════════════════
//  EVENT
// ════════════════════════════════════════════════════════
@RestController @RequestMapping("/api/events") @RequiredArgsConstructor
class EventController {
    private final EventRepository repo;
    @GetMapping             public List<Event>              getAll()                           { return repo.findAll(); }
    @GetMapping("/{id}")    public ResponseEntity<Event>    getOne(@PathVariable String id)    { return repo.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build()); }
    @PutMapping("/{id}")    public Event                    save  (@PathVariable String id, @RequestBody Event body) { body.setId(id); return repo.save(body); }
    @DeleteMapping("/{id}") public ResponseEntity<Void>     delete(@PathVariable String id)    { repo.deleteById(id); return ResponseEntity.noContent().build(); }
}

// ════════════════════════════════════════════════════════
//  PERIOD
// ════════════════════════════════════════════════════════
@RestController @RequestMapping("/api/periods") @RequiredArgsConstructor
class PeriodController {
    private final PeriodRepository repo;
    @GetMapping             public List<Period>              getAll()                            { return repo.findAll(); }
    @GetMapping("/{id}")    public ResponseEntity<Period>    getOne(@PathVariable String id)     { return repo.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build()); }
    @PutMapping("/{id}")    public Period                    save  (@PathVariable String id, @RequestBody Period body) { body.setId(id); return repo.save(body); }
    @DeleteMapping("/{id}") public ResponseEntity<Void>      delete(@PathVariable String id)    { repo.deleteById(id); return ResponseEntity.noContent().build(); }
}

// ════════════════════════════════════════════════════════
//  BALANCE
// ════════════════════════════════════════════════════════
@RestController @RequestMapping("/api/balance") @RequiredArgsConstructor
class BalanceController {
    private final BalanceRepository repo;
    @GetMapping             public List<Balance>              getAll()                             { return repo.findAll(); }
    @PutMapping("/{id}")    public Balance                    save  (@PathVariable String id, @RequestBody Balance body) { body.setId(id); return repo.save(body); }
    @DeleteMapping("/{id}") public ResponseEntity<Void>       delete(@PathVariable String id)      { repo.deleteById(id); return ResponseEntity.noContent().build(); }
}

// ════════════════════════════════════════════════════════
//  ACTION  (history log)
// ════════════════════════════════════════════════════════
@RestController @RequestMapping("/api/actions") @RequiredArgsConstructor
class ActionController {
    private final ActionRepository repo;

    @GetMapping
    public List<Action> getAll(@RequestParam(required = false) String date,
                               @RequestParam(required = false) String from,
                               @RequestParam(required = false) String to) {
        if (date != null) return repo.findByDateOrderByCreatedAtAsc(date);
        if (from != null && to != null) return repo.findByDateBetweenOrderByDateAscCreatedAtAsc(from, to);
        return repo.findAll();
    }

    @GetMapping("/dates")
    public List<String> getDates() { return repo.findDistinctDates(); }

    @PutMapping("/{id}")
    public Action save(@PathVariable String id, @RequestBody Action body) {
        body.setId(id);
        if (body.getCreatedAt() == null) body.setCreatedAt(System.currentTimeMillis());
        return repo.save(body);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}

// ════════════════════════════════════════════════════════
//  SCORE
// ════════════════════════════════════════════════════════
@RestController @RequestMapping("/api/score") @RequiredArgsConstructor
class ScoreController {
    private final ScoreEngine engine;

    @GetMapping("/day/{date}")
    public ScoreEngine.DayScore dayScore(@PathVariable String date) {
        return engine.computeDay(date);
    }

    @GetMapping("/range")
    public List<ScoreEngine.DayScore> range(@RequestParam String from, @RequestParam String to) {
        var dates = new java.util.ArrayList<ScoreEngine.DayScore>();
        var d = java.time.LocalDate.parse(from);
        var end = java.time.LocalDate.parse(to);
        while (!d.isAfter(end)) {
            dates.add(engine.computeDay(d.toString()));
            d = d.plusDays(1);
        }
        return dates;
    }
}

// ════════════════════════════════════════════════════════
//  AGENDA
// ════════════════════════════════════════════════════════
@RestController @RequestMapping("/api/agenda") @RequiredArgsConstructor
class AgendaController {
    private final AgendaService service;

    @GetMapping("/suggest/{date}")
    public List<AgendaService.AgendaSuggestion> suggest(@PathVariable String date) {
        return service.suggest(date);
    }
}
