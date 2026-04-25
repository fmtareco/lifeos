package com.lifeos.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Entity
@Table(name = "projects")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Project {

    @Id
    @Column(length = 64)
    private String id;

    @NotBlank
    private String label;

    @Column(length = 64)
    private String areaId;

    @Column(length = 64)
    private String activityId;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String goals;

    private String deadline;

    @Builder.Default
    private String status = "todo";

    /** Project this one depends on (same area) */
    @Column(length = 64)
    private String dependsOnProjectId;

    /** Location IDs (comma-separated) */
    @Column(columnDefinition = "TEXT")
    private String locationIds;
}
