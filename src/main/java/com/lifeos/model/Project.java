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

    @Column(columnDefinition = "TEXT")
    private String description;

    private String goals;

    private String deadline;   // ISO date string yyyy-MM-dd

    @Builder.Default
    private String status = "todo";  // todo | doing | done
}
