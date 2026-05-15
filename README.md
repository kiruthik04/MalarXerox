<div align="center">
  <img src="https://readme-typing-svg.herokuapp.com?font=Fira+Code&weight=700&size=40&pause=1000&color=2563EB&center=true&vCenter=true&width=600&lines=Malar+Xerox+Platform;Premium+Storefront;Comprehensive+Management;Secure+%26+Reliable" alt="Typing SVG" />
  <p><strong>A Modern Full-Stack Web Application for Shop Management & Operations</strong></p>
</div>

<br/>

<div align="center">
  <img src="https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react" />
  <img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" />
  <img src="https://img.shields.io/badge/Spring_Boot-F2F4F9?style=for-the-badge&logo=spring-boot" />
  <img src="https://img.shields.io/badge/Java-ED8B00?style=for-the-badge&logo=java&logoColor=white" />
  <img src="https://img.shields.io/badge/JWT-Black?style=for-the-badge&logo=JSON%20web%20tokens" />
</div>

<br/>

## 📖 Overview

Malar Xerox is a comprehensive, full-stack management platform designed to digitize and streamline operations for a modern copy, print, and e-services shop. It provides a beautiful, responsive public storefront for customers, paired with a powerful, secure administrative dashboard for the staff.

<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" width="100%" />

## ✨ Key Features

### 🛍️ Public Storefront
- **Dynamic Services Catalog**: Beautiful, animated grid showcasing Printouts, Government E-Services, and more.
- **Responsive Design**: Flawless experience across mobile, tablet, and desktop devices.
- **Micro-Animations**: Hover effects, floating icons, and a smooth marquee for a premium feel.

### 🛡️ Secure Backend
- **Role-Based Access Control (RBAC)**: Distinct permissions for `ADMIN` and `EMPLOYEE` roles.
- **JWT Authentication**: Stateless, secure endpoint protection.
- **Transactional Integrity**: Critical database operations (like billing + inventory updates) are atomic to prevent data corruption.

### 💼 Administrative Dashboard
- **🧾 Billing & PDF Generation**: Create bills, auto-calculate totals, and instantly generate printable PDF receipts with UPI QR codes.
- **📦 Inventory Management**: Track stock levels with real-time low-stock alerts.
- **💰 Expense & Supplier Tracking**: Record daily expenses and automatically deduct payments from supplier balances.
- **🤝 Customer Debts**: Track pending payments, filter records, and settle multiple debts into a single combined bill.
- **📊 Daily Accounting Analytics**: Visual charts and tables tracking income, expenses, and net profit day-by-day.
- **⏰ Pending Orders**: Task tracking and reminders for staff.

<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" width="100%" />

## 🏗️ Architecture

The application is split into two main components:

### Frontend (`/malar-frontend`)
- **Framework**: React.js with Vite for blazing fast builds.
- **Styling**: Custom CSS with CSS Variables for consistent theming and micro-animations.
- **Icons**: Lucide React.
- **API Service**: Centralized `api.js` for intercepting requests and injecting auth tokens.

### Backend (`/malar-backend`)
- **Framework**: Spring Boot (Java).
- **Security**: Spring Security + jjwt for token management.
- **Data Access**: Spring Data JPA.
- **Service Layer**: Decoupled business logic ensuring transactional boundaries (`@Transactional`).

<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" width="100%" />

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Java 17+
- Maven

### 1. Start the Backend
Navigate to the backend directory and run the Spring Boot application:
```bash
cd malar-backend
mvn spring-boot:run
```
*The backend runs on `http://localhost:8080` by default.*

### 2. Start the Frontend
In a new terminal, navigate to the frontend directory, install dependencies, and start the Vite dev server:
```bash
cd malar-frontend
npm install
npm run dev
```
*The frontend runs on `http://localhost:5173` by default.*

<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" width="100%" />

## 🔒 Security Posture
- All API routes (except storefront public routes) are protected.
- Staff members (`EMPLOYEE` role) cannot access sensitive analytics, employee management, or supplier configuration.
- Passwords are encrypted before database insertion.

---
<div align="center">
  <sub>Built with ❤️ by the Malar Xerox Development Team</sub>
</div>
