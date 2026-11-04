Kutumbh FMS — Family Management System & Census Engine

A production-grade, enterprise-ready digital census and family lifecycle management engine. Engineered with clean layered architecture, strict Object-Oriented domain services, and multi-document ACID transactions via MongoDB Client Sessions.

🏛️ System Architecture

The core API follows a decoupled, Clean Layered Architecture strictly enforcing Separation of Concerns (SoC) and DRY (Don't Repeat Yourself) principles:

[ HTTP Request ]
       │
       ▼
[ Security Middlewares ]  ───► Helmet, CORS, Rate Limiting (100 req / 15 min)
       │
       ▼
[ Routing Layer ]         ───► `src/routes/` (URL definitions & mapping)
       │
       ▼
[ Controller Layer ]      ───► `src/controllers/` (HTTP orchestration, DTO mapping)
       │
       ▼
[ Service Layer (OOP) ]   ───► `src/services/` (ACID Transactions, Domain logic)
       │
       ▼
[ Data Access Layer ]     ───► `src/models/` (Mongoose Schemas, Virtuals, Indexes)
       │
       ▼
[ Central Error Handler ] ───► Standardized API Response Contract


✨ Key Features & Technical Standards

Multi-Document ACID Transactions: Uses mongoose.startSession() and session.withTransaction() for atomic family and member bulk registration with automatic rollback on partial failures.

Cryptographic Token Generator: Generates zero-collision, collision-resistant reference IDs (BAL-YYYY-XXXXXX) using native Node.js crypto.

Relational Integrity in NoSQL: Implements Mongoose virtual population for bidirectional parent-child mapping (Family -> Members) without duplicate embedded storage.

Resilient Database Singleton: Thread-safe MongoDB connection pool with automated reconnect listeners and clean graceful termination on SIGINT / SIGTERM.

Shift-Left CI/CD Pipeline: Automated GitHub Actions matrix workflow verifying build integrity against Node.js versions (18.x, 20.x) with ephemeral MongoDB test containers.

🛠️ Tech Stack

Runtime: Node.js (ES6+)

Framework: Express.js

Database: MongoDB Atlas / Local MongoDB with Mongoose ODM

Security: Helmet, CORS, Express-Rate-Limit, Crypto

DevOps: Git, GitHub Actions (CI/CD Matrix), Nodemon

📂 Project Structure

kutumbh-fms/
├── .github/
│   └── workflows/
│       └── ci.yml               # GitHub Actions CI matrix workflow
├── src/
│   ├── config/
│   │   └── db.js                # Singleton MongoDB connection with lifecycle handlers
│   ├── controllers/
│   │   └── familyController.js  # HTTP request orchestrator
│   ├── middlewares/
│   │   └── errorMiddleware.js   # Centralized error mapping and formatting
│   ├── models/
│   │   ├── Family.js            # Household master schema & virtual relations
│   │   └── Member.js            # Citizen demographic & lineage schema
│   ├── routes/
│   │   └── familyRoutes.js      # Public and protected API route declarations
│   ├── services/
│   │   └── familyService.js     # ACID transaction domain business logic
│   ├── utils/
│   │   ├── apiResponse.js       # Consistent JSON response factory
│   │   └── tokenGenerator.js    # Cryptographic reference generator
│   ├── app.js                   # Express application setup & middleware stack
│   └── server.js                # HTTP bootstrap & graceful shutdown handler
├── .env.example                 # Environment configuration template
├── .gitignore                   # Ignored files (node_modules, .env)
├── package.json
└── README.md


🚀 Getting Started

Prerequisites

Node.js >= 18.0.0

MongoDB instance (Local Community Server or MongoDB Atlas cluster)

Installation

Clone the repository:

git clone https://github.com/praveenk08/kutumbh-fms.git
cd kutumbh-fms


Install dependencies:

npm install


Configure environment variables:

cp .env.example .env


Update .env with your credentials:

PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/kutumbh_fms?retryWrites=true&w=majority


Start the development server:

npm run dev

🛡️ License
This project is licensed under the MIT License.