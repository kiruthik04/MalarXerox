package com.malar.backend.repository;

import com.malar.backend.entity.PendingOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PendingOrderRepository extends JpaRepository<PendingOrder, Long> {
    List<PendingOrder> findByCompletedFalseOrderByCreatedAtDesc();
}
