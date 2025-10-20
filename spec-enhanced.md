# Exam Practice Site — Enhanced Specification (Microsoft Exam Style)

## Table of Contents
1. [Purpose & Overview](#purpose--overview)
2. [Tech Stack & Environment](#tech-stack--environment)
3. [Features & User Flows](#features--user-flows)
4. [Data Model / Entities](#data-model--entities)
5. [API Endpoints](#api-endpoints)
6. [Frontend Views & UI Flow](#frontend-views--ui-flow)
7. [Microsoft Exam Features](#microsoft-exam-features)
8. [Question Management System](#question-management-system)
9. [Business Rules & Constraints](#business-rules--constraints)
10. [Security & Validation](#security--validation)
11. [Implementation Outline](#implementation-outline)

---

## 1. Purpose & Overview

Build a professional exam practice platform that **replicates the Microsoft certification exam experience**, including:

- **User authentication** (email/password + Google OAuth)
- **Exam catalog** with Azure (AZ), Data & AI (DP), Security (SC) certification paths
- **Microsoft-style exam interface** with:
  - Question counter (e.g., "Question 5 of 50")
  - Multiple question types (single choice, multiple choice, case studies)
  - Review screen with question status grid
  - Mark for review functionality
  - Countdown timer with auto-submit
- **Comprehensive admin panel** for question/exam management
- **Detailed results and performance tracking**

**Tech Stack:** React (frontend) + Node.js/Express (backend) + MySQL (XAMPP)

---

## 2. Tech Stack & Environment

### Frontend
- **React.js** with hooks and Context API
- **React Router** for navigation
- **Tailwind CSS** or **Material-UI** for Microsoft-style professional UI
- **Axios** for API calls
- **React Query** for data fetching and caching

### Backend
- **Node.js + Express**
- **MySQL** (via XAMPP locally)
- **JWT** for authentication
- **bcrypt** for password hashing
- **express-validator** for input validation
- **multer** for file uploads (bulk question import)

### Development Environment
- **VS Code** as IDE
- **XAMPP** → MySQL server
- **Postman** for API testing
- **Git** for version control

---

## 3. Features & User Flows

### 3.1 Registration & Login
- **Register via Email/Password**
  - Email uniqueness validation
  - Password strength requirements
  - Email verification (optional)
- **Google OAuth Login**
  - One-click Google sign-in
  - Auto-create user account
- **Password Reset**
  - Email-based reset link
  - Secure token validation

### 3.2 Exam Selection & Launch
1. User views **Exam Catalog** (grouped by path: AZ, DP, SC)
2. Click exam → View **Exam Details** page:
   - Exam code (e.g., AZ-900)
   - Description
   - Time limit
   - Number of questions
   - Passing score
3. Click **"Start Exam"** → Backend creates `Attempt` record → Navigate to exam interface

### 3.3 Exam Taking (Microsoft Style)

#### Question Display
- **One question at a time** with clear counter: "Question 5 of 50"
- **Question types:**
  - **Single choice** (radio buttons)
  - **Multiple choice** (checkboxes with "Select all that apply")
  - **Case study questions** (scenario text + related questions)
  - **Drag and drop** (future enhancement)

#### Navigation Controls
- **Previous** button (disabled on first question)
- **Next** button (always enabled, allows skipping)
- **Mark for Review** checkbox
- **Review All** button (opens review screen)

#### Timer
- **Countdown timer** (top right corner)
- **Auto-submit** when time expires
- **Warning** at 5 minutes remaining

#### Review Screen
- **Grid/list view** of all questions showing:
  - Question number
  - Status: ✓ Answered / ○ Unanswered / ⚑ Marked for Review
- **Summary counts**: "45 answered, 3 unanswered, 2 marked for review"
- **Click any question** to jump directly to it
- **Finish Exam** button with confirmation dialog

### 3.4 Submission & Grading
- User clicks **"Finish Exam"** from review screen
- Confirmation dialog: "Are you sure? You cannot change answers after submission."
- Backend:
  - Compares answers vs correct options
  - Calculates score (percentage)
  - Determines pass/fail
  - Saves results

### 3.5 Results & Review
- **Results Page** shows:
  - Overall score (e.g., 850/1000)
  - Pass/Fail status with visual indicator
  - Percentage correct
  - Performance by topic/section
- **Detailed Review** button → View all questions with:
  - User's selected answer(s)
  - Correct answer(s)
  - Explanation
  - Whether user was correct

### 3.6 History & Dashboard
- **Dashboard** shows:
  - Available exams
  - Recent attempts
  - Overall statistics
- **Attempt History** page:
  - List of all past attempts
  - Date, exam, score, pass/fail
  - Click to view detailed results

---

## 4. Data Model / Entities

### Enhanced Database Schema

#### **User**
| Field | Type | Description |
|-------|------|-------------|
| id | INT (PK) | Primary key |
| email | VARCHAR(255) UNIQUE | User email |
| password_hash | VARCHAR(255) | Hashed password (nullable for OAuth users) |
| google_id | VARCHAR(255) | Google OAuth ID (nullable) |
| role | ENUM('user', 'admin') | User role |
| created_at | TIMESTAMP | Account creation date |
| updated_at | TIMESTAMP | Last update |

#### **Exam**
| Field | Type | Description |
|-------|------|-------------|
| id | INT (PK) | Primary key |
| code | VARCHAR(50) UNIQUE | Exam code (e.g., "AZ-900") |
| title | VARCHAR(255) | Exam title |
| description | TEXT | Exam description |
| path | VARCHAR(50) | Certification path (AZ, DP, SC) |
| time_limit_minutes | INT | Time limit in minutes |
| passing_score | INT | Passing score (e.g., 700 out of 1000) |
| total_questions | INT | Total number of questions |
| created_at | TIMESTAMP | Creation date |
| updated_at | TIMESTAMP | Last update |

#### **CaseStudy**
| Field | Type | Description |
|-------|------|-------------|
| id | INT (PK) | Primary key |
| exam_id | INT (FK) | Foreign key to Exam |
| title | VARCHAR(255) | Case study title |
| scenario_text | TEXT | Scenario description |
| order_index | INT | Display order |
| created_at | TIMESTAMP | Creation date |
| updated_at | TIMESTAMP | Last update |

#### **Question**
| Field | Type | Description |
|-------|------|-------------|
| id | INT (PK) | Primary key |
| exam_id | INT (FK) | Foreign key to Exam |
| case_study_id | INT (FK, nullable) | Foreign key to CaseStudy (if part of case study) |
| text | TEXT | Question text |
| explanation | TEXT | Explanation for correct answer |
| question_type | ENUM('single_choice', 'multiple_choice', 'drag_drop') | Question type |
| order_index | INT | Display order |
| created_at | TIMESTAMP | Creation date |
| updated_at | TIMESTAMP | Last update |

#### **Option**
| Field | Type | Description |
|-------|------|-------------|
| id | INT (PK) | Primary key |
| question_id | INT (FK) | Foreign key to Question |
| text | TEXT | Option text |
| is_correct | BOOLEAN | Whether this option is correct |
| order_index | INT | Display order |

#### **Attempt**
| Field | Type | Description |
|-------|------|-------------|
| id | INT (PK) | Primary key |
| user_id | INT (FK) | Foreign key to User |
| exam_id | INT (FK) | Foreign key to Exam |
| start_time | TIMESTAMP | Exam start time |
| end_time | TIMESTAMP | Exam end time (nullable until submitted) |
| score | INT | Final score (nullable until graded) |
| completed | BOOLEAN | Whether exam is completed |
| time_remaining_seconds | INT | Time remaining when submitted |
| created_at | TIMESTAMP | Creation date |

#### **Answer**
| Field | Type | Description |
|-------|------|-------------|
| id | INT (PK) | Primary key |
| attempt_id | INT (FK) | Foreign key to Attempt |
| question_id | INT (FK) | Foreign key to Question |
| selected_option_ids | JSON | Array of selected option IDs (for multiple choice) |
| is_correct | BOOLEAN | Whether answer is correct |
| marked_for_review | BOOLEAN | Whether marked for review |

### Relationships
- One **Exam** has many **Questions** and **CaseStudies**
- One **CaseStudy** has many **Questions**
- One **Question** has many **Options**
- One **User** has many **Attempts**
- One **Attempt** has many **Answers**
- Each **Answer** references one **Question** and one or more **Options** (stored as JSON array)

---

## 5. API Endpoints

### 5.1 Authentication / User

| Method | Endpoint | Purpose | Request Body | Response |
|--------|----------|---------|--------------|----------|
| POST | `/api/auth/register` | Register via email/password | `{ email, password, confirmPassword }` | `{ success, token, user }` |
| POST | `/api/auth/login` | Login with email/password | `{ email, password }` | `{ token, user }` |
| POST | `/api/auth/google` | Login/Register via Google OAuth | `{ google_token }` | `{ token, user }` |
| POST | `/api/auth/password-reset` | Request password reset | `{ email }` | `{ success, message }` |
| POST | `/api/auth/password-reset/confirm` | Confirm password reset | `{ token, new_password }` | `{ success }` |
| GET | `/api/auth/me` | Get current user info | - | `{ user }` |

### 5.2 Exams & Questions

| Method | Endpoint | Purpose | Request/Params | Response |
|--------|----------|---------|----------------|----------|
| GET | `/api/exams` | List all exams | Query: `?path=AZ` | `{ exams: [...] }` |
| GET | `/api/exams/:examId` | Get exam details | `:examId` | `{ exam, case_studies }` |
| GET | `/api/exams/:examId/start` | Start new attempt | `:examId` | `{ attempt_id, questions, time_limit }` |

### 5.3 Attempts & Answers (During Exam)

| Method | Endpoint | Purpose | Request | Response |
|--------|----------|---------|---------|----------|
| POST | `/api/attempts/:attemptId/answers` | Save/update answer | `{ question_id, selected_option_ids: [], marked_for_review }` | `{ success }` |
| GET | `/api/attempts/:attemptId/progress` | Get current progress | `:attemptId` | `{ answers, time_remaining }` |
| POST | `/api/attempts/:attemptId/submit` | Submit exam for grading | `:attemptId` | `{ attempt, detailed_results }` |

### 5.4 Results & History

| Method | Endpoint | Purpose | Request | Response |
|--------|----------|---------|---------|----------|
| GET | `/api/attempts/:attemptId` | Get attempt details | `:attemptId` | `{ attempt, answers }` |
| GET | `/api/users/me/attempts` | List user's attempts | - | `{ attempts: [...] }` |

### 5.5 Admin Endpoints (Admin role required)

#### Exam Management
| Method | Endpoint | Purpose | Request | Response |
|--------|----------|---------|---------|----------|
| POST | `/api/admin/exams` | Create exam | `{ code, title, description, path, time_limit_minutes, passing_score }` | `{ exam }` |
| PUT | `/api/admin/exams/:examId` | Update exam | `{ ... }` | `{ exam }` |
| DELETE | `/api/admin/exams/:examId` | Delete exam | `:examId` | `{ success }` |

#### Case Study Management
| Method | Endpoint | Purpose | Request | Response |
|--------|----------|---------|---------|----------|
| POST | `/api/admin/case-studies` | Create case study | `{ exam_id, title, scenario_text, order_index }` | `{ case_study }` |
| PUT | `/api/admin/case-studies/:id` | Update case study | `{ ... }` | `{ case_study }` |
| DELETE | `/api/admin/case-studies/:id` | Delete case study | `:id` | `{ success }` |

#### Question Management
| Method | Endpoint | Purpose | Request | Response |
|--------|----------|---------|---------|----------|
| GET | `/api/admin/questions` | List all questions | Query: `?exam_id=1` | `{ questions: [...] }` |
| POST | `/api/admin/questions` | Create question | `{ exam_id, case_study_id, text, explanation, question_type, order_index }` | `{ question }` |
| PUT | `/api/admin/questions/:id` | Update question | `{ ... }` | `{ question }` |
| DELETE | `/api/admin/questions/:id` | Delete question | `:id` | `{ success }` |
| POST | `/api/admin/questions/bulk` | Bulk import questions | `{ exam_id, questions: [...] }` | `{ success, imported_count }` |

#### Option Management
| Method | Endpoint | Purpose | Request | Response |
|--------|----------|---------|---------|----------|
| POST | `/api/admin/options` | Create option | `{ question_id, text, is_correct, order_index }` | `{ option }` |
| PUT | `/api/admin/options/:id` | Update option | `{ ... }` | `{ option }` |
| DELETE | `/api/admin/options/:id` | Delete option | `:id` | `{ success }` |

---

## 6. Frontend Views & UI Flow

### 6.1 User-Facing Views

| View/Page | Description | Key Features |
|-----------|-------------|--------------|
| **Login/Register** | Authentication forms | - Toggle between login/register<br>- Google OAuth button<br>- Form validation<br>- Loading states |
| **Dashboard** | Home page with exam catalog | - Exam cards grouped by path<br>- Search/filter<br>- Recent attempts<br>- User statistics |
| **Exam Details** | Exam information page | - Exam overview<br>- Time limit, passing score<br>- Number of questions<br>- "Start Exam" button |
| **Exam Interface** | Microsoft-style exam UI | - Question counter<br>- Timer (countdown)<br>- Question text & options<br>- Case study panel (if applicable)<br>- Navigation: Previous, Next<br>- Mark for Review checkbox<br>- Review All button |
| **Review Screen** | Question status grid | - All questions with status<br>- Summary counts<br>- Click to jump to question<br>- Finish Exam button |
| **Results** | Exam results page | - Overall score<br>- Pass/Fail indicator<br>- Performance breakdown<br>- View detailed review button |
| **Detailed Review** | Question-by-question review | - All questions with answers<br>- Correct vs user's answer<br>- Explanations<br>- Navigation |
| **Attempt History** | List of past attempts | - Sortable table<br>- Date, exam, score<br>- Click to view details |
| **Profile** | User profile & settings | - Edit profile<br>- Change password<br>- Statistics |

### 6.2 Admin Panel Views

| View/Page | Description | Key Features |
|-----------|-------------|--------------|
| **Admin Dashboard** | Admin overview | - Statistics<br>- Quick actions<br>- Recent activity |
| **Exam Management** | CRUD for exams | - List exams<br>- Create/edit/delete<br>- Bulk actions |
| **Question Bank** | Manage questions | - List questions by exam<br>- Create/edit/delete<br>- Preview<br>- Bulk import (CSV/JSON) |
| **Case Study Manager** | Manage case studies | - Rich text editor<br>- Link questions<br>- Preview |
| **User Management** | Manage users | - User list<br>- Role assignment<br>- Activity logs |

---

## 7. Microsoft Exam Features

### 7.1 Question Counter
- Display: **"Question 5 of 50"** at top of exam interface
- Updates dynamically as user navigates

### 7.2 Question Types

#### Single Choice
- Radio buttons
- Only one answer can be selected
- Clear selection button

#### Multiple Choice
- Checkboxes
- Instruction: **"Select all that apply"**
- Multiple answers can be selected

#### Case Study Questions
- Left panel: Scenario text (scrollable)
- Right panel: Question and options
- Multiple questions can reference same case study
- Case study remains visible while answering related questions

### 7.3 Review Screen
- **Grid layout** showing all questions
- **Status indicators:**
  - ✓ **Answered** (green)
  - ○ **Unanswered** (gray)
  - ⚑ **Marked for Review** (orange)
- **Summary bar:** "45 answered, 3 unanswered, 2 marked for review"
- **Click any question** to jump directly to it
- **Finish Exam** button (prominent, blue)

### 7.4 Timer
- **Position:** Top right corner
- **Format:** MM:SS (e.g., 45:30)
- **Color coding:**
  - Green: > 10 minutes
  - Orange: 5-10 minutes
  - Red: < 5 minutes (with warning)
- **Auto-submit:** When timer reaches 00:00

### 7.5 Navigation
- **Previous** button: Navigate to previous question
- **Next** button: Navigate to next question (allows skipping)
- **Mark for Review** checkbox: Flag question for later review
- **Review All** button: Open review screen

### 7.6 Anti-Cheating Measures
- Warn on tab change/window blur
- Prevent page refresh (confirmation dialog)
- Disable right-click
- Disable text selection on questions
- Log suspicious activities

---

## 8. Question Management System

### 8.1 Admin Panel Features

#### Create Question
1. Select exam
2. Select case study (optional)
3. Enter question text (rich text editor)
4. Select question type (single/multiple choice)
5. Add options (minimum 2, maximum 10)
6. Mark correct option(s)
7. Enter explanation
8. Set order index
9. Preview question
10. Save

#### Edit Question
- Modify any field
- Reorder options
- Change correct answers
- Update explanation

#### Delete Question
- Confirmation dialog
- Cascade delete options
- Update exam total_questions count

### 8.2 Bulk Import

#### CSV Format
```csv
exam_code,case_study_title,question_type,question_text,option_1,option_2,option_3,option_4,correct_options,explanation
AZ-900,,single_choice,"What is Azure?","A cloud platform","A database","An OS","A programming language","1","Azure is Microsoft's cloud computing platform"
```

#### JSON Format
```json
{
  "exam_code": "AZ-900",
  "questions": [
    {
      "case_study_title": null,
      "question_type": "single_choice",
      "text": "What is Azure?",
      "options": [
        { "text": "A cloud platform", "is_correct": true },
        { "text": "A database", "is_correct": false },
        { "text": "An OS", "is_correct": false },
        { "text": "A programming language", "is_correct": false }
      ],
      "explanation": "Azure is Microsoft's cloud computing platform"
    }
  ]
}
```

#### Import Process
1. Upload CSV/JSON file
2. Validate format
3. Preview questions
4. Confirm import
5. Save to database
6. Show import summary

### 8.3 Database Seeding Scripts

Create SQL scripts for initial data:

**`seeds/01_exams.sql`**
```sql
INSERT INTO exams (code, title, description, path, time_limit_minutes, passing_score, total_questions)
VALUES 
('AZ-900', 'Microsoft Azure Fundamentals', 'Foundational knowledge of cloud services...', 'AZ', 60, 700, 50),
('AZ-104', 'Microsoft Azure Administrator', 'Skills to implement, manage, and monitor...', 'AZ', 120, 700, 60);
```

**`seeds/02_questions.sql`**
```sql
INSERT INTO questions (exam_id, text, explanation, question_type, order_index)
VALUES 
(1, 'What is cloud computing?', 'Cloud computing is...', 'single_choice', 1);

INSERT INTO options (question_id, text, is_correct, order_index)
VALUES 
(1, 'Delivery of computing services over the internet', 1, 1),
(1, 'A type of weather phenomenon', 0, 2),
(1, 'A local server infrastructure', 0, 3),
(1, 'A programming language', 0, 4);
```

---

## 9. Business Rules & Constraints

1. **Time Limit Enforced:** Auto-submit when timer expires
2. **Navigation:** Users can go back and forth between questions
3. **Mark for Review:** Users can flag questions for later review
4. **Passing Score:** Configurable per exam (e.g., 700/1000)
5. **Answer Visibility:** Correct answers shown only after submission
6. **User Privacy:** Users see only their own attempts
7. **Data Integrity:** Validate all submissions server-side
8. **Retakes:** Unlimited attempts allowed (configurable)
9. **Question Randomization:** Optional (future enhancement)
10. **Admin Access:** Only admin role can manage questions/exams

---

## 10. Security & Validation

### 10.1 Authentication
- Hash passwords with bcrypt (salt rounds: 10)
- JWT tokens with expiration (24 hours)
- Refresh token mechanism (optional)
- Secure HTTP-only cookies for tokens

### 10.2 Authorization
- Verify JWT on all protected endpoints
- Check user role for admin endpoints
- Validate user owns attempt before allowing access

### 10.3 Input Validation
- Validate all request payloads
- Sanitize user inputs (prevent XSS)
- Check exam_id, question_id, option_id existence
- Validate selected options belong to question
- Ensure answers only for questions in exam

### 10.4 Rate Limiting
- Login attempts: 5 per 15 minutes
- API calls: 100 per minute per user
- Bulk imports: 1 per 5 minutes

### 10.5 Data Protection
- Use HTTPS in production
- Encrypt sensitive data at rest
- Don't expose correct answers in question API (until after submission)
- Don't include explanations until grading

### 10.6 Anti-Cheating
- Log tab changes and window blur events
- Track time spent on each question
- Detect rapid answer changes
- Monitor for suspicious patterns

---

## 11. Implementation Outline

### Phase 1: Project Setup (Week 1)
1. ✅ Initialize React app (`create-react-app` or `vite`)
2. ✅ Initialize Node.js/Express backend
3. ✅ Set up MySQL database (XAMPP)
4. ✅ Create database schema (run DDL scripts)
5. ✅ Set up Git repository
6. ✅ Configure environment variables

### Phase 2: Authentication (Week 1-2)
1. ✅ Implement user registration (email/password)
2. ✅ Implement login with JWT
3. ✅ Create protected route middleware
4. ✅ Build login/register UI
5. ✅ Implement Google OAuth (optional for later)

### Phase 3: Exam Catalog & Details (Week 2)
1. ✅ Seed exam data
2. ✅ Build exam listing API
3. ✅ Create dashboard UI
4. ✅ Build exam details page
5. ✅ Implement "Start Exam" flow

### Phase 4: Exam Interface (Week 3-4)
1. ✅ Build exam interface UI (Microsoft style)
2. ✅ Implement question navigation
3. ✅ Add timer with countdown
4. ✅ Implement answer saving (auto-save)
5. ✅ Build review screen
6. ✅ Add "Mark for Review" functionality
7. ✅ Implement exam submission

### Phase 5: Grading & Results (Week 4)
1. ✅ Build grading logic
2. ✅ Create results page UI
3. ✅ Build detailed review page
4. ✅ Implement attempt history

### Phase 6: Admin Panel (Week 5-6)
1. ✅ Build admin dashboard
2. ✅ Implement exam CRUD
3. ✅ Build question management UI
4. ✅ Add case study management
5. ✅ Implement bulk import (CSV/JSON)
6. ✅ Add user management

### Phase 7: Polish & Testing (Week 7)
1. ✅ Add loading states and error handling
2. ✅ Implement form validation
3. ✅ Add responsive design
4. ✅ Test all user flows
5. ✅ Fix bugs
6. ✅ Optimize performance

### Phase 8: Deployment (Week 8)
1. ✅ Prepare production build
2. ✅ Set up production database
3. ✅ Deploy backend (Heroku, AWS, etc.)
4. ✅ Deploy frontend (Vercel, Netlify, etc.)
5. ✅ Configure domain and SSL
6. ✅ Final testing

---

## Next Steps

1. **Run XAMPP as Administrator** to start MySQL
2. **Create database:** `exam_practice_db`
3. **Start building!** Follow the implementation outline above

This specification provides a complete blueprint for building a professional exam practice site that replicates the Microsoft certification exam experience. 🚀