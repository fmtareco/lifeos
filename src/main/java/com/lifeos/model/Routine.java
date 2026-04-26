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

    /** Primary location for this routine */
    @Column(length = 64)
    private String locationId;

    /** Optional scheduling hints */
    private Integer dayOfWeek;   // 0=Sun for weekly routines
    private Integer dayOfMonth;  // 1-31 for monthly routines
    private Integer yearMonth;   // 1-12 for yearly routines
    private Integer yearDay;     // 1-31 for yearly routines

    @Column(columnDefinition = "TEXT")
    private String resources;
}
