package com.malar.backend.config;

import com.malar.backend.entity.ServiceSale;
import com.malar.backend.repository.ServiceSaleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;

@Component
public class DataLoader implements CommandLineRunner {

    @Autowired
    private ServiceSaleRepository serviceSaleRepository;

    @Override
    public void run(String... args) throws Exception {
        seedServices();
    }

    private void seedServices() {
        if (serviceSaleRepository.count() > 0) {
            // Already seeded or data exists, maybe just add missing ones
            // For simplicity, we can just check if specific ones exist
        }

        List<ServiceData> servicesToAdd = Arrays.asList(
            // Printouts
            new ServiceData("A0 - A2 Map Prints", "Printer", "Printouts", null),
            new ServiceData("A0 - A4 Photoprints", "Printer", "Printouts", null),
            new ServiceData("13 * 19 300 GSM Board Printout", "Printer", "Printouts", null),
            new ServiceData("13 * 19 170 GSM Art Sheet Printout", "Printer", "Printouts", null),
            new ServiceData("13 * 19 Sticker Sheet Printout", "Printer", "Printouts", null),
            new ServiceData("A4 B/W and Colour Printout", "Printer", "Printouts", null),
            new ServiceData("A4 300 GSM Board Printout", "Printer", "Printouts", null),
            new ServiceData("A4 170 GSM Art Sheet Printout", "Printer", "Printouts", null),
            new ServiceData("A4 Sticker Sheet Printout", "Printer", "Printouts", null),
            new ServiceData("Spiral Binding", "FileText", "Printouts", null),
            new ServiceData("Calico binding", "FileText", "Printouts", null),
            new ServiceData("Hard Binding", "FileText", "Printouts", null),
            new ServiceData("Silver Hard Binding", "FileText", "Printouts", null),
            new ServiceData("Silver Soft Binding", "FileText", "Printouts", null),
            new ServiceData("Gold Hard Binding", "FileText", "Printouts", null),
            new ServiceData("Gold Soft Binding", "FileText", "Printouts", null),
            new ServiceData("Chart Binding", "FileText", "Printouts", null),
            new ServiceData("All kinds of Binding", "FileText", "Printouts", null),

            // Government E-Services
            new ServiceData("Community Certificate", "FileSignature", "Government E-Services", "Required Docs: AADHAR card, Photo, Father/Mother Community Certificate"),
            new ServiceData("Nativity Certificate", "FileSignature", "Government E-Services", "Required Docs: AADHAR card, Birth Certificate, Photo"),
            new ServiceData("Income Certificate", "FileSignature", "Government E-Services", "Required Docs: AADHAR card, Ration Card, Photo"),
            new ServiceData("First Graduate Certificate", "FileSignature", "Government E-Services", "Required Docs: AADHAR card, TC"),
            new ServiceData("OBC Certificate", "FileSignature", "Government E-Services", "Required Docs: AADHAR card, Community Certificate, Income Certificate, Photo"),
            new ServiceData("Legal Heir Certificate", "FileSignature", "Government E-Services", "Required Docs: All Family members AADHAR card, Ration Card"),
            new ServiceData("Widow Certificate", "FileSignature", "Government E-Services", "Required Docs: Death Certificate, AADHAR card, Ration Card"),

            // AADHAR Update
            new ServiceData("Aadhar Address & Phone Number Update", "Users", "AADHAR Update", null),

            // Ration Card Update
            new ServiceData("Ration Card Phone number change", "Users", "Ration Card Update", null),
            new ServiceData("Ration Card Address change", "Users", "Ration Card Update", null),
            new ServiceData("Ration Card Family Head change", "Users", "Ration Card Update", null),
            new ServiceData("Ration Card Member Removal", "Users", "Ration Card Update", null),
            new ServiceData("Ration Card Member Addition", "Users", "Ration Card Update", null),

            // Police
            new ServiceData("Police Verification", "ShieldCheck", "Police Services", null),
            new ServiceData("Police Compliant Filing", "ShieldCheck", "Police Services", null),

            // FASTag
            new ServiceData("FASTag", "CreditCard", "FASTag", "Required Docs: Vehicle RC, AADHAR card, Photo")
        );

        for (ServiceData data : servicesToAdd) {
            if (!serviceSaleRepository.existsByServiceName(data.serviceName)) {
                ServiceSale service = new ServiceSale();
                service.setServiceName(data.serviceName);
                service.setIconName(data.iconName);
                service.setCategory(data.category);
                service.setRequirements(data.requirements);
                service.setSalesToday(0);
                service.setRevenue(BigDecimal.ZERO);
                serviceSaleRepository.save(service);
            } else {
                // Update category and requirements if it already exists
                ServiceSale existing = serviceSaleRepository.findByServiceName(data.serviceName);
                if (existing != null) {
                    boolean updated = false;
                    if (existing.getCategory() == null || !existing.getCategory().equals(data.category)) {
                        existing.setCategory(data.category);
                        updated = true;
                    }
                    if (existing.getRequirements() == null || !existing.getRequirements().equals(data.requirements)) {
                        existing.setRequirements(data.requirements);
                        updated = true;
                    }
                    if (updated) {
                        serviceSaleRepository.save(existing);
                    }
                }
            }
        }
    }

    private static class ServiceData {
        String serviceName;
        String iconName;
        String category;
        String requirements;

        ServiceData(String serviceName, String iconName, String category, String requirements) {
            this.serviceName = serviceName;
            this.iconName = iconName;
            this.category = category;
            this.requirements = requirements;
        }
    }
}
