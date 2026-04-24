package com.lifeos.repository;
import com.lifeos.model.Period;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
@Repository
public interface PeriodRepository extends JpaRepository<Period, String> {}
