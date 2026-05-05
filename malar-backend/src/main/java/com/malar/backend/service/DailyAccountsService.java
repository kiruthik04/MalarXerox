package com.malar.backend.service;

import com.malar.backend.entity.BillingTransaction;
import com.malar.backend.entity.DailyLedger;
import com.malar.backend.repository.BillingTransactionRepository;
import com.malar.backend.repository.DailyLedgerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class DailyAccountsService {

    @Autowired
    private DailyLedgerRepository dailyLedgerRepository;

    @Autowired
    private BillingTransactionRepository billingTransactionRepository;

    /**
     * Calculates the daily net profit using ACID transactions to ensure data integrity.
     */
    @Transactional
    public DailyLedger calculateDailyTally(LocalDate date) {
        List<BillingTransaction> transactions = billingTransactionRepository.findByTransactionDate(date);
        
        BigDecimal totalIncome = BigDecimal.ZERO;
        BigDecimal totalExpenses = BigDecimal.ZERO;

        for (BillingTransaction transaction : transactions) {
            if ("INCOME".equals(transaction.getType())) {
                totalIncome = totalIncome.add(transaction.getAmount());
            } else if ("EXPENSE".equals(transaction.getType())) {
                totalExpenses = totalExpenses.add(transaction.getAmount());
            }
        }

        BigDecimal netProfit = totalIncome.subtract(totalExpenses);

        Optional<DailyLedger> existingLedger = dailyLedgerRepository.findByTransactionDate(date);
        DailyLedger ledger = existingLedger.orElseGet(() -> {
            DailyLedger newLedger = new DailyLedger();
            newLedger.setTransactionDate(date);
            return newLedger;
        });

        ledger.setTotalIncome(totalIncome);
        ledger.setTotalExpenses(totalExpenses);
        ledger.setNetProfit(netProfit);

        return dailyLedgerRepository.save(ledger);
    }
}

