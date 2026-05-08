package com.malar.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.malar.backend.entity.Bill;
import com.malar.backend.entity.Debt;
import com.malar.backend.repository.BillRepository;
import com.malar.backend.repository.DebtRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

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
        debt.setCreatedAt(LocalDateTime.now());
        debt.setSettled(false);
        Debt saved = debtRepository.save(debt);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}/settle")
    public ResponseEntity<?> settle(@PathVariable Long id) {
        return debtRepository.findById(id).map(debt -> {
            debt.setSettled(true);
            debt.setSettledAt(LocalDateTime.now());
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
                bill.setCreatedAt(LocalDateTime.now());
                bill.setStatus("PAID");

                // Create a single item list for the bill with timing details
                String addedTime = debt.getCreatedAt().format(java.time.format.DateTimeFormatter.ofPattern("dd-MMM-yyyy HH:mm"));
                String paidTime = LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("dd-MMM-yyyy HH:mm"));
                
                List<Map<String, Object>> items = List.of(Map.of(
                    "service", "DEBT SETTLEMENT: " + (debt.getReason() != null ? debt.getReason() : "General Credit"),
                    "qty", 1,
                    "price", debt.getAmount(),
                    "total", debt.getAmount(),
                    "note", "Debt Recorded: " + addedTime + " | Paid: " + paidTime
                ));
                bill.setItemsJson(objectMapper.writeValueAsString(items));

                Bill savedBill = billRepository.save(bill);
                return ResponseEntity.ok(savedBill);
            } catch (Exception e) {
                return ResponseEntity.status(500).body(Map.of("error", "Debt settled but failed to create bill record: " + e.getMessage()));
            }
        }).orElse(ResponseEntity.notFound().build());
    }


    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        debtRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Deleted"));
    }
}
