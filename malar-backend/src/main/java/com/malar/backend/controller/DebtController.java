package com.malar.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.malar.backend.entity.Bill;
import com.malar.backend.entity.Debt;
import com.malar.backend.repository.BillRepository;
import com.malar.backend.repository.DebtRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/debts")
@CrossOrigin(origins = "*")
public class DebtController {

    @Autowired
    private DebtRepository debtRepository;

    @Autowired
    private BillRepository billRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @GetMapping
    public List<Debt> getAll() {
        return debtRepository.findAllByOrderByCreatedAtDesc();
    }

    @PostMapping
    public ResponseEntity<?> add(@RequestBody Debt debt) {
        debt.setCreatedAt(LocalDateTime.now(java.time.ZoneId.of("Asia/Kolkata")));
        debt.setSettled(false);
        Debt saved = debtRepository.save(debt);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}/settle")
    public ResponseEntity<?> settle(@PathVariable Long id) {
        return debtRepository.findById(id).map(debt -> {
            debt.setSettled(true);
            debt.setSettledAt(LocalDateTime.now(java.time.ZoneId.of("Asia/Kolkata")));
            debtRepository.save(debt);

            // If this debt is linked to a specific Bill, update that bill's status to PAID
            if (debt.getBillId() != null) {
                return billRepository.findById(debt.getBillId()).map(bill -> {
                    bill.setStatus("PAID");
                    Bill updated = billRepository.save(bill);
                    return ResponseEntity.ok(updated);
                }).orElse(ResponseEntity.notFound().build());
            }

            // Otherwise, create a NEW Bill record as a "Debt Settlement" entry
            try {
                Bill bill = new Bill();
                bill.setCustomerName(debt.getCustomerName());
                bill.setPhone(debt.getPhone());
                bill.setGrandTotal(debt.getAmount());
                bill.setCreatedAt(LocalDateTime.now(java.time.ZoneId.of("Asia/Kolkata")));
                bill.setStatus("PAID");
                bill.setDisplayId(generateDisplayId(bill.getCreatedAt()));

                // Create a single item list for the bill with timing details
                String addedTime = debt.getCreatedAt().format(DateTimeFormatter.ofPattern("dd-MMM-yyyy HH:mm"));
                String paidTime = LocalDateTime.now(java.time.ZoneId.of("Asia/Kolkata")).format(DateTimeFormatter.ofPattern("dd-MMM-yyyy HH:mm"));
                
                Map<String, Object> singleItem = new java.util.HashMap<>();
                singleItem.put("service", "DEBT SETTLEMENT: " + (debt.getReason() != null ? debt.getReason() : "General Credit"));
                singleItem.put("qty", 1);
                singleItem.put("price", debt.getAmount());
                singleItem.put("total", debt.getAmount());
                singleItem.put("note", "Debt Recorded: " + addedTime + " | Paid: " + paidTime);
                
                List<Map<String, Object>> items = List.of(singleItem);
                bill.setItemsJson(objectMapper.writeValueAsString(items));

                Bill savedBill = billRepository.save(bill);
                return ResponseEntity.ok(savedBill);
            } catch (Exception e) {
                return ResponseEntity.status(500).body(Map.of("error", "Debt settled but failed to create bill record: " + e.getMessage()));
            }
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/settle-multiple")
    public ResponseEntity<?> settleMultiple(@RequestBody List<Long> ids) {
        try {
            List<Debt> debts = debtRepository.findAllById(ids).stream()
                    .filter(d -> !d.isSettled())
                    .collect(Collectors.toList());
            
            if (debts.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "No pending debts found for given IDs"));
            }

            String customerName = debts.get(0).getCustomerName();
            String phone = debts.get(0).getPhone();
            BigDecimal totalAmount = debts.stream()
                    .map(Debt::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            LocalDateTime now = LocalDateTime.now(java.time.ZoneId.of("Asia/Kolkata"));

            // Create combined Bill
            Bill bill = new Bill();
            bill.setCustomerName(customerName);
            bill.setPhone(phone);
            bill.setGrandTotal(totalAmount);
            bill.setCreatedAt(now);
            bill.setStatus("PAID");
            bill.setDisplayId(generateDisplayId(now));

            List<Map<String, Object>> items = debts.stream().map(d -> {
                String addedTime = d.getCreatedAt().format(DateTimeFormatter.ofPattern("dd-MMM-yyyy"));
                Map<String, Object> item = new java.util.HashMap<>();
                item.put("service", "DEBT SETTLEMENT");
                item.put("qty", 1);
                item.put("price", d.getAmount());
                item.put("total", d.getAmount());
                item.put("note", (d.getReason() != null ? d.getReason() : "Credit") + " (Recorded: " + addedTime + ")");
                return item;
            }).collect(Collectors.toList());

            bill.setItemsJson(objectMapper.writeValueAsString(items));
            Bill savedBill = billRepository.save(bill);

            // Mark all debts as settled
            for (Debt d : debts) {
                d.setSettled(true);
                d.setSettledAt(now);
                d.setBillId(savedBill.getId()); // Link to the new bill
                debtRepository.save(d);
            }

            return ResponseEntity.ok(savedBill);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to settle multiple debts: " + e.getMessage()));
        }
    }

    private String generateDisplayId(LocalDateTime now) {
        LocalDateTime startOfDay = now.toLocalDate().atStartOfDay();
        LocalDateTime endOfDay = now.toLocalDate().atTime(LocalTime.MAX);
        
        long countToday = billRepository.countByCreatedAtBetween(startOfDay, endOfDay);
        int nextSeq = (int) countToday + 1;
        
        String datePart = now.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        return String.format("%s-%04d", datePart, nextSeq);
    }


    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        debtRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Deleted"));
    }
}
