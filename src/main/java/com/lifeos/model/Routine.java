package com.lifeos.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Entity
@Table(name = "routines")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Routine {

    @Id
    @Column(length = 64)
    private String id;

    @NotBlank
    private String label;

    @Column(length = 64)
    private String activityId;

    @Column(columnDefinition = "TEXT")
    private String description;

    /** Legacy: e.g. "3x-week" */
    private String frequency;

    /** Numeric frequency value */
    private Integer freqNum;

    /** Frequency period: day | week | month */
    private String freqPeriod;

    private Integer durationMin;

    /** Optional: trigger on this event instead of fixed frequency */
    @Column(length = 64)
    private String eventId;

    /** Comma-separated period IDs where this routine applies */
    @Column(columnDefinition = "TEXT")
    private String applicablePeriods;

    /** Location IDs (comma-separated) */
    @Column(columnDefinition = "TEXT")
    private String locationIds;

    @Column(columnDefinition = "TEXT")
    private String resources;
}
