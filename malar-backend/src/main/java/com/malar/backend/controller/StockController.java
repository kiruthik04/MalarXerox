package com.malar.backend.controller;

import com.malar.backend.entity.Inventory;
import com.malar.backend.repository.InventoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stock")
public class StockController {

    @Autowired
    private InventoryRepository inventoryRepository;

    @GetMapping
    public ResponseEntity<List<Inventory>> getAllStock() {
        return ResponseEntity.ok(inventoryRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<Inventory> addStock(@RequestBody Inventory item) {
        return ResponseEntity.ok(inventoryRepository.save(item));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Inventory> updateStock(@PathVariable Long id, @RequestBody Inventory updatedItem) {
        return inventoryRepository.findById(id)
                .map(item -> {
                    item.setItemName(updatedItem.getItemName());
                    item.setStockQuantity(updatedItem.getStockQuantity());
                    item.setUnitPrice(updatedItem.getUnitPrice());
                    return ResponseEntity.ok(inventoryRepository.save(item));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStock(@PathVariable Long id) {
        if (inventoryRepository.existsById(id)) {
            inventoryRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}

