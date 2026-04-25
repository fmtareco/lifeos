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
    private String activityId;

    @Column(length = 64)
    private String projectId;

    private String priority;

    @Builder.Default
    private String status = "todo";

    private String deadline;

    private String activationDate;

    private Integer estimatedMin;

    /** Task that must be completed before this one */
    @Column(length = 64)
    private String dependsOnTaskId;

    @Column(columnDefinition = "TEXT")
    private String resources;
}
