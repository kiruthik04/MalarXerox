package com.malar.backend.service;

import com.malar.backend.entity.Expense;
import com.malar.backend.repository.ExpenseRepository;
import com.malar.backend.repository.SupplierRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ExpenseService {

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    public List<Expense> getAll() {
        return expenseRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional
    public Expense addExpense(Expense expense) {
        expense.setCreatedAt(LocalDateTime.now(java.time.ZoneId.of("Asia/Kolkata")));
        
        if (expense.getSupplier() != null && expense.getSupplier().getId() != null) {
            supplierRepository.findById(expense.getSupplier().getId()).ifPresent(supplier -> {
                supplier.setBalance(supplier.getBalance().subtract(expense.getAmount()));
                supplierRepository.save(supplier);
            });
        }
        
        return expenseRepository.save(expense);
    }

    @Transactional
    public void deleteExpense(Long id) {
        expenseRepository.deleteById(id);
    }
}
