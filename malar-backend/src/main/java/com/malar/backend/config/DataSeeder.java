package com.malar.backend.config;

import com.malar.backend.entity.Inventory;
import com.malar.backend.entity.ServiceSale;
import com.malar.backend.entity.User;
import com.malar.backend.repository.InventoryRepository;
import com.malar.backend.repository.ServiceSaleRepository;
import com.malar.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;

@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private ServiceSaleRepository serviceSaleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Seed Users if empty
        if (userRepository.count() == 0) {
            User admin = new User();
            admin.setUsername("admin");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setRole("ADMIN");
            userRepository.save(admin);

            User employee = new User();
            employee.setUsername("employee");
            employee.setPassword(passwordEncoder.encode("emp123"));
            employee.setRole("EMPLOYEE");
            userRepository.save(employee);
            System.out.println("Seeded Default Users: admin/admin123 and employee/emp123");
        }

        // Seed Inventory if empty
        if (inventoryRepository.count() == 0) {
            inventoryRepository.save(createInventory("A4 Paper Reams (JK)", 154, new BigDecimal("220.00")));
            inventoryRepository.save(createInventory("SBI FASTag Kits", 12, new BigDecimal("100.00")));
            inventoryRepository.save(createInventory("Classmate Notebooks", 85, new BigDecimal("45.00")));
            inventoryRepository.save(createInventory("Epson Ink Bottles (Black)", 2, new BigDecimal("4500.00")));
            System.out.println("Seeded Default Inventory");
        }

        // Seed Service Sales if empty
        if (serviceSaleRepository.count() == 0) {
            serviceSaleRepository.save(createSale("Government E-Services", "FileSignature", 14, new BigDecimal("1400.00")));
            serviceSaleRepository.save(createSale("Printouts (All Types)", "Printer", 128, new BigDecimal("850.00")));
            serviceSaleRepository.save(createSale("Bulk Photocopying", "Copy", 45, new BigDecimal("1250.00")));
            serviceSaleRepository.save(createSale("AADHAR Update", "Smartphone", 8, new BigDecimal("400.00")));
            serviceSaleRepository.save(createSale("Child AADHAR", "Users", 3, new BigDecimal("150.00")));
            System.out.println("Seeded Default Service Sales");
        }
    }

    private Inventory createInventory(String name, int qty, BigDecimal price) {
        Inventory inv = new Inventory();
        inv.setItemName(name);
        inv.setStockQuantity(qty);
        inv.setUnitPrice(price);
        return inv;
    }

    private ServiceSale createSale(String name, String category, int sales, BigDecimal revenue) {
        ServiceSale s = new ServiceSale();
        s.setServiceName(name);
        s.setCategory(category);
        s.setSalesToday(sales);
        s.setRevenue(revenue);
        return s;
    }
}
