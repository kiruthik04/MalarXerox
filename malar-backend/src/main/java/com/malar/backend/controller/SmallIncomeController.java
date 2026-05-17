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
}
