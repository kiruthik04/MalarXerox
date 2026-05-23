package com.malar.backend.controller;

import com.malar.backend.entity.Bill;
import com.malar.backend.service.BillingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/billing")
@CrossOrigin(origins = "*")
public class BillingController {

    @Autowired
    private BillingService billingService;

    @PostMapping("/save")
    public ResponseEntity<?> saveBill(@RequestBody Map<String, Object> request) {
        try {
            Bill saved = billingService.saveBill(request);
            return ResponseEntity.ok(Map.of(
                "id", saved.getId(), 
                "displayId", saved.getDisplayId(),
                "message", "Bill saved"
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to save bill: " + e.getMessage()));
        }
    }

    @GetMapping("/history")
    public ResponseEntity<List<Bill>> getHistory() {
        return ResponseEntity.ok(billingService.getHistory());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateBill(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        try {
            Bill updated = billingService.updateBill(id, request);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to update bill: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBill(@PathVariable Long id) {
        try {
            billingService.deleteBill(id);
            return ResponseEntity.ok(Map.of("message", "Bill deleted successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to delete bill: " + e.getMessage()));
        }
    }
}


