package com.malar.backend.repository;

import com.malar.backend.entity.SmallIncome;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

@org.springframework.stereotype.Repository
public interface SmallIncomeRepository extends JpaRepository<SmallIncome, Long> {
    List<SmallIncome> findByCreatedAtBetweenOrderByCreatedAtDesc(LocalDateTime start, LocalDateTime end);
}
