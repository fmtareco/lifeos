package com.lifeos.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Entity
@Table(name = "activities")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Activity {

    @Id
    @Column(length = 64)
    private String id;

    @NotBlank
    private String label;

    @Column(length = 64)
    private String areaId;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String goals;

    /** Numeric goal target */
    private Integer goalsNum;

    /** Period for goal: day | week | month | quarter | year */
    private String goalsPeriod;

    /** Location IDs (comma-separated) */
    @Column(columnDefinition = "TEXT")
    private String locationIds;
}
