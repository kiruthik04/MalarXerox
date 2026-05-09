package com.malar.backend.controller;

import com.malar.backend.entity.PendingOrder;
import com.malar.backend.repository.PendingOrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pending-orders")
public class PendingOrderController {

    @Autowired
    private PendingOrderRepository pendingOrderRepository;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<PendingOrder> getAllPending() {
        return pendingOrderRepository.findByCompletedFalseOrderByCreatedAtDesc();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public PendingOrder create(@RequestBody PendingOrder order) {
        return pendingOrderRepository.save(order);
    }

    @PutMapping("/{id}/complete")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> completeOrder(@PathVariable Long id) {
        return pendingOrderRepository.findById(id)
                .map(order -> {
                    order.setCompleted(true);
                    pendingOrderRepository.save(order);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        return pendingOrderRepository.findById(id)
                .map(order -> {
                    pendingOrderRepository.delete(order);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
