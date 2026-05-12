package com.malar.backend.repository;

import com.malar.backend.entity.Supplier;
import com.malar.backend.entity.SupplierBill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SupplierBillRepository extends JpaRepository<SupplierBill, Long> {
    List<SupplierBill> findBySupplierOrderByCreatedAtDesc(Supplier supplier);
}
