package com.lifeos.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Entity
@Table(name = "periods")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Period {

    @Id
    @Column(length = 64)
    private String id;

    @NotBlank
    private String label;

    @Column(columnDefinition = "TEXT")
    private String description;

    /** Total waking hours available on this kind of day */
    @Builder.Default
    private Double availableHours = 16.0;

    /**
     * Comma-separated day abbreviations: mon,tue,wed,thu,fri,sat,sun
     * Determines which period type applies to a given calendar day.
     */
    @Column(columnDefinition = "TEXT")
    private String dayTypes;
}
