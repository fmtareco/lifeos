package com.lifeos.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Entity
@Table(name = "events")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Event {

    @Id
    @Column(length = 64)
    private String id;

    @NotBlank
    private String label;

    @Column(length = 64)
    private String areaId;

    @Column(columnDefinition = "TEXT")
    private String description;

    /** once | weekly | monthly | yearly */
    private String frequency;

    /** 0=Sun … 6=Sat  (for weekly events) */
    private Integer dayOfWeek;

    /** 1–31 (for monthly events) */
    private Integer dayOfMonth;

    /** yyyy-MM-dd (for once / planned events) */
    private String date;

    private Integer durationMin;

    /** JSON array: [{url, desc}] */
    @Column(columnDefinition = "TEXT")
    private String resources;
}
