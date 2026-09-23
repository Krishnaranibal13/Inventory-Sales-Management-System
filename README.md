<div align="center">

# 📦 Inventory & Sales Management System

### A modern full-stack inventory platform for managing products, suppliers, purchases, sales, stock, and user accounts — all from one dashboard.

<p>
  <img src="https://img.shields.io/badge/Python-3.13+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/FastAPI-0.1+-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/React-TypeScript-3178C6?style=for-the-badge&logo=react&logoColor=white" alt="React TypeScript">
  <img src="https://img.shields.io/badge/MySQL-8.0+-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL">
</p>

<p>
  <img src="https://img.shields.io/badge/Vite-React-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/Tailwind_CSS-3+-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/Lucide-Icons-F56565?style=for-the-badge&logo=lucide&logoColor=white" alt="Lucide">
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License">
</p>

<p>
  <strong>Products • Suppliers • Purchases • Sales • Reports • Dashboard • Authentication</strong>
</p>

<p>
    <a href="https://resourceful-radiance-production-0f74.up.railway.app">
        <img src="https://img.shields.io/badge/🚀_Live_Demo-Open_Application-8B5CF6?style=for-the-badge" alt="Live Demo">
    </a>
</p>

</div>

---

## ✨ Overview

**Inventory & Sales Management System** is a full-stack business management application designed to simplify day-to-day inventory and sales operations.

The system connects a **React + TypeScript frontend**, a **FastAPI backend**, and a **MySQL relational database** to provide a clean workflow for managing stock and business transactions.

Instead of maintaining inventory, purchases, and sales separately, the application keeps the complete flow connected:

```text
Supplier
   │
   ▼
Purchase ───────► Product Stock ◄─────── Sale
                     │
                     ▼
                Dashboard
                     │
                     ▼
                  Reports
```

The project was built with a focus on **real CRUD operations, relational database design, transaction handling, API integration, authentication, and a professional dashboard experience**.

---

## 🎯 Why This Project?

Managing inventory manually can quickly become difficult when products, suppliers, purchases, sales, and stock levels start growing.

This application addresses that workflow by providing:

- 📦 Centralized product management
- 🚚 Supplier management
- 🛒 Purchase and stock-in management
- 💰 Sales and stock-out management
- ⚠️ Low-stock monitoring
- 📊 Sales and purchase reports
- 👤 User authentication and profile management
- 🔐 Password hashing and JWT-based sessions
- 🖥️ Responsive dashboard-style frontend

---

# 🚀 Core Features

## 📦 Product Management

Manage the complete product catalog from one place.

- Add products
- View products
- Search products
- Update product information
- Delete products
- Track current stock quantity
- Configure reorder levels
- Assign suppliers
- View low-stock products
- Product details modal

---

## 🚚 Supplier Management

Keep supplier information organized and connected with inventory.

- Add suppliers
- View supplier list
- Search suppliers
- Update supplier details
- Delete suppliers
- Store company information
- Store phone and email
- Link suppliers with products and purchases

---

## 🛒 Purchase Management

Record incoming stock and automatically update inventory.

- Create purchases
- Select supplier
- Add multiple products
- Set purchase quantity
- Set unit cost
- Calculate purchase totals
- Store purchase history
- View individual purchase details
- Automatically increase product stock

### Purchase Flow

```text
Select Supplier
      │
      ▼
Add Products
      │
      ▼
Set Quantity + Unit Cost
      │
      ▼
Create Purchase
      │
      ▼
Database Transaction
      │
      ▼
Increase Product Stock
```

---

## 💰 Sales Management

Record sales while keeping stock synchronized.

- Create sales
- Add multiple products
- Specify customer name
- Set quantities
- Validate available stock
- Calculate sale totals
- Store sales history
- View individual sale details
- Automatically decrease product stock

### Sales Flow

```text
Select Products
      │
      ▼
Enter Quantities
      │
      ▼
Check Available Stock
      │
      ▼
Create Sale
      │
      ▼
Database Transaction
      │
      ▼
Decrease Product Stock
```

---

## ⚠️ Low Stock Monitoring

The system continuously uses each product's **reorder level** to identify products that need restocking.

Example:

```text
Product Stock = 5
Reorder Level = 10

→ Low Stock Alert
```

This makes it easier to identify inventory that requires attention.

---

# 📊 Dashboard

The dashboard provides a centralized view of business activity.

### Dashboard includes

- Total products
- Stock overview
- Sales overview
- Recent sales
- Low-stock information
- Period-based sales view
- Quick navigation to management modules

The dashboard is designed to provide an at-a-glance view before entering individual modules.

---

# 📈 Reports

The reporting section provides access to business transaction data.

### Sales Reports

- Sales history
- Sale details
- Transaction totals
- Customer information
- Product-wise sale items

### Purchase Reports

- Purchase history
- Purchase details
- Supplier information
- Product-wise purchase items

---

# 🔐 Authentication & User Management

The application includes a complete authentication flow.

### Authentication Features

- 👤 User registration
- 🔑 User login
- 🎫 JWT access tokens
- 🔒 Password hashing using Argon2
- 🛡️ Protected profile endpoints
- 👨‍💼 User role field
- 🟢 Active/inactive account status
- ✏️ Profile update
- 🔐 Password change
- 🚪 Sign out
- 💾 Remember-session support on the frontend

### Authentication Flow

```text
Register / Login
       │
       ▼
FastAPI Authentication API
       │
       ▼
Password Verification
       │
       ▼
JWT Access Token
       │
       ▼
Frontend Token Storage
       │
       ▼
Authenticated API Requests
```

---

# 🏗️ System Architecture

```text
┌───────────────────────────────────────────────┐
│                 FRONTEND                      │
│                                               │
│        React + TypeScript + Vite              │
│        Tailwind CSS + Lucide React            │
│                                               │
│  Dashboard | Products | Suppliers | Sales     │
│  Purchases | Reports | Settings | Profile     │
└───────────────────────┬───────────────────────┘
                        │
                        │ REST API / JSON
                        ▼
┌───────────────────────────────────────────────┐
│                  BACKEND                      │
│                                               │
│                    FastAPI                    │
│                                               │
│  Product API | Supplier API | Purchase API    │
│  Sales API   | Reports API   | Auth API       │
└───────────────────────┬───────────────────────┘
                        │
                        │ SQL
                        ▼
┌───────────────────────────────────────────────┐
│                  DATABASE                     │
│                                               │
│                    MySQL 8                    │
│                                               │
│ Products | Suppliers | Purchases | Sales      │
│ Purchase Items | Sale Items | Users           │
└───────────────────────────────────────────────┘
```

---

# 🗄️ Database Design

The application uses a relational MySQL database.

### Main Tables

| Table | Purpose |
|---|---|
| `users` | Application users and authentication data |
| `products` | Product catalog and stock |
| `suppliers` | Supplier information |
| `purchases` | Purchase transactions |
| `purchase_items` | Products included in purchases |
| `sales` | Sales transactions |
| `sale_items` | Products included in sales |

### Relationship Overview

```text
                 ┌──────────────┐
                 │   SUPPLIERS  │
                 └──────┬───────┘
                        │
                        │
              ┌─────────▼─────────┐
              │     PRODUCTS      │
              └───────┬─────┬─────┘
                      │     │
             ┌────────┘     └────────┐
             ▼                       ▼
      ┌─────────────┐         ┌─────────────┐
      │   PURCHASE  │         │     SALE    │
      └──────┬──────┘         └──────┬──────┘
             │                       │
             ▼                       ▼
      ┌─────────────┐         ┌─────────────┐
      │PURCHASE_ITEM│         │  SALE_ITEM  │
      └─────────────┘         └─────────────┘

                 ┌──────────────┐
                 │    USERS     │
                 └──────────────┘
```

---

# 🔄 Inventory Logic

One of the important parts of the project is automatic stock synchronization.

### When a purchase is created

```text
Purchase Quantity
       +
Current Stock
       │
       ▼
Updated Stock
```

### When a sale is created

```text
Current Stock
       -
Sale Quantity
       │
       ▼
Updated Stock
```

Before completing a sale, the backend validates that enough stock is available.

This prevents the application from creating a sale that exceeds available inventory.

---

# 🧩 API Endpoints

## Products

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/products` | Get all products |
| POST | `/api/products` | Create product |
| PUT | `/api/products/{product_id}` | Update product |
| DELETE | `/api/products/{product_id}` | Delete product |

## Suppliers

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/suppliers` | Get all suppliers |
| GET | `/api/suppliers/{supplier_id}` | Get supplier |
| POST | `/api/suppliers` | Create supplier |
| PUT | `/api/suppliers/{supplier_id}` | Update supplier |
| DELETE | `/api/suppliers/{supplier_id}` | Delete supplier |

## Purchases

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/purchases` | Get purchase history |
| GET | `/api/purchases/{purchase_id}` | Get purchase details |
| POST | `/api/purchases` | Create purchase |

## Sales

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/sales` | Get sales history |
| GET | `/api/sales/{sale_id}` | Get sale details |
| POST | `/api/sales` | Create sale |

## Reports

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/reports/sales` | Get sales report |

## Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |
| POST | `/api/auth/change-password` | Change password |
| POST | `/api/auth/logout` | Sign out |

---

# 🛠️ Tech Stack

### Frontend

- **React**
- **TypeScript**
- **Vite**
- **Tailwind CSS**
- **Lucide React**
- REST API integration

### Backend

- **Python**
- **FastAPI**
- **Pydantic**
- **Uvicorn**
- **mysql-connector-python**
- **python-dotenv**
- **PyJWT**
- **pwdlib / Argon2**

### Database

- **MySQL 8**

### Development Tools

- VS Code
- MySQL Workbench
- Git
- GitHub

---

# 📁 Project Structure

```text
Inventory-Sales-Management-System/
│
├── backend/
│   └── src/
│       ├── auth.py
│       ├── auth_routes.txt
│       └── requirements_auth.txt
│
├── database/
│   └── database_schema.sql
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── Profile.tsx
│   │   │   ├── Products.tsx
│   │   │   ├── Suppliers.tsx
│   │   │   ├── Purchases.tsx
│   │   │   ├── Sales.tsx
│   │   │   ├── Reports.tsx
│   │   │   └── SettingsPage.tsx
│   │   │
│   │   ├── App.tsx
│   │   ├── auth.ts
│   │   ├── settings.ts
│   │   ├── App.css
│   │   └── index.css
│   │
│   ├── package.json
│   └── vite.config.ts
│
├── src/
│   ├── api.py
│   ├── database.py
│   ├── product.py
│   ├── supplier.py
│   ├── purchase.py
│   └── sales.py
│
├── .env
├── .gitignore
└── README.md
```

> **Note:** Keep `.env` out of Git. Store database credentials and JWT secrets in environment variables.

---

# ⚙️ Installation & Setup

## 1️⃣ Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/Inventory-Sales-Management-System.git
cd Inventory-Sales-Management-System
```

---

## 2️⃣ Create virtual environment

### Windows

```powershell
python -m venv venv
venv\Scripts\activate
```

### Linux / macOS

```bash
python3 -m venv venv
source venv/bin/activate
```

---

## 3️⃣ Install backend dependencies

```bash
pip install fastapi uvicorn mysql-connector-python python-dotenv PyJWT "pwdlib[argon2]"
```

---

## 4️⃣ Configure MySQL

Create the database:

```sql
CREATE DATABASE inventory_db;
```

Then execute the project's database schema/migration SQL.

Make sure MySQL is running on:

```text
localhost:3306
```

---

## 5️⃣ Configure environment variables

Create a `.env` file in the project root:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=inventory_db

JWT_SECRET_KEY=your_secure_random_secret
JWT_EXPIRE_MINUTES=60
```

⚠️ Never commit your real `.env` file to GitHub.

---

# ▶️ Run the Backend

From the project root:

```powershell
python -m uvicorn src.api:app --reload
```

Backend:

```text
https://inventory-sales-management-system-production-a7df.up.railway.app

```

FastAPI Swagger documentation:

```text
https://inventory-sales-management-system-production-a7df.up.railway.app
/docs
```

---

# ▶️ Run the Frontend

Open another terminal:

```powershell
cd frontend
npm install
npm run dev
```

Vite will display the local frontend URL in the terminal.

---

# 🧪 Testing the Application

Recommended testing flow:

```text
Register
   ↓
Login
   ↓
Dashboard
   ↓
Add Supplier
   ↓
Add Product
   ↓
Purchase Stock
   ↓
Verify Stock Increase
   ↓
Create Sale
   ↓
Verify Stock Decrease
   ↓
Check Reports
   ↓
Check Low Stock
   ↓
Update Profile
```

---

# 🔒 Security Considerations

The application includes several basic security practices:

- Passwords are never stored as plaintext.
- Passwords are hashed using Argon2 through `pwdlib`.
- Authentication uses signed JWT access tokens.
- Protected profile endpoints require a Bearer token.
- User emails are normalized before authentication/database operations.
- Database credentials are loaded through environment variables.
- Sensitive configuration is intended to remain outside source control.

For production deployment, additional controls such as HTTPS, secure secret management, rate limiting, stronger authorization policies, logging/monitoring, and production-grade deployment configuration should be added.

---

# 🎨 UI Highlights

The frontend follows a modern dashboard-oriented design with:

- 🌙 Dark visual theme
- ✨ Gradient accents
- 🧊 Glass-style cards and panels
- 📱 Responsive layouts
- 🔎 Search and filtering
- 🪟 Detail modals
- 📊 Dashboard visualizations
- 🎛️ Application settings
- 👤 User profile management
- 🔔 Notification-oriented UI
- 🧭 Sidebar navigation

---

# 📸 Screenshots

> Add your project screenshots here after pushing the repository.

### Dashboard

```text
docs/screenshots/dashboard.png
```

### Products

```text
docs/screenshots/products.png
```

### Sales

```text
docs/screenshots/sales.png
```

### Purchases

```text
docs/screenshots/purchases.png
```

### Authentication

```text
docs/screenshots/login.png
```

A recommended screenshot structure:

```text
docs/
└── screenshots/
    ├── dashboard.png
    ├── products.png
    ├── suppliers.png
    ├── purchases.png
    ├── sales.png
    ├── reports.png
    ├── login.png
    └── profile.png
```

---

# 📌 Project Highlights

This project demonstrates practical implementation of:

```text
Python
   │
   ├── OOP
   ├── Database Connectivity
   ├── CRUD Operations
   ├── Transactions
   └── Business Logic
          │
          ▼
FastAPI
   │
   ├── REST APIs
   ├── Request Validation
   ├── Authentication
   └── API Documentation
          │
          ▼
React + TypeScript
   │
   ├── Components
   ├── State Management
   ├── API Integration
   ├── Routing/UI
   └── Dashboard
          │
          ▼
MySQL
   │
   ├── Relational Design
   ├── Foreign Keys
   ├── Constraints
   └── Transactions
```

---

# 🚧 Future Enhancements

Possible future improvements include:

- 📦 Barcode / QR code support
- 🧾 Invoice generation
- 📄 PDF report export
- 📊 Advanced analytics dashboard
- 📧 Automated email notifications
- 🔔 Automated low-stock alerts
- 👥 Role-based access control
- 📱 Mobile-friendly PWA experience
- ☁️ Cloud deployment
- 🧪 Automated unit and API testing
- 🐳 Docker support
- 📈 Advanced inventory forecasting

---

# 👨‍💻 Author

<div align="center">

### Kunal Kumar

**B.Tech — Artificial Intelligence & Data Science**

Built as a full-stack software engineering project demonstrating:

**Python • FastAPI • React • TypeScript • MySQL • REST APIs • Authentication**

</div>

---

# ⭐ Support

If you found this project useful or interesting, consider giving the repository a ⭐ on GitHub.

---

<div align="center">

### Built with Python, React, FastAPI & MySQL ❤️

**Inventory & Sales Management System**

</div>
