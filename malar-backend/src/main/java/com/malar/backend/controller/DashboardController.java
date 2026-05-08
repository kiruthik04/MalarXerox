package com.malar.backend.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.malar.backend.entity.Bill;
import com.malar.backend.entity.Debt;
import com.malar.backend.entity.Expense;
import com.malar.backend.entity.Inventory;
import com.malar.backend.entity.ServiceSale;
import com.malar.backend.repository.InventoryRepository;
import com.malar.backend.repository.ServiceSaleRepository;
import com.malar.backend.repository.BillRepository;
import com.malar.backend.repository.ExpenseRepository;
import com.malar.backend.repository.DebtRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "*")
public class DashboardController {

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private ServiceSaleRepository serviceSaleRepository;

    @Autowired
    private BillRepository billRepository;

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private DebtRepository debtRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @GetMapping("/data")
    public ResponseEntity<?> getDashboardData() {
        List<Inventory> inventoryList = inventoryRepository.findAll();
        List<Bill> allBills = billRepository.findAllByOrderByCreatedAtDesc();
        List<com.malar.backend.entity.Expense> allExpenses = expenseRepository.findAll();
        
        LocalDate today = LocalDate.now();
        List<Bill> todayBills = allBills.stream()
                .filter(b -> b.getCreatedAt() != null && b.getCreatedAt().toLocalDate().isEqual(today))
                .collect(Collectors.toList());

        BigDecimal dailyIncome = todayBills.stream()
                .map(Bill::getGrandTotal)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal dailyExpenses = allExpenses.stream()
                .filter(e -> e.getCreatedAt() != null && e.getCreatedAt().toLocalDate().isEqual(today))
                .map(com.malar.backend.entity.Expense::getAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal netProfit = dailyIncome.subtract(dailyExpenses);

        // Previous Day Debt
        LocalDate yesterday = today.minusDays(1);
        BigDecimal yesterdayDebt = debtRepository.findAll().stream()
                .filter(d -> d.getCreatedAt() != null && d.getCreatedAt().toLocalDate().isEqual(yesterday) && !d.isSettled())
                .map(Debt::getAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Calculate Service Sales dynamically from today's bills
        Map<String, ServiceSale> serviceSalesMap = new HashMap<>();
        
        // Pre-populate with known services from DB to keep icons
        serviceSaleRepository.findAll().forEach(s -> {
            ServiceSale ss = new ServiceSale();
            ss.setServiceName(s.getServiceName());
            ss.setIconName(s.getIconName());
            ss.setSalesToday(0);
            ss.setRevenue(BigDecimal.ZERO);
            serviceSalesMap.put(s.getServiceName(), ss);
        });

        for (Bill bill : todayBills) {
            try {
                List<Map<String, Object>> items = objectMapper.readValue(bill.getItemsJson(), new TypeReference<List<Map<String, Object>>>() {});
                for (Map<String, Object> item : items) {
                    String name = (String) item.get("service");
                    
                    // Filter out debt settlements from service performance table
                    if (name != null && (name.startsWith("DEBT SETTLEMENT") || name.startsWith("Settlement of Debt"))) {
                        continue;
                    }

                    int qty = ((Number) item.get("qty")).intValue();
                    BigDecimal total = new BigDecimal(item.get("total").toString());

                    ServiceSale ss = serviceSalesMap.getOrDefault(name, new ServiceSale());
                    if (ss.getServiceName() == null) {
                        ss.setServiceName(name);
                        ss.setIconName("FileText");
                        ss.setRevenue(BigDecimal.ZERO);
                    }
                    ss.setSalesToday(ss.getSalesToday() + qty);
                    ss.setRevenue(ss.getRevenue().add(total));
                    serviceSalesMap.put(name, ss);
                }
            } catch (Exception e) {
                // Ignore parsing errors for old/invalid data
            }
        }

        List<ServiceSale> dynamicServiceSales = serviceSalesMap.values().stream()
                .filter(s -> s.getSalesToday() > 0 || serviceSaleRepository.existsByServiceName(s.getServiceName()))
                .sorted((a, b) -> b.getRevenue().compareTo(a.getRevenue()))
                .collect(Collectors.toList());

        Map<String, Object> data = new HashMap<>();
        data.put("inventory", inventoryList);
        data.put("serviceSales", dynamicServiceSales);
        data.put("recentBills", allBills.stream().limit(5).collect(Collectors.toList()));
        
        data.put("stats", Map.of(
            "dailyIncome", "₹" + String.format("%.2f", dailyIncome),
            "dailyExpenses", "₹" + String.format("%.2f", dailyExpenses),
            "netProfit", "₹" + String.format("%.2f", netProfit),
            "yesterdayDebt", "₹" + String.format("%.2f", yesterdayDebt),
            "pendingOrders", 0
        ));

        return ResponseEntity.ok(data);
    }
}


