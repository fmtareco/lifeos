package com.lifeos.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Entity
@Table(name = "tasks")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Task {

    @Id
    @Column(length = 64)
    private String id;

    @NotBlank
    private String label;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 64)
    private String areaId;

    @Column(length = 64)
    private String projectId;

    @Column(length = 64)
    private String activityId;

    /** p1 = urgent | p2 = important | p3 = someday */
    private String priority;

    /** todo | doing | done */
    @Builder.Default
    private String status = "todo";

    private String deadline;

    private Integer estimatedMin;

    /** Comma-separated list of task IDs this task depends on */
    @Column(columnDefinition = "TEXT")
    private String dependsOn;

    /** JSON array: [{url, desc}] */
    @Column(columnDefinition = "TEXT")
    private String resources;
}
