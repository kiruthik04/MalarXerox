package com.malar.backend.repository;

import com.malar.backend.entity.ServiceSale;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ServiceSaleRepository extends JpaRepository<ServiceSale, Long> {
    boolean existsByServiceName(String serviceName);
}
