# Admin Dashboard Guide

## Overview
The Admin Dashboard provides a comprehensive interface for managing exams, questions, case studies, and users in the Exam Practice Platform.

## Features Implemented

### 1. **Admin Dashboard** (`/admin`)
- **Statistics Overview**: View total exams, questions, users, and attempts
- **Quick Actions**: Navigate to different management sections
- **Recent Activity**: Monitor recent exam attempts

### 2. **Exam Management** (`/admin/exams`)
- **Create Exams**: Add new certification exams with details:
  - Exam code (e.g., AZ-900)
  - Title and description
  - Certification path (AZ, DP, SC, AI, PL)
  - Time limit in minutes
  - Passing score (out of 1000)
- **Edit Exams**: Update existing exam details
- **Delete Exams**: Remove exams (also deletes associated questions and attempts)
- **View Statistics**: See question count and attempt count for each exam

### 3. **Question Management** (`/admin/questions`)
- **Create Questions**: Add questions to exams with:
  - Question text
  - Question type (Single Choice or Multiple Choice)
  - Explanation for the correct answer
  - Multiple answer options (minimum 2)
  - Mark correct answer(s)
- **Edit Questions**: Update question text, options, and explanations
- **Delete Questions**: Remove questions from exams
- **Filter by Exam**: View questions for specific exams
- **Visual Question Cards**: Easy-to-read question display with metadata

### 4. **Admin Access Control**
- Only users with `role = 'admin'` can access admin routes
- Admin badge displayed in navbar for admin users
- Protected routes redirect non-admin users to dashboard

## Getting Started

### 1. Access Admin Account

**Default Admin Credentials** (created by seed script):
- **Email**: `admin@example.com`
- **Password**: `Admin123!`

### 2. Make an Existing User Admin

**Option A: Using MySQL Command Line**
```sql
USE exam_practice_db;
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

**Option B: Using phpMyAdmin (XAMPP)**
1. Open phpMyAdmin (http://localhost/phpmyadmin)
2. Select `exam_practice_db` database
3. Click on `users` table
4. Find your user and click "Edit"
5. Change `role` from `user` to `admin`
6. Click "Go" to save

**Option C: Using Node.js Script**
Create a file `backend/scripts/makeAdmin.js`:
```javascript
const mysql = require('mysql2/promise');
require('dotenv').config();

async function makeAdmin(email) {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'exam_practice_db'
  });

  await connection.query(
    'UPDATE users SET role = ? WHERE email = ?',
    ['admin', email]
  );

  console.log(`✅ User ${email} is now an admin`);
  await connection.end();
}

const email = process.argv[2];
if (!email) {
  console.error('Usage: node makeAdmin.js <email>');
  process.exit(1);
}

makeAdmin(email).catch(console.error);
```

Run: `node backend/scripts/makeAdmin.js your-email@example.com`

### 3. Access Admin Dashboard
1. Login with admin credentials
2. Click "Admin" link in the navbar (yellow/gold color)
3. You'll see the admin dashboard with statistics

## Usage Guide

### Creating an Exam

1. Navigate to **Admin Dashboard** → **Manage Exams**
2. Click **"+ Create New Exam"** button
3. Fill in the form:
   - **Exam Code**: e.g., AZ-900, DP-203
   - **Title**: Full exam name
   - **Description**: Brief description of the exam
   - **Path**: Select certification path (AZ, DP, SC, etc.)
   - **Time Limit**: Duration in minutes
   - **Passing Score**: Minimum score to pass (typically 700 out of 1000)
4. Click **"Create Exam"**

### Adding Questions to an Exam

1. Navigate to **Admin Dashboard** → **Manage Questions**
2. Select the exam from the dropdown
3. Click **"+ Create New Question"**
4. Fill in the form:
   - **Exam**: Select the exam (pre-selected if you filtered)
   - **Question Text**: Enter the question
   - **Question Type**: 
     - **Single Choice**: Only one correct answer
     - **Multiple Choice**: Multiple correct answers
   - **Explanation**: Explain why the answer is correct
   - **Answer Options**: 
     - Add at least 2 options
     - Check the box for correct answer(s)
     - Click "+ Add Option" for more options
5. Click **"Create Question"**

### Editing Questions

1. Find the question in the list
2. Click **"Edit"** button
3. Modify the question details
4. Click **"Update Question"**

### Deleting Items

- **Exams**: Click "Delete" → Confirm (⚠️ This deletes all questions and attempts)
- **Questions**: Click "Delete" → Confirm

## API Endpoints Used

### Admin Exams
- `GET /api/admin/exams` - List all exams with statistics
- `POST /api/admin/exams` - Create new exam
- `PUT /api/admin/exams/:examId` - Update exam
- `DELETE /api/admin/exams/:examId` - Delete exam

### Admin Questions
- `GET /api/admin/questions?exam_id=X` - List questions for exam
- `GET /api/admin/questions/:id` - Get single question with options
- `POST /api/admin/questions` - Create question with options
- `PUT /api/admin/questions/:id` - Update question
- `DELETE /api/admin/questions/:id` - Delete question

### Admin Statistics
- `GET /api/admin/stats` - Get dashboard statistics

## UI Components

### Admin Dashboard
- **Statistics Cards**: Visual display of key metrics
- **Quick Action Cards**: Navigate to management sections
- **Recent Attempts Table**: Monitor user activity

### Exam Management
- **Data Table**: Sortable table with exam details
- **Modal Form**: Create/edit exams in overlay
- **Action Buttons**: Edit and delete controls

### Question Management
- **Exam Filter**: Dropdown to select exam
- **Question Cards**: Visual display of questions
- **Modal Form**: Create/edit questions with dynamic options
- **Option Management**: Add/remove answer options dynamically

## Styling

All admin pages use consistent styling from `AdminDashboard.css`:
- **Professional color scheme**: Blue, white, and accent colors
- **Responsive design**: Works on desktop and mobile
- **Card-based layout**: Clean, modern interface
- **Modal overlays**: Non-intrusive forms
- **Hover effects**: Interactive feedback

## Security

- **Authentication Required**: All admin routes require valid JWT token
- **Role-Based Access**: Only users with `role = 'admin'` can access
- **Protected Routes**: `AdminRoute` component checks authentication and role
- **Backend Validation**: All admin endpoints verify admin role via middleware

## Future Enhancements

Potential features to add:
1. **Case Study Management**: UI for creating/editing case studies
2. **User Management**: View and manage user accounts
3. **Bulk Import**: Upload questions via CSV/JSON file
4. **Analytics**: Detailed statistics and charts
5. **Question Bank**: Reusable question library
6. **Exam Preview**: Preview exam before publishing
7. **Question Search**: Search and filter questions
8. **Audit Log**: Track admin actions

## Troubleshooting

### "Access Denied" when accessing admin routes
- Verify your user has `role = 'admin'` in the database
- Clear browser cache and localStorage
- Re-login to refresh authentication token

### Admin link not showing in navbar
- Check if `isAdmin()` function returns true
- Verify user object has `role: 'admin'` property
- Check browser console for errors

### Questions not loading
- Verify exam is selected in dropdown
- Check browser console for API errors
- Ensure backend server is running

### Cannot create question
- Ensure at least one option is marked as correct
- All options must have text
- Minimum 2 options required

## Support

For issues or questions:
1. Check browser console for errors
2. Check backend server logs
3. Verify database connection
4. Ensure all dependencies are installed

## Summary

The Admin Dashboard provides a complete solution for managing the exam platform:
- ✅ Create and manage exams
- ✅ Add and edit questions with multiple options
- ✅ View statistics and monitor activity
- ✅ Role-based access control
- ✅ Professional, responsive UI
- ✅ Secure backend API

You can now fully manage your exam content without directly accessing the database!