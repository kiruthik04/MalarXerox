<div align="center">
  <img src="https://readme-typing-svg.herokuapp.com?font=Fira+Code&weight=700&size=40&pause=1000&color=2563EB&center=true&vCenter=true&width=600&lines=Malar+Xerox+Platform;Premium+Storefront;Comprehensive+Management;Mobile+Staff+App;Secure+%26+Reliable" alt="Typing SVG" />
  <p><strong>A Modern Full-Stack Ecosystem for Shop Management & Operations</strong></p>
</div>

<br/>

<div align="center">
  <img src="https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react" />
  <img src="https://img.shields.io/badge/React_Native-Expo-61DAFB?style=for-the-badge&logo=react" />
  <img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" />
  <img src="https://img.shields.io/badge/Spring_Boot-F2F4F9?style=for-the-badge&logo=spring-boot" />
  <img src="https://img.shields.io/badge/Java-ED8B00?style=for-the-badge&logo=java&logoColor=white" />
  <img src="https://img.shields.io/badge/JWT-Black?style=for-the-badge&logo=JSON%20web%20tokens" />
</div>

<div align="center">
  <a href="https://malarxerox.vercel.app" target="_blank">
    <img src="https://img.shields.io/badge/Live_Demo-malarxerox.vercel.app-000000?style=for-the-badge&logo=vercel&logoColor=white" />
  </a>
</div>

<br/>

## 📖 Overview

Malar Xerox is a comprehensive, multi-platform management ecosystem designed to digitize and streamline operations for a modern copy, print, and e-services shop. It consists of a beautiful public storefront, a powerful web dashboard for desktop management, and a high-performance mobile application for staff on-the-go.

**🌐 Live Website:** [malarxerox.vercel.app](https://malarxerox.vercel.app)

<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" width="100%" />

## 📱 Mobile Application (`/malar-mobile`)

The staff companion app built with **React Native (Expo)** allows management of the entire shop directly from a smartphone.

- **⚡ Quick Actions**: Instantly add New Bills, Record Quick Cash, or Manage Reminders from the dashboard.
- **🧾 Smart Billing**: Mobile-optimized billing flow with manual price entry and catalog browsing.
- **💰 Financial Tracking**: View daily income, expenses, and net profit in real-time.
- **🤝 Debt Management**: Track and settle customer debts with role-based security.
- **📦 Inventory & Suppliers**: Manage stock levels and supplier balances on-the-go.
- **⏰ Staff Reminders**: Track pending orders and mark them complete instantly.
- **🔒 Secure Access**: Full JWT-based authentication with persistent sessions via `expo-secure-store`.

<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" width="100%" />

## ✨ Key Features

### 🛍️ Public Storefront
- **Dynamic Services Catalog**: Beautiful, animated grid showcasing Printouts, Government E-Services, and more.
- **Micro-Animations**: Hover effects, floating icons, and smooth transitions for a premium feel.

### 💼 Administrative Dashboard (Web & Mobile)
- **🧾 Billing & PDF**: Create bills, auto-calculate totals, and generate printable receipts.
- **📦 Inventory Management**: Track stock levels with real-time low-stock alerts.
- **💰 Expense & Supplier Tracking**: Record expenses and auto-deduct from supplier balances.
- **🤝 Customer Debts**: Track pending payments and settle multiple debts into a single bill.
- **📊 Daily Accounting**: Visual analytics tracking daily performance and cash in hand.
- **🛡️ Role-Based Security**: Strict separation between `ADMIN` and `EMPLOYEE` capabilities.

<img src="https://raw.githubusercontent.com/andreasbm/rainbow.png" width="100%" />

## 🏗️ Architecture

- **Frontend**: React.js (Web) & React Native (Mobile).
- **Backend**: Spring Boot (Java) with Spring Security & JPA.
- **Database**: PostgreSQL (Production) / H2 (Development).
- **Auth**: Stateless JWT Authentication.

<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" width="100%" />

## 🚀 Getting Started

### 1. Start the Backend
```bash
cd malar-backend
mvn spring-boot:run
```

### 2. Start the Mobile App
```bash
cd malar-mobile
npm install
npx expo start
```

### 3. Start the Web Frontend
```bash
cd malar-frontend
npm install
npm run dev
```

<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" width="100%" />

## 🔒 Security Posture
- All sensitive API routes are protected by JWT.
- Staff (`EMPLOYEE`) have restricted access—they cannot view employee management, sensitive analytics, or perform deletions.
- Mobile data is stored securely using native encryption modules.

---
<div align="center">
  <sub>Built with ❤️ by the Malar Xerox Development Team</sub>
</div>
