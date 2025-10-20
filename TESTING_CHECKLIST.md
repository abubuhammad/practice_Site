# Testing Checklist

## ✅ Pre-Testing Setup

- [ ] MySQL server is running
- [ ] Backend dependencies installed (`npm install` in backend/)
- [ ] Frontend dependencies installed (`npm install` in frontend/)
- [ ] `.env` file created in backend/ with correct credentials
- [ ] Database initialized (`node backend/scripts/initDatabase.js`)
- [ ] Database seeded (`node backend/scripts/seedDatabase.js`)
- [ ] Backend server running on port 5000
- [ ] Frontend server running on port 3000

---

## 🔐 Authentication Tests

### Registration
- [ ] Navigate to http://localhost:3000/register
- [ ] Try registering with invalid email → Should show error
- [ ] Try registering with password < 6 chars → Should show error
- [ ] Try registering with mismatched passwords → Should show error
- [ ] Register with valid credentials → Should redirect to dashboard
- [ ] Try registering with existing email → Should show error

### Login
- [ ] Navigate to http://localhost:3000/login
- [ ] Try logging in with wrong credentials → Should show error
- [ ] Login with demo user (user@example.com / user123) → Should succeed
- [ ] Verify token is stored in localStorage
- [ ] Refresh page → Should stay logged in
- [ ] Logout → Should redirect to login page
- [ ] Try accessing protected route while logged out → Should redirect to login

---

## 🏠 Dashboard Tests

- [ ] After login, dashboard loads successfully
- [ ] Welcome message shows user email
- [ ] Statistics cards display (even if zeros)
- [ ] "Recent Attempts" section shows (empty or with data)
- [ ] "Available Exams" section shows 3 exams
- [ ] Exam cards show: title, code, duration, questions, passing score
- [ ] "Start Exam" button is clickable
- [ ] Navbar shows: Dashboard, Exams, History, user email, Logout

---

## 📚 Exam Catalog Tests

- [ ] Navigate to /exams
- [ ] All 3 exams are displayed
- [ ] Filter by "All Certifications" → Shows all 3 exams
- [ ] Filter by "Azure" → Shows AZ-900 and AZ-104
- [ ] Filter by "Data & AI" → Shows DP-900
- [ ] Click "View Details" → Navigates to exam detail page
- [ ] Exam cards show correct information

---

## 📄 Exam Detail Tests

- [ ] Navigate to /exams/1 (AZ-900)
- [ ] Exam title and code displayed correctly
- [ ] Description shows
- [ ] Duration, questions count, passing score displayed
- [ ] "Start Exam" button is visible
- [ ] Click "Start Exam" → Creates attempt and navigates to exam interface
- [ ] Back button works

---

## 📝 Exam Interface Tests

### Initial Load
- [ ] Exam interface loads with first question
- [ ] Timer starts counting down
- [ ] Question counter shows "Question 1 of X"
- [ ] Question text displays correctly
- [ ] Options are displayed (radio buttons for single choice)
- [ ] Navigation buttons visible: Previous (disabled), Next, Review Screen, Submit

### Navigation
- [ ] Click "Next" → Moves to question 2
- [ ] Click "Previous" → Moves back to question 1
- [ ] "Previous" button disabled on first question
- [ ] "Next" button disabled on last question
- [ ] Question counter updates correctly

### Answering Questions
- [ ] Select an option → Auto-saves (check network tab)
- [ ] Selected option stays selected after navigation
- [ ] Change answer → New answer is saved
- [ ] Multiple choice questions show checkboxes
- [ ] Can select multiple options for multiple choice

### Mark for Review
- [ ] Click "Mark for Review" → Button turns yellow
- [ ] Click again → Unmarks
- [ ] Marked status persists after navigation

### Case Study Questions
- [ ] Navigate to case study question
- [ ] Case study scenario displays above question
- [ ] Multiple questions share same case study
- [ ] Can answer case study questions normally

### Review Screen
- [ ] Click "Review Screen" → Shows question grid
- [ ] Answered questions show blue
- [ ] Unanswered questions show gray
- [ ] Marked questions show yellow border
- [ ] Click on question number → Jumps to that question
- [ ] "Back to Exam" button returns to current question

### Timer Tests
- [ ] Timer counts down correctly
- [ ] Timer turns yellow when < 10 minutes
- [ ] Timer turns red when < 5 minutes
- [ ] (Optional) Let timer reach 0 → Auto-submits exam

### Submit Exam
- [ ] Click "Submit Exam" → Shows confirmation dialog
- [ ] Confirm submission → Navigates to results page
- [ ] Cancel submission → Stays on exam

---

## 🏆 Results Page Tests

### Score Display
- [ ] Results page loads successfully
- [ ] Exam title and code displayed
- [ ] Pass/fail status badge shows correctly
- [ ] Large score number displayed (e.g., 700)
- [ ] Score text shows "You scored X out of 1000"

### Statistics Cards
- [ ] "Correct Answers" count is accurate
- [ ] "Incorrect Answers" count is accurate
- [ ] "Percentage" calculated correctly
- [ ] "Passing Score" shows correct value

### Action Buttons
- [ ] "Browse Exams" button navigates to /exams
- [ ] "Retake Exam" button navigates to exam detail page
- [ ] "View History" button navigates to /history
- [ ] "Back to Dashboard" button navigates to /

### Question Review
- [ ] All questions listed with numbers
- [ ] Each question shows correct/incorrect badge
- [ ] Question text displayed
- [ ] User's answer shown
- [ ] For incorrect answers, correct answer shown in green box
- [ ] Explanations displayed (if available)
- [ ] Multiple choice questions show all selected options

---

## 📊 History Page Tests

### Initial Load
- [ ] History page loads successfully
- [ ] Page title "Exam History" displayed
- [ ] Filter buttons show: All, Passed, Failed
- [ ] Attempt counts shown in filter buttons

### Filtering
- [ ] "All Attempts" shows all attempts
- [ ] "Passed" shows only passed attempts
- [ ] "Failed" shows only failed attempts
- [ ] Filter counts are accurate

### Attempt List
- [ ] Each attempt shows:
  - [ ] Exam title and code
  - [ ] Date and time
  - [ ] Pass/fail badge
  - [ ] Score (X / 1000)
  - [ ] Percentage
  - [ ] Duration (formatted correctly)
  - [ ] Passing score
- [ ] "View Details" button navigates to results page
- [ ] "Retake Exam" button navigates to exam detail page

### Overall Statistics
- [ ] "Total Attempts" count is correct
- [ ] "Passed" count is correct
- [ ] "Failed" count is correct
- [ ] "Pass Rate" percentage calculated correctly
- [ ] "Average Score" calculated correctly
- [ ] "Best Score" shows highest score

### Empty State
- [ ] New user with no attempts sees empty state message
- [ ] "Browse Exams" button shown in empty state
- [ ] Filtered view with no results shows appropriate message

---

## 🎨 UI/UX Tests

### Responsive Design
- [ ] Resize browser to mobile width → Layout adapts
- [ ] Navbar collapses appropriately
- [ ] Cards stack vertically on mobile
- [ ] Buttons remain accessible
- [ ] Text remains readable

### Visual Consistency
- [ ] Microsoft blue (#0078d4) used consistently
- [ ] Buttons have hover effects
- [ ] Cards have consistent shadows
- [ ] Spacing is uniform
- [ ] Typography is consistent

### Loading States
- [ ] Loading spinner shows while fetching data
- [ ] Buttons show "Loading..." text when processing
- [ ] Disabled state visible on buttons

### Error Handling
- [ ] Error messages display in red alert boxes
- [ ] Network errors show user-friendly messages
- [ ] 404 routes redirect to dashboard

---

## 🔒 Security Tests

### Protected Routes
- [ ] Logout → Try accessing /exams → Redirects to login
- [ ] Try accessing /exams/:id without login → Redirects to login
- [ ] Try accessing /results/:id without login → Redirects to login
- [ ] Try accessing another user's attempt → Should fail

### Token Handling
- [ ] Token included in API requests (check network tab)
- [ ] Invalid token → Redirects to login
- [ ] Expired token → Redirects to login
- [ ] Token persists after page refresh

---

## 🚀 Performance Tests

### Load Times
- [ ] Dashboard loads in < 2 seconds
- [ ] Exam catalog loads in < 2 seconds
- [ ] Exam interface loads in < 2 seconds
- [ ] Results page loads in < 2 seconds

### API Response Times
- [ ] Login responds in < 1 second
- [ ] Start exam responds in < 1 second
- [ ] Save answer responds in < 500ms
- [ ] Submit exam responds in < 2 seconds

---

## 🐛 Edge Cases

### Exam Interface
- [ ] Try submitting without answering all questions → Should allow
- [ ] Try navigating away during exam → Answers are saved
- [ ] Refresh page during exam → Should resume (or show error)
- [ ] Try accessing exam with invalid attemptId → Shows error

### Results Page
- [ ] Try accessing results with invalid attemptId → Shows error
- [ ] Try accessing another user's results → Should fail

### History Page
- [ ] User with 0 attempts → Shows empty state
- [ ] User with 1 attempt → Shows correctly
- [ ] User with many attempts → All displayed

---

## 📱 Browser Compatibility

- [ ] Chrome → All features work
- [ ] Firefox → All features work
- [ ] Edge → All features work
- [ ] Safari → All features work (if available)

---

## ✅ Final Checks

- [ ] No console errors in browser
- [ ] No console errors in backend terminal
- [ ] All images/icons load correctly
- [ ] All links work correctly
- [ ] All buttons are functional
- [ ] All forms validate properly
- [ ] All API endpoints respond correctly
- [ ] Database has correct data
- [ ] Logout works from all pages

---

## 🎯 Test Scenarios

### Scenario 1: New User Journey
1. Register new account
2. View dashboard
3. Browse exams
4. Start AZ-900 exam
5. Answer all questions
6. Submit exam
7. View results
8. Check history
9. Retake exam

### Scenario 2: Returning User
1. Login with existing account
2. View history
3. View previous results
4. Start new exam
5. Mark questions for review
6. Use review screen
7. Submit exam
8. Compare scores

### Scenario 3: Admin User
1. Login as admin
2. Access admin endpoints via API (Postman/curl)
3. Create new exam
4. Add questions
5. Bulk import questions
6. View all users
7. Update user roles

---

## 📝 Notes

- Take screenshots of any bugs found
- Note browser version and OS for any issues
- Check network tab for failed API calls
- Check console for JavaScript errors
- Verify database state after operations

---

## 🎉 Testing Complete!

Once all items are checked, your application is ready for production deployment!

**Date Tested:** _______________
**Tested By:** _______________
**Issues Found:** _______________
**Status:** ⬜ Pass | ⬜ Fail | ⬜ Needs Review