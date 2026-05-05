package com.malar.backend.repository;

import com.malar.backend.entity.Bill;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BillRepository extends JpaRepository<Bill, Long> {
    List<Bill> findAllByOrderByCreatedAtDesc();
}
