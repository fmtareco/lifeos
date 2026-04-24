package com.lifeos.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Entity
@Table(name = "actions",
       indexes = @Index(name = "idx_action_date", columnList = "date"))
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Action {

    @Id
    @Column(length = 64)
    private String id;

    /** ISO date yyyy-MM-dd */
    @NotBlank
    private String date;

    /** Human-readable label (what was done) */
    private String label;

    // ── References (at most one of these is set) ──────────
    @Column(length = 64)
    private String routineId;

    @Column(length = 64)
    private String taskId;

    @Column(length = 64)
    private String eventId;

    /** Direct area override (optional) */
    @Column(length = 64)
    private String areaId;

    /** Direct activity tag (optional) */
    @Column(length = 64)
    private String activityId;

    // ── Metrics ───────────────────────────────────────────
    private Integer durationMin;

    /** 1–10 */
    private Double performance;

    @Column(columnDefinition = "TEXT")
    private String notes;

    /** JSON array: [{url, desc}] */
    @Column(columnDefinition = "TEXT")
    private String resources;

    /** HH:mm display string set at log time */
    private String loggedAt;

    private Long createdAt;

    @Builder.Default
    private Boolean skipped = false;
}
