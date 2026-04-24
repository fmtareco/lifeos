package com.lifeos.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "balance",
       uniqueConstraints = @UniqueConstraint(columnNames = {"periodId", "areaId"}))
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Balance {

    @Id
    @Column(length = 128)
    private String id;   // e.g. "b-per-workday-work"

    @Column(length = 64)
    private String periodId;

    @Column(length = 64)
    private String areaId;

    /** Percentage of available day hours (0–100) */
    @Builder.Default
    private Integer weightPct = 0;
}
