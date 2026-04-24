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

    /** daily | 2x-week | 3x-week | weekly | monthly */
    private String frequency;

    private Integer durationMin;

    /** JSON array: [{url, desc}] */
    @Column(columnDefinition = "TEXT")
    private String resources;
}
