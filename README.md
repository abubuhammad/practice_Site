# Exam Practice Site - Microsoft Style

A professional exam practice platform replicating the Microsoft certification exam experience.

## Features

- 🔐 User authentication (Email/Password + Google OAuth)
- 📚 Exam catalog with Azure (AZ), Data & AI (DP), Security (SC) paths
- ⏱️ Microsoft-style exam interface with timer
- ✅ Multiple question types (single choice, multiple choice, case studies)
- 📊 Review screen with question status grid
- 🎯 Detailed results and performance tracking
- 👨‍💼 Admin panel for question/exam management
- 📥 Bulk import questions (CSV/JSON)

## Tech Stack

- **Frontend:** React + Tailwind CSS
- **Backend:** Node.js + Express
- **Database:** MySQL (XAMPP)
- **Authentication:** JWT + bcrypt

## Prerequisites

- Node.js (v16 or higher)
- XAMPP (for MySQL)
- Git

## Installation

### 1. Start XAMPP
- Right-click XAMPP Control Panel → "Run as Administrator"
- Start Apache and MySQL services

### 2. Create Database
```sql
CREATE DATABASE exam_practice_db;
```

### 3. Install Backend Dependencies
```bash
cd backend
npm install
```

### 4. Configure Backend Environment
Create `backend/.env`:
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=exam_practice_db
JWT_SECRET=your_jwt_secret_key_here
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 5. Initialize Database
```bash
cd backend
npm run db:init
npm run db:seed
```

### 6. Install Frontend Dependencies
```bash
cd frontend
npm install
```

### 7. Configure Frontend Environment
Create `frontend/.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
```

## Running the Application

### Start Backend
```bash
cd backend
npm run dev
```
Backend runs on http://localhost:5000

### Start Frontend
```bash
cd frontend
npm start
```
Frontend runs on http://localhost:3000

## Default Admin Account

After seeding the database:
- **Email:** admin@example.com
- **Password:** Admin123!

## Project Structure

```
practice-site/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── scripts/
│   ├── utils/
│   └── server.js
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── utils/
│   │   └── App.js
│   └── package.json
└── README.md
```

## API Documentation

See `spec-enhanced.md` for complete API documentation.

## License

MIT