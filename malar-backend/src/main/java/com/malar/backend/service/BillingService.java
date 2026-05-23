package com.malar.backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.malar.backend.entity.Bill;
import com.malar.backend.entity.Debt;
import com.malar.backend.entity.ServiceSale;
import com.malar.backend.repository.BillRepository;
import com.malar.backend.repository.DebtRepository;
import com.malar.backend.repository.InventoryRepository;
import com.malar.backend.repository.ServiceSaleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class BillingService {

    @Autowired
    private BillRepository billRepository;

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private DebtRepository debtRepository;

    @Autowired
    private ServiceSaleRepository serviceSaleRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional
    public Bill saveBill(Map<String, Object> request) throws Exception {
        Bill bill = new Bill();
        bill.setCustomerName((String) request.getOrDefault("customerName", ""));
        bill.setPhone((String) request.getOrDefault("phone", ""));
        bill.setGrandTotal(new BigDecimal(request.get("grandTotal").toString()));
        
        String status = (String) request.getOrDefault("status", "PAID");
        bill.setStatus(status);
        
        List<Map<String, Object>> items = (List<Map<String, Object>>) request.get("items");
        bill.setItemsJson(objectMapper.writeValueAsString(items));
        
        LocalDateTime now = LocalDateTime.now(java.time.ZoneId.of("Asia/Kolkata"));
        bill.setCreatedAt(now);
        
        LocalDateTime startOfDay = now.toLocalDate().atStartOfDay();
        LocalDateTime endOfDay = now.toLocalDate().atTime(LocalTime.MAX);
        
        Optional<Bill> lastBill = billRepository.findTopByCreatedAtBetweenOrderByIdDesc(startOfDay, endOfDay);
        int nextSeq = 1;
        if (lastBill.isPresent() && lastBill.get().getDisplayId() != null) {
            try {
                String lastDisplayId = lastBill.get().getDisplayId();
                String lastSeqStr = lastDisplayId.substring(lastDisplayId.lastIndexOf("-") + 1);
                nextSeq = Integer.parseInt(lastSeqStr) + 1;
            } catch (Exception e) {
                // Fallback to count if format is unexpected
                nextSeq = (int) billRepository.countByCreatedAtBetween(startOfDay, endOfDay) + 1;
            }
        }
        
        String datePart = now.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        bill.setDisplayId(String.format("%s-%04d", datePart, nextSeq));
        
        for (Map<String, Object> item : items) {
            String serviceName = (String) item.get("service");
            String category = (String) item.get("category");
            int qty = ((Number) item.get("qty")).intValue();
            
            inventoryRepository.findByItemName(serviceName).ifPresent(inv -> {
                inv.setStockQuantity(Math.max(0, inv.getStockQuantity() - qty));
                inventoryRepository.save(inv);
            });

            if (serviceName != null && !serviceName.isEmpty() && 
                !serviceName.startsWith("DEBT SETTLEMENT") && 
                !serviceSaleRepository.existsByServiceName(serviceName) &&
                !inventoryRepository.existsByItemName(serviceName)) {
                
                ServiceSale newService = new ServiceSale();
                newService.setServiceName(serviceName);
                newService.setCategory(category != null ? category : "Other");
                newService.setSalesToday(0);
                newService.setRevenue(BigDecimal.ZERO);
                serviceSaleRepository.save(newService);
            }
        }

        Bill saved = billRepository.save(bill);

        if ("DEBT".equalsIgnoreCase(status)) {
            Debt debt = new Debt();
            debt.setCustomerName(bill.getCustomerName());
            debt.setPhone(bill.getPhone());
            debt.setAmount(bill.getGrandTotal());
            debt.setReason("Billing Record #" + saved.getId());
            debt.setCreatedAt(LocalDateTime.now(java.time.ZoneId.of("Asia/Kolkata")));
            debt.setSettled(false);
            debt.setBillId(saved.getId());
            debtRepository.save(debt);
        }

        return saved;
    }

    public List<Bill> getHistory() {
        return billRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional
    public Bill updateBill(Long id, Map<String, Object> request) throws Exception {
        Bill bill = billRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Bill not found with ID: " + id));

        // 1. Reverse old inventory impact
        if (bill.getItemsJson() != null && !bill.getItemsJson().isEmpty()) {
            List<Map<String, Object>> oldItems = objectMapper.readValue(bill.getItemsJson(), new TypeReference<List<Map<String, Object>>>() {});
            for (Map<String, Object> item : oldItems) {
                String serviceName = (String) item.get("service");
                int qty = ((Number) item.get("qty")).intValue();
                inventoryRepository.findByItemName(serviceName).ifPresent(inv -> {
                    inv.setStockQuantity(inv.getStockQuantity() + qty);
                    inventoryRepository.save(inv);
                });
            }
        }

        // 2. Apply new inventory impact
        List<Map<String, Object>> newItems = (List<Map<String, Object>>) request.get("items");
        for (Map<String, Object> item : newItems) {
            String serviceName = (String) item.get("service");
            int qty = ((Number) item.get("qty")).intValue();
            inventoryRepository.findByItemName(serviceName).ifPresent(inv -> {
                inv.setStockQuantity(Math.max(0, inv.getStockQuantity() - qty));
                inventoryRepository.save(inv);
            });
        }

        // 3. Update bill fields
        String newStatus = (String) request.getOrDefault("status", "PAID");
        bill.setCustomerName((String) request.getOrDefault("customerName", ""));
        bill.setPhone((String) request.getOrDefault("phone", ""));
        bill.setGrandTotal(new BigDecimal(request.get("grandTotal").toString()));
        bill.setStatus(newStatus);
        bill.setItemsJson(objectMapper.writeValueAsString(newItems));

        Bill saved = billRepository.save(bill);

        // 4. Update associated debts
        List<Debt> associatedDebts = debtRepository.findByBillId(id);
        if ("DEBT".equalsIgnoreCase(newStatus)) {
            if (associatedDebts.isEmpty()) {
                Debt debt = new Debt();
                debt.setCustomerName(saved.getCustomerName());
                debt.setPhone(saved.getPhone());
                debt.setAmount(saved.getGrandTotal());
                debt.setReason("Billing Record #" + saved.getId());
                debt.setCreatedAt(LocalDateTime.now(java.time.ZoneId.of("Asia/Kolkata")));
                debt.setSettled(false);
                debt.setBillId(saved.getId());
                debtRepository.save(debt);
            } else {
                for (Debt debt : associatedDebts) {
                    debt.setCustomerName(saved.getCustomerName());
                    debt.setPhone(saved.getPhone());
                    debt.setAmount(saved.getGrandTotal());
                    debt.setReason("Billing Record #" + saved.getId());
                    debtRepository.save(debt);
                }
            }
        } else {
            if (!associatedDebts.isEmpty()) {
                debtRepository.deleteAll(associatedDebts);
            }
        }

        return saved;
    }

    @Transactional
    public void deleteBill(Long id) throws Exception {
        Bill bill = billRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Bill not found with ID: " + id));

        // 1. Reverse inventory impact
        if (bill.getItemsJson() != null && !bill.getItemsJson().isEmpty()) {
            List<Map<String, Object>> items = objectMapper.readValue(bill.getItemsJson(), new TypeReference<List<Map<String, Object>>>() {});
            for (Map<String, Object> item : items) {
                String serviceName = (String) item.get("service");
                int qty = ((Number) item.get("qty")).intValue();
                inventoryRepository.findByItemName(serviceName).ifPresent(inv -> {
                    inv.setStockQuantity(inv.getStockQuantity() + qty);
                    inventoryRepository.save(inv);
                });
            }
        }

        // 2. Delete associated debts
        List<Debt> associatedDebts = debtRepository.findByBillId(id);
        if (!associatedDebts.isEmpty()) {
            debtRepository.deleteAll(associatedDebts);
        }

        // 3. Delete bill
        billRepository.delete(bill);
    }
}
