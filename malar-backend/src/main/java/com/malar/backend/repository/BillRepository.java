package com.malar.backend.repository;

import com.malar.backend.entity.Bill;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

import java.time.LocalDateTime;
import java.util.Optional;

public interface BillRepository extends JpaRepository<Bill, Long> {
    List<Bill> findAllByOrderByCreatedAtDesc();
    Optional<Bill> findTopByCreatedAtBetweenOrderByIdDesc(LocalDateTime start, LocalDateTime end);
    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
}
