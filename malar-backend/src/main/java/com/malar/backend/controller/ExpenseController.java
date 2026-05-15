package com.malar.backend.controller;

import com.malar.backend.entity.Expense;
import com.malar.backend.service.ExpenseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/expenses")
@CrossOrigin(origins = "*")
public class ExpenseController {

    @Autowired
    private ExpenseService expenseService;

    @GetMapping
    public List<Expense> getAll() {
        return expenseService.getAll();
    }

    @PostMapping
    public ResponseEntity<?> add(@RequestBody Expense expense) {
        Expense saved = expenseService.addExpense(expense);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        expenseService.deleteExpense(id);
        return ResponseEntity.ok(Map.of("message", "Deleted"));
    }
}

