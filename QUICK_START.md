# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Install Dependencies (2 minutes)

```powershell
# Backend
Set-Location "c:\Users\Arome\Documents\APPS\practice-site\backend"
npm install

# Frontend
Set-Location "c:\Users\Arome\Documents\APPS\practice-site\frontend"
npm install
```

### 2. Configure Database (1 minute)

Create `backend/.env`:
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=exam_practice_db
JWT_SECRET=your_secret_key_here
```

### 3. Initialize Database (1 minute)

```powershell
Set-Location "c:\Users\Arome\Documents\APPS\practice-site"
node backend/scripts/initDatabase.js
node backend/scripts/seedDatabase.js
```

### 4. Start Servers (1 minute)

**Terminal 1 - Backend:**
```powershell
Set-Location "c:\Users\Arome\Documents\APPS\practice-site\backend"
node server.js
```

**Terminal 2 - Frontend:**
```powershell
Set-Location "c:\Users\Arome\Documents\APPS\practice-site\frontend"
npm start
```

### 5. Open Browser

Navigate to: **http://localhost:3000**

---

## 🔑 Demo Accounts

### Regular User
- **Email:** user@example.com
- **Password:** user123

### Admin User
- **Email:** admin@example.com
- **Password:** admin123

---

## 📚 Sample Exams Available

1. **AZ-900: Microsoft Azure Fundamentals**
   - Duration: 60 minutes
   - Questions: 10
   - Passing Score: 700

2. **AZ-104: Microsoft Azure Administrator**
   - Duration: 120 minutes
   - Questions: 8
   - Passing Score: 700

3. **DP-900: Microsoft Azure Data Fundamentals**
   - Duration: 60 minutes
   - Questions: 5
   - Passing Score: 700

---

## 🧪 Quick Test Flow

1. **Login** → Use demo account
2. **Dashboard** → See available exams
3. **Browse Exams** → Click on AZ-900
4. **Start Exam** → Begin practice test
5. **Take Exam** → Answer questions
6. **Submit** → View results
7. **History** → See all attempts

---

## 🎯 Key Features to Test

- ✅ Timer countdown with warnings
- ✅ Mark questions for review
- ✅ Review screen before submit
- ✅ Auto-save answers
- ✅ Detailed results with explanations
- ✅ Attempt history with filtering
- ✅ Pass/fail status
- ✅ Score calculation

---

## 🐛 Common Issues

**Port already in use:**
```powershell
# Change PORT in backend/.env to 5001
# Update proxy in frontend/package.json to http://localhost:5001
```

**Database connection error:**
```powershell
# Verify MySQL is running
# Check credentials in .env
```

**Frontend won't start:**
```powershell
# Delete node_modules and package-lock.json
# Run npm install again
```

---

## 📞 Need Help?

Check the full **SETUP_GUIDE.md** for detailed instructions and troubleshooting.

---

**Happy Testing! 🎉**