package com.malar.backend.controller;

import com.malar.backend.entity.SmallIncome;
import com.malar.backend.repository.SmallIncomeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/small-income")
@CrossOrigin(origins = "*")
public class SmallIncomeController {

    @Autowired
    private SmallIncomeRepository smallIncomeRepository;

    @PostMapping("/add")
    public ResponseEntity<?> addSmallIncome(@RequestBody Map<String, Object> request) {
        try {
            BigDecimal amount = new BigDecimal(request.get("amount").toString());
            SmallIncome income = new SmallIncome();
            income.setAmount(amount);
            income.setCreatedAt(LocalDateTime.now(java.time.ZoneId.of("Asia/Kolkata")));
            
            SmallIncome saved = smallIncomeRepository.save(income);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/history")
    public ResponseEntity<List<SmallIncome>> getAllSmallIncome() {
        return ResponseEntity.ok(smallIncomeRepository.findAll());
    }

    @GetMapping("/today")
    public ResponseEntity<List<SmallIncome>> getTodaySmallIncome() {
        LocalDateTime start = LocalDateTime.now(java.time.ZoneId.of("Asia/Kolkata")).toLocalDate().atStartOfDay();
        LocalDateTime end = LocalDateTime.now(java.time.ZoneId.of("Asia/Kolkata")).toLocalDate().atTime(LocalTime.MAX);
        return ResponseEntity.ok(smallIncomeRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(start, end));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateSmallIncome(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        try {
            return smallIncomeRepository.findById(id).map(income -> {
                BigDecimal amount = new BigDecimal(request.get("amount").toString());
                income.setAmount(amount);
                if (request.containsKey("category")) {
                    income.setCategory(request.get("category").toString());
                }
                SmallIncome saved = smallIncomeRepository.save(income);
                return ResponseEntity.ok(saved);
            }).orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteSmallIncome(@PathVariable Long id) {
        try {
            smallIncomeRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Quick cash deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}
