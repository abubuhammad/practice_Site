Exam Practice Site — Specification
Table of Contents

Purpose & Overview

Tech Stack & Environment

Features & User Flows

Data Model / Entities

API Endpoints

Frontend Views & UI Flow

Business Rules & Constraints

Security & Validation

Next Steps & Implementation Outline

1. Purpose & Overview

The goal is to build an exam practice platform where:

Users can register / login (either via email+password or Google OAuth).

After login, a user can select from a catalog of exams (e.g. AZ-900, AZ-104, etc., under paths such as AZ, DP, SC).

The user starts a timed practice exam with questions and options, mimicking a formal testing interface.

Upon submission (or timeout), results are calculated and displayed: score, which questions failed, correct answers, and explanations.

Users can review past attempts, see detailed feedback, and track performance over time.

You wish to build this using React on frontend, a backend (e.g. Node/Express or your choice), and MySQL (via XAMPP locally) for data persistence.

2. Tech Stack & Environment

Frontend: React.js (with ideally a state manager like Redux / Context API, React Router, etc.)

Backend: Node.js + Express (or equivalent) providing a RESTful API

Database: MySQL (using XAMPP on your local dev machine)

Authentication:

Email & password (with password hashing, e.g. bcrypt)

Google OAuth (e.g. using OAuth2 / Google APIs)

Issue JSON Web Tokens (JWT) or session tokens for authenticated API calls

Development Environment:

VS Code as IDE

Local setup: XAMPP → MySQL server running, Node server, React app

CORS / proxied API (e.g. React dev server forwarding to backend)

3. Features & User Flows
Registration & Login

Register via Email / Password

User provides email + password (and confirm password)

System checks email uniqueness, stores password hashed

Register / Login via Google OAuth

Redirect / popup Google login, receive Google ID / token

Link or create user account with Google credentials

Login

Email + password → validate credentials → generate JWT / session

Or via Google → fetch or create user, issue token

Forgot Password / Reset (optional but recommended)

Exam Selection & Launch

After login, user goes to Exam Catalog, filtered by path (AZ, DP, SC, etc.)

User clicks on an exam (e.g. AZ-900)

Show instructions / rules page: time limit, navigation rules (“cannot go back”, “skip allowed”, etc.)

User clicks “Start exam” → backend creates an Attempt record → frontend navigates to exam interface

Exam Taking

Show questions one by one (or paged), with multiple choice “options”

Show countdown timer

Navigation controls (Next / Back / Skip) depending on your rules

Prevent cheating (e.g. disallow page refresh, warn on leaving tab, etc. — optional)

Submission & Grading

On user submission or when time expires, submit answers to backend

Backend compares submitted answers vs correct ones, computes:

Total score (e.g. percentage correct)

For each question: whether correct, which was correct option, explanation

Save the attempt results in the database.

Result & Review

After grading, show result page:

Score, pass/fail indicator

List of questions user got wrong, with:

Their selected answer

The correct answer

Explanation or reasoning

Optionally allow “Review Mode”: walk through every question with answer & explanation

History / Dashboard

Users see past attempts (date, exam, score)

Click an attempt to view detailed feedback

4. Data Model / Entities

Here’s a suggested relational model:

Entity	Key Fields / Attributes
User	id (PK), email (unique), password_hash, google_id (nullable), created_at, updated_at
Exam	id (PK), code (e.g. “AZ-900”), title, description, path (e.g. “AZ”, “DP”, “SC”), time_limit_minutes, created_at, updated_at
Question	id (PK), exam_id (FK → Exam), text, explanation, created_at, updated_at
Option	id (PK), question_id (FK → Question), text, is_correct (boolean)
Attempt	id (PK), user_id (FK → User), exam_id (FK → Exam), start_time, end_time, score, completed (boolean)
Answer	id (PK), attempt_id (FK → Attempt), question_id (FK → Question), selected_option_id (FK → Option), is_correct (boolean)
Relationships & Notes

One Exam has many Questions

One Question has many Options

One User may have many Attempts

One Attempt may have many Answers

Each Answer references one Question and one Option (selected)

The is_correct field in Answer saves whether the user chose correctly (for easy querying)

explanation in Question helps with feedback.

5. API Endpoints

Below is a skeleton of REST endpoints your backend should expose.

Authentication / User
Method	Endpoint	Purpose	Request Body	Response / Output
POST	/api/register	Register via email/password or Google	{ email, password } or { google_token }	{ success, token, user }
POST	/api/login	Login with email/password	{ email, password }	{ token, user }
POST	/api/oauth/google	Login / Register via Google OAuth	{ google_token }	{ token, user }
POST	/api/password-reset	Request password reset (optional)	{ email }	{ success }
POST	/api/password-reset/confirm	Submit new password with token	{ token, new_password }	{ success }
Exams & Questions
Method	Endpoint	Purpose	Request / Params	Response
GET	/api/exams	List all exams (or filter by path)	optional query ?path=AZ	{ exams: [ ... ] }
GET	/api/exams/:examId/questions	Get questions for an exam	:examId	{ questions: [ { id, text, options: [ { id, text } ] } ], time_limit }
Attempts & Results
Method	Endpoint	Purpose	Request	Response
POST	/api/attempts	Submit a new exam attempt (user answers)	{ exam_id, answers: [ { question_id, selected_option_id } ] }	{ attempt: { … }, detailed_results: [ { question_id, selected_option_id, correct_option_id, is_correct, explanation } ] }
GET	/api/attempts/:attemptId	Fetch details of a past attempt	:attemptId	{ attempt, answers: [ { question_id, selected_option_id, correct_option_id, is_correct, explanation } ] }
GET	/api/users/:userId/attempts	List user's attempts (for dashboard)	:userId	{ attempts: [ { attemptId, examId, score, date } ] }

Note: All “protected” endpoints should require the user’s token (e.g. in Authorization header) and validate it.

6. Frontend Views & UI Flow

Here’s a breakdown of the screens / pages you’d build in React, and how they interconnect.

View / Page	Description / Components
Register / Login Page	Form(s) to register or login (toggle), Google login button
Exam Catalog / Dashboard	Show list of exams (maybe grouped by path), show user’s past attempts summary
Exam Instruction / Launch	Show exam details, rules, “Start Exam” button
Exam Interface	Question + options UI, timer, navigation (Next / Prev / Skip), progress bar
Submit / Timeout Handler	On submit or timeout, disable further input and send answers
Result / Feedback Page	Show overall score, list of incorrect questions, correct answers + explanations
Review Mode	Step through all questions with answer, correct answer, explanation
Profile / History	List past attempts, clickable to view details

You will use React Router (or similar) for route management, and manage state (e.g. current exam state, timer, user) in a global store or context.

7. Business Rules & Constraints

Time Limit Enforced: The exam must be automatically submitted when time expires.

Navigation Rules: Decide whether users can go back to previous questions or skip. (E.g. disallow going back.)

Single Attempt / Retakes: Optionally restrict number of attempts per user per exam.

Passing Threshold: e.g. 70% (configurable).

Visibility of Answers: After submission, show only correct answers + explanations, not in-exam.

User Progress Privacy: Users see only their own attempts and results.

Data Integrity: Prevent tampering (e.g. can't manipulate frontend to reveal correct answers early).

8. Security & Validation

Hash passwords (e.g. bcrypt) — never store plain text.

Protect endpoints: verify JWT / session token on every API call that needs auth.

Validate request payloads (e.g. exam_id exists, question IDs valid, option IDs valid, answers only to questions belonging to the exam).

Rate limiting / brute force protections (especially on login / register).

Prevent front-end cheating: e.g., hide correct options in the question API, don’t include explanations until after grading.

Use HTTPS / SSL in production.

9. Next Steps & Implementation Outline

Here’s a rough roadmap you could follow:

Set up project skeleton

Create React app front end, Node/Express backend, connect backend to local MySQL database.

Design and initialize database

Write SQL DDL scripts to create tables (User, Exam, Question, Option, Attempt, Answer).

Seed exam, question, option data for AZ-900, etc.

Implement authentication

Email/password registration & login (JWT).

(Later) Google OAuth integration.

Implement API endpoints

Exams listing, questions retrieval, attempt submission & result, history.

Build frontend pages & flows

Register / Login pages → exam catalog → exam interface → result & review pages → history.

Timer / exam UX features

Countdown timer, auto-submit on timeout.

Navigation constraints (disable back, warn on tab change, etc.)

Result display & feedback

Show score, incorrect questions, explanations.

User dashboard / history

List of past attempts and ability to view details.

Polishing / validation / error handling / UI styling

Validate user input, error messages, loading states.

UI/UX improvements, mobile responsiveness.

Testing & local deployment

Test all flows, edge cases.

Prepare for possible production deployment (migrate from XAMPP to real server).