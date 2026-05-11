package com.malar.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.malar.backend.entity.Bill;
import com.malar.backend.entity.Inventory;
import com.malar.backend.repository.BillRepository;
import com.malar.backend.repository.InventoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/billing")
@CrossOrigin(origins = "*")
public class BillingController {

    @Autowired
    private BillRepository billRepository;

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private com.malar.backend.repository.DebtRepository debtRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @PostMapping("/save")
    public ResponseEntity<?> saveBill(@RequestBody Map<String, Object> request) {
        try {
            Bill bill = new Bill();
            bill.setCustomerName((String) request.getOrDefault("customerName", ""));
            bill.setPhone((String) request.getOrDefault("phone", ""));
            bill.setGrandTotal(new BigDecimal(request.get("grandTotal").toString()));
            
            String status = (String) request.getOrDefault("status", "PAID");
            bill.setStatus(status);
            
            // Convert items list to proper JSON string
            List<Map<String, Object>> items = (List<Map<String, Object>>) request.get("items");
            bill.setItemsJson(objectMapper.writeValueAsString(items));
            
            
            LocalDateTime now = LocalDateTime.now();
            bill.setCreatedAt(now);
            
            // Daily ID logic
            LocalDateTime startOfDay = now.toLocalDate().atStartOfDay();
            LocalDateTime endOfDay = now.toLocalDate().atTime(LocalTime.MAX);
            
            long countToday = billRepository.countByCreatedAtBetween(startOfDay, endOfDay);
            int nextSeq = (int) countToday + 1;
            
            String datePart = now.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
            bill.setDisplayId(String.format("%s-%04d", datePart, nextSeq));
            
            // Optional: Deduct from inventory if item matches
            for (Map<String, Object> item : items) {
                String serviceName = (String) item.get("service");
                int qty = ((Number) item.get("qty")).intValue();
                
                inventoryRepository.findByItemName(serviceName).ifPresent(inv -> {
                    inv.setStockQuantity(Math.max(0, inv.getStockQuantity() - qty));
                    inventoryRepository.save(inv);
                });
            }

            Bill saved = billRepository.save(bill);

            // If it's a debt bill, create a record in the debts table
            if ("DEBT".equalsIgnoreCase(status)) {
                com.malar.backend.entity.Debt debt = new com.malar.backend.entity.Debt();
                debt.setCustomerName(bill.getCustomerName());
                debt.setPhone(bill.getPhone());
                debt.setAmount(bill.getGrandTotal());
                debt.setReason("Billing Record #" + saved.getId());
                debt.setCreatedAt(LocalDateTime.now());
                debt.setSettled(false);
                debt.setBillId(saved.getId());
                debtRepository.save(debt);
            }

            return ResponseEntity.ok(Map.of("id", saved.getId(), "message", "Bill saved"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/history")
    public ResponseEntity<List<Bill>> getHistory() {
        return ResponseEntity.ok(billRepository.findAllByOrderByCreatedAtDesc());
    }
}

