package com.malar.backend.repository;

import com.malar.backend.entity.DailyLedger;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface DailyLedgerRepository extends JpaRepository<DailyLedger, Long> {
    Optional<DailyLedger> findByTransactionDate(LocalDate date);
}

