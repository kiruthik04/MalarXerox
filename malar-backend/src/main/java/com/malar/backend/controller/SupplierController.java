package com.malar.backend.controller;

import com.malar.backend.entity.Supplier;
import com.malar.backend.entity.SupplierBill;
import com.malar.backend.repository.SupplierBillRepository;
import com.malar.backend.repository.SupplierRepository;
import com.malar.backend.repository.ExpenseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/suppliers")
@CrossOrigin(origins = "*")
public class SupplierController {

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private SupplierBillRepository supplierBillRepository;

    @Autowired
    private ExpenseRepository expenseRepository;

    @GetMapping
    public List<Supplier> getAll() {
        return supplierRepository.findAll();
    }

    @PostMapping
    public Supplier add(@RequestBody Supplier supplier) {
        if (supplier.getBalance() == null) supplier.setBalance(java.math.BigDecimal.ZERO);
        return supplierRepository.save(supplier);
    }

    @PostMapping("/{id}/bill")
    public ResponseEntity<?> addBill(@PathVariable Long id, @RequestBody SupplierBill bill) {
        return supplierRepository.findById(id).map(supplier -> {
            bill.setSupplier(supplier);
            bill.setCreatedAt(LocalDateTime.now());
            supplierBillRepository.save(bill);
            
            // Increase supplier balance
            supplier.setBalance(supplier.getBalance().add(bill.getAmount()));
            supplierRepository.save(supplier);
            
            return ResponseEntity.ok(bill);
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<?> getHistory(@PathVariable Long id) {
        return supplierRepository.findById(id).map(supplier -> {
            List<SupplierBill> bills = supplierBillRepository.findBySupplierOrderByCreatedAtDesc(supplier);
            List<?> payments = expenseRepository.findBySupplierOrderByCreatedAtDesc(supplier);
            
            return ResponseEntity.ok(Map.of(
                "bills", bills,
                "payments", payments
            ));
        }).orElse(ResponseEntity.notFound().build());
    }
}
