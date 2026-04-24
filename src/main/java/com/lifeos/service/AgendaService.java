package com.lifeos.service;

import com.lifeos.model.*;
import com.lifeos.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AgendaService {

    private final RoutineRepository routineRepo;
    private final EventRepository eventRepo;
    private final TaskRepository taskRepo;
    private final ActionRepository actionRepo;
    private final ActivityRepository activityRepo;

    public List<AgendaSuggestion> suggest(String isoDate) {
        LocalDate date = LocalDate.parse(isoDate);
        int dow = date.getDayOfWeek().getValue() % 7; // 0=Sun,1=Mon…6=Sat

        // IDs already logged today
        Set<String> logged = actionRepo.findByDateOrderByCreatedAtAsc(isoDate).stream()
                .flatMap(a -> {
                    List<String> ids = new ArrayList<>();
                    if (a.getRoutineId() != null) ids.add(a.getRoutineId());
                    if (a.getTaskId()    != null) ids.add(a.getTaskId());
                    if (a.getEventId()  != null) ids.add(a.getEventId());
                    return ids.stream();
                })
                .collect(Collectors.toSet());

        List<AgendaSuggestion> suggestions = new ArrayList<>();

        // 1. Routines
        for (Routine r : routineRepo.findAll()) {
            if (logged.contains(r.getId())) continue;
            if (isDueToday(r.getFrequency(), dow)) {
                String areaId = resolveAreaFromRoutine(r);
                suggestions.add(new AgendaSuggestion("routine", r.getId(), r.getLabel(),
                        r.getDurationMin(), areaId, 2, null));
            }
        }

        // 2. Events
        for (Event ev : eventRepo.findAll()) {
            if (logged.contains(ev.getId())) continue;
            boolean due = false;
            if ("weekly".equals(ev.getFrequency())  && ev.getDayOfWeek()  != null && ev.getDayOfWeek() == dow) due = true;
            if ("monthly".equals(ev.getFrequency()) && ev.getDayOfMonth() != null && ev.getDayOfMonth() == date.getDayOfMonth()) due = true;
            if ("once".equals(ev.getFrequency())    && isoDate.equals(ev.getDate())) due = true;
            if ("yearly".equals(ev.getFrequency())  && ev.getDate() != null && ev.getDate().substring(5).equals(isoDate.substring(5))) due = true;
            if (due) suggestions.add(new AgendaSuggestion("event", ev.getId(), ev.getLabel(),
                    ev.getDurationMin() != null ? ev.getDurationMin() : 60, ev.getAreaId(), 1, null));
        }

        // 3. Tasks with deadline ≤ 7 days
        for (Task t : taskRepo.findAll()) {
            if (logged.contains(t.getId()) || "done".equals(t.getStatus())) continue;
            if (t.getDeadline() == null || t.getDeadline().isBlank()) continue;
            long daysLeft = LocalDate.parse(t.getDeadline()).toEpochDay() - date.toEpochDay();
            if (daysLeft <= 7) {
                int prio = "p1".equals(t.getPriority()) ? 0 : "p2".equals(t.getPriority()) ? 1 : 2;
                suggestions.add(new AgendaSuggestion("task", t.getId(), t.getLabel(),
                        t.getEstimatedMin() != null ? t.getEstimatedMin() : 60,
                        t.getAreaId(), prio, daysLeft));
            }
        }

        suggestions.sort(Comparator.comparingInt(AgendaSuggestion::priority));
        return suggestions;
    }

    private boolean isDueToday(String frequency, int dow) {
        if (frequency == null) return false;
        return switch (frequency) {
            case "daily"   -> true;
            case "3x-week" -> dow == 1 || dow == 3 || dow == 5;  // Mon,Wed,Fri
            case "2x-week" -> dow == 2 || dow == 4;              // Tue,Thu
            case "weekly"  -> dow == 1;                          // Monday
            default        -> false;
        };
    }

    private String resolveAreaFromRoutine(Routine r) {
        if (r.getActivityId() == null) return null;
        return activityRepo.findById(r.getActivityId()).map(Activity::getAreaId).orElse(null);
    }

    public record AgendaSuggestion(
        String type,        // routine | task | event
        String id,
        String label,
        int durationMin,
        String areaId,
        int priority,       // 0=urgent, 1=event, 2=routine
        Long daysLeft       // null for routines/events
    ) {}
}
