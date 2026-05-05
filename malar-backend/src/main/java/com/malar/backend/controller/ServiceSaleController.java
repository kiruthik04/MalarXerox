package com.malar.backend.controller;

import com.malar.backend.entity.ServiceSale;
import com.malar.backend.repository.ServiceSaleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/services")
@CrossOrigin(origins = "*")
public class ServiceSaleController {

    @Autowired
    private ServiceSaleRepository serviceSaleRepository;

    @GetMapping
    public ResponseEntity<List<ServiceSale>> getAll() {
        return ResponseEntity.ok(serviceSaleRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<ServiceSale> add(@RequestBody ServiceSale service) {
        return ResponseEntity.ok(serviceSaleRepository.save(service));
    }
}
