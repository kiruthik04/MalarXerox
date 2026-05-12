package com.malar.backend.controller;

import com.malar.backend.entity.Expense;
import com.malar.backend.repository.ExpenseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/expenses")
@CrossOrigin(origins = "*")
public class ExpenseController {

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private com.malar.backend.repository.SupplierRepository supplierRepository;

    @GetMapping
    public List<Expense> getAll() {
        return expenseRepository.findAllByOrderByCreatedAtDesc();
    }

    @PostMapping
    public ResponseEntity<?> add(@RequestBody Expense expense) {
        expense.setCreatedAt(LocalDateTime.now());
        
        // If expense is linked to a supplier, reduce supplier balance
        if (expense.getSupplier() != null && expense.getSupplier().getId() != null) {
            supplierRepository.findById(expense.getSupplier().getId()).ifPresent(supplier -> {
                supplier.setBalance(supplier.getBalance().subtract(expense.getAmount()));
                supplierRepository.save(supplier);
            });
        }
        
        Expense saved = expenseRepository.save(expense);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        expenseRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Deleted"));
    }
}
