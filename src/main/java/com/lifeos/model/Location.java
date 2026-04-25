package com.lifeos.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Entity
@Table(name = "locations")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Location {
    @Id
    @Column(length = 64)
    private String id;

    @NotBlank
    private String label;

    @Column(columnDefinition = "TEXT")
    private String description;

    /** e.g. home, office, gym, outdoor, online */
    private String type;

    private String address;
}
