package com.lifeos.repository;

import com.lifeos.model.Action;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ActionRepository extends JpaRepository<Action, String> {

    List<Action> findByDateOrderByCreatedAtAsc(String date);

    List<Action> findByDateBetweenOrderByDateAscCreatedAtAsc(String from, String to);

    @Query("SELECT DISTINCT a.date FROM Action a ORDER BY a.date DESC")
    List<String> findDistinctDates();
}
