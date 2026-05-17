package com.malar.backend.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.malar.backend.entity.Bill;
import com.malar.backend.entity.Debt;
import com.malar.backend.entity.Expense;
import com.malar.backend.entity.DailyLedger;
import com.malar.backend.entity.Inventory;
import com.malar.backend.entity.ServiceSale;
import com.malar.backend.repository.DailyLedgerRepository;
import com.malar.backend.repository.InventoryRepository;
import com.malar.backend.repository.ServiceSaleRepository;
import com.malar.backend.repository.BillRepository;
import com.malar.backend.repository.ExpenseRepository;
import com.malar.backend.repository.DebtRepository;
import com.malar.backend.repository.PendingOrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.Objects;
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

    @Autowired
    private PendingOrderRepository pendingOrderRepository;

    @Autowired
    private com.malar.backend.repository.SmallIncomeRepository smallIncomeRepository;

    @Autowired
    private DailyLedgerRepository dailyLedgerRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @GetMapping("/data")
    public ResponseEntity<?> getDashboardData() {
        try {
            List<Inventory> inventoryList = inventoryRepository.findAll();
            List<Bill> allBills = billRepository.findAllByOrderByCreatedAtDesc();
            List<com.malar.backend.entity.Expense> allExpenses = expenseRepository.findAll();
            
            LocalDate today = LocalDate.now(java.time.ZoneId.of("Asia/Kolkata"));
            List<Bill> todayBills = allBills.stream()
                    .filter(b -> b.getCreatedAt() != null && b.getCreatedAt().toLocalDate().isEqual(today))
                    .collect(Collectors.toList());

            BigDecimal dailyIncome = todayBills.stream()
                    .map(Bill::getGrandTotal)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            // Add Small Income
            try {
                LocalDateTime startOfDay = today.atStartOfDay();
                LocalDateTime endOfDay = today.atTime(LocalTime.MAX);
                BigDecimal smallIncomeTotal = smallIncomeRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(startOfDay, endOfDay)
                        .stream()
                        .map(com.malar.backend.entity.SmallIncome::getAmount)
                        .filter(Objects::nonNull)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                dailyIncome = dailyIncome.add(smallIncomeTotal);
            } catch (Exception e) {
                System.err.println("Dashboard warning (small income): " + e.getMessage());
            }

            BigDecimal dailyExpenses = allExpenses.stream()
                    .filter(e -> e.getCreatedAt() != null && e.getCreatedAt().toLocalDate().isEqual(today))
                    .map(com.malar.backend.entity.Expense::getAmount)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal netProfit = dailyIncome.subtract(dailyExpenses);

            // All Pending Debts
            BigDecimal totalPendingDebt = debtRepository.findAll().stream()
                    .filter(d -> !d.isSettled())
                    .map(Debt::getAmount)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            // Calculate Service Sales dynamically
            Map<String, ServiceSale> categorySalesMap = new HashMap<>();
            List<ServiceSale> allDefinitions = serviceSaleRepository.findAll();
            Map<String, String> serviceToCategory = allDefinitions.stream()
                    .filter(s -> s.getServiceName() != null)
                    .collect(Collectors.toMap(ServiceSale::getServiceName, 
                            s -> (s.getCategory() != null && !s.getCategory().isEmpty()) ? s.getCategory() : "Other",
                            (a, b) -> a));
            
            allDefinitions.stream()
                    .map(s -> (s.getCategory() != null && !s.getCategory().isEmpty()) ? s.getCategory() : "Other")
                    .distinct()
                    .forEach(cat -> {
                        ServiceSale ss = new ServiceSale();
                        ss.setServiceName(cat);
                        ss.setSalesToday(0);
                        ss.setRevenue(BigDecimal.ZERO);
                        categorySalesMap.put(cat, ss);
                    });

            for (Bill bill : todayBills) {
                try {
                    if (bill.getItemsJson() == null) continue;
                    List<Map<String, Object>> items = objectMapper.readValue(bill.getItemsJson(), new TypeReference<List<Map<String, Object>>>() {});
                    for (Map<String, Object> item : items) {
                        String name = (String) item.get("service");
                        if (name != null && (name.startsWith("DEBT SETTLEMENT") || name.startsWith("Settlement of Debt"))) continue;

                        int qty = item.get("qty") != null ? ((Number) item.get("qty")).intValue() : 0;
                        BigDecimal total = item.get("total") != null ? new BigDecimal(item.get("total").toString()) : BigDecimal.ZERO;

                        String category = (String) item.get("category");
                        if (category == null || category.isEmpty()) {
                            category = serviceToCategory.getOrDefault(name, "Other");
                        }

                        ServiceSale ss = categorySalesMap.getOrDefault(category, new ServiceSale());
                        if (ss.getServiceName() == null) {
                            ss.setServiceName(category);
                            ss.setRevenue(BigDecimal.ZERO);
                        }
                        ss.setSalesToday(ss.getSalesToday() + qty);
                        ss.setRevenue(ss.getRevenue() != null ? ss.getRevenue().add(total) : total);
                        categorySalesMap.put(category, ss);
                    }
                } catch (Exception e) {}
            }

            List<ServiceSale> dynamicServiceSales = categorySalesMap.values().stream()
                    .filter(s -> s.getSalesToday() > 0 || (s.getServiceName() != null && !s.getServiceName().equals("Other")))
                    .sorted((a, b) -> (b.getRevenue() != null ? b.getRevenue() : BigDecimal.ZERO)
                            .compareTo(a.getRevenue() != null ? a.getRevenue() : BigDecimal.ZERO))
                    .collect(Collectors.toList());

            Map<String, Object> data = new HashMap<>();
            data.put("inventory", inventoryList);
            data.put("serviceSales", dynamicServiceSales);
            data.put("recentBills", allBills.stream().limit(5).collect(Collectors.toList()));
            
            long pendingOrdersCount = pendingOrderRepository.findByCompletedFalseOrderByCreatedAtDesc().size();

            // Fetch opening balance from DailyLedger
            BigDecimal openingBalance = BigDecimal.ZERO;
            Optional<DailyLedger> todayLedger = dailyLedgerRepository.findByTransactionDate(today);
            if (todayLedger.isPresent()) {
                openingBalance = todayLedger.get().getOpeningBalance() != null ? todayLedger.get().getOpeningBalance() : BigDecimal.ZERO;
            }

            BigDecimal cashInHand = openingBalance.add(dailyIncome).subtract(dailyExpenses);

            Map<String, Object> stats = new HashMap<>();
            stats.put("dailyIncome", "₹" + String.format("%.2f", dailyIncome));
            stats.put("dailyExpenses", "₹" + String.format("%.2f", dailyExpenses));
            stats.put("netProfit", "₹" + String.format("%.2f", netProfit));
            stats.put("totalPendingDebt", totalPendingDebt.compareTo(BigDecimal.ZERO) > 0 ? "₹" + String.format("%.2f", totalPendingDebt) : null);
            stats.put("pendingOrders", pendingOrdersCount);
            stats.put("openingBalance", "₹" + String.format("%.2f", openingBalance));
            stats.put("cashInHand", "₹" + String.format("%.2f", cashInHand));
            
            data.put("stats", stats);
            return ResponseEntity.ok(data);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> err = new HashMap<>();
            err.put("error", "Dashboard loading failed: " + e.toString());
            return ResponseEntity.status(500).body(err);
        }
    }

    @PostMapping("/opening-balance")
    public ResponseEntity<?> setOpeningBalance(@RequestBody Map<String, BigDecimal> payload) {
        try {
            BigDecimal amount = payload.get("amount");
            if (amount == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Amount is required"));
            }

            LocalDate today = LocalDate.now(java.time.ZoneId.of("Asia/Kolkata"));
            DailyLedger ledger = dailyLedgerRepository.findByTransactionDate(today)
                    .orElseGet(() -> {
                        DailyLedger nl = new DailyLedger();
                        nl.setTransactionDate(today);
                        nl.setTotalIncome(BigDecimal.ZERO);
                        nl.setTotalExpenses(BigDecimal.ZERO);
                        nl.setNetProfit(BigDecimal.ZERO);
                        return nl;
                    });
            
            ledger.setOpeningBalance(amount);

            // Sync today's totals while we are at it
            try {
                LocalDateTime startOfDay = today.atStartOfDay();
                LocalDateTime endOfDay = today.atTime(LocalTime.MAX);
                
                BigDecimal billIncome = billRepository.findAll().stream()
                        .filter(b -> b.getCreatedAt() != null && b.getCreatedAt().toLocalDate().isEqual(today))
                        .map(Bill::getGrandTotal)
                        .filter(Objects::nonNull)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                
                BigDecimal smallIncome = smallIncomeRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(startOfDay, endOfDay).stream()
                        .map(com.malar.backend.entity.SmallIncome::getAmount)
                        .filter(Objects::nonNull)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                
                BigDecimal totalIncome = billIncome.add(smallIncome);
                
                BigDecimal totalExpenses = expenseRepository.findAll().stream()
                        .filter(e -> e.getCreatedAt() != null && e.getCreatedAt().toLocalDate().isEqual(today))
                        .map(Expense::getAmount)
                        .filter(Objects::nonNull)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                
                ledger.setTotalIncome(totalIncome);
                ledger.setTotalExpenses(totalExpenses);
                ledger.setNetProfit(totalIncome.subtract(totalExpenses));
            } catch (Exception e) {
                System.err.println("Ledger sync warning: " + e.getMessage());
            }

            dailyLedgerRepository.save(ledger);

            return ResponseEntity.ok(Map.of("message", "Opening balance updated successfully", "openingBalance", amount));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/historical")
    public ResponseEntity<?> getHistoricalData() {
        try {
            List<Bill> allBills = billRepository.findAll();
            List<Expense> allExpenses = expenseRepository.findAll();
            List<com.malar.backend.entity.SmallIncome> allSmallIncomes = smallIncomeRepository.findAll();

            // TreeMap with reverse order to have newest dates first
            Map<LocalDate, Map<String, BigDecimal>> dayMap = new TreeMap<>(Collections.reverseOrder());

            for (Bill b : allBills) {
                if (b.getCreatedAt() == null) continue;
                LocalDate date = b.getCreatedAt().toLocalDate();
                dayMap.putIfAbsent(date, createDayMap());
                dayMap.get(date).merge("income", b.getGrandTotal() != null ? b.getGrandTotal() : BigDecimal.ZERO, BigDecimal::add);
            }

            for (com.malar.backend.entity.SmallIncome si : allSmallIncomes) {
                if (si.getCreatedAt() == null) continue;
                LocalDate date = si.getCreatedAt().toLocalDate();
                dayMap.putIfAbsent(date, createDayMap());
                dayMap.get(date).merge("income", si.getAmount() != null ? si.getAmount() : BigDecimal.ZERO, BigDecimal::add);
            }

            for (Expense e : allExpenses) {
                if (e.getCreatedAt() == null) continue;
                LocalDate date = e.getCreatedAt().toLocalDate();
                dayMap.putIfAbsent(date, createDayMap());
                dayMap.get(date).merge("expense", e.getAmount() != null ? e.getAmount() : BigDecimal.ZERO, BigDecimal::add);
            }

            // Add Opening Balances from DailyLedger
            List<DailyLedger> allLedgers = dailyLedgerRepository.findAll();
            for (DailyLedger l : allLedgers) {
                LocalDate date = l.getTransactionDate();
                dayMap.putIfAbsent(date, createDayMap());
                dayMap.get(date).put("openingBalance", l.getOpeningBalance() != null ? l.getOpeningBalance() : BigDecimal.ZERO);
            }

            List<Map<String, Object>> result = new ArrayList<>();
            for (Map.Entry<LocalDate, Map<String, BigDecimal>> entry : dayMap.entrySet()) {
                Map<String, Object> row = new HashMap<>();
                row.put("date", entry.getKey().toString());
                BigDecimal income = entry.getValue().get("income");
                BigDecimal expense = entry.getValue().get("expense");
                BigDecimal openingBalance = entry.getValue().getOrDefault("openingBalance", BigDecimal.ZERO);
                
                row.put("income", income);
                row.put("expense", expense);
                row.put("openingBalance", openingBalance);
                row.put("netProfit", income.subtract(expense));
                row.put("cashInHand", openingBalance.add(income).subtract(expense));
                result.add(row);
            }

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Historical data load failed: " + e.getMessage()));
        }
    }

    private Map<String, BigDecimal> createDayMap() {
        Map<String, BigDecimal> m = new HashMap<>();
        m.put("income", BigDecimal.ZERO);
        m.put("expense", BigDecimal.ZERO);
        return m;
    }
}


