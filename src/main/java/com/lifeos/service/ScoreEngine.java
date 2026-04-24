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
public class ScoreEngine {

    private final AreaRepository     areaRepo;
    private final BalanceRepository  balanceRepo;
    private final PeriodRepository   periodRepo;
    private final RoutineRepository  routineRepo;
    private final ActivityRepository activityRepo;
    private final TaskRepository     taskRepo;
    private final EventRepository    eventRepo;
    private final ActionRepository   actionRepo;

    public DayScore computeDay(String isoDate) {
        List<Action> actions = actionRepo.findByDateOrderByCreatedAtAsc(isoDate);
        if (actions.isEmpty()) return DayScore.empty(isoDate);

        Period period   = periodForDate(isoDate);
        Map<String, Integer> weights = balanceWeights(period.getId());
        double availMin = (period.getAvailableHours() != null ? period.getAvailableHours() : 16.0) * 60;

        Map<String, Integer> areaMinutes = new HashMap<>();
        Map<String, Double>  areaPerfSum = new HashMap<>();
        Map<String, Integer> areaPerfCnt = new HashMap<>();

        for (Action a : actions) {
            String areaId = resolveArea(a);
            if (areaId == null) continue;
            areaMinutes.merge(areaId, a.getDurationMin() != null ? a.getDurationMin() : 0, Integer::sum);
            if (a.getPerformance() != null) {
                areaPerfSum.merge(areaId, a.getPerformance(), Double::sum);
                areaPerfCnt.merge(areaId, 1, Integer::sum);
            }
        }

        Map<String, AreaScore> areaScores = new LinkedHashMap<>();
        double weightedTotal = 0, weightSum = 0;

        for (Area area : areaRepo.findAll()) {
            int wPct      = weights.getOrDefault(area.getId(), 0);
            int actualMin = areaMinutes.getOrDefault(area.getId(), 0);
            if (wPct == 0) {
                areaScores.put(area.getId(), new AreaScore(area.getId(), null, 0, actualMin, null));
                continue;
            }
            double targetMin = (wPct / 100.0) * availMin;
            double balScore  = Math.min(1.0, actualMin / targetMin);
            int    cnt       = areaPerfCnt.getOrDefault(area.getId(), 0);
            double avgPerf   = cnt > 0 ? areaPerfSum.get(area.getId()) / cnt : 5.0;
            double combined  = balScore * 0.6 + (avgPerf / 10.0) * 0.4;
            int    score     = (int) Math.round(combined * 100);
            areaScores.put(area.getId(), new AreaScore(area.getId(), score, (int) targetMin, actualMin,
                    Math.round(avgPerf * 10.0) / 10.0));
            weightedTotal += combined * wPct;
            weightSum     += wPct;
        }

        int overall  = weightSum > 0 ? (int) Math.round(weightedTotal / weightSum) : 0;
        int totalMin = actions.stream().mapToInt(a -> a.getDurationMin() != null ? a.getDurationMin() : 0).sum();
        return new DayScore(isoDate, overall, areaScores, totalMin, actions.size(), period.getLabel());
    }

    public Period periodForDate(String isoDate) {
        String dow = LocalDate.parse(isoDate).getDayOfWeek().name().substring(0, 3).toLowerCase();
        return periodRepo.findAll().stream()
                .filter(p -> p.getDayTypes() != null && Arrays.asList(p.getDayTypes().split(",")).contains(dow))
                .findFirst()
                .orElseGet(() -> periodRepo.findAll().stream().findFirst().orElse(fallbackPeriod()));
    }

    private Map<String, Integer> balanceWeights(String periodId) {
        return balanceRepo.findAll().stream()
                .filter(b -> periodId.equals(b.getPeriodId()))
                .collect(Collectors.toMap(Balance::getAreaId, b -> b.getWeightPct() != null ? b.getWeightPct() : 0));
    }

    public String resolveArea(Action a) {
        if (a.getAreaId()    != null && !a.getAreaId().isBlank())    return a.getAreaId();
        if (a.getTaskId()    != null) return taskRepo.findById(a.getTaskId()).map(Task::getAreaId).orElse(null);
        if (a.getRoutineId() != null) return routineRepo.findById(a.getRoutineId())
                .map(Routine::getActivityId).flatMap(activityRepo::findById).map(Activity::getAreaId).orElse(null);
        if (a.getEventId()   != null) return eventRepo.findById(a.getEventId()).map(Event::getAreaId).orElse(null);
        if (a.getActivityId()!= null) return activityRepo.findById(a.getActivityId()).map(Activity::getAreaId).orElse(null);
        return null;
    }

    private Period fallbackPeriod() {
        Period p = new Period(); p.setId("_default"); p.setLabel("Default");
        p.setAvailableHours(16.0); p.setDayTypes(""); return p;
    }

    public record DayScore(String date, Integer score, Map<String, AreaScore> areaScores,
                           int totalMin, int actionCount, String periodLabel) {
        static DayScore empty(String date) { return new DayScore(date, null, Map.of(), 0, 0, ""); }
    }

    public record AreaScore(String areaId, Integer score, int targetMin, int actualMin, Double avgPerf) {}
}
