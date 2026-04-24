package com.lifeos.service;

import com.lifeos.model.*;
import com.lifeos.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements ApplicationRunner {

    private final AreaRepository areaRepo;
    private final ActivityRepository activityRepo;
    private final RoutineRepository routineRepo;
    private final ProjectRepository projectRepo;
    private final TaskRepository taskRepo;
    private final EventRepository eventRepo;
    private final PeriodRepository periodRepo;
    private final BalanceRepository balanceRepo;

    @Override
    public void run(ApplicationArguments args) {
        if (areaRepo.count() > 0) {
            log.info("Database already seeded — skipping.");
            return;
        }
        log.info("Seeding default data…");
        seedAreas();
        seedActivities();
        seedRoutines();
        seedProjects();
        seedTasks();
        seedEvents();
        seedPeriods();
        seedBalance();
        log.info("Seeding complete.");
    }

    private void seedAreas() {
        areaRepo.saveAll(java.util.List.of(
            Area.builder().id("work")   .label("Work & Career")         .color("#c84b2f").icon("◈").build(),
            Area.builder().id("finance").label("Financial & Org.")       .color("#b8760a").icon("◈").build(),
            Area.builder().id("home")   .label("Environment & Home")     .color("#4a7c59").icon("◈").build(),
            Area.builder().id("health") .label("Health & Self-care")     .color("#2f6bc8").icon("◈").build(),
            Area.builder().id("growth") .label("Personal Growth")        .color("#7a4fa3").icon("◈").build(),
            Area.builder().id("social") .label("Social & Relations")     .color("#c87a2f").icon("◈").build(),
            Area.builder().id("culture").label("Intellectual & Cultural").color("#2f8a8a").icon("◈").build(),
            Area.builder().id("leisure").label("Leisure & Emotional")    .color("#8a6040").icon("◈").build()
        ));
    }

    private void seedActivities() {
        activityRepo.saveAll(java.util.List.of(
            Activity.builder().id("a-run")   .label("Running")       .areaId("health") .description("Cardio running sessions").goals("30+ min daily").build(),
            Activity.builder().id("a-weight").label("Weight lifting").areaId("health") .description("Strength training").goals("3x/week").build(),
            Activity.builder().id("a-read")  .label("Reading")       .areaId("culture").description("Books, articles, long reads").goals("30 min/day").build(),
            Activity.builder().id("a-code")  .label("Coding")        .areaId("work")   .description("Development & personal projects").goals("Focus blocks").build(),
            Activity.builder().id("a-social").label("Social")        .areaId("social") .description("Friends, family, relationships").goals("Weekly touch").build(),
            Activity.builder().id("a-learn") .label("Learning")      .areaId("growth") .description("Courses, language, skills").goals("Daily habit").build()
        ));
    }

    private void seedRoutines() {
        routineRepo.saveAll(java.util.List.of(
            Routine.builder().id("r-run")   .label("Morning run")   .activityId("a-run")   .frequency("daily")  .durationMin(40).build(),
            Routine.builder().id("r-weight").label("Weight session").activityId("a-weight").frequency("3x-week").durationMin(60).build(),
            Routine.builder().id("r-read")  .label("Reading block") .activityId("a-read")  .frequency("daily")  .durationMin(30).build(),
            Routine.builder().id("r-duo")   .label("Duolingo")      .activityId("a-learn") .frequency("daily")  .durationMin(15).build()
        ));
    }

    private void seedProjects() {
        projectRepo.save(Project.builder()
            .id("p-claude").label("claude by boris").areaId("work")
            .description("Build an AI-powered personal project").goals("Working MVP")
            .deadline("2025-03-31").status("doing").build());
    }

    private void seedTasks() {
        taskRepo.saveAll(java.util.List.of(
            Task.builder().id("t-olx")  .label("OLX prep")       .projectId("p-claude").areaId("work")   .activityId("a-code").description("Prepare OLX listing").deadline("2025-02-28").estimatedMin(90) .priority("p1").status("todo").build(),
            Task.builder().id("t-puppet").label("Puppeteer setup").projectId("p-claude").areaId("work")   .activityId("a-code").description("Set up puppeteer scraping").estimatedMin(120).priority("p2").status("todo").build(),
            Task.builder().id("t-irs")  .label("IRS declaration").areaId("finance").description("Submit IRS tax declaration").deadline("2025-04-30").estimatedMin(180).priority("p1").status("todo").build(),
            Task.builder().id("t-cgd1") .label("CGD dep prazo")  .areaId("finance").description("Set up CGD term deposit").estimatedMin(30).priority("p1").status("todo").build(),
            Task.builder().id("t-cgd2") .label("CGD cancel TRD") .areaId("finance").description("Cancel TRD").estimatedMin(20).priority("p1").status("todo").build()
        ));
    }

    private void seedEvents() {
        eventRepo.save(Event.builder()
            .id("e-goncalo").label("Gonçalo almoço 6ª").areaId("social")
            .description("Friday lunch with Gonçalo").frequency("weekly")
            .dayOfWeek(5).durationMin(90).build());
    }

    private void seedPeriods() {
        periodRepo.saveAll(java.util.List.of(
            Period.builder().id("per-workday").label("Work Day") .availableHours(16.0).dayTypes("mon,tue,wed,thu,fri").build(),
            Period.builder().id("per-weekend").label("Weekend")  .availableHours(14.0).dayTypes("sat,sun").build(),
            Period.builder().id("per-holiday").label("Holiday")  .availableHours(16.0).dayTypes("").build(),
            Period.builder().id("per-vacation").label("Vacation").availableHours(16.0).dayTypes("").build()
        ));
    }

    private void seedBalance() {
        var rows = new java.util.ArrayList<Balance>();
        // workday
        addBal(rows, "per-workday", "work",    50);
        addBal(rows, "per-workday", "health",  15);
        addBal(rows, "per-workday", "culture", 10);
        addBal(rows, "per-workday", "growth",  10);
        addBal(rows, "per-workday", "social",   5);
        addBal(rows, "per-workday", "finance",  5);
        addBal(rows, "per-workday", "home",     3);
        addBal(rows, "per-workday", "leisure",  2);
        // weekend
        addBal(rows, "per-weekend", "work",    10);
        addBal(rows, "per-weekend", "health",  25);
        addBal(rows, "per-weekend", "culture", 20);
        addBal(rows, "per-weekend", "growth",  15);
        addBal(rows, "per-weekend", "social",  15);
        addBal(rows, "per-weekend", "finance",  5);
        addBal(rows, "per-weekend", "home",     7);
        addBal(rows, "per-weekend", "leisure",  3);
        balanceRepo.saveAll(rows);
    }

    private void addBal(java.util.List<Balance> list, String periodId, String areaId, int pct) {
        list.add(Balance.builder().id("b-" + periodId + "-" + areaId)
            .periodId(periodId).areaId(areaId).weightPct(pct).build());
    }
}
