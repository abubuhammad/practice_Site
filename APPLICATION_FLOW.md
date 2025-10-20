# 🔄 Application Flow Diagram

## User Journey Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         START HERE                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    LANDING / LOGIN PAGE                         │
│  • Email & Password fields                                      │
│  • "Login" button                                               │
│  • "Register here" link                                         │
│  • Demo account info displayed                                  │
└─────────────────────────────────────────────────────────────────┘
                    ↓ (New User)        ↓ (Existing User)
         ┌──────────────────┐           │
         │                  │           │
         ↓                  │           ↓
┌──────────────────┐        │    ┌──────────────────┐
│ REGISTER PAGE    │        │    │  LOGIN SUCCESS   │
│ • Email          │        │    │  • JWT Token     │
│ • Password       │        │    │  • User Data     │
│ • Confirm Pass   │        │    │  • Redirect to   │
│ • Validation     │        │    │    Dashboard     │
└──────────────────┘        │    └──────────────────┘
         ↓                  │           ↓
         └──────────────────┴───────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                        DASHBOARD                                │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Welcome, user@example.com                                 │ │
│  └───────────────────────────────────────────────────────────┘ │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐             │
│  │ Exams Taken │ │ Avg Score   │ │ Pass Rate   │             │
│  │     5       │ │    750      │ │    80%      │             │
│  └─────────────┘ └─────────────┘ └─────────────┘             │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Recent Attempts                                           │ │
│  │ • AZ-900 - Passed (800/1000) - 2 days ago               │ │
│  │ • AZ-104 - Failed (650/1000) - 5 days ago               │ │
│  └───────────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Available Exams                                           │ │
│  │ [AZ-900] [AZ-104] [DP-900]                               │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
         ↓                    ↓                    ↓
    [Browse Exams]      [View History]       [Start Exam]
         ↓                    ↓                    ↓
         │                    │                    │
         ↓                    ↓                    │
┌──────────────────┐  ┌──────────────────┐        │
│  EXAM CATALOG    │  │  HISTORY PAGE    │        │
│  • All Exams     │  │  • All Attempts  │        │
│  • Filter by     │  │  • Filter by     │        │
│    Cert Path     │  │    Pass/Fail     │        │
│  • View Details  │  │  • Statistics    │        │
└──────────────────┘  └──────────────────┘        │
         ↓                    ↓                    │
    [View Details]      [View Results]            │
         ↓                    ↓                    │
         │                    │                    │
         ↓                    │                    │
┌──────────────────┐          │                    │
│  EXAM DETAIL     │          │                    │
│  • Title & Code  │          │                    │
│  • Description   │          │                    │
│  • Duration      │          │                    │
│  • Questions     │          │                    │
│  • Passing Score │          │                    │
│  [Start Exam]    │          │                    │
└──────────────────┘          │                    │
         ↓                    │                    │
         └────────────────────┴────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      EXAM INTERFACE                             │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ AZ-900: Microsoft Azure Fundamentals                      │ │
│  │ Time Remaining: 58:45 | Question 3 of 10                 │ │
│  └───────────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Question 3                                                │ │
│  │ What is Azure Virtual Network?                            │ │
│  │                                                           │ │
│  │ ○ A. A physical network in Azure datacenter              │ │
│  │ ● B. A logical isolation of Azure cloud                  │ │
│  │ ○ C. A VPN connection to on-premises                     │ │
│  │ ○ D. A network security group                            │ │
│  │                                                           │ │
│  │ [✓ Mark for Review]                                      │ │
│  └───────────────────────────────────────────────────────────┘ │
│  [< Previous] [Next >] [Review Screen] [Submit Exam]          │
└─────────────────────────────────────────────────────────────────┘
         ↓                              ↓
    [Review Screen]                [Submit Exam]
         ↓                              ↓
┌──────────────────┐                    │
│  REVIEW SCREEN   │                    │
│  ┌────────────┐  │                    │
│  │ Questions  │  │                    │
│  │ [1][2][3]  │  │                    │
│  │ [4][5][6]  │  │                    │
│  │ [7][8][9]  │  │                    │
│  │ [10]       │  │                    │
│  │            │  │                    │
│  │ ■ Answered │  │                    │
│  │ □ Unanswer │  │                    │
│  │ ⚠ Marked   │  │                    │
│  └────────────┘  │                    │
│  [Back to Exam]  │                    │
│  [Submit Exam]   │                    │
└──────────────────┘                    │
         ↓                              │
         └──────────────────────────────┘
                    ↓
          [Confirm Submission]
                    ↓
┌─────────────────────────────────────────────────────────────────┐
│                       RESULTS PAGE                              │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ AZ-900 - Microsoft Azure Fundamentals                     │ │
│  │                    ✓ PASSED                               │ │
│  │                      800                                  │ │
│  │            You scored 800 out of 1000                     │ │
│  └───────────────────────────────────────────────────────────┘ │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐             │
│  │ Correct: 8  │ │ Incorrect:2 │ │ Percent:80% │             │
│  └─────────────┘ └─────────────┘ └─────────────┘             │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Detailed Review                                           │ │
│  │ ┌─────────────────────────────────────────────────────┐  │ │
│  │ │ Question 1                              ✓ Correct   │  │ │
│  │ │ What is Azure?                                      │  │ │
│  │ │ Your Answer: B. Cloud computing platform            │  │ │
│  │ │ 💡 Explanation: Azure is Microsoft's cloud...       │  │ │
│  │ └─────────────────────────────────────────────────────┘  │ │
│  │ ┌─────────────────────────────────────────────────────┐  │ │
│  │ │ Question 2                              ✗ Incorrect │  │ │
│  │ │ What is Azure Storage?                              │  │ │
│  │ │ Your Answer: A. Database service                    │  │ │
│  │ │ Correct Answer: B. Scalable cloud storage           │  │ │
│  │ │ 💡 Explanation: Azure Storage provides...           │  │ │
│  │ └─────────────────────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────────────────┘ │
│  [Browse Exams] [Retake Exam] [View History] [Dashboard]      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    [View History]
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                       HISTORY PAGE                              │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Exam History                                              │ │
│  │ [All Attempts (5)] [Passed (4)] [Failed (1)]             │ │
│  └───────────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ AZ-900 - Microsoft Azure Fundamentals      ✓ PASSED      │ │
│  │ December 15, 2024 at 2:30 PM                             │ │
│  │ Score: 800/1000 | Percentage: 80% | Duration: 45m 30s   │ │
│  │ [View Details] [Retake Exam]                             │ │
│  └───────────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ AZ-104 - Microsoft Azure Administrator    ✗ FAILED       │ │
│  │ December 10, 2024 at 10:15 AM                            │ │
│  │ Score: 650/1000 | Percentage: 65% | Duration: 1h 15m    │ │
│  │ [View Details] [Retake Exam]                             │ │
│  └───────────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Overall Statistics                                        │ │
│  │ Total: 5 | Passed: 4 | Failed: 1 | Pass Rate: 80%       │ │
│  │ Average Score: 750 | Best Score: 850                     │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

```
┌──────────────┐
│   BROWSER    │
│  (React App) │
└──────────────┘
       ↕ HTTP/REST
┌──────────────────────────────────────────────────────────────┐
│                    API ENDPOINTS                             │
├──────────────────────────────────────────────────────────────┤
│ POST /api/auth/register                                      │
│ POST /api/auth/login                                         │
│ GET  /api/auth/me                                            │
│ ─────────────────────────────────────────────────────────── │
│ GET  /api/exams                                              │
│ GET  /api/exams/:id                                          │
│ POST /api/exams/:id/start                                    │
│ ─────────────────────────────────────────────────────────── │
│ GET  /api/attempts/user                                      │
│ GET  /api/attempts/:id                                       │
│ POST /api/attempts/:id/answer                                │
│ POST /api/attempts/:id/submit                                │
│ ─────────────────────────────────────────────────────────── │
│ GET  /api/admin/stats                                        │
│ POST /api/admin/exams                                        │
│ POST /api/admin/questions                                    │
│ POST /api/admin/questions/bulk-import                        │
└──────────────────────────────────────────────────────────────┘
       ↕ SQL Queries
┌──────────────────────────────────────────────────────────────┐
│                      DATABASE                                │
├──────────────────────────────────────────────────────────────┤
│  users                                                       │
│  ├─ id, email, password_hash, role                          │
│  └─ created_at                                               │
│                                                              │
│  exams                                                       │
│  ├─ id, title, code, description                            │
│  ├─ duration_minutes, passing_score                          │
│  └─ certification_path, created_at                           │
│                                                              │
│  questions                                                   │
│  ├─ id, exam_id, case_study_id                              │
│  ├─ question_text, question_type                             │
│  └─ explanation, created_at                                  │
│                                                              │
│  options                                                     │
│  ├─ id, question_id, option_text                            │
│  └─ is_correct, created_at                                   │
│                                                              │
│  attempts                                                    │
│  ├─ id, user_id, exam_id                                    │
│  ├─ start_time, end_time, time_taken                         │
│  └─ score, status, completed_at                              │
│                                                              │
│  attempt_answers                                             │
│  ├─ id, attempt_id, question_id                             │
│  └─ selected_option_ids, is_correct                          │
└──────────────────────────────────────────────────────────────┘
```

---

## Authentication Flow

```
┌─────────────┐
│   BROWSER   │
└─────────────┘
       ↓
   [Login Form]
   email: user@example.com
   password: user123
       ↓
POST /api/auth/login
       ↓
┌─────────────────────┐
│  authController.js  │
│  ─────────────────  │
│  1. Validate input  │
│  2. Find user       │
│  3. Compare password│
│  4. Generate JWT    │
│  5. Return token    │
└─────────────────────┘
       ↓
   Response:
   {
     token: "eyJhbGc...",
     user: {
       id: 1,
       email: "user@example.com",
       role: "user"
     }
   }
       ↓
┌─────────────────────┐
│  AuthContext.js     │
│  ─────────────────  │
│  1. Store token in  │
│     localStorage    │
│  2. Set user state  │
│  3. Redirect to /   │
└─────────────────────┘
       ↓
   [Dashboard]
```

---

## Exam Taking Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. USER CLICKS "START EXAM"                                 │
└─────────────────────────────────────────────────────────────┘
       ↓
POST /api/exams/:id/start
       ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. CREATE ATTEMPT RECORD                                    │
│    INSERT INTO attempts (user_id, exam_id, start_time)      │
│    Returns: attempt_id                                      │
└─────────────────────────────────────────────────────────────┘
       ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. NAVIGATE TO EXAM INTERFACE                               │
│    /exams/:examId/take/:attemptId                           │
└─────────────────────────────────────────────────────────────┘
       ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. LOAD EXAM DATA                                           │
│    GET /api/attempts/:attemptId                             │
│    Returns: questions, options, time_remaining              │
└─────────────────────────────────────────────────────────────┘
       ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. USER ANSWERS QUESTIONS                                   │
│    For each answer:                                         │
│    POST /api/attempts/:attemptId/answer                     │
│    { question_id, selected_option_ids }                     │
│    Auto-saves immediately                                   │
└─────────────────────────────────────────────────────────────┘
       ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. USER CLICKS "SUBMIT EXAM"                                │
│    POST /api/attempts/:attemptId/submit                     │
└─────────────────────────────────────────────────────────────┘
       ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. GRADE EXAM                                               │
│    For each question:                                       │
│    - Compare selected options with correct options          │
│    - Mark as correct/incorrect                              │
│    - Calculate score: (correct / total) * 1000              │
│    - Update attempt record with score                       │
└─────────────────────────────────────────────────────────────┘
       ↓
┌─────────────────────────────────────────────────────────────┐
│ 8. NAVIGATE TO RESULTS                                      │
│    /results/:attemptId                                      │
│    Display score, pass/fail, detailed review                │
└─────────────────────────────────────────────────────────────┘
```

---

## State Management Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      AuthContext                            │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ State:                                                │ │
│  │ - user: { id, email, role }                           │ │
│  │ - token: "eyJhbGc..."                                 │ │
│  │ - isAuthenticated: true/false                         │ │
│  │ - loading: true/false                                 │ │
│  └───────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Functions:                                            │ │
│  │ - login(email, password)                              │ │
│  │ - register(email, password)                           │ │
│  │ - logout()                                            │ │
│  │ - checkAuth()                                         │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                    ↓ Provides to
┌─────────────────────────────────────────────────────────────┐
│                    All Components                           │
│  - LoginPage                                                │
│  - RegisterPage                                             │
│  - DashboardPage                                            │
│  - Navbar                                                   │
│  - PrivateRoute                                             │
│  - etc.                                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Hierarchy

```
App.js
├── AuthProvider (Context)
│   └── Router
│       ├── Navbar
│       │   ├── Brand Link
│       │   ├── Navigation Links
│       │   └── User Menu
│       │
│       └── Routes
│           ├── /login → LoginPage
│           ├── /register → RegisterPage
│           │
│           ├── / → PrivateRoute
│           │   └── DashboardPage
│           │       ├── Stats Cards
│           │       ├── Recent Attempts
│           │       └── Available Exams
│           │
│           ├── /exams → PrivateRoute
│           │   └── ExamCatalogPage
│           │       ├── Filter Buttons
│           │       └── Exam Cards
│           │
│           ├── /exams/:id → PrivateRoute
│           │   └── ExamDetailPage
│           │       ├── Exam Info
│           │       └── Start Button
│           │
│           ├── /exams/:id/take/:attemptId → PrivateRoute
│           │   └── ExamInterfacePage
│           │       ├── Timer
│           │       ├── Question Display
│           │       ├── Options
│           │       ├── Navigation Buttons
│           │       └── Review Screen
│           │
│           ├── /results/:attemptId → PrivateRoute
│           │   └── ResultsPage
│           │       ├── Score Display
│           │       ├── Stats Cards
│           │       └── Question Review
│           │
│           └── /history → PrivateRoute
│               └── HistoryPage
│                   ├── Filter Buttons
│                   ├── Attempt List
│                   └── Statistics
```

---

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    API REQUEST                              │
└─────────────────────────────────────────────────────────────┘
       ↓
┌─────────────────────────────────────────────────────────────┐
│              Axios Interceptor (api.js)                     │
│  - Adds Authorization header                                │
│  - Handles global errors                                    │
└─────────────────────────────────────────────────────────────┘
       ↓
   [Success] ──────────────────┐
       ↓                       ↓
   Return Data          [Error 401]
                              ↓
                    Clear localStorage
                              ↓
                    Redirect to /login
                              ↓
                    Show error message
```

---

## Timer Logic Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. EXAM STARTS                                              │
│    start_time = current_timestamp                           │
│    duration = exam.duration_minutes * 60                    │
└─────────────────────────────────────────────────────────────┘
       ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. CALCULATE TIME REMAINING (Server-side)                   │
│    elapsed = current_time - start_time                      │
│    time_remaining = duration - elapsed                      │
└─────────────────────────────────────────────────────────────┘
       ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. DISPLAY TIMER (Client-side)                              │
│    setInterval(() => {                                      │
│      time_remaining--                                       │
│      if (time_remaining < 600) color = yellow               │
│      if (time_remaining < 300) color = red                  │
│      if (time_remaining <= 0) autoSubmit()                  │
│    }, 1000)                                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Grading Logic Flow

```
┌─────────────────────────────────────────────────────────────┐
│ FOR EACH QUESTION:                                          │
└─────────────────────────────────────────────────────────────┘
       ↓
┌─────────────────────────────────────────────────────────────┐
│ 1. GET CORRECT OPTIONS                                      │
│    SELECT id FROM options                                   │
│    WHERE question_id = ? AND is_correct = 1                 │
└─────────────────────────────────────────────────────────────┘
       ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. GET SELECTED OPTIONS                                     │
│    FROM attempt_answers                                     │
│    WHERE attempt_id = ? AND question_id = ?                 │
└─────────────────────────────────────────────────────────────┘
       ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. COMPARE                                                  │
│    correct_set = [1, 3]                                     │
│    selected_set = [1, 3]                                    │
│    is_correct = (correct_set === selected_set)              │
└─────────────────────────────────────────────────────────────┘
       ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. CALCULATE SCORE                                          │
│    correct_count = COUNT(is_correct = 1)                    │
│    total_count = COUNT(*)                                   │
│    score = (correct_count / total_count) * 1000             │
└─────────────────────────────────────────────────────────────┘
       ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. DETERMINE PASS/FAIL                                      │
│    passed = (score >= exam.passing_score)                   │
└─────────────────────────────────────────────────────────────┘
```

---

This comprehensive flow diagram shows how all parts of the application work together!