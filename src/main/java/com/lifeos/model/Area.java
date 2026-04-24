package com.lifeos.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Entity
@Table(name = "areas")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Area {

    @Id
    @Column(length = 64)
    private String id;

    @NotBlank
    private String label;

    private String color;

    private String icon;
}
