package com.malar.backend.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "service_sales")
public class ServiceSale {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String serviceName;
    private String iconName; // e.g. "FileSignature", "Printer"
    private String category;
    
    @Column(length = 1000)
    private String requirements;
    
    private int salesToday;
    private BigDecimal revenue;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getServiceName() { return serviceName; }
    public void setServiceName(String serviceName) { this.serviceName = serviceName; }

    public String getIconName() { return iconName; }
    public void setIconName(String iconName) { this.iconName = iconName; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getRequirements() { return requirements; }
    public void setRequirements(String requirements) { this.requirements = requirements; }

    public int getSalesToday() { return salesToday; }
    public void setSalesToday(int salesToday) { this.salesToday = salesToday; }

    public BigDecimal getRevenue() { return revenue; }
    public void setRevenue(BigDecimal revenue) { this.revenue = revenue; }
}
